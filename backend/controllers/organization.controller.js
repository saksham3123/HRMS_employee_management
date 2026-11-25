import prisma from "../config/prisma.js";
import { normalizeSlug } from "../helpers/organization.helper.js";

// GET /api/public/organizations/:slug (no login)
// Lets the login page on cybersigma.peopledesk.com show "Cybersigma" and
// tell people when a workspace doesn't exist. Only the name and whether it
// can sign in are returned: nothing else about the company is public.
export const getPublicOrganization = async (req, res) => {
    try {
        const slug = normalizeSlug(req.params.slug);

        if (!slug) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const organization = await prisma.organizations.findUnique({
            where: { slug },
            select: { name: true, slug: true, status: true },
        });

        if (!organization) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        return res.status(200).json({
            organization: {
                name: organization.name,
                slug: organization.slug,
                active: organization.status === "active",
            },
        });
    } catch (error) {
        console.error("Get public organization error:", error);
        return res.status(500).json({ message: "Failed to load workspace" });
    }
};