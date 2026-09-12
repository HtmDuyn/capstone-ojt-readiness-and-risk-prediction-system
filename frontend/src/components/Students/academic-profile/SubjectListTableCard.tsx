import React, { useState, useMemo } from 'react';
import type { SubjectStatus } from '../../../types/students/academicProfileTypes';
import { mockSubjectList } from '../../../data/mockAcademicProfileData';
import { DownloadIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../../dashboard/icons/DashboardIcons';
import { useStudentAIConsult } from '../../../layouts/StudentLayout';

/* ─── Status Badge ─────────────────────────────────────────── */
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

/* ─── Filter Options ───────────────────────────────────────── */
const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'in_progress', label: 'Đang học' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'failed', label: 'Chưa đạt' },
  { value: 'not_started', label: 'Chưa học' },
];

const ITEMS_PER_PAGE = 5;
const MAX_PAGE_VISIBLE = 4;

/* ─── Component ────────────────────────────────────────────── */
export const SubjectListTableCard: React.FC = () => {
  const { openAIConsult } = useStudentAIConsult();
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const filtered = useMemo(
    () => (filter === 'all' ? mockSubjectList : mockSubjectList.filter((s) => s.status === filter)),
    [filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const pageNumbers = useMemo(() => {
    let start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + MAX_PAGE_VISIBLE - 1);
    if (end - start + 1 < MAX_PAGE_VISIBLE) start = Math.max(1, end - MAX_PAGE_VISIBLE + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const handleFilterChange = (v: string) => { setFilter(v); setPage(1); };

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Danh sách môn học
        </h3>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-2xs font-outfit cursor-pointer"
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <ChevronDownIcon size={13} />
            </span>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={() =>
              openAIConsult('Tôi muốn xuất danh sách môn học ra file Excel/CSV. Hướng dẫn cách thực hiện?')
            }
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Xuất danh sách"
          >
            <DownloadIcon size={17} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200/60 bg-white/40">
        <table className="w-full text-left border-collapse min-w-[580px]">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/70 text-[11px] font-bold text-slate-500 tracking-wider font-outfit uppercase">
              <th className="py-3 px-4">Mã môn</th>
              <th className="py-3 px-4">Tên môn học</th>
              <th className="py-3 px-4 text-center">TC</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4">Tiên quyết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-outfit">
            {currentItems.map((s) => (
              <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-amber-700 tracking-tight whitespace-nowrap">
                  {s.code}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">{s.name}</td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-700">{s.credits}</td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <StatusBadge status={s.status} />
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-medium">
                  {s.prerequisites.length > 0 ? s.prerequisites.join(', ') : '—'}
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 italic text-sm">
                  Không tìm thấy môn học nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-1 text-xs text-slate-500 font-outfit">
        <span>
          Hiển thị <strong className="text-slate-800">{currentItems.length}</strong> / <strong className="text-slate-800">{filtered.length}</strong> môn học
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  ? 'bg-amber-700 text-white shadow-xs'
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
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang sau"
          >
            <ChevronRightIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
