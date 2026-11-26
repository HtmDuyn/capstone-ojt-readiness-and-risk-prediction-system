// Applied after generic Swagger decorators so role/body constraints match the workflow handlers.
export function describeHandoffWorkflow(spec:Record<string,any>){
 const id={type:'integer',minimum:1,maximum:2147483647};
 const body=(properties:Record<string,any>,required:string[])=>({required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties,required}}}});
 const historicalHandoffs=spec.paths['/api/ojt-semesters/{id}/eligible-student-handoffs'];
 if(historicalHandoffs)delete historicalHandoffs.post;
 const descriptions:Record<string,string>={
  '/api/ojt-semesters/{id}/eligible-student-handoffs':'Lịch sử bàn giao từ quy trình cũ; danh sách xét hiện tại lấy trực tiếp từ kết quả đủ điều kiện và roster tuyển dụng.',
  '/api/ojt-semesters/{id}/students':'Danh sách theo kỳ: QHDN thấy roster đủ điều kiện hiện hành và hồ sơ lịch sử của kỳ. Sinh viên đủ điều kiện được vào đợt tuyển dụng đang mở hoặc ở trạng thái chờ; registration, handoff cũ, officialEligibility và assignment được trả riêng.',
  '/api/qhdn/registered-students':'Danh sách hồ sơ đã đăng ký. Roster đủ điều kiện trước khi ứng tuyển lấy từ /api/qhdn/eligible-students; trạng thái truy cập hiện hành được cấp từ kết quả ELIGIBLE đã lưu, các handoff trong lịch sử chỉ phục vụ hồ sơ cũ.',
  '/api/ojt-registrations':'Hồ sơ đăng ký: QHDN xem hồ sơ thuộc roster hiện hành hoặc hồ sơ lịch sử, STUDENT chỉ xem hồ sơ của mình. status/registrationStatus trả LEGACY_REVIEW_REQUIRED cho HANDED_OFF cũ; legacyStatus giữ nguyên giá trị lịch sử.',
  '/api/students/{id}/cv':'QHDN được xem CV sinh viên đủ điều kiện trong roster hiện hành hoặc có hồ sơ lịch sử; không yêu cầu sinh viên phải đăng ký trước.'
 };
 for(const [path,description]of Object.entries(descriptions))if(spec.paths[path]?.get)spec.paths[path].get.description=description;
 for(const method of ['post','patch']){
  const path=method==='post'?'/api/ojt-registration-windows':'/api/ojt-registration-windows/{id}';const op=spec.paths[path]?.[method];
  if(op){
   const schema=op.requestBody?.content?.['application/json']?.schema;
   if(schema?.required)schema.required=schema.required.filter((name:string)=>name!=='academicPeriodId');
   if(schema?.properties?.academicPeriodId)schema.properties.academicPeriodId.description='Mặc định từ kỳ OJT; nếu truyền phải khớp kỳ đã chọn.';
   if(schema?.properties?.requiredRelativeSemester)schema.properties.requiredRelativeSemester.description='Metadata tương thích; quyền đăng ký dựa trên roster đủ điều kiện hiện hành.';
   op.description='ADMIN/OJT_COORD tạo hoặc mở đợt đăng ký trong học kỳ chính đang diễn ra. Đợt được tạo ở trạng thái DRAFT. PATCH status OPEN/CLOSED và reason để mở hoặc đóng. Khi mở, phạm vi phải có sinh viên thuộc roster đủ điều kiện hiện hành. academicPeriodId mặc định từ kỳ OJT và phải khớp kỳ đã chọn. requiredRelativeSemester là kỳ tương đối 6.';
  }
 }
 spec.paths['/api/ojt-registrations'].post.description='Endpoint tương thích cho hồ sơ đăng ký OJT cũ; luồng mới STUDENT chọn vị trí và gửi trực tiếp bằng POST /api/job-applications. STUDENT chỉ nộp hồ sơ của mình; ADMIN có thể nhập thay. Bắt buộc thuộc roster đủ điều kiện cùng kỳ, đợt OPEN, trong thời hạn và đúng scope. Khi giao dịch đăng ký thành công, backend ghi OJT202 IN_PROGRESS theo kỳ OJT; khóa duy nhất và ON CONFLICT giữ thao tác lặp an toàn.';
 if(spec.paths['/api/students/me/opportunities']?.get){
  spec.paths['/api/students/me/opportunities'].get.summary='Danh sách vị trí doanh nghiệp để sinh viên ứng tuyển trực tiếp';
  spec.paths['/api/students/me/opportunities'].get.description='Bắt buộc windowId của đợt đăng ký đang mở. Chỉ trả về vị trí phù hợp kỳ OJT; canApply và blockers phản ánh roster eligibility, scope, trạng thái hồ sơ và chỉ tiêu.';
 }
 if(spec.paths['/api/job-applications']?.post){
  spec.paths['/api/job-applications'].post.summary='Sinh viên gửi hồ sơ trực tiếp đến doanh nghiệp';
  spec.paths['/api/job-applications'].post.description='POST tạo JobApplication và StudentEnterpriseCoordination PENDING trong cùng transaction, đồng thời ghi OJT202 IN_PROGRESS cho kỳ OJT. Khóa duy nhất và ON CONFLICT giữ thao tác lặp an toàn. QHDN không duyệt hoặc chuyển tiếp; khi doanh nghiệp chấp nhận, assignment được tạo tự động.';
  spec.paths['/api/job-applications'].post.requestBody=body({
   windowId:id,postId:id,positionId:id,coverLetter:{type:'string',maxLength:5000},
   certificates:{type:'array',maxItems:5,items:{type:'object',additionalProperties:false,required:['name','url'],properties:{name:{type:'string',maxLength:200},url:{type:'string',format:'uri',maxLength:2000}}}},
   application:{type:'object',additionalProperties:false,properties:{
    contactPhone:{type:'string',maxLength:30},contactEmail:{type:'string',maxLength:100},
    note:{type:'string',maxLength:2000}
   }}
  },['windowId','postId','positionId']);
 }
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
}
