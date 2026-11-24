import express from "express"
import { clockIn , clockOut , getTodayAttendance , getAttendanceHistory } from "../controllers/attendance.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"
import requirePermission from "../middleware/permission.middleware.js"



const router = express.Router()

router.post("/login", authMiddleware , requirePermission("attendance.clock") , clockIn)
router.post("/logout", authMiddleware , requirePermission("attendance.clock") , clockOut)
router.get("/today" , authMiddleware , requirePermission("attendance.view.self") , getTodayAttendance)
router.get("/history" , authMiddleware , requirePermission("attendance.view.self") , getAttendanceHistory)

export default router
