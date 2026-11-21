import { expect, test } from 'vitest';
import { assertAcyclic, metadata, integer } from '../../src/modules/curriculum/curriculum.validation';
import { validateImport } from '../../src/modules/imports/import.validation';
import { calculateProgress } from '../../src/modules/students/academic-progress';
import { earlyWarning } from '../../src/modules/student-portal/early-warning';
import { phaseIsOpen, currentRoundPhase, assertRoundPhase, roundActions } from '../../src/modules/recruitment/round-policy';
import { validatePhaseOrder, schedulePermissions } from '../../src/modules/recruitment/schedule-policy';
import { coordinationAvailability } from '../../src/modules/qhdn/placement.policy';
import { csvReport, demandRows } from '../../src/modules/academic-reporting/report-format';
const register = require('../../../qa/register-case.cjs');

const academic = register(test, { group: 'Academic & Curriculum', source: 'backend/src/modules/curriculum/curriculum.validation.ts', role: 'ACADEMIC' });
academic({ id: 'CUR-ACYCLIC', title: 'Accept a prerequisite graph with shared descendants', input: '1->2,3; 2->4; 3->4.', expected: 'No cycle error.' }, () => expect(() => assertAcyclic(new Map([[1, new Set([2, 3])], [2, new Set([4])], [3, new Set([4])]]), 'prerequisites')).not.toThrow());
for (const [i, edges] of [new Map([[1, new Set([1])]]), new Map([[1, new Set([2])], [2, new Set([3])], [3, new Set([1])]])].entries()) academic({ id: `CUR-CYCLE-${i + 1}`, type: 'A', title: `Reject prerequisite cycle ${i + 1}`, input: i ? '1->2->3->1' : '1->1', expected: 'CURRICULUM_CYCLE.' }, () => expect(() => assertAcyclic(edges, 'prerequisites')).toThrow(expect.objectContaining({ errorCode: 'CURRICULUM_CYCLE' })));
const programMeta = { code: 'SE26', name: 'Software Engineering', majorId: 1, totalCredits: 114, effectiveYear: 2026, gpaScale: 10 };
for (const scale of [4, 10]) academic({ id: `CUR-SCALE-${scale}`, type: 'B', title: `Accept GPA scale ${scale}`, input: JSON.stringify({ ...programMeta, gpaScale: scale }), expected: `gpaScale ${scale}; total credits 114.` }, () => expect(metadata({ ...programMeta, gpaScale: scale })).toMatchObject({ gpaScale: scale, fields: { TotalCredits: 114 } }));
for (const [i, patch] of [{ gpaScale: 5 }, { totalCredits: 0 }, { effectiveYear: 1899 }, { extra: true }].entries()) academic({ id: `CUR-METADATA-INVALID-${i + 1}`, type: 'A', title: `Reject invalid curriculum metadata ${i + 1}`, input: JSON.stringify(patch), expected: 'Validation exception with statusCode 400.' }, () => expect(() => metadata({ ...programMeta, ...patch })).toThrow(expect.objectContaining({ statusCode: 400 })));
academic({ id: 'CUR-INTEGER-BOUNDARY', type: 'B', title: 'Semester integer accepts endpoints and rejects fractional value', input: '0,20,1.5', expected: '0 and 20 accepted; 1.5 throws.' }, () => { expect(integer(0, 'semester')).toBe(0); expect(integer(20, 'semester')).toBe(20); expect(() => integer(1.5, 'semester')).toThrow(); });

