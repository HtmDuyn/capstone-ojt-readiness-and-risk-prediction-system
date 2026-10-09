import type {
  AccountListQuery,
  CreateAccountInput,
  UpdateAccountInput,
  UpdateAccountRoleInput,
  UpdateAccountStatusInput,
  UpdateOwnProfileInput,
} from "./account.types";

const asObject = (
  value: unknown,
): Record<string, unknown> => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {};
  }

  return value as Record<
    string,
    unknown
  >;
};

export const parseCreateAccountInput = (
  input: unknown,
): CreateAccountInput => {
  const body =
    asObject(input);

  return {
    username:
      body.username,
    email:
      body.email,
    password:
      body.password,
    fullName:
      body.fullName,
    phone:
      body.phone,
    roleId:
      body.roleId,
  };
};

export const parseUpdateAccountInput = (
  input: unknown,
): UpdateAccountInput => {
  const body =
    asObject(input);

  return {
    fullName:
      body.fullName,
    phone:
      body.phone,
    email:
      body.email,
  };
};

export const parseUpdateOwnProfileInput = (
  input: unknown,
): UpdateOwnProfileInput => {
  const body =
    asObject(input);

  return {
    fullName:
      body.fullName,
    phone:
      body.phone,
  };
};

export const parseUpdateStatusInput = (
  input: unknown,
): UpdateAccountStatusInput => {
  const body =
    asObject(input);

  return {
    status:
      body.status,
  };
};

export const parseUpdateRoleInput = (
  input: unknown,
): UpdateAccountRoleInput => {
  const body =
    asObject(input);

  return {
    roleId:
      body.roleId,
  };
};

export const parseAccountListQuery = (
  input: unknown,
): AccountListQuery => {
  const query =
    asObject(input);

  return {
    page:
      query.page,
    limit:
      query.limit,
    search:
      query.search,
    roleCode:
      query.roleCode,
    status:
      query.status,
  };
};