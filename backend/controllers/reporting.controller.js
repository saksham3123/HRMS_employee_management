import prisma from "../config/prisma.js";
import { createsReportingCycle } from "../helpers/reporting.helper.js";

// All IDs in this file are employees.id (NOT users.id), except
// getManagerTeam, which finds the manager from the logged-in user.

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// "Today" according to PostgreSQL (CURRENT_DATE), as a UTC-midnight Date.
const getDbToday = async (db) => {
  const [{ today }] = await db.$queryRaw`SELECT CURRENT_DATE::text AS today`;
  return new Date(`${today}T00:00:00.000Z`);
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Locks both employee rows for the rest of the transaction (same as the old
// SELECT ... FOR UPDATE), so two admins can't create a cycle at the same time.
// Returns how many of the two employees exist.
const lockEmployees = async (tx, employeeId, managerId) => {
  const rows = await tx.$queryRaw`
    SELECT id
    FROM employees
    WHERE id IN (${employeeId}, ${managerId})
    FOR UPDATE`;

  return rows.length;
};

// 1. Assign a manager when no active assignment exists.
export const assignReportingManager = async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const managerId = Number(req.body.manager_employee_id);

  if (!isValidId(employeeId) || !isValidId(managerId)) {
    return res.status(400).json({
      message: "Valid employee and manager IDs are required.",
    });
  }

  if (employeeId === managerId) {
    return res.status(400).json({
      message: "An employee cannot be their own reporting manager.",
    });
  }

  try {
    // The transaction returns { status, body }; any early return simply ends
    // it (nothing was written), and a thrown error rolls it back.
    const { status, body } = await prisma.$transaction(async (tx) => {
      if ((await lockEmployees(tx, employeeId, managerId)) !== 2) {
        return {
          status: 404,
          body: { message: "Employee or reporting manager not found." },
        };
      }

      const existing = await tx.employee_reporting.findFirst({
        where: { employee_id: employeeId, effective_to: null },
        select: { id: true },
      });

      if (existing) {
        return {
          status: 409,
          body: {
            message: "Employee already has a manager. Use the update endpoint.",
          },
        };
      }

      if (await createsReportingCycle(tx, employeeId, managerId)) {
        return {
          status: 400,
          body: { message: "This assignment would create a reporting cycle." },
        };
      }

      // effective_from is filled by the database default (CURRENT_DATE).
      const reporting = await tx.employee_reporting.create({
        data: {
          employee_id: employeeId,
          manager_employee_id: managerId,
        },
      });

      return {
        status: 201,
        body: {
          message: "Reporting manager assigned successfully.",
          reporting,
        },
      };
    });

    return res.status(status).json(body);
  } catch (error) {
    console.error("Assign reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to assign reporting manager.",
    });
  }
};

// 2. Update an employee's manager.
export const updateReportingManager = async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const managerId = Number(req.body.manager_employee_id);

  if (!isValidId(employeeId) || !isValidId(managerId)) {
    return res.status(400).json({
      message: "Valid employee and manager IDs are required.",
    });
  }

  if (employeeId === managerId) {
    return res.status(400).json({
      message: "An employee cannot be their own reporting manager.",
    });
  }

  try {
    const { status, body } = await prisma.$transaction(async (tx) => {
      if ((await lockEmployees(tx, employeeId, managerId)) !== 2) {
        return {
          status: 404,
          body: { message: "Employee or reporting manager not found." },
        };
      }

      // Lock the current assignment row (old: SELECT ... FOR UPDATE).
      const [current] = await tx.$queryRaw`
        SELECT id, manager_employee_id, effective_from::text AS effective_from
        FROM employee_reporting
        WHERE employee_id = ${employeeId}
          AND effective_to IS NULL
        FOR UPDATE`;

      if (!current) {
        return {
          status: 404,
          body: { message: "No current manager found. Use the assign endpoint." },
        };
      }

      if (Number(current.manager_employee_id) === managerId) {
        return {
          status: 400,
          body: { message: "Employee already has this reporting manager." },
        };
      }

      if (await createsReportingCycle(tx, employeeId, managerId)) {
        return {
          status: 400,
          body: { message: "This assignment would create a reporting cycle." },
        };
      }

      const today = await getDbToday(tx);
      const todayText = today.toISOString().slice(0, 10);

      if (current.effective_from === todayText) {
        // Reuse today's record because (employee_id, effective_from) is unique.
        const reporting = await tx.employee_reporting.update({
          where: { id: current.id },
          data: { manager_employee_id: managerId },
        });

        return {
          status: 200,
          body: { message: "Reporting manager updated successfully.", reporting },
        };
      }

      // Close the old assignment yesterday, start the new one today.
      await tx.employee_reporting.update({
        where: { id: current.id },
        data: { effective_to: new Date(today.getTime() - ONE_DAY_MS) },
      });

      const reporting = await tx.employee_reporting.create({
        data: {
          employee_id: employeeId,
          manager_employee_id: managerId,
          effective_from: today,
        },
      });

      return {
        status: 200,
        body: { message: "Reporting manager updated successfully.", reporting },
      };
    });

    return res.status(status).json(body);
  } catch (error) {
    console.error("Update reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to update reporting manager.",
    });
  }
};

