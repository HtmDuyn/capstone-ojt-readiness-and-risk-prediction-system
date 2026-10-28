import { cvMetadataSql } from '../students/cv.service';
import { decryptCv } from '../student-portal/cv.service';
import { officialEvaluationRelation } from '../ojt-results/official-evaluation';
import { enrichListRows } from '../../shared/list-context';
import { readTransaction } from './read.repository';
import { templateField } from './context-fields';
import { enterpriseScope, api } from './catalog.service';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

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
    'className',s."ClassName",
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

export async function enterpriseProfile(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    const company = (await c.query('SELECT * FROM "Enterprises" WHERE "EnterpriseID"=$1', [companyId])).rows[0];
    const summary=(await c.query(`SELECT
      (SELECT count(*)::int FROM "RecruitmentPosts" WHERE "EnterpriseID"=$1 AND "Status"='PUBLISHED' AND ("DeadlineAt" IS NULL OR "DeadlineAt">clock_timestamp())) AS "publishedPosts",
      (SELECT count(*)::int FROM "RecruitmentPosts" WHERE "EnterpriseID"=$1 AND "Status"='PENDING_REVIEW') AS "pendingPosts",
      (SELECT count(*)::int FROM "StudentEnterpriseCoordination" co WHERE co."EnterpriseID"=$1 AND COALESCE(co."Decision",'PENDING')='PENDING' AND NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID")) AS "pendingCandidates",
      (SELECT count(*)::int FROM "InternshipAssignments" WHERE "EnterpriseID"=$1 AND UPPER("Status") IN ('ACTIVE','IN_PROGRESS')) AS "activeInterns",
      (SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."EnterpriseID"=$1 AND UPPER(a."Status") IN ('ACTIVE','IN_PROGRESS','COMPLETED') AND NOT EXISTS(SELECT 1 FROM "InternshipEvaluations" ev WHERE ev."AssignmentID"=a."AssignmentID" AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL)) AS "pendingEvaluations"`,[companyId])).rows[0];
    return {...api('companies', company),summary:{scope:'ALL_SEMESTERS',...summary}};
  });
}

// Resolve the CV that was available when this dossier was introduced. IDs from
// StudentCVFiles and legacy StudentCVVersions are separate namespaces.
const introducedCv = `COALESCE((SELECT COALESCE((SELECT ${cvMetadataSql('file')} FROM "StudentCVFiles" file WHERE file."CVFileID"=ja."CVFileID" AND file."StudentID"=r."StudentID"),(SELECT ${cvMetadata} FROM "StudentCVVersions" cv WHERE cv."CVID"=ja."CVID" AND cv."StudentID"=r."StudentID")) FROM "JobApplications" ja WHERE ja."ApplicationID"=co."ApplicationID" AND ja."RegistrationID"=r."RegistrationID"),CASE WHEN co."ApplicationID" IS NULL THEN (SELECT ${cvMetadataSql('file')} FROM "StudentCVFiles" file WHERE file."StudentID"=r."StudentID" AND file."UploadedAt"<=co."CoordinatedAt" ORDER BY file."CVFileID" DESC LIMIT 1) END)`;
const cvField=`CASE WHEN (${introducedCv}) IS NULL THEN NULL ELSE (${introducedCv}) || jsonb_build_object('downloadUrl','/api/enterprise/candidates/'||co."CoordinationID"||'/cv') END AS cv`;

// Return only the company's latest introduction for each application.
const candidateFrom = `FROM "StudentEnterpriseCoordination" co
  JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
  JOIN "Students" s ON s."StudentID"=r."StudentID"
  JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "InternshipPositions" p ON p."PositionID"=co."PositionID"`;
const candidateFields = `co."CoordinationID" AS id,r."StudentID" AS "studentId",r."OJTSemesterID" AS "ojtSemesterId",co."PositionID" AS "positionId",co."ApplicationID" AS "applicationId",r."RegistrationID" AS "registrationId",${student} AS student,${position} AS position,
  COALESCE(co."Decision",'PENDING') AS decision,co."CoordinatedAt" AS "introducedAt",
  co."DecisionAt" AS "decisionAt",co."RejectReason" AS "rejectReason",${cvField},
  NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID") AS "isLatestCoordination"`;

