import { academicTransaction, audit, asApi, findRecord } from '../academic/academic.repository';
import { invalid, inputObject, requiredText, optionalText, positiveId, enumValue } from '../students/student.validation';
import { catalogs, record, write, apiRow, type Row } from './admin.repository';
import { query } from '../../config/database';

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
export async function savePosition(body:unknown,actor:number,id?:number) {
 const b=inputObject(body,['companyId','ojtSemesterId','recruitmentCode','title','description','requirements','capacity','status','location','workMode']);
 return academicTransaction(async c=>{
  const old=id?await record(c,catalogs.positions,id):null,r={...(old?apiRow(catalogs.positions,old):{}),...b};
  const companyId=positiveId(r.companyId,'companyId'),semesterId=positiveId(r.ojtSemesterId,'ojtSemesterId');
  const company=await record(c,catalogs.companies,companyId);if(company.Status!=='ACTIVE')throw invalid('Company is inactive.',409);
  await findRecord(c,'ojt-semesters',semesterId);
  if(old&&(old.EnterpriseID!==companyId||old.OJTSemesterID!==semesterId))throw invalid('Company and semester are immutable; create a new position.',409);
  const capacity=positiveId(r.capacity,'capacity');
  if(capacity>100000)throw invalid('capacity must not exceed 100000.');
  const used=old?(await c.query(`SELECT count(*)::int AS n FROM "InternshipAssignments" WHERE "PositionID"=$1 AND COALESCE("Status",'ACTIVE')<>'CANCELLED'`,[id])).rows[0].n:0;
  if(capacity<used)throw invalid('Capacity cannot be lower than assigned students.',409,'CAPACITY_CONFLICT');
  const values={EnterpriseID:companyId,OJTSemesterID:semesterId,RecruitmentCode:requiredText(r.recruitmentCode,'recruitmentCode',60).toUpperCase(),Title:requiredText(r.title,'title',150),Description:optionalText(r.description,'description',20000),Requirements:optionalText(r.requirements,'requirements',20000),Capacity:capacity,RemainingSlots:capacity-used,Status:enumValue(r.status??'OPEN',['OPEN','CLOSED'],'status'),Location:optionalText(r.location,'location',300),WorkMode:r.workMode==null?null:enumValue(r.workMode,['ONSITE','REMOTE','HYBRID'],'workMode')};
  const row=await write(c,catalogs.positions,values,id);await audit(c,actor,'InternshipPositions',row.PositionID,id?'UPDATE':'CREATE',old,row);return apiRow(catalogs.positions,row);
 });
}
export async function softDelete(kind:'companies'|'positions',id:number,actor:number) {
 return academicTransaction(async c=>{
  const config=catalogs[kind],old=await record(c,config,id);
  const active=(await c.query(`SELECT 1 FROM "InternshipAssignments" WHERE "${kind==='companies'?'EnterpriseID':'PositionID'}"=$1 AND COALESCE("Status",'ACTIVE') NOT IN ('COMPLETED','CANCELLED') LIMIT 1`,[id])).rowCount;
  if(active)throw invalid('Active assignments prevent deletion.',409,'ACTIVE_ASSIGNMENTS');
  if(kind==='companies'&&(await c.query(`SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "DeletedAt" IS NULL AND "Status"='OPEN' LIMIT 1`,[id])).rowCount)throw invalid('Close or delete open positions first.',409,'OPEN_POSITIONS');
  await c.query(`UPDATE "${config.table}" SET "DeletedAt"=now(),"Status"=$2 WHERE "${config.id}"=$1`,[id,kind==='companies'?'INACTIVE':'CLOSED']);
  await audit(c,actor,config.table,id,'SOFT_DELETE',old,{deleted:true});
 });
}
export async function semesterDetail(id:number) {
 const row=(await query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[id])).rows[0];
 if(!row)throw invalid('OJT semester not found.',404);
 return asApi('ojt-semesters',row);
}

export function criteriaInput(value:unknown) {
 if(!Array.isArray(value)||!value.length||value.length>100)throw invalid('criteria must contain 1–100 entries.');
 const seen=new Set<string>();
 const criteria=value.map(item=>{const b=inputObject(item,['code','name','weight','maxScore']);const code=requiredText(b.code,'code',50);if(seen.has(code))throw invalid('Criterion codes must be unique.');seen.add(code);
  if(typeof b.weight!=='number'||!Number.isFinite(b.weight)||b.weight<=0||b.weight>100||Math.abs(Math.round(b.weight*100)-b.weight*100)>1e-7)throw invalid('weight must be positive, at most 100, with two decimals.');
  if(typeof b.maxScore!=='number'||!Number.isFinite(b.maxScore)||b.maxScore<=0||b.maxScore>100)throw invalid('maxScore must be between 0 and 100, exclusive of 0.');
  return {code,name:requiredText(b.name,'name',150),weight:b.weight,maxScore:b.maxScore};});
 if(Math.abs(criteria.reduce((n,x)=>n+x.weight,0)-100)>1e-7)throw invalid('Criterion weights must total 100.');return criteria;
}
export async function saveTemplate(body:unknown,actor:number,id?:number) {
 const b=inputObject(body,['code','version','name','criteria']);
 return academicTransaction(async c=>{const old=id?await record(c,catalogs.templates,id):null;
  if(old?.Status==='PUBLISHED')throw invalid('Published template is immutable; create the next version.',409,'TEMPLATE_IMMUTABLE');
  const r={...(old?apiRow(catalogs.templates,old):{}),...b};
  if(old&&(b.code!==undefined||b.version!==undefined))throw invalid('Template code and version are immutable.',409);
  const values:Row={Code:requiredText(r.code,'code',50).toUpperCase(),Version:positiveId(r.version,'version'),Name:requiredText(r.name,'name',150),Criteria:JSON.stringify(criteriaInput(r.criteria))};
  if(!id)values.CreatedBy=actor;
  const row=await write(c,catalogs.templates,values,id);await audit(c,actor,'AssessmentTemplates',row.TemplateID,id?'UPDATE':'CREATE',old,row);return apiRow(catalogs.templates,row);
 });
}
export async function publishTemplate(id:number,actor:number) {
 return academicTransaction(async c=>{const old=await record(c,catalogs.templates,id);if(old.Status==='PUBLISHED')return apiRow(catalogs.templates,old);criteriaInput(old.Criteria);
  const row=await write(c,catalogs.templates,{Status:'PUBLISHED',PublishedAt:new Date()},id);await audit(c,actor,'AssessmentTemplates',id,'PUBLISH',old,row);return apiRow(catalogs.templates,row);
 });
}
