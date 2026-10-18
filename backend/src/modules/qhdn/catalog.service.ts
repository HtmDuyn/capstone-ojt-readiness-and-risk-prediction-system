import { readTransaction } from './read.repository';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

export const configs = {
  companies: { table:'Enterprises', id:'EnterpriseID', fields:{code:'EnterpriseCode',name:'Name',address:'Address',industry:'Industry',contactPersonName:'ContactPersonName',contactPhone:'ContactPhone',contactEmail:'ContactEmail',status:'Status',createdAt:'CreatedAt'} },
  positions: { table:'InternshipPositions', id:'PositionID', fields:{companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',title:'Title',description:'Description',requirements:'Requirements',capacity:'Capacity',remainingSlots:'RemainingSlots',status:'Status'} },
  coordinations: { table:'StudentEnterpriseCoordination', id:'CoordinationID', fields:{registrationId:'RegistrationID',companyId:'EnterpriseID',positionId:'PositionID',coordinatedBy:'CoordinatedBy',coordinatedAt:'CoordinatedAt',decision:'Decision',decisionAt:'DecisionAt',rejectReason:'RejectReason',previousCoordinationId:'PreviousCoordinationID'} },
  assignments: { table:'InternshipAssignments', id:'AssignmentID', fields:{coordinationId:'CoordinationID',studentId:'StudentID',companyId:'EnterpriseID',positionId:'PositionID',enterpriseSupervisorName:'EnterpriseSupervisorName',startDate:'StartDate',endDate:'EndDate',status:'Status'} },
  evaluations: { table:'InternshipEvaluations', id:'EvaluationID', fields:{assignmentId:'AssignmentID',evaluatedBy:'EvaluatedBy',evaluatedAt:'EvaluatedAt',completionScore:'CompletionScore',attitudeScore:'AttitudeScore',skillScore:'SkillScore',overallScore:'OverallScore',comments:'Comments',status:'Status'} },
} as const;
export type Resource=keyof typeof configs;
export function api(resource:Resource,r:Row):Row {
  const cfg=configs[resource],out:Row={id:r[cfg.id]};
  for(const [key,col] of Object.entries(cfg.fields)){
    let value=r[col];
    if(key.endsWith('Score')&&value!=null)value=Number(value);
    if(['startDate','endDate'].includes(key)&&value instanceof Date)value=`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
    out[key]=value;
  }
  if(resource==='positions'&&r.Occupied!==undefined)out.remainingSlots=Math.max(0,(r.Capacity??0)-r.Occupied);
  for(const key of ['studentCode','fullName','companyName','positionTitle','ojtSemesterId','studentId'])if(r[key]!==undefined)out[key]=r[key];
  return out;
}
export async function enterpriseScope(c:PoolClient,actor:Actor):Promise<number|null> {
  if(['ADMIN','OJT_COORD'].includes(actor.roleCode))return null;
  if(actor.roleCode!=='ENTERPRISE')throw invalid('Role not permitted.',403,'FORBIDDEN');
  const row=(await c.query('SELECT eu."EnterpriseID" FROM "EnterpriseUsers" eu JOIN "Enterprises" e ON e."EnterpriseID"=eu."EnterpriseID" WHERE eu."UserID"=$1 AND e."Status"=\'ACTIVE\'',[actor.userId])).rows[0];
  if(!row)throw invalid('An active enterprise membership is required.',403,'ENTERPRISE_SCOPE_REQUIRED');
  return row.EnterpriseID;
}
export async function assertScope(c:PoolClient,actor:Actor,enterpriseId:number){const own=await enterpriseScope(c,actor);if(own!==null&&own!==enterpriseId)throw invalid('This record belongs to another enterprise.',403,'FORBIDDEN');}
export function staff(actor:Actor){if(!['ADMIN','OJT_COORD'].includes(actor.roleCode))throw invalid('QHDN staff required.',403,'FORBIDDEN');}
export async function record(c:PoolClient,resource:Resource,id:number,lock=true):Promise<Row>{
  const cfg=configs[resource],row=(await c.query(`SELECT * FROM "${cfg.table}" WHERE "${cfg.id}"=$1${lock?' FOR UPDATE':''}`,[id])).rows[0];
  if(!row)throw invalid(`${resource} record not found.`,404,'QHDN_RECORD_NOT_FOUND');return row;
}
export async function occupied(c:PoolClient,positionId:number){return (await c.query(`SELECT count(*)::int AS n FROM "InternshipAssignments" WHERE "PositionID"=$1 AND COALESCE(UPPER("Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[positionId])).rows[0].n as number;}
export async function refreshSlots(c:PoolClient,positionId:number){await c.query(`UPDATE "InternshipPositions" SET "RemainingSlots"=GREATEST(0,"Capacity"-(SELECT count(*)::int FROM "InternshipAssignments" WHERE "PositionID"=$1 AND COALESCE(UPPER("Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED'))) WHERE "PositionID"=$1`,[positionId]);}
export async function persist(c:PoolClient,resource:Resource,values:Row,id?:number):Promise<Row>{
  const cfg=configs[resource],cols=Object.keys(values),args=Object.values(values);
  return (await c.query(id?`UPDATE "${cfg.table}" SET ${cols.map((k,i)=>`"${k}"=$${i+1}`).join(',')} WHERE "${cfg.id}"=$${args.length+1} RETURNING *`:`INSERT INTO "${cfg.table}" (${cols.map(k=>`"${k}"`).join(',')}) VALUES (${cols.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,id?[...args,id]:args)).rows[0];
}
export async function log(c:PoolClient,resource:Resource,before:Row|null,after:Row,actor:Actor,action:string,reason:string,extra:Row={}){
  await audit(c,actor.userId,configs[resource].table,after[configs[resource].id],action,before?api(resource,before):null,{...api(resource,after),...extra,actorRole:actor.roleCode,enteredOnBehalf:actor.roleCode==='OJT_COORD'&&['ENTERPRISE_DECISION','SUBMIT_EVALUATION','UPDATE_EVALUATION'].includes(action)},reason);
}
export async function history(c:PoolClient,resource:Resource,id:number){return (await c.query(`SELECT "LogID" AS id,"UserID" AS "actorId","Action" AS action,"Detail"::jsonb AS detail,"ActionAt" AS "createdAt" FROM "AuditLogs" WHERE "EntityType"=$1 AND "EntityID"=$2 ORDER BY "LogID"`,[configs[resource].table,id])).rows;}
export async function list(resource:Resource,params:Row,actor:Actor){
  staff(actor);
  const allowed=resource==='companies'?['search','status']:resource==='positions'?['search','status','companyId','ojtSemesterId']:['search','status','companyId','ojtSemesterId','studentId','positionId',...(resource==='coordinations'?['registrationId','decision']:resource==='evaluations'?['assignmentId']:[])];
  const p=pagination(params,allowed);if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c=>{
    const args:unknown[]=[],filters:string[]=[];
    const add=(col:string,value:unknown)=>{args.push(value);filters.push(`${col}=$${args.length}`);};
    let from=`FROM "${configs[resource].table}" t`;
    let extras='',companyColumn='t."EnterpriseID"';
    if(resource==='positions'){from+=' JOIN "Enterprises" e ON e."EnterpriseID"=t."EnterpriseID"';extras=`,e."Name" AS "companyName",(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=t."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS "Occupied"`;}
    if(['coordinations','assignments','evaluations'].includes(resource)){
      if(resource==='coordinations')from+=' JOIN "OJTRegistrations" r ON r."RegistrationID"=t."RegistrationID"';
      else {if(resource==='evaluations')from+=' JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"';from+=` JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=${resource==='assignments'?'t':'a'}."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"`;}
      companyColumn=resource==='evaluations'?'a."EnterpriseID"':'t."EnterpriseID"';
      from+=` JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" JOIN "Enterprises" e ON e."EnterpriseID"=${companyColumn}`;
      extras=',s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."OJTSemesterID" AS "ojtSemesterId",r."StudentID" AS "studentId",e."Name" AS "companyName"';
      for(const [key,col] of Object.entries({ojtSemesterId:'r."OJTSemesterID"',studentId:'r."StudentID"',registrationId:'t."RegistrationID"',assignmentId:'t."AssignmentID"',positionId:resource==='evaluations'?'a."PositionID"':'t."PositionID"'}))if(params[key]!==undefined)add(col,positiveId(params[key],key));
      if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`);}
    }else if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(resource==='companies'?`(t."Name" ILIKE $${args.length} OR t."EnterpriseCode" ILIKE $${args.length})`:`t."Title" ILIKE $${args.length}`);}
    if(params.companyId!==undefined)add(companyColumn,positiveId(params.companyId,'companyId'));
    if(resource==='positions'&&params.ojtSemesterId!==undefined)add('t."OJTSemesterID"',positiveId(params.ojtSemesterId,'ojtSemesterId'));
    const states=resource==='companies'?['ACTIVE','INACTIVE']:resource==='positions'?['OPEN','CLOSED']:resource==='assignments'?['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED']:resource==='evaluations'?['SUBMITTED']:['PENDING','ACCEPTED','REJECTED'];
    if(params.status!==undefined||params.decision!==undefined){
      if(params.status!==undefined&&params.decision!==undefined&&params.status!==params.decision)throw invalid('status conflicts with decision.');
      add(resource==='coordinations'?`COALESCE(UPPER(t."Decision"),'PENDING')`:'t."Status"',enumValue(params.decision??params.status,states,'status'));
    }
    const where=filters.length?' WHERE '+filters.join(' AND '):'';
    const count=(await c.query(`SELECT count(*)::int AS n ${from}${where}`,args)).rows[0].n;
    const rows=(await c.query(`SELECT t.*${extras} ${from}${where} ORDER BY t."${configs[resource].id}" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    return {items:rows.map(r=>api(resource,r)),total:count,page:p.page,limit:p.limit};
  });
}
export async function details(resource:Resource,id:number,actor:Actor){staff(actor);return readTransaction(async c=>{
  const r=await record(c,resource,id,false);
  if(resource==='positions')r.Occupied=await occupied(c,id);
  const out=api(resource,r);
  if(resource==='coordinations'){
    const registration=(await c.query('SELECT "RegistrationID","StudentID","OJTSemesterID","Application" FROM "OJTRegistrations" WHERE "RegistrationID"=$1',[r.RegistrationID])).rows[0];
    out.registration={id:registration.RegistrationID,studentId:registration.StudentID,ojtSemesterId:registration.OJTSemesterID,application:registration.Application};
    const chain=(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID"',[r.RegistrationID])).rows;
    out.coordinationHistory=chain.map(row=>api('coordinations',row));
  }
  out.history=await history(c,resource,id);
  return out;
});}
export async function saveCompany(body:unknown,actor:Actor,id?:number){staff(actor);const b=inputObject(body,['code','name','address','industry','contactPersonName','contactPhone','contactEmail','status','reason']);
  return academicTransaction(async c=>{
    const before=id?await record(c,'companies',id):null,values:Row={};
    const reason=requiredText(b.reason,'reason',2000);
    const lengths:Row={code:20,name:200,address:300,industry:100,contactPersonName:100,contactPhone:20,contactEmail:100};
    for(const [key,max] of Object.entries(lengths))if(key in b||(!id&&['code','name'].includes(key)))values[(configs.companies.fields as Row)[key]]=['code','name'].includes(key)?requiredText(b[key],key,max as number):optionalText(b[key],key,max as number);
    if(values.ContactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ContactEmail))throw invalid('contactEmail is invalid.');
    if(!id||'status' in b)values.Status=enumValue(b.status??'ACTIVE',['ACTIVE','INACTIVE'],'status');
    if(!Object.keys(values).length)throw invalid('Provide an editable field.');
    if(values.Status==='INACTIVE'){
      const active=(await c.query(`SELECT 1 FROM "InternshipAssignments" WHERE "EnterpriseID"=$1 AND COALESCE(UPPER("Status"),'ASSIGNED') IN ('ASSIGNED','ACTIVE','IN_PROGRESS') LIMIT 1`,[id])).rowCount;
      if(active)throw invalid('Cannot deactivate a company with active assignments.',409,'COMPANY_IN_USE');
    }
    const after=await persist(c,'companies',values,id);await log(c,'companies',before,after,actor,id?'UPDATE':'CREATE',reason);return api('companies',after);
  });
}
export async function savePosition(body:unknown,actor:Actor,id?:number){staff(actor);const b=inputObject(body,['companyId','ojtSemesterId','title','description','requirements','capacity','status','reason']);return academicTransaction(async c=>{
  const before=id?await record(c,'positions',id):null,values:Row={},reason=requiredText(b.reason,'reason',2000);
  if(id&&('companyId' in b||'ojtSemesterId' in b))throw invalid('Position company and semester cannot change.');
  if(!id){values.EnterpriseID=positiveId(b.companyId,'companyId');values.OJTSemesterID=positiveId(b.ojtSemesterId,'ojtSemesterId');if(!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[values.OJTSemesterID])).rowCount)throw invalid('OJT semester not found.',404);}
  const company=await record(c,'companies',before?.EnterpriseID??values.EnterpriseID);
  for(const key of ['title','description','requirements'])if(key in b||(!id&&key==='title'))values[(configs.positions.fields as Row)[key]]=key==='title'?requiredText(b[key],key,150):optionalText(b[key],key,10000);
  if(!id||'capacity' in b)values.Capacity=positiveId(b.capacity,'capacity');
  if(!id||'status' in b)values.Status=enumValue(b.status??'OPEN',['OPEN','CLOSED'],'status');
  if(!Object.keys(values).length)throw invalid('Provide an editable field.');
  if((values.Status??before?.Status)==='OPEN'&&company.Status!=='ACTIVE')throw invalid('An open position requires an active company.',409);
  const used=id?await occupied(c,id):0,capacity=values.Capacity??before?.Capacity;
  if(capacity<used)throw invalid('Capacity cannot be lower than occupied slots.',409,'POSITION_CAPACITY_CONFLICT');
  values.RemainingSlots=capacity-used;
  const after=await persist(c,'positions',values,id);await log(c,'positions',before,after,actor,id?'UPDATE':'CREATE',reason);return api('positions',after);
});}
