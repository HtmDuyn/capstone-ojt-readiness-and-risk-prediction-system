import React from 'react';
import {
  DashboardGridIcon,
} from '@/components/common/icons/AppIcons';

import {
  Users,
  Settings,
  Activity,
  Bot,
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
      primaryActionLabel: 'Thêm tài khoản',
    },
  },

  {
    id: 'system-metrics',
    label: 'Giám sát hệ thống',
    path: '/admin/metrics',
    icon: <Activity size={20} />,
    banner: {
      title: 'Giám sát & Nhật ký hoạt động',
      description:
        'Tra cứu nhật ký thực tế và chi tiết thao tác trên hệ thống.',
      badge: 'Nhật ký hệ thống',
    },
  },

  {
    id: 'ai-config',
    label: 'Tích hợp AI tư vấn',
    path: '/admin/ai-config',
    icon: <Bot size={20} />,
    banner: {
      title: 'Tích hợp AI tư vấn',
      description:
        'Trạng thái tích hợp mô hình AI ngoài cho chức năng tư vấn.',
      badge: 'Chưa tích hợp',
    },
  },

  {
    id: 'settings',
    label: 'Cài đặt hệ thống',
    path: '/admin/settings',
    icon: <Settings size={20} />,
    banner: {
      title: 'Cài đặt Chung',
      description:
        'Cấu hình các tham số toàn cục của hệ thống OJT Readiness.',
      badge: 'System Settings',
    },
  },
];