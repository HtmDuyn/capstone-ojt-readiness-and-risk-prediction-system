import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, useStudentAIConsult } from '../../layouts/StudentLayout';
import { ChevronDownIcon } from '../../components/dashboard/icons/DashboardIcons';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';
import { mockStudentProfile } from '../../data/mockStudentData';

import { AcademicStatsRow } from '../../components/Students/academic-profile/AcademicStatsRow';
import { CreditProgressChartCard } from '../../components/Students/academic-profile/CreditProgressChartCard';
import { CourseDistributionCard } from '../../components/Students/academic-profile/CourseDistributionCard';
import { AcademicRoadmapTimeline } from '../../components/Students/academic-profile/AcademicRoadmapTimeline';
import { SubjectListTableCard } from '../../components/Students/academic-profile/SubjectListTableCard';
import { AIOptimizationSuggestionCard } from '../../components/Students/academic-profile/AIOptimizationSuggestionCard';

import { mockAcademicStats } from '../../data/mockAcademicProfileData';

const AcademicProfileContent: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useStudentAIConsult();
  const [selectedSemester, setSelectedSemester] = useState('Spring 2024 (Kỳ 7)');

  return (
    <div className="space-y-6">
      {/* Top Reusable Page Banner */}
      <WelcomeBanner
        student={mockStudentProfile}
        menuId="academic-profile"
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200/80 font-outfit">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-white/40">›</span>
            <span className="text-amber-300 font-bold">Hồ sơ học tập</span>
          </div>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/15 backdrop-blur-xs">
            Kỳ 7 • Chuyên ngành KTPM
          </span>
        }
        primaryAction={{
          label: 'Tư vấn lộ trình AI',
          onClick: () =>
            openAIConsult(
              'Tôi muốn tư vấn tối ưu lộ trình môn học và các điều kiện tiên quyết để sẵn sàng đi OJT.'
            ),
        }}
        extra={
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 shadow-inner">
            <span className="text-xs sm:text-sm font-medium text-purple-200 whitespace-nowrap">
              Học kỳ hiện tại:
            </span>
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="appearance-none bg-transparent pr-7 text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer font-outfit"
              >
                <option value="Spring 2024 (Kỳ 7)" className="bg-slate-900 text-white">
                  Spring 2024 (Kỳ 7)
                </option>
                <option value="Fall 2023 (Kỳ 6)" className="bg-slate-900 text-white">
                  Fall 2023 (Kỳ 6)
                </option>
                <option value="Summer 2023 (Kỳ 5)" className="bg-slate-900 text-white">
                  Summer 2023 (Kỳ 5)
                </option>
              </select>
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70">
                <ChevronDownIcon size={14} />
              </div>
            </div>
          </div>
        }
      />

      {/* Section 1: Top 4 Metric Stat Cards */}
      <AcademicStatsRow stats={mockAcademicStats} />

      {/* Section 2: Middle Row (3 equal grid columns on LG/XL with synchronized heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Tiến độ tín chỉ */}
        <CreditProgressChartCard />

        {/* Phân bổ môn học */}
        <CourseDistributionCard />

        {/* Lộ trình học tập */}
        <AcademicRoadmapTimeline
          onViewDetailedRoadmap={() =>
            openAIConsult('Tôi muốn xem lộ trình chi tiết các môn học và điều kiện OJT.')
          }
        />
      </div>

      {/* Section 3: Bottom Row (Danh sách môn học + GỢI Ý TỪ AI) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Danh sách môn học (8 cols) */}
        <div className="xl:col-span-8 flex flex-col">
          <SubjectListTableCard />
        </div>

        {/* GỢI Ý TỪ AI Card (4 cols) */}
        <div className="xl:col-span-4 flex flex-col">
          <AIOptimizationSuggestionCard
            onOptimizeClick={() =>
              openAIConsult(
                'Tôi muốn tư vấn cách tối ưu hồ sơ để đạt kết quả tốt nhất khi đi OJT tại doanh nghiệp Tier-1.'
              )
            }
          />
        </div>
      </div>
    </div>
  );
};

const StudentAcademicProfile: React.FC = () => {
  return (
    <StudentLayout>
      <AcademicProfileContent />
    </StudentLayout>
  );
};

export default StudentAcademicProfile;
