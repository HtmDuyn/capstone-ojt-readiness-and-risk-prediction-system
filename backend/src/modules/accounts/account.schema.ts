import type {
  AccountListQuery,
  CreateAccountInput,
  UpdateAccountInput,
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

export const parseUpdateAccountInput = (input: unknown): UpdateAccountInput => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error('Invalid account update.'), {statusCode:400,errorCode:'INVALID_ACCOUNT_INPUT'});
  const body = input as Record<string, unknown>;
  const allowed = ['fullName','phone','email','status','roleId'];
  if (Object.keys(body).some(key => !allowed.includes(key)) || !allowed.some(key => body[key] !== undefined)) throw Object.assign(new Error('Provide only account fields to update.'), {statusCode:400,errorCode:'INVALID_ACCOUNT_INPUT'});
  return Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key,body[key]]));
};

export const parseUpdateOwnProfileInput = (
  input: unknown,
): UpdateOwnProfileInput => {
  if(!input||typeof input!=='object'||Array.isArray(input))throw Object.assign(new Error('Provide a JSON object.'),{statusCode:400,errorCode:'INVALID_PROFILE_INPUT'});
  const body=input as Record<string,unknown>,allowed=['fullName','phone'];
  if(Object.keys(body).some(key=>!allowed.includes(key))||!Object.keys(body).some(key=>key!=='companyId'&&body[key]!==undefined))throw Object.assign(new Error('Provide supported profile fields to update.'),{statusCode:400,errorCode:'INVALID_PROFILE_INPUT'});
  return body;

};

export const parseAccountListQuery = (
  input: unknown,
): AccountListQuery => {
  const query =
    asObject(input);

  return {
    userId: query.userId,
    search:
      query.search,
    roleCode:
      query.roleCode,
  };
};
