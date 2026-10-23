import React, { useMemo, useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Download,
  Eye,
  Send,
  Calendar,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileSpreadsheet,
  Building2,
  Award,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  listInternshipEvaluations,
  listOjtResults,
  transferOjtResult,
  exportOjtResultsUrl,
  searchOjtSemesters,
  generateIdempotencyKey,
} from '@/services/qhdnService';

import type {
  InternshipEvaluationItem,
  OjtResultItem,
  OjtSemesterItem,
} from '@/types/qhdn/qhdnTypes';

const PAGE_SIZE = 10;

const COHORT_OPTIONS = [
  { value: 'ALL', label: 'Tất cả khóa' },
  { value: 'K17', label: 'Khóa K17' },
  { value: 'K18', label: 'Khóa K18' },
  { value: 'K19', label: 'Khóa K19' },
  { value: 'K20', label: 'Khóa K20' },
];

export const QhdnEnterpriseEvaluations: React.FC = () => {
  // Semester list
  const [semesters, setSemesters] = useState<OjtSemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Raw data from API
  const [evaluations, setEvaluations] = useState<InternshipEvaluationItem[]>([]);
  const [ojtResults, setOjtResults] = useState<OjtResultItem[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [scoreFilter, setScoreFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Evaluation for Modal Detail
  const [selectedEvalDetail, setSelectedEvalDetail] = useState<
    (InternshipEvaluationItem & { transferStatus?: string; officialResult?: OjtResultItem }) | null
  >(null);

  // Modal Transfer to Academic state
  const [transferTarget, setTransferTarget] = useState<InternshipEvaluationItem | null>(null);
  const [transferReason, setTransferReason] = useState<string>('Báo cáo hoàn thành thực tập và bàn giao điểm OJT');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await searchOjtSemesters({ page: 1, limit: 50 });
        if (res?.items && res.items.length > 0) {
          setSemesters(res.items);
          const active = res.items.find((s) => s.status === 'ACTIVE') || res.items[0];
          setSelectedSemesterId(active.id);
        }
      } catch (err) {
        console.warn('Không thể tải danh sách kỳ OJT:', err);
      }
    };
    fetchSemesters();
  }, []);

  // 2. Fetch Evaluations & OJT Results
  const fetchData = async (semesterId: number) => {
    setIsLoading(true);
    try {
      const [evalRes, resultRes] = await Promise.allSettled([
        listInternshipEvaluations({ ojtSemesterId: semesterId, page: 1, limit: 100 }),
        listOjtResults({ ojtSemesterId: semesterId, page: 1, limit: 100 }),
      ]);

      if (evalRes.status === 'fulfilled' && evalRes.value?.data?.items) {
        setEvaluations(evalRes.value.data.items);
      } else {
        setEvaluations([]);
      }

      if (resultRes.status === 'fulfilled' && resultRes.value?.data?.items) {
        setOjtResults(resultRes.value.data.items);
      } else {
        setOjtResults([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải kết quả đánh giá:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemesterId) {
      fetchData(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  // Map each evaluation with corresponding OjtResult
  const mappedEvaluations = useMemo(() => {
    const resultMap = new Map<number, OjtResultItem>();
    ojtResults.forEach((res) => {
      if (res.assignmentId) {
        resultMap.set(res.assignmentId, res);
      }
    });

    return evaluations.map((item) => {
      const official = resultMap.get(item.assignmentId);
      let transferStatus: 'CONFIRMED' | 'PENDING_ACADEMIC_CONFIRMATION' | 'NOT_TRANSFERRED' =
        'NOT_TRANSFERRED';

      if (official) {
        if (official.status === 'CONFIRMED') {
          transferStatus = 'CONFIRMED';
        } else {
          transferStatus = 'PENDING_ACADEMIC_CONFIRMATION';
        }
      }

      return {
        ...item,
        transferStatus,
        officialResult: official,
      };
    });
  }, [evaluations, ojtResults]);

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return mappedEvaluations.filter((evalItem) => {
      // Search
      const matchesSearch =
        !query ||
        (evalItem.fullName && evalItem.fullName.toLowerCase().includes(query)) ||
        (evalItem.studentCode && evalItem.studentCode.toLowerCase().includes(query)) ||
        (evalItem.companyName && evalItem.companyName.toLowerCase().includes(query)) ||
        (evalItem.evaluatedByUser?.fullName && evalItem.evaluatedByUser.fullName.toLowerCase().includes(query));

      // Cohort
      const matchesCohort =
        selectedCohort === 'ALL' ||
        (evalItem.student?.cohortName && evalItem.student.cohortName.includes(selectedCohort));

      // Score
      const score = Number(evalItem.overallScore) || 0;
      const matchesScore =
        scoreFilter === 'ALL' ||
        (scoreFilter === 'GE_9' && score >= 9.0) ||
        (scoreFilter === 'GE_8' && score >= 8.0 && score < 9.0) ||
        (scoreFilter === 'GE_7' && score >= 7.0 && score < 8.0) ||
        (scoreFilter === 'LT_7' && score < 7.0);

      // Status
      const matchesStatus =
        statusFilter === 'ALL' || evalItem.transferStatus === statusFilter;

      return matchesSearch && matchesCohort && matchesScore && matchesStatus;
    });
  }, [mappedEvaluations, searchTerm, selectedCohort, scoreFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvaluations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvaluations = filteredEvaluations.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );
  const emptyRowsCount = PAGE_SIZE - paginatedEvaluations.length;

  // Handle Transfer Result to Academic Department
  const handleConfirmTransfer = async () => {
    if (!transferTarget) return;

    setIsTransferring(true);
    try {
      const idempotencyKey = generateIdempotencyKey('transfer');
      await transferOjtResult({
        assignmentId: transferTarget.assignmentId,
        reason: transferReason.trim() || 'Chuyển giao kết quả đánh giá OJT cho Phòng Đào tạo',
        idempotencyKey,
      });

      setToast({
        type: 'success',
        message: `Đã gửi kết quả OJT của sinh viên ${transferTarget.fullName || transferTarget.studentCode} sang Phòng Đào tạo!`,
      });

      setTransferTarget(null);
      await fetchData(selectedSemesterId);
    } catch (err: any) {
      console.error('Lỗi khi chuyển giao kết quả OJT:', err);
      const msg = err.response?.data?.message || err.message || 'Chuyển giao kết quả thất bại!';
      setToast({ type: 'error', message: msg });
    } finally {
      setIsTransferring(false);
    }
  };

  // Export report handler
  const handleExportReport = () => {
    const url = exportOjtResultsUrl(selectedSemesterId, 'csv');
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Banner */}
      <PageBanner
        title="Đánh giá Thực tập & Chuyển giao Phòng Đào tạo"
        description="Tiếp nhận phiếu điểm từ Doanh nghiệp đối tác, kiểm tra đối soát và chuyển giao kết quả OJT chính thức cho Phòng Đào tạo xác nhận."
        badge="Phòng QHDN"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-glass border border-slate-200/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Phiếu đánh giá từ DN</span>
            <FileCheck2 size={17} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{evaluations.length}</p>
          <p className="mt-1 text-xs text-slate-400">Doanh nghiệp đã nộp</p>
        </div>

        <div className="card-glass border border-slate-200/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đã chuyển giao PĐT</span>
            <Send size={17} className="text-orange-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-600">{ojtResults.length}</p>
          <p className="mt-1 text-xs text-slate-400">Đang chờ hoặc đã xác nhận</p>
        </div>

        <div className="card-glass border border-slate-200/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">PĐT đã chốt điểm</span>
            <CheckCircle2 size={17} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {ojtResults.filter((r) => r.status === 'CONFIRMED').length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Điểm OJT chính thức</p>
        </div>

        <div className="card-glass border border-slate-200/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Chưa chuyển giao</span>
            <Clock size={17} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-700">
            {Math.max(0, evaluations.length - ojtResults.length)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Cần QHDN gửi sang Đào tạo</p>
        </div>
      </div>

      {/* FILTER & TOOLBAR CARD */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên SV, MSSV, DN, người hướng dẫn..."
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Học kỳ */}
            <div className="relative min-w-[190px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={15} />
              </div>
              <select
                value={selectedSemesterId}
                onChange={(e) => {
                  setSelectedSemesterId(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Chọn học kỳ"
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name || sem.code || `Kỳ #${sem.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái gửi Đào tạo */}
            <div className="relative min-w-[160px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Lọc trạng thái chuyển giao"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái PĐT</option>
                <option value="NOT_TRANSFERRED">Chưa gửi Đào tạo</option>
                <option value="PENDING_ACADEMIC_CONFIRMATION">Chờ Đào tạo xác nhận</option>
                <option value="CONFIRMED">Đào tạo đã xác nhận</option>
              </select>
            </div>

            {/* Mức điểm */}
            <div className="relative min-w-[130px]">
              <select
                value={scoreFilter}
                onChange={(e) => {
                  setScoreFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Lọc mức điểm"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
              >
                <option value="ALL">Tất cả điểm</option>
                <option value="GE_9">Xuất sắc (≥ 9.0)</option>
                <option value="GE_8">Giỏi (8.0 - 8.9)</option>
                <option value="GE_7">Khá (7.0 - 7.9)</option>
                <option value="LT_7">Cần cải thiện (&lt; 7.0)</option>
              </select>
            </div>
          </div>

          {/* Export Report Action */}
          <button
            type="button"
            onClick={handleExportReport}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            title="Xuất bảng điểm OJT tổng hợp sang CSV"
          >
            <Download size={14} />
            Xuất Báo cáo CSV
          </button>
        </div>
      </div>

      {/* EVALUATION LIST TABLE CARD */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-orange-500" />
              Sổ Đánh giá Doanh nghiệp & Chuyển giao Điểm OJT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi điểm thực tập do Mentor DN đánh giá và chuyển giao cho Phòng Đào tạo (ACADEMIC)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
            {filteredEvaluations.length} Phiếu đánh giá
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[1040px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr className="h-11">
                <th className="px-4 py-3 w-14 text-center">STT</th>
                <th className="px-4 py-3 min-w-[200px]">Sinh viên OJT</th>
                <th className="px-4 py-3 min-w-[220px]">Doanh nghiệp thực tập</th>
                <th className="px-4 py-3 text-center w-28">Điểm tổng kết</th>
                <th className="px-4 py-3 w-44">Người đánh giá</th>
                <th className="px-4 py-3 text-center w-48">Chuyển giao Đào tạo</th>
                <th className="px-4 py-3 text-right w-44">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-64 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileCheck2 size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Chưa có phiếu đánh giá nào</p>
                      <p className="text-xs text-slate-400">Không tìm thấy bản ghi phù hợp hoặc DN chưa nộp đánh giá kỳ này.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvaluations.map((item, index) => {
                  const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

                  return (
                    <tr key={item.id} className="h-[58px] hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                        {rowNumber}
                      </td>

                      <td className="px-4 py-3 min-w-[200px]">
                        <p className="font-bold text-slate-900 text-sm">
                          {item.fullName || item.student?.fullName || `SV #${item.assignmentId}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          MSSV: <strong className="text-slate-700 font-semibold">{item.studentCode || item.student?.studentCode || ''}</strong>
                        </p>
                      </td>

                      <td className="px-4 py-3 min-w-[220px]">
                        <p className="font-bold text-slate-900 text-xs">
                          {item.companyName || item.company?.name || 'Doanh nghiệp'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Vị trí: {item.positionTitle || item.position?.title || 'Thực tập sinh'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center w-28">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {Number(item.overallScore).toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 w-44">
                        <p className="font-semibold text-slate-900 text-xs">
                          {item.evaluatedByUser?.fullName || 'Người hướng dẫn DN'}
                        </p>
                        <p className="text-xs text-slate-400">Mentor Doanh nghiệp</p>
                      </td>

                      {/* Trạng thái gửi về phòng Đào tạo */}
                      <td className="px-4 py-3 text-center w-48">
                        {item.transferStatus === 'CONFIRMED' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold whitespace-nowrap">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            Đào tạo đã xác nhận
                          </span>
                        )}
                        {item.transferStatus === 'PENDING_ACADEMIC_CONFIRMATION' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 text-xs font-semibold whitespace-nowrap">
                            <Clock size={13} className="text-orange-600 shrink-0" />
                            Chờ Đào tạo xác nhận
                          </span>
                        )}
                        {item.transferStatus === 'NOT_TRANSFERRED' && (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium whitespace-nowrap">
                            Chưa gửi Đào tạo
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3 text-right w-44">
                        <div className="inline-flex items-center justify-end gap-1.5 w-full">
                          {/* Nút gửi kết quả sang Đào tạo */}
                          {item.transferStatus === 'NOT_TRANSFERRED' && (
                            <button
                              type="button"
                              onClick={() => setTransferTarget(item)}
                              className="h-8 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Chuyển giao kết quả OJT sang Phòng Đào tạo"
                            >
                              <Send size={12} />
                              Gửi PĐT
                            </button>
                          )}

                          {/* Nút xem chi tiết phiếu điểm */}
                          <button
                            type="button"
                            onClick={() => setSelectedEvalDetail(item)}
                            className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/80 transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center shadow-2xs shrink-0"
                            title="Xem chi tiết phiếu đánh giá"
                            aria-label="Xem chi tiết phiếu đánh giá"
                          >
                            <Eye size={15} className="text-orange-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FIXED PAGINATION FOOTER */}
        <div className="border-t border-slate-100 px-5 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            {filteredEvaluations.length === 0
              ? 'Không có dữ liệu hiển thị'
              : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safeCurrentPage * PAGE_SIZE,
                  filteredEvaluations.length
                )} trong ${filteredEvaluations.length} phiếu đánh giá`}
          </p>

          <nav className="flex items-center gap-1" aria-label="Phân trang phiếu đánh giá">
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

      {/* MODAL 1: CHI TIẾT PHIẾU ĐÁNH GIÁ THỰC TẬP */}
      {selectedEvalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={18} className="text-orange-500" />
                Chi tiết Phiếu đánh giá Thực tập OJT
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEvalDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Sinh viên:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedEvalDetail.fullName || selectedEvalDetail.studentCode}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">MSSV:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedEvalDetail.studentCode}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Doanh nghiệp:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedEvalDetail.companyName || 'Doanh nghiệp đối tác'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Vị trí:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedEvalDetail.positionTitle || 'Thực tập sinh'}
                  </p>
                </div>
              </div>

              {/* Bảng điểm chi tiết */}
              <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100/70 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Bảng điểm các tiêu chí (Thang điểm 10)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-orange-100">
                    <p className="text-[11px] text-slate-500">Mức độ hoàn thành</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {Number(selectedEvalDetail.completionScore).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-orange-100">
                    <p className="text-[11px] text-slate-500">Thái độ & Kỷ luật</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {Number(selectedEvalDetail.attitudeScore).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-orange-100">
                    <p className="text-[11px] text-slate-500">Kỹ năng chuyên môn</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {Number(selectedEvalDetail.skillScore).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-orange-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800">ĐIỂM ĐÁNH GIÁ TỔNG KẾT:</span>
                  <span className="text-lg font-black text-orange-600">
                    {Number(selectedEvalDetail.overallScore).toFixed(1)} / 10
                  </span>
                </div>
              </div>

              {/* Nhận xét */}
              <div>
                <span className="text-slate-500 font-semibold">Nhận xét từ Mentor Doanh nghiệp:</span>
                <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 italic">
                  "{selectedEvalDetail.comments || 'Sinh viên hoàn thành tốt nhiệm vụ được giao, có tinh thần học hỏi cao.'}"
                </p>
              </div>

              {/* Trạng thái xác nhận Đào tạo */}
              {selectedEvalDetail.officialResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs">
                  <p className="font-bold">
                    Trạng thái tại Phòng Đào tạo: {selectedEvalDetail.officialResult.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN CHÍNH THỨC' : 'CHỜ XÁC NHẬN'}
                  </p>
                  {selectedEvalDetail.officialResult.confirmedAt && (
                    <p className="text-[11px] mt-0.5 text-emerald-600">
                      Thời gian xác nhận: {new Date(selectedEvalDetail.officialResult.confirmedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvalDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN CHUYỂN GIAO KẾT QUẢ SANG PHÒNG ĐÀO TẠO */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-orange-500" />
                Chuyển giao kết quả OJT cho Đào tạo
              </h3>
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Bạn đang chuẩn bị chuyển giao kết quả OJT của sinh viên{' '}
                <strong className="text-slate-900 font-bold">
                  {transferTarget.fullName || transferTarget.studentCode}
                </strong>{' '}
                với điểm tổng kết là{' '}
                <strong className="text-orange-600 font-extrabold text-sm">
                  {Number(transferTarget.overallScore).toFixed(1)} / 10
                </strong>{' '}
                sang cho Phòng Đào tạo (ACADEMIC) để đối soát và chốt điểm chính thức.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do / Ghi chú chuyển giao:
                </label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="Nhập ghi chú hoặc lý do chuyển giao kết quả..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                disabled={isTransferring}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isTransferring}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTransferring ? (
                  <>
                    <Clock size={13} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Xác nhận chuyển giao
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnEnterpriseEvaluations;
