import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { getTodayText } from "../config/time.js";
import { isAssignablePlan } from "./plan.controller.js";

// Platform (super admin) APIs.
// These use the base `prisma` client because they work across companies.
// They only ever return company-level info and COUNTS, never employee data.

const STATUSES = ["active", "suspended"];
const DEFAULT_LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Personal Leave"];

// lowercase letters, numbers and single hyphens: "acme", "acme-labs"
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

// Shape returned for a company in lists and details.
const organizationSelect = {
    id: true,
    name: true,
    slug: true,
    plan: true,
    status: true,
    created_at: true,
    _count: { select: { users: true, employees: true } },
};

const formatOrganization = ({ _count, ...organization }) => ({
    ...organization,
    user_count: _count.users,
    employee_count: _count.employees,
});

// POST /api/platform/login
// Login for PeopleDesk platform (super) admins. Not for company users.
export const platformLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // platform_admins is not a company table, so the base prisma client is used.
        const admin = await prisma.platform_admins.findUnique({
            where: { email: email.trim().toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                is_active: true,
            },
        });

        // Same message for "no such admin", "inactive" and "wrong password",
        // so the response never reveals which emails exist.
        const invalid = () =>
            res.status(401).json({
                message: "Invalid email or password",
            });

        if (!admin || !admin.is_active) {
            return invalid();
        }

        const isPasswordCorrect = await bcrypt.compare(password, admin.password);

        if (!isPasswordCorrect) {
            return invalid();
        }

        // scope: "platform" marks this as a platform token. Company routes reject it
        // (no userId), and platform routes reject company tokens (no scope).
        const token = jwt.sign(
            { platformAdminId: admin.id, scope: "platform" },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "8h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error("Platform login error:", error);

        return res.status(500).json({
            message: "Platform login failed",
        });
    }
};

// GET /api/platform/overview
// Headline numbers for the super admin dashboard.
export const getPlatformOverview = async (req, res) => {
    try {
        const [byStatus, totalUsers, totalEmployees] = await Promise.all([
            prisma.organizations.groupBy({
                by: ["status"],
                _count: { _all: true },
            }),
            prisma.users.count(),
            prisma.employees.count(),
        ]);

        const countFor = (status) =>
            byStatus.find((row) => row.status === status)?._count._all ?? 0;

        const activeOrganizations = countFor("active");
        const suspendedOrganizations = countFor("suspended");

        return res.status(200).json({
            organizations: {
                total: activeOrganizations + suspendedOrganizations,
                active: activeOrganizations,
                suspended: suspendedOrganizations,
            },
            totalUsers,
            totalEmployees,
        });
    } catch (error) {
        console.error("Platform overview error:", error);

        return res.status(500).json({
            message: "Failed to load platform overview",
        });
    }
};

// GET /api/platform/organizations
export const listOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.organizations.findMany({
            select: organizationSelect,
            orderBy: { created_at: "desc" },
        });

        return res.status(200).json({
            count: organizations.length,
            organizations: organizations.map(formatOrganization),
        });
    } catch (error) {
        console.error("List organizations error:", error);

        return res.status(500).json({
            message: "Failed to load organizations",
        });
    }
};

