import type { PoolClient } from 'pg';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, score } from '../students/student.validation';
export { invalid, inputObject, positiveId, requiredText, optionalText, enumValue };
export function integer(value:unknown,name:string,min=0,max=20) {
  if (typeof value!=='number' || !Number.isInteger(value) || value<min || value>max) throw invalid(`${name} must be an integer between ${min} and ${max}.`);
  return value;
}
export function credits(value:unknown) {const n=score(value,9999.99,'credits');if(n===null)throw invalid('credits is required.');return n;}
export function boolean(value:unknown,name:string) {if(typeof value!=='boolean')throw invalid(`${name} must be boolean.`);return value;}
export function array(value:unknown,name:string,max=500):unknown[] {if(!Array.isArray(value)||value.length>max)throw invalid(`${name} must be an array with at most ${max} items.`);return value;}
export function unique(values:(string|number)[],name:string) {if(new Set(values).size!==values.length)throw invalid(`Duplicate ${name}.`);}
export async function courseId(client:PoolClient,row:Record<string,unknown>) {
  if (('courseId' in row)===('courseCode' in row)) throw invalid('Provide exactly one of courseId or courseCode.');
  const byId='courseId' in row;
  const value=byId?positiveId(row.courseId,'courseId'):requiredText(row.courseCode,'courseCode',20).toUpperCase();
  const found=(await client.query(`SELECT "CourseID","CourseName" FROM "Courses" WHERE ${byId?'"CourseID"':'upper("CourseCode")'}=$1`,[value])).rows[0];
  if(!found)throw invalid(`Unknown course: ${value}.`,400,'COURSE_NOT_FOUND');
  return found as {CourseID:number;CourseName:string};
}
export function metadata(body:unknown,patch=false) {
  const b=inputObject(body,['code','name','version','majorId','totalCredits','effectiveYear','gpaScale']);
  const out:Record<string,unknown>={};
  for(const [key,col,max] of [['code','ProgramCode',100],['name','ProgramName',200],['version','Version',10]] as const) if(!patch||key in b)out[col]=requiredText(b[key],key,max);
  if(!patch||'majorId' in b)out.SpecializationID=positiveId(b.majorId,'majorId');
  if(!patch||'totalCredits' in b){out.TotalCredits=credits(b.totalCredits);if(Number(out.TotalCredits)<=0)throw invalid('totalCredits must be positive.');}
  if(!patch||'effectiveYear' in b)out.EffectiveYear=integer(b.effectiveYear,'effectiveYear',1900,2200);
  let gpaScale:number|undefined;
  if(!patch||'gpaScale' in b)gpaScale=integer(b.gpaScale,'gpaScale',4,10);
  if(gpaScale!==undefined && ![4,10].includes(gpaScale))throw invalid('gpaScale must be 4 or 10.');
  return {fields:out,gpaScale};
}
export function assertAcyclic(edges:Map<number,Set<number>>,name:string) {
  const done=new Set<number>(),active=new Set<number>();
  function visit(id:number){if(active.has(id))throw invalid(`${name} contains a cycle.`,400,'CURRICULUM_CYCLE');if(done.has(id))return;active.add(id);for(const next of edges.get(id)??[])visit(next);active.delete(id);done.add(id);}
  for(const id of edges.keys())visit(id);
}
