type Spec = Record<string, any>;
export function addEnterpriseRecruitmentOperations(spec: Spec) {
  const id = {type:'integer',minimum:1,maximum:2147483647};
  const text = (maxLength:number) => ({type:'string',minLength:1,maxLength});
  const time = {type:'string',format:'date-time'};
  const position = {type:'object',additionalProperties:false,required:['title','description','requirements','capacity'],properties:{id,title:text(150),description:text(20000),requirements:text(20000),capacity:{type:'integer',minimum:0,maximum:2147483647},location:{...text(1000),nullable:true},workMode:{type:'string',nullable:true,enum:['ONSITE','REMOTE','HYBRID']}}};
  const positionResponse = {...position,additionalProperties:true,properties:{...position.properties,code:{type:'string',nullable:true},status:{type:'string'},remainingSlots:{type:'integer',minimum:0}}};
  const fields = {title:text(500),content:text(30000),benefits:{...text(10000),nullable:true},applicationInstructions:{...text(10000),nullable:true},
    deadlineAt:{...time,deprecated:true,description:'Tương thích client cũ: backend bỏ qua giá trị này. Doanh nghiệp không được đặt hoặc sửa hạn.'},
    positions:{type:'array',minItems:1,maxItems:50,items:position}};
  const page = {page:id,limit:{...id,maximum:100}};
  const add = (method:string,path:string,summary:string,filters:Spec={},properties?:Spec,required:string[]=[],status=200) => {
    spec.paths[path] ??= {};
    spec.paths[path][method] = {tags:['Enterprise'],summary,security:[{bearerAuth:[]}],
      description:'ENTERPRISE only. Company scope comes from JWT membership. Creation/updates publish immediately (PUBLISHED and OPEN positions); no QHDN review is required. The QHDN recruitment intake must be OPEN and within startsAt/endsAt. Updates are locked while any OJT student registration window of the same semester is OPEN and currently accepting registrations. Creating a new post remains allowed. Deadlines are managed by QHDN, not company requests. Capacity cannot be lower than confirmed students. Closed/archived posts stay locked.',
      parameters:[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id})).concat(Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema}))),
      ...(properties ? {requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:1,properties,required}}}}} : {}),
      responses:{[status]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid fields'},401:{description:'JWT required'},403:{description:'Enterprise membership required'},404:{description:'Record not found'},409:{description:'Workflow, deadline or capacity conflict'}}};
  };
  add('get','/api/enterprise/recruitment/windows','Xem đợt tuyển dụng và hạn doanh nghiệp được đăng tin',{...page,academicPeriodId:id});
  add('get','/api/enterprise/recruitment/posts','Danh sách tổng hợp tin, đầy đủ vị trí, mô tả và chỉ tiêu',{...page,windowId:id,postId:id,positionId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED']}});
  add('post','/api/enterprise/recruitment/posts','Tạo và công bố tin ngay cho sinh viên, không cần QHDN duyệt',{}, {windowId:id,...fields},['windowId','title','content','positions'],201);
  add('patch','/api/enterprise/recruitment/posts/{id}','Cập nhật / chỉnh sửa tin tuyển dụng của doanh nghiệp',{},fields);
  const windows = spec.paths['/api/enterprise/recruitment/windows'].get;
  windows.description = 'Xem thời hạn đăng tuyển do QHDN quản lý; doanh nghiệp chỉ đọc. accepting/canCreate=true khi đợt OPEN, trong thời gian cho phép và học kỳ khả dụng. canEdit còn yêu cầu không có đợt OJTRegistrationWindows cùng kỳ đang OPEN trong StartsAt/EndsAt. studentRegistrationWindow và editLockCode giải thích việc khóa sửa. Hạn ứng tuyển của tin là dữ liệu QHDN, khác với endsAt của đợt doanh nghiệp đăng tin.';
  const windowResponse = {type:'object',properties:{id,ojtSemesterId:id,academicPeriodId:id,periodCode:{type:'string'},periodName:{type:'string'},name:{type:'string'},
    startsAt:{...time,description:'Bắt đầu cho phép doanh nghiệp đăng/chỉnh sửa tin.'},endsAt:{...time,description:'Hạn cuối doanh nghiệp đăng/chỉnh sửa tin.'},
    status:{type:'string',enum:['DRAFT','OPEN','CLOSED']},accepting:{type:'boolean',description:'Hiện có cho phép doanh nghiệp tạo tin hay không.'},canCreate:{type:'boolean'},canEdit:{type:'boolean'},
    postingDeadlineAt:time,deadlineManagedBy:{type:'string',enum:['QHDN']},editLockCode:{type:'string',nullable:true},studentRegistrationWindow:{type:'object',nullable:true,properties:{id,name:{type:'string'},startsAt:time,endsAt:time}},createdAt:time,updatedAt:time}};
  windows.responses[200].content = {'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:windowResponse},total:{type:'integer'},page:id,limit:id}}}}}};
  const update = spec.paths['/api/enterprise/recruitment/posts/{id}'].patch;
  update.description = 'Sửa tin thuộc doanh nghiệp trong JWT, kể cả đã PUBLISHED, khi đợt đăng tuyển OPEN và chưa hết hạn. Không được sửa khi đợt đăng ký OJT hàng loạt của cùng kỳ đang OPEN và trong thời gian đăng ký: trả 409 RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION. Đợt chưa bắt đầu/đã hết hạn/đã đóng hoặc khác kỳ không gây khóa này. Tin CLOSED/ARCHIVED vẫn không được sửa. Nếu gửi positions phải giữ đủ vị trí cũ kèm id; chỉ tiêu không thấp hơn số sinh viên đã xác nhận. Lưu thành công vẫn PUBLISHED, vị trí OPEN, sinh viên thấy ngay, không cần QHDN duyệt và không thay đổi phân công. Không gửi windowId/companyId/status; deadlineAt từ client cũ bị bỏ qua, hạn QHDN lưu sẵn được giữ nguyên kể cả bằng endsAt.';
  update.requestBody.content['application/json'].examples = {
    content:{summary:'Chỉnh sửa nội dung tin',value:{title:'Tuyển thực tập sinh Backend',content:'Phát triển API và hệ thống nội bộ',benefits:'Có mentor hướng dẫn'}},
    positions:{summary:'Sửa vị trí và chỉ tiêu (thay id bằng ID vị trí thực, giữ đủ vị trí cũ)',value:{positions:[{id:6,title:'Backend Intern',description:'Phát triển REST API',requirements:'TypeScript và PostgreSQL',capacity:5,location:'TP.HCM',workMode:'HYBRID'}]}}
  };
  spec.paths['/api/enterprise/recruitment/posts'].get.responses[200].content = {'application/json':{schema:{type:'object',properties:{
    success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{id,windowId:id,title:text(500),content:text(30000),status:{type:'string'},publishedAt:time,deadlineAt:time,postingDeadlineAt:time,deadlineManagedBy:{type:'string',enum:['QHDN']},requiresReview:{type:'boolean',enum:[false]},canEdit:{type:'boolean'},editLockCode:{type:'string',nullable:true},studentRegistrationWindow:windowResponse.properties.studentRegistrationWindow,positions:{type:'array',items:positionResponse}}}},
      total:{type:'integer'},page:id,limit:id,summary:{type:'object',properties:{totalPosts:{type:'integer'},totalPositions:{type:'integer'},totalCapacity:{type:'integer'},acceptedStudents:{type:'integer'},remainingSlots:{type:'integer'}}}}}
  }}}};
}
