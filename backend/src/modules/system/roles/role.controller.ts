import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getRoles,
} from "./role.service";

export const listRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const roles =
      await getRoles();

    res.status(200).json({
      success: true,
      roles,
    });
  } catch (error) {
    next(error);
  }
};
