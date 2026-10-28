const hrOrAdminMiddleware = (req, res, next) => {
    if (!["hr", "admin"].includes(req.user?.role)) {
        return res.status(403).json({
            message: "Access denied. HR or admin only",
        });
    }

    return next();
};

export default hrOrAdminMiddleware;
