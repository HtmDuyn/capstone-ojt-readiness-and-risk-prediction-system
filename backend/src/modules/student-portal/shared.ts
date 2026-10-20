import type { PoolClient } from 'pg';
import { invalid, pagination, positiveId } from '../students/student.validation';
export type Row = Record<string, any>;
export type Actor = { userId:number; roleCode:string };
export async function ownStudent(c:PoolClient, actor:Actor) {
  if(actor.roleCode!=='STUDENT')throw invalid('Student access required.',403,'FORBIDDEN');
  const s=(await c.query('SELECT s.*,u."Status" AS "AccountStatus",p."CohortID",p."GroupCode",t."SpecializationID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID" WHERE s."UserID"=$1 AND s."DeletedAt" IS NULL',[actor.userId])).rows[0];
  if(!s)throw invalid('Student profile not found.',404,'STUDENT_NOT_FOUND');
  if(s.Status!=='ACTIVE'||s.AccountStatus!=='ACTIVE')throw invalid('Student profile is inactive.',403,'STUDENT_INACTIVE');return s;
}
export function inScope(scope:Row,s:Row) {
  return Object.entries({programIds:s.ProgramID,cohortIds:s.CohortID,groupCodes:s.GroupCode,majorIds:s.SpecializationID,studentIds:s.StudentID}).every(([key,v])=>!scope[key]||scope[key].includes(v));
}
export async function page(c:PoolClient,sql:string,args:unknown[],params:Row,allowed:string[]) {
  const p=pagination(params,allowed);if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const row=(await c.query(`WITH filtered AS (${sql}), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];return {...row,page:p.page,limit:p.limit};
}
export function optionalId(v:unknown,key:string){return v===undefined?null:positiveId(v,key);}
export function publicEligibility(value:Row|null) {
  if(!value)return null;
  const {checkedBy,confirmation,rule,...data}=value;void checkedBy;
  return {...data,rule:rule?{id:rule.id,version:rule.version,minCredits:rule.minCredits,maxUnpassedCourses:rule.maxUnpassedCourses,debtBasis:rule.debtBasis}:null,...(confirmation?{confirmation:{confirmedAt:confirmation.confirmedAt}}:{})};
}
