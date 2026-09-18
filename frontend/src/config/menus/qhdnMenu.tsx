import React from 'react';
import {
  DashboardGridIcon,
} from '@/components/common/icons/AppIcons';
import { Building2, Handshake, Award } from 'lucide-react';
import type { NavItem } from '@/types/common.types';

export const QHDN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan & Thống kê',
    path: '/qhdn/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: 'Cổng Quan hệ Doanh nghiệp',
      description: 'Theo dõi chỉ số tiếp nhận OJT, phản hồi của doanh nghiệp đối tác và thống kê theo từng học kỳ.',
      badge: 'Phòng QHDN',
      primaryActionLabel: 'Xuất báo cáo OJT',
    },
  },
  {
    id: 'enterprises',
    label: 'Quản lý Doanh nghiệp',
    path: '/qhdn/enterprises',
    icon: <Building2 size={20} />,
    banner: {
      title: 'Quản lý Doanh nghiệp & Vị trí Thực tập',
      description: 'Quản lý danh sách doanh nghiệp liên kết, vị trí thực tập tuyển dụng và chỉ tiêu số lượng tiếp nhận (quota).',
      badge: 'Đối tác & Quota',
      primaryActionLabel: 'Thêm doanh nghiệp mới',
    },
  },
  {
    id: 'coordination',
    label: 'Điều phối OJT',
    path: '/qhdn/coordination',
    icon: <Handshake size={20} />,
    banner: {
      title: 'Điều phối & Ghép cặp Sinh viên OJT',
      description: 'Nhận danh sách sinh viên đủ điều kiện từ PĐT, phân bổ sinh viên vào doanh nghiệp và xử lý điều phối lại sinh viên bị từ chối.',
      badge: 'Luồng Điều phối',
      primaryActionLabel: 'Điều phối tự động',
    },
  },
  {
    id: 'evaluations',
    label: 'Đánh giá từ Doanh nghiệp',
    path: '/qhdn/evaluations',
    icon: <Award size={20} />,
    banner: {
      title: 'Xem Đánh giá Thực tập Doanh nghiệp',
      description: 'Tổng hợp kết quả đánh giá kỹ năng chuyên môn, thái độ và điểm thực tập OJT từ người hướng dẫn doanh nghiệp.',
      badge: 'Kết quả OJT',
      primaryActionLabel: 'Tải bảng đánh giá',
    },
  },
];
