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
  Eye,
  X,
  MessageSquareQuote,
  Calendar,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { MOCK_ENTERPRISE_EVALUATIONS } from '@/data/qhdn/qhdnMockData';
import type { EnterpriseEvaluation } from '@/types/qhdn/qhdnTypes';

export const QhdnEnterpriseEvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EnterpriseEvaluation[]>(MOCK_ENTERPRISE_EVALUATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Selected Evaluation for Modal Detail
  const [selectedEvaluationDetail, setSelectedEvaluationDetail] = useState<EnterpriseEvaluation | null>(null);

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

      {/* Evaluation List Table */}
      <div className="card-glass overflow-hidden border border-slate-200/80 shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-orange-500" />
              Danh sách Đánh giá Thực tập từ Doanh nghiệp ({filteredEvaluations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhấp vào từng dòng để xem phiếu đánh giá chi tiết của Mentor và điểm chuyên môn
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Sinh viên OJT</th>
                <th className="p-3.5">Doanh nghiệp & Vị trí</th>
                <th className="p-3.5 text-center">Xếp loại & Điểm OJT</th>
                <th className="p-3.5 text-center">Đề xuất Tuyển dụng</th>
                <th className="p-3.5">Người đánh giá (Mentor)</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEvaluations.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedEvaluationDetail(item)}
                  className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                >
                  {/* Student */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm shrink-0 border border-orange-200 group-hover:scale-105 transition-transform">
                        {item.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                          {item.studentName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          MSSV: <strong className="text-slate-700">{item.studentCode}</strong> | {item.major}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Enterprise & Position */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <Building2 size={13} className="text-orange-500 shrink-0" />
                      {item.enterpriseName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.positionTitle}</p>
                  </td>

                  {/* Score & Grade */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-block ${
                        item.grade === 'Excellent'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.grade === 'Good'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.grade} ({item.overallScore} / 10)
                    </span>
                  </td>

                  {/* Recommend Hire */}
                  <td className="p-3.5 text-center">
                    {item.recommendForHire ? (
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold inline-flex items-center gap-1">
                        <ThumbsUp size={12} /> Đề xuất tuyển dụng
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Không</span>
                    )}
                  </td>

                  {/* Evaluator */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{item.evaluatorName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.evaluatorRole}</p>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedEvaluationDetail(item)}
                      className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-orange-200/80"
                    >
                      <Eye size={14} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVALUATION DETAIL POPUP MODAL */}
      {selectedEvaluationDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-xl flex items-center justify-center shrink-0 border border-orange-200">
                  {selectedEvaluationDetail.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Phiếu Đánh giá Thực tập OJT - {selectedEvaluationDetail.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    MSSV: <strong>{selectedEvaluationDetail.studentCode}</strong> | Ngành: {selectedEvaluationDetail.major}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluationDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Enterprise & Overall Rating Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Doanh nghiệp thực tập:</p>
                <p className="text-sm font-extrabold text-slate-900">{selectedEvaluationDetail.enterpriseName}</p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedEvaluationDetail.positionTitle}</p>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${
                    selectedEvaluationDetail.grade === 'Excellent'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : selectedEvaluationDetail.grade === 'Good'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Xếp loại: {selectedEvaluationDetail.grade}
                </span>
                <p className="text-lg font-black text-orange-600 mt-1">
                  {selectedEvaluationDetail.overallScore} / 10 pts
                </p>
              </div>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                <span className="text-slate-500 block font-medium">Chuyên môn Kỹ thuật</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedEvaluationDetail.technicalScore} / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="text-slate-500 block font-medium">Kỹ năng mềm</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedEvaluationDetail.softSkillScore} / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-green-50/50 border border-green-100">
                <span className="text-slate-500 block font-medium">Thái độ & Kỷ luật</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedEvaluationDetail.attitudeScore} / 10</span>
              </div>
            </div>

            {/* Evaluator & Recommendation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Người chấm điểm (Mentor):</span>
                <strong className="text-slate-900">{selectedEvaluationDetail.evaluatorName} ({selectedEvaluationDetail.evaluatorRole})</strong>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Đề xuất giữ lại làm nhân viên chính thức:</span>
                {selectedEvaluationDetail.recommendForHire ? (
                  <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                    <ThumbsUp size={12} /> Có đề xuất tuyển dụng
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Không</span>
                )}
              </div>
            </div>

            {/* Detailed Comments */}
            <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-200/80 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-orange-900 mb-1.5">
                <MessageSquareQuote size={16} className="text-orange-500" />
                Nhận xét chi tiết từ Mentor Doanh nghiệp:
              </div>
              <p className="italic leading-relaxed text-slate-700 font-medium">
                "{selectedEvaluationDetail.comments}"
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvaluationDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnEnterpriseEvaluations;
