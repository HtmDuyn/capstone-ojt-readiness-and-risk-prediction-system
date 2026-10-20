type Spec=Record<string,any>;
export function addRecruitmentOperations(spec:Spec) {
 const id={type:'integer',minimum:1,maximum:2147483647},text=(maxLength:number)=>({type:'string',maxLength}),time={type:'string',format:'date-time'};
 const page={page:{...id,default:1},limit:{...id,maximum:100,default:20}},reason=text(2000);
 const add=(method:string,path:string,summary:string,roles:string[],filters:Spec={},body?:Spec,required:string[]=[])=>{
  const parameters=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id}));
  parameters.push(...Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema})));
  spec.paths[path]??={};spec.paths[path][method]={tags:roles.includes('ENTERPRISE')?['Enterprise','QHDN recruitment']:['QHDN recruitment'],summary,
   description:'Roles: '+roles.join(' / ')+'. QHDN chọn học kỳ có sẵn; không khởi tạo kỳ OJT. Doanh nghiệp chỉ xem tin của mình và gửi nhu cầu trong thời gian nhận đơn. Vị trí chỉ mở sau công bố.',
   security:[{bearerAuth:[]}],parameters,
   ...(body?{requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:body,required}}}}}:{}),
   responses:{[method==='post'&&['/api/recruitment/windows','/api/recruitment/posts'].includes(path)?201:200]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid input'},401:{description:'JWT required'},403:{description:'Role or ownership denied'},404:{description:'Not found'},409:{description:'Closed, expired, duplicate or invalid workflow state'}}};
 };
 const staff=['ADMIN','OJT_COORD'],read=[...staff,'ENTERPRISE'];
 const window={academicPeriodId:id,name:text(150),startsAt:time,endsAt:time,reason};
 add('get','/api/recruitment/windows','Đợt nhận nhu cầu tuyển dụng theo học kỳ',read,{...page,academicPeriodId:id,status:{type:'string',enum:['DRAFT','OPEN','CLOSED']}});
 add('post','/api/recruitment/windows','QHDN tạo đợt từ học kỳ phòng đào tạo đã có',staff,{},window,['academicPeriodId','name','startsAt','endsAt','reason']);
 add('patch','/api/recruitment/windows/{id}','Cập nhật đợt nhận đơn tuyển dụng',staff,{},{...window,status:{type:'string',enum:['OPEN','CLOSED']}},['reason']);
 add('get','/api/recruitment/posts','Danh sách tin tuyển dụng kèm vị trí và chỉ tiêu',read,{...page,postId:id,windowId:id,academicPeriodId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','CLOSED','ARCHIVED']}});
 const position={type:'object',additionalProperties:false,required:['code','title','description','requirements','capacity'],properties:{code:text(60),title:text(150),description:text(10000),requirements:text(10000),capacity:{...id,maximum:100000}}};
 add('post','/api/recruitment/posts','Doanh nghiệp gửi nhu cầu tuyển dụng', ['ENTERPRISE'],{},
  {windowId:id,idempotencyKey:text(100),title:text(200),content:text(20000),benefits:text(10000),applicationInstructions:text(10000),deadlineAt:time,positions:{type:'array',minItems:1,maxItems:50,items:position}},
  ['windowId','idempotencyKey','title','content','positions']);
 const positionChange={type:'object',additionalProperties:false,minProperties:1,properties:{positionId:id,...position.properties,location:{...text(300),nullable:true},workMode:{type:'string',nullable:true,enum:['ONSITE','REMOTE','HYBRID']}}};
 add('patch','/api/recruitment/posts/{id}','Sửa tin và vị trí, gửi lại để QHDN duyệt',read,{},
  {title:text(200),content:text(20000),benefits:{...text(10000),nullable:true},applicationInstructions:{...text(10000),nullable:true},deadlineAt:time,positions:{type:'array',minItems:1,maxItems:50,items:positionChange},reason},['reason']);
 add('post','/api/recruitment/posts/{id}/review','QHDN duyệt công bố hoặc từ chối tin',staff,{}, {decision:{type:'string',enum:['PUBLISH','REJECT']},reason,deadlineAt:time},['decision','reason']);
 add('post','/api/recruitment/posts/{id}/close','QHDN đóng tin và ngừng nhận vào các vị trí liên quan',staff,{}, {reason},['reason']);
}
