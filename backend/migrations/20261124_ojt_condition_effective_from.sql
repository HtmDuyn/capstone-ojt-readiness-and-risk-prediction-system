BEGIN;

ALTER TABLE public."OJTConditions" ADD COLUMN IF NOT EXISTS "EffectiveFrom" date;

UPDATE public."OJTConditions"
SET "EffectiveFrom" = ("CreatedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
WHERE "EffectiveFrom" IS NULL;

ALTER TABLE public."OJTConditions" ALTER COLUMN "EffectiveFrom" SET NOT NULL;

CREATE OR REPLACE FUNCTION public."GuardOJTConditionEffectiveFrom"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW."EffectiveFrom" <= (clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
    RAISE EXCEPTION 'OJT condition effective date must be after today'
      USING ERRCODE = '23514', CONSTRAINT = 'CK_OJTConditions_FutureEffectiveFrom';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "TR_OJTConditionEffectiveFrom" ON public."OJTConditions";
CREATE TRIGGER "TR_OJTConditionEffectiveFrom"
  BEFORE INSERT OR UPDATE OF "EffectiveFrom" ON public."OJTConditions"
  FOR EACH ROW EXECUTE FUNCTION public."GuardOJTConditionEffectiveFrom"();

COMMIT;
