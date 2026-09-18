import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  Star,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { BotSparkleIcon } from '@/components/common/icons/AppIcons';
import { mockOJTEvaluationData } from '@/data/student/mockOjtEvaluationData';
import type { OJTEvaluationData } from '@/types/student/ojtEvaluationTypes';

interface StudentEvaluationResultsProps {
  initialData?: OJTEvaluationData;
}

export const StudentEvaluationResults: React.FC<StudentEvaluationResultsProps> = ({
  initialData = mockOJTEvaluationData,
}) => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();
  const [data] = useState<OJTEvaluationData>(initialData);
  const [activeTab, setActiveTab] = useState<'criteria' | 'feedback' | 'skills'>('criteria');

  return (
    <div className="font-inter space-y-6 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      {/* 1. Page Header Banner */}
      <PageBanner
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-white/40">›</span>
            <span className="text-amber-300 font-bold">Kết quả đánh giá OJT</span>
          </div>
        }
        title="Kết quả Đánh giá Thực tập OJT"
        description="Bảng tổng hợp kết quả đánh giá thực tập tại doanh nghiệp, nhận xét từ Mentor và công nhận tín chỉ."
        primaryAction={{
          label: 'Hỏi AI phân tích kết quả',
          icon: <BotSparkleIcon size={16} />,
          onClick: () =>
            openAIConsult(
              'Hãy phân tích chi tiết kết quả đánh giá OJT của tôi và đưa ra lời khuyên phát triển sự nghiệp.'
            ),
        }}
        secondaryAction={{
          label: 'Về Trang chủ',
          onClick: () => navigate('/student/dashboard'),
        }}
      />

      {/* 2. Unified Hero Summary Container (Giao diện tổng quan hợp nhất - Không xé lẻ card nhỏ) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Company & Internship Meta Header */}
        <div className="p-6 bg-slate-50/60 border-b border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{data.companyName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã hoàn thành OJT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <UserCheck size={13} className="text-slate-400" />
                  Vị trí: <strong className="text-slate-700">{data.position}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  Thời gian: {data.internshipPeriod}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              className="flex-1 lg:flex-initial px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download size={15} />
              <span>Tải Báo cáo</span>
            </button>
            <button
              type="button"
              className="flex-1 lg:flex-initial px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 size={15} />
              <span>Xem Chứng nhận</span>
            </button>
          </div>
        </div>

        {/* Integrated Metrics Dashboard Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 bg-white">
          {/* Metric 1: Final Score */}
          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Điểm Tổng Kết OJT</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-outfit">{data.finalScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ {data.maxScore}</span>
            </div>
            <div className="pt-2">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200/60">
                {data.gradeLabel}
              </span>
            </div>
          </div>

          {/* Metric 2: Enterprise Score */}
          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Điểm Doanh nghiệp (70%)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-outfit">{data.enterpriseScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-2">
              Đánh giá từ Mentor làm việc trực tiếp
            </p>
          </div>

          {/* Metric 3: Academic Score */}
          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Điểm Học thuật (30%)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 font-outfit">{data.academicScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-2">
              Chấm điểm bởi Giảng viên hướng dẫn
            </p>
          </div>

          {/* Metric 4: Credits Status */}
          <div className="p-6 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Công nhận Tín chỉ</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600 font-outfit">
                {data.passedCredits}/{data.totalCredits}
              </span>
              <span className="text-xs font-semibold text-slate-500">Tín chỉ</span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate pt-2">
              Mã CC: {data.certificateCode.slice(0, 14)}...
            </p>
          </div>
        </div>
      </div>

      {/* 3. Master Content Area (Consolidated Tabs & Sections) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/50 px-6 pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'criteria'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={17} />
            <span>Chi tiết Bảng điểm ({data.categories.length} nhóm tiêu chí)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star size={17} />
            <span>Nhận xét Mentor & Giảng viên ({data.feedbacks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'skills'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={17} />
            <span>Kỹ năng chuyên môn</span>
          </button>
        </div>

        {/* Tab 1: Criteria Category Main Scores Only */}
        {activeTab === 'criteria' && (
          <div className="p-6 space-y-3">
            {data.categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-4.5 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {cat.weight}%
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm md:text-base">{cat.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Trọng số nhóm: <strong className="text-slate-700">{cat.weight}%</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-semibold block">Điểm nhóm</span>
                  <span className="text-lg md:text-xl font-black text-orange-600 font-outfit">
                    {cat.score} <span className="text-xs text-slate-400 font-normal font-sans">/ 10</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Feedback Statements */}
        {activeTab === 'feedback' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.feedbacks.map((fb, idx) => (
              <div
                key={idx}
                className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Supervisor Details */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={fb.avatar}
                        alt={fb.supervisorName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{fb.supervisorName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{fb.title}</p>
                        <p className="text-[11px] text-orange-600 font-semibold">{fb.organization}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                        <Star size={15} className="fill-orange-500 text-orange-500" />
                        <span>{fb.overallRating}/10</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{fb.evaluatedAt}</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 italic leading-relaxed mb-3">
                    "{fb.comments}"
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <h4 className="font-bold text-emerald-700 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Điểm mạnh:
                      </h4>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                        {fb.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-amber-700 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
                        <Sparkles size={13} /> Điểm cần cải thiện:
                      </h4>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                        {fb.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {fb.recommendation && (
                  <div className="p-3 bg-orange-50/80 border border-orange-100 rounded-xl text-xs text-orange-900">
                    <strong className="block text-orange-700 font-bold mb-0.5">Lời khuyên phát triển:</strong>
                    {fb.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Skill Ratings Matrix */}
        {activeTab === 'skills' && (
          <div className="p-6 space-y-4">
            <div className="mb-2">
              <h3 className="text-base font-bold text-slate-900">
                Đánh giá Năng lực Kỹ năng Thực tế
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Điểm số được Mentor chấm trực tiếp dựa trên quá trình xử lý công việc tại doanh nghiệp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.skills.map((skill, i) => (
                <div
                  key={i}
                  className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/70 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="font-bold text-slate-800 block">{skill.skillName}</strong>
                      <span className="text-[11px] text-slate-400">{skill.category}</span>
                    </div>
                    <span className="font-black text-orange-600 text-sm">
                      {skill.rating} / 10
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(skill.rating / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Official Certificate Verification Card (Thiết kế tối giản sang trọng) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck size={14} /> XÁC NHẬN CHÍNH THỨC TỪ TRƯỜNG ĐẠI HỌC FPT
          </div>
          <h3 className="text-lg md:text-xl font-bold">
            Chứng chỉ Hoàn thành Kỳ Thực tập OJT
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Sinh viên đã hoàn thành đầy đủ thời gian OJT tại doanh nghiệp, đạt chuẩn 10 tín chỉ và đủ điều kiện xét điều kiện tốt nghiệp.
          </p>
          <p className="text-xs text-slate-400 pt-1">
            Mã chứng chỉ: <code className="text-amber-300 font-mono font-bold">{data.certificateCode}</code> • Ngày cấp: {data.issuedDate}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={16} />
            <span>Tải Chứng chỉ PDF</span>
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink size={16} />
            <span>Tra cứu văn bằng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEvaluationResults;

