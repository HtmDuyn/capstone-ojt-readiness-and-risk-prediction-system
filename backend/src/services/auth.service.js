const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sql, getPool } = require("../config/database");

const roleMap = {
    STUDENT: "student",
    ACADEMIC: "education",
    CORPORATE_RELATIONS: "qhdn",
    ENTERPRISE: "enterprise",
    ADMIN: "admin",
};

const allowedFrontendRoles = Object.values(roleMap);

async function login({ account, password, role }) {
    if (
        typeof account !== "string" ||
        typeof password !== "string" ||
        typeof role !== "string" ||
        !account.trim() ||
        !password ||
        !role.trim()
    ) {
        const error = new Error("Account, password and role are required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedAccount = account.trim();
    const normalizedRole = role.trim().toLowerCase();

    if (!allowedFrontendRoles.includes(normalizedRole)) {
        const error = new Error("Invalid role");
        error.statusCode = 400;
        throw error;
    }

    const pool = getPool();

    const result = await pool
        .request()
        .input("account", sql.VarChar(100), normalizedAccount)
        .query(`
            SELECT TOP 1
                u.UserID,
                u.Username,
                u.PasswordHash,
                u.Email,
                u.Phone,
                u.FullName,
                u.Status,
                u.LastLoginAt,
                r.RoleID,
                r.RoleCode,
                r.RoleName,
                s.StudentID,
                s.StudentCode
            FROM Users u
            INNER JOIN Roles r
                ON r.RoleID = u.RoleID
            LEFT JOIN Students s
                ON s.UserID = u.UserID
            WHERE
                u.Username = @account
                OR u.Email = @account
                OR s.StudentCode = @account
        `);

    const user = result.recordset[0];

    if (!user) {
        const error = new Error("Invalid account or password");
        error.statusCode = 401;
        throw error;
    }

    const passwordMatched = await bcrypt.compare(
        password,
        user.PasswordHash
    );

    if (!passwordMatched) {
        const error = new Error("Invalid account or password");
        error.statusCode = 401;
        throw error;
    }

    if ((user.Status || "").toUpperCase() !== "ACTIVE") {
        const error = new Error("Account is not active");
        error.statusCode = 403;
        throw error;
    }

    const frontendRole = roleMap[user.RoleCode];

    if (!frontendRole) {
        const error = new Error("Unsupported account role");
        error.statusCode = 403;
        throw error;
    }

    if (normalizedRole !== frontendRole) {
        const error = new Error("Selected role does not match this account");
        error.statusCode = 403;
        throw error;
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        {
            userId: user.UserID,
            roleCode: user.RoleCode,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );

    await pool
        .request()
        .input("userId", sql.Int, user.UserID)
        .query(`
            UPDATE Users
            SET LastLoginAt = SYSDATETIME()
            WHERE UserID = @userId
        `);

    return {
        token,
        user: {
            id: String(user.UserID),
            username: user.Username,
            name: user.FullName,
            email: user.Email,
            phone: user.Phone,
            role: frontendRole,
            roleCode: user.RoleCode,
            studentCode: user.StudentCode || null,
            avatar: null,
        },
    };
}

module.exports = {
    login,
};
