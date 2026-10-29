import React from 'react';
import {
  DashboardGridIcon,
  AcademicCapIcon,
  RiskAnalyticsIcon,
  OjtRegisterIcon,
  InternshipProgressIcon,
  EvaluationResultsIcon,
  NotificationBellIcon,
} from '@/components/common/icons/AppIcons';
import type { NavItem, BannerPreset } from '@/types/common.types';

export type StudentMenuItem = NavItem;

export const STUDENT_NAV_ITEMS: StudentMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: (name) => `Chào mừng bạn trở lại, ${name}!`,
      description: (
        <>
          Theo dõi tiến độ chương trình đào tạo và trạng thái OJT từ dữ liệu học vụ.
        </>
      ),
      primaryActionLabel: 'Đăng ký OJT',
      defaultAiPrompt: 'Cổng đăng ký OJT sẽ mở tiếp nhận hồ sơ doanh nghiệp khi nào?',
    },
  },
  {
    id: 'academic-profile',
    label: 'Hồ sơ học tập',
    path: '/student/academic-profile',
    icon: <AcademicCapIcon size={20} />,
    banner: {
      title: 'Hồ sơ học tập sinh viên',
      description: (
        <>
          Tổng hợp tín chỉ tích lũy, bảng điểm và chương trình đào tạo của bạn.
        </>
      ),
      primaryActionLabel: 'Tư vấn lộ trình AI',
      defaultAiPrompt: 'Tôi muốn tư vấn tối ưu lộ trình môn học và điều kiện OJT cho kỳ học sắp tới.',
    },
  },
  {
    id: 'risk-prediction',
    label: 'Phân tích & tư vấn OJT',
    path: '/student/risk-prediction',
    icon: <RiskAnalyticsIcon size={20} />,
    banner: {
      title: 'Phân tích học vụ & tư vấn OJT',
      description: (
        <>
          Đối chiếu điều kiện OJT và xem các môn cần bổ sung theo dữ liệu học vụ.
        </>
      ),
      primaryActionLabel: 'Phân tích rủi ro ngay',
      defaultAiPrompt: 'Hãy phân tích chi tiết các nguy cơ trượt kỳ và đề xuất giải pháp phòng ngừa cho tôi.',
    },
  },
  {
    id: 'ojt-registration',
    label: 'OJT & hồ sơ ứng tuyển',
    path: '/student/ojt-registration',
    icon: <OjtRegisterIcon size={20} />,
    banner: {
      title: 'Cổng đăng ký thực tập doanh nghiệp (OJT)',
      description: (
        <>
          Đăng ký nguyện vọng, lựa chọn doanh nghiệp phù hợp và theo dõi tiến độ xét duyệt hồ sơ thực tập từ nhà trường.
        </>
      ),
      primaryActionLabel: 'Nộp nguyện vọng OJT',
      defaultAiPrompt: 'Hướng dẫn quy trình và các giấy tờ cần thiết để nộp hồ sơ đăng ký OJT.',
    },
  },

  {
    id: 'internship-progress',
    label: 'Nhiệm vụ thực tập',
    path: '/student/internship-progress',
    icon: <InternshipProgressIcon size={20} />,
    banner: {
      title: 'Theo dõi tiến độ thực tập doanh nghiệp',
      description: (
        <>
          Nhận nhiệm vụ từ doanh nghiệp, nộp bài làm và theo dõi trạng thái xử lý.
        </>
      ),
      primaryActionLabel: 'Xem nhiệm vụ',
      defaultAiPrompt: 'Cách viết báo cáo tiến độ OJT hàng tuần chuẩn xác và đạt điểm cao.',
    },
  },
  {
    id: 'evaluation-results',
    label: 'Kết quả đánh giá',
    path: '/student/evaluation-results',
    icon: <EvaluationResultsIcon size={20} />,
    banner: {
      title: 'Kết quả đánh giá OJT & Báo cáo tốt nghiệp',
      description: (
        <>
          Xem điểm số chi tiết từ Mentor doanh nghiệp, Giảng viên hướng dẫn và nhận chứng nhận hoàn thành kỳ thực tập OJT.
        </>
      ),
      primaryActionLabel: 'Xem bảng điểm OJT',
      defaultAiPrompt: 'Tiêu chí đánh giá điểm thực tập doanh nghiệp OJT gồm những tiêu chuẩn nào?',
    },
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    path: '/student/notifications',
    icon: <NotificationBellIcon size={20} />,
    hasBadge: true,
    badgeDot: true,
    banner: {
      title: 'Trung tâm thông báo sinh viên',
      description: (
        <>
          Cập nhật kịp thời các thông báo học vụ, lịch phỏng vấn doanh nghiệp và cảnh báo quan trọng từ cố vấn AI.
        </>
      ),
      primaryActionLabel: 'Đánh dấu đã đọc',
      defaultAiPrompt: 'Tóm tắt các thông báo quan trọng nhất trong tuần qua cho tôi.',
    },
  },
];

export const getStudentMenuItemById = (id?: string): StudentMenuItem | undefined => {
  if (!id) return undefined;
  return STUDENT_NAV_ITEMS.find((item) => item.id === id);
};

export const getStudentMenuItemByPath = (pathname: string): StudentMenuItem | undefined => {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  return STUDENT_NAV_ITEMS.find((item) => {
    if (cleanPath === item.path) return true;
    if (item.id === 'dashboard' && (cleanPath === '/dashboard' || cleanPath === '/dashboard/student' || cleanPath === '/student/dashboard')) return true;
    if (item.id === 'academic-profile' && (cleanPath === '/academic-profile' || cleanPath === '/dashboard/academic-profile' || cleanPath === '/student/academic-profile')) return true;
    if (cleanPath === `/student/${item.id}`) return true;
    if (cleanPath === `/${item.id}`) return true;
    return false;
  });
};