const imports = register(test, { group: 'Student Data & Imports', source: 'backend/src/modules/imports/import.validation.ts', role: 'ACADEMIC / OJT_COORD' });
const studentRow = (i = 1) => ({ code: `se${i}`, email: `STUDENT${i}@EXAMPLE.TEST`, fullName: ` Student ${i} `, academic: { profile: {}, courseResults: [] } });
const importBody = (rows: unknown[] = [studentRow()]) => ({ kind: 'STUDENT', idempotencyKey: 'fixture-import', rows });
imports({ id: 'IMP-NORMALIZE', title: 'Normalize student code, email and full name', input: JSON.stringify(studentRow()), expected: 'SE1; student1@example.test; Student 1.' }, () => expect(validateImport(importBody()).rows[0]).toMatchObject({ code: 'SE1', email: 'student1@example.test', fullName: 'Student 1' }));
for (const count of [0, 1, 500, 501]) imports({ id: `IMP-ROWS-${count}`, type: 'B', title: `Import row limit ${count}`, input: `${count} unique student rows.`, expected: count >= 1 && count <= 500 ? `${count} rows accepted.` : 'INVALID_IMPORT; 1..500 required.' }, () => {
  const body = importBody(Array.from({ length: count }, (_, i) => studentRow(i)));
  if (count >= 1 && count <= 500) expect(validateImport(body).rows).toHaveLength(count); else expect(() => validateImport(body)).toThrow(expect.objectContaining({ errorCode: 'INVALID_IMPORT' }));
});
for (const [id, rows] of [
  ['IMP-DUP-CODE', [studentRow(), { ...studentRow(2), code: 'SE1' }]],
  ['IMP-DUP-EMAIL', [studentRow(), { ...studentRow(2), email: 'student1@example.test' }]],
  ['IMP-EMAIL', [{ ...studentRow(), email: 'invalid' }]],
  ['IMP-ACADEMIC', [{ ...studentRow(), academic: undefined }]],
] as const) imports({ id, type: 'A', title: `Reject invalid student import ${id}`, input: JSON.stringify(rows), expected: 'INVALID_IMPORT; row number included in error.' }, () => expect(() => validateImport(importBody([...rows]))).toThrow(/Row \d:/));
const enterpriseRow = { email: 'HR@EXAMPLE.TEST', fullName: 'HR Demo', name: 'Demo Enterprise' };
imports({ id: 'IMP-ENTERPRISE-AUTOCODE', role: 'OJT_COORD', title: 'Enterprise account import permits automatic code generation', input: JSON.stringify(enterpriseRow), expected: 'code empty; email normalized; no recruitment fields.' }, () => expect(validateImport({ kind: 'ENTERPRISE', idempotencyKey: 'enterprise-fixture', rows: [enterpriseRow] }).rows[0]).toMatchObject({ code: '', email: 'hr@example.test' }));
for (const [i, extra] of [{ semesterId: 1 }, { windowId: 1 }].entries()) imports({ id: `IMP-ENTERPRISE-SCOPE-${i + 1}`, type: 'A', role: 'OJT_COORD', title: `Enterprise import rejects recruitment scope ${i + 1}`, input: JSON.stringify(extra), expected: 'INVALID_IMPORT; import is independent of recruitment windows.' }, () => expect(() => validateImport({ kind: 'ENTERPRISE', idempotencyKey: 'fixture', rows: [enterpriseRow], ...extra })).toThrow());
imports({ id: 'IMP-ENTERPRISE-FIELDS', type: 'A', title: 'Enterprise import rejects unauthorized profile/recruitment fields', input: 'Enterprise row with capacity=100.', expected: 'INVALID_IMPORT.' }, () => expect(() => validateImport({ kind: 'ENTERPRISE', idempotencyKey: 'fixture', rows: [{ ...enterpriseRow, capacity: 100 }] })).toThrow());

