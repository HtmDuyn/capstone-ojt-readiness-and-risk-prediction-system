import type { JwtPayload } from "jsonwebtoken";

export interface AuthUserRecord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: string;
  password_hash: string;
  role_code: string | null;
  role_name: string | null;
}

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

export interface AuthError extends Error {
  statusCode: number;
  errorCode: string;
}

export interface AuthTokenPayload extends JwtPayload {
  userId: number;
  username: string;
  roleCode: string | null;
  sessionId: string;
}