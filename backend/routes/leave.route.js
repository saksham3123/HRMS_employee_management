import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import hrOrAdminMiddleware from "../middleware/hr-or-admin.middleware.js"
import notAdminMiddleware from "../middleware/not-admin.middleware.js"
import requirePermission from "../middleware/permission.middleware.js"

import {
    createLeaveRequest,
    getAllLeaveRequests,
    getLeaveTypes,
    getMyLeaveRequests,
    getTeamLeaveRequests,
    reviewLeaveRequest,
} from "../controllers/leave.controller.js"

const router = express.Router()

router.use(authMiddleware)
router.get("/types", getLeaveTypes)
router.post("/", notAdminMiddleware, requirePermission("leave.apply"), createLeaveRequest)
router.get("/mine", getMyLeaveRequests)
router.get("/team", requirePermission("leave.approve.team"), getTeamLeaveRequests)
router.get("/", hrOrAdminMiddleware, requirePermission("leave.manage"), getAllLeaveRequests)
// Who may review which request is decided in the controller
// (leave.manage: any request; leave.approve.team: direct reports only).
router.patch("/:id/review", reviewLeaveRequest)

export default router;
