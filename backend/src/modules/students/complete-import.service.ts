import type { PoolClient } from 'pg';
import { assignPlacementWithClient } from '../academic/academic.service';
import { audit } from '../academic/academic.repository';
import { inputObject, positiveId, requiredText, optionalText, enumValue, resultValues, invalid } from './student.validation';

// Profile and history share the provisioning transaction; one invalid row rolls back everything.
export async function importAcademicProfile(c: PoolClient, studentId: number, raw: unknown, actorId: number) {
  const b = inputObject(raw, ['programId','phone','status','placement','courseResults']);
  const programId = positiveId(b.programId, 'programId');
  const placement = inputObject(b.placement, ['cohortId','groupCode','entryAcademicPeriodId']);
  positiveId(placement.cohortId, 'cohortId');
  if (!Array.isArray(b.courseResults) || b.courseResults.length > 1000) throw invalid('courseResults must be an array of at most 1000 results.');
  const student = (await c.query('SELECT * FROM "Students" WHERE "StudentID"=$1 AND "DeletedAt" IS NULL FOR UPDATE', [studentId])).rows[0];
  if (!student) throw invalid('Student not found or deleted.', 409);
  const placementForAssignment: Record<string, unknown> = { ...placement, programId, reason:'Complete student import' };
  const existingPlacement = (await c.query('SELECT "CurrentAcademicPeriodID" FROM "StudentAcademicPlacements" WHERE "StudentID"=$1', [studentId])).rows[0];
  if (placementForAssignment.currentAcademicPeriodId == null && existingPlacement?.CurrentAcademicPeriodID != null)
    placementForAssignment.currentAcademicPeriodId = existingPlacement.CurrentAcademicPeriodID;
  if (placementForAssignment.currentAcademicPeriodId == null) {
    const currentPeriod = (await c.query(`SELECT "AcademicPeriodID" FROM "AcademicPeriods"
      WHERE "Kind"='SEMESTER' AND "Status" NOT IN ('CLOSED','ARCHIVED')
        AND "StartDate"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
        AND "EndDate">=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY "StartDate" DESC,"AcademicPeriodID" DESC LIMIT 1`)).rows[0];
    if (!currentPeriod) throw invalid('No current semester is configured in the academic calendar.');
    placementForAssignment.currentAcademicPeriodId = currentPeriod.AcademicPeriodID;
  }
  await assignPlacementWithClient(c, studentId, placementForAssignment, actorId);
  if (b.phone !== undefined) await c.query('UPDATE "Users" SET "Phone"=$2,"UpdatedAt"=now() WHERE "UserID"=$1', [student.UserID, optionalText(b.phone,'phone',20)]);
  if (b.status !== undefined) await c.query('UPDATE "Students" SET "Status"=$2 WHERE "StudentID"=$1', [studentId, enumValue(b.status,['ACTIVE','INACTIVE','SUSPENDED','GRADUATED','DROPPED_OUT'],'status')]);
  const seen = new Set<string>();
  const results = b.courseResults.map(rawResult => {
    const r = inputObject(rawResult, ['courseCode','academicPeriodId','attemptNumber','status','score','grade','gradePoints','sourceReference']);
    const code = requiredText(r.courseCode,'courseCode',20).toUpperCase();
    const periodId = positiveId(r.academicPeriodId,'academicPeriodId'), attempt = positiveId(r.attemptNumber ?? 1,'attemptNumber');
    if (attempt > 100) throw invalid('attemptNumber must not exceed 100.');
    const key = `${code}:${attempt}`;
    if (seen.has(key)) throw invalid('Duplicate course/attempt in student history.');
    seen.add(key);
    return { code, periodId, attempt, key, values: resultValues(r) };
  });

  // Resolve workbook codes directly against the catalog in batches. Imported
  // periods are authoritative; do not derive a curriculum stage or validate
  // whether a course belongs in that stage.
  const courseCodes = [...new Set(results.map(result => result.code))];
  const courseRows = courseCodes.length
    ? (await c.query('SELECT "CourseID",upper(btrim("CourseCode")) AS "CourseCode" FROM "Courses" WHERE upper(btrim("CourseCode"))=ANY($1::text[])', [courseCodes])).rows
    : [];
  const courseIds = new Map<string, number>();
  for (const row of courseRows) {
    const code = String(row.CourseCode).trim().toUpperCase();
    const currentId = courseIds.get(code);
    if (currentId !== undefined && currentId !== Number(row.CourseID))
      throw invalid(`Course code is ambiguous after case-insensitive matching: ${code}.`);
    courseIds.set(code, Number(row.CourseID));
  }
  for (const code of courseCodes) if (!courseIds.has(code)) throw invalid(`Unknown courseCode: ${code}.`);

  const periodIds = [...new Set(results.map(result => result.periodId))];
  const periodRows = periodIds.length
    ? (await c.query(`SELECT "AcademicPeriodID","AcademicYearID" FROM "AcademicPeriods"
        WHERE "AcademicPeriodID"=ANY($1::int[])`, [periodIds])).rows
    : [];
  const periods = new Map(periodRows.map(row => [Number(row.AcademicPeriodID), row]));
  for (const id of periodIds) {
    const period = periods.get(id);
    if (!period) throw invalid('Academic period not found.');
  }

  const existingRows = courseRows.length && periodIds.length
    ? (await c.query(`SELECT * FROM "StudentCourseResults"
        WHERE "StudentID"=$1 AND "CourseID"=ANY($2::int[])
          AND "AttemptNumber"=ANY($3::int[])`, [studentId, courseRows.map(row => row.CourseID),
        [...new Set(results.map(result => result.attempt))]])).rows
    : [];
  const existing = new Map(existingRows.map(row =>
    [`${row.CourseID}:${row.AttemptNumber}`, row]));

  const newResults: typeof results = [];
  for (const { code, periodId, attempt, values } of results) {
    const courseId = courseIds.get(code)!;
    const period = periods.get(periodId)!;
    const old = existing.get(`${courseId}:${attempt}`);
    if (old) {
      const previous = {status:old.Status,score:old.Score===null?null:Number(old.Score),gradePoints:old.GradePoints===null?null:Number(old.GradePoints),grade:old.Grade,sourceReference:old.SourceReference};
      const periodChanged = Number(old.AcademicPeriodID) !== periodId;
      if (periodChanged || JSON.stringify(previous)!==JSON.stringify(values)) {
        if (old.OJTResultID) throw invalid('Official OJT results must be corrected through the OJT result workflow.',409,'OFFICIAL_OJT_GRADE_IMMUTABLE');
        const updated=(await c.query(`UPDATE "StudentCourseResults" SET "AcademicPeriodID"=$2,"AcademicYearID"=$3,"SemesterTaken"=NULL,"Status"=$4,"Score"=$5,"GradePoints"=$6,"Grade"=$7,"SourceReference"=$8,"RecordedBy"=$9,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[old.ResultID,periodId,period.AcademicYearID,values.status,values.score,values.gradePoints,values.grade,values.sourceReference,actorId])).rows[0];
        await audit(c,actorId,'StudentCourseResults',old.ResultID,'IMPORT_UPDATE_RESULT',old,updated,'Overwrite an existing course attempt from the student import file.');
      }
      continue;
    }
    newResults.push({ code, periodId, attempt, key: `${courseId}:${periodId}:${attempt}`, values });
  }

  if (newResults.length) {
    const insertAuditCount = Number((await c.query(`
      WITH inserted AS (
        INSERT INTO "StudentCourseResults"
          ("StudentID","CourseID","AcademicPeriodID","AttemptNumber","Status","Score","GradePoints","Grade","SourceReference","AcademicYearID","SemesterTaken","RecordedBy")
        SELECT $1,item."CourseID",item."AcademicPeriodID",item."AttemptNumber",item."Status",item."Score",item."GradePoints",item."Grade",item."SourceReference",item."AcademicYearID",NULL,$12
        FROM unnest($2::int[],$3::int[],$4::int[],$5::text[],$6::numeric[],$7::numeric[],$8::text[],$9::text[],$10::int[],$11::int[])
          AS item("CourseID","AcademicPeriodID","AttemptNumber","Status","Score","GradePoints","Grade","SourceReference","AcademicYearID","SemesterTaken")
        RETURNING *
      ), logged AS (
        INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail")
        SELECT $12,'IMPORT_RESULT','StudentCourseResults',inserted."ResultID",
          jsonb_build_object('before',NULL,'after',to_jsonb(inserted),'reason',NULL)
        FROM inserted RETURNING "EntityID"
      ) SELECT count(*)::int AS count FROM logged`, [
      studentId,
      newResults.map(result => courseIds.get(result.code)!),
      newResults.map(result => result.periodId),
      newResults.map(result => result.attempt),
      newResults.map(result => result.values.status),
      newResults.map(result => result.values.score),
      newResults.map(result => result.values.gradePoints),
      newResults.map(result => result.values.grade),
      newResults.map(result => result.values.sourceReference),
      newResults.map(result => periods.get(result.periodId)!.AcademicYearID),
      newResults.map(() => null),
      actorId,
    ])).rows[0].count);
    if (insertAuditCount !== newResults.length) throw invalid('Not all course results could be imported.');
  }
}
