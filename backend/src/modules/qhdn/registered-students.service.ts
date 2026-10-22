import { enrichListRows } from '../../shared/list-context';
import { readTransaction } from './read.repository';
import { registrationApi, registrationSelect } from '../ojt-registration/registration.service';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

// QHDN manages registrations only after an academic handoff for the same student/semester.
export async function registeredStudents(params:Row,actor:Actor) {
  if(!['ADMIN','OJT_COORD'].includes(actor.roleCode))throw invalid('Only QHDN staff can view registered students.',403,'FORBIDDEN');
  const p=pagination(params,['registrationId','studentId','ojtSemesterId','academicPeriodId','windowId','status','programId','cohortId','groupCode','search','handoffStatus']);
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const args:unknown[]=[],where:string[]=['r."HandoffID" IS NOT NULL'];
  const add=(column:string,value:unknown)=>{args.push(value);where.push(column+'=$'+args.length);};
  for(const [key,col] of Object.entries({registrationId:'r."RegistrationID"',studentId:'r."StudentID"',ojtSemesterId:'r."OJTSemesterID"',academicPeriodId:'o."AcademicPeriodID"',windowId:'r."WindowID"',programId:'r."ProgramID"',cohortId:'r."CohortID"'}))if(params[key]!==undefined)add(col,positiveId(params[key],key));
  if(params.status!==undefined)add('r."Status"',enumValue(params.status,['SUBMITTED','APPROVED','REJECTED','HANDED_OFF'],'status'));
  if(params.groupCode!==undefined)add('r."GroupCode"',enumValue(params.groupCode,['A','B','C','D'],'groupCode'));
  if(params.handoffStatus!==undefined){
    const status=enumValue(params.handoffStatus,['NOT_HANDED_OFF','HANDED_OFF'],'handoffStatus');
    where.push('r."HandoffID" IS '+(status==='HANDED_OFF'?'NOT NULL':'NULL'));
  }
  if(params.search!==undefined){
    args.push('%'+requiredText(params.search,'search',100)+'%');
    where.push(`(r."StudentCode" ILIKE $${args.length} OR r."FullName" ILIKE $${args.length} OR r."Email" ILIKE $${args.length})`);
  }
  return readTransaction(async c=>{
    const sql=`SELECT r.*,cohort."Name" AS "CohortName",current_program."ProgramCode" AS "CurrentProgramCode",current_program."ProgramName" AS "CurrentProgramName",
      jsonb_build_object('id',o."OJTSemesterID",'code',o."SemesterCode",'name',o."Name",'academicPeriodId',o."AcademicPeriodID") AS semester,
      CASE WHEN period."AcademicPeriodID" IS NULL THEN NULL ELSE jsonb_build_object('id',period."AcademicPeriodID",'code',period."PeriodCode",'name',period."Name",'kind',period."Kind") END AS "academicPeriod",
      CASE WHEN w."WindowID" IS NULL THEN NULL ELSE jsonb_build_object('id',w."WindowID",'name',w."Name",'status',w."Status",'startsAt',w."StartsAt",'endsAt',w."EndsAt") END AS window
      FROM (${registrationSelect}) r
      JOIN "OJTSemesters" o ON o."OJTSemesterID"=r."OJTSemesterID"
      LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=o."AcademicPeriodID"
      LEFT JOIN "OJTRegistrationWindows" w ON w."WindowID"=r."WindowID"
      LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=r."CohortID"
      LEFT JOIN "TrainingPrograms" current_program ON current_program."ProgramID"=r."CurrentProgramID"
      ${where.length?'WHERE '+where.join(' AND '):''}`;
    // Page distinct students, rather than paging registrations and deduplicating afterwards.
    const total=(await c.query(`SELECT count(DISTINCT "StudentID")::int AS total FROM (${sql}) records`,args)).rows[0].total;
    const selected=(await c.query(`SELECT "StudentID",max("RegisteredAt") AS latest FROM (${sql}) records GROUP BY "StudentID" ORDER BY latest DESC,"StudentID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    const items:Row[]=[];
    if(selected.length){
      const studentIds=selected.map(r=>r.StudentID);
      const rows=(await c.query(`SELECT * FROM (${sql}) records WHERE "StudentID"=ANY($${args.length+1}::int[]) ORDER BY "RegisteredAt" DESC,"RegistrationID" DESC`,[...args,studentIds])).rows;
      const byStudent=new Map<number,Row>();
      for(const r of rows){
        let item=byStudent.get(r.StudentID);
        if(!item){
          item={id:r.StudentID,studentId:r.StudentID,studentCode:r.StudentCode,fullName:r.FullName,email:r.Email,phone:r.Phone,studentStatus:r.StudentStatus,accountStatus:r.AccountStatus,programId:r.CurrentProgramID,programCode:r.CurrentProgramCode,programName:r.CurrentProgramName,cohortId:r.CohortID,cohortName:r.CohortName,groupCode:r.GroupCode,cv:r.CV??null,registrations:[]};
          byStudent.set(r.StudentID,item);
        }
        item.registrations.push({...registrationApi(r),registrationId:r.RegistrationID,semester:r.semester,academicPeriod:r.academicPeriod,window:r.window,handoffStatus:r.HandoffID?'HANDED_OFF':'NOT_HANDED_OFF'});
      }
      for(const id of studentIds)items.push(byStudent.get(id)!);
    }
    const enriched=await enrichListRows(c,items);
    const registrations=enriched.flatMap(item=>item.registrations);
    const expanded=await enrichListRows(c,registrations);
    let offset=0;for(const item of enriched){item.registrations=expanded.slice(offset,offset+item.registrations.length);offset+=item.registrations.length;}
    return {items:enriched,total,page:p.page,limit:p.limit};
  });
}
