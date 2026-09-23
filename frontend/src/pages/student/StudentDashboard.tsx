import React from 'react';
import { useBaseLayout } from '../../layouts/BaseLayout';
import { PageBanner } from '@/components/common/PageBanner';
import { StatCards } from '@/components/student/dashboard/StatCards';
import { ProgressChartCard } from '@/components/student/dashboard/ProgressChartCard';
import { RoadmapStepper } from '@/components/student/dashboard/RoadmapStepper';
import { AIRiskScoreCard } from '@/components/student/dashboard/AIRiskScoreCard';
import { AIRecommendationsCard } from '@/components/student/dashboard/AIRecommendationsCard';
import { UpcomingDeadlinesCard } from '@/components/student/dashboard/UpcomingDeadlinesCard';
import { RecentActivityCard } from '@/components/student/dashboard/RecentActivityCard';
import { BotSparkleIcon, CalendarIcon } from '@/components/common/icons/AppIcons';

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
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { openAIConsult } = useBaseLayout();
  const navigate = useNavigate();

  const handleRecClick = (rec: AIRecommendation) => {
    openAIConsult(`Tôi muốn biết thêm về khuyến nghị: "${rec.title}"`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full max-w-[1400px] mx-auto font-outfit">
      
      {/* Hero Page Banner - Redesigned to be massive and impressive */}
      <PageBanner
        student={mockStudentProfile}
        menuId="dashboard"
        title={
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium text-purple-200/80 uppercase tracking-widest font-inter">Cổng Sinh Viên</span>
            <span>Xin chào, {mockStudentProfile.fullName}! 👋</span>
          </span>
        }
        description="Tổng quan tiến độ học tập, trạng thái OJT và các cảnh báo rủi ro mới nhất."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-inner">
            <CalendarIcon size={14} /> Fall 2023 - Tuần 4
          </span>
        }
        primaryAction={{
          label: 'Đăng ký OJT',
          className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none shadow-orange-500/50 hover:shadow-orange-500/60',
          onClick: () => navigate('/student/ojt-registration'),
        }}
        secondaryAction={{
          label: 'Hỏi AI tổng quan',
          icon: <BotSparkleIcon size={16} />,
          className: 'bg-white/10 text-white hover:bg-white/20',
          onClick: () =>
            openAIConsult('Hãy tổng hợp ngắn gọn tiến độ học tập và rủi ro hiện tại của tôi.'),
        }}
        className="pb-24" // Extra padding to allow stat cards to overlap
      />

      {/* Overlapping Main Grid Section */}
      <div className="px-4 lg:px-8 relative z-10 -mt-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left & Middle Main Section (8 cols on XL) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* 4 Metric Stats Cards - Overlapping the Banner */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-2 border border-white/50 shadow-2xl shadow-slate-200/50">
              <StatCards student={mockStudentProfile} />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-8">
              {/* Study Progress & Credits Bar Chart */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100/60 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
                <ProgressChartCard data={mockSemesterProgress} />
              </div>

              {/* Roadmap to OJT Semester Stepper */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
                <RoadmapStepper steps={mockRoadmapSteps} />
              </div>
            </div>
          </div>

          {/* Right Sidebar Section (4 cols on XL) */}
          <div className="xl:col-span-4 space-y-8 mt-12 xl:mt-0">
            
            {/* AI Risk Score Donut Gauge - Premium Style */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-900/20 border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
              <AIRiskScoreCard data={mockAIRiskScore} />
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <AIRecommendationsCard
                recommendations={mockAIRecommendations}
                onConsultAction={handleRecClick}
              />
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-orange-50/50 rounded-3xl p-6 shadow-xl shadow-orange-100/40 border border-orange-100 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500">
              <UpcomingDeadlinesCard
                deadlines={mockDeadlines}
                onViewAll={() =>
                  openAIConsult('Hiển thị toàn bộ lịch trình và thời hạn học kỳ cho tôi.')
                }
              />
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100/60">
              <RecentActivityCard activities={mockRecentActivities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
