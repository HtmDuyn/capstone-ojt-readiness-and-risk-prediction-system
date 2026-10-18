type Schema=Record<string,any>;
const id={type:'integer',minimum:1};
const text={type:'string'};
const num={type:'number',nullable:true};
const time={type:'string',format:'date-time',nullable:true};
const obj=(properties:Schema):Schema=>({type:'object',properties});
const nil=(schema:Schema):Schema=>({...schema,nullable:true});
const arr=(items:Schema):Schema=>({type:'array',items});
const page=(items:Schema):Schema=>obj({items:arr(items),total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}});
const fields=(...names:string[]):Schema=>Object.fromEntries(names.map(name=>[name,nil(text)]));
const period=obj({id,...fields('code','name','kind','startDate','endDate')});
const semester=obj({id,...fields('code','name'),academicPeriodId:id});
const person=obj({id,...fields('studentCode','fullName','email','phone')});
const company=obj({id,...fields('code','name','contactEmail','contactPhone')});
const position=obj({id,...fields('code','title','description','requirements','location','workMode'),ojtSemesterId:id});
const course=obj({id,courseId:id,...fields('code','name','courseCode','courseName','status','grade'),credits:num,score:num,gradePoints:num,attemptNumber:id,academicPeriodId:id});
const combo=obj({id,comboId:id,...fields('code','name','purpose'),confirmedAt:time,courses:arr(course),choiceGroups:arr(obj({code:text,minCourses:id,maxCourses:id,courseIds:arr(id)}))});
const template=nil(obj({id,...fields('code','name','status'),version:id,criteria:arr({type:'object',additionalProperties:true})}));
const evaluation=nil(obj({id,templateId:nil(id),scoreDetails:{type:'object',nullable:true,additionalProperties:true},completionScore:num,attitudeScore:num,skillScore:num,overallScore:num,...fields('comments','status'),evaluatedAt:time,evaluatedBy:id}));
const result=nil(obj({id,status:text,version:id,officialScore:num,outcome:nil(text),confirmedAt:time}));
const coreStudent={id,studentCode:text,userId:id,...fields('fullName','email','phone','accountStatus','className','status','groupCode'),programId:nil(id),cohortId:nil(id),currentSemester:id,
  entryAcademicPeriodId:nil(id),currentAcademicPeriodId:nil(id),enrollmentYear:id,
  program:nil(obj({id,...fields('code','name','version','status','majorName','majorCode'),totalCredits:num,majorId:nil(id)})),
  cohort:nil(obj({id,...fields('code','name')})),entryAcademicPeriod:nil(period),currentAcademicPeriod:nil(period)};
const profile=obj({...coreStudent,
  academicProgress:obj({studentId:id,status:text,gpa:num,gpaScale:num,credits:obj({earned:num,total:num,remaining:num,completeConfiguration:{type:'boolean'}}),issues:arr(text),requirements:arr({type:'object',additionalProperties:true}),gpaCourses:arr({type:'object',additionalProperties:true})}),
  courseResults:page(course),comboSelections:arr(combo),ojtSemesterId:nil(id),officialEligibility:{type:'object',nullable:true,additionalProperties:true},
  ojtRegistrations:page(obj({id,ojtSemesterId:id,windowId:nil(id),status:text,application:{type:'object',additionalProperties:true},registeredAt:time,semester,coordination:nil({type:'object',additionalProperties:true}),assignment:nil({type:'object',additionalProperties:true}),evaluation,result}))});
const account=obj({id,...fields('username','email','phone','full_name','status','role_code','role_name'),role_id:id,studentId:nil(id),enterpriseId:nil(id),created_at:time,updated_at:time,last_login_at:time});
const window=obj({id,name:text,academicPeriodId:id,ojtSemesterId:id,period,semester,startsAt:time,endsAt:time,effectiveEndsAt:time,status:text,
  canSubmit:{type:'boolean',description:'Với sinh viên: có thể gửi hồ sơ tại thời điểm đọc.'},blockingReasons:arr(text),blockingMessages:arr(text),
  phase:text,initialWindowId:nil(id),requiredRelativeSemester:id,pathway:{type:'object',nullable:true,additionalProperties:true},
  selection:{type:'object',nullable:true,additionalProperties:true},confirmedSelection:nil(combo),reasonRequiredOnChange:{type:'boolean'},registration:{type:'object',nullable:true,additionalProperties:true},availableCombos:arr(combo)});

