import type { AcademicCalendar, AcademicPeriod, CalendarTerm, SemesterDates } from '@/types/education/academic.types';

export const CALENDAR_TERMS: CalendarTerm[] = ['SPRING', 'SUMMER', 'FALL'];
export const TERM_LABEL: Record<CalendarTerm, string> = { SPRING: 'Spring', SUMMER: 'Summer', FALL: 'Fall' };
export const TERM_COLOR: Record<CalendarTerm, string> = {
  SPRING: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  SUMMER: 'border-amber-200 bg-amber-50 text-amber-900',
  FALL: 'border-orange-200 bg-orange-50 text-orange-900',
};
export function defaultSemesters(year: number): SemesterDates[] {
  return [
    { term: 'SPRING', startDate: `${year}-01-01`, endDate: `${year}-04-30` },
    { term: 'SUMMER', startDate: `${year}-05-01`, endDate: `${year}-08-31` },
    { term: 'FALL', startDate: `${year}-09-01`, endDate: `${year}-12-31` },
  ];
}
export function calendarErrors(year: number, rows: SemesterDates[]): string[] {
  if (rows.length !== 3 || rows.some((row, i) => row.term !== CALENDAR_TERMS[i])) return ['Phải có đủ Spring → Summer → Fall theo đúng thứ tự.'];
  const errors: string[] = [];
  rows.forEach((row, i) => {
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
    if (!valid(row.startDate) || !valid(row.endDate)) errors.push(`${TERM_LABEL[row.term]}: nhập đủ ngày bắt đầu và kết thúc hợp lệ.`);
    else if (row.startDate > row.endDate) errors.push(`${TERM_LABEL[row.term]}: ngày kết thúc không được trước ngày bắt đầu.`);
    else if (row.startDate < `${year}-01-01` || row.endDate > `${year}-12-31`) errors.push(`${TERM_LABEL[row.term]} phải nằm trong năm ${year}.`);
    if (i > 0 && row.startDate && rows[i - 1].endDate && row.startDate <= rows[i - 1].endDate) errors.push(`${TERM_LABEL[row.term]} phải bắt đầu sau ngày kết thúc ${TERM_LABEL[rows[i - 1].term]}.`);
  });
  return errors;
}
export function semesterDraft(calendar: AcademicCalendar): SemesterDates[] | null {
  const year = Number(calendar.year.yearCode.slice(0, 4));
  if (calendar.semesters.length !== 3) return null;
  const rows = CALENDAR_TERMS.map(term => {
    const saved = calendar.semesters.find(p => p.periodCode === `${term}${year}`);
    return saved ? { term, startDate: saved.startDate, endDate: saved.endDate } : null;
  });
  return rows.every((row): row is SemesterDates => row !== null) ? rows : null;
}
export const formatCalendarDate = (date: string) => date ? date.split('-').reverse().join('/') : '—';
export function currentCalendarDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function semesterState(period: Pick<AcademicPeriod, 'startDate' | 'endDate'>, today = currentCalendarDate()) {
  return today < period.startDate ? 'UPCOMING' : today > period.endDate ? 'PAST' : 'CURRENT';
}
