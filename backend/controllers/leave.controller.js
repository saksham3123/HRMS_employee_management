import { userHasPermission } from "../middleware/permission.middleware.js";

// All queries go through req.db, the client scoped to the user's organization
// (config/tenant.js), so one company never sees another company's leave.

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
    hr_status: true,
    hr_reviewed_at: true,
    hr_comment: true,
    manager_status: true,
    manager_reviewed_at: true,
    manager_comment: true,
    leave_types: { select: { name: true } },
    users: { select: { name: true } }, // last reviewer (leave_requests.reviewed_by)
    hr_reviewer: { select: { name: true } },
    manager_reviewer: { select: { name: true } },
};

const flattenLeaveRequest = ({ leave_types, users, hr_reviewer, manager_reviewer, ...request }) => ({
    ...request,
    leave_type: leave_types.name,
    reviewed_by_name: users?.name ?? null,
    hr_reviewed_by_name: hr_reviewer?.name ?? null,
    manager_reviewed_by_name: manager_reviewer?.name ?? null,
});

// Overall status from the two decisions: one rejection rejects; it's
// approved only when neither step is still waiting.
const DONE = ["approved", "not_required"];
const overallStatus = (hrStatus, managerStatus) => {
    if (hrStatus === "rejected" || managerStatus === "rejected") return "rejected";
    if (DONE.includes(hrStatus) && DONE.includes(managerStatus)) return "approved";
    return "pending";
};

// Employees who currently report to this manager.
const directReportsOf = (managerUserId) => ({
    reporting_lines: {
        some: { effective_to: null, manager: { user_id: managerUserId } },
    },
});

// Reviewer list shape: the request plus who asked for it.
const reviewListSelect = {
    ...leaveRequestListSelect,
    employees: {
        select: { user_id: true, users: { select: { name: true, email: true } } },
    },
};

// my_step says which decision, if any, the viewer still owes on a request
// ("hr" or "manager"), so the page only offers Approve/Reject when it counts.
const flattenReviewListRequest = (viewerId, stepField, step) => ({ employees, ...request }) => ({
    ...flattenLeaveRequest(request),
    employee_name: employees.users.name,
    employee_email: employees.users.email,
    my_step:
        request.status === "pending" &&
        request[stepField] === "pending" &&
        employees.user_id !== viewerId
            ? step
            : null,
});

// Pending first, newest first within each group
// (Prisma has no CASE in orderBy; Array.sort is stable).
const pendingFirst = (a, b) =>
    (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1);

