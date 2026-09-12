import React, { useState, useMemo } from 'react';
import type { SubjectItem, SubjectStatus } from '../../../types/students/academicProfileTypes';
import { mockSubjectList } from '../../../data/mockAcademicProfileData';
import {
  DownloadIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../dashboard/icons/DashboardIcons';

export const SubjectListTableCard: React.FC = () => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Filter subjects based on selected dropdown value
  const filteredSubjects = useMemo(() => {
    if (selectedStatusFilter === 'all') return mockSubjectList;
    return mockSubjectList.filter((sub) => sub.status === selectedStatusFilter);
  }, [selectedStatusFilter]);

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage) || 1;

  // Paginated items for current page
  const currentItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredSubjects, currentPage]);

  const renderStatusBadge = (status: SubjectStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100/80 text-orange-700 border border-orange-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Đang học
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoàn thành
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Chưa đạt
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Chưa học
          </span>
        );
    }
  };

  // Generate pagination numbers (window of pages around current page)
  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 4;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Danh sách môn học
        </h3>

        <div className="flex items-center gap-2.5">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-2xs font-outfit cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in_progress">Đang học</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Chưa đạt</option>
              <option value="not_started">Chưa học</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <ChevronDownIcon size={14} />
            </div>
          </div>

          {/* Export / Download Button */}
          <button
            type="button"
            onClick={() => alert('Xuất danh sách môn học dưới dạng CSV / Excel!')}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Tải xuống danh sách môn học"
          >
            <DownloadIcon size={18} />
          </button>
        </div>
      </div>

      {/* Table Area (Horizontal scroll on mobile with min-w-[620px]) */}
      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200/60 bg-white/40">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/60 text-[11px] sm:text-xs font-bold text-slate-600 tracking-wider font-outfit">
              <th className="py-3.5 px-4">MÃ MÔN</th>
              <th className="py-3.5 px-4">TÊN MÔN</th>
              <th className="py-3.5 px-4 text-center">SỐ TÍN CHỈ</th>
              <th className="py-3.5 px-4 text-center">TRẠNG THÁI</th>
              <th className="py-3.5 px-4">ĐIỀU KIỆN TIÊN QUYẾT</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-outfit">
            {currentItems.map((subject) => (
              <tr key={subject.id} className="hover:bg-orange-50/30 transition-colors">
                {/* Code */}
                <td className="py-4 px-4 font-bold text-amber-700 tracking-tight whitespace-nowrap">
                  {subject.code}
                </td>

                {/* Name */}
                <td className="py-4 px-4 font-semibold text-slate-800">
                  {subject.name}
                </td>

                {/* Credits */}
                <td className="py-4 px-4 text-center font-bold text-slate-700">
                  {subject.credits}
                </td>

                {/* Status */}
                <td className="py-4 px-4 text-center whitespace-nowrap">
                  {renderStatusBadge(subject.status)}
                </td>

                {/* Prerequisites */}
                <td className="py-4 px-4 text-slate-600 font-medium">
                  {subject.prerequisites.length > 0 ? subject.prerequisites.join(', ') : '—'}
                </td>
              </tr>
            ))}

            {currentItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                  Không tìm thấy môn học nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-2 text-xs text-slate-500 font-outfit">
        <div>
          Hiển thị <span className="font-bold text-slate-800">{currentItems.length}</span> trên{' '}
          <span className="font-bold text-slate-800">{filteredSubjects.length}</span> môn học
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang trước"
          >
            <ChevronLeftIcon size={14} />
          </button>

          {paginationPages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold font-outfit transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang sau"
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
