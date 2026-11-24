CREATE TABLE IF NOT EXISTS public."OJTAutomaticAssessments" (
  "AcademicPeriodID" integer NOT NULL REFERENCES public."AcademicPeriods"("AcademicPeriodID") ON DELETE CASCADE,
  "Milestone" text NOT NULL CHECK ("Milestone" IN ('BLOCK10','BLOCK3','SEMESTER')),
  "DueAt" timestamptz NOT NULL,
  "ConditionID" integer NOT NULL REFERENCES public."OJTConditions"("ConditionID"),
  "CompletedAt" timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY ("AcademicPeriodID","Milestone")
);
ALTER TABLE public."OJTAutomaticAssessments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."OJTAutomaticAssessments" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT SELECT,INSERT ON public."OJTAutomaticAssessments" TO service_role;
  END IF;
END $$;
