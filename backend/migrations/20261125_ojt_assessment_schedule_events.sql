BEGIN;

CREATE OR REPLACE FUNCTION public."NotifyOjtAssessmentScheduleChange"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM pg_notify('ojt_assessment_schedule', '');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "TR_OjtScheduleCalendar" ON public."AcademicPeriods";
CREATE TRIGGER "TR_OjtScheduleCalendar"
  AFTER INSERT OR UPDATE OF "Kind", "ParentPeriodID", "EndDate", "Block10EndDate", "Status" OR DELETE OR TRUNCATE
  ON public."AcademicPeriods"
  FOR EACH STATEMENT EXECUTE FUNCTION public."NotifyOjtAssessmentScheduleChange"();

DROP TRIGGER IF EXISTS "TR_OjtSchedulePlacement" ON public."StudentAcademicPlacements";
CREATE TRIGGER "TR_OjtSchedulePlacement"
  AFTER INSERT OR UPDATE OF "CurrentAcademicPeriodID" OR DELETE OR TRUNCATE
  ON public."StudentAcademicPlacements"
  FOR EACH STATEMENT EXECUTE FUNCTION public."NotifyOjtAssessmentScheduleChange"();

DROP TRIGGER IF EXISTS "TR_OjtScheduleStudentStatus" ON public."Students";
CREATE TRIGGER "TR_OjtScheduleStudentStatus"
  AFTER UPDATE OF "Status", "DeletedAt" ON public."Students"
  FOR EACH ROW WHEN (OLD."Status" IS DISTINCT FROM NEW."Status" OR OLD."DeletedAt" IS DISTINCT FROM NEW."DeletedAt")
  EXECUTE FUNCTION public."NotifyOjtAssessmentScheduleChange"();

DROP TRIGGER IF EXISTS "TR_OjtScheduleAccountStatus" ON public."Users";
CREATE TRIGGER "TR_OjtScheduleAccountStatus"
  AFTER UPDATE OF "Status", "RoleID" ON public."Users"
  FOR EACH ROW WHEN (OLD."Status" IS DISTINCT FROM NEW."Status" OR OLD."RoleID" IS DISTINCT FROM NEW."RoleID")
  EXECUTE FUNCTION public."NotifyOjtAssessmentScheduleChange"();

DROP TRIGGER IF EXISTS "TR_OjtScheduleConditions" ON public."OJTConditions";
CREATE TRIGGER "TR_OjtScheduleConditions"
  AFTER INSERT OR UPDATE OF "EffectiveFrom" OR DELETE OR TRUNCATE
  ON public."OJTConditions"
  FOR EACH STATEMENT EXECUTE FUNCTION public."NotifyOjtAssessmentScheduleChange"();

COMMIT;
