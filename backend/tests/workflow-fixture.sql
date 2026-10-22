-- Isolated PostgreSQL fixture for the import/task/result services. Never uses .env or an external database.
CREATE TABLE "Roles" ("RoleID" serial PRIMARY KEY,"RoleCode" text UNIQUE,"RoleName" text);
CREATE TABLE "Users" ("UserID" serial PRIMARY KEY,"Username" text UNIQUE,"Email" text,"FullName" text,"Phone" text,"PasswordHash" text,"RoleID" int REFERENCES "Roles","Status" text DEFAULT 'ACTIVE',"MustChangePassword" boolean DEFAULT false,"TemporaryPasswordExpiresAt" timestamptz,"UpdatedAt" timestamptz DEFAULT now(),"AuthVersion" int DEFAULT 0);
CREATE UNIQUE INDEX ON "Users"(lower("Email"));
CREATE TABLE "Enterprises" ("EnterpriseID" serial PRIMARY KEY,"EnterpriseCode" text NOT NULL,"Name" text,"Address" text,"ContactEmail" text,"ContactPersonName" text,"Status" text DEFAULT 'ACTIVE',"DeletedAt" timestamptz);
CREATE UNIQUE INDEX ON "Enterprises"(upper("EnterpriseCode"));
CREATE TABLE "EnterpriseUsers" ("UserID" int PRIMARY KEY REFERENCES "Users","EnterpriseID" int REFERENCES "Enterprises","PositionTitle" text);
CREATE TABLE "AcademicYears" ("AcademicYearID" serial PRIMARY KEY,"StartDate" date,"EndDate" date);
CREATE TABLE "AcademicPeriods" ("AcademicPeriodID" serial PRIMARY KEY,"AcademicYearID" int REFERENCES "AcademicYears","PeriodCode" text,"Name" text,"Kind" text,"Status" text,"StartDate" date,"EndDate" date,"ParentPeriodID" int REFERENCES "AcademicPeriods");
CREATE TABLE "OJTSemesters" ("OJTSemesterID" serial PRIMARY KEY,"AcademicPeriodID" int REFERENCES "AcademicPeriods","AcademicYearID" int REFERENCES "AcademicYears","SemesterCode" text,"StartDate" date,"EndDate" date);
CREATE TABLE "RecruitmentWindows" ("WindowID" serial PRIMARY KEY,"AcademicPeriodID" int REFERENCES "AcademicPeriods","OJTSemesterID" int REFERENCES "OJTSemesters","Status" text,"StartsAt" timestamptz,"EndsAt" timestamptz);
CREATE TABLE "AccountImportBatches" ("BatchID" serial PRIMARY KEY,"IdempotencyKey" text UNIQUE,"PayloadHash" text,"Kind" text,"OJTSemesterID" int,"ImportedBy" int REFERENCES "Users","Summary" jsonb,"RecruitmentWindowID" int);
CREATE TABLE "AccountImportRows" ("BatchID" int REFERENCES "AccountImportBatches","RowNumber" int,"SourceCode" text,"UserID" int REFERENCES "Users","Action" text);
CREATE TABLE "EmailOutbox" ("EmailID" bigserial PRIMARY KEY,"UserID" int REFERENCES "Users","Recipient" text,"EncryptedPayload" text,"ExpiresAt" timestamptz,"Kind" text DEFAULT 'ACCOUNT',"Status" text DEFAULT 'PENDING',"Attempts" int DEFAULT 0,"NextAttemptAt" timestamptz DEFAULT now(),"LeaseUntil" timestamptz,"SentAt" timestamptz,"LastError" text);
CREATE TABLE "InternshipPositions" ("PositionID" serial PRIMARY KEY,"EnterpriseID" int REFERENCES "Enterprises","OJTSemesterID" int REFERENCES "OJTSemesters","RecruitmentCode" text,"Title" text,"Description" text,"Requirements" text,"Capacity" int,"RemainingSlots" int,"Status" text,UNIQUE("EnterpriseID","OJTSemesterID","RecruitmentCode"));
CREATE TABLE "RecruitmentPosts" ("PostID" serial PRIMARY KEY,"EnterpriseID" int REFERENCES "Enterprises","OJTSemesterID" int REFERENCES "OJTSemesters","Title" text,"Content" text,"Status" text,"CreatedBy" int REFERENCES "Users","WindowID" int,"DeadlineAt" timestamptz);
CREATE TABLE "RecruitmentPostPositions" ("PostID" int REFERENCES "RecruitmentPosts","PositionID" int REFERENCES "InternshipPositions","EnterpriseID" int,"OJTSemesterID" int);
CREATE TABLE "AuditLogs" ("LogID" serial PRIMARY KEY,"UserID" int REFERENCES "Users","Action" text,"EntityType" text,"EntityID" int,"Detail" text);
CREATE TABLE "TrainingPrograms" ("ProgramID" serial PRIMARY KEY);
CREATE TABLE "Cohorts" ("CohortID" serial PRIMARY KEY,"Status" text,"EnrollmentYear" int);
CREATE TABLE "CohortGroups" ("CohortID" int REFERENCES "Cohorts","GroupCode" text,"EntryAcademicPeriodID" int REFERENCES "AcademicPeriods");
CREATE TABLE "Students" ("StudentID" serial PRIMARY KEY,"UserID" int REFERENCES "Users","StudentCode" text UNIQUE,"ProgramID" int REFERENCES "TrainingPrograms","ClassName" text,"Status" text DEFAULT 'ACTIVE',"DeletedAt" timestamptz,"EnrollmentYear" int,"CurrentSemester" int);
CREATE TABLE "StudentAcademicPlacements" ("StudentID" int PRIMARY KEY REFERENCES "Students","CohortID" int REFERENCES "Cohorts","GroupCode" text,"EntryAcademicPeriodID" int REFERENCES "AcademicPeriods","CurrentAcademicPeriodID" int REFERENCES "AcademicPeriods","UpdatedBy" int,"UpdatedAt" timestamptz DEFAULT now(),"AuthVersion" int DEFAULT 0);
CREATE TABLE "Courses" ("CourseID" serial PRIMARY KEY,"CourseCode" text UNIQUE);
CREATE TABLE "StudentCourseResults" ("ResultID" serial PRIMARY KEY,"StudentID" int REFERENCES "Students","CourseID" int REFERENCES "Courses","AcademicPeriodID" int REFERENCES "AcademicPeriods","AttemptNumber" int,"Status" text,"Score" numeric,"GradePoints" numeric,"Grade" text,"SourceReference" text,"AcademicYearID" int,"SemesterTaken" int,"RecordedBy" int);
CREATE TABLE "AcademicImportBatches" ("BatchID" bigserial PRIMARY KEY,"Kind" text,"IdempotencyKey" text,"PayloadHash" text,"SourceName" text,"ImportedBy" int,"Status" text,"Summary" jsonb,"SourceAccountBatchID" int,"CurriculumID" int);
CREATE TABLE "AcademicImportRows" ("BatchID" bigint,"RowNumber" int,"RawData" jsonb,"NormalizedData" jsonb,"Status" text,"Errors" jsonb,"ResultID" int);
CREATE TABLE "StudentEnterpriseCoordination" ("CoordinationID" serial PRIMARY KEY,"OJTSemesterID" int REFERENCES "OJTSemesters");
CREATE TABLE "InternshipAssignments" ("AssignmentID" serial PRIMARY KEY,"CoordinationID" int REFERENCES "StudentEnterpriseCoordination","StudentID" int REFERENCES "Students","EnterpriseID" int REFERENCES "Enterprises","PositionID" int REFERENCES "InternshipPositions","StartDate" date,"EndDate" date,"Status" text);
CREATE TABLE "InternshipTasks" ("TaskID" serial PRIMARY KEY,"AssignmentID" int REFERENCES "InternshipAssignments","TaskName" text,"Description" text,"AssignedDate" date,"DueDate" date,"Status" text);
CREATE TABLE "InternshipEvaluations" ("EvaluationID" serial PRIMARY KEY,"AssignmentID" int UNIQUE REFERENCES "InternshipAssignments","EvaluatedBy" int REFERENCES "Users","EvaluatedAt" timestamp,"Status" text,"CompletionScore" numeric,"AttitudeScore" numeric,"SkillScore" numeric,"OverallScore" numeric CHECK("OverallScore" BETWEEN 0 AND 10),"Comments" text);
CREATE TABLE "OJTResults" ("AssignmentID" int,"Status" text);
CREATE TABLE "Notifications" ("NotificationID" serial PRIMARY KEY,"UserID" int,"Title" text,"Content" text,"Channel" text,"RelatedEntityType" text,"RelatedEntityID" int,"SentAt" timestamptz);
CREATE TABLE "OJTCompletionDeliveries" ("EvaluationID" int,"EvaluatedAt" timestamp,"UserID" int,"EmailID" bigint,PRIMARY KEY("EvaluationID","EvaluatedAt","UserID"));
CREATE TABLE "ComboReminderDeliveries" ("EmailID" bigint,"WindowID" int,"BatchID" int,"StudentID" int);
CREATE TABLE "ComboRegistrationWindows" ("WindowID" int,"Status" text);
CREATE TABLE "ComboReminderBatches" ("BatchID" int,"Summary" jsonb);
CREATE TABLE "StudentComboSelectionEvents" ("WindowID" int,"StudentID" int,"EventType" text);

