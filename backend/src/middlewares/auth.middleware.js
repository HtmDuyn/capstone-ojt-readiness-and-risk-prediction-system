const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ojt-dev-secret";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
        return res.status(401).json({
            success: false,
            errorCode: "AUTH_REQUIRED",
            message: "Authentication required. Please provide a bearer token."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        req.token = token;
        return next();
    } catch (error) {
        const message = error && error.name === "TokenExpiredError"
            ? "Token expired. Please login again."
            : "Invalid or expired token. Please login again.";

        return res.status(401).json({
            success: false,
            errorCode: error && error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message
        });
    }
};

module.exports = authMiddleware;
