import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { AcademicCalendar, SemesterDates } from '@/types/education/academic.types';
import { blockDateBounds, blockDateError, calendarErrors, semesterDraft, TERM_COLOR, TERM_LABEL } from '@/utils/education/academicCalendar';

export function AcademicCalendarEditor({ calendar, busy, onSave, onCancel }: {
  calendar: AcademicCalendar; busy: boolean; onSave: (rows: SemesterDates[], blocks: SemesterDates[]) => Promise<boolean>; onCancel: () => void;
}) {
  const initialRows = semesterDraft(calendar) ?? [];
  const initialBlocks = initialRows.map(({ term }) => {
    const parent = calendar.semesters.find(semester => semester.periodCode.startsWith(term));
    const block = calendar.year.periods?.find(period => period.kind === 'BLOCK3' && period.parentPeriodId === parent?.id);
    return { term, startDate: block?.startDate ?? '', endDate: block?.endDate ?? '' };
  });
  const [rows, setRows] = useState(initialRows);
  const [blocks, setBlocks] = useState(initialBlocks);
  const year = Number(calendar.year.yearCode.slice(0, 4));
  const errors = calendarErrors(year, rows);
  for (const [index, block] of blocks.entries()) {
    const parent = rows[index];
    if (!block.startDate && !block.endDate && !initialBlocks[index].startDate) continue;
    const error = blockDateError(block, parent);
    if (error) errors.push(`${TERM_LABEL[block.term]}: ${error}`);
  }
  const changed = JSON.stringify([rows, blocks]) !== JSON.stringify([initialRows, initialBlocks]);
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault();
    if (!busy && !errors.length && changed && await onSave(rows, blocks.filter(block => block.startDate && block.endDate))) onCancel();
  }}>
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">Chỉnh sửa lịch 3 kỳ — {calendar.year.yearCode}</h3><button type="button" aria-label="Hủy chỉnh sửa" disabled={busy} onClick={onCancel}><X size={18} /></button></div>
    <p className="text-sm text-slate-600">Ngày học kỳ và Block 3 được lưu cùng lúc. Với học kỳ chưa có Block 3, chọn cả hai ngày để thêm lịch.</p>
    <div className="grid gap-4 lg:grid-cols-3">{rows.map((row, index) => <fieldset key={row.term} disabled={busy} className={`space-y-3 rounded-xl border p-4 ${TERM_COLOR[row.term]}`}>
      <legend className="px-1 font-bold">{index + 1}. {TERM_LABEL[row.term]} {year}</legend>
      <label className="block text-sm">Ngày bắt đầu<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.startDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, startDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
      <label className="block text-sm">Ngày kết thúc<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.endDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, endDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
      {(['startDate', 'endDate'] as const).map(field => <label key={field} className="block text-sm">
        {field === 'startDate' ? 'Ngày bắt đầu Block 3' : 'Ngày kết thúc Block 3'}
        <input type="date" {...blockDateBounds(blocks[index], row, field)} value={blocks[index][field]}
          onChange={event => {
            const value = event.target.value;
            setBlocks(current => current.map(block => block.term === row.term ? { ...block, [field]: value } : block));
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" />
      </label>)}
    </fieldset>)}</div>
    {errors.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Ngày kết thúc được tính trong học kỳ. Kỳ tiếp theo phải bắt đầu từ ngày sau đó trở đi.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border bg-white px-4 py-2">Hủy</button><button disabled={busy || !changed || errors.length > 0} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><Save size={16} />{busy ? 'Đang lưu...' : 'Lưu'}</button></div></div>
  </form>;
}
