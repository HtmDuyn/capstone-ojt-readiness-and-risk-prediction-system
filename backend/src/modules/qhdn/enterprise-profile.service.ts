import { academicTransaction,audit } from '../academic/academic.repository';
import { inputObject,invalid,positiveId,requiredText } from '../students/student.validation';
import type { Actor,Row } from './qhdn.repository';

export async function updateEnterpriseProfile(body:unknown,actor:Actor){
 if(actor.roleCode!=='ENTERPRISE')throw invalid('Enterprise role required.',403,'FORBIDDEN');
 const fields:Record<string,[string,number]>={name:['Name',200],address:['Address',300],industry:['Industry',100],contactPersonName:['ContactPersonName',100],contactPhone:['ContactPhone',20],contactEmail:['ContactEmail',100]};
 const b=inputObject(body,['companyId','positionTitle',...Object.keys(fields)]),companyId=positiveId(b.companyId,'companyId');
 if(Object.keys(b).every(key=>key==='companyId'))throw invalid('Provide a profile field to update.');
 const text=(value:unknown,key:string,max:number,nullable=true)=>{
  if(nullable&&(value===null||value===''))return null;
  return requiredText(value,key,max);
 };
 const changes:Row={};
 for(const [key,[column,max]]of Object.entries(fields))if(b[key]!==undefined){
  changes[column]=text(b[key],key,max,key!=='name');
  if(key==='contactEmail'&&changes[column]!==null){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes[column]))throw invalid('Invalid contactEmail.');changes[column]=changes[column].toLowerCase();}
 }
 const title=b.positionTitle===undefined?undefined:text(b.positionTitle,'positionTitle',100);
 return academicTransaction(async c=>{
  const before=(await c.query(`SELECT e.*,eu."EnterpriseUserID",eu."PositionTitle",u."UserID",u."Username",u."FullName",u."Email",u."Phone" FROM "Enterprises" e JOIN "EnterpriseUsers" eu ON eu."EnterpriseID"=e."EnterpriseID" JOIN "Users" u ON u."UserID"=eu."UserID" WHERE e."EnterpriseID"=$1 AND eu."UserID"=$2 AND e."DeletedAt" IS NULL AND e."Status"='ACTIVE' FOR UPDATE OF e,eu`,[companyId,actor.userId])).rows[0];
  if(!before)throw invalid('companyId does not belong to this active enterprise account.',403,'FORBIDDEN');
  const keys=Object.keys(changes);
  if(keys.length)await c.query('UPDATE "Enterprises" SET '+keys.map((key,i)=>'"'+key+'"=$'+(i+2)).join(',')+' WHERE "EnterpriseID"=$1',[companyId,...Object.values(changes)]);
  if(title!==undefined)await c.query('UPDATE "EnterpriseUsers" SET "PositionTitle"=$3 WHERE "EnterpriseID"=$1 AND "UserID"=$2',[companyId,actor.userId,title]);
  const view=(row:Row)=>({id:row.EnterpriseID,code:row.EnterpriseCode,name:row.Name,address:row.Address,industry:row.Industry,contactPersonName:row.ContactPersonName,contactPhone:row.ContactPhone,contactEmail:row.ContactEmail,status:row.Status,createdAt:row.CreatedAt,representative:{id:row.EnterpriseUserID,userId:row.UserID,username:row.Username,fullName:row.FullName,email:row.Email,phone:row.Phone,positionTitle:row.PositionTitle}});
  const after=view({...before,...changes,PositionTitle:title===undefined?before.PositionTitle:title});
  await audit(c,actor.userId,'Enterprises',companyId,'UPDATE_OWN_PROFILE',view(before),after,'Enterprise self-service profile update');
  return after;
 });
}
