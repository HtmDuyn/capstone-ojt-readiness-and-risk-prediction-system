import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, requiredText, enumValue, positiveId } from '../students/student.validation';
import { timestamp } from '../combo-registration/combo.validation';
import { semester, windowRecord, windowApi, type Actor, type Row } from '../ojt-registration/window.service';

export function effectiveRegistrationStatus(window: Row, now = new Date()): string {
  if (window.status !== 'OPEN') return window.status;
  return now < new Date(window.startsAt) ? 'SCHEDULED' : now >= new Date(window.endsAt) ? 'EXPIRED' : 'OPEN';
}

// QHDN works on an existing academic semester. Admin's window APIs and student
// submission contracts continue using the same tables and their existing rules.
export async function saveRegistrationSettings(semesterId: number, body: unknown, actor: Actor) {
  if (actor.roleCode !== 'OJT_COORD') throw invalid('QHDN role required.', 403, 'FORBIDDEN');
  const id = positiveId(semesterId, 'ojtSemesterId');
  const b = inputObject(body, ['name', 'startsAt', 'endsAt', 'status', 'reason']);
  const reason = requiredText(b.reason, 'reason', 2000);
  return academicTransaction(async client => {
    const term = await semester(client, id);
    if (!term.AcademicPeriodID) throw invalid('The semester must have an academic period.', 409, 'OJT_PERIOD_REQUIRED');
    const period = (await client.query('SELECT "Kind" FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1', [term.AcademicPeriodID])).rows[0];
    if (period?.Kind !== 'SEMESTER') throw invalid('OJT must reference a regular academic semester.', 409, 'OJT_PERIOD_REQUIRED');
    const records = (await client.query('SELECT * FROM "OJTRegistrationWindows" WHERE "OJTSemesterID"=$1 ORDER BY "WindowID" FOR UPDATE', [id])).rows;
    if (records.length > 1) throw invalid('This semester has multiple legacy windows. Reconcile them before using semester settings.', 409, 'REGISTRATION_SETTINGS_AMBIGUOUS');
    const before: Row | undefined = records[0];
    const status = enumValue(b.status ?? before?.Status ?? 'OPEN', ['DRAFT', 'OPEN', 'CLOSED'], 'status');
    if (!before && status === 'CLOSED') throw invalid('There is no registration to close.', 409, 'REGISTRATION_WINDOW_NOT_OPEN');
    if (before && before.Status !== 'DRAFT' && status === 'DRAFT') throw invalid('A published registration cannot return to draft.', 409, 'REGISTRATION_WINDOW_SCOPE_LOCKED');
    if (status === 'CLOSED' && before?.Status === 'DRAFT') throw invalid('Only an open registration can be closed.', 409, 'REGISTRATION_WINDOW_NOT_OPEN');
    const startsAt = b.startsAt === undefined && before ? new Date(before.StartsAt).toISOString() : timestamp(b.startsAt, 'startsAt');
    const endsAt = b.endsAt === undefined && before ? new Date(before.EndsAt).toISOString() : timestamp(b.endsAt, 'endsAt');
    if (new Date(endsAt) <= new Date(startsAt)) throw invalid('endsAt must be after startsAt.');
    if (before && before.Status !== 'DRAFT') {
      if (new Date(startsAt).getTime() !== new Date(before.StartsAt).getTime()) throw invalid('The published start time is fixed.', 409, 'REGISTRATION_WINDOW_SCOPE_LOCKED');
      if (new Date(endsAt) < new Date(before.EndsAt)) throw invalid('QHDN may extend, but cannot shorten, a published deadline.', 409, 'REGISTRATION_DEADLINE_NOT_EXTENDED');
    }
    const now = new Date((await client.query('SELECT clock_timestamp() AS now')).rows[0].now);
    if (status === 'OPEN') {
      if (['CLOSED', 'CANCELLED', 'ARCHIVED'].includes(String(term.Status).toUpperCase())) throw invalid('The OJT semester is closed.', 409, 'OJT_SEMESTER_CLOSED');
      if (new Date(endsAt) <= now) throw invalid('Extend the deadline before opening an expired registration.', 409, 'REGISTRATION_WINDOW_EXPIRED');
      const args: unknown[] = [id];
      const filters = ['h."OJTSemesterID"=$1'];
      const scope = before?.Scope ?? {};
      for (const [key, column] of [['studentIds', 's."StudentID"'], ['programIds', 's."ProgramID"'], ['majorIds', 't."SpecializationID"'], ['cohortIds', 'p."CohortID"'], ['groupCodes', 'p."GroupCode"']]) {
        if (scope[key]) { args.push(scope[key]); filters.push(`${column}=ANY($${args.length}::${key === 'groupCodes' ? 'text' : 'int'}[])`); }
      }
      if (!(await client.query(`SELECT 1 FROM "EligibleStudentHandoffItems" h JOIN "Students" s ON s."StudentID"=h."StudentID"
        LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
        WHERE ${filters.join(' AND ')} LIMIT 1`, args)).rowCount) throw invalid('No handed-off students in this semester scope.', 409, 'HANDOFF_ROSTER_EMPTY');
    }
    const name = requiredText(b.name ?? before?.Name ?? `Đăng ký OJT ${term.Name}`, 'name', 150);
    const changed = !before || before.Name !== name || before.Status !== status
      || new Date(before.StartsAt).getTime() !== new Date(startsAt).getTime() || new Date(before.EndsAt).getTime() !== new Date(endsAt).getTime();
    let windowId: number;
    if (!before) {
      // Empty scope means all students handed off for this semester. Student
      // listing/submission still enforce the handoff; no registration is submitted here.
      const row = (await client.query(`INSERT INTO "OJTRegistrationWindows"
        ("OJTSemesterID","AcademicPeriodID","RequiredRelativeSemester","Name","Scope","StartsAt","EndsAt","Status","CreatedBy","OpenedBy","OpenedAt")
        VALUES ($1,$2,6,$3,'{}'::jsonb,$4,$5,$6::varchar,$7::int,CASE WHEN $6::varchar='OPEN' THEN $7::int ELSE NULL END,CASE WHEN $6::varchar='OPEN' THEN now() ELSE NULL END) RETURNING "WindowID"`,
      [id, term.AcademicPeriodID, name, startsAt, endsAt, status, actor.userId])).rows[0];
      windowId = row.WindowID;
    } else {
      windowId = before.WindowID;
      if (changed) await client.query(`UPDATE "OJTRegistrationWindows" SET "Name"=$2,"StartsAt"=$3,"EndsAt"=$4,"Status"=$5,"UpdatedAt"=now(),
        "OpenedBy"=CASE WHEN $6::boolean THEN $8 ELSE "OpenedBy" END,"OpenedAt"=CASE WHEN $6::boolean THEN now() ELSE "OpenedAt" END,
        "ClosedBy"=CASE WHEN $7::boolean THEN $8 ELSE "ClosedBy" END,"ClosedAt"=CASE WHEN $7::boolean THEN now() ELSE "ClosedAt" END WHERE "WindowID"=$1`,
      [windowId, name, startsAt, endsAt, status, status === 'OPEN' && before.Status !== 'OPEN', status === 'CLOSED' && before.Status !== 'CLOSED', actor.userId]);
    }
    // Only posts created by the new QHDN import follow this registration deadline.
    // Keep historical posts and anything manually edited/closed by another actor intact.
    let syncedPostIds: number[] = [];
    if (changed && status === 'OPEN') {
      syncedPostIds = (await client.query(`WITH candidates AS (
        SELECT b."BatchID",p."PostID",LEAST($2::timestamptz,COALESCE((b."Summary"->>'expiresAt')::timestamptz,'infinity'::timestamptz)) AS deadline FROM "AccountImportBatches" b
        CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(b."Summary"->'postIds')='array' THEN b."Summary"->'postIds' ELSE '[]'::jsonb END) ids(value)
        JOIN "RecruitmentPosts" p ON p."PostID"=ids.value::int
        WHERE b."Kind"='ENTERPRISE' AND b."OJTSemesterID"=$1 AND b."Summary"->>'publicationSource'='QHDN_SEMESTER_IMPORT'
          AND p."OJTSemesterID"=$1 AND p."CreatedBy"=b."ImportedBy" AND p."ReviewedBy"=b."ImportedBy" AND p."ReviewedAt"=p."PublishedAt"
          AND p."DeadlineAt"=(b."Summary"->>'deadlineAt')::timestamptz
          AND COALESCE((b."Summary"->>'expiresAt')::timestamptz,'infinity'::timestamptz)>clock_timestamp()
          AND (p."Status"='PUBLISHED' OR (p."Status"='CLOSED' AND p."DeadlineAt"<=clock_timestamp()))
          AND NOT EXISTS(SELECT 1 FROM "AuditLogs" a WHERE a."EntityType"='RecruitmentPosts' AND a."EntityID"=p."PostID" AND a."Action"='CLOSE')
      ), updated AS (
        UPDATE "RecruitmentPosts" p SET "DeadlineAt"=c.deadline,"Status"='PUBLISHED' FROM candidates c WHERE p."PostID"=c."PostID" RETURNING p."PostID",c."BatchID",p."DeadlineAt"
      ), batches AS (
        UPDATE "AccountImportBatches" b SET "Summary"=jsonb_set(b."Summary",'{deadlineAt}',to_jsonb(u."DeadlineAt"))
        FROM (SELECT DISTINCT "BatchID","DeadlineAt" FROM updated) u WHERE b."BatchID"=u."BatchID" RETURNING b."BatchID"
      ) SELECT "PostID" FROM updated`, [id, endsAt])).rows.map(row => row.PostID);
    }
    const after = await windowRecord(client, windowId);
    if (changed) {
      const action = !before ? (status === 'OPEN' ? 'OPEN' : 'CREATE')
        : before.Status !== status ? (status === 'OPEN' ? (before.Status === 'CLOSED' ? 'REOPEN' : 'OPEN') : 'CLOSE')
        : before.Status !== 'DRAFT' && new Date(endsAt) > new Date(before.EndsAt) ? 'EXTEND' : 'UPDATE';
      await audit(client, actor.userId, 'OJTRegistrationWindows', windowId, action, before ?? null, { ...after, syncedRecruitmentPostIds: syncedPostIds }, reason);
    }
    const result = windowApi(after);
    return { ...result, effectiveStatus: effectiveRegistrationStatus(result, now), replayed: !changed };
  });
}
