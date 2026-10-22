import pool from "../config/postgres.js";

const requirePermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            if (!Number.isInteger(req.user?.userId)) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }

            const result = await pool.query(
                `SELECT 1
                 FROM user_roles ur
                 JOIN role_permissions rp
                    ON rp.role_id = ur.role_id
                 JOIN permissions p
                    ON p.id = rp.permission_id
                 JOIN users u
                    ON u.id = ur.user_id
                 WHERE ur.user_id = $1
                   AND p.permission_key = $2
                   AND u.is_active = TRUE
                 LIMIT 1`,
                [req.user.userId, permissionKey]
            );

            // User doesn't have the required permission.
            if (result.rows.length === 0) {
                return res.status(403).json({
                    message: "You do not have permission to perform this action",
                });
            }

            // Permission verified: continue to the controller.
            return next();

        } catch (error) {
            console.error("Permission check error:", error);

            return res.status(500).json({
                message: "Permission check failed",
            });
        }
    };
};

export default requirePermission;