export function describeImportWorkflow(spec: Record<string,any>) {
  for(const [path,method] of [
    ['/api/assignments/{id}/internship-evaluation','put'],['/api/students','post'],['/api/companies','post'],['/api/recruitment/posts','post'],
    ['/api/course-result-imports/preview','post'],['/api/course-result-imports/commit','post'],
  ]) {
    if(spec.paths[path]){delete spec.paths[path][method];if(!Object.keys(spec.paths[path]).length)delete spec.paths[path];}
  }
  const integer={type:'integer',minimum:1};
  const academic={type:'object',additionalProperties:false,required:['programId','placement','courseResults'],properties:{
    programId:integer,phone:{type:'string',nullable:true},className:{type:'string',nullable:true},status:{type:'string',enum:['ACTIVE','INACTIVE','SUSPENDED','GRADUATED','DROPPED_OUT']},
    placement:{type:'object',additionalProperties:false,required:['cohortId','groupCode','currentAcademicPeriodId'],properties:{cohortId:integer,groupCode:{type:'string',enum:['A','B','C','D']},entryAcademicPeriodId:integer,currentAcademicPeriodId:integer}},
    courseResults:{type:'array',maxItems:1000,items:{type:'object',additionalProperties:false,required:['courseCode','academicPeriodId','status'],properties:{courseCode:{type:'string'},academicPeriodId:integer,attemptNumber:{...integer,maximum:100},status:{type:'string',enum:['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED']},score:{type:'number',minimum:0,maximum:10,nullable:true},gradePoints:{type:'number',minimum:0,maximum:4,nullable:true},grade:{type:'string',nullable:true},sourceReference:{type:'string',nullable:true}}}},
  }};
  const schema=spec.components.schemas.AccountImportRequest;
  schema.properties.rows.items.properties.academic=academic;
  schema.properties.rows.items.properties.code.description='Stable enterprise/student business code, distinct from database ID.';
  schema.example={kind:'STUDENT',idempotencyKey:'student-full-001',rows:[{code:'SV001',email:'student@example.com',fullName:'Nguyễn Văn A',academic:{programId:1,className:'SE01',placement:{cohortId:1,groupCode:'A',currentAcademicPeriodId:1},courseResults:[{courseCode:'PRF192',academicPeriodId:1,status:'PASSED',score:8,gradePoints:3.5,grade:'B'}]}}]};
  for(const mode of ['preview','commit']){
    const op=spec.paths[`/api/imports/${mode}`].post;
    op.summary=mode==='preview'?'Kiểm tra toàn bộ dữ liệu import':'Import tổng tài khoản và dữ liệu nghiệp vụ';
    const schema={type:'object',required:['kind','idempotencyKey','file'],properties:{kind:{type:'string',enum:['STUDENT','ENTERPRISE']},idempotencyKey:{type:'string',maxLength:100},windowId:{type:'integer',minimum:1,description:'Required for ENTERPRISE'},mapping:{type:'string',description:'JSON map canonical field to header'},file:{type:'string',format:'binary',description:'XLSX or CSV; 8 MiB maximum. One row per course attempt or recruitment position.'}}};
    op.requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/AccountImportRequest'}},'multipart/form-data':{schema}}};
    op.description='ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và windowId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.';
  }
  spec.paths['/api/enterprise/tasks/bulk']={post:{summary:'Giao nhiều task cho nhiều thực tập sinh',security:[{bearerAuth:[]}],requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['assignmentIds','tasks','idempotencyKey'],properties:{idempotencyKey:{type:'string',maxLength:100},assignmentIds:{type:'array',minItems:1,maxItems:500,uniqueItems:true,items:integer},tasks:{type:'array',minItems:1,maxItems:50,items:{type:'object',additionalProperties:false,required:['name','dueDate'],properties:{name:{type:'string',maxLength:200},description:{type:'string'},dueDate:{type:'string',format:'date'}}}}}}}}},responses:{200:{description:'Task IDs and replay status'},400:{description:'Invalid tasks'},403:{description:'Assignment belongs to another enterprise'},409:{description:'Inactive internship or idempotency conflict'}}}};
  spec.paths['/api/internship-tasks']={get:{summary:'Danh sách task trong phạm vi tài khoản',security:[{bearerAuth:[]}],parameters:['companyId','studentId','positionId','ojtSemesterId','assignmentId','page','limit'].map(name=>({name,in:'query',schema:integer})),responses:{200:{description:'Paginated tasks'}}}};
}
