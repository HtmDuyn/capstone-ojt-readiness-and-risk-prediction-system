import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getUserById,
  loginUser,
} from "./auth.service";

import { parseLoginInput } from "./auth.schema";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      username,
      password,
    } = parseLoginInput(
      req.body,
    );

    const result =
      await loginUser(
        username,
        password,
      );

    res.status(200).json({
      success: true,

      message:
        "Login successful",

      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId =
        req.user?.userId ||
        req.user?.sub;

      const user =
        await getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,

          errorCode:
            "USER_NOT_FOUND",

          message:
            "Authenticated user not found.",
        });

        return;
      }

      /*
       * Nếu account bị khóa sau khi token được tạo
       * thì API /me cũng không cho sử dụng tiếp.
       */
      if (
        user.status?.toUpperCase() !==
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

      res.status(200).json({
        success: true,

        message:
          "User profile retrieved successfully",

        user: {
          id: user.id,

          username:
            user.username,

          email: user.email,

          fullName:
            user.full_name,

          status:
            user.status,

          roleCode:
            user.role_code,

          roleName:
            user.role_name,
        },
      });
    } catch (error) {
      next(error);
    }
  };