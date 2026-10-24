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

import type {
  AuthTokenPayload,
} from "../modules/auth/auth.types";

// Reuse only within the same request, for the same target and credentials.
const verifiedRequests = new WeakMap<Request, { user: Request['user']; authorization: string; method: string; url: string }>();
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization =
    req.headers.authorization ?? "";
  const verified = verifiedRequests.get(req);
  if (verified && verified.user === req.user && verified.authorization === authorization
    && verified.method === req.method && verified.url === req.originalUrl) {
    next();
    return;
  }

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

    if (!payload.userId) {
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
     * 2. GET CURRENT USER FROM DB
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
     * 3. CHECK USER STATUS
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
     * 4. SET CURRENT USER
     * ==============================
     *
     * roleCode lấy từ database hiện tại,
     * không dùng role cũ trong JWT.
     */
    if ((payload.authVersion ?? 0) !== currentUser.auth_version) {
      res.status(401).json({ success: false, errorCode: 'TOKEN_REVOKED', message: 'Please login again.' });
      return;
    }
    if (currentUser.must_change_password) {
      if (!currentUser.temporary_password_expires_at || new Date(currentUser.temporary_password_expires_at).getTime() <= Date.now()) {
        res.status(403).json({ success: false, errorCode: 'TEMPORARY_PASSWORD_EXPIRED', message: 'Temporary password expired. Contact your importing department.' });
        return;
      }
      const allowed = (req.method === 'POST' && ['/api/auth/change-password', '/api/auth/logout', '/api/student/auth/change-password', '/api/student/auth/me/search'].includes(req.originalUrl.split('?')[0]))
        || (req.method === 'GET' && req.originalUrl.split('?')[0] === '/api/auth/me');
      if (!allowed) {
        res.status(403).json({ success: false, errorCode: 'PASSWORD_CHANGE_REQUIRED', message: 'Change your temporary password first.' });
        return;
      }
    }
    req.user = {
      ...payload,

      userId:
        currentUser.id,

      username:
        currentUser.username,

      roleCode:
        currentUser.role_code,
      studentId: currentUser.studentId,
    };

    req.token =
      token;
    verifiedRequests.set(req, { user: req.user, authorization, method: req.method, url: req.originalUrl });

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
