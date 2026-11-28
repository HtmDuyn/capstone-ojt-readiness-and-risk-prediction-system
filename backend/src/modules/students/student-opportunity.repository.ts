// A published vacancy can be browsed before a student is assigned an OJT round.
// Semester/round selectors narrow that catalog; application permissions are
// calculated separately and are always checked again by applyToPosition.
export const studentOpportunitySql = `SELECT
  p."PositionID" AS id,p."OJTSemesterID" AS "ojtSemesterId",post."PostID" AS "postId",
  p."RecruitmentCode" AS code,p."Title" AS title,p."Description" AS description,
  p."Requirements" AS requirements,p."Location" AS location,p."WorkMode" AS "workMode",p."Capacity" AS capacity,
  GREATEST(0,p."Capacity"-public."RecruitmentOccupiedSlots"(p."PositionID")) AS "remainingSlots",
  jsonb_build_object('id',e."EnterpriseID",'name',e."Name",'address',e."Address",
    'industry',e."Industry",'contactPersonName',e."ContactPersonName",
    'contactEmail',e."ContactEmail",'contactPhone',e."ContactPhone") AS company,
  jsonb_build_object('id',post."PostID",'windowId',post."WindowID",'title',post."Title",'deadlineAt',post."DeadlineAt",
    'content',post."Content",'benefits',post."Benefits",'applicationInstructions',post."ApplicationInstructions") AS post,
  (SELECT app."ApplicationID" FROM "JobApplications" app
    JOIN "OJTRegistrations" reg ON reg."RegistrationID"=app."RegistrationID"
    WHERE reg."StudentID"=$2 AND app."PostID"=post."PostID" AND app."PositionID"=p."PositionID"
    ORDER BY app."ApplicationID" DESC LIMIT 1) AS "applicationId"
  FROM "InternshipPositions" p
  JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
  JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID"
  JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID"
  WHERE ($1::int IS NULL OR p."OJTSemesterID"=$1)
    AND ($3::int IS NULL OR post."WindowID"=$3)
    AND p."OJTSemesterID"=post."OJTSemesterID" AND e."EnterpriseID"=post."EnterpriseID"
    AND p."Status"='OPEN' AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL
    AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL
    AND post."Status"='PUBLISHED' AND post."ArchivedAt" IS NULL
    AND (post."DeadlineAt" IS NULL OR post."DeadlineAt">clock_timestamp())
    AND NOT EXISTS(SELECT 1 FROM "RecruitmentWindows" rw
      WHERE rw."WindowID"=post."WindowID" AND rw."CampaignID" IS NOT NULL
      AND (rw."Status"<>'OPEN' OR clock_timestamp()<rw."StartsAt" OR clock_timestamp()>=rw."EndsAt"))`;
