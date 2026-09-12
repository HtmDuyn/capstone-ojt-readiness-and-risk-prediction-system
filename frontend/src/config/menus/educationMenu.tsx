import React from 'react';
import {
  DashboardGridIcon,
  AcademicCapIcon,
  RiskAnalyticsIcon,
  RoadmapConsultingIcon,
} from '@/components/common/icons/AppIcons';
import { FileCheck, BookOpen, AlertTriangle, GraduationCap } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const EDUCATION_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan Đào tạo',
    path: '/education/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quản lý Học vụ & Điều kiện OJT',
      description: 'Giám sát tiến độ học tập toàn khóa, xét duyệt điều kiện tín chỉ và cảnh báo học vụ.',
      badge: 'Phòng Đào tạo (PĐT)',
      primaryActionLabel: 'Xét duyệt đợt mới',
    },
  },
  {
    id: 'ojt-eligibility',
    label: 'Xét điều kiện OJT',
    path: '/education/ojt-eligibility',
    icon: <FileCheck size={20} />,
    banner: {
      title: 'Xét duyệt Điều kiện Sinh viên đi OJT',
      description: 'Kiểm tra chuẩn đầu ra tiếng Anh, số tín chỉ tích lũy và các môn tiên quyết bắt buộc.',
      badge: 'Kỳ Fall 2024',
      primaryActionLabel: 'Duyệt danh sách',
    },
  },
  {
    id: 'academic-alerts',
    label: 'Cảnh báo rủi ro học vụ',
    path: '/education/academic-alerts',
    icon: <AlertTriangle size={20} />,
    banner: {
      title: 'Phân tích AI Cảnh báo Học vụ',
      description: 'Danh sách sinh viên có nguy cơ trễ tiến độ hoặc nợ môn tiên quyết OJT.',
      badge: 'AI Detection Engine',
      primaryActionLabel: 'Gửi cảnh báo',
    },
  },
  {
    id: 'curriculum-plan',
    label: 'Khung chương trình',
    path: '/education/curriculum-plan',
    icon: <BookOpen size={20} />,
    banner: {
      title: 'Quản lý Khung Chương trình Đào tạo',
      description: 'Cấu hình lộ trình môn học, điều kiện tiên quyết theo từng chuyên ngành.',
      badge: 'KTPM • ATTT • IA',
      primaryActionLabel: 'Cập nhật khung',
    },
  },
  {
    id: 'graduation-review',
    label: 'Xét tốt nghiệp',
    path: '/education/graduation-review',
    icon: <GraduationCap size={20} />,
    banner: {
      title: 'Xét Tốt nghiệp & Hoàn tất Capstone',
      description: 'Tổng hợp điểm OJT, đồ án tốt nghiệp và xét công nhận chuẩn đầu ra.',
      badge: 'Tốt nghiệp Đợt 2',
      primaryActionLabel: 'Xuất danh sách',
    },
  },
];
