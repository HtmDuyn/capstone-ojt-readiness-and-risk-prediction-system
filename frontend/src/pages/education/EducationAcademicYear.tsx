import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, CheckCircle2, History, Pencil, Plus, RefreshCw } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { AcademicCalendarEditor } from '@/components/education/AcademicCalendarEditor';
import { useEducationAcademicCalendar } from '@/hooks/useEducationAcademicCalendar';
import { CALENDAR_TERMS, currentCalendarDate, defaultSemesters, formatCalendarDate, semesterDraft, semesterState, TERM_COLOR, TERM_LABEL } from '@/utils/academicCalendar';

const stateLabel = { UPCOMING: 'Sắp diễn ra', NOT_STARTED: 'Chưa diễn ra', CURRENT: 'Đang diễn ra', PAST: 'Đã kết thúc' };
const stateClass = { UPCOMING: 'bg-blue-50 text-blue-700', NOT_STARTED: 'bg-slate-50 text-slate-500', CURRENT: 'bg-green-50 text-green-700', PAST: 'bg-slate-100 text-slate-600' };
type HistorySortKey = 'year' | 'code' | 'semester' | 'startDate' | 'endDate' | 'state';
type HistorySort = { key: HistorySortKey; direction: 'asc' | 'desc' } | null;
const historyColumns: { key: HistorySortKey; title: string }[] = [
  { key: 'year', title: 'Năm học' }, { key: 'code', title: 'Mã học kỳ' },
  { key: 'semester', title: 'Học kỳ' }, { key: 'startDate', title: 'Ngày bắt đầu' },
  { key: 'endDate', title: 'Ngày kết thúc' }, { key: 'state', title: 'Theo thời gian' },
];
const stateOrder = { PAST: 0, CURRENT: 1, UPCOMING: 2, NOT_STARTED: 3 };
const dateValue = (value: string): number | null => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!parts) return null;
  const [, year, month, day] = parts.map(Number);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null;
};
const compareValues = (a: number | string | null, b: number | string | null) => {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'vi', { numeric: true });
};
const EducationAcademicYear: React.FC = () => {
  const model = useEducationAcademicCalendar();
  const [startYear, setStartYear] = useState(() => currentCalendarDate().slice(0, 4));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const initializedYear = useRef(false);
  const [historyYear, setHistoryYear] = useState('');
  const [historyState, setHistoryState] = useState('ALL');
  const [search, setSearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySort>(null);
  const year = Number(startYear);
  const validYear = /^\d{4}$/.test(startYear) && year >= 1900 && year < 2200;
  const yearCode = validYear ? `${year}-${year + 1}` : '';
  const exists = model.years.some(item => item.yearCode === yearCode);
  const defaults = validYear ? defaultSemesters(year) : [];
  const selectedCalendar = exists && model.calendar?.year.yearCode === yearCode ? model.calendar : null;
  const draft = selectedCalendar ? semesterDraft(selectedCalendar) : null;
  const today = currentCalendarDate();
  useEffect(() => { setEditing(false); }, [model.selectedId]);
  useEffect(() => {
    if (!model.loading && !initializedYear.current) {
      initializedYear.current = true;
      const selected = model.years.find(item => String(item.id) === model.selectedId);
      if (selected) setStartYear(selected.yearCode.slice(0, 4));
    }
  }, [model.loading, model.selectedId, model.years]);
  useEffect(() => {
    if (!creating && !editing) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !model.busy) { setCreating(false); setEditing(false); }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [creating, editing, model.busy]);
  const yearNames = useMemo(() => new Map(model.years.map(item => [item.id, item.yearCode])), [model.years]);
  const yearStarts = useMemo(() => new Map(model.years.map(item => [item.id, item.startDate])), [model.years]);
  const nextSemesterId = useMemo(() => model.periods
    .filter(period => period.kind === 'SEMESTER' && period.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)[0]?.id,
  [model.periods, today]);
  const displayState = (period: { id: number; startDate: string; endDate: string }) => {
    const state = semesterState(period, today);
    return state === 'UPCOMING' && period.id !== nextSemesterId ? 'NOT_STARTED' : state;
  };
  const history = useMemo(() => model.periods.filter(period => period.kind === 'SEMESTER')
    .filter(period => !historyYear || String(period.academicYearId) === historyYear)
    .filter(period => historyState === 'ALL' || displayState(period) === historyState)
    .filter(period => `${period.periodCode} ${period.name} ${yearNames.get(period.academicYearId) ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (yearStarts.get(a.academicYearId) ?? a.startDate).localeCompare(yearStarts.get(b.academicYearId) ?? b.startDate)
      || a.startDate.localeCompare(b.startDate)
      || CALENDAR_TERMS.findIndex(term => a.periodCode.startsWith(term)) - CALENDAR_TERMS.findIndex(term => b.periodCode.startsWith(term))
      || a.id - b.id),
  [model.periods, historyYear, historyState, today, search, yearNames, yearStarts, nextSemesterId]);
  const sortedHistory = useMemo(() => {
    if (!historySort) return history;
    const value = (period: typeof history[number]): number | string | null => {
      switch (historySort.key) {
        case 'year': {
          const code = yearNames.get(period.academicYearId);
          return code && /^\d{4}/.test(code) ? Number(code.slice(0, 4)) : null;
        }
        case 'code': return period.periodCode || null;
        case 'semester': return dateValue(period.startDate);
        case 'startDate': return dateValue(period.startDate);
        case 'endDate': return dateValue(period.endDate);
        case 'state': return stateOrder[displayState(period)];
      }
    };
    return history.slice().sort((a, b) => {
      const first = value(a), second = value(b);
      const result = compareValues(first, second);
      return first === null || second === null ? result : historySort.direction === 'asc' ? result : -result;
    });
  }, [history, historySort, yearNames, today, nextSemesterId]);
  const toggleHistorySort = (key: HistorySortKey) => setHistorySort(current =>
    current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null);
  const selectedSemesters = selectedCalendar?.semesters.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)) ?? [];
  return <div className="space-y-6">
    <PageBanner title="Quản lý năm học và học kỳ" description={null} badge="Phòng Đào tạo" />
    {model.notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18} />{model.notice}</p>}
    {model.error && !creating && !editing && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{model.error}</p>}
    {model.catalogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Không tải được danh mục: {model.catalogError}</p>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <section className="space-y-5 border-b border-slate-200 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CalendarDays size={20} className="text-orange-600" />Quản lý năm học</h2><p className="mt-1 text-sm text-slate-500">Chọn năm để xem lịch đã lưu hoặc khởi tạo năm học mới.</p></div>
        <button type="button" aria-label="Tải lại lịch năm học" disabled={model.busy || creating || editing} onClick={model.reload} className="rounded-lg border border-slate-200 p-2.5 disabled:opacity-50"><RefreshCw size={17} /></button>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="min-w-0 flex-1 text-sm font-medium text-slate-700 sm:max-w-64">Năm bắt đầu
          <input type="number" list="academic-year-starts" min={1900} max={2199} value={startYear} disabled={model.busy || model.loading || creating || editing} onChange={event => {
            const value = event.target.value;
            setStartYear(value);
            const start = Number(value);
            const code = /^\d{4}$/.test(value) && start >= 1900 && start < 2200 ? `${start}-${start + 1}` : '';
            model.setSelectedId(String(model.years.find(item => item.yearCode === code)?.id ?? ''));
          }} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-orange-500 focus:outline-none" />
          <datalist id="academic-year-starts">{model.years.map(item => <option key={item.id} value={item.yearCode.slice(0, 4)} />)}</datalist>
        </label>
        <p className="pb-2 text-sm text-slate-600">Năm học: <strong className="text-slate-900">{yearCode || '—'}</strong></p>
        {validYear && !exists && <button type="button" disabled={model.busy || model.loading || Boolean(model.catalogError)} onClick={() => setCreating(true)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={17} />Tạo năm học</button>}
        {validYear && exists && <button type="button" disabled={model.busy || model.calendarLoading || !draft} onClick={() => setEditing(true)} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:opacity-50"><Pencil size={16} />Chỉnh sửa lịch học kỳ</button>}
      </div>
      {!validYear && <p role="alert" className="text-sm text-red-700">Nhập năm bắt đầu từ 1900 đến 2199.</p>}
      {validYear && !exists && !model.loading && !model.catalogError && <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Năm học này chưa được khởi tạo.</p>}

      {exists && (model.loading || model.calendarLoading) && <p role="status" className="text-sm text-slate-500">Đang tải lịch học kỳ...</p>}
      {exists && model.calendarError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.calendarError}</p>}
      {selectedCalendar && <>
        <div className="grid gap-4 md:grid-cols-3">{selectedSemesters.map((period, index) => {
          const term = CALENDAR_TERMS.find(term => period.periodCode.startsWith(term));
          const state = displayState(period);
          return <article key={period.id} className={`rounded-xl border p-4 ${term ? TERM_COLOR[term] : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Học kỳ {index + 1}</span><span className={`rounded-full px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel[state]}</span></div><h3 className="mt-3 text-lg font-bold">{period.name}</h3><p className="text-xs opacity-70">{period.periodCode}</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-2"><dt>Bắt đầu</dt><dd className="font-medium">{formatCalendarDate(period.startDate)}</dd></div><div className="flex justify-between gap-2"><dt>Kết thúc</dt><dd className="font-medium">{formatCalendarDate(period.endDate)}</dd></div></dl></article>;
        })}</div>
        {!draft && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Lịch cũ chưa có đủ 3 kỳ theo mẫu Spring → Summer → Fall của cùng năm. Cần đối soát dữ liệu trước khi chỉnh lịch.</p>}
      </>}
    </section>

    <section className="space-y-4 p-5 md:p-6">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><History size={20} className="text-orange-600" />Danh sách học kỳ đã khởi tạo</h2><p className="mt-1 text-sm text-slate-500"></p></div>
      <div className="flex flex-wrap gap-3"><select aria-label="Lọc danh sách theo năm học" value={historyYear} onChange={e => setHistoryYear(e.target.value)} className="rounded-lg border p-2.5"><option value="">Tất cả năm học</option>{model.years.map(item => <option key={item.id} value={item.id}>{item.yearCode}</option>)}</select><select aria-label="Lọc thời gian học kỳ" value={historyState} onChange={e => setHistoryState(e.target.value)} className="rounded-lg border p-2.5"><option value="ALL">Tất cả học kỳ</option><option value="PAST">Đã kết thúc</option><option value="CURRENT">Đang diễn ra</option><option value="UPCOMING">Sắp diễn ra</option><option value="NOT_STARTED">Chưa diễn ra</option></select><input aria-label="Tìm học kỳ" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên học kỳ" className="min-w-48 flex-1 rounded-lg border p-2.5" /></div>
      <div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-[#EFF6FF] text-[#334155]"><tr className="border-b border-[#D6E4F0]"><th scope="col" className="w-14 p-3 text-center font-semibold">STT</th>{historyColumns.map(({ key, title }) => <th key={key} scope="col" aria-sort={historySort?.key === key ? historySort.direction === 'asc' ? 'ascending' : 'descending' : 'none'} className="whitespace-nowrap p-3 font-semibold"><button type="button" onClick={() => toggleHistorySort(key)} className="inline-flex items-center gap-1.5 rounded-sm text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">{title}{historySort?.key === key ? historySort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowDown size={14} aria-hidden="true" className="text-orange-600" /> : <ArrowUpDown size={14} aria-hidden="true" className="text-slate-400" />}</button></th>)}</tr></thead><tbody>{sortedHistory.map((period, index) => {
        const state = displayState(period);
        return <tr key={period.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="w-14 p-3 text-center text-slate-600">{index + 1}</td><td className="p-3 font-medium">{yearNames.get(period.academicYearId) ?? '—'}</td><td className="p-3">{period.periodCode}</td><td className="p-3">{period.name}</td><td className="whitespace-nowrap p-3">{formatCalendarDate(period.startDate)}</td><td className="whitespace-nowrap p-3">{formatCalendarDate(period.endDate)}</td><td className="p-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel[state]}</span></td></tr>;
      })}</tbody></table>{!history.length && !model.loading && <p className="p-8 text-center text-sm text-slate-500">Không có học kỳ phù hợp.</p>}</div>
      <p className="text-xs text-slate-500">Hiển thị {history.length} học kỳ. Các nhãn thời gian dựa trên ngày hiện tại, không thay đổi trạng thái học vụ đã lưu.</p>
    </section>
    </div>
    {creating && validYear && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="create-year-title" className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
        <form className="space-y-5" onSubmit={async event => { event.preventDefault(); if (!model.busy && !exists && await model.create(yearCode)) setCreating(false); }}>
          <div><h2 id="create-year-title" className="text-lg font-semibold text-slate-900">Tạo năm học {yearCode}</h2><p className="mt-1 text-sm text-slate-600">Xem lịch ba học kỳ sẽ được tạo theo quy định hiện tại.</p></div>
          <label className="block max-w-56 text-sm font-medium text-slate-700">Năm bắt đầu<input type="number" value={startYear} readOnly className="mt-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800" /></label>
          <div className="grid gap-4 md:grid-cols-3">{defaults.map((row, index) => <section key={row.term} className={`space-y-3 rounded-xl border p-4 ${TERM_COLOR[row.term]}`}>
            <h3 className="font-semibold">{index + 1}. {TERM_LABEL[row.term]} {year}</h3>
            <p className="text-sm">Ngày bắt đầu: <strong>{formatCalendarDate(row.startDate)}</strong></p>
            <p className="text-sm">Ngày kết thúc: <strong>{formatCalendarDate(row.endDate)}</strong></p>
          </section>)}</div>
          <p className="text-xs leading-5 text-slate-600">Ngày tạo mới được lưu theo lịch mặc định. Sau khi tạo, bạn có thể chỉnh sửa cả ba kỳ trong một lần lưu.</p>
          {model.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" disabled={model.busy} onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50">Hủy</button><button type="submit" disabled={model.busy || exists} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{model.busy ? 'Đang tạo...' : 'Xác nhận tạo'}</button></div>
        </form>
      </div>
    </div>}
    {editing && selectedCalendar && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-label={`Chỉnh sửa lịch học kỳ ${yearCode}`} className="w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
        <AcademicCalendarEditor key={`${selectedCalendar.year.id}:${selectedCalendar.revision}`} calendar={selectedCalendar} busy={model.busy} onSave={model.save} onCancel={() => setEditing(false)} />
        {model.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.error}</p>}
      </div>
    </div>}
  </div>;
};
export default EducationAcademicYear;
