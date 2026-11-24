import express from "express";
import {
    platformLogin,
    getPlatformOverview,
    listOrganizations,
    getOrganization,
    createOrganization,
    updateOrganizationStatus,
    updateOrganizationPlan,
} from "../controllers/platform.controller.js";
import {
    createPlan,
    listPlans,
    updatePlan,
    updatePlanStatus,
} from "../controllers/plan.controller.js";
import platformAuth from "../middleware/platformAuth.middleware.js";

const router = express.Router();

// Public: platform admin login
router.post("/login", platformLogin);

// Everything below requires a platform (super admin) token
router.use(platformAuth);

router.get("/me", (req, res) => {
    res.status(200).json({ admin: req.platformAdmin });
});

router.get("/overview", getPlatformOverview);

router.get("/organizations", listOrganizations);
router.post("/organizations", createOrganization);
router.get("/organizations/:id", getOrganization);
router.patch("/organizations/:id/status", updateOrganizationStatus);
router.patch("/organizations/:id/plan", updateOrganizationPlan);

router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.patch("/plans/:id/status", updatePlanStatus);

export default router;