import React from 'react';
import { StudentLayout, useStudentAIConsult } from '../../layouts/StudentLayout';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';
import { StatCards } from '../../components/dashboard/StatCards';
import { ProgressChartCard } from '../../components/dashboard/ProgressChartCard';
import { RoadmapStepper } from '../../components/dashboard/RoadmapStepper';
import { AIRiskScoreCard } from '../../components/dashboard/AIRiskScoreCard';
import { AIRecommendationsCard } from '../../components/dashboard/AIRecommendationsCard';
import { UpcomingDeadlinesCard } from '../../components/dashboard/UpcomingDeadlinesCard';
import { RecentActivityCard } from '../../components/dashboard/RecentActivityCard';

import {
  mockStudentProfile,
  mockSemesterProgress,
  mockRoadmapSteps,
  mockAIRiskScore,
  mockAIRecommendations,
  mockDeadlines,
  mockRecentActivities,
} from '../../data/mockStudentData';
import type { AIRecommendation } from '../../types/students/studentDashboardTypes';

const DashboardMainContent: React.FC = () => {
  const { openAIConsult } = useStudentAIConsult();

  const handleRecClick = (rec: AIRecommendation) => {
    openAIConsult(`Tôi muốn biết thêm về khuyến nghị: "${rec.title}"`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left & Middle Main Section (8 cols on XL) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Hero Welcome Banner */}
          <WelcomeBanner
            student={mockStudentProfile}
            onRegisterOjt={() =>
              openAIConsult('Cổng đăng ký OJT sẽ mở tiếp nhận hồ sơ doanh nghiệp khi nào?')
            }
            onViewRoadmap={() =>
              openAIConsult('Đang xem lộ trình chi tiết các môn học và điều kiện OJT.')
            }
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

const StudentDashboard: React.FC = () => {
  return (
    <StudentLayout>
      <DashboardMainContent />
    </StudentLayout>
  );
};

export default StudentDashboard;
