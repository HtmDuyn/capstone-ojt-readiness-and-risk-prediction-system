import type { PoolClient } from 'pg';
import { summaryWithClient,supplementaryWithClient,curriculumWithClient } from '../student-portal/academic.service';
import { officialEvaluationRelation } from '../ojt-results/official-evaluation';
import { readTransaction } from '../qhdn/read.repository';
import { studentSelect, resultSelect } from './student.service';
import { loadAcademicProgress,progressFromData } from './academic-progress';
import { officialEligibilityWithClient,eligibility,history } from '../eligibility/eligibility.service';
import { admissionEligibilityWithClient } from '../eligibility/admission.service';
import { enrichListRows } from '../../shared/list-context';
import { invalid, pagination, positiveId, enumValue } from './student.validation';
import type { Actor } from '../ojt-registration/window.service';

type Row = Record<string, any>;
export async function studentProfile(id:number,params:Row,actor:Actor,existingClient?:PoolClient) {
  const section=enumValue(params.section??'all',['all','academicProgress'],'section');
  const sections=['academicProgress','courseResults','comboSelections','ojtRegistrations','eligibility','eligibilityChecks','comboHistory','academic','curriculum'];
  const allowed=['section','include','resultsPage','resultsLimit','courseId','academicPeriodId','courseStatus','ojtPage','ojtLimit','ojtSemesterId','checksPage','checksLimit','comboPage','comboLimit'];
  if(params.include!==undefined&&(typeof params.include!=='string'||!params.include.length))throw invalid('include must be a comma-separated list.');
  if(params.include!==undefined&&params.section!==undefined)throw invalid('Use include or section, not both.');
  const selectedSections=params.include===undefined?(section==='academicProgress'?['academicProgress']:sections):params.include.split(',');
  if(selectedSections.some((key:string)=>!sections.includes(key))||new Set(selectedSections).size!==selectedSections.length)throw invalid('Unknown or duplicate profile include section.');
  const includes=new Set<string>(selectedSections);
  const needsProgress=['academicProgress','academic','eligibility'].some(key=>includes.has(key));
  const checksPage=pagination({page:params.checksPage,limit:params.checksLimit},[]);
  const comboPage=pagination({page:params.comboPage,limit:params.comboLimit},[]);
  for(const key of Object.keys(params))if(!allowed.includes(key))throw invalid('Unknown profile parameter: '+key);
  const resultsPage=pagination({page:params.resultsPage,limit:params.resultsLimit},[]);
  const ojtPage=pagination({page:params.ojtPage,limit:params.ojtLimit},[]);
  if([resultsPage,ojtPage,checksPage,comboPage].some(p=>p.offset>2147483647))throw invalid('Pagination exceeds allowed range.');
  const selected=params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId');
  return readTransaction(async c=>{
    const profile=(await c.query(studentSelect+' WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL',[id])).rows[0];
    if(!profile)throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
    if(!['ADMIN','ACADEMIC'].includes(actor.roleCode)&&(actor.roleCode!=='STUDENT'||profile.userId!==actor.userId))throw invalid('You cannot access this student.',403,'FORBIDDEN');
    if(selected&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[selected])).rowCount)throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');
    const source=needsProgress?await loadAcademicProgress(c,id):undefined;
    const academicProgress=source?progressFromData(source):undefined;
    const output:Row={...profile};
    if(includes.has('academicProgress'))output.academicProgress=academicProgress;
    if(includes.has('courseResults')) {
      const filters=['r."StudentID"=$1'],args:unknown[]=[id];
      for(const [key,column]of [['courseId','CourseID'],['academicPeriodId','AcademicPeriodID'],['courseStatus','Status']] as const)if(params[key]!==undefined){args.push(key==='courseStatus'?enumValue(params[key],['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED'],key):positiveId(params[key],key));filters.push('r."'+column+'"=$'+args.length);}
      const matches=(row:Row)=>(params.courseId===undefined||row.courseId===positiveId(params.courseId,'courseId'))&&(params.academicPeriodId===undefined||row.academicPeriodId===positiveId(params.academicPeriodId,'academicPeriodId'))&&(params.courseStatus===undefined||row.status===params.courseStatus);
      const rows=source?.attempts.filter(matches);
      const total=rows?rows.length:(await c.query('SELECT count(*)::int n FROM "StudentCourseResults" r WHERE '+filters.join(' AND '),args)).rows[0].n;
      const order=(a:Row,b:Row)=>Number(!!b.periodStartDate)-Number(!!a.periodStartDate)||(b.periodStartDate&&a.periodStartDate?new Date(b.periodStartDate).getTime()-new Date(a.periodStartDate).getTime():0)||b.attemptNumber-a.attemptNumber||b.id-a.id;
      const items=rows?rows.sort(order).slice(resultsPage.offset,resultsPage.offset+resultsPage.limit):(await c.query(resultSelect+' WHERE '+filters.join(' AND ')+' ORDER BY "periodStartDate" DESC NULLS LAST,"attemptNumber" DESC,id DESC LIMIT $'+(args.length+1)+' OFFSET $'+(args.length+2),[...args,resultsPage.limit,resultsPage.offset])).rows;
      output.courseResults={items:await enrichListRows(c,items),total,page:resultsPage.page,limit:resultsPage.limit};
    }
    if(includes.has('comboSelections')){
    const comboSelections=(await c.query(`SELECT sc."SelectionID" AS id,sc."ProgramComboID" AS "comboId",sc."SelectionPurpose" AS purpose,
      b."ComboCode" AS code,b."ComboName" AS name,sc."ConfirmedAt" AS "confirmedAt",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',cc."CourseID",'code',co."CourseCode",'name',cc."CourseName",'credits',cc."Credits") ORDER BY cc."ComboCourseID")
      FROM "StudentComboCourseSelections" picked JOIN "ComboCourses" cc ON cc."ComboCourseID"=picked."ComboCourseID" JOIN "Courses" co ON co."CourseID"=cc."CourseID" WHERE picked."SelectionID"=sc."SelectionID"),'[]'::jsonb) AS courses
      FROM "StudentComboSelections" sc JOIN "ProgramCombos" b ON b."ProgramComboID"=sc."ProgramComboID"
      WHERE sc."StudentID"=$1 AND sc."ProgramID"=$2 AND sc."ConfirmedAt" IS NOT NULL ORDER BY sc."SelectionID"`,[id,profile.programId])).rows;
    output.comboSelections=comboSelections;
    }
    if(includes.has('ojtRegistrations')){
    const totalOjt=(await c.query('SELECT count(*)::int AS n FROM "OJTRegistrations" WHERE "StudentID"=$1 AND ($2::int IS NULL OR "OJTSemesterID"=$2)',[id,selected])).rows[0].n;
    const registrations=(await c.query(`SELECT r."RegistrationID" AS id,r."OJTSemesterID" AS "ojtSemesterId",r."WindowID" AS "windowId",r."Status" AS status,r."Application" AS application,r."RegisteredAt" AS "registeredAt",
      jsonb_build_object('id',term."OJTSemesterID",'code',term."SemesterCode",'name',term."Name",'academicPeriodId',term."AcademicPeriodID") AS semester,
      CASE WHEN co."CoordinationID" IS NULL THEN NULL ELSE jsonb_build_object('id',co."CoordinationID",'decision',co."Decision",'rejectReason',co."RejectReason",'introducedAt',co."CoordinatedAt",'companyId',e."EnterpriseID",'companyName',e."Name",'positionId',pos."PositionID",'positionTitle',pos."Title",'company',jsonb_build_object('id',e."EnterpriseID",'name',e."Name",'address',e."Address",'contactPersonName',e."ContactPersonName",'contactPhone',e."ContactPhone",'contactEmail',e."ContactEmail"),'position',jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title",'description',pos."Description",'requirements',pos."Requirements",'location',pos."Location",'workMode',pos."WorkMode")) END AS coordination,
      CASE WHEN a."AssignmentID" IS NULL THEN NULL ELSE jsonb_build_object('id',a."AssignmentID",'status',a."Status",'startDate',a."StartDate",'endDate',a."EndDate",'supervisor',a."EnterpriseSupervisorName",'academicSupervisor',CASE WHEN school."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',school."UserID",'fullName',school."FullName",'email',school."Email",'phone',school."Phone") END) END AS assignment,
      CASE WHEN ev."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object('id',ev."EvaluationID",'overallScore',ev."OverallScore",'completionScore',ev."CompletionScore",'attitudeScore',ev."AttitudeScore",'skillScore',ev."SkillScore",'comments',ev."Comments",'status',ev."Status",'templateId',ev."TemplateID",'scoreDetails',ev."ScoreDetails",'evaluatedAt',ev."EvaluatedAt") END AS evaluation,
      CASE WHEN outcome."ResultID" IS NULL THEN NULL ELSE jsonb_build_object('id',outcome."ResultID",'status',outcome."Status",'officialScore',CASE WHEN outcome."Status"='CONFIRMED' THEN outcome."OfficialScore" ELSE NULL END,'outcome',CASE WHEN outcome."Status"='CONFIRMED' THEN outcome."Outcome" ELSE NULL END,'confirmedAt',outcome."ConfirmedAt") END AS result
      FROM "OJTRegistrations" r JOIN "OJTSemesters" term ON term."OJTSemesterID"=r."OJTSemesterID"
      LEFT JOIN LATERAL (SELECT * FROM "StudentEnterpriseCoordination" latest WHERE latest."RegistrationID"=r."RegistrationID" ORDER BY latest."CoordinationID" DESC LIMIT 1) co ON true
      LEFT JOIN "Enterprises" e ON e."EnterpriseID"=co."EnterpriseID" LEFT JOIN "InternshipPositions" pos ON pos."PositionID"=co."PositionID"
      LEFT JOIN "InternshipAssignments" a ON a."CoordinationID"=co."CoordinationID" LEFT JOIN "InternshipEvaluations" ev ON ev."AssignmentID"=a."AssignmentID"
        AND (${actor.roleCode==='STUDENT'?'EXISTS (SELECT 1 FROM "OJTResults" published WHERE published."AssignmentID"=a."AssignmentID" AND published."Status"=\'CONFIRMED\')':'true'})
      LEFT JOIN ${officialEvaluationRelation} outcome ON outcome."AssignmentID"=a."AssignmentID" LEFT JOIN "Users" school ON school."UserID"=a."AcademicSupervisorID"
      WHERE r."StudentID"=$1 AND ($2::int IS NULL OR r."OJTSemesterID"=$2) ORDER BY r."RegistrationID" DESC LIMIT $3 OFFSET $4`,[id,selected,ojtPage.limit,ojtPage.offset])).rows;
    for(const registration of registrations){
      const {cvUrl,...application}=registration.application??{};
      registration.application={...application,cv:profile.cv};
    }
    output.ojtRegistrations={items:registrations,total:totalOjt,page:ojtPage.page,limit:ojtPage.limit};
    }
    // The selected semester is independent of historical-registration pagination.
    // Before registration exists, resolve curriculum stage 6 through the cohort calendar mapping;
    // the current period can still be semester 5 while preparing for the upcoming OJT.
    const semesterId=selected??(await c.query(`SELECT "OJTSemesterID" FROM "OJTRegistrations" WHERE "StudentID"=$1 ORDER BY "RegistrationID" DESC LIMIT 1`,[id])).rows[0]?.OJTSemesterID??
      (await c.query(`SELECT o."OJTSemesterID" FROM "StudentAcademicPlacements" placement
       JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=placement."EntryAcademicPeriodID" AND entry."Kind"='SEMESTER'
       JOIN "AcademicPeriods" target ON target."Kind"='SEMESTER' AND target."StartDate">=entry."StartDate"
       JOIN "OJTSemesters" o ON o."AcademicPeriodID"=target."AcademicPeriodID"
       WHERE placement."StudentID"=$1 AND "StudentCurriculumSemester"(placement."StudentID",target."AcademicPeriodID")=6
       ORDER BY target."StartDate",o."OJTSemesterID" LIMIT 1`,[id])).rows[0]?.OJTSemesterID??null;
    output.ojtSemesterId=semesterId;
    const decision=semesterId&&(includes.has('eligibility')||includes.has('academic'))?await eligibility(id,{ojtSemesterId:semesterId},c,academicProgress,source):null;
    const official=decision?decision.official:(semesterId&&needsProgress?await officialEligibilityWithClient(c,id,semesterId,{lockSource:false,progress:academicProgress}):null);
    if(needsProgress){output.officialEligibility=official;output.officialDecision=!official||official.isStale?'REVIEW_REQUIRED':official.status;output.admissionEligibility=semesterId?await admissionEligibilityWithClient(c,id,semesterId):null;}
    if(includes.has('eligibility'))output.eligibility=decision;
    if(includes.has('eligibilityChecks'))output.eligibilityChecks=await history(id,{...(selected?{ojtSemesterId:selected}:{}),page:params.checksPage,limit:params.checksLimit},c);
    if(includes.has('academic')){
      const academic=semesterId?await summaryWithClient(c,id,semesterId,source,decision??undefined):null;
      output.academic=academic?{...academic,supplementaryCourses:await supplementaryWithClient(c,id,profile.programId,academic)}:null;
    }
    if(includes.has('curriculum')){
      output.curriculum=profile.program?.status==='PUBLISHED'?await curriculumWithClient(c,id,profile.programId):null;
      output.curriculumStatus=profile.program?.status??'NOT_ASSIGNED';
    }
    if(includes.has('comboHistory')){
      const comboHistory=(await c.query(`SELECT e."EventID" AS id,e."WindowID" AS "windowId",e."ProgramComboID" AS "comboId",e."CourseIDs" AS "courseIds",
        w."AcademicPeriodID" AS "academicPeriodId",w."OJTSemesterID" AS "ojtSemesterId",w."Name" AS "windowName",w."Phase" AS phase,w."InitialWindowID" AS "initialWindowId",
        e."EventType" AS type,e."ChoiceSnapshot" AS choice,e."PreviousSnapshot" AS previous,e."Reason" AS reason,e."CreatedBy" AS "createdBy",e."CreatedAt" AS "createdAt",e."SourceEventID" AS "sourceEventId",
        r."Progress" AS progress,r."Eligibility" AS eligibility FROM "StudentComboSelectionEvents" e
        JOIN "ComboRegistrationWindows" w ON w."WindowID"=e."WindowID" LEFT JOIN "StudentAcademicRecalculations" r ON r."EventID"=e."EventID"
        WHERE e."StudentID"=$1 ORDER BY e."EventID" DESC LIMIT $2 OFFSET $3`,[id,comboPage.limit,comboPage.offset])).rows;
      const total=(await c.query('SELECT count(*)::int n FROM "StudentComboSelectionEvents" WHERE "StudentID"=$1',[id])).rows[0].n;
      output.comboHistory={items:await enrichListRows(c,comboHistory),total,page:comboPage.page,limit:comboPage.limit};
    }
    return (await enrichListRows(c,[output]))[0];
  },existingClient);
}
