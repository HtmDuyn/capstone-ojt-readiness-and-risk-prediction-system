import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { dayString } from '../academic/workflow-policy';
import { timestamp } from '../combo-registration/combo.validation';
import { inputObject, invalid, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import { enterpriseScope, type Actor, type Row } from '../qhdn/qhdn.repository';
import { readTransaction } from '../qhdn/read.repository';
import { assertOpen, windowRecord, windowApi, postRecord, postApi, postSelect } from '../recruitment/recruitment.repository';

async function company(c: PoolClient, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Enterprise access required.', 403, 'FORBIDDEN');
  return (await enterpriseScope(c, actor))!;
}
async function ownPost(c: PoolClient, id: number, actor: Actor, lock = false) {
  const own = await company(c, actor), p = await postRecord(c, id, actor, lock);
  if (p.EnterpriseID !== own || p.ArchivedAt) throw invalid('Recruitment post not found.', 404, 'RECRUITMENT_POST_NOT_FOUND');
  return p;
}
async function detail(c: PoolClient, id: number, actor: Actor) {
  return postApi(await ownPost(c,id,actor));
}
export async function enterpriseWindows(params: Row, actor: Actor) {
  const p = pagination(params, ['academicPeriodId']);
  return readTransaction(async c => {
    await company(c, actor);
    const args = [params.academicPeriodId === undefined ? null : positiveId(params.academicPeriodId, 'academicPeriodId')];
    const from = `FROM "RecruitmentWindows" w JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"
      JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID"
      WHERE ($1::int IS NULL OR w."AcademicPeriodID"=$1)`;
    const total = (await c.query(`SELECT count(*)::int AS n ${from}`, args)).rows[0].n;
    const rows = (await c.query(`SELECT w.*,ap."PeriodCode",ap."Name" AS "PeriodName",ap."Status" AS "PeriodStatus",
      clock_timestamp() AS "DatabaseNow" ${from} ORDER BY w."WindowID" DESC LIMIT $2 OFFSET $3`, [...args,p.limit,p.offset])).rows;
    return {items:rows.map(windowApi),total,page:p.page,limit:p.limit};
  });
}
export async function enterprisePosts(params: Row, actor: Actor) {
  const p = pagination(params, ['windowId','status','postId','positionId']);
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c => {
    const own = await company(c, actor);
    const args: unknown[] = [own], where = ['p."EnterpriseID"=$1','p."ArchivedAt" IS NULL'];
    if (params.windowId !== undefined) { args.push(positiveId(params.windowId,'windowId')); where.push(`p."WindowID"=$${args.length}`); }
    if (params.postId !== undefined) { args.push(positiveId(params.postId,'postId')); where.push(`p."PostID"=$${args.length}`); }
    if (params.positionId !== undefined) { args.push(positiveId(params.positionId,'positionId')); where.push(`EXISTS(SELECT 1 FROM "RecruitmentPostPositions" pp WHERE pp."PostID"=p."PostID" AND pp."PositionID"=$${args.length})`); }
    if (params.status !== undefined) { args.push(enumValue(params.status,['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED'],'status')); where.push(`(CASE WHEN p."Status"='PUBLISHED' AND p."DeadlineAt"<=clock_timestamp() THEN 'CLOSED' ELSE p."Status" END)=$${args.length}`); }
    const sql = `${postSelect} WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) x`,args)).rows[0].n;
    const rows = (await c.query(`${sql} ORDER BY p."PostID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    const summary = (await c.query(`WITH selected AS (${sql}), positions AS (
      SELECT DISTINCT (pos->>'id')::int AS id,(pos->>'capacity')::int AS capacity,(pos->>'remainingSlots')::int AS remaining
      FROM selected CROSS JOIN LATERAL jsonb_array_elements(positions) pos)
      SELECT count(*)::int AS "totalPositions",COALESCE(sum(capacity),0)::bigint AS "totalCapacity",
      COALESCE(sum(capacity-remaining),0)::bigint AS "acceptedStudents",COALESCE(sum(remaining),0)::bigint AS "remainingSlots" FROM positions`,args)).rows[0];
    return {items:rows.map(postApi),total,page:p.page,limit:p.limit,
      summary:{totalPosts:total,totalPositions:summary.totalPositions,totalCapacity:Number(summary.totalCapacity),acceptedStudents:Number(summary.acceptedStudents),remainingSlots:Number(summary.remainingSlots)}};
  });
}
function positionsInput(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) throw invalid('positions must contain 1 to 50 positions.');
  const seen = new Set<number>();
  return value.map(item => {
    const b = inputObject(item,['id','title','description','requirements','capacity','location','workMode']);
    const id = b.id === undefined ? null : positiveId(b.id,'positions.id');
    if (id && seen.has(id)) throw invalid('Duplicate position ID.');
    if (id) seen.add(id);
    if (typeof b.capacity !== 'number' || !Number.isInteger(b.capacity) || b.capacity < 0 || b.capacity > 2147483647) throw invalid('capacity must be a nonnegative 32-bit integer.');
    return {id,title:requiredText(b.title,'position.title',150),description:requiredText(b.description,'position.description',20000),
      requirements:requiredText(b.requirements,'position.requirements',20000),capacity:b.capacity,
      location:optionalText(b.location,'position.location',1000),workMode:b.workMode == null ? null : enumValue(b.workMode,['ONSITE','REMOTE','HYBRID'],'workMode')};
  });
}
export async function saveEnterprisePost(body: unknown, actor: Actor, id?: number) {
  const b = inputObject(body, id ? ['title','content','benefits','applicationInstructions','deadlineAt','positions'] : ['windowId','title','content','benefits','applicationInstructions','deadlineAt','positions']);
  const positions = b.positions === undefined ? undefined : positionsInput(b.positions);
  if (!id && !positions) throw invalid('positions is required.');
  return academicTransaction(async c => {
    const own = await company(c,actor), before = id ? await ownPost(c,id,actor,true) : null;
    if (before && !['DRAFT','REJECTED','PENDING_REVIEW','PUBLISHED'].includes(before.Status)) throw invalid('Closed or archived posts cannot be edited.',409,'RECRUITMENT_POST_LOCKED');
    const w = await windowRecord(c,positiveId(before?.WindowID ?? b.windowId,'windowId'));
    assertOpen(w);
    const title = requiredText(b.title ?? before?.Title,'title',500), content = requiredText(b.content ?? before?.Content,'content',30000);
    const benefits = b.benefits === undefined ? before?.Benefits ?? null : optionalText(b.benefits,'benefits',10000);
    const instructions = b.applicationInstructions === undefined ? before?.ApplicationInstructions ?? null : optionalText(b.applicationInstructions,'applicationInstructions',10000);
    const deadline = timestamp(b.deadlineAt ?? before?.DeadlineAt?.toISOString(),'deadlineAt');
    const periodEnd = new Date(new Date(dayString(w.PeriodEndDate)+'T00:00:00+07:00').getTime()+86400000);
    if (new Date(deadline) <= new Date(w.EndsAt) || new Date(deadline) > periodEnd) throw invalid('deadlineAt must follow the intake deadline and be within the academic semester.');
    if (positions && !positions.some(pos => pos.capacity > 0)) throw invalid('At least one position with positive capacity is required.');
    const row = (await c.query(id ? `UPDATE "RecruitmentPosts" SET "Title"=$1,"Content"=$2,"Benefits"=$3,"ApplicationInstructions"=$4,"DeadlineAt"=$5,
      "Status"='PENDING_REVIEW',"EnterpriseManaged"=true,"ReviewedBy"=NULL,"ReviewedAt"=NULL,"ReviewReason"=NULL WHERE "PostID"=$6 RETURNING "PostID"`
      : `INSERT INTO "RecruitmentPosts" ("Title","Content","Benefits","ApplicationInstructions","DeadlineAt","EnterpriseID","OJTSemesterID","WindowID","CreatedBy","Status","EnterpriseManaged")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING_REVIEW',true) RETURNING "PostID"`,
      id ? [title,content,benefits,instructions,deadline,id] : [title,content,benefits,instructions,deadline,own,w.OJTSemesterID,w.WindowID,actor.userId])).rows[0];
    const postId = row.PostID;
    if (positions) {
      const existing = (await c.query(`SELECT pos.* FROM "RecruitmentPostPositions" pp JOIN "InternshipPositions" pos USING("PositionID") WHERE pp."PostID"=$1 FOR UPDATE OF pos`,[postId])).rows;
      // Preserve IDs, applications and placement history. Remove a position by setting capacity=0 when unused.
      if (existing.some(pos => !positions.some(p => p.id === pos.PositionID))) throw invalid('Keep existing position IDs; set capacity to zero to stop recruiting.');
      for (const pos of positions) {
        if (pos.id && !existing.some(p => p.PositionID === pos.id)) throw invalid('Position does not belong to this post.',403,'POSITION_SCOPE_DENIED');
        if (pos.id) {
          if ((await c.query('SELECT 1 FROM "RecruitmentPostPositions" WHERE "PositionID"=$1 AND "PostID"<>$2',[pos.id,postId])).rowCount) throw invalid('A position shared with another post cannot be edited.',409,'POSITION_SHARED');
          const used = (await c.query(`SELECT count(*)::int AS n FROM "InternshipAssignments" WHERE "PositionID"=$1
            AND COALESCE(UPPER("Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[pos.id])).rows[0].n;
          if (pos.capacity < used) throw invalid('Capacity cannot be lower than the number of accepted students.',409,'CAPACITY_BELOW_ACCEPTED');
          await c.query(`UPDATE "InternshipPositions" SET "Title"=$2,"Description"=$3,"Requirements"=$4,"Capacity"=$5,"Location"=$6,"WorkMode"=$7,"RemainingSlots"=$8 WHERE "PositionID"=$1`,[pos.id,pos.title,pos.description,pos.requirements,pos.capacity,pos.location,pos.workMode,pos.capacity-used]);
        } else {
          const inserted = (await c.query(`INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","Title","Description","Requirements","Capacity","RemainingSlots","Status","Location","WorkMode")
            VALUES ($1,$2,$3,$4,$5,$6,$6,'CLOSED',$7,$8) RETURNING "PositionID"`,[own,w.OJTSemesterID,pos.title,pos.description,pos.requirements,pos.capacity,pos.location,pos.workMode])).rows[0];
          await c.query(`INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)`,[postId,inserted.PositionID,own,w.OJTSemesterID]);
        }
      }
    }
    const ready = await ownPost(c,postId,actor);
    if (!ready.positions.length || !ready.positions.some((pos:Row) => pos.capacity > 0)) throw invalid('At least one position with positive capacity is required.');
    const after = await detail(c,postId,actor);
    await audit(c,actor.userId,'RecruitmentPosts',postId,id ? 'ENTERPRISE_UPDATE' : 'ENTERPRISE_CREATE',before ? postApi(before) : null,after);
    return after;
  });
}
