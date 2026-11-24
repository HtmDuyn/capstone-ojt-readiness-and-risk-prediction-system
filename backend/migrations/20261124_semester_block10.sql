ALTER TABLE public."AcademicPeriods"
  ADD COLUMN IF NOT EXISTS "Block10StartDate" date,
  ADD COLUMN IF NOT EXISTS "Block10EndDate" date;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public."AcademicPeriods"'::regclass AND conname='CK_AcademicPeriods_Block10Dates') THEN
    ALTER TABLE public."AcademicPeriods" ADD CONSTRAINT "CK_AcademicPeriods_Block10Dates" CHECK (
      ("Block10StartDate" IS NULL AND "Block10EndDate" IS NULL)
      OR ("Kind"='SEMESTER' AND "Block10StartDate" IS NOT NULL AND "Block10EndDate" IS NOT NULL
        AND "StartDate"<="Block10StartDate" AND "Block10StartDate"<="Block10EndDate" AND "Block10EndDate"<="EndDate")
    );
  END IF;
END $$;
