import type { PoolClient } from 'pg';
import { assignPlacementWithClient } from '../academic/academic.service';
import { audit } from '../academic/academic.repository';
import { resultPeriod } from './student.service';
import { inputObject, positiveId, requiredText, optionalText, enumValue, resultValues, invalid } from './student.validation';

// Profile and history share the provisioning transaction; one invalid row rolls back everything.
export async function importAcademicProfile(c: PoolClient, studentId: number, raw: unknown, actorId: number) {
  const b = inputObject(raw, ['programId','phone','className','status','placement','courseResults']);
  const programId = positiveId(b.programId, 'programId');
  const placement = inputObject(b.placement, ['cohortId','groupCode','entryAcademicPeriodId','currentAcademicPeriodId']);
  positiveId(placement.cohortId, 'cohortId');
  positiveId(placement.currentAcademicPeriodId, 'currentAcademicPeriodId');
  if (!Array.isArray(b.courseResults) || b.courseResults.length > 1000) throw invalid('courseResults must be an array of at most 1000 results.');
  const student = (await c.query('SELECT * FROM "Students" WHERE "StudentID"=$1 AND "DeletedAt" IS NULL FOR UPDATE', [studentId])).rows[0];
  if (!student) throw invalid('Student not found or deleted.', 409);
  await assignPlacementWithClient(c, studentId, {...placement, programId, reason:'Complete student import'}, actorId);
  if (b.phone !== undefined) await c.query('UPDATE "Users" SET "Phone"=$2,"UpdatedAt"=now() WHERE "UserID"=$1', [student.UserID, optionalText(b.phone,'phone',20)]);
  if (b.className !== undefined) await c.query('UPDATE "Students" SET "ClassName"=$2 WHERE "StudentID"=$1', [studentId, optionalText(b.className,'className',20)]);
  if (b.status !== undefined) await c.query('UPDATE "Students" SET "Status"=$2 WHERE "StudentID"=$1', [studentId, enumValue(b.status,['ACTIVE','INACTIVE','SUSPENDED','GRADUATED','DROPPED_OUT'],'status')]);
  const seen = new Set<string>();
  for (const rawResult of b.courseResults) {
    const r = inputObject(rawResult, ['courseCode','academicPeriodId','attemptNumber','status','score','grade','gradePoints','sourceReference']);
    const code = requiredText(r.courseCode,'courseCode',20).toUpperCase();
    const periodId = positiveId(r.academicPeriodId,'academicPeriodId'), attempt = positiveId(r.attemptNumber ?? 1,'attemptNumber');
    if (attempt > 100) throw invalid('attemptNumber must not exceed 100.');
    const key = `${code}:${periodId}:${attempt}`;
    if (seen.has(key)) throw invalid('Duplicate course/period/attempt in student history.');
    seen.add(key);
    const course = (await c.query('SELECT "CourseID" FROM "Courses" WHERE upper("CourseCode")=$1',[code])).rows[0];
    if (!course) throw invalid(`Unknown courseCode: ${code}.`);
    const period = await resultPeriod(c,studentId,periodId), values = resultValues(r);
    const old = (await c.query('SELECT * FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "CourseID"=$2 AND "AcademicPeriodID"=$3 AND "AttemptNumber"=$4',[studentId,course.CourseID,periodId,attempt])).rows[0];
    if (old) {
      const previous = {status:old.Status,score:old.Score===null?null:Number(old.Score),gradePoints:old.GradePoints===null?null:Number(old.GradePoints),grade:old.Grade,sourceReference:old.SourceReference};
      if (JSON.stringify(previous)!==JSON.stringify(values)) {
        if (old.OJTResultID) throw invalid('Official OJT results must be corrected through the OJT result workflow.',409,'OFFICIAL_OJT_GRADE_IMMUTABLE');
        const updated=(await c.query(`UPDATE "StudentCourseResults" SET "Status"=$2,"Score"=$3,"GradePoints"=$4,"Grade"=$5,"SourceReference"=$6,"RecordedBy"=$7,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[old.ResultID,values.status,values.score,values.gradePoints,values.grade,values.sourceReference,actorId])).rows[0];
        await audit(c,actorId,'StudentCourseResults',old.ResultID,'IMPORT_UPDATE_RESULT',old,updated,'Overwrite an existing course attempt from the student import file.');
      }
      continue;
    }
    const result = (await c.query(`INSERT INTO "StudentCourseResults" ("StudentID","CourseID","AcademicPeriodID","AttemptNumber","Status","Score","GradePoints","Grade","SourceReference","AcademicYearID","SemesterTaken","RecordedBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[studentId,course.CourseID,periodId,attempt,values.status,values.score,values.gradePoints,values.grade,values.sourceReference,period.academicYearId,period.semesterTaken,actorId])).rows[0];
    await audit(c,actorId,'StudentCourseResults',result.ResultID,'IMPORT_RESULT',null,result);
  }
}