-- Additional display fields used by production list-context projections.
ALTER TABLE "TrainingPrograms" ADD COLUMN "ProgramCode" text DEFAULT 'SE',ADD COLUMN "ProgramName" text DEFAULT 'Software Engineering',ADD COLUMN "Version" text DEFAULT '1',ADD COLUMN "TotalCredits" numeric DEFAULT 120,ADD COLUMN "Status" text DEFAULT 'PUBLISHED',ADD COLUMN "SpecializationID" int;
ALTER TABLE "Cohorts" ADD COLUMN "CohortCode" text DEFAULT 'KTEST',ADD COLUMN "Name" text DEFAULT 'Test Cohort';
ALTER TABLE "OJTSemesters" ADD COLUMN "Name" text DEFAULT 'OJT Term',ADD COLUMN "Status" text DEFAULT 'ACTIVE';
ALTER TABLE "AcademicYears" ADD COLUMN "YearCode" text DEFAULT 'TEST',ADD COLUMN "Status" text DEFAULT 'ACTIVE';
ALTER TABLE "Enterprises" ADD COLUMN "Industry" text DEFAULT 'IT',ADD COLUMN "ContactPhone" text;
ALTER TABLE "InternshipPositions" ADD COLUMN "Location" text DEFAULT 'HCM',ADD COLUMN "WorkMode" text DEFAULT 'ONSITE';
ALTER TABLE "Courses" ADD COLUMN "CourseName" text DEFAULT 'Programming',ADD COLUMN "Credits" numeric DEFAULT 3,ADD COLUMN "IsOJTPrerequisite" boolean DEFAULT false;
CREATE TABLE "OJTRegistrations" ("RegistrationID" serial PRIMARY KEY,"StudentID" int REFERENCES "Students","OJTSemesterID" int REFERENCES "OJTSemesters","Status" text,"RegisteredAt" timestamptz DEFAULT now());
CREATE TABLE "OJTAdvisoryRuns" ("RunID" serial PRIMARY KEY,"Kind" text,"Status" text,"CreatedBy" int REFERENCES "Users","Request" jsonb,"CreatedAt" timestamptz DEFAULT now(),"CompletedAt" timestamptz);
CREATE TABLE "OJTAdvisoryRunItems" ("RunID" int REFERENCES "OJTAdvisoryRuns","StudentID" int REFERENCES "Students","Status" text,"NotificationID" int,"ErrorCode" text,"Snapshot" jsonb);
CREATE TABLE "ProgramCombos" ("ProgramComboID" serial PRIMARY KEY,"ComboCode" text,"ComboName" text,"ProgramID" int,"SelectionGroup" text,"Note" text);
CREATE TABLE "Specializations" ("SpecializationID" serial PRIMARY KEY,"SpecializationCode" text,"SpecializationName" text,"MajorID" int);
ALTER TABLE "RecruitmentPosts" ADD COLUMN "Benefits" text,ADD COLUMN "ApplicationInstructions" text,ADD COLUMN "PublishedAt" timestamptz,ADD COLUMN "ReviewedBy" int,ADD COLUMN "ReviewedAt" timestamptz,ADD COLUMN "ReviewReason" text,ADD COLUMN "CreatedAt" timestamptz DEFAULT now(),ADD COLUMN "UpdatedAt" timestamptz DEFAULT now();
ALTER TABLE "InternshipPositions" ADD COLUMN "DeletedAt" timestamptz;
ALTER TABLE "StudentEnterpriseCoordination" ADD COLUMN "PositionID" int;
CREATE TABLE "JobApplications" ("PostID" int,"PositionID" int);

