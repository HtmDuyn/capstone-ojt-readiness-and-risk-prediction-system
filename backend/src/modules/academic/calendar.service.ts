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

function checkBlock3Dates(block: SemesterDates, semester: SemesterDates) {
  if (block.startDate > block.endDate)
    throw academicError(`Ngày kết thúc Block 3 của ${block.term} không được trước ngày bắt đầu.`);
  if (block.startDate < semester.startDate || block.endDate > semester.endDate)
    throw academicError(`Ngày Block 3 của ${block.term} phải nằm trong học kỳ tương ứng.`);
}

async function saveBlock3(client: PoolClient, semester: AcademicRecord, block: SemesterDates, actorId: number, existing?: AcademicRecord) {
  const dates = { startDate: block.startDate, endDate: block.endDate };
  if (existing) {
    if (existing.startDate !== dates.startDate || existing.endDate !== dates.endDate)
      await saveResourceWithClient(client, 'academic-periods', dates, actorId, positiveId(existing.id), false);
    return;
  }
  await saveResourceWithClient(client, 'academic-periods', {
    ...dates, academicYearId: semester.academicYearId, parentPeriodId: semester.id,
    periodCode: `${semester.periodCode}-BL3`, name: `Block 3 - ${semester.name}`, kind: 'BLOCK3', status: 'PLANNED',
  }, actorId, undefined, false);
}

export async function createYearCalendar(body: unknown, actorId: number) {
  const b = inputObject(body, ['yearCode', 'blocks']);
  const yearCode = requiredText(b.yearCode, 'yearCode', 20);
  const startYear = calendarYear(yearCode), dates = defaultCalendar(yearCode);
  const blocks = b.blocks === undefined ? [] : validateSemesterDates(yearCode, b.blocks);
  blocks.forEach((block, index) => checkBlock3Dates(block, dates[index]));
  return academicTransaction(async client => {
    const year = await saveResourceWithClient(client, 'academic-years', {
      yearCode, startDate: `${startYear}-01-01`, endDate: `${startYear}-12-31`, status: 'PLANNED',
    }, actorId, undefined, false);
    for (const [index, row] of dates.entries()) {
      const semester = await saveResourceWithClient(client, 'academic-periods', {
        academicYearId: year.id, periodCode: `${row.term}${startYear}`,
        name: `${row.term[0]}${row.term.slice(1).toLowerCase()} ${startYear}`,
        kind: 'SEMESTER', startDate: row.startDate, endDate: row.endDate, status: 'PLANNED',
      }, actorId, undefined, false);
      const block = blocks[index];
      if (block) await saveBlock3(client, semester, block, actorId);
    }
    await finalizeCalendar(client);
    return snapshot(client, year.id);
  });
}

export async function updateYearCalendar(yearId: number, body: unknown, actorId: number) {
  const b = inputObject(body, ['semesters', 'revision', 'blocks']);
  const revision = requiredText(b.revision, 'revision', 64);
  return academicTransaction(async client => {
    const before = await snapshot(client, yearId);
    if (before.revision !== revision) throw academicError('Lịch đã được người khác thay đổi. Tải lại lịch trước khi chỉnh sửa.', 409, 'ACADEMIC_CALENDAR_STALE');
    const dates = validateSemesterDates(before.year.yearCode, b.semesters);
    const year = calendarYear(before.year.yearCode);
    const blocks = new Map<Term, SemesterDates>();
    if (b.blocks !== undefined) {
      if (!Array.isArray(b.blocks) || b.blocks.length > dates.length) throw academicError('Gửi tối đa một Block 3 cho mỗi học kỳ.');
      for (const value of b.blocks) {
        const raw = inputObject(value, ['term', 'startDate', 'endDate']);
        const semester = dates.find(row => row.term === raw.term);
        if (!semester || blocks.has(semester.term)) throw academicError('Mỗi Block 3 phải có học kỳ hợp lệ và duy nhất.');
        const startDate = dateInput(raw.startDate, 'startDate');
        const endDate = dateInput(raw.endDate, 'endDate');
        const block = { term: semester.term, startDate, endDate };
        checkBlock3Dates(block, semester);
        blocks.set(semester.term, block);
      }
    }
    // Preserve IDs and all references. Legacy calendars require explicit reconciliation.
    if (before.semesters.length !== 3 || dates.some(row => !before.semesters.some(p => p.periodCode === `${row.term}${year}`))) {
      throw academicError('Lịch năm học cũ chưa đúng mẫu 3 kỳ Spring–Summer–Fall. Cần đối soát dữ liệu trước khi sửa đồng thời.', 409, 'ACADEMIC_CALENDAR_LEGACY');
    }
    for (const row of dates) {
      const period = before.semesters.find(p => p.periodCode === `${row.term}${year}`)!;
      if (period.startDate !== row.startDate || period.endDate !== row.endDate)
        await saveResourceWithClient(client, 'academic-periods', {
          startDate: row.startDate, endDate: row.endDate,
        }, actorId, positiveId(period.id), false);
      const block = blocks.get(row.term);
      if (block) {
        const existing = (before.year.periods as AcademicRecord[]).find(item => item.kind === 'BLOCK3' && item.parentPeriodId === period.id);
        await saveBlock3(client, period, block, actorId, existing);
      }
    }
    await finalizeCalendar(client);
    const after = await snapshot(client, yearId);
    await audit(client, actorId, 'AcademicYears', yearId, 'UPDATE_YEAR_CALENDAR', before, after);
    return after;
  });
}
