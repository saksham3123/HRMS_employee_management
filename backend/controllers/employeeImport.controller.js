import crypto from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { getToday } from "../config/time.js";
import { getSeatUsage } from "../helpers/organization.helper.js";
import { sendWelcomeEmails } from "../helpers/notify.helper.js";
import { isMailEnabled } from "../config/mailer.js";

// POST /api/admin/users/import
//
// Bulk-creates employees from rows the admin mapped in the Excel import form.
// The browser reads the .xlsx and sends JSON; this endpoint never sees the file.
//
//   { "rows": [ { "name": "Asha Rao", "email": "asha@x.com", "phone": "...",
//                 "role": "employee", "department": "Engineering",
//                 "designation": "Developer", "joining_date": "2026-11-01",
//                 "employment_status": "active", "employee_number": "" } ] }
//
// Valid rows are created, invalid ones are reported back with their row number;
// one bad row never blocks the others. Each new person gets a random temporary
// password that is returned once in the response (for the results file) and
// stored only as a bcrypt hash. Unknown departments and designations are
// created automatically.

const MAX_ROWS = 10000;
// Admin accounts are never created in bulk: add those one at a time.
const IMPORT_ROLES = ["employee", "manager", "hr"];
const EMPLOYMENT_STATUSES = ["active", "on_leave", "probation", "resigned", "terminated"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9() .-]{7,30}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HASH_BATCH = 8;

const text = (value) => (value === null || value === undefined ? "" : String(value).trim());

// "On Leave" / "on-leave" / "ON_LEAVE" -> "on_leave"
const toKey = (value) => text(value).toLowerCase().replace(/[\s-]+/g, "_");

// Excel-friendly: 12 characters, no look-alike characters (0/O, 1/l/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const makeTempPassword = () => {
    const bytes = crypto.randomBytes(12);
    return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
};

