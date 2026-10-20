import { findRoles } from "./role.repository";

export const getRoles = async () => {
  return findRoles();
};
