import type { LoginInput } from "./auth.types";

export const parseLoginInput = (
  input: unknown,
): LoginInput => {
  if (
    !input ||
    typeof input !== "object"
  ) {
    return {};
  }

  const body =
    input as Record<string, unknown>;

  return {
    email: body.email,
    password: body.password,
  };
};