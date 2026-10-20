import { readTransaction } from '../qhdn/read.repository';
import { invalid, positiveId, requiredText, enumValue, pagination } from '../students/student.validation';

type Row = Record<string, any>;
// Submitted enterprise evaluations are official; academic staff do not re-enter/approve scores.
export const officialResultSelect = `SELECT ev.*,a."AssignmentID",a."StudentID",a."EnterpriseID",a."PositionID",
  co."OJTSemesterID",s."ProgramID",s."StudentCode",u."FullName",e."Name" AS "EnterpriseName",t."SemesterCode"
  FROM "InternshipEvaluations" ev JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
  JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" JOIN "OJTSemesters" t ON t."OJTSemesterID"=co."OJTSemesterID"`;
export const officialResultCondition = `ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL
  AND COALESCE(UPPER(a."Status"),'') NOT IN ('CANCELLED','CANCELED')`;
export function resultApi(r: Row) {
  return {id:r.EvaluationID,evaluationId:r.EvaluationID,assignmentId:r.AssignmentID,studentId:r.StudentID,
    companyId:r.EnterpriseID,positionId:r.PositionID,programId:r.ProgramID,studentCode:r.StudentCode,fullName:r.FullName,
    enterpriseName:r.EnterpriseName,ojtSemesterId:r.OJTSemesterID,semesterCode:r.SemesterCode,status:'CONFIRMED',
    officialScore:Number(r.OverallScore),completionScore:r.CompletionScore==null?null:Number(r.CompletionScore),
    attitudeScore:r.AttitudeScore==null?null:Number(r.AttitudeScore),skillScore:r.SkillScore==null?null:Number(r.SkillScore),
    comments:r.Comments,evaluatedBy:r.EvaluatedBy,confirmedBy:r.EvaluatedBy,confirmedAt:r.EvaluatedAt,
    source:'ENTERPRISE_EVALUATION',outcome:null};
}
export async function list(params:Row,semesterId?:number,exportAll=false,studentUserId?:number) {
  const p=pagination(params,['status','ojtSemesterId','studentId','search','resultId',...(exportAll?['format']:[])]);
  const args:unknown[]=[],filters=[officialResultCondition];
  const add=(column:string,value:unknown)=>{args.push(value);filters.push(`${column}=$${args.length}`);};
  if(params.status!==undefined)enumValue(params.status,['CONFIRMED'],'status');
  if(params.resultId!==undefined)add('ev."EvaluationID"',positiveId(params.resultId,'resultId'));
  if(params.studentId!==undefined)add('a."StudentID"',positiveId(params.studentId,'studentId'));
  if(studentUserId!==undefined)add('s."UserID"',studentUserId);
  if(params.ojtSemesterId!==undefined){const term=positiveId(params.ojtSemesterId,'ojtSemesterId');if(semesterId&&semesterId!==term)throw invalid('Conflicting OJT semester.');semesterId=term;}
  if(semesterId)add('co."OJTSemesterID"',semesterId);
  if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`);}
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  if(exportAll&&(params.page!==undefined||params.limit!==undefined))throw invalid('Export does not support pagination.');
  return readTransaction(async c=>{
    if(semesterId&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
    const sql=officialResultSelect+' WHERE '+filters.join(' AND ');
    const total=(await c.query(`SELECT count(*)::int AS total FROM (${sql}) data`,args)).rows[0].total;
    if(exportAll&&total>10000)throw invalid('Narrow exports to at most 10000 results.',422);
    const rows=(await c.query(sql+' ORDER BY ev."EvaluationID" DESC'+(exportAll?'':` LIMIT $${args.length+1} OFFSET $${args.length+2}`),exportAll?args:[...args,p.limit,p.offset])).rows;
    return {items:rows.map(resultApi),total,...(exportAll?{ojtSemesterId:semesterId}:{page:p.page,limit:p.limit})};
  });
}
export function resultCsv(items:ReturnType<typeof resultApi>[]) {
  const cell=(v:unknown)=>{let s=v==null?'':String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const columns=['id','studentCode','fullName','semesterCode','enterpriseName','status','officialScore','comments','confirmedAt'] as const;
  return '\uFEFF'+[columns.join(','),...items.map(r=>columns.map(k=>cell(r[k] instanceof Date?(r[k] as Date).toISOString():r[k])).join(','))].join('\r\n')+'\r\n';
}
