import type { SignOptions } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not configured. Please set JWT_SECRET in environment variables.",
  );
}

export const authConfig = {
  jwtSecret,

  expiresIn:
    (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
};