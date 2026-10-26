import pool from "../config/postgres.js"

// submit a leave request

export const createLeaveRequest = async (req, res) => {

    try {

        const userId = req.user.userId
        const { leaveTypeId, startDate, endDate, reason } = req.body

        if (
            !Number.isInteger(leaveTypeId) || typeof startDate !== "string" ||
            typeof endDate !== "string" ||
            typeof reason !== "string" ||
            !reason.trim()

        ) {
            return res.status(400).json({
                message: "Leave type , dates and reason are required",
            })

        }

        //resolve the logged-in user to their employee record
        const employeeResult = await pool.query(
            `SELECT id
             FROM employees
             WHERE user_id = $1`,
            [userId]

        )



        if (employeeResult.rows.length === 0) {
            return res.status(404).json({
                message: "Employee record not found",
            });
        }


        const employeeId = employeeResult.rows[0].id

        // Validate date format and range.
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (
            !datePattern.test(startDate) ||
            !datePattern.test(endDate) ||
            startDate > endDate
        ) {
            return res.status(400).json({
                message: "Please provide valid dates in YYYY-MM-DD format",
            });
        }


        // Confirm that the leave type exists and is active.
        const leaveTypeResult = await pool.query(
            `SELECT id
             FROM leave_types
             WHERE id = $1 AND is_active = TRUE`,
            [leaveTypeId]
        );

        if (leaveTypeResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid or inactive leave type",
            });
        }

        //overlap leave request 

        // Prevent overlapping pending or approved leave requests.
        const overlapResult = await pool.query(
            `SELECT 1
             FROM leave_requests
             WHERE employee_id = $1
               AND status IN ('pending', 'approved')
               AND start_date <= $3::date
               AND end_date >= $2::date
             LIMIT 1`,
            [employeeId, startDate, endDate]
        );


        if (overlapResult.rows.length > 0) {
            return res.status(409).json({
                message: "You already have a pending or approved request for overlapping dates",
            });
        }


        const result = await pool.query(
            `INSERT INTO leave_requests
                (employee_id, leave_type_id, start_date, end_date, reason)
             VALUES ($1, $2, $3::date, $4::date, $5)
             RETURNING *`,
            [
                employeeId,
                leaveTypeId,
                startDate,
                endDate,
                reason.trim(),
            ]
        );


        return res.status(201).json({
            message: "Leave request submitted successfully",
            leaveRequest: result.rows[0],
        });

    } catch (error) {


        console.error("Create leave request error:", error);

        return res.status(500).json({
            message: "Failed to submit leave request",
        });

    }

}


// Get the logged-in employee's leave requests
export const getMyLeaveRequests = async (req, res) => {

    try {

        
        const result = await pool.query(
            `SELECT
                lr.id,
                lr.start_date,
                lr.end_date,
                lr.reason,
                lr.status,
                lr.review_comment,
                lr.reviewed_at,
                lr.created_at,
                lt.name AS leave_type,
                reviewer.name AS reviewed_by_name
             FROM leave_requests lr
             JOIN employees e ON e.id = lr.employee_id
             JOIN leave_types lt ON lt.id = lr.leave_type_id
             LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
             WHERE e.user_id = $1
             ORDER BY lr.created_at DESC`,
            [req.user.userId]
        );

        return res.status(200).json({
            leaveRequests: result.rows,
        });
        
    } catch (error) {

        console.error("Get my leave requests error:", error);

        return res.status(500).json({
            message: "Failed to retrieve leave requests",
        });
        
    }
}




export const getAllLeaveRequests = async (req , res) => {

    try {

        const result = await pool.query(
            `SELECT
                lr.id,
                lr.employee_id,
                u.name AS employee_name,
                u.email AS employee_email,
                lr.start_date,
                lr.end_date,
                lr.reason,
                lr.status,
                lr.review_comment,
                lr.reviewed_at,
                lr.created_at,
                lt.name AS leave_type,
                reviewer.name AS reviewed_by_name
             FROM leave_requests lr
             JOIN employees e ON e.id = lr.employee_id
             JOIN users u ON u.id = e.user_id
             JOIN leave_types lt ON lt.id = lr.leave_type_id
             LEFT JOIN users reviewer ON reviewer.id = lr.reviewed_by
             ORDER BY
                CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END,
                lr.created_at DESC`
        );

        return res.status(200).json({
            leaveRequests: result.rows,
        });
        
    } catch (error) {

        console.error("Get all leave requests error:", error);

        return res.status(500).json({
            message: "Failed to retrieve leave requests",
        });
        
    }
    
}

export const reviewLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const { status , reviewComment = ""} = req.body;

      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Invalid leave request ID",
        });
    }


    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            message: "Status must be approved or rejected",
        });
    }

    if (
        typeof reviewComment !== "string" ||
        reviewComment.length > 1000
    ) {
        return res.status(400).json({
            message: "Review comment must be a string of at most 1000 characters",
        });
    }


    try {

         const result = await pool.query(
            `UPDATE leave_requests
             SET status = $1,
                 reviewed_by = $2,
                 reviewed_at = CURRENT_TIMESTAMP,
                 review_comment = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
               AND status = 'pending'
             RETURNING *`,
            [
                status,
                req.user.userId,
                reviewComment.trim() || null,
                Number(id),
            ]
        );


         if (result.rows.length === 0) {
            const existing = await pool.query(
                "SELECT id, status FROM leave_requests WHERE id = $1",
                [Number(id)]
            );

            if (existing.rows.length === 0) {
                return res.status(404).json({
                    message: "Leave request not found",
                });
            }

            return res.status(409).json({
                message: "This leave request has already been reviewed",
                currentStatus: existing.rows[0].status,
            });
        }

        return res.status(200).json({
            message: `Leave request ${status} successfully`,
            leaveRequest: result.rows[0],
        });


        
    } catch (error) {

        console.error("Review leave request error:", error);

        return res.status(500).json({
            message: "Failed to review leave request",
        });
        
    }


}