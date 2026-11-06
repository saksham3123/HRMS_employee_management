import prisma from "../config/prisma.js";

// Prisma error codes
// P2002 -> unique constraint failed (duplicate name)
// P2025 -> record to update/delete not found

const isValidId = (id) => /^[1-9]\d*$/.test(id);

// Converts Prisma's `_count` into the same `employee_count` field
// the frontend already receives from the old SQL query.
const withEmployeeCount = ({ _count, ...department }) => ({
    ...department,
    employee_count: _count.employees,
});

const validateDescription = (description) =>
    description === undefined ||
    description === null ||
    typeof description === "string";

const normalizeDescription = (description) =>
    typeof description === "string" && description.trim()
        ? description.trim()
        : null;

// get all departments

export const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.departments.findMany({
            orderBy: { name: "asc" },
            include: { _count: { select: { employees: true } } },
        });

        const result = departments.map(withEmployeeCount);

        return res.status(200).json({
            count: result.length,
            departments: result,
        });
    } catch (error) {
        console.error("Get departments error:", error);

        return res.status(500).json({
            message: "Failed to retrieve departments",
        });
    }
};

// get department by id

export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }

        const department = await prisma.departments.findUnique({
            where: { id: Number(id) },
            include: { _count: { select: { employees: true } } },
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        return res.status(200).json({
            departments: withEmployeeCount(department),
        });
    } catch (error) {
        console.error("Get department error:", error);

        return res.status(500).json({
            message: "Failed to retrieve department",
        });
    }
};

// create department

export const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Department name is required",
            });
        }

        if (!validateDescription(description)) {
            return res.status(400).json({
                message: "Description must be a string",
            });
        }

        const department = await prisma.departments.create({
            data: {
                name: name.trim(),
                description: normalizeDescription(description),
            },
        });

        return res.status(201).json({
            message: "Department created successfully",
            department,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "A department with this name already exists",
            });
        }

        console.error("Create department error:", error);

        return res.status(500).json({
            message: "Failed to create department",
        });
    }
};

// update department

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Department name is required",
            });
        }

        if (!validateDescription(description)) {
            return res.status(400).json({
                message: "Description must be a string",
            });
        }

        const department = await prisma.departments.update({
            where: { id: Number(id) },
            data: {
                name: name.trim(),
                description: normalizeDescription(description),
            },
        });

        return res.status(200).json({
            message: "Department updated successfully",
            department,
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "A department with this name already exists",
            });
        }

        console.error("Update department error:", error);

        return res.status(500).json({
            message: "Failed to update department",
        });
    }
};

// delete a department

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }

        const department = await prisma.departments.findUnique({
            where: { id: Number(id) },
            select: { id: true, name: true },
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        // Deletes only when no employee is assigned, in a single query,
        // so an employee assigned in between can't be silently unlinked.
        const { count } = await prisma.departments.deleteMany({
            where: {
                id: Number(id),
                employees: { none: {} },
            },
        });

        if (count === 0) {
            return res.status(409).json({
                message:
                    "Cannot delete a department that has employees assigned to it",
            });
        }

        return res.status(200).json({
            message: "Department deleted successfully",
            department,
        });
    } catch (error) {
        console.error("Delete department error:", error);

        return res.status(500).json({
            message: "Failed to delete department",
        });
    }
};