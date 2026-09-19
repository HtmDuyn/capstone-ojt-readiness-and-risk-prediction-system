const { loginUser, getUserById } = require("../services/auth.service");

const login = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const result = await loginUser(username, password);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            ...result
        });
    } catch (error) {
        const status = error && error.statusCode ? error.statusCode : 401;

        return res.status(status).json({
            success: false,
            errorCode: error && error.errorCode ? error.errorCode : "AUTH_FAILED",
            message: error && error.message ? error.message : "Authentication failed"
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user && (req.user.userId || req.user.sub);
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: "USER_NOT_FOUND",
                message: "Authenticated user not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                status: user.status,
                roleCode: user.role_code,
                roleName: user.role_name
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "PROFILE_ERROR",
            message: "Unable to retrieve user profile.",
            details: error && error.message ? error.message : "Unknown error"
        });
    }
};

module.exports = {
    login,
    getCurrentUser
};
