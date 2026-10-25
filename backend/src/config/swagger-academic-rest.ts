type Spec = Record<string, any>;

// Only retire operations that have a replacement. Shared routes retain their
// other business roles, since their authorization and consumers still exist.
export function describeAcademicRest(spec: Spec): Spec {
  const source = structuredClone(spec.paths);
  const add = (path: string, method: string, from: string, oldMethod: string, summary: string, body?: Spec) => {
    const old = source['/api' + from]?.[oldMethod];
    if (!old) throw new Error(`Missing REST documentation source: ${oldMethod} ${from}`);
    const operation = structuredClone(old);
    operation.summary = summary;
    operation.operationId = method + '_api_' + path.replace(/[^a-zA-Z0-9]/g, '_');
    operation.tags = ['Phòng đào tạo'];
    operation['x-roles'] = ['ADMIN', 'ACADEMIC'];
    operation.parameters = [...path.matchAll(/\{([^}]+)\}/g)].map(m => ({name:m[1],in:'path',required:true,schema:{type:m[1]==='id'&&path.includes('notifications')?'string':'integer'}}));
    if (method === 'get') delete operation.requestBody;
    else if (body) operation.requestBody = {required:true,content:{'application/json':{schema:body}}};
    operation.responses = { [method==='post'?'201':'200']: {description:'Kết quả đầy đủ của tài nguyên.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:{type:'object',additionalProperties:true}}}}}} };
    (spec.paths['/api'+path] ??= {})[method] = operation;
  };
  const id = {type:'integer',minimum:1};
  const object = {type:'object',additionalProperties:true};
  const commit = {type:'object',required:['id','status'],additionalProperties:false,properties:{id,status:{type:'string',enum:['COMMITTED']}}};
  add('/assessment-windows','get','/ojt-semesters/{id}/assessment-window','get','Danh sách đợt xét điều kiện');
  add('/assessment-windows','post','/ojt-semesters/{id}/assessment-window','put','Tạo đợt xét điều kiện',object);
  add('/assessment-windows','patch','/ojt-semesters/{id}/assessment-window','put','Cập nhật đợt xét hoặc trạng thái mở/đóng',{...object,required:['id'],properties:{id,status:{type:'string',enum:['OPEN','CLOSED']}}});
  add('/ojt-rule-sets','patch','/ojt-rule-sets/{id}','patch','Cập nhật hoặc ban hành bộ quy tắc',{...object,required:['id'],properties:{id,status:{type:'string',enum:['PUBLISHED']}}});
  add('/ojt-semesters','get','/ojt-semesters/{id}/students','get','Danh sách kỳ OJT');
  add('/ojt-semesters/{id}','get','/ojt-semesters/{id}/students','get','Chi tiết kỳ OJT, sinh viên, bàn giao và kết quả');
  add('/ojt-grade-mappings','put','/curricula/{id}/ojt-grade-mappings/{semesterId}','put','Thiết lập quy đổi điểm OJT',{...object,required:['programId','ojtSemesterId'],properties:{programId:id,ojtSemesterId:id}});
  for (const method of ['get','post']) add('/eligible-student-handoffs',method,'/ojt-semesters/{id}/eligible-student-handoffs',method,method==='get'?'Lịch sử bàn giao sinh viên':'Bàn giao sinh viên đủ điều kiện',method==='post'?{...object,required:['ojtSemesterId'],properties:{ojtSemesterId:id}}:undefined);
  add('/academic-notifications','get','/academic/advisory-runs','get','Lịch sử thông báo học vụ');
  add('/academic-notifications/{id}','get','/academic/advisory-runs/{id}','get','Chi tiết thông báo và trạng thái từng sinh viên');
  add('/academic-notifications','post','/academic/academic-summary-notifications','post','Tạo thông báo học vụ theo loại',{...object,required:['type'],properties:{type:{type:'string',enum:['ALERT','SUMMARY','ELIGIBILITY']}}});
  for (const [path,from] of [['student-imports','imports'],['curriculum-imports','curriculum-imports']]) {
    add('/'+path,'get','/academic-imports','get','Danh sách yêu cầu nhập dữ liệu');
    add('/'+path+'/{id}','get','/academic-imports','get','Chi tiết yêu cầu, kết quả và lỗi nhập dữ liệu');
    add('/'+path,'post','/'+from+'/preview','post','Kiểm tra và lưu yêu cầu nhập dữ liệu');
    if(path==='student-imports') {
      const operation=spec.paths['/api/student-imports'].post;
      let schema=operation.requestBody.content['application/json'].schema;
      if(schema.$ref) schema=structuredClone(spec.components.schemas[schema.$ref.split('/').pop()]);
      delete schema.properties?.kind;
      if(schema.required) schema.required=schema.required.filter((name:string)=>name!=='kind');
      operation.requestBody.content={'application/json':{schema}};
    }
    add('/'+path,'patch','/'+from+'/commit','post','Xác nhận nhập dữ liệu đã kiểm tra',commit);
  }
  add('/student-imports/{id}/email-retries','post','/imports/commit','post','Gửi lại email tài khoản sinh viên',{type:'object',required:['email'],properties:{email:{type:'string',format:'email'}},additionalProperties:false});
  spec.paths['/api/student-imports/{id}/email-retries'].post.tags=['Admin'];
  spec.paths['/api/student-imports/{id}/email-retries'].post['x-roles']=['ADMIN'];
  for (const [to,from] of [['/academic-alerts','/academic/alerts'],['/course-demands','/academic/course-demand'],['/course-demands/export','/academic/course-demand/export']]) add(to,'get',from,'get',source['/api'+from].get.summary);
  add('/combo-registration-windows/{id}','get','/combo-registration-windows/{id}/selections','get','Chi tiết đợt và các lựa chọn combo');
  const retired: Record<string,string[]> = {
    '/academic/dashboard':['get'], '/academic/alerts':['get'], '/academic/course-demand':['get'], '/academic/course-demand/export':['get'],
    '/academic-periods/{id}/combo-phase-schedules':['get','put'], '/academic-periods/{id}/ojt-advisory-schedule':['get','put'],
    '/ojt-semesters/{id}/assessment-window':['get','put'], '/ojt-semesters/{id}/assessment-window/open':['post'], '/ojt-semesters/{id}/assessment-window/close':['post'],
    '/curricula/{id}/ojt-grade-mappings/{semesterId}':['get','put'], '/ojt-rule-sets/{id}':['patch'], '/ojt-rule-sets/{id}/publish':['post'],
    '/academic/alerts/notifications':['post'], '/academic/academic-summary-notifications':['post'], '/academic/eligibility-notifications':['post'],
    '/academic/advisory-runs':['get'], '/academic/advisory-runs/{id}':['get'], '/curriculum-imports/preview':['post'], '/curriculum-imports/commit':['post'],
    '/imports/preview':['post'], '/imports/commit':['post'], '/ojt-semesters/{id}/eligible-student-handoffs':['get','post'],
    '/combo-registration-windows/{id}/selections':['get'],
    '/students/{id}/course-results':['get'], '/students/{id}/combo-selections':['get'], '/students/{id}/eligibility':['get'], '/students/{id}/eligibility-checks':['get'],
  };
  for (const [path,methods] of Object.entries(retired)) for (const method of methods) {
    const item=spec.paths['/api'+path],op=item?.[method]; if(!op) continue;
    const remaining=(op['x-roles']??[]).filter((role:string)=>!['ADMIN','ACADEMIC'].includes(role));
    if(remaining.length){op['x-roles']=remaining;op.tags=(op.tags??[]).filter((tag:string)=>!['Admin','Phòng đào tạo'].includes(tag));}
    else delete item[method];
    if(!Object.keys(item).length)delete spec.paths['/api'+path];
  }
  return spec;
}
