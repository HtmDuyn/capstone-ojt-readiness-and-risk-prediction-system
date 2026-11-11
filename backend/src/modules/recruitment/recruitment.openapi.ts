type Spec=Record<string,any>;
export function addRecruitmentOperations(spec:Spec) {
 const id={type:'integer',minimum:1,maximum:2147483647},text=(maxLength:number)=>({type:'string',maxLength}),time={type:'string',format:'date-time'};
 const page={page:{...id,default:1},limit:{...id,maximum:100,default:20}},reason=text(2000);
 const add=(method:string,path:string,summary:string,roles:string[],filters:Spec={},body?:Spec,required:string[]=[])=>{
  const parameters=[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id}));
  parameters.push(...Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema})));
  spec.paths[path]??={};spec.paths[path][method]={tags:roles.includes('ENTERPRISE')?['Enterprise','QHDN recruitment']:['QHDN recruitment'],summary,
   description:'Roles: '+roles.join(' / ')+'. Each child has posting, application and response intervals. Posting ends before applications begin. Responses start with applications and end later. Undecided applications are automatically rejected after the response deadline and flagged for QHDN follow-up. Opening the next round requires finalized results from the previous round.',
   security:[{bearerAuth:[]}],parameters,
   ...(body?{requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,properties:body,required}}}}}:{}),
   responses:{[method==='post'&&path==='/api/recruitment/windows'?201:200]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid input'},401:{description:'JWT required'},403:{description:'Role or ownership denied'},404:{description:'Not found'},409:{description:'Closed, expired, duplicate or invalid workflow state'}}};
 };
 const staff=['ADMIN','OJT_COORD'],read=[...staff,'ENTERPRISE'];
 const allRoles=['ADMIN','ACADEMIC','OJT_COORD','ENTERPRISE','STUDENT'];
 add('get','/api/accounts/me/notifications','List own notifications and unread count',allRoles,page);
 add('patch','/api/accounts/me/notifications/{id}','Mark own notification as read',allRoles,{}, {isRead:{type:'boolean',enum:[true]}},['isRead']);
 add('get','/api/qhdn/placements','List handed-off students, coordination history and actual receipts',staff,{ojtSemesterId:id});
 add('post','/api/qhdn/placements','QHDN immediately re-coordinates rejected students; other unplaced students follow final recruitment summaries',staff,{}, {studentId:id,ojtSemesterId:id,positionId:id,source:{type:'string',enum:['QHDN_APPLICATION','QHDN_COORDINATION']},reason},['studentId','ojtSemesterId','positionId','source','reason']);
 add('post','/api/qhdn/placements/{id}/receive','Record actual receipt after enterprise acceptance; exceeding capacity is allowed with a reason',staff,{},{reason},['reason']);
 const phaseKeys=['postingStartsAt','postingEndsAt','applicationStartsAt','applicationEndsAt','resultsStartsAt','resultsEndsAt'];
 const child={type:'object',additionalProperties:false,required:['name',...phaseKeys],properties:{name:text(150),...Object.fromEntries(phaseKeys.map(key=>[key,time]))}};
 const window={academicPeriodId:id,name:text(150),startsAt:time,endsAt:time,reason,supplemental:{type:'boolean',default:false},rounds:{type:'array',minItems:1,maxItems:30,items:child}};
 add('post','/api/recruitment/windows','Create a recruitment intake with posting, application and response intervals',staff,{},window,['academicPeriodId','name','startsAt','endsAt','rounds']);
 add('get','/api/recruitment/windows','List campaign rounds, current phase and result summaries',staff,{academicPeriodId:id});
 add('post','/api/recruitment/windows/{id}/finalize','Reject overdue pending applications and finalize recruitment summary',staff,{},{reason},['reason']);
 add('patch','/api/recruitment/windows/{id}','Open/close a round, or extend ends of currently open phases without reopening intake',staff,{},{name:text(150),status:{type:'string',enum:['OPEN','CLOSED']},reason,postingEndsAt:time,applicationEndsAt:time,resultsEndsAt:time});
 add('get','/api/recruitment/posts','Danh sách tin tuyển dụng kèm vị trí và chỉ tiêu',read,{...page,companyId:{...id,description:"Enterprise ID; enterprise accounts may only select their own company. Omit status to include all states."},postId:id,windowId:id,academicPeriodId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','CLOSED','ARCHIVED']}});
 add('post','/api/recruitment/posts/{id}/review','QHDN duyệt công bố hoặc từ chối tin',staff,{}, {decision:{type:'string',enum:['PUBLISH','REJECT']},reason,deadlineAt:time},['decision','reason']);
 add('post','/api/recruitment/posts/{id}/close','QHDN đóng tin và ngừng nhận vào các vị trí liên quan',staff,{}, {reason},['reason']);
}
