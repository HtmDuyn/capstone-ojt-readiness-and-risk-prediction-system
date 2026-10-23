import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from "pg";
import {
  query,
  pool,
} from "../../config/database";

import type {
  AccountListResult,
  AccountRecord,
} from "./account.types";

const selectAccount = `
  SELECT
    u."UserID" AS id,
    u."MustChangePassword" AS "mustChangePassword",
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
    (SELECT s."StudentID" FROM "Students" s WHERE s."UserID"=u."UserID" AND s."DeletedAt" IS NULL) AS "studentId",
    (SELECT eu."EnterpriseID" FROM "EnterpriseUsers" eu WHERE eu."UserID"=u."UserID" ORDER BY eu."EnterpriseID" LIMIT 1) AS "enterpriseId"

  FROM "Users" u

  INNER JOIN "Roles" r
    ON r."RoleID" = u."RoleID"
`;

export const findAccounts = async (search?:string,roleCode?:string,userId?:number): Promise<AccountListResult> => {
 const result=await query<{data:AccountRecord[];total:number}>(`WITH filtered AS (
  ${selectAccount}
  WHERE ($1::text IS NULL OR u."Username" ILIKE $1 OR u."Email" ILIKE $1 OR u."FullName" ILIKE $1)
    AND ($2::text IS NULL OR r."RoleCode"=$2)
    AND ($3::int IS NULL OR u."UserID"=$3)
 )
 SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(filtered) ORDER BY id) FILTER(WHERE id IS NOT NULL),'[]'::jsonb) AS data FROM filtered`,[search?'%'+search+'%':null,roleCode??null,userId??null]);
 return {...result.rows[0],data:await enrichListRows({query},result.rows[0].data)};
};

export const findAccountById = async (
  userId: number,
  client?: PoolClient,
): Promise<AccountRecord | null> => {
  const result =
    await (client ? client.query.bind(client) : query)<AccountRecord>(
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

export const accountTransaction = async <T>(work: (client: PoolClient) => Promise<T>): Promise<T> => {
  if (!pool) throw new Error('Database is not configured.');
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
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
