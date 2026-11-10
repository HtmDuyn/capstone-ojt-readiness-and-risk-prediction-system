type Spec=Record<string,any>;
export function addRecruitmentOperations(spec:Spec) {
 const id={type:'integer',minimum:1,maximum:2147483647},text=(maxLength:number)=>({type:'string',maxLength}),time={type:'string',format:'date-time'};
 const page={page:{...id,default:1},limit:{...id,maximum:100,default:20}},reason=text(2000);
 const add=(method:string,path:string,summary:string,roles:string[],filters:Spec={},body?:Spec,required:string[]=[])=>{
  const parameters=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id}));
  parameters.push(...Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema})));
  spec.paths[path]??={};spec.paths[path][method]={tags:roles.includes('ENTERPRISE')?['Enterprise','QHDN recruitment']:['QHDN recruitment'],summary,
   description:'Roles: '+roles.join(' / ')+'. QHDN manages child rounds within one campaign per OJT semester. Each child has one recruitment interval without separate phases. Opening the next round requires finalized results from the previous round.',
   security:[{bearerAuth:[]}],parameters,
   ...(body?{requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:body,required}}}}}:{}),
   responses:{[method==='post'&&path==='/api/recruitment/windows'?201:200]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid input'},401:{description:'JWT required'},403:{description:'Role or ownership denied'},404:{description:'Not found'},409:{description:'Closed, expired, duplicate or invalid workflow state'}}};
 };
 const staff=['ADMIN','OJT_COORD'],read=[...staff,'ENTERPRISE'];
 add('get','/api/qhdn/placements','List handed-off students, coordination history and actual receipts',staff,{ojtSemesterId:id});
 add('post','/api/qhdn/placements','QHDN supplements an enterprise candidate list after final recruitment',staff,{}, {studentId:id,ojtSemesterId:id,positionId:id,source:{type:'string',enum:['QHDN_APPLICATION','QHDN_COORDINATION']},reason},['studentId','ojtSemesterId','positionId','source','reason']);
 add('post','/api/qhdn/placements/{id}/receive','Record actual receipt after enterprise acceptance; exceeding capacity is allowed with a reason',staff,{},{reason},['reason']);
 const child={type:'object',additionalProperties:false,required:['name','startsAt','endsAt'],properties:{name:text(150),startsAt:time,endsAt:time}};
 const window={academicPeriodId:id,name:text(150),startsAt:time,endsAt:time,reason,rounds:{type:'array',minItems:1,maxItems:30,items:child}};
 add('post','/api/recruitment/windows','Create one OJT campaign and all its children atomically',staff,{},window,['academicPeriodId','name','startsAt','endsAt','rounds','reason']);
 add('get','/api/recruitment/windows','List campaign rounds, current phase and result summaries',staff,{academicPeriodId:id});
 add('post','/api/recruitment/windows/{id}/finalize','Finalize recruitment summary, preserving pending applications',staff,{},{reason},['reason']);
 add('patch','/api/recruitment/windows/{id}','Rename or open/close a round; deadlines cannot change',staff,{},{name:text(150),status:{type:'string',enum:['OPEN','CLOSED']},reason},['reason']);
 add('get','/api/recruitment/posts','Danh sách tin tuyển dụng kèm vị trí và chỉ tiêu',read,{...page,companyId:{...id,description:"Enterprise ID; enterprise accounts may only select their own company. Omit status to include all states."},postId:id,windowId:id,academicPeriodId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','CLOSED','ARCHIVED']}});
 add('post','/api/recruitment/posts/{id}/review','QHDN duyệt công bố hoặc từ chối tin',staff,{}, {decision:{type:'string',enum:['PUBLISH','REJECT']},reason,deadlineAt:time},['decision','reason']);
 add('post','/api/recruitment/posts/{id}/close','QHDN đóng tin và ngừng nhận vào các vị trí liên quan',staff,{}, {reason},['reason']);
}
