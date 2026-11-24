import prisma from "../config/prisma.js";

// Subscription plans. Shared by every company, so the base prisma client is
// used. Platform admins manage them; the public landing page lists the
// active ones. Prices are whole rupees (Razorpay amounts are paise: x100).

// lowercase letters, numbers and single hyphens: "pro", "pro-annual"
const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_FEATURES = 12;

const planSelect = {
    id: true,
    code: true,
    name: true,
    description: true,
    price_monthly: true,
    price_yearly: true,
    max_employees: true,
    features: true,
    is_active: true,
    is_featured: true,
    sort_order: true,
};

const toId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const isWholeNumber = (value) => Number.isInteger(value) && value >= 0;

// Validates the editable fields. Returns { data } or { error }.
// `partial` allows leaving fields out (updates).
const parsePlanBody = (body, { partial = false } = {}) => {
    const data = {};
    const has = (key) => body[key] !== undefined;

    if (!partial || has("name")) {
        if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 60) {
            return { error: "Plan name is required (up to 60 characters)" };
        }
        data.name = body.name.trim();
    }

    if (has("description")) {
        if (typeof body.description !== "string" || body.description.length > 255) {
            return { error: "Description must be up to 255 characters" };
        }
        data.description = body.description.trim();
    }

    for (const key of ["price_monthly", "price_yearly"]) {
        if (!partial || has(key)) {
            if (!isWholeNumber(body[key])) {
                return { error: "Prices must be whole rupees, 0 or more" };
            }
            data[key] = body[key];
        }
    }

    if (has("max_employees")) {
        if (body.max_employees !== null && !(Number.isInteger(body.max_employees) && body.max_employees > 0)) {
            return { error: "Employee limit must be a positive number, or empty for unlimited" };
        }
        data.max_employees = body.max_employees;
    }

    if (has("features")) {
        if (
            !Array.isArray(body.features) ||
            body.features.length > MAX_FEATURES ||
            body.features.some((feature) => typeof feature !== "string" || feature.length > 120)
        ) {
            return { error: `Features must be up to ${MAX_FEATURES} lines of up to 120 characters` };
        }
        data.features = body.features.map((feature) => feature.trim()).filter(Boolean);
    }

    for (const key of ["is_featured", "is_active"]) {
        if (has(key)) {
            if (typeof body[key] !== "boolean") {
                return { error: `${key} must be true or false` };
            }
            data[key] = body[key];
        }
    }

    if (has("sort_order")) {
        if (!Number.isInteger(body.sort_order)) {
            return { error: "Sort order must be a whole number" };
        }
        data.sort_order = body.sort_order;
    }

    return { data };
};

// GET /api/public/plans (no login): active plans for the landing page.
export const listPublicPlans = async (_req, res) => {
    try {
        const plans = await prisma.plans.findMany({
            where: { is_active: true },
            select: planSelect,
            orderBy: [{ sort_order: "asc" }, { price_monthly: "asc" }],
        });

        return res.status(200).json({ plans });
    } catch (error) {
        console.error("List public plans error:", error);
        return res.status(500).json({ message: "Failed to load plans" });
    }
};

// GET /api/platform/plans: every plan, with how many companies use it.
export const listPlans = async (_req, res) => {
    try {
        const plans = await prisma.plans.findMany({
            select: { ...planSelect, _count: { select: { organizations: true } } },
            orderBy: [{ sort_order: "asc" }, { price_monthly: "asc" }],
        });

        return res.status(200).json({
            plans: plans.map(({ _count, ...plan }) => ({
                ...plan,
                organization_count: _count.organizations,
            })),
        });
    } catch (error) {
        console.error("List plans error:", error);
        return res.status(500).json({ message: "Failed to load plans" });
    }
};

// POST /api/platform/plans
// Body: { code, name, description?, price_monthly, price_yearly,
//         max_employees?, features?, is_featured?, sort_order? }
export const createPlan = async (req, res) => {
    const body = req.body ?? {};
    const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";

    if (code.length < 2 || code.length > 30 || !CODE_PATTERN.test(code)) {
        return res.status(400).json({
            message: "Code must be 2-30 characters: lowercase letters, numbers and hyphens",
        });
    }

    const { data, error } = parsePlanBody(body);
    if (error) return res.status(400).json({ message: error });

    try {
        const plan = await prisma.plans.create({
            data: { ...data, code },
            select: planSelect,
        });

        return res.status(201).json({ message: "Plan created", plan });
    } catch (err) {
        if (err.code === "P2002") {
            return res.status(409).json({ message: "A plan with this code already exists" });
        }

        console.error("Create plan error:", err);
        return res.status(500).json({ message: "Failed to create plan" });
    }
};

// PUT /api/platform/plans/:id
// Same body as create, without code: the code is fixed once companies use it.
export const updatePlan = async (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid plan ID" });

    const { data, error } = parsePlanBody(req.body ?? {}, { partial: true });
    if (error) return res.status(400).json({ message: error });

    try {
        const plan = await prisma.plans.update({
            where: { id },
            data,
            select: planSelect,
        });

        return res.status(200).json({ message: "Plan updated", plan });
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Plan not found" });
        }

        console.error("Update plan error:", err);
        return res.status(500).json({ message: "Failed to update plan" });
    }
};

// PATCH /api/platform/plans/:id/status
// Body: { is_active }. A hidden plan disappears from the landing page and
// can't be given to companies; companies already on it keep it.
export const updatePlanStatus = async (req, res) => {
    const id = toId(req.params.id);
    const { is_active } = req.body ?? {};

    if (!id) return res.status(400).json({ message: "Invalid plan ID" });
    if (typeof is_active !== "boolean") {
        return res.status(400).json({ message: "is_active must be true or false" });
    }

    try {
        const plan = await prisma.plans.update({
            where: { id },
            data: { is_active },
            select: planSelect,
        });

        return res.status(200).json({
            message: is_active ? "Plan is now offered" : "Plan hidden",
            plan,
        });
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Plan not found" });
        }

        console.error("Update plan status error:", err);
        return res.status(500).json({ message: "Failed to update plan" });
    }
};

// True when `code` names a plan that can be given to a company.
export const isAssignablePlan = async (code) => {
    if (typeof code !== "string" || !code) return false;

    const plan = await prisma.plans.findFirst({
        where: { code, is_active: true },
        select: { id: true },
    });

    return Boolean(plan);
};
