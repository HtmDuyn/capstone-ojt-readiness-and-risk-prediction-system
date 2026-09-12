import React from 'react';
import {
  DashboardGridIcon,
  RiskAnalyticsIcon,
  NotificationBellIcon,
} from '@/components/common/icons/AppIcons';
import { ShieldAlert, Users, Settings, Database, Activity } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan Admin',
    path: '/admin/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Trung tâm Quản trị Hệ thống',
      description: 'Giám sát hoạt động toàn hệ thống OJT, quản lý người dùng và cấu hình AI Engine.',
      badge: 'Quản trị viên cấp cao',
      primaryActionLabel: 'Kiểm tra bảo mật',
    },
  },
  {
    id: 'users',
    label: 'Quản lý tài khoản',
    path: '/admin/users',
    icon: <Users size={20} />,
    banner: {
      title: 'Quản lý Người dùng & Phân quyền',
      description: 'Phân quyền 5 nhóm người dùng: Sinh viên, PĐT, QHDN, Doanh nghiệp và Admin.',
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
      title: 'Chỉ số tải & Hoạt động AI Engine',
      description: 'Theo dõi tài nguyên server, thời gian phản hồi API và các tác vụ dự báo nền.',
      badge: 'Realtime Monitor',
      primaryActionLabel: 'Xem logs hệ thống',
    },
  },
  {
    id: 'data-sync',
    label: 'Đồng bộ dữ liệu',
    path: '/admin/data-sync',
    icon: <Database size={20} />,
    banner: {
      title: 'Đồng bộ Dữ liệu FPT Edu',
      description: 'Tích hợp và đồng bộ bảng điểm, tín chỉ từ hệ thống đào tạo trung ương.',
      badge: 'Sync Status: OK',
      primaryActionLabel: 'Chạy đồng bộ ngay',
    },
  },
  {
    id: 'ai-config',
    label: 'Cấu hình AI Engine',
    path: '/admin/ai-config',
    icon: <RiskAnalyticsIcon size={20} />,
    banner: {
      title: 'Cấu hình Ngưỡng Rủi ro & Mô hình AI',
      description: 'Điều chỉnh trọng số đánh giá rủi ro trượt môn và tiêu chí phân bổ OJT.',
      badge: 'Risk Model v2.4',
      primaryActionLabel: 'Hiệu chuẩn mô hình',
    },
  },
  {
    id: 'settings',
    label: 'Cài đặt hệ thống',
    path: '/admin/settings',
    icon: <Settings size={20} />,
    banner: {
      title: 'Cài đặt Chung',
      description: 'Cấu hình các tham số toàn cục của hệ thống OJT Readiness.',
      badge: 'System Settings',
      primaryActionLabel: 'Lưu thay đổi',
    },
  },
];
