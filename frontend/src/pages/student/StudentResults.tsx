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
  const [expandedCategory, setExpandedCategory] = useState<string | null>('cat-1');

  const toggleCategory = (catId: string) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="font-inter space-y-6 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      {/* 1. Page Banner */}
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
        title="Kết quả đánh giá thực tập OJT"
        description="Bảng điểm chi tiết, nhận xét từ doanh nghiệp & giảng viên hướng dẫn cùng kết quả công nhận tín chỉ thực tập."
        primaryAction={{
          label: 'Hỏi AI phân tích kết quả',
          icon: <BotSparkleIcon size={16} />,
          onClick: () =>
            openAIConsult(
              'Hãy phân tích chi tiết kết quả đánh giá OJT của tôi và đưa ra lời khuyên phát triển sự nghiệp.'
            ),
        }}
        secondaryAction={{
          label: 'Về Dashboard',
          onClick: () => navigate('/student/dashboard'),
        }}
      />

      {/* 2. Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Final Grade */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-3xl p-6 shadow-lg shadow-orange-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-orange-100/80 mb-1">
                Điểm Tổng Kết OJT
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black">{data.finalScore}</span>
                <span className="text-lg text-orange-200 font-semibold">/ {data.maxScore}</span>
              </div>
            </div>
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
              <Award size={28} className="text-amber-200" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
              {data.gradeLabel}
            </span>
            <span className="text-xs font-semibold text-orange-100 flex items-center gap-1">
              <ShieldCheck size={14} /> Đã công nhận
            </span>
          </div>
        </div>

        {/* Card 2: Enterprise Score */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Điểm Doanh nghiệp
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-800">
                  {data.enterpriseScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 10</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Building2 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Trọng số 70%</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Đạt xuất sắc
            </span>
          </div>
        </div>

        {/* Card 3: Academic Score */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Điểm Học thuật (PĐT/GV)
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-800">
                  {data.academicScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 10</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Trọng số 30%</span>
            <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
              Hoàn thành tốt
            </span>
          </div>
        </div>

        {/* Card 4: Credits & Certificate Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Công nhận tín chỉ
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {data.passedCredits}/{data.totalCredits}
                </span>
                <span className="text-sm font-semibold text-slate-500">Tín chỉ</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Mã CC: {data.certificateCode.slice(0, 12)}...</span>
            <span className="text-blue-600 font-bold hover:underline cursor-pointer">
              Chi tiết
            </span>
          </div>
        </div>
      </div>

      {/* 3. Internship Metadata Info Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
            <Briefcase size={28} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{data.companyName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                Đã hoàn thành
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <UserCheck size={14} className="text-orange-500" />
                Vị trí: <strong>{data.position}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-orange-500" />
                Thời gian: {data.internshipPeriod}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span>Tải Báo cáo PDF</span>
          </button>
          <button
            type="button"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Share2 size={16} />
            <span>Xem Chứng nhận</span>
          </button>
        </div>
      </div>

      {/* 4. Tabs Navigation */}
      <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('criteria')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'criteria'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={18} />
          <span>Chi tiết bảng điểm đánh giá ({data.categories.length} nhóm)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'feedback'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star size={18} />
          <span>Nhận xét từ Mentor & GVHD ({data.feedbacks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'skills'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={18} />
          <span>Đánh giá kỹ năng thực tế</span>
        </button>
      </div>

      {/* 5. Tab Contents */}

      {/* TAB 1: Criteria Breakdown */}
      {activeTab === 'criteria' && (
        <div className="space-y-4">
          {data.categories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {cat.weight}%
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cat.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {cat.criteria.length} tiêu chí thành phần • Trọng số nhóm: {cat.weight}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">Điểm nhóm</span>
                      <span className="text-lg font-extrabold text-orange-600">
                        {cat.score} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                      </span>
                    </div>
                    <div className="p-2 text-slate-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/30">
                    <div className="space-y-4">
                      {cat.criteria.map((crit) => (
                        <div
                          key={crit.id}
                          className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2 shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              <h4 className="font-bold text-slate-800 text-sm">{crit.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-xs font-semibold text-slate-400">
                                Trọng số: {crit.weight}%
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-orange-50 font-bold text-orange-600 text-xs">
                                {crit.score} / {crit.maxScore}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${(crit.score / crit.maxScore) * 100}%` }}
                            />
                          </div>

                          {crit.comment && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              💬 "{crit.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Feedbacks */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.feedbacks.map((fb, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6"
            >
              <div>
                {/* Supervisor Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={fb.avatar}
                      alt={fb.supervisorName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/20 shadow-xs"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{fb.supervisorName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{fb.title}</p>
                      <p className="text-[11px] text-orange-600 font-semibold">{fb.organization}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-500 font-bold text-base">
                      <Star size={16} className="fill-orange-500" />
                      <span>{fb.overallRating}/10</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{fb.evaluatedAt}</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-sm text-slate-700 italic leading-relaxed mb-4">
                  "{fb.comments}"
                </div>

                {/* Strengths & Improvements */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Ưu điểm & Điểm mạnh:
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                      {fb.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles size={14} /> Điểm cần cải thiện:
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                      {fb.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendation Badge */}
              {fb.recommendation && (
                <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl text-xs font-semibold text-orange-900">
                  <span className="font-bold block text-orange-700 mb-0.5">
                    💡 Đề xuất từ Supervisor:
                  </span>
                  {fb.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Skill Ratings */}
      {activeTab === 'skills' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Đánh giá kỹ năng chuyên môn từ Doanh nghiệp
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Mức độ thành thạo được Mentor chấm điểm trực tiếp dựa trên công việc thực tế.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.skills.map((skill, i) => (
              <div
                key={i}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2"
              >
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-800 block">{skill.skillName}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {skill.category}
                    </span>
                  </div>
                  <span className="font-extrabold text-orange-600 text-sm">
                    {skill.rating} / 10
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${(skill.rating / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Official Certificate & Verification Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck size={14} /> XÁC NHẬN CHÍNH THỨC TỪ TRƯỜNG ĐẠI HỌC FPT
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            Chứng chỉ Hoàn thành Thực tập OJT
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Sinh viên đã hoàn thành 100% thời gian thực tập tại doanh nghiệp, đạt chỉ tiêu 10 tín chỉ và đủ điều kiện xét tốt nghiệp.
          </p>
          <p className="text-xs text-slate-400">
            Mã tra cứu chứng chỉ: <code className="text-amber-300 font-mono font-bold">{data.certificateCode}</code> • Ngày cấp: {data.issuedDate}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={18} />
            <span>Tải Chứng chỉ PDF</span>
          </button>
          <button
            type="button"
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink size={18} />
            <span>Tra cứu văn bằng</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEvaluationResults;
