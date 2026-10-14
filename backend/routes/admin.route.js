import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import adminMiddleware from "../middleware/admin.middleware.js"
import { registerUser  , getAllUsers, deleteUser} from "../controllers/user.controller.js"
import { getAllTodayAttendance, getMonthlyPayrollSummary, getUserMonthlyReport , getMonthlyPayrollByEmployee } from "../controllers/attendance.controller.js"


const router = express.Router()

router.use(authMiddleware)
router.use(adminMiddleware)

router.post("/users" , registerUser)
router.get("/attendance/:userId/monthly/:month/:year", getUserMonthlyReport)
router.get("/users", getAllUsers)

router.delete("/users/:userId" , deleteUser)
router.get("/attendance/today", getAllTodayAttendance);
router.get(
  "/payroll/summary/:month/:year",
  getMonthlyPayrollSummary
);
router.get(
  "/payroll/by-employee/:month/:year",
  getMonthlyPayrollByEmployee
);


export default router