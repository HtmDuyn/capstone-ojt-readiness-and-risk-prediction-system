import type { PoolClient } from 'pg';
import { academicTransaction,audit } from './academic.repository';
import { invalid,inputObject,positiveId,requiredText,enumValue,score,optionalText } from '../students/student.validation';
import { timestamp,ids } from '../combo-registration/combo.validation';
type Row=Record<string,any>;
export const dayString=(d:Date|string)=>d instanceof Date?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:d;
export const periodBounds=(p:Row)=>({start:new Date(dayString(p.StartDate)+'T00:00:00+07:00'),end:new Date(new Date(dayString(p.EndDate)+'T00:00:00+07:00').getTime()+86400000)});
export async function actualPeriod(c:PoolClient,id:number) {
 const p=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[id])).rows[0];
 if(!p)throw invalid('Academic period not found.',404);return p;
}
export async function relativeSemester(c:PoolClient,studentId:number,targetId:number) {
 const p=await actualPeriod(c,targetId),base=p.Kind==='BLOCK3'?await actualPeriod(c,p.ParentPeriodID):p;
 const entry=(await c.query(`SELECT e.* FROM "StudentAcademicPlacements" sp JOIN "AcademicPeriods" e ON e."AcademicPeriodID"=sp."EntryAcademicPeriodID" WHERE sp."StudentID"=$1`,[studentId])).rows[0];
 if(!entry||entry.Kind!=='SEMESTER'||new Date(entry.StartDate)>new Date(base.StartDate))throw invalid('Actual student placement is missing or starts after the target period.',409,'ACTUAL_PATHWAY_REQUIRED');
 return (await c.query(`SELECT count(*)::int AS n FROM "AcademicPeriods" WHERE "Kind"='SEMESTER' AND "StartDate">=$1 AND "StartDate"<=$2`,[entry.StartDate,base.StartDate])).rows[0].n as number;
}
export async function registrationPeriod(c:PoolClient,w:Row) {
 if(!w.AcademicPeriodID)throw invalid('Configure the registration target academic period before opening this window.',409,'REGISTRATION_PERIOD_REQUIRED');
 const target=await actualPeriod(c,w.AcademicPeriodID),base=target.Kind==='BLOCK3'?await actualPeriod(c,target.ParentPeriodID):target;
 const term=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[w.OJTSemesterID])).rows[0];if(!term)throw invalid('OJT semester not found.',404);
 if(target.AcademicYearID!==term.AcademicYearID)throw invalid('Registration target must belong to the OJT academic year.',409,'REGISTRATION_PERIOD_MISMATCH');
 if(term.AcademicPeriodID){const declared=await actualPeriod(c,term.AcademicPeriodID),declaredBase=declared.Kind==='BLOCK3'?declared.ParentPeriodID:declared.AcademicPeriodID;if(base.AcademicPeriodID!==declaredBase)throw invalid('Registration target must match the declared OJT academic period.',409,'REGISTRATION_PERIOD_MISMATCH');}
 else if(term.StartDate&&(new Date(dayString(term.StartDate)+'T00:00:00+07:00')<periodBounds(base).start||new Date(dayString(term.StartDate)+'T00:00:00+07:00')>=periodBounds(base).end))throw invalid('Registration target must contain the OJT start date; reconcile its academic period first.',409,'REGISTRATION_PERIOD_MISMATCH');
}
export async function assertRegistrationSemester(c:PoolClient,w:Row,studentId:number) {
 await registrationPeriod(c,w);const relative=await relativeSemester(c,studentId,w.AcademicPeriodID);
 if(relative===w.RequiredRelativeSemester)return {relativeSemester:relative,exceptionId:null};
 const exception=(await c.query(`SELECT * FROM "OJTRegistrationExceptions" WHERE "WindowID"=$1 AND "StudentID"=$2
  AND "RelativeSemester"=$3 AND "RevokedAt" IS NULL AND "ExpiresAt">clock_timestamp() ORDER BY "ExceptionID" DESC LIMIT 1`,[w.WindowID,studentId,relative])).rows[0];
 if(!exception)throw invalid(`Registration requires relative semester ${w.RequiredRelativeSemester}; this student is in ${relative} at the target period.`,409,'OJT_REGISTRATION_SEMESTER_MISMATCH');
 return {relativeSemester:relative,exceptionId:exception.ExceptionID};
}
export async function saveRegistrationExceptions(windowId:number,body:unknown,actor:number) {
 const b=inputObject(body,['studentIds','relativeSemester','expiresAt','reason']),students=ids(b.studentIds,'studentIds'),relative=positiveId(b.relativeSemester,'relativeSemester');
 if(!students.length||relative>20)throw invalid('Select students and relativeSemester from 1 to 20.');
 const expires=timestamp(b.expiresAt,'expiresAt'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  const w=(await c.query('SELECT * FROM "OJTRegistrationWindows" WHERE "WindowID"=$1 FOR UPDATE',[windowId])).rows[0];if(!w)throw invalid('Registration window not found.',404);
  await registrationPeriod(c,w);if(relative===w.RequiredRelativeSemester)throw invalid('No exception is needed for the standard semester.');
  if(new Date(expires)<=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now||new Date(expires)>new Date(w.EndsAt))throw invalid('Exception expiry must be in the future and within the window deadline.');
  for(const studentId of students){
   const s=(await c.query(`SELECT s.*,p."CohortID",p."GroupCode",t."SpecializationID" FROM "Students" s LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID" WHERE s."StudentID"=$1`,[studentId])).rows[0];
   if(!s)throw invalid('Student not found.',404);
   for(const [key,value]of [['programIds',s.ProgramID],['cohortIds',s.CohortID],['groupCodes',s.GroupCode],['majorIds',s.SpecializationID],['studentIds',studentId]])if(w.Scope[key]&&!w.Scope[key].includes(value))throw invalid('Exception student is outside the window scope.',409);
   if(await relativeSemester(c,studentId,w.AcademicPeriodID)!==relative)throw invalid('Exception semester must match this student at the target period.',409);
  }
  const items=[];for(const studentId of students)items.push((await c.query(`INSERT INTO "OJTRegistrationExceptions" ("WindowID","StudentID","RelativeSemester","ExpiresAt","Reason","CreatedBy") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[windowId,studentId,relative,expires,reason,actor])).rows[0]);
  await audit(c,actor,'OJTRegistrationWindows',windowId,'ALLOW_SEMESTER_EXCEPTION',null,items,reason);return items;
 });
}
export async function revokeRegistrationException(windowId:number,id:number,body:unknown,actor:number) {
 const b=inputObject(body,['reason']),reason=requiredText(b.reason,'reason',2000);return academicTransaction(async c=>{
 const before=(await c.query('SELECT * FROM "OJTRegistrationExceptions" WHERE "ExceptionID"=$1 AND "WindowID"=$2 FOR UPDATE',[id,windowId])).rows[0];if(!before)throw invalid('Exception not found.',404);
 if(before.RevokedAt)return before;
 const after=(await c.query('UPDATE "OJTRegistrationExceptions" SET "RevokedAt"=now(),"RevokedBy"=$2,"RevocationReason"=$3 WHERE "ExceptionID"=$1 RETURNING *',[id,actor,reason])).rows[0];await audit(c,actor,'OJTRegistrationExceptions',id,'REVOKE',before,after,reason);return after;
 });
}
export async function comboSchedule(c:PoolClient,periodId:number,phase:string) {
 const p=await actualPeriod(c,periodId);if((phase==='INITIAL'&&p.Kind!=='SEMESTER')||(phase==='CONFIRMATION'&&p.Kind!=='BLOCK3'))throw invalid('INITIAL must use a regular semester; CONFIRMATION must use its Block 3.',409,'COMBO_PHASE_PERIOD_MISMATCH');
 const row=(await c.query('SELECT * FROM "ComboPhaseSchedules" WHERE "AcademicPeriodID"=$1 AND "Phase"=$2',[periodId,phase])).rows[0];
 if(!row)throw invalid('Configure the explicit combo phase schedule first.',409,'COMBO_PHASE_SCHEDULE_REQUIRED');
 const bounds=periodBounds(p);if(new Date(row.StartsAt)<bounds.start||new Date(row.EndsAt)>bounds.end)throw invalid('Combo schedule no longer fits its academic period.',409,'COMBO_PHASE_SCHEDULE_STALE');return row;
}
export async function saveComboSchedule(periodId:number,body:unknown,actor:number) {
 const b=inputObject(body,['phase','startsAt','endsAt','reason']),phase=enumValue(b.phase,['INITIAL','CONFIRMATION'],'phase'),start=timestamp(b.startsAt,'startsAt'),end=timestamp(b.endsAt,'endsAt'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
 const p=await actualPeriod(c,periodId),bounds=periodBounds(p);
 if((phase==='INITIAL'&&p.Kind!=='SEMESTER')||(phase==='CONFIRMATION'&&p.Kind!=='BLOCK3'))throw invalid('The phase does not match the academic period kind.');
 if(new Date(end)<=new Date(start)||new Date(start)<bounds.start||new Date(end)>bounds.end)throw invalid('Phase dates must fall inside the academic period (Asia/Bangkok); endsAt is exclusive.');
 if((await c.query(`SELECT 1 FROM "ComboRegistrationWindows" WHERE "AcademicPeriodID"=$1 AND "Phase"=$2 AND ("StartsAt"<$3 OR "EndsAt">$4) LIMIT 1`,[periodId,phase,start,end])).rowCount)throw invalid('Schedule change excludes an existing window.',409);
 const before=(await c.query('SELECT * FROM "ComboPhaseSchedules" WHERE "AcademicPeriodID"=$1 AND "Phase"=$2',[periodId,phase])).rows[0];
 const after=(await c.query(`INSERT INTO "ComboPhaseSchedules" ("AcademicPeriodID","Phase","StartsAt","EndsAt","Reason","ConfirmedBy") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("AcademicPeriodID","Phase") DO UPDATE SET "StartsAt"=EXCLUDED."StartsAt","EndsAt"=EXCLUDED."EndsAt","Reason"=EXCLUDED."Reason","ConfirmedBy"=EXCLUDED."ConfirmedBy","ConfirmedAt"=now() RETURNING *`,[periodId,phase,start,end,reason,actor])).rows[0];
 await audit(c,actor,'AcademicPeriods',periodId,'SET_COMBO_PHASE_SCHEDULE',before,after,reason);return after;
 });
}
export async function getComboSchedules(periodId:number) {return academicTransaction(async c=>{await actualPeriod(c,periodId);return (await c.query('SELECT * FROM "ComboPhaseSchedules" WHERE "AcademicPeriodID"=$1 ORDER BY "Phase"',[periodId])).rows;});}
export async function getAssessment(c:PoolClient,semesterId:number) {
 const w=(await c.query('SELECT * FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1 FOR UPDATE',[semesterId])).rows[0];
 if(!w)throw invalid('Configure the post-Block-3 assessment window first.',409,'OJT_ASSESSMENT_NOT_CONFIGURED');return w;
}
async function assessmentBounds(c:PoolClient,w:Row) {
 const p=await actualPeriod(c,w.BlockPeriodID);if(p.Kind!=='BLOCK3')throw invalid('Assessment must reference Block 3.');
 if(new Date(w.OpensAt)<periodBounds(p).end||new Date(w.ClosesAt)<=new Date(w.OpensAt))throw invalid('Official assessment must start after Block 3 ends.',409,'OJT_ASSESSMENT_BEFORE_BLOCK_END');
 const term=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[w.OJTSemesterID])).rows[0];if(!term)throw invalid('OJT semester not found.',404);
 if(term.StartDate&&periodBounds(p).end>new Date(dayString(term.StartDate)+'T00:00:00+07:00'))throw invalid('Assessment Block 3 must finish on or before the OJT start date.');return p;
}
export async function saveAssessment(semesterId:number,body:unknown,actor:number) {
 const b=inputObject(body,['blockPeriodId','opensAt','closesAt','reason']);const w={OJTSemesterID:semesterId,BlockPeriodID:positiveId(b.blockPeriodId,'blockPeriodId'),OpensAt:timestamp(b.opensAt,'opensAt'),ClosesAt:timestamp(b.closesAt,'closesAt')},reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
 await assessmentBounds(c,w);const before=(await c.query('SELECT * FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1 FOR UPDATE',[semesterId])).rows[0];
 if(before&&before.Status!=='DRAFT')throw invalid('Assessment configuration is editable only in DRAFT.',409);
 const after=(await c.query(`INSERT INTO "OJTAssessmentWindows" ("OJTSemesterID","BlockPeriodID","OpensAt","ClosesAt","Reason","ConfiguredBy") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("OJTSemesterID") DO UPDATE SET "BlockPeriodID"=EXCLUDED."BlockPeriodID","OpensAt"=EXCLUDED."OpensAt","ClosesAt"=EXCLUDED."ClosesAt","Reason"=EXCLUDED."Reason","ConfiguredBy"=EXCLUDED."ConfiguredBy","ConfiguredAt"=now() RETURNING *`,[semesterId,w.BlockPeriodID,w.OpensAt,w.ClosesAt,reason,actor])).rows[0];
 await audit(c,actor,'OJTSemesters',semesterId,'CONFIGURE_ASSESSMENT',before,after,reason);return after;
 });
}
export async function assessmentDetails(id:number) {return academicTransaction(c=>getAssessment(c,id));}
export async function changeAssessment(id:number,action:'open'|'close',body:unknown,actor:number) {
 const b=inputObject(body,action==='open'?['reason','resultsFinalized']:['reason']),reason=requiredText(b.reason,'reason',2000);
 if(action==='open'&&b.resultsFinalized!==true)throw invalid('Explicitly acknowledge resultsFinalized: true after completing Block 3 result updates.');
 return academicTransaction(async c=>{
 const w=await getAssessment(c,id);await assessmentBounds(c,w);const now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
 if(action==='open'&&(now<new Date(w.OpensAt)||now>=new Date(w.ClosesAt)))throw invalid('Outside the configured official assessment interval.',409,'OJT_ASSESSMENT_NOT_OPEN');
 const status=action==='open'?'OPEN':'CLOSED';if(w.Status===status)return w;if(action==='close'&&w.Status!=='OPEN')throw invalid('Only an open assessment can be closed.',409);
 const after=(await c.query(`UPDATE "OJTAssessmentWindows" SET "Status"=$2,${action==='open'?'"ResultsFinalizedBy"=$3,"ResultsFinalizedAt"=clock_timestamp()':'"ClosedBy"=$3,"ClosedAt"=now()'},"Reason"=$4 WHERE "OJTSemesterID"=$1 RETURNING *`,[id,status,actor,reason])).rows[0];
 await audit(c,actor,'OJTSemesters',id,action==='open'?'OPEN_ASSESSMENT':'CLOSE_ASSESSMENT',w,after,reason);return after;
 });
}
export async function assertOfficialAssessment(c:PoolClient,check:Row) {
 const w=await getAssessment(c,check.OJTSemesterID);await assessmentBounds(c,w);const now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
 if(w.Status!=='OPEN'||!w.ResultsFinalizedAt||now<new Date(w.OpensAt)||now>=new Date(w.ClosesAt))throw invalid('Official assessment is not open.',409,'OJT_ASSESSMENT_NOT_OPEN');
 await relativeSemester(c,check.StudentID,w.BlockPeriodID);
 if(new Date(check.CheckedAt)<new Date(w.ResultsFinalizedAt))throw invalid('Run a new eligibility check after Block 3 results were finalized.',409,'OJT_CHECK_BEFORE_RESULTS_FINALIZED');return w;
}
function gradeBands(value:unknown,scale:number) {
 if(!Array.isArray(value)||!value.length||value.length>30)throw invalid('gradeBands must contain 1–30 explicitly configured bands.');
 const bands=value.map(v=>{const b=inputObject(v,['minimumScore','outcome','gradePoints','grade']),minimum=score(b.minimumScore,10,'minimumScore');if(minimum===null)throw invalid('minimumScore is required.');const gp=score(b.gradePoints,4,'gradePoints');if(scale===4&&gp===null)throw invalid('Every band requires gradePoints for GPA scale 4.');return {minimumScore:minimum,outcome:enumValue(b.outcome,['PASSED','FAILED'],'outcome'),gradePoints:gp,grade:optionalText(b.grade,'grade',2)};}).sort((a,b)=>a.minimumScore-b.minimumScore);
 if(bands[0].minimumScore!==0||new Set(bands.map(b=>b.minimumScore)).size!==bands.length)throw invalid('Bands must start at 0 and have distinct minimum scores.');return bands;
}
export async function saveGradeMapping(programId:number,semesterId:number,body:unknown,actor:number) {
 const b=inputObject(body,['courseId','academicPeriodId','gradeBands','reason']),courseId=positiveId(b.courseId,'courseId'),periodId=positiveId(b.academicPeriodId,'academicPeriodId'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
 const program=(await c.query(`SELECT p."Status",g."GpaScale" FROM "TrainingPrograms" p LEFT JOIN "AcademicGradingPolicies" g ON g."ProgramID"=p."ProgramID" WHERE p."ProgramID"=$1`,[programId])).rows[0];if(!program)throw invalid('Curriculum not found.',404);
 if(program.Status!=='PUBLISHED'||!program.GpaScale)throw invalid('A published curriculum with an explicit GPA scale is required.',409);
 const term=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rows[0];if(!term)throw invalid('OJT semester not found.',404);
 if(!(await c.query(`SELECT 1 FROM "ProgramCourses" WHERE "ProgramID"=$1 AND "CourseID"=$2 AND "EntryKind"='COURSE'`,[programId,courseId])).rowCount)throw invalid('OJT course must be an actual course in this curriculum.');
 const period=await actualPeriod(c,periodId);if(period.AcademicYearID!==term.AcademicYearID||(term.StartDate&&periodBounds(period).end<=new Date(dayString(term.StartDate)+'T00:00:00+07:00')))throw invalid('Grade period must belong to the OJT academic year and must not end before OJT starts.');
 const bands=gradeBands(b.gradeBands,program.GpaScale),before=(await c.query('SELECT * FROM "ProgramOJTGradeMappings" WHERE "ProgramID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE',[programId,semesterId])).rows[0];
 if(before&&(await c.query('SELECT 1 FROM "OJTResults" WHERE "GradeMappingID"=$1',[before.MappingID])).rowCount)throw invalid('A mapping used by an official OJT result is immutable.',409,'OJT_GRADE_MAPPING_IN_USE');
 const after=(await c.query(`INSERT INTO "ProgramOJTGradeMappings" ("ProgramID","OJTSemesterID","CourseID","AcademicPeriodID","GradeBands","Reason","ConfirmedBy") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("ProgramID","OJTSemesterID") DO UPDATE SET "CourseID"=EXCLUDED."CourseID","AcademicPeriodID"=EXCLUDED."AcademicPeriodID","GradeBands"=EXCLUDED."GradeBands","Reason"=EXCLUDED."Reason","ConfirmedBy"=EXCLUDED."ConfirmedBy","ConfirmedAt"=now() RETURNING *`,[programId,semesterId,courseId,periodId,JSON.stringify(bands),reason,actor])).rows[0];
 await audit(c,actor,'ProgramOJTGradeMappings',after.MappingID,'SET_OJT_GRADE_MAPPING',before,after,reason);return after;
 });
}
export async function gradeMappingDetails(programId:number,semesterId:number) {return academicTransaction(async c=>{const m=(await c.query('SELECT * FROM "ProgramOJTGradeMappings" WHERE "ProgramID"=$1 AND "OJTSemesterID"=$2',[programId,semesterId])).rows[0];if(!m)throw invalid('OJT grade mapping not found.',404);return m;});}
