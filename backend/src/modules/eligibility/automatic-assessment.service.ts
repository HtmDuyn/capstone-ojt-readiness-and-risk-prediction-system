import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { academicTransaction } from '../academic/academic.repository';
import { loadAcademicProgress, progressFromData } from '../students/academic-progress';
import { evaluateEligibility } from './eligibility.service';
import { saveFrontendResults } from './frontend-results.service';
import { latestEffectiveOjtCondition } from './ojt-policy.service';

type Milestone = 'BLOCK10' | 'BLOCK3' | 'SEMESTER';
type Period = { id: number; end: string; block10End: string | null; block3End: string | null; completed: Milestone[] };
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
  })
    .sort((a, b) => a.dueAt - b.dueAt || a.periodId - b.periodId);
  return milestones[0] ?? null;
}

export async function processDueOjtAssessment(calendarLock: 'try' | 'wait' = 'try') {
  return academicTransaction(async client => {
    const { rows: [clock] } = await client.query('SELECT clock_timestamp() AS now');
    const now = new Date(clock.now).getTime();
    const next = await nextOjtAssessment(client);
    if (!next || next.dueAt > now) return false;

    const condition = await latestEffectiveOjtCondition(client);
    if (!condition) return false;
    const { rows: [actor] } = await client.query(`
      SELECT u."UserID" FROM "Users" u JOIN "Roles" r USING ("RoleID")
      WHERE u."Status"='ACTIVE' AND r."RoleCode" IN ('ACADEMIC','ADMIN')
      ORDER BY (u."UserID"=$1) DESC, (r."RoleCode"='ACADEMIC') DESC, u."UserID" LIMIT 1`, [condition.CreatedBy]);
    if (!actor) return false;

    const { periodId, milestone, dueAt } = next;
    await assessOjtStudents(client, { periodId }, condition, actor.UserID, `auto-ojt:${periodId}:${milestone}`);
    await client.query(`INSERT INTO "OJTAutomaticAssessments" ("AcademicPeriodID","Milestone","DueAt","ConditionID")
      VALUES ($1,$2,$3,$4)`, [periodId, milestone, new Date(dueAt), condition.ConditionID]);
    return true;
  }, undefined, calendarLock);
}

export async function assessOjtStudents(
  client: PoolClient,
  scope: { studentIds: number[] } | { periodId: number },
  condition: { ConditionID: number; Version: number; MinCredits: string | number; IssuingDocument: string },
  actorId: number,
  batchKey: string,
) {
  const { rows: students } = await client.query(`
    SELECT s."StudentID",s."Status",u."Status" AS "AccountStatus"
    FROM "Students" s
    JOIN "Users" u USING ("UserID")
    WHERE (${'studentIds' in scope
      ? 's."StudentID"=ANY($1::int[])'
      : `EXISTS (SELECT 1 FROM "StudentAcademicPlacements" placement
        JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
        WHERE placement."StudentID"=s."StudentID" AND COALESCE(p."ParentPeriodID",p."AcademicPeriodID")=$1)`})
      AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
      AND NOT EXISTS (SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=s."StudentID")
      AND NOT EXISTS (SELECT 1 FROM "StudentOJTCalculatedResults" saved
        WHERE saved."StudentID"=s."StudentID" AND saved."Status"='ELIGIBLE')
    ORDER BY s."StudentID" FOR UPDATE OF s FOR SHARE OF u`, ['studentIds' in scope ? scope.studentIds : scope.periodId]);
  const rule = {
    conditionId: condition.ConditionID, version: condition.Version,
    minCredits: Number(condition.MinCredits), issuingDocument: condition.IssuingDocument,
  };
  for (let offset = 0; offset < students.length; offset += 10000) {
    const results = [];
    for (const student of students.slice(offset, offset + 10000)) {
      const source = await loadAcademicProgress(client, student.StudentID);
      const decision = evaluateEligibility({
        student, semester: { OJTSemesterID: null }, rule: condition,
        progress: progressFromData(source), attempts: source.attempts, aliases: source.aliases,
      });
      results.push({
        studentId: student.StudentID, status: decision.status, earnedCredits: decision.earnedCredits,
        unpassedCourseCount: decision.unpassedCourseCount, reasons: decision.missingCredits && decision.missingCredits > 0
          ? [`Còn thiếu ${decision.missingCredits} tín chỉ so với mức ${rule.minCredits}.`] : [],
        academicIssues: [], checkedAt: new Date().toISOString(),
      });
    }
    await saveFrontendResults({
      source: 'FRONTEND', idempotencyKey: `${batchKey}:${offset}`, rule, results,
    }, actorId, client);
  }
  return students.length;
}
