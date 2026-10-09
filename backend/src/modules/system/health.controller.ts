import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getHealthStatus,
} from "./health.service";

export const getHealth =
  async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const health =
        await getHealthStatus();

      res
        .status(200)
        .json({
          success: true,

          message:
            "OJT Backend is running",

          timestamp:
            new Date(),

          ...health,
        });
    } catch (error) {
      next(error);
    }
  };