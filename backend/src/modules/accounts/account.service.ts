import bcrypt from "bcryptjs";

import type {
  RoleCode,
} from "../auth/auth.types";

import {
  findRoleById,
} from "../system/roles/role.repository";

import {
  createAccount,
  existsByEmail,
  existsByUsername,
  findAccountById,
  findAccounts,
  updateAccountByAdmin,
  updateAccountRole,
  updateAccountStatus,
  updateOwnProfile,
} from "./account.repository";

import type {
  AccountListResult,
  AccountRecord,
  CreateAccountInput,
  UpdateAccountInput,
  UpdateAccountRoleInput,
  UpdateAccountStatusInput,
  UpdateOwnProfileInput,
} from "./account.types";

const createError = (
  message: string,
  statusCode: number,
  errorCode: string,
) =>
  Object.assign(
    new Error(message),
    {
      statusCode,
      errorCode,
    },
  );

const parseId = (
  value: unknown,
): number => {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw createError(
      "Invalid ID.",
      400,
      "INVALID_ID",
    );
  }

  return id;
};

const normalizeRequiredString = (
  value: unknown,
  field: string,
): string => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw createError(
      `${field} is required.`,
      400,
      `MISSING_${field.toUpperCase()}`,
    );
  }

  return value.trim();
};

const normalizePhone = (
  value: unknown,
): string | null => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw createError(
      "Invalid phone number.",
      400,
      "INVALID_PHONE",
    );
  }

  return value.trim();
};

const normalizeEmail = (
  value: unknown,
): string => {
  const email =
    normalizeRequiredString(
      value,
      "email",
    ).toLowerCase();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw createError(
      "Invalid email address.",
      400,
      "INVALID_EMAIL",
    );
  }

  return email;
};

export const getAccounts = async (
  queryInput: {
    page?: unknown;
    limit?: unknown;
    search?: unknown;
    roleCode?: unknown;
    status?: unknown;
  },
): Promise<AccountListResult> => {
  const page =
    Math.max(
      1,
      Number(
        queryInput.page ?? 1,
      ) || 1,
    );

  const limit =
    Math.min(
      100,
      Math.max(
        1,
        Number(
          queryInput.limit ?? 20,
        ) || 20,
      ),
    );

  const search =
    typeof queryInput.search ===
    "string"
      ? queryInput.search.trim()
      : undefined;

  const roleCode =
    typeof queryInput.roleCode ===
    "string"
      ? queryInput.roleCode
          .trim()
          .toUpperCase()
      : undefined;

  const status =
    typeof queryInput.status ===
    "string"
      ? queryInput.status
          .trim()
          .toUpperCase()
      : undefined;

  return findAccounts(
    page,
    limit,
    search || undefined,
    roleCode || undefined,
    status || undefined,
  );
};

export const getAccountById = async (
  requestedUserId: unknown,
  currentUserId: number,
  currentRole: RoleCode | null,
): Promise<AccountRecord> => {
  const userId =
    parseId(
      requestedUserId,
    );

  if (
    currentRole !== "ADMIN" &&
    currentUserId !== userId
  ) {
    throw createError(
      "You may only access your own account.",
      403,
      "RESOURCE_FORBIDDEN",
    );
  }

  const account =
    await findAccountById(
      userId,
    );

  if (!account) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  return account;
};

