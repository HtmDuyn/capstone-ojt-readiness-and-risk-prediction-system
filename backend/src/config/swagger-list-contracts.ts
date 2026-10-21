type Schema=Record<string,any>;
const id={type:'integer',minimum:1},text={type:'string'},time={type:'string',format:'date-time'},date={type:'string',format:'date'};
const obj=(properties:Schema):Schema=>({type:'object',nullable:true,properties});
const user=obj({id,fullName:text});
const program=obj({id,code:text,name:text,version:text,totalCredits:{type:'number'},status:text});
const period=obj({id,code:text,name:text,kind:text,startDate:date,endDate:date,status:text});
const course=obj({id,code:text,name:text,credits:{type:'number'},isOjtPrerequisite:{type:'boolean'}});
const registration=obj({id,studentId:id,studentCode:text,fullName:text,ojtSemesterId:id,semesterCode:text,status:text,registeredAt:time});
const combo=obj({id,code:text,name:text,programId:id,selectionGroup:text,note:{...text,nullable:true}});
const contexts:Schema={
 student:obj({id,studentCode:text,fullName:text,email:text,phone:text,status:text,programId:id,programCode:text,programName:text,cohortId:id,cohortName:text,groupCode:text}),
 program,currentProgram:program,cohort:obj({id,code:text,name:text,enrollmentYear:{type:'integer'},status:text}),
 semester:obj({id,code:text,name:text,academicPeriodId:id,academicYearId:id,startDate:date,endDate:date,status:text,academicPeriod:period}),
 academicPeriod:period,academicYear:obj({id,code:text,startDate:date,endDate:date,status:text}),
 entryAcademicPeriod:period,currentAcademicPeriod:period,course,sourceCourse:course,targetCourse:course,
 courses:{type:'array',items:course},courseChoices:{type:'array',items:course},registrations:{type:'array',items:registration},
 combo,combos:{type:'array',items:combo},major:obj({id,code:text,name:text,parentMajorId:id}),
 company:obj({id,code:text,name:text,address:text,industry:text,contactPersonName:text,contactEmail:text,contactPhone:text,status:text}),
 position:obj({id,code:text,title:text,description:text,requirements:text,location:text,workMode:text,companyId:id,ojtSemesterId:id,capacity:{type:'integer'},remainingSlots:{type:'integer',minimum:0},status:text}),
 model:obj({id,code:text,name:text,version:text,status:text}),ruleSet:obj({id,name:text,version:text,programId:id,ojtSemesterId:id,minCredits:{type:'number'},maxUnpassedCourses:{type:'integer'},status:text}),
};
for(const key of ['user','createdByUser','updatedByUser','submittedByUser','reviewedByUser','confirmedByUser','checkedByUser','assignedToUser','closedByUser','openedByUser','publishedByUser','coordinatedByUser','evaluatedByUser','transferredByUser','importedByUser','recordedByUser'])contexts[key]=user;

export function describeListDisplayFields(item:Schema,keys:string[]) {
 item.properties??={};
 for(const key of keys)if(contexts[key]){
  const value={...structuredClone(contexts[key]),...item.properties[key]};
  if(contexts[key].properties)value.properties={...structuredClone(contexts[key].properties),...item.properties[key]?.properties};
  item.properties[key]=value;
 }
}

// Optional display context is additive; keep every existing field and envelope.
const listContexts:Record<string,string[]>={
 '/api/academic-years':[], '/api/academic-periods':['academicYear','semester'], '/api/cohorts':[],
 '/api/academic/alerts':['student','program','cohort'], '/api/accounts':['student','company'],
 '/api/combo-registration-windows':['semester','academicPeriod','createdByUser'],
 '/api/combo-registration-windows/{id}/selections':['student','program','user','combo','courses'],
 '/api/students/{id}/combo-selections':['createdByUser'], '/api/curricula':['createdByUser','publishedByUser'],
 '/api/ojt-rule-sets':['program','semester','createdByUser','publishedByUser'],
 '/api/students/{id}/eligibility-checks':['student','semester','ruleSet','checkedByUser'],
 '/api/eligibility-check-runs/{id}':['student','program','ruleSet'],
 '/api/ojt-registration-windows':['semester','academicPeriod','createdByUser'],
 '/api/ojt-registrations':['student','program','currentProgram','cohort','semester','submittedByUser'],
 '/api/ojt-semesters/{id}/eligible-student-handoffs':['semester','createdByUser'],
 '/api/ojt-semesters/{id}/students':['student','program','cohort','semester','company','position'],
 '/api/ojt-results':['student','program','company','position','semester','transferredByUser','confirmedByUser'],
 '/api/positions':['company','semester'], '/api/ojt-coordinations':['student','company','position','semester','coordinatedByUser'],
 '/api/assignments':['student','company','position','semester'], '/api/internship-evaluations':['student','company','position','semester','evaluatedByUser'],
 '/api/qhdn/registered-students':['student','program','cohort'], '/api/academic-imports':['importedByUser'],
 '/api/admin/prediction-jobs/{id}':['student'], '/api/predictions':['student','semester','model'],
 '/api/alerts':['student','semester','updatedByUser'], '/api/students/{id}/interventions':['student','assignedToUser','createdByUser'],
 '/api/admin/reports/readiness':['student','semester','model'], '/api/admin/audit-logs':['user'],
 '/api/enterprise/candidates':['student','company','position','semester'], '/api/enterprise/internships':['student','company','position','semester'],
 '/api/recruitment/posts':['company','semester','academicPeriod'],
 '/api/job-applications':['student','company','position','semester'],
};

