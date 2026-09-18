import React from 'react';
import {
  DashboardGridIcon,
} from '@/components/common/icons/AppIcons';
import { Briefcase, Users, CheckSquare, ClipboardCheck, AlertTriangle } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const ENTERPRISE_NAV_ITEMS: NavItem[] = [
  {
    id: 'enterprise-dashboard',
    label: 'Tổng quan Doanh nghiệp',
    path: '/enterprise/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quản lý Thực tập Doanh nghiệp Đối tác',
      description: 'Chào mừng Quý Doanh nghiệp. Quản lý tuyển dụng, tiếp nhận sinh viên FPT và theo dõi tiến độ OJT.',
      badge: 'FPT Partner Portal',
      primaryActionLabel: 'Đăng vị trí mới',
    },
  },
  {
    id: 'enterprise-jobs',
    label: 'Quản lý Vị trí Thực tập',
    path: '/enterprise/jobs',
    icon: <Briefcase size={20} />,
    banner: {
      title: 'Quản lý Vị trí & Chỉ tiêu Đón nhận OJT',
      description: 'Đăng tin tuyển dụng thực tập, cập nhật thông tin yêu cầu và số lượng chỉ tiêu cho từng vị trí.',
      badge: 'Vị trí Tuyển dụng',
      primaryActionLabel: '+ Tạo vị trí tuyển mới',
    },
  },
  {
    id: 'enterprise-candidates',
    label: 'Duyệt Hồ sơ Sinh viên',
    path: '/enterprise/candidates',
    icon: <Users size={20} />,
    banner: {
      title: 'Danh sách & Duyệt Hồ sơ Sinh viên Ứng tuyển',
      description: 'Xem CV, điểm khớp nối AI Matching, phỏng vấn và xác nhận hoặc từ chối tiếp nhận sinh viên.',
      badge: 'Xét duyệt OJT',
      primaryActionLabel: 'Duyệt nhanh danh sách',
    },
  },
  {
    id: 'enterprise-interns',
    label: 'Theo dõi & Giao Task',
    path: '/enterprise/interns',
    icon: <CheckSquare size={20} />,
    banner: {
      title: 'Giao Nhiệm vụ & Theo dõi Tiến độ Thực tập',
      description: 'Phân công mentor, giao việc tuần/tháng, kiểm tra điểm danh và theo dõi tiến độ công việc sinh viên.',
      badge: 'Quản lý Interns',
      primaryActionLabel: '+ Giao task mới',
    },
  },
  {
    id: 'enterprise-evaluation',
    label: 'Đánh giá Kết quả OJT',
    path: '/enterprise/evaluation',
    icon: <ClipboardCheck size={20} />,
    banner: {
      title: 'Đánh giá & Chấm điểm Kết thúc Thực tập',
      description: 'Chấm điểm kỹ thuật, thái độ, tính kỷ luật và kỹ năng mềm của sinh viên sau kỳ thực tập OJT.',
      badge: 'Chấm điểm OJT',
      primaryActionLabel: 'Tải phiếu đánh giá',
    },
  },
];
