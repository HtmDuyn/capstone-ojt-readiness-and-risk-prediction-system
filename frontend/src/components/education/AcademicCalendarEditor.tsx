import { AcademicBlockDates } from './AcademicBlockDates';
import { useState } from 'react';
import { Save } from 'lucide-react';
import type { AcademicCalendar, SemesterDates } from '@/types/education/academic.types';
import { blockDateError, calendarErrors, semesterDraft, suggestedBlockDates, TERM_COLOR, TERM_LABEL } from '@/utils/education/academicCalendar';

export function AcademicCalendarEditor({ calendar, busy, onSave, onCancel }: {
  calendar: AcademicCalendar; busy: boolean; onSave: (rows: SemesterDates[], blocks: SemesterDates[], block10: SemesterDates[]) => Promise<boolean>; onCancel: () => void;
}) {
  const initialRows = semesterDraft(calendar) ?? [];
  const initialBlocks = initialRows.map(({ term }) => {
    const parent = calendar.semesters.find(semester => semester.periodCode.startsWith(term));
    const block = calendar.year.periods?.find(period => period.kind === 'BLOCK3' && period.parentPeriodId === parent?.id);
    return { term, startDate: block?.startDate ?? '', endDate: block?.endDate ?? '' };
  });
  const initialBlock10 = initialRows.map(({ term }) => {
    const parent = calendar.semesters.find(semester => semester.periodCode.startsWith(term));
    return { term, startDate: parent?.block10StartDate ?? '', endDate: parent?.block10EndDate ?? '' };
  });
  const [block10, setBlock10] = useState(() => initialBlock10.map((block, index) => {
    if (block.startDate && block.endDate) return block;
    const suggestion = suggestedBlockDates(initialRows[index]).block10;
    return { term: block.term, startDate: block.startDate || suggestion.startDate, endDate: block.endDate || suggestion.endDate };
  }));
  const [rows, setRows] = useState(initialRows);
  const [blocks, setBlocks] = useState(() => initialBlocks.map((block, index) => {
    if (block.startDate && block.endDate) return block;
    const suggestion = suggestedBlockDates(initialRows[index]).block3;
    return { term: block.term, startDate: block.startDate || suggestion.startDate, endDate: block.endDate || suggestion.endDate };
  }));
  const year = Number(calendar.year.yearCode.slice(0, 4));
  const errors = calendarErrors(year, rows);
  for (const [index, parent] of rows.entries()) {
    const main = block10[index], block = blocks[index];
    if (main.startDate || main.endDate || initialBlock10[index].startDate) {
      const error = blockDateError(main, parent, 'Block 10');
      if (error) errors.push(`${TERM_LABEL[parent.term]}: ${error}`);
    }
    if (block.startDate || block.endDate || initialBlocks[index].startDate) {
      const error = blockDateError(block, parent);
      if (error) errors.push(`${TERM_LABEL[parent.term]}: ${error}`);
    }
    if (main.endDate && block.startDate && main.endDate >= block.startDate)
      errors.push(`${TERM_LABEL[parent.term]}: Block 3 phải bắt đầu sau ngày kết thúc Block 10.`);
  }
  const changed = JSON.stringify([rows, blocks, block10]) !== JSON.stringify([initialRows, initialBlocks, initialBlock10]);
  const complete = (dates: SemesterDates[]) => dates.filter(block => block.startDate && block.endDate);
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault();
    if (!busy && !errors.length && changed && await onSave(rows, complete(blocks), complete(block10))) onCancel();
  }}>
    <h3 className="font-bold text-slate-900">Lịch học kỳ — {calendar.year.yearCode}</h3>
    <p className="text-sm text-slate-600">Chỉnh ngày của ba học kỳ, Block 10 và Block 3. Các thay đổi được lưu cùng lúc.</p>
    <div className="grid gap-4 md:grid-cols-3">{rows.map((row, index) => <fieldset key={row.term} disabled={busy} className={`min-w-0 space-y-3 rounded-xl border p-4 ${TERM_COLOR[row.term]}`}>
      <legend className="px-1 font-bold">{index + 1}. {TERM_LABEL[row.term]} {year}</legend>
      <label className="block text-sm">Ngày bắt đầu<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.startDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, startDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
      <label className="block text-sm">Ngày kết thúc<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.endDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, endDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
      <AcademicBlockDates label="Block 10" semester={row} block={block10[index]} onChange={(field, value) =>
        setBlock10(dates => dates.map(block => block.term === row.term ? { ...block, [field]: value } : block))} />
      <AcademicBlockDates label="Block 3" semester={row} block={blocks[index]} onChange={(field, value) =>
        setBlocks(dates => dates.map(block => block.term === row.term ? { ...block, [field]: value } : block))} />
    </fieldset>)}</div>
    {errors.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Ngày kết thúc được tính trong học kỳ. Kỳ tiếp theo phải bắt đầu từ ngày sau đó trở đi.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border bg-white px-4 py-2">Hủy</button><button disabled={busy || !changed || errors.length > 0} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><Save size={16} />{busy ? 'Đang lưu...' : 'Lưu'}</button></div></div>
  </form>;
}
