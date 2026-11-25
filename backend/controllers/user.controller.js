import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js";
import { getToday } from "../config/time.js";

export const loginUser = async (req, res) => {

    try {

        // slug is sent from a company's own login page (/acme/login).
        const { email, password, slug } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            })
        }

        // Case-insensitive email match (old: LOWER(email) = LOWER($1)).
        const user = await prisma.users.findFirst({
            where: { email: { equals: email.trim(), mode: "insensitive" } },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                is_active: true,
                organization: { select: { id: true, name: true, slug: true } },
                user_roles: {
                    select: {
                        roles: {
                            select: {
                                id: true,
                                name: true,
                                role_permissions: {
                                    select: {
                                        permissions: { select: { permission_key: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // A company's login page only signs in that company's users; anyone
        // else gets the same answer as an unknown email.
        if (!user || (slug !== undefined && user.organization.slug !== slug)) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }


        if (!user.is_active) {
            return res.status(403).json({
                message: "Invalid email or password"
            })
        }

        // find password

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid Id or Password"
            })
        }

        // Role = the user's role with the lowest roles.id (old: ORDER BY r.id LIMIT 1).
        const roles = user.user_roles
            .map((userRole) => userRole.roles)
            .sort((a, b) => a.id - b.id);

        const role = roles[0]?.name ?? null;

        // Unique, sorted permission keys from all the user's roles
        // (old: json_agg(DISTINCT p.permission_key)).
        const permissions = [
            ...new Set(
                roles.flatMap((r) =>
                    r.role_permissions.map((rp) => rp.permissions.permission_key)
                )
            ),
        ].sort();

        // generate JWT

        const token = jwt.sign(
            {
                userId: user.id,
                role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }

        )


        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role,
                permissions,
                organization: user.organization,
            },
        });

    } catch (error) {
        console.error("Prisma login error:", error);

        return res.status(500).json({
            message: "Login failed due to a server error",
        });

    }

}

// "Today" in the company's timezone, as a UTC-midnight Date.
const getDbToday = (db) => getToday(db);

export const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, role = "employee" } = req.body;
        const validRoles = ["admin", "hr", "manager", "employee"];
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof phone !== "string" ||
            !/^[+0-9() .-]{7,30}$/.test(phone.trim()) ||
            typeof password !== "string" ||
            password.length < 8 ||
            !validRoles.includes(role)
        ) {
            return res.status(400).json({
                message: "Name, valid email and phone number, password of at least 8 characters, and a valid role are required",
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.trim();

        // Hash before the transaction so the transaction stays short.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Everything below runs in one transaction: if any step fails,
        // no user, employee or role row is left behind.
        // Emails are unique across every company (one email, one login),
        // so this check deliberately uses the unscoped client.
        const result = await req.db.$transaction(async (tx) => {
            const existingUser = await prisma.users.findFirst({
                where: { email: { equals: normalizedEmail, mode: "insensitive" } },
                select: { id: true },
            });

            if (existingUser) {
                return { status: 409, body: { message: "User already exists" } };
            }

            const user = await tx.users.create({
                data: {
                    name: normalizedName,
                    email: normalizedEmail,
                    password: hashedPassword,
                },
                select: { id: true, name: true, email: true },
            });

            const employeeNumber = `EMP-${String(user.id).padStart(4, "0")}`;

            await tx.employees.create({
                data: {
                    user_id: user.id,
                    employee_number: employeeNumber,
                    phone: normalizedPhone,
                    joining_date: await getDbToday(tx),
                },
            });

            const roleRecord = await tx.roles.findUnique({
                where: { name: role },
                select: { id: true },
            });

            if (!roleRecord) {
                throw new Error(`Role "${role}" does not exist in the roles table`);
            }

            await tx.user_roles.create({
                data: { user_id: user.id, role_id: roleRecord.id },
            });

            return {
                status: 201,
                body: {
                    message: "User registered successfully",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role,
                    },
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Email or employee number is already in use",
            });
        }

        console.error("Prisma registerUser error:", error);

        return res.status(500).json({
            message: "Failed to register user",
        });
    }
};



export const getProfile = async (req, res) => {
    try {

        const user = await req.db.users.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                user_roles: { select: { roles: { select: { name: true } } } },
                employees: {
                    select: {
                        id: true,
                        employee_number: true,
                        phone: true,
                        joining_date: true,
                        employment_status: true,
                        departments: { select: { name: true } },
                        designations: { select: { title: true } },
                        reporting_lines: {
                            where: { effective_to: null },
                            take: 1,
                            select: {
                                manager: {
                                    select: { users: { select: { name: true, email: true } } },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"

            })

        }

        const employee = user.employees;
        const managerUser = employee?.reporting_lines[0]?.manager?.users ?? null;

        // Alphabetically first role (old: ORDER BY r.name LIMIT 1).
        const role =
            user.user_roles.map((userRole) => userRole.roles.name).sort()[0] ?? null;

        // Same flat shape as the old LEFT JOIN query.
        res.status(200).json({
            message: "User found",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_active: user.is_active,
                role,
                employee_id: employee?.id ?? null,
                employee_number: employee?.employee_number ?? null,
                phone: employee?.phone ?? null,
                joining_date: employee?.joining_date ?? null,
                employment_status: employee?.employment_status ?? null,
                department_name: employee?.departments?.name ?? null,
                designation_title: employee?.designations?.title ?? null,
                reporting_manager_name: managerUser?.name ?? null,
                reporting_manager_email: managerUser?.email ?? null,
            },
        })

    } catch (error) {

        console.error("Prisma getProfile error:", error);

        return res.status(500).json({
            message: "Failed to retrieve user profile"
        });

    }
}

export const updateProfile = async (req, res) => {
    try {

        const { name, email } = req.body
        const userId = req.user.userId;


        if (
            (name !== undefined &&
                (typeof name !== "string" || !name.trim())) ||
            (email !== undefined &&
                (typeof email !== "string" || !email.trim()))
        ) {
            return res.status(400).json({
                message: "Name and email must be non-empty strings",
            });
        }


        if (name === undefined && email === undefined) {
            return res.status(400).json({
                message: "Provide a name or email to update",
            });
        }

        // Only the fields that were sent (old: COALESCE($1, name)).
        const data = { updated_at: new Date() };
        if (name !== undefined) data.name = name.trim();
        if (email !== undefined) data.email = email.trim();

        const user = await req.db.users.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, email: true },
        });

        res.status(200).json({
            message: "user profile updated",
            user: {
                id: user.id,
                name: user.name,
                email: user.email

            }
        })


    } catch (error) {

        if (error.code === "P2025") {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Email is already in use",
            });
        }

        console.error("Prisma updateProfile error:", error);


        res.status(500).json({
            message: "Failed to update user profile",
        })


    }
}