-- Candidate list contracts and linked CV metadata.
ALTER TABLE "StudentEnterpriseCoordination" ADD COLUMN "RegistrationID" int,ADD COLUMN "ApplicationID" int,ADD COLUMN "EnterpriseID" int,ADD COLUMN "CoordinatedBy" int,ADD COLUMN "CoordinatedAt" timestamptz DEFAULT now(),ADD COLUMN "Decision" text,ADD COLUMN "DecisionAt" timestamptz,ADD COLUMN "RejectReason" text;
ALTER TABLE "OJTRegistrations" ADD COLUMN "Application" jsonb DEFAULT '{}';
ALTER TABLE "JobApplications" ADD COLUMN "ApplicationID" serial PRIMARY KEY,ADD COLUMN "CVID" int,ADD COLUMN "CoverLetter" text,ADD COLUMN "AppliedAt" timestamptz DEFAULT now(),ADD COLUMN "Status" text;
CREATE TABLE "StudentCVVersions" ("CVID" serial PRIMARY KEY,"StudentID" int,"Filename" text,"MimeType" text,"SizeBytes" int,"Sha256" text,"CreatedAt" timestamptz DEFAULT now());

ALTER TABLE "Users" ADD COLUMN "CreatedAt" timestamptz DEFAULT now(),ADD COLUMN "LastLoginAt" timestamptz;