const progress = register(test, { group: 'Student Data & Imports', source: 'backend/src/modules/students/academic-progress.ts', role: 'STUDENT / ACADEMIC' });
const program = { ProgramID: 1, ProgramCode: 'SE26', Version: 1, Status: 'PUBLISHED', TotalCredits: 6 };
const courses = [1, 2].map(id => ({ ProgramCourseID: id, CourseID: id, CourseCode: `C${id}`, CourseName: `Course ${id}`, EntryKind: 'COURSE', Credits: 3, IsRequired: true }));
const attempt = (extra = {}) => ({ id: 1, courseId: 1, status: 'PASSED', score: 8, gradePoints: 3.2, periodStartDate: '2026-01-01', attemptNumber: 1, ...extra });
const calc = (attempts: any[], extraCourses = courses, aliases: any[] = [], policy: any = { GpaScale: 10 }) => calculateProgress(program, extraCourses, attempts, aliases, [], policy);
progress({ id: 'PROGRESS-CREDITS', title: 'Count passed credits once and keep missing credits', input: 'One passed 3-credit course in a 6-credit curriculum.', expected: 'earned=3, remaining=3, gpa=8.' }, () => expect(calc([attempt()])).toMatchObject({ credits: { earned: 3, remaining: 3 }, gpa: 8 }));
progress({ id: 'PROGRESS-RETAKE', title: 'Use latest graded attempt for GPA without duplicating earned credits', input: 'Course1 score8 then score9; one course passed twice.', expected: 'earned=3; GPA9; latest result selected.' }, () => expect(calc([attempt(), attempt({ id: 2, score: 9, periodStartDate: '2026-05-01', attemptNumber: 2 })])).toMatchObject({ gpa: 9, credits: { earned: 3 } }));
progress({ id: 'PROGRESS-RECOGNIZED', title: 'Recognized course earns credits without inventing a GPA', input: 'RECOGNIZED course without a graded attempt.', expected: 'earned=3; gpa=null.' }, () => expect(calc([attempt({ status: 'RECOGNIZED' })])).toMatchObject({ gpa: null, credits: { earned: 3 } }));
progress({ id: 'PROGRESS-FAILED', type: 'A', title: 'Failed course affects GPA but earns no credit', input: 'FAILED score4, credits3.', expected: 'earned0; GPA4.' }, () => expect(calc([attempt({ status: 'FAILED', score: 4 })])).toMatchObject({ gpa: 4, credits: { earned: 0 } }));
progress({ id: 'PROGRESS-ROUNDING', type: 'B', title: 'GPA 7.305 rounds correctly to 7.31', input: 'Two equal-weight courses scored 7.30 and 7.31.', expected: 'gpa=7.31.' }, () => expect(calc([attempt({ score: 7.3 }), attempt({ id: 2, courseId: 2, score: 7.31 })]).gpa).toBe(7.31));
progress({ id: 'PROGRESS-MISSING-PROGRAM', type: 'A', title: 'Missing curriculum is reported as insufficient configuration', input: 'program undefined.', expected: 'INSUFFICIENT_CONFIGURATION; GPA null; STUDENT_PROGRAM_NOT_ASSIGNED.' }, () => expect(calculateProgress(undefined, [], [], [], [], undefined)).toMatchObject({ status: 'INSUFFICIENT_CONFIGURATION', gpa: null, issues: ['STUDENT_PROGRAM_NOT_ASSIGNED'] }));
progress({ id: 'PROGRESS-MISSING-GPA', type: 'A', title: 'Missing GPA scale does not create a guessed GPA', input: 'Passed course; no GPA policy.', expected: 'gpa null; GPA_SCALE_NOT_CONFIGURED; earned credits still3.' }, () => { const result = calculateProgress(program, courses, [attempt()], [], [], undefined); expect(result.gpa).toBeNull(); expect(result.issues).toContain('GPA_SCALE_NOT_CONFIGURED'); expect(result.credits.earned).toBe(3); });
progress({ id: 'PROGRESS-EQUIVALENT', title: 'Equivalent course achievements do not duplicate credits', input: 'Course1 aliases Course2; both passed with equal credits.', expected: 'Only one3-credit requirement completed.' }, () => expect(calc([attempt(), attempt({ id: 2, courseId: 2 })], courses, [{ SourceCourseID: 1, TargetCourseID: 2 }]).credits.earned).toBe(3));

const warning = register(test, { group: 'AI Risk & Advising', source: 'backend/src/modules/student-portal/early-warning.ts', role: 'STUDENT' });
const warningInput = { currentSemester: 2, earnedCredits: 50, completeConfiguration: true, issues: [], eligibilityStatus: 'NOT_ELIGIBLE', missingCredits: 20, failedCourseCount: 1, maxUnpassedCourses: 2 };
warning({ id: 'WARN-AVAILABLE', title: 'Early warning provides progress guidance without fabricating AI risk', input: JSON.stringify(warningInput), expected: 'PROGRESS_ONLY; isAiPrediction false; riskLevel and riskScore null; recommendations present.' }, () => expect(earlyWarning(warningInput)).toMatchObject({ available: true, status: 'PROGRESS_ONLY', isAiPrediction: false, riskLevel: null, riskScore: null, recommendations: expect.arrayContaining([expect.stringContaining('20')]) }));
for (const [i, extra, reason] of [
  [{ currentSemester: 1 }, 'BEFORE_SEMESTER_2'], [{ currentSemester: null }, 'CURRENT_SEMESTER_UNAVAILABLE'],
  [{ earnedCredits: 0 }, 'NO_EARNED_CREDITS'], [{ earnedCredits: -1 }, 'EARNED_CREDITS_UNAVAILABLE'],
  [{ completeConfiguration: false }, 'ACADEMIC_DATA_INVALID'], [{ issues: ['MISSING'] }, 'ACADEMIC_DATA_INVALID'],
  [{ eligibilityStatus: 'REVIEW_REQUIRED' }, 'ACADEMIC_DATA_INVALID'],
].map((r, i) => [i + 1, r[0], r[1]] as const)) warning({ id: `WARN-UNAVAILABLE-${i}`, type: 'A', title: `Block guidance when ${reason}`, input: JSON.stringify(extra), expected: `NOT_AVAILABLE; ${reason}; no recommendations or AI score.` }, () => { const result = earlyWarning({ ...warningInput, ...extra } as any); expect(result.available).toBe(false); expect(result.reasons).toContain(reason); expect(result.recommendations).toEqual([]); expect(result.riskScore).toBeNull(); });
warning({ id: 'WARN-SEMESTER-2', type: 'B', title: 'Early monitoring starts at semester2', input: 'currentSemester2; earnedCredits1; valid academic data.', expected: 'available true.' }, () => expect(earlyWarning({ ...warningInput, earnedCredits: 1 }).available).toBe(true));
warning({ id: 'WARN-OFFICIAL-DISCLAIMER', title: 'Current eligibility guidance retains official assessment condition', input: 'eligibilityStatus ELIGIBLE.', expected: 'Message explicitly refers to official assessment and school confirmation; no AI prediction.' }, () => { const result = earlyWarning({ ...warningInput, eligibilityStatus: 'ELIGIBLE' }); expect(result.message).toContain('Kết quả chính thức'); expect(result.isAiPrediction).toBe(false); });

