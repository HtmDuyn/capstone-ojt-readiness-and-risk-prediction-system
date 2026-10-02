import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { authConfig } from "../../config/auth";

import {
  findById,
  findByIdentifier,
} from "./auth.repository";

import type {
  AuthError,
  AuthUserRecord,
  PublicUser,
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

const toPublicUser = (
  user: AuthUserRecord,
): PublicUser => ({
  id: user.id,

  username: user.username,

  email: user.email,

  fullName: user.full_name,

  status: user.status,

  roleCode: user.role_code,

  roleName: user.role_name,
});

export const verifyPassword = async (
  inputPassword: string,
  storedHash: string,
): Promise<boolean> => {
  if (!inputPassword || !storedHash) {
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
  username: unknown,
  password: unknown,
): Promise<{
  token: string;
  user: PublicUser;
}> => {
  const safeUsername =
    typeof username === "string"
      ? username.trim()
      : "";

  const safePassword =
    typeof password === "string"
      ? password
      : "";

  if (!safeUsername) {
    throw createAuthError(
      "Username or email is required.",
      400,
      "MISSING_USERNAME",
    );
  }

  if (!safePassword) {
    throw createAuthError(
      "Password is required.",
      400,
      "MISSING_PASSWORD",
    );
  }

  const user =
    await findByIdentifier(
      safeUsername,
    );

  /*
   * Không trả USER_NOT_FOUND.
   * Tránh để người ngoài biết account có tồn tại hay không.
   */
  if (!user) {
    throw createAuthError(
      "Invalid username/email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  /*
   * Kiểm tra trạng thái account.
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

  const passwordValid =
    await verifyPassword(
      safePassword,
      user.password_hash,
    );

  if (!passwordValid) {
    throw createAuthError(
      "Invalid username/email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,

      username: user.username,

      roleCode: user.role_code,
    },

    authConfig.jwtSecret,

    {
      subject: String(user.id),

      expiresIn:
        authConfig.accessTokenExpiresIn,
    },
  );

  return {
    token,

    user: toPublicUser(user),
  };
};