ALTER TABLE "Enterprises" ADD COLUMN "CreatedAt" timestamp DEFAULT now();
ALTER TABLE "EnterpriseUsers" ADD COLUMN "EnterpriseUserID" serial;


-- Additional isolated test schema for handoff-first registration and academic result recording.
CREATE TABLE "SchemaMigrations" ("Version" text PRIMARY KEY);
CREATE TABLE "EligibilityChecks" ("CheckID" serial PRIMARY KEY,"StudentID" int REFERENCES "Students","OJTSemesterID" int REFERENCES "OJTSemesters","Status" text,"CheckedAt" timestamptz DEFAULT now(),"Result" jsonb,UNIQUE("CheckID","StudentID","OJTSemesterID"));
CREATE TABLE "EligibilityConfirmations" ("CheckID" int PRIMARY KEY REFERENCES "EligibilityChecks","ConfirmedBy" int,"ConfirmedAt" timestamptz DEFAULT now());
CREATE TABLE "OJTRegistrationWindows" ("WindowID" serial PRIMARY KEY,"OJTSemesterID" int,"AcademicPeriodID" int,"RequiredRelativeSemester" int,"Name" text,"Scope" jsonb,"StartsAt" timestamptz,"EndsAt" timestamptz,"Status" text DEFAULT 'DRAFT',"CreatedBy" int,"CreatedAt" timestamptz DEFAULT now(),"UpdatedAt" timestamptz DEFAULT now(),"OpenedBy" int,"OpenedAt" timestamptz,"ClosedBy" int,"ClosedAt" timestamptz);
ALTER TABLE "OJTRegistrations" ADD COLUMN "WindowID" int,ADD COLUMN "ProgramID" int,ADD COLUMN "SubmittedBy" int,ADD COLUMN "UpdatedAt" timestamptz DEFAULT now(),ADD COLUMN "ReviewCheckID" int,ADD COLUMN "ReviewedBy" int,ADD COLUMN "ReviewedAt" timestamptz,ADD COLUMN "ReviewReason" text,ADD COLUMN "PathwaySnapshot" jsonb,ADD UNIQUE("RegistrationID","StudentID","OJTSemesterID"),ADD UNIQUE("StudentID","OJTSemesterID");
CREATE TABLE "EligibleStudentHandoffs" ("HandoffID" serial PRIMARY KEY,"OJTSemesterID" int NOT NULL,"IdempotencyKey" text UNIQUE,"RequestHash" text,"RegistrationIDs" jsonb,"Reason" text,"CreatedBy" int,"CreatedAt" timestamptz DEFAULT now(),"RecipientRole" text DEFAULT 'OJT_COORD',UNIQUE("HandoffID","OJTSemesterID"));
CREATE TABLE "EligibleStudentHandoffItems" ("HandoffID" int,"OJTSemesterID" int,"RegistrationID" int NOT NULL UNIQUE,"StudentID" int,"CheckID" int,"Snapshot" jsonb,PRIMARY KEY("HandoffID","StudentID"),FOREIGN KEY("HandoffID","OJTSemesterID") REFERENCES "EligibleStudentHandoffs"("HandoffID","OJTSemesterID"),FOREIGN KEY("RegistrationID","StudentID","OJTSemesterID") REFERENCES "OJTRegistrations"("RegistrationID","StudentID","OJTSemesterID"),FOREIGN KEY("CheckID","StudentID","OJTSemesterID") REFERENCES "EligibilityChecks"("CheckID","StudentID","OJTSemesterID"));
CREATE FUNCTION "GuardAcademicHandoff"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER "TR_ValidateAcademicHandoff" BEFORE INSERT ON "EligibleStudentHandoffItems" FOR EACH ROW EXECUTE FUNCTION "GuardAcademicHandoff"();
CREATE TABLE "OJTRegistrationEvents" ("EventID" serial PRIMARY KEY,"RegistrationID" int,"Action" text,"Snapshot" jsonb,"CreatedBy" int,"CreatedAt" timestamptz DEFAULT now(),"Reason" text,"IdempotencyKey" text,"RequestHash" text,UNIQUE("RegistrationID","IdempotencyKey"));
CREATE TABLE "StudentCVFiles" ("CVFileID" serial PRIMARY KEY,"StudentID" int,"FileName" text,"MimeType" text,"Content" bytea,"Sha256" text,"UploadedAt" timestamptz DEFAULT now());
ALTER TABLE "OJTResults" ADD COLUMN "ResultID" serial PRIMARY KEY,ADD COLUMN "StudentID" int,ADD COLUMN "OJTSemesterID" int,ADD COLUMN "Version" int DEFAULT 1,ADD COLUMN "Dossier" jsonb,ADD COLUMN "SourceSnapshot" jsonb,ADD COLUMN "SourceHash" text,ADD COLUMN "OfficialScore" numeric,ADD COLUMN "Outcome" text,ADD COLUMN "AcademicNote" text,ADD COLUMN "TransferredBy" int,ADD COLUMN "TransferredAt" timestamptz DEFAULT now(),ADD COLUMN "UpdatedAt" timestamptz DEFAULT now(),ADD COLUMN "ConfirmedBy" int,ADD COLUMN "ConfirmedAt" timestamptz,ADD COLUMN "ConfirmationReason" text,ADD COLUMN "CourseResultID" int UNIQUE,ADD COLUMN "GradeMappingID" int,ADD COLUMN "GradeMappingSnapshot" jsonb,ALTER COLUMN "Status" SET DEFAULT 'PENDING_ACADEMIC_CONFIRMATION',ADD UNIQUE("AssignmentID");
CREATE TABLE "OJTResultEvents" ("EventID" serial PRIMARY KEY,"ResultID" int,"Version" int,"Action" text,"Snapshot" jsonb,"Reason" text,"CreatedBy" int,"CreatedAt" timestamptz DEFAULT now(),"IdempotencyKey" text UNIQUE,"RequestHash" text,UNIQUE("ResultID","Version"));
CREATE TABLE "ProgramOJTGradeMappings" ("MappingID" serial PRIMARY KEY,"ProgramID" int,"OJTSemesterID" int,"CourseID" int,"AcademicPeriodID" int,"GradeBands" jsonb,UNIQUE("ProgramID","OJTSemesterID"));
ALTER TABLE "StudentCourseResults" ADD COLUMN "OJTResultID" int UNIQUE;

