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

const getSystemConfig = async () => {
    const [
        settingResult,
        academicYearsResult,
        ojtSemestersResult
    ] = await Promise.all([
        db.query(
            `
            SELECT
                "SettingKey" AS "settingKey",
                "SettingValue" AS "settingValue",
                "Description" AS "description",
                "UpdatedBy" AS "updatedBy",
                "UpdatedAt" AS "updatedAt"
            FROM "SystemSettings"
            WHERE "SettingKey" = $1;
            `,
            ["system.current_period"]
        ),

        db.query(
            `
            SELECT
                "AcademicYearID" AS "id",
                "YearCode" AS "yearCode",
                "StartDate" AS "startDate",
                "EndDate" AS "endDate",
                "Status" AS "status"
            FROM "AcademicYears"
            ORDER BY
                "StartDate" DESC NULLS LAST,
                "AcademicYearID" DESC;
            `
        ),

        db.query(
            `
            SELECT
                s."OJTSemesterID" AS "id",
                s."AcademicYearID" AS "academicYearId",
                a."YearCode" AS "academicYearCode",
                s."SemesterCode" AS "semesterCode",
                s."Name" AS "name",
                s."RegStartDate" AS "regStartDate",
                s."RegEndDate" AS "regEndDate",
                s."StartDate" AS "startDate",
                s."EndDate" AS "endDate",
                s."Status" AS "status"
            FROM "OJTSemesters" s
            INNER JOIN "AcademicYears" a
                ON a."AcademicYearID" = s."AcademicYearID"
            ORDER BY
                s."StartDate" DESC NULLS LAST,
                s."OJTSemesterID" DESC;
            `
        )
    ]);

    const setting = settingResult.rows[0] || null;

    return {
        currentPeriod: setting
            ? {
                academicYearId:
                    setting.settingValue?.academicYearId ?? null,
                ojtSemesterId:
                    setting.settingValue?.ojtSemesterId ?? null,
                updatedBy: setting.updatedBy,
                updatedAt: setting.updatedAt
            }
            : null,

        academicYears: academicYearsResult.rows,
        ojtSemesters: ojtSemestersResult.rows
    };
};

const validateCurrentPeriod = async ({
    academicYearId,
    ojtSemesterId
}) => {
    const result = await db.query(
        `
        SELECT
            EXISTS (
                SELECT 1
                FROM "AcademicYears"
                WHERE "AcademicYearID" = $1
            ) AS "academicYearExists",

            EXISTS (
                SELECT 1
                FROM "OJTSemesters"
                WHERE "OJTSemesterID" = $2
            ) AS "ojtSemesterExists",

            EXISTS (
                SELECT 1
                FROM "OJTSemesters"
                WHERE "OJTSemesterID" = $2
                  AND "AcademicYearID" = $1
            ) AS "semesterBelongsToAcademicYear";
        `,
        [
            academicYearId,
            ojtSemesterId
        ]
    );

    return result.rows[0];
};

const updateSystemConfig = async ({
    academicYearId,
    ojtSemesterId,
    updatedBy
}) => {
    const result = await db.query(
        `
        WITH valid_period AS (
            SELECT 1
            FROM "AcademicYears" a
            INNER JOIN "OJTSemesters" s
                ON s."OJTSemesterID" = $2
               AND s."AcademicYearID" = a."AcademicYearID"
            WHERE a."AcademicYearID" = $1
        ),

        upserted_setting AS (
            INSERT INTO "SystemSettings" (
                "SettingKey",
                "SettingValue",
                "Description",
                "UpdatedBy",
                "UpdatedAt"
            )

            SELECT
                'system.current_period',
                jsonb_build_object(
                    'academicYearId', $1::integer,
                    'ojtSemesterId', $2::integer
                ),
                'Current academic year and OJT semester used by system operations',
                $3,
                CURRENT_TIMESTAMP

            FROM valid_period

            ON CONFLICT ("SettingKey")
            DO UPDATE SET
                "SettingValue" = EXCLUDED."SettingValue",
                "UpdatedBy" = EXCLUDED."UpdatedBy",
                "UpdatedAt" = CURRENT_TIMESTAMP

            RETURNING
                "SettingValue" AS "settingValue",
                "UpdatedBy" AS "updatedBy",
                "UpdatedAt" AS "updatedAt"
        )

        SELECT
            "settingValue",
            "updatedBy",
            "updatedAt"
        FROM upserted_setting;
        `,
        [
            academicYearId,
            ojtSemesterId,
            updatedBy
        ]
    );

    const setting = result.rows[0] || null;

    if (!setting) {
        return null;
    }

    return {
        academicYearId:
            setting.settingValue.academicYearId,
        ojtSemesterId:
            setting.settingValue.ojtSemesterId,
        updatedBy: setting.updatedBy,
        updatedAt: setting.updatedAt
    };
};

module.exports = {
    getSystemConfig,
    validateCurrentPeriod,
    updateSystemConfig,
    getUsers,
    getUserById,
    updateUserStatus,
    validateUserUpdate,
    updateUser
};