import React from 'react';
import {
  DashboardGridIcon,
  AcademicCapIcon,
  RiskAnalyticsIcon,
  OjtRegisterIcon,
  NotificationBellIcon,
  EvaluationResultsIcon,
  RoadmapConsultingIcon,
  InternshipProgressIcon,
} from '../components/dashboard/icons/DashboardIcons';

export interface TrainingDepartmentMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
  badgeDot?: boolean;
  banner: {
    title: string | ((displayName: string) => string);
    description: React.ReactNode;
    badge?: string;
    primaryActionLabel?: string;
    defaultAiPrompt?: string;
  };
}

export const TRAINING_DEPARTMENT_NAV_ITEMS: TrainingDepartmentMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/training-department',
    icon: <DashboardGridIcon size={20} />,
    banner: {
      title: (name) => `Chào mừng bạn trở lại, ${name}!`,
      description: (
        <>
          Hệ thống đang theo dõi <span className="font-bold text-amber-300">1,284</span> sinh viên và <span className="font-bold text-amber-300">92</span> đợt OJT đang triển khai.
        </>
      ),
      badge: 'PĐT • Kỳ Fall 2025',
      primaryActionLabel: 'Xem báo cáo tổng quan',
      defaultAiPrompt: 'Cho tôi tổng hợp báo cáo nhanh về tình trạng OJT và sinh viên cần hỗ trợ trong kỳ này.',
    },
  },
  {
    id: 'student-management',
    label: 'Sinh viên',
    path: '/training-department/students',
    icon: <AcademicCapIcon size={20} />,
    banner: {
      title: 'Quản lý sinh viên & hồ sơ học tập',
      description: (
        <>
          Theo dõi tiến độ tích lũy tín chỉ, điều kiện đủ điều kiện thực tập và các trường hợp cần cảnh báo học vụ.
        </>
      ),
      badge: '1,284 sinh viên',
      primaryActionLabel: 'Xem danh sách sinh viên',
      defaultAiPrompt: 'Phân tích sinh viên nào đang ở rủi ro học vụ hoặc thiếu điều kiện OJT trong đợt này.',
    },
  },
  {
    id: 'monitoring',
    label: 'Giám sát',
    path: '/training-department/monitoring',
    icon: <RiskAnalyticsIcon size={20} />,
    banner: {
      title: 'Giám sát tiến độ & rủi ro',
      description: (
        <>
          Theo dõi nguy cơ học vụ, quá hạn nộp hồ sơ và tỷ lệ tham gia các đợt thực tập theo chuyên ngành.
        </>
      ),
      badge: 'AI cảnh báo • 17 trường hợp',
      primaryActionLabel: 'Xem cảnh báo AI',
      defaultAiPrompt: 'Liệt kê những sinh viên cần can thiệp sớm theo rủi ro học tập và OJT.',
    },
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    path: '/training-department/reports',
    icon: <RoadmapConsultingIcon size={20} />,
    banner: {
      title: 'Báo cáo học vụ & OJT',
      description: (
        <>
          Tổng hợp thống kê đầu vào, độ hoàn thành chương trình, hiệu quả đối tác doanh nghiệp và báo cáo định kỳ cho ban giám hiệu.
        </>
      ),
      badge: 'Báo cáo tháng',
      primaryActionLabel: 'Tạo báo cáo',
      defaultAiPrompt: 'Tạo báo cáo tổng hợp tình hình OJT, tỷ lệ hoàn thành và các điểm cần cải thiện tháng này.',
    },
  },
  {
    id: 'ojt-requests',
    label: 'Yêu cầu OJT',
    path: '/training-department/ojt-requests',
    icon: <OjtRegisterIcon size={20} />,
    banner: {
      title: 'Xét duyệt hồ sơ OJT',
      description: (
        <>
          Quản lý danh sách sinh viên đăng ký OJT, theo dõi trạng thái xét duyệt và hỗ trợ doanh nghiệp đối tác.
        </>
      ),
      badge: '316 hồ sơ mới',
      primaryActionLabel: 'Duyệt hồ sơ',
      defaultAiPrompt: 'Hãy lọc các hồ sơ OJT cần xét duyệt nhanh theo ngành, tiêu chí và thời hạn.',
    },
  },
  {
    id: 'internship-progress',
    label: 'Tiến độ thực tập',
    path: '/training-department/ojt-progress',
    icon: <InternshipProgressIcon size={20} />,
    banner: {
      title: 'Theo dõi tiến độ thực tập doanh nghiệp',
      description: (
        <>
          Đánh giá tiến độ, nhắc nhở sinh viên cập nhật nhật ký và cảnh báo chậm tiến độ thực tập theo đợt.
        </>
      ),
      badge: '92 doanh nghiệp',
      primaryActionLabel: 'Xem tiến độ',
      defaultAiPrompt: 'Tôi cần báo cáo tiến độ thực tập của sinh viên theo doanh nghiệp và đợt triển khai.',
    },
  },
  {
    id: 'evaluations',
    label: 'Đánh giá',
    path: '/training-department/evaluations',
    icon: <EvaluationResultsIcon size={20} />,
    banner: {
      title: 'Kết quả đánh giá & minh chứng',
      description: (
        <>
          Kiểm tra kết quả đánh giá từ mentor doanh nghiệp, các tiêu chí quy định và trạng thái nộp minh chứng sau OJT.
        </>
      ),
      badge: 'Đánh giá cuối kỳ',
      primaryActionLabel: 'Xem kết quả',
      defaultAiPrompt: 'Phân tích sinh viên nào chưa đạt tiêu chí đánh giá cuối kỳ và cần hỗ trợ bổ sung.',
    },
  },
  {
    id: 'notifications',
    label: 'Thông báo',
    path: '/training-department/notifications',
    icon: <NotificationBellIcon size={20} />,
    hasBadge: true,
    badgeDot: true,
    banner: {
      title: 'Trung tâm thông báo Phòng Đào Tạo',
      description: (
        <>
          Cập nhật kịp thời kế hoạch đào tạo, lịch xét duyệt, nhắc nhở doanh nghiệp và thông báo quan trọng tới sinh viên.
        </>
      ),
      badge: '6 thông báo mới',
      primaryActionLabel: 'Xem thông báo',
      defaultAiPrompt: 'Tóm tắt các thông báo quan trọng của tuần và các công việc cần xử lý ngay.',
    },
  },
];

export const getTrainingDepartmentMenuItemById = (id?: string): TrainingDepartmentMenuItem | undefined => {
  if (!id) return undefined;
  return TRAINING_DEPARTMENT_NAV_ITEMS.find((item) => item.id === id);
};

export const getTrainingDepartmentMenuItemByPath = (pathname: string): TrainingDepartmentMenuItem | undefined => {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  return TRAINING_DEPARTMENT_NAV_ITEMS.find((item) => cleanPath === item.path || (item.id === 'dashboard' && cleanPath === '/training-department/dashboard'));
};
