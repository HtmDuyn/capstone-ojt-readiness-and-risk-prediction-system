type Spec = Record<string, any>;

export function addEnterpriseOperations(spec: Spec) {
  const id = {type:'integer',minimum:1,maximum:2147483647};
  const parameters = (fields: Spec) => Object.entries(fields).map(([name,schema])=>({in:'query',name,schema}));
  const page = {
    studentId:{...id,description:'Lọc theo ID hồ sơ sinh viên, tùy chọn.'},
    page:{...id,description:'Trang kết quả; bỏ qua page và limit để lấy toàn bộ danh sách.'},
    limit:{...id,maximum:100,description:'Số kết quả mỗi trang; bỏ qua page và limit để lấy toàn bộ danh sách.'},
    ojtSemesterId:{...id,description:'Lọc theo kỳ OJT, tùy chọn.'},
    positionId:{...id,description:'Lọc theo vị trí thực tập, tùy chọn.'},
    search:{type:'string',maxLength:100,description:'Tìm theo mã sinh viên hoặc họ tên, tùy chọn.'},
  };
  const add = (method: string,path: string,summary: string,params: Spec[],body?: Spec) => {
    spec.paths[path] = {...(spec.paths[path]??{}),[method]:{
      tags:['Enterprise'],summary,
      description:'Chỉ dành cho ENTERPRISE. Backend xác định doanh nghiệp từ tài khoản trong JWT; không cần truyền companyId. Bộ lọc và phân trang là tùy chọn; bỏ qua page và limit để lấy toàn bộ danh sách. candidateId là CoordinationID, internshipId là AssignmentID.',
      security:[{bearerAuth:[]}],parameters:params,
      ...(body ? {requestBody:structuredClone(body)} : {}),
      responses:{200:{description:'Thành công: {success:true,data:...}'},400:{description:'Dữ liệu không hợp lệ'},401:{description:'Cần đăng nhập'},403:{description:'Sai vai trò hoặc không thuộc doanh nghiệp'},404:{description:'Không tìm thấy hồ sơ'},409:{description:'Trạng thái không cho phép hoặc đánh giá đã bị khóa'}}
    }};
  };
  const candidateId = [{in:'path',name:'id',required:true,schema:id}];
  add('get','/api/enterprise/profile','Hồ sơ doanh nghiệp đang đăng nhập',[]);
  const optionalText=(maxLength:number)=>({type:'string',maxLength,nullable:true});
  add('patch','/api/enterprise/profile','Cập nhật hồ sơ doanh nghiệp đã được import',[],{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:2,required:['companyId'],properties:{companyId:{...id,description:'ID doanh nghiệp đã được import, phải thuộc tài khoản đăng nhập.'},name:{type:'string',minLength:1,maxLength:200},address:optionalText(300),industry:optionalText(100),contactPersonName:optionalText(100),contactPhone:optionalText(20),contactEmail:{...optionalText(100),format:'email'},positionTitle:{...optionalText(100),description:'Chức danh của tài khoản đang đăng nhập tại doanh nghiệp.'}}},example:{companyId:1,name:'Công ty ABC',address:'123 Nguyễn Văn Linh, TP. Hồ Chí Minh',industry:'Công nghệ thông tin',contactPersonName:'Nguyễn Thị Mai',contactPhone:'0901234567',contactEmail:'hr@example.com',positionTitle:'Trưởng phòng nhân sự'}}}});
  const profileUpdate=spec.paths['/api/enterprise/profile'].patch;
  profileUpdate.description='Chỉ sửa hồ sơ doanh nghiệp đã có từ import. companyId bắt buộc cùng ít nhất một trường cần sửa. Trường bỏ qua giữ nguyên; null hoặc chuỗi rỗng xóa trường tùy chọn. name không được rỗng. Không sửa mã, trạng thái, tài khoản đăng nhập và không tạo/sửa tin hay vị trí tuyển dụng. positionTitle thuộc tài khoản hiện tại; fullName/phone cá nhân sửa qua /api/accounts/me/profile.';
  profileUpdate.responses['200']={description:'Hồ sơ doanh nghiệp sau cập nhật, không kèm tin tuyển dụng.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{id,code:{type:'string'},name:{type:'string'},address:optionalText(300),industry:optionalText(100),contactPersonName:optionalText(100),contactPhone:optionalText(20),contactEmail:optionalText(100),status:{type:'string'},createdAt:{type:'string',format:'date-time',nullable:true},representative:{type:'object',properties:{id,userId:id,username:{type:'string'},fullName:{type:'string'},email:{type:'string'},phone:optionalText(20),positionTitle:optionalText(100)}}}}}}}}};

  add('get','/api/enterprise/candidates','Danh sách đầy đủ sinh viên được giới thiệu cho doanh nghiệp đang đăng nhập, kèm vị trí và trạng thái tiếp nhận',parameters({...page,candidateId:{...id,description:'Lọc theo ID lần giới thiệu, tùy chọn.'},decision:{type:'string',enum:['PENDING','ACCEPTED','REJECTED'],description:'Lọc theo trạng thái tiếp nhận, tùy chọn.'}}));
  add('patch','/api/enterprise/candidates/{id}/decision','Tiếp nhận hoặc từ chối ứng viên',candidateId,spec.paths['/api/ojt-coordinations/{id}/decision'].post.requestBody);
  add('get','/api/enterprise/internships','Danh sách đầy đủ sinh viên thực tập thuộc doanh nghiệp đang đăng nhập, kèm phân công, vị trí và đánh giá',parameters({...page,internshipId:{...id,description:'Lọc theo ID phân công thực tập, tùy chọn.'},status:{type:'string',enum:['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED'],description:'Lọc theo trạng thái thực tập, tùy chọn.'}}));
  add('put','/api/enterprise/internships/{id}/evaluation','Gửi hoặc cập nhật đánh giá thực tập',candidateId,spec.paths['/api/assignments/{id}/internship-evaluation'].put.requestBody);
}
