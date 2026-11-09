import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Users, Search, Inbox } from 'lucide-react';
import { useEducationImportedStudents } from '@/hooks/useEducationImportedStudents';
import type { AcademicCatalogs, ImportedStudent, StudentAcademicStatus } from '@/types/education/import.types';
import { STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';

const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const status = (value: string) => STUDENT_STATUS_LABELS[value as StudentAcademicStatus] ?? value;
type SortKey = 'student' | 'studentCode' | 'email' | 'phone' | 'cohort' | 'program' | 'current' | 'status';
type Sort = { key: SortKey; direction: 'asc' | 'desc' } | null;
const columns: { key: SortKey | 'entry'; label: string }[] = [
  { key: 'student', label: 'Tên sinh viên' }, { key: 'studentCode', label: 'Mã số sinh viên' },
  { key: 'email', label: 'Email' }, { key: 'phone', label: 'SĐT' },
  { key: 'cohort', label: 'Khóa' }, { key: 'program', label: 'Mã khung chương trình' },
  { key: 'entry', label: 'Kỳ bắt đầu' }, { key: 'current', label: 'Kỳ hiện tại' },
  { key: 'status', label: 'Trạng thái học vụ' },
];
const academicStatusOrder: Record<string, number> = { ACTIVE: 0, INACTIVE: 1, SUSPENDED: 2, GRADUATED: 3, DROPPED_OUT: 4 };
const periodTime = (value?: string) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
};
const sortValue = (row: ImportedStudent, key: SortKey): string | number | null => {
  switch (key) {
    case 'student': return row.fullName || null;
    case 'studentCode': return row.studentCode || null;
    case 'email': return row.email || null;
    case 'phone': return row.phone || null;
    case 'program': return row.program?.code || null;
    case 'cohort': return row.cohort?.code || null;
    case 'current': return periodTime(row.currentAcademicPeriod?.startDate);
    case 'status': return academicStatusOrder[row.status] ?? null;
  }
};
const compareValues = (a: string | number | null, b: string | number | null) => {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'vi', { numeric: true });
};

