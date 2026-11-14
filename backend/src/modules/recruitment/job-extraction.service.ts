import { randomUUID } from 'node:crypto';
import { query } from '../../config/database';
import { invalid } from '../students/student.validation';
import { type Actor, requireStaff } from '../qhdn/qhdn.repository';
import { JOB_SCHEMA_VERSION, type JobSource } from './job-extraction.schema';
import { extractJob, jobProviderConfig, JobExtractionError } from './claude-job';

// Read-only snapshots: never change the existing post/position publication workflow.
// Hash the canonical JSON in PostgreSQL so all workers use the same content version.
export const jobSourceCte = `WITH sources AS (
  SELECT p."PostID",jsonb_build_object('title',p."Title",'content',p."Content",'benefits',p."Benefits",
    'positions',positions.items) AS source
  FROM "RecruitmentPosts" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
  CROSS JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('id',pos."PositionID",'title',pos."Title",
    'description',pos."Description",'requirements',pos."Requirements",'location',pos."Location",'workMode',pos."WorkMode")
    ORDER BY pos."PositionID") AS items FROM "RecruitmentPostPositions" pp
    JOIN "InternshipPositions" pos ON pos."PositionID"=pp."PositionID"
    WHERE pp."PostID"=p."PostID" AND pos."Status"='OPEN' AND pos."Capacity">0
    AND pos."DeletedAt" IS NULL AND pos."ArchivedAt" IS NULL) positions
  WHERE p."EnterpriseManaged" AND p."Status"='PUBLISHED' AND p."ArchivedAt" IS NULL
    AND (p."DeadlineAt" IS NULL OR p."DeadlineAt">clock_timestamp())
    AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL AND positions.items IS NOT NULL
), current_sources AS (SELECT *,md5(source::text) AS hash FROM sources)`;
const sourceCte = jobSourceCte;

async function guarded<T>(work: () => Promise<T>) {
  try { return await work(); }
  catch (error: any) {
    if (error.code === '42P01' || error.code === '42703') throw invalid('Cần chạy riêng khối RECRUITMENT EXTRACTION V1 trong backend/DB trước khi đọc tin tuyển dụng.', 503, 'JOB_EXTRACTION_MIGRATION_REQUIRED');
    throw error;
  }
}
function config() {
  try { return jobProviderConfig(); }
  catch (error) {
    if (error instanceof JobExtractionError) throw invalid('Bật RECRUITMENT_CLAUDE_ENABLED=true và cấu hình ANTHROPIC_API_KEY, CLAUDE_RECRUITMENT_MODEL (hoặc CLAUDE_CV_MODEL).', 503, error.code);
    throw error;
  }
}
export async function getJobExtraction(postId: number, actor: Actor) {
  requireStaff(actor);
  return guarded(async () => {
    const post = (await query('SELECT "PostID" FROM "RecruitmentPosts" WHERE "PostID"=$1', [postId])).rows[0];
    if (!post) throw invalid('Không tìm thấy tin tuyển dụng.', 404, 'RECRUITMENT_POST_NOT_FOUND');
    const model = (process.env.CLAUDE_RECRUITMENT_MODEL || process.env.CLAUDE_CV_MODEL)?.trim() || '';
    const source = (await query(`${sourceCte} SELECT s.hash,x.* FROM current_sources s
      LEFT JOIN "RecruitmentPostExtractions" x ON x."PostID"=s."PostID" AND x."SourceHash"=s.hash
        AND x."SchemaVersion"=$2 AND x."Model"=$3 WHERE s."PostID"=$1`, [postId, JOB_SCHEMA_VERSION, model])).rows[0];
    if (!source) return { postId, status: 'NOT_ELIGIBLE', usableForMatching: false, profile: null };
    return { postId, id: source.ExtractionID ?? null, status: source.Status ?? 'NOT_ANALYZED',
      sourceHash: source.hash, schemaVersion: JOB_SCHEMA_VERSION, model, attempts: source.Attempts ?? 0,
      updatedAt: source.UpdatedAt ?? null, nextAttemptAt: source.NextAttemptAt ?? null,
      errorCode: source.LastError ?? null, profile: source.Status === 'READY' ? source.Profile : null,
      usableForMatching: source.Status === 'READY',
      evidencePolicy: 'Quotes are checked against source text; AI interpretation is not independently verified.' };
  });
}
export async function queueJobExtraction(postId: number, actor: Actor) {
  requireStaff(actor); const provider = config();
  return guarded(async () => {
    const source = (await query(`${sourceCte} SELECT * FROM current_sources WHERE "PostID"=$1`, [postId])).rows[0];
    if (!source) throw invalid('Chỉ đọc tin doanh nghiệp đã công bố, chưa hết hạn và còn vị trí đang tuyển.', 409, 'JOB_POST_NOT_ELIGIBLE');
    await query(`INSERT INTO "RecruitmentPostExtractions" ("PostID","SourceHash","SchemaVersion","Model") VALUES ($1,$2,$3,$4)
      ON CONFLICT ("PostID","SourceHash","SchemaVersion","Model") DO UPDATE SET "Status"='PENDING',"Profile"=NULL,
        "Attempts"=0,"LastError"=NULL,"LeaseUntil"=NULL,"NextAttemptAt"=now(),"UpdatedAt"=now()
      WHERE "RecruitmentPostExtractions"."Status" IN ('FAILED','STALE')`, [postId, source.hash, JOB_SCHEMA_VERSION, provider.model]);
    return getJobExtraction(postId, actor);
  });
}

