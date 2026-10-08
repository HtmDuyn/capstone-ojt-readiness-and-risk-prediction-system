import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { pagination } from '../students/student.validation';
import { inputObject, invalid, positiveId, requiredText, enumValue, timestamp, scope, ids } from './combo.validation';
import { windowRecord, asWindow, matchingStudents, roster, cancelQueuedReminders, type Row } from './combo.repository';
import { comboSchedule } from '../academic/workflow-policy';

export async function now(client:PoolClient):Promise<Date> {return (await client.query('SELECT clock_timestamp() AS now')).rows[0].now;}
async function validateWindow(client:PoolClient,w:Row) {
  if(new Date(w.EndsAt)<=new Date(w.StartsAt))throw invalid('endsAt must be after startsAt.');
  const schedule=await comboSchedule(client,w.AcademicPeriodID,w.Phase);
  if(new Date(w.StartsAt)<new Date(schedule.StartsAt)||new Date(w.EndsAt)>new Date(schedule.EndsAt))throw invalid('Base window dates must fit the explicitly configured combo phase. Use scoped extensions for exceptions.',409,'COMBO_WINDOW_OUTSIDE_PHASE');
  const period=(await client.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[w.AcademicPeriodID])).rows[0];if(!period)throw invalid('Academic period not found.');
  if(!(await client.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[w.OJTSemesterID])).rowCount)throw invalid('OJT semester not found.');
  if(w.Phase==='INITIAL' && period.Kind!=='SEMESTER')throw invalid('Initial choice must target the actual regular specialized semester 4.');
  if(w.Phase==='CONFIRMATION') {
    if(!w.InitialWindowID)throw invalid('Confirmation requires initialWindowId.');
    const initial=await windowRecord(client,w.InitialWindowID);
    if(initial.Phase!=='INITIAL' || initial.AcademicPeriodID!==(period.ParentPeriodID??period.AcademicPeriodID) || initial.OJTSemesterID!==w.OJTSemesterID)throw invalid('Confirmation must refer to an INITIAL window for the same semester 4 and OJT semester.');
    if(new Date(w.StartsAt)<new Date(initial.EndsAt))throw invalid('Confirmation cannot start before the initial base window ends.');
  }else if(w.InitialWindowID!==null)throw invalid('Initial phase must not specify initialWindowId.');
  for(const [table,col,values] of [['Cohorts','CohortID',w.Scope.cohortIds],['Specializations','SpecializationID',w.Scope.majorIds],['Students','StudentID',w.Scope.studentIds]] as const)if(values) {
    const count=(await client.query(`SELECT count(*)::int AS n FROM "${table}" WHERE "${col}"=ANY($1::int[])`,[values])).rows[0].n;
    if(count!==values.length)throw invalid(`Scope contains unknown ${table} IDs.`);
  }
}
export async function saveWindow(body:unknown,actorId:number,id?:number) {
  const b=inputObject(body,['name','phase','academicPeriodId','ojtSemesterId','initialWindowId','scope','startsAt','endsAt']);
  return academicTransaction(async client=>{
    const before=id?await windowRecord(client,id,true):null;
    if(before && before.Status!=='DRAFT')throw invalid('Scope and base dates can only be edited in DRAFT. Use scoped extensions after opening.',409,'WINDOW_NOT_DRAFT');
    const w:Row={...before};
    for(const [key,col] of [['name','Name'],['phase','Phase'],['academicPeriodId','AcademicPeriodID'],['ojtSemesterId','OJTSemesterID'],['initialWindowId','InitialWindowID'],['scope','Scope'],['startsAt','StartsAt'],['endsAt','EndsAt']])if(!id||key in b) {
      w[col]=key==='name'?requiredText(b[key],key,150):key==='phase'?enumValue(b[key],['INITIAL','CONFIRMATION'],key):key==='scope'?scope(b[key]):key==='initialWindowId'?(b[key]==null?null:positiveId(b[key],key)):key.endsWith('At')?timestamp(b[key],key):positiveId(b[key],key);
    }
    await validateWindow(client,w);
    const args=[w.Name,w.Phase,w.AcademicPeriodID,w.OJTSemesterID,w.InitialWindowID,JSON.stringify(w.Scope),w.StartsAt,w.EndsAt];
    const after=id?(await client.query(`UPDATE "ComboRegistrationWindows" SET "Name"=$1,"Phase"=$2,"AcademicPeriodID"=$3,"OJTSemesterID"=$4,"InitialWindowID"=$5,"Scope"=$6,"StartsAt"=$7,"EndsAt"=$8,"UpdatedAt"=now() WHERE "WindowID"=$9 RETURNING *`,[...args,id])).rows[0]:(await client.query(`INSERT INTO "ComboRegistrationWindows" ("Name","Phase","AcademicPeriodID","OJTSemesterID","InitialWindowID","Scope","StartsAt","EndsAt","CreatedBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[...args,actorId])).rows[0];
    await audit(client,actorId,'ComboRegistrationWindows',after.WindowID,id?'UPDATE_COMBO_WINDOW':'CREATE_COMBO_WINDOW',before,after);return asWindow(after);
  });
}
export async function changeWindow(id:number,action:'open'|'close',body:unknown,actorId:number) {
  const b=inputObject(body,['reason']),reason=requiredText(b.reason,'reason',2000);
  return academicTransaction(async client=>{
    const before=await windowRecord(client,id,true);
    if(before.Status==='FINALIZED')throw invalid('A finalized window cannot be reopened or closed.',409,'WINDOW_FINALIZED');
    if(action==='close') {
      if(!['OPEN','CLOSED'].includes(before.Status))throw invalid('Only an open window can be closed.',409);
      if(before.Status==='CLOSED')return {...asWindow(before),replayed:true};
    }else{
      if(before.Status==='OPEN')return {...asWindow(before),replayed:true};
      await validateWindow(client,before);
      let students=await roster(client,id);
      if(!students.length) {
        let candidates=await matchingStudents(client,before);
        if(before.Phase==='CONFIRMATION') {
          const initial=await windowRecord(client,before.InitialWindowID);
          if(initial.Status!=='FINALIZED')throw invalid('Finalize the initial window before opening confirmation.',409);
          const initialIds=new Set((await roster(client,initial.WindowID)).filter(r=>r.outcome==='APPLIED').map(r=>r.studentId));
          candidates=candidates.filter(r=>initialIds.has(r.studentId));
        }
        if(!candidates.length)throw invalid('No active students in scope with published curriculum and actual specialized semester 4.',409,'EMPTY_COMBO_SCOPE');
        if(before.Scope.studentIds && before.Scope.studentIds.some((id:number)=>!candidates.some(r=>r.studentId===id)))throw invalid('Some explicitly scoped students do not meet the semester/initial-choice requirements.');
        const conflict=(await client.query(`SELECT w."WindowID" FROM "ComboRegistrationWindows" w JOIN "ComboWindowStudents" r ON r."WindowID"=w."WindowID" JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=w."AcademicPeriodID" JOIN "AcademicPeriods" target ON target."AcademicPeriodID"=$1 WHERE w."WindowID"<>$2 AND w."Phase"=$3 AND w."Status"<>'DRAFT' AND COALESCE(p."ParentPeriodID",p."AcademicPeriodID")=COALESCE(target."ParentPeriodID",target."AcademicPeriodID") AND r."StudentID"=ANY($4::int[]) LIMIT 1`,[before.AcademicPeriodID,id,before.Phase,candidates.map(r=>r.studentId)])).rows[0];
        if(conflict)throw invalid(`Student scope overlaps window ${conflict.WindowID} in the same phase and semester.`,409,'OVERLAPPING_COMBO_WINDOW');
        for(const r of candidates)await client.query(`INSERT INTO "ComboWindowStudents" ("WindowID","StudentID","ProgramID","ScopeSnapshot") VALUES ($1,$2,$3,$4)`,[id,r.studentId,r.programId,JSON.stringify(r)]);
        students=await roster(client,id);
      }
      const time=await now(client);if(!students.some(r=>new Date(r.effectiveEndsAt)>time))throw invalid('All deadlines have expired. Create a scoped extension before reopening.',409,'WINDOW_EXPIRED');
    }
    const after=(await client.query(`UPDATE "ComboRegistrationWindows" SET "Status"=$2,"${action==='open'?'OpenedBy':'ClosedBy'}"=$3,"${action==='open'?'OpenedAt':'ClosedAt'}"=now(),"UpdatedAt"=now() WHERE "WindowID"=$1 RETURNING *`,[id,action==='open'?'OPEN':'CLOSED',actorId])).rows[0];
    if(action==='close')await cancelQueuedReminders(client,id);
    await audit(client,actorId,'ComboRegistrationWindows',id,action==='open'?'OPEN_COMBO_WINDOW':'CLOSE_COMBO_WINDOW',before,after,reason);return asWindow(after);
  });
}
export async function extendWindow(id:number,body:unknown,actorId:number) {
  const b=inputObject(body,['studentIds','endsAt','reason']),students=ids(b.studentIds,'studentIds'),endsAt=timestamp(b.endsAt,'endsAt'),reason=requiredText(b.reason,'reason',2000);
  if(!students.length)throw invalid('Select at least one student for extension.');
  return academicTransaction(async client=>{
    const w=await windowRecord(client,id,true);if(!['OPEN','CLOSED'].includes(w.Status))throw invalid('Only open/closed windows can be extended.',409);
    const rows=await roster(client,id),time=await now(client);if(new Date(endsAt)<=time)throw invalid('Extension deadline must be in the future.');
    for(const studentId of students){const r=rows.find(r=>r.studentId===studentId);if(!r)throw invalid(`Student ${studentId} is outside the frozen scope.`);if(new Date(endsAt)<=new Date(r.effectiveEndsAt))throw invalid(`Extension must increase student ${studentId}'s current deadline.`);}
    const extension=(await client.query(`INSERT INTO "ComboWindowExtensions" ("WindowID","EndsAt","Reason","CreatedBy") VALUES ($1,$2,$3,$4) RETURNING "ExtensionID"`,[id,endsAt,reason,actorId])).rows[0].ExtensionID;
    for(const studentId of students)await client.query(`INSERT INTO "ComboExtensionStudents" ("ExtensionID","WindowID","StudentID") VALUES ($1,$2,$3)`,[extension,id,studentId]);
    const result={id:extension,windowId:id,studentIds:students,endsAt,reason};await audit(client,actorId,'ComboRegistrationWindows',id,'EXTEND_COMBO_WINDOW',null,result,reason);return result;
  });
}
export async function selectionReport(id:number,params:Record<string,unknown>) {
  const p=pagination(params,['status']);const filter=params.status===undefined?null:enumValue(params.status,['SUBMITTED','MISSING','APPLIED','UNSELECTED'],'status');
  return academicTransaction(async client=>{
    const w=await windowRecord(client,id),all=await roster(client,id);const rows=all.map(r=>({...r,status:r.outcome??(r.eventId?'SUBMITTED':'MISSING')}));
    const filtered=filter?rows.filter(r=>r.status===filter):rows;
    return {window:asWindow(w),summary:{total:all.length,submitted:all.filter(r=>r.eventId).length,missing:all.filter(r=>!r.eventId).length,applied:all.filter(r=>r.outcome==='APPLIED').length,unselected:all.filter(r=>r.outcome==='UNSELECTED').length},items:filtered.slice(p.offset,p.offset+p.limit),total:filtered.length,page:p.page,limit:p.limit};
  });
}
