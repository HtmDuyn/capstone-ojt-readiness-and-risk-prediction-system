import React from 'react';
import {
  DashboardGridIcon,
} from '@/components/common/icons/AppIcons';

import {
  Users,
  Activity,
} from 'lucide-react';

import type { NavItem } from '@/types/common.types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan Admin',
    path: '/admin/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Trung tâm Quản trị Hệ thống',
      description:
        'Quản lý tài khoản, xem tổng quan dữ liệu và nhật ký hoạt động hệ thống.',
      badge: 'Quản trị viên cấp cao',
    },
  },

  {
    id: 'users',
    label: 'Quản lý tài khoản',
    path: '/admin/users',
    icon: <Users size={20} />,
    banner: {
      title: 'Quản lý Người dùng & Phân quyền',
      description:
        'Phân quyền 5 nhóm người dùng: Sinh viên, PĐT, QHDN, Doanh nghiệp và Admin.',
      badge: '5 Vai trò',
    },
  },

  {
    id: 'system-metrics',
    label: 'Giám sát hoạt động tài khoản',
    path: '/admin/metrics',
    icon: <Activity size={20} />,
    banner: {
      title: 'Giám sát hoạt động tài khoản',
      description:
        'Tra cứu nhật ký quản lý tài khoản và bảo mật tài khoản.',
      badge: 'Nhật ký tài khoản',
    },
  },

];
