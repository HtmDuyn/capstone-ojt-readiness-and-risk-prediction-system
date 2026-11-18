-- Read-only reconciliation for GET /api/enterprise/profile.
-- Run on the current database without running the FULL RESET in backend/DB.
BEGIN TRANSACTION READ ONLY;

WITH assignments AS (
  SELECT a.*, EXISTS (
    SELECT 1 FROM public."InternshipEvaluations" ev
    WHERE ev."AssignmentID"=a."AssignmentID" AND ev."Status"='SUBMITTED'
      AND ev."EvaluatedAt" IS NOT NULL AND ev."OverallScore" IS NOT NULL
  ) AS graded
  FROM public."InternshipAssignments" a
), received AS (
  SELECT co."EnterpriseID",r."StudentID"
  FROM public."StudentEnterpriseCoordination" co
  JOIN public."OJTRegistrations" r USING ("RegistrationID")
  WHERE co."Decision"='ACCEPTED'
  UNION
  SELECT "EnterpriseID","StudentID" FROM assignments
  WHERE COALESCE(upper("Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')
  UNION
  SELECT co."EnterpriseID",receipt."StudentID"
  FROM public."OJTActualReceipts" receipt
  JOIN public."StudentEnterpriseCoordination" co USING ("CoordinationID")
), active_students AS (
  SELECT co."EnterpriseID",r."StudentID"
  FROM public."StudentEnterpriseCoordination" co
  JOIN public."OJTRegistrations" r USING ("RegistrationID")
  WHERE co."Decision"='ACCEPTED'
    AND NOT EXISTS (SELECT 1 FROM public."StudentEnterpriseCoordination" newer
      WHERE newer."RegistrationID"=co."RegistrationID" AND newer."CoordinationID">co."CoordinationID")
    AND NOT EXISTS (SELECT 1 FROM assignments a WHERE a."CoordinationID"=co."CoordinationID")
  UNION
  SELECT "EnterpriseID","StudentID" FROM assignments
  WHERE COALESCE(upper("Status"),'ASSIGNED') IN ('ASSIGNED','ACTIVE','IN_PROGRESS') AND NOT graded
), counts AS (
  SELECT "EnterpriseID",
    count(DISTINCT "StudentID") FILTER (WHERE graded)::int AS completed
  FROM assignments GROUP BY "EnterpriseID"
)
SELECT e."EnterpriseID",e."EnterpriseCode",
  (SELECT count(*)::int FROM received r WHERE r."EnterpriseID"=e."EnterpriseID") AS "previousAcceptedInterns",
  (SELECT count(*)::int FROM active_students a WHERE a."EnterpriseID"=e."EnterpriseID") AS "acceptedInterns",
  (SELECT count(*)::int FROM active_students a WHERE a."EnterpriseID"=e."EnterpriseID") AS "activeInterns",
  COALESCE(c.completed,0) AS "completedInterns"
FROM public."Enterprises" e LEFT JOIN counts c USING ("EnterpriseID")
ORDER BY e."EnterpriseID";

COMMIT;