const recruitment = register(test, { group: 'Enterprise & Recruitment', source: 'backend/src/modules/recruitment/round-policy.ts', role: 'ENTERPRISE / OJT_COORD' });
const round = { CampaignID: 1, Status: 'OPEN', Kind: 'SEMESTER', PeriodStatus: 'ACTIVE', AcademicPeriodID: 1, LinkedPeriodID: 1, CalendarStatus: 'ACTIVE', ResultsFinalizedAt: null,
  StartsAt: '2026-11-01T00:00:00+07:00', EndsAt: '2026-11-30T00:00:00+07:00',
  PostingStartsAt: '2026-11-01T00:00:00+07:00', PostingEndsAt: '2026-11-10T00:00:00+07:00',
  ApplicationStartsAt: '2026-11-10T00:00:00+07:00', ApplicationEndsAt: '2026-11-25T00:00:00+07:00',
  ResultsStartsAt: '2026-11-15T00:00:00+07:00', ResultsEndsAt: '2026-11-30T00:00:00+07:00', DatabaseNow: '2026-11-21T12:00:00+07:00' };
for (const [id, date, open] of [['ROUND-START', round.ApplicationStartsAt, true], ['ROUND-END', round.ApplicationEndsAt, false], ['ROUND-BEFORE', '2026-11-09T23:59:59+07:00', false]] as const) recruitment({ id, type: 'B', title: `Application interval ${id}`, input: date, expected: `phaseIsOpen=${open}; start inclusive, end exclusive.` }, () => expect(phaseIsOpen({ ...round, DatabaseNow: date }, 'APPLICATION')).toBe(open));
recruitment({ id: 'ROUND-OVERLAP', title: 'Application and result phases may overlap', input: '21Nov between both application and result dates.', expected: 'APPLICATION_AND_RESULTS.' }, () => expect(currentRoundPhase(round)).toBe('APPLICATION_AND_RESULTS'));
for (const [id, extra] of [['ROUND-CLOSED', { Status: 'CLOSED' }], ['ROUND-FINAL', { ResultsFinalizedAt: round.DatabaseNow }], ['ROUND-PERIOD', { PeriodStatus: 'ARCHIVED' }], ['ROUND-LINK', { LinkedPeriodID: 2 }]] as const) recruitment({ id, type: 'A', title: `Reject phase action ${id}`, input: JSON.stringify(extra), expected: '409 RECRUITMENT_PHASE_CLOSED.' }, () => expect(() => assertRoundPhase({ ...round, ...extra }, 'APPLICATION')).toThrow(expect.objectContaining({ errorCode: 'RECRUITMENT_PHASE_CLOSED' })));
recruitment({ id: 'ROUND-FINALIZE-BOUNDARY', type: 'B', title: 'Finalize is available at exact round end', input: 'DatabaseNow=EndsAt.', expected: 'canFinalize true.' }, () => expect(roundActions({ ...round, DatabaseNow: round.EndsAt }).canFinalize).toBe(true));
const dates = () => Object.fromEntries(Object.entries(round).filter(([key]) => /^(Posting|Application|Results).*(At)$/.test(key) && key !== 'ResultsFinalizedAt').map(([key, value]) => [key[0].toLowerCase() + key.slice(1), new Date(value as string)])) as any;
recruitment({ id: 'ROUND-SCHEDULE-VALID', title: 'Accept adjacent posting/application and overlapping result phases', source: 'backend/src/modules/recruitment/schedule-policy.ts', input: 'Posting end equals application start; results begin during applications.', expected: 'validatePhaseOrder succeeds.' }, () => expect(() => validatePhaseOrder(dates())).not.toThrow());
recruitment({ id: 'ROUND-SCHEDULE-INVALID', type: 'A', title: 'Reject results finishing before applications', source: 'backend/src/modules/recruitment/schedule-policy.ts', input: 'resultsEndsAt before applicationEndsAt.', expected: 'RECRUITMENT_PHASE_SCHEDULE_INVALID with resultsEndsAt field.' }, () => expect(() => validatePhaseOrder({ ...dates(), resultsEndsAt: new Date('2026-11-20T00:00:00+07:00') })).toThrow(expect.objectContaining({ field: 'resultsEndsAt', errorCode: 'RECRUITMENT_PHASE_SCHEDULE_INVALID' })));
recruitment({ id: 'ROUND-SCHEDULE-LOCK', title: 'Elapsed schedule markers are locked while future deadlines remain editable', source: 'backend/src/modules/recruitment/schedule-policy.ts', input: '21Nov within active round.', expected: 'Only applicationEndsAt and resultsEndsAt editable; cannot delete opened round.' }, () => expect(schedulePermissions(round)).toMatchObject({ canEditSchedule: true, canDelete: false, editableScheduleFields: ['applicationEndsAt', 'resultsEndsAt'] }));

