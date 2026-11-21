import {
  query,
} from "../../../config/database";

import type {
  RoleRecord,
} from "./role.types";

export const listAccountRoles = async (): Promise<RoleRecord[]> => {
  const result = await query<RoleRecord>(`SELECT "RoleID" AS id,"RoleCode" AS code,"RoleName" AS name
    FROM "Roles" WHERE "RoleCode" IN ('STUDENT','ACADEMIC','OJT_COORD','ENTERPRISE','ADMIN')`);
  return result.rows;
};

export const findRoleById = async (
  roleId: number,
): Promise<RoleRecord | null> => {
  const result =
    await query<RoleRecord>(
      `
        SELECT
          "RoleID" AS id,
          "RoleCode" AS code,
          "RoleName" AS name

        FROM "Roles"

        WHERE
          "RoleID" = $1

        LIMIT 1;
      `,
      [roleId],
    );

  return (
    result.rows[0] ??
    null
  );
};
