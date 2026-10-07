import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  parseLoginInput,
} from "./auth.schema";

import {
  getUserById,
  loginUser,
  logoutUser,
} from "./auth.service";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      email,
      password,
    } = parseLoginInput(
      req.body,
    );

    const result =
      await loginUser(
        email,
        password,
      );

    res.status(200).json({
      success: true,
      message:
        "Login successful",
      token:
        result.token,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId =
      req.user?.userId;

    const user =
      await getUserById(
        userId,
      );

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
        id:
          user.id,

        username:
          user.username,

        email:
          user.email,

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

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId =
      req.user?.sessionId;

    if (!sessionId) {
      res.status(401).json({
        success: false,

        errorCode:
          "AUTH_REQUIRED",

        message:
          "Authentication required.",
      });

      return;
    }

    await logoutUser(
      sessionId,
    );

    res.status(200).json({
      success: true,

      message:
        "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};