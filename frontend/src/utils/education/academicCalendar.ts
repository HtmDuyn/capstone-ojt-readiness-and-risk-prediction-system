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
export function suggestedBlockDates(semester: SemesterDates): { block10: SemesterDates; block3: SemesterDates } {
  const addDays = (value: string, days: number) => {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const block10End = addDays(semester.startDate, 69);
  const block3Start = addDays(semester.endDate, -20);
  return {
    block10: { term: semester.term, startDate: semester.startDate, endDate: block10End < semester.endDate ? block10End : addDays(semester.startDate, 59) },
    block3: { term: semester.term, startDate: block3Start > semester.startDate ? block3Start : addDays(semester.startDate, 60), endDate: semester.endDate },
  };
}
const validCalendarDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
type DateRange = Pick<SemesterDates, 'startDate' | 'endDate'>;
export function blockDateError(block: DateRange | undefined, semester: DateRange, label = 'Block 3'): string {
  if (!block || !validCalendarDate(block.startDate) || !validCalendarDate(block.endDate))
    return `Chọn đủ ngày bắt đầu và kết thúc ${label} hợp lệ.`;
  if (block.startDate > block.endDate) return `Ngày kết thúc ${label} không được trước ngày bắt đầu.`;
  if (block.startDate < semester.startDate || block.endDate > semester.endDate)
    return `${label} phải nằm trong học kỳ tương ứng.`;
  return '';
}

export function blockDateBounds(block: DateRange | undefined, semester: DateRange, field: keyof DateRange) {
  const inside = (value?: string) => value && validCalendarDate(value) &&
    semester.startDate <= value && value <= semester.endDate;
  return {
    min: field === 'endDate' && inside(block?.startDate) ? block?.startDate : semester.startDate,
    max: field === 'startDate' && inside(block?.endDate) ? block?.endDate : semester.endDate,
  };
}
export function calendarErrors(year: number, rows: SemesterDates[]): string[] {
  if (rows.length !== 3 || rows.some((row, i) => row.term !== CALENDAR_TERMS[i])) return ['Phải có đủ Spring → Summer → Fall theo đúng thứ tự.'];
  const errors: string[] = [];
  rows.forEach((row, i) => {
    if (!validCalendarDate(row.startDate) || !validCalendarDate(row.endDate)) errors.push(`${TERM_LABEL[row.term]}: nhập đủ ngày bắt đầu và kết thúc hợp lệ.`);
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
