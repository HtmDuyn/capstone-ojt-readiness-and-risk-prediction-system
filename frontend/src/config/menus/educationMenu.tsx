import React from 'react';
import {
  DashboardGridIcon,
  RoadmapConsultingIcon,
} from '@/components/common/icons/AppIcons';

import {
  CalendarDays,
  Database,
  FileCheck,
  BookOpen,
  Upload,
  Users,
  ClipboardCheck,
  Activity,
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
// ĐỀ XUẤT LỚP HỖ TRỢ TỪ AI
// =========================
{
  id: 'ai-class-proposals',
  label: 'Đề xuất lớp hỗ trợ từ AI',
  path: '/education/ai-class-proposals',
  icon: <RoadmapConsultingIcon size={20} />,
  banner: {
    title: 'Đề xuất Lớp hỗ trợ từ AI',
    description:
      'Xem các đề xuất lớp hỗ trợ được AI hình thành từ dữ liệu học tập và mức nguy cơ của sinh viên.',
    badge: 'Phòng Đào tạo',
  },
},
];