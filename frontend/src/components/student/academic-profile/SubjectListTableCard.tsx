import React, { useState, useMemo, useCallback } from 'react';
import type { SubjectStatus } from '@/types/student/academicProfileTypes';
import { mockSubjectList } from '@/data/student/mockAcademicProfileData';
import { DownloadIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, CloseIcon } from '@/components/common/icons/AppIcons';
import { useStudentAIConsult } from '../../../layouts/BaseLayout';

/* ─── Status Badge Configuration ─────────────────────────────── */
const STATUS_CONFIG: Record<SubjectStatus, { label: string; dot: string; pill: string }> = {
  in_progress: {
    label: 'Đang học',
    dot: 'bg-orange-500 animate-pulse',
    pill: 'bg-orange-100/80 text-orange-700 border-orange-200',
  },
  completed: {
    label: 'Hoàn thành',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  },
  failed: {
    label: 'Chưa đạt',
    dot: 'bg-rose-500',
    pill: 'bg-rose-100/80 text-rose-700 border-rose-200',
  },
  not_started: {
    label: 'Chưa học',
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const StatusBadge: React.FC<{ status: SubjectStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Filter Options Constants ───────────────────────────────── */
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'in_progress', label: 'Đang học' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'failed', label: 'Chưa đạt' },
  { value: 'not_started', label: 'Chưa học' },
];

const SEMESTER_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả học kỳ' },
  { value: 'Kỳ 1', label: 'Học kỳ 1' },
  { value: 'Kỳ 2', label: 'Học kỳ 2' },
  { value: 'Kỳ 3', label: 'Học kỳ 3' },
  { value: 'Kỳ 4', label: 'Học kỳ 4' },
  { value: 'Kỳ 5', label: 'Học kỳ 5' },
  { value: 'Kỳ 6', label: 'Học kỳ 6' },
];

const ITEMS_PER_PAGE = 7;
const MAX_PAGE_VISIBLE = 4;

/* ─── Main Component ─────────────────────────────────────────── */
export const SubjectListTableCard: React.FC = () => {
  const { openAIConsult } = useStudentAIConsult();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Compute status counts for quick pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockSubjectList.length };
    mockSubjectList.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter subject list cleanly with memoization
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return mockSubjectList.filter((s) => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchSemester = semesterFilter === 'all' || s.semester === semesterFilter;
      const matchQuery =
        !query ||
        s.code.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);

      return matchStatus && matchSemester && matchQuery;
    });
  }, [statusFilter, semesterFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  // Current page items
  const currentItems = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  // Pagination button numbers
  const pageNumbers = useMemo(() => {
    let start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + MAX_PAGE_VISIBLE - 1);
    if (end - start + 1 < MAX_PAGE_VISIBLE) start = Math.max(1, end - MAX_PAGE_VISIBLE + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  // Reset pagination on filter change
  const handleStatusFilterChange = useCallback((v: string) => { setStatusFilter(v); setPage(1); }, []);
  const handleSemesterFilterChange = useCallback((v: string) => { setSemesterFilter(v); setPage(1); }, []);
  const handleSearchQueryChange = useCallback((v: string) => { setSearchQuery(v); setPage(1); }, []);

  const hasActiveFilters = statusFilter !== 'all' || semesterFilter !== 'all' || searchQuery !== '';
  const resetFilters = () => {
    setStatusFilter('all');
    setSemesterFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col h-full rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Header Title & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
            Danh sách môn học
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tổng cộng <strong className="text-slate-800 font-bold">{filtered.length}</strong> môn học trong chương trình
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <input
              type="text"
              placeholder="Tìm mã hoặc tên môn..."
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs font-outfit transition-all"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon size={14} />
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <CloseIcon size={13} />
              </button>
            )}
          </div>

          {/* Filter Semester Dropdown */}
          <div className="relative">
            <select
              value={semesterFilter}
              onChange={(e) => handleSemesterFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs font-outfit cursor-pointer"
            >
              {SEMESTER_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <ChevronDownIcon size={13} />
            </span>
          </div>

          {/* Filter Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs font-outfit cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <ChevronDownIcon size={13} />
            </span>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              Xóa lọc
            </button>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={() =>
              openAIConsult('Tôi muốn xuất danh sách môn học ra file Excel/CSV. Hướng dẫn cách thực hiện?')
            }
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Xuất danh sách môn học"
          >
            <DownloadIcon size={17} />
          </button>
        </div>
      </div>

      {/* Quick Status Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs font-outfit">
        <button
          type="button"
          onClick={() => handleStatusFilterChange('all')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          Tất cả ({statusCounts.all || 0})
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('in_progress')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            statusFilter === 'in_progress'
              ? 'bg-orange-500 text-white shadow-2xs'
              : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
          }`}
        >
          Đang học ({statusCounts.in_progress || 0})
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('completed')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          Hoàn thành ({statusCounts.completed || 0})
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('failed')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            statusFilter === 'failed'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          Chưa đạt ({statusCounts.failed || 0})
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('not_started')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            statusFilter === 'not_started'
              ? 'bg-slate-700 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/70'
          }`}
        >
          Chưa học ({statusCounts.not_started || 0})
        </button>
      </div>

      {/* Table Container with Strict Colgroup */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/70">
        <table className="w-full text-left border-collapse min-w-[760px] table-fixed">
          <colgroup>
            <col style={{ width: '55px' }} />
            <col style={{ width: '115px' }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: '85px' }} />
            <col style={{ width: '55px' }} />
            <col style={{ width: '135px' }} />
            <col style={{ width: '160px' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/90 text-[11px] font-bold text-slate-500 tracking-wider font-outfit uppercase">
              <th className="py-3 px-3 text-center">STT</th>
              <th className="py-3 px-4">Mã môn</th>
              <th className="py-3 px-4">Tên môn học</th>
              <th className="py-3 px-3 text-center">Kỳ</th>
              <th className="py-3 px-3 text-center">TC</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Tiên quyết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-outfit">
            {currentItems.map((s, idx) => {
              const stt = (page - 1) * ITEMS_PER_PAGE + idx + 1;
              return (
                <tr key={s.id} className="hover:bg-orange-50/40 transition-colors h-[50px]">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-xs">
                    {stt}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-amber-700 tracking-tight whitespace-nowrap">
                    {s.code}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 truncate" title={s.name}>
                    {s.name}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {s.semester}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                    {s.credits}
                  </td>
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-medium truncate">
                    {s.prerequisites.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {s.prerequisites.map((p) => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
                            {p}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {currentItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 italic text-sm">
                  Không tìm thấy môn học nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-1 text-xs text-slate-500 font-outfit">
        <span>
          Hiển thị <strong className="text-slate-800">{filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(page * ITEMS_PER_PAGE, filtered.length)}</strong> / <strong className="text-slate-800">{filtered.length}</strong> môn học
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title="Trang trước"
          >
            <ChevronLeftIcon size={13} />
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold font-outfit transition-all cursor-pointer ${
                page === n
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title="Trang sau"
          >
            <ChevronRightIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectListTableCard;
