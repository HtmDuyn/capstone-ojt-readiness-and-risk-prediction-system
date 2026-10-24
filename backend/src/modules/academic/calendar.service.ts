import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction, audit, findRecord, type AcademicRecord } from './academic.repository';
import { academicError, dateInput, inputObject, positiveId, requiredText } from './academic.schema';
import { finalizeCalendar, saveResourceWithClient } from './academic.service';

export const calendarTerms = ['SPRING', 'SUMMER', 'FALL'] as const;
type Term = typeof calendarTerms[number];
type SemesterDates = { term: Term; startDate: string; endDate: string };

export function calendarYear(yearCode: unknown) {
  if (typeof yearCode !== 'string' || !/^\d{4}-\d{4}$/.test(yearCode)) {
    throw academicError('Năm học phải có dạng YYYY-YYYY, ví dụ 2026-2027.');
  }
  const [start, end] = yearCode.split('-').map(Number);
  if (start < 1900 || end > 2200 || end !== start + 1) {
    throw academicError('Năm kết thúc phải liền sau năm bắt đầu (1900–2200).');
  }
  return start;
}

export function defaultCalendar(yearCode: string): SemesterDates[] {
  const year = calendarYear(yearCode);
  return [
    { term: 'SPRING', startDate: `${year}-01-01`, endDate: `${year}-04-30` },
    { term: 'SUMMER', startDate: `${year}-05-01`, endDate: `${year}-08-31` },
    { term: 'FALL', startDate: `${year}-09-01`, endDate: `${year}-12-31` },
  ];
}

export function validateSemesterDates(yearCode: string, value: unknown): SemesterDates[] {
  const year = calendarYear(yearCode);
  if (!Array.isArray(value) || value.length !== 3) throw academicError('Phải gửi đủ 3 kỳ Spring, Summer, Fall trong cùng một lần lưu.');
  const rows = value.map((input, index) => {
    const row = inputObject(input, ['term', 'startDate', 'endDate']);
    if (row.term !== calendarTerms[index]) throw academicError('Thứ tự học kỳ phải là Spring → Summer → Fall.');
    const startDate = dateInput(row.startDate, 'startDate'), endDate = dateInput(row.endDate, 'endDate');
    if (startDate > endDate || startDate < `${year}-01-01` || endDate > `${year}-12-31`) {
      throw academicError(`Ngày của ${row.term} phải hợp lệ và nằm trong năm ${year}.`);
    }
    return { term: row.term as Term, startDate, endDate };
  });
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].startDate <= rows[i - 1].endDate) throw academicError('Các học kỳ không được trùng ngày; kỳ sau phải bắt đầu sau ngày kết thúc kỳ trước.', 409, 'ACADEMIC_CALENDAR_CONFLICT');
  }
  return rows;
}

async function snapshot(client: PoolClient, yearId: number) {
  const year = await findRecord(client, 'academic-years', yearId);
  const records = (await client.query('SELECT "AcademicPeriodID" FROM "AcademicPeriods" WHERE "AcademicYearID"=$1 AND "Kind"=\'SEMESTER\' ORDER BY "StartDate","AcademicPeriodID"', [yearId])).rows;
  const semesters: AcademicRecord[] = [];
  for (const row of records) semesters.push(await findRecord(client, 'academic-periods', row.AcademicPeriodID));
  const revision = createHash('sha256').update(JSON.stringify({ year, semesters })).digest('hex');
  return { year, semesters, revision };
}

export async function getYearCalendar(yearId: number) {
  return academicTransaction(client => snapshot(client, yearId));
}

export async function createYearCalendar(body: unknown, actorId: number) {
  const b = inputObject(body, ['yearCode']);
  const yearCode = requiredText(b.yearCode, 'yearCode', 20);
  const startYear = calendarYear(yearCode), dates = defaultCalendar(yearCode);
  return academicTransaction(async client => {
    const year = await saveResourceWithClient(client, 'academic-years', {
      yearCode, startDate: `${startYear}-01-01`, endDate: `${startYear}-12-31`, status: 'PLANNED',
    }, actorId, undefined, false);
    for (const row of dates) {
      await saveResourceWithClient(client, 'academic-periods', {
        academicYearId: year.id, periodCode: `${row.term}${startYear}`,
        name: `${row.term[0]}${row.term.slice(1).toLowerCase()} ${startYear}`,
        kind: 'SEMESTER', startDate: row.startDate, endDate: row.endDate, status: 'PLANNED',
      }, actorId, undefined, false);
    }
    await finalizeCalendar(client);
    return snapshot(client, year.id);
  });
}

export async function updateYearCalendar(yearId: number, body: unknown, actorId: number) {
  const b = inputObject(body, ['semesters', 'revision']);
  const revision = requiredText(b.revision, 'revision', 64);
  return academicTransaction(async client => {
    const before = await snapshot(client, yearId);
    if (before.revision !== revision) throw academicError('Lịch đã được người khác thay đổi. Tải lại lịch trước khi chỉnh sửa.', 409, 'ACADEMIC_CALENDAR_STALE');
    const dates = validateSemesterDates(before.year.yearCode, b.semesters);
    const year = calendarYear(before.year.yearCode);
    // Preserve IDs and all references. Legacy calendars require explicit reconciliation.
    if (before.semesters.length !== 3 || dates.some(row => !before.semesters.some(p => p.periodCode === `${row.term}${year}`))) {
      throw academicError('Lịch năm học cũ chưa đúng mẫu 3 kỳ Spring–Summer–Fall. Cần đối soát dữ liệu trước khi sửa đồng thời.', 409, 'ACADEMIC_CALENDAR_LEGACY');
    }
    for (const row of dates) {
      const period = before.semesters.find(p => p.periodCode === `${row.term}${year}`)!;
      await saveResourceWithClient(client, 'academic-periods', {
        startDate: row.startDate, endDate: row.endDate,
      }, actorId, positiveId(period.id), false);
    }
    await finalizeCalendar(client);
    const after = await snapshot(client, yearId);
    await audit(client, actorId, 'AcademicYears', yearId, 'UPDATE_YEAR_CALENDAR', before, after);
    return after;
  });
}
