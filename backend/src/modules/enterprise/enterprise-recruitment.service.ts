import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import { enterpriseScope, type Actor, type Row } from '../qhdn/qhdn.repository';
import { readTransaction } from '../qhdn/read.repository';
import { assertOpen, windowRecord, postApi, postSelect, closeUnusedPositions } from '../recruitment/recruitment.repository';
import { assertNoStudentRegistration, enterpriseWindowApi, enterpriseWindowSelect, enterprisePostActions, isUnpublishedEnterpriseDraft, recruitmentDeadline } from './enterprise-recruitment.policy';
import { assertRoundPhase } from '../recruitment/round-policy';

// The expiry worker keeps PublishedAt when it closes a published post. Legacy
// manual closures must not appear in the enterprise list as expired vacancies.
const visibleEnterprisePost = `p."ArchivedAt" IS NULL AND p."Status"<>'ARCHIVED' AND (p."Status"<>'CLOSED' OR (
  p."PublishedAt" IS NOT NULL AND p."DeadlineAt"<=now() AND p."UpdatedAt">=p."DeadlineAt"
  AND NOT EXISTS (SELECT 1 FROM "AuditLogs" a WHERE a."EntityType"='RecruitmentPosts'
    AND a."EntityID"=p."PostID" AND a."Action" IN ('ENTERPRISE_CLOSE','CLOSED'))
))`;

