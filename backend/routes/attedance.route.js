import express from "express"
import { clockIn , clockOut , getTodayAttendance , getAttendanceHistory } from "../controllers/attendance.controller.js"
import authMiddleware from "../middleware/auth.middleware.js"



const router = express.Router()

router.post("/login", authMiddleware , clockIn)
router.post("/logout", authMiddleware , clockOut)
router.get("/today" , authMiddleware , getTodayAttendance)
router.get("/history" , authMiddleware , getAttendanceHistory)

export default router