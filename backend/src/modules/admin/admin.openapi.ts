type Schema=Record<string,any>;
const text=(maxLength=200):Schema=>({type:'string',maxLength});
const id:Schema={type:'integer',minimum:1,maximum:2147483647};
const status=(...values:string[]):Schema=>({type:'string',enum:values});
const paged={page:{...id,default:1},limit:{type:'integer',minimum:1,maximum:100,default:20}};
const company={code:text(20),name:text(200),address:text(300),industry:text(100),contactPersonName:text(100),contactPhone:text(20),contactEmail:{type:'string',format:'email',maxLength:100},status:status('ACTIVE','INACTIVE')};
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
 add('patch','/api/companies/{id}','Update company',company);
 add('post','/api/admin/audit-logs/list','Danh sách nhật ký hoạt động chi tiết',{...paged,logId:id,userId:id,entityType:text(100),entityId:id,action:text(100)});
 const logList=spec.paths['/api/admin/audit-logs/list'].post;
 logList.description='ADMIN xem danh sách log mới nhất trước; bộ lọc trong JSON body. Gửi {} để lấy trang đầu. Bản demo trả toàn bộ nội dung log đã lưu, không che dữ liệu. detail giải mã JSON nếu hợp lệ; rawLog giữ đầy đủ bản ghi gốc, kể cả Detail dạng text và IPAddress.';
 logList.requestBody.content['application/json'].example={page:1,limit:20};
 const logItem={type:'object',properties:{id,userId:{...id,nullable:true},entityType:text(100),entityId:{...id,nullable:true},action:text(100),createdAt:{type:'string',format:'date-time'},ipAddress:{type:'string',nullable:true},detail:{description:'Nội dung nguyên vẹn: JSON đã parse hoặc chuỗi gốc; không che trường nào.',nullable:true},rawLog:{type:'object',additionalProperties:true,description:'Tất cả cột của bản ghi AuditLogs nguyên gốc.'},user:{type:'object',nullable:true,properties:{id,username:text(100),fullName:text(150),email:{type:'string',format:'email'},status:text(30),roleId:id,roleCode:text(30),roleName:text(100)}}}};
 logList.responses[200]={description:'Danh sách nhật ký đầy đủ có phân trang.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:logItem},total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}}}}}}}};

 return spec;
}
