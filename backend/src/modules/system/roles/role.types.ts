import type {
  RoleCode,
} from "../../auth/auth.types";

export interface RoleRecord {
  id: number;
  code: RoleCode;
  name: string;
}