// GET /api/platform/organizations/:id
export const getOrganization = async (req, res) => {
    const id = toId(req.params.id);

    if (!id) {
        return res.status(400).json({ message: "Invalid organization ID" });
    }

    try {
        const organization = await prisma.organizations.findUnique({
            where: { id },
            select: {
                ...organizationSelect,
                updated_at: true,
                _count: {
                    select: {
                        users: true,
                        employees: true,
                        departments: true,
                        designations: true,
                    },
                },
            },
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Active vs deactivated accounts (still only a count).
        const activeUsers = await prisma.users.count({
            where: { organization_id: id, is_active: true },
        });

        const { _count, ...rest } = organization;

        return res.status(200).json({
            organization: {
                ...rest,
                user_count: _count.users,
                active_user_count: activeUsers,
                employee_count: _count.employees,
                department_count: _count.departments,
                designation_count: _count.designations,
            },
        });
    } catch (error) {
        console.error("Get organization error:", error);

        return res.status(500).json({
            message: "Failed to load organization",
        });
    }
};

// POST /api/platform/organizations
// Creates a company together with its first Admin, all-or-nothing.
// Body: { name, slug, plan?, admin: { name, email, password } }
export const createOrganization = async (req, res) => {
    const { name, slug, plan = "free", admin } = req.body ?? {};

    if (!isNonEmptyString(name) || !isNonEmptyString(slug)) {
        return res.status(400).json({ message: "Company name and slug are required" });
    }

    const normalizedSlug = slug.trim().toLowerCase();

    if (normalizedSlug.length < 3 || normalizedSlug.length > 60 || !SLUG_PATTERN.test(normalizedSlug)) {
        return res.status(400).json({
            message: "Slug must be 3-60 characters: lowercase letters, numbers and hyphens",
        });
    }

    if (!(await isAssignablePlan(plan))) {
        return res.status(400).json({ message: "Choose a plan that is currently offered" });
    }

    if (
        !isNonEmptyString(admin?.name) ||
        !isNonEmptyString(admin?.email) ||
        typeof admin?.password !== "string" ||
        admin.password.length < 8
    ) {
        return res.status(400).json({
            message: "Admin name, email and a password of at least 8 characters are required",
        });
    }

    const adminEmail = admin.email.trim().toLowerCase();

    try {
        // Hash outside the transaction to keep the transaction short.
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const [slugTaken, emailTaken] = await Promise.all([
                tx.organizations.findUnique({ where: { slug: normalizedSlug }, select: { id: true } }),
                tx.users.findFirst({
                    where: { email: { equals: adminEmail, mode: "insensitive" } },
                    select: { id: true },
                }),
            ]);

            if (slugTaken) {
                return { status: 409, body: { message: "This slug is already in use" } };
            }

            if (emailTaken) {
                return { status: 409, body: { message: "This email is already registered" } };
            }

            const adminRole = await tx.roles.findUnique({
                where: { name: "admin" },
                select: { id: true },
            });

            if (!adminRole) {
                throw new Error('Role "admin" does not exist in the roles table');
            }

            // 1. The company
            const organization = await tx.organizations.create({
                data: { name: name.trim(), slug: normalizedSlug, plan },
            });

            // 2. Its first Admin user
            const user = await tx.users.create({
                data: {
                    name: admin.name.trim(),
                    email: adminEmail,
                    password: hashedPassword,
                    organization_id: organization.id,
                },
                select: { id: true, name: true, email: true },
            });

            // 3. The Admin's employee record (joining date = today in PostgreSQL)
            const today = await getTodayText(tx);

            await tx.employees.create({
                data: {
                    user_id: user.id,
                    employee_number: `EMP-${String(user.id).padStart(4, "0")}`,
                    joining_date: new Date(`${today}T00:00:00.000Z`),
                    organization_id: organization.id,
                },
            });

            // 4. Admin role
            await tx.user_roles.create({
                data: { user_id: user.id, role_id: adminRole.id },
            });

            // 5. Default leave types for the new company
            await tx.leave_types.createMany({
                data: DEFAULT_LEAVE_TYPES.map((leaveName) => ({
                    name: leaveName,
                    organization_id: organization.id,
                })),
            });

            return {
                status: 201,
                body: {
                    message: "Organization created successfully",
                    organization: {
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug,
                        plan: organization.plan,
                        status: organization.status,
                        created_at: organization.created_at,
                    },
                    admin: user,
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        // Unique index hit by a request that raced this one.
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Slug or email is already in use" });
        }

        console.error("Create organization error:", error);

        return res.status(500).json({
            message: "Failed to create organization",
        });
    }
};

// PATCH /api/platform/organizations/:id/status
// Body: { status: "active" | "suspended" }
export const updateOrganizationStatus = async (req, res) => {
    const id = toId(req.params.id);
    const { status } = req.body ?? {};

    if (!id) {
        return res.status(400).json({ message: "Invalid organization ID" });
    }

    if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    try {
        const organization = await prisma.organizations.update({
            where: { id },
            data: { status, updated_at: new Date() },
            select: organizationSelect,
        });

        return res.status(200).json({
            message: status === "suspended" ? "Organization suspended" : "Organization reactivated",
            organization: formatOrganization(organization),
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Organization not found" });
        }

        console.error("Update organization status error:", error);

        return res.status(500).json({
            message: "Failed to update organization status",
        });
    }
};

// PATCH /api/platform/organizations/:id/plan
// Body: { plan: <code of an active plan> }
export const updateOrganizationPlan = async (req, res) => {
    const id = toId(req.params.id);
    const { plan } = req.body ?? {};

    if (!id) {
        return res.status(400).json({ message: "Invalid organization ID" });
    }

    if (!(await isAssignablePlan(plan))) {
        return res.status(400).json({ message: "Choose a plan that is currently offered" });
    }

    try {
        const organization = await prisma.organizations.update({
            where: { id },
            data: { plan, updated_at: new Date() },
            select: organizationSelect,
        });

        return res.status(200).json({
            message: "Plan updated",
            organization: formatOrganization(organization),
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "Organization not found" });
        }

        console.error("Update organization plan error:", error);

        return res.status(500).json({
            message: "Failed to update plan",
        });
    }
};