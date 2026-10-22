import bcrypt from "bcryptjs";

import type {
  RoleCode,
} from "../auth/auth.types";

import {
  findRoleById,
} from "../system/roles/role.repository";

import {
  accountTransaction,
  createAccount,
  existsByEmail,
  existsByUsername,
  findAccountById,
  findAccounts,
} from "./account.repository";

import type {
  AccountListResult,
  AccountRecord,
  CreateAccountInput,
  UpdateAccountInput,
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
    (typeof value!=="number" && !(typeof value==="string" && /^[1-9]\d*$/.test(value))) ||
    !Number.isInteger(id) ||
    id <= 0 || id > 2147483647
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
    userId?: unknown;
    search?: unknown;
    roleCode?: unknown;
  },
): Promise<AccountListResult> => {

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

  return findAccounts(
    search || undefined,
    roleCode || undefined,
    queryInput.userId===undefined?undefined:parseId(queryInput.userId),
  );
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

  if (['STUDENT','ENTERPRISE'].includes(role.code)) throw createError('Student and enterprise accounts must be created through import.',403,'IMPORT_REQUIRED');

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
  requestedUserId: unknown, input: UpdateAccountInput, currentUserId: number, currentRole: RoleCode | null,
): Promise<AccountRecord> => {
  if (currentRole !== 'ADMIN') throw createError('Use your own profile endpoint to update personal information.',403,'RESOURCE_FORBIDDEN');
  const userId = parseId(requestedUserId);
  if (!Object.values(input).some(value => value !== undefined)) throw createError('Provide at least one field to update.',400,'INVALID_ACCOUNT_INPUT');
  return accountTransaction(async client => {
    await client.query('SELECT "UserID" FROM "Users" WHERE "UserID"=$1 FOR UPDATE',[userId]);
    const existing = await findAccountById(userId,client);
    if (!existing) throw createError('Account not found.',404,'ACCOUNT_NOT_FOUND');
    const fullName = input.fullName !== undefined ? normalizeRequiredString(input.fullName,'fullName') : existing.full_name;
    const phone = input.phone !== undefined ? normalizePhone(input.phone) : existing.phone;
    const email = input.email !== undefined ? normalizeEmail(input.email) : existing.email;
    const status = input.status !== undefined ? normalizeRequiredString(input.status,'status').toUpperCase() : existing.status;
    const roleId = input.roleId !== undefined ? parseId(input.roleId) : existing.role_id;
    if (!['ACTIVE','LOCKED','INACTIVE'].includes(status)) throw createError('Invalid account status.',400,'INVALID_STATUS');
    if (userId === currentUserId && status !== 'ACTIVE') throw createError('You cannot deactivate your current account.',400,'SELF_STATUS_CHANGE_NOT_ALLOWED');
    if (userId === currentUserId && roleId !== existing.role_id) throw createError('You cannot change your own role.',400,'SELF_ROLE_CHANGE_NOT_ALLOWED');
    const role = (await client.query('SELECT "RoleCode" AS code FROM "Roles" WHERE "RoleID"=$1',[roleId])).rows[0];
    if (!role) throw createError('Role not found.',404,'ROLE_NOT_FOUND');
    if (roleId !== existing.role_id && ['STUDENT','ENTERPRISE'].includes(role.code)) throw createError('Use import to provision student or enterprise identities.',403,'IMPORT_REQUIRED');
    if ((existing.studentId !== null && role.code !== 'STUDENT') || (existing.enterpriseId !== null && role.code !== 'ENTERPRISE')) throw createError('Role conflicts with the linked student or enterprise profile.',409,'ROLE_PROFILE_CONFLICT');
    if ((await client.query('SELECT 1 FROM "Users" WHERE LOWER("Email")=LOWER($1) AND "UserID"<>$2',[email,userId])).rowCount) throw createError('Email already exists.',409,'EMAIL_EXISTS');
    await client.query('UPDATE "Users" SET "FullName"=$2,"Phone"=$3,"Email"=$4,"Status"=$5::varchar,"RoleID"=$6::int, "AuthVersion"="AuthVersion" + CASE WHEN "Status" IS DISTINCT FROM $5::varchar OR "RoleID" IS DISTINCT FROM $6::int THEN 1 ELSE 0 END, "UpdatedAt"=CURRENT_TIMESTAMP WHERE "UserID"=$1',[userId,fullName,phone,email,status,roleId]);
    return (await findAccountById(userId,client))!;
  });
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

export const updateProfile = async (userId:number,input:UpdateOwnProfileInput):Promise<AccountRecord> => accountTransaction(async client=>{
 await client.query('SELECT "UserID" FROM "Users" WHERE "UserID"=$1 FOR UPDATE',[userId]);
 const existing=await findAccountById(userId,client);
 if(!existing)throw createError('Account not found.',404,'ACCOUNT_NOT_FOUND');
 const fields:Record<string,unknown>={};
 if(input.fullName!==undefined){fields.FullName=normalizeRequiredString(input.fullName,'fullName');if(String(fields.FullName).length>150)throw createError('fullName must not exceed 150 characters.',400,'INVALID_PROFILE_INPUT');}
 if(input.phone!==undefined){fields.Phone=normalizePhone(input.phone);if(String(fields.Phone??'').length>20)throw createError('phone must not exceed 20 characters.',400,'INVALID_PROFILE_INPUT');}
 const keys=Object.keys(fields);
 if(!keys.length)throw createError('Provide personal profile fields to update.',400,'INVALID_PROFILE_INPUT');
 await client.query('UPDATE "Users" SET '+keys.map((key,i)=>'"'+key+'"=$'+(i+2)).join(',')+',"UpdatedAt"=CURRENT_TIMESTAMP WHERE "UserID"=$1',[userId,...Object.values(fields)]);
 return (await findAccountById(userId,client))!;
});
