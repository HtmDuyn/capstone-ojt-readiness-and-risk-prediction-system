import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBaseLayout } from '../../layouts/BaseLayout';
import { ChevronDownIcon } from '@/components/common/icons/AppIcons';
import { PageBanner } from '@/components/common/PageBanner';
import { mockStudentProfile } from '@/data/student/mockStudentData';

import { AcademicStatsRow } from '@/components/student/academic-profile/AcademicStatsRow';
import { CreditProgressChartCard } from '@/components/student/academic-profile/CreditProgressChartCard';
import { AcademicRoadmapTimeline } from '@/components/student/academic-profile/AcademicRoadmapTimeline';
import { SubjectListTableCard } from '@/components/student/academic-profile/SubjectListTableCard';

import { mockAcademicStats } from '@/data/student/mockAcademicProfileData';

export const StudentAcademicProfile: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();
  const [selectedSemester, setSelectedSemester] = useState('Spring 2024 (Kỳ 6)');

  return (
    <div className="space-y-6">
      {/* Top Reusable Page Banner */}
      <PageBanner
        student={mockStudentProfile}
        menuId="academic-profile"
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200/80 font-outfit">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
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
            Kỳ 6 • Chuyên ngành KTPM
          </span>
        }
        primaryAction={{
          label: 'Tư vấn lộ trình AI',
          onClick: () =>
            openAIConsult(
              'Tôi muốn tư vấn tối ưu lộ trình môn học và các điều kiện tiên quyết từ kỳ 1 đến kỳ 6.'
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
                <option value="Spring 2024 (Kỳ 6)" className="bg-slate-900 text-white">
                  Spring 2024 (Kỳ 6)
                </option>
                <option value="Fall 2023 (Kỳ 5)" className="bg-slate-900 text-white">
                  Fall 2023 (Kỳ 5)
                </option>
                <option value="Summer 2023 (Kỳ 4)" className="bg-slate-900 text-white">
                  Summer 2023 (Kỳ 4)
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

      {/* Section 2: Middle Row - Credit Chart & Roadmap Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Tiến độ tín chỉ với Biểu đồ & Animation (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <CreditProgressChartCard />
        </div>

        {/* Lộ trình học tập cụ thể từ Kỳ 1 đến Kỳ 6 (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <AcademicRoadmapTimeline
            onViewDetailedRoadmap={() =>
              openAIConsult('Tôi muốn xem chi tiết lộ trình học tập và điều kiện hoàn thành từ kỳ 1 đến kỳ 6.')
            }
          />
        </div>
      </div>

      {/* Section 3: Bottom Row - Full Width Subject List Table */}
      <div className="w-full">
        <SubjectListTableCard />
      </div>
    </div>
  );
};

export default StudentAcademicProfile;
