import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, History, Pencil, Plus, RefreshCw } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { AcademicBlockDates } from '@/components/education/AcademicBlockDates';
import { AcademicCalendarEditor } from '@/components/education/AcademicCalendarEditor';
import { useEducationAcademicCalendar } from '@/hooks/education/useEducationAcademicCalendar';
import { CALENDAR_TERMS, blockDateError, currentCalendarDate, defaultSemesters, formatCalendarDate, semesterDraft, semesterState, TERM_COLOR, TERM_LABEL } from '@/utils/education/academicCalendar';
import type { AcademicPeriod, SemesterDates } from '@/types/education/academic.types';

const stateLabel = { UPCOMING: 'Sắp diễn ra', NOT_STARTED: 'Chưa diễn ra', CURRENT: 'Đang diễn ra', PAST: 'Đã kết thúc' };
const stateClass = { UPCOMING: 'bg-blue-50 text-blue-700', NOT_STARTED: 'bg-slate-50 text-slate-500', CURRENT: 'bg-green-50 text-green-700', PAST: 'bg-slate-100 text-slate-600' };
function SemesterBlocks({ semester, configured }: { semester: AcademicPeriod; configured?: AcademicPeriod }) {
  const calendar = semester.blockCalendar;
  const savedBlock10 = semester.block10StartDate && semester.block10EndDate
    ? { startDate: semester.block10StartDate, endDate: semester.block10EndDate } : null;
  const main = savedBlock10 ?? calendar?.mainSemester;
  const blocks = [
    { label: 'Block 10', range: main, saved: !!savedBlock10 },
    { label: 'Block 3', range: configured ?? calendar?.block, saved: !!configured },
  ];
  return <div className="mt-3 border-l-2 border-orange-200 pl-3">
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
      {blocks.map(({ label, range, saved }) => <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
        <dt className="font-semibold text-slate-800">{label}{range && <span className="ml-1 font-normal text-slate-500">{saved ? '· Đã lưu' : '· Xem trước'}</span>}</dt>
        <dd className="mt-1 text-slate-600">{range ? `${formatCalendarDate(range.startDate)} – ${formatCalendarDate(range.endDate)}` : 'Chưa có lịch'}</dd>
      </div>)}
    </dl>
    {!calendar && (!savedBlock10 || !configured) && <p className="mt-2 text-xs text-slate-600">Kỳ này chưa có đủ ngày để hiển thị lịch xem trước của các block.</p>}
  </div>;
}

