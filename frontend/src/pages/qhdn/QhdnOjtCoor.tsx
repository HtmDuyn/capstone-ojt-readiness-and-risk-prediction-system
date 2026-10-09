import React, { useMemo, useState } from 'react';
import {
  Handshake,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { StudentDetailModal } from '@/components/qhdn/coordination/StudentDetailModal';
import { StudentMatchModal } from '@/components/qhdn/coordination/StudentMatchModal';
import {
  MOCK_ELIGIBLE_STUDENTS,
  MOCK_ENTERPRISE_PARTNERS,
  MOCK_INTERNSHIP_POSITIONS,
} from '@/data/qhdn/qhdnMockData';
import type { EligibleStudent } from '@/types/qhdn/qhdnTypes';

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

export const QhdnOjtCoordination: React.FC = () => {
  const [students, setStudents] = useState<EligibleStudent[]>(() => {
    return MOCK_ELIGIBLE_STUDENTS.map((s, idx) => {
      let cohort = 'K18';
      if (s.studentCode.includes('17')) cohort = 'K17';
      else if (s.studentCode.includes('18')) cohort = 'K18';
      else if (s.studentCode.includes('19')) cohort = 'K19';
      else if (s.studentCode.includes('20')) cohort = 'K20';

      const sems = ['Summer 2026', 'Summer 2026', 'Spring 2026'];
      return {
        ...s,
        cohort,
        semester: sems[idx % sems.length],
      } as EligibleStudent & { cohort: string; semester: string };
    });
  });

  // Filter States
  const [activeStatusTab, setActiveStatusTab] = useState<
    'ALL' | 'Unassigned' | 'Pending Response' | 'Accepted' | 'Rejected'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States: Student Detail & Match/Assign
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<EligibleStudent | null>(null);
  const [selectedStudentForMatch, setSelectedStudentForMatch] = useState<EligibleStudent | null>(null);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');

  // Counts for tabs
  const rejectedCount = students.filter((s) => s.coordinationStatus === 'Rejected').length;
  const unassignedCount = students.filter((s) => s.coordinationStatus === 'Unassigned').length;
  const pendingCount = students.filter(
    (s) => s.coordinationStatus === 'Pending Response' || s.coordinationStatus === 'Interviewing'
  ).length;
  const acceptedCount = students.filter((s) => s.coordinationStatus === 'Accepted').length;

  // Filter logic
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((std: any) => {
      // Search
      const matchesSearch =
        !query ||
        std.fullName.toLowerCase().includes(query) ||
        std.studentCode.toLowerCase().includes(query) ||
        std.major.toLowerCase().includes(query) ||
        (std.assignedEnterpriseName && std.assignedEnterpriseName.toLowerCase().includes(query));

      // Status
      const matchesStatus =
        activeStatusTab === 'ALL' || std.coordinationStatus === activeStatusTab;

      // Semester
      const matchesSemester =
        selectedSemester === 'ALL' || std.semester === selectedSemester;

      // Cohort
      const matchesCohort =
        selectedCohort === 'ALL' || std.cohort === selectedCohort;

      return matchesSearch && matchesStatus && matchesSemester && matchesCohort;
    });
  }, [students, searchTerm, activeStatusTab, selectedSemester, selectedCohort]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );
  const emptyRowsCount = PAGE_SIZE - paginatedStudents.length;

  // Handle assigning / re-allocating a student
  const handleAssignStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMatch || !selectedEnterpriseId) return;

    const enterprise = MOCK_ENTERPRISE_PARTNERS.find((ent) => ent.id === selectedEnterpriseId);
    const position = MOCK_INTERNSHIP_POSITIONS.find((pos) => pos.id === selectedPositionId);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentForMatch.id) {
          return {
            ...s,
            assignedEnterpriseId: enterprise?.id,
            assignedEnterpriseName: enterprise?.name,
            assignedPositionId: position?.id,
            assignedPositionTitle: position?.title || 'Vị trí thực tập OJT',
            coordinationStatus: 'Pending Response',
            rejectionReason: undefined,
            assignedDate: new Date().toISOString().split('T')[0],
          };
        }
        return s;
      })
    );

    setSelectedStudentForMatch(null);
    setSelectedEnterpriseId('');
    setSelectedPositionId('');
  };

  const availablePositionsForSelectedEnterprise = MOCK_INTERNSHIP_POSITIONS.filter(
    (p) => p.enterpriseId === selectedEnterpriseId
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Page Banner ─────────────────────────────────── */}
      <PageBanner
        title="Điều phối & Phân bổ Sinh viên OJT"
        description="Tiếp nhận danh sách sinh viên đủ điều kiện, điều phối hồ sơ đến các doanh nghiệp đối tác và xử lý điều phối lại nếu bị từ chối."
        badge="Phòng QHDN"
      />

      {/* ─── CARD 1: THÔNG BÁO SINH VIÊN BỊ TỪ CHỐI (NẾU CÓ) ─── */}
      {rejectedCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <p className="text-xs text-rose-800 font-medium">
              Hiện có <strong className="font-bold text-rose-950">{rejectedCount} sinh viên</strong> bị doanh nghiệp từ chối. Vui lòng ưu tiên điều phối lại sang doanh nghiệp khác để đảm bảo tiến độ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveStatusTab('Rejected');
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Xem DS bị từ chối ({rejectedCount})
          </button>
        </div>
      )}

      {/* ─── CARD 2: BỘ LỌC & TRẠNG THÁI ĐIỀU PHỐI (CARD RIÊNG) ─── */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Row 1: Status Tabs */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('ALL');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'ALL'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({students.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Unassigned');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Unassigned'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa điều phối ({unassignedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Pending Response');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Pending Response'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ DN duyệt ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Accepted');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === 'Accepted'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã tiếp nhận ({acceptedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('Rejected');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeStatusTab === 'Rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs font-bold'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <RefreshCw size={12} />
              Cần điều phối lại ({rejectedCount})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng số: <strong className="text-slate-800">{filteredStudents.length}</strong> sinh viên
          </div>
        </div>

        {/* Row 2: Search, Học kỳ, Khóa */}
        <div className="p-3 sm:p-4 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên SV, MSSV, ngành học, doanh nghiệp..."
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

          {/* Reset Filters */}
          {(searchTerm || selectedSemester !== 'ALL' || selectedCohort !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSemester('ALL');
                setSelectedCohort('ALL');
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ─── CARD 3: BẢNG DANH SÁCH SINH VIÊN ĐIỀU PHỐI (CARD RIÊNG) ─── */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
        {/* Card Header đồng bộ chuẩn hệ thống */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Handshake size={18} className="text-orange-500" />
              Danh sách Sinh viên Điều phối OJT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi tiến độ tiếp nhận hồ sơ từ doanh nghiệp đối tác và xử lý điều phối
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
            {filteredStudents.length} Sinh viên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[1040px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr className="h-11">
                <th className="px-4 py-3 w-14 text-center">STT</th>
                <th className="px-4 py-3 min-w-[200px]">Sinh viên OJT</th>
                <th className="px-4 py-3 w-44">Chuyên ngành</th>
                <th className="px-4 py-3 w-48">Kỹ năng chính</th>
                <th className="px-4 py-3 min-w-[240px]">Doanh nghiệp phân bổ</th>
                <th className="px-4 py-3 text-center w-40">Trạng thái</th>
                <th className="px-4 py-3 text-right w-44">Thao tác điều phối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-[580px] text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <User size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Không tìm thấy sinh viên phù hợp</p>
                      <p className="text-xs text-slate-400">Hãy thử điều chỉnh lại bộ lọc tìm kiếm.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedStudents.map((std: any, index) => {
                    const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr key={std.id} className="h-[58px] hover:bg-slate-50 transition-colors">
                        {/* STT: Số thuần túy */}
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                          {rowNumber}
                        </td>

                        {/* Sinh viên: Tên, MSSV, Khóa, GPA */}
                        <td className="px-4 py-3 min-w-[200px]">
                          <p className="font-bold text-slate-900 text-sm">{std.fullName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            MSSV: <strong className="text-slate-700 font-semibold">{std.studentCode}</strong> • GPA: {std.gpa} • {std.cohort || 'K18'}
                          </p>
                        </td>

                        {/* Chuyên ngành & Ngoại ngữ */}
                        <td className="px-4 py-3 w-44">
                          <p className="text-slate-800 font-semibold">{std.major}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{std.englishLevel}</p>
                        </td>

                        {/* Kỹ năng chính */}
                        <td className="px-4 py-3 w-48">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {std.topSkills.slice(0, 3).map((sk: string) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded-md border border-slate-200/60 font-medium"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Doanh nghiệp & Vị trí phân bổ */}
                        <td className="px-4 py-3 min-w-[240px]">
                          {std.assignedEnterpriseName ? (
                            <div>
                              <p className="font-bold text-slate-900 text-xs leading-snug" title={std.assignedEnterpriseName}>
                                {std.assignedEnterpriseName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={std.assignedPositionTitle}>
                                {std.assignedPositionTitle || 'Vị trí thực tập OJT'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa phân bổ</span>
                          )}
                        </td>

                        {/* Trạng thái tiếp nhận: Đồng bộ kích thước chuẩn min-w-[125px], không rớt dòng */}
                        <td className="px-4 py-3 text-center w-40">
                          {std.coordinationStatus === 'Accepted' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold whitespace-nowrap min-w-[125px]">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                              Đã tiếp nhận
                            </span>
                          )}
                          {std.coordinationStatus === 'Pending Response' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold whitespace-nowrap min-w-[125px]">
                              <Clock size={13} className="text-amber-600 shrink-0" />
                              Chờ DN duyệt
                            </span>
                          )}
                          {std.coordinationStatus === 'Interviewing' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold whitespace-nowrap min-w-[125px]">
                              <Clock size={13} className="text-blue-600 shrink-0" />
                              Đang phỏng vấn
                            </span>
                          )}
                          {std.coordinationStatus === 'Rejected' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold whitespace-nowrap min-w-[125px]">
                              <XCircle size={13} className="text-rose-600 shrink-0" />
                              DN từ chối
                            </span>
                          )}
                          {std.coordinationStatus === 'Unassigned' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-xs font-medium whitespace-nowrap min-w-[125px]">
                              Chờ phân bổ
                            </span>
                          )}
                        </td>

                        {/* Thao tác điều phối: Icon Chi tiết luôn cố định ở mép phải, Điều phối lại nằm bên trái */}
                        <td className="px-4 py-3 text-right w-44">
                          <div className="inline-flex items-center justify-end gap-1.5 w-full">
                            {/* Nút Điều phối lại: Xuất hiện bên trái nút mắt khi sinh viên cần điều phối */}
                            {(std.coordinationStatus === 'Rejected' || std.coordinationStatus === 'Unassigned') && (
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForMatch(std)}
                                className="h-8 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                title="Điều phối lại doanh nghiệp cho sinh viên"
                              >
                                <RefreshCw size={12} />
                                Điều phối lại
                              </button>
                            )}

                            {/* Nút Chi tiết (Icon mắt): Cố định thẳng hàng ở vị trí ngoài cùng bên phải */}
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(std)}
                              className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/80 transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center shadow-2xs shrink-0"
                              title="Xem thông tin chi tiết sinh viên"
                              aria-label={`Xem chi tiết sinh viên ${std.fullName}`}
                            >
                              <Eye size={15} className="text-orange-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows filler for constant 10-row height */}
                  {emptyRowsCount > 0 &&
                    Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr key={`empty-std-row-${i}`} className="h-[58px] pointer-events-none select-none border-b border-slate-50">
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
            {filteredStudents.length === 0
              ? 'Không có dữ liệu hiển thị'
              : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safeCurrentPage * PAGE_SIZE,
                  filteredStudents.length
                )} trong ${filteredStudents.length} sinh viên`}
          </p>

          <nav className="flex items-center gap-1" aria-label="Phân trang sinh viên">
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

      {/* ─── MODAL 1: CHI TIẾT THÔNG TIN SINH VIÊN ─────────────── */}
      <StudentDetailModal
        student={selectedStudentDetail}
        isOpen={Boolean(selectedStudentDetail)}
        onClose={() => setSelectedStudentDetail(null)}
        onReassign={(std) => setSelectedStudentForMatch(std)}
      />

      {/* ─── MODAL 2: ĐIỀU PHỐI / PHÂN BỔ DOANH NGHIỆP ─────────── */}
      <StudentMatchModal
        student={selectedStudentForMatch}
        isOpen={Boolean(selectedStudentForMatch)}
        onClose={() => setSelectedStudentForMatch(null)}
        partners={MOCK_ENTERPRISE_PARTNERS}
        selectedEnterpriseId={selectedEnterpriseId}
        onSelectEnterprise={(id) => {
          setSelectedEnterpriseId(id);
          setSelectedPositionId('');
        }}
        selectedPositionId={selectedPositionId}
        onSelectPosition={setSelectedPositionId}
        availablePositions={availablePositionsForSelectedEnterprise}
        onSubmit={handleAssignStudent}
      />
    </div>
  );
};

export default QhdnOjtCoordination;
