import { cvMetadataSql } from '../students/cv.service';
import { decryptCv } from '../student-portal/cv.service';
import { postSelect,postApi } from '../recruitment/recruitment.repository';
import { officialEvaluationRelation } from '../ojt-results/official-evaluation';
import { gradingCriteriaSelection } from '../academic/grading-criteria.service';
import { enrichListRows } from '../../shared/list-context';
import { readTransaction } from '../qhdn/read.repository';
import { templateField } from '../qhdn/context-fields';
import { api } from '../qhdn/catalog.service';
import { enterpriseScope } from '../qhdn/qhdn.repository';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { enterpriseSemesterStatusSql, visibleEnterpriseSemester } from './enterprise-periods';

const applicationCertificates='ja."CertificateLinks"';

const position = `jsonb_build_object('id',p."PositionID",'code',p."RecruitmentCode",'location',p."Location",'workMode',p."WorkMode",'title',p."Title",'description',p."Description",'requirements',p."Requirements",'ojtSemesterId',p."OJTSemesterID")`;
const student = `jsonb_build_object(
    'id',s."StudentID",
    'studentCode',s."StudentCode",
    'fullName',u."FullName",
    'email',u."Email",
    'phone',u."Phone",
    'status',s."Status",
    'accountStatus',u."Status",
    'programId',s."ProgramID",
    'programCode',(SELECT tp."ProgramCode" FROM "TrainingPrograms" tp WHERE tp."ProgramID"=s."ProgramID"),
    'programName',(SELECT tp."ProgramName" FROM "TrainingPrograms" tp WHERE tp."ProgramID"=s."ProgramID"),
    'enrollmentYear',s."EnrollmentYear",
    'currentSemester',s."CurrentSemester",
    'cohortId',(SELECT sap."CohortID" FROM "StudentAcademicPlacements" sap WHERE sap."StudentID"=s."StudentID"),
    'groupCode',(SELECT sap."GroupCode" FROM "StudentAcademicPlacements" sap WHERE sap."StudentID"=s."StudentID")
  )`;

const cvMetadata = `jsonb_build_object(
    'id',cv."CVID",
    'studentId',cv."StudentID",
    'filename',cv."Filename",
    'fileName',cv."Filename",
    'mimeType',cv."MimeType",
    'sizeBytes',cv."SizeBytes",
    'size',cv."SizeBytes",
    'sha256',cv."Sha256",
    'createdAt',cv."CreatedAt",
    'uploadedAt',cv."CreatedAt"
  )`;

const applicationDetails = `(SELECT jsonb_build_object('id',ja."ApplicationID",'postId',ja."PostID",'coverLetter',ja."CoverLetter",'certificates',${applicationCertificates},'appliedAt',ja."AppliedAt",'status',ja."Status",
  'skills',COALESCE((SELECT extraction."Profile"->'skills' FROM "StudentCVExtractions" extraction
    WHERE extraction."StudentID"=r."StudentID" AND extraction."CVFileID"=ja."CVFileID" AND extraction."Status"='CONFIRMED'
    ORDER BY extraction."ConfirmedAt" DESC NULLS LAST,extraction."AnalysisID" DESC LIMIT 1),'[]'::jsonb),
  'cv',CASE WHEN cvfile."CVFileID" IS NOT NULL THEN ${cvMetadataSql('cvfile')} || jsonb_build_object('filename',cvfile."FileName",'sizeBytes',octet_length(cvfile."Content")) WHEN cv."CVID" IS NOT NULL THEN ${cvMetadata} ELSE NULL END)
  FROM "JobApplications" ja LEFT JOIN "StudentCVFiles" cvfile ON cvfile."CVFileID"=ja."CVFileID" AND cvfile."StudentID"=r."StudentID"
  LEFT JOIN "StudentCVVersions" cv ON cv."CVID"=ja."CVID" AND cv."StudentID"=r."StudentID"
  WHERE ja."ApplicationID"=co."ApplicationID" AND ja."StudentID"=r."StudentID" AND ja."EnterpriseID"=co."EnterpriseID")`;

