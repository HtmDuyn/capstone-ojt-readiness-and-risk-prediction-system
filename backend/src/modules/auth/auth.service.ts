import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { authConfig } from "../../config/auth";
import { query } from "../../config/database";

import {
  findByEmail,
  findById,
} from "./auth.repository";

import type {
  AuthError,
  AuthUserRecord,
} from "./auth.types";

const createAuthError = (
  message: string,
  statusCode: number,
  errorCode: string,
): AuthError => {
  return Object.assign(
    new Error(message),
    {
      statusCode,
      errorCode,
    },
  );
};

export const verifyPassword = async (
  inputPassword: string,
  storedHash: string,
): Promise<boolean> => {
  if (
    !inputPassword ||
    !storedHash
  ) {
    return false;
  }

  try {
    return await bcrypt.compare(
      inputPassword,
      storedHash,
    );
  } catch {
    return false;
  }
};

export const getUserById = async (
  userId: unknown,
): Promise<AuthUserRecord | null> => {
  const id = Number(userId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return findById(id);
};

export const loginUser = async (
  email: unknown,
  password: unknown,
): Promise<{
  token: string;
  mustChangePassword: boolean;
}> => {
  /*
   * Validate email.
   */
  const safeEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  /*
   * Không trim password vì khoảng trắng
   * có thể là một phần của password.
   */
  const safePassword =
    typeof password === "string"
      ? password
      : "";

  if (!safeEmail) {
    throw createAuthError(
      "Email is required.",
      400,
      "MISSING_EMAIL",
    );
  }

  if (!safePassword) {
    throw createAuthError(
      "Password is required.",
      400,
      "MISSING_PASSWORD",
    );
  }

  /*
   * Tìm user theo email.
   */
  const user =
    await findByEmail(
      safeEmail,
    );

  /*
   * Không tiết lộ email có tồn tại hay không.
   */
  if (!user) {
    throw createAuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  /*
   * Chỉ tài khoản ACTIVE được login.
   */
  if (
    user.status?.toUpperCase() !==
    "ACTIVE"
  ) {
    throw createAuthError(
      "This account is currently inactive or locked.",
      403,
      "ACCOUNT_INACTIVE",
    );
  }

  /*
   * Verify bcrypt password.
   */
  const passwordValid =
    await verifyPassword(
      safePassword,
      user.password_hash,
    );

  if (!passwordValid) {
    throw createAuthError(
      "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  if (user.must_change_password && (!user.temporary_password_expires_at || new Date(user.temporary_password_expires_at).getTime() <= Date.now())) {
    throw createAuthError('Temporary password expired. Contact your importing department.', 403, 'TEMPORARY_PASSWORD_EXPIRED');
  }

  const token =
    jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleCode: user.role_code,
        authVersion: user.auth_version,
      },
      authConfig.jwtSecret,
      {
        subject: String(user.id),
        expiresIn: authConfig.expiresIn,
      },
    );

  return {
    token,
    mustChangePassword: user.must_change_password,
  };
};

export async function changePassword(userId: number, currentPassword: unknown, newPassword: unknown) {
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    throw createAuthError('New password must have at least 12 characters and at most 72 UTF-8 bytes.', 400, 'INVALID_PASSWORD');
  }
  const user = await findById(userId);
  if (!user || !await verifyPassword(currentPassword, user.password_hash)) throw createAuthError('Current password is incorrect.', 401, 'INVALID_CREDENTIALS');
  if (await verifyPassword(newPassword, user.password_hash)) throw createAuthError('New password must differ from current password.', 400, 'PASSWORD_UNCHANGED');
  const hash = await bcrypt.hash(newPassword, 12);
  const result = await query(`WITH changed AS (UPDATE "Users" SET "PasswordHash"=$2,"MustChangePassword"=false,
    "TemporaryPasswordExpiresAt"=NULL,"PasswordChangedAt"=now(),"UpdatedAt"=now(),"AuthVersion"="AuthVersion"+1
    WHERE "UserID"=$1 AND "PasswordHash"=$3 AND "Status"='ACTIVE'
    AND (NOT "MustChangePassword" OR "TemporaryPasswordExpiresAt">now()) RETURNING "UserID"),
    cancelled AS (UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL
      WHERE "UserID" IN (SELECT "UserID" FROM changed) AND "Status"<>'SENT')
    SELECT "UserID" FROM changed`, [userId, hash, user.password_hash]);
  if (!result.rowCount) throw createAuthError('Account changed or temporary password expired. Please login again.', 409, 'ACCOUNT_CHANGED');
}
