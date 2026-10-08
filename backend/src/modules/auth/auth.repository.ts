import { query } from "../../config/database";

import type {
  AuthUserRecord,
} from "./auth.types";

const selectUser = `
  SELECT
    u."UserID" AS id,
    u."Username" AS username,
    u."Email" AS email,
    u."FullName" AS full_name,
    u."Status" AS status,
    u."PasswordHash" AS password_hash,
    u."MustChangePassword" AS must_change_password,
    u."TemporaryPasswordExpiresAt" AS temporary_password_expires_at,
    u."AuthVersion" AS auth_version,
    r."RoleCode" AS role_code,
    r."RoleName" AS role_name
  FROM "Users" u
  LEFT JOIN "Roles" r
    ON r."RoleID" = u."RoleID"
`;

export const findByEmail = async (
  email: string,
): Promise<AuthUserRecord | null> => {
  const result =
    await query<AuthUserRecord>(
      `
        ${selectUser}
        WHERE LOWER(u."Email") = LOWER($1)
        LIMIT 1;
      `,
      [email],
    );

  return result.rows[0] ?? null;
};

export const findById = async (
  id: number,
): Promise<AuthUserRecord | null> => {
  const result =
    await query<AuthUserRecord>(
      `
        ${selectUser}
        WHERE u."UserID" = $1
        LIMIT 1;
      `,
      [id],
    );

  return result.rows[0] ?? null;
};
