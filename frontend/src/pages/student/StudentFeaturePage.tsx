import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { PageBanner } from '@/components/common/PageBanner';
import { mockStudentProfile } from '@/data/student/mockStudentData';
import { getStudentMenuItemByPath } from '@/config/menus/studentMenu';
import {
  BotSparkleIcon,
  RoadmapConsultingIcon,
  ArrowRightIcon,
} from '@/components/common/icons/AppIcons';

export const StudentFeaturePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openAIConsult } = useBaseLayout();

  const currentMenu = getStudentMenuItemByPath(location.pathname);

  return (
    <div className="space-y-6">
      {/* Reusable Page Banner matching this route automatically */}
      <PageBanner
        student={mockStudentProfile}
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
            <span className="text-amber-300 font-bold">{currentMenu?.label || 'Chức năng'}</span>
          </div>
        }
        primaryAction={{
          label: currentMenu?.banner?.primaryActionLabel || 'Tư vấn AI',
          onClick: () =>
            openAIConsult(
              currentMenu?.banner?.defaultAiPrompt ||
                `Tôi cần tư vấn thông tin về tính năng ${currentMenu?.label}.`
            ),
        }}
        secondaryAction={{
          label: 'Về Dashboard',
          onClick: () => navigate('/student/dashboard'),
        }}
      />

      {/* Feature Overview & Upcoming Card */}
      <div className="card-glass p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-purple-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
            {currentMenu?.icon ? (
              <span className="scale-125">{currentMenu.icon}</span>
            ) : (
              <RoadmapConsultingIcon size={32} />
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Đang hoàn thiện tính năng (Sprint 2)
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit tracking-tight">
            Phân hệ {currentMenu?.label || 'Chức năng'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-outfit">
            Tính năng này đang được đồng bộ dữ liệu với hệ thống đào tạo FPT University. Trong thời
            gian này, bạn có thể sử dụng Trợ lý AI để giải đáp thắc mắc và nhận tư vấn trực tiếp!
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                openAIConsult(
                  currentMenu?.banner?.defaultAiPrompt ||
                    `Tôi muốn được tư vấn thông tin về phân hệ ${currentMenu?.label}.`
                )
              }
              className="btn-login px-6 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <BotSparkleIcon size={16} />
              <span>Hỏi AI về mục này</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Quay lại Dashboard</span>
              <ArrowRightIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeaturePage;
