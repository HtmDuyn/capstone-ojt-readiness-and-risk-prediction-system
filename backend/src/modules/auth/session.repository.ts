import {
  query,
} from "../../config/database";

import type {
  UserSessionRecord,
} from "./session.types";

export const createSession = async (
  sessionId: string,
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<UserSessionRecord> => {
  const result =
    await query<UserSessionRecord>(
      `
        INSERT INTO "UserSessions" (
          "SessionID",
          "UserID",
          "TokenHash",
          "ExpiresAt"
        )

        VALUES ($1, $2, $3, $4)

        RETURNING
          "SessionID" AS session_id,
          "UserID" AS user_id,
          "TokenHash" AS token_hash,
          "CreatedAt" AS created_at,
          "ExpiresAt" AS expires_at,
          "RevokedAt" AS revoked_at;
      `,
      [
        sessionId,
        userId,
        tokenHash,
        expiresAt,
      ],
    );

  const session =
    result.rows[0];

  if (!session) {
    throw new Error(
      "Unable to create user session.",
    );
  }

  return session;
};

export const findActiveSessionById = async (
  sessionId: string,
): Promise<UserSessionRecord | null> => {
  const result =
    await query<UserSessionRecord>(
      `
        SELECT
          "SessionID" AS session_id,
          "UserID" AS user_id,
          "TokenHash" AS token_hash,
          "CreatedAt" AS created_at,
          "ExpiresAt" AS expires_at,
          "RevokedAt" AS revoked_at

        FROM "UserSessions"

        WHERE "SessionID" = $1
          AND "RevokedAt" IS NULL
          AND "ExpiresAt" > NOW()

        LIMIT 1;
      `,
      [sessionId],
    );

  return result.rows[0] ?? null;
};

export const revokeAllSessionsByUserId = async (
  userId: number,
): Promise<void> => {
  await query(
    `
      UPDATE "UserSessions"

      SET "RevokedAt" = NOW()

      WHERE "UserID" = $1
        AND "RevokedAt" IS NULL;
    `,
    [userId],
  );
};

export const revokeSessionById = async (
  sessionId: string,
): Promise<void> => {
  await query(
    `
      UPDATE "UserSessions"

      SET "RevokedAt" = NOW()

      WHERE "SessionID" = $1
        AND "RevokedAt" IS NULL;
    `,
    [sessionId],
  );
};