export const createNewAccount = async (
  input: CreateAccountInput,
): Promise<AccountRecord> => {
  const username =
    normalizeRequiredString(
      input.username,
      "username",
    );

  const email =
    normalizeEmail(
      input.email,
    );

  const password =
    normalizeRequiredString(
      input.password,
      "password",
    );

  const fullName =
    normalizeRequiredString(
      input.fullName,
      "fullName",
    );

  const phone =
    normalizePhone(
      input.phone,
    );

  const roleId =
    parseId(
      input.roleId,
    );

  if (
    password.length < 8
  ) {
    throw createError(
      "Password must contain at least 8 characters.",
      400,
      "WEAK_PASSWORD",
    );
  }

  if (
    await existsByUsername(
      username,
    )
  ) {
    throw createError(
      "Username already exists.",
      409,
      "USERNAME_EXISTS",
    );
  }

  if (
    await existsByEmail(
      email,
    )
  ) {
    throw createError(
      "Email already exists.",
      409,
      "EMAIL_EXISTS",
    );
  }

  const role =
    await findRoleById(
      roleId,
    );

  if (!role) {
    throw createError(
      "Role not found.",
      404,
      "ROLE_NOT_FOUND",
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      10,
    );

  return createAccount(
    username,
    passwordHash,
    email,
    fullName,
    phone,
    roleId,
  );
};

export const updateAccount = async (
  requestedUserId: unknown,
  input: UpdateAccountInput,
  currentUserId: number,
  currentRole: RoleCode | null,
): Promise<AccountRecord> => {
  const userId =
    parseId(
      requestedUserId,
    );

  const existing =
    await findAccountById(
      userId,
    );

  if (!existing) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  const isAdmin =
    currentRole === "ADMIN";

  const isOwn =
    currentUserId === userId;

  if (!isAdmin && !isOwn) {
    throw createError(
      "You may only update your own account.",
      403,
      "RESOURCE_FORBIDDEN",
    );
  }

  /*
   * Non-admin không được đổi email
   * qua endpoint này.
   */
  if (
    !isAdmin &&
    input.email !== undefined
  ) {
    throw createError(
      "You are not allowed to change email through this endpoint.",
      403,
      "FIELD_FORBIDDEN",
    );
  }

  const fullName =
    input.fullName !== undefined
      ? normalizeRequiredString(
          input.fullName,
          "fullName",
        )
      : existing.full_name;

  const phone =
    input.phone !== undefined
      ? normalizePhone(
          input.phone,
        )
      : existing.phone;

  if (isAdmin) {
    const email =
      input.email !== undefined
        ? normalizeEmail(
            input.email,
          )
        : existing.email;

    if (
      email !==
        existing.email.toLowerCase() &&
      await existsByEmail(
        email,
        userId,
      )
    ) {
      throw createError(
        "Email already exists.",
        409,
        "EMAIL_EXISTS",
      );
    }

    await updateAccountByAdmin(
      userId,
      fullName,
      phone,
      email,
    );
  } else {
    await updateOwnProfile(
      userId,
      fullName,
      phone,
    );
  }

  return (
    await findAccountById(
      userId,
    )
  )!;
};

export const getOwnProfile = async (
  userId: number,
): Promise<AccountRecord> => {
  const account =
    await findAccountById(
      userId,
    );

  if (!account) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  return account;
};

export const updateProfile = async (
  userId: number,
  input: UpdateOwnProfileInput,
): Promise<AccountRecord> => {
  const existing =
    await findAccountById(
      userId,
    );

  if (!existing) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  const fullName =
    input.fullName !== undefined
      ? normalizeRequiredString(
          input.fullName,
          "fullName",
        )
      : existing.full_name;

  const phone =
    input.phone !== undefined
      ? normalizePhone(
          input.phone,
        )
      : existing.phone;

  await updateOwnProfile(
    userId,
    fullName,
    phone,
  );

  return (
    await findAccountById(
      userId,
    )
  )!;
};

export const changeAccountStatus = async (
  requestedUserId: unknown,
  input: UpdateAccountStatusInput,
  currentUserId: number,
): Promise<AccountRecord> => {
  const userId =
    parseId(
      requestedUserId,
    );

  const status =
    normalizeRequiredString(
      input.status,
      "status",
    ).toUpperCase();

  const allowed =
    [
      "ACTIVE",
      "LOCKED",
      "INACTIVE",
    ];

  if (
    !allowed.includes(
      status,
    )
  ) {
    throw createError(
      "Invalid account status.",
      400,
      "INVALID_STATUS",
    );
  }

  /*
   * Tránh Admin tự khóa tài khoản
   * đang sử dụng.
   */
  if (
    userId === currentUserId &&
    status !== "ACTIVE"
  ) {
    throw createError(
      "You cannot deactivate your current account.",
      400,
      "SELF_STATUS_CHANGE_NOT_ALLOWED",
    );
  }

  const existing =
    await findAccountById(
      userId,
    );

  if (!existing) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  await updateAccountStatus(
    userId,
    status,
  );

  return (
    await findAccountById(
      userId,
    )
  )!;
};

export const changeAccountRole = async (
  requestedUserId: unknown,
  input: UpdateAccountRoleInput,
  currentUserId: number,
): Promise<AccountRecord> => {
  const userId =
    parseId(
      requestedUserId,
    );

  const roleId =
    parseId(
      input.roleId,
    );

  if (
    userId ===
    currentUserId
  ) {
    throw createError(
      "You cannot change your own role.",
      400,
      "SELF_ROLE_CHANGE_NOT_ALLOWED",
    );
  }

  const existing =
    await findAccountById(
      userId,
    );

  if (!existing) {
    throw createError(
      "Account not found.",
      404,
      "ACCOUNT_NOT_FOUND",
    );
  }

  const role =
    await findRoleById(
      roleId,
    );

  if (!role) {
    throw createError(
      "Role not found.",
      404,
      "ROLE_NOT_FOUND",
    );
  }

  await updateAccountRole(
    userId,
    roleId,
  );

  return (
    await findAccountById(
      userId,
    )
  )!;
};