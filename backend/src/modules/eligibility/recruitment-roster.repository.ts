// Backend-owned assignment rules. These queries read base tables, never the legacy roster/access views.
// The student alias `s` is the authenticated or staff-filtered student in the enclosing query.
export const recruitmentRoundForStudentSql = `SELECT w."WindowID",w."Name",w."OJTSemesterID"
  FROM public."RecruitmentWindows" w
  JOIN public."OJTSemesters" term ON term."OJTSemesterID"=w."OJTSemesterID"
  JOIN public."AcademicPeriods" period ON period."AcademicPeriodID"=w."AcademicPeriodID"
  WHERE w."Status"='OPEN' AND w."ResultsFinalizedAt" IS NULL
    AND w."EndsAt">statement_timestamp()
    AND COALESCE(w."ApplicationEndsAt",w."EndsAt")>statement_timestamp()
    AND term."AcademicPeriodID"=period."AcademicPeriodID" AND period."Kind"='SEMESTER'
    AND term."Status" NOT IN ('CLOSED','ARCHIVED') AND period."Status" NOT IN ('CLOSED','ARCHIVED')
    AND period."StartDate"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    AND period."EndDate">=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    AND EXISTS (
      SELECT 1 FROM public."ProgramCourses" pc JOIN public."Courses" course USING("CourseID")
      JOIN public."TrainingPrograms" program USING("ProgramID")
      WHERE pc."ProgramID"=s."ProgramID" AND program."Status"='PUBLISHED'
        AND upper(btrim(course."CourseCode"))='OJT202' AND pc."EntryKind"='COURSE' AND pc."RecommendedSemester"=6
    )
    AND EXISTS (
      SELECT 1 FROM public."OJTRegistrationWindows" app
      LEFT JOIN public."StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
      LEFT JOIN public."TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
      WHERE app."RecruitmentRoundID"=w."WindowID" AND app."Status"='OPEN'
        AND (NOT (app."Scope" ? 'studentIds') OR app."Scope"->'studentIds' @> jsonb_build_array(s."StudentID"))
        AND (NOT (app."Scope" ? 'programIds') OR app."Scope"->'programIds' @> jsonb_build_array(s."ProgramID"))
        AND (NOT (app."Scope" ? 'majorIds') OR app."Scope"->'majorIds' @> jsonb_build_array(program."SpecializationID"))
        AND (NOT (app."Scope" ? 'cohortIds') OR app."Scope"->'cohortIds' @> jsonb_build_array(placement."CohortID"))
        AND (NOT (app."Scope" ? 'groupCodes') OR app."Scope"->'groupCodes' @> jsonb_build_array(placement."GroupCode"))
    )
  ORDER BY COALESCE(w."ApplicationStartsAt",w."StartsAt"),w."WindowID" LIMIT 1`;

// Preserve eligibility freshness, pathway fallback and completed historical assignments.
export const recruitmentRosterSql = `SELECT s."StudentID", target."OJTSemesterID", round."WindowID" AS "RoundID",
  round."Name" AS "RoundName", saved."BatchID", saved."CheckedAt"
FROM public."Students" s
JOIN public."Users" u ON u."UserID"=s."UserID"
JOIN public."StudentOJTCalculatedResults" saved USING ("StudentID")
LEFT JOIN LATERAL (
  ${recruitmentRoundForStudentSql}
) round ON true
LEFT JOIN public."OJTSemesters" target ON target."OJTSemesterID"=COALESCE(round."OJTSemesterID",
  (SELECT fallback."OJTSemesterID" FROM public."OJTSemesters" fallback
   WHERE fallback."AcademicPeriodID"=public."DefaultOJTAcademicPeriod"(s."StudentID") LIMIT 1))
WHERE saved."Status"='ELIGIBLE'
  AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND s."DeletedAt" IS NULL
  AND saved."ProgramID" IS NOT DISTINCT FROM s."ProgramID"
  AND CASE WHEN saved."ConditionID" IS NOT NULL THEN
    saved."ConditionID" IS NOT DISTINCT FROM (saved."Result"->'rule'->>'conditionId')::int
    AND saved."ConditionID" IS NOT DISTINCT FROM (
      SELECT condition."ConditionID" FROM public."OJTConditions" condition
      WHERE condition."EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY condition."EffectiveFrom" DESC,condition."Version" DESC LIMIT 1
    )
    ELSE CASE WHEN COALESCE(saved."Result"->'rule'->'defaultRule','false'::jsonb)='true'::jsonb THEN NOT EXISTS (
      SELECT 1 FROM public."OJTConditions" condition
      WHERE condition."EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    ) ELSE COALESCE((saved."Result"->>'policyVersion')::int,0)=COALESCE(
      (SELECT max(policy."Version") FROM public."OJTConditionPolicies" policy),0
    ) END
  END
  AND NOT EXISTS (
    SELECT 1 FROM public."StudentAcademicPlacements" placement
    WHERE placement."StudentID"=s."StudentID" AND placement."UpdatedAt">saved."CheckedAt"
  )
  AND NOT EXISTS (
    SELECT 1 FROM public."StudentCourseResults" history
    WHERE history."StudentID"=s."StudentID"
      AND COALESCE(history."UpdatedAt",history."CreatedAt")>saved."CheckedAt"
      AND (history."SourceReference" IS DISTINCT FROM 'AUTO_OJT_ENROLLMENT'
        OR history."Status" IS DISTINCT FROM 'IN_PROGRESS')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public."StudentCourseResults" grade
    JOIN public."Courses" course USING ("CourseID")
    WHERE grade."StudentID"=s."StudentID"
      AND upper(btrim(course."CourseCode"))='OJT202'
      AND grade."Status"='PASSED'
  )
UNION
SELECT registration."StudentID",registration."OJTSemesterID",recruitment_round."WindowID",
  recruitment_round."Name",NULL::integer,registration."ReviewedAt"
FROM public."OJTRegistrations" registration
JOIN public."StudentEnterpriseCoordination" coordination
  ON coordination."RegistrationID"=registration."RegistrationID"
 AND coordination."Decision" IN ('ACCEPTED','APPROVED')
JOIN public."InternshipAssignments" assignment
  ON assignment."CoordinationID"=coordination."CoordinationID"
 AND assignment."Status"='COMPLETED'
JOIN LATERAL (
  SELECT post."WindowID"
  FROM public."JobApplications" application
  JOIN public."RecruitmentPosts" post ON post."PostID"=application."PostID"
  WHERE application."RegistrationID"=registration."RegistrationID"
    AND application."PositionID"=assignment."PositionID"
    AND application."Status"='ACCEPTED'
  ORDER BY application."UpdatedAt" DESC,application."ApplicationID" DESC
  LIMIT 1
) accepted_application ON true
JOIN public."RecruitmentWindows" recruitment_round
  ON recruitment_round."WindowID"=accepted_application."WindowID"
 AND recruitment_round."OJTSemesterID"=registration."OJTSemesterID"
WHERE registration."Status"='APPROVED'`;

// Keep historical access independent of current eligibility or round status.
export const recruitmentAccessSql = `
SELECT "StudentID","OJTSemesterID" FROM (${recruitmentRosterSql}) roster WHERE "OJTSemesterID" IS NOT NULL
UNION
SELECT "StudentID","OJTSemesterID" FROM ojt_history."StudentEligibilityItems"
UNION
SELECT "StudentID","OJTSemesterID" FROM public."OJTRegistrations"
WHERE "PathwaySnapshot"->>'admissionSource'='SAVED_ELIGIBILITY'`;
