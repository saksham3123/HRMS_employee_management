import prisma from "../config/prisma.js";

// Prisma error codes
// P2002 -> unique constraint failed (duplicate title)
// P2025 -> record to update/delete not found

const isValidId = (id) => /^[1-9]\d*$/.test(id);

// Converts Prisma's `_count` into the same `employee_count` field
// the frontend already receives from the old SQL query.
const withEmployeeCount = ({ _count, ...designation }) => ({
  ...designation,
  employee_count: _count.employees,
});

// get designations
export const getDesignations = async (req, res) => {
  try {
    const designations = await prisma.designations.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { employees: true } } },
    });

    const result = designations.map(withEmployeeCount);

    return res.status(200).json({
      count: result.length,
      designations: result,
    });
  } catch (error) {
    console.error("Get designations error:", error);
    return res.status(500).json({
      message: "Failed to retrieve designations",
    });
  }
};

// get designation by id
export const getDesignationById = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  try {
    const designation = await prisma.designations.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { employees: true } } },
    });

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    return res.status(200).json({ designation: withEmployeeCount(designation) });
  } catch (error) {
    console.error("Get designation error:", error);
    return res.status(500).json({
      message: "Failed to retrieve designation",
    });
  }
};

// create designation
export const createDesignation = async (req, res) => {
  const { title, description } = req.body;

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Designation title is required" });
  }

  if (description != null && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }

  try {
    const designation = await prisma.designations.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(201).json({
      message: "Designation created successfully",
      designation,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A designation with this title already exists",
      });
    }

    console.error("Create designation error:", error);
    return res.status(500).json({ message: "Failed to create designation" });
  }
};

// update designation
export const updateDesignation = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Designation title is required" });
  }

  if (description != null && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }

  try {
    const designation = await prisma.designations.update({
      where: { id: Number(id) },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(200).json({
      message: "Designation updated successfully",
      designation,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Designation not found" });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "A designation with this title already exists",
      });
    }

    console.error("Update designation error:", error);
    return res.status(500).json({ message: "Failed to update designation" });
  }
};

// delete designation
export const deleteDesignation = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  try {
    const designation = await prisma.designations.findUnique({
      where: { id: Number(id) },
      select: { id: true, title: true },
    });

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    // Deletes only when no employee holds this designation, in a single query.
    const { count } = await prisma.designations.deleteMany({
      where: {
        id: Number(id),
        employees: { none: {} },
      },
    });

    if (count === 0) {
      return res.status(409).json({
        message: "Cannot delete a designation assigned to employees",
      });
    }

    return res.status(200).json({
      message: "Designation deleted successfully",
      designation,
    });
  } catch (error) {
    console.error("Delete designation error:", error);
    return res.status(500).json({ message: "Failed to delete designation" });
  }
};