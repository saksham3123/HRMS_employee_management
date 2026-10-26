import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"

import requirePermission from "../middleware/permission.middleware.js"

import { createLeaveRequest , getAllLeaveRequests , getMyLeaveRequests, reviewLeaveRequest } from "../controllers/leave.controller.js"

const router = express.Router()

router.use(authMiddleware)
router.post("/" , createLeaveRequest);
router.get("/mine" , getMyLeaveRequests);
router.get("/" , requirePermission("leave.view.all"), getAllLeaveRequests)
router.patch("/:id/review" , authMiddleware , requirePermission("leave.review"), reviewLeaveRequest)

export default router;