// Resolve the submitted file through the candidate, never through a client-supplied
// student/file ID or the student's current CV (which may have changed since applying).
export async function enterpriseCandidateCV(candidateId: number, actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    if (companyId === null) throw invalid('Enterprise role required.', 403, 'FORBIDDEN');
    const file = (await c.query(`SELECT
      COALESCE(cvfile."FileName",legacy."Filename") AS "FileName",
      cvfile."Content",legacy."EncryptedContent"
      FROM "StudentEnterpriseCoordination" co
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "JobApplications" ja ON ja."ApplicationID"=co."ApplicationID"
        AND ja."RegistrationID"=r."RegistrationID" AND ja."StudentID"=r."StudentID" AND ja."EnterpriseID"=co."EnterpriseID"
      LEFT JOIN "StudentCVFiles" cvfile ON cvfile."CVFileID"=ja."CVFileID" AND cvfile."StudentID"=r."StudentID"
      LEFT JOIN "StudentCVVersions" legacy ON legacy."CVID"=ja."CVID" AND legacy."StudentID"=r."StudentID"
      WHERE co."CoordinationID"=$1 AND co."EnterpriseID"=$2
        AND ${visibleEnterpriseSemester('r."OJTSemesterID"')}`, [candidateId, companyId])).rows[0];
    if (!file || (!file.Content && !file.EncryptedContent))
      throw invalid('Không tìm thấy CV đã gửi cho doanh nghiệp trong hồ sơ này.', 404, 'CV_NOT_FOUND');
    return { FileName: file.FileName, Content: file.Content ?? decryptCv(file.EncryptedContent) };
  });
}

export async function enterpriseProfile(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    const company = (await c.query('SELECT * FROM "Enterprises" WHERE "EnterpriseID"=$1', [companyId])).rows[0];
    const summary=(await c.query(`WITH visible_coordinations AS (
      SELECT co.* FROM "StudentEnterpriseCoordination" co
      WHERE co."EnterpriseID"=$1 AND ${visibleEnterpriseSemester('co."OJTSemesterID"')}
    ), visible_assignments AS (
      SELECT a.* FROM "InternshipAssignments" a
      JOIN visible_coordinations co USING ("CoordinationID")
      WHERE a."EnterpriseID"=$1
    ), active_students AS (
      SELECT r."StudentID" FROM visible_coordinations co
      JOIN "OJTRegistrations" r USING ("RegistrationID")
      WHERE co."Decision"='ACCEPTED'
        AND NOT EXISTS (SELECT 1 FROM "StudentEnterpriseCoordination" newer
          WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID")
        AND NOT EXISTS (SELECT 1 FROM "InternshipAssignments" a WHERE a."CoordinationID"=co."CoordinationID")
      UNION
      SELECT a."StudentID" FROM visible_assignments a
      WHERE COALESCE(UPPER(a."Status"),'ASSIGNED') IN ('ASSIGNED','ACTIVE','IN_PROGRESS')
        AND NOT EXISTS (SELECT 1 FROM "InternshipEvaluations" ev WHERE ev."AssignmentID"=a."AssignmentID"
          AND ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL)
    ) SELECT
      (SELECT count(*)::int FROM "RecruitmentPosts" p WHERE "EnterpriseID"=$1 AND "Status"='PUBLISHED' AND ("DeadlineAt" IS NULL OR "DeadlineAt">clock_timestamp())
        AND ${visibleEnterpriseSemester('p."OJTSemesterID"')}) AS "publishedPosts",
      (SELECT count(*)::int FROM "RecruitmentPosts" p WHERE "EnterpriseID"=$1 AND "Status"='PENDING_REVIEW'
        AND ${visibleEnterpriseSemester('p."OJTSemesterID"')}) AS "pendingPosts",
      (SELECT count(*)::int FROM visible_coordinations co WHERE COALESCE(co."Decision",'PENDING')='PENDING' AND NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID")) AS "pendingCandidates",
      (SELECT count(*)::int FROM active_students) AS "activeInterns",
      (SELECT count(*)::int FROM active_students) AS "acceptedInterns",
      (SELECT count(DISTINCT a."StudentID")::int FROM visible_assignments a JOIN "InternshipEvaluations" ev ON ev."AssignmentID"=a."AssignmentID" WHERE ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL) AS "completedInterns",
      (SELECT count(*)::int FROM visible_assignments a WHERE UPPER(a."Status") IN ('ACTIVE','IN_PROGRESS','COMPLETED') AND NOT EXISTS(SELECT 1 FROM "InternshipEvaluations" ev WHERE ev."AssignmentID"=a."AssignmentID" AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL)) AS "pendingEvaluations"`,[companyId])).rows[0];
    return {...api('companies', company),summary:{scope:'ALL_SEMESTERS',...summary}};
  });
}

