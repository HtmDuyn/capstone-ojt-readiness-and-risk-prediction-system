import { PageBanner } from "@/components/common/PageBanner";
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import { getAllItems } from '@/services/educationApi';
import { ojtEligibilityService } from '@/services/ojtEligibility.service';
import { loadSavedLocalOjtResults } from '@/services/localOjtEligibility.service';
import { savedOjtLabel, type SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import type { StudentEligibility } from '@/types/education/eligibility.types';
import { eligibilityReasonLabel, eligibilityStatusLabel } from '@/utils/educationEligibility';
import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, RefreshCw, Search } from 'lucide-react';
type Row = Record<string, any>;
type SortKey = 'name' | 'code' | 'eligibility' | 'registration' | 'handoff';
type SortSelection = { key: SortKey; direction: 'asc' | 'desc' };
const pageSize = 20;
const columns: { title: string; sortKey?: SortKey }[] = [
  { title: 'STT' },
  { title: 'Tên sinh viên', sortKey: 'name' },
  { title: 'Mã sinh viên', sortKey: 'code' },
  { title: 'Kết quả xét điều kiện OJT', sortKey: 'eligibility' },
  { title: 'Đăng ký', sortKey: 'registration' },
  { title: 'Bàn giao', sortKey: 'handoff' },
  { title: 'Thao tác' },
];
const eligibilityOrder: Record<string, number> = {
  'Đủ điều kiện': 0, 'Chưa đủ điều kiện': 1, 'Cần xét lại': 2, 'Cần đối soát': 3, 'Chưa xét': 4,
};
const registrationOrder: Record<string, number> = {
  NOT_REGISTERED: 0, SUBMITTED: 1, APPROVED: 2, REJECTED: 3, LEGACY_REVIEW_REQUIRED: 4, HANDED_OFF: 5,
};
const handoffOrder: Record<string, number> = { NOT_HANDED_OFF: 0, HANDED_OFF: 1 };
const label = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const statusNames: Record<string, string> = {
  ELIGIBLE: "Đủ điều kiện",
  NOT_ELIGIBLE: "Chưa đủ điều kiện",
  REVIEW_REQUIRED: "Chờ đối soát",
  SUBMITTED: "Đã đăng ký",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  NOT_REGISTERED: "Chưa đăng ký",
  HANDED_OFF: "Đã bàn giao",
  NOT_HANDED_OFF: "Chưa bàn giao",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang OJT",
  COMPLETED: "Hoàn thành",
  FAILED: "Không đạt",
  COORDINATING: "Đang điều phối",
  ENTERPRISE_ACCEPTED: "Doanh nghiệp tiếp nhận",
  ENTERPRISE_REJECTED: "Doanh nghiệp từ chối",
  LEGACY_REVIEW_REQUIRED: "Cần đối soát dữ liệu cũ",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
};
const state = (value: unknown) => statusNames[String(value)] ?? label(value);
const sortValue = (row: Row, key: SortKey, savedResults: Record<number, SavedOjtEligibility>): string | number | null => {
  switch (key) {
    case 'name': return row.fullName ?? null;
    case 'code': return row.studentCode ?? null;
    case 'eligibility': {
      const result = savedResults[row.studentId];
      return eligibilityOrder[result ? savedOjtLabel(result) : 'Chưa xét'] ?? null;
    }
    case 'registration': return registrationOrder[String(row.registrationStatus)] ?? null;
    case 'handoff': return handoffOrder[String(row.handoffStatus)] ?? null;
  }
};
const EducationStudentStatus: React.FC = () => {
  const [semesterId, setSemesterId] = React.useState('');
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [search, setSearch] = React.useState(""),
    [page, setPage] = React.useState(1),
    [refresh, setRefresh] = React.useState(0);
  const [data, setData] = React.useState<Row[] | null>(null),
    [selected, setSelected] = React.useState<Row | null>(null);
  const [sort, setSort] = React.useState<SortSelection | null>(null);
  const [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState("");
  const [eligibility, setEligibility] = React.useState<StudentEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = React.useState(false);
  const [eligibilityError, setEligibilityError] = React.useState('');
  const [savedResults, setSavedResults] = React.useState<Record<number, SavedOjtEligibility>>({});
  const [savedError, setSavedError] = React.useState('');
  const changeSort = (key: SortKey) => setSort(previous => {
    if (previous?.key !== key) return { key, direction: 'asc' };
    return previous.direction === 'asc' ? { key, direction: 'desc' } : null;
  });
  const sortedRows = React.useMemo(() => {
    if (!data || !sort) return data;
    const rows = data.map((row, index) => ({ row, index }));
    rows.sort((a, b) => {
      const left = sortValue(a.row, sort.key, savedResults);
      const right = sortValue(b.row, sort.key, savedResults);
      const leftMissing = left === null || left === '' || left === '—';
      const rightMissing = right === null || right === '' || right === '—';
      if (leftMissing || rightMissing) return leftMissing === rightMissing ? a.index - b.index : leftMissing ? 1 : -1;
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'vi', { numeric: true });
      return (sort.direction === 'asc' ? comparison : -comparison) || a.index - b.index;
    });
    return rows.map(({ row }) => row);
  }, [data, sort, savedResults]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil((sortedRows?.length ?? 0) / pageSize)));
  const visibleRows = sortedRows?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];
  React.useEffect(() => {
    const controller = new AbortController();
    setSavedResults({}); setSavedError('');
    loadSavedLocalOjtResults(controller.signal)
      .then(rows => { if (!controller.signal.aborted) setSavedResults(Object.fromEntries(rows.map(row => [row.studentId, row]))); })
      .catch(e => { if (!controller.signal.aborted) setSavedError(e instanceof Error ? e.message : 'Không tải được kết quả FE đã lưu.'); });
    return () => controller.abort();
  }, [refresh]);
  React.useEffect(() => {
    const controller = new AbortController();
    setEligibility(null); setEligibilityError(''); setEligibilityLoading(Boolean(selected && semesterId));
    if (selected && semesterId) ojtEligibilityService.getStudentEligibility(selected.studentId, Number(semesterId), controller.signal)
      .then(data => { if (!controller.signal.aborted) setEligibility(data); })
      .catch(e => { if (!controller.signal.aborted) setEligibilityError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setEligibilityLoading(false); });
    return () => controller.abort();
  }, [selected, semesterId]);

  React.useEffect(() => {
    if (!semesterId) {
      setData(null);
      setSelected(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    setSelected(null);
    getAllItems<Row>(
      `/ojt-semesters/${semesterId}/students`,
      { search },
      controller.signal,
    )
      .then(response => { if (!controller.signal.aborted) setData(response); })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [semesterId, search, refresh]);
  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi trạng thái sinh viên"
        description="Theo dõi tình hình sinh viên theo từng đợt OJT."
        badge="Phòng Đào tạo"
      />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Danh sách trạng thái sinh viên <span className="ml-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">{loading ? '…' : data?.length ?? 0}</span></h2>
            <p className="mt-1 text-xs text-slate-500">Theo dõi kết quả xét điều kiện, đăng ký và bàn giao OJT.</p>
          </div>
          <button
            aria-label="Tải lại danh sách"
            title="Tải lại danh sách"
            onClick={() => { reloadSemesters(); setRefresh((v) => v + 1); }}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <RefreshCw size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Đợt OJT</span>
            <select
              aria-label="Đợt OJT"
              className="h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              value={semesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Chọn kỳ OJT</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.semesterCode})
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>Tìm kiếm sinh viên</span>
            <span className="relative">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Tìm sinh viên"
                className="h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 placeholder:text-slate-500 outline-none transition-colors hover:border-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Nhập mã hoặc tên sinh viên..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
        </div>
        {(error || semesterError || savedError) && (
          <p role="alert" className="px-5 pb-3 text-sm text-red-700">
            {error || semesterError || savedError}
          </p>
        )}
        {loading && <p role="status" className="px-5 pb-4 text-sm text-slate-600">Đang tải...</p>}
        {!semesterId && <p className="px-5 pb-4 text-sm text-slate-600">Chọn kỳ OJT để xem dữ liệu.</p>}
        {data && (
          <>
            <p className="px-5 pb-3 text-xs text-slate-500">Kết quả xét đã lưu có thể cần đối soát.</p>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]">
                  <tr>
                    {columns.map(({ title, sortKey }) => (
                      <th key={title} scope="col"
                        aria-sort={sortKey && sort?.key === sortKey ? sort.direction === 'asc' ? 'ascending' : 'descending' : undefined}
                        aria-label={sortKey ? `Sắp xếp theo ${title}` : undefined}
                        tabIndex={sortKey ? 0 : undefined}
                        onClick={sortKey ? () => changeSort(sortKey) : undefined}
                        onKeyDown={sortKey ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changeSort(sortKey); } } : undefined}
                        className={`p-3 ${title === 'STT' ? 'w-[60px] text-center' : title === 'Mã sinh viên' ? 'w-[125px]' : title === 'Tên sinh viên' ? 'min-w-[180px]' : title === 'Kết quả xét điều kiện OJT' ? 'min-w-[220px]' : title === 'Thao tác' ? 'w-20 text-center' : ''} ${sortKey ? 'cursor-pointer select-none transition-colors hover:bg-[#E6F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500' : ''}`}>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{title}{sortKey && (sort?.key === sortKey
                          ? sort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowDown size={14} aria-hidden="true" className="text-orange-600" />
                          : <ArrowUpDown size={14} aria-hidden="true" className="text-slate-400" />)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, index) => (
                    <tr key={r.studentId} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                      <td className="w-[60px] p-3 text-center align-middle text-slate-600">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="min-w-[180px] p-3 align-middle font-semibold text-slate-800">{r.fullName}</td>
                      <td className="w-[125px] p-3 align-middle text-slate-700">{r.studentCode}</td>
                      <td className="p-3 align-middle">{savedResults[r.studentId] ? savedOjtLabel(savedResults[r.studentId]) : 'Chưa xét'}</td>
                      <td className="p-3 align-middle">{state(r.registrationStatus)}</td>
                      <td className="p-3 align-middle">{state(r.handoffStatus)}</td>
                      <td className="w-20 p-3 text-center align-middle">
                        <button
                          aria-label="Xem chi tiết"
                          title="Xem chi tiết"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-orange-600 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          onClick={() => setSelected(r)}
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.length && (
              <p className="px-5 py-4 text-sm text-slate-600">Không có sinh viên phù hợp trong kỳ này.</p>
            )}
            <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
              <button
                disabled={loading || currentPage <= 1}
                onClick={() => { setSelected(null); setPage(currentPage - 1); }}
              >
                Trước
              </button>
              <span>Trang {currentPage}</span>
              <button
                disabled={loading || currentPage * pageSize >= data.length}
                onClick={() => { setSelected(null); setPage(currentPage + 1); }}
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
      {selected && (
        <section className="space-y-2 rounded-2xl bg-white p-6 shadow-sm">
          <button className="float-right" onClick={() => setSelected(null)}>
            Đóng
          </button>
          <h2 className="font-bold">
            {selected.fullName} — {selected.studentCode}
          </h2>
          <p>Email: {label(selected.email)}</p>
          <p>Nhóm: {label(selected.groupCode)}</p>
          {eligibilityLoading && <p role="status">Đang tính điều kiện từ dữ liệu hiện tại...</p>}
          {eligibilityError && <p role="alert" className="text-red-700">{eligibilityError}</p>}
          {eligibility && <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-semibold">{eligibility.current.rule ? `Điều kiện OJT: từ ${eligibility.current.rule.minCredits} tín chỉ, tối đa ${eligibility.current.rule.maxUnpassedCourses} môn chưa đạt` : 'Chưa có quy định OJT phù hợp với chương trình'}</h3>
            <p>Tính hiện tại (chưa phải quyết định chính thức): <strong>{eligibilityStatusLabel(eligibility.current.status)}</strong>.</p>
            <p>Tín chỉ đạt: {eligibility.current.earnedCredits}; còn thiếu: {eligibility.current.missingCredits ?? 'chưa xác định'}; môn còn rớt: {eligibility.current.unpassedCourseCount}.</p>
            <p>Môn còn rớt: {eligibility.current.unpassedCourses.map(c => c.courseCode).join(', ') || 'Không có'}.</p>
            <p>{eligibility.current.reasons.map(eligibilityReasonLabel).join(' ')}</p>
            {eligibility.current.academicIssues.length > 0 && <p className="text-amber-800">Cần đối soát: {eligibility.current.academicIssues.join(', ')}.</p>}
            <p>Quyết định chính thức: {!eligibility.official ? 'Chưa xác nhận' : eligibility.official.isStale ? 'Đã cũ — cần xét lại trước khi sử dụng' : eligibilityStatusLabel(eligibility.official.status)}.</p>
            {eligibility.official?.confirmation && <p>Đã xác nhận lúc {new Date(eligibility.official.confirmation.confirmedAt).toLocaleString('vi-VN')}.</p>}
          </div>}
          <p>
            Doanh nghiệp:{" "}
            {label(
              selected.coordination?.company?.name ??
                selected.coordination?.companyName ??
                selected.company?.name ??
                selected.enterprise?.name,
            )}
          </p>
          <p>
            Vị trí:{" "}
            {label(
              selected.coordination?.position?.title ??
                selected.coordination?.positionTitle,
            )}
          </p>
          <p>Ngày bắt đầu: {label(selected.assignment?.startDate)}</p>
          <p>Ngày kết thúc: {label(selected.assignment?.endDate)}</p>
          <p>Trạng thái phân công: {state(selected.assignment?.status)}</p>
        </section>
      )}
    </div>
  );
};
export default EducationStudentStatus;
