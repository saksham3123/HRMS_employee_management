import express from "express"
import { loginUser , getProfile , updateProfile } from "../controllers/user.controller.js"

import authMiddleware from "../middleware/auth.middleware.js"
import userValidation from "../middleware/userValidation.middleware.js"
import { getReportingManager } from "../controllers/reporting.controller.js"

const router = express.Router()

router.post("/login" , loginUser)
router.get("/profile" , authMiddleware , getProfile)
router.put("/profile" , authMiddleware , updateProfile)
// Employee views their own reporting manager
router.get(
  "/me/manager",authMiddleware,
  userValidation,
  (req, res, next) => {
    req.params.employeeId = String(req.employee.id);
    return getReportingManager(req, res, next);
  }
);

export default router