// Return only the company's latest introduction for each application.
const candidateFrom = `FROM "StudentEnterpriseCoordination" co
  JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
  JOIN "Students" s ON s."StudentID"=r."StudentID"
  JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "InternshipPositions" p ON p."PositionID"=co."PositionID"
  LEFT JOIN "JobApplications" review_application ON review_application."ApplicationID"=co."ApplicationID"
  LEFT JOIN "RecruitmentPosts" review_post ON review_post."PostID"=review_application."PostID"
  LEFT JOIN "OJTRegistrationWindows" review_intake ON review_intake."WindowID"=r."WindowID"
  LEFT JOIN "RecruitmentWindows" review_round
    ON review_round."WindowID"=COALESCE(review_post."WindowID",review_intake."RecruitmentRoundID")
    AND review_round."OJTSemesterID"=r."OJTSemesterID"`;
const candidateFields = `CASE WHEN co."Decision"<>'PENDING' THEN false ELSE NOT EXISTS(
 SELECT 1 FROM "JobApplications" ja JOIN "RecruitmentPosts" post ON post."PostID"=ja."PostID"
 JOIN "RecruitmentWindows" rw ON rw."WindowID"=post."WindowID"
 JOIN "AcademicPeriods" rp ON rp."AcademicPeriodID"=rw."AcademicPeriodID" JOIN "OJTSemesters" rt ON rt."OJTSemesterID"=rw."OJTSemesterID"
 WHERE ja."ApplicationID"=co."ApplicationID" AND rw."CampaignID" IS NOT NULL AND rw."ResultsStartsAt" IS NOT NULL
 AND (rp."Kind"<>'SEMESTER' OR rp."Status" IN ('CLOSED','ARCHIVED') OR rt."AcademicPeriodID"<>rw."AcademicPeriodID" OR rw."Status"<>'OPEN' OR rw."ResultsFinalizedAt" IS NOT NULL OR clock_timestamp()<rw."ResultsStartsAt" OR clock_timestamp()>=rw."ResultsEndsAt")
 ) END AS "canRespond",co."CoordinationID" AS id,co."Source" AS source,(SELECT receipt."ReceivedAt" FROM "OJTActualReceipts" receipt WHERE receipt."CoordinationID"=co."CoordinationID") AS "receivedAt",co."EnterpriseID" AS "companyId",co."CoordinatedBy" AS "coordinatedBy",jsonb_build_object('id',r."RegistrationID",'status',r."Status",'registeredAt',r."RegisteredAt") AS registration,r."StudentID" AS "studentId",r."OJTSemesterID" AS "ojtSemesterId",co."PositionID" AS "positionId",co."ApplicationID" AS "applicationId",r."RegistrationID" AS "registrationId",${student} AS student,${position} AS position,
  COALESCE(co."Decision",'PENDING') AS decision,co."CoordinatedAt" AS "introducedAt",
  co."DecisionAt" AS "decisionAt",co."RejectReason" AS "rejectReason",
  CASE WHEN review_round."WindowID" IS NULL THEN NULL ELSE jsonb_build_object(
    'id',review_round."WindowID",'name',review_round."Name",
    'resultsStartsAt',review_round."ResultsStartsAt",'resultsEndsAt',review_round."ResultsEndsAt") END AS "recruitmentRound",
  NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID") AS "isLatestCoordination"`;

export async function dashboardCandidates(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    const {rows: [summary]} = await c.query(`WITH latest AS (
      SELECT co."CoordinationID", co."PositionID", co."CoordinatedAt", co."Decision", r."StudentID"
      FROM "StudentEnterpriseCoordination" co
      JOIN "OJTRegistrations" r USING ("RegistrationID")
      WHERE co."EnterpriseID"=$1 AND ${visibleEnterpriseSemester('r."OJTSemesterID"')} AND NOT EXISTS (
        SELECT 1 FROM "StudentEnterpriseCoordination" newer
        WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID")
    ), pending AS (
      SELECT l."CoordinationID" AS id, l."CoordinatedAt" AS "introducedAt",
        u."FullName" AS "fullName", s."StudentCode" AS "studentCode", p."Title" AS "positionTitle"
      FROM latest l JOIN "Students" s USING ("StudentID")
      JOIN "Users" u ON u."UserID"=s."UserID" JOIN "InternshipPositions" p USING ("PositionID")
      WHERE COALESCE(l."Decision",'PENDING')='PENDING' AND NOT EXISTS (
        SELECT 1 FROM "OJTActualReceipts" receipt WHERE receipt."CoordinationID"=l."CoordinationID" AND receipt."ReceivedAt" IS NOT NULL)
      ORDER BY l."CoordinatedAt" DESC NULLS LAST, id DESC LIMIT 10
    )
    SELECT (SELECT count(DISTINCT "StudentID")::int FROM latest WHERE "Decision"='REJECTED') AS "rejectedCount",
      COALESCE(jsonb_agg(to_jsonb(pending) ORDER BY "introducedAt" DESC NULLS LAST,id DESC),'[]') AS items FROM pending`, [companyId]);
    return summary;
  });
}