export async function enterpriseCandidates(params: Row, actor: Actor) {
  const page = pagination(params,['candidateId','ojtSemesterId','positionId','decision','search']);
  if(page.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const id=params.candidateId===undefined?undefined:positiveId(params.candidateId,'candidateId');
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor), args: unknown[] = [companyId];
    const where = ['co."EnterpriseID"=$1'];
    const add = (sql: string, value: unknown) => { args.push(value); where.push(sql.replace('?', '$'+args.length)); };
    if (id) add('co."CoordinationID"=?', id);
    if(!id)where.push(`NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."EnterpriseID"=co."EnterpriseID" AND newer."CoordinationID">co."CoordinationID")`);
      for (const [key,col] of [['ojtSemesterId','r."OJTSemesterID"'],['positionId','co."PositionID"']]) if (params[key]!==undefined) add(col+'=?',positiveId(params[key],key));
      if (params.decision!==undefined) add(`COALESCE(co."Decision",'PENDING')=?`,enumValue(params.decision,['PENDING','ACCEPTED','REJECTED'],'decision'));
      if (params.search!==undefined) { args.push('%'+requiredText(params.search,'search',100)+'%'); where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`); }
    const sql = `SELECT ${candidateFields},r."Application"-'cvUrl' AS application,(SELECT jsonb_build_object('id',ja."ApplicationID",'postId',ja."PostID",'coverLetter',ja."CoverLetter",'appliedAt',ja."AppliedAt",'status',ja."Status",'cv',COALESCE((SELECT ${cvMetadataSql('file')} FROM "StudentCVFiles" file WHERE file."CVFileID"=ja."CVFileID" AND file."StudentID"=r."StudentID"),CASE WHEN cv."CVID" IS NULL THEN NULL ELSE ${cvMetadata} END)) FROM "JobApplications" ja LEFT JOIN "StudentCVVersions" cv ON cv."CVID"=ja."CVID" AND cv."StudentID"=r."StudentID" WHERE ja."ApplicationID"=co."ApplicationID") AS "jobApplication" ${candidateFrom} WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) candidates`,args)).rows[0].n;
    const items = (await c.query(`${sql} ORDER BY co."CoordinationID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    return {items:await enrichListRows(c,items),total,page:page.page,limit:page.limit};
  });
}

export async function enterpriseCandidateCV(id:number,actor:Actor){
  if(actor.roleCode!=='ENTERPRISE')throw invalid('Enterprise role required.',403,'FORBIDDEN');
  return readTransaction(async c=>{
    const companyId=await enterpriseScope(c,actor);
    const co=(await c.query(`SELECT co.*,r."StudentID" FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID" WHERE co."CoordinationID"=$1 AND co."EnterpriseID"=$2`,[id,companyId])).rows[0];
    if(!co)throw invalid('Candidate not found in this enterprise.',404,'CANDIDATE_NOT_FOUND');
    const file=(await c.query(`SELECT f."FileName",f."MimeType",f."Content" FROM "StudentCVFiles" f WHERE f."StudentID"=$1 AND
      (($2::int IS NOT NULL AND EXISTS(SELECT 1 FROM "JobApplications" a WHERE a."ApplicationID"=$2 AND a."RegistrationID"=$4 AND a."CVFileID"=f."CVFileID"))
       OR ($2::int IS NULL AND f."UploadedAt"<=(SELECT "CoordinatedAt" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$3))) ORDER BY f."CVFileID" DESC LIMIT 1`,[co.StudentID,co.ApplicationID,id,co.RegistrationID])).rows[0];
    if(file)return file;
    if(co.ApplicationID){
      const legacy=(await c.query('SELECT v.* FROM "StudentCVVersions" v JOIN "JobApplications" a ON a."CVID"=v."CVID" WHERE a."ApplicationID"=$1 AND a."RegistrationID"=$2 AND v."StudentID"=$3',[co.ApplicationID,co.RegistrationID,co.StudentID])).rows[0];
      if(legacy)return {FileName:legacy.Filename,MimeType:legacy.MimeType,Content:decryptCv(legacy.EncryptedContent)};
    }
    throw invalid('The introduced dossier has no stored CV.',404,'CV_NOT_FOUND');
  });
}

