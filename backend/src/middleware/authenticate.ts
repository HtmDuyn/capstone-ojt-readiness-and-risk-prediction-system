import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

import { authConfig } from "../config/auth";

import type {
  AuthTokenPayload,
} from "../modules/auth/auth.types";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    res.status(401).json({
      success: false,

      errorCode: "AUTH_REQUIRED",

      message:
        "Authentication required. Please provide a bearer token.",
    });

    return;
  }

  const token = authorization
    .slice(7)
    .trim();

  if (!token) {
    res.status(401).json({
      success: false,

      errorCode: "AUTH_REQUIRED",

      message:
        "Authentication required. Please provide a bearer token.",
    });

    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      authConfig.jwtSecret,
    );

    if (
      typeof decoded === "string"
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
      !payload.username
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

    req.user = payload;

    req.token = token;

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