export async function enterpriseCandidates(params: Row, actor: Actor) {
  const hasPagination = params.page !== undefined || params.limit !== undefined;
  const page = pagination(params,['studentId','candidateId','academicYearId','ojtSemesterId','ojtSemesterIds','positionId','decision','search','roundId']);
  if(page.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const id=params.candidateId===undefined?undefined:positiveId(params.candidateId,'candidateId');
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c,actor);
    if(companyId===null)throw invalid('Enterprise role required.',403,'FORBIDDEN');
    const args: unknown[] = [companyId];
    const where = ['co."EnterpriseID"=$1', visibleEnterpriseSemester('r."OJTSemesterID"')];
    const add = (sql: string, value: unknown) => { args.push(value); where.push(sql.replace('?', '$'+args.length)); };
    if (id) add('co."CoordinationID"=?', id);
    if(params.studentId!==undefined)add('r."StudentID"=?',positiveId(params.studentId,'studentId'));
    if(!id)where.push(`NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."EnterpriseID"=co."EnterpriseID" AND newer."CoordinationID">co."CoordinationID")`);
    if(params.academicYearId!==undefined)add('EXISTS(SELECT 1 FROM "OJTSemesters" o WHERE o."OJTSemesterID"=r."OJTSemesterID" AND o."AcademicYearID"=?)',positiveId(params.academicYearId,'academicYearId'));
    if(params.ojtSemesterIds!==undefined){
      if(typeof params.ojtSemesterIds!=='string')throw invalid('ojtSemesterIds must be a comma-separated list.');
      const semesterIds=params.ojtSemesterIds.split(',').map((value:string)=>positiveId(value,'ojtSemesterIds'));
      if(!semesterIds.length||semesterIds.length>100)throw invalid('ojtSemesterIds must contain 1–100 IDs.');
      add('r."OJTSemesterID"=ANY(?::int[])',semesterIds);
    }
    for (const [key,col] of [['ojtSemesterId','r."OJTSemesterID"'],['positionId','co."PositionID"']]) if (params[key]!==undefined) add(col+'=?',positiveId(params[key],key));
      if (params.decision!==undefined) add(`COALESCE(co."Decision",'PENDING')=?`,enumValue(params.decision,['PENDING','ACCEPTED','REJECTED'],'decision'));
      if (params.search!==undefined) { args.push('%'+requiredText(params.search,'search',100)+'%'); where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`); }
    const baseWhere=[...where],baseArgs=[...args];
    if(params.roundId!==undefined){
      if(params.roundId==='unlinked')where.push('review_round."WindowID" IS NULL');
      else add('review_round."WindowID"=?',positiveId(params.roundId,'roundId'));
    }
    const sql = `SELECT ${candidateFields},COALESCE((SELECT ja."ApplicationSnapshot"->'application' FROM "JobApplications" ja WHERE ja."ApplicationID"=co."ApplicationID"),r."Application")-'cvUrl' AS application,${applicationDetails} AS "jobApplication",
      COALESCE((SELECT jsonb_agg(jsonb_build_object('name',skill."SkillName",'level',ss."Level") ORDER BY skill."SkillName")
        FROM "StudentMatchingSkills" ss JOIN "MatchingSkills" skill ON skill."SkillID"=ss."SkillID" WHERE ss."StudentID"=r."StudentID"),'[]'::jsonb) AS skills
      ${candidateFrom} WHERE ${where.join(' AND ')}`;
    // Count from the filtered candidate relation only. Running the projection query
    // for COUNT also evaluates CV/application/skill JSON subqueries for every row.
    const total = (await c.query(`SELECT count(*)::int AS n ${candidateFrom} WHERE ${where.join(' AND ')}`,args)).rows[0].n;
    const roundOptions=(await c.query(`SELECT DISTINCT review_round."WindowID" AS id,review_round."Name" AS name
      ${candidateFrom} WHERE ${baseWhere.join(' AND ')} ORDER BY review_round."Name" NULLS LAST`,baseArgs)).rows;
    const items = (await c.query(
      hasPagination
        ? `${sql} ORDER BY co."CoordinationID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`
        : `${sql} ORDER BY co."CoordinationID" DESC`,
      hasPagination ? [...args,page.limit,page.offset] : args
    )).rows;
    const postIds=[...new Set(items.map(row=>row.jobApplication?.postId).filter(id=>Number.isSafeInteger(id)&&id>0))];
    const posts=postIds.length?(await c.query(postSelect+' WHERE p."PostID"=ANY($1::int[]) AND p."EnterpriseID"=$2',[postIds,companyId])).rows:[];
    const details=await enrichListRows(c,posts.map(postApi));
    const postMap=new Map(details.map(post=>[post.id,post]));
    const candidates=items.map(row=>({...row,recruitmentPost:postMap.get(row.jobApplication?.postId)??null}));
    return {
      items:await enrichListRows(c,candidates),
      total,
      page:hasPagination?page.page:1,
      limit:hasPagination?page.limit:Math.max(total,1),
      rounds:roundOptions.map(round=>({id:round.id===null?'unlinked':String(round.id),name:round.name??'Chưa liên kết đợt OJT'})),
    };
  });
}

