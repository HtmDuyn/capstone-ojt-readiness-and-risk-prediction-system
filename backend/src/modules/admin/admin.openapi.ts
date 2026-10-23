type Schema=Record<string,any>;
const text=(maxLength=200):Schema=>({type:'string',maxLength});
const id:Schema={type:'integer',minimum:1,maximum:2147483647};
const status=(...values:string[]):Schema=>({type:'string',enum:values});
const reason=text(2000);
const paged={page:{...id,default:1},limit:{type:'integer',minimum:1,maximum:100,default:20}};
const company={code:text(20),name:text(200),address:text(300),industry:text(100),contactPersonName:text(100),contactPhone:text(20),contactEmail:{type:'string',format:'email',maxLength:100},status:status('ACTIVE','INACTIVE')};
const assignment={registrationId:id,positionId:id,academicSupervisorId:{...id,nullable:true},enterpriseSupervisorName:text(100),startDate:{type:'string',format:'date'},endDate:{type:'string',format:'date'}};
export function addAdminOperations(spec:Schema):Schema {
 const add=(method:string,path:string,summary:string,body?:Schema,required:string[]=[],filters?:Schema,response=200)=>{
  const parameters:Schema[]=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:id}));
  for(const [name,schema]of Object.entries(filters??{}))parameters.push({name,in:'query',required:name==='type',schema});
  const operation:Schema={tags:['Admin'],summary,security:[{bearerAuth:[]}],parameters,responses:{[response]:{description:'Success'},400:{description:'Invalid input'},401:{description:'JWT required or expired'},403:{description:'ADMIN role required'},404:{description:'Record not found'},409:{description:'Business rule conflict'},422:{description:'Invalid scope'},503:{description:'Required service is not configured'}}};
  if(body)operation.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:body,required}}}};
  spec.paths[path]??={};spec.paths[path][method]=operation;
 };
 add('post','/api/auth/users/password-reset','Queue temporary password email and revoke previous JWTs',{userId:id},['userId'],undefined,202);
 add('post','/api/admin/dashboard','System overview',{section:{...status('all','summary'),default:'summary'}});
 add('post','/api/students','Create profile for an existing active STUDENT account',{userId:id,studentCode:text(20),programId:id,enrollmentYear:{type:'integer',minimum:1900,maximum:2200},currentSemester:{type:'integer',minimum:1,maximum:100},className:text(20)},['userId','studentCode'],undefined,201);
 add('delete','/api/students','Soft delete student and deactivate account',{studentId:id},['studentId'],undefined,200);
 add('post','/api/students/export','Export students as CSV',{search:text(100),status:text(30),programId:id,cohortId:id,groupCode:status('A','B','C','D'),enrollmentYear:id,currentSemester:id});
 spec.paths['/api/students/export'].post.description='Nhập bộ lọc trong JSON body; gửi {} để xuất toàn bộ phạm vi được phép. Không nhận page/limit hoặc query parameters. Kết quả là file students.csv.';
 spec.paths['/api/students/export'].post.responses[200]={description:'File CSV danh sách sinh viên',headers:{'Content-Disposition':{schema:{type:'string'},example:'attachment; filename="students.csv"'}},content:{'text/csv':{schema:{type:'string',format:'binary'}}}};

 add('post','/api/companies','Create company',company,['code','name'],undefined,201);add('patch','/api/companies/{id}','Update company',company);add('delete','/api/companies','Soft delete company',{companyId:id},['companyId'],undefined,200);
 const accountInfo={type:'object',properties:{id,username:text(100),email:{type:'string',format:'email'},fullName:text(150),status:text(30)}};
 const companyInfo={type:'object',properties:{id,code:text(20),name:text(200),address:{...text(300),nullable:true},industry:{...text(100),nullable:true},contactPersonName:{...text(100),nullable:true},contactPhone:{...text(20),nullable:true},contactEmail:{type:'string',format:'email',nullable:true},status:text(30),createdAt:{type:'string',format:'date-time'},deletedAt:{type:'string',format:'date-time'}}};
 for(const [path,data,message]of [
  ['/api/students',{student:{type:'object',properties:{id,studentCode:text(20),userId:id,status:{type:'string',enum:['INACTIVE']},deletedAt:{type:'string',format:'date-time'}}},account:{...accountInfo,nullable:true}},'Xóa hồ sơ sinh viên thành công.'],
  ['/api/companies',{company:companyInfo,accounts:{type:'array',items:accountInfo}},'Xóa doanh nghiệp thành công.'],
 ] as [string,Schema,string][]){
  spec.paths[path].delete.responses[200]={description:message,content:{'application/json':{schema:{type:'object',required:['success','message','data'],properties:{success:{type:'boolean',enum:[true]},message:{type:'string',example:message},data:{type:'object',properties:data}}}}}};
 }
 add('delete','/api/positions','Soft delete position',{positionId:id},['positionId']);
 spec.paths['/api/positions'].delete.responses[200]={description:'Xóa vị trí thực tập thành công.',content:{'application/json':{schema:{type:'object',required:['success','message','data'],properties:{success:{type:'boolean',enum:[true]},message:{type:'string',example:'Xóa vị trí thực tập thành công.'},data:{type:'object',properties:{position:{type:'object',properties:{id,companyId:id,ojtSemesterId:id,recruitmentCode:text(50),title:text(200),description:{...text(10000),nullable:true},requirements:{...text(10000),nullable:true},capacity:{type:'integer'},remainingSlots:{type:'integer'},status:{type:'string',enum:['CLOSED']},location:{...text(200),nullable:true},workMode:{...text(50),nullable:true},deletedAt:{type:'string',format:'date-time'}}}}}}}}}};



 add('post','/api/assignments','Assign an approved registration to a position',assignment,['registrationId','positionId','startDate','endDate'],undefined,201);
 const {registrationId:_,...assignmentPatch}=assignment;
 add('patch','/api/assignments/{id}','Update assignment',{...assignmentPatch,status:status('ACTIVE','COMPLETED','CANCELLED'),reason},['reason']);
 add('post','/api/admin/audit-logs/list','Danh sách nhật ký hoạt động chi tiết',{...paged,logId:id,userId:id,entityType:text(100),entityId:id,action:text(100)});
 const logList=spec.paths['/api/admin/audit-logs/list'].post;
 logList.description='ADMIN xem danh sách log mới nhất trước; bộ lọc trong JSON body. Gửi {} để lấy trang đầu. Bản demo trả toàn bộ nội dung log đã lưu, không che dữ liệu. detail giải mã JSON nếu hợp lệ; rawLog giữ đầy đủ bản ghi gốc, kể cả Detail dạng text và IPAddress.';
 logList.requestBody.content['application/json'].example={page:1,limit:20};
 const logItem={type:'object',properties:{id,userId:{...id,nullable:true},entityType:text(100),entityId:{...id,nullable:true},action:text(100),createdAt:{type:'string',format:'date-time'},ipAddress:{type:'string',nullable:true},detail:{description:'Nội dung nguyên vẹn: JSON đã parse hoặc chuỗi gốc; không che trường nào.',nullable:true},rawLog:{type:'object',additionalProperties:true,description:'Tất cả cột của bản ghi AuditLogs nguyên gốc.'},user:{type:'object',nullable:true,properties:{id,username:text(100),fullName:text(150),email:{type:'string',format:'email'},status:text(30),roleId:id,roleCode:text(30),roleName:text(100)}}}};
 logList.responses[200]={description:'Danh sách nhật ký đầy đủ có phân trang.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:logItem},total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}}}}}}}};

 return spec;
}
