import { addEnterpriseRecruitmentOperations } from './enterprise-recruitment.openapi';
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
  const bulkIds={type:'array',minItems:1,maxItems:200,uniqueItems:true,items:id};
  for(const [endpoint,summary,confirm] of [['acceptance-preview','Preview selected candidates and company capacity per semester',false],['accept-bulk','Accept selected candidates atomically; explicitly confirm any over-capacity intake',true]] as const){
    const properties={candidateIds:bulkIds,...(confirm?{confirmationToken:{type:'string',maxLength:64},allowOverCapacity:{type:'boolean'},reason:{type:'string',maxLength:2000}}:{})};
    add('post','/api/enterprise/candidates/'+endpoint,summary,[],{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:confirm?['candidateIds','confirmationToken','allowOverCapacity','reason']:['candidateIds'],properties}}}});
  }
  add('get','/api/enterprise/profile','Hồ sơ doanh nghiệp đang đăng nhập',[]);
  const optionalText=(maxLength:number)=>({type:'string',maxLength,nullable:true});
  add('patch','/api/enterprise/profile','Cập nhật hồ sơ doanh nghiệp đã được import',[],{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:2,required:['companyId'],properties:{companyId:{...id,description:'ID doanh nghiệp đã được import, phải thuộc tài khoản đăng nhập.'},name:{type:'string',minLength:1,maxLength:200},address:optionalText(300),industry:optionalText(100),contactPersonName:optionalText(100),contactPhone:optionalText(20),contactEmail:{...optionalText(100),format:'email'},positionTitle:{...optionalText(100),description:'Chức danh của tài khoản đang đăng nhập tại doanh nghiệp.'}}},example:{companyId:1,name:'Công ty ABC',address:'123 Nguyễn Văn Linh, TP. Hồ Chí Minh',industry:'Công nghệ thông tin',contactPersonName:'Nguyễn Thị Mai',contactPhone:'0901234567',contactEmail:'hr@example.com',positionTitle:'Trưởng phòng nhân sự'}}}});
  const profileUpdate=spec.paths['/api/enterprise/profile'].patch;
  profileUpdate.description='Chỉ sửa hồ sơ doanh nghiệp đã có từ import. companyId bắt buộc cùng ít nhất một trường cần sửa. Trường bỏ qua giữ nguyên; null hoặc chuỗi rỗng xóa trường tùy chọn. name không được rỗng. Không sửa mã, trạng thái, tài khoản đăng nhập và không tạo/sửa tin hay vị trí tuyển dụng. positionTitle thuộc tài khoản hiện tại; fullName/phone cá nhân sửa qua /api/accounts/me/profile.';
  profileUpdate.responses['200']={description:'Hồ sơ doanh nghiệp sau cập nhật, không kèm tin tuyển dụng.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{id,code:{type:'string'},name:{type:'string'},address:optionalText(300),industry:optionalText(100),contactPersonName:optionalText(100),contactPhone:optionalText(20),contactEmail:optionalText(100),status:{type:'string'},createdAt:{type:'string',format:'date-time',nullable:true},representative:{type:'object',properties:{id,userId:id,username:{type:'string'},fullName:{type:'string'},email:{type:'string'},phone:optionalText(20),positionTitle:optionalText(100)}}}}}}}}};

  add('get','/api/enterprise/candidate-periods','Danh sách năm học và kỳ OJT có hồ sơ được giới thiệu cho doanh nghiệp đang đăng nhập',[]);
  spec.paths['/api/enterprise/candidate-periods'].get.responses['200']={
    description:'Năm học và kỳ OJT có hồ sơ mới nhất được giới thiệu cho doanh nghiệp đang đăng nhập.',
    content:{'application/json':{schema:{type:'object',properties:{
      success:{type:'boolean'},
      data:{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{
        academicYearId:id,academicYearCode:{type:'string'},ojtSemesterId:id,semesterCode:{type:'string'},
        semesterName:{type:'string'},academicPeriodId:{...id,nullable:true},
        academicPeriodName:{type:'string',nullable:true},startDate:{type:'string',format:'date',nullable:true},
        endDate:{type:'string',format:'date',nullable:true},
      }}}}},
    }}}},
  };
  add('get','/api/enterprise/candidates','Danh sách sinh viên được giới thiệu cho doanh nghiệp đang đăng nhập, kèm vị trí và trạng thái tiếp nhận',parameters({...page,academicYearId:{...id,description:'Lọc theo năm học của kỳ OJT, tùy chọn.'},candidateId:{...id,description:'Lọc theo ID lần giới thiệu, tùy chọn.'},decision:{type:'string',enum:['PENDING','ACCEPTED','REJECTED'],description:'Lọc theo trạng thái tiếp nhận, tùy chọn.'}}));
  spec.paths['/api/enterprise/candidates'].get.description += ' application chứa email/số điện thoại/ghi chú đã điền trong đơn; jobApplication chứa thư ứng tuyển, chứng chỉ, thời gian nộp, CV đã gửi và skills từ đúng CV đó đã được sinh viên xác nhận. skills ở cấp ứng viên là kỹ năng trong hồ sơ sinh viên.';
  add('get','/api/enterprise/candidates/{id}/cv','Xem hoặc tải CV đã gửi trong đơn ứng tuyển',candidateId);
  spec.paths['/api/enterprise/candidates/{id}/cv'].get.description='Chỉ ENTERPRISE thuộc doanh nghiệp nhận hồ sơ. id là CoordinationID. Trả đúng CV đính kèm đơn, hỗ trợ cả StudentCVFiles và StudentCVVersions; không lấy CV mới nhất và không nhận studentId/cvFileId từ client. Không có CV hoặc hồ sơ ngoài doanh nghiệp trả 404.';
  spec.paths['/api/enterprise/candidates/{id}/cv'].get.responses['200']={description:'Nội dung PDF; Cache-Control: private, no-store.',content:{'application/pdf':{schema:{type:'string',format:'binary'}}}};
  add('patch','/api/enterprise/candidates/{id}/decision','Tiếp nhận hoặc từ chối ứng viên',candidateId,spec.paths['/api/ojt-coordinations/{id}/decision'].post.requestBody);
  add('get','/api/enterprise/internships','Danh sách đầy đủ sinh viên thực tập thuộc doanh nghiệp đang đăng nhập, kèm phân công, vị trí và đánh giá',parameters({...page,internshipId:{...id,description:'Lọc theo ID phân công thực tập, tùy chọn.'},status:{type:'string',enum:['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED','CANCELED','FAILED'],description:'Lọc theo trạng thái thực tập, tùy chọn.'}}));
  spec.paths['/api/enterprise/internships'].get.description += ' template chứa bộ tiêu chí Đào tạo áp dụng theo ngày bắt đầu kỳ OJT, kể cả sinh viên chưa có đánh giá. Bản đã gửi giữ bộ tiêu chí đã sử dụng. template=null nghĩa là chưa được mở chấm điểm.';
  add('get','/api/enterprise/internships/grading-criteria','Bộ tiêu chí do Đào tạo ban hành áp dụng cho phân công thực tập', [{in:'query',name:'assignmentId',required:true,schema:id}]);
  spec.paths['/api/enterprise/internships/grading-criteria'].get.description='Chỉ doanh nghiệp sở hữu phân công được đọc. Lấy bộ PUBLISHED mới nhất có ngày hiệu lực không sau ngày bắt đầu kỳ OJT; tiếp tục áp dụng cho các kỳ sau đến khi có phiên bản mới. Chưa có quy ước trả id=null và criteria=[].';
  add('put','/api/enterprise/internships/{id}/evaluation','Gửi đánh giá chính thức theo tiêu chí và trọng số do Đào tạo ban hành',candidateId,spec.paths['/api/assignments/{id}/internship-evaluation'].put.requestBody);
  const score={type:'number',minimum:0,maximum:10,multipleOf:0.01,nullable:true};
  const scoreDetails={type:'object',minProperties:1,maxProperties:20,additionalProperties:score,description:'Đúng các key trong template.criteria. DRAFT cho phép null; SUBMITTED bắt buộc đủ điểm 0–10 cho mọi tiêu chí.'};
  add('post','/api/enterprise/internships/evaluations/bulk','Lưu nháp hoặc xác nhận gửi điểm OJT hàng loạt',[],{required:true,content:{'application/json':{schema:{
    type:'object',additionalProperties:false,required:['items','status','reason'],properties:{
      status:{type:'string',enum:['DRAFT','SUBMITTED']},
      confirmed:{type:'boolean',description:'Bắt buộc true khi gửi SUBMITTED sau popup xác nhận.'},
      reason:{type:'string',minLength:1,maxLength:2000},
      items:{type:'array',minItems:1,maxItems:300,items:{type:'object',additionalProperties:false,required:['assignmentId','templateId','scoreDetails'],properties:{
        assignmentId:id,templateId:{...id,description:'ID bộ tiêu chí từ template của sinh viên; backend kiểm tra phiên bản áp dụng trước khi lưu.'},
        scoreDetails,comments:optionalText(5000),
      }}},
    },
  }}}});
  spec.paths['/api/enterprise/internships/evaluations/bulk'].post.description='Chỉ ENTERPRISE và các phân công thuộc doanh nghiệp đang đăng nhập. Bắt buộc có bộ tiêu chí do Đào tạo ban hành. templateId và các key scoreDetails phải khớp bộ đang áp dụng. Backend tự tính overallScore=SUM(điểm × tỷ lệ)/100, làm tròn 2 chữ số; không dùng điểm tổng hoặc 3 cột cố định từ client. DRAFT cho phép điểm null, tổng null nếu chưa đủ điểm, EvaluatedAt=null. SUBMITTED cần đủ mọi tiêu chí và confirmed=true. Đã gửi không thể sửa; retry cùng nội dung an toàn. Toàn bộ batch trong một transaction, lỗi bất kỳ hồ sơ nào rollback tất cả. Không tự chuyển giao kết quả học vụ.';
  const singleSchema=spec.paths['/api/enterprise/internships/{id}/evaluation'].put.requestBody.content['application/json'].schema;
  singleSchema.required=['templateId','scoreDetails','reason'];
  singleSchema.properties={templateId:id,scoreDetails,comments:optionalText(5000),reason:{type:'string',minLength:1,maxLength:2000}};
  spec.paths['/api/enterprise/internships/{id}/evaluation'].put.description='Chỉ doanh nghiệp sở hữu phân công được gửi. Bắt buộc templateId và đầy đủ scoreDetails khớp quy ước do Đào tạo ban hành. Backend tự tính tổng theo trọng số; chưa ban hành hoặc sai phiên bản trả 409. Điểm đã gửi được khóa.';
  addEnterpriseRecruitmentOperations(spec);
}
