import React from 'react';
import {
  DashboardGridIcon,
  BriefcaseIcon,
  EvaluationResultsIcon,
  InternshipProgressIcon,
} from '@/components/common/icons/AppIcons';
import { Users, FileText, Award } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const ENTERPRISE_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan Doanh nghiệp',
    path: '/enterprise/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quản lý Tiếp nhận Thực tập Doanh nghiệp',
      description: 'Quản lý tin tuyển dụng OJT, tiếp nhận hồ sơ CV ứng viên và chấm điểm thực tập.',
      badge: 'Đối tác Doanh nghiệp',
      primaryActionLabel: 'Đăng vị trí OJT mới',
    },
  },
  {
    id: 'job-postings',
    label: 'Vị trí tuyển dụng OJT',
    path: '/enterprise/jobs',
    icon: <BriefcaseIcon size={20} />,
    banner: {
      title: 'Quản lý Vị trí Tuyển thực tập sinh',
      description: 'Đăng tin tuyển thực tập, yêu cầu kỹ năng công nghệ và số lượng chỉ tiêu tiếp nhận.',
      badge: 'Tuyển dụng Kỳ Fall',
      primaryActionLabel: 'Tạo Job mới',
    },
  },
  {
    id: 'candidate-applications',
    label: 'Hồ sơ ứng viên (CV)',
    path: '/enterprise/candidates',
    icon: <Users size={20} />,
    banner: {
      title: 'Duyệt Hồ sơ & Phỏng vấn Sinh viên',
      description: 'Xem CV điện tử, phân tích mức độ tương thích kỹ năng AI và xếp lịch phỏng vấn.',
      badge: 'AI Candidate Matching',
      primaryActionLabel: 'Duyệt nhanh CV',
    },
  },
  {
    id: 'interns-tracking',
    label: 'Theo dõi sinh viên thực tập',
    path: '/enterprise/interns',
    icon: <InternshipProgressIcon size={20} />,
    banner: {
      title: 'Quản lý Tiến độ Thực tập sinh',
      description: 'Phân công Mentor, theo dõi báo cáo công việc định kỳ theo từng tuần.',
      badge: 'Đang thực tập',
      primaryActionLabel: 'Xem báo cáo tuần',
    },
  },
  {
    id: 'performance-eval',
    label: 'Đánh giá kết quả OJT',
    path: '/enterprise/evaluation',
    icon: <EvaluationResultsIcon size={20} />,
    banner: {
      title: 'Chấm điểm & Đánh giá Cuối kỳ OJT',
      description: 'Biểu mẫu đánh giá năng lực làm việc, thái độ và cấp phiếu chứng nhận hoàn thành.',
      badge: 'Đánh giá Mentor',
      primaryActionLabel: 'Chấm điểm sinh viên',
    },
  },
];
