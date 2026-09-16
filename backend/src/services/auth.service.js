const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const database = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "ojt-dev-secret";

const normalizeIdentifier = (value) => (typeof value === "string" ? value.trim() : "");

const verifyPassword = async (inputPassword, storedHash) => {
    if (!inputPassword || !storedHash) {
        return false;
    }

    if (/^\$2[aby]\$\d+\$/.test(storedHash)) {
        return bcrypt.compare(inputPassword, storedHash);
    }

    return inputPassword === storedHash;
};

const getUserById = async (userId) => {
    const id = Number(userId);

    if (!id || Number.isNaN(id)) {
        return null;
    }

    const result = await database.query(
        `
            SELECT
                u."UserID" AS id,
                u."Username" AS username,
                u."Email" AS email,
                u."FullName" AS full_name,
                u."Status" AS status,
                u."PasswordHash" AS password_hash,
                r."RoleCode" AS role_code,
                r."RoleName" AS role_name
            FROM "Users" u
            LEFT JOIN "Roles" r ON r."RoleID" = u."RoleID"
            WHERE u."UserID" = $1
            LIMIT 1;
        `,
        [id]
    );

    return result.rows[0] || null;
};

const loginUser = async (username, password) => {
    const safeUsername = normalizeIdentifier(username);
    const safePassword = typeof password === "string" ? password : "";

    if (!safeUsername) {
        throw Object.assign(new Error("Username or email is required."), { statusCode: 400, errorCode: "MISSING_USERNAME" });
    }

    if (!safePassword) {
        throw Object.assign(new Error("Password is required."), { statusCode: 400, errorCode: "MISSING_PASSWORD" });
    }

    const result = await database.query(
        `
            SELECT
                u."UserID" AS id,
                u."Username" AS username,
                u."Email" AS email,
                u."FullName" AS full_name,
                u."Status" AS status,
                u."PasswordHash" AS password_hash,
                r."RoleCode" AS role_code,
                r."RoleName" AS role_name
            FROM "Users" u
            LEFT JOIN "Roles" r ON r."RoleID" = u."RoleID"
            WHERE LOWER(u."Username") = LOWER($1)
               OR LOWER(u."Email") = LOWER($1)
            LIMIT 1;
        `,
        [safeUsername]
    );

    const user = result.rows[0];

    if (!user) {
        throw Object.assign(new Error("User not found. Please check your username or email."), { statusCode: 404, errorCode: "USER_NOT_FOUND" });
    }

    const isPasswordValid = await verifyPassword(safePassword, user.password_hash);

    if (!isPasswordValid) {
        throw Object.assign(new Error("Incorrect password. Please check your password and try again."), { statusCode: 401, errorCode: "INVALID_PASSWORD" });
    }

    const token = jwt.sign(
        {
            sub: user.id,
            userId: user.id,
            username: user.username,
            roleCode: user.role_code
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            status: user.status,
            roleCode: user.role_code,
            roleName: user.role_name
        }
    };
};

module.exports = {
    loginUser,
    verifyPassword,
    getUserById
};
