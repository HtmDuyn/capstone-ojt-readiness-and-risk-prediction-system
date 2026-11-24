BEGIN;

CREATE OR REPLACE VIEW public."OJTRecruitmentRoster" WITH (security_invoker=true) AS
SELECT s."StudentID", target."OJTSemesterID", round."WindowID" AS "RoundID",
  round."Name" AS "RoundName", saved."BatchID", saved."CheckedAt"
FROM public."Students" s
JOIN public."Users" u ON u."UserID"=s."UserID"
JOIN public."StudentOJTCalculatedResults" saved USING ("StudentID")
LEFT JOIN public."StudentAcademicPlacements" placement USING ("StudentID")
LEFT JOIN public."CohortCurriculumPeriods" plan ON plan."CohortID"=placement."CohortID"
  AND plan."GroupCode"=placement."GroupCode" AND plan."CurriculumSemester"=6
LEFT JOIN public."OJTSemesters" target ON target."AcademicPeriodID"=plan."AcademicPeriodID"
LEFT JOIN LATERAL (
  SELECT w."WindowID",w."Name"
  FROM public."RecruitmentWindows" w
  WHERE w."OJTSemesterID"=target."OJTSemesterID" AND target."Status" NOT IN ('CLOSED','ARCHIVED')
    AND w."Status"='OPEN' AND w."ResultsFinalizedAt" IS NULL
    AND w."EndsAt">statement_timestamp() AND COALESCE(w."ApplicationEndsAt",w."EndsAt")>statement_timestamp()
  ORDER BY COALESCE(w."ApplicationStartsAt",w."StartsAt"),w."WindowID"
  LIMIT 1
) round ON true
WHERE saved."Status"='ELIGIBLE' AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND s."DeletedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM public."OJTResults" result WHERE result."StudentID"=s."StudentID")
  AND NOT EXISTS (SELECT 1 FROM public."StudentCourseResults" grade JOIN public."Courses" course USING ("CourseID")
    WHERE grade."StudentID"=s."StudentID" AND upper(course."CourseCode")='OJT202'
      AND grade."Status" IN ('PASSED','FAILED','RECOGNIZED'));

-- Historical registrations and handoffs remain visible in existing dossiers.
CREATE OR REPLACE VIEW public."OJTRecruitmentAccess" WITH (security_invoker=true) AS
SELECT "StudentID","OJTSemesterID" FROM public."OJTRecruitmentRoster" WHERE "OJTSemesterID" IS NOT NULL
UNION
SELECT "StudentID","OJTSemesterID" FROM public."EligibleStudentHandoffItems"
UNION
SELECT "StudentID","OJTSemesterID" FROM public."OJTRegistrations"
WHERE "PathwaySnapshot"->>'admissionSource'='SAVED_ELIGIBILITY';

REVOKE ALL ON public."OJTRecruitmentRoster",public."OJTRecruitmentAccess" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON public."OJTRecruitmentRoster",public."OJTRecruitmentAccess" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON public."OJTRecruitmentRoster",public."OJTRecruitmentAccess" FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT SELECT ON public."OJTRecruitmentRoster",public."OJTRecruitmentAccess" TO service_role;
  END IF;
END $$;

COMMIT;
