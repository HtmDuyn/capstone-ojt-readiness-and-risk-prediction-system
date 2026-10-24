import { academicOperations } from '../shared/academic-api-contract';
import { describeListDisplayFields } from './swagger-list-contracts';
type Spec=Record<string,any>;
const id={type:'integer',minimum:1},text={type:'string'},time={type:'string',format:'date-time'},object={type:'object',additionalProperties:true};
const array=(items:Spec)=>({type:'array',items});
const item=(spec:Spec,path:string,root=false)=>{
  const schema=spec.paths['/api'+path].get.responses['200'].content['application/json'].schema;
  return (root?schema:schema.properties.data).properties.items.items;
};
export function describeAcademicContracts(spec:Spec) {
  const yearUpdate=spec.paths['/api/academic-years/{id}'].patch;
  const cohortUpdate=spec.paths['/api/cohorts/{id}'].patch;
  const publish=spec.paths['/api/ojt-rule-sets/{id}/publish'].post;
  publish.requestBody={required:false,content:{'application/json':{schema:{type:'object',additionalProperties:false,maxProperties:0},example:{}}}};
  publish.description='Chỉ cần ID trên URL; có thể gửi {} hoặc không có body.';
  for(const path of ['/academic/dashboard','/academic/alerts','/academic/course-demand','/academic/course-demand/export']){
    const op=spec.paths['/api'+path].get;
    op.description+=' Khi không lọc, trả dữ liệu theo tất cả kỳ OJT. Kỳ học và deadline lấy từ cấu hình đã lưu; thiếu deadline trả NOT_CONFIGURED, không tự suy ra từ hạn đăng ký.';
    const data=op.responses['200']?.content?.['application/json']?.schema?.properties?.data;
    if(data){data.properties??={};Object.assign(data.properties,{scopes:array(object),scope:object,computedAt:time});}
  }
  const years=item(spec,'/academic-years',true);
  years.properties.periods=array({type:'object',properties:{id,periodCode:text,name:text,kind:text,parentPeriodId:{...id,nullable:true},startDate:{type:'string',format:'date'},endDate:{type:'string',format:'date'},status:text,ojtSemesterId:{...id,nullable:true}}});
  yearUpdate.responses['200']={description:'Năm học sau cập nhật, kèm các kỳ học liên quan.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:structuredClone(years)}}}}};
  const periods=item(spec,'/academic-periods',true);
  periods.properties.parentPeriod={...object,nullable:true};
  const cohorts=item(spec,'/cohorts',true);
  cohorts.properties.groups.items.properties.entryAcademicPeriod={...object,nullable:true};
  cohortUpdate.responses['200']={description:'Khóa sau cập nhật, đầy đủ nhóm và thông tin kỳ bắt đầu.',content:{'application/json':{schema:{type:'object',properties:{success:{type:'boolean'},data:structuredClone(cohorts)}}}}};
  const curricula=item(spec,'/curricula');
  Object.assign(curricula.properties,{courses:array(object),combos:array(object),prerequisites:array(object),equivalences:array(object)});
  const majors=item(spec,'/majors');majors.properties.parentMajor={...object,nullable:true};
  const history=item(spec,'/students/{id}/combo-selections');
  Object.assign(history.properties,{comboId:{...id,nullable:true},courseIds:array(id),academicPeriodId:id,ojtSemesterId:id,windowName:text});
  describeListDisplayFields(history,['combo','courses','academicPeriod','semester']);
  const demand=item(spec,'/academic/course-demand');
  Object.assign(demand.properties,{ojtSemesterId:id,students:array(object)});
  describeListDisplayFields(demand,['semester']);
  const alert=item(spec,'/academic/alerts');
  Object.assign(alert.properties,{ojtSemesterId:id,academicPeriodId:{...id,nullable:true},assessmentDeadline:{...time,nullable:true},deadlineStatus:{type:'string',enum:['UPCOMING','OVERDUE','NOT_CONFIGURED']}});
  describeListDisplayFields(alert,['semester','academicPeriod','major','combos']);
  const results=item(spec,'/ojt-results');
  Object.assign(results.properties,{version:id,courseResultId:{...id,nullable:true},gradeMappingId:{...id,nullable:true},gradeMappingSnapshot:{...object,nullable:true},confirmationReason:{...text,nullable:true}});
  const runs=item(spec,'/academic/advisory-runs');
  Object.assign(runs.properties,{request:object,reason:{...text,nullable:true},studentCount:{type:'integer'},completedCount:{type:'integer'},failedCount:{type:'integer'}});
  for(const [path,keys]of [
    ['/ojt-semesters/{id}/assessment-window',['semester','blockPeriod','assessmentAcademicPeriod','configuredByUser','resultsFinalizedByUser','closedByUser']],
    ['/curricula/{id}/ojt-grade-mappings/{semesterId}',['program','semester','course','academicPeriod','confirmedByUser']],
    ['/academic-periods/{id}/ojt-advisory-schedule',['academicPeriod','semester','updatedByUser']],
  ] as [string,string[]][]){
    const response=spec.paths['/api'+path].get.responses['200'];
    response.content??={};response.content['application/json']??={schema:{type:'object',properties:{success:{type:'boolean'},data:{...object}}}};
    const data=response.content['application/json'].schema.properties.data;
    describeListDisplayFields(data,keys);
    data.additionalProperties=true;
    for(const key of keys)if(!data.properties[key])data.properties[key]={...object,nullable:true};
  }
  const eligibility=spec.paths['/api/students/{id}/eligibility'].get;
  const response=eligibility.responses['200'];
  response.content??={};
  const single=response.content['application/json']?.schema?.properties?.data??{type:'object',properties:{studentId:id,ojtSemesterId:id,current:object,latest:{...object,nullable:true},official:{...object,nullable:true}}};
  describeListDisplayFields(single,['student','semester']);
  response.content['application/json']={schema:{type:'object',properties:{success:{type:'boolean'},data:{oneOf:[single,{type:'object',properties:{studentId:id,total:{type:'integer'},items:array(single)}}]}}}};
  eligibility.description+=' Không truyền ojtSemesterId: trả items theo từng kỳ OJT; có truyền: trả một kết quả như trước.';
}

// Validate the final public contract after REST replacements and role transformations.
export function describeAcademicOperationContracts(spec:Spec) {
  for(const [path,methods] of Object.entries(academicOperations))for(const method of methods){
    const op=spec.paths['/api'+path]?.[method];
    if(!op)throw Error(`Missing academic operation: ${method} ${path}`);
    if(method==='get'){
      delete op.requestBody;
      for(const parameter of op.parameters??[])if(parameter.in==='query')parameter.required=false;
      op.description=[op.description,'Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.'].filter(Boolean).join(' ');
      if(path==='/academic-years'){
        op.parameters=(op.parameters??[]).filter((parameter:Spec)=>parameter.in!=='query');
        op.description='Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả toàn bộ năm học kèm các kỳ học liên quan.';
      }
      if(path==='/academic-periods'){
        op.parameters=(op.parameters??[]).filter((parameter:Spec)=>parameter.in!=='query');
        op.description='Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả toàn bộ kỳ học và Block 3 ở mọi trạng thái, kèm năm học, kỳ cha và thông tin OJT liên quan.';
      }
      if(path==='/cohorts'){
        op.parameters=(op.parameters??[]).filter((parameter:Spec)=>parameter.in!=='query');
        op.description='Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả JSON toàn bộ khóa ở mọi trạng thái, các nhóm và thông tin kỳ bắt đầu của từng nhóm.';
      }
    }else if(op.requestBody){
      const json=op.requestBody.content?.['application/json'];
      if(!json)throw Error(`Missing JSON contract: ${method} ${path}`);
      op.requestBody.content={'application/json':json};
      op.description=[op.description,'Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.'].filter(Boolean).join(' ');
    }
  }
  return spec;
}
