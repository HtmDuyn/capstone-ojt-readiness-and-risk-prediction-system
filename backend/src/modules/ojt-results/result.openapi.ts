// QHDN publishes enterprise evaluations directly to students.
const id = {type:'integer',minimum:1};
const score = {type:'number',minimum:0,maximum:10};
const text = {type:'string'};
const item = {type:'object',properties:{
  id,resultId:{...id,nullable:true},evaluationId:id,assignmentId:id,studentId:id,companyId:id,positionId:id,programId:id,
  studentCode:text,fullName:text,enterpriseName:text,ojtSemesterId:id,semesterCode:text,
  status:{type:'string',enum:['SUBMITTED','PUBLISHED','CONFIRMED']},officialScore:{...score,nullable:true},overallScore:{...score,nullable:true},
  completionScore:{...score,nullable:true},attitudeScore:{...score,nullable:true},skillScore:{...score,nullable:true},
  publishedToStudent:{type:'boolean',description:'true after QHDN has published this evaluation to the student.'},
  publishedAt:{type:'string',format:'date-time',nullable:true},
  confirmedAt:{type:'string',format:'date-time',nullable:true,description:'Compatibility alias for publication time in the unchanged Education view.'},
  comments:{type:'string',nullable:true},evaluatedBy:id,
  source:{type:'string',enum:['ENTERPRISE_EVALUATION','QHDN_PUBLICATION']},
  outcome:{type:'string',nullable:true,description:'No pass/fail threshold is inferred from a score.'}
}};
const parameters = [
  ...['resultId','studentId','ojtSemesterId','page','limit'].map(name=>({in:'query',name,schema:id})),
  {in:'query',name:'status',schema:{type:'string',enum:['SUBMITTED','PUBLISHED','CONFIRMED','PENDING_ACADEMIC_CONFIRMATION','REVISION_REQUESTED']},description:'QHDN: SUBMITTED/PUBLISHED. ACADEMIC: CONFIRMED reads published results; old pending/revision filters return empty lists.'},
  {in:'query',name:'includeUntransferred',deprecated:true,description:'Compatibility flag; all QHDN reads include submitted evaluations without an academic transfer.',schema:{type:'string',enum:['true','false']}},
  {in:'query',name:'search',schema:text}
];
const responses = {200:{description:'Official enterprise scores',content:{'application/json':{schema:{type:'object',properties:{
  success:{type:'boolean'},data:{type:'object',properties:{items:{type:'array',items:item},total:{type:'integer'},page:id,limit:id}}
}}}}},401:{description:'Authentication required'},403:{description:'Role not permitted'}};
const officialResultPaths: Record<string,any> = {
  '/api/ojt-results':{get:{tags:['OJT results'],
    summary:'Danh sách kết quả OJT và điểm đánh giá doanh nghiệp',
    description:'ADMIN/OJT_COORD xem điểm doanh nghiệp đã gửi: SUBMITTED chờ công bố, PUBLISHED đã công bố. ACADEMIC chỉ xem điểm QHDN đã công bố, trả status=CONFIRMED, officialScore=overallScore và confirmedAt=publishedAt để tương thích màn hình Đào tạo hiện có; không cần xác nhận. id/evaluationId là EvaluationID, resultId=null. Sinh viên chỉ xem điểm của mình sau công bố qua students/me/internships.',
    security:[{bearerAuth:[]}],parameters,responses}},
  '/api/ojt-results/publish':{post:{tags:['OJT results'],summary:'Công bố điểm OJT cho sinh viên',
    description:'QHDN công bố trực tiếp tất cả đánh giá đủ điều kiện trong kỳ hoặc chỉ định evaluationIds. Sau commit sinh viên xem ngay điểm/nhận xét. Tạo thông báo hệ thống, xếp email nếu có địa chỉ email; không cần xác nhận Đào tạo và không ghi StudentCourseResults. Lặp lại không công bố trùng; toàn bộ thao tác trong cùng transaction.',
    security:[{bearerAuth:[]}],requestBody:{required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,
      required:['ojtSemesterId','reason'],properties:{ojtSemesterId:id,evaluationIds:{type:'array',minItems:1,maxItems:500,items:id},reason:{type:'string',minLength:1,maxLength:2000}}}}}},
    responses:{202:{description:'Notifications created and emails queued',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{
      ojtSemesterId:id,eligible:{type:'integer'},published:{type:'integer'},alreadyPublished:{type:'integer'},skipped:{type:'integer'},queuedEmails:{type:'integer'}
    }}}}}}},401:{description:'Authentication required'},403:{description:'Role not permitted'}}}},
  '/api/ojt-semesters/{id}/results/export':{get:{tags:['OJT results'],summary:'Xuất danh sách điểm OJT chính thức',
    security:[{bearerAuth:[]}],parameters:[{in:'path',name:'id',required:true,schema:id},
      ...parameters.filter(p=>!['page','limit'].includes(p.name)),
      {in:'query',name:'format',schema:{type:'string',enum:['csv','json','pdf']}}],responses}}
};
export function describeOfficialResults(spec:Record<string,any>) {
  Object.assign(spec.paths, structuredClone(officialResultPaths));
}
