type Schema = Record<string, any>;
const id = {type:'integer',minimum:1};
const text = {type:'string'};
const date = {type:'string',format:'date'};
const time = {type:'string',format:'date-time'};
const score = {type:'number',nullable:true};
const object = (properties:Schema):Schema => ({type:'object',properties});
const strings = (...names:string[]):Schema => Object.fromEntries(names.map(name=>[name,{...text,nullable:true}]));
const page = (item:Schema):Schema => object({items:{type:'array',items:item},total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}});
const history = {
  history:{type:'array',items:object({id,actorId:id,action:text,detail:{type:'object',additionalProperties:true},createdAt:time})},
  historyPagination:object({total:{type:'integer',minimum:0},page:id,limit:{...id,maximum:100}})
};
const company = object({id,...strings('code','name','address','industry','contactPersonName','contactPhone','contactEmail','status'),createdAt:time,...history});
const position = object({id,companyId:id,companyName:text,ojtSemesterId:id,...strings('recruitmentCode','title','description','requirements','status','location','workMode'),capacity:{type:'integer'},remainingSlots:{type:'integer'},...history});
const evaluation = {...object({id,templateId:{...id,nullable:true},scoreDetails:{type:'object',nullable:true,additionalProperties:true},completionScore:score,attitudeScore:score,skillScore:score,overallScore:score,...strings('comments','status'),evaluatedBy:id,evaluatedAt:time}),nullable:true};
const assignment = object({
  id,coordinationId:id,studentId:id,companyId:id,positionId:id,ojtSemesterId:id,academicSupervisorId:{...id,nullable:true},
  ...strings('studentCode','fullName','companyName','positionTitle','enterpriseSupervisorName','status'),startDate:date,endDate:date,
  student:object({id,...strings('studentCode','fullName','email','phone')}),company,
  academicSupervisor:{...object({id,...strings('fullName','email','phone')}),nullable:true},
  position:object({id,...strings('code','title','description','requirements','location','workMode'),ojtSemesterId:id}),evaluation,
  result:{...object({id,status:text,version:id,officialScore:score,outcome:{...text,nullable:true},confirmedAt:{...time,nullable:true},evaluationLocked:{type:'boolean'}}),nullable:true},...history
});
const template = object({id,code:text,version:id,name:text,criteria:{type:'array',items:object({code:text,name:text,weight:{type:'number'},maxScore:{type:'number'}})},status:text,createdAt:time,publishedAt:{...time,nullable:true}});
const model = object({id,code:text,version:text,name:text,status:text,metrics:{type:'object',additionalProperties:true},featureSchema:{type:'object',additionalProperties:true},createdAt:time});
const intervention = object({id,alertId:id,studentId:id,description:text,assignedTo:id,dueDate:{...date,nullable:true},status:text,outcome:{...text,nullable:true},createdBy:id,createdAt:time,updatedAt:time});
const alert = object({id,predictionId:id,studentId:id,studentCode:text,fullName:text,ojtSemesterId:id,riskLevel:text,riskScore:score,status:text,resolutionNote:{...text,nullable:true},createdAt:time,updatedAt:time,updatedBy:{...id,nullable:true},interventions:page(intervention)});

// Document the retained search operations as full records, not a separate detail contract.
export function describeMergedSearchResponses(spec:Schema):void {
  for(const [path,item]of Object.entries({'/api/companies':company,'/api/positions':position,'/api/assignments':assignment,'/api/assessment-templates':template,'/api/admin/models':model,'/api/alerts':alert})){
    const operation=spec.paths?.[path]?.get;
    if(!operation)throw new Error('Missing consolidated search operation: '+path);
    operation.responses['200']={description:'Danh sách hồ sơ đầy đủ, có phân trang.',content:{'application/json':{schema:object({success:{type:'boolean'},data:page(item)})}}};
  }
}