async function company(c: PoolClient, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Enterprise access required.', 403, 'FORBIDDEN');
  return (await enterpriseScope(c, actor))!;
}
async function ownPost(c: PoolClient, id: number, companyId: number, lock = false) {
  const p = (await c.query(`${postSelect} WHERE p."PostID"=$1 AND p."EnterpriseID"=$2 AND ${visibleEnterprisePost}${lock ? ' FOR UPDATE OF p' : ''}`,[id,companyId])).rows[0];
  if (!p) throw invalid('Recruitment post not found.', 404, 'RECRUITMENT_POST_NOT_FOUND');
  return p;
}
async function postResponses(c: PoolClient, posts: Row[]) {
  const ids = [...new Set(posts.map(p => p.WindowID).filter(id => id != null))];
  const rows = ids.length ? (await c.query(`${enterpriseWindowSelect} WHERE w."WindowID"=ANY($1::int[])`,[ids])).rows : [];
  const windows = new Map(rows.map(w => [w.WindowID,enterpriseWindowApi(w)]));
  return posts.map(p => {
    const window = windows.get(p.WindowID);
    return {...postApi(p),...enterprisePostActions(p,window),
      deleted:!!p.ArchivedAt,deletedAt:p.ArchivedAt ?? null,
      postingDeadlineAt:window?.postingDeadlineAt ?? null,deadlineManagedBy:'QHDN',requiresReview:false,
      editLockCode:p.Status === 'DRAFT' ? null : window?.editLockCode ?? null,studentRegistrationWindow:window?.studentRegistrationWindow ?? null};
  });
}
export async function enterpriseWindows(params: Row, actor: Actor) {
  const p = pagination(params, ['academicPeriodId']);
  return readTransaction(async c => {
    await company(c, actor);
    const args = [params.academicPeriodId === undefined ? null : positiveId(params.academicPeriodId, 'academicPeriodId')];
    const sql = `${enterpriseWindowSelect} WHERE ($1::int IS NULL OR w."AcademicPeriodID"=$1)`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${sql}) windows`, args)).rows[0].n;
    const rows = (await c.query(`${sql} ORDER BY w."WindowID" DESC LIMIT $2 OFFSET $3`, [...args,p.limit,p.offset])).rows;
    return {items:rows.map(enterpriseWindowApi),total,page:p.page,limit:p.limit};
  });
}
export async function enterprisePosts(params: Row, actor: Actor) {
  const p = pagination(params, ['windowId','status','postId','positionId']);
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c => {
    const own = await company(c, actor);
    const args: unknown[] = [own], where = ['p."EnterpriseID"=$1',visibleEnterprisePost];
    if (params.windowId !== undefined) { args.push(positiveId(params.windowId,'windowId')); where.push(`p."WindowID"=$${args.length}`); }
    if (params.postId !== undefined) { args.push(positiveId(params.postId,'postId')); where.push(`p."PostID"=$${args.length}`); }
    if (params.positionId !== undefined) { args.push(positiveId(params.positionId,'positionId')); where.push(`EXISTS(SELECT 1 FROM "RecruitmentPostPositions" pp WHERE pp."PostID"=p."PostID" AND pp."PositionID"=$${args.length})`); }
    if (params.status !== undefined) { args.push(enumValue(params.status,['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED'],'status')); where.push(`(CASE WHEN p."Status"='PUBLISHED' AND p."DeadlineAt"<=clock_timestamp() THEN 'CLOSED' ELSE p."Status" END)=$${args.length}`); }
    const selected = `SELECT p."PostID" FROM "RecruitmentPosts" p WHERE ${where.join(' AND ')}`;
    const sql = `${postSelect} WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS n FROM (${selected}) x`,args)).rows[0].n;
    const rows = (await c.query(`${sql} ORDER BY p."PostID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    const summary = (await c.query(`WITH selected AS (${selected}), positions AS (
      SELECT DISTINCT pos."PositionID" AS id,pos."Capacity" AS capacity,
        GREATEST(0,pos."Capacity"-public."RecruitmentOccupiedSlots"(pos."PositionID")) AS remaining
      FROM selected JOIN "RecruitmentPostPositions" pp USING("PostID") JOIN "InternshipPositions" pos USING("PositionID"))
      SELECT count(*)::int AS "totalPositions",COALESCE(sum(capacity),0)::bigint AS "totalCapacity",
      COALESCE(sum(capacity-remaining),0)::bigint AS "acceptedStudents",COALESCE(sum(remaining),0)::bigint AS "remainingSlots" FROM positions`,args)).rows[0];
    return {items:await postResponses(c,rows),total,page:p.page,limit:p.limit,
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
  const b = inputObject(body, id ? ['title','content','benefits','applicationInstructions','deadlineAt','positions','status'] : ['windowId','title','content','benefits','applicationInstructions','deadlineAt','positions','idempotencyKey','status']);
  const status = b.status === undefined ? 'DRAFT' : enumValue(b.status,['DRAFT','PUBLISHED'],'status');
  const positions = b.positions === undefined ? undefined : positionsInput(b.positions);
  if (!id && !positions) throw invalid('positions is required.');
  const key = b.idempotencyKey === undefined ? null : requiredText(b.idempotencyKey,'idempotencyKey',100);
  const hash = key ? createHash('sha256').update(JSON.stringify({windowId:b.windowId,title:b.title,content:b.content,
    benefits:b.benefits ?? null,applicationInstructions:b.applicationInstructions ?? null,positions,status})).digest('hex') : null;
  return academicTransaction(async c => {
    const own = await company(c,actor);
    // Keep the shared globally unique SubmissionKey constraint unchanged.
    const submissionKey = key ? `enterprise:${own}:${createHash('sha256').update(key).digest('hex')}` : null;
    // The academic transaction lock serializes retries, including concurrent requests.
    if (key) {
      // A late retry should not recreate a post that has since been deleted.
      const prior = (await c.query(`WITH deleted_posts AS MATERIALIZED (
          SELECT "EntityID","Detail"::jsonb AS detail FROM "AuditLogs"
          WHERE "EntityType"='RecruitmentPosts' AND "Action"='ENTERPRISE_DELETE'
        )
        SELECT "PostID","RequestHash","CreatedBy" FROM "RecruitmentPosts"
        WHERE "EnterpriseID"=$1 AND "SubmissionKey"=$2
        UNION ALL
        SELECT "EntityID",detail#>>'{after,requestHash}',(detail#>>'{after,createdBy}')::int
        FROM deleted_posts WHERE detail#>>'{after,submissionKey}'=$2
        LIMIT 1`, [own,submissionKey])).rows[0];
      if (prior) {
        if (prior.RequestHash !== hash || prior.CreatedBy !== actor.userId) throw invalid('Idempotency key belongs to a different request.',409,'IDEMPOTENCY_CONFLICT');
        return {...(await postResponses(c,[await ownPost(c,prior.PostID,own)]))[0],replayed:true};
      }
    }
    const before = id ? await ownPost(c,id,own,true) : null;
    const w = await windowRecord(c,positiveId(before?.WindowID ?? b.windowId,'windowId'));
    if (before && !isUnpublishedEnterpriseDraft(before)) throw invalid('Chỉ được chỉnh sửa hoặc công bố tin nháp chưa từng công bố.',409,'RECRUITMENT_POST_LOCKED');
    if (status === 'PUBLISHED') {
      assertOpen(w);
      assertRoundPhase(w,'POSTING');
      if (!w.CampaignID) await assertNoStudentRegistration(c,w.OJTSemesterID);
    }
    if(before&&(await c.query('SELECT 1 FROM "JobApplications" WHERE "PostID"=$1 LIMIT 1',[before.PostID])).rowCount)
      throw invalid('Tin đã có sinh viên ứng tuyển, không thể chỉnh sửa nội dung hoặc chỉ tiêu.',409,'RECRUITMENT_POST_HAS_APPLICATIONS');
    const title = requiredText(b.title ?? before?.Title,'title',500), content = requiredText(b.content ?? before?.Content,'content',30000);
    const benefits = b.benefits === undefined ? before?.Benefits ?? null : optionalText(b.benefits,'benefits',10000);
    const instructions = b.applicationInstructions === undefined ? before?.ApplicationInstructions ?? null : optionalText(b.applicationInstructions,'applicationInstructions',10000);
    // deadlineAt remains accepted for old clients, but never controls a stored deadline.
    const deadline = await recruitmentDeadline(c,w,before,status === 'PUBLISHED');
    if (positions && !positions.some(pos => pos.capacity > 0)) throw invalid('At least one position with positive capacity is required.');
    const row = (await c.query(id ? `UPDATE "RecruitmentPosts" SET "Title"=$1,"Content"=$2,"Benefits"=$3,"ApplicationInstructions"=$4,"DeadlineAt"=$5,
      "Status"=$7,"PublishedAt"=CASE WHEN $7::varchar='PUBLISHED' THEN now() ELSE NULL END,"EnterpriseManaged"=true,"ReviewedBy"=NULL,"ReviewedAt"=NULL,"ReviewReason"=NULL WHERE "PostID"=$6 RETURNING "PostID"`
      : `INSERT INTO "RecruitmentPosts" ("Title","Content","Benefits","ApplicationInstructions","DeadlineAt","EnterpriseID","OJTSemesterID","WindowID","CreatedBy","Status","EnterpriseManaged","PublishedAt","SubmissionKey","RequestHash")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$12,true,CASE WHEN $12::varchar='PUBLISHED' THEN now() ELSE NULL END,$10,$11) RETURNING "PostID"`,
      id ? [title,content,benefits,instructions,deadline,id,status] : [title,content,benefits,instructions,deadline,own,w.OJTSemesterID,w.WindowID,actor.userId,submissionKey,hash,status])).rows[0];
    const postId = row.PostID;
    if (positions) {
      const existing = (await c.query(`SELECT pos.*,
        EXISTS(SELECT 1 FROM "RecruitmentPostPositions" other WHERE other."PositionID"=pos."PositionID" AND other."PostID"<>$1) AS shared,
        public."RecruitmentOccupiedSlots"(pos."PositionID") AS accepted
        FROM "RecruitmentPostPositions" pp JOIN "InternshipPositions" pos USING("PositionID") WHERE pp."PostID"=$1 FOR UPDATE OF pos`,[postId])).rows;
      const existingById = new Map(existing.map(pos => [pos.PositionID,pos]));
      // Preserve IDs, applications and placement history. Remove a position by setting capacity=0 when unused.
      if (existing.some(pos => !positions.some(p => p.id === pos.PositionID))) throw invalid('Keep existing position IDs; set capacity to zero to stop recruiting.');
      for (const pos of positions) {
        const saved = pos.id ? existingById.get(pos.id) : null;
        if (pos.id && !saved) throw invalid('Position does not belong to this post.',403,'POSITION_SCOPE_DENIED');
        if (pos.id) {
          if (saved!.shared) {
            if(pos.title!==saved!.Title||pos.description!==saved!.Description||pos.requirements!==saved!.Requirements||pos.capacity!==saved!.Capacity||pos.location!==saved!.Location||pos.workMode!==saved!.WorkMode)
              throw invalid('Vị trí tiếp tục tuyển dùng chung chỉ tiêu và điều kiện trong kỳ; không đặt lại qua đợt bổ sung.',409,'POSITION_SHARED');
            continue;
          }
          // Recount confirmed placements after locking the position. Acceptance uses the
          // same academic transaction lock, so a concurrent acceptance cannot bypass this floor.
          const used = saved!.accepted;
          if (pos.capacity < used) throw invalid('Capacity cannot be lower than the number of accepted students.',409,'CAPACITY_BELOW_ACCEPTED');
          await c.query(`UPDATE "InternshipPositions" SET "Title"=$2,"Description"=$3,"Requirements"=$4,"Capacity"=$5,"Location"=$6,"WorkMode"=$7,"RemainingSlots"=$8 WHERE "PositionID"=$1`,[pos.id,pos.title,pos.description,pos.requirements,pos.capacity,pos.location,pos.workMode,pos.capacity-used]);
        } else {
          const inserted = (await c.query(`INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","Title","Description","Requirements","Capacity","RemainingSlots","Status","Location","WorkMode")
            VALUES ($1,$2,$3,$4,$5,$6,$6,$9,$7,$8) RETURNING "PositionID"`,[own,w.OJTSemesterID,pos.title,pos.description,pos.requirements,pos.capacity,pos.location,pos.workMode,status === 'PUBLISHED' ? 'OPEN' : 'CLOSED'])).rows[0];
          await c.query(`INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)`,[postId,inserted.PositionID,own,w.OJTSemesterID]);
        }
      }
    }
    if (!positions && !before?.positions.some((pos:Row) => pos.capacity > 0)) throw invalid('At least one position with positive capacity is required.');
    if ((await c.query(`SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "InternshipPositions" pos USING("PositionID")
      WHERE pp."PostID"=$1 AND (pos."Status"='ARCHIVED' OR pos."DeletedAt" IS NOT NULL OR pos."ArchivedAt" IS NOT NULL) LIMIT 1`,[postId])).rowCount)
      throw invalid('Archived or deleted recruitment positions cannot be published.',409,'POSITION_ARCHIVED');
    if (status === 'PUBLISHED') await c.query(`UPDATE "InternshipPositions" pos SET "Status"='OPEN' FROM "RecruitmentPostPositions" pp
      WHERE pp."PostID"=$1 AND pp."PositionID"=pos."PositionID" AND pos."DeletedAt" IS NULL AND pos."ArchivedAt" IS NULL`,[postId]);
    const after = (await postResponses(c,[await ownPost(c,postId,own)]))[0];
    await audit(c,actor.userId,'RecruitmentPosts',postId,status === 'PUBLISHED' ? 'ENTERPRISE_PUBLISH' : id ? 'ENTERPRISE_UPDATE_DRAFT' : 'ENTERPRISE_CREATE_DRAFT',before ? postApi(before) : null,after);
    return after;
  });
}

export async function deleteEnterprisePost(id: number, actor: Actor) {
  return academicTransaction(async c => {
    const own = await company(c,actor);
    const before = await ownPost(c,id,own,true);
    if (!isUnpublishedEnterpriseDraft(before)) {
      throw invalid('Chỉ được xóa tin nháp chưa từng công bố.',409,'RECRUITMENT_POST_DELETE_DENIED');
    }
    if ((await c.query('SELECT 1 FROM "JobApplications" WHERE "PostID"=$1 LIMIT 1',[id])).rowCount) {
      throw invalid('Tin đã có hồ sơ ứng tuyển không được xóa.',409,'RECRUITMENT_POST_HAS_APPLICATIONS');
    }
    const { rows: links } = await c.query<{ PositionID: number }>(
      'DELETE FROM "RecruitmentPostPositions" WHERE "PostID"=$1 RETURNING "PositionID"', [id]);
    try {
      // The foreign key also removes any extraction of this post.
      await c.query('DELETE FROM "RecruitmentPosts" WHERE "PostID"=$1', [id]);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw invalid('Tin đang được tham chiếu bởi đợt tuyển dụng khác.', 409, 'RECRUITMENT_POST_IN_USE');
      }
      throw error;
    }
    const positionIds = links.map(link => link.PositionID);
    if (positionIds.length) {
      // A position can be shared across rounds or have its own placement history.
      await c.query(`DELETE FROM "InternshipPositions" pos
        WHERE pos."PositionID"=ANY($1::int[])
          AND NOT EXISTS (SELECT 1 FROM "RecruitmentPostPositions" pp WHERE pp."PositionID"=pos."PositionID")
          AND NOT EXISTS (SELECT 1 FROM "StudentEnterpriseCoordination" co WHERE co."PositionID"=pos."PositionID")
          AND NOT EXISTS (SELECT 1 FROM "InternshipAssignments" a WHERE a."PositionID"=pos."PositionID")
          AND NOT EXISTS (SELECT 1 FROM "OJTRegistrations" r WHERE r."PreferredPositionID"=pos."PositionID")
          AND NOT EXISTS (SELECT 1 FROM "PositionSpecializations" s WHERE s."PositionID"=pos."PositionID")
          AND NOT EXISTS (SELECT 1 FROM "OJTMatchingProfiles" m WHERE m."PositionID"=pos."PositionID")`, [positionIds]);
      await closeUnusedPositions(c,positionIds);
    }
    await audit(c,actor.userId,'RecruitmentPosts',id,'ENTERPRISE_DELETE',null,{
      id, deleted:true, submissionKey:before.SubmissionKey, requestHash:before.RequestHash, createdBy:before.CreatedBy,
    });
    return {id,deleted:true};
  });
}
