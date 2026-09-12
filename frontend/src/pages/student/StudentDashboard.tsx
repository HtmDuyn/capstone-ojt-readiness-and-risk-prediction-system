import React from 'react';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { PageBanner } from '@/components/common/PageBanner';
import { StatCards } from '@/components/student/dashboard/StatCards';
import { ProgressChartCard } from '@/components/student/dashboard/ProgressChartCard';
import { RoadmapStepper } from '@/components/student/dashboard/RoadmapStepper';
import { AIRiskScoreCard } from '@/components/student/dashboard/AIRiskScoreCard';
import { AIRecommendationsCard } from '@/components/student/dashboard/AIRecommendationsCard';
import { UpcomingDeadlinesCard } from '@/components/student/dashboard/UpcomingDeadlinesCard';
import { RecentActivityCard } from '@/components/student/dashboard/RecentActivityCard';

import {
  mockStudentProfile,
  mockSemesterProgress,
  mockRoadmapSteps,
  mockAIRiskScore,
  mockAIRecommendations,
  mockDeadlines,
  mockRecentActivities,
} from '@/data/student/mockStudentData';
import type { AIRecommendation } from '@/types/student/studentDashboardTypes';

export const StudentDashboard: React.FC = () => {
  const { openAIConsult } = useBaseLayout();

  const handleRecClick = (rec: AIRecommendation) => {
    openAIConsult(`Tôi muốn biết thêm về khuyến nghị: "${rec.title}"`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left & Middle Main Section (8 cols on XL) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Hero Page Banner */}
          <PageBanner
            student={mockStudentProfile}
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
          <StatCards student={mockStudentProfile} />

          {/* Study Progress & Credits Bar Chart */}
          <ProgressChartCard data={mockSemesterProgress} />

          {/* Roadmap to OJT Semester Stepper */}
          <RoadmapStepper steps={mockRoadmapSteps} />
        </div>

        {/* Right Sidebar Section (4 cols on XL) */}
        <div className="xl:col-span-4 space-y-6">
          {/* AI Risk Score Donut Gauge */}
          <AIRiskScoreCard data={mockAIRiskScore} />

          {/* AI Recommendations */}
          <AIRecommendationsCard
            recommendations={mockAIRecommendations}
            onConsultAction={handleRecClick}
          />

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
