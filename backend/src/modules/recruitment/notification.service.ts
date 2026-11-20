import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { noticeFingerprint, queueNotices, type NoticeGuard } from '../../shared/notification.service';
import { query } from '../../config/database';

type Row = Record<string, any>;
type Audience = 'ALL' | 'STUDENT' | 'ENTERPRISE';
const format = (value: unknown) => new Date(value as string).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const scheduleStatus: Record<string, string> = { DRAFT: 'Dự kiến, chưa mở', OPEN: 'Đã mở theo lịch', CLOSED: 'Đã đóng' };

export async function notifyRecruitmentSchedule(client: PoolClient, row: Row, prefix: string,
  event = 'SCHEDULE', audience: Audience = 'ALL', expiresAt = new Date(row.EndsAt)) {
  const recipients = (await client.query(`SELECT DISTINCT u."UserID",u."Email" FROM "Users" u JOIN "Roles" r USING("RoleID")
    WHERE u."Status"='ACTIVE' AND (
      ($2::text='ALL' AND r."RoleCode" IN ('ADMIN','OJT_COORD'))
      OR ($2::text IN ('ALL','ENTERPRISE') AND r."RoleCode"='ENTERPRISE' AND EXISTS (
        SELECT 1 FROM "EnterpriseUsers" eu JOIN "Enterprises" e USING("EnterpriseID")
        WHERE eu."UserID"=u."UserID" AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL))
      OR ($2::text IN ('ALL','STUDENT') AND r."RoleCode"='STUDENT' AND EXISTS (
        SELECT 1 FROM "Students" s WHERE s."UserID"=u."UserID" AND s."Status"='ACTIVE' AND s."DeletedAt" IS NULL AND (
          EXISTS(SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=s."StudentID" AND h."OJTSemesterID"=$1)
          OR EXISTS(SELECT 1 FROM "OJTRegistrations" reg WHERE reg."StudentID"=s."StudentID" AND reg."OJTSemesterID"=$1)))))`,
    [row.OJTSemesterID, audience])).rows.map(({ UserID, Email }) => ({ userId: UserID, email: Email }));
  const fingerprint = noticeFingerprint(row);
  const text = `Đợt: ${row.Name}.\nBắt đầu: ${format(row.StartsAt)}.\nHạn đăng tin: ${format(row.PostingEndsAt ?? row.EndsAt)}.\nHạn ứng tuyển: ${format(row.ApplicationEndsAt ?? row.EndsAt)}.\nHạn phản hồi: ${format(row.ResultsEndsAt ?? row.EndsAt)}.\nTrạng thái: ${scheduleStatus[row.Status] ?? row.Status}.`;
  const created = await queueNotices(client, recipients, {
    title: prefix + row.Name, text,
    entityType: 'RECRUITMENT_WINDOW', entityId: row.WindowID,
    eventKey: `recruitment:${row.WindowID}:${event}:${fingerprint}`, expiresAt,
    guard: { table: 'RecruitmentWindows', id: row.WindowID, fingerprint },
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
      AND EXISTS(SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=s."StudentID" AND h."OJTSemesterID"=$1)
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
export async function scheduleEmailIsCurrent(guard: NoticeGuard) {
  if (!['RecruitmentWindows', 'OJTRegistrationWindows'].includes(guard.table)) return false;
  const row = (await query(`SELECT * FROM "${guard.table}" WHERE "WindowID"=$1`, [guard.id])).rows[0];
  return !!row && noticeFingerprint(row) === guard.fingerprint;
}

export function dueRecruitmentNotices(row: Row, now: Date) {
  if (row.Status !== 'OPEN' || row.ResultsFinalizedAt) return [];
  const notices: { event: string; prefix: string; audience: Audience; expiresAt: Date }[] = [];
  for (const [phase, start, end, label, audience] of [
    ['POSTING', 'PostingStartsAt', 'PostingEndsAt', 'đăng tin', 'ENTERPRISE'],
    ['APPLICATION', 'ApplicationStartsAt', 'ApplicationEndsAt', 'ứng tuyển', 'STUDENT'],
    ['RESULTS', 'ResultsStartsAt', 'ResultsEndsAt', 'phản hồi', 'ENTERPRISE'],
  ] as const) {
    if (!row[start] || !row[end]) continue;
    const startsAt = new Date(row[start]), endsAt = new Date(row[end]);
    if (now < startsAt || now >= endsAt) continue;
    notices.push({ event: `${phase}_OPEN`, prefix: `Đã mở hạn ${label}: `, audience, expiresAt: endsAt });
    if (endsAt.getTime() - now.getTime() <= 86400000)
      notices.push({ event: `${phase}_REMINDER`, prefix: `Sắp hết hạn ${label}: `, audience, expiresAt: endsAt });
  }
  return notices;
}

export async function queueDueDeadlineNotices() {
  try { return await academicTransaction(async client => {
    const now = (await client.query('SELECT clock_timestamp() AS now')).rows[0].now;
    const windows = (await client.query(`SELECT w.* FROM "RecruitmentWindows" w
      JOIN "AcademicPeriods" p USING("AcademicPeriodID") WHERE w."Status"='OPEN'
      AND w."EndsAt">$1 AND w."ResultsFinalizedAt" IS NULL
      AND p."Status" NOT IN ('CLOSED','ARCHIVED')`, [now])).rows;
    let created = 0;
    for (const row of windows) {
      // Also cover existing open rounds and students handed off after opening.
      created += await notifyRecruitmentSchedule(client, row, 'Lịch đợt tuyển dụng OJT: ');
      if (!row.PostingStartsAt && new Date(row.StartsAt) <= now) {
        if (new Date(row.EndsAt).getTime() - new Date(now).getTime() <= 86400000)
          created += await notifyRecruitmentSchedule(client, row, 'Sắp hết hạn đợt tuyển dụng OJT: ', 'REMINDER');
      }
      for (const notice of dueRecruitmentNotices(row, now))
        created += await notifyRecruitmentSchedule(client, row, notice.prefix, notice.event, notice.audience, notice.expiresAt);
    }
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
