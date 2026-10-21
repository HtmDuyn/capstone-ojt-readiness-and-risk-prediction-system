type Schema=Record<string,any>;
const id={type:'integer',minimum:1},text={type:'string'},time={type:'string',format:'date-time'};
const object=(properties:Schema):Schema=>({type:'object',properties});
const metadata=object({total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}});
const actor=object({id,fullName:text});
const event=object({id,version:id,action:text,snapshot:{type:'object',additionalProperties:true},reason:{...text,nullable:true},createdBy:id,createdAt:time,createdByUser:actor});

export function describeMergedDetailLists(spec:Schema) {
  const targets:[string,string,string[]][]=[
    ['/api/ojt-registrations','registrationId',['history','coordination','assignment']],
    ['/api/ojt-results','resultId',['history']],
    ['/api/academic-imports','importId',['rows']],
    ['/api/predictions','predictionId',[]],
  ];
  for(const [path,selector,prefixes]of targets){
    const operation=spec.paths[path]?.get;if(!operation)throw Error('Missing merged list: '+path);
    operation.parameters??=[];
    operation.parameters.push({name:selector,in:'query',required:false,schema:selector==='importId'?{type:'string',pattern:'^[1-9][0-9]{0,18}$'}:id,description:'Chọn một hồ sơ để trả thêm phần chi tiết.'});
    for(const prefix of prefixes)for(const suffix of ['Page','Limit'])operation.parameters.push({name:prefix+suffix,in:'query',required:false,schema:{...id,default:suffix==='Page'?1:20,...(suffix==='Limit'?{maximum:100}:{})},description:`Phân trang ${prefix}; chỉ dùng cùng ${selector}.`});
    operation.description=`Không có ${selector}: danh sách thông thường. Có ${selector}: trả thêm chi tiết trong data.items; phần lịch sử/dòng dữ liệu có phân trang riêng. Không khớp bộ lọc trả items rỗng.`;
    const response=operation.responses['200'];response.content??={};response.content['application/json']??={};
    const media=response.content['application/json'];
    media.schema??=object({success:{type:'boolean'},data:object({items:{type:'array',items:object({})},total:{type:'integer'},page:id,limit:id})});
    const fields=media.schema.properties.data.properties.items.items.properties??={};
    fields.id=selector==='importId'?{type:'string'}:id;
    if(prefixes.includes('history'))Object.assign(fields,{history:{type:'array',items:event},historyPagination:metadata});
    if(selector==='registrationId')Object.assign(fields,{
      studentId:id,studentCode:text,fullName:text,email:text,phone:{...text,nullable:true},ojtSemesterId:id,windowId:{...id,nullable:true},programId:id,currentProgramId:id,programCode:text,programName:text,cohortId:{...id,nullable:true},groupCode:{...text,nullable:true},status:text,registeredAt:time,updatedAt:time,submittedBy:id,
      window:{type:'object',nullable:true,additionalProperties:true},pathway:{type:'object',nullable:true,additionalProperties:true},review:{type:'object',nullable:true,additionalProperties:true},handoff:{type:'object',nullable:true,additionalProperties:true},
      officialEligibility:{type:'object',nullable:true,additionalProperties:true},handoffSnapshot:{type:'object',nullable:true,additionalProperties:true},
      coordination:{type:'array',items:{type:'object',additionalProperties:true}},coordinationPagination:metadata,
      assignments:{type:'array',items:{type:'object',additionalProperties:true}},assignmentsPagination:metadata,
    });
    if(selector==='importId')Object.assign(fields,{kind:text,status:text,sourceName:{...text,nullable:true},summary:{type:'object',additionalProperties:true},importedBy:id,createdAt:time,rows:{type:'array',items:object({rowNumber:id,rawData:{type:'object',additionalProperties:true},normalizedData:{type:'object',nullable:true,additionalProperties:true},status:text,errors:{type:'array',items:{type:'object',additionalProperties:true}},resultId:{...id,nullable:true}})},rowsPagination:metadata});
    if(selector==='predictionId')Object.assign(fields,{studentId:id,studentCode:text,fullName:text,jobId:id,ojtSemesterId:id,modelId:id,readinessScore:{type:'number',minimum:0,maximum:100},readinessLevel:text,riskScore:{type:'number',minimum:0,maximum:100},riskLevel:text,factors:{type:'array',items:{type:'object',additionalProperties:true}},modelSnapshot:{type:'object',additionalProperties:true},createdAt:time,inputSnapshot:{type:'object',additionalProperties:true,description:'Chỉ trả khi chọn predictionId.'}});
  }
}
