import type { ScopeRule } from '../shared/explicit-list-scope';
type RecordValue = Record<string, any>;
export type JsonInputOperation = {
  method: string; path: string; sourceMethod: string; sourcePath: string;
  inputs: { name: string; sourceName: string; location: 'path'|'query'|'scope'; required: boolean; schema: RecordValue }[];
  bodySchema: RecordValue; operation: RecordValue; protected: boolean; scopeRules: ScopeRule[];
};
const idFields: Record<string, string> = {
  candidates: 'candidateId',
  internships: 'internshipId',
  windows: 'windowId',
  posts: 'postId',
  companies: 'companyId',
  positions: 'positionId',
  'ojt-coordinations': 'coordinationId',
  assignments: 'assignmentId',
  'internship-evaluations': 'evaluationId',

  students: 'studentId',
  accounts: 'userId',
  'academic-years': 'academicYearId',
  'academic-periods': 'academicPeriodId',
  'ojt-semesters': 'ojtSemesterId',
  cohorts: 'cohortId',
  curricula: 'programId',
  courses: 'courseId',
  combos: 'comboId',

  'course-results': 'courseResultId',
  'academic-imports': 'importId',
  'ojt-rule-sets': 'ruleSetId',
  'eligibility-checks': 'checkId',
  'eligibility-check-runs': 'runId',

  'combo-registration-windows': 'windowId',
  'ojt-registration-windows': 'windowId',
  'ojt-registrations': 'registrationId',
  'ojt-results': 'resultId',

  applications: 'applicationId',
  'job-applications': 'applicationId',
  'recruitment-posts': 'postId',
  'company-imports': 'importId',
  'advisory-runs': 'runId',
  analyses: 'analysisId',

  assessments: 'assessmentId',
  predictions: 'predictionId',
  alerts: 'alertId',
  'prediction-jobs': 'jobId',
  models: 'modelId'
};
export function buildJsonInputOperations(spec:RecordValue):JsonInputOperation[] {
  const resolve=(v:any):any=>v?.$ref?.startsWith('#/')?v.$ref.slice(2).split('/').reduce((a:any,k:string)=>a?.[k],spec):v;
  const result:JsonInputOperation[]=[],seen=new Set<string>();
  for(const [sourcePath,item]of Object.entries(spec.paths)as[string,RecordValue][]){
    for(const sourceMethod of ['get','post','put','patch','delete']){
      const original=item[sourceMethod];if(!original)continue;
      if(sourceMethod==='get'&&sourcePath==='/api/accounts')continue;
      const params=[...(item.parameters??[]),...(original.parameters??[])].map(resolve)
        .filter(p=>p.in==='path'||p.in==='query');
      if(!params.length)continue;
      const segments=sourcePath.split('/');
      const pathIdName=idFields[segments[segments.indexOf('{id}')-1]]??'id';
      const inputs=params.map(p=>({
        name:p.in==='path'&&p.name==='id'?pathIdName:p.name,
        sourceName:p.name,location:p.in as 'path'|'query'|'scope',required:p.required===true,schema:structuredClone(resolve(p.schema)??{})
      }));
      let path='/api/json'+sourcePath.slice(4).replace(/\/\{[^}]+\}/g,'');
      const method=sourceMethod==='get'?'post':sourceMethod;
      if(sourceMethod==='get'&&!sourcePath.endsWith('/export')){
        const response=resolve(original.responses?.['200']);
        const schema=resolve(response?.content?.['application/json']?.schema);
        const data=resolve(schema?.properties?.data);
        const returnsList=params.some(p=>['page','limit'].includes(p.name))||
          schema?.type==='array'||data?.type==='array'||!!schema?.properties?.items||!!data?.properties?.items;
        path+=/\{[^}]+\}$/.test(sourcePath)?'/detail':returnsList?'/list':'/search';
      }
      const key=method+' '+path;if(seen.has(key)||spec.paths[path]?.[method])throw Error('Conflicting JSON route: '+key);seen.add(key);
      const body=resolve(original.requestBody),media=body?.content?.['application/json'];
      if(body&&!media)throw Error('A non-JSON body needs a dedicated adapter: '+sourcePath);
      const bodySchema=structuredClone(resolve(media?.schema)??{type:'object',properties:{},additionalProperties:false});
      if(bodySchema.type!=='object')throw Error('JSON input adapter requires an object: '+sourcePath);
      // Regenerate Swagger's example from all properties, including the newly added IDs.
      delete bodySchema.example;delete bodySchema.examples;
      bodySchema.properties??={};bodySchema.required??=[];
      const sourceBodyFields=new Set(Object.keys(bodySchema.properties));
      for(const input of inputs){
        if(sourceBodyFields.has(input.name))throw Error('Body/URL input conflict: '+sourcePath+' '+input.name);
        bodySchema.properties[input.name]={...input.schema,description:(params.find(p=>p.in===input.location&&p.name===input.sourceName)?.description??input.schema.description??'')};
        if(input.required&&!bodySchema.required.includes(input.name))bodySchema.required.push(input.name);
      }
      const operation=structuredClone(original);
      operation.parameters=(operation.parameters??[]).filter((p:any)=>!['path','query'].includes(resolve(p)?.in));
      operation.requestBody={required:true,content:{'application/json':{schema:bodySchema}}};
      if(sourceMethod==='get'&&sourcePath==='/api/ojt-registrations') {
        operation.requestBody.content['application/json'].examples={
          all:{summary:'Tất cả hồ sơ được phép xem',value:{page:1,limit:20}},
          submitted:{summary:'Hồ sơ đã nộp',value:{status:'SUBMITTED',page:1,limit:20}}
        };
      }
      const listId:Record<string,string>={
        '/api/ojt-registrations':'registrationId','/api/ojt-results':'resultId','/api/academic-imports':'importId',
        '/api/job-applications':'applicationId',
        '/api/companies':'companyId','/api/positions':'positionId','/api/assignments':'assignmentId',
        '/api/academic-periods':'academicPeriodId','/api/accounts':'userId','/api/ojt-coordinations':'coordinationId','/api/internship-evaluations':'evaluationId','/api/enterprise/candidates':'candidateId',
      };
      if(sourceMethod==='get'&&listId[sourcePath])operation.requestBody.content['application/json'].examples={
        list:{summary:'Danh sách hồ sơ',value:{page:1,limit:20}},
        record:{summary:'Một hồ sơ theo ID',value:{[listId[sourcePath]]:sourcePath==='/api/academic-imports'?'1':1,page:1,limit:20}}
      };
      if(sourceMethod==='get'&&sourcePath==='/api/qhdn/registered-students')operation.requestBody.content['application/json'].examples={
        all:{summary:'Tất cả sinh viên đã đăng ký OJT',value:{page:1,limit:20}},
        notHandedOff:{summary:'Sinh viên có hồ sơ chưa bàn giao',value:{handoffStatus:'NOT_HANDED_OFF',page:1,limit:20}}
      };
      if(sourceMethod==='get'&&sourcePath==='/api/students/{id}/cv')operation.requestBody.content['application/json'].examples={
        latest:{summary:'CV mới nhất của sinh viên',value:{studentId:1}},
        version:{summary:'Một phiên bản CV cụ thể',value:{studentId:1,cvFileId:1}}
      };
      const requiredInputs:Record<string,string[]>={
        '/api/academic/alerts':['ojtSemesterId','academicPeriodId','assessmentDeadline'],
        '/api/academic/course-demand':['ojtSemesterId','academicPeriodId'],
        '/api/students/me/opportunities':['ojtSemesterId']
      };
      for(const name of requiredInputs[sourcePath]??[]){
        const input=inputs.find(input=>input.name===name);if(!input)throw Error('Missing required input '+sourcePath+' '+name);
        input.required=true;if(!bodySchema.required.includes(name))bodySchema.required.push(name);
      }
      const scopeRules:ScopeRule[]=[];
      if(sourceMethod==='get'&&path.endsWith('/list')){
        const roles:string[]=original['x-roles']??[];
        if(roles.includes('ENTERPRISE'))scopeRules.push({field:'companyId',roles:['ENTERPRISE'],requiredForAll:sourcePath==='/api/recruitment/posts',forward:inputs.some(p=>p.name==='companyId')});
        if(roles.includes('STUDENT'))scopeRules.push({field:'studentId',roles:['STUDENT'],forward:inputs.some(p=>p.name==='studentId')});
        for(const rule of scopeRules){
          const required=rule.requiredForAll||roles.every(role=>rule.roles.includes(role));
          if(!inputs.some(p=>p.name===rule.field))inputs.push({name:rule.field,sourceName:rule.field,location:'scope',required:!!required,schema:{type:'integer',minimum:1,maximum:2147483647}});
          const description=rule.field+' chọn đối tượng truy xuất, FE phải nhập; '+(required?'bắt buộc cho mọi vai trò.':'bắt buộc khi đăng nhập vai trò '+rule.roles.join('/')+'; '+(rule.forward?'vai trò quản trị có thể bỏ để xem toàn bộ.':'đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này.'))+' JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.';
          bodySchema.properties[rule.field]={...bodySchema.properties[rule.field],type:'integer',minimum:1,maximum:2147483647,description,'x-required-for-roles':rule.requiredForAll?roles:rule.roles};
          if(required&&!bodySchema.required.includes(rule.field))bodySchema.required.push(rule.field);
          for(const input of inputs)if(input.name===rule.field&&required)input.required=true;
        }
        for(const [name,property]of Object.entries(bodySchema.properties) as [string,RecordValue][]){
          if(!property.description)property.description=name==='page'?'Trang kết quả, mặc định 1.':name==='limit'?'Số bản ghi mỗi trang, tối đa 100.':name.endsWith('Id')?'ID '+name+' dùng để chọn/lọc dữ liệu trong DB. '+(bodySchema.required.includes(name)?'Bắt buộc.':'Tùy chọn; bỏ qua để không lọc theo ID này.'):'Bộ lọc '+name+'. Bỏ qua để dùng phạm vi mặc định được mô tả cho API.';
        }
        if(scopeRules.length){
          operation['x-explicit-list-scope']=scopeRules;
          operation.description=(operation.description??'').replace(/Doanh nghiệp được xác định từ JWT; không nhận companyId\./g,'FE nhập companyId trong JSON body.')+' '+scopeRules.map(rule=>bodySchema.properties[rule.field].description).join(' ');
          const examples=operation.requestBody.content['application/json'].examples??{list:{summary:'Danh sách với ID tường minh',value:{page:1,limit:20}}};
          for(const example of Object.values(examples) as RecordValue[])for(const rule of scopeRules)example.value={...example.value,[rule.field]:1};
          const staffRoles=roles.filter(role=>!scopeRules.some(rule=>rule.roles.includes(role)));
          if(staffRoles.length){
            const value:RecordValue={page:1,limit:20};
            for(const name of bodySchema.required)value[name]=bodySchema.properties[name]?.default??1;
            examples.staff={summary:'Dành cho '+staffRoles.join('/')+'; bỏ bộ lọc tùy chọn để xem toàn bộ phạm vi',value};
          }
          for(const rule of scopeRules)for(const role of rule.roles.filter(role=>roles.includes(role))){
            const value:RecordValue={page:1,limit:20};
            for(const name of bodySchema.required)value[name]=bodySchema.properties[name]?.default??1;
            value[rule.field]=1;
            examples[role.toLowerCase()]={summary:'Dành cho '+role+': nhập '+rule.field,value};
          }
          operation.requestBody.content['application/json'].examples=examples;
        }
      }
      if(sourceMethod==='get'&&path.endsWith('/list')){
        const examples=operation.requestBody.content['application/json'].examples??{list:{summary:'Nhập các ID/bộ lọc cần truy xuất',value:{page:1,limit:20}}};
        for(const example of Object.values(examples) as RecordValue[])for(const name of bodySchema.required){
          if(example.value[name]===undefined){const property=bodySchema.properties[name];example.value[name]=property?.format==='date-time'?'2026-12-01T00:00:00+07:00':property?.default??property?.enum?.[0]??1;}
        }
        operation.requestBody.content['application/json'].examples=examples;
      }
      // Original examples lack newly required IDs/filters; let the expanded schema expose every field.
      operation['x-original-operation']={method:sourceMethod.toUpperCase(),path:sourcePath};
      result.push({method,path,sourceMethod,sourcePath,inputs,bodySchema,operation,protected:!!original.security?.length,scopeRules});
    }
  }
  return result;
}
export function documentJsonInputOperations(spec:RecordValue,operations:JsonInputOperation[]):RecordValue {
  const doc=structuredClone(spec);
  for(const entry of operations){
    delete doc.paths[entry.sourcePath][entry.sourceMethod];
    if(!Object.keys(doc.paths[entry.sourcePath]).length)delete doc.paths[entry.sourcePath];
    doc.paths[entry.path]??={};doc.paths[entry.path][entry.method]=entry.operation;
  }
  // Fail startup when a future API accidentally exposes URL inputs in the JSON contract.
  for(const [path,item]of Object.entries(doc.paths)as[string,RecordValue][]){
    for(const method of ['get','post','put','patch','delete']){
      const operation=item[method];if(!operation)continue;
      const parameters=[...(item.parameters??[]),...(operation.parameters??[])];
      if(!(path==='/api/accounts'&&method==='get')&&(/\{[^}]+\}/.test(path)||parameters.some(p=>['path','query'].includes(p.in))))
        throw Error('JSON API still exposes URL inputs: '+method.toUpperCase()+' '+path);
    }
  }
  doc.info.description='API quản lý học vụ, đăng ký và kết quả OJT.';
  return doc;
}

