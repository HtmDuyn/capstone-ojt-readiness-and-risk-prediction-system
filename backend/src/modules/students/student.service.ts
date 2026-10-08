import { query } from '../../config/database';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, pagination, positiveId, inputObject, requiredText, optionalText, enumValue, resultValues } from './student.validation';

const studentSelect = `SELECT s."StudentID" AS id,s."StudentCode" AS "studentCode",s."UserID" AS "userId",u."FullName" AS "fullName",u."Email" AS email,u."Phone" AS phone,u."Status" AS "accountStatus",s."ProgramID" AS "programId",s."EnrollmentYear" AS "enrollmentYear",s."CurrentSemester" AS "currentSemester",s."ClassName" AS "className",s."Status" AS status,p."CohortID" AS "cohortId",p."GroupCode" AS "groupCode",p."EntryAcademicPeriodID" AS "entryAcademicPeriodId",p."CurrentAcademicPeriodID" AS "currentAcademicPeriodId" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"`;
export async function student(id: number) {
  const row = (await query(`${studentSelect} WHERE s."StudentID"=$1`,[id])).rows[0];
  if (!row) throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
  return row;
}
export async function assertStudentAccess(id: number, user: { userId: number; roleCode: string }) {
  if (['ADMIN','ACADEMIC'].includes(user.roleCode)) return;
  const row = await student(id);
  if (user.roleCode !== 'STUDENT' || row.userId !== user.userId) throw invalid('You cannot access this student.',403,'FORBIDDEN');
}
export async function listStudents(params: Record<string,unknown>) {
  const p = pagination(params,['search','status','programId','cohortId','groupCode','enrollmentYear','currentSemester']);
  const args: unknown[] = [], conditions: string[] = [];
  const add = (sql: string,v: unknown) => { args.push(v); conditions.push(sql.replace('?',`$${args.length}`)); };
  if (params.search !== undefined) { args.push(`%${requiredText(params.search,'search',100)}%`); const n=args.length; conditions.push(`(s."StudentCode" ILIKE $${n} OR u."FullName" ILIKE $${n} OR u."Email" ILIKE $${n})`); }
  if (params.status !== undefined) add('s."Status"=?',requiredText(params.status,'status',30));
  if (params.groupCode !== undefined) add('p."GroupCode"=?',enumValue(params.groupCode,['A','B','C','D'],'groupCode'));
  for (const [key,col] of Object.entries({programId:'s."ProgramID"',cohortId:'p."CohortID"',enrollmentYear:'s."EnrollmentYear"',currentSemester:'s."CurrentSemester"'})) if (params[key] !== undefined) add(`${col}=?`,positiveId(params[key],key));
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const row = (await query(`WITH filtered AS (${studentSelect}${where}), paged AS (SELECT * FROM filtered ORDER BY id LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  return { ...row,page:p.page,limit:p.limit };
}
export async function patchStudent(id: number, body: unknown, actorId: number) {
  const input=inputObject(body,['fullName','phone','className','status','programId','reason']);
  const reason=requiredText(input.reason,'reason',2000);
  const fields: Record<string,unknown>={};
  if ('className' in input) fields.ClassName=optionalText(input.className,'className',20);
  if ('status' in input) fields.Status=enumValue(input.status,['ACTIVE','INACTIVE','SUSPENDED','GRADUATED','DROPPED_OUT'],'status');
  if ('programId' in input) fields.ProgramID=input.programId===null ? null : positiveId(input.programId,'programId');
  const userFields: Record<string,unknown>={};
  if ('fullName' in input) userFields.FullName=requiredText(input.fullName,'fullName',100);
  if ('phone' in input) userFields.Phone=optionalText(input.phone,'phone',20);
  if (!Object.keys(fields).length && !Object.keys(userFields).length) throw invalid('Provide at least one profile field.');
  return academicTransaction(async client => {
    const before=(await client.query('SELECT * FROM "Students" WHERE "StudentID"=$1 FOR UPDATE',[id])).rows[0];
    if (!before) throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
    const beforeUser=(await client.query('SELECT "FullName","Phone" FROM "Users" WHERE "UserID"=$1 FOR UPDATE',[before.UserID])).rows[0];
    for (const [table,key,keyId,values] of [['Students','StudentID',id,fields],['Users','UserID',before.UserID,userFields]] as const) {
      const entries=Object.entries(values);
      if (entries.length) await client.query(`UPDATE "${table}" SET ${entries.map(([col],i)=>`"${col}"=$${i+2}`).join(',')}${table==='Users'?',"UpdatedAt"=now()':''} WHERE "${key}"=$1`,[keyId,...entries.map(([,v])=>v)]);
    }
    await audit(client,actorId,'Students',id,'UPDATE_PROFILE',{...before,...beforeUser},{...before,...beforeUser,...fields,...userFields},reason);
    return (await client.query(`${studentSelect} WHERE s."StudentID"=$1`,[id])).rows[0];
  });
}
export const resultSelect = `SELECT r."ResultID" AS id,r."StudentID" AS "studentId",r."CourseID" AS "courseId",c."CourseCode" AS "courseCode",c."CourseName" AS "courseName",r."AcademicPeriodID" AS "academicPeriodId",p."PeriodCode" AS "periodCode",p."Kind" AS "periodKind",p."StartDate" AS "periodStartDate",r."AcademicYearID" AS "academicYearId",r."SemesterTaken" AS "semesterTaken",r."AttemptNumber" AS "attemptNumber",r."Score"::float8 AS score,r."GradePoints"::float8 AS "gradePoints",r."Grade" AS grade,r."Status" AS status,r."SourceReference" AS "sourceReference",r."OJTResultID" AS "ojtResultId",r."RecordedBy" AS "recordedBy",r."CreatedAt" AS "createdAt",r."UpdatedAt" AS "updatedAt" FROM "StudentCourseResults" r JOIN "Courses" c ON c."CourseID"=r."CourseID" LEFT JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=r."AcademicPeriodID"`;
export async function results(id: number, params: Record<string,unknown>) {
  await student(id);
  const p=pagination(params,['courseId','academicPeriodId','status']), args:unknown[]=[id], filters=['r."StudentID"=$1'];
  for (const key of ['courseId','academicPeriodId','status']) if (params[key]!==undefined) { args.push(key==='status' ? enumValue(params[key],['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED'],'status') : positiveId(params[key],key)); filters.push(`r."${key==='courseId'?'CourseID':key==='status'?'Status':'AcademicPeriodID'}"=$${args.length}`); }
  return (await query(`WITH filtered AS (${resultSelect} WHERE ${filters.join(' AND ')}), paged AS (SELECT * FROM filtered ORDER BY "periodStartDate" DESC NULLS LAST,"attemptNumber" DESC,id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total, COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY "periodStartDate" DESC NULLS LAST,"attemptNumber" DESC,id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows.map(row=>({...row,page:p.page,limit:p.limit}))[0];
}
export async function resultPeriod(client: PoolClient, studentId: number, periodId: number) {
  const period=(await client.query(`SELECT p.*,COALESCE(parent."StartDate",p."StartDate") AS "SemesterStart" FROM "AcademicPeriods" p LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=p."ParentPeriodID" WHERE p."AcademicPeriodID"=$1`,[periodId])).rows[0];
  if (!period) throw invalid('Academic period not found.');
  const placement=(await client.query(`SELECT entry."StartDate" FROM "StudentAcademicPlacements" sp JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=sp."EntryAcademicPeriodID" WHERE sp."StudentID"=$1`,[studentId])).rows[0];
  if (!placement) throw invalid('Assign the actual specialized entry period before importing results.');
  if (new Date(period.SemesterStart)<new Date(placement.StartDate)) throw invalid('Result period precedes specialized entry.');
  const count=(await client.query('SELECT count(*)::int AS n FROM "AcademicPeriods" WHERE "Kind"=\'SEMESTER\' AND "StartDate">=$1 AND "StartDate"<=$2',[placement.StartDate,period.SemesterStart])).rows[0].n;
  return { academicYearId:period.AcademicYearID,semesterTaken:count };
}
export async function patchResult(id: number, body: unknown, actorId: number) {
  const input=inputObject(body,['courseId','academicPeriodId','attemptNumber','score','grade','gradePoints','status','sourceReference','reason']);
  const reason=requiredText(input.reason,'reason',2000);
  if (Object.keys(input).length===1) throw invalid('Provide at least one result field.');
  return academicTransaction(async client => {
    const old=(await client.query('SELECT * FROM "StudentCourseResults" WHERE "ResultID"=$1 FOR UPDATE',[id])).rows[0];
    if (!old) throw invalid('Course result not found.',404,'RESULT_NOT_FOUND');
    if(old.OJTResultID)throw invalid('A synchronized official OJT grade is immutable.',409,'OFFICIAL_OJT_GRADE_IMMUTABLE');
    const values=resultValues({status:old.Status,score:old.Score===null?null:Number(old.Score),grade:old.Grade,gradePoints:old.GradePoints===null?null:Number(old.GradePoints),sourceReference:old.SourceReference,...input});
    const courseId=positiveId(input.courseId??old.CourseID,'courseId');
    const periodId=positiveId(input.academicPeriodId??old.AcademicPeriodID,'academicPeriodId');
    const attempt=positiveId(input.attemptNumber??old.AttemptNumber,'attemptNumber');
    if (attempt>100) throw invalid('attemptNumber must not exceed 100.');
    const period=await resultPeriod(client,old.StudentID,periodId);
    const after=(await client.query(`UPDATE "StudentCourseResults" SET "CourseID"=$2,"AcademicPeriodID"=$3,"AttemptNumber"=$4,"Score"=$5,"Grade"=$6,"GradePoints"=$7,"Status"=$8,"SourceReference"=$9,"AcademicYearID"=$10,"SemesterTaken"=$11,"RecordedBy"=$12,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[id,courseId,periodId,attempt,values.score,values.grade,values.gradePoints,values.status,values.sourceReference,period.academicYearId,period.semesterTaken,actorId])).rows[0];
    await audit(client,actorId,'StudentCourseResults',id,'CORRECT_RESULT',old,after,reason);
    return (await client.query(`${resultSelect} WHERE r."ResultID"=$1`,[id])).rows[0];
  });
}
