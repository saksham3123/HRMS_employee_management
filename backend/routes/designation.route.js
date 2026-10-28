
import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import requirePermission from "../middleware/permission.middleware.js";

import {
  createDesignation,
  deleteDesignation,
  getDesignationById,
  getDesignations,
  updateDesignation,
} from "../controllers/designation.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", requirePermission("designations.manage"), getDesignations);
router.get("/:id", requirePermission("designations.manage"), getDesignationById);
router.post("/", requirePermission("designations.manage"), createDesignation);
router.put("/:id", requirePermission("designations.manage"), updateDesignation);
router.delete("/:id", requirePermission("designations.manage"), deleteDesignation);

export default router;
