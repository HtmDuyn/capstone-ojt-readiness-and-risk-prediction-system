BEGIN;
SET LOCAL lock_timeout='5s';
SELECT pg_advisory_xact_lock(hashtext('academic-calendar'));

-- Preserve the semester once OJT202 has been recorded. Until then use the
-- first regular semester after the student's current semester (or block parent).
CREATE OR REPLACE FUNCTION public."DefaultOJTAcademicPeriod"(student_id integer)
RETURNS integer LANGUAGE sql STABLE SET search_path=public,pg_catalog AS $period$
 SELECT COALESCE(
   (SELECT grade."AcademicPeriodID" FROM "StudentCourseResults" grade
    JOIN "Courses" course USING ("CourseID")
    WHERE grade."StudentID"=student_id AND grade."SourceReference"='AUTO_OJT_ENROLLMENT'
      AND upper(course."CourseCode")='OJT202'
    ORDER BY grade."ResultID" LIMIT 1),
   (SELECT next_period."AcademicPeriodID"
    FROM "StudentAcademicPlacements" placement
    JOIN "AcademicPeriods" current_period ON current_period."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
    JOIN "AcademicPeriods" semester ON semester."AcademicPeriodID"=COALESCE(current_period."ParentPeriodID",current_period."AcademicPeriodID")
    JOIN "AcademicPeriods" next_period ON next_period."Kind"='SEMESTER' AND next_period."StartDate">semester."EndDate"
    WHERE placement."StudentID"=student_id
    ORDER BY next_period."StartDate",next_period."AcademicPeriodID"
    LIMIT 1)
 );
$period$;

CREATE OR REPLACE VIEW public."OJTRecruitmentRoster" WITH (security_invoker=true) AS
SELECT s."StudentID", target."OJTSemesterID", round."WindowID" AS "RoundID",
  round."Name" AS "RoundName", saved."BatchID", saved."CheckedAt"
FROM public."Students" s
JOIN public."Users" u ON u."UserID"=s."UserID"
JOIN public."StudentOJTCalculatedResults" saved USING ("StudentID")
LEFT JOIN public."OJTSemesters" target
  ON target."AcademicPeriodID"=public."DefaultOJTAcademicPeriod"(s."StudentID")
LEFT JOIN LATERAL (
  SELECT w."WindowID",w."Name"
  FROM public."RecruitmentWindows" w
  WHERE w."OJTSemesterID"=target."OJTSemesterID" AND target."Status" NOT IN ('CLOSED','ARCHIVED')
    AND EXISTS (
      SELECT 1 FROM public."ProgramCourses" pc
      JOIN public."Courses" c USING ("CourseID")
      JOIN public."TrainingPrograms" program USING ("ProgramID")
      WHERE pc."ProgramID"=s."ProgramID" AND program."Status"='PUBLISHED'
        AND upper(c."CourseCode")='OJT202' AND pc."EntryKind"='COURSE' AND pc."RecommendedSemester"=6
    )
    AND w."Status"='OPEN' AND w."ResultsFinalizedAt" IS NULL
    AND w."EndsAt">statement_timestamp() AND COALESCE(w."ApplicationEndsAt",w."EndsAt")>statement_timestamp()
  ORDER BY COALESCE(w."ApplicationStartsAt",w."StartsAt"),w."WindowID"
  LIMIT 1
) round ON true
WHERE saved."Status"='ELIGIBLE' AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND s."DeletedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM public."StudentCourseResults" grade JOIN public."Courses" course USING ("CourseID")
    WHERE grade."StudentID"=s."StudentID" AND upper(course."CourseCode")='OJT202'
      AND grade."Status"='PASSED');

