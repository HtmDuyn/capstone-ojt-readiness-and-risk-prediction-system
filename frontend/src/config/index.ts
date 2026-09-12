import type { UserRole } from '@/types/auth.types';
import type { NavItem } from '@/types/common.types';
import { STUDENT_NAV_ITEMS } from './menus/studentMenu';
import { ADMIN_NAV_ITEMS } from './menus/adminMenu';
import { EDUCATION_NAV_ITEMS } from './menus/educationMenu';
import { ENTERPRISE_NAV_ITEMS } from './menus/enterpriseMenu';
import { QHDN_NAV_ITEMS } from './menus/qhdnMenu';

export * from './menus/studentMenu';
export * from './menus/adminMenu';
export * from './menus/educationMenu';
export * from './menus/enterpriseMenu';
export * from './menus/qhdnMenu';

export const ROLE_MENU_MAP: Record<UserRole, NavItem[]> = {
  student: STUDENT_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
  education: EDUCATION_NAV_ITEMS,
  enterprise: ENTERPRISE_NAV_ITEMS,
  qhdn: QHDN_NAV_ITEMS,
};

export const getMenuByRole = (role?: UserRole): NavItem[] => {
  if (!role || !ROLE_MENU_MAP[role]) {
    return STUDENT_NAV_ITEMS;
  }
  return ROLE_MENU_MAP[role];
};
