import { query } from '../../config/database';
import { invalid } from '../students/student.validation';
import { predictionFilters, predictionSelect, pageSql, type Row } from './admin.repository';

// Select latest per student/semester BEFORE filtering by risk/readiness.
// Otherwise an old high-risk result could incorrectly replace a newer low-risk result.
const latestJoin=` JOIN (
 SELECT DISTINCT ON (newer."StudentID",nj."OJTSemesterID") newer."PredictionID"
 FROM "Predictions" newer JOIN "PredictionJobs" nj ON nj."JobID"=newer."JobID"
 ORDER BY newer."StudentID",nj."OJTSemesterID",newer."CreatedAt" DESC,newer."PredictionID" DESC
) latest ON latest."PredictionID"=p."PredictionID"`;
function reportSql(params:Row,extra:string[]=[]) {
 const {args,where,page}=predictionFilters(params,extra);
 return {sql:predictionSelect+latestJoin+(where.length?' WHERE '+where.join(' AND '):''),args,page};
}
export async function dashboardSummary(params:Row) {
 if(Object.keys(params).length)throw invalid('Summary does not accept filters.');
 return (await query(`SELECT (SELECT count(*)::int FROM "Users") AS accounts,(SELECT count(*)::int FROM "Users" WHERE "Status"='ACTIVE') AS "activeAccounts",(SELECT count(*)::int FROM "Students" WHERE "DeletedAt" IS NULL) AS students,(SELECT count(*)::int FROM "Enterprises" WHERE "DeletedAt" IS NULL) AS companies,(SELECT count(*)::int FROM "OJTSemesters") AS "ojtSemesters",(SELECT count(*)::int FROM "RiskAlerts" WHERE "Status" IN ('OPEN','ACKNOWLEDGED')) AS "openAlerts"`)).rows[0];
}
export async function distribution(kind:'readiness'|'risks',params:Row) {
 if(params.page!==undefined||params.limit!==undefined)throw invalid('Statistics do not accept pagination.');
 const r=reportSql(params),level=kind==='readiness'?'readinessLevel':'riskLevel',score=kind==='readiness'?'readinessScore':'riskScore';
 const rows=(await query(`SELECT "${level}" AS level,count(*)::int AS count,avg("${score}")::float8 AS "averageScore" FROM (${r.sql}) data GROUP BY "${level}"`,r.args)).rows;
 return {scope:params,basis:'LATEST_PER_STUDENT_PER_SEMESTER',total:rows.reduce((n,r)=>n+r.count,0),groups:['LOW','MEDIUM','HIGH'].map(level=>rows.find(r=>r.level===level)??{level,count:0,averageScore:null})};
}
export async function trends(params:Row) {
 if(params.page!==undefined||params.limit!==undefined)throw invalid('Trends do not accept pagination.');
 const f=predictionFilters(params);
 return {scope:params,basis:'ALL_PREDICTION_EVENTS',items:(await query(`SELECT date_trunc('month',"createdAt" AT TIME ZONE 'UTC') AS month,count(*)::int AS "predictionCount",avg("readinessScore")::float8 AS "averageReadiness",avg("riskScore")::float8 AS "averageRisk",count(*) FILTER(WHERE "riskLevel"='HIGH')::int AS "highRiskCount" FROM (${predictionSelect}${f.where.length?' WHERE '+f.where.join(' AND '):''}) d GROUP BY 1 ORDER BY 1`,f.args)).rows};
}
export async function predictionReport(params:Row,exporting=false) {
 const r=reportSql(params,exporting?['type','format']:[]);
 if(exporting){
  if(params.page!==undefined||params.limit!==undefined)throw invalid('Export does not accept pagination.');
  const rows=(await query(r.sql+' ORDER BY id LIMIT 10001',r.args)).rows;
  if(rows.length>10000)throw invalid('Narrow export to at most 10000 records.',422,'EXPORT_TOO_LARGE');return {basis:'LATEST_PER_STUDENT_PER_SEMESTER',total:rows.length,items:rows};
 }
 return {...await pageSql(r.sql,r.args,r.page),basis:'LATEST_PER_STUDENT_PER_SEMESTER'};
}
