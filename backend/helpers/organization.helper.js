import prisma from "../config/prisma.js";

// Company (organization) helpers shared by login, the public lookup
// and the Excel import.

// Same rule as signup: lowercase letters, numbers and single hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// "  CyberSigma " -> "cybersigma". Returns null when it isn't a valid slug.
export const normalizeSlug = (value) => {
    if (typeof value !== "string") return null;
    const slug = value.trim().toLowerCase();
    return slug.length > 0 && slug.length <= 80 && SLUG_PATTERN.test(slug)
        ? slug
        : null;
};

// The company slug a request was made from. The frontend sends it as the
// X-Organization-Slug header (taken from the subdomain); login may also send
// it in the body.
export const getRequestSlug = (req) =>
    normalizeSlug(req.body?.slug ?? req.get("X-Organization-Slug"));

// How many seats the company's plan allows and how many are in use.
// Seats = active user accounts. limit null = unlimited (e.g. enterprise).
export const getSeatUsage = async (organizationId) => {
    const [organization, used] = await Promise.all([
        prisma.organizations.findUnique({
            where: { id: organizationId },
            select: { plan_ref: { select: { name: true, max_employees: true } } },
        }),
        prisma.users.count({
            where: { organization_id: organizationId, is_active: true },
        }),
    ]);

    const limit = organization?.plan_ref?.max_employees ?? null;

    return {
        plan: organization?.plan_ref?.name ?? null,
        limit,
        used,
        remaining: limit === null ? Infinity : Math.max(limit - used, 0),
    };
};