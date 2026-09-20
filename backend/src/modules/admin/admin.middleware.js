const requireAdmin = (req, res, next) => {
    const roleCode = req.user && req.user.roleCode;

    if (roleCode !== "ADMIN") {
        return res.status(403).json({
            success: false,
            errorCode: "ADMIN_ACCESS_REQUIRED",
            message: "Administrator access required."
        });
    }

    return next();
};

module.exports = requireAdmin;