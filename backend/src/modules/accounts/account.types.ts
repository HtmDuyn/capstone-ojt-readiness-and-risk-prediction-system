import type {
  RoleCode,
} from "../auth/auth.types";

export interface AccountRecord {
  mustChangePassword: boolean;
  studentId: number | null;
  enterpriseId: number | null;
  id: number;
  username: string;
  email: string;
  phone: string | null;
  full_name: string;
  status: string;
  role_id: number;
  role_code: RoleCode;
  role_name: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface CreateAccountInput {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  phone?: unknown;
  roleId?: unknown;
}

export interface UpdateAccountInput {
  status?: unknown;
  roleId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
}

export interface UpdateOwnProfileInput {
  fullName?: unknown;
  phone?: unknown;
}

export interface AccountListQuery {
  userId?: unknown;
  page?: unknown;
  limit?: unknown;
  search?: unknown;
  roleCode?: unknown;
  status?: unknown;
}

export interface AccountListResult {
  data: AccountRecord[];
  total: number;
  page: number;
  limit: number;
}
