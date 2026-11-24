import express from "express";
import { listPublicPlans } from "../controllers/plan.controller.js";

// No login: data for the public landing page.
const router = express.Router();

router.get("/plans", listPublicPlans);

export default router;
