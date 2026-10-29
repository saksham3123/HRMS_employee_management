
import pool from "../config/postgres.js";
import { createsReportingCycle } from "../helpers/reporting.helper.js";

const isValidId = (id) =>
  Number.isInteger(Number(id)) && Number(id) > 0;

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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const employees = await client.query(
      `SELECT id
       FROM employees
       WHERE id = ANY($1::INTEGER[])
       FOR UPDATE`,
      [[employeeId, managerId]]
    );

    if (employees.rows.length !== 2) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Employee or reporting manager not found.",
      });
    }

    const existing = await client.query(
      `SELECT id
       FROM employee_reporting
       WHERE employee_id = $1
         AND effective_to IS NULL`,
      [employeeId]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Employee already has a manager. Use the update endpoint.",
      });
    }

    if (await createsReportingCycle(client, employeeId, managerId)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "This assignment would create a reporting cycle.",
      });
    }

    const result = await client.query(
      `INSERT INTO employee_reporting
         (employee_id, manager_employee_id, effective_from)
       VALUES ($1, $2, CURRENT_DATE)
       RETURNING *`,
      [employeeId, managerId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Reporting manager assigned successfully.",
      reporting: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to assign reporting manager.",
    });
  } finally {
    client.release();
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const employees = await client.query(
      `SELECT id
       FROM employees
       WHERE id = ANY($1::INTEGER[])
       FOR UPDATE`,
      [[employeeId, managerId]]
    );

    if (employees.rows.length !== 2) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Employee or reporting manager not found.",
      });
    }

    const current = await client.query(
      `SELECT id, manager_employee_id, effective_from
       FROM employee_reporting
       WHERE employee_id = $1
         AND effective_to IS NULL
       FOR UPDATE`,
      [employeeId]
    );

    if (current.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "No current manager found. Use the assign endpoint.",
      });
    }

    if (Number(current.rows[0].manager_employee_id) === managerId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Employee already has this reporting manager.",
      });
    }

    if (await createsReportingCycle(client, employeeId, managerId)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "This assignment would create a reporting cycle.",
      });
    }

    const assignment = current.rows[0];
    const effectiveFrom = new Date(assignment.effective_from)
      .toISOString()
      .slice(0, 10);

    const todayResult = await client.query(
      "SELECT CURRENT_DATE::TEXT AS today"
    );
    const today = todayResult.rows[0].today;

    if (effectiveFrom === today) {
      // Reuse today's record because employee/date is unique.
      const result = await client.query(
        `UPDATE employee_reporting
         SET manager_employee_id = $2
         WHERE id = $1
         RETURNING *`,
        [assignment.id, managerId]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Reporting manager updated successfully.",
        reporting: result.rows[0],
      });
    }

    await client.query(
      `UPDATE employee_reporting
       SET effective_to = CURRENT_DATE - 1
       WHERE id = $1`,
      [assignment.id]
    );

    const result = await client.query(
      `INSERT INTO employee_reporting
         (employee_id, manager_employee_id, effective_from)
       VALUES ($1, $2, CURRENT_DATE)
       RETURNING *`,
      [employeeId, managerId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Reporting manager updated successfully.",
      reporting: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update reporting manager error:", error);

    return res.status(500).json({
      message: "Failed to update reporting manager.",
    });
  } finally {
    client.release();
  }
};

// 3. View an employee's manager.
// Admins can view any employee; other users can view their own manager.
export const getReportingManager = async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!isValidId(employeeId)) {
    return res.status(400).json({
      message: "Invalid employee ID.",
    });
  }

  try {
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      const ownEmployee = await pool.query(
        "SELECT id FROM employees WHERE user_id = $1",
        [req.user.userId]
      );

      if (
        ownEmployee.rows.length === 0 ||
        Number(ownEmployee.rows[0].id) !== employeeId
      ) {
        return res.status(403).json({
          message: "You can only view your own reporting manager.",
        });
      }
    }

    const result = await pool.query(
      `SELECT
         e.id AS employee_id,
         e.employee_number,
         manager.id AS manager_employee_id,
         manager.employee_number AS manager_employee_number,
         u.name AS manager_name,
         u.email AS manager_email,
         d.name AS manager_department,
         ds.title AS manager_designation
       FROM employees e
       LEFT JOIN employee_reporting er
         ON er.employee_id = e.id
        AND er.effective_to IS NULL
       LEFT JOIN employees manager
         ON manager.id = er.manager_employee_id
       LEFT JOIN users u ON u.id = manager.user_id
       LEFT JOIN departments d ON d.id = manager.department_id
       LEFT JOIN designations ds ON ds.id = manager.designation_id
       WHERE e.id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      reporting: result.rows[0],
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
    const result = await pool.query(
      `UPDATE employee_reporting
       SET effective_to = CURRENT_DATE
       WHERE employee_id = $1
         AND effective_to IS NULL
         AND effective_from <= CURRENT_DATE
       RETURNING *`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No current manager assignment found.",
      });
    }

    return res.status(200).json({
      message: "Reporting manager assignment ended successfully.",
      reporting: result.rows[0],
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
  try {
    const result = await pool.query(
      `SELECT
         e.id AS employee_id,
         e.employee_number,
         e.phone,
         e.joining_date,
         e.employment_status,
         u.id AS user_id,
         u.name,
         u.email,
         d.name AS department_name,
         ds.title AS designation_title
       FROM employees manager
       JOIN employee_reporting er
         ON er.manager_employee_id = manager.id
        AND er.effective_to IS NULL
       JOIN employees e ON e.id = er.employee_id
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN designations ds ON ds.id = e.designation_id
       WHERE manager.user_id = $1
       ORDER BY u.name ASC`,
      [req.user.userId]
    );

    return res.status(200).json({
      count: result.rows.length,
      team: result.rows,
    });
  } catch (error) {
    console.error("Get manager team error:", error);

    return res.status(500).json({
      message: "Failed to fetch your team.",
    });
  }
};
