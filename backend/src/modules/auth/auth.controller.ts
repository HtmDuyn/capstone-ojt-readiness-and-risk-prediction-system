import { getOwnProfile } from '../accounts/account.service';
import { personalAccountView } from '../accounts/account.dto';
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  parseLoginInput,
} from "./auth.schema";

import {
  loginUser,
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
      mustChangePassword: result.mustChangePassword,
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
      await getOwnProfile(
        userId!,
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

      user: personalAccountView(user),
    });
  } catch (error) {
    next(error);
  }
};
