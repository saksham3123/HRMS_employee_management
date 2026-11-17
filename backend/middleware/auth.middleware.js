import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js";

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
            process.env.JWT_SECRET
        )

        if (!decoded || !Number.isInteger(decoded.userId) || typeof decoded.role !== "string") {
            return res.status(401).json({
                message: "Invalid token payload",
            })
        }

        // Make sure the account still exists and hasn't been deactivated.
        const user = await prisma.users.findUnique({
            where: { id: decoded.userId },
            select: { is_active: true },
        });

        if (!user || !user.is_active) {
            return res.status(401).json({
                message: "Account is inactive or no longer exists",
            });
        }

        req.user = decoded

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
