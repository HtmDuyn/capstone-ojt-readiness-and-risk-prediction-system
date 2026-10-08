import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { pagination } from '../students/student.validation';
import { invalid, positiveId, enumValue } from './combo.validation';
export type Row=Record<string,any>;
export async function windowRecord(client:PoolClient,id:number,lock=false):Promise<Row> {
  const row=(await client.query(`SELECT * FROM "ComboRegistrationWindows" WHERE "WindowID"=$1${lock?' FOR UPDATE':''}`,[id])).rows[0];
  if(!row)throw invalid('Combo registration window not found.',404,'COMBO_WINDOW_NOT_FOUND');return row;
}
export function asWindow(w:Row) {
  return {id:w.WindowID,name:w.Name,phase:w.Phase,academicPeriodId:w.AcademicPeriodID,ojtSemesterId:w.OJTSemesterID,initialWindowId:w.InitialWindowID,scope:w.Scope,startsAt:w.StartsAt,endsAt:w.EndsAt,status:w.Status,createdBy:w.CreatedBy,createdAt:w.CreatedAt,openedAt:w.OpenedAt,closedAt:w.ClosedAt,finalizedAt:w.FinalizedAt,finalizeSummary:w.FinalizeSummary};
}
export async function roster(client:PoolClient,id:number):Promise<Row[]> {
  return (await client.query(`SELECT r."StudentID" AS "studentId",r."ProgramID" AS "programId",r."ScopeSnapshot" AS "scopeSnapshot",r."Outcome" AS outcome,r."FinalizedAt" AS "finalizedAt",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,u."UserID" AS "userId",s."Status" AS "studentStatus",u."Status" AS "accountStatus",GREATEST(w."EndsAt",COALESCE((SELECT max(e."EndsAt") FROM "ComboExtensionStudents" es JOIN "ComboWindowExtensions" e ON e."ExtensionID"=es."ExtensionID" WHERE es."WindowID"=r."WindowID" AND es."StudentID"=r."StudentID"),w."EndsAt")) AS "effectiveEndsAt",last."EventID" AS "eventId",last."ProgramComboID" AS "comboId",last."CourseIDs" AS "courseIds",last."CreatedAt" AS "submittedAt",last."ChoiceSnapshot" AS "choiceSnapshot" FROM "ComboWindowStudents" r JOIN "ComboRegistrationWindows" w ON w."WindowID"=r."WindowID" JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN LATERAL (SELECT * FROM "StudentComboSelectionEvents" e WHERE e."WindowID"=r."WindowID" AND e."StudentID"=r."StudentID" AND e."EventType"='SUBMITTED' ORDER BY e."EventID" DESC LIMIT 1) last ON true WHERE r."WindowID"=$1 ORDER BY r."StudentID"`,[id])).rows;
}
export async function listWindows(params:Record<string,unknown>) {
  const p=pagination(params,['phase','status','academicPeriodId']),args:unknown[]=[],where:string[]=[];
  for(const [key,col] of [['phase','Phase'],['status','Status'],['academicPeriodId','AcademicPeriodID']])if(params[key]!==undefined){args.push(key==='academicPeriodId'?positiveId(params[key],key):enumValue(params[key],key==='phase'?['INITIAL','CONFIRMATION']:['DRAFT','OPEN','CLOSED','FINALIZED'],key));where.push(`"${col}"=$${args.length}`);}
  const row=(await query(`WITH filtered AS (SELECT * FROM "ComboRegistrationWindows" ${where.length?'WHERE '+where.join(' AND '):''}),paged AS (SELECT * FROM filtered ORDER BY "WindowID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY "WindowID" DESC) FILTER (WHERE "WindowID" IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  return {...row,items:row.items.map(asWindow),page:p.page,limit:p.limit};
}
export async function matchingStudents(client:PoolClient,w:Row) {
  const sc=w.Scope;
  return (await client.query(`SELECT s."StudentID" AS "studentId",s."ProgramID" AS "programId",s."StudentCode" AS "studentCode",p."CohortID" AS "cohortId",p."GroupCode" AS "groupCode",p."EntryAcademicPeriodID" AS "entryAcademicPeriodId",t."SpecializationID" AS "majorId",target."AcademicPeriodID" AS "academicPeriodId" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID" JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=p."EntryAcademicPeriodID" JOIN "AcademicPeriods" target ON target."AcademicPeriodID"=$1 LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=target."ParentPeriodID" WHERE s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND t."Status"='PUBLISHED' AND p."CohortID"=ANY($2::int[]) AND p."GroupCode"=ANY($3::text[]) AND t."SpecializationID"=ANY($4::int[]) AND ($5::int[] IS NULL OR s."StudentID"=ANY($5::int[])) AND (SELECT count(*) FROM "AcademicPeriods" sem WHERE sem."Kind"='SEMESTER' AND sem."StartDate">=entry."StartDate" AND sem."StartDate"<=COALESCE(parent."StartDate",target."StartDate"))=4 ORDER BY s."StudentID"`,[w.AcademicPeriodID,sc.cohortIds,sc.groupCodes,sc.majorIds,sc.studentIds])).rows;
}
export async function activeChoice(client:PoolClient,studentId:number,programId:number) {
  return (await client.query(`SELECT sc."SelectionID" AS id,sc."ProgramComboID" AS "comboId",b."ComboCode" AS code,b."ComboName" AS name,sc."ConfirmedAt" AS "confirmedAt",COALESCE((SELECT jsonb_agg(cc."CourseID" ORDER BY cc."CourseID") FROM "StudentComboCourseSelections" c JOIN "ComboCourses" cc ON cc."ComboCourseID"=c."ComboCourseID" WHERE c."SelectionID"=sc."SelectionID"),'[]'::jsonb) AS "courseIds" FROM "StudentComboSelections" sc JOIN "ProgramCombos" b ON b."ProgramComboID"=sc."ProgramComboID" WHERE sc."StudentID"=$1 AND sc."ProgramID"=$2 AND sc."SelectionPurpose"='SPECIALIZATION'`,[studentId,programId])).rows;
}
export async function cancelQueuedReminders(client:PoolClient,windowId:number,studentId?:number) {
  await client.query(`UPDATE "EmailOutbox" e SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL FROM "ComboReminderDeliveries" d JOIN "ComboReminderBatches" b ON b."BatchID"=d."BatchID" WHERE e."EmailID"=d."EmailID" AND d."WindowID"=$1 AND e."Status" IN ('PENDING','SENDING') AND ($2::int IS NULL OR (d."StudentID"=$2 AND b."Summary"->>'target'='MISSING'))`,[windowId,studentId??null]);
}
