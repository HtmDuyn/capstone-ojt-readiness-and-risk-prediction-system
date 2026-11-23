-- Add the grading metadata used by Academic Affairs and enterprise evaluations.
-- Existing templates and scores are preserved; no policy is fabricated for old records.
ALTER TABLE public."AssessmentTemplates"
  ADD COLUMN IF NOT EXISTS "OJTSemesterID" integer,
  ADD COLUMN IF NOT EXISTS "EffectiveFrom" date,
  ADD COLUMN IF NOT EXISTS "Reason" text;

ALTER TABLE public."InternshipEvaluations"
  ADD COLUMN IF NOT EXISTS "TemplateID" integer,
  ADD COLUMN IF NOT EXISTS "ScoreDetails" jsonb;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."AssessmentTemplates"'::regclass AND conname='AssessmentTemplates_OJTSemesterID_fkey') THEN
    ALTER TABLE public."AssessmentTemplates" ADD CONSTRAINT "AssessmentTemplates_OJTSemesterID_fkey"
      FOREIGN KEY ("OJTSemesterID") REFERENCES public."OJTSemesters"("OJTSemesterID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."InternshipEvaluations"'::regclass AND conname='InternshipEvaluations_TemplateID_fkey') THEN
    ALTER TABLE public."InternshipEvaluations" ADD CONSTRAINT "InternshipEvaluations_TemplateID_fkey"
      FOREIGN KEY ("TemplateID") REFERENCES public."AssessmentTemplates"("TemplateID");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_AssessmentTemplates_PublishedEffective"
  ON public."AssessmentTemplates" ("EffectiveFrom" DESC,"Version" DESC,"TemplateID" DESC)
  WHERE "Status"='PUBLISHED' AND "OJTSemesterID" IS NOT NULL;

INSERT INTO public."SchemaMigrations"("Version") VALUES ('20261124_enterprise_grading_criteria')
  ON CONFLICT DO NOTHING;
