
import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requirePermission from "../middleware/permission.middleware.js";
import { getManagerTeam } from "../controllers/reporting.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/team", requirePermission("employees.view"), getManagerTeam);

export default router;
