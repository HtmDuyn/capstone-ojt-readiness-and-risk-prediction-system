// Assignment/profile readers use QHDN publications without creating academic course results.
export const officialEvaluationRelation = `(SELECT ev."EvaluationID" AS "ResultID",ev."AssignmentID",'PUBLISHED' AS "Status",
  1 AS "Version",ev."OverallScore" AS "OfficialScore",NULL::text AS "Outcome",publication."SentAt" AS "ConfirmedAt",
  publication."SentAt" AS "PublishedAt"
  FROM "InternshipEvaluations" ev JOIN "InternshipAssignments" assignment ON assignment."AssignmentID"=ev."AssignmentID"
  JOIN "Students" student ON student."StudentID"=assignment."StudentID"
  JOIN LATERAL (SELECT n."SentAt" FROM "Notifications" n WHERE n."UserID"=student."UserID"
    AND n."RelatedEntityType"='OJT_RESULT_PUBLISHED' AND n."RelatedEntityID"=ev."EvaluationID"
    ORDER BY n."NotificationID" LIMIT 1) publication ON true
  WHERE ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL
    AND UPPER(assignment."Status") NOT IN ('CANCELLED','CANCELED'))`;