export const getLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await req.db.leave_types.findMany({
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
        const employee = await req.db.employees.findUnique({
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
        const leaveType = await req.db.leave_types.findFirst({
            where: { id: leaveTypeId, is_active: true },
            select: { id: true },
        });

        if (!leaveType) {
            return res.status(400).json({
                message: "Invalid or inactive leave type",
            });
        }

        // Prevent overlapping pending or approved leave requests.
        const overlap = await req.db.leave_requests.findFirst({
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

        // The manager step only applies when the employee has a manager.
        const reportingLine = await req.db.employee_reporting.findFirst({
            where: { employee_id: employeeId, effective_to: null },
            select: { id: true },
        });

        const leaveRequest = await req.db.leave_requests.create({
            data: {
                manager_status: reportingLine ? "pending" : "not_required",
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
        const requests = await req.db.leave_requests.findMany({
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
        const requests = await req.db.leave_requests.findMany({
            // Same as the old INNER JOIN users: skip employees without a user account.
            where: { employees: { users: { isNot: null } } },
            select: reviewListSelect,
            orderBy: { created_at: "desc" },
        });

        const leaveRequests = requests
            .map(flattenReviewListRequest(req.user.userId, "hr_status", "hr"))
            .sort(pendingFirst);

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

// Leave requests from the logged-in manager's direct reports.
export const getTeamLeaveRequests = async (req, res) => {
    try {
        const requests = await req.db.leave_requests.findMany({
            where: {
                employees: {
                    users: { isNot: null },
                    ...directReportsOf(req.user.userId),
                },
            },
            select: reviewListSelect,
            orderBy: { created_at: "desc" },
        });

        const leaveRequests = requests
            .map(flattenReviewListRequest(req.user.userId, "manager_status", "manager"))
            .sort(pendingFirst);

        return res.status(200).json({
            leaveRequests,
        });
    } catch (error) {
        console.error("Get team leave requests error:", error);

        return res.status(500).json({
            message: "Failed to retrieve team leave requests",
        });
    }
};

// Review a request. Two people decide each request:
//   - HR (anyone with leave.manage, which includes admins), and
//   - the employee's current reporting manager (leave.approve.team).
// It's approved only when both approve (or HR approves and the employee had
// no manager); a rejection from either rejects it. HR/admin can also cancel
// a pending or approved request. Nobody reviews their own request, and one
// person can't give both decisions.
const RESULT_MESSAGES = {
    approved: "Leave approved.",
    rejected: "Leave rejected.",
    pending: "Your decision is saved. It's waiting on the other approver.",
};

export const reviewLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const { status, reviewComment = "" } = req.body;
    const reviewerId = req.user.userId;
    const requestId = Number(id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
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

    const comment = reviewComment.trim() || null;

    try {
        const canManageAll = await userHasPermission(reviewerId, "leave.manage");
        const canApproveTeam = await userHasPermission(reviewerId, "leave.approve.team");

        const { code, body } = await req.db.$transaction(async (tx) => {
            // Lock the request so two reviewers can't both read "pending" and
            // leave it half-decided. Raw SQL isn't tenant-scoped, hence the
            // organization filter.
            const locked = await tx.$queryRaw`
                SELECT id FROM leave_requests
                WHERE id = ${requestId} AND organization_id = ${req.user.organizationId}
                FOR UPDATE`;

            if (locked.length === 0) {
                return { code: 404, body: { message: "Leave request not found" } };
            }

            const request = await tx.leave_requests.findUnique({
                where: { id: requestId },
                select: {
                    status: true,
                    employee_id: true,
                    hr_status: true,
                    hr_reviewed_by: true,
                    manager_status: true,
                    manager_reviewed_by: true,
                    employees: { select: { user_id: true } },
                },
            });

            if (request.employees.user_id === reviewerId) {
                return { code: 403, body: { message: "You cannot review your own leave request" } };
            }

            const now = new Date();

            if (status === "cancelled") {
                if (!canManageAll) {
                    return { code: 403, body: { message: "Only HR or an admin can cancel a leave request" } };
                }
                if (!["pending", "approved"].includes(request.status)) {
                    return {
                        code: 409,
                        body: { message: `This request is already ${request.status}`, currentStatus: request.status },
                    };
                }

                const leaveRequest = await tx.leave_requests.update({
                    where: { id: requestId },
                    data: {
                        status: "cancelled",
                        reviewed_by: reviewerId,
                        reviewed_at: now,
                        review_comment: comment,
                        updated_at: now,
                    },
                });

                return { code: 200, body: { message: "Leave request cancelled.", leaveRequest } };
            }

            if (request.status !== "pending") {
                return {
                    code: 409,
                    body: { message: `This request is already ${request.status}`, currentStatus: request.status },
                };
            }

            const isReportingManager =
                canApproveTeam &&
                Boolean(
                    await tx.employee_reporting.findFirst({
                        where: {
                            employee_id: request.employee_id,
                            effective_to: null,
                            manager: { user_id: reviewerId },
                        },
                        select: { id: true },
                    })
                );

            let step = null;
            if (
                isReportingManager &&
                request.manager_status === "pending" &&
                request.hr_reviewed_by !== reviewerId
            ) {
                step = "manager";
            } else if (
                canManageAll &&
                request.hr_status === "pending" &&
                request.manager_reviewed_by !== reviewerId
            ) {
                step = "hr";
            }

            if (!step) {
                const involved = canManageAll || isReportingManager;
                return {
                    code: involved ? 409 : 403,
                    body: {
                        message: involved
                            ? "There's no decision left for you to give on this request"
                            : "You can only review leave requests from your direct reports",
                    },
                };
            }

            const hrStatus = step === "hr" ? status : request.hr_status;
            const managerStatus = step === "manager" ? status : request.manager_status;
            const overall = overallStatus(hrStatus, managerStatus);

            const stepData =
                step === "hr"
                    ? { hr_status: status, hr_reviewed_by: reviewerId, hr_reviewed_at: now, hr_comment: comment }
                    : {
                          manager_status: status,
                          manager_reviewed_by: reviewerId,
                          manager_reviewed_at: now,
                          manager_comment: comment,
                      };

            const leaveRequest = await tx.leave_requests.update({
                where: { id: requestId },
                data: {
                    ...stepData,
                    status: overall,
                    reviewed_by: reviewerId,
                    reviewed_at: now,
                    review_comment: comment,
                    updated_at: now,
                },
            });

            return { code: 200, body: { message: RESULT_MESSAGES[overall], leaveRequest, step } };
        });

        return res.status(code).json(body);
    } catch (error) {
        console.error("Review leave request error:", error);

        return res.status(500).json({
            message: "Failed to review leave request",
        });
    }
};
