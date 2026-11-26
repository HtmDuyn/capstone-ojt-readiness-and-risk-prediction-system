import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { academicTransaction } from '../academic/academic.repository';
import { loadAcademicProgress, progressFromData } from '../students/academic-progress';
import { evaluateEligibility } from './eligibility.service';
import { saveOjtEligibilityResults } from './frontend-results.service';
import { ojtAssessmentCondition } from './ojt-policy.service';

type Milestone = 'BLOCK10' | 'BLOCK3' | 'SEMESTER';
type Period = { id: number; end: string; block10End: string | null; block3End: string | null; completed: Milestone[] };
type Condition = { ConditionID: number | null; Version: number; MinCredits: string | number; IssuingDocument: string | null; CreatedBy?: number | null; IsDefault?: boolean; MaxUnpassedCourses?: number | null };
type AssessmentSource = 'AUTOMATIC' | 'IMPORT' | 'MANUAL';
export type OjtAssessmentSummary = {
  checkedCount: number;
  savedCount: number;
  eligibleCount: number;
  notEligibleCount: number;
  reviewRequiredCount: number;
  assignedCount: number;
  waitingCount: number;
  excludedPassedOjt202Count: number;
};

const endOfDay = (date: string) => Date.parse(date + 'T00:00:00+07:00') + 86_400_000;

export async function nextOjtAssessment(client?: PoolClient) {
  const read = client ? client.query.bind(client) : query;
  const { rows: periods } = await read<Period>(`
    SELECT p."AcademicPeriodID" AS id, to_char(p."EndDate",'YYYY-MM-DD') AS end,
      to_char(p."Block10EndDate",'YYYY-MM-DD') AS "block10End", to_char(block."EndDate",'YYYY-MM-DD') AS "block3End",
      ARRAY(SELECT a."Milestone" FROM "OJTAutomaticAssessments" a WHERE a."AcademicPeriodID"=p."AcademicPeriodID") AS completed
    FROM "AcademicPeriods" p
    LEFT JOIN "AcademicPeriods" block ON block."ParentPeriodID"=p."AcademicPeriodID" AND block."Kind"='BLOCK3'
      AND block."Status"<>'ARCHIVED'
    WHERE p."Kind"='SEMESTER' AND p."Status"<>'ARCHIVED' AND EXISTS (
      SELECT 1 FROM "StudentAcademicPlacements" placement
      JOIN "AcademicPeriods" current_period ON current_period."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
      JOIN "Students" s ON s."StudentID"=placement."StudentID"
      JOIN "Users" u USING ("UserID")
      WHERE COALESCE(current_period."ParentPeriodID",current_period."AcademicPeriodID")=p."AcademicPeriodID"
        AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
    )`);
  const milestones = periods.flatMap(period => {
    const milestones: { milestone: Milestone; date: string | null }[] = [
      { milestone: 'BLOCK10', date: period.block10End },
      { milestone: 'BLOCK3', date: period.block3End },
      { milestone: 'SEMESTER', date: period.end },
    ];
    return milestones.flatMap(({ milestone, date }) => date && date <= period.end && !period.completed.includes(milestone)
      ? [{ periodId: period.id, milestone, dueAt: endOfDay(date) }] : []);
  }).sort((a, b) => a.dueAt - b.dueAt || a.periodId - b.periodId);
  return milestones[0] ?? null;
}

export async function processDueOjtAssessment(calendarLock: 'try' | 'wait' = 'try') {
  return academicTransaction(async client => {
    const { rows: [clock] } = await client.query('SELECT clock_timestamp() AS now');
    const now = new Date(clock.now).getTime();
    const next = await nextOjtAssessment(client);
    if (!next || next.dueAt > now) return false;

    const condition = await ojtAssessmentCondition(client);
    const { rows: [actor] } = await client.query(`
      SELECT u."UserID" FROM "Users" u JOIN "Roles" r USING ("RoleID")
      WHERE u."Status"='ACTIVE' AND r."RoleCode" IN ('ACADEMIC','ADMIN')
      ORDER BY (u."UserID"=$1) DESC, (r."RoleCode"='ACADEMIC') DESC, u."UserID" LIMIT 1`, [condition.CreatedBy]);
    if (!actor) return false;

    const { periodId, milestone, dueAt } = next;
    await assessOjtStudents(client, condition, actor.UserID,
      `auto-ojt:${periodId}:${milestone}:${condition.Version}`, 'AUTOMATIC');
    await client.query(`INSERT INTO "OJTAutomaticAssessments" ("AcademicPeriodID","Milestone","DueAt","ConditionID")
      VALUES ($1,$2,$3,$4)`, [periodId, milestone, new Date(dueAt), condition.ConditionID]);
    return true;
  }, undefined, calendarLock);
}

export async function runManualOjtAssessment(actorId: number): Promise<OjtAssessmentSummary> {
  return academicTransaction(async client => {
    const condition = await ojtAssessmentCondition(client);
    return assessOjtStudents(client, condition, actorId, `manual-ojt:${randomUUID()}`, 'MANUAL');
  });
}

