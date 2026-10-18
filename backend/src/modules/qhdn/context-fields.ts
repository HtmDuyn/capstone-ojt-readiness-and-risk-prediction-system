// Explicit projections prevent account credentials and unrelated records entering FE responses.
export const staffContextFields=`
  s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."StudentID" AS "studentId",r."OJTSemesterID" AS "ojtSemesterId",
  e."EnterpriseID" AS "companyId",e."Name" AS "companyName",pos."PositionID" AS "positionId",pos."Title" AS "positionTitle",
  jsonb_build_object('id',s."StudentID",'studentCode',s."StudentCode",'fullName',u."FullName",'email',u."Email",'phone',u."Phone") AS student,
  jsonb_build_object('id',e."EnterpriseID",'code',e."EnterpriseCode",'name',e."Name",'contactEmail',e."ContactEmail",'contactPhone',e."ContactPhone") AS company,
  jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title",'description',pos."Description",'requirements',pos."Requirements",'location',pos."Location",'workMode',pos."WorkMode",'ojtSemesterId',pos."OJTSemesterID") AS position`;
export const templateField=`CASE WHEN tmpl."TemplateID" IS NULL THEN NULL ELSE jsonb_build_object('id',tmpl."TemplateID",'code',tmpl."Code",'name',tmpl."Name",'version',tmpl."Version",'criteria',tmpl."Criteria",'status',tmpl."Status") END AS template`;
export const registrationField=`jsonb_build_object('id',r."RegistrationID",'studentId',r."StudentID",'ojtSemesterId',r."OJTSemesterID",'programId',r."ProgramID",'status',r."Status",'application',r."Application",'registeredAt',r."RegisteredAt") AS registration`;
export const assignmentField=`jsonb_build_object('id',a."AssignmentID",'coordinationId',a."CoordinationID",'studentId',a."StudentID",'companyId',a."EnterpriseID",'positionId',a."PositionID",'startDate',a."StartDate",'endDate',a."EndDate",'status',a."Status",'enterpriseSupervisorName',a."EnterpriseSupervisorName",'academicSupervisorId',a."AcademicSupervisorID",
  'academicSupervisor',(SELECT jsonb_build_object('id',school."UserID",'fullName',school."FullName",'email',school."Email",'phone',school."Phone") FROM "Users" school WHERE school."UserID"=a."AcademicSupervisorID"),
  'result',(SELECT jsonb_build_object('id',outcome."ResultID",'status',outcome."Status",'version',outcome."Version",'officialScore',outcome."OfficialScore",'outcome',outcome."Outcome",'confirmedAt',outcome."ConfirmedAt") FROM "OJTResults" outcome WHERE outcome."AssignmentID"=a."AssignmentID")) AS assignment`;
