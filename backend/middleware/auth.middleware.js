import jwt from "jsonwebtoken"
import pool from "../config/postgres.js";

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

        const result = await pool.query(
            "SELECT is_active FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({
                message: "Account is inactive or no longer exists",
            });
        }

        req.user = decoded

        next();


    } catch (error) {
    console.error("Authentication middleware error:", error);

    if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError"
    ) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }

    return res.status(500).json({
        message: "Authentication failed due to a server error",
    });
    }
}


export default authMiddleware;