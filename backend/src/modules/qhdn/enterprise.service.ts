import { readTransaction } from './read.repository';
import { enterpriseScope, api } from './catalog.service';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

const position = `jsonb_build_object('id',p."PositionID",'title',p."Title",'description',p."Description",'requirements',p."Requirements",'ojtSemesterId',p."OJTSemesterID")`;
const student = `jsonb_build_object('id',s."StudentID",'studentCode',s."StudentCode",'fullName',u."FullName")`;

export async function enterpriseProfile(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    const company = (await c.query('SELECT * FROM "Enterprises" WHERE "EnterpriseID"=$1', [companyId])).rows[0];
    return api('companies', company);
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

export async function enterpriseCandidates(params: Row, actor: Actor, id?: number) {
  const page = pagination(params, id ? [] : ['ojtSemesterId','positionId','decision','search']);
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor), args: unknown[] = [companyId];
    const where = ['co."EnterpriseID"=$1'];
    const add = (sql: string, value: unknown) => { args.push(value); where.push(sql.replace('?', '$'+args.length)); };
    if (id) add('co."CoordinationID"=?', id);
    else {
      where.push(`NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=co."RegistrationID" AND newer."EnterpriseID"=co."EnterpriseID" AND newer."CoordinationID">co."CoordinationID")`);
      for (const [key,col] of [['ojtSemesterId','r."OJTSemesterID"'],['positionId','co."PositionID"']]) if (params[key]!==undefined) add(col+'=?',positiveId(params[key],key));
      if (params.decision!==undefined) add(`COALESCE(co."Decision",'PENDING')=?`,enumValue(params.decision,['PENDING','ACCEPTED','REJECTED'],'decision'));
      if (params.search!==undefined) { args.push('%'+requiredText(params.search,'search',100)+'%'); where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`); }
    }
    const sql = `SELECT ${candidateFields}${id ? ',r."Application" AS application' : ''} ${candidateFrom} WHERE ${where.join(' AND ')}`;
    if (id) {
      const row = (await c.query(sql,args)).rows[0];
      if (!row) throw invalid('Candidate not found.',404,'CANDIDATE_NOT_FOUND');
      return row;
    }
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
      CASE WHEN v."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',v."EvaluationID",'completionScore',v."CompletionScore",'attitudeScore',v."AttitudeScore",
        'skillScore',v."SkillScore",'overallScore',v."OverallScore",'comments',v."Comments",
        'status',v."Status",'evaluatedAt',v."EvaluatedAt") END AS evaluation,
      result."Status" AS "resultStatus",COALESCE(result."Status"='CONFIRMED',false) AS "evaluationLocked"
      FROM "InternshipAssignments" a
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
      JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
      LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID"
      LEFT JOIN "OJTResults" result ON result."AssignmentID"=a."AssignmentID"
      WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) internships`,args)).rows[0].n;
    const items = (await c.query(`${sql} ORDER BY a."AssignmentID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,page.limit,page.offset])).rows;
    return {items,total,page:page.page,limit:page.limit};
  });
}
