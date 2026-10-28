type Spec=Record<string,any>;
const id:Spec={type:'integer',minimum:1,maximum:2147483647};
const text=(maxLength:number):Spec=>({type:'string',maxLength});
const date:Spec={type:'string',format:'date-time'};
const scope:Spec={type:'object',additionalProperties:false,properties:{programIds:{type:'array',items:id},cohortIds:{type:'array',items:id},majorIds:{type:'array',items:id},groupCodes:{type:'array',items:{type:'string',enum:['A','B','C','D']}},studentIds:{type:'array',items:id}}};
const newOperations:Spec[]=[{"method":"post","path":"/api/academic/academic-summary-notifications","summary":"gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước."},{"method":"post","path":"/api/academic/eligibility-notifications","summary":"thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp."},{"method":"get","path":"/api/academic-periods/{id}/ojt-advisory-schedule","summary":"xem lịch thông báo giữa kỳ và deadline."},{"method":"put","path":"/api/academic-periods/{id}/ojt-advisory-schedule","summary":"cấu hình lịch theo kỳ thực, worker thực thi."},{"method":"get","path":"/api/academic/advisory-runs","summary":"lịch sử batch thông báo khi có worker."},{"method":"get","path":"/api/academic/advisory-runs/{id}","summary":"trạng thái/lỗi từng sinh viên."},{"method":"get","path":"/api/students/me/academic-summary","summary":"tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI"},{"method":"get","path":"/api/students/me/supplementary-course-options","summary":"đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch"},{"method":"get","path":"/api/students/me/curriculum","summary":"chương trình đã ban hành của mình"},{"method":"get","path":"/api/students/me/notifications","summary":"thông báo/lọc unread/phân trang, trả unreadCount cùng response"},{"method":"patch","path":"/api/students/me/notifications/{id}","summary":"người nhận đánh dấu đọc, idempotent"},{"method":"get","path":"/api/students/me/assignments/current","summary":"DN/vị trí/giám sát/thời gian của mình theo kỳ"},{"method":"get","path":"/api/students/me/ojt-results","summary":"chỉ kết quả của mình được công bố"},{"method":"get","path":"/api/students/me/ojt-results/{id}","summary":"điểm/nhận xét đã công bố"},{"method":"get","path":"/api/students/me/dashboard","summary":"tổng hợp; không tạo thuật toán học vụ mới"},{"method":"get","path":"/api/students/me/roadmap-recommendations","summary":"tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc"}];
export function addPortalOperations(spec:Spec):Spec {
 const schemas:Spec={
  '/api/students/me/notifications/{id}':{properties:{isRead:{type:'boolean'}},required:['isRead']},
  '/api/students/me/applications':{properties:{postId:id,positionId:id,cvId:id,coverLetter:{...text(5000),nullable:true}},required:['postId','positionId']},
  '/api/students/me/applications/{id}/withdraw':{properties:{reason:text(2000)},required:['reason']},
  '/api/students/me/cv/analyses':{properties:{cvId:id},required:['cvId']},
  '/api/recruitment-posts/{id}':{properties:{title:text(200),content:text(20000),benefits:{...text(10000),nullable:true},applicationInstructions:{...text(10000),nullable:true},deadlineAt:date,reason:text(2000)},required:['reason']},
  '/api/academic-periods/{id}/ojt-advisory-schedule':{properties:{ojtSemesterId:id,sendAt:date,assessmentDeadline:date,scope,enabled:{type:'boolean'},reason:text(2000)},required:['ojtSemesterId','sendAt','assessmentDeadline','scope','reason']},
 };
 const notification={properties:{ojtSemesterId:id,academicPeriodId:id,scope,studentIds:{type:'array',minItems:1,maxItems:1000,uniqueItems:true,items:id},idempotencyKey:text(100),reason:text(2000)},required:['ojtSemesterId','academicPeriodId','idempotencyKey','reason']};
 for(const entry of newOperations){
  const {path,method,summary}=entry;spec.paths[path]??={};
  const parameters:Spec[]=[...path.matchAll(/\{([^}]+)\}/g)].map((m:any)=>({in:'path',name:m[1],required:true,schema:id}));
  const query:Spec={};
  if(method==='get'){
   if(['/api/students/me/academic-summary','/api/students/me/supplementary-course-options','/api/students/me/dashboard','/api/students/me/roadmap-recommendations','/api/students/me/company-recommendations','/api/qhdn/dashboard'].includes(path))query.ojtSemesterId={...id,required:true};
   if(['/api/students/me/companies','/api/students/me/companies/{id}','/api/students/me/positions','/api/students/me/positions/{id}','/api/students/me/applications','/api/students/me/applications/{id}','/api/students/me/assignments/current','/api/students/me/ojt-results','/api/students/me/ojt-results/{id}','/api/students/me/ojt-registration-windows','/api/job-applications','/api/job-applications/{id}','/api/company-imports','/api/company-imports/{id}','/api/recruitment-posts','/api/recruitment-posts/{id}'].includes(path))query.ojtSemesterId=id;
   if(['/api/students/me/positions','/api/students/me/positions/{id}','/api/students/me/applications','/api/students/me/applications/{id}','/api/job-applications','/api/job-applications/{id}','/api/recruitment-posts','/api/recruitment-posts/{id}'].includes(path))query.enterpriseId=id;
   if(path.includes('/qhdn/reports/')){query.ojtSemesterId={...id,required:true};query.enterpriseId=id;}
   if(['/api/students/me/companies','/api/students/me/companies/{id}','/api/students/me/positions','/api/students/me/positions/{id}'].includes(path))query.search=text(100);
   if(['/api/students/me/applications','/api/students/me/applications/{id}','/api/job-applications','/api/job-applications/{id}','/api/recruitment-posts','/api/recruitment-posts/{id}'].includes(path))query.status=text(30);
   if(path==='/api/students/me/notifications')query.unread={type:'string',enum:['true','false']};
   if(path==='/api/students/me/cv')query.download={type:'string',enum:['true','false']};
   if(path==='/api/qhdn/reports/export'){query.type={type:'string',enum:['acceptance','internships','enterprise-feedback'],required:true};query.format={type:'string',enum:['csv','json'],default:'csv'};}
   const lists=['/api/students/me/companies','/api/students/me/positions','/api/students/me/applications','/api/students/me/ojt-registration-windows','/api/students/me/combo-registration-windows','/api/students/me/ojt-results','/api/students/me/notifications','/api/recruitment-posts','/api/job-applications','/api/company-imports','/api/academic/advisory-runs','/api/academic/advisory-runs/{id}','/api/qhdn/reports/acceptance','/api/qhdn/reports/internships','/api/qhdn/reports/enterprise-feedback'];
   if(lists.includes(path)){query.page=id;query.limit={type:'integer',minimum:1,maximum:100};}
  }
  for(const [name,raw]of Object.entries(query)as[string,Spec][]){const {required,...schema}=raw;parameters.push({in:'query',name,required:required===true,schema});}
  const academic=path.startsWith('/api/academic/')||path.includes('ojt-advisory-schedule');
  const operation:Spec={tags:[path.startsWith('/api/students/me/')?'Student portal':academic?'Academic advisory':'QHDN recruitment'],summary,security:[{bearerAuth:[]}],parameters,responses:{[method==='post'?(path.includes('notifications')?'202':/\/(publish|close|withdraw)$/.test(path)?'200':'201'):'200']:{description:'Success JSON envelope, or private PDF/CSV download when requested'},400:{description:'Invalid input'},401:{description:'Authentication required'},403:{description:'Role or ownership violation'},404:{description:'Record not found'},409:{description:'State, eligibility, deadline, handoff or capacity conflict'},503:{description:'Required AI/storage provider not configured'}}};
  if(['post','put','patch'].includes(method)){
   const schema=path.includes('-notifications')?notification:schemas[path]??{properties:{reason:text(2000)},required:['reason']};
   operation.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,...schema}}}};
  }
  if(path==='/api/students/me/cv'&&method==='post')operation.requestBody={required:true,content:{'multipart/form-data':{schema:{type:'object',required:['file'],properties:{file:{type:'string',format:'binary',description:'PDF only, maximum 5 MiB'}}}}}};
  spec.paths[path][method]=operation;
 }
 for(const path of ['/api/ojt-coordinations','/api/ojt-coordinations/{id}/reassign']){
  const op=spec.paths[path]?.post;const b=op?.requestBody?.content?.['application/json']?.schema;if(b){b.properties.applicationId=id;b.required=b.required.filter((k:string)=>!['registrationId','positionId'].includes(k));b.anyOf=[{required:['applicationId']},{required:path.endsWith('/reassign')?['positionId']:['registrationId','positionId']}];}
 }
 const getCo=spec.paths['/api/ojt-coordinations']?.get;if(getCo)getCo.parameters.push({in:'query',name:'applicationId',schema:id});
 const assessment=spec.paths['/api/ojt-semesters/{id}/assessment-window']?.put?.requestBody?.content?.['application/json']?.schema;if(assessment){assessment.properties.assessmentAcademicPeriodId=id;assessment.properties.requiredRelativeSemester={type:'integer',enum:[5],default:5};}
 const reopen=spec.paths['/api/ojt-semesters/{id}/assessment-window/open']?.post?.requestBody?.content?.['application/json']?.schema;if(reopen){reopen.properties.reopen={type:'boolean',description:'Explicitly reopen a closed assessment, invalidate previous official revision, and audit the reason.'};reopen.properties.closesAt=date;}
 const alerts=spec.paths['/api/academic/alerts']?.get?.parameters?.find((p:Spec)=>p.name==='type');if(alerts)alerts.schema={type:'string',enum:['CREDIT_SHORTFALL','MISSING_REQUIRED_COURSES','EXCESS_FAILED_COURSES']};
 const user=spec.components?.schemas?.UserResponse;if(user)Object.assign(user.properties,{studentId:{...id,nullable:true},enterpriseId:{...id,nullable:true}});
 return spec;
}
