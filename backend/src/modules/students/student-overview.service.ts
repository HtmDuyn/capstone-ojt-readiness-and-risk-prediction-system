import { query } from '../../config/database';
import { invalid, positiveId } from './student.validation';

type OverviewGroup = {
  cohortId: number | null;
  cohortName: string | null;
  cohortCode: string | null;
  total: number;
  eligible: number;
  notEligible: number;
  insufficientData: number;
  awaitingConfirmation: number;
  evaluationEligible: number;
  evaluationNotEligible: number;
  reviewRequired: number;
  staleConfirmations: number;
};

export async function studentOverview(params: Record<string, unknown>) {
  for (const key of Object.keys(params)) {
    if (key !== 'majorId' && key !== 'cohortId' && key !== 'academicPeriodId') throw invalid(`Unknown query parameter: ${key}.`);
  }
  const majorId = params.majorId === undefined ? null : positiveId(params.majorId, 'majorId');
  const cohortId = params.cohortId === undefined ? null : positiveId(params.cohortId, 'cohortId');
  const academicPeriodId = params.academicPeriodId === undefined ? null : positiveId(params.academicPeriodId, 'academicPeriodId');
  const result = await query<OverviewGroup>(
    `WITH student_status AS MATERIALIZED (
       SELECT p."CohortID" AS "cohortId",c."Name" AS "cohortName",c."CohortCode" AS "cohortCode",
         saved_result."Result" AS saved
       FROM "Students" s
       JOIN "Users" u ON u."UserID"=s."UserID"
       LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
       LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
       LEFT JOIN "Cohorts" c ON c."CohortID"=p."CohortID"
       LEFT JOIN "StudentOJTCalculatedResults" saved_result ON saved_result."StudentID"=s."StudentID"
       WHERE s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
         AND ($1::int IS NULL OR program."SpecializationID"=$1)
         AND ($2::int IS NULL OR p."CohortID"=$2)
         AND ($3::int IS NULL OR p."CurrentAcademicPeriodID"=$3)
     ), categorized AS (
       SELECT *,
         CASE WHEN saved IS NULL THEN 'AWAITING_CONFIRMATION'
           WHEN saved->>'status'='REVIEW_REQUIRED' THEN 'INSUFFICIENT_DATA'
           ELSE saved->>'status' END AS category,
         COALESCE(saved->>'status','NOT_CHECKED') AS evaluation_status
       FROM student_status
     )
     SELECT "cohortId","cohortName","cohortCode",count(*)::int AS total,
       count(*) FILTER (WHERE category='ELIGIBLE')::int AS eligible,
       count(*) FILTER (WHERE category='NOT_ELIGIBLE')::int AS "notEligible",
       count(*) FILTER (WHERE category='INSUFFICIENT_DATA')::int AS "insufficientData",
       count(*) FILTER (WHERE category='AWAITING_CONFIRMATION')::int AS "awaitingConfirmation",
       count(*) FILTER (WHERE evaluation_status='ELIGIBLE')::int AS "evaluationEligible",
       count(*) FILTER (WHERE evaluation_status='NOT_ELIGIBLE')::int AS "evaluationNotEligible",
       count(*) FILTER (WHERE evaluation_status='REVIEW_REQUIRED')::int AS "reviewRequired",
       0::int AS "staleConfirmations"
     FROM categorized GROUP BY "cohortId","cohortName","cohortCode"
     ORDER BY "cohortId" NULLS LAST`,
    [majorId, cohortId, academicPeriodId],
  );

  const sum = (key: keyof OverviewGroup) => result.rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
  const summary = {
    total: sum('total'), eligible: sum('eligible'), notEligible: sum('notEligible'),
    insufficientData: sum('insufficientData'), awaitingConfirmation: sum('awaitingConfirmation'),
    currentEvaluation: {
      eligible: sum('evaluationEligible'), notEligible: sum('evaluationNotEligible'),
      reviewRequired: sum('reviewRequired'),
    },
    staleConfirmations: sum('staleConfirmations'),
  };
  const groups = result.rows.map(row => ({
    id: row.cohortId,
    name: row.cohortId === null ? null : row.cohortName ?? row.cohortCode ?? String(row.cohortId),
    total: Number(row.total), eligible: Number(row.eligible), notEligible: Number(row.notEligible),
    insufficientData: Number(row.insufficientData), awaitingConfirmation: Number(row.awaitingConfirmation),
  }));
  const { total, eligible, notEligible, insufficientData, awaitingConfirmation } = summary;
  return {
    summary,
    statistics: {
      groupBy: 'cohort',
      overall: { total, eligible, notEligible, insufficientData, awaitingConfirmation },
      membershipCountsMayOverlap: false,
      groups,
    },
    unavailableProfiles: 0,
    warning: '',
  };
}
