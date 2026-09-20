const jwt = require("jsonwebtoken");
const { getUserById } = require("../services/auth.service");

const JWT_SECRET = process.env.JWT_SECRET || "ojt-dev-secret";

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";

    if (!token) {
        return res.status(401).json({
            success: false,
            errorCode: "AUTH_REQUIRED",
            message: "Authentication required. Please provide a bearer token."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const userId = decoded.userId || decoded.sub;

        const user = await getUserById(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                errorCode: "AUTH_USER_NOT_FOUND",
                message: "Authenticated user no longer exists."
            });
        }

        if (user.status === "LOCKED") {
            return res.status(403).json({
                success: false,
                errorCode: "ACCOUNT_LOCKED",
                message: "This account is locked."
            });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                errorCode: "ACCOUNT_INACTIVE",
                message: "This account is not active."
            });
        }

        req.user = {
            ...decoded,
            userId: user.id,
            username: user.username,
            roleCode: user.role_code
        };

        req.token = token;

        return next();
    } catch (error) {
        const message =
            error && error.name === "TokenExpiredError"
                ? "Token expired. Please login again."
                : "Invalid or expired token. Please login again.";

        return res.status(401).json({
            success: false,
            errorCode:
                error && error.name === "TokenExpiredError"
                    ? "TOKEN_EXPIRED"
                    : "INVALID_TOKEN",
            message
        });
    }
};

module.exports = authMiddleware;