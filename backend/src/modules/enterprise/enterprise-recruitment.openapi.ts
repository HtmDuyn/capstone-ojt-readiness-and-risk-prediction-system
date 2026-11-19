type Spec = Record<string, any>;
export function addEnterpriseRecruitmentOperations(spec: Spec) {
  const id = {type:'integer',minimum:1,maximum:2147483647};
  const text = (maxLength:number) => ({type:'string',minLength:1,maxLength});
  const time = {type:'string',format:'date-time'};
  const position = {type:'object',additionalProperties:false,required:['title','description','requirements','capacity'],properties:{id,title:text(150),description:text(20000),requirements:text(20000),capacity:{type:'integer',minimum:0,maximum:2147483647},location:{...text(1000),nullable:true},workMode:{type:'string',nullable:true,enum:['ONSITE','REMOTE','HYBRID']}}};
  const positionResponse = {...position,additionalProperties:true,properties:{...position.properties,code:{type:'string',nullable:true},status:{type:'string'},remainingSlots:{type:'integer',minimum:0}}};
  const fields = {status:{type:'string',enum:['DRAFT','PUBLISHED'],default:'DRAFT',description:'Lưu nháp hoặc công bố ngay trong Hạn 1. Chỉ tin DRAFT được sửa.'},title:text(500),content:text(30000),benefits:{...text(10000),nullable:true},applicationInstructions:{...text(10000),nullable:true},
    deadlineAt:{...time,deprecated:true,description:'Tương thích client cũ: backend bỏ qua giá trị này. Doanh nghiệp không được đặt hoặc sửa hạn.'},
    positions:{type:'array',minItems:1,maxItems:50,items:position}};
  const page = {page:id,limit:{...id,maximum:100}};
  const add = (method:string,path:string,summary:string,filters:Spec={},properties?:Spec,required:string[]=[],status=200) => {
    spec.paths[path] ??= {};
    spec.paths[path][method] = {tags:['Enterprise'],summary,security:[{bearerAuth:[]}],
      description:'Chỉ ENTERPRISE. Phạm vi doanh nghiệp lấy từ JWT. Tạo và công bố tin chỉ trong Hạn 1. Tin DRAFT đã lưu vẫn được sửa, lưu và xóa mềm khi hết hạn hoặc sinh viên đang xét tuyển. Tin PUBLISHED không được sửa nhưng được xóa mềm trong Hạn 1; hết Hạn 1 không được xóa. Xóa mềm chuyển ARCHIVED và ghi ArchivedAt, ẩn với sinh viên, giữ nguyên nội dung/vị trí/lịch sử để xem tại deleted-posts. Không có thao tác đóng/khóa hoặc khôi phục tin trong API doanh nghiệp. Hạn 2 chỉ ứng tuyển tin còn PUBLISHED. Giữ nguyên lịch hạn do QHDN quản lý.',
      parameters:[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id})).concat(Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema}))),
      ...(properties ? {requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:1,properties,required}}}}} : {}),
      responses:{[status]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid fields'},401:{description:'JWT required'},403:{description:'Enterprise membership required'},404:{description:'Record not found'},409:{description:'Workflow, deadline or capacity conflict'}}};
  };
  add('get','/api/enterprise/recruitment/windows','Xem đợt tuyển dụng và hạn doanh nghiệp được đăng tin',{...page,academicPeriodId:id});
  add('get','/api/enterprise/recruitment/posts','Danh sách tổng hợp tin, đầy đủ vị trí, mô tả và chỉ tiêu',{...page,windowId:id,postId:id,positionId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED'],description:'CLOSED chỉ gồm tin đã công bố và hết hạn ứng tuyển. Danh sách loại trừ tin từng bị đóng thủ công.'}});
  add('get','/api/enterprise/recruitment/deleted-posts','Xem lại các tin đã xóa mềm của doanh nghiệp, chỉ đọc',{...page,windowId:id,postId:id,positionId:id});
  add('post','/api/enterprise/recruitment/posts','Tạo tin nháp hoặc công bố tin ngay trong Hạn 1',{}, {windowId:id,idempotencyKey:{...text(100),description:'Optional retry key. Reuse the same key and payload to return the existing post with replayed=true; a different payload, including status, returns 409.'},...fields},['windowId','title','content','positions'],201);
  add('patch','/api/enterprise/recruitment/posts/{id}','Chỉnh sửa tin nháp hoặc lưu và công bố trong Hạn 1',{},fields);
  add('post','/api/enterprise/recruitment/posts/{id}/publish','Công bố tin nháp trong Hạn 1');
  add('delete','/api/enterprise/recruitment/posts/{id}','Xóa mềm tin nháp hoặc tin Published còn trong Hạn 1');
  const windows = spec.paths['/api/enterprise/recruitment/windows'].get;
  windows.description = 'Xem lịch hạn do QHDN quản lý, không giới hạn danh sách doanh nghiệp tham gia. accepting/canCreate và khả năng công bố chỉ khả dụng trong Hạn 1. Với đợt cũ, không công bố khi sinh viên đăng ký OJT. Quyền canEdit ở cấp tin DRAFT độc lập với hạn đăng tin: vẫn sửa và lưu được khi sinh viên xét tuyển. Hạn ứng tuyển của tin do QHDN quản lý.';
  const windowResponse = {type:'object',properties:{id,ojtSemesterId:id,academicPeriodId:id,periodCode:{type:'string'},periodName:{type:'string'},name:{type:'string'},
    startsAt:{...time,description:'Bắt đầu cho phép doanh nghiệp đăng/chỉnh sửa tin.'},endsAt:{...time,description:'Hạn cuối doanh nghiệp đăng/chỉnh sửa tin.'},
    status:{type:'string',enum:['DRAFT','OPEN','CLOSED']},accepting:{type:'boolean',description:'Hiện có cho phép doanh nghiệp tạo tin hay không.'},canCreate:{type:'boolean'},canEdit:{type:'boolean'},
    postingDeadlineAt:time,deadlineManagedBy:{type:'string',enum:['QHDN']},editLockCode:{type:'string',nullable:true},studentRegistrationWindow:{type:'object',nullable:true,properties:{id,name:{type:'string'},startsAt:time,endsAt:time}},createdAt:time,updatedAt:time}};
  windows.responses[200].content = {'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:windowResponse},total:{type:'integer'},page:id,limit:id}}}}}};
  const update = spec.paths['/api/enterprise/recruitment/posts/{id}'].patch;
  update.description = 'Chỉ sửa tin DRAFT thuộc doanh nghiệp trong JWT. Mặc định tiếp tục lưu DRAFT, kể cả đã hết Hạn 1 hoặc sinh viên đang xét tuyển. status=PUBLISHED lưu và công bố nguyên tử, chỉ trong Hạn 1; ngoài hạn trả 409. Tin PUBLISHED không sửa được nhưng có thể xóa mềm trong Hạn 1 qua DELETE. Tin đã xóa chỉ được xem lại. Nếu gửi positions phải giữ đủ vị trí cũ kèm id. Không nhận windowId/companyId; deadlineAt do QHDN quản lý. Vị trí nháp ở CLOSED; công bố chuyển OPEN.';
  update.requestBody.content['application/json'].examples = {
    content:{summary:'Chỉnh sửa nội dung tin',value:{title:'Tuyển thực tập sinh Backend',content:'Phát triển API và hệ thống nội bộ',benefits:'Có mentor hướng dẫn'}},
    positions:{summary:'Sửa vị trí và chỉ tiêu (thay id bằng ID vị trí thực, giữ đủ vị trí cũ)',value:{positions:[{id:6,title:'Backend Intern',description:'Phát triển REST API',requirements:'TypeScript và PostgreSQL',capacity:5,location:'TP.HCM',workMode:'HYBRID'}]}}
  };
  spec.paths['/api/enterprise/recruitment/posts'].get.responses[200].content = {'application/json':{schema:{type:'object',properties:{
    success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{id,windowId:id,title:text(500),content:text(30000),status:{type:'string'},publishedAt:{...time,nullable:true},deadlineAt:time,postingDeadlineAt:time,deadlineManagedBy:{type:'string',enum:['QHDN']},requiresReview:{type:'boolean',enum:[false]},canEdit:{type:'boolean'},canDelete:{type:'boolean'},canPublish:{type:'boolean'},deleted:{type:'boolean'},deletedAt:{...time,nullable:true},editLockCode:{type:'string',nullable:true},studentRegistrationWindow:windowResponse.properties.studentRegistrationWindow,positions:{type:'array',items:positionResponse}}}},
      total:{type:'integer'},page:id,limit:id,summary:{type:'object',properties:{totalPosts:{type:'integer'},totalPositions:{type:'integer'},totalCapacity:{type:'integer'},acceptedStudents:{type:'integer'},remainingSlots:{type:'integer'}}}}}
  }}}};
  spec.paths['/api/enterprise/recruitment/deleted-posts'].get.responses[200].content = spec.paths['/api/enterprise/recruitment/posts'].get.responses[200].content;
}
