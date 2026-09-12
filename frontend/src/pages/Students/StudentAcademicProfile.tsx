import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout, useStudentAIConsult } from '../../layouts/StudentLayout';
import { ChevronDownIcon } from '../../components/dashboard/icons/DashboardIcons';

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
      {/* Breadcrumb & Subtitle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 font-outfit">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="hover:text-amber-700 transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span>›</span>
            <span className="text-amber-700 font-bold">Hồ sơ học tập</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit tracking-tight mt-1">
            Hồ sơ học tập
          </h1>
        </div>

        {/* Right Semester Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-500 font-outfit">
            Học kỳ hiện tại:
          </span>
          <div className="relative">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="appearance-none bg-white/90 border border-slate-200/90 shadow-2xs rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-bold text-slate-800 font-outfit hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
            >
              <option value="Spring 2024 (Kỳ 7)">Spring 2024 (Kỳ 7)</option>
              <option value="Fall 2023 (Kỳ 6)">Fall 2023 (Kỳ 6)</option>
              <option value="Summer 2023 (Kỳ 5)">Summer 2023 (Kỳ 5)</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <ChevronDownIcon size={14} />
            </div>
          </div>
        </div>
      </div>

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
