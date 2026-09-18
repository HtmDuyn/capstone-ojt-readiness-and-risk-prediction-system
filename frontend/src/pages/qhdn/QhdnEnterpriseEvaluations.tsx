import React, { useState } from 'react';
import {
  Award,
  Search,
  Building2,
  User,
  Star,
  CheckCircle2,
  Download,
  Filter,
  ThumbsUp,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { MOCK_ENTERPRISE_EVALUATIONS } from '@/data/qhdnMockData';
import type { EnterpriseEvaluation } from '@/types/qhdn/qhdnTypes';

export const QhdnEnterpriseEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EnterpriseEvaluation[]>(MOCK_ENTERPRISE_EVALUATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  const filteredEvaluations = evaluations.filter((evalItem) => {
    const matchesSearch =
      evalItem.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evalItem.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evalItem.enterpriseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || evalItem.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const avgOverallScore = (
    evaluations.reduce((acc, curr) => acc + curr.overallScore, 0) / evaluations.length
  ).toFixed(1);

  const recommendHireCount = evaluations.filter((e) => e.recommendForHire).length;
  const recommendHirePercentage = Math.round((recommendHireCount / evaluations.length) * 100);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Banner */}
      <PageBanner
        title="Báo cáo & Xem Đánh giá từ Doanh nghiệp"
        description="Tổng hợp kết quả đánh giá thực tập OJT, điểm kỹ năng chuyên môn, thái độ làm việc và phản hồi tuyển dụng từ Doanh nghiệp."
        badge="Phòng QHDN"
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Điểm đánh giá OJT Trung bình</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{avgOverallScore} / 10</p>
            <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={13} /> Mức Xếp loại Xuất sắc & Giỏi
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Star size={22} />
          </div>
        </div>

        <div className="card-glass p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tỷ lệ DN Đề xuất tuyển dụng</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{recommendHirePercentage}%</p>
            <p className="mt-1 text-xs text-slate-500">
              Có <strong className="text-slate-900">{recommendHireCount}</strong> / {evaluations.length} SV được giữ lại làm chính thức
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <ThumbsUp size={22} />
          </div>
        </div>

        <div className="card-glass p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng số phiếu đánh giá nhận được</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{evaluations.length}</p>
            <p className="mt-1 text-xs text-purple-600 font-medium">Đã xác nhận kết quả OJT</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên sinh viên, MSSV, doanh nghiệp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tất cả xếp loại</option>
              <option value="Excellent">Xuất sắc (Excellent)</option>
              <option value="Good">Giỏi (Good)</option>
              <option value="Satisfactory">Đạt (Satisfactory)</option>
              <option value="Unsatisfactory">Chưa đạt (Unsatisfactory)</option>
            </select>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Download size={15} />
            Xuất file Excel/PDF
          </button>
        </div>
      </div>

      {/* Evaluation List Cards */}
      <div className="space-y-4">
        {filteredEvaluations.map((item) => (
          <div
            key={item.id}
            className="card-glass p-5 border border-slate-200/80 hover:border-orange-200 transition-all space-y-4"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {item.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.studentName} <span className="text-xs text-slate-500 font-normal">({item.studentCode})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chuyên ngành: <strong>{item.major}</strong> | Doanh nghiệp: <strong className="text-slate-800">{item.enterpriseName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    item.grade === 'Excellent'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : item.grade === 'Good'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Xếp loại: {item.grade} ({item.overallScore} / 10)
                </span>

                {item.recommendForHire && (
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1">
                    <ThumbsUp size={12} /> Đề xuất tuyển dụng
                  </span>
                )}
              </div>
            </div>

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Chuyên môn kỹ thuật</span>
                <span className="font-extrabold text-slate-800 text-sm">{item.technicalScore} / 10</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Kỹ năng mềm</span>
                <span className="font-extrabold text-slate-800 text-sm">{item.softSkillScore} / 10</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Thái độ & Kỷ luật</span>
                <span className="font-extrabold text-slate-800 text-sm">{item.attitudeScore} / 10</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Người đánh giá</span>
                <span className="font-bold text-slate-800 text-xs block truncate">{item.evaluatorName} ({item.evaluatorRole})</span>
              </div>
            </div>

            {/* Mentor Detailed Comments */}
            <div className="text-xs text-slate-600 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
              <span className="font-bold text-orange-900 block mb-1">Nhận xét chi tiết từ Mentor Doanh nghiệp:</span>
              <p className="italic leading-relaxed text-slate-700 font-medium">"{item.comments}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QhdnEnterpriseEvaluations;
