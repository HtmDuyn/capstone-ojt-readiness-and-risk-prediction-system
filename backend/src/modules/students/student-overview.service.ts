import { query } from '../../config/database';
import { calculatedEligibilitySql } from '../eligibility/frontend-results.service';
import { invalid, positiveId } from './student.validation';

type OverviewRow = {
  cohortId: number | null;
  cohortName: string | null;
  cohortCode: string | null;
  calculatedEligibility: {
    status?: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED';
    isStale?: boolean;
  } | null;
};

function counts(rows: Array<{ category: string }>) {
  return {
    total: rows.length,
    eligible: rows.filter(row => row.category === 'ELIGIBLE').length,
    notEligible: rows.filter(row => row.category === 'NOT_ELIGIBLE').length,
    insufficientData: rows.filter(row => row.category === 'INSUFFICIENT_DATA').length,
    awaitingConfirmation: rows.filter(row => row.category === 'AWAITING_CONFIRMATION').length,
  };
}

export async function studentOverview(params: Record<string, unknown>) {
  for (const key of Object.keys(params)) {
    if (key !== 'cohortId' && key !== 'academicPeriodId') throw invalid(`Unknown query parameter: ${key}.`);
  }
  const cohortId = params.cohortId === undefined ? null : positiveId(params.cohortId, 'cohortId');
  const academicPeriodId = params.academicPeriodId === undefined ? null : positiveId(params.academicPeriodId, 'academicPeriodId');
  const result = await query<OverviewRow>(
    `SELECT p."CohortID" AS "cohortId",c."Name" AS "cohortName",c."CohortCode" AS "cohortCode",
      ${calculatedEligibilitySql('s')} AS "calculatedEligibility"
     FROM "Students" s
     JOIN "Users" u ON u."UserID"=s."UserID"
     LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
     LEFT JOIN "Cohorts" c ON c."CohortID"=p."CohortID"
     WHERE s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
       AND ($1::int IS NULL OR p."CohortID"=$1)
       AND ($2::int IS NULL OR p."CurrentAcademicPeriodID"=$2)
     ORDER BY s."StudentID"`,
    [cohortId, academicPeriodId],
  );

  const rows = result.rows.map(row => {
    const saved = row.calculatedEligibility;
    const status = saved && !saved.isStale ? saved.status : undefined;
    return {
      cohortId: row.cohortId,
      cohortName: row.cohortName,
      cohortCode: row.cohortCode,
      category: !saved || saved.isStale
        ? 'AWAITING_CONFIRMATION'
        : status === 'REVIEW_REQUIRED' ? 'INSUFFICIENT_DATA' : status!,
      evaluationStatus: status ?? 'NOT_CHECKED',
      stale: saved?.isStale ?? false,
    };
  });

  const groups = new Map<number | null, typeof rows>();
  const names = new Map<number, string | null>();
  for (const row of rows) {
    const group = groups.get(row.cohortId) ?? [];
    group.push(row);
    groups.set(row.cohortId, group);
    if (row.cohortId !== null) names.set(row.cohortId, row.cohortName ?? row.cohortCode);
  }

  const currentEvaluation = {
    eligible: rows.filter(row => row.evaluationStatus === 'ELIGIBLE').length,
    notEligible: rows.filter(row => row.evaluationStatus === 'NOT_ELIGIBLE').length,
    reviewRequired: rows.filter(row => row.evaluationStatus === 'REVIEW_REQUIRED').length,
  };
  const summary = {
    ...counts(rows),
    currentEvaluation,
    staleConfirmations: rows.filter(row => row.stale).length,
  };
  return {
    summary,
    statistics: {
      groupBy: 'cohort',
      overall: counts(rows),
      membershipCountsMayOverlap: false,
      groups: [...groups].map(([id, members]) => ({
        id,
        name: id === null ? null : names.get(id) ?? String(id),
        ...counts(members),
      })),
    },
    unavailableProfiles: 0,
    warning: summary.staleConfirmations
      ? `${summary.staleConfirmations} kết quả đã cũ do dữ liệu học vụ thay đổi. Cần xét lại trước khi sử dụng.`
      : '',
  };
}