export async function enterpriseCandidatePeriods(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c,actor);
    if(companyId===null)throw invalid('Enterprise role required.',403,'FORBIDDEN');
    const periodStatus = enterpriseSemesterStatusSql('ap','o');
    const items=(await c.query(`SELECT DISTINCT
        ay."AcademicYearID" AS "academicYearId",ay."YearCode" AS "academicYearCode",
        o."OJTSemesterID" AS "ojtSemesterId",o."SemesterCode" AS "semesterCode",o."Name" AS "semesterName",
        o."AcademicPeriodID" AS "academicPeriodId",ap."Name" AS "academicPeriodName",(${periodStatus}) AS "periodStatus",
        o."StartDate" AS "startDate",o."EndDate" AS "endDate"
      FROM "StudentEnterpriseCoordination" co
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "OJTSemesters" o ON o."OJTSemesterID"=r."OJTSemesterID"
      JOIN "AcademicYears" ay ON ay."AcademicYearID"=o."AcademicYearID"
      LEFT JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=o."AcademicPeriodID"
      WHERE co."EnterpriseID"=$1 AND (${periodStatus}) IN ('ACTIVE','CLOSED')
        AND NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer
          WHERE newer."RegistrationID"=co."RegistrationID"
            AND newer."EnterpriseID"=co."EnterpriseID"
            AND newer."CoordinationID">co."CoordinationID")
      ORDER BY ay."YearCode" DESC,o."StartDate" DESC,o."OJTSemesterID" DESC`,[companyId])).rows;
    return {items};
  });
}

