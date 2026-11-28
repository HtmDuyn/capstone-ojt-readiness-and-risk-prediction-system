import type { PoolClient } from 'pg';
import { studentAdmission } from '../student-portal/admission.service';
import { assertOjtPathway } from '../academic/workflow-policy';
import { assertRoundPhase } from '../recruitment/round-policy';
import { invalid } from './student.validation';
import type { Row } from '../ojt-registration/window.service';

export const applicationBlockerMessages: Record<string, string> = {
  ELIGIBLE_HANDOFF_REQUIRED: 'Chưa có kết quả đủ điều kiện OJT.',
  CONFIRMED_ELIGIBILITY_REQUIRED: 'Chưa có kết quả đủ điều kiện OJT hiện hành.',
  ELIGIBILITY_HANDOFF_STALE: 'Kết quả xét điều kiện OJT đã cũ, cần được rà soát lại.',
  OJT_ALREADY_GRADED: 'Bạn đã có điểm OJT nên không thể nộp hồ sơ ứng tuyển mới.',
  OJT202_ALREADY_PASSED: 'Bạn đã pass OJT nên không thể đăng ký thực tập lại.',
  OJT_MINIMUM_SEMESTER_REQUIRED: 'Chỉ được đăng ký OJT từ kỳ chuyên ngành 6 trở lên.',
  ACTUAL_PATHWAY_REQUIRED: 'Chưa có lộ trình học phù hợp với kỳ OJT đã chọn.',
  OJT_PERIOD_REQUIRED: 'Kỳ OJT chưa được liên kết với học kỳ phù hợp.',
  APPLICATION_ALREADY_IN_PROCESS: 'Bạn đang có một hồ sơ chờ doanh nghiệp xác nhận. Chỉ được nộp tiếp sau khi hồ sơ bị từ chối.',
  APPLICATION_POSITION_ALREADY_SUBMITTED: 'Bạn đã ứng tuyển vị trí này trong tin này. Hãy chọn vị trí khác, có thể trong cùng tin và cùng doanh nghiệp nếu còn hạn.',
  STUDENT_ALREADY_CONFIRMED: 'Bạn đã được doanh nghiệp nhận trong kỳ OJT này, không thể nộp thêm hồ sơ.',
  ASSIGNMENT_EXISTS: 'Bạn đã được phân công thực tập trong kỳ OJT này.',
  OJT_REGISTRATION_WINDOW_UNAVAILABLE: 'Đợt chưa mở hoặc đã hết hạn sinh viên nộp hồ sơ.',
  RECRUITMENT_PHASE_CLOSED: 'Chưa đến hoặc đã hết hạn sinh viên nộp hồ sơ.',
  RECRUITMENT_WINDOW_CLOSED: 'Đợt tuyển dụng chưa mở hoặc đã chốt.',
  RECRUITMENT_PERIOD_UNAVAILABLE: 'Học kỳ tuyển dụng đã đóng hoặc không còn phù hợp.',
};

export function throwApplicationBlocker(code: string): never {
  throw invalid(applicationBlockerMessages[code] || 'Hồ sơ chưa đáp ứng điều kiện ứng tuyển.', 409, code);
}

