import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type {
  RoleCode,
} from "../modules/auth/auth.types";

export const authorizeRoles = (
  ...allowedRoles: RoleCode[]
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const user =
      req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        errorCode: "AUTH_REQUIRED",
        message:
          "Authentication required.",
      });

      return;
    }

    if (
      !user.roleCode ||
      !allowedRoles.includes(
        user.roleCode,
      )
    ) {
      res.status(403).json({
        success: false,
        errorCode: "FORBIDDEN",
        message:
          "You do not have permission to access this resource.",
      });

      return;
    }

    next();
  };
};