import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import hrMiddleware from "../middleware/hr.middleware.js"
import hrOrAdminMiddleware from "../middleware/hr-or-admin.middleware.js"
import notAdminMiddleware from "../middleware/not-admin.middleware.js"
import requirePermission from "../middleware/permission.middleware.js"

import {
    createLeaveRequest,
    getAllLeaveRequests,
    getLeaveTypes,
    getMyLeaveRequests,
    reviewLeaveRequest,
} from "../controllers/leave.controller.js"

const router = express.Router()

router.use(authMiddleware)
router.get("/types", getLeaveTypes)
router.post("/", notAdminMiddleware, requirePermission("leave.apply"), createLeaveRequest)
router.get("/mine", getMyLeaveRequests)
router.get("/", hrOrAdminMiddleware, requirePermission("leave.manage"), getAllLeaveRequests)
router.patch("/:id/review", hrMiddleware, requirePermission("leave.manage"), reviewLeaveRequest)

export default router;