export const getAllUsers = async (req, res) => {
    try {
        const records = await req.db.users.findMany({
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true,
                created_at: true,
                user_roles: { select: { roles: { select: { name: true } } } },
                employees: {
                    select: {
                        id: true,
                        employee_number: true,
                        phone: true,
                        department_id: true,
                        designation_id: true,
                        joining_date: true,
                        employment_status: true,
                        departments: { select: { name: true } },
                        designations: { select: { title: true } },
                    },
                },
            },
        });

        // Same flat shape as the old GROUP BY query.
        const users = records.map((user) => {
            const employee = user.employees;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                is_active: user.is_active,
                created_at: user.created_at,
                // Unique, sorted role names (old: ARRAY_AGG(DISTINCT r.name)).
                roles: [
                    ...new Set(user.user_roles.map((userRole) => userRole.roles.name)),
                ].sort(),
                employee_id: employee?.id ?? null,
                employee_number: employee?.employee_number ?? null,
                phone: employee?.phone ?? null,
                department_id: employee?.department_id ?? null,
                department_name: employee?.departments?.name ?? null,
                designation_id: employee?.designation_id ?? null,
                designation_title: employee?.designations?.title ?? null,
                joining_date: employee?.joining_date ?? null,
                employment_status: employee?.employment_status ?? null,
            };
        });

        return res.status(200).json({
            count: users.length,
            users,
        });


    } catch (error) {
        console.error("Prisma getAllUsers error:", error);

        return res.status(500).json({
            message: "Failed to retrieve users",
        });
    }
}




