type Schema=Record<string,any>;
const text=(maxLength=200):Schema=>({type:'string',maxLength});
const id:Schema={type:'integer',minimum:1,maximum:2147483647};
const status=(...values:string[]):Schema=>({type:'string',enum:values});
const reason=text(2000);
const paged={page:{...id,default:1},limit:{type:'integer',minimum:1,maximum:100,default:20}};
const predictionQuery={ojtSemesterId:id,studentId:id,modelId:id,riskLevel:status('LOW','MEDIUM','HIGH'),readinessLevel:status('LOW','MEDIUM','HIGH'),from:{type:'string',format:'date-time'},to:{type:'string',format:'date-time'}};
const company={code:text(20),name:text(200),address:text(300),industry:text(100),contactPersonName:text(100),contactPhone:text(20),contactEmail:{type:'string',format:'email',maxLength:100},status:status('ACTIVE','INACTIVE')};
const assignment={registrationId:id,positionId:id,academicSupervisorId:{...id,nullable:true},enterpriseSupervisorName:text(100),startDate:{type:'string',format:'date'},endDate:{type:'string',format:'date'}};
const template={code:text(50),version:id,name:text(150),criteria:{type:'array',minItems:1,maxItems:100,items:{type:'object',additionalProperties:false,required:['code','name','weight','maxScore'],properties:{code:text(50),name:text(150),weight:{type:'number',exclusiveMinimum:true,minimum:0,maximum:100,multipleOf:0.01},maxScore:{type:'number',exclusiveMinimum:true,minimum:0,maximum:100}}}}};
const intervention={description:text(10000),assignedTo:id,dueDate:{type:'string',format:'date',nullable:true}};
export function addAdminOperations(spec:Schema):Schema {
 const add=(method:string,path:string,summary:string,body?:Schema,required:string[]=[],filters?:Schema,response=200)=>{
  const parameters:Schema[]=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:id}));
  for(const [name,schema]of Object.entries(filters??{}))parameters.push({name,in:'query',required:name==='type',schema});
  const operation:Schema={tags:['Admin'],summary,security:[{bearerAuth:[]}],parameters,responses:{[response]:{description:'Success'},400:{description:'Invalid input'},401:{description:'JWT required or expired'},403:{description:'ADMIN role required'},404:{description:'Record not found'},409:{description:'Business rule conflict'},422:{description:'Invalid scope'},503:{description:'Required service is not configured'}}};
  if(body)operation.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:body,required}}}};
  spec.paths[path]??={};spec.paths[path][method]=operation;
 };
 add('post','/api/auth/users/{userId}/password-reset','Queue temporary password email and revoke previous JWTs',undefined,[],undefined,202);
 add('get','/api/admin/dashboard/summary','System totals');
 add('get','/api/admin/dashboard','Readiness, risk and trends in one snapshot',undefined,[],{...predictionQuery,section:status('all','readiness','risks','trends')});
 add('post','/api/students','Create profile for an existing active STUDENT account',{userId:id,studentCode:text(20),programId:id,enrollmentYear:{type:'integer',minimum:1900,maximum:2200},currentSemester:{type:'integer',minimum:1,maximum:100},className:text(20)},['userId','studentCode'],undefined,201);
 add('delete','/api/students/{id}','Soft delete student and deactivate account',undefined,[],undefined,204);
 add('get','/api/students/export','Export students as CSV',undefined,[],{search:text(100),status:text(30),programId:id,cohortId:id,groupCode:status('A','B','C','D'),enrollmentYear:id,currentSemester:id});

 add('post','/api/companies','Create company',company,['code','name'],undefined,201);add('patch','/api/companies/{id}','Update company',company);add('delete','/api/companies/{id}','Soft delete company',undefined,[],undefined,204);
 add('delete','/api/positions/{id}','Soft delete position',undefined,[],undefined,204);


 add('post','/api/assignments','Assign an approved registration to a position',assignment,['registrationId','positionId','startDate','endDate'],undefined,201);
 const {registrationId:_,...assignmentPatch}=assignment;
 add('patch','/api/assignments/{id}','Update assignment',{...assignmentPatch,reason},['reason']);add('patch','/api/assignments/{id}/status','Change assignment status',{status:status('ACTIVE','COMPLETED','CANCELLED'),reason},['status','reason']);
 add('get','/api/assessment-templates','List assessment templates',undefined,[],{...paged,templateId:id,search:text(100),status:status('DRAFT','PUBLISHED')});
 add('post','/api/assessment-templates','Create template version; weights total 100',template,['code','version','name','criteria'],undefined,201);
 add('patch','/api/assessment-templates/{id}','Edit draft template',{name:template.name,criteria:template.criteria});add('post','/api/assessment-templates/{id}/publish','Publish immutable template');
 add('post','/api/admin/prediction-jobs','Queue predictions using a configured external model',{modelId:id,ojtSemesterId:id,studentIds:{type:'array',items:id,minItems:1,maxItems:1000,uniqueItems:true},idempotencyKey:text(100)},['modelId','ojtSemesterId','idempotencyKey'],undefined,202);
 add('get','/api/admin/prediction-jobs/{id}','Prediction job progress and per-student errors',undefined,[],paged);
 add('get','/api/predictions','Prediction history',undefined,[],{...paged,...predictionQuery});add('get','/api/predictions/{id}','Prediction detail and input/model snapshots');
 add('get','/api/admin/models','List registered model versions',undefined,[],{...paged,modelId:id,search:text(100),status:status('ACTIVE','INACTIVE')});
 add('get','/api/alerts','List prediction risk alerts',undefined,[],{...paged,alertId:id,studentId:id,ojtSemesterId:id,status:status('OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED'),interventionPage:id,interventionLimit:{type:'integer',minimum:1,maximum:100}});
 add('patch','/api/alerts/{id}/status','Acknowledge or close alert',{status:status('ACKNOWLEDGED','RESOLVED','DISMISSED'),reason},['status','reason']);
 add('post','/api/alerts/{id}/interventions','Create intervention',intervention,['description','assignedTo'],undefined,201);
 add('get','/api/students/{id}/interventions','Student intervention history',undefined,[],{...paged,status:status('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')});
 add('patch','/api/interventions/{id}','Update intervention',{...intervention,status:status('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'),outcome:text(10000),reason},['reason']);
 add('get','/api/admin/reports/readiness','Latest readiness and risk predictions per student and semester',undefined,[],{...paged,...predictionQuery});
 add('get','/api/admin/reports/export','Export latest predictions, capped at 10000 records',undefined,[],{...predictionQuery,type:status('readiness','risks'),format:status('csv','json')});
 add('get','/api/admin/audit-logs','Audit log with sensitive fields redacted',undefined,[],{...paged,userId:id,entityType:text(100),entityId:id,action:text(100)});
 return spec;
}
