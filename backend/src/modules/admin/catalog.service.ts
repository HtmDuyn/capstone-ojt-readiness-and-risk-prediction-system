import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, requiredText, optionalText, enumValue } from '../students/student.validation';
import { catalogs, record, write, apiRow } from './admin.repository';

const email=(v:unknown)=>{const s=optionalText(v,'contactEmail',100);if(s&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw invalid('Invalid contact email.');return s;};
export async function saveCompany(body:unknown,actor:number,id?:number) {
 const b=inputObject(body,['code','name','address','industry','contactPersonName','contactPhone','contactEmail','status']);
 return academicTransaction(async c=>{
  const old=id?await record(c,catalogs.companies,id):null;
  const r={...(old?apiRow(catalogs.companies,old):{}),...b};
  const values={EnterpriseCode:requiredText(r.code,'code',20).toUpperCase(),Name:requiredText(r.name,'name',200),Address:optionalText(r.address,'address',300),Industry:optionalText(r.industry,'industry',100),ContactPersonName:optionalText(r.contactPersonName,'contactPersonName',100),ContactPhone:optionalText(r.contactPhone,'contactPhone',20),ContactEmail:email(r.contactEmail),Status:enumValue(r.status??'ACTIVE',['ACTIVE','INACTIVE'],'status')};
  const row=await write(c,catalogs.companies,values,id);await audit(c,actor,'Enterprises',row.EnterpriseID,id?'UPDATE':'CREATE',old,row);return apiRow(catalogs.companies,row);
 });
}
export async function softDelete(kind:'companies'|'positions',id:number,actor:number) {
 return academicTransaction(async c=>{
  const config=catalogs[kind],old=await record(c,config,id);
  const active=(await c.query(`SELECT 1 FROM "InternshipAssignments" WHERE "${kind==='companies'?'EnterpriseID':'PositionID'}"=$1 AND COALESCE("Status",'ACTIVE') NOT IN ('COMPLETED','CANCELLED') LIMIT 1`,[id])).rowCount;
  if(active)throw invalid('Active assignments prevent deletion.',409,'ACTIVE_ASSIGNMENTS');
  if(kind==='companies'&&(await c.query(`SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "DeletedAt" IS NULL AND "Status"='OPEN' LIMIT 1`,[id])).rowCount)throw invalid('Close or delete open positions first.',409,'OPEN_POSITIONS');
  const deleted=(await c.query(`UPDATE "${config.table}" SET "DeletedAt"=now(),"Status"=$2 WHERE "${config.id}"=$1 RETURNING *`,[id,kind==='companies'?'INACTIVE':'CLOSED'])).rows[0];
  await audit(c,actor,config.table,id,'SOFT_DELETE',old,{deleted:true});
  if(kind==='companies'){
   const accounts=(await c.query(`SELECT u."UserID" AS id,u."Username" AS username,u."Email" AS email,u."FullName" AS "fullName",u."Status" AS status FROM "Users" u JOIN "EnterpriseUsers" eu ON eu."UserID"=u."UserID" WHERE eu."EnterpriseID"=$1 ORDER BY u."UserID"`,[id])).rows;
   return {company:{...apiRow(catalogs.companies,deleted),deletedAt:deleted.DeletedAt},accounts};
  }
  return {position:{...apiRow(catalogs.positions,deleted),deletedAt:deleted.DeletedAt}};
 });
}