CREATE OR REPLACE FUNCTION public."AssertStudentOJTTerm6"(student_id integer, semester_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE entry_start date; target_start date; target_kind text; relative_term int;
BEGIN
 SELECT entry."StartDate" INTO entry_start FROM "StudentAcademicPlacements" placement
 JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=placement."EntryAcademicPeriodID"
 WHERE placement."StudentID"=student_id AND entry."Kind"='SEMESTER';
 SELECT target."StartDate",target."Kind" INTO target_start,target_kind FROM "OJTSemesters" term
 JOIN "AcademicPeriods" target ON target."AcademicPeriodID"=term."AcademicPeriodID"
 WHERE term."OJTSemesterID"=semester_id;
 IF entry_start IS NULL OR target_start IS NULL OR target_kind<>'SEMESTER' THEN
  RAISE EXCEPTION 'OJT requires an actual student entry semester and a target semester.' USING ERRCODE='23514';
 END IF;
 SELECT "StudentCurriculumSemester"(student_id,"AcademicPeriodID") INTO relative_term FROM "OJTSemesters" WHERE "OJTSemesterID"=semester_id;
 IF relative_term IS DISTINCT FROM 6 AND NOT EXISTS (
  SELECT 1 FROM "StudentCourseResults" grade JOIN "OJTSemesters" term USING ("AcademicPeriodID")
  JOIN "Courses" course ON course."CourseID"=grade."CourseID"
  WHERE term."OJTSemesterID"=semester_id AND grade."StudentID"=student_id
    AND upper(course."CourseCode")='OJT202' AND grade."SourceReference"='AUTO_OJT_ENROLLMENT' AND grade."SemesterTaken"=6
 ) THEN
  RAISE EXCEPTION 'OJT is fixed in relative semester 6; student % is in semester % for this target.',student_id,relative_term USING ERRCODE='23514';
 END IF;
END $function$
;
CREATE OR REPLACE FUNCTION public."GuardFixedOJTSemester6"()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE term_id int; period_id int; root_period int; relative_term int; entry_start date; target_start date; is_ojt boolean;
BEGIN
 IF TG_TABLE_NAME='ProgramCourses' THEN
  SELECT upper("CourseCode")='OJT202' INTO is_ojt FROM "Courses" WHERE "CourseID"=NEW."CourseID";
  IF is_ojt AND (NEW."RecommendedSemester" IS DISTINCT FROM 6 OR NEW."EntryKind"<>'COURSE') THEN
   RAISE EXCEPTION 'OJT202 must be a concrete curriculum course in semester 6.' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='OJTRegistrationWindows' THEN
  SELECT "AcademicPeriodID" INTO period_id FROM "OJTSemesters" WHERE "OJTSemesterID"=NEW."OJTSemesterID";
  IF NEW."RequiredRelativeSemester"<>6 OR NEW."AcademicPeriodID" IS DISTINCT FROM period_id OR period_id IS NULL THEN
   RAISE EXCEPTION 'The registration window must target OJT semester 6 and its linked academic period.' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='OJTRegistrations' THEN
  PERFORM "AssertStudentOJTTerm6"(NEW."StudentID",NEW."OJTSemesterID");
 ELSIF TG_TABLE_NAME='InternshipAssignments' THEN
  SELECT "OJTSemesterID" INTO term_id FROM "InternshipPositions" WHERE "PositionID"=NEW."PositionID";
  PERFORM "AssertStudentOJTTerm6"(NEW."StudentID",term_id);
 ELSIF TG_TABLE_NAME='ProgramOJTGradeMappings' THEN
  IF NOT EXISTS(SELECT 1 FROM "ProgramCourses" pc JOIN "Courses" c USING("CourseID") WHERE pc."ProgramID"=NEW."ProgramID" AND pc."CourseID"=NEW."CourseID" AND upper(c."CourseCode")='OJT202' AND pc."RecommendedSemester"=6 AND pc."EntryKind"='COURSE') THEN
   RAISE EXCEPTION 'OJT grade mapping must use the curriculum OJT202 course in semester 6.' USING ERRCODE='23514';
  END IF;
  SELECT "AcademicPeriodID" INTO period_id FROM "OJTSemesters" WHERE "OJTSemesterID"=NEW."OJTSemesterID";
  SELECT CASE WHEN "Kind"='BLOCK3' THEN "ParentPeriodID" ELSE "AcademicPeriodID" END INTO root_period FROM "AcademicPeriods" WHERE "AcademicPeriodID"=NEW."AcademicPeriodID";
  IF root_period IS DISTINCT FROM period_id OR root_period IS NULL THEN
   RAISE EXCEPTION 'OJT grades must be recorded in the target OJT semester, or its Block 3.' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='StudentCourseResults' THEN
  SELECT upper("CourseCode")='OJT202' INTO is_ojt FROM "Courses" WHERE "CourseID"=NEW."CourseID";
  IF is_ojt THEN
   SELECT entry."StartDate" INTO entry_start FROM "StudentAcademicPlacements" placement JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=placement."EntryAcademicPeriodID" WHERE placement."StudentID"=NEW."StudentID";
   SELECT root."StartDate" INTO target_start FROM "AcademicPeriods" p JOIN "AcademicPeriods" root ON root."AcademicPeriodID"=CASE WHEN p."Kind"='BLOCK3' THEN p."ParentPeriodID" ELSE p."AcademicPeriodID" END WHERE p."AcademicPeriodID"=NEW."AcademicPeriodID" AND root."Kind"='SEMESTER';
   relative_term := "StudentCurriculumSemester"(NEW."StudentID",NEW."AcademicPeriodID");
   IF NEW."SemesterTaken" IS DISTINCT FROM 6 OR (relative_term IS DISTINCT FROM 6 AND (
     NEW."SourceReference" IS DISTINCT FROM 'AUTO_OJT_ENROLLMENT'
     OR NEW."AcademicPeriodID" IS DISTINCT FROM "DefaultOJTAcademicPeriod"(NEW."StudentID")
    )) OR entry_start IS NULL OR target_start IS NULL THEN
    RAISE EXCEPTION 'OJT202 results must belong to the student relative semester 6.' USING ERRCODE='23514';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $function$
;
CREATE OR REPLACE FUNCTION public."ValidateStudentStudyHistory"(student_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE student record; attempt record; required_group record; stage int; passed_count int;
BEGIN
 SELECT s.*,p."Status" AS program_status INTO student FROM "Students" s
 LEFT JOIN "TrainingPrograms" p ON p."ProgramID"=s."ProgramID" WHERE s."StudentID"=student_id;
 IF NOT FOUND THEN RETURN; END IF;
 -- New student accounts may be provisioned before academic placement/import.
 -- Only bypass history validation for a completely unassigned profile.
 -- Once a program, term, placement, or result exists, full rules apply.
 IF student."ProgramID" IS NULL
    AND student."CurrentSemester" IS NULL
    AND NOT EXISTS (SELECT 1 FROM "StudentAcademicPlacements" ap WHERE ap."StudentID"=student_id)
    AND NOT EXISTS (SELECT 1 FROM "StudentCourseResults" cr WHERE cr."StudentID"=student_id)
 THEN
   RETURN;
 END IF;
 IF student."ProgramID" IS NULL OR student.program_status IS DISTINCT FROM 'PUBLISHED' THEN
  RAISE EXCEPTION 'Student % requires a published curriculum.',student_id USING ERRCODE='23514';
 END IF;
 IF student."CurrentSemester" IS NULL OR student."CurrentSemester" NOT BETWEEN 0 AND 9 THEN
  RAISE EXCEPTION 'Student curriculum stage must be between 0 and 9.' USING ERRCODE='23514';
 END IF;
 SELECT "StudentCurriculumSemester"(student_id,p."CurrentAcademicPeriodID") INTO stage
 FROM "StudentAcademicPlacements" p WHERE p."StudentID"=student_id;
 IF stage IS DISTINCT FROM student."CurrentSemester" THEN
  RAISE EXCEPTION 'Student % requires a placement matching the current curriculum stage.',student_id USING ERRCODE='23514';
 END IF;
 IF stage>0 AND NOT EXISTS(SELECT 1 FROM "StudentCourseResults" r WHERE r."StudentID"=student_id AND r."SemesterTaken"<stage) THEN
  RAISE EXCEPTION 'Student % requires earlier course history.',student_id USING ERRCODE='23514';
 END IF;
 FOR attempt IN SELECT r.*,p."StartDate",pc."ProgramCourseID", c."CourseCode" FROM "StudentCourseResults" r
  JOIN "Courses" c ON c."CourseID"=r."CourseID"
  JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=r."AcademicPeriodID"
  LEFT JOIN "ProgramCourses" pc ON pc."ProgramID"=student."ProgramID" AND pc."CourseID"=r."CourseID" AND pc."EntryKind"='COURSE'
  WHERE r."StudentID"=student_id LOOP
  -- The OJT eligibility decision authorizes the automatic OJT202 enrollment.
  IF attempt."SourceReference"='AUTO_OJT_ENROLLMENT' AND attempt."Status"='IN_PROGRESS'
   AND upper(attempt."CourseCode")='OJT202' AND attempt."ProgramCourseID" IS NOT NULL
   AND attempt."SemesterTaken"=6
   AND attempt."AcademicPeriodID"="DefaultOJTAcademicPeriod"(student_id) AND attempt."Score" IS NULL AND attempt."Grade" IS NULL
   AND attempt."GradePoints" IS NULL
   AND EXISTS(SELECT 1 FROM "StudentOJTCalculatedResults" saved
    WHERE saved."StudentID"=student_id AND saved."Status"='ELIGIBLE') THEN
   CONTINUE;
  END IF;
  IF attempt."SemesterTaken" IS DISTINCT FROM "StudentCurriculumSemester"(student_id,attempt."AcademicPeriodID") THEN
   RAISE EXCEPTION 'Course history must match the mapped curriculum stage.' USING ERRCODE='23514';
  END IF;
  IF attempt."SemesterTaken">stage THEN
   RAISE EXCEPTION 'Course history must match the mapped curriculum stage and cannot exceed student progress.' USING ERRCODE='23514';
  END IF;
  -- Concrete subjects and approved combo options retain their own curriculum tag.
  IF NOT EXISTS(SELECT 1 FROM "ProgramCourses" pc WHERE pc."ProgramID"=student."ProgramID"
    AND pc."CourseID"=attempt."CourseID" AND pc."EntryKind"='COURSE')
   AND NOT EXISTS(SELECT 1 FROM "ProgramCombos" b JOIN "ComboCourses" cc USING("ProgramComboID")
    WHERE b."ProgramID"=student."ProgramID" AND b."CoursesReviewed" AND cc."CourseID"=attempt."CourseID") THEN
   RAISE EXCEPTION 'Course % is outside the curriculum.',attempt."CourseID" USING ERRCODE='23514';
  END IF;
  -- Prerequisite prose is not proof that a subject has no prerequisites.
  IF EXISTS (
    SELECT 1 FROM "ProgramCourses" pc WHERE pc."ProgramCourseID"=attempt."ProgramCourseID"
      AND lower(btrim(COALESCE(pc."PrerequisiteText",''))) NOT IN ('','none','n/a','na','không','no','-')
  ) AND NOT EXISTS (
    SELECT 1 FROM "ProgramPrerequisiteGroups" g WHERE g."ProgramID"=student."ProgramID" AND g."ProgramCourseID"=attempt."ProgramCourseID"
  ) THEN
    RAISE EXCEPTION 'Course % requires structured prerequisite configuration before importing history.',attempt."CourseID" USING ERRCODE='23514';
  END IF;
  IF attempt."ProgramCourseID" IS NULL AND EXISTS (
    SELECT 1 FROM "ComboCourses" cc JOIN "ProgramCombos" b USING("ProgramComboID")
    WHERE b."ProgramID"=student."ProgramID" AND cc."CourseID"=attempt."CourseID"
      AND b."CoursesReviewed" AND lower(btrim(COALESCE(cc."PrerequisiteText",''))) NOT IN ('','none','n/a','na','không','no','-')
  ) AND NOT EXISTS (
    SELECT 1 FROM "ProgramPrerequisiteGroups" g JOIN "ProgramSlotOptions" opt ON opt."ProgramCourseID"=g."ProgramCourseID"
    JOIN "ComboCourses" cc ON cc."ComboCourseID"=opt."ComboCourseID"
    WHERE g."ProgramID"=student."ProgramID" AND cc."CourseID"=attempt."CourseID"
  ) THEN
    RAISE EXCEPTION 'Combo course % requires structured prerequisite configuration before importing history.',attempt."CourseID" USING ERRCODE='23514';
  END IF;
  FOR required_group IN SELECT g.* FROM "ProgramPrerequisiteGroups" g
   WHERE g."ProgramID"=student."ProgramID" AND (g."ProgramCourseID"=attempt."ProgramCourseID"
    OR g."ProgramCourseID" IN (
      SELECT opt."ProgramCourseID" FROM "ProgramSlotOptions" opt
      JOIN "ComboCourses" cc ON cc."ComboCourseID"=opt."ComboCourseID"
      JOIN "ProgramCombos" b ON b."ProgramComboID"=cc."ProgramComboID"
      WHERE b."ProgramID"=student."ProgramID" AND b."CoursesReviewed" AND cc."CourseID"=attempt."CourseID"
    )) LOOP
   SELECT count(*) INTO passed_count FROM "ProgramPrerequisiteMembers" m WHERE m."GroupID"=required_group."GroupID"
    AND EXISTS(SELECT 1 FROM "StudentCourseResults" passed
     WHERE passed."StudentID"=student_id AND passed."CourseID"=m."CourseID"
      AND passed."Status" IN ('PASSED','RECOGNIZED') AND passed."SemesterTaken"<attempt."SemesterTaken");
   IF passed_count<required_group."MinimumPassed" THEN
    RAISE EXCEPTION 'Course % requires passed prerequisite group % in an earlier stage.',attempt."CourseID",required_group."GroupCode" USING ERRCODE='23514';
   END IF;
  END LOOP;
 END LOOP;
 IF EXISTS(SELECT 1 FROM "StudentCourseResults" r LEFT JOIN "AcademicPeriods" p USING("AcademicPeriodID")
  WHERE r."StudentID"=student_id AND (p."AcademicPeriodID" IS NULL OR r."AcademicYearID" IS DISTINCT FROM p."AcademicYearID")) THEN
  RAISE EXCEPTION 'Course history requires a matching academic year and period.' USING ERRCODE='23514';
 END IF;
END $function$
;
CREATE OR REPLACE FUNCTION public."EnrollAssignedOJTStudents"(target_student integer, target_semester integer)
RETURNS void LANGUAGE sql SET search_path=public,pg_catalog AS $enroll$
 INSERT INTO "StudentCourseResults" ("StudentID","CourseID","SemesterTaken","AcademicYearID","Status","AcademicPeriodID","SourceReference")
 SELECT roster."StudentID",pc."CourseID",6,period."AcademicYearID",'IN_PROGRESS',period."AcademicPeriodID",'AUTO_OJT_ENROLLMENT'
 FROM "OJTRecruitmentRoster" roster
 JOIN "Students" student USING ("StudentID")
 JOIN "ProgramCourses" pc ON pc."ProgramID"=student."ProgramID"
 JOIN "Courses" course ON course."CourseID"=pc."CourseID"
 JOIN "OJTSemesters" term ON term."OJTSemesterID"=roster."OJTSemesterID"
 JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=term."AcademicPeriodID"
 WHERE roster."RoundID" IS NOT NULL
   AND (target_student IS NULL OR roster."StudentID"=target_student)
   AND (target_semester IS NULL OR roster."OJTSemesterID"=target_semester)
   AND upper(course."CourseCode")='OJT202' AND pc."EntryKind"='COURSE' AND pc."RecommendedSemester"=6
   AND NOT EXISTS(SELECT 1 FROM "StudentCourseResults" existing
     JOIN "AcademicPeriods" recorded_period ON recorded_period."AcademicPeriodID"=existing."AcademicPeriodID"
     WHERE existing."StudentID"=roster."StudentID" AND existing."CourseID"=pc."CourseID"
       AND COALESCE(recorded_period."ParentPeriodID",recorded_period."AcademicPeriodID")=period."AcademicPeriodID")
 ON CONFLICT ("StudentID","CourseID","AcademicPeriodID","AttemptNumber")
 WHERE "AcademicPeriodID" IS NOT NULL DO NOTHING;
$enroll$;

CREATE OR REPLACE FUNCTION public."SyncAssignedOJTEnrollment"()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_catalog AS $sync$
BEGIN
 IF TG_TABLE_NAME='StudentOJTCalculatedResults' THEN
  IF NEW."Status"='ELIGIBLE' THEN
   PERFORM "EnrollAssignedOJTStudents"(NEW."StudentID",NULL);
  END IF;
 ELSIF NEW."Status"='OPEN' THEN
  PERFORM "EnrollAssignedOJTStudents"(NULL,NEW."OJTSemesterID");
 END IF;
 RETURN NULL;
END $sync$;

DROP TRIGGER IF EXISTS "TR_OJTEnrollAfterEligibility" ON public."StudentOJTCalculatedResults";
CREATE TRIGGER "TR_OJTEnrollAfterEligibility" AFTER INSERT OR UPDATE OF "Status"
 ON public."StudentOJTCalculatedResults" FOR EACH ROW EXECUTE FUNCTION public."SyncAssignedOJTEnrollment"();
DROP TRIGGER IF EXISTS "TR_OJTEnrollAfterRoundOpen" ON public."RecruitmentWindows";
CREATE TRIGGER "TR_OJTEnrollAfterRoundOpen" AFTER INSERT OR UPDATE OF "Status","EndsAt","ApplicationEndsAt"
 ON public."RecruitmentWindows" FOR EACH ROW EXECUTE FUNCTION public."SyncAssignedOJTEnrollment"();

SELECT public."EnrollAssignedOJTStudents"(NULL,NULL);
REVOKE ALL ON FUNCTION public."EnrollAssignedOJTStudents"(integer,integer), public."SyncAssignedOJTEnrollment"() FROM PUBLIC;
DO $permissions$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
  GRANT EXECUTE ON FUNCTION public."EnrollAssignedOJTStudents"(integer,integer) TO service_role;
 END IF;
END $permissions$;

COMMIT;
