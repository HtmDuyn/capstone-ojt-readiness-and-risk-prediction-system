import { readTransaction } from './read.repository';
import { templateField } from './context-fields';
import { enterpriseScope, api } from './catalog.service';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

const position = `jsonb_build_object('id',p."PositionID",'code',p."RecruitmentCode",'location',p."Location",'workMode',p."WorkMode",'title',p."Title",'description',p."Description",'requirements',p."Requirements",'ojtSemesterId',p."OJTSemesterID")`;
const student = `jsonb_build_object('id',s."StudentID",'studentCode',s."StudentCode",'fullName',u."FullName",'email',u."Email",'phone',u."Phone")`;

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

// Return only the company's latest introduction for each application.
const candidateFrom = `FROM "StudentEnterpriseCoordination" co
  JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
  JOIN "Students" s ON s."StudentID"=r."StudentID"
  JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "InternshipPositions" p ON p."PositionID"=co."PositionID"`;
const candidateFields = `co."CoordinationID" AS id,${student} AS student,${position} AS position,
  COALESCE(co."Decision",'PENDING') AS decision,co."CoordinatedAt" AS "introducedAt",
  co."DecisionAt" AS "decisionAt",co."RejectReason" AS "rejectReason",
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
    const sql = `SELECT ${candidateFields},r."Application" AS application ${candidateFrom} WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) candidates`,args)).rows[0].n;
    const items = (await c.query(`${sql} ORDER BY co."CoordinationID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    return {items,total,page:page.page,limit:page.limit};
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
    const sql = `SELECT a."AssignmentID" AS id,${student} AS student,${position} AS position,
      a."CoordinationID" AS "coordinationId",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",
      a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."Status" AS status,
      r."Application" AS application,
      CASE WHEN supervisor."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") END AS "academicSupervisor",
      CASE WHEN v."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',v."EvaluationID",'templateId',v."TemplateID",'scoreDetails',v."ScoreDetails",'evaluatedBy',v."EvaluatedBy",'completionScore',v."CompletionScore",'attitudeScore',v."AttitudeScore",
        'skillScore',v."SkillScore",'overallScore',v."OverallScore",'comments',v."Comments",
        'status',v."Status",'evaluatedAt',v."EvaluatedAt") END AS evaluation,
      ${templateField},CASE WHEN result."ResultID" IS NULL THEN NULL ELSE jsonb_build_object('id',result."ResultID",'status',result."Status",'version',result."Version",'officialScore',CASE WHEN result."Status"='CONFIRMED' THEN result."OfficialScore" ELSE NULL END,'outcome',CASE WHEN result."Status"='CONFIRMED' THEN result."Outcome" ELSE NULL END,'confirmedAt',result."ConfirmedAt") END AS result,
      result."Status" AS "resultStatus",COALESCE(result."Status"='CONFIRMED',false) AS "evaluationLocked"
      FROM "InternshipAssignments" a
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
      LEFT JOIN "Users" supervisor ON supervisor."UserID"=a."AcademicSupervisorID"
      LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID"
      LEFT JOIN "OJTResults" result ON result."AssignmentID"=a."AssignmentID"
      LEFT JOIN "AssessmentTemplates" tmpl ON tmpl."TemplateID"=v."TemplateID"
      WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) internships`,args)).rows[0].n;
    const items = (await c.query(`${sql} ORDER BY a."AssignmentID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    return {items,total,page:page.page,limit:page.limit};
  });
}
