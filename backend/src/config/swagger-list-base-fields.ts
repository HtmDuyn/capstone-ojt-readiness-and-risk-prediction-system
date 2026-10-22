type Schema = Record<string, any>;
const id={type:'integer',minimum:1},text={type:'string'},date={type:'string',format:'date'},time={type:'string',format:'date-time'};
const strings=(names:string)=>Object.fromEntries(names.split(' ').map(name=>[name,{...text,nullable:true}]));
const ids=(names:string)=>Object.fromEntries(names.split(' ').map(name=>[name,{...id,nullable:true}]));
const numbers=(names:string)=>Object.fromEntries(names.split(' ').map(name=>[name,{type:'number',nullable:true}]));
const objects=(names:string)=>Object.fromEntries(names.split(' ').map(name=>[name,{type:'object',nullable:true,additionalProperties:true}]));
const array=(items:Schema):Schema=>({type:'array',items});
const objectArray=array({type:'object',additionalProperties:true});
// Base fields projected by the serializers/SQL. Display relations are merged separately.
const base:Record<string,Schema>={
 '/api/academic-years':{id,yearCode:text,startDate:date,endDate:date,status:text},
 '/api/academic-periods':{id,...ids('academicYearId parentPeriodId ojtSemesterId'),...strings('periodCode name kind status'),startDate:date,endDate:date,...objects('ojt')},
 '/api/cohorts':{id,...strings('cohortCode name status'),enrollmentYear:{type:'integer'},groups:array({type:'object',properties:{groupCode:text,entryAcademicPeriodId:id}})},
 '/api/majors':{id,...strings('code name parentMajorCode parentMajorName'),parentMajorId:id},
 '/api/courses':{id,code:text,name:text,defaultCredits:{type:'number'},isOjtPrerequisite:{type:'boolean'}},
 '/api/curricula':{id,...strings('code name version majorName majorCode status retakePolicy'),...ids('majorId createdBy publishedBy'),...numbers('totalCredits effectiveYear gpaScale'),prerequisitesReviewed:{type:'boolean'},equivalencesReviewed:{type:'boolean'},createdAt:time,updatedAt:time,publishedAt:{...time,nullable:true}},
 '/api/ojt-rule-sets':{id,...ids('programId ojtSemesterId createdBy publishedBy'),...strings('name version debtBasis status'),...numbers('minCredits maxUnpassedCourses'),active:{type:'boolean'},createdAt:time,publishedAt:{...time,nullable:true}},
 '/api/combo-registration-windows/{id}/selections':{...ids('studentId programId userId eventId comboId'),...strings('studentCode fullName email outcome studentStatus accountStatus'),courseIds:array(id),...objects('choiceSnapshot'),effectiveEndsAt:time,submittedAt:{...time,nullable:true}},
 '/api/students/{id}/combo-selections':{id,...ids('windowId initialWindowId createdBy sourceEventId'),...strings('phase type reason'),...objects('choice previous progress eligibility'),createdAt:time},
 '/api/students/{id}/course-results':{id,...ids('studentId courseId academicPeriodId academicYearId recordedBy ojtResultId'),...strings('courseCode courseName periodCode periodKind status grade sourceReference'),...numbers('score gradePoints semesterTaken attemptNumber'),periodStartDate:date,createdAt:time,updatedAt:time},
 '/api/academic/alerts':{...ids('studentId programId cohortId majorId officialCheckId'),...strings('studentCode fullName groupCode category'),comboIds:array(id),officialStale:{type:'boolean'},...objects('evaluation'),missingRequiredCourses:objectArray,alternativeRequirements:objectArray,dataIssues:array(text),alertTypes:array(text)},
 '/api/academic/course-demand':{courseId:id,courseCode:text,courseName:text,academicPeriodId:id,periodCode:text,periodKind:text,...numbers('studentCount retakeCount inProgressCount')},
 '/api/recruitment/posts':{id,...ids('ojtSemesterId windowId academicPeriodId companyId'),...strings('periodCode companyName title content benefits applicationInstructions status reviewReason'),deadlineAt:{...time,nullable:true},publishedAt:{...time,nullable:true},reviewedAt:{...time,nullable:true},positions:objectArray,createdAt:time,updatedAt:time},
 '/api/student/ojt-registration-windows':{id,...ids('ojtSemesterId academicPeriodId requiredRelativeSemester registrationId'),...strings('name status registrationStatus'),...objects('period'),startsAt:time,endsAt:time,canRegister:{type:'boolean'},blockReasons:array(text)},
 '/api/student/combo-registration-windows':{id,...ids('ojtSemesterId academicPeriodId initialWindowId'),...strings('name phase status'),...objects('period'),startsAt:time,endsAt:time,effectiveEndsAt:time,canSelect:{type:'boolean'},choices:objectArray},
 '/api/students/me/opportunities':{id,ojtSemesterId:id,...strings('code title description requirements location workMode'),...numbers('capacity remainingSlots'),...objects('company post'),applicationId:{...id,nullable:true},canApply:{type:'boolean'},blockers:array(text)},
 '/api/qhdn/reports':{ojtSemesterId:id,semesterCode:text,companyId:id,companyName:text,...numbers('currentStudents pending accepted rejected acceptanceRate coordinationAttempts pendingAttempts acceptedAttempts rejectedAttempts totalAssignments assigned active completed failed cancelled assignedStudents totalResults pendingResults revisionRequestedResults confirmedResults passedResults failedResults averageOfficialScore eligibleAssignments evaluationCount missingEvaluations evaluationCoverageRate averageCompletionScore averageAttitudeScore averageSkillScore averageOverallScore commentsCount enterpriseSubmittedCount staffEnteredCount'),lastEvaluatedAt:{...time,nullable:true}},
};

export function describeListBaseFields(spec:Schema) {
 const rootLists=new Set(['/api/academic-years','/api/academic-periods','/api/cohorts']);
 for(const [path,properties]of Object.entries(base)){
  const op=spec.paths[path]?.get;if(!op)throw Error('Missing base list: '+path);
  op.responses??={};op.responses['200']??={description:'Danh sách'};
  const response=op.responses['200'];response.content??={};response.content['application/json']??={};
  const media=response.content['application/json'];media.schema??={type:'object',properties:{success:{type:'boolean'}}};
  const root=media.schema;root.properties??={};
  const page=rootLists.has(path)?root:(root.properties.data??={type:'object',properties:{}});page.properties??={};
  const list=page.properties.items??={type:'array',items:{type:'object',properties:{}}};list.items.properties??={};
  list.items.properties={...structuredClone(properties),...list.items.properties};
 }
 const post=spec.paths['/api/recruitment/posts'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items;
 post.properties.positions={type:'array',items:{type:'object',properties:{id,code:{type:'string'},title:{type:'string'},description:{type:'string'},requirements:{type:'string'},capacity:{type:'integer'},remainingSlots:{type:'integer',minimum:0},status:{type:'string'},location:{type:'string',nullable:true},workMode:{type:'string',nullable:true}}}};
 const candidate=spec.paths['/api/enterprise/candidates'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items;
 candidate.properties.recruitmentPost={...structuredClone(post),nullable:true};
}