export async function enterpriseInternships(params: Row, actor: Actor) {
  const hasPagination = params.page !== undefined || params.limit !== undefined;
  const page = pagination(params,['studentId','internshipId','ojtSemesterId','positionId','status','search']);
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c,actor);
    if(companyId===null)throw invalid('Enterprise role required.',403,'FORBIDDEN');
    const args: unknown[] = [companyId], where = ['a."EnterpriseID"=$1',visibleEnterpriseSemester('r."OJTSemesterID"')];
    const add = (sql: string,value: unknown) => { args.push(value); where.push(sql.replace('?', '$'+args.length)); };
    if(params.studentId!==undefined)add('a."StudentID"=?',positiveId(params.studentId,'studentId'));
    if(params.internshipId!==undefined)add('a."AssignmentID"=?',positiveId(params.internshipId,'internshipId'));
    for (const [key,col] of [['ojtSemesterId','r."OJTSemesterID"'],['positionId','a."PositionID"']]) if (params[key]!==undefined) add(col+'=?',positiveId(params[key],key));
    if (params.status!==undefined) add(`COALESCE(UPPER(a."Status"),'ASSIGNED')=?`,enumValue(params.status,['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED'],'status'));
    if (params.search!==undefined) { args.push('%'+requiredText(params.search,'search',100)+'%'); where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`); }
    const sql = `SELECT a."AssignmentID" AS id,a."EnterpriseID" AS "companyId",a."StudentID" AS "studentId",r."OJTSemesterID" AS "ojtSemesterId",a."PositionID" AS "positionId",co."ApplicationID" AS "applicationId",r."RegistrationID" AS "registrationId",${student} AS student,${position} AS position,
      a."CoordinationID" AS "coordinationId",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",
      a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."Status" AS status,
      (${enterpriseSemesterStatusSql('period','term')}) AS "periodStatus",
      CASE WHEN recruitment_round."WindowID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',recruitment_round."WindowID",'name',recruitment_round."Name",'status',recruitment_round."Status",
        'periodStatus',CASE
          WHEN recruitment_round."Status"='CLOSED' OR recruitment_round."ResultsFinalizedAt" IS NOT NULL
            OR recruitment_round."EndsAt"<=statement_timestamp() OR (${enterpriseSemesterStatusSql('period','term')}) IN ('CLOSED','ARCHIVED') THEN 'CLOSED'
          WHEN recruitment_round."Status"='OPEN' AND recruitment_round."StartsAt"<=statement_timestamp() THEN 'ACTIVE'
          ELSE NULL END) END AS "recruitmentRound",
      COALESCE((SELECT ja."ApplicationSnapshot"->'application' FROM "JobApplications" ja WHERE ja."ApplicationID"=co."ApplicationID"),r."Application")-'cvUrl' AS application,${applicationDetails} AS "jobApplication",
      CASE WHEN supervisor."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") END AS "academicSupervisor",
      CASE WHEN v."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',v."EvaluationID",'templateId',v."TemplateID",'scoreDetails',v."ScoreDetails",'evaluatedBy',v."EvaluatedBy",'completionScore',v."CompletionScore",'attitudeScore',v."AttitudeScore",
        'skillScore',v."SkillScore",'overallScore',v."OverallScore",'comments',v."Comments",'criteria',tmpl."Criteria",
        'status',v."Status",'evaluatedAt',v."EvaluatedAt") END AS evaluation,
      ${templateField},CASE WHEN result."ResultID" IS NULL THEN NULL ELSE jsonb_build_object('id',result."ResultID",'status',result."Status",'version',result."Version",'officialScore',result."OfficialScore",'outcome',result."Outcome",'publishedAt',result."PublishedAt") END AS result,
      result."Status" AS "resultStatus",(COALESCE(v."Status"='SUBMITTED',false) OR result."ResultID" IS NOT NULL) AS "evaluationLocked"
      FROM "InternshipAssignments" a
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=r."OJTSemesterID"
      LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=term."AcademicPeriodID"
      LEFT JOIN "JobApplications" accepted_application ON accepted_application."ApplicationID"=co."ApplicationID"
      LEFT JOIN "RecruitmentPosts" accepted_post ON accepted_post."PostID"=accepted_application."PostID"
      LEFT JOIN "OJTRegistrationWindows" intake_window ON intake_window."WindowID"=r."WindowID"
      LEFT JOIN "RecruitmentWindows" recruitment_round
        ON recruitment_round."WindowID"=COALESCE(accepted_post."WindowID",intake_window."RecruitmentRoundID")
        AND recruitment_round."OJTSemesterID"=r."OJTSemesterID"
      JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
      LEFT JOIN "Users" supervisor ON supervisor."UserID"=a."AcademicSupervisorID"
      LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID"
      LEFT JOIN ${officialEvaluationRelation} result ON result."AssignmentID"=a."AssignmentID"
      LEFT JOIN LATERAL (${gradingCriteriaSelection('r."OJTSemesterID"')}) applicable_template ON true
      LEFT JOIN "AssessmentTemplates" tmpl ON tmpl."TemplateID"=CASE WHEN v."Status"='SUBMITTED' THEN v."TemplateID" ELSE applicable_template."TemplateID" END
      WHERE ${where.join(' AND ')}`;
    const items = (await c.query(
      hasPagination
        ? `${sql} ORDER BY a."AssignmentID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`
        : `${sql} ORDER BY a."AssignmentID" DESC`,
      hasPagination ? [...args,page.limit,page.offset] : args
    )).rows;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) internships`,args)).rows[0].n;
    return {
      items:await enrichListRows(c,items),
      total,
      page:hasPagination?page.page:1,
      limit:hasPagination?page.limit:Math.max(total,1),
    };
  });
}
