import type { RequestHandler } from 'express';
import type { PoolClient } from 'pg';
import { readTransaction } from '../modules/qhdn/read.repository';
import { invalid,positiveId } from '../modules/students/student.validation';

export type ScopeRule={field:'companyId'|'studentId';roles:string[];requiredForAll?:boolean;forward:boolean};
export async function validateListScope(c:Pick<PoolClient,'query'>,body:Record<string,unknown>,actor:{userId:number;roleCode:string},rules:ScopeRule[]) {
 for(const rule of rules){
  const required=rule.requiredForAll||rule.roles.includes(actor.roleCode);
  if(body[rule.field]===undefined||body[rule.field]===null){if(required)throw invalid(rule.field+' is required in JSON body.',400,'EXPLICIT_SCOPE_REQUIRED');continue;}
  const id=positiveId(body[rule.field],rule.field);
  if(!rule.forward&&!rule.roles.includes(actor.roleCode))throw invalid(rule.field+' is only supported for '+rule.roles.join('/')+' on this endpoint.');
  if(rule.field==='companyId'&&actor.roleCode==='ENTERPRISE'){
   const result=await c.query('SELECT 1 FROM "EnterpriseUsers" eu JOIN "Enterprises" e ON e."EnterpriseID"=eu."EnterpriseID" WHERE eu."EnterpriseID"=$1 AND eu."UserID"=$2 AND e."Status"=\'ACTIVE\' AND e."DeletedAt" IS NULL',[id,actor.userId]);
   if(!result.rows.length)throw invalid('companyId is outside the authenticated enterprise scope.',403,'FORBIDDEN');
  }
  if(rule.field==='studentId'&&actor.roleCode==='STUDENT'){
   const result=await c.query('SELECT 1 FROM "Students" WHERE "StudentID"=$1 AND "UserID"=$2 AND "DeletedAt" IS NULL',[id,actor.userId]);
   if(!result.rows.length)throw invalid('studentId is outside the authenticated student scope.',403,'FORBIDDEN');
  }
 }
}
export const explicitListScope=(rules:ScopeRule[]):RequestHandler=>async(req,_res,next)=>{
 try{
  if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))throw invalid('Provide a JSON object.');
  await readTransaction(c=>validateListScope(c,req.body,{userId:req.user!.userId,roleCode:req.user!.roleCode??''},rules));next();
 }catch(error){next(error);}
};
