import pool from "../config/postgres.js";

// Resolve the employee profile associated with the authenticated user.
const getEmployeeByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id, user_id
         FROM employees
         WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] ?? null;
};

// 1. Clock in
export const clockIn = async (req, res) => {
  try {
    const employee = await getEmployeeByUserId(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found. Please contact HR.",
      });
    }

    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, login_time)
             VALUES ($1, CURRENT_DATE, CURRENT_TIMESTAMP)
             ON CONFLICT (employee_id, date) DO NOTHING
             RETURNING id, employee_id, date, login_time`,
      [employee.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Attendance already marked for today",
      });
    }

    return res.status(201).json({
      message: "Attendance marked successfully",
    });
  } catch (error) {
    console.error("PostgreSQL clockIn error:", error);

    return res.status(500).json({
      message: "Failed to mark attendance",
    });
  }
};

// 2. Clock out
export const clockOut = async (req, res) => {
  try {
    const employee = await getEmployeeByUserId(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found. Please contact HR.",
      });
    }

    const result = await pool.query(
      `UPDATE attendance
       SET
           logout_time = CURRENT_TIMESTAMP,

           working_hours = ROUND(
               (
                   EXTRACT(
                       EPOCH FROM (CURRENT_TIMESTAMP - login_time)
                   ) / 3600
               )::NUMERIC,
               2
           ),

           daily_pay = ROUND(
               (
                   EXTRACT(
                       EPOCH FROM (CURRENT_TIMESTAMP - login_time)
                   ) / 3600
               )::NUMERIC * hourly_rate,
               2
           ),

           updated_at = CURRENT_TIMESTAMP

       WHERE employee_id = $1
         AND date = CURRENT_DATE
         AND logout_time IS NULL

       RETURNING *`,
      [employee.id]
    );

    if (result.rows.length === 0) {
      const today = await pool.query(
        `SELECT id, logout_time
         FROM attendance
         WHERE employee_id = $1
           AND date = CURRENT_DATE`,
        [employee.id]
      );

      if (today.rows.length === 0) {
        return res.status(400).json({
          message: "Please mark attendance first",
        });
      }

      return res.status(400).json({
        message: "You have already clocked out today",
      });
    }

    return res.status(200).json({
      message: "Clock out successful",
      attendance: result.rows[0],
    });

  } catch (error) {
    console.error("PostgreSQL clockOut error:", error);

    return res.status(500).json({
      message: "Failed to clock out",
    });
  }
};



// 3. Get today's attendance for the logged-in employee
export const getTodayAttendance = async (req, res) => {
  try {
    const employee = await getEmployeeByUserId(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found. Please contact HR.",
      });
    }

    const result = await pool.query(
      `SELECT *
             FROM attendance
             WHERE employee_id = $1
               AND date = CURRENT_DATE
             LIMIT 1`,
      [employee.id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No attendance marked today",
      });
    }

    return res.status(200).json({
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error("PostgreSQL getTodayAttendance error:", error);

    return res.status(500).json({
      message: "Failed to retrieve today's attendance",
    });
  }
};

// 4. Get attendance history for the logged-in employee
export const getAttendanceHistory = async (req, res) => {
  try {
    const employee = await getEmployeeByUserId(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found. Please contact HR.",
      });
    }

    const result = await pool.query(
      `SELECT *
             FROM attendance
             WHERE employee_id = $1
             ORDER BY date DESC`,
      [employee.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      attendance: result.rows,
    });
  } catch (error) {
    console.error("PostgreSQL getAttendanceHistory error:", error);

    return res.status(500).json({
      message: "Failed to retrieve attendance history",
    });
  }
};

// 5. Get a user's monthly attendance report
export const getUserMonthlyReport = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Please provide a valid month and year",
      });
    }

    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email, e.id AS employee_id
             FROM users u
             LEFT JOIN employees e ON e.user_id = u.id
             WHERE u.id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.employee_id) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    const attendanceResult = await pool.query(
      `SELECT *
             FROM attendance
             WHERE employee_id = $1
               AND date >= make_date($2, $3, 1)
               AND date < (make_date($2, $3, 1) + INTERVAL '1 month')
             ORDER BY date ASC`,
      [user.employee_id, year, month]
    );

    const attendance = attendanceResult.rows;

    const totalsResult = await pool.query(
      `SELECT
                 COUNT(*)::INTEGER AS total_working_days,
                 COALESCE(SUM(working_hours), 0) AS total_working_hours,
                 COALESCE(SUM(daily_pay), 0) AS total_pay
             FROM attendance
             WHERE employee_id = $1
               AND date >= make_date($2, $3, 1)
               AND date < (make_date($2, $3, 1) + INTERVAL '1 month')`,
      [user.employee_id, year, month]
    );

    const totals = totalsResult.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      report: {
        month,
        year,
        totalWorkingDays: totals.total_working_days,
        totalWorkingHours: Number(totals.total_working_hours),
        totalPay: Number(totals.total_pay),
      },
      attendance,
    });
  } catch (error) {
    console.error("PostgreSQL getUserMonthlyReport error:", error);

    return res.status(500).json({
      message: "Failed to generate monthly attendance report",
    });
  }
};

// 6. Get today's attendance for all employees
export const getAllTodayAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
                 a.*,
                 u.id AS user_id,
                 u.name,
                 u.email
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             JOIN users u ON u.id = e.user_id
             WHERE a.date = CURRENT_DATE
             ORDER BY a.login_time DESC`
    );

    return res.status(200).json({
      count: result.rows.length,
      attendance: result.rows,
    });
  } catch (error) {
    console.error("PostgreSQL getAllTodayAttendance error:", error);

    return res.status(500).json({
      message: "Failed to retrieve today's attendance",
    });
  }
};

