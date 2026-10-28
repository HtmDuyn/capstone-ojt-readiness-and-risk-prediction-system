import type {
  AuthTokenPayload,
} from "../modules/auth/auth.types";

export interface AuthenticatedUser extends AuthTokenPayload {
  studentId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;

      token?: string;
    }
  }
}

export {};