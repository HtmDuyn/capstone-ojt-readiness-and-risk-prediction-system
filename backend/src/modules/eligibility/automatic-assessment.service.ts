import { academicTransaction } from '../academic/academic.repository';
import { loadAcademicProgress, progressFromData } from '../students/academic-progress';
import { evaluateEligibility } from './eligibility.service';
import { saveFrontendResults } from './frontend-results.service';
import { latestEffectiveOjtCondition } from './ojt-policy.service';

type Milestone = 'BLOCK10' | 'BLOCK3' | 'SEMESTER';
type Period = { id: number; end: string; block10End: string | null; block3End: string | null; completed: Milestone[] };
const endOfDay = (date: string) => Date.parse(date + 'T00:00:00+07:00') + 86_400_000;

export async function processDueOjtAssessment() {
  return academicTransaction(async client => {
    const { rows: [clock] } = await client.query('SELECT clock_timestamp() AS now');
    const now = new Date(clock.now).getTime();
    const { rows: periods } = await client.query<Period>(`
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
    const due = periods.flatMap(period => {
      const milestones: { milestone: Milestone; date: string | null }[] = [
        { milestone: 'BLOCK10', date: period.block10End },
        { milestone: 'BLOCK3', date: period.block3End },
        { milestone: 'SEMESTER', date: period.end },
      ];
      return milestones.flatMap(({ milestone, date }) => date && date <= period.end && !period.completed.includes(milestone)
        ? [{ periodId: period.id, milestone, dueAt: endOfDay(date) }] : []);
    }).filter(item => item.dueAt <= now)
      .sort((a, b) => a.dueAt - b.dueAt || a.periodId - b.periodId);
    if (!due.length) return false;

    const condition = await latestEffectiveOjtCondition(client);
    if (!condition) return false;
    const { rows: [actor] } = await client.query(`
      SELECT u."UserID" FROM "Users" u JOIN "Roles" r USING ("RoleID")
      WHERE u."Status"='ACTIVE' AND r."RoleCode" IN ('ACADEMIC','ADMIN')
      ORDER BY (u."UserID"=$1) DESC, (r."RoleCode"='ACADEMIC') DESC, u."UserID" LIMIT 1`, [condition.CreatedBy]);
    if (!actor) return false;

    const { periodId, milestone, dueAt } = due[0];
    const { rows: students } = await client.query(`
      SELECT s."StudentID",s."Status",u."Status" AS "AccountStatus"
      FROM "StudentAcademicPlacements" placement JOIN "Students" s USING ("StudentID")
      JOIN "Users" u USING ("UserID")
      JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
      WHERE COALESCE(p."ParentPeriodID",p."AcademicPeriodID")=$1
        AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
        AND NOT EXISTS (SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=s."StudentID")
      ORDER BY s."StudentID" FOR UPDATE OF s FOR SHARE OF u`, [periodId]);
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
        source: 'FRONTEND', idempotencyKey: `auto-ojt:${periodId}:${milestone}:${offset}`, rule, results,
      }, actor.UserID, client);
    }
    await client.query(`INSERT INTO "OJTAutomaticAssessments" ("AcademicPeriodID","Milestone","DueAt","ConditionID")
      VALUES ($1,$2,$3,$4)`, [periodId, milestone, new Date(dueAt), condition.ConditionID]);
    return true;
  }, undefined, 'try');
}
