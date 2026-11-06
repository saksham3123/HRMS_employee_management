import prisma from "../config/prisma.js";

// Accepts only real calendar dates in YYYY-MM-DD format
// (rejects values like 2026-02-31 instead of letting the database error out).
const toDateOnly = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return null;
    }

    return date;
};

// Shared shape for leave request lists, matching the old SQL column aliases.
const leaveRequestListSelect = {
    id: true,
    employee_id: true,
    start_date: true,
    end_date: true,
    reason: true,
    status: true,
    review_comment: true,
    reviewed_at: true,
    created_at: true,
    leave_types: { select: { name: true } },
    users: { select: { name: true } }, // reviewer (leave_requests.reviewed_by)
};

const flattenLeaveRequest = ({ leave_types, users, ...request }) => ({
    ...request,
    leave_type: leave_types.name,
    reviewed_by_name: users?.name ?? null,
});

export const getLeaveTypes = async (_req, res) => {
    try {
        const leaveTypes = await prisma.leave_types.findMany({
            where: { is_active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });

        return res.status(200).json({
            leaveTypes,
        });
    } catch (error) {
        console.error("Get leave types error:", error);

        return res.status(500).json({
            message: "Failed to retrieve leave types",
        });
    }
};

// submit a leave request

export const createLeaveRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { leaveTypeId, startDate, endDate, reason } = req.body;

        if (
            !Number.isInteger(leaveTypeId) ||
            typeof startDate !== "string" ||
            typeof endDate !== "string" ||
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "Leave type , dates and reason are required",
            });
        }

        // resolve the logged-in user to their employee record
        const employee = await prisma.employees.findUnique({
            where: { user_id: userId },
            select: { id: true },
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee record not found",
            });
        }

        const employeeId = employee.id;

        // Validate date format and range.
        const start = toDateOnly(startDate);
        const end = toDateOnly(endDate);

        if (!start || !end || start > end) {
            return res.status(400).json({
                message: "Please provide valid dates in YYYY-MM-DD format",
            });
        }

        // Confirm that the leave type exists and is active.
        const leaveType = await prisma.leave_types.findFirst({
            where: { id: leaveTypeId, is_active: true },
            select: { id: true },
        });

        if (!leaveType) {
            return res.status(400).json({
                message: "Invalid or inactive leave type",
            });
        }

        // Prevent overlapping pending or approved leave requests.
        const overlap = await prisma.leave_requests.findFirst({
            where: {
                employee_id: employeeId,
                status: { in: ["pending", "approved"] },
                start_date: { lte: end },
                end_date: { gte: start },
            },
            select: { id: true },
        });

        if (overlap) {
            return res.status(409).json({
                message: "You already have a pending or approved request for overlapping dates",
            });
        }

        const leaveRequest = await prisma.leave_requests.create({
            data: {
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
                start_date: start,
                end_date: end,
                reason: reason.trim(),
            },
        });

        return res.status(201).json({
            message: "Leave request submitted successfully",
            leaveRequest,
        });
    } catch (error) {
        console.error("Create leave request error:", error);

        return res.status(500).json({
            message: "Failed to submit leave request",
        });
    }
};

// Get the logged-in employee's leave requests
export const getMyLeaveRequests = async (req, res) => {
    try {
        const requests = await prisma.leave_requests.findMany({
            where: { employees: { user_id: req.user.userId } },
            select: leaveRequestListSelect,
            orderBy: { created_at: "desc" },
        });

        // The old query did not return employee_id for this endpoint.
        const leaveRequests = requests.map(({ employee_id, ...request }) =>
            flattenLeaveRequest(request)
        );

        return res.status(200).json({
            leaveRequests,
        });
    } catch (error) {
        console.error("Get my leave requests error:", error);

        return res.status(500).json({
            message: "Failed to retrieve leave requests",
        });
    }
};

export const getAllLeaveRequests = async (req, res) => {
    try {
        const requests = await prisma.leave_requests.findMany({
            // Same as the old INNER JOIN users: skip employees without a user account.
            where: { employees: { users: { isNot: null } } },
            select: {
                ...leaveRequestListSelect,
                employees: {
                    select: { users: { select: { name: true, email: true } } },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const leaveRequests = requests
            .map(({ employees, ...request }) => ({
                ...flattenLeaveRequest(request),
                employee_name: employees.users.name,
                employee_email: employees.users.email,
            }))
            // Pending first, newest first within each group
            // (Prisma has no CASE in orderBy; Array.sort is stable).
            .sort(
                (a, b) =>
                    (a.status === "pending" ? 0 : 1) -
                    (b.status === "pending" ? 0 : 1)
            );

        return res.status(200).json({
            leaveRequests,
        });
    } catch (error) {
        console.error("Get all leave requests error:", error);

        return res.status(500).json({
            message: "Failed to retrieve leave requests",
        });
    }
};

export const reviewLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const { status, reviewComment = "" } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Invalid leave request ID",
        });
    }

    if (!["approved", "rejected", "cancelled"].includes(status)) {
        return res.status(400).json({
            message: "Status must be approved, rejected, or cancelled",
        });
    }

    if (typeof reviewComment !== "string" || reviewComment.length > 1000) {
        return res.status(400).json({
            message: "Review comment must be a string of at most 1000 characters",
        });
    }

    try {
        // Only pending requests can be reviewed; approved ones can still be cancelled.
        const allowedCurrentStatuses =
            status === "cancelled" ? ["pending", "approved"] : ["pending"];

        // Conditional update in one query, so two reviewers can't both succeed.
        const [leaveRequest] = await prisma.leave_requests.updateManyAndReturn({
            where: {
                id: Number(id),
                status: { in: allowedCurrentStatuses },
            },
            data: {
                status,
                reviewed_by: req.user.userId,
                reviewed_at: new Date(),
                review_comment: reviewComment.trim() || null,
                updated_at: new Date(),
            },
        });

        if (!leaveRequest) {
            const existing = await prisma.leave_requests.findUnique({
                where: { id: Number(id) },
                select: { id: true, status: true },
            });

            if (!existing) {
                return res.status(404).json({
                    message: "Leave request not found",
                });
            }

            return res.status(409).json({
                message: "This leave request has already been reviewed",
                currentStatus: existing.status,
            });
        }

        return res.status(200).json({
            message: `Leave request ${status} successfully`,
            leaveRequest,
        });
    } catch (error) {
        console.error("Review leave request error:", error);

        return res.status(500).json({
            message: "Failed to review leave request",
        });
    }
};