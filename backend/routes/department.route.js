import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import { createDepartment, deleteDepartment, getDepartmentById, getDepartments, updateDepartment } from "../controllers/department.controller.js";
import requirePermission from "../middleware/permission.middleware.js";




const router = express.Router()

router.use(authMiddleware)


router.get("/", requirePermission("departments.manage"), getDepartments);
router.get("/:id", requirePermission("departments.manage"), getDepartmentById);
router.post("/", requirePermission("departments.manage"), createDepartment);
router.put("/:id", requirePermission("departments.manage"), updateDepartment);
router.delete("/:id", requirePermission("departments.manage"), deleteDepartment);


export default router