export async function assessOjtStudents(
  client: PoolClient,
  condition: Condition,
  actorId: number,
  batchKey: string,
  source: AssessmentSource,
): Promise<OjtAssessmentSummary> {
  // Serialize every entry point so import, cron, and manual runs cannot overwrite
  // each other's result snapshots while reading the same academic history.
  await client.query("SELECT pg_advisory_xact_lock(hashtext('ojt-eligibility-assessment'))");

  const excludedPassedOjt202Count = Number((await client.query(`SELECT count(*)::int AS count
    FROM "Students" s JOIN "Users" u USING ("UserID")
    WHERE s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
      AND EXISTS (SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
        WHERE grade."StudentID"=s."StudentID" AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED')`)).rows[0].count);
  const passedReason = 'Đã đạt môn OJT202 nên không còn thuộc danh sách xét đợt OJT.';
  const rule = condition.IsDefault
    ? { version: 0, minCredits: 70, defaultRule: true }
    : { id: condition.ConditionID, conditionId: condition.ConditionID, version: condition.Version,
      minCredits: Number(condition.MinCredits), issuingDocument: condition.IssuingDocument };
  await client.query(`UPDATE "StudentOJTCalculatedResults" saved
    SET "Status"='NOT_ELIGIBLE',"ProgramID"=s."ProgramID","ConditionID"=$2,
      "CheckedAt"=clock_timestamp(),"SavedAt"=clock_timestamp(),"SavedBy"=$3,
      "Result"=jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(COALESCE(saved."Result",'{}'::jsonb),'{status}','"NOT_ELIGIBLE"'::jsonb,true),
              '{checkedAt}',to_jsonb(clock_timestamp()),true),
            '{rule}',$4::jsonb,true),
          '{source}','"BACKEND"'::jsonb,true),
        '{reasons}',
        CASE WHEN COALESCE(saved."Result"->'reasons','[]'::jsonb) @> jsonb_build_array($1::text)
          THEN COALESCE(saved."Result"->'reasons','[]'::jsonb)
          ELSE COALESCE(saved."Result"->'reasons','[]'::jsonb) || jsonb_build_array($1::text) END,
        true
      )
    FROM "Students" s WHERE s."StudentID"=saved."StudentID" AND EXISTS (
      SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
      WHERE grade."StudentID"=saved."StudentID"
        AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED'
    )`, [passedReason, condition.ConditionID, actorId, JSON.stringify(rule)]);

  const { rows: students } = await client.query(`
    SELECT s."StudentID",s."Status",u."Status" AS "AccountStatus"
    FROM "Students" s JOIN "Users" u USING ("UserID")
    WHERE s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
      AND NOT EXISTS (
        SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
        WHERE grade."StudentID"=s."StudentID"
          AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED'
      )
    ORDER BY s."StudentID" FOR UPDATE OF s`);

  const summary: OjtAssessmentSummary = {
    checkedCount: students.length, savedCount: 0, eligibleCount: 0, notEligibleCount: 0,
    reviewRequiredCount: 0, assignedCount: 0, waitingCount: 0, excludedPassedOjt202Count,
  };
  const ruleSnapshot = condition.IsDefault
    ? { version: 0, minCredits: 70, defaultRule: true }
    : { conditionId: condition.ConditionID!, version: condition.Version,
      minCredits: Number(condition.MinCredits), issuingDocument: condition.IssuingDocument };

  for (let offset = 0; offset < students.length; offset += 10000) {
    const results = [];
    for (const student of students.slice(offset, offset + 10000)) {
      const progress = await loadAcademicProgress(client, student.StudentID);
      const decision = evaluateEligibility({
        student, semester: { OJTSemesterID: null }, rule: { ...condition, MaxUnpassedCourses: null },
        progress: progressFromData(progress), attempts: progress.attempts, aliases: progress.aliases,
      });
      results.push({
        studentId: student.StudentID,
        status: decision.status,
        earnedCredits: decision.earnedCredits,
        unpassedCourseCount: decision.unpassedCourseCount,
        reasons: decision.reasons.map((reason: string) => reason === 'MIN_CREDITS_NOT_MET'
          ? `Còn thiếu ${decision.missingCredits} tín chỉ so với mức ${rule.minCredits}.`
          : reason === 'MAX_UNPASSED_COURSES_EXCEEDED'
            ? `Số môn chưa đạt (${decision.unpassedCourseCount}) vượt quá giới hạn ${condition.MaxUnpassedCourses}.`
            : reason === 'STUDENT_NOT_ACTIVE' ? 'Sinh viên hoặc tài khoản không hoạt động.' : reason),
        academicIssues: decision.academicIssues,
        checkedAt: new Date().toISOString(),
      });
    }

    if (!results.length) continue;
    const saved = await saveOjtEligibilityResults({
      source: 'BACKEND', idempotencyKey: `${batchKey}:${offset}`, rule: ruleSnapshot, results,
    }, actorId, client, source);
    summary.savedCount += saved.savedCount;
    summary.eligibleCount += saved.eligibleCount;
    summary.assignedCount += saved.assignedCount;
    summary.waitingCount += saved.waitingCount;
    summary.notEligibleCount += results.filter(result => result.status === 'NOT_ELIGIBLE').length;
    summary.reviewRequiredCount += results.filter(result => result.status === 'REVIEW_REQUIRED').length;
  }

  return summary;
}