const isRealDate = (value) => {
    if (!DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Checks one row on its own. Returns { data } or { errors }.
const validateRow = (raw) => {
    const errors = [];

    const name = text(raw.name);
    const email = text(raw.email).toLowerCase();
    const phone = text(raw.phone);
    const role = toKey(raw.role) || "employee";
    const department = text(raw.department);
    const designation = text(raw.designation);
    const joiningDate = text(raw.joining_date);
    const status = toKey(raw.employment_status) || "active";
    const employeeNumber = text(raw.employee_number);

    if (!name) errors.push("Name is required");
    else if (name.length > 150) errors.push("Name is longer than 150 characters");

    if (!email) errors.push("Email is required");
    else if (email.length > 255 || !EMAIL_PATTERN.test(email)) errors.push("Email is not valid");

    if (phone && !PHONE_PATTERN.test(phone)) errors.push("Phone number is not valid");

    if (!IMPORT_ROLES.includes(role)) {
        errors.push(`Role must be one of: ${IMPORT_ROLES.join(", ")}`);
    }

    if (department.length > 120) errors.push("Department is longer than 120 characters");
    if (designation.length > 120) errors.push("Designation is longer than 120 characters");

    if (joiningDate && !isRealDate(joiningDate)) {
        errors.push("Joining date must be a real date (YYYY-MM-DD)");
    }

    if (!EMPLOYMENT_STATUSES.includes(status)) {
        errors.push(`Employment status must be one of: ${EMPLOYMENT_STATUSES.join(", ")}`);
    }

    if (employeeNumber.length > 50) errors.push("Employee number is longer than 50 characters");

    if (errors.length) return { errors };

    return {
        data: {
            name,
            email,
            phone: phone || null,
            role,
            department: department || null,
            designation: designation || null,
            joiningDate: joiningDate || null,
            status,
            employeeNumber: employeeNumber || null,
        },
    };
};

// Finds the company's departments/designations by name (case-insensitive) and
// creates the missing ones. Returns { map: lowercased name -> id, created: [names] }.
const resolveLookup = async (db, model, field, names) => {
    const wanted = new Map();
    for (const name of names) {
        if (name && !wanted.has(name.toLowerCase())) wanted.set(name.toLowerCase(), name);
    }
    if (!wanted.size) return { map: new Map(), created: [] };

    const findExisting = () =>
        db[model].findMany({
            where: { OR: [...wanted.values()].map((name) => ({ [field]: { equals: name, mode: "insensitive" } })) },
            select: { id: true, [field]: true },
        });

    const existing = await findExisting();
    const existingKeys = new Set(existing.map((row) => row[field].toLowerCase()));
    const missing = [...wanted.entries()].filter(([key]) => !existingKeys.has(key)).map(([, name]) => name);

    if (missing.length) {
        // skipDuplicates: if someone creates the same name at the same moment.
        await db[model].createMany({
            data: missing.map((name) => ({ [field]: name })),
            skipDuplicates: true,
        });
    }

    const all = missing.length ? await findExisting() : existing;
    return {
        map: new Map(all.map((row) => [row[field].toLowerCase(), row.id])),
        created: missing,
    };
};

export const importUsers = async (req, res) => {
    try {
        const { rows } = req.body ?? {};

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ message: "No rows to import" });
        }
        if (rows.length > MAX_ROWS) {
            return res.status(400).json({
                message: `A single import can have at most ${MAX_ROWS} rows. Split the file and import it in parts.`,
            });
        }

        // Row numbers match the spreadsheet: header is row 1, so data starts at 2.
        const failed = [];
        const candidates = [];

        rows.forEach((raw, index) => {
            const rowNumber = index + 2;
            const { data, errors } = validateRow(raw && typeof raw === "object" ? raw : {});
            if (errors) {
                failed.push({ row: rowNumber, name: text(raw?.name), email: text(raw?.email), errors });
            } else {
                candidates.push({ row: rowNumber, ...data });
            }
        });

        // Duplicates inside the file: the first one wins.
        const seenEmails = new Set();
        const seenNumbers = new Set();
        const unique = [];
        for (const row of candidates) {
            const numberKey = row.employeeNumber?.toLowerCase();
            if (seenEmails.has(row.email)) {
                failed.push({ row: row.row, name: row.name, email: row.email, errors: ["Same email appears earlier in the file"] });
            } else if (numberKey && seenNumbers.has(numberKey)) {
                failed.push({ row: row.row, name: row.name, email: row.email, errors: ["Same employee number appears earlier in the file"] });
            } else {
                seenEmails.add(row.email);
                if (numberKey) seenNumbers.add(numberKey);
                unique.push(row);
            }
        }

        // Emails are unique across every company (one email, one login), so
        // this check deliberately uses the unscoped client.
        const takenEmails = new Set(
            (await prisma.users.findMany({
                where: { email: { in: unique.map((row) => row.email), mode: "insensitive" } },
                select: { email: true },
            })).map((user) => user.email.toLowerCase())
        );

        const givenNumbers = unique.filter((row) => row.employeeNumber).map((row) => row.employeeNumber);
        const takenNumbers = new Set(
            givenNumbers.length
                ? (await req.db.employees.findMany({
                    where: { employee_number: { in: givenNumbers, mode: "insensitive" } },
                    select: { employee_number: true },
                })).map((employee) => employee.employee_number.toLowerCase())
                : []
        );

        const ready = [];
        for (const row of unique) {
            if (takenEmails.has(row.email)) {
                failed.push({ row: row.row, name: row.name, email: row.email, errors: ["An account with this email already exists"] });
            } else if (row.employeeNumber && takenNumbers.has(row.employeeNumber.toLowerCase())) {
                failed.push({ row: row.row, name: row.name, email: row.email, errors: ["This employee number is already in use"] });
            } else {
                ready.push(row);
            }
        }

        // Plan limit: rows past the remaining seats are reported, not created.
        const seats = await getSeatUsage(req.user.organizationId);
        const allowed = Number.isFinite(seats.remaining) ? seats.remaining : ready.length;
        for (const row of ready.splice(allowed)) {
            failed.push({
                row: row.row,
                name: row.name,
                email: row.email,
                errors: [`Plan limit reached: your ${seats.plan ?? "current"} plan allows ${seats.limit} active employees`],
            });
        }

        let createdDepartments = [];
        let createdDesignations = [];
        const created = [];

        if (ready.length) {
            const departments = await resolveLookup(req.db, "departments", "name", ready.map((row) => row.department));
            const designations = await resolveLookup(req.db, "designations", "title", ready.map((row) => row.designation));
            createdDepartments = departments.created;
            createdDesignations = designations.created;

            const roleIds = new Map(
                (await prisma.roles.findMany({
                    where: { name: { in: IMPORT_ROLES } },
                    select: { id: true, name: true },
                })).map((role) => [role.name, role.id])
            );

            const today = await getToday(req.db);

            // Hash a few passwords at a time (bcrypt runs on the libuv pool).
            for (let start = 0; start < ready.length; start += HASH_BATCH) {
                const batch = ready.slice(start, start + HASH_BATCH);
                await Promise.all(batch.map(async (row) => {
                    row.tempPassword = makeTempPassword();
                    row.passwordHash = await bcrypt.hash(row.tempPassword, 10);
                }));
            }

            // One short transaction per person, so a clash on one row
            // (e.g. the same email added a second ago) only fails that row.
            for (const row of ready) {
                try {
                    const result = await req.db.$transaction(async (tx) => {
                        const user = await tx.users.create({
                            data: { name: row.name, email: row.email, password: row.passwordHash },
                            select: { id: true },
                        });

                        const employeeNumber = row.employeeNumber ?? `EMP-${String(user.id).padStart(4, "0")}`;

                        await tx.employees.create({
                            data: {
                                user_id: user.id,
                                employee_number: employeeNumber,
                                phone: row.phone,
                                department_id: row.department ? departments.map.get(row.department.toLowerCase()) : null,
                                designation_id: row.designation ? designations.map.get(row.designation.toLowerCase()) : null,
                                joining_date: row.joiningDate ? new Date(`${row.joiningDate}T00:00:00.000Z`) : today,
                                employment_status: row.status,
                            },
                        });

                        await tx.user_roles.create({
                            data: { user_id: user.id, role_id: roleIds.get(row.role) },
                        });

                        return { userId: user.id, employeeNumber };
                    });

                    created.push({
                        row: row.row,
                        user_id: result.userId,
                        employee_number: result.employeeNumber,
                        name: row.name,
                        email: row.email,
                        role: row.role,
                        department: row.department,
                        designation: row.designation,
                        temp_password: row.tempPassword,
                    });
                } catch (error) {
                    const message = error.code === "P2002"
                        ? "Email or employee number is already in use"
                        : "Could not be saved";
                    if (error.code !== "P2002") console.error(`Import row ${row.row} error:`, error);
                    failed.push({ row: row.row, name: row.name, email: row.email, errors: [message] });
                }
            }
        }

        failed.sort((a, b) => a.row - b.row);

        // Welcome emails go out in the background, one by one, after the
        // response; the import doesn't wait for them.
        sendWelcomeEmails(
            req.user.organizationId,
            created.map((person) => ({ name: person.name, email: person.email, password: person.temp_password }))
        );

        return res.status(created.length ? 201 : 200).json({
            message: `${created.length} of ${rows.length} employees imported`,
            summary: {
                total: rows.length,
                created: created.length,
                failed: failed.length,
            },
            created,
            failed,
            created_departments: createdDepartments,
            created_designations: createdDesignations,
            // true = welcome emails with the login details are on their way
            welcome_emails: created.length > 0 && isMailEnabled(),
        });
    } catch (error) {
        console.error("Import users error:", error);
        return res.status(500).json({ message: "Import failed due to a server error" });
    }
};