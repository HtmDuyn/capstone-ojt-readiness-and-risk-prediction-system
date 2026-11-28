import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import { enrichListRows } from '../../shared/list-context';
import { invalid, positiveId, requiredText, enumValue, pagination } from '../students/student.validation';

type Row = Record<string, any>;
// QHDN publishes enterprise evaluations directly. Student reads require the publication record.
const resultSelect = `SELECT ev.*,a."AssignmentID",a."StudentID",a."EnterpriseID",a."PositionID",
  co."OJTSemesterID",s."ProgramID",s."StudentCode",u."FullName",e."Name" AS "EnterpriseName",t."SemesterCode",
  ap."PeriodCode" AS "AcademicPeriodCode",ap."Name" AS "AcademicPeriodName",ay."YearCode" AS "AcademicYearCode",
  publication."SentAt" AS "PublishedAt",publication."NotificationID" IS NOT NULL AS "PublishedToStudent",
  CASE WHEN publication."NotificationID" IS NOT NULL THEN 'PUBLISHED' ELSE 'SUBMITTED' END AS "Status",
  CASE WHEN template."TemplateID" IS NULL THEN NULL ELSE jsonb_build_object('id',template."TemplateID",'code',template."Code",'name',template."Name",'version',template."Version",'criteria',template."Criteria") END AS "EvaluationTemplate"
  FROM "InternshipEvaluations" ev JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
  JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
  JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" JOIN "OJTSemesters" t ON t."OJTSemesterID"=co."OJTSemesterID"
  LEFT JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=t."AcademicPeriodID"
  LEFT JOIN "AcademicYears" ay ON ay."AcademicYearID"=ap."AcademicYearID"
  LEFT JOIN LATERAL (SELECT n."NotificationID",n."SentAt" FROM "Notifications" n
    WHERE n."UserID"=u."UserID" AND n."RelatedEntityType"='OJT_RESULT_PUBLISHED'
      AND n."RelatedEntityID"=ev."EvaluationID" ORDER BY n."NotificationID" LIMIT 1) publication ON true
  LEFT JOIN "AssessmentTemplates" template ON template."TemplateID"=ev."TemplateID"`;
export function resultApi(r: Row) {
  return {id:r.EvaluationID,resultId:null,evaluationId:r.EvaluationID,assignmentId:r.AssignmentID,studentId:r.StudentID,
    companyId:r.EnterpriseID,positionId:r.PositionID,programId:r.ProgramID,studentCode:r.StudentCode,fullName:r.FullName,
    enterpriseName:r.EnterpriseName,ojtSemesterId:r.OJTSemesterID,semesterCode:r.SemesterCode,
    academicPeriodCode:r.AcademicPeriodCode??null,academicPeriodName:r.AcademicPeriodName??null,academicYearCode:r.AcademicYearCode??null,status:r.Status,
    publishedToStudent:Boolean(r.PublishedToStudent),publishedAt:r.PublishedAt??null,
    officialScore:r.PublishedToStudent&&r.OverallScore!=null?Number(r.OverallScore):null,completionScore:r.CompletionScore==null?null:Number(r.CompletionScore),
    attitudeScore:r.AttitudeScore==null?null:Number(r.AttitudeScore),skillScore:r.SkillScore==null?null:Number(r.SkillScore),
    comments:r.Comments,templateId:r.TemplateID??null,template:r.EvaluationTemplate??null,scoreDetails:r.ScoreDetails??null,evaluatedAt:r.EvaluatedAt,
    overallScore:r.OverallScore==null?null:Number(r.OverallScore),
    evaluatedBy:r.EvaluatedBy,source:r.PublishedToStudent?'QHDN_PUBLICATION':'ENTERPRISE_EVALUATION',outcome:null};
}
export async function list(params:Row,semesterId?:number,exportAll=false,studentUserId?:number,existingClient?:PoolClient,academicView=false) {
  const p=pagination(params,['status','ojtSemesterId','studentId','search','resultId','includeUntransferred',...(exportAll?['format']:[])]);
  // Accept the previous query flag for older clients; all QHDN reads now include submitted scores.
  if(params.includeUntransferred!==undefined)enumValue(params.includeUntransferred,['true','false'],'includeUntransferred');
  const statusColumn=`CASE WHEN publication."NotificationID" IS NOT NULL THEN 'PUBLISHED' ELSE 'SUBMITTED' END`;
  const args:unknown[]=[],filters=[`ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL AND UPPER(a."Status") NOT IN ('CANCELLED','CANCELED')`];
  const add=(column:string,value:unknown)=>{args.push(value);filters.push(`${column}=$${args.length}`);};
  if(params.status!==undefined){
    const status=enumValue(params.status,academicView?['CONFIRMED','PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','PUBLISHED','SUBMITTED']:['SUBMITTED','PUBLISHED'],'status');
    if(academicView&&['PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED'].includes(status))filters.push('false');
    else add(statusColumn,status==='CONFIRMED'?'PUBLISHED':status);
  }
  if(studentUserId!==undefined||academicView)filters.push('publication."NotificationID" IS NOT NULL');
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
    const sql=resultSelect+' WHERE '+filters.join(' AND ');
    const total=(await c.query(`SELECT count(*)::int AS total FROM (${sql}) data`,args)).rows[0].total;
    if(exportAll&&total>10000)throw invalid('Narrow exports to at most 10000 results.',422);
    const order='ev."EvaluatedAt" DESC,ev."EvaluationID" DESC';
    const rows=(await c.query(sql+' ORDER BY '+order+(exportAll?'':` LIMIT $${args.length+1} OFFSET $${args.length+2}`),exportAll?args:[...args,p.limit,p.offset])).rows;
    const items=rows.map(row=>{
      const result=resultApi(row);
      // Preserve the existing read contract of the Education screen without requiring its confirmation action.
      return academicView?{...result,status:'CONFIRMED',confirmedAt:result.publishedAt,confirmedBy:null}:result;
    });
    return {items:await enrichListRows(c,items),total,...(exportAll?{ojtSemesterId:semesterId}:{page:p.page,limit:p.limit})};
  },existingClient);
}
export function resultCsv(items:ReturnType<typeof resultApi>[],_includeEnterpriseScore=true) {
  const cell=(v:unknown)=>{let s=v==null?'':String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const columns=['id','studentCode','fullName','semesterCode','enterpriseName','status','completionScore','skillScore','attitudeScore','overallScore','comments','publishedAt'] as const;
  return '\uFEFF'+[columns.join(','),...items.map(r=>columns.map(k=>cell(r[k] instanceof Date?(r[k] as Date).toISOString():r[k])).join(','))].join('\r\n')+'\r\n';
}
