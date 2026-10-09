import {
  query,
} from "../../config/database";

import type {
  AccountListResult,
  AccountRecord,
} from "./account.types";

const selectAccount = `
  SELECT
    u."UserID" AS id,
    u."Username" AS username,
    u."Email" AS email,
    u."Phone" AS phone,
    u."FullName" AS full_name,
    u."Status" AS status,
    u."RoleID" AS role_id,
    r."RoleCode" AS role_code,
    r."RoleName" AS role_name,
    u."CreatedAt" AS created_at,
    u."UpdatedAt" AS updated_at,
    u."LastLoginAt" AS last_login_at

  FROM "Users" u

  INNER JOIN "Roles" r
    ON r."RoleID" = u."RoleID"
`;

export const findAccounts = async (
  page: number,
  limit: number,
  search?: string,
  roleCode?: string,
  status?: string,
): Promise<AccountListResult> => {
  const offset =
    (page - 1) * limit;

  const searchValue =
    search
      ? `%${search}%`
      : null;

  const result =
    await query<AccountRecord & {
      total_count: string;
    }>(
      `
        SELECT
          u."UserID" AS id,
          u."Username" AS username,
          u."Email" AS email,
          u."Phone" AS phone,
          u."FullName" AS full_name,
          u."Status" AS status,
          u."RoleID" AS role_id,
          r."RoleCode" AS role_code,
          r."RoleName" AS role_name,
          u."CreatedAt" AS created_at,
          u."UpdatedAt" AS updated_at,
          u."LastLoginAt" AS last_login_at,
          COUNT(*) OVER() AS total_count

        FROM "Users" u

        INNER JOIN "Roles" r
          ON r."RoleID" = u."RoleID"

        WHERE
          (
            $1::text IS NULL
            OR u."Username" ILIKE $1
            OR u."Email" ILIKE $1
            OR u."FullName" ILIKE $1
          )

          AND (
            $2::text IS NULL
            OR r."RoleCode" = $2
          )

          AND (
            $3::text IS NULL
            OR u."Status" = $3
          )

        ORDER BY
          u."UserID"

        LIMIT $4
        OFFSET $5;
      `,
      [
        searchValue,
        roleCode ?? null,
        status ?? null,
        limit,
        offset,
      ],
    );

  const total =
    result.rows[0]
      ? Number(
          result.rows[0]
            .total_count,
        )
      : 0;

  return {
    data:
      result.rows.map(
        ({
          total_count: _,
          ...account
        }) => account,
      ),

    total,
    page,
    limit,
  };
};

export const findAccountById = async (
  userId: number,
): Promise<AccountRecord | null> => {
  const result =
    await query<AccountRecord>(
      `
        ${selectAccount}

        WHERE
          u."UserID" = $1

        LIMIT 1;
      `,
      [userId],
    );

  return (
    result.rows[0] ??
    null
  );
};

export const existsByEmail = async (
  email: string,
  excludeUserId?: number,
): Promise<boolean> => {
  const result =
    await query(
      `
        SELECT 1
        FROM "Users"

        WHERE
          LOWER("Email") =
          LOWER($1)

          AND (
            $2::int IS NULL
            OR "UserID" <> $2
          )

        LIMIT 1;
      `,
      [
        email,
        excludeUserId ?? null,
      ],
    );

  return result.rowCount !== 0;
};

export const existsByUsername = async (
  username: string,
): Promise<boolean> => {
  const result =
    await query(
      `
        SELECT 1
        FROM "Users"

        WHERE
          LOWER("Username") =
          LOWER($1)

        LIMIT 1;
      `,
      [username],
    );

  return result.rowCount !== 0;
};

export const createAccount = async (
  username: string,
  passwordHash: string,
  email: string,
  fullName: string,
  phone: string | null,
  roleId: number,
): Promise<AccountRecord> => {
  const result =
    await query<{ id: number }>(
      `
        INSERT INTO "Users" (
          "Username",
          "PasswordHash",
          "Email",
          "Phone",
          "FullName",
          "RoleID",
          "Status"
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'ACTIVE'
        )

        RETURNING
          "UserID" AS id;
      `,
      [
        username,
        passwordHash,
        email,
        phone,
        fullName,
        roleId,
      ],
    );

  const userId =
    result.rows[0]?.id;

  if (!userId) {
    throw new Error(
      "Unable to create account.",
    );
  }

  const account =
    await findAccountById(
      userId,
    );

  if (!account) {
    throw new Error(
      "Created account not found.",
    );
  }

  return account;
};

export const updateAccountByAdmin = async (
  userId: number,
  fullName: string,
  phone: string | null,
  email: string,
): Promise<void> => {
  await query(
    `
      UPDATE "Users"

      SET
        "FullName" = $2,
        "Phone" = $3,
        "Email" = $4,
        "UpdatedAt" =
          CURRENT_TIMESTAMP

      WHERE
        "UserID" = $1;
    `,
    [
      userId,
      fullName,
      phone,
      email,
    ],
  );
};

export const updateOwnProfile = async (
  userId: number,
  fullName: string,
  phone: string | null,
): Promise<void> => {
  await query(
    `
      UPDATE "Users"

      SET
        "FullName" = $2,
        "Phone" = $3,
        "UpdatedAt" =
          CURRENT_TIMESTAMP

      WHERE
        "UserID" = $1;
    `,
    [
      userId,
      fullName,
      phone,
    ],
  );
};

export const updateAccountStatus = async (
  userId: number,
  status: string,
): Promise<void> => {
  await query(
    `
      UPDATE "Users"

      SET
        "Status" = $2,
        "UpdatedAt" =
          CURRENT_TIMESTAMP

      WHERE
        "UserID" = $1;
    `,
    [
      userId,
      status,
    ],
  );
};

export const updateAccountRole = async (
  userId: number,
  roleId: number,
): Promise<void> => {
  await query(
    `
      UPDATE "Users"

      SET
        "RoleID" = $2,
        "UpdatedAt" =
          CURRENT_TIMESTAMP

      WHERE
        "UserID" = $1;
    `,
    [
      userId,
      roleId,
    ],
  );
};