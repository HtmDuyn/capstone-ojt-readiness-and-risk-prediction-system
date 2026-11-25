BEGIN;
SET LOCAL lock_timeout='5s';
SELECT pg_advisory_xact_lock(hashtext('academic-calendar'));

CREATE SCHEMA IF NOT EXISTS ojt_history;
REVOKE ALL ON SCHEMA ojt_history FROM PUBLIC;
DO $archive$
BEGIN
  IF to_regclass('public."EligibleStudentHandoffs"') IS NOT NULL THEN
    ALTER TABLE public."EligibleStudentHandoffItems" SET SCHEMA ojt_history;
    ALTER TABLE public."EligibleStudentHandoffs" SET SCHEMA ojt_history;
    ALTER TABLE ojt_history."EligibleStudentHandoffItems" RENAME TO "StudentEligibilityItems";
    ALTER TABLE ojt_history."EligibleStudentHandoffs" RENAME TO "EligibilityBatches";
    DROP TRIGGER IF EXISTS "TR_ValidateAcademicHandoff" ON ojt_history."StudentEligibilityItems";
    DROP TRIGGER IF EXISTS "TR_FixedOJT_Handoff" ON ojt_history."StudentEligibilityItems";
  END IF;
  IF to_regclass('ojt_history."StudentEligibilityItems"') IS NULL THEN
    CREATE VIEW ojt_history."StudentEligibilityItems" AS
    SELECT NULL::integer AS "HandoffID", NULL::integer AS "OJTSemesterID",
      NULL::integer AS "RegistrationID", NULL::integer AS "StudentID", NULL::integer AS "CheckID",
      NULL::jsonb AS "Snapshot", NULL::integer AS "CalculatedBatchID"
    WHERE false;
    CREATE VIEW ojt_history."EligibilityBatches" AS
    SELECT NULL::integer AS "HandoffID", NULL::integer AS "OJTSemesterID",
      NULL::jsonb AS "RegistrationIDs", NULL::text AS "Reason",
      NULL::integer AS "CreatedBy", NULL::timestamptz AS "CreatedAt", NULL::text AS "RecipientRole"
    WHERE false;
  END IF;
  REVOKE ALL ON ojt_history."StudentEligibilityItems", ojt_history."EligibilityBatches" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SCHEMA ojt_history FROM anon;
    REVOKE ALL ON ojt_history."StudentEligibilityItems", ojt_history."EligibilityBatches" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SCHEMA ojt_history FROM authenticated;
    REVOKE ALL ON ojt_history."StudentEligibilityItems", ojt_history."EligibilityBatches" FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    REVOKE ALL ON ojt_history."StudentEligibilityItems", ojt_history."EligibilityBatches" FROM service_role;
    GRANT USAGE ON SCHEMA ojt_history TO service_role;
    GRANT SELECT ON ojt_history."StudentEligibilityItems", ojt_history."EligibilityBatches" TO service_role;
  END IF;
END $archive$;

CREATE OR REPLACE FUNCTION public."GuardHandedOffRegistration"()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_catalog AS $guard$
BEGIN
  IF TG_OP<>'INSERT' AND OLD."Status"='HANDED_OFF' AND EXISTS (
    SELECT 1 FROM ojt_history."StudentEligibilityItems" i WHERE i."RegistrationID"=OLD."RegistrationID"
  ) THEN
    RAISE EXCEPTION 'Historical OJT registration is immutable' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF NEW."Status"='HANDED_OFF' AND (TG_OP='INSERT' OR OLD."Status" IS DISTINCT FROM 'HANDED_OFF') THEN
    RAISE EXCEPTION 'The handoff status is retired' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $guard$;

DROP FUNCTION IF EXISTS public."GuardAcademicHandoff"();

COMMIT;
