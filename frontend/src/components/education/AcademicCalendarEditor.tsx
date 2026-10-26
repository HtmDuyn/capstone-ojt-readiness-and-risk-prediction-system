import { useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { AcademicCalendar, SemesterDates } from '@/types/education/academic.types';
import { calendarErrors, semesterDraft, TERM_COLOR, TERM_LABEL } from '@/utils/academicCalendar';

export function AcademicCalendarEditor({ calendar, busy, onSave, onCancel }: {
  calendar: AcademicCalendar; busy: boolean; onSave: (rows: SemesterDates[]) => Promise<boolean>; onCancel: () => void;
}) {
  const [rows, setRows] = useState<SemesterDates[]>(() => semesterDraft(calendar) ?? []);
  const year = Number(calendar.year.yearCode.slice(0, 4));
  const errors = useMemo(() => calendarErrors(year, rows), [year, rows]);
  const changed = JSON.stringify(rows) !== JSON.stringify(semesterDraft(calendar));
  return <form className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/30 p-5" onSubmit={async event => {
    event.preventDefault();
    if (!busy && !errors.length && changed && await onSave(rows)) onCancel();
  }}>
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">Chỉnh sửa lịch 3 kỳ — {calendar.year.yearCode}</h3><button type="button" aria-label="Hủy chỉnh sửa" disabled={busy} onClick={onCancel}><X size={18} /></button></div>
    <p className="text-sm text-slate-600">Chỉnh lịch Spring, Summer và Fall trong cùng biểu mẫu. Tất cả thay đổi được lưu cùng lúc; không lưu riêng từng học kỳ.</p>
    <div className="grid gap-4 lg:grid-cols-3">{rows.map((row, index) => <fieldset key={row.term} disabled={busy} className={`space-y-3 rounded-xl border p-4 ${TERM_COLOR[row.term]}`}>
      <legend className="px-1 font-bold">{index + 1}. {TERM_LABEL[row.term]} {year}</legend>
      <label className="block text-sm">Ngày bắt đầu<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.startDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, startDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
      <label className="block text-sm">Ngày kết thúc<input required type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={row.endDate} onChange={e => setRows(values => values.map((value, i) => i === index ? { ...value, endDate: e.target.value } : value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" /></label>
    </fieldset>)}</div>
    {errors.length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Ngày kết thúc được tính trong học kỳ. Kỳ tiếp theo phải bắt đầu từ ngày sau đó trở đi.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border bg-white px-4 py-2">Hủy</button><button disabled={busy || !changed || errors.length > 0} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><Save size={16} />{busy ? 'Đang lưu...' : 'Lưu'}</button></div></div>
  </form>;
}