export function describeListResponses(spec:Schema):void {
 const rootLists=new Set(['/api/academic-years','/api/academic-periods','/api/cohorts']);
 for(const [path,keys]of Object.entries(listContexts)){
  const operation=spec.paths[path]?.get;if(!operation)throw Error('Missing list operation: '+path);
  operation.responses??={};operation.responses['200']??={description:'Danh sách'};
  const response=operation.responses['200'];response.content??={};response.content['application/json']??={};
  const media=response.content['application/json'];
  media.schema??={type:'object',properties:{success:{type:'boolean'}}};
  const root=media.schema;root.properties??={};
  let page:Schema,item:Schema;
  if(path==='/api/accounts'){
   root.properties.data??={type:'array',items:{type:'object',properties:{}}};item=root.properties.data.items;
  }else{
   page=rootLists.has(path)?root:(root.properties.data??={type:'object',properties:{}});
   page.properties??={};page.properties.items??={type:'array',items:{type:'object',properties:{}}};
   Object.assign(page.properties,{total:{type:'integer',minimum:0},page:{type:'integer',minimum:1},limit:{type:'integer',minimum:1}});
   item=page.properties.items.items;
  }
  item.properties??={};
  describeListDisplayFields(item,keys);
 }
 const roster=spec.paths['/api/ojt-semesters/{id}/students'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties;
 Object.assign(roster,{
  studentId:id,studentCode:text,fullName:text,email:text,phone:text,programId:id,programCode:text,programName:text,cohortId:id,cohortName:text,groupCode:text,
  ojtSemesterId:id,registrationId:{...id,nullable:true},handoffId:{...id,nullable:true},coordinationId:{...id,nullable:true},enterpriseId:{...id,nullable:true},positionId:{...id,nullable:true},assignmentId:{...id,nullable:true},registrationStatus:text,ojtStatus:text,enterpriseDecision:{...text,nullable:true},assignmentStatus:{...text,nullable:true},
  cv:obj({id,studentId:id,fileName:text,mimeType:text,size:{type:'integer'},sha256:text,uploadedAt:time}),
  registration:obj({id,status:text,registeredAt:time,programId:id,application:{type:'object',additionalProperties:true}}),
  window:obj({id,name:text,academicPeriodId:id,status:text,startsAt:time,endsAt:time}),
  handoff:obj({id,createdAt:time,createdBy:id,reason:text,createdByUser:user}),
  officialEligibility:obj({checkId:id,status:text,checkedAt:time,confirmedAt:time,confirmedBy:id,result:{type:'object',additionalProperties:true},validity:{type:'string',enum:['NOT_RECHECKED']}}),
  eligibilityValidity:{type:'string',nullable:true,enum:['NOT_RECHECKED',null],description:'Danh sách hiển thị kết quả đã xác nhận; chưa xét lại hiệu lực. API thao tác kiểm tra lại trước khi ghi.'},
  coordination:obj({id,applicationId:{...id,nullable:true},decision:text,decisionAt:time,rejectReason:text,coordinatedAt:time}),
  assignment:obj({id,status:text,startDate:date,endDate:date,enterpriseSupervisorName:text,academicSupervisor:obj({id,fullName:text,email:text,phone:text})}),
 });
 const history=spec.paths['/api/ojt-semesters/{id}/eligible-student-handoffs'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items;
 Object.assign(history.properties,{id,ojtSemesterId:id,registrationIds:{type:'array',items:id},recipientRole:text,reason:text,createdBy:id,createdAt:time,studentCount:{type:'integer',minimum:0}});
 for(const path of ['/api/enterprise/candidates','/api/enterprise/internships']){
  const fields=spec.paths[path].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties;
  Object.assign(fields.student.properties,{accountStatus:text,enrollmentYear:{type:'integer',nullable:true},currentSemester:{type:'integer',nullable:true},className:{...text,nullable:true}});
  Object.assign(fields,{companyId:id,studentId:id,ojtSemesterId:id,registrationId:id,positionId:id,applicationId:{...id,nullable:true},jobApplication:obj({id,postId:id,coverLetter:{...text,nullable:true},appliedAt:time,status:text,cv:obj({id,studentId:id,filename:text,fileName:text,mimeType:text,sizeBytes:{type:'integer'},size:{type:'integer'},sha256:text,createdAt:time,uploadedAt:time})})});
 }
 const candidateFields=spec.paths['/api/enterprise/candidates'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties;
 Object.assign(candidateFields,{companyId:id,company:contexts.company,coordinatedBy:{...id,nullable:true},coordinatedByUser:user,registration:contexts.registration,application:{type:'object',additionalProperties:true},decision:text,introducedAt:time,decisionAt:{...time,nullable:true},rejectReason:{...text,nullable:true},isLatestCoordination:{type:'boolean'},recruitmentPost:{type:'object',nullable:true,properties:{...spec.paths['/api/recruitment/posts'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties}}});
 const emails=spec.paths['/api/imports/emails'].get;
 emails.responses['200']={description:'Tối đa 100 email mới nhất; kèm tổng số và quyền gửi lại, không có nội dung mã hóa.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},emails:{type:'array',items:{type:'object',properties:{EmailID:id,UserID:id,Recipient:text,Status:text,Attempts:{type:'integer'},SentAt:time,ExpiresAt:time,LastError:{...text,nullable:true},user:obj({id,fullName:text,email:text}),canRetry:{type:'boolean'}}}},total:{type:'integer'},limit:{type:'integer',enum:[100]},hasMore:{type:'boolean'}}}}}};
 const schedules=spec.paths['/api/academic-periods/{id}/combo-phase-schedules'].get;
 schedules.responses['200']={description:'Lịch chọn combo theo học kỳ, kèm tên kỳ và người xác nhận.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'array',items:{type:'object',additionalProperties:true,properties:{academicPeriodId:id,academicPeriod:period,confirmedBy:id,confirmedByUser:user}}}}}}}};
}

// Apply after workflow decorators, which replace some operations outright.
export function describeAdditionalListResponses(spec:Schema) {
 const paths:Record<string,string[]>={
  '/api/students':['program','cohort','entryAcademicPeriod','currentAcademicPeriod'],
  '/api/students/{id}/course-results':['course','academicPeriod'],
  '/api/academic/course-demand':['course','academicPeriod'],
  '/api/qhdn/reports':['company','semester'],
  '/api/ojt-semesters/{id}/eligible-student-handoffs':['registrations'],
  '/api/students/me/opportunities':['semester'],
  '/api/ojt-results':['student','program','company','position','semester','evaluatedByUser','confirmedByUser'],
  '/api/student/ojt-results':['student','program','company','position','semester','evaluatedByUser','confirmedByUser'],
  '/api/student/ojt-registration-windows':['academicPeriod','semester'],
  '/api/student/combo-registration-windows':['academicPeriod','semester'],
  '/api/academic/advisory-runs':['academicPeriod','semester','createdByUser'],
  '/api/academic/advisory-runs/{id}':['student'],
  '/api/internship-tasks':['student','company','position','semester'],
  '/api/student/notifications':[],
 };
 for(const [path,keys]of Object.entries(paths)){
  const op=spec.paths[path]?.get;if(!op)throw Error('Missing display list: '+path);
  op.responses??={};op.responses['200']??={description:'Danh sách kèm thông tin hiển thị'};
  const response=op.responses['200'];response.content??={};response.content['application/json']??={};
  const media=response.content['application/json'];media.schema??={type:'object',properties:{success:{type:'boolean'}}};
  const root=media.schema;root.properties??={};const page=root.properties.data??={type:'object',properties:{}};page.properties??={};
  Object.assign(page.properties,{total:{type:'integer'},page:id,limit:id});
  const list=page.properties.items??={type:'array',items:{type:'object',properties:{}}};
  if(path==='/api/student/ojt-results')list.items=structuredClone(spec.paths['/api/ojt-results'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items);
  describeListDisplayFields(list.items,keys);
  if(path==='/api/internship-tasks')Object.assign(list.items.properties,{
    id,assignmentId:id,studentId:id,companyId:id,positionId:id,ojtSemesterId:id,name:text,description:{...text,nullable:true},status:text,assignedDate:date,dueDate:date,
    assignment:obj({id,status:text,startDate:date,endDate:date}),studentCode:text,fullName:text,companyName:text,positionTitle:text,semesterCode:text,
  });
  if(path==='/api/academic/advisory-runs')Object.assign(list.items.properties,{id,kind:text,status:text,createdBy:id,ojtSemesterId:id,academicPeriodId:id,createdAt:time,completedAt:{...time,nullable:true}});
  if(path==='/api/academic/advisory-runs/{id}')Object.assign(list.items.properties,{id,studentId:id,status:text,notificationId:{...id,nullable:true},errorCode:{...text,nullable:true},snapshot:{type:'object',nullable:true,additionalProperties:true}});
  if(path==='/api/student/notifications')Object.assign(list.items.properties,{id,title:text,content:text,sentAt:time,isRead:{type:'boolean',nullable:true}});
  op.description=[op.description,'Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.'].filter(Boolean).join(' ');
 }
}
