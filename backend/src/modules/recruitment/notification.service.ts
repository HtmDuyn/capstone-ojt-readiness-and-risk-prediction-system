import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { noticeFingerprint, queueNotices, type NoticeGuard } from '../../shared/notification.service';
import { query } from '../../config/database';

type Row = Record<string, any>;
const format = (value: unknown) => new Date(value as string).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const scheduleStatus: Record<string, string> = { DRAFT: 'Dự kiến, chưa mở', OPEN: 'Đã mở theo lịch', CLOSED: 'Đã đóng' };
const recruitmentCreatedPrefix = 'Lịch tuyển dụng OJT mới: ';
const activeEnterpriseAccounts = `FROM "Users" u JOIN "Roles" r USING("RoleID")
  WHERE u."Status"='ACTIVE' AND r."RoleCode"='ENTERPRISE' AND EXISTS (
    SELECT 1 FROM "EnterpriseUsers" eu JOIN "Enterprises" e USING("EnterpriseID")
    WHERE eu."UserID"=u."UserID" AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL)`;

export async function notifyRecruitmentCreated(client: PoolClient, row: Row) {
  const recipients = (await client.query(`SELECT u."UserID",u."Email" ${activeEnterpriseAccounts}`))
    .rows.map(({ UserID, Email }) => ({ userId: UserID, email: Email }));
  const text = `Đợt: ${row.Name}.\nBắt đầu: ${format(row.StartsAt)}.\nHạn đăng tin: ${format(row.PostingEndsAt ?? row.EndsAt)}.\nHạn ứng tuyển: ${format(row.ApplicationEndsAt ?? row.EndsAt)}.\nHạn phản hồi: ${format(row.ResultsEndsAt ?? row.EndsAt)}.`;
  const created = await queueNotices(client, recipients, {
    title: recruitmentCreatedPrefix + row.Name, text,
    entityType: 'RECRUITMENT_WINDOW', entityId: row.WindowID, expiresAt: new Date(row.EndsAt),
    eventKey: `recruitment:${row.WindowID}:CREATED`,
    guard: { table: 'RecruitmentWindows', id: row.WindowID, event: 'CREATED',
      fingerprint: noticeFingerprint({ ...row, Status: undefined }) },
  });
  return created.length;
}

export async function notifyRegistrationSchedule(client: PoolClient, row: Row, prefix: string,
  event = 'SCHEDULE', expiresAt = new Date(row.EndsAt)) {
  const scope = row.Scope ?? {};
  const recipients = (await client.query(`SELECT DISTINCT u."UserID",u."Email" FROM "Students" s
    JOIN "Users" u ON u."UserID"=s."UserID"
    LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
    LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID"
    WHERE s."Status"='ACTIVE' AND s."DeletedAt" IS NULL AND u."Status"='ACTIVE'
      AND EXISTS(SELECT 1 FROM "OJTRecruitmentAccess" h WHERE h."StudentID"=s."StudentID" AND h."OJTSemesterID"=$1)
      AND ($2::int[] IS NULL OR s."StudentID"=ANY($2))
      AND ($3::int[] IS NULL OR s."ProgramID"=ANY($3))
      AND ($4::int[] IS NULL OR p."CohortID"=ANY($4))
      AND ($5::int[] IS NULL OR t."SpecializationID"=ANY($5))
      AND ($6::text[] IS NULL OR p."GroupCode"=ANY($6))`,
    [row.OJTSemesterID, scope.studentIds ?? null, scope.programIds ?? null, scope.cohortIds ?? null,
      scope.majorIds ?? null, scope.groupCodes ?? null])).rows.map(({ UserID, Email }) => ({ userId: UserID, email: Email }));
  const fingerprint = noticeFingerprint(row);
  const created = await queueNotices(client, recipients, {
    title: prefix + row.Name,
    text: `Đợt đăng ký: ${row.Name}.\nBắt đầu: ${format(row.StartsAt)}.\nHạn đăng ký: ${format(row.EndsAt)}.\nTrạng thái: ${scheduleStatus[row.Status] ?? row.Status}.`,
    entityType: 'OJT_REGISTRATION_WINDOW', entityId: row.WindowID,
    eventKey: `registration:${row.WindowID}:${event}:${fingerprint}`, expiresAt,
    guard: { table: 'OJTRegistrationWindows', id: row.WindowID, fingerprint },
  });
  return created.length;
}

// Read the current schedule immediately before sending so old queued deadlines
// are retired after an edit, closure or deletion.
export async function scheduleEmailIsCurrent(guard: NoticeGuard, userId: number, subject: string) {
  if (!['RecruitmentWindows', 'OJTRegistrationWindows'].includes(guard.table)) return false;
  // Pending messages from older versions may contain reminders or schedule edits.
  if (guard.table === 'RecruitmentWindows') {
    if (guard.event !== 'CREATED' && !subject.startsWith(recruitmentCreatedPrefix)) return false;
    const { rows } = await query(`SELECT 1 ${activeEnterpriseAccounts} AND u."UserID"=$1`, [userId]);
    if (!rows.length) return false;
  }
  const row = (await query(`SELECT * FROM "${guard.table}" WHERE "WindowID"=$1`, [guard.id])).rows[0];
  if (guard.table === 'RecruitmentWindows' && guard.event === 'CREATED')
    return !!row && row.Status !== 'CLOSED' && noticeFingerprint({ ...row, Status: undefined }) === guard.fingerprint;
  return !!row && noticeFingerprint(row) === guard.fingerprint;
}

export async function queueDueDeadlineNotices() {
  try { return await academicTransaction(async client => {
    const now = (await client.query('SELECT clock_timestamp() AS now')).rows[0].now;
    let created = 0;
    const registrations = (await client.query(`SELECT w.* FROM "OJTRegistrationWindows" w
      JOIN "AcademicPeriods" p USING("AcademicPeriodID")
      WHERE w."RecruitmentRoundID" IS NULL AND w."Status"='OPEN' AND w."EndsAt">$1
      AND p."Status" NOT IN ('CLOSED','ARCHIVED')`, [now])).rows;
    for (const row of registrations) {
      created += await notifyRegistrationSchedule(client, row, 'Lịch đăng ký OJT: ');
      if (new Date(row.StartsAt) <= now && new Date(row.EndsAt).getTime() - new Date(now).getTime() <= 86400000)
        created += await notifyRegistrationSchedule(client, row, 'Sắp hết hạn đăng ký OJT: ', 'REMINDER');
    }
    return created;
  }, undefined, 'try'); }
  catch (error) { if ((error as {code?: string}).code === '55P03') return 0; throw error; }
}
