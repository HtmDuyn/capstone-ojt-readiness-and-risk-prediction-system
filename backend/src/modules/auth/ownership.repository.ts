import {
  query,
} from "../../config/database";

interface StudentOwnershipRecord {
  student_id: number;
}

interface EnterpriseOwnershipRecord {
  enterprise_id: number;
}

/*
 * Tìm StudentID tương ứng với
 * tài khoản đang login.
 */
export const findStudentIdByUserId = async (
  userId: number,
): Promise<number | null> => {
  const result =
    await query<StudentOwnershipRecord>(
      `
        SELECT
          "StudentID" AS student_id

        FROM "Students"

        WHERE "UserID" = $1

        LIMIT 1;
      `,
      [userId],
    );

  return (
    result.rows[0]?.student_id ??
    null
  );
};

/*
 * Tìm EnterpriseID mà
 * enterprise user đang thuộc về.
 */
export const findEnterpriseIdByUserId =
  async (
    userId: number,
  ): Promise<number | null> => {
    const result =
      await query<EnterpriseOwnershipRecord>(
        `
          SELECT
            "EnterpriseID"
              AS enterprise_id

          FROM "EnterpriseUsers"

          WHERE "UserID" = $1

          LIMIT 1;
        `,
        [userId],
      );

    return (
      result.rows[0]?.enterprise_id ??
      null
    );
  };