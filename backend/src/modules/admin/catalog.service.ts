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