const EducationAcademicYear: React.FC = () => {
  const model = useEducationAcademicCalendar();
  const [startYear, setStartYear] = useState(() => currentCalendarDate().slice(0, 4));
  const [creating, setCreating] = useState(false);
  const [createBlock10, setCreateBlock10] = useState<SemesterDates[]>([]);
  const [createBlocks, setCreateBlocks] = useState<SemesterDates[]>([]);
  const [editing, setEditing] = useState(false);
  const initializedYear = useRef(false);
  const [historyYear, setHistoryYear] = useState('');
  const [historyState, setHistoryState] = useState('ALL');
  const [search, setSearch] = useState('');
  const year = Number(startYear);
  const validYear = /^\d{4}$/.test(startYear) && year >= 1900 && year < 2200;
  const yearCode = validYear ? `${year}-${year + 1}` : '';
  const exists = model.years.some(item => item.yearCode === yearCode);
  const editableYears = model.years.filter(item => {
    const year = Number(item.yearCode.slice(0, 4));
    const codes = new Set(model.periods
      .filter(period => period.kind === 'SEMESTER' && period.academicYearId === item.id)
      .map(period => period.periodCode));
    return CALENDAR_TERMS.every(term => codes.has(`${term}${year}`));
  });
  const defaults = validYear ? defaultSemesters(year) : [];
  const blockErrors = defaults.map((semester, index) => {
    const main = createBlock10[index], block = createBlocks[index];
    return blockDateError(main, semester, 'Block 10') || blockDateError(block, semester)
      || (main.endDate >= block.startDate ? 'Block 3 phải bắt đầu sau ngày kết thúc Block 10.' : '');
  });
  const createConflict = defaults.some(semester => model.periods.some(period =>
    period.kind === 'SEMESTER' && period.startDate <= semester.endDate && period.endDate >= semester.startDate));
  const createHasErrors = createConflict || blockErrors.some(Boolean);
  const selectedCalendar = exists && model.calendar?.year.yearCode === yearCode ? model.calendar : null;
  const draft = selectedCalendar ? semesterDraft(selectedCalendar) : null;
  const today = currentCalendarDate();
  useEffect(() => {
    if (!model.loading && !initializedYear.current) {
      initializedYear.current = true;
      const selected = model.years.find(item => String(item.id) === model.selectedId);
      if (selected) setStartYear(selected.yearCode.slice(0, 4));
    }
  }, [model.loading, model.selectedId, model.years]);
  const beginCreate = () => {
    const starts = model.years.map(item => Number(item.yearCode.slice(0, 4))).filter(Number.isFinite);
    let nextYear = Math.max(Number(currentCalendarDate().slice(0, 4)), ...(starts.length ? starts.map(value => value + 1) : []));
    while (model.years.some(item => item.yearCode === `${nextYear}-${nextYear + 1}`)) nextYear++;
    const semesters = defaultSemesters(nextYear);
    setStartYear(String(nextYear));
    setCreateBlocks(semesters.map(({ term }) => ({ term, startDate: '', endDate: '' })));
    setCreateBlock10(semesters.map(({ term }) => ({ term, startDate: '', endDate: '' })));
    setCreating(true);
  };
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
  const historyByYear = new Map<number, AcademicPeriod[]>();
  for (const period of history) {
    const group = historyByYear.get(period.academicYearId) ?? [];
    group.push(period);
    historyByYear.set(period.academicYearId, group);
  }
  const configuredBlocks = new Map(model.periods.filter(period => period.kind === 'BLOCK3')
    .map(period => [period.parentPeriodId, period]));
  return <div className="space-y-6">
    <PageBanner variant="education" title="Quản lý năm học và học kỳ" description={null} badge="Phòng Đào tạo" />
    {model.notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 size={18} />{model.notice}</p>}
    {model.error && !creating && !editing && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{model.error}</p>}
    {model.catalogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Không tải được danh mục: {model.catalogError}</p>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <section className="space-y-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-left text-lg font-bold text-slate-900"><History size={20} className="text-orange-600" />Danh sách học kỳ đã khởi tạo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={model.busy || model.loading || creating || editing || Boolean(model.catalogError)} onClick={beginCreate} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"><Plus size={17} />Tạo mới</button>
          {editableYears.length > 0 && <button type="button" disabled={model.busy || model.calendarLoading || model.loading} onClick={() => {
            const selected = editableYears.find(item => String(item.id) === model.selectedId) ?? editableYears[0];
            setStartYear(selected.yearCode.slice(0, 4));
            model.setSelectedId(String(selected.id));
            setEditing(true);
          }} className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 disabled:opacity-50"><Pencil size={16} />Chỉnh sửa lịch học kỳ</button>}
          <button type="button" aria-label="Tải lại lịch năm học" disabled={model.busy || creating || editing} onClick={model.reload} className="rounded-lg border border-slate-200 p-2.5 disabled:opacity-50"><RefreshCw size={17} /></button>
        </div>
      </div>
      {exists && (model.loading || model.calendarLoading) && <p role="status" className="text-sm text-slate-500">Đang tải lịch học kỳ...</p>}
      {exists && model.calendarError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.calendarError}</p>}
      {selectedCalendar && !draft && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Lịch cũ chưa đủ ba học kỳ theo mẫu Spring → Summer → Fall nên chưa thể chỉnh sửa.</p>}
      <div className="flex flex-wrap gap-3"><select aria-label="Lọc danh sách theo năm học" value={historyYear} onChange={e => setHistoryYear(e.target.value)} className="rounded-lg border p-2.5"><option value="">Tất cả năm học</option>{model.years.map(item => <option key={item.id} value={item.id}>{item.yearCode}</option>)}</select><select aria-label="Lọc thời gian học kỳ" value={historyState} onChange={e => setHistoryState(e.target.value)} className="rounded-lg border p-2.5"><option value="ALL">Tất cả học kỳ</option><option value="PAST">Đã kết thúc</option><option value="CURRENT">Đang diễn ra</option><option value="UPCOMING">Sắp diễn ra</option><option value="NOT_STARTED">Chưa diễn ra</option></select><input aria-label="Tìm học kỳ" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên học kỳ" className="min-w-48 flex-1 rounded-lg border p-2.5" /></div>
      <div className="space-y-4">
        {[...historyByYear].map(([id, periods]) => <section key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <h3 className="border-b border-slate-200 bg-blue-50 px-4 py-3 font-semibold text-slate-900">Năm học {yearNames.get(id) ?? '—'}</h3>
          <ul className="space-y-3 p-3 sm:p-4">
            {periods.map(period => {
              const state = displayState(period);
              return <li key={period.id} className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{period.name}</h4>
                    <p className="mt-1 text-xs text-slate-600">{period.periodCode} · {formatCalendarDate(period.startDate)} – {formatCalendarDate(period.endDate)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${stateClass[state]}`}>{stateLabel[state]}</span>
                </div>
                <SemesterBlocks semester={period} configured={configuredBlocks.get(period.id)} />
              </li>;
            })}
          </ul>
        </section>)}
        {!history.length && !model.loading && <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">Không có học kỳ phù hợp.</p>}
      </div>
      <p className="text-xs text-slate-500">Hiển thị {history.length} học kỳ. Các nhãn thời gian dựa trên ngày hiện tại, không thay đổi trạng thái học vụ đã lưu.</p>
    </section>
    </div>
    {creating && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="create-year-title" className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
        <form className="space-y-5" onSubmit={async event => { event.preventDefault(); if (!model.busy && validYear && !exists && !createHasErrors && await model.create(yearCode, createBlocks, createBlock10)) setCreating(false); }}>
          <div><h2 id="create-year-title" className="text-lg font-semibold text-slate-900">Tạo năm học mới</h2><p className="mt-1 text-sm text-slate-600">Chọn năm bắt đầu, sau đó nhập lịch Block 10 và Block 3 cho ba học kỳ.</p></div>
          <label className="block max-w-56 text-sm font-medium text-slate-700">Năm bắt đầu<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={startYear} onChange={event => {
            const value = event.target.value;
            setStartYear(value);
            if (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) < 2200) {
              const semesters = defaultSemesters(Number(value));
              setCreateBlocks(semesters.map(({ term }) => ({ term, startDate: '', endDate: '' })));
              setCreateBlock10(semesters.map(({ term }) => ({ term, startDate: '', endDate: '' })));
            } else { setCreateBlocks([]); setCreateBlock10([]); }
          }} aria-invalid={!validYear || exists} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-orange-500 focus:outline-none" /></label>
          {!validYear && <p role="alert" className="text-sm text-red-700">Nhập năm bắt đầu từ 1900 đến 2199.</p>}
          {exists && <p role="alert" className="text-sm text-red-700">Năm học này đã tồn tại. Hãy chọn năm khác.</p>}
          <div className="grid gap-4 md:grid-cols-3">{defaults.map((semester, index) => <fieldset key={semester.term} className={`min-w-0 space-y-3 rounded-xl border p-4 ${TERM_COLOR[semester.term]}`}>
            <legend className="px-1 font-semibold">{TERM_LABEL[semester.term]} {year}</legend>
            <p className="text-sm">Học kỳ {formatCalendarDate(semester.startDate)} – {formatCalendarDate(semester.endDate)}</p>
            <AcademicBlockDates label="Block 10" semester={semester} block={createBlock10[index]} required onChange={(field, value) =>
              setCreateBlock10(rows => rows.map(row => row.term === semester.term ? { ...row, [field]: value } : row))} />
            <AcademicBlockDates label="Block 3" semester={semester} block={createBlocks[index]} required onChange={(field, value) =>
              setCreateBlocks(rows => rows.map(row => row.term === semester.term ? { ...row, [field]: value } : row))} />
            {blockErrors[index] && createBlocks[index]?.endDate && createBlock10[index]?.endDate && <p role="alert" className="text-xs text-red-700">{blockErrors[index]}</p>}
          </fieldset>)}</div>
          {createConflict && <p role="alert" className="text-sm text-red-700">Lịch của năm học trùng với học kỳ đã tồn tại.</p>}
          {model.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" disabled={model.busy} onClick={() => { setCreating(false); const selected = model.years.find(item => String(item.id) === model.selectedId); if (selected) setStartYear(selected.yearCode.slice(0, 4)); }} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50">Hủy</button><button type="submit" disabled={model.busy || !validYear || exists || createHasErrors} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{model.busy ? 'Đang tạo...' : 'Xác nhận tạo'}</button></div>
        </form>
      </div>
    </div>}
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-label="Chỉnh sửa lịch học kỳ" className="w-full max-w-6xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold text-slate-900">Chỉnh sửa lịch học kỳ</h2><p className="mt-1 text-sm text-slate-600">Chọn năm học đã có để xem và sửa ba học kỳ.</p></div>
          <button type="button" aria-label="Đóng popup" disabled={model.busy} onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Đóng</button>
        </div>
        <label className="mb-5 block max-w-xs text-sm font-medium text-slate-700">Năm học
          <select value={model.selectedId} disabled={model.busy} onChange={event => {
            const selected = model.years.find(item => String(item.id) === event.target.value);
            if (selected) { setStartYear(selected.yearCode.slice(0, 4)); model.setSelectedId(String(selected.id)); }
          }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:border-orange-500 focus:outline-none">
            {editableYears.map(item => <option key={item.id} value={String(item.id)}>{item.yearCode}</option>)}
          </select>
        </label>
        {model.calendarLoading && <p role="status" className="mb-4 text-sm text-slate-500">Đang tải lịch học kỳ...</p>}
        {model.calendarError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.calendarError}</p>}
        {selectedCalendar && draft && <AcademicCalendarEditor key={`${selectedCalendar.year.id}:${selectedCalendar.revision}`} calendar={selectedCalendar} busy={model.busy} onSave={model.save} onCancel={() => setEditing(false)} />}
        {selectedCalendar && !draft && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Năm học này chưa có đủ ba học kỳ theo mẫu để chỉnh sửa lịch.</p>}
        {model.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{model.error}</p>}
      </div>
    </div>}
  </div>;
};
export default EducationAcademicYear;
