type Row = Record<string, any>;
type Client = { query: (sql:string, args?:any[])=>Promise<{rows:Row[]}> };

// Read only the IDs on an already authorized page. Never enumerate related tables,
// read credentials/file bytes, or calculate a new eligibility decision here.
const entities = {
  student: `SELECT s."StudentID" AS id,s."StudentCode" AS code,s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,u."Phone" AS phone,s."Status" AS status,s."ProgramID" AS "programId",p."ProgramCode" AS "programCode",p."ProgramName" AS "programName",place."CohortID" AS "cohortId",cohort."Name" AS "cohortName",place."GroupCode" AS "groupCode" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "TrainingPrograms" p ON p."ProgramID"=s."ProgramID" LEFT JOIN "StudentAcademicPlacements" place ON place."StudentID"=s."StudentID" LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=place."CohortID" WHERE s."StudentID"=ANY($1::int[])`,
  // Some deployed curricula have no Version/Status columns; optional metadata stays null.
  program: `SELECT "ProgramID" AS id,"ProgramCode" AS code,"ProgramName" AS name,to_jsonb(p)->>'Version' AS version,"TotalCredits"::float8 AS "totalCredits",to_jsonb(p)->>'Status' AS status FROM "TrainingPrograms" p WHERE "ProgramID"=ANY($1::int[])`,
  cohort: `SELECT "CohortID" AS id,"CohortCode" AS code,"Name" AS name,"EnrollmentYear" AS "enrollmentYear","Status" AS status FROM "Cohorts" WHERE "CohortID"=ANY($1::int[])`,
  semester: `SELECT o."OJTSemesterID" AS id,o."SemesterCode" AS code,o."Name" AS name,o."AcademicPeriodID" AS "academicPeriodId",o."AcademicYearID" AS "academicYearId",o."StartDate" AS "startDate",o."EndDate" AS "endDate",o."Status" AS status,CASE WHEN p."AcademicPeriodID" IS NULL THEN NULL ELSE jsonb_build_object('id',p."AcademicPeriodID",'code',p."PeriodCode",'name',p."Name",'kind',p."Kind",'startDate',p."StartDate",'endDate',p."EndDate",'status',p."Status") END AS "academicPeriod" FROM "OJTSemesters" o LEFT JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=o."AcademicPeriodID" WHERE o."OJTSemesterID"=ANY($1::int[])`,
  academicPeriod: `SELECT "AcademicPeriodID" AS id,"PeriodCode" AS code,"Name" AS name,"Kind" AS kind,"AcademicYearID" AS "academicYearId","ParentPeriodID" AS "parentPeriodId","StartDate" AS "startDate","EndDate" AS "endDate","Status" AS status FROM "AcademicPeriods" WHERE "AcademicPeriodID"=ANY($1::int[])`,
  academicYear: `SELECT "AcademicYearID" AS id,"YearCode" AS code,"StartDate" AS "startDate","EndDate" AS "endDate","Status" AS status FROM "AcademicYears" WHERE "AcademicYearID"=ANY($1::int[])`,
  parentMajor: `SELECT "MajorID" AS id,"MajorCode" AS code,"MajorName" AS name FROM "AcademicMajors" WHERE "MajorID"=ANY($1::int[])`,
  company: `SELECT "EnterpriseID" AS id,"EnterpriseCode" AS code,"Name" AS name,"Address" AS address,"Industry" AS industry,"ContactPersonName" AS "contactPersonName","ContactEmail" AS "contactEmail","ContactPhone" AS "contactPhone","Status" AS status FROM "Enterprises" WHERE "EnterpriseID"=ANY($1::int[])`,
  position: `SELECT p."PositionID" AS id,p."RecruitmentCode" AS code,p."Title" AS title,p."Description" AS description,p."Requirements" AS requirements,p."Location" AS location,p."WorkMode" AS "workMode",p."EnterpriseID" AS "companyId",p."OJTSemesterID" AS "ojtSemesterId",p."Capacity" AS capacity,p."Status" AS status,GREATEST(0,p."Capacity"-(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED'))) AS "remainingSlots" FROM "InternshipPositions" p WHERE p."PositionID"=ANY($1::int[])`,
  model: `SELECT "ModelID" AS id,"Code" AS code,"Version" AS version,"Name" AS name,"Status" AS status FROM "PredictionModels" WHERE "ModelID"=ANY($1::int[])`,
  ruleSet: `SELECT "RuleSetID" AS id,"Name" AS name,"Version" AS version,"ProgramID" AS "programId","OJTSemesterID" AS "ojtSemesterId","MinCredits"::float8 AS "minCredits","MaxUnpassedCourses" AS "maxUnpassedCourses","Status" AS status FROM "OJTRuleSets" WHERE "RuleSetID"=ANY($1::int[])`,
  course: `SELECT "CourseID" AS id,"CourseCode" AS code,"CourseName" AS name,"Credits"::float8 AS credits,"IsOJTPrerequisite" AS "isOjtPrerequisite" FROM "Courses" WHERE "CourseID"=ANY($1::int[])`,
  combo: `SELECT "ProgramComboID" AS id,"ComboCode" AS code,"ComboName" AS name,"ProgramID" AS "programId","SelectionGroup" AS "selectionGroup","Note" AS note FROM "ProgramCombos" WHERE "ProgramComboID"=ANY($1::int[])`,
  major: `SELECT "SpecializationID" AS id,"SpecializationCode" AS code,"SpecializationName" AS name,"MajorID" AS "parentMajorId" FROM "Specializations" WHERE "SpecializationID"=ANY($1::int[])`,
  registration: `SELECT r."RegistrationID" AS id,r."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."OJTSemesterID" AS "ojtSemesterId",o."SemesterCode" AS "semesterCode",r."Status" AS status,r."RegisteredAt" AS "registeredAt" FROM "OJTRegistrations" r JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" JOIN "OJTSemesters" o ON o."OJTSemesterID"=r."OJTSemesterID" WHERE r."RegistrationID"=ANY($1::int[])`,
  user: `SELECT "UserID" AS id,"FullName" AS "fullName" FROM "Users" WHERE "UserID"=ANY($1::int[])`,
};