// 3. View an employee's manager.
// The route requires both employee-record and user-list permissions for this lookup.
// Also used by GET /api/users/me/manager (employeeId comes from req.employee.id).
export const getReportingManager = async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!isValidId(employeeId)) {
    return res.status(400).json({
      message: "Invalid employee ID.",
    });
  }

  try {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employee_number: true,
        reporting_lines: {
          where: { effective_to: null },
          take: 1,
          select: {
            manager: {
              select: {
                id: true,
                employee_number: true,
                users: { select: { name: true, email: true } },
                departments: { select: { name: true } },
                designations: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    const manager = employee.reporting_lines[0]?.manager ?? null;

    // Same flat shape as the old LEFT JOIN query (nulls when no manager).
    return res.status(200).json({
      reporting: {
        employee_id: employee.id,
        employee_number: employee.employee_number,
        manager_employee_id: manager?.id ?? null,
        manager_employee_number: manager?.employee_number ?? null,
        manager_name: manager?.users?.name ?? null,
        manager_email: manager?.users?.email ?? null,
        manager_department: manager?.departments?.name ?? null,
        manager_designation: manager?.designations?.title ?? null,
      },
    });
  } catch (error) {
    console.error("Get reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to fetch reporting manager.",
    });
  }
};

// 4. End a manager assignment and preserve its history.
export const removeReportingManager = async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!isValidId(employeeId)) {
    return res.status(400).json({
      message: "Invalid employee ID.",
    });
  }

  try {
    const today = await getDbToday(prisma);

    const [reporting] = await prisma.employee_reporting.updateManyAndReturn({
      where: {
        employee_id: employeeId,
        effective_to: null,
        effective_from: { lte: today },
      },
      data: { effective_to: today },
    });

    if (!reporting) {
      return res.status(404).json({
        message: "No current manager assignment found.",
      });
    }

    return res.status(200).json({
      message: "Reporting manager assignment ended successfully.",
      reporting,
    });
  } catch (error) {
    console.error("Remove reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to remove reporting manager.",
    });
  }
};

// 5. Get the authenticated manager's direct reports.
export const getManagerTeam = async (req, res) => {
  if (req.user?.role !== "manager") {
    return res.status(403).json({
      message: "Only managers can view a team.",
    });
  }

  try {
    const assignments = await prisma.employee_reporting.findMany({
      where: {
        effective_to: null,
        manager: { user_id: req.user.userId },
      },
      select: {
        employee: {
          select: {
            id: true,
            employee_number: true,
            phone: true,
            joining_date: true,
            employment_status: true,
            users: { select: { id: true, name: true, email: true } },
            departments: { select: { name: true } },
            designations: { select: { title: true } },
          },
        },
      },
      orderBy: { employee: { users: { name: "asc" } } },
    });

    const team = assignments.map(({ employee }) => ({
      employee_id: employee.id,
      employee_number: employee.employee_number,
      phone: employee.phone,
      joining_date: employee.joining_date,
      employment_status: employee.employment_status,
      user_id: employee.users?.id ?? null,
      name: employee.users?.name ?? null,
      email: employee.users?.email ?? null,
      department_name: employee.departments?.name ?? null,
      designation_title: employee.designations?.title ?? null,
    }));

    return res.status(200).json({
      count: team.length,
      team,
    });
  } catch (error) {
    console.error("Get manager team error:", error);

    return res.status(500).json({
      message: "Failed to fetch your team.",
    });
  }
};