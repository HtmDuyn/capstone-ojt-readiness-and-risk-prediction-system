// Reuse the same official source in profile, enterprise, QHDN and reporting queries.
// Legacy OJTResults rows are retained as history, but do not override enterprise scores.
export const officialEvaluationRelation = `(SELECT "EvaluationID" AS "ResultID","AssignmentID",'CONFIRMED'::text AS "Status",
  1 AS "Version","OverallScore" AS "OfficialScore",NULL::text AS "Outcome","EvaluatedAt" AS "ConfirmedAt"
  FROM "InternshipEvaluations" WHERE "Status"='SUBMITTED' AND "EvaluatedAt" IS NOT NULL AND "OverallScore" IS NOT NULL)`;
