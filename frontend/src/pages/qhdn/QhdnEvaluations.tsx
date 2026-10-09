import React, { useMemo, useState } from 'react';
import {
  Award,
  Search,
  Download,
  Filter,
  Eye,
  X,
  Calendar,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { MOCK_ENTERPRISE_EVALUATIONS } from '@/data/qhdn/qhdnMockData';
import type { EnterpriseEvaluation } from '@/types/qhdn/qhdnTypes';

const PAGE_SIZE = 10;

const SEMESTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả học kỳ' },
  { value: 'Summer 2026', label: 'Summer 2026' },
  { value: 'Spring 2026', label: 'Spring 2026' },
  { value: 'Fall 2025', label: 'Fall 2025' },
  { value: 'Summer 2025', label: 'Summer 2025' },
];

const COHORT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả khóa' },
  { value: 'K17', label: 'Khóa K17' },
  { value: 'K18', label: 'Khóa K18' },
  { value: 'K19', label: 'Khóa K19' },
  { value: 'K20', label: 'Khóa K20' },
];

export const QhdnEnterpriseEvaluations: React.FC = () => {
  const [evaluations] = useState<
    (EnterpriseEvaluation & { cohort: string; semester: string })[]
  >(() => {
    return MOCK_ENTERPRISE_EVALUATIONS.map((item, idx) => {
      let cohort = 'K18';
      if (item.studentCode.includes('17')) cohort = 'K17';
      else if (item.studentCode.includes('18')) cohort = 'K18';
      else if (item.studentCode.includes('19')) cohort = 'K19';
      else if (item.studentCode.includes('20')) cohort = 'K20';

      const sems = ['Summer 2026', 'Summer 2026', 'Spring 2026'];
      return {
        ...item,
        cohort,
        semester: sems[idx % sems.length],
      };
    });
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [scoreFilter, setScoreFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Evaluation for Modal Detail
  const [selectedEvaluationDetail, setSelectedEvaluationDetail] = useState<
    (EnterpriseEvaluation & { cohort: string; semester: string }) | null
  >(null);

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return evaluations.filter((evalItem) => {
      // Search
      const matchesSearch =
        !query ||
        evalItem.studentName.toLowerCase().includes(query) ||
        evalItem.studentCode.toLowerCase().includes(query) ||
        evalItem.enterpriseName.toLowerCase().includes(query) ||
        evalItem.evaluatorName.toLowerCase().includes(query);

      // Semester
      const matchesSemester =
        selectedSemester === 'ALL' || evalItem.semester === selectedSemester;

      // Cohort
      const matchesCohort =
        selectedCohort === 'ALL' || evalItem.cohort === selectedCohort;

      // Score
      const matchesScore =
        scoreFilter === 'ALL' ||
        (scoreFilter === 'HIGH' && evalItem.overallScore >= 9.0) ||
        (scoreFilter === 'MED' && evalItem.overallScore >= 8.0 && evalItem.overallScore < 9.0) ||
        (scoreFilter === 'PASS' && evalItem.overallScore < 8.0);

      return matchesSearch && matchesSemester && matchesCohort && matchesScore;
    });
  }, [evaluations, searchTerm, selectedSemester, selectedCohort, scoreFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvaluations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvaluations = filteredEvaluations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );
  const emptyRowsCount = PAGE_SIZE - paginatedEvaluations.length;

  const avgOverallScore = (
    evaluations.reduce((acc, curr) => acc + curr.overallScore, 0) / evaluations.length
  ).toFixed(1);

  const excellentCount = evaluations.filter((e) => e.overallScore >= 8.5).length;
  const excellentRate = Math.round((excellentCount / evaluations.length) * 100);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSemester !== 'ALL' ||
    selectedCohort !== 'ALL' ||
    scoreFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSemester('ALL');
    setSelectedCohort('ALL');
    setScoreFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Page Banner ─────────────────────────────────── */}
      <PageBanner
        title="Báo cáo & Đánh giá Thực tập OJT"
        description="Tổng hợp kết quả đánh giá thực tập OJT, điểm kỹ năng chuyên môn và thái độ làm việc từ người hướng dẫn doanh nghiệp."
        badge="Phòng QHDN"
      />

      {/* ─── CARD 1: PHẦN BÁO CÁO TỔNG QUAN (CARD RIÊNG BIỆT) ─── */}
      <div className="card-glass border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
            {/* KPI 1 */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Điểm OJT Trung bình</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{avgOverallScore}</span>
                <span className="text-xs font-normal text-slate-400">/ 10.0</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Đạt chuẩn chất lượng đầu ra
              </p>
            </div>

            {/* KPI 2 */}
            <div className="space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-6">
              <span className="text-xs font-medium text-slate-500">Tổng số phiếu đánh giá</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{evaluations.length}</span>
                <span className="text-xs font-normal text-slate-400">phiếu</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <FileCheck2 size={12} className="text-blue-500" /> Đã nghiệm thu kết quả
              </p>
            </div>

            {/* KPI 3 */}
            <div className="space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-6">
              <span className="text-xs font-medium text-slate-500">Tỷ lệ Giỏi & Xuất sắc</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{excellentRate}%</span>
                <span className="text-xs font-normal text-slate-400">({excellentCount}/{evaluations.length} SV)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Điểm tổng kết từ 8.5 trở lên
              </p>
            </div>
          </div>

          {/* Action Export Excel */}
          <div className="shrink-0 self-end lg:self-center">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <Download size={15} />
              Xuất báo cáo Excel
            </button>
          </div>
        </div>
      </div>

      {/* ─── CARD 2: BẢNG DANH SÁCH ĐÁNH GIÁ (CARD RIÊNG BIỆT) ─── */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
        {/* Card Header & Filter Toolbar: Kỳ, Khóa, Khung điểm, Tìm kiếm */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên SV, MSSV, doanh nghiệp, mentor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lọc Học kỳ */}
          <div className="relative min-w-[160px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Calendar size={15} />
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo học kỳ"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              {SEMESTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Khóa */}
          <div className="relative min-w-[140px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <GraduationCap size={15} />
            </div>
            <select
              value={selectedCohort}
              onChange={(e) => {
                setSelectedCohort(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo khóa sinh viên"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              {COHORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Khung điểm */}
          <div className="relative min-w-[170px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Filter size={15} />
            </div>
            <select
              value={scoreFilter}
              onChange={(e) => {
                setScoreFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo khung điểm"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">Tất cả điểm số</option>
              <option value="HIGH">Điểm từ 9.0 trở lên</option>
              <option value="MED">Điểm từ 8.0 – 8.9</option>
              <option value="PASS">Điểm dưới 8.0</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Đặt lại
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Tìm thấy <strong className="text-slate-800">{filteredEvaluations.length}</strong> kết quả
          </div>
        </div>

        {/* ─── TABLE: Thêm STT, Xóa avatar, Xóa icon DN, Bỏ đề xuất, Bỏ xếp loại, Thêm màu nút Chi tiết ─── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[880px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr className="h-11">
                <th className="px-4 py-3 w-14 text-center">STT</th>
                <th className="px-4 py-3">Sinh viên OJT</th>
                <th className="px-4 py-3 w-36">Kỳ & Khóa</th>
                <th className="px-4 py-3 w-60">Doanh nghiệp & Vị trí</th>
                <th className="px-4 py-3 text-center w-36">Điểm đánh giá</th>
                <th className="px-4 py-3 w-52">Người đánh giá (Mentor)</th>
                <th className="px-4 py-3 text-right w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-[580px] text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Award size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Không tìm thấy phiếu đánh giá phù hợp</p>
                      <p className="text-xs text-slate-400">Hãy thử xóa hoặc điều chỉnh bộ lọc.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedEvaluations.map((item, index) => {
                    const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedEvaluationDetail(item)}
                        className="h-[58px] hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        {/* STT: Số thuần túy */}
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                          {rowNumber}
                        </td>

                        {/* Sinh viên: KHÔNG có Avatar hình tròn */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                            {item.studentName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            MSSV: <strong className="text-slate-700 font-semibold">{item.studentCode}</strong> | {item.major}
                          </p>
                        </td>

                        {/* Kỳ & Khóa */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 text-xs">{item.semester || 'Summer 2026'}</p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200/60">
                            {item.cohort || 'K18'}
                          </span>
                        </td>

                        {/* Doanh nghiệp & Vị trí: XÓA ICON DOANH NGHIỆP */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-xs">{item.enterpriseName}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.positionTitle}</p>
                        </td>

                        {/* Điểm OJT: CHỈ GIỮ LẠI ĐIỂM SỐ (Bỏ phần xếp loại) */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.overallScore} <span className="text-xs font-normal text-slate-400">/ 10</span>
                          </span>
                        </td>

                        {/* Người đánh giá */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 text-xs">{item.evaluatorName}</p>
                          <p className="text-xs text-slate-400">{item.evaluatorRole}</p>
                        </td>

                        {/* Thao tác: NÚT CHI TIẾT CÓ MÀU CAM DỊU MẮT */}
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedEvaluationDetail(item)}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-xs border border-orange-200/80 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            title="Xem chi tiết phiếu đánh giá"
                          >
                            <Eye size={13} className="text-orange-500" />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows filler for strictly constant 10-row height */}
                  {emptyRowsCount > 0 &&
                    Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr key={`empty-eval-row-${i}`} className="h-[58px] pointer-events-none select-none border-b border-slate-50">
                        <td colSpan={7} className="px-4 py-3 text-transparent">
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── FIXED PAGINATION FOOTER ───────────────────────── */}
        <div className="border-t border-slate-100 px-5 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            {filteredEvaluations.length === 0
              ? 'Không có dữ liệu'
              : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safeCurrentPage * PAGE_SIZE,
                  filteredEvaluations.length
                )} trong ${filteredEvaluations.length} đánh giá`}
          </p>

          <nav className="flex items-center gap-1" aria-label="Phân trang đánh giá">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Trang trước"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                aria-current={safeCurrentPage === item ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                  safeCurrentPage === item
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Trang sau"
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>

      {/* ─── MODAL: CHI TIẾT PHIẾU ĐÁNH GIÁ ────────────────── */}
      {selectedEvaluationDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Phiếu Đánh giá Kết quả Thực tập
                </h3>
                <p className="text-xs text-slate-500">
                  Doanh nghiệp: {selectedEvaluationDetail.enterpriseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluationDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Student info */}
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sinh viên:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEvaluationDetail.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã sinh viên:</span>
                  <span className="font-semibold text-slate-800">{selectedEvaluationDetail.studentCode} ({selectedEvaluationDetail.cohort})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học kỳ:</span>
                  <span className="text-slate-800 font-medium">{selectedEvaluationDetail.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị trí thực tập:</span>
                  <span className="text-slate-800">{selectedEvaluationDetail.positionTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người đánh giá:</span>
                  <span className="text-slate-800">{selectedEvaluationDetail.evaluatorName} ({selectedEvaluationDetail.evaluatorRole})</span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 text-sm">Điểm tổng kết OJT:</span>
                  <span className="text-lg font-extrabold text-slate-900">{selectedEvaluationDetail.overallScore} / 10</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Kỹ năng chuyên môn kỹ thuật:</span>
                  <span className="font-bold text-slate-900">{selectedEvaluationDetail.technicalScore} / 10</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Kỹ năng mềm & Giao tiếp:</span>
                  <span className="font-bold text-slate-900">{selectedEvaluationDetail.softSkillScore} / 10</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Thái độ làm việc & Kỷ luật:</span>
                  <span className="font-bold text-slate-900">{selectedEvaluationDetail.attitudeScore} / 10</span>
                </div>
              </div>

              {/* Comments */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 block">Nhận xét từ Người hướng dẫn:</span>
                <p className="text-slate-600 italic leading-relaxed">
                  "{selectedEvaluationDetail.comments}"
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvaluationDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnEnterpriseEvaluations;