export function describeFeResponses(spec:Schema):void {
  const set=(path:string,schema:Schema,envelope='data',method='get')=>{
    const operation=spec.paths?.[path]?.[method];if(!operation)throw new Error('Missing FE response operation: '+method+' '+path);
    operation.responses['200']={description:'Dữ liệu hiển thị đầy đủ theo quyền truy cập.',content:{'application/json':{schema:obj({success:{type:'boolean'},[envelope]:schema})}}};
  };
  set('/api/students/{id}',profile);
  set('/api/students',page(obj(coreStudent)));
  set('/api/accounts/me/profile',account,'account');
  set('/api/accounts/me/profile',account,'account','patch');
  set('/api/accounts/{userId}',account,'account');
  for(const path of ['/api/ojt-registration-windows','/api/combo-registration-windows'])set(path,{...page(window),properties:{...page(window).properties,studentId:id,student:person},description:'Sinh viên chỉ nhận các đợt thuộc phạm vi của mình; không có danh sách sinh viên khác.'});
  const context={student:person,company,position,template};
  for(const path of ['/api/ojt-coordinations','/api/internship-evaluations']){
    const item=obj({id,...context,studentId:id,companyId:id,positionId:id,ojtSemesterId:id,registrationId:id,assignmentId:id,...fields('studentCode','fullName','companyName','positionTitle','decision','status','comments'),templateId:nil(id),scoreDetails:{type:'object',nullable:true,additionalProperties:true},completionScore:num,attitudeScore:num,skillScore:num,overallScore:num,evaluatedAt:time,evaluatedBy:nil(id),
      registration:nil(obj({id,studentId:id,ojtSemesterId:id,programId:nil(id),status:text,application:{type:'object',additionalProperties:true},registeredAt:time})),
      assignment:nil(obj({id,...fields('status','startDate','endDate','enterpriseSupervisorName'),academicSupervisor:nil(person),result}))});
    set(path,page(item));set(path+'/{id}',{...item,properties:{...item.properties,history:arr({type:'object',additionalProperties:true}),registration:{type:'object',additionalProperties:true},coordinationHistory:arr({type:'object',additionalProperties:true})}});
  }
  const candidate=obj({id,student:person,position,application:{type:'object',additionalProperties:true},decision:text,introducedAt:time,decisionAt:time,rejectReason:nil(text),isLatestCoordination:{type:'boolean'}});
  set('/api/enterprise/candidates',page(candidate));set('/api/enterprise/candidates/{id}',candidate);
  set('/api/enterprise/internships',page(obj({id,student:person,position,application:{type:'object',additionalProperties:true},academicSupervisor:nil(person),coordinationId:id,...fields('enterpriseSupervisorName','startDate','endDate','status','resultStatus'),evaluation,template,result,evaluationLocked:{type:'boolean'}})));
  set('/api/enterprise/profile',obj({...company.properties,...fields('address','industry','status','contactPersonName'),createdAt:time,
    summary:obj({scope:text,publishedPosts:{type:'integer'},pendingPosts:{type:'integer'},pendingCandidates:{type:'integer'},activeInterns:{type:'integer'},pendingEvaluations:{type:'integer'}})}));
  Object.assign(spec.components.schemas.UserResponse.properties,{studentId:nil(id),enterpriseId:nil(id)});
  const example=spec.paths['/api/auth/me'].get.responses['200'].content?.['application/json']?.example?.user;
  if(example)Object.assign(example,{studentId:null,enterpriseId:null});
}
