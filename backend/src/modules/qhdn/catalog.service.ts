import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, positiveId, requiredText, optionalText, invalid, pagination, enumValue } from '../students/student.validation';
import { semester } from '../ojt-registration/window.service';
import { resources, asApi, record, requireStaff, enterpriseScope, assertAccess, reservedSeats, remaining, syncSlots, history, type Resource, type Actor, type Row } from './qhdn.repository';

export async function list(resource: Resource, params: Row, actor: Actor) {
  params = {...params};
  if (params.companyId !== undefined) {
    if (params.enterpriseId !== undefined && positiveId(params.enterpriseId,'enterpriseId') !== positiveId(params.companyId,'companyId')) throw invalid('companyId conflicts with enterpriseId.');
    params.enterpriseId = params.companyId; delete params.companyId;
  }
  const allowed: Record<Resource,string[]> = {
    companies:['status','industry','search'], positions:['enterpriseId','ojtSemesterId','status','search'],
    coordinations:['enterpriseId','ojtSemesterId','registrationId','applicationId','decision','search'],
    assignments:['enterpriseId','ojtSemesterId','studentId','positionId','status','search'],
    evaluations:['enterpriseId','ojtSemesterId','studentId','assignmentId','status','search'],
  };
  const p = pagination(params,allowed[resource]);
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  return academicTransaction(async c => {
    const scope = await enterpriseScope(c,actor), cfg = resources[resource];
    const args: unknown[] = [], filters: string[] = [];
    if (resource === 'companies' || resource === 'positions') filters.push('t."DeletedAt" IS NULL');
    const add = (expression: string, value: unknown) => { args.push(value); filters.push(`${expression}=$${args.length}`); };
    const enterpriseColumn = resource === 'evaluations' ? 'a."EnterpriseID"' : 't."EnterpriseID"';
    if (scope !== null) add(enterpriseColumn,scope);
    let join = '', search: string[], semesterColumn = 't."OJTSemesterID"';
    if (resource === 'companies') search = ['t."EnterpriseCode"','t."Name"'];
    else if (resource === 'positions') search = ['t."Title"','t."RecruitmentCode"'];
    else {
      join = resource === 'coordinations'
        ? 'JOIN "OJTRegistrations" r ON r."RegistrationID"=t."RegistrationID"'
        : resource === 'assignments'
          ? 'JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=t."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"'
          : 'JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID" JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"';
      join += ' JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"';
      search = ['s."StudentCode"','u."FullName"']; semesterColumn = 'r."OJTSemesterID"';
    }
    for (const key of ['enterpriseId','ojtSemesterId','studentId','assignmentId','registrationId','positionId','applicationId']) if (params[key] !== undefined) {
      const column = key === 'enterpriseId' ? enterpriseColumn : key === 'ojtSemesterId' ? semesterColumn : key === 'studentId' ? 'r."StudentID"' : key === 'assignmentId' ? 't."AssignmentID"' : key === 'applicationId' ? 't."ApplicationID"' : key === 'positionId' ? 't."PositionID"' : 't."RegistrationID"';
      add(column,positiveId(params[key],key));
    }
    for (const key of ['status','industry']) if (params[key] !== undefined) add(`t."${key === 'status' ? 'Status' : 'Industry'}"`,requiredText(params[key],key,100));
    if (params.decision !== undefined) add(`COALESCE(t."Decision",'PENDING')`,enumValue(params.decision,['PENDING','ACCEPTED','REJECTED','REASSIGNED','WITHDRAWN'],'decision'));
    if (params.search !== undefined) { args.push(`%${requiredText(params.search,'search',100)}%`); filters.push(`(${search.map(col=>`${col} ILIKE $${args.length}`).join(' OR ')})`); }
    const extra = resource === 'positions' ? `,CASE WHEN t."Capacity" IS NULL THEN NULL ELSE GREATEST(0,t."Capacity"-${reservedSeats('t')}) END AS "remainingSlots"` : resource === 'assignments' ? ',r."OJTSemesterID"' : '';
    const sql = `SELECT t.*${extra} FROM "${cfg.table}" t ${join} ${filters.length ? 'WHERE '+filters.join(' AND ') : ''}`;
    const result = (await c.query(`WITH filtered AS (${sql}), paged AS (SELECT * FROM filtered ORDER BY "${cfg.id}" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY paged."${cfg.id}" DESC) FILTER (WHERE paged."${cfg.id}" IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
    return { ...result,items:result.items.map((r:Row)=>asApi(resource,r)),page:p.page,limit:p.limit };
  });
}
export async function details(resource: Resource, id: number, actor: Actor) {
  return academicTransaction(async c => {
    const row = await record(c,resource,id); await assertAccess(c,resource,row,actor);
    const value = asApi(resource,row);
    if (resource === 'positions') value.remainingSlots = row.Capacity == null ? null : (await remaining(c,id)).remainingSlots;
    if (resource === 'assignments') value.ojtSemesterId = (await record(c,'coordinations',row.CoordinationID)).OJTSemesterID;
    value.history = await history(c,resource,id);
    if(actor.roleCode==='ENTERPRISE')value.history=value.history.map((e:Row)=>({action:e.action,createdAt:e.createdAt}));
    if (resource === 'coordinations') {
      const scope = await enterpriseScope(c,actor);
      value.coordinationHistory = (await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 AND ($2::int IS NULL OR "EnterpriseID"=$2) ORDER BY "CoordinationID"',[row.RegistrationID,scope])).rows.map(r=>asApi('coordinations',r));
    }
    return value;
  });
}
async function write(c: import('pg').PoolClient, resource: 'companies'|'positions', values: Row, id?: number) {
  const cfg = resources[resource], entries = Object.entries(values), columns = entries.map(([key])=>`"${key}"`), args = entries.map(([,v])=>v);
  return id === undefined
    ? (await c.query(`INSERT INTO "${cfg.table}" (${columns.join(',')}) VALUES (${args.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,args)).rows[0]
    : (await c.query(`UPDATE "${cfg.table}" SET ${columns.map((col,i)=>`${col}=$${i+1}`).join(',')} WHERE "${cfg.id}"=$${args.length+1} RETURNING *`,[...args,id])).rows[0];
}
export async function saveCompany(body: unknown, actor: Actor, id?: number) {
  requireStaff(actor);
  const b = inputObject(body,['enterpriseCode','code','name','address','industry','contactPersonName','contactPhone','contactEmail','status','reason']);
  if (b.code !== undefined) { if (b.enterpriseCode !== undefined && b.code !== b.enterpriseCode) throw invalid('code conflicts with enterpriseCode.'); b.enterpriseCode = b.code; }
  const reason = optionalText(b.reason,'reason',2000), values: Row = {};
  for (const [key,col,max] of [['enterpriseCode','EnterpriseCode',20],['name','Name',200]] as const) if (id === undefined || key in b) values[col] = requiredText(b[key],key,max);
  for (const [key,col,max] of [['address','Address',300],['industry','Industry',100],['contactPersonName','ContactPersonName',100],['contactPhone','ContactPhone',20],['contactEmail','ContactEmail',100]] as const) if (key in b) values[col] = optionalText(b[key],key,max);
  if (values.ContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ContactEmail)) throw invalid('contactEmail is invalid.');
  if (id === undefined || 'status' in b) values.Status = enumValue(b.status ?? 'ACTIVE',['ACTIVE','INACTIVE'],'status');
  if (!Object.keys(values).length) throw invalid('Provide at least one company field.');
  return academicTransaction(async c => {
    const before = id === undefined ? null : await record(c,'companies',id);
    const after = await write(c,'companies',values,id);
    await audit(c,actor.userId,'Enterprises',after.EnterpriseID,id === undefined ? 'CREATE' : 'UPDATE',before,after,reason ?? undefined);
    return asApi('companies',after);
  });
}
export async function savePosition(body: unknown, actor: Actor, id?: number) {
  requireStaff(actor);
  const b = inputObject(body,['enterpriseId','companyId','ojtSemesterId','recruitmentCode','title','description','requirements','capacity','status','location','workMode','reason']);
  if (b.companyId !== undefined) { if (b.enterpriseId !== undefined && positiveId(b.enterpriseId,'enterpriseId') !== positiveId(b.companyId,'companyId')) throw invalid('companyId conflicts with enterpriseId.'); b.enterpriseId = b.companyId; }
  const reason = optionalText(b.reason,'reason',2000), values: Row = {};
  for (const [key,col] of [['enterpriseId','EnterpriseID'],['ojtSemesterId','OJTSemesterID']] as const) if (id === undefined || key in b) values[col] = positiveId(b[key],key);
  if (id === undefined || 'title' in b) values.Title = requiredText(b.title,'title',150);
  for (const [key,col,max] of [['description','Description',20000],['requirements','Requirements',20000],['recruitmentCode','RecruitmentCode',60],['location','Location',300]] as const) if (key in b) values[col] = optionalText(b[key],key,max);
  if ('workMode' in b) values.WorkMode = b.workMode === null ? null : enumValue(b.workMode,['ONSITE','REMOTE','HYBRID'],'workMode');
  if (id === undefined || 'capacity' in b) {
    if (typeof b.capacity !== 'number' || !Number.isInteger(b.capacity) || b.capacity < 0 || b.capacity > 2147483647) throw invalid('capacity must be a nonnegative 32-bit integer.');
    values.Capacity = b.capacity;
  }
  if (id === undefined || 'status' in b) values.Status = enumValue(b.status ?? 'OPEN',['OPEN','CLOSED'],'status');
  if (!Object.keys(values).length) throw invalid('Provide at least one position field.');
  return academicTransaction(async c => {
    const before = id === undefined ? null : await record(c,'positions',id), merged = {...before,...values};
    const company = await record(c,'companies',merged.EnterpriseID); await semester(c,merged.OJTSemesterID);
    if (merged.Status === 'OPEN' && company.Status !== 'ACTIVE') throw invalid('Cannot open a position for an inactive enterprise.',409);
    if (before) {
      if ((merged.EnterpriseID !== before.EnterpriseID || merged.OJTSemesterID !== before.OJTSemesterID) && (await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "PositionID"=$1',[id])).rowCount) throw invalid('A coordinated position cannot change enterprise or semester.',409);
      if (merged.Capacity != null && merged.Capacity < (await c.query(`SELECT ${reservedSeats('p')} AS used FROM "InternshipPositions" p WHERE p."PositionID"=$1`,[id])).rows[0].used) throw invalid('Capacity cannot be below reserved seats.',409,'POSITION_CAPACITY_CONFLICT');
    }
    const after = await write(c,'positions',values,id);
    const slots = after.Capacity == null ? null : await syncSlots(c,after.PositionID);
    await audit(c,actor.userId,'InternshipPositions',after.PositionID,id === undefined ? 'CREATE' : 'UPDATE',before,after,reason ?? undefined);
    return {...asApi('positions',after),remainingSlots:slots?.remainingSlots ?? null};
  });
}
