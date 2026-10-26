import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, History, Pencil, Plus, RefreshCw } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { AcademicCalendarEditor } from '@/components/education/AcademicCalendarEditor';
import { useEducationAcademicCalendar } from '@/hooks/useEducationAcademicCalendar';
import { CALENDAR_TERMS, currentCalendarDate, defaultSemesters, formatCalendarDate, semesterDraft, semesterState, TERM_COLOR, TERM_LABEL } from '@/utils/academicCalendar';

const stateLabel = { UPCOMING: 'Sắp diễn ra', NOT_STARTED: 'Chưa diễn ra', CURRENT: 'Đang diễn ra', PAST: 'Đã kết thúc' };
const stateClass = { UPCOMING: 'bg-blue-50 text-blue-700', NOT_STARTED: 'bg-slate-50 text-slate-500', CURRENT: 'bg-green-50 text-green-700', PAST: 'bg-slate-100 text-slate-600' };
const EducationAcademicYear: React.FC = () => {
  const model = useEducationAcademicCalendar();
  const [startYear, setStartYear] = useState(() => currentCalendarDate().slice(0, 4));
  const [editing, setEditing] = useState(false);
  const [historyYear, setHistoryYear] = useState('');
  const [historyState, setHistoryState] = useState('ALL');
  const [search, setSearch] = useState('');
  const year = Number(startYear);
  const validYear = /^\d{4}$/.test(startYear) && year >= 1900 && year < 2200;
  const yearCode = validYear ? `${year}-${year + 1}` : '';
  const exists = model.years.some(item => item.yearCode === yearCode);
  const defaults = validYear ? defaultSemesters(year) : [];
  const draft = model.calendar ? semesterDraft(model.calendar) : null;
  const today = currentCalendarDate();
  useEffect(() => { setEditing(false); }, [model.selectedId]);
  const yearNames = useMemo(() => new Map(model.years.map(item => [item.id, item.yearCode])), [model.years]);
  const yearStarts = useMemo(() => new Map(model.years.map(item => [item.id, item.startDate])), [model.years]);
  const yearColorIndex = useMemo(() => new Map(model.years.slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
    .map((item, index) => [item.id, index] as const)), [model.years]);
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
  const selectedSemesters = model.calendar?.semesters.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)) ?? [];
  return <div className="space-y-6">
    <PageBanner title="Quản lý năm học và học kỳ" description="Khởi tạo năm học với 3 kỳ Spring → Summer → Fall; điều chỉnh lịch cả năm trong một lần lưu." badge="Phòng Đào tạo" />
    {model.notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18} />{model.notice}</p>}
    {model.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{model.error}</p>}
    {model.catalogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Không tải được danh mục: {model.catalogError}</p>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <section className="space-y-5 border-b border-slate-200 p-5 md:p-6">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Plus size={20} className="text-orange-600" />Khởi tạo năm học</h2><p className="mt-1 text-sm text-slate-500">Hệ thống tự tạo đủ ba học kỳ, không cần tạo riêng từng kỳ.</p></div>
      <form className="flex flex-wrap items-end gap-4" onSubmit={async event => { event.preventDefault(); if (validYear && !exists && !model.loading) { setEditing(false); await model.create(yearCode); } }}>
        <label className="text-sm font-medium text-slate-700">Năm bắt đầu<input required type="number" min={1900} max={2199} value={startYear} disabled={model.busy || editing} onChange={e => setStartYear(e.target.value)} className="mt-2 block w-36 rounded-lg border border-slate-200 p-3" /></label>
        <div className="pb-2"><p className="text-xs text-slate-500">Năm học sẽ tạo</p><p className="mt-1 text-xl font-bold text-slate-900">{yearCode || '—'}</p></div>
        <button disabled={!validYear || exists || model.busy || model.loading || Boolean(model.catalogError) || editing} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus size={17} />{model.busy ? 'Đang xử lý...' : 'Tạo năm học và 3 kỳ'}</button>
      </form>
      {exists && <p className="text-sm text-amber-800">Năm học {yearCode} đã tồn tại. Chọn năm học ở phần lịch bên dưới để xem hoặc chỉnh sửa.</p>}
      {!validYear && <p role="alert" className="text-sm text-red-700">Nhập năm bắt đầu từ 1900 đến 2199.</p>}
      <div className="grid gap-3 md:grid-cols-3">{defaults.map((row, index) => <div key={row.term} className={`relative rounded-xl border p-4 ${TERM_COLOR[row.term]}`}><p className="text-xs font-semibold">Học kỳ {index + 1}</p><h3 className="mt-1 font-bold">{TERM_LABEL[row.term]} {year}</h3><p className="mt-2 text-sm">{formatCalendarDate(row.startDate)} — {formatCalendarDate(row.endDate)}</p>{index < 2 && <ChevronRight size={18} className="absolute right-3 top-4 hidden md:block" />}</div>)}</div>
      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Ví dụ: mã năm học <strong>2026–2027</strong> gồm Spring 2026 (tháng 1–4), Summer 2026 (tháng 5–8), Fall 2026 (tháng 9–12). Toàn bộ lịch thuộc năm 2026. Phòng QHDN quản lý các đợt đăng ký OJT trong học kỳ.</p>
    </section>

    <section className="space-y-5 border-b border-slate-200 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CalendarDays size={20} className="text-orange-600" />Lịch học kỳ theo năm</h2><div className="flex flex-wrap gap-2">
        <select aria-label="Năm học xem lịch" value={model.selectedId} disabled={model.busy || model.loading || editing} onChange={event => model.setSelectedId(event.target.value)} className="rounded-lg border border-slate-200 p-2.5"><option value="">Chọn năm học</option>{model.years.map(item => <option key={item.id} value={item.id}>{item.yearCode}</option>)}</select>
        <button aria-label="Tải lại lịch năm học" disabled={model.busy || editing} onClick={model.reload} className="rounded-lg border p-2.5 disabled:opacity-50"><RefreshCw size={17} /></button>
      </div></div>
      {(model.loading || model.calendarLoading) && <p role="status" className="text-sm text-slate-500">Đang tải lịch học kỳ...</p>}
      {model.calendarError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.calendarError}</p>}
      {!model.loading && !model.years.length && !model.catalogError && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">Chưa có năm học. Khởi tạo năm học ở phần trên để tự tạo 3 kỳ.</p>}
      {model.calendar && !editing && <>
        <div className="grid gap-4 md:grid-cols-3">{selectedSemesters.map((period, index) => {
          const term = CALENDAR_TERMS.find(term => period.periodCode.startsWith(term));
          const state = displayState(period);
          return <article key={period.id} className={`rounded-xl border p-4 ${term ? TERM_COLOR[term] : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">Học kỳ {index + 1}</span><span className={`rounded-full px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel[state]}</span></div><h3 className="mt-3 text-lg font-bold">{period.name}</h3><p className="text-xs opacity-70">{period.periodCode}</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-2"><dt>Bắt đầu</dt><dd className="font-medium">{formatCalendarDate(period.startDate)}</dd></div><div className="flex justify-between gap-2"><dt>Kết thúc</dt><dd className="font-medium">{formatCalendarDate(period.endDate)}</dd></div></dl></article>;
        })}</div>
        {!draft && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Lịch cũ chưa có đủ 3 kỳ theo mẫu Spring → Summer → Fall của cùng năm. Cần đối soát dữ liệu trước khi chỉnh lịch.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500">Điều chỉnh cả ba kỳ trong một lần lưu để giữ đúng thứ tự và tránh chồng thời gian. Lịch vẫn được kiểm tra với Block 3 và dữ liệu OJT đã liên kết.</p><button disabled={model.busy || !draft || model.calendarLoading} onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:opacity-50"><Pencil size={16} />Điều chỉnh lịch 3 kỳ</button></div>
      </>}
      {model.calendar && editing && <AcademicCalendarEditor key={`${model.calendar.year.id}:${model.calendar.revision}`} calendar={model.calendar} busy={model.busy} onSave={model.save} onCancel={() => setEditing(false)} />}
    </section>

    <section className="space-y-4 p-5 md:p-6">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><History size={20} className="text-orange-600" />Danh sách học kỳ đã khởi tạo</h2><p className="mt-1 text-sm text-slate-500"></p></div>
      <div className="flex flex-wrap gap-3"><select aria-label="Lọc danh sách theo năm học" value={historyYear} onChange={e => setHistoryYear(e.target.value)} className="rounded-lg border p-2.5"><option value="">Tất cả năm học</option>{model.years.map(item => <option key={item.id} value={item.id}>{item.yearCode}</option>)}</select><select aria-label="Lọc thời gian học kỳ" value={historyState} onChange={e => setHistoryState(e.target.value)} className="rounded-lg border p-2.5"><option value="ALL">Tất cả học kỳ</option><option value="PAST">Đã kết thúc</option><option value="CURRENT">Đang diễn ra</option><option value="UPCOMING">Sắp diễn ra</option><option value="NOT_STARTED">Chưa diễn ra</option></select><input aria-label="Tìm học kỳ" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên học kỳ" className="min-w-48 flex-1 rounded-lg border p-2.5" /></div>
      <div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Năm học', 'Mã học kỳ', 'Học kỳ', 'Ngày bắt đầu', 'Ngày kết thúc', 'Theo thời gian'].map(title => <th key={title} className="whitespace-nowrap p-3">{title}</th>)}</tr></thead><tbody>{history.map(period => {
        const state = displayState(period);
        return <tr key={period.id} className={`border-t border-slate-200 ${(yearColorIndex.get(period.academicYearId) ?? 0) % 2 === 0 ? 'bg-white' : 'bg-[#EAF4FF]'}`}><td className="p-3 font-medium">{yearNames.get(period.academicYearId) ?? '—'}</td><td className="p-3">{period.periodCode}</td><td className="p-3">{period.name}</td><td className="whitespace-nowrap p-3">{formatCalendarDate(period.startDate)}</td><td className="whitespace-nowrap p-3">{formatCalendarDate(period.endDate)}</td><td className="p-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel[state]}</span></td></tr>;
      })}</tbody></table>{!history.length && !model.loading && <p className="p-8 text-center text-sm text-slate-500">Không có học kỳ phù hợp.</p>}</div>
      <p className="text-xs text-slate-500">Hiển thị {history.length} học kỳ. Các nhãn thời gian dựa trên ngày hiện tại, không thay đổi trạng thái học vụ đã lưu.</p>
    </section>
    </div>
  </div>;
};
export default EducationAcademicYear;
