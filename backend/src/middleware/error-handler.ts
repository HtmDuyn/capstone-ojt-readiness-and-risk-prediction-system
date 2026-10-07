import type {
  ErrorRequestHandler,
} from "express";

import { logger } from "../config/logger";

export const errorHandler: ErrorRequestHandler =
  (
    error,
    _req,
    res,
    _next,
  ) => {
    logger.error(error);

    const statusCode =
      typeof error?.statusCode ===
      "number"
        ? error.statusCode
        : 500;

    const errorCode =
      typeof error?.errorCode ===
      "string"
        ? error.errorCode
        : "INTERNAL_SERVER_ERROR";

    const message =
      error instanceof Error
        ? error.message
        : "Internal Server Error";

    res
      .status(statusCode)
      .json({
        success: false,

        errorCode,

        message:
          statusCode === 500
            ? "Internal Server Error"
            : message,
      });
  };