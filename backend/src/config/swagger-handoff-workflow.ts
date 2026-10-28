// Applied after generic Swagger decorators so role/body constraints match the workflow handlers.
export function describeHandoffWorkflow(spec:Record<string,any>){
 const id={type:'integer',minimum:1,maximum:2147483647},text={type:'string'},security=[{bearerAuth:[]}];
 const body=(properties:Record<string,any>,required:string[])=>({required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties,required}}}});
 const responses={200:{description:'Thành công'},400:{description:'Dữ liệu không hợp lệ'},401:{description:'Chưa đăng nhập'},403:{description:'Sai quyền'},404:{description:'Không tìm thấy'},409:{description:'Trạng thái hoặc dữ liệu không đáp ứng quy trình'}};
 const handoff=spec.paths['/api/ojt-semesters/{id}/eligible-student-handoffs'].post;
 handoff.summary='Bàn giao sinh viên đủ điều kiện cho QHDN trước đăng ký';
 handoff.description='ACADEMIC chọn studentIds có kết quả ELIGIBLE đã xác nhận và còn hiệu lực cho kỳ OJT. Không yêu cầu hồ sơ đăng ký; không đổi trạng thái hồ sơ lịch sử. registrationIds không còn là đầu vào.';
 handoff.requestBody=body({studentIds:{type:'array',items:id,minItems:1,maxItems:1000,uniqueItems:true},idempotencyKey:text,reason:text},['studentIds','idempotencyKey','reason']);
 handoff.responses={...responses,201:{description:'Danh sách đủ điều kiện đã bàn giao',content:{'application/json':{example:{success:true,data:{handoffId:1,ojtSemesterId:1,studentIds:[1],total:1,recipientRole:'OJT_COORD',replayed:false}}}}}};
 const descriptions:Record<string,string>={
  '/api/ojt-semesters/{id}/eligible-student-handoffs':'Lịch sử các đợt bàn giao danh sách đủ điều kiện. studentIds và studentCount lấy từ các mục bàn giao; registrationIds chỉ phục vụ lịch sử cũ.',
  '/api/ojt-semesters/{id}/students':'Danh sách theo kỳ dành cho Admin/Đào tạo/Sinh viên theo quyền hiện có. QHDN dùng GET /api/qhdn/registered-students với ojtSemesterId và studentId để xem tiến độ và chi tiết.',
  '/api/qhdn/registered-students':'QHDN xem tiến độ hồ sơ theo kỳ từ toàn bộ sinh viên đã bàn giao, gồm NOT_REGISTERED/SUBMITTED/APPROVED và trạng thái bổ sung/đối soát. Chưa nộp có registration=null, registrations=[]. Kèm ứng tuyển và điều phối độc lập. Admin giữ danh sách đã đăng ký hiện có. Không có bước xác nhận nhận bàn giao.',
  '/api/ojt-registrations':'Hồ sơ đăng ký dành cho Admin/Sinh viên; STUDENT chỉ xem hồ sơ của mình. QHDN dùng GET /api/qhdn/registered-students. status/registrationStatus trả LEGACY_REVIEW_REQUIRED cho HANDED_OFF cũ; legacyStatus giữ nguyên giá trị lịch sử. handoffStatus luôn lấy từ bảng bàn giao.',
  '/api/students/{id}/cv':'QHDN được xem CV sinh viên đã có bàn giao; không yêu cầu sinh viên phải đăng ký trước.'
 };
 for(const [path,description]of Object.entries(descriptions))if(spec.paths[path]?.get)spec.paths[path].get.description=description;
 for(const method of ['post','patch']){
  const path=method==='post'?'/api/ojt-registration-windows':'/api/ojt-registration-windows/{id}';const op=spec.paths[path]?.[method];
  if(op){
   const schema=op.requestBody?.content?.['application/json']?.schema;
   if(schema?.required)schema.required=schema.required.filter((name:string)=>name!=='academicPeriodId');
   if(schema?.properties?.academicPeriodId)schema.properties.academicPeriodId.description='Mặc định từ kỳ OJT; nếu truyền phải khớp kỳ đã chọn.';
   if(schema?.properties?.requiredRelativeSemester)schema.properties.requiredRelativeSemester.description='Metadata tương thích; quyền đăng ký dựa trên danh sách đã bàn giao.';
   op.description='API quản lý đợt đăng ký của ADMIN. QHDN dùng PUT /api/qhdn/ojt-semesters/{id}/registration-settings. Tạo ở DRAFT; PATCH status OPEN/CLOSED và reason để mở/đóng. Chỉ mở khi phạm vi có sinh viên đã bàn giao. academicPeriodId mặc định từ kỳ OJT và phải khớp kỳ đã chọn. requiredRelativeSemester là metadata tương thích, không thay thế điều kiện bàn giao.';
  }
 }
 spec.paths['/api/ojt-registrations'].post.description='STUDENT nộp hồ sơ của mình kèm postId/positionId, tạo hồ sơ OJT và ứng tuyển trong cùng transaction. Cần doanh nghiệp đã import theo kỳ, vị trí đang nhận còn chỉ tiêu, danh sách bàn giao cùng kỳ và đợt OPEN trong thời hạn, đúng scope. ADMIN giữ đầu vào nhập thay với studentId; QHDN không có quyền nộp hộ.';
 spec.paths['/api/ojt-registrations/{id}/review'].post.description='ADMIN/OJT_COORD duyệt hoặc từ chối hồ sơ đã nộp; không phải bước xét/bàn giao của ACADEMIC. Hồ sơ đã điều phối không được duyệt lại.';
 spec.paths['/api/ojt-results'].post={tags:['OJT results'],summary:'QHDN chốt và chuyển kết quả về Phòng đào tạo',security,requestBody:body({assignmentId:id,reason:text,idempotencyKey:text},['assignmentId','reason','idempotencyKey']),responses:{...responses,201:{description:'PENDING_ACADEMIC_CONFIRMATION'}}};
 spec.paths['/api/ojt-results/{id}/confirm']={post:{tags:['OJT results'],summary:'Phòng đào tạo xác nhận và ghi nhận điểm OJT',description:'Dùng bảng quy đổi điểm đã cấu hình; lưu StudentCourseResults và CONFIRMED trong cùng transaction. Không ghi đè điểm học vụ đang tồn tại.',security,parameters:[{name:'id',in:'path',required:true,schema:id}],requestBody:body({reason:text,idempotencyKey:text},['reason','idempotencyKey']),responses}};
 const describeStates=(node:any):void=>{
  if(!node||typeof node!=='object')return;
  if(node.properties?.status?.enum?.includes('HANDED_OFF')){
   node.properties.status.enum=[...node.properties.status.enum.filter((v:string)=>v!=='HANDED_OFF'),'LEGACY_REVIEW_REQUIRED'];
   node.properties.registrationStatus={...node.properties.status};
   node.properties.legacyStatus={type:'string',nullable:true,description:'Giá trị lịch sử chưa được đối soát; không suy ra quyền bàn giao.'};
   node.properties.handoffStatus={type:'string',enum:['HANDED_OFF','NOT_HANDED_OFF'],description:'Lấy từ mục bàn giao thật theo sinh viên và kỳ OJT.'};
  }
  for(const value of Object.values(node))if(value&&typeof value==='object')describeStates(value);
 };
 for(const path of ['/api/qhdn/registered-students','/api/ojt-registrations','/api/ojt-semesters/{id}/students'])describeStates(spec.paths[path]?.get?.responses);
 const result=spec.paths['/api/ojt-results'].get;
 result.summary='Danh sách kết quả OJT đã được QHDN chuyển';result.description='resultId là OJTResults.ResultID. Chỉ kết quả được ACADEMIC xác nhận mới chính thức. Sinh viên chỉ xem CONFIRMED.';
 for(const path of ['/api/ojt-results','/api/ojt-semesters/{id}/results/export','/api/students/me/ojt-results']){
  const op=spec.paths[path]?.get;if(!op)continue;
  const status=op.parameters?.find((p:any)=>p.name==='status');if(status)status.schema.enum=['PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED'];
  const item=op.responses?.[200]?.content?.['application/json']?.schema?.properties?.data?.properties?.items?.items;
  if(item?.properties){item.properties.status={type:'string',enum:['PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED']};item.properties.officialScore={type:'number',nullable:true};item.properties.source={type:'string',enum:['ACADEMIC_CONFIRMATION']};item.properties.confirmedBy={...id,nullable:true};item.properties.confirmedAt={type:'string',format:'date-time',nullable:true};item.properties.outcome={type:'string',enum:['PASSED','FAILED'],nullable:true};}
 }
}
