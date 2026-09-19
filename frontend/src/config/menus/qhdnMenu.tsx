import React from 'react';
import {
  DashboardGridIcon,
  OjtRegisterIcon,
  RoadmapConsultingIcon,
  EvaluationResultsIcon,
} from '@/components/common/icons/AppIcons';
import { Building2, Handshake, BarChart3, MailCheck } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const QHDN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan QHDN',
    path: '/qhdn/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quản lý Quan hệ Doanh nghiệp',
      description: 'Điều phối kết nối hợp tác doanh nghiệp, phân bổ sinh viên OJT và quản lý mạng lưới đối tác.',
      badge: 'Phòng QHDN',
      primaryActionLabel: 'Thêm doanh nghiệp đối tác',
    },
  },
  {
    id: 'partner-enterprises',
    label: 'Mạng lưới đối tác',
    path: '/qhdn/partners',
    icon: <Building2 size={20} />,
    banner: {
      title: 'Danh bạ Doanh nghiệp Đối tác Chiến lược',
      description: 'Quản lý thỏa thuận hợp tác MOU, chỉ tiêu tiếp nhận OJT và thông tin liên hệ đầu mối.',
      badge: 'Tier-1 & Tier-2',
      primaryActionLabel: 'Ký kết hợp tác mới',
    },
  },
  {
    id: 'ojt-matching',
    label: 'Điều phối & Ghép cặp OJT',
    path: '/qhdn/matching',
    icon: <Handshake size={20} />,
    banner: {
      title: 'AI Ghép cặp Nguyện vọng Sinh viên & Doanh nghiệp',
      description: 'Hệ thống gợi ý phân bổ sinh viên vào các vị trí thực tập phù hợp với năng lực kỹ thuật.',
      badge: 'AI Matching Engine',
      primaryActionLabel: 'Chạy phân bổ tự động',
    },
  },
  {
    id: 'interview-schedules',
    label: 'Lịch phỏng vấn OJT',
    path: '/qhdn/interviews',
    icon: <MailCheck size={20} />,
    banner: {
      title: 'Điều phối Lịch Phỏng vấn & Tiếp nhận',
      description: 'Theo dõi tiến trình phỏng vấn giữa nhà tuyển dụng và sinh viên kỳ này.',
      badge: 'Lịch tuần này',
      primaryActionLabel: 'Tạo ca phỏng vấn',
    },
  },
  {
    id: 'internship-analytics',
    label: 'Báo cáo thống kê OJT',
    path: '/qhdn/analytics',
    icon: <BarChart3 size={20} />,
    banner: {
      title: 'Thống kê Hiệu quả Thực tập Doanh nghiệp',
      description: 'Tỷ lệ sinh viên có việc làm sau OJT, mức độ hài lòng của doanh nghiệp đối tác.',
      badge: 'Báo cáo Thường niên',
      primaryActionLabel: 'Xuất báo cáo PDF',
    },
  },
];
