import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js";
import { forOrganization } from "../config/tenant.js";

const authMiddleware = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No valid authorisation token provided "
            });
        }

        const token = authHeader.split(" ")[1];


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        )

        if (!decoded || !Number.isInteger(decoded.userId) || typeof decoded.role !== "string") {
            return res.status(401).json({
                message: "Invalid token payload",
            })
        }

       
       


        // Make sure the account still exists and hasn't been deactivated.
        const user = await prisma.users.findUnique({
            where: { id: decoded.userId },
            select: {
                is_active: true,
                organization_id: true,
                organization: { select: { status: true } },
            },
        });

        
        if (!user || !user.is_active) {
            return res.status(401).json({
                message: "Account is inactive or no longer exists",
            });
        }

       


        if (user.organization.status !== "active") {
            return res.status(403).json({
                message: "Your organization's account is suspended",
            })
        }

         req.user = { ...decoded, organizationId: user.organization_id };

         req.db = forOrganization(user.organization_id)



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

        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            message: "Authentication failed due to a server error",
        });
    }
}


export default authMiddleware;