export async function enterpriseInternships(params: Row, actor: Actor) {
  const page = pagination(params,['ojtSemesterId','positionId','status','search']);
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c,actor), args: unknown[] = [companyId], where = ['a."EnterpriseID"=$1'];
    const add = (sql: string,value: unknown) => { args.push(value); where.push(sql.replace('?', '$'+args.length)); };
    for (const [key,col] of [['ojtSemesterId','r."OJTSemesterID"'],['positionId','a."PositionID"']]) if (params[key]!==undefined) add(col+'=?',positiveId(params[key],key));
    if (params.status!==undefined) add(`COALESCE(UPPER(a."Status"),'ASSIGNED')=?`,enumValue(params.status,['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED'],'status'));
    if (params.search!==undefined) { args.push('%'+requiredText(params.search,'search',100)+'%'); where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`); }
    const sql = `SELECT a."AssignmentID" AS id,a."StudentID" AS "studentId",r."OJTSemesterID" AS "ojtSemesterId",a."PositionID" AS "positionId",co."ApplicationID" AS "applicationId",r."RegistrationID" AS "registrationId",${student} AS student,${position} AS position,
      a."CoordinationID" AS "coordinationId",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",
      a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."Status" AS status,${cvField},
      r."Application"-'cvUrl' AS application,(SELECT jsonb_build_object('id',ja."ApplicationID",'postId',ja."PostID",'coverLetter',ja."CoverLetter",'appliedAt',ja."AppliedAt",'status',ja."Status",'cv',COALESCE((SELECT ${cvMetadataSql('file')} FROM "StudentCVFiles" file WHERE file."CVFileID"=ja."CVFileID" AND file."StudentID"=r."StudentID"),CASE WHEN cv."CVID" IS NULL THEN NULL ELSE ${cvMetadata} END)) FROM "JobApplications" ja LEFT JOIN "StudentCVVersions" cv ON cv."CVID"=ja."CVID" AND cv."StudentID"=r."StudentID" WHERE ja."ApplicationID"=co."ApplicationID") AS "jobApplication",
      CASE WHEN supervisor."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") END AS "academicSupervisor",
      CASE WHEN v."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',v."EvaluationID",'templateId',v."TemplateID",'scoreDetails',v."ScoreDetails",'evaluatedBy',v."EvaluatedBy",'completionScore',v."CompletionScore",'attitudeScore',v."AttitudeScore",
        'skillScore',v."SkillScore",'overallScore',v."OverallScore",'comments',v."Comments",
        'status',v."Status",'evaluatedAt',v."EvaluatedAt") END AS evaluation,
      ${templateField},CASE WHEN result."ResultID" IS NULL THEN NULL ELSE jsonb_build_object('id',result."ResultID",'status',result."Status",'version',result."Version",'officialScore',CASE WHEN result."Status"='CONFIRMED' THEN result."OfficialScore" ELSE NULL END,'outcome',CASE WHEN result."Status"='CONFIRMED' THEN result."Outcome" ELSE NULL END,'confirmedAt',result."ConfirmedAt") END AS result,
      result."Status" AS "resultStatus",COALESCE(result."Status"='CONFIRMED' AND GREATEST(a."EndDate",(SELECT "EndDate" FROM "OJTSemesters" WHERE "OJTSemesterID"=r."OJTSemesterID")) < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,false) AS "evaluationLocked"
      FROM "InternshipAssignments" a
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
      LEFT JOIN "Users" supervisor ON supervisor."UserID"=a."AcademicSupervisorID"
      LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID"
      LEFT JOIN ${officialEvaluationRelation} result ON result."AssignmentID"=a."AssignmentID"
      LEFT JOIN "AssessmentTemplates" tmpl ON tmpl."TemplateID"=v."TemplateID"
      WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) internships`,args)).rows[0].n;
    const items = (await c.query(`${sql} ORDER BY a."AssignmentID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    return {items:await enrichListRows(c,items),total,page:page.page,limit:page.limit};
  });
}
