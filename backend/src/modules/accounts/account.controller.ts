import { personalAccountView } from './account.dto';
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  parseAccountListQuery,
  parseCreateAccountInput,
  parseUpdateAccountInput,
  parseUpdateOwnProfileInput,
} from "./account.schema";

import {
  createNewAccount,
  getAccounts,
  updateAccount,
  updateProfile,
} from "./account.service";

export const listAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result =
      await getAccounts(
        parseAccountListQuery(
          req.query,
        ),
      );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await createNewAccount(
        parseCreateAccountInput(
          req.body,
        ),
      );

    res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      account,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAccountById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await updateAccount(
        req.params.userId,
        parseUpdateAccountInput(
          req.body,
        ),
        req.user!.userId,
        req.user!.roleCode,
      );

    res.status(200).json({
      success: true,
      message:
        "Account updated successfully.",
      account,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await updateProfile(
        req.user!.userId,
        parseUpdateOwnProfileInput(
          req.body,
        ),
      );

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: personalAccountView(account),
    });
  } catch (error) {
    next(error);
  }
};