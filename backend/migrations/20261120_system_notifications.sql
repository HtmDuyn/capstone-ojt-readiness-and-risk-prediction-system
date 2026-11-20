-- Additive and repeatable. Apply before deploying the notification fixes.
BEGIN;
ALTER TABLE public."Notifications" ADD COLUMN IF NOT EXISTS "EventKey" text;
CREATE UNIQUE INDEX IF NOT EXISTS "Notifications_EventKey_key" ON public."Notifications" ("EventKey");
ALTER TABLE public."EmailOutbox" DROP CONSTRAINT IF EXISTS "EmailOutbox_Kind_check";
ALTER TABLE public."EmailOutbox" ADD CONSTRAINT "EmailOutbox_Kind_check"
  CHECK ("Kind" IN ('ACCOUNT','COMBO_REMINDER','ACADEMIC_ALERT','OJT_RESULT','PASSWORD_RESET','SYSTEM_NOTIFICATION'));
INSERT INTO public."SchemaMigrations"("Version") VALUES ('20261120_system_notifications') ON CONFLICT DO NOTHING;
COMMIT;
