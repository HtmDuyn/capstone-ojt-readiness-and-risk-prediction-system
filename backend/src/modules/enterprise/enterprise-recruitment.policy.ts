import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import { windowApi } from '../recruitment/recruitment.repository';
import type { Row } from '../qhdn/qhdn.repository';
import { currentRoundPhase } from '../recruitment/round-policy';

// A scoped student registration window represents the existing bulk OJT intake.
// Use the same semester and actual opening interval, not just Status='OPEN'.
export const activeStudentRegistration = (alias: string) => `${alias}."Status"='OPEN'
  AND ${alias}."StartsAt"<=clock_timestamp() AND ${alias}."EndsAt">clock_timestamp()`;

export const enterpriseWindowSelect = `SELECT w.*,ap."PeriodCode",ap."Name" AS "PeriodName",
  ap."Kind",ap."Status" AS "PeriodStatus",o."AcademicPeriodID" AS "LinkedPeriodID",clock_timestamp() AS "DatabaseNow",
  (SELECT jsonb_build_object('id',rw."WindowID",'name',rw."Name",'startsAt',rw."StartsAt",'endsAt',rw."EndsAt")
   FROM "OJTRegistrationWindows" rw WHERE rw."OJTSemesterID"=w."OJTSemesterID" AND ${activeStudentRegistration('rw')}
   ORDER BY rw."EndsAt" DESC,rw."WindowID" DESC LIMIT 1) AS "StudentRegistrationWindow"
  FROM "RecruitmentWindows" w JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"
  JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID"`;

export function enterpriseWindowApi(w: Row) {
  const window = windowApi(w);
  if(w.CampaignID){
    const posting=currentRoundPhase(w)==='OPEN';
    return {...window,accepting:posting,canCreate:posting,canEdit:posting,postingDeadlineAt:w.EndsAt,
      deadlineManagedBy:'QHDN',studentRegistrationWindow:null,editLockCode:posting?null:'RECRUITMENT_PHASE_CLOSED'};
  }
  const accepting = window.accepting && w.Kind === 'SEMESTER' && w.LinkedPeriodID === w.AcademicPeriodID;
  return {...window,accepting,canCreate:accepting,canEdit:accepting && !w.StudentRegistrationWindow,
    postingDeadlineAt:w.EndsAt,deadlineManagedBy:'QHDN',
    studentRegistrationWindow:w.StudentRegistrationWindow ?? null,
    editLockCode:w.StudentRegistrationWindow ? 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION' : null};
}

export async function assertNoStudentRegistration(c: PoolClient, semesterId: number) {
  // Caller holds academic-calendar, the same transaction lock used when QHDN
  // opens/closes OJT registration windows. Registration opening cannot race this check.
  const active = (await c.query(`SELECT rw."WindowID" FROM "OJTRegistrationWindows" rw
    WHERE rw."OJTSemesterID"=$1 AND ${activeStudentRegistration('rw')} LIMIT 1`,[semesterId])).rows[0];
  if (active) throw invalid('Đợt đăng ký OJT của sinh viên đang mở. Không được chỉnh sửa tin tuyển dụng trong thời gian này.',409,'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION');
}

export async function recruitmentDeadline(c: PoolClient, w: Row, before: Row | null) {
  if(w.CampaignID)return w.EndsAt;
  // Existing deadlines belong to QHDN. Do not validate them against the separate
  // enterprise intake deadline or rewrite them during content/position changes.
  if (before) return before.DeadlineAt;
  // QHDN's student application period controls application expiry. Before one
  // is configured, use the linked semester's end so a newly published vacancy is visible.
  const deadline = (await c.query('SELECT public."EnterpriseRecruitmentDeadline"($1) AS deadline',[w.OJTSemesterID])).rows[0].deadline;
  if (!deadline || deadline <= new Date(w.DatabaseNow)) throw invalid('Học kỳ không còn thời hạn tuyển dụng khả dụng.',409,'RECRUITMENT_PERIOD_UNAVAILABLE');
  return deadline;
}
