import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import { invalid, pagination, positiveId, enumValue } from './student.validation';
import { combos } from '../curriculum/curriculum.repository';
import { purpose } from '../combo-registration/combo.validation';
import { activeChoice } from '../combo-registration/combo.repository';
import { assertRosterContext } from '../combo-registration/selection.service';
import type { Actor, Row } from '../ojt-registration/window.service';

const blockerLabels:Record<string,string>={
  STUDENT_OR_CURRICULUM_INACTIVE:'Hồ sơ sinh viên hoặc chương trình chưa sẵn sàng.',
  WINDOW_NOT_OPEN:'Đợt đăng ký chưa mở hoặc đã đóng.',WINDOW_NOT_STARTED:'Chưa đến thời gian đăng ký.',WINDOW_EXPIRED:'Đã hết hạn đăng ký.',
  COMBO_ROSTER_CHANGED:'Lộ trình hoặc hồ sơ đã thay đổi; cần Phòng đào tạo rà soát.',
  COMBO_OPTIONS_UNAVAILABLE:'Chưa có combo hợp lệ để lựa chọn.',REGISTRATION_ALREADY_EXISTS:'Hồ sơ đã được nộp hoặc đang được xử lý.',
  ACTUAL_PATHWAY_REQUIRED:'Chưa có lộ trình phù hợp với kỳ đăng ký.',OJT_REGISTRATION_SEMESTER_MISMATCH:'Chưa đúng kỳ chuyên ngành được đăng ký.',
  REGISTRATION_PERIOD_MISMATCH:'Kỳ đăng ký chưa khớp với kỳ OJT.'
};

async function ownStudent(c:PoolClient,userId:number):Promise<Row> {
  const s=(await c.query(`SELECT s.*,u."FullName",u."Email",u."Phone",p."CohortID",p."GroupCode",p."EntryAcademicPeriodID",to_jsonb(tp)->>'Status' AS "ProgramStatus",tp."SpecializationID"
    FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
    LEFT JOIN "TrainingPrograms" tp ON tp."ProgramID"=s."ProgramID" WHERE s."UserID"=$1 AND s."DeletedAt" IS NULL`,[userId])).rows[0];
  if(!s)throw invalid('Student profile not found.',404,'STUDENT_NOT_FOUND');return s;
}
async function blocker(work:()=>Promise<unknown>):Promise<string|null> {
  try{await work();return null;}catch(error:any){if(error.statusCode>=400&&error.statusCode<500)return error.errorCode??'ACADEMIC_CONTEXT_INVALID';throw error;}
}
const periodFields=`jsonb_build_object('id',p."AcademicPeriodID",'code',p."PeriodCode",'name',p."Name",'kind',p."Kind",'startDate',p."StartDate",'endDate',p."EndDate") AS period,
  jsonb_build_object('id',o."OJTSemesterID",'code',o."SemesterCode",'name',o."Name") AS semester`;

