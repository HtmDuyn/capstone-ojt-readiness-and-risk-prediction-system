type Spec=Record<string,any>;
const id={type:'integer',minimum:1,maximum:2147483647},text={type:'string'},reason={...text,minLength:1,maxLength:2000},key={...text,minLength:1,maxLength:100};
const body=(properties:Spec,required:string[])=>({required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties,...(required.length?{required}:{})}}}});
const response=(properties:Spec,description='Thành công')=>({description,content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties}}}}}});
const resultFields={resultId:id,assignmentId:id,studentId:id,ojtSemesterId:id,status:{type:'string',enum:['PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED']},version:id,officialScore:{type:'number',nullable:true},outcome:{type:'string',nullable:true},courseResultId:{...id,nullable:true},confirmedAt:{type:'string',format:'date-time',nullable:true},replayed:{type:'boolean'}};

// Applied before strict role grouping and again after legacy decorators. Runtime
// services remain the source of truth for field names and mandatory inputs.
export function describeQhdnCompletion(spec:Spec):Spec{
  const operation=(path:string,method:string)=>spec.paths[path]?.[method];
  const create=operation('/api/ojt-coordinations','post');
  if(create){
    create.requestBody=body({registrationId:id,positionId:id,applicationId:{...id,description:'Tùy chọn; phải khớp hồ sơ và vị trí sinh viên đã ứng tuyển.'},reason,idempotencyKey:key},['registrationId','positionId','reason','idempotencyKey']);
    create.description='QHDN gửi hồ sơ đã duyệt và ứng tuyển hợp lệ sang doanh nghiệp. Không phân công nhiệm vụ hoặc quyết định thay doanh nghiệp.';
  }
  const reassign=operation('/api/ojt-coordinations/{id}/reassign','post');
  if(reassign)reassign.requestBody=body({positionId:id,reason,idempotencyKey:key},['positionId','reason','idempotencyKey']);
  const coordinations=operation('/api/ojt-coordinations','get');
  if(coordinations)coordinations.parameters=(coordinations.parameters??[]).filter((p:Spec)=>p.name!=='applicationId');
  const progress=operation('/api/qhdn/registered-students','get');
  if(progress){
    progress.description=(progress.description??'').replaceAll('status/registrationStatus','status');
    progress.parameters=(progress.parameters??[]).filter((p:Spec)=>p.name!=='registrationStatus');
    const semester=progress.parameters.find((p:Spec)=>p.name==='ojtSemesterId');
    if(semester)semester.description='Bắt buộc khi gọi bằng role OJT_COORD; Admin giữ bộ lọc tùy chọn.';
  }
  const opportunities=operation('/api/students/me/opportunities','get');
  if(opportunities){
    opportunities.parameters??=[];
    if(!opportunities.parameters.some((p:Spec)=>p.name==='windowId'))opportunities.parameters.push({in:'query',name:'windowId',required:false,schema:id});
    opportunities.description='Cho phép sinh viên đã bàn giao xem vị trí trước khi có hồ sơ. windowId trả về dùng trong POST /api/ojt-registrations để nộp hồ sơ và ứng tuyển cùng giao dịch. canApply kiểm tra lịch mở, scope, eligibility, import và chỉ tiêu.';
    const data=opportunities.responses?.['200']?.content?.['application/json']?.schema?.properties?.data;
    if(data){data.properties??={};Object.assign(data.properties,{windowId:{...id,nullable:true},submissionEndpoint:{type:'string',enum:['/api/ojt-registrations','/api/job-applications'],description:'Nộp lần đầu/hồ sơ bị từ chối dùng endpoint hợp nhất; hồ sơ đang có dùng API ứng tuyển hiện hữu với registrationId.'}});}
  }
  const decision=operation('/api/enterprise/candidates/{id}/decision','patch');
  if(decision){
    decision.requestBody=body({decision:{type:'string',enum:['ACCEPTED','REJECTED']},reason,startDate:{type:'string',format:'date',description:'Tùy chọn khi ACCEPTED; mặc định từ kỳ OJT.'},endDate:{type:'string',format:'date',description:'Tùy chọn khi ACCEPTED; phải thuộc kỳ OJT.'},enterpriseSupervisorName:{type:'string',maxLength:100}},['decision','reason']);
    decision.description='Doanh nghiệp quyết định hồ sơ trong phạm vi của mình. ACCEPTED tạo thực tập ACTIVE và giữ chỗ trong cùng transaction. Gửi lại quyết định giống nhau không tạo trùng assignment. REJECTED không tạo thực tập; QHDN có thể điều phối lại.';
    decision.responses['200']=response({id,decision:{type:'string'},assignmentId:{...id,nullable:true},assignment:{type:'object',nullable:true,additionalProperties:true},replayed:{type:'boolean'}});
  }
  const evaluation=operation('/api/enterprise/internships/{id}/evaluation','put');
  if(evaluation){
    evaluation.description='Lưu đánh giá doanh nghiệp và chuyển thực tập ACTIVE/IN_PROGRESS sang COMPLETED cùng transaction. Có thể sửa trước khi kết quả được Đào tạo xác nhận và trong thời hạn đánh giá; QHDN gửi lại kết quả nếu nguồn đánh giá thay đổi.';
    evaluation.responses['200']=response({id,assignmentId:id,overallScore:{type:'number',minimum:0,maximum:10},status:{type:'string',enum:['SUBMITTED']},assignmentStatus:{type:'string',enum:['COMPLETED']}});
  }
  const transfer=operation('/api/ojt-results','post');
  if(transfer){
    transfer.requestBody=body({assignmentId:id,reason,idempotencyKey:key,expectedVersion:{...id,description:'Bắt buộc khi gửi lại kết quả đã tồn tại; lấy version hiện tại từ GET /api/ojt-results.'}},['assignmentId','reason','idempotencyKey']);
    transfer.description='QHDN chuyển đánh giá của thực tập đã hoàn tất. Lần đầu tạo kết quả chờ Đào tạo; gửi lại dùng cùng assignmentId, expectedVersion hiện tại và idempotencyKey mới. Kết quả CONFIRMED không sửa được. Không thay đổi DB schema.';
    transfer.responses['201']=response(resultFields,'Kết quả mới hoặc kết quả đã được gửi lại');
  }
  const results=operation('/api/ojt-results','get');
  if(results){results.parameters??=[];if(!results.parameters.some((p:Spec)=>p.name==='resultId'))results.parameters.push({in:'query',name:'resultId',required:false,schema:id,description:'Chọn một kết quả, lấy version hiện tại trước khi gửi lại.'});}
  const confirm=operation('/api/ojt-results/{id}/confirm','post');
  if(confirm){confirm.requestBody=body({reason,idempotencyKey:key},['reason','idempotencyKey']);confirm.responses['200']=response(resultFields);}

  const add=(path:string,method:string,roles:string[],tags:string[],summary:string,parameters:Spec[],requestBody:Spec|undefined,responses:Spec)=>{
    const old=operation(path,method)??{};
    (spec.paths[path]??={})[method]={...old,summary,security:[{bearerAuth:[]}],tags:old.tags??tags,'x-roles':old['x-roles']??roles,parameters,...(requestBody?{requestBody}:{}),responses:{...responses,400:{description:'Request không hợp lệ'},401:{description:'Chưa đăng nhập'},403:{description:'Sai role hoặc phạm vi'},404:{description:'Không tìm thấy hồ sơ/CV'}}};
  };
  add('/api/enterprise/candidates/{id}/cv','get',['ENTERPRISE'],['Doanh nghiệp'],'Tải CV của hồ sơ đã được giới thiệu cho doanh nghiệp',[{in:'path',name:'id',required:true,schema:id}],undefined,{200:{description:'CV PDF, Cache-Control: private, no-store',content:{'application/pdf':{schema:{type:'string',format:'binary'}}}}});
  const analysis={id:{...id,nullable:true},cvFileId:id,status:{type:'string',enum:['NOT_ANALYSED','RUNNING','COMPLETED','FAILED']},result:{type:'object',nullable:true,properties:{summary:text,skills:{type:'array',items:text},education:{type:'array',items:text},experience:{type:'array',items:text},languages:{type:'array',items:text},modelVersion:text}},errorCode:{type:'string'},replayed:{type:'boolean'}};
  add('/api/students/me/cv-analysis','post',['STUDENT'],['Sinh viên'],'Phân tích CV đã upload; không yêu cầu kỳ đăng ký',[],body({cvFileId:{...id,description:'Tùy chọn; mặc định CV mới nhất của chính sinh viên.'}},[]),{200:response(analysis),409:{description:'CV đang được phân tích'},502:{description:'Dịch vụ AI lỗi hoặc trả sai cấu trúc'},503:{description:'AI_NOT_CONFIGURED: chưa có CV_ANALYSIS_SERVICE_URL'}});
  add('/api/students/me/cv-analysis','get',['STUDENT'],['Sinh viên'],'Xem kết quả phân tích CV của chính sinh viên',[{in:'query',name:'cvFileId',required:false,schema:id}],undefined,{200:response(analysis)});
  return spec;
}
