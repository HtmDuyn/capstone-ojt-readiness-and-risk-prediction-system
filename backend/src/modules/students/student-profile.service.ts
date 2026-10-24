import { officialEvaluationRelation } from '../ojt-results/official-evaluation';
import { readTransaction } from '../qhdn/read.repository';
import { studentSelect, resultSelect } from './student.service';
import { academicProgressWithClient } from './academic-progress';
import { officialEligibilityWithClient,eligibility,history } from '../eligibility/eligibility.service';
import { enrichListRows } from '../../shared/list-context';
import { invalid, pagination, positiveId, enumValue } from './student.validation';
import type { Actor } from '../ojt-registration/window.service';

type Row = Record<string, any>;
export async function studentProfile(id:number,params:Row,actor:Actor) {
  const section=enumValue(params.section??'all',['all','academicProgress'],'section');
  const allowed=['section','resultsPage','resultsLimit','ojtPage','ojtLimit','ojtSemesterId'];
  for(const key of Object.keys(params))if(!allowed.includes(key))throw invalid('Unknown profile parameter: '+key);
  const resultsPage=pagination({page:params.resultsPage,limit:params.resultsLimit},[]);
  const ojtPage=pagination({page:params.ojtPage,limit:params.ojtLimit},[]);
  if(resultsPage.offset>2147483647||ojtPage.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const selected=params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId');
  return readTransaction(async c=>{
    const profile=(await c.query(studentSelect+' WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL',[id])).rows[0];
    if(!profile)throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
    if(!['ADMIN','ACADEMIC'].includes(actor.roleCode)&&(actor.roleCode!=='STUDENT'||profile.userId!==actor.userId))throw invalid('You cannot access this student.',403,'FORBIDDEN');
    if(selected&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[selected])).rowCount)throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');
    const academicProgress=await academicProgressWithClient(c,id);
    if(section==='academicProgress')return {...profile,academicProgress};
    const totalResults=(await c.query('SELECT count(*)::int AS n FROM "StudentCourseResults" WHERE "StudentID"=$1',[id])).rows[0].n;
    const resultItems=(await c.query(resultSelect+' WHERE r."StudentID"=$1 ORDER BY "periodStartDate" DESC NULLS LAST,"attemptNumber" DESC,id DESC LIMIT $2 OFFSET $3',[id,resultsPage.limit,resultsPage.offset])).rows;
    const comboSelections=(await c.query(`SELECT sc."SelectionID" AS id,sc."ProgramComboID" AS "comboId",sc."SelectionPurpose" AS purpose,
      b."ComboCode" AS code,b."ComboName" AS name,sc."ConfirmedAt" AS "confirmedAt",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',cc."CourseID",'code',co."CourseCode",'name',cc."CourseName",'credits',cc."Credits") ORDER BY cc."ComboCourseID")
      FROM "StudentComboCourseSelections" picked JOIN "ComboCourses" cc ON cc."ComboCourseID"=picked."ComboCourseID" JOIN "Courses" co ON co."CourseID"=cc."CourseID" WHERE picked."SelectionID"=sc."SelectionID"),'[]'::jsonb) AS courses
      FROM "StudentComboSelections" sc JOIN "ProgramCombos" b ON b."ProgramComboID"=sc."ProgramComboID"
      WHERE sc."StudentID"=$1 AND sc."ProgramID"=$2 AND sc."ConfirmedAt" IS NOT NULL ORDER BY sc."SelectionID"`,[id,profile.programId])).rows;
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
      LEFT JOIN ${officialEvaluationRelation} outcome ON outcome."AssignmentID"=a."AssignmentID" LEFT JOIN "Users" school ON school."UserID"=a."AcademicSupervisorID"
      WHERE r."StudentID"=$1 AND ($2::int IS NULL OR r."OJTSemesterID"=$2) ORDER BY r."RegistrationID" DESC LIMIT $3 OFFSET $4`,[id,selected,ojtPage.limit,ojtPage.offset])).rows;
    for(const registration of registrations){
      const {cvUrl,...application}=registration.application??{};
      registration.application={...application,cv:profile.cv};
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
    const official=semesterId?await officialEligibilityWithClient(c,id,semesterId,{lockSource:false,progress:academicProgress}):null;
    const officialDecision=!official||official.isStale?'REVIEW_REQUIRED':official.status;
    const eligibilityResults=await eligibility(id,selected?{ojtSemesterId:selected}:{},c,academicProgress);
    const eligibilityChecks=await history(id,selected?{ojtSemesterId:selected}:{},c);
    const comboHistory=(await c.query(`SELECT "EventID" AS id,"WindowID" AS "windowId","ProgramComboID" AS "comboId","CourseIDs" AS "courseIds",
      "EventType" AS type,"ChoiceSnapshot" AS choice,"PreviousSnapshot" AS previous,"Reason" AS reason,"CreatedBy" AS "createdBy","CreatedAt" AS "createdAt"
      FROM "StudentComboSelectionEvents" WHERE "StudentID"=$1 ORDER BY "EventID" DESC LIMIT 20`,[id])).rows;
    const comboHistoryTotal=(await c.query('SELECT count(*)::int n FROM "StudentComboSelectionEvents" WHERE "StudentID"=$1',[id])).rows[0].n;
    return {...profile,academicProgress,comboSelections,officialDecision,
      eligibility:eligibilityResults,eligibilityChecks,comboHistory:{items:await enrichListRows(c,comboHistory),total:comboHistoryTotal,page:1,limit:20},
      courseResults:{items:resultItems,total:totalResults,page:resultsPage.page,limit:resultsPage.limit},
      ojtRegistrations:{items:registrations,total:totalOjt,page:ojtPage.page,limit:ojtPage.limit},
      ojtSemesterId:semesterId,officialEligibility:official};
  });
}