// Student projections deliberately omit cohort rosters, raw Scope and staff summaries.
export async function studentWindows(kind:'ojt'|'combo',params:Row,actor:Actor) {
  if(actor.roleCode!=='STUDENT')throw invalid('Student role required.',403,'FORBIDDEN');
  const page=pagination(params,kind==='combo'?['phase','status','academicPeriodId']:['status','ojtSemesterId']);
  if(page.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const status=params.status===undefined?null:enumValue(params.status,kind==='combo'?['DRAFT','OPEN','CLOSED','FINALIZED']:['DRAFT','OPEN','CLOSED'],'status');
  return readTransaction(async c=>{
    const s=await ownStudent(c,actor.userId),args:unknown[]=[s.StudentID];
    const where=[`w."Status"<>'DRAFT'`];
    const add=(condition:string,value:unknown)=>{args.push(value);where.push(condition.replace('?',`$${args.length}`));};
    if(status)add('w."Status"=?',status);
    let from:string;
    if(kind==='combo'){
      from=`FROM "ComboRegistrationWindows" w JOIN "ComboWindowStudents" own ON own."WindowID"=w."WindowID" AND own."StudentID"=$1`;
      if(params.phase!==undefined)add('w."Phase"=?',enumValue(params.phase,['INITIAL','CONFIRMATION'],'phase'));
      if(params.academicPeriodId!==undefined)add('w."AcademicPeriodID"=?',positiveId(params.academicPeriodId,'academicPeriodId'));
    }else{
      from='FROM "OJTRegistrationWindows" w';
      // Bind the authenticated student, never a studentId supplied by the caller.
      where.push('EXISTS (SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=$1 AND h."OJTSemesterID"=w."OJTSemesterID")');
      for(const [key,value,type]of [['programIds',s.ProgramID,'int'],['cohortIds',s.CohortID,'int'],['majorIds',s.SpecializationID,'int'],['studentIds',s.StudentID,'int'],['groupCodes',s.GroupCode,'text']] as const){
        args.push(value??null);where.push(`(NOT (w."Scope" ? '${key}') OR w."Scope"->'${key}' @> jsonb_build_array($${args.length}::${type}))`);
      }
      if(params.ojtSemesterId!==undefined)add('w."OJTSemesterID"=?',positiveId(params.ojtSemesterId,'ojtSemesterId'));
    }
    from+=' JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=w."AcademicPeriodID" JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID"';
    const filter=' WHERE '+where.join(' AND '),total=(await c.query('SELECT count(*)::int AS n '+from+filter,args)).rows[0].n;
    const extra=kind==='combo'?`,own."ProgramID" AS "RosterProgramID",own."ScopeSnapshot" AS "RosterSnapshot",
      GREATEST(w."EndsAt",COALESCE((SELECT max(ext."EndsAt") FROM "ComboExtensionStudents" es JOIN "ComboWindowExtensions" ext ON ext."ExtensionID"=es."ExtensionID" WHERE es."WindowID"=w."WindowID" AND es."StudentID"=$1),w."EndsAt")) AS "EffectiveEndsAt",
      (SELECT jsonb_build_object('comboId',ev."ProgramComboID",'courseIds',ev."CourseIDs",'choice',ev."ChoiceSnapshot",'submittedAt',ev."CreatedAt") FROM "StudentComboSelectionEvents" ev WHERE ev."WindowID"=w."WindowID" AND ev."StudentID"=$1 AND ev."EventType"='SUBMITTED' ORDER BY ev."EventID" DESC LIMIT 1) AS selection`:
      `,(SELECT jsonb_build_object('id',r."RegistrationID",'status',r."Status",'application',r."Application",'registeredAt',r."RegisteredAt",'hasCoordination',EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" co WHERE co."RegistrationID"=r."RegistrationID")) FROM "OJTRegistrations" r WHERE r."StudentID"=$1 AND r."OJTSemesterID"=w."OJTSemesterID") AS registration`;
    const rows=(await c.query(`SELECT w.*,${periodFields}${extra} ${from}${filter} ORDER BY w."WindowID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    const now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
    const options=kind==='combo'&&rows.length&&s.ProgramStatus==='PUBLISHED'?(await combos(c,s.ProgramID)).filter(b=>b.coursesReviewed&&b.choiceGroups.length&&purpose({ComboCode:b.code,SelectionGroup:b.selectionGroup})==='SPECIALIZATION'):[];
    const confirmed=kind==='combo'&&rows.length?(await activeChoice(c,s.StudentID,s.ProgramID))[0]??null:null;
    const items:Row[]=[];
    for(const w of rows){
      const end=w.EffectiveEndsAt??w.EndsAt,reasons:string[]=[];
      if(s.Status!=='ACTIVE'||(s.ProgramStatus!=null&&s.ProgramStatus!=='PUBLISHED'))reasons.push('STUDENT_OR_CURRICULUM_INACTIVE');
      if(w.Status!=='OPEN')reasons.push('WINDOW_NOT_OPEN');
      if(now<new Date(w.StartsAt))reasons.push('WINDOW_NOT_STARTED');
      if(now>=new Date(end))reasons.push('WINDOW_EXPIRED');
      let pathway:unknown=null;
      const contextIssue=await blocker(async()=>{
        if(kind==='combo')await assertRosterContext(c,{studentId:s.StudentID,programId:w.RosterProgramID,scopeSnapshot:w.RosterSnapshot});
        else pathway={admissionSource:'ACADEMIC_HANDOFF'};
      });
      if(contextIssue)reasons.push(contextIssue);
      if(kind==='combo'&&!options.length)reasons.push('COMBO_OPTIONS_UNAVAILABLE');
      if(kind==='ojt'&&w.registration&&(w.registration.status!=='REJECTED'||w.registration.hasCoordination))reasons.push('REGISTRATION_ALREADY_EXISTS');
      items.push({id:w.WindowID,name:w.Name,academicPeriodId:w.AcademicPeriodID,ojtSemesterId:w.OJTSemesterID,
        period:w.period,semester:w.semester,startsAt:w.StartsAt,endsAt:w.EndsAt,effectiveEndsAt:end,status:w.Status,
        canSubmit:reasons.length===0,blockingReasons:reasons,blockingMessages:reasons.map(code=>blockerLabels[code]??'Lộ trình hoặc cấu hình đợt đăng ký chưa phù hợp.'),
        ...(kind==='combo'?{phase:w.Phase,initialWindowId:w.InitialWindowID,selection:w.selection,confirmedSelection:confirmed,
          reasonRequiredOnChange:!!(w.selection||confirmed),availableCombos:w.RosterProgramID===s.ProgramID?options:[]}:
          {requiredRelativeSemester:w.RequiredRelativeSemester,pathway,registration:w.registration})});
    }
    return {studentId:s.StudentID,student:{id:s.StudentID,studentCode:s.StudentCode,fullName:s.FullName,email:s.Email,phone:s.Phone},items,total,page:page.page,limit:page.limit};
  });
}
