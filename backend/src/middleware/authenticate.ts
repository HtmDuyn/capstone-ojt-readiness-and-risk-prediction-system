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
    req.headers.authorization ||
    "";

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
     * Kiểm tra session
     */
    const session =
      await findActiveSessionById(
        payload.sessionId,
      );

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
     * Kiểm tra session có đúng user hay không.
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
     * Kiểm tra token hiện tại
     * có đúng với token của session hay không.
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

    req.user =
      payload;

    req.token =
      token;

    next();
  } catch (error) {
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