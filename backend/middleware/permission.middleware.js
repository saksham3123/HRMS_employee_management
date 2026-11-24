import prisma from "../config/prisma.js";

// Does this active user have a role that grants permissionKey?
export const userHasPermission = async (userId, permissionKey) => {
    const match = await prisma.user_roles.findFirst({
        where: {
            user_id: userId,
            users: { is_active: true },
            roles: {
                role_permissions: {
                    some: { permissions: { permission_key: permissionKey } },
                },
            },
        },
        select: { user_id: true },
    });

    return Boolean(match);
};

const requirePermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            if (!Number.isInteger(req.user?.userId)) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }

            // User doesn't have the required permission.
            if (!(await userHasPermission(req.user.userId, permissionKey))) {
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
