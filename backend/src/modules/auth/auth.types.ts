import type { JwtPayload } from "jsonwebtoken";

export type RoleCode =
  | "ADMIN"
  | "ACADEMIC"
  | "OJT_COORD"
  | "STUDENT"
  | "ENTERPRISE";

export interface AuthUserRecord {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: string;
  password_hash: string;
  must_change_password: boolean;
  temporary_password_expires_at: Date | null;
  auth_version: number;
  role_code: RoleCode | null;
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
  authVersion: number;
  userId: number;
  username: string;
  roleCode: RoleCode | null;
}
