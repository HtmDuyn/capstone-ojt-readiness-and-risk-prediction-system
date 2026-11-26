import type { SemesterDates } from '@/types/education/academic.types';
import { blockDateBounds } from '@/utils/education/academicCalendar';

type DateField = 'startDate' | 'endDate';

export function AcademicBlockDates({ label, block, semester, required, onChange }: {
  label: string;
  block?: SemesterDates;
  semester: SemesterDates;
  required?: boolean;
  onChange: (field: DateField, value: string) => void;
}) {
  return <div className="space-y-2 border-t border-slate-200 pt-2">
    {(['startDate', 'endDate'] as const).map(field => <label key={field} className="block text-sm">
      {field === 'startDate' ? 'Ngày bắt đầu' : 'Ngày kết thúc'} {label}
      <input type="date" required={required} {...blockDateBounds(block, semester, field)}
        value={block?.[field] ?? ''} onChange={event => onChange(field, event.target.value)}
        className="mt-1 block w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800" />
    </label>)}
  </div>;
}
