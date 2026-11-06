import prisma from "../config/prisma.js";

// ---------- helpers ----------

// Resolve the employee profile associated with the authenticated user.
const getEmployeeByUserId = (userId) =>
  prisma.employees.findUnique({
    where: { user_id: userId },
    select: { id: true, user_id: true },
  });

// "Today" according to PostgreSQL (CURRENT_DATE), so the date logic stays
// exactly as before and doesn't depend on the Node server's timezone.
const getDbToday = async () => {
  const [{ today }] = await prisma.$queryRaw`SELECT CURRENT_DATE::text AS today`;
  return new Date(`${today}T00:00:00.000Z`);
};

// First day of the month and first day of the next month, for DATE range filters.
const getMonthRange = (year, month) => ({
  gte: new Date(Date.UTC(year, month - 1, 1)),
  lt: new Date(Date.UTC(year, month, 1)),
});

const isValidMonthYear = (month, year) =>
  Number.isInteger(month) &&
  month >= 1 &&
  month <= 12 &&
  Number.isInteger(year) &&
  year >= 2000 &&
  year <= 2100;

// Prisma returns NUMERIC columns as Decimal objects. pg returned them as
// strings like "8.00", so keep sending the same 2-decimal strings.
// (Number() also handles raw-query results, whatever type they come back as.)
const toMoneyString = (value) =>
  value == null ? null : Number(value).toFixed(2);

const serializeAttendance = (record) =>
  record && {
    ...record,
    working_hours: toMoneyString(record.working_hours),
    hourly_rate: toMoneyString(record.hourly_rate),
    daily_pay: toMoneyString(record.daily_pay),
  };

const toNumber = (decimal) => (decimal == null ? 0 : Number(decimal));

// ---------- controllers ----------

// 1. Clock in
export const clockIn = async (req, res) => {
  try {
    const employee = await getEmployeeByUserId(req.user.userId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found. Please contact HR.",
      });
    }

    // `date` is filled by the database default (CURRENT_DATE).
    await prisma.attendance.create({
      data: {
        employee_id: employee.id,
        login_time: new Date(),
      },
    });

    return res.status(201).json({
      message: "Attendance marked successfully",
    });
  } catch (error) {
    // Unique (employee_id, date) -> already clocked in today
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Attendance already marked for today",
      });
    }

    console.error("Prisma clockIn error:", error);

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

    // Kept as SQL: hours and pay are calculated from login_time inside
    // the database in a single atomic update, exactly as before.
    const [updated] = await prisma.$queryRaw`
      UPDATE attendance
      SET
          logout_time = CURRENT_TIMESTAMP,
          working_hours = ROUND(
              (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time)) / 3600)::NUMERIC,
              2
          ),
          daily_pay = ROUND(
              (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time)) / 3600)::NUMERIC * hourly_rate,
              2
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ${employee.id}
        AND date = CURRENT_DATE
        AND logout_time IS NULL
      RETURNING *`;

    if (!updated) {
      const today = await prisma.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: employee.id,
            date: await getDbToday(),
          },
        },
        select: { id: true, logout_time: true },
      });

      if (!today) {
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
      attendance: serializeAttendance(updated),
    });
  } catch (error) {
    console.error("Prisma clockOut error:", error);

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

    const attendance = await prisma.attendance.findUnique({
      where: {
        employee_id_date: {
          employee_id: employee.id,
          date: await getDbToday(),
        },
      },
    });

    if (!attendance) {
      return res.status(200).json({
        message: "No attendance marked today",
      });
    }

    return res.status(200).json({
      attendance: serializeAttendance(attendance),
    });
  } catch (error) {
    console.error("Prisma getTodayAttendance error:", error);

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

    const records = await prisma.attendance.findMany({
      where: { employee_id: employee.id },
      orderBy: { date: "desc" },
    });

    return res.status(200).json({
      count: records.length,
      attendance: records.map(serializeAttendance),
    });
  } catch (error) {
    console.error("Prisma getAttendanceHistory error:", error);

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

    if (!isValidMonthYear(month, year)) {
      return res.status(400).json({
        message: "Please provide a valid month and year",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        employees: { select: { id: true } },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.employees) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    const where = {
      employee_id: user.employees.id,
      date: getMonthRange(year, month),
    };

    const [attendance, totals] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: "asc" },
      }),
      prisma.attendance.aggregate({
        where,
        _count: { _all: true },
        _sum: { working_hours: true, daily_pay: true },
      }),
    ]);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      report: {
        month,
        year,
        totalWorkingDays: totals._count._all,
        totalWorkingHours: toNumber(totals._sum.working_hours),
        totalPay: toNumber(totals._sum.daily_pay),
      },
      attendance: attendance.map(serializeAttendance),
    });
  } catch (error) {
    console.error("Prisma getUserMonthlyReport error:", error);

    return res.status(500).json({
      message: "Failed to generate monthly attendance report",
    });
  }
};

// 6. Get today's attendance for all employees
export const getAllTodayAttendance = async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      where: {
        date: await getDbToday(),
        // Same as the old INNER JOIN users
        employees: { users: { isNot: null } },
      },
      include: {
        employees: {
          select: { users: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { login_time: "desc" },
    });

    const attendance = records.map(({ employees, ...record }) => ({
      ...serializeAttendance(record),
      user_id: employees.users.id,
      name: employees.users.name,
      email: employees.users.email,
    }));

    return res.status(200).json({
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Prisma getAllTodayAttendance error:", error);

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

    if (!isValidMonthYear(month, year)) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    const summary = await prisma.attendance.aggregate({
      where: { date: getMonthRange(year, month) },
      _count: { _all: true },
      _sum: { daily_pay: true, working_hours: true },
    });

    return res.status(200).json({
      month,
      year,
      totalPayroll: toNumber(summary._sum.daily_pay),
      totalWorkingHours: toNumber(summary._sum.working_hours),
      attendanceCount: summary._count._all,
    });
  } catch (error) {
    console.error("Prisma getMonthlyPayrollSummary error:", error);

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

    if (!isValidMonthYear(month, year)) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    // Every employee with a user account (employees with no attendance
    // this month still appear with zeros, like the old LEFT JOIN).
    const [employees, totalsByEmployee] = await Promise.all([
      prisma.employees.findMany({
        where: { users: { isNot: null } },
        select: {
          id: true,
          users: { select: { id: true, name: true, email: true } },
        },
        orderBy: { users: { name: "asc" } },
      }),
      prisma.attendance.groupBy({
        by: ["employee_id"],
        where: { date: getMonthRange(year, month) },
        _count: { _all: true },
        _sum: { working_hours: true, daily_pay: true },
      }),
    ]);

    const totalsMap = new Map(
      totalsByEmployee.map((row) => [row.employee_id, row])
    );

    const payroll = employees.map((employee) => {
      const totals = totalsMap.get(employee.id);

      return {
        userId: employee.users.id,
        name: employee.users.name,
        email: employee.users.email,
        totalWorkingHours: toNumber(totals?._sum.working_hours),
        totalEarnings: toNumber(totals?._sum.daily_pay),
        attendanceDays: totals?._count._all ?? 0,
      };
    });

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
    console.error("Prisma getMonthlyPayrollByEmployee error:", error);

    return res.status(500).json({
      message: "Failed to generate monthly payroll",
    });
  }
};