CREATE OR REPLACE FUNCTION "GuardOJTResult"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD."Status"='CONFIRMED' THEN
  RAISE EXCEPTION 'Confirmed OJT result is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF TG_OP='INSERT' AND (NEW."Status"<>'PENDING_ACADEMIC_CONFIRMATION' OR NEW."Version"<>1) THEN
  RAISE EXCEPTION 'New OJT result must start pending at version 1' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF (NEW."AssignmentID",NEW."StudentID",NEW."OJTSemesterID") IS DISTINCT FROM
   (OLD."AssignmentID",OLD."StudentID",OLD."OJTSemesterID") OR NEW."Version"<>OLD."Version"+1 THEN
   RAISE EXCEPTION 'OJT context is immutable and version must advance' USING ERRCODE='23514'; END IF;
  IF OLD."Status"='REVISION_REQUESTED' AND NEW."Status"<>'PENDING_ACADEMIC_CONFIRMATION' THEN
   RAISE EXCEPTION 'Revised OJT result must return to pending' USING ERRCODE='23514'; END IF;
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM "InternshipAssignments" a
  JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
  JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
  WHERE a."AssignmentID"=NEW."AssignmentID" AND a."StudentID"=NEW."StudentID"
   AND r."StudentID"=NEW."StudentID" AND r."OJTSemesterID"=NEW."OJTSemesterID"
   AND co."OJTSemesterID"=NEW."OJTSemesterID" AND p."OJTSemesterID"=NEW."OJTSemesterID"
   AND co."EnterpriseID"=a."EnterpriseID" AND p."EnterpriseID"=a."EnterpriseID" AND co."PositionID"=a."PositionID"
 ) THEN RAISE EXCEPTION 'Invalid OJT result assignment context' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION "GuardOfficialOJTGrade"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' AND OLD."OJTResultID" IS NOT NULL THEN
  RAISE EXCEPTION 'Official synchronized OJT grade is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW."OJTResultID" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "OJTResults" r WHERE r."ResultID"=NEW."OJTResultID"
  AND r."StudentID"=NEW."StudentID" AND r."OfficialScore"=NEW."Score" AND r."Outcome"=NEW."Status") THEN
  RAISE EXCEPTION 'Official grade does not match OJT result' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION "GuardOJTGradeLink"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."Status"='CONFIRMED' AND (NEW."GradeMappingID" IS NULL OR NEW."GradeMappingSnapshot" IS NULL OR NOT EXISTS (
  SELECT 1 FROM "StudentCourseResults" g JOIN "ProgramOJTGradeMappings" m ON m."MappingID"=NEW."GradeMappingID"
  WHERE g."ResultID"=NEW."CourseResultID" AND g."OJTResultID"=NEW."ResultID" AND g."StudentID"=NEW."StudentID"
   AND g."CourseID"=m."CourseID" AND g."AcademicPeriodID"=m."AcademicPeriodID" AND m."OJTSemesterID"=NEW."OJTSemesterID"
   AND g."Status"=NEW."Outcome" AND g."Score"=NEW."OfficialScore"
 )) THEN RAISE EXCEPTION 'Confirmation requires synchronized official course grade and mapping' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER "TR_GuardOJTResult" BEFORE INSERT OR UPDATE OR DELETE ON "OJTResults" FOR EACH ROW EXECUTE FUNCTION "GuardOJTResult"();
CREATE TRIGGER "TR_OfficialOJTGrade" BEFORE INSERT OR UPDATE OR DELETE ON "StudentCourseResults" FOR EACH ROW EXECUTE FUNCTION "GuardOfficialOJTGrade"();
CREATE TRIGGER "TR_OJTGradeLink" BEFORE UPDATE OF "Status","CourseResultID","GradeMappingID" ON "OJTResults" FOR EACH ROW EXECUTE FUNCTION "GuardOJTGradeLink"();

ALTER TABLE "InternshipAssignments" ADD COLUMN "EnterpriseSupervisorName" text,ADD COLUMN "AcademicSupervisorID" int;

ALTER TABLE "StudentEnterpriseCoordination" ADD COLUMN "PreviousCoordinationID" int;
ALTER TABLE "JobApplications" ADD COLUMN "RegistrationID" int;
