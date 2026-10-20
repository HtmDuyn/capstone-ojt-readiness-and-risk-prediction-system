// Enterprise evaluation is the official source. Applied before and after response decorators.
const id = {type:'integer',minimum:1};
const score = {type:'number',minimum:0,maximum:10};
const text = {type:'string'};
const item = {type:'object',properties:{
  id,evaluationId:id,assignmentId:id,studentId:id,companyId:id,positionId:id,programId:id,
  studentCode:text,fullName:text,enterpriseName:text,ojtSemesterId:id,semesterCode:text,
  status:{type:'string',enum:['CONFIRMED']},officialScore:score,
  completionScore:{...score,nullable:true},attitudeScore:{...score,nullable:true},skillScore:{...score,nullable:true},
  comments:{type:'string',nullable:true},evaluatedBy:id,confirmedBy:id,confirmedAt:{type:'string',format:'date-time'},
  source:{type:'string',enum:['ENTERPRISE_EVALUATION']},
  outcome:{type:'string',nullable:true,description:'No pass/fail threshold is inferred from a score.'}
}};
const parameters = [
  ...['resultId','studentId','ojtSemesterId','page','limit'].map(name=>({in:'query',name,schema:id})),
  {in:'query',name:'status',schema:{type:'string',enum:['CONFIRMED']}},
  {in:'query',name:'search',schema:text}
];
const responses = {200:{description:'Official enterprise scores',content:{'application/json':{schema:{type:'object',properties:{
  success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:item},total:{type:'integer'},page:id,limit:id}}
}}}}},401:{description:'Authentication required'},403:{description:'Role not permitted'}};
const officialResultPaths: Record<string,any> = {
  '/api/ojt-results':{get:{tags:['OJT results'],
    summary:'Danh sách điểm OJT chính thức do doanh nghiệp đánh giá',
    description:'OverallScore của đánh giá SUBMITTED là điểm chính thức; phòng đào tạo không nhập lại hoặc xác nhận. resultId là EvaluationID.',
    security:[{bearerAuth:[]}],parameters,responses}},
  '/api/ojt-semesters/{id}/results/export':{get:{tags:['OJT results'],summary:'Xuất danh sách điểm OJT chính thức',
    security:[{bearerAuth:[]}],parameters:[{in:'path',name:'id',required:true,schema:id},
      ...parameters.filter(p=>!['page','limit'].includes(p.name)),
      {in:'query',name:'format',schema:{type:'string',enum:['csv','json','pdf']}}],responses}}
};
export function describeOfficialResults(spec:Record<string,any>) {
  Object.assign(spec.paths, structuredClone(officialResultPaths));
}
