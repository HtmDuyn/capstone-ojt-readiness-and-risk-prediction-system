import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AcademicWarningPanel } from '@/components/student/dashboard/AcademicWarningPanel';
import { useBaseLayout } from '../../layouts/BaseLayout';
import { PageBanner } from '@/components/common/PageBanner';
import { ProgressChartCard } from '@/components/student/dashboard/ProgressChartCard';
import { RoadmapStepper } from '@/components/student/dashboard/RoadmapStepper';
import { UpcomingDeadlinesCard } from '@/components/student/dashboard/UpcomingDeadlinesCard';
import { RecentActivityCard } from '@/components/student/dashboard/RecentActivityCard';

import {
  mockSemesterProgress,
  mockRoadmapSteps,
  mockDeadlines,
  mockRecentActivities,
} from '@/data/student/mockStudentData';

export const StudentDashboard: React.FC = () => {
  const { openAIConsult } = useBaseLayout();
  const { user } = useAuth();


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left & Middle Main Section (8 cols on XL) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Hero Page Banner */}
          <PageBanner
            title={`Xin chào, ${user?.name??'bạn'}!`}
            description="Theo dõi tiến độ, mức cảnh báo học vụ và kế hoạch chuẩn bị OJT từ dữ liệu của bạn."
            badge={null}
            menuId="dashboard"
            primaryAction={{
              label: 'Đăng ký OJT',
              onClick: () =>
                openAIConsult('Cổng đăng ký OJT sẽ mở tiếp nhận hồ sơ doanh nghiệp khi nào?'),
            }}
            secondaryAction={{
              label: 'Xem lộ trình OJT',
              onClick: () =>
                openAIConsult('Đang xem lộ trình chi tiết các môn học và điều kiện OJT.'),
            }}
          />

          {/* 4 Metric Stats Cards */}
          <AcademicWarningPanel />

          {/* Study Progress & Credits Bar Chart */}
          <p className="text-xs text-slate-500">Biểu đồ và lộ trình bên dưới là dữ liệu minh họa; số liệu học vụ thật ở phần cảnh báo phía trên.</p>
          <ProgressChartCard data={mockSemesterProgress} />

          {/* Roadmap to OJT Semester Stepper */}
          <RoadmapStepper steps={mockRoadmapSteps} />
        </div>

        {/* Right Sidebar Section (4 cols on XL) */}
        <div className="xl:col-span-4 space-y-6">
          {/* AI Risk Score Donut Gauge */}
          <p className="text-xs text-slate-500">Lịch và hoạt động bên dưới là dữ liệu minh họa.</p>

          {/* AI Recommendations */}

          {/* Upcoming Deadlines */}
          <UpcomingDeadlinesCard
            deadlines={mockDeadlines}
            onViewAll={() =>
              openAIConsult('Hiển thị toàn bộ lịch trình và thời hạn học kỳ cho tôi.')
            }
          />

          {/* Recent Activity Timeline */}
          <RecentActivityCard activities={mockRecentActivities} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
