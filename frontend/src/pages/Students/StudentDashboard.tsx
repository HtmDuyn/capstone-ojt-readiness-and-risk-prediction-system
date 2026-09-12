import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { Header } from '../../components/dashboard/Header';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';
import { StatCards } from '../../components/dashboard/StatCards';
import { ProgressChartCard } from '../../components/dashboard/ProgressChartCard';
import { RoadmapStepper } from '../../components/dashboard/RoadmapStepper';
import { AIRiskScoreCard } from '../../components/dashboard/AIRiskScoreCard';
import { AIRecommendationsCard } from '../../components/dashboard/AIRecommendationsCard';
import { UpcomingDeadlinesCard } from '../../components/dashboard/UpcomingDeadlinesCard';
import { RecentActivityCard } from '../../components/dashboard/RecentActivityCard';
import { DashboardFooter } from '../../components/dashboard/DashboardFooter';
import { AIConsultModal } from '../../components/dashboard/AIConsultModal';
import { BotSparkleIcon } from '../../components/dashboard/icons/DashboardIcons';

import {
  mockStudentProfile,
  mockSemesterProgress,
  mockRoadmapSteps,
  mockAIRiskScore,
  mockAIRecommendations,
  mockDeadlines,
  mockRecentActivities,
} from '../../data/mockStudentData';
import type { AIRecommendation } from '../../types/studentDashboardTypes';

const StudentDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [initialAiQuery, setInitialAiQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenAIConsult = (query = '') => {
    setInitialAiQuery(query);
    setAiModalOpen(true);
  };

  const handleRecClick = (rec: AIRecommendation) => {
    handleOpenAIConsult(`Tôi muốn biết thêm về khuyến nghị: "${rec.title}"`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-outfit antialiased selection:bg-orange-500 selection:text-white relative">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area (offset by sidebar compact width on desktop) */}
      <div className="lg:pl-[76px] flex flex-col min-h-screen flex-1 transition-all duration-300">
        {/* Top Header */}
        <Header
          student={mockStudentProfile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dashboard Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1520px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left & Middle Main Section (8 cols on XL) */}
            <div className="xl:col-span-8 space-y-6">
              {/* Hero Welcome Banner */}
              <WelcomeBanner
                student={mockStudentProfile}
                onRegisterOjt={() =>
                  alert('Cổng đăng ký OJT sẽ mở tiếp nhận hồ sơ doanh nghiệp!')
                }
                onViewRoadmap={() =>
                  alert('Đang xem lộ trình chi tiết các môn học và điều kiện OJT.')
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
                  alert('Hiển thị toàn bộ lịch trình và thời hạn học kỳ.')
                }
              />

              {/* Recent Activity Timeline */}
              <RecentActivityCard activities={mockRecentActivities} />
            </div>
          </div>

          {/* Footer */}
          <DashboardFooter />
        </main>
      </div>

      {/* Floating AI Consultation Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <span className="absolute -inset-1 rounded-full bg-orange-500/30 blur-sm animate-pulse pointer-events-none" />
        <button
          type="button"
          onClick={() => handleOpenAIConsult()}
          className="relative group flex items-center gap-2.5 pl-3.5 pr-5 py-3 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/35 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/25 cursor-pointer"
          title="Tư vấn AI ngay"
        >
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs group-hover:rotate-12 transition-transform shadow-inner">
            <BotSparkleIcon size={18} className="text-white" />
          </span>
          <span className="tracking-tight font-outfit">Tư vấn AI ngay</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        </button>
      </div>

      {/* Interactive AI Chat / Consult Modal */}
      <AIConsultModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        student={mockStudentProfile}
        initialQuery={initialAiQuery}
      />
    </div>
  );
};

export default StudentDashboard;
