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
  parseUpdateRoleInput,
  parseUpdateStatusInput,
} from "./account.schema";

import {
  changeAccountRole,
  changeAccountStatus,
  createNewAccount,
  getAccountById,
  getAccounts,
  getOwnProfile,
  updateAccount,
  updateProfile,
} from "./account.service";

export const listAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const allowed: string[] = [];
    if (Object.keys(req.query).some(key => !allowed.includes(key))) {
      res.status(400).json({success:false,errorCode:'INVALID_ACCOUNT_SEARCH',message:'Unknown account query parameter.'});
      return;
    }
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

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await getAccountById(
        req.params.userId,
        req.user!.userId,
        req.user!.roleCode,
      );

    res.status(200).json({
      success: true,
      account,
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
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.query).length) {
      res.status(400).json({success:false,errorCode:'INVALID_ACCOUNT_INPUT',message:'Provide userId and account fields in a JSON object body.'});
      return;
    }
    const {userId, ...fields} = req.body;
    const account =
      await updateAccount(
        userId,
        parseUpdateAccountInput(
          fields,
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

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await changeAccountStatus(
        req.params.userId,
        parseUpdateStatusInput(
          req.body,
        ),
        req.user!.userId,
      );

    res.status(200).json({
      success: true,
      message:
        "Account status updated successfully.",
      account,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await changeAccountRole(
        req.params.userId,
        parseUpdateRoleInput(
          req.body,
        ),
        req.user!.userId,
      );

    res.status(200).json({
      success: true,
      message:
        "Account role updated successfully.",
      account,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const account =
      await getOwnProfile(
        req.user!.userId,
      );

    res.status(200).json({
      success: true,
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
      account,
    });
  } catch (error) {
    next(error);
  }
};
