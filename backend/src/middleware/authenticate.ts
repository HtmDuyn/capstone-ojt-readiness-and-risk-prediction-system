import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

import {
  authConfig,
} from "../config/auth";

import {
  findById,
} from "../modules/auth/auth.repository";

import {
  findActiveSessionById,
} from "../modules/auth/session.repository";

import type {
  AuthTokenPayload,
} from "../modules/auth/auth.types";

import {
  hashToken,
} from "../utils/token";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization =
    req.headers.authorization ?? "";

  /*
   * Authorization header phải có:
   *
   * Bearer <token>
   */
  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    res.status(401).json({
      success: false,

      errorCode:
        "AUTH_REQUIRED",

      message:
        "Authentication required. Please provide a bearer token.",
    });

    return;
  }

  /*
   * Lấy JWT.
   */
  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    res.status(401).json({
      success: false,

      errorCode:
        "AUTH_REQUIRED",

      message:
        "Authentication required. Please provide a bearer token.",
    });

    return;
  }

  try {
    /*
     * ==============================
     * 1. VERIFY JWT
     * ==============================
     */
    const decoded =
      jwt.verify(
        token,
        authConfig.jwtSecret,
      );

    if (
      typeof decoded ===
      "string"
    ) {
      res.status(401).json({
        success: false,

        errorCode:
          "INVALID_TOKEN",

        message:
          "Invalid authentication token.",
      });

      return;
    }

    const payload =
      decoded as AuthTokenPayload;

    /*
     * Token bắt buộc phải chứa:
     *
     * userId
     * sessionId
     */
    if (
      !payload.userId ||
      !payload.sessionId
    ) {
      res.status(401).json({
        success: false,

        errorCode:
          "INVALID_TOKEN",

        message:
          "Invalid authentication token.",
      });

      return;
    }

    /*
     * ==============================
     * 2. CHECK SESSION
     * ==============================
     */
    const session =
      await findActiveSessionById(
        payload.sessionId,
      );

    /*
     * Session:
     *
     * - không tồn tại
     * - đã revoke
     * - đã hết hạn
     *
     * đều không được phép tiếp tục.
     */
    if (!session) {
      res.status(401).json({
        success: false,

        errorCode:
          "TOKEN_REVOKED",

        message:
          "This session is no longer valid. Please login again.",
      });

      return;
    }

    /*
     * ==============================
     * 3. SESSION OWNERSHIP
     * ==============================
     *
     * Session phải thuộc đúng user
     * trong JWT.
     */
    if (
      session.user_id !==
      payload.userId
    ) {
      res.status(401).json({
        success: false,

        errorCode:
          "INVALID_SESSION",

        message:
          "Invalid authentication session.",
      });

      return;
    }

    /*
     * ==============================
     * 4. CHECK TOKEN HASH
     * ==============================
     *
     * Database chỉ lưu SHA-256 token.
     */
    const currentTokenHash =
      hashToken(token);

    if (
      currentTokenHash !==
      session.token_hash
    ) {
      res.status(401).json({
        success: false,

        errorCode:
          "INVALID_SESSION",

        message:
          "Invalid authentication session.",
      });

      return;
    }

    /*
     * ==============================
     * 5. GET CURRENT USER FROM DB
     * ==============================
     *
     * Không hoàn toàn tin status / role
     * được lưu trong JWT.
     *
     * Role và status có thể đã thay đổi
     * sau khi token được tạo.
     */
    const currentUser =
      await findById(
        payload.userId,
      );

    if (!currentUser) {
      res.status(401).json({
        success: false,

        errorCode:
          "USER_NOT_FOUND",

        message:
          "Authenticated user no longer exists.",
      });

      return;
    }

    /*
     * ==============================
     * 6. CHECK USER STATUS
     * ==============================
     */
    if (
      currentUser.status
        ?.toUpperCase() !==
      "ACTIVE"
    ) {
      res.status(403).json({
        success: false,

        errorCode:
          "ACCOUNT_INACTIVE",

        message:
          "This account is currently inactive or locked.",
      });

      return;
    }

    /*
     * ==============================
     * 7. SET CURRENT USER
     * ==============================
     *
     * roleCode lấy từ database hiện tại,
     * không dùng role cũ trong JWT.
     */
    req.user = {
      ...payload,

      userId:
        currentUser.id,

      username:
        currentUser.username,

      roleCode:
        currentUser.role_code,

      sessionId:
        payload.sessionId,
    };

    req.token =
      token;

    /*
     * Authentication thành công.
     */
    next();
  } catch (error) {
    /*
     * JWT hết hạn.
     */
    const expired =
      error instanceof
      jwt.TokenExpiredError;

    res.status(401).json({
      success: false,

      errorCode: expired
        ? "TOKEN_EXPIRED"
        : "INVALID_TOKEN",

      message: expired
        ? "Token expired. Please login again."
        : "Invalid authentication token.",
    });
  }
};