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
  const studentExample={kind:'STUDENT',idempotencyKey:'student-full-001',rows:[{code:'SV001',email:'student@example.com',fullName:'Nguyễn Văn A',academic:{programId:1,className:'SE01',placement:{cohortId:1,groupCode:'A',currentAcademicPeriodId:1},courseResults:[{courseCode:'PRF192',academicPeriodId:1,status:'PASSED',score:8,gradePoints:3.5,grade:'B'}]}}]};
  const enterpriseExample={kind:'ENTERPRISE',idempotencyKey:'enterprise-account-001',rows:[{code:'DN001',email:'hr@example.com',fullName:'Người phụ trách',name:'Công ty ABC'}]};
  schema.example=enterpriseExample;
  for(const mode of ['preview','commit']){
    const op=spec.paths[`/api/imports/${mode}`].post;
    op.summary=mode==='preview'?'Kiểm tra import doanh nghiệp hoặc sinh viên':'Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin)';
    op.requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/AccountImportRequest'},examples:{enterprise:{summary:'Tạo tài khoản doanh nghiệp liên kết',value:enterpriseExample},student:{summary:'Import sinh viên qua student-imports',value:studentExample}}}}};
    op.description='Chỉ OJT_COORD được import tài khoản ENTERPRISE. Mỗi dòng gồm code, email, fullName, name; không nhập hồ sơ, JD, vị trí, kỳ hoặc đợt tuyển dụng. Tài khoản mới nhận email mật khẩu tạm và phải đổi mật khẩu trước khi sử dụng. Tài khoản đã tồn tại được báo trùng; dữ liệu cũ được giữ nguyên. Retry dùng cùng idempotencyKey và payload.';
  }
  spec.paths['/api/enterprise/tasks/bulk']={post:{
    summary:'Giao một hoặc nhiều task cho nhiều thực tập sinh',
    description:'assignmentIds là ID phân công thực tập (AssignmentID), không phải studentId. Mỗi task trong tasks được giao cho mọi phân công đã chọn. Chấp nhận tối đa 500 phân công và 50 task (tổng tối đa 5000 task). Toàn bộ giao dịch thất bại nếu có phân công không thuộc doanh nghiệp trong token, không ở trạng thái đang thực tập, hoặc dueDate nằm ngoài thời gian thực tập.',
    security:[{bearerAuth:[]}],
    requestBody:{required:true,content:{'application/json':{schema:{
      type:'object',additionalProperties:false,required:['assignmentIds','tasks','idempotencyKey'],
      properties:{
        idempotencyKey:{type:'string',minLength:1,maxLength:100,description:'Dùng lại cùng key và payload khi thử lại request chưa rõ kết quả.'},
        assignmentIds:{type:'array',minItems:1,maxItems:500,uniqueItems:true,items:integer},
        tasks:{type:'array',minItems:1,maxItems:50,items:{type:'object',additionalProperties:false,required:['name','dueDate'],properties:{
          name:{type:'string',minLength:1,maxLength:200},
          description:{type:'string',maxLength:10000},
          dueDate:{type:'string',format:'date'},
        }}},
      },
    }}}},
    responses:{
      200:{description:'Đã giao task hoặc trả lại kết quả của request idempotent trước đó.',content:{'application/json':{schema:{
        type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{
          created:{type:'integer'},tasks:{type:'array',items:{type:'object',properties:{id:integer,assignmentId:integer}}},
          replayed:{type:'boolean'},
        }}},
      }}}},
      400:{description:'Invalid tasks'},
      403:{description:'Assignment belongs to another enterprise'},
      409:{description:'Inactive internship or idempotency conflict'},
    },
  }};
  spec.paths['/api/internship-tasks']={get:{summary:'Danh sách task trong phạm vi tài khoản',security:[{bearerAuth:[]}],parameters:['companyId','studentId','positionId','ojtSemesterId','assignmentId','page','limit'].map(name=>({name,in:'query',schema:integer})),responses:{200:{description:'Paginated tasks'}}}};
}