export const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID",
            });
        }

        if (userId === req.user.userId) {
            return res.status(400).json({
                message: "You cannot deactivate your own account",
            });
        }

        const result = await req.db.$transaction(async (tx) => {
            // Lock the user row for the rest of the transaction (old: FOR UPDATE).
            await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} AND organization_id = ${req.user.organizationId} FOR UPDATE`;

            const user = await tx.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    is_active: true,
                    user_roles: { select: { roles: { select: { name: true } } } },
                },
            });

            if (!user) {
                return { status: 404, body: { message: "User not found" } };
            }

            const isAdmin = user.user_roles.some(
                (userRole) => userRole.roles.name === "admin"
            );

            if (isAdmin) {
                return {
                    status: 403,
                    body: {
                        message: "Admin accounts cannot be deactivated through this endpoint",
                    },
                };
            }

            if (!user.is_active) {
                return { status: 409, body: { message: "User is already inactive" } };
            }

            // Actually deactivate the account.
            await tx.users.update({
                where: { id: userId },
                data: { is_active: false, updated_at: new Date() },
            });

            return {
                status: 200,
                body: {
                    message: "User deactivated successfully",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        is_active: false,
                    },
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error("Prisma deleteUser error:", error);

        return res.status(500).json({
            message: "Failed to deactivate user",
        });
    }
};




export const updateEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const {
            department_id,
            designation_id,
            employment_status,
            role,
        } = req.body;

        if (!/^[1-9]\d*$/.test(employeeId)) {
            return res.status(400).json({
                message: "Invalid employee ID",
            });
        }

        if (
            department_id === undefined &&
            designation_id === undefined &&
            employment_status === undefined &&
            role === undefined
        ) {
            return res.status(400).json({
                message: "Provide at least one field to update",
            });
        }

        if (role !== undefined && req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only administrators can change user roles",
            });
        }

        const validRoles = ["admin", "hr", "manager", "employee"];
        if (role !== undefined && !validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
            });
        }

        for (const value of [department_id, designation_id]) {
            if (
                value !== undefined &&
                value !== null &&
                (!Number.isSafeInteger(value) || value <= 0)
            ) {
                return res.status(400).json({
                    message: "Department and designation IDs must be positive integers or null",
                });
            }
        }

        const validStatuses = [
            "active",
            "on_leave",
            "probation",
            "resigned",
            "terminated"
        ];

        if (
            employment_status !== undefined &&
            !validStatuses.includes(employment_status)
        ) {
            return res.status(400).json({
                message: "Invalid employment status",
            });
        }

        const id = Number(employeeId);

        const result = await req.db.$transaction(async (tx) => {
            // Lock the employee row (old: SELECT ... FOR UPDATE).
            const [employee] = await tx.$queryRaw`
                SELECT id, user_id
                FROM employees
                WHERE id = ${id}
                  AND organization_id = ${req.user.organizationId}
                FOR UPDATE`;

            if (!employee) {
                return { status: 404, body: { message: "Employee not found" } };
            }

            if (role !== undefined) {
                if (!employee.user_id) {
                    return {
                        status: 409,
                        body: { message: "This employee record is not linked to a user account" },
                    };
                }

                const account = await tx.users.findUnique({
                    where: { id: employee.user_id },
                    select: { is_active: true },
                });

                if (!account?.is_active) {
                    return {
                        status: 409,
                        body: { message: "Cannot change the role of a deactivated account" },
                    };
                }


                const currentRoles = await tx.user_roles.findMany({
                    where: { user_id: employee.user_id },
                    select: { roles: { select: { name: true } } },
                });
                const isCurrentlyAdmin = currentRoles.some(
                    (currentRole) => currentRole.roles.name === "admin"
                );

                if (
                    Number(employee.user_id) === req.user.userId &&
                    role !== "admin"
                ) {
                    return {
                        status: 409,
                        body: { message: "You cannot remove your own administrator role" },
                    };
                }

                if (isCurrentlyAdmin && role !== "admin") {
                    const adminCount = await tx.users.count({
                        where: {
                            is_active: true,
                            user_roles: { some: { roles: { name: "admin" } } },
                        },
                    });

                    if (adminCount <= 1) {
                        return {
                            status: 409,
                            body: { message: "Cannot remove the last active administrator" },
                        };
                    }
                }

                const roleRecord = await tx.roles.findUnique({
                    where: { name: role },
                    select: { id: true },
                });

                if (!roleRecord) {
                    throw new Error(`Role "${role}" does not exist in the roles table`);
                }

                await tx.user_roles.deleteMany({
                    where: { user_id: employee.user_id },
                });
                await tx.user_roles.create({
                    data: { user_id: employee.user_id, role_id: roleRecord.id },
                });
            }

            let updatedEmployee = employee;
            if (
                department_id !== undefined ||
                designation_id !== undefined ||
                employment_status !== undefined
            ) {
                // Only the fields that were sent; null clears department/designation.
                const data = { updated_at: new Date() };
                if (department_id !== undefined) data.department_id = department_id;
                if (designation_id !== undefined) data.designation_id = designation_id;
                if (employment_status !== undefined) data.employment_status = employment_status;

                updatedEmployee = await tx.employees.update({
                    where: { id },
                    data,
                    select: {
                        id: true,
                        user_id: true,
                        employee_number: true,
                        department_id: true,
                        designation_id: true,
                        employment_status: true,
                        joining_date: true,
                    },
                });
            }

            return {
                status: 200,
                body: {
                    message: "Employee updated successfully",
                    employee: updatedEmployee,
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        // Foreign key failed -> department or designation ID doesn't exist.
        if (error.code === "P2003") {
            return res.status(400).json({
                message: "Department or designation does not exist",
            });
        }

        console.error("Prisma updateEmployee error:", error);

        return res.status(500).json({
            message: "Failed to update employee",
        });
    }
};