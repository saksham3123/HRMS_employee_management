import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import adminMiddleware from "../middleware/admin.middleware.js"
import {
  registerUser,  getAllUsers,  deleteUser,  updateEmployee
} from "../controllers/user.controller.js";
import { getAllTodayAttendance, getMonthlyPayrollSummary, getUserMonthlyReport , getMonthlyPayrollByEmployee } from "../controllers/attendance.controller.js"
import requirePermission from "../middleware/permission.middleware.js"
import { assignReportingManager, getReportingManager, removeReportingManager, updateReportingManager } from "../controllers/reporting.controller.js";


const router = express.Router()

router.use(authMiddleware)


router.post("/users", adminMiddleware, requirePermission("users.create"), registerUser)
router.get("/users", requirePermission("users.view"), getAllUsers)
router.delete("/users/:userId" , requirePermission("users.deactivate"), deleteUser)
router.put(
  "/employees/:employeeId",
  requirePermission("employees.update"),
  updateEmployee
);


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




// Reporting manager management — admin / authorized HR
router.post(
  "/employees/:employeeId/manager",
  requirePermission("employees.update"),
  assignReportingManager
);

router.put(
  "/employees/:employeeId/manager",
  requirePermission("employees.update"),
  updateReportingManager
);

router.get(
  "/employees/:employeeId/manager",
  requirePermission("employees.view"),
  getReportingManager
);

router.delete(
  "/employees/:employeeId/manager",
  requirePermission("employees.update"),
  removeReportingManager
);
export default router