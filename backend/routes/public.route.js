import express from "express";
import { listPublicPlans } from "../controllers/plan.controller.js";
import { getPublicOrganization } from "../controllers/platform.controller.js";

// No login: data for the public landing page.
const router = express.Router();

router.get("/plans", listPublicPlans);
router.get("/organizations/:slug", getPublicOrganization);

export default router;
