import type { PoolClient } from 'pg';
import { periodBounds } from '../academic/workflow-policy';
import { invalid } from '../students/student.validation';
import { scheduleFieldError } from './schedule-policy';
import type { Row } from './recruitment.repository';

export function assertRecruitmentPeriodActive(period: Row) {
  if (period.Kind !== 'SEMESTER' || period.CalendarStatus !== 'ACTIVE') {
    throw invalid('Chỉ thao tác lịch tuyển dụng trong học kỳ chính đang diễn ra.', 409, 'RECRUITMENT_PERIOD_NOT_ACTIVE');
  }
}

export function assertRoundWithinSemester(period: Row, start: Date, end: Date) {
  const bounds = periodBounds(period);
  if (start < bounds.start) throw scheduleFieldError('postingStartsAt', 'Đợt tuyển dụng không được bắt đầu trước ngày bắt đầu học kỳ.');
  if (end > bounds.end) throw scheduleFieldError('resultsEndsAt', 'Đợt tuyển dụng không được kết thúc sau ngày kết thúc học kỳ.');
}

// Half-open intervals allow one round to begin exactly when another ends.
// The caller holds academicTransaction's calendar lock, including on creation.
export async function assertNoRoundOverlap(c: PoolClient, periodId: number, semesterId: number, start: Date, end: Date, excludeId: number | null = null) {
  const conflict = (await c.query(`SELECT "WindowID","Name","StartsAt","EndsAt" FROM "RecruitmentWindows"
    WHERE ("AcademicPeriodID"=$1 OR "OJTSemesterID"=$2)
      AND ($5::int IS NULL OR "WindowID"<>$5)
      AND "StartsAt"<$4 AND "EndsAt">$3 LIMIT 1`, [periodId, semesterId, start, end, excludeId])).rows[0];
  if (conflict) throw scheduleFieldError('postingStartsAt', `Lịch tuyển dụng trùng với đợt “${conflict.Name}”. Chọn khoảng thời gian khác.`, 409, 'RECRUITMENT_WINDOW_CONFLICT');
}

export async function requireMultiRoundSchema(c: PoolClient) {
  if (!(await c.query(`SELECT to_regprocedure('public."RecruitmentRoundPolicyVersion"()') IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('public."RecruitmentWindows"')
      AND tgname='TR_RecruitmentRound' AND NOT tgisinternal) AS ready`)).rows[0].ready) {
    throw invalid('Cần cập nhật quy tắc nhiều đợt tuyển dụng bằng npm run db:migrate:recruitment-rounds.', 503, 'RECRUITMENT_MULTI_ROUND_MIGRATION_REQUIRED');
  }
}
