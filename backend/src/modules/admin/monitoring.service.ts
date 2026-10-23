import { positiveId, requiredText, pagination, invalid } from '../students/student.validation';
import { pageSql, type Row } from './admin.repository';

export async function auditLogs(params:Row) {
 const p=pagination(params,['logId','userId','entityType','entityId','action']),args:unknown[]=[],where:string[]=[];
 if(p.offset>2147483647)throw invalid('Pagination exceeds the allowed range.');
 for(const [key,col]of Object.entries({logId:'LogID',userId:'UserID',entityType:'EntityType',entityId:'EntityID',action:'Action'}))if(params[key]!==undefined){args.push(key.endsWith('Id')?positiveId(params[key],key):requiredText(params[key],key,100));where.push(`a."${col}"=$${args.length}`);}
 const page=await pageSql(`SELECT a."LogID" AS id,a."UserID" AS "userId",a."EntityType" AS "entityType",a."EntityID" AS "entityId",a."Action" AS action,a."Detail" AS detail,a."ActionAt" AS "createdAt",a."IPAddress" AS "ipAddress",to_jsonb(a) AS "rawLog",
 CASE WHEN u."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',u."UserID",'username',u."Username",'fullName',u."FullName",'email',u."Email",'status',u."Status",'roleId',u."RoleID",'roleCode',r."RoleCode",'roleName',r."RoleName") END AS "user"
 FROM "AuditLogs" a LEFT JOIN "Users" u ON u."UserID"=a."UserID" LEFT JOIN "Roles" r ON r."RoleID"=u."RoleID"${where.length?' WHERE '+where.join(' AND '):''}`,args,p);
 return {...page,items:page.items.map((row:Row)=>{
  let detail=row.detail;
  if(typeof detail==='string'){try{detail=JSON.parse(detail);}catch{/* Preserve non-JSON log text exactly as stored. */}}
  return {...row,detail};
 })};
}
