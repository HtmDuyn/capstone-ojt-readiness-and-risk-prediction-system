// Submitted enterprise scores and academic confirmation are distinct workflow states.
const id = {type:'integer',minimum:1};
const score = {type:'number',minimum:0,maximum:10};
const text = {type:'string'};
const item = {type:'object',properties:{
  id,resultId:{...id,nullable:true},evaluationId:id,assignmentId:id,studentId:id,companyId:id,positionId:id,programId:id,
  studentCode:text,fullName:text,enterpriseName:text,ojtSemesterId:id,semesterCode:text,
  status:{type:'string',enum:['SUBMITTED','PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED']},officialScore:{...score,nullable:true},overallScore:{...score,nullable:true},
  completionScore:{...score,nullable:true},attitudeScore:{...score,nullable:true},skillScore:{...score,nullable:true},
  comments:{type:'string',nullable:true},evaluatedBy:id,confirmedBy:id,confirmedAt:{type:'string',format:'date-time'},
  source:{type:'string',enum:['ENTERPRISE_EVALUATION','ACADEMIC_CONFIRMATION']},
  outcome:{type:'string',nullable:true,description:'No pass/fail threshold is inferred from a score.'}
}};
const parameters = [
  ...['resultId','studentId','ojtSemesterId','page','limit'].map(name=>({in:'query',name,schema:id})),
  {in:'query',name:'status',schema:{type:'string',enum:['SUBMITTED','PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED','CONFIRMED']}},
  {in:'query',name:'includeUntransferred',description:'true includes submitted enterprise evaluations before transfer. ADMIN/OJT_COORD only; default false preserves academic result reads.',schema:{type:'string',enum:['true','false'],default:'false'}},
  {in:'query',name:'search',schema:text}
];
const responses = {200:{description:'Official enterprise scores',content:{'application/json':{schema:{type:'object',properties:{
  success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:item},total:{type:'integer'},page:id,limit:id}}
}}}}},401:{description:'Authentication required'},403:{description:'Role not permitted'}};
const officialResultPaths: Record<string,any> = {
  '/api/ojt-results':{get:{tags:['OJT results'],
    summary:'Danh sách kết quả OJT và điểm đánh giá doanh nghiệp',
    description:'Mặc định chỉ trả kết quả đã chuyển giao. QHDN dùng includeUntransferred=true để xem cả đánh giá SUBMITTED ngay khi doanh nghiệp chấm điểm. overallScore là điểm doanh nghiệp, officialScore là điểm học vụ được ghi nhận. resultId là ResultID; bản ghi chưa chuyển giao có resultId=null và id=EvaluationID.',
    security:[{bearerAuth:[]}],parameters,responses}},
  '/api/ojt-semesters/{id}/results/export':{get:{tags:['OJT results'],summary:'Xuất danh sách điểm OJT chính thức',
    security:[{bearerAuth:[]}],parameters:[{in:'path',name:'id',required:true,schema:id},
      ...parameters.filter(p=>!['page','limit'].includes(p.name)),
      {in:'query',name:'format',schema:{type:'string',enum:['csv','json','pdf']}}],responses}}
};
export function describeOfficialResults(spec:Record<string,any>) {
  Object.assign(spec.paths, structuredClone(officialResultPaths));
}
