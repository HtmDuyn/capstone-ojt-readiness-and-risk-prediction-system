import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import { enrichListRows } from '../../shared/list-context';
import { invalid, positiveId, requiredText, enumValue, pagination } from '../students/student.validation';

type Row = Record<string, any>;
// Join official academic results to enterprise evaluations; Student reads require CONFIRMED.
const resultSelect = (includeUntransferred=false) => `SELECT ev.*,res.*,${includeUntransferred?`ev."EvaluationID",ev."OverallScore",COALESCE(res."Status",'SUBMITTED') AS "Status",`:''}a."AssignmentID",a."StudentID",a."EnterpriseID",a."PositionID",
  co."OJTSemesterID",s."ProgramID",s."StudentCode",u."FullName",e."Name" AS "EnterpriseName",t."SemesterCode",
  CASE WHEN template."TemplateID" IS NULL THEN NULL ELSE jsonb_build_object('id',template."TemplateID",'code',template."Code",'name',template."Name",'version',template."Version",'criteria',template."Criteria") END AS "EvaluationTemplate"
  FROM ${includeUntransferred?'"InternshipEvaluations" ev LEFT JOIN "OJTResults" res ON ev."AssignmentID"=res."AssignmentID"':'"OJTResults" res JOIN "InternshipEvaluations" ev ON ev."AssignmentID"=res."AssignmentID"'} JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
  JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" JOIN "OJTSemesters" t ON t."OJTSemesterID"=co."OJTSemesterID"
  LEFT JOIN "AssessmentTemplates" template ON template."TemplateID"=ev."TemplateID"`;
export const officialResultSelect = resultSelect();
export const officialResultCondition = `res."Status" IN ('PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED')`;
export function resultApi(r: Row) {
  return {id:r.ResultID??r.EvaluationID,resultId:r.ResultID??null,evaluationId:r.EvaluationID,assignmentId:r.AssignmentID,studentId:r.StudentID,
    companyId:r.EnterpriseID,positionId:r.PositionID,programId:r.ProgramID,studentCode:r.StudentCode,fullName:r.FullName,
    enterpriseName:r.EnterpriseName,ojtSemesterId:r.OJTSemesterID,semesterCode:r.SemesterCode,status:r.Status,
    officialScore:r.OfficialScore==null?null:Number(r.OfficialScore),completionScore:r.CompletionScore==null?null:Number(r.CompletionScore),
    attitudeScore:r.AttitudeScore==null?null:Number(r.AttitudeScore),skillScore:r.SkillScore==null?null:Number(r.SkillScore),
    comments:r.Comments,templateId:r.TemplateID??null,template:r.EvaluationTemplate??null,scoreDetails:r.ScoreDetails??null,evaluatedAt:r.EvaluatedAt,
    overallScore:r.OverallScore==null?null:Number(r.OverallScore),
    evaluatedBy:r.EvaluatedBy,confirmedBy:r.ConfirmedBy,confirmedAt:r.ConfirmedAt,transferredBy:r.TransferredBy,transferredAt:r.TransferredAt,
    source:r.ResultID?'ACADEMIC_CONFIRMATION':'ENTERPRISE_EVALUATION',outcome:r.Outcome,version:r.Version,
    courseResultId:r.CourseResultID??null,gradeMappingId:r.GradeMappingID??null,
    gradeMappingSnapshot:r.GradeMappingSnapshot??null,confirmationReason:r.ConfirmationReason??null};
}
export async function list(params:Row,semesterId?:number,exportAll=false,studentUserId?:number,existingClient?:PoolClient) {
  const p=pagination(params,['status','ojtSemesterId','studentId','search','resultId','includeUntransferred',...(exportAll?['format']:[])]);
  const includeUntransferred=params.includeUntransferred!==undefined&&enumValue(params.includeUntransferred,['true','false'],'includeUntransferred')==='true';
  if(includeUntransferred&&studentUserId!==undefined)throw invalid('Student reads require confirmed results.',403,'FORBIDDEN');
  const statusColumn=includeUntransferred?`COALESCE(res."Status",'SUBMITTED')`:'res."Status"';
  // QHDN may inspect submitted scores before transfer; academic/student defaults remain unchanged.
  const select=resultSelect(includeUntransferred);
  const args:unknown[]=[],filters=[includeUntransferred?`((${officialResultCondition}) OR (res."ResultID" IS NULL AND ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL AND UPPER(a."Status") NOT IN ('CANCELLED','CANCELED')))` : officialResultCondition];
  const add=(column:string,value:unknown)=>{args.push(value);filters.push(`${column}=$${args.length}`);};
  if(params.status!==undefined)add(statusColumn,enumValue(params.status,['PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED',...(includeUntransferred?['SUBMITTED']:[])],'status'));
  if(studentUserId!==undefined)filters.push("res.\"Status\"='CONFIRMED'");
  if(params.resultId!==undefined)add('res."ResultID"',positiveId(params.resultId,'resultId'));
  if(params.studentId!==undefined)add('a."StudentID"',positiveId(params.studentId,'studentId'));
  if(studentUserId!==undefined)add('s."UserID"',studentUserId);
  if(params.ojtSemesterId!==undefined){const term=positiveId(params.ojtSemesterId,'ojtSemesterId');if(semesterId&&semesterId!==term)throw invalid('Conflicting OJT semester.');semesterId=term;}
  if(semesterId)add('co."OJTSemesterID"',semesterId);
  if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`);}
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  if(exportAll&&(params.page!==undefined||params.limit!==undefined))throw invalid('Export does not support pagination.');
  return readTransaction(async c=>{
    if(semesterId&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
    const sql=select+' WHERE '+filters.join(' AND ');
    const total=(await c.query(`SELECT count(*)::int AS total FROM (${sql}) data`,args)).rows[0].total;
    if(exportAll&&total>10000)throw invalid('Narrow exports to at most 10000 results.',422);
    const order=includeUntransferred?'ev."EvaluatedAt" DESC,ev."EvaluationID" DESC':'res."ResultID" DESC';
    const rows=(await c.query(sql+' ORDER BY '+order+(exportAll?'':` LIMIT $${args.length+1} OFFSET $${args.length+2}`),exportAll?args:[...args,p.limit,p.offset])).rows;
    return {items:await enrichListRows(c,rows.map(resultApi)),total,...(exportAll?{ojtSemesterId:semesterId}:{page:p.page,limit:p.limit})};
  },existingClient);
}
export function resultCsv(items:ReturnType<typeof resultApi>[],includeEnterpriseScore=false) {
  const cell=(v:unknown)=>{let s=v==null?'':String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const columns=['id','studentCode','fullName','semesterCode','enterpriseName','status',...(includeEnterpriseScore?['completionScore','attitudeScore','skillScore','overallScore'] as const:['officialScore'] as const),'comments','confirmedAt'] as const;
  return '\uFEFF'+[columns.join(','),...items.map(r=>columns.map(k=>cell(r[k] instanceof Date?(r[k] as Date).toISOString():r[k])).join(','))].join('\r\n')+'\r\n';
}