const references: [string, keyof typeof entities, string][] = [
  ['studentId','student','student'],['programId','program','program'],['currentProgramId','program','currentProgram'],
  ['cohortId','cohort','cohort'],['ojtSemesterId','semester','semester'],['academicPeriodId','academicPeriod','academicPeriod'],
  ['parentPeriodId','academicPeriod','parentPeriod'],
  ['blockPeriodId','academicPeriod','blockPeriod'],['assessmentAcademicPeriodId','academicPeriod','assessmentAcademicPeriod'],
  ['parentMajorId','parentMajor','parentMajor'],
  ['academicYearId','academicYear','academicYear'],['companyId','company','company'],['enterpriseId','company','company'],
  ['positionId','position','position'],['modelId','model','model'],['ruleSetId','ruleSet','ruleSet'],
  ['courseId','course','course'],['sourceCourseId','course','sourceCourse'],['targetCourseId','course','targetCourse'],
  ['comboId','combo','combo'],['programComboId','combo','combo'],['majorId','major','major'],
  ['entryAcademicPeriodId','academicPeriod','entryAcademicPeriod'],['currentAcademicPeriodId','academicPeriod','currentAcademicPeriod'],
  ...['userId','createdBy','updatedBy','submittedBy','reviewedBy','confirmedBy','configuredBy','resultsFinalizedBy','checkedBy','assignedTo','acknowledgedBy','closedBy','openedBy','publishedBy','coordinatedBy','evaluatedBy','transferredBy','importedBy','recordedBy'].map(key=>[key,'user',key==='userId'?'user':key+'User'] as [string,'user',string]),
];
// Only explicitly named relation arrays are expanded. Never inspect arbitrary snapshots or audit payloads.
const arrayReferences: [string, keyof typeof entities, string][] = [
  ['registrationIds','registration','registrations'],['courseIds','course','courses'],['choices','course','courseChoices'],['comboIds','combo','combos'],
];