// 7. Get monthly payroll summary
export const getMonthlyPayrollSummary = async (req, res) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    const result = await pool.query(
      `SELECT
                 COALESCE(SUM(daily_pay), 0) AS total_payroll,
                 COALESCE(SUM(working_hours), 0) AS total_working_hours,
                 COUNT(*)::INTEGER AS attendance_count
             FROM attendance
             WHERE date >= make_date($1, $2, 1)
               AND date < (make_date($1, $2, 1) + INTERVAL '1 month')`,
      [year, month]
    );

    const summary = result.rows[0];

    return res.status(200).json({
      month,
      year,
      totalPayroll: Number(summary.total_payroll),
      totalWorkingHours: Number(summary.total_working_hours),
      attendanceCount: summary.attendance_count,
    });
  } catch (error) {
    console.error("PostgreSQL getMonthlyPayrollSummary error:", error);

    return res.status(500).json({
      message: "Failed to retrieve monthly payroll summary",
    });
  }
};

// 8. Get monthly payroll breakdown by employee
export const getMonthlyPayrollByEmployee = async (req, res) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    const result = await pool.query(
      `SELECT
                 u.id AS user_id,
                 u.name,
                 u.email,
                 e.id AS employee_id,
                 COALESCE(SUM(a.working_hours), 0) AS total_working_hours,
                 COALESCE(SUM(a.daily_pay), 0) AS total_earnings,
                 COUNT(a.id)::INTEGER AS attendance_days
             FROM employees e
             JOIN users u ON u.id = e.user_id
             LEFT JOIN attendance a
                 ON a.employee_id = e.id
                AND a.date >= make_date($1, $2, 1)
                AND a.date < (make_date($1, $2, 1) + INTERVAL '1 month')
             GROUP BY u.id, u.name, u.email, e.id
             ORDER BY u.name ASC`,
      [year, month]
    );

    const payroll = result.rows.map((employee) => ({
      userId: employee.user_id,
      name: employee.name,
      email: employee.email,
      totalWorkingHours: Number(employee.total_working_hours),
      totalEarnings: Number(employee.total_earnings),
      attendanceDays: employee.attendance_days,
    }));

    return res.status(200).json({
      month,
      year,
      employeeCount: payroll.length,
      payroll,
      totalPayroll: payroll.reduce(
        (sum, employee) => sum + employee.totalEarnings,
        0
      ),
      totalWorkingHours: payroll.reduce(
        (sum, employee) => sum + employee.totalWorkingHours,
        0
      ),
    });
  } catch (error) {
    console.error("PostgreSQL getMonthlyPayrollByEmployee error:", error);

    return res.status(500).json({
      message: "Failed to generate monthly payroll",
    });
  }
};