const placement = register(test, { group: 'Placement & Tasks', source: 'backend/src/modules/qhdn/placement.policy.ts', role: 'OJT_COORD' });
for (const [i, student, context, permitted] of [
  [{ decision: 'REJECTED' }, { roundCount: 1, unfinished: 1 }, true],
  [{ decision: null }, { roundCount: 1, unfinished: 0, applicationDeadlinePassed: true }, true],
  [{ decision: null }, { roundCount: 1, unfinished: 1 }, false],
  [{ decision: 'ACCEPTED' }, { roundCount: 1, unfinished: 0 }, false],
  [{ hasAssignment: true }, { roundCount: 1, unfinished: 0 }, false],
  [{ decision: 'PENDING', source: 'QHDN_MANUAL' }, { roundCount: 1, unfinished: 0 }, false],
  [{ isActive: false }, { roundCount: 1, unfinished: 0 }, false],
].map((v, i) => [i + 1, ...v] as const)) placement({ id: `PLACE-${i}`, type: permitted ? 'N' : 'A', title: `Coordination eligibility scenario ${i}`, input: JSON.stringify({ student, context }), expected: `canCoordinate=${permitted}; blocked reason iff denied.` }, () => {
  const value = coordinationAvailability(student as any, context as any); expect(value.canCoordinate).toBe(permitted);
  if (permitted) expect(value.coordinationBlockedReason).toBeNull(); else expect(value.coordinationBlockedReason).toBeTruthy();
});

const reporting = register(test, { group: 'Evaluation & Reporting', source: 'backend/src/modules/academic-reporting/report-format.ts', role: 'ACADEMIC' });
reporting({ id: 'REPORT-CSV-UNICODE', title: 'CSV preserves Vietnamese, escapes quotes and starts with UTF-8 BOM', input: 'fullName=Nguyễn "An", courseName with comma.', expected: 'BOM; double quotes escaped; CRLF line endings; Unicode preserved.' }, () => { const output = csvReport({ items: [{ fullName: 'Nguyễn "An"', courseName: 'Môn, học' }] }); expect(output.startsWith('\uFEFF')).toBe(true); expect(output).toContain('"Nguyễn ""An"""'); expect(output).toContain('"Môn, học"'); expect(output.endsWith('\r\n')).toBe(true); });
for (const [i, value] of ['=SUM(1,2)', '+cmd', '-1+1', '@formula', '  =payload'].entries()) reporting({ id: `REPORT-CSV-INJECTION-${i + 1}`, type: 'A', title: `CSV neutralizes spreadsheet formula prefix ${i + 1}`, input: value, expected: 'Untrusted text prefixed with apostrophe inside quoted cell.' }, () => expect(csvReport({ items: [{ fullName: value }] })).toContain(`"'${value}"`));
reporting({ id: 'REPORT-DEMAND', title: 'Course demand excludes in-progress enrollments unless requested', input: 'Two missing courses; one needsEnrollment false.', expected: 'Default1 row; includeInProgress2 rows; period and student IDs retained.' }, () => {
  const data = { rows: [{ studentId: 1, missingRequiredCourses: [{ courseId: 1, needsEnrollment: true }, { courseId: 2, needsEnrollment: false }] }], scope: { ojtSemesterId: 1 }, period: { AcademicPeriodID: 2, PeriodCode: 'FALL26', Kind: 'SEMESTER' } };
  expect(demandRows(data)).toHaveLength(1); expect(demandRows(data, true)).toHaveLength(2); expect(demandRows(data)[0]).toMatchObject({ studentId: 1, academicPeriodId: 2, ojtSemesterId: 1 });
});
