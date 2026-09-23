import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBaseLayout } from '../../layouts/BaseLayout';
import { ChevronDownIcon, BotSparkleIcon, CheckCircleIcon } from '@/components/common/icons/AppIcons';
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full max-w-[1400px] mx-auto font-outfit">
      
      {/* Top Reusable Page Banner with Premium Look */}
      <PageBanner
        student={mockStudentProfile}
        menuId="academic-profile"
        title="Hồ Sơ Học Tập & Tiến Độ"
        description="Theo dõi toàn diện quá trình học tập, tín chỉ tích lũy và kiểm tra điều kiện tham gia OJT một cách trực quan nhất."
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200/80">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              Trang chủ
            </button>
            <span className="text-white/40">/</span>
            <span className="text-amber-300 font-bold drop-shadow-md">Hồ sơ học tập</span>
          </div>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border border-orange-400/50">
            Kỳ 6 • KTPM
          </span>
        }
        primaryAction={{
          label: 'AI Tư vấn lộ trình tối ưu',
          icon: <BotSparkleIcon size={16} />,
          className: "bg-white text-purple-700 hover:bg-purple-50",
          onClick: () =>
            openAIConsult(
              'Tôi muốn tư vấn tối ưu lộ trình môn học và các điều kiện tiên quyết từ kỳ 1 đến kỳ 6.'
            ),
        }}
        extra={
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <span className="text-sm font-semibold text-purple-100 whitespace-nowrap">
                Học kỳ hiện tại:
              </span>
              <div className="relative group">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="appearance-none bg-transparent pr-8 text-sm font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="Spring 2024 (Kỳ 6)" className="bg-slate-900 text-white">Spring 2024 (Kỳ 6)</option>
                  <option value="Fall 2023 (Kỳ 5)" className="bg-slate-900 text-white">Fall 2023 (Kỳ 5)</option>
                  <option value="Summer 2023 (Kỳ 4)" className="bg-slate-900 text-white">Summer 2023 (Kỳ 4)</option>
                </select>
                <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70 group-hover:text-white transition-colors">
                  <ChevronDownIcon size={16} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium px-2">
              <CheckCircleIcon size={12} />
              Đã đồng bộ dữ liệu FAP
            </div>
          </div>
        }
      />

      {/* Section 1: Top 4 Metric Stat Cards */}
      <div className="relative z-10 -mt-10 mx-4 lg:mx-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-2xl shadow-slate-200/50">
          <AcademicStatsRow stats={mockAcademicStats} />
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-8">
        {/* Section 2: Middle Row - Credit Chart & Roadmap Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Tiến độ tín chỉ với Biểu đồ & Animation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full rounded-3xl bg-white shadow-xl shadow-slate-200/40 border border-slate-100/60 overflow-hidden relative group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-6 flex-1 flex flex-col">
              <CreditProgressChartCard />
            </div>
          </div>

          {/* Lộ trình học tập cụ thể từ Kỳ 1 đến Kỳ 6 (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl shadow-slate-900/20 border border-slate-700/50 overflow-hidden relative hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 text-white">
            {/* Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 p-6 flex-1 flex flex-col">
              <AcademicRoadmapTimeline
                onViewDetailedRoadmap={() =>
                  openAIConsult('Tôi muốn xem chi tiết lộ trình học tập và điều kiện hoàn thành từ kỳ 1 đến kỳ 6.')
                }
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bottom Row - Full Width Subject List Table */}
        <div className="w-full rounded-3xl bg-white shadow-xl shadow-slate-200/40 border border-slate-100/60 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Danh sách môn học</h2>
              <p className="text-sm text-slate-500 mt-1">Chi tiết kết quả học tập và trạng thái các môn tiên quyết OJT</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                24 Môn đã qua
              </span>
              <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                1 Môn học lại
              </span>
            </div>
          </div>
          <SubjectListTableCard />
        </div>
      </div>
    </div>
  );
};

export default StudentAcademicProfile;
