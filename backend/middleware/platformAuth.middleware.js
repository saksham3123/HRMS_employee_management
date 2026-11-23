import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// Protects /api/platform/* routes. Only accepts platform (super admin) tokens.
const platformAuth = async (req, res, next) => {
    try {
        // 1. Read the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No valid authorisation token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        // 2. Verify the signature (only HS256 accepted)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        // 3. Must be a platform token, not a company user's token
        if (decoded?.scope !== "platform" || !Number.isInteger(decoded.platformAdminId)) {
            return res.status(403).json({
                message: "Platform access only",
            });
        }

        // 4. The admin must still exist and be active
        const admin = await prisma.platform_admins.findUnique({
            where: { id: decoded.platformAdminId },
            select: { id: true, name: true, email: true, is_active: true },
        });

        if (!admin || !admin.is_active) {
            return res.status(401).json({
                message: "Account is inactive or no longer exists",
            });
        }

        // 5. All checks passed
        req.platformAdmin = { id: admin.id, name: admin.name, email: admin.email };

        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired token",
            });
        }

        console.error("Platform auth middleware error:", error);

        return res.status(500).json({
            message: "Authentication failed due to a server error",
        });
    }
};

export default platformAuth;