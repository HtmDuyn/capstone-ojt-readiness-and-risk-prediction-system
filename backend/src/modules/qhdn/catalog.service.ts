import { readTransaction } from './read.repository';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { staffContextFields, templateField, registrationField, assignmentField } from './context-fields';

export const configs = {
  companies: { table:'Enterprises', id:'EnterpriseID', fields:{code:'EnterpriseCode',name:'Name',address:'Address',industry:'Industry',contactPersonName:'ContactPersonName',contactPhone:'ContactPhone',contactEmail:'ContactEmail',status:'Status',createdAt:'CreatedAt'} },
  positions: { table:'InternshipPositions', id:'PositionID', fields:{companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',recruitmentCode:'RecruitmentCode',title:'Title',description:'Description',requirements:'Requirements',capacity:'Capacity',remainingSlots:'RemainingSlots',status:'Status',location:'Location',workMode:'WorkMode'} },
  coordinations: { table:'StudentEnterpriseCoordination', id:'CoordinationID', fields:{applicationId:'ApplicationID',registrationId:'RegistrationID',companyId:'EnterpriseID',positionId:'PositionID',coordinatedBy:'CoordinatedBy',coordinatedAt:'CoordinatedAt',decision:'Decision',decisionAt:'DecisionAt',rejectReason:'RejectReason',previousCoordinationId:'PreviousCoordinationID'} },
  assignments: { table:'InternshipAssignments', id:'AssignmentID', fields:{coordinationId:'CoordinationID',studentId:'StudentID',companyId:'EnterpriseID',positionId:'PositionID',academicSupervisorId:'AcademicSupervisorID',enterpriseSupervisorName:'EnterpriseSupervisorName',startDate:'StartDate',endDate:'EndDate',status:'Status'} },
  evaluations: { table:'InternshipEvaluations', id:'EvaluationID', fields:{templateId:'TemplateID',scoreDetails:'ScoreDetails',assignmentId:'AssignmentID',evaluatedBy:'EvaluatedBy',evaluatedAt:'EvaluatedAt',completionScore:'CompletionScore',attitudeScore:'AttitudeScore',skillScore:'SkillScore',overallScore:'OverallScore',comments:'Comments',status:'Status'} },
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
  for(const key of ['studentCode','fullName','companyName','positionTitle','ojtSemesterId','studentId','companyId','positionId','student','company','position','academicSupervisor','evaluation','result','template','registration','assignment'])if(r[key]!==undefined)out[key]=r[key];
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
export async function list(resource:Resource,params:Row,actor:Actor){
  staff(actor);
  const exactKey=resource==='companies'?'companyId':resource==='positions'?'positionId':resource==='assignments'?'assignmentId':resource==='coordinations'?'coordinationId':'evaluationId';
  const allowed=resource==='companies'?['search','status','companyId']:resource==='positions'?['search','status','companyId','positionId','ojtSemesterId']:['search','status','companyId','ojtSemesterId','studentId','positionId',...(resource==='coordinations'?['registrationId','decision','coordinationId']:resource==='evaluations'?['assignmentId','templateId','evaluationId']:['assignmentId'])];
  const p=pagination(params,[...allowed,...(exactKey?['historyPage','historyLimit']:[]),...(resource==='coordinations'?['coordinationPage','coordinationLimit']:[])]);if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const historyPaging=pagination({page:params.historyPage,limit:params.historyLimit},[]);
  if(historyPaging.offset>2147483647)throw invalid('History pagination exceeds allowed range.');
  if((params.historyPage!==undefined||params.historyLimit!==undefined)&&(!exactKey||params[exactKey]===undefined))throw invalid('Select one record by ID before paging its history.');
  if((params.coordinationPage!==undefined||params.coordinationLimit!==undefined)&&params.coordinationId===undefined)throw invalid('Select coordinationId before paging the coordination chain.');
  const chainPaging=pagination({page:params.coordinationPage,limit:params.coordinationLimit},[]);
  if(chainPaging.offset>2147483647)throw invalid('Coordination pagination exceeds allowed range.');
  return readTransaction(async c=>{
    const args:unknown[]=[],filters:string[]=[];
    const add=(col:string,value:unknown)=>{args.push(value);filters.push(`${col}=$${args.length}`);};
    if(exactKey&&params[exactKey]!==undefined)add(`t."${configs[resource].id}"`,positiveId(params[exactKey],exactKey));
    if(resource==='companies'||resource==='positions')filters.push('t."DeletedAt" IS NULL');
    let from=`FROM "${configs[resource].table}" t`;
    let extras='',companyColumn='t."EnterpriseID"';
    if(resource==='positions'){from+=' JOIN "Enterprises" e ON e."EnterpriseID"=t."EnterpriseID"';extras=`,e."Name" AS "companyName",(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=t."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS "Occupied"`;}
    if(['coordinations','assignments','evaluations'].includes(resource)){
      if(resource==='coordinations')from+=' JOIN "OJTRegistrations" r ON r."RegistrationID"=t."RegistrationID"';
      else {if(resource==='evaluations')from+=' JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"';from+=` JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=${resource==='assignments'?'t':'a'}."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"`;}
      companyColumn=resource==='evaluations'?'a."EnterpriseID"':'t."EnterpriseID"';
      from+=` JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" JOIN "Enterprises" e ON e."EnterpriseID"=${companyColumn}`;
      extras=',s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."OJTSemesterID" AS "ojtSemesterId",r."StudentID" AS "studentId",e."Name" AS "companyName"';
      if(resource==='assignments'){
        from+=' JOIN "InternshipPositions" pos ON pos."PositionID"=t."PositionID" LEFT JOIN "Users" supervisor ON supervisor."UserID"=t."AcademicSupervisorID" LEFT JOIN "InternshipEvaluations" ev ON ev."AssignmentID"=t."AssignmentID" LEFT JOIN "OJTResults" outcome ON outcome."AssignmentID"=t."AssignmentID"';
        extras+=`,pos."Title" AS "positionTitle",
          jsonb_build_object('id',s."StudentID",'studentCode',s."StudentCode",'fullName',u."FullName",'email',u."Email",'phone',u."Phone") AS student,
          jsonb_build_object('id',e."EnterpriseID",'code',e."EnterpriseCode",'name',e."Name",'contactPersonName',e."ContactPersonName",'contactPhone',e."ContactPhone",'contactEmail',e."ContactEmail") AS company,
          jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title",'description',pos."Description",'requirements',pos."Requirements",'location',pos."Location",'workMode',pos."WorkMode",'ojtSemesterId',pos."OJTSemesterID") AS position,
          CASE WHEN supervisor."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") END AS "academicSupervisor",
          CASE WHEN ev."EvaluationID" IS NULL THEN NULL ELSE jsonb_build_object('id',ev."EvaluationID",'templateId',ev."TemplateID",'scoreDetails',ev."ScoreDetails",'completionScore',ev."CompletionScore",'attitudeScore',ev."AttitudeScore",'skillScore',ev."SkillScore",'overallScore',ev."OverallScore",'comments',ev."Comments",'status',ev."Status",'evaluatedBy',ev."EvaluatedBy",'evaluatedAt',ev."EvaluatedAt") END AS evaluation,
          CASE WHEN outcome."ResultID" IS NULL THEN NULL ELSE jsonb_build_object('id',outcome."ResultID",'status',outcome."Status",'version',outcome."Version",'officialScore',outcome."OfficialScore",'outcome',outcome."Outcome",'confirmedAt',outcome."ConfirmedAt",'evaluationLocked',outcome."Status"='CONFIRMED') END AS result`;
      }
      if(resource==='coordinations'||resource==='evaluations'){
        from+=` JOIN "InternshipPositions" pos ON pos."PositionID"=${resource==='evaluations'?'a':'t'}."PositionID"`;
        extras+=','+staffContextFields+','+registrationField;
        if(resource==='evaluations'){from+=' LEFT JOIN "AssessmentTemplates" tmpl ON tmpl."TemplateID"=t."TemplateID"';extras+=','+templateField+','+assignmentField;}
      }
      for(const [key,col] of Object.entries({ojtSemesterId:'r."OJTSemesterID"',studentId:'r."StudentID"',registrationId:'t."RegistrationID"',assignmentId:'t."AssignmentID"',positionId:resource==='evaluations'?'a."PositionID"':'t."PositionID"'}))if(params[key]!==undefined&&key!==exactKey)add(col,positiveId(params[key],key));
      if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`);}
    }else if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(resource==='companies'?`(t."Name" ILIKE $${args.length} OR t."EnterpriseCode" ILIKE $${args.length})`:`(t."Title" ILIKE $${args.length} OR t."RecruitmentCode" ILIKE $${args.length})`);}
    if(resource!=='companies'&&params.companyId!==undefined)add(companyColumn,positiveId(params.companyId,'companyId'));
    if(resource==='positions'&&params.ojtSemesterId!==undefined)add('t."OJTSemesterID"',positiveId(params.ojtSemesterId,'ojtSemesterId'));
    if(resource==='evaluations'&&params.templateId!==undefined)add('t."TemplateID"',positiveId(params.templateId,'templateId'));
    const states=resource==='companies'?['ACTIVE','INACTIVE']:resource==='positions'?['OPEN','CLOSED']:resource==='assignments'?['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED']:resource==='evaluations'?['SUBMITTED']:['PENDING','ACCEPTED','REJECTED'];
    if(params.status!==undefined||params.decision!==undefined){
      if(params.status!==undefined&&params.decision!==undefined&&params.status!==params.decision)throw invalid('status conflicts with decision.');
      add(resource==='coordinations'?`COALESCE(UPPER(t."Decision"),'PENDING')`:'t."Status"',resource==='evaluations'?requiredText(params.status,'status',20):enumValue(params.decision??params.status,states,'status'));
    }
    const where=filters.length?' WHERE '+filters.join(' AND '):'';
    const count=(await c.query(`SELECT count(*)::int AS n ${from}${where}`,args)).rows[0].n;
    const rows=(await c.query(`SELECT t.*${extras} ${from}${where} ORDER BY t."${configs[resource].id}" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    const items=rows.map(r=>api(resource,r));
    if(exactKey&&params[exactKey]!==undefined)for(const item of items){
      const historyTotal=(await c.query('SELECT count(*)::int AS n FROM "AuditLogs" WHERE "EntityType"=$1 AND "EntityID"=$2',[configs[resource].table,item.id])).rows[0].n;
      item.history=(await c.query(`SELECT "LogID" AS id,"UserID" AS "actorId","Action" AS action,"Detail"::jsonb AS detail,"ActionAt" AS "createdAt" FROM "AuditLogs" WHERE "EntityType"=$1 AND "EntityID"=$2 ORDER BY "LogID" DESC LIMIT $3 OFFSET $4`,[configs[resource].table,item.id,historyPaging.limit,historyPaging.offset])).rows;
      item.historyPagination={total:historyTotal,page:historyPaging.page,limit:historyPaging.limit};
      if(resource==='coordinations') {
        const registrationId=item.registrationId;
        const chainTotal=(await c.query('SELECT count(*)::int AS n FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1',[registrationId])).rows[0].n;
        item.coordinationHistory=(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT $2 OFFSET $3',[registrationId,chainPaging.limit,chainPaging.offset])).rows.map(row=>api('coordinations',row));
        item.coordinationHistoryPagination={total:chainTotal,page:chainPaging.page,limit:chainPaging.limit};
      }
    }
    return {items,total:count,page:p.page,limit:p.limit};
  });
}
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
