import React from 'react';
import {
  DashboardGridIcon,
  RiskAnalyticsIcon,
  RoadmapConsultingIcon,
} from '@/components/common/icons/AppIcons';

import {
  CalendarDays,
  Database,
  FileCheck,
  BookOpen,
  AlertTriangle,
  Upload,
  Users,
  ClipboardCheck,
  Activity,
  Bell,
  School,
} from 'lucide-react';

import type { NavItem } from '@/types/common.types';

export const EDUCATION_NAV_ITEMS: NavItem[] = [
  // =========================
  // DASHBOARD
  // =========================
  {
    id: 'dashboard',
    label: 'Tổng quan Đào tạo',
    path: '/education/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quản lý Học vụ & Điều kiện OJT',
      description:
        'Xem Dashboard tổng quan, theo dõi Risk và thống kê tình trạng đủ/chưa đủ điều kiện OJT.',
      badge: 'Phòng Đào tạo (PĐT)',
    },
  },

  // =========================
  // QUẢN LÝ DỮ LIỆU
  // =========================
  {
    id: 'data-management',
    label: 'Quản lý dữ liệu',
    path: '',
    icon: <Database size={20} />,
    children: [
      {
        id: 'academic-year',
        label: 'Khởi tạo năm học',
        path: '/education/academic-year',
        icon: <CalendarDays size={20} />,
        banner: {
          title: 'Khởi tạo Năm học',
          description:
            'Quản lý và khởi tạo năm học cho hệ thống OJT.',
          badge: 'Quản lý dữ liệu',
        },
      },
      {
        id: 'student-import',
        label: 'Import dữ liệu sinh viên',
        path: '/education/student-import',
        icon: <Upload size={20} />,
        banner: {
          title: 'Import Dữ liệu Sinh viên',
          description:
            'Import dữ liệu sinh viên phục vụ quản lý và xét điều kiện OJT.',
          badge: 'Quản lý dữ liệu',
        },
      },
      {
        id: 'curriculum-plan',
        label: 'Quản lý chương trình đào tạo',
        path: '/education/curriculum-plan',
        icon: <BookOpen size={20} />,
        banner: {
          title: 'Quản lý Chương trình Đào tạo',
          description:
            'Quản lý chương trình đào tạo phục vụ theo dõi tiến độ và điều kiện OJT.',
          badge: 'Quản lý dữ liệu',
        },
      },
      {
        id: 'ojt-conditions',
        label: 'Quản lý điều kiện OJT',
        path: '/education/ojt-conditions',
        icon: <FileCheck size={20} />,
        banner: {
          title: 'Quản lý Điều kiện OJT',
          description:
            'Quản lý các điều kiện cần thiết để sinh viên đủ điều kiện tham gia OJT.',
          badge: 'Quản lý dữ liệu',
        },
      },
    ],
  },

  // =========================
  // QUẢN LÝ SINH VIÊN
  // =========================
  {
    id: 'student-management',
    label: 'Quản lý sinh viên',
    path: '',
    icon: <Users size={20} />,
    children: [
      {
        id: 'student-progress',
        label: 'Theo dõi tiến độ học tập',
        path: '/education/student-progress',
        icon: <Activity size={20} />,
        banner: {
          title: 'Theo dõi Tiến độ Học tập',
          description:
            'Theo dõi tiến độ học tập của sinh viên phục vụ quá trình OJT.',
          badge: 'Quản lý sinh viên',
        },
      },
      {
        id: 'ojt-eligibility',
        label: 'Kiểm tra điều kiện OJT',
        path: '/education/ojt-eligibility',
        icon: <ClipboardCheck size={20} />,
        banner: {
          title: 'Kiểm tra Điều kiện OJT',
          description:
            'Kiểm tra tình trạng đủ hoặc chưa đủ điều kiện OJT của sinh viên.',
          badge: 'Quản lý sinh viên',
        },
      },
      {
        id: 'ojt-application-review',
        label: 'Duyệt hồ sơ đăng ký OJT',
        path: '/education/ojt-application-review',
        icon: <FileCheck size={20} />,
        banner: {
          title: 'Duyệt Hồ sơ Đăng ký OJT',
          description:
            'Xem và duyệt hồ sơ đăng ký OJT của sinh viên.',
          badge: 'Quản lý sinh viên',
        },
      },
      {
        id: 'student-status',
        label: 'Theo dõi trạng thái sinh viên',
        path: '/education/student-status',
        icon: <Users size={20} />,
        banner: {
          title: 'Theo dõi Trạng thái Sinh viên',
          description:
            'Theo dõi trạng thái của sinh viên trong quá trình OJT.',
          badge: 'Quản lý sinh viên',
        },
      },
    ],
  },

  // =========================
  // AI & DASHBOARD
  // =========================
  {
    id: 'ai-dashboard',
    label: 'AI & Dashboard',
    path: '',
    icon: <RiskAnalyticsIcon size={20} />,
    children: [
      {
        id: 'risk-students',
        label: 'Sinh viên theo Risk',
        path: '/education/risk-students',
        icon: <RiskAnalyticsIcon size={20} />,
        banner: {
          title: 'Danh sách Sinh viên theo Risk',
          description:
            'Xem danh sách sinh viên được phân loại theo mức độ Risk.',
          badge: 'AI & Dashboard',
        },
      },
      {
        id: 'risk-alerts',
        label: 'Cảnh báo sinh viên nguy cơ cao',
        path: '/education/risk-alerts',
        icon: <AlertTriangle size={20} />,
        banner: {
          title: 'Cảnh báo Sinh viên Nguy cơ cao',
          description:
            'Theo dõi các sinh viên có nguy cơ cao được hệ thống cảnh báo.',
          badge: 'AI & Dashboard',
        },
      },
      {
        id: 'ojt-statistics',
        label: 'Thống kê điều kiện OJT',
        path: '/education/ojt-statistics',
        icon: <Database size={20} />,
        banner: {
          title: 'Thống kê Điều kiện OJT',
          description:
            'Theo dõi thống kê sinh viên đủ và chưa đủ điều kiện OJT.',
          badge: 'AI & Dashboard',
        },
      },
    ],
  },

  // =========================
  // QUẢN LÝ LỚP HỖ TRỢ
  // =========================
  {
    id: 'support-class-management',
    label: 'Quản lý lớp hỗ trợ',
    path: '',
    icon: <School size={20} />,
    children: [
      {
        id: 'ai-class-proposals',
        label: 'Đề xuất mở lớp từ AI',
        path: '/education/ai-class-proposals',
        icon: <RoadmapConsultingIcon size={20} />,
        banner: {
          title: 'Đề xuất Mở lớp từ AI',
          description:
            'Xem các đề xuất mở lớp hỗ trợ được AI đưa ra.',
          badge: 'Lớp hỗ trợ',
        },
      },
      {
        id: 'support-classes',
        label: 'Tạo lớp học hỗ trợ',
        path: '/education/support-classes',
        icon: <School size={20} />,
        banner: {
          title: 'Tạo Lớp học Hỗ trợ',
          description:
            'Tạo lớp học hỗ trợ cho sinh viên theo nhu cầu.',
          badge: 'Lớp hỗ trợ',
        },
      },
      {
        id: 'class-notifications',
        label: 'Thông báo mở lớp',
        path: '/education/class-notifications',
        icon: <Bell size={20} />,
        banner: {
          title: 'Thông báo Mở lớp',
          description:
            'Gửi thông báo về các lớp học hỗ trợ được mở.',
          badge: 'Lớp hỗ trợ',
        },
      },
      {
        id: 'class-students',
        label: 'Danh sách sinh viên đăng ký lớp',
        path: '/education/class-students',
        icon: <Users size={20} />,
        banner: {
          title: 'Danh sách Sinh viên Đăng ký Lớp',
          description:
            'Quản lý danh sách sinh viên đăng ký các lớp học hỗ trợ.',
          badge: 'Lớp hỗ trợ',
        },
      },
    ],
  },
];