export function ImportedStudents({ revision, catalogs }: { revision: number; catalogs: AcademicCatalogs | null }) {
  const [sort, setSort] = useState<Sort>(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('sort');
    const direction = params.get('direction');
    return columns.some(column => column.key === key && column.key !== 'entry') && (direction === 'asc' || direction === 'desc')
      ? { key: key as SortKey, direction } : null;
  });
  const model = useEducationImportedStudents(revision, sort !== null);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRestored = useRef(false);
  const visibleRows = useMemo(() => {
    if (!model.data) return [];
    if (!sort) return model.data.items;
    const sorted = model.data.items.slice().sort((a, b) => {
      const first = sortValue(a, sort.key), second = sortValue(b, sort.key);
      const comparison = compareValues(first, second);
      return first === null || second === null ? comparison : sort.direction === 'asc' ? comparison : -comparison;
    });
    return sorted.slice((model.page - 1) * model.data.limit, model.page * model.data.limit);
  }, [model.data, model.page, sort]);
  const toggleSort = (key: SortKey) => setSort(current =>
    current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null);
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(model.filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (model.page > 1) params.set('page', String(model.page));
    if (sort) { params.set('sort', sort.key); params.set('direction', sort.direction); }
    if (new URLSearchParams(location.search).get('tab') === 'students') params.set('tab', 'students');
    const search = params.toString();
    if (search !== location.search.slice(1)) navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true, state: location.state });
  }, [model.filters, model.page, sort, navigate, location.pathname, location.search, location.state]);
  useEffect(() => {
    const scrollY = (location.state as { restoreScrollY?: number } | null)?.restoreScrollY;
    if (model.data && !scrollRestored.current && typeof scrollY === 'number') {
      scrollRestored.current = true;
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  }, [model.data, location.state]);
  return <section className="space-y-5 p-5 sm:p-7">
    <div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Users size={22} className="text-orange-600" />Danh sách sinh viên trên hệ thống</h2><p className="mt-2 text-sm text-slate-500">Tra cứu hồ sơ sinh viên và kết quả học tập đã lưu trong hệ thống.</p></div>
    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="relative sm:col-span-2 xl:col-span-3"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Tìm sinh viên đã import" value={model.filters.search} onChange={e => model.changeFilter('search', e.target.value)} placeholder="Tìm theo mã sinh viên, họ tên hoặc email" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>
      <select aria-label="Lọc chương trình đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.programId} onChange={e => model.changeFilter('programId', e.target.value)}><option value="">Tất cả chương trình</option>{catalogs?.programs.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
      <select aria-label="Lọc khóa đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.cohortId} onChange={e => model.changeFilter('cohortId', e.target.value)}><option value="">Tất cả khóa</option>{catalogs?.cohorts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
      <select aria-label="Lọc trạng thái sinh viên đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.status} onChange={e => model.changeFilter('status', e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <div className="flex justify-end sm:col-span-2 xl:col-span-3"><button onClick={model.clearFilters} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:text-orange-700">Xóa bộ lọc</button></div>
    </div>
    {model.error && <p role="alert" className="text-red-700">{model.error}</p>}
    {model.loading && <p role="status">Đang tải dữ liệu đã import...</p>}
    {model.data && <>
      <p className="text-sm text-slate-600">Tổng {model.data.total} sinh viên phù hợp. Bấm xem hồ sơ để xem đủ thông tin và bảng điểm.</p>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[1380px] text-left text-sm">
          <thead className="bg-[#EFF6FF] text-[#334155]"><tr className="border-b border-[#D6E4F0]">
            <th scope="col" className="w-14 px-3 py-3 text-center font-semibold">STT</th>
            {columns.map(({ key, label }) => <th key={key} scope="col" aria-sort={key === 'entry' ? undefined : sort?.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'} className="whitespace-nowrap px-4 py-3 font-semibold">{key === 'entry' ? <span title="Chưa có số kỳ bắt đầu trong dữ liệu sinh viên">{label}</span> : <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1.5 rounded-sm text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">{label}{sort?.key === key ? sort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowDown size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowUpDown size={14} aria-hidden="true" className="text-slate-400" />}</button>}</th>)}
            <th scope="col" className="w-16 px-3 py-3 text-center font-semibold">Thao tác</th>
          </tr></thead>
          <tbody>{visibleRows.map((row, index) => <tr key={row.id} className="border-t border-[#E2E8F0] bg-white align-middle transition-colors duration-150 hover:bg-[#EAF2FF]">
            <td className="w-14 px-3 py-4 text-center text-slate-600">{(model.page - 1) * model.data!.limit + index + 1}</td>
            <td className="max-w-48 px-4 py-4 font-semibold text-slate-800">{text(row.fullName)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(row.studentCode)}</td>
            <td className="max-w-56 truncate px-4 py-4 text-slate-700" title={row.email}>{text(row.email)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(row.phone)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(row.cohort?.code)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(row.program?.code)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">—</td>
            <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(row.currentAcademicPeriod?.name ?? row.currentAcademicPeriod?.code)}</td>
            <td className="whitespace-nowrap px-4 py-4">{status(row.status)}</td>
            <td className="px-3 py-4 text-center"><button type="button" title="Xem hồ sơ và bảng điểm" aria-label="Xem hồ sơ và bảng điểm" className="inline-flex size-9 items-center justify-center rounded-lg text-orange-600 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500" onClick={() => { const params = new URLSearchParams(location.search); params.set('tab', 'students'); const search = `?${params.toString()}`; navigate(`${location.pathname}/students/${row.id}${search}`, { state: { returnTo: `${location.pathname}${search}`, scrollY: window.scrollY } }); }}><Eye size={18} aria-hidden="true" /></button></td>
          </tr>)}</tbody>
        </table>
        {!model.data.items.length && <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500"><span className="rounded-full bg-orange-50 p-4 text-orange-500"><Inbox size={28} /></span><p className="font-semibold text-slate-700">Không tìm thấy sinh viên</p><p className="text-sm">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</p></div>}
      </div>
      <div className="flex items-center justify-between text-sm"><button disabled={model.page <= 1 || model.loading} onClick={() => model.setPage(p => p - 1)} className="rounded border px-3 py-2 disabled:opacity-50">Trước</button><span>Trang {model.page} / {Math.max(1, Math.ceil(model.data.total / model.data.limit))}</span><button disabled={model.page * model.data.limit >= model.data.total || model.loading} onClick={() => model.setPage(p => p + 1)} className="rounded border px-3 py-2 disabled:opacity-50">Sau</button></div>
    </>}
  </section>;
}
