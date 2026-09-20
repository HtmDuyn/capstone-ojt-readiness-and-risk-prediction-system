const db = require("../../config/database");

const getUsers = async ({ search = "", role = "" } = {}) => {
    const conditions = [];
    const values = [];

    const normalizedSearch = String(search).trim();
    const normalizedRole = String(role).trim().toUpperCase();

    if (normalizedSearch) {
        values.push(`%${normalizedSearch}%`);

        conditions.push(`
            (
                u."Username" ILIKE $${values.length}
                OR u."FullName" ILIKE $${values.length}
                OR u."Email" ILIKE $${values.length}
                OR s."StudentCode" ILIKE $${values.length}
            )
        `);
    }

    if (normalizedRole) {
        values.push(normalizedRole);

        conditions.push(`
            r."RoleCode" = $${values.length}
        `);
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const result = await db.query(
        `
        SELECT
            u."UserID" AS "id",
            u."Username" AS "username",
            u."Email" AS "email",
            u."Phone" AS "phone",
            u."FullName" AS "fullName",
            u."Status" AS "status",
            u."CreatedAt" AS "createdAt",
            u."UpdatedAt" AS "updatedAt",
            u."LastLoginAt" AS "lastLoginAt",

            r."RoleID" AS "roleId",
            r."RoleCode" AS "roleCode",
            r."RoleName" AS "roleName",

            s."StudentCode" AS "studentCode"

        FROM "Users" u

        INNER JOIN "Roles" r
            ON r."RoleID" = u."RoleID"

        LEFT JOIN "Students" s
            ON s."UserID" = u."UserID"

        ${whereClause}

        ORDER BY u."UserID";
        `,
        values
    );

    return result.rows;
};

const getUserById = async (userId) => {
    const result = await db.query(
        `
        SELECT
            u."UserID" AS "id",
            u."Username" AS "username",
            u."Email" AS "email",
            u."Phone" AS "phone",
            u."FullName" AS "fullName",
            u."Status" AS "status",
            u."CreatedAt" AS "createdAt",
            u."UpdatedAt" AS "updatedAt",
            u."LastLoginAt" AS "lastLoginAt",

            r."RoleID" AS "roleId",
            r."RoleCode" AS "roleCode",
            r."RoleName" AS "roleName",

            s."StudentCode" AS "studentCode"

        FROM "Users" u

        INNER JOIN "Roles" r
            ON r."RoleID" = u."RoleID"

        LEFT JOIN "Students" s
            ON s."UserID" = u."UserID"

        WHERE u."UserID" = $1;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

const updateUserStatus = async (userId, status) => {
    const result = await db.query(
        `
        WITH updated_user AS (
            UPDATE "Users"
            SET
                "Status" = $2,
                "UpdatedAt" = CURRENT_TIMESTAMP
            WHERE "UserID" = $1
            RETURNING *
        )

        SELECT
            u."UserID" AS "id",
            u."Username" AS "username",
            u."Email" AS "email",
            u."Phone" AS "phone",
            u."FullName" AS "fullName",
            u."Status" AS "status",
            u."CreatedAt" AS "createdAt",
            u."UpdatedAt" AS "updatedAt",
            u."LastLoginAt" AS "lastLoginAt",

            r."RoleID" AS "roleId",
            r."RoleCode" AS "roleCode",
            r."RoleName" AS "roleName",

            s."StudentCode" AS "studentCode"

        FROM updated_user u

        INNER JOIN "Roles" r
            ON r."RoleID" = u."RoleID"

        LEFT JOIN "Students" s
            ON s."UserID" = u."UserID";
        `,
        [userId, status]
    );

    return result.rows[0] || null;
};

const validateUserUpdate = async ({
    userId,
    username,
    email,
    roleCode
}) => {
    const result = await db.query(
        `
        SELECT
            EXISTS (
                SELECT 1
                FROM "Users"
                WHERE LOWER("Username") = LOWER($2)
                  AND "UserID" <> $1
            ) AS "usernameExists",

            EXISTS (
                SELECT 1
                FROM "Users"
                WHERE LOWER("Email") = LOWER($3)
                  AND "UserID" <> $1
            ) AS "emailExists",

            EXISTS (
                SELECT 1
                FROM "Roles"
                WHERE "RoleCode" = $4
            ) AS "roleExists";
        `,
        [
            userId,
            username,
            email,
            roleCode
        ]
    );

    return result.rows[0];
};

const updateUser = async ({
    userId,
    username,
    email,
    phone,
    fullName,
    roleCode
}) => {
    const result = await db.query(
        `
        WITH updated_user AS (
            UPDATE "Users" u
            SET
                "Username" = $2,
                "Email" = $3,
                "Phone" = $4,
                "FullName" = $5,
                "RoleID" = r."RoleID",
                "UpdatedAt" = CURRENT_TIMESTAMP

            FROM "Roles" r

            WHERE u."UserID" = $1
              AND r."RoleCode" = $6

            RETURNING u.*
        )

        SELECT
            u."UserID" AS "id",
            u."Username" AS "username",
            u."Email" AS "email",
            u."Phone" AS "phone",
            u."FullName" AS "fullName",
            u."Status" AS "status",
            u."CreatedAt" AS "createdAt",
            u."UpdatedAt" AS "updatedAt",
            u."LastLoginAt" AS "lastLoginAt",

            r."RoleID" AS "roleId",
            r."RoleCode" AS "roleCode",
            r."RoleName" AS "roleName",

            s."StudentCode" AS "studentCode"

        FROM updated_user u

        INNER JOIN "Roles" r
            ON r."RoleID" = u."RoleID"

        LEFT JOIN "Students" s
            ON s."UserID" = u."UserID";
        `,
        [
            userId,
            username,
            email,
            phone,
            fullName,
            roleCode
        ]
    );

    return result.rows[0] || null;
};

module.exports = {
    getUsers,
    getUserById,
    updateUserStatus,
    validateUserUpdate,
    updateUser
};