// Use the same academic checks before enabling an application and before saving it.
export async function applicationAcademicEligibility(c: PoolClient, studentId: number, semesterId: number, lockSource = false) {
  const outcome = (await c.query(`SELECT
    (EXISTS(SELECT 1 FROM "StudentCourseResults" g JOIN "Courses" course USING("CourseID")
      WHERE g."StudentID"=$1 AND upper(btrim(course."CourseCode"))='OJT202' AND g."Status"='PASSED')
     OR EXISTS(SELECT 1 FROM "OJTResults" r WHERE r."StudentID"=$1 AND r."Outcome"='PASSED')) AS "hasPassedOjt",
    (EXISTS(SELECT 1 FROM "StudentCourseResults" g JOIN "Courses" course USING("CourseID")
      WHERE g."StudentID"=$1 AND upper(btrim(course."CourseCode"))='OJT202' AND g."Score" IS NOT NULL)
     OR EXISTS(SELECT 1 FROM "OJTResults" r WHERE r."StudentID"=$1 AND r."OfficialScore" IS NOT NULL)
     OR EXISTS(SELECT 1 FROM "InternshipEvaluations" e JOIN "InternshipAssignments" a USING("AssignmentID")
       WHERE a."StudentID"=$1 AND (e."OverallScore" IS NOT NULL OR e."CompletionScore" IS NOT NULL
         OR e."SkillScore" IS NOT NULL OR e."AttitudeScore" IS NOT NULL
         OR EXISTS(SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(e."ScoreDetails")='object' THEN e."ScoreDetails" ELSE '{}'::jsonb END) score
           WHERE jsonb_typeof(score.value)='number')))) AS "hasOjtScore"`, [studentId])).rows[0];
  const blockers: string[] = [];
  if (outcome.hasPassedOjt) blockers.push('OJT202_ALREADY_PASSED');
  if (outcome.hasOjtScore) blockers.push('OJT_ALREADY_GRADED');
  const admission = await studentAdmission(c, studentId, semesterId, { lockSource });
  if (!admission) blockers.push('ELIGIBLE_HANDOFF_REQUIRED');
  else if (admission.isStale || admission.status !== 'ELIGIBLE')
    blockers.push(admission.isStale ? 'ELIGIBILITY_HANDOFF_STALE' : 'CONFIRMED_ELIGIBILITY_REQUIRED');
  let pathway: Row | null = null;
  try { pathway = await assertOjtPathway(c, studentId, semesterId); }
  catch (error: any) {
    if (error.statusCode >= 400 && error.statusCode < 500) blockers.push(error.errorCode || 'ACTUAL_PATHWAY_REQUIRED');
    else throw error;
  }
  return { admission, pathway, blockers };
}

export async function applicationProgressBlockers(c: PoolClient, studentId: number, semesterId: number) {
  const state = (await c.query(`SELECT
    EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r USING("RegistrationID")
      WHERE r."StudentID"=$1 AND co."OJTSemesterID"=$2 AND co."Decision"='ACCEPTED') AS "hasAcceptedApplication",
    EXISTS(SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID")
      WHERE a."StudentID"=$1 AND co."OJTSemesterID"=$2 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS "hasAssignment",
    (EXISTS(SELECT 1 FROM "JobApplications" app JOIN "OJTRegistrations" r USING("RegistrationID")
      WHERE r."StudentID"=$1 AND app."OJTSemesterID"=$2 AND app."Status"<>'REJECTED')
     OR EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r USING("RegistrationID")
      WHERE r."StudentID"=$1 AND co."OJTSemesterID"=$2 AND COALESCE(co."Decision",'PENDING')<>'REJECTED')) AS "hasPendingApplication"`, [studentId, semesterId])).rows[0];
  if (state.hasAcceptedApplication) return ['STUDENT_ALREADY_CONFIRMED'];
  if (state.hasAssignment) return ['ASSIGNMENT_EXISTS'];
  return state.hasPendingApplication ? ['APPLICATION_ALREADY_IN_PROCESS'] : [];
}

export async function applicationRoundBlockers(c: PoolClient, roundId: number | null | undefined) {
  if (!roundId) return [];
  const round = (await c.query(`SELECT w.*,ap."Kind",ap."Status" AS "PeriodStatus",o."AcademicPeriodID" AS "LinkedPeriodID",
    clock_timestamp() AS "DatabaseNow" FROM "RecruitmentWindows" w
    JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"
    JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID" WHERE w."WindowID"=$1`, [roundId])).rows[0];
  if (!round) return ['RECRUITMENT_WINDOW_CLOSED'];
  try { assertRoundPhase(round, 'APPLICATION'); return []; }
  catch (error: any) {
    if (error.statusCode >= 400 && error.statusCode < 500) return [error.errorCode || 'RECRUITMENT_PHASE_CLOSED'];
    throw error;
  }
}