export async function processJobExtraction() {
  const provider = jobProviderConfig();
  return guarded(async () => {
    // Recover a crashed final attempt even when no other candidate is available.
    await query(`UPDATE "RecruitmentPostExtractions" SET "Status"='FAILED',"LeaseUntil"=NULL,
      "LastError"='JOB_LEASE_EXPIRED',"UpdatedAt"=now() WHERE "Status"='PROCESSING' AND "Attempts">=5 AND "LeaseUntil"<now()`);
    const candidate = (await query(`${sourceCte} SELECT s.* FROM current_sources s
      LEFT JOIN "RecruitmentPostExtractions" x ON x."PostID"=s."PostID" AND x."SourceHash"=s.hash
        AND x."SchemaVersion"=$1 AND x."Model"=$2
      WHERE x."ExtractionID" IS NULL OR (x."Attempts"<5 AND (
        (x."Status" IN ('PENDING','FAILED','STALE') AND x."NextAttemptAt"<=now())
        OR (x."Status"='PROCESSING' AND x."LeaseUntil"<now())))
      ORDER BY x."NextAttemptAt" NULLS FIRST,s."PostID" LIMIT 1`, [JOB_SCHEMA_VERSION, provider.model])).rows[0];
    if (!candidate) return null;
    const token = randomUUID();
    const claim = (await query(`INSERT INTO "RecruitmentPostExtractions"
      ("PostID","SourceHash","SchemaVersion","Model","Status","Attempts","RequestToken","LeaseUntil")
      VALUES ($1,$2,$3,$4,'PROCESSING',1,$5,now()+interval '3 minutes')
      ON CONFLICT ("PostID","SourceHash","SchemaVersion","Model") DO UPDATE SET "Status"='PROCESSING',"Profile"=NULL,
        "Attempts"="RecruitmentPostExtractions"."Attempts"+1,"RequestToken"=$5,"LeaseUntil"=now()+interval '3 minutes',"UpdatedAt"=now()
      WHERE "RecruitmentPostExtractions"."Attempts"<5 AND (
        ("RecruitmentPostExtractions"."Status" IN ('PENDING','FAILED','STALE') AND "RecruitmentPostExtractions"."NextAttemptAt"<=now())
        OR ("RecruitmentPostExtractions"."Status"='PROCESSING' AND "RecruitmentPostExtractions"."LeaseUntil"<now()))
      RETURNING "ExtractionID"`, [candidate.PostID, candidate.hash, JOB_SCHEMA_VERSION, provider.model, token])).rows[0];
    if (!claim) return null; // Another server claimed the same snapshot.
    let profile: Awaited<ReturnType<typeof extractJob>> | null = null;
    let failure: string | null = null;
    try { profile = await extractJob(candidate.source as JobSource, provider); }
    catch (error) { failure = error instanceof JobExtractionError ? error.code : 'JOB_EXTRACTION_FAILED'; }
    // Do not publish results for a source edited, closed or archived while Claude ran.
    const saved = (await query(`${sourceCte}, outcome AS (
      SELECT EXISTS(SELECT 1 FROM current_sources WHERE "PostID"=$2 AND hash=$3) AS current
    ) UPDATE "RecruitmentPostExtractions" x SET
      "Status"=CASE WHEN NOT o.current THEN 'STALE' WHEN $5::text IS NOT NULL THEN 'FAILED' ELSE 'READY' END,
      "Profile"=CASE WHEN o.current AND $5::text IS NULL THEN $4::jsonb ELSE NULL END,
      "LastError"=CASE WHEN o.current THEN $5::text ELSE 'JOB_SOURCE_CHANGED' END,
      "LeaseUntil"=NULL,"NextAttemptAt"=now()+interval '5 minutes',"UpdatedAt"=now()
      FROM outcome o WHERE x."ExtractionID"=$1 AND x."RequestToken"=$6 AND x."Status"='PROCESSING'
      RETURNING x."Status"`, [claim.ExtractionID, candidate.PostID, candidate.hash, profile ? JSON.stringify(profile) : null, failure, token])).rows[0];
    return { postId: candidate.PostID, status: saved?.Status ?? 'SUPERSEDED', errorCode: failure };
  });
}