async function enrichRows<T extends Row>(client:Client,rows:T[]):Promise<T[]> {
  if(!rows.length)return rows;
  const maps=new Map<string,Map<number,Row>>();
  const columns:string[]=[],args:number[][]=[];
  for(const entity of Object.keys(entities) as (keyof typeof entities)[]) {
    const keys=references.filter(([,type])=>type===entity).map(([key])=>key);
    const arrays=arrayReferences.filter(([,type])=>type===entity).map(([key])=>key);
    const ids=[...new Set(rows.flatMap(row=>[
      ...keys.map(key=>row[key]),
      ...arrays.flatMap(key=>Array.isArray(row[key])?row[key]:[]),
    ]).filter(value=>Number.isSafeInteger(value)&&value>0))];
    if(!ids.length)continue;
    args.push(ids);
    const sql=entities[entity].replace(/\$1\b/g,()=>'$'+args.length);
    columns.push(`(SELECT COALESCE(jsonb_agg(to_jsonb(context)),'[]'::jsonb) FROM (${sql}) context) AS "${entity}"`);
  }
  if(columns.length){
    const contexts=(await client.query('SELECT '+columns.join(','),args)).rows[0];
    for(const [entity,related]of Object.entries(contexts) as [string,Row[]][])maps.set(entity,new Map(related.map(row=>[row.id,row])));
  }
  return rows.map(row=>{
    const item:Row={...row};
    for(const [key,type,target]of references) {
      if(row[key]===undefined)continue;
      if(row[key]===null){if(item[target]===undefined)item[target]=null;continue;}
      const context=maps.get(type)?.get(row[key]);
      if(context)item[target]={...context,...(item[target]&&typeof item[target]==='object'?item[target]:{})};
      else if(item[target]===undefined)item[target]=null;
    }
    for(const [key,type,target] of arrayReferences) {
      if(!Array.isArray(row[key])||!row[key].every((value:unknown)=>Number.isSafeInteger(value)&&Number(value)>0))continue;
      if(item[target]!==undefined)continue;
      // Keep source IDs, their ordering and cardinality; missing references are explicit nulls.
      item[target]=row[key].map((value:number)=>maps.get(type)?.get(value)??null);
    }
    for(const [target,key,value]of [['program','programCode','code'],['program','programName','name'],['cohort','cohortName','name'],['student','studentCode','studentCode'],['student','fullName','fullName'],['company','companyName','name'],['position','positionTitle','title'],['semester','semesterCode','code']] as const) {
      if(item[key]===undefined&&item[target])item[key]=item[target][value];
    }
    return item as T;
  });
}

// Expand only known business relations, never arbitrary snapshots, audit data or file payloads.
export async function enrichListRows<T extends Row>(client:Client,rows:T[]):Promise<T[]> {
  const nested = new Set(['groups','periods','comboPhaseSchedules','advisorySchedule','prerequisites','equivalences','missingRequiredCourses','alternativeRequirements','unpassedCourses','students','requirements','evaluation','confirmation','current']);
  const nodes:Row[]=[];
  const copy=(row:Row):Row=>{
    const value={...row};nodes.push(value);
    for(const key of nested){
      if(Array.isArray(row[key]))value[key]=row[key].map((item:any)=>item&&typeof item==='object'&&!Array.isArray(item)?copy(item):item);
      else if(row[key]&&typeof row[key]==='object')value[key]=copy(row[key]);
    }
    return value;
  };
  const output=rows.map(copy);
  const enriched=await enrichRows(client,nodes);
  nodes.forEach((node,index)=>Object.assign(node,enriched[index]));
  return output as T[];
}
