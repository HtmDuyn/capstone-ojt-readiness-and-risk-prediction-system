import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  findEnterpriseIdByUserId,
  findStudentIdByUserId,
} from "../modules/auth/ownership.repository";

import type {
  RoleCode,
} from "../modules/auth/auth.types";

const parsePositiveInteger = (
  value: unknown,
): number | null => {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
};

/*
 * STUDENT:
 * chỉ được truy cập StudentID của chính mình.
 *
 * Các role staff truyền vào bypass ownership.
 */
export const requireStudentOwnership = (
  ...bypassRoles: RoleCode[]
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user =
        req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          errorCode:
            "AUTH_REQUIRED",
          message:
            "Authentication required.",
        });

        return;
      }

      /*
       * ADMIN / ACADEMIC / OJT_COORD
       * có thể được cho phép xem student khác.
       */
      if (
        user.roleCode &&
        bypassRoles.includes(
          user.roleCode,
        )
      ) {
        next();
        return;
      }

      if (
        user.roleCode !==
        "STUDENT"
      ) {
        res.status(403).json({
          success: false,
          errorCode:
            "FORBIDDEN",
          message:
            "You do not have permission to access this student.",
        });

        return;
      }

      const requestedStudentId =
        parsePositiveInteger(
          req.params.studentId,
        );

      if (!requestedStudentId) {
        res.status(400).json({
          success: false,
          errorCode:
            "INVALID_STUDENT_ID",
          message:
            "Invalid student ID.",
        });

        return;
      }

      const ownStudentId =
        await findStudentIdByUserId(
          user.userId,
        );

      if (!ownStudentId) {
        res.status(403).json({
          success: false,
          errorCode:
            "STUDENT_PROFILE_NOT_FOUND",
          message:
            "Student profile is not associated with this account.",
        });

        return;
      }

      if (
        ownStudentId !==
        requestedStudentId
      ) {
        res.status(403).json({
          success: false,
          errorCode:
            "RESOURCE_FORBIDDEN",
          message:
            "You may only access your own student data.",
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/*
 * ENTERPRISE:
 * chỉ được thao tác EnterpriseID
 * mà account đó thuộc về.
 */
export const requireEnterpriseOwnership = (
  ...bypassRoles: RoleCode[]
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user =
        req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          errorCode:
            "AUTH_REQUIRED",
          message:
            "Authentication required.",
        });

        return;
      }

      /*
       * ADMIN / OJT_COORD
       * có thể bypass ownership.
       */
      if (
        user.roleCode &&
        bypassRoles.includes(
          user.roleCode,
        )
      ) {
        next();
        return;
      }

      if (
        user.roleCode !==
        "ENTERPRISE"
      ) {
        res.status(403).json({
          success: false,
          errorCode:
            "FORBIDDEN",
          message:
            "You do not have permission to access this enterprise.",
        });

        return;
      }

      const requestedEnterpriseId =
        parsePositiveInteger(
          req.params.enterpriseId,
        );

      if (!requestedEnterpriseId) {
        res.status(400).json({
          success: false,
          errorCode:
            "INVALID_ENTERPRISE_ID",
          message:
            "Invalid enterprise ID.",
        });

        return;
      }

      const ownEnterpriseId =
        await findEnterpriseIdByUserId(
          user.userId,
        );

      if (!ownEnterpriseId) {
        res.status(403).json({
          success: false,
          errorCode:
            "ENTERPRISE_PROFILE_NOT_FOUND",
          message:
            "Enterprise profile is not associated with this account.",
        });

        return;
      }

      if (
        ownEnterpriseId !==
        requestedEnterpriseId
      ) {
        res.status(403).json({
          success: false,
          errorCode:
            "RESOURCE_FORBIDDEN",
          message:
            "You may only access data belonging to your enterprise.",
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};