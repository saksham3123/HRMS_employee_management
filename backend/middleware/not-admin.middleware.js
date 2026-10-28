const notAdminMiddleware = (req, res, next) => {
    if (req.user?.role === "admin") {
        return res.status(403).json({
            message: "Administrators cannot submit leave requests",
        });
    }

    return next();
};

export default notAdminMiddleware;
