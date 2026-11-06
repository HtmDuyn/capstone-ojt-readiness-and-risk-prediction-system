type Spec = Record<string, any>;
export function addEnterpriseRecruitmentOperations(spec: Spec) {
  const id = {type:'integer',minimum:1,maximum:2147483647};
  const text = (maxLength:number) => ({type:'string',minLength:1,maxLength});
  const time = {type:'string',format:'date-time'};
  const position = {type:'object',additionalProperties:false,required:['title','description','requirements','capacity'],properties:{id,title:text(150),description:text(20000),requirements:text(20000),capacity:{type:'integer',minimum:0,maximum:2147483647},location:{...text(1000),nullable:true},workMode:{type:'string',nullable:true,enum:['ONSITE','REMOTE','HYBRID']}}};
  const positionResponse = {...position,additionalProperties:true,properties:{...position.properties,code:{type:'string',nullable:true},status:{type:'string'},remainingSlots:{type:'integer',minimum:0}}};
  const fields = {title:text(500),content:text(30000),benefits:{...text(10000),nullable:true},applicationInstructions:{...text(10000),nullable:true},deadlineAt:time,positions:{type:'array',minItems:1,maxItems:50,items:position}};
  const page = {page:id,limit:{...id,maximum:100}};
  const add = (method:string,path:string,summary:string,filters:Spec={},properties?:Spec,required:string[]=[],status=200) => {
    spec.paths[path] ??= {};
    spec.paths[path][method] = {tags:['Enterprise'],summary,security:[{bearerAuth:[]}],
      description:'ENTERPRISE only. Company scope comes from JWT membership. Create/edit requires an OPEN intake within startsAt/endsAt and automatically submits to QHDN (PENDING_REVIEW). Published posts can be edited before the intake deadline and must be reviewed again; closed/archived posts stay locked. Capacity may decrease only to or above the confirmed student count for each position. remainingSlots is capacity minus non-cancelled assignments. Approved enterprise posts with vacancies automatically continue in the next open intake of the same OJT semester.',
      parameters:[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id})).concat(Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema}))),
      ...(properties ? {requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:1,properties,required}}}}} : {}),
      responses:{[status]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid fields'},401:{description:'JWT required'},403:{description:'Enterprise membership required'},404:{description:'Record not found'},409:{description:'Workflow, deadline or capacity conflict'}}};
  };
  add('get','/api/enterprise/recruitment/windows','Xem đợt tuyển dụng và hạn doanh nghiệp được đăng tin',{...page,academicPeriodId:id});
  add('get','/api/enterprise/recruitment/posts','Danh sách tổng hợp tin, đầy đủ vị trí, mô tả và chỉ tiêu',{...page,windowId:id,postId:id,positionId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED']}});
  add('post','/api/enterprise/recruitment/posts','Tạo tin và tự động gửi QHDN duyệt',{}, {windowId:id,...fields},['windowId','title','content','deadlineAt','positions'],201);
  add('patch','/api/enterprise/recruitment/posts/{id}','Cập nhật / chỉnh sửa tin tuyển dụng của doanh nghiệp',{},fields);
  const windows = spec.paths['/api/enterprise/recruitment/windows'].get;
  windows.description = 'Xem các đợt do QHDN thiết lập. startsAt là thời điểm bắt đầu đăng tin; endsAt là hạn cuối doanh nghiệp được tạo/chỉnh sửa tin. accepting=true khi đợt OPEN, đang trong thời gian cho phép và học kỳ còn khả dụng. deadlineAt của tin là hạn sinh viên ứng tuyển, khác với endsAt của đợt đăng tin. Chỉ role ENTERPRISE được dùng endpoint này.';
  const windowResponse = {type:'object',properties:{id,ojtSemesterId:id,academicPeriodId:id,periodCode:{type:'string'},periodName:{type:'string'},name:{type:'string'},
    startsAt:{...time,description:'Bắt đầu cho phép doanh nghiệp đăng/chỉnh sửa tin.'},endsAt:{...time,description:'Hạn cuối doanh nghiệp đăng/chỉnh sửa tin.'},
    status:{type:'string',enum:['DRAFT','OPEN','CLOSED']},accepting:{type:'boolean',description:'Hiện có cho phép doanh nghiệp đăng/chỉnh sửa tin hay không.'},createdAt:time,updatedAt:time}};
  windows.responses[200].content = {'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:windowResponse},total:{type:'integer'},page:id,limit:id}}}}}};
  const update = spec.paths['/api/enterprise/recruitment/posts/{id}'].patch;
  update.description = 'Chỉnh sửa tin thuộc doanh nghiệp trong JWT. Lấy id từ GET /api/enterprise/recruitment/posts. Chỉ gửi các trường cần đổi; không gửi windowId/companyId/status. Được sửa DRAFT/PENDING_REVIEW/REJECTED/PUBLISHED khi đợt OPEN, đã bắt đầu và chưa hết endsAt; tin CLOSED/ARCHIVED không được sửa. Nếu gửi positions phải giữ đủ các vị trí cũ kèm id; vị trí mới không có id. Cho phép giảm capacity nhưng không thấp hơn số sinh viên đã xác nhận tại từng vị trí (không tính phân công đã hủy); backend đếm lại trong transaction cùng khóa với thao tác nhận sinh viên. Ví dụ đã xác nhận 3 sinh viên: capacity=3 được chấp nhận, capacity=2 trả 409 CAPACITY_BELOW_ACCEPTED. Lưu thành công tự chuyển PENDING_REVIEW để QHDN duyệt lại, giữ nguyên sinh viên đã nhận và không cần gọi API gửi duyệt.';
  update.requestBody.content['application/json'].examples = {
    content:{summary:'Chỉnh sửa nội dung tin',value:{title:'Tuyển thực tập sinh Backend',content:'Phát triển API và hệ thống nội bộ',benefits:'Có mentor hướng dẫn'}},
    positions:{summary:'Sửa vị trí và chỉ tiêu (thay id bằng ID vị trí thực, giữ đủ vị trí cũ)',value:{positions:[{id:6,title:'Backend Intern',description:'Phát triển REST API',requirements:'TypeScript và PostgreSQL',capacity:5,location:'TP.HCM',workMode:'HYBRID'}]}}
  };
  spec.paths['/api/enterprise/recruitment/posts'].get.responses[200].content = {'application/json':{schema:{type:'object',properties:{
    success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{id,windowId:id,title:text(500),content:text(30000),positions:{type:'array',items:positionResponse}}}},
      total:{type:'integer'},page:id,limit:id,summary:{type:'object',properties:{totalPosts:{type:'integer'},totalPositions:{type:'integer'},totalCapacity:{type:'integer'},acceptedStudents:{type:'integer'},remainingSlots:{type:'integer'}}}}}
  }}}};
}
