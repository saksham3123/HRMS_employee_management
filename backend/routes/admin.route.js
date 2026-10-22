import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { registerUser  , getAllUsers, deleteUser} from "../controllers/user.controller.js"
import { getAllTodayAttendance, getMonthlyPayrollSummary, getUserMonthlyReport , getMonthlyPayrollByEmployee } from "../controllers/attendance.controller.js"
import requirePermission from "../middleware/permission.middleware.js"


const router = express.Router()

router.use(authMiddleware)


router.post("/users" ,requirePermission("users.create"), registerUser)
router.get("/users", requirePermission("users.view"), getAllUsers)
router.delete("/users/:userId" , requirePermission("users.deactivate"), deleteUser)


router.get("/attendance/:userId/monthly/:month/:year",  requirePermission("attendance.view.all"),getUserMonthlyReport)
router.get("/attendance/today",     requirePermission("attendance.view.all"),  getAllTodayAttendance);


router.get(
  "/payroll/summary/:month/:year",
   requirePermission("payroll.view.all"),
  getMonthlyPayrollSummary
);
router.get(
  "/payroll/by-employee/:month/:year",
  requirePermission("payroll.view.all"),
  getMonthlyPayrollByEmployee
);


export default router