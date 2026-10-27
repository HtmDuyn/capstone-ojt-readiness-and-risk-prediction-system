import React from 'react';
import { ArrowDownWideNarrow, ChevronLeft, ChevronRight, Eye, Filter, GraduationCap, RefreshCw, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import type { StudentProgress } from '@/types/education/studentProgress.types';

const initialFilters = { search: '', cohort: '', curriculum: '', studentClass: '', term: '', semester: '', eligibility: '', subject: '', subjectStatus: '' };
type Filters = typeof initialFilters;
type FilterKey = keyof Filters;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const unique = (values: string[]) => [...new Set(values.filter(v => v && v !== '—'))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
const subjectLabels: Record<string, string> = { Passed: 'Đã đạt', 'Not Passed': 'Chưa đạt', 'In Progress': 'Đang học', 'Not Started': 'Chưa học', 'Chưa xác định': 'Chưa xác định' };
const filterLabels: Record<FilterKey, string> = { search: 'Từ khóa', cohort: 'Khóa', curriculum: 'Chương trình', studentClass: 'Lớp', term: 'Học kỳ', semester: 'Kỳ chuyên ngành', eligibility: 'Điều kiện OJT', subject: 'Môn học', subjectStatus: 'Trạng thái môn' };

export function StudentProgressList({ students, loading, error, warning, onSelect, onReload }: {
  students: StudentProgress[]; loading: boolean; error: string | null; warning: string | null;
  onSelect: (student: StudentProgress) => void; onReload: () => void;
}) {
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [advanced, setAdvanced] = React.useState(false);
  const [sort, setSort] = React.useState('code');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const change = (key: FilterKey, value: string) => setFilters(previous => {
    const next = { ...previous, [key]: value };
    if (key === 'cohort') Object.assign(next, { curriculum: '', studentClass: '', term: '', semester: '', subject: '', subjectStatus: '' });
    if (key === 'curriculum') Object.assign(next, { studentClass: '', term: '', semester: '', subject: '', subjectStatus: '' });
    return next;
  });
  const cohortRows = React.useMemo(() => students.filter(s => !filters.cohort || s.cohort === filters.cohort), [students, filters.cohort]);
  const scope = React.useMemo(() => cohortRows.filter(s => !filters.curriculum || s.curriculumCode === filters.curriculum), [cohortRows, filters.curriculum]);
  const subjects = React.useMemo(() => {
    const options = new Map<string, string>();
    scope.forEach(s => s.subjects.forEach(subject => { if (subject.code !== '—') options.set(subject.code, subject.name); }));
    return [...options].sort(([a], [b]) => a.localeCompare(b));
  }, [scope]);
  const semesters = [...new Set(scope.map(s => s.currentCurriculumSemester).filter((s): s is number => s !== null))].sort((a, b) => a - b);
  const filtered = React.useMemo(() => {
    const keywords = normalize(filters.search).split(/\s+/).filter(Boolean);
    const result = scope.filter(s => {
      const haystack = normalize(`${s.studentCode} ${s.fullName}`);
      return keywords.every(word => haystack.includes(word))
        && (!filters.studentClass || s.studentClass === filters.studentClass)
        && (!filters.term || s.currentTerm === filters.term)
        && (!filters.semester || String(s.currentCurriculumSemester) === filters.semester)
        && (!filters.eligibility || (!s.detailsUnavailable && s.eligibilityStatus === filters.eligibility))
        && ((!filters.subject && !filters.subjectStatus) || s.subjects.some(subject =>
          (!filters.subject || subject.code === filters.subject) && (!filters.subjectStatus || subject.status === filters.subjectStatus)));
    });
    return result.sort((a, b) => {
      if (sort === 'name') return a.fullName.localeCompare(b.fullName, 'vi') || a.studentCode.localeCompare(b.studentCode);
      if (sort === 'credits' || sort === 'gpa') {
        const av = sort === 'credits' ? a.completedCredits : a.gpa;
        const bv = sort === 'credits' ? b.completedCredits : b.gpa;
        if (av === null || bv === null) return av === bv ? a.studentCode.localeCompare(b.studentCode) : av === null ? 1 : -1;
        return bv - av || a.studentCode.localeCompare(b.studentCode);
      }
      return a.studentCode.localeCompare(b.studentCode, 'vi', { numeric: true });
    });
  }, [scope, filters, sort]);
  React.useEffect(() => { setPage(1); }, [filters, sort, pageSize]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const active = (Object.entries(filters) as [FilterKey, string][]).filter(([, value]) => value.trim());
  const advancedCount = ['semester', 'eligibility', 'subject', 'subjectStatus'].filter(key => filters[key as FilterKey]).length;
  const select = (key: FilterKey, title: string, options: { value: string; label: string }[]) => <label className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
    <span>{title}</span>
    <select aria-label={title} value={filters[key]} onChange={e => change(key, e.target.value)} disabled={loading}
      className="w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50">
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
    <section aria-label="Bộ lọc sinh viên" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Filter size={18} className="text-orange-600" />Tìm và lọc sinh viên</h2>
        <button onClick={() => setFilters(initialFilters)} disabled={!active.length} className="text-sm font-medium text-orange-700 hover:underline disabled:text-slate-400 disabled:no-underline">Xóa bộ lọc{active.length ? ` (${active.length})` : ''}</button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Tìm theo mã sinh viên hoặc họ tên" value={filters.search} onChange={e => change('search', e.target.value)} placeholder="Tìm mã sinh viên hoặc họ tên, có thể nhập không dấu..." className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-10 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100" />
          {filters.search && <button aria-label="Xóa từ khóa" onClick={() => change('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X size={16} /></button>}
        </div>
        <button onClick={() => setAdvanced(v => !v)} aria-expanded={advanced} aria-controls="progress-advanced-filters" className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${advanced || advancedCount ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><SlidersHorizontal size={17} />Lọc nâng cao{advancedCount ? ` (${advancedCount})` : ''}</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {select('cohort', 'Khóa nhập học', options(unique(students.map(s => s.cohort))))}
        {select('curriculum', 'Khung chương trình', options(unique(cohortRows.map(s => s.curriculumCode))))}
        {select('studentClass', 'Lớp sinh viên', options(unique(scope.map(s => s.studentClass))))}
        {select('term', 'Học kỳ hiện tại', options(unique(scope.map(s => s.currentTerm))))}
      </div>
      {advanced && <div id="progress-advanced-filters" className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {select('semester', 'Kỳ chuyên ngành', semesters.map(value => ({ value: String(value), label: `Kỳ ${value}` })))}
        {select('eligibility', 'Kết quả xét OJT', options(['Đủ điều kiện', 'Chưa đủ điều kiện', 'Chưa có kết quả']))}
        {select('subject', 'Môn học', subjects.map(([code, name]) => ({ value: code, label: `${code} — ${name}` })))}
        {select('subjectStatus', 'Trạng thái môn học', Object.entries(subjectLabels).map(([value, label]) => ({ value, label })))}
        <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-4">Chọn môn để lọc trạng thái của môn đó. Để tất cả môn để tìm sinh viên có ít nhất một môn mang trạng thái đã chọn.</p>
      </div>}
      {active.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">{active.map(([key, value]) => <button key={key} onClick={() => change(key, '')} aria-label={`Bỏ lọc ${filterLabels[key]}`} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800"><span className="truncate">{filterLabels[key]}: {key === 'subjectStatus' ? subjectLabels[value] : value}</span><X size={13} className="shrink-0" /></button>)}</div>}
    </section>
    <section aria-label="Danh sách tiến độ học tập" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div><h2 className="font-semibold text-slate-900">Danh sách sinh viên <span className="ml-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">{loading ? '…' : filtered.length}</span></h2><p className="mt-1 text-xs text-slate-500">Tín chỉ và GPA từ hồ sơ học tập. Kết quả OJT hiển thị theo dữ liệu đã xét.</p></div>
        <div className="flex items-center gap-2"><ArrowDownWideNarrow size={16} className="text-slate-400" /><select aria-label="Sắp xếp sinh viên" value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm"><option value="code">Mã sinh viên</option><option value="name">Họ và tên</option><option value="credits">Tín chỉ giảm dần</option><option value="gpa">GPA giảm dần</option></select><button aria-label="Tải lại sinh viên" disabled={loading} onClick={onReload} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-orange-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button></div>
      </div>
      {warning && <p role="status" className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">{warning}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Sinh viên', 'Khóa / Lớp', 'Khung chương trình', 'Học kỳ', 'GPA', 'Tín chỉ tích lũy', 'Môn chưa đạt', 'Điều kiện OJT', ''].map(title => <th key={title} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{title}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? <tr><td colSpan={9} role="status" className="px-5 py-14 text-center text-slate-500">Đang tải danh sách và hồ sơ học tập...</td></tr> : error ? <tr><td colSpan={9} role="alert" className="px-5 py-12 text-center text-red-700"><p>{error}</p><button onClick={onReload} className="mt-3 font-semibold underline">Thử tải lại</button></td></tr> : visible.length ? visible.map(student => {
            const complete = student.completedCredits;
            const total = student.totalCredits;
            const percent = complete !== null && total !== null && total > 0 ? Math.min(100, Math.max(0, complete / total * 100)) : null;
            const failed = student.subjects.filter(s => s.status === 'Not Passed').length;
            const statusStyle = student.eligibilityStatus === 'Đủ điều kiện' ? 'bg-emerald-50 text-emerald-700' : student.eligibilityStatus === 'Chưa đủ điều kiện' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600';
            return <tr key={student.id} className="transition hover:bg-orange-50/30">
              <td className="px-4 py-4"><button onClick={() => onSelect(student)} className="text-left font-semibold text-slate-900 hover:text-orange-700">{student.fullName}</button><p className="mt-1 font-mono text-xs text-orange-700">{student.studentCode}</p>{student.dataWarning && <p className="mt-1 text-xs text-amber-700" title={student.dataWarning}>Hồ sơ cần kiểm tra</p>}</td>
              <td className="px-4 py-4"><p className="font-medium text-slate-700">{student.cohort}</p><p className="mt-1 text-xs text-slate-500">{student.studentClass}</p></td>
              <td className="max-w-52 break-words px-4 py-4 text-xs font-medium text-slate-600">{student.curriculumCode}</td>
              <td className="px-4 py-4"><p className="font-medium text-slate-700">{student.currentCurriculumSemester === null ? '—' : `Kỳ ${student.currentCurriculumSemester}`}</p><p className="mt-1 text-xs text-slate-500">{student.currentTerm}</p></td>
              <td className="px-4 py-4 font-semibold text-slate-800">{student.gpa?.toFixed(2) ?? '—'}</td>
              <td className="min-w-40 px-4 py-4"><p><span className="font-semibold text-slate-800">{complete ?? '—'}</span><span className="text-xs text-slate-400"> / {total ?? '—'} TC</span></p>{percent !== null && <div role="progressbar" aria-label={`Tín chỉ ${student.studentCode}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} /></div>}</td>
              <td className="px-4 py-4">{student.subjects.length ? <span className={failed ? 'font-semibold text-rose-600' : 'text-slate-500'}>{failed} môn</span> : <span className="text-slate-400">—</span>}</td>
              <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle}`}>{student.detailsUnavailable ? 'Chưa tải được' : student.eligibilityStatus}</span></td>
              <td className="px-4 py-4"><button aria-label={`Xem hồ sơ ${student.studentCode}`} onClick={() => onSelect(student)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-orange-100 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"><Eye size={15} />Chi tiết</button></td>
            </tr>;
          }) : <tr><td colSpan={9} className="px-5 py-14 text-center"><Users size={30} className="mx-auto text-slate-300" /><p className="mt-3 font-medium text-slate-700">{students.length ? 'Không có sinh viên khớp bộ lọc' : 'Chưa có sinh viên trong hệ thống'}</p><p className="mt-1 text-sm text-slate-500">{students.length ? 'Thử đổi từ khóa hoặc mở rộng phạm vi tìm kiếm.' : 'Sinh viên sẽ xuất hiện sau khi được thêm hoặc import thành công.'}</p>{active.length > 0 && <button onClick={() => setFilters(initialFilters)} className="mt-3 text-sm font-semibold text-orange-700">Xóa tất cả bộ lọc</button>}</td></tr>}
        </tbody>
      </table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
        <p aria-live="polite">{loading ? 'Đang tải...' : `Hiển thị ${filtered.length ? start + 1 : 0}–${Math.min(start + pageSize, filtered.length)} / ${filtered.length} sinh viên`}</p>
        <div className="flex items-center gap-3"><label className="flex items-center gap-2">Mỗi trang<select aria-label="Số sinh viên mỗi trang" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="rounded-lg border px-2 py-1.5">{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label><button aria-label="Trang trước" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button><span>{currentPage} / {pages}</span><button aria-label="Trang sau" disabled={loading || currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button></div>
      </div>
    </section>
  </div>;
}
