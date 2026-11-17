import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Eye, GraduationCap, RefreshCw, Search, Users, X } from 'lucide-react';
import type { StudentProgress } from '@/types/education/studentProgress.types';

const initialFilters = { search: '', curriculum: '', term: '', eligibility: '' };
type Filters = typeof initialFilters;
type FilterKey = keyof Filters;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const unique = (values: string[]) => [...new Set(values.filter(v => v && v !== '—'))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
const filterLabels: Record<FilterKey, string> = { search: 'Từ khóa', curriculum: 'Mã khung chương trình', term: 'Học kỳ', eligibility: 'Kết quả xét OJT' };
type SortKey = 'name' | 'code' | 'curriculum' | 'semester' | 'gpa' | 'credits' | 'failed' | 'eligibility';
type SortSelection = { key: SortKey; direction: 'asc' | 'desc' };
const sortableColumns: { title: string; key?: SortKey }[] = [
  { title: 'STT' },
  { title: 'Sinh viên', key: 'name' },
  { title: 'Mã sinh viên', key: 'code' },
  { title: 'Mã khung chương trình', key: 'curriculum' },
  { title: 'Học kỳ', key: 'semester' },
  { title: 'GPA', key: 'gpa' },
  { title: 'Tín chỉ tích lũy', key: 'credits' },
  { title: 'Môn chưa đạt', key: 'failed' },
  { title: 'Điều kiện OJT', key: 'eligibility' },
  { title: 'Thao tác' },
];
const eligibilityOrder: Record<StudentProgress['eligibilityStatus'], number> = {
  'Đủ điều kiện': 0,
  'Chưa đủ điều kiện': 1,
  'Cần xét lại': 2,
  'Cần đối soát': 3,
  'Chưa có kết quả': 4,
};

export function StudentProgressList({ students, loading, error, warning, onSelect, onReload }: {
  students: StudentProgress[]; loading: boolean; error: string | null; warning: string | null;
  onSelect: (student: StudentProgress) => void; onReload: () => void;
}) {
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [sort, setSort] = React.useState<SortSelection | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const change = (key: FilterKey, value: string) => setFilters(previous => {
    const next = { ...previous, [key]: value };
    if (key === 'curriculum') Object.assign(next, { term: '' });
    return next;
  });
  const changeSort = (key: SortKey) => setSort(previous => {
    if (previous?.key !== key) return { key, direction: 'asc' };
    return previous.direction === 'asc' ? { key, direction: 'desc' } : null;
  });
  const scope = React.useMemo(() => students.filter(s => !filters.curriculum || s.curriculumCode === filters.curriculum), [students, filters.curriculum]);
  const filtered = React.useMemo(() => {
    const keywords = normalize(filters.search).split(/\s+/).filter(Boolean);
    const result = scope.filter(s => {
      const haystack = normalize(`${s.studentCode} ${s.fullName}`);
      return keywords.every(word => haystack.includes(word))
        && (!filters.term || s.currentTerm === filters.term)
        && (!filters.eligibility || (!s.detailsUnavailable && s.eligibilityStatus === filters.eligibility));
    });
    return result.sort((a, b) => {
      const byCode = a.studentCode.localeCompare(b.studentCode, 'vi', { numeric: true });
      if (!sort) return byCode;
      let left: string | number | null;
      let right: string | number | null;
      switch (sort.key) {
        case 'name': left = a.fullName; right = b.fullName; break;
        case 'code': left = a.studentCode; right = b.studentCode; break;
        case 'curriculum': left = a.curriculumCode; right = b.curriculumCode; break;
        case 'semester': left = a.currentTermStartDate; right = b.currentTermStartDate; break;
        case 'gpa': left = a.gpa; right = b.gpa; break;
        case 'credits': left = a.completedCredits; right = b.completedCredits; break;
        case 'failed':
          left = a.subjects.length ? a.subjects.filter(subject => subject.status === 'Not Passed').length : null;
          right = b.subjects.length ? b.subjects.filter(subject => subject.status === 'Not Passed').length : null;
          break;
        case 'eligibility':
          left = a.detailsUnavailable ? null : eligibilityOrder[a.eligibilityStatus];
          right = b.detailsUnavailable ? null : eligibilityOrder[b.eligibilityStatus];
          break;
      }
      const leftMissing = left === null || left === '' || left === '—';
      const rightMissing = right === null || right === '' || right === '—';
      if (leftMissing || rightMissing) return leftMissing === rightMissing ? byCode : leftMissing ? 1 : -1;
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'vi', { numeric: true });
      return (sort.direction === 'asc' ? comparison : -comparison) || byCode;
    });
  }, [scope, filters, sort]);
  React.useEffect(() => { setPage(1); }, [filters, sort, pageSize]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const active = (Object.entries(filters) as [FilterKey, string][]).filter(([, value]) => value.trim());
  const select = (key: FilterKey, title: string, options: { value: string; label: string }[]) => <label className="min-w-0 space-y-1.5 text-sm font-medium text-slate-700">
    <span>{title}</span>
    <select aria-label={title} value={filters[key]} onChange={e => change(key, e.target.value)} disabled={loading}
      className="h-[42px] w-full truncate rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50">
      <option value="">Tất cả</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
  const options = (values: string[]) => values.map(value => ({ value, label: value }));
  const summaries = [
    { label: 'Sinh viên trong bộ lọc', value: filtered.length, color: 'text-slate-900', icon: Users },
    { label: 'Có môn chưa đạt', value: filtered.filter(s => s.subjects.some(subject => subject.status === 'Not Passed')).length, color: 'text-rose-600', icon: GraduationCap },
    { label: 'Đủ điều kiện OJT', value: filtered.filter(s => s.eligibilityStatus === 'Đủ điều kiện').length, color: 'text-emerald-700', icon: GraduationCap },
    { label: 'Chưa có kết quả OJT', value: filtered.filter(s => !s.detailsUnavailable && s.eligibilityStatus === 'Chưa có kết quả').length, color: 'text-slate-600', icon: GraduationCap },
  ];
  return <div className="min-w-0 space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summaries.map(({ label, value, color, icon: Icon }) => <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{loading || error ? '—' : value}</p></div>
      <Icon size={22} className={color} />
    </div>)}</div>
    <section aria-label="Danh sách tiến độ học tập" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div><h2 className="font-semibold text-slate-900">Danh sách sinh viên <span className="ml-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">{loading ? '…' : filtered.length}</span></h2><p className="mt-1 text-xs text-slate-500">Tín chỉ và GPA từ hồ sơ học tập. Kết quả OJT hiển thị theo dữ liệu đã xét.</p></div>
        <button aria-label="Tải lại sinh viên" disabled={loading} onClick={onReload} className="ml-auto rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-orange-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div aria-label="Bộ lọc sinh viên" className="space-y-3 px-5 py-4">
      <div className="relative w-full"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Tìm theo mã sinh viên hoặc họ tên" value={filters.search} onChange={e => change('search', e.target.value)} placeholder="Tìm mã sinh viên hoặc họ tên, có thể nhập không dấu..." className="h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-500 outline-none transition-colors hover:border-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          {filters.search && <button aria-label="Xóa từ khóa" onClick={() => change('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X size={16} /></button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {select('curriculum', 'Mã khung chương trình', options(unique(students.map(s => s.curriculumCode))))}
        {select('term', 'Học kỳ', options(unique(scope.map(s => s.currentTerm))))}
        {select('eligibility', 'Kết quả xét OJT', options(['Đủ điều kiện', 'Chưa đủ điều kiện', 'Chưa có kết quả', 'Cần đối soát', 'Cần xét lại']))}
      </div>
      {active.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">{active.map(([key, value]) => <button key={key} onClick={() => change(key, '')} aria-label={`Bỏ lọc ${filterLabels[key]}`} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800"><span className="truncate">{filterLabels[key]}: {value}</span><X size={13} className="shrink-0" /></button>)}</div>}
      <div className="flex justify-end">
        <button onClick={() => setFilters(initialFilters)} disabled={!active.length} className="text-sm font-medium text-orange-700 hover:underline disabled:text-slate-400 disabled:no-underline">Xóa bộ lọc{active.length ? ` (${active.length})` : ''}</button>
      </div>
      </div>
      {warning && <p role="status" className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">{warning}</p>}
      <div className="overflow-x-auto border-t border-slate-100"><table className="w-full min-w-[1260px] text-left text-sm">
        <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-xs font-semibold text-[#334155]"><tr>{sortableColumns.map(({ title, key }) => <th key={title} scope="col"
          aria-sort={key && sort?.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : undefined}
          aria-label={key ? `Sắp xếp theo ${title}` : undefined}
          tabIndex={key ? 0 : undefined}
          onClick={key ? () => changeSort(key) : undefined}
          onKeyDown={key ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changeSort(key); } } : undefined}
          className={`whitespace-nowrap py-3 font-semibold ${title === 'STT' ? 'w-[60px] px-2 text-center' : title === 'Mã sinh viên' ? 'w-[125px] px-4' : title === 'Thao tác' ? 'w-20 px-2 text-center' : 'px-4'} ${key ? 'cursor-pointer select-none transition-colors hover:bg-[#E6F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500' : ''}`}
        ><span className="inline-flex items-center gap-1.5">{title}{key && (sort?.key === key
          ? sort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowDown size={14} aria-hidden="true" className="text-orange-600" />
          : <ArrowUpDown size={14} aria-hidden="true" className="text-slate-400" />)}</span></th>)}</tr></thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {loading ? <tr><td colSpan={10} role="status" className="px-5 py-14 text-center text-slate-500">Đang tải danh sách và hồ sơ học tập...</td></tr> : error ? <tr><td colSpan={10} role="alert" className="px-5 py-12 text-center text-red-700"><p>{error}</p><button onClick={onReload} className="mt-3 font-semibold underline">Thử tải lại</button></td></tr> : visible.length ? visible.map((student, index) => {
            const complete = student.completedCredits;
            const total = student.totalCredits;
            const failed = student.subjects.filter(s => s.status === 'Not Passed').length;
            const statusStyle = student.eligibilityStatus === 'Đủ điều kiện' ? 'bg-emerald-50 text-emerald-700' : student.eligibilityStatus === 'Chưa đủ điều kiện' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600';
            return <tr key={student.id} className="bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
              <td className="w-[60px] px-2 py-4 text-center text-sm font-normal text-slate-600">{start + index + 1}</td>
              <td className="min-w-44 px-4 py-4 align-middle"><button onClick={() => onSelect(student)} className="text-left font-semibold text-slate-800 hover:text-orange-700">{student.fullName}</button></td>
              <td className="w-[125px] px-4 py-4 align-middle text-sm text-slate-700">{student.studentCode}{student.dataWarning && <p className="mt-1 text-xs text-amber-700" title={student.dataWarning}>Hồ sơ cần kiểm tra</p>}</td>
              <td className="min-w-52 max-w-64 break-words px-4 py-4 text-xs font-medium text-slate-600">{student.curriculumCode}</td>
              <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-medium text-slate-700">{student.currentTerm}</td>
              <td className="px-4 py-4 font-semibold text-slate-800">{student.gpa?.toFixed(2) ?? '—'}</td>
              <td className="min-w-40 px-4 py-4 align-middle"><span className="font-semibold text-slate-800">{complete ?? '—'}</span><span className="text-sm text-slate-500"> / {total ?? '—'}</span></td>
              <td className="px-4 py-4">{student.subjects.length ? <span className={failed ? 'font-semibold text-rose-600' : 'text-slate-500'}>{failed} môn</span> : <span className="text-slate-400">—</span>}</td>
              <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle}`}>{student.detailsUnavailable ? 'Chưa tải được' : student.eligibilityStatus}</span></td>
              <td className="w-20 px-2 py-4 text-center"><button aria-label="Xem chi tiết" title="Xem chi tiết" onClick={() => onSelect(student)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-orange-600 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><Eye size={18} aria-hidden="true" /></button></td>
            </tr>;
          }) : <tr><td colSpan={10} className="px-5 py-14 text-center"><Users size={30} className="mx-auto text-slate-300" /><p className="mt-3 font-medium text-slate-700">{students.length ? 'Không có sinh viên khớp bộ lọc' : 'Chưa có sinh viên trong hệ thống'}</p><p className="mt-1 text-sm text-slate-500">{students.length ? 'Thử đổi từ khóa hoặc mở rộng phạm vi tìm kiếm.' : 'Sinh viên sẽ xuất hiện sau khi được thêm hoặc import thành công.'}</p>{active.length > 0 && <button onClick={() => setFilters(initialFilters)} className="mt-3 text-sm font-semibold text-orange-700">Xóa tất cả bộ lọc</button>}</td></tr>}
        </tbody>
      </table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
        <p aria-live="polite">{loading ? 'Đang tải...' : `Hiển thị ${filtered.length ? start + 1 : 0}–${Math.min(start + pageSize, filtered.length)} / ${filtered.length} sinh viên`}</p>
        <div className="flex items-center gap-3"><label className="flex items-center gap-2">Mỗi trang<select aria-label="Số sinh viên mỗi trang" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="rounded-lg border px-2 py-1.5">{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label><button aria-label="Trang trước" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button><span>{currentPage} / {pages}</span><button aria-label="Trang sau" disabled={loading || currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button></div>
      </div>
    </section>
  </div>;
}
