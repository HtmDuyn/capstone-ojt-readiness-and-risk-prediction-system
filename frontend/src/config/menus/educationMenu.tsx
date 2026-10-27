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
  Activity,
  ClipboardCheck,
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
    label: 'Quản lý học vụ',
    path: '',
    icon: <Database size={20} />,
    children: [
      {
        id: 'academic-year',
        label: 'Năm học và học kỳ',
        path: '/education/academic-year',
        icon: <CalendarDays size={20} />,
        banner: {
          title: 'Quản lý năm học và học kỳ',
          description:
            'Quản lý năm học và lịch học kỳ; Phòng QHDN phụ trách mở đợt đăng ký OJT.',
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
  // QUẢN LÝ OJT
  // =========================
  {
    id: 'ojt-management',
    label: 'Quản lý OJT',
    path: '',
    icon: <CalendarDays size={20} />,
    children: [
      {
        id: 'ojt-conditions',
        label: 'Xét điều kiện và danh sách',
        path: '/education/ojt-conditions',
        icon: <FileCheck size={20} />,
        banner: {
          title: 'Xét điều kiện đi OJT',
          description: 'Quy tắc chung: từ 70 tín chỉ, tối đa 2 môn còn rớt. Lọc danh sách theo kết quả xét.',
          badge: 'Phòng Đào tạo',
        },
      },
      {
        id: 'ojt-handoff',
        label: 'Bàn giao OJT',
        path: '/education/ojt-handoff',
        icon: <Users size={20} />,
        banner: {
          title: 'Bàn giao OJT',
          description: 'Bàn giao danh sách sinh viên đủ điều kiện và theo dõi lịch sử bàn giao.',
          badge: 'Quản lý OJT',
        },
      },
      {
        id: 'ojt-final-results',
        label: 'Kết quả OJT cuối kỳ',
        path: '/education/ojt-final-results',
        icon: <ClipboardCheck size={20} />,
        banner: {
          title: 'Cập nhật Kết quả OJT Cuối kỳ',
          description:
            'Xem kết quả do Phòng Quan hệ Doanh nghiệp chuyển sang và xác nhận kết quả OJT chính thức của sinh viên.',
          badge: 'Quản lý OJT',
        },
      },
    ],
  },

  // =========================
  // ĐỀ XUẤT LỚP HỖ TRỢ TỪ AI
  // =========================
  {
    id: 'ai-class-proposals',
    label: 'Nhu cầu lớp hỗ trợ',
    path: '/education/ai-class-proposals',
    icon: <RoadmapConsultingIcon size={20} />,
    banner: {
      title: 'Nhu cầu lớp hỗ trợ',
      description:
        'Xem nhu cầu học phần từ hồ sơ học tập và điều kiện OJT để cân nhắc mở lớp hỗ trợ.',
      badge: 'Phòng Đào tạo',
    },
  },
];
