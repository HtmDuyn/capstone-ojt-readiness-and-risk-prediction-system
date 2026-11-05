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
      description:'ENTERPRISE only. Company scope comes from JWT membership. Create/edit requires an OPEN intake within startsAt/endsAt and automatically submits to QHDN (PENDING_REVIEW). Published posts are immutable. remainingSlots is capacity minus non-cancelled assignments. Approved enterprise posts with vacancies automatically continue in the next open intake of the same OJT semester.',
      parameters:[...path.matchAll(/\{([^}]+)\}/g)].map(m=>({in:'path',name:m[1],required:true,schema:id})).concat(Object.entries(filters).map(([name,schema])=>({in:'query',name,required:false,schema}))),
      ...(properties ? {requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,minProperties:1,properties,required}}}}} : {}),
      responses:{[status]:{description:'Success: {success:true,data:...}'},400:{description:'Invalid fields'},401:{description:'JWT required'},403:{description:'Enterprise membership required'},404:{description:'Record not found'},409:{description:'Workflow, deadline or capacity conflict'}}};
  };
  add('get','/api/enterprise/recruitment/windows','Danh sách đợt nhận tin doanh nghiệp',{...page,academicPeriodId:id});
  add('get','/api/enterprise/recruitment/posts','Danh sách tổng hợp tin, đầy đủ vị trí, mô tả và chỉ tiêu',{...page,windowId:id,postId:id,positionId:id,status:{type:'string',enum:['DRAFT','PENDING_REVIEW','REJECTED','PUBLISHED','CLOSED']}});
  add('post','/api/enterprise/recruitment/posts','Tạo tin và tự động gửi QHDN duyệt',{}, {windowId:id,...fields},['windowId','title','content','deadlineAt','positions'],201);
  add('patch','/api/enterprise/recruitment/posts/{id}','Sửa tin trước công bố và tự động gửi QHDN duyệt',{},fields);
  spec.paths['/api/enterprise/recruitment/posts'].get.responses[200].content = {'application/json':{schema:{type:'object',properties:{
    success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:{type:'object',properties:{id,windowId:id,title:text(500),content:text(30000),positions:{type:'array',items:positionResponse}}}},
      total:{type:'integer'},page:id,limit:id,summary:{type:'object',properties:{totalPosts:{type:'integer'},totalPositions:{type:'integer'},totalCapacity:{type:'integer'},acceptedStudents:{type:'integer'},remainingSlots:{type:'integer'}}}}}
  }}}};
}
