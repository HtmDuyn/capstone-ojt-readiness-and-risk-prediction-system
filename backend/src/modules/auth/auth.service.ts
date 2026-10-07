import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { authConfig } from "../../config/auth";
import { hashToken } from "../../utils/token";

import {
  findByEmail,
  findById,
} from "./auth.repository";

import {
  createSession,
  revokeAllSessionsByUserId,
  revokeSessionById,
} from "./session.repository";

import type {
  AuthError,
  AuthTokenPayload,
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

  /*
   * Mỗi lần login tạo SessionID mới.
   */
  const sessionId =
    crypto.randomUUID();

  /*
   * Tạo JWT.
   */
  const token =
    jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roleCode: user.role_code,
        sessionId,
      },
      authConfig.jwtSecret,
      {
        subject: String(user.id),
        expiresIn: authConfig.expiresIn,
      },
    );

  /*
   * Decode lại JWT để lấy chính xác
   * thời gian hết hạn do jsonwebtoken tạo.
   */
  const decoded =
    jwt.decode(
      token,
    ) as AuthTokenPayload | null;

  if (
    !decoded ||
    typeof decoded.exp !== "number"
  ) {
    throw new Error(
      "Unable to determine token expiration time.",
    );
  }

  const expiresAt =
    new Date(
      decoded.exp * 1000,
    );

  /*
   * DB không lưu JWT thật.
   * Chỉ lưu SHA-256 hash.
   */
  const tokenHash =
    hashToken(token);

  /*
   * Hệ thống chỉ cho phép
   * một active session / user.
   *
   * Login mới:
   * Session cũ -> revoked
   */
  await revokeAllSessionsByUserId(
    user.id,
  );

  /*
   * Tạo session mới.
   */
  await createSession(
    sessionId,
    user.id,
    tokenHash,
    expiresAt,
  );

  return {
    token,
  };
};

export const logoutUser = async (
  sessionId: string,
): Promise<void> => {
  if (!sessionId) {
    throw createAuthError(
      "Invalid authentication session.",
      401,
      "INVALID_SESSION",
    );
  }

  await revokeSessionById(
    sessionId,
  );
};