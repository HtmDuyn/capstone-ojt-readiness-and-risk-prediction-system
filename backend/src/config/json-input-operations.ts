type RecordValue = Record<string, any>;
export type JsonInputOperation = {
  method: string; path: string; sourceMethod: string; sourcePath: string;
  inputs: { name: string; sourceName: string; location: 'path'|'query'; required: boolean; schema: RecordValue }[];
  bodySchema: RecordValue; operation: RecordValue; protected: boolean;
};
const idFields: Record<string,string> = {
  students:'studentId',accounts:'userId','academic-years':'academicYearId','academic-periods':'academicPeriodId',
  'ojt-semesters':'ojtSemesterId',cohorts:'cohortId',curricula:'programId',courses:'courseId',combos:'comboId',
  'course-results':'courseResultId','academic-imports':'importId','ojt-rule-sets':'ruleSetId',
  'eligibility-checks':'checkId','eligibility-check-runs':'runId',
  'combo-registration-windows':'windowId','ojt-registration-windows':'windowId',
  'ojt-registrations':'registrationId','ojt-results':'resultId'
};
export function buildJsonInputOperations(spec:RecordValue):JsonInputOperation[] {
  const resolve=(v:any):any=>v?.$ref?.startsWith('#/')?v.$ref.slice(2).split('/').reduce((a:any,k:string)=>a?.[k],spec):v;
  const result:JsonInputOperation[]=[],seen=new Set<string>();
  for(const [sourcePath,item]of Object.entries(spec.paths)as[string,RecordValue][]){
    for(const sourceMethod of ['get','post','put','patch','delete']){
      const original=item[sourceMethod];if(!original)continue;
      const params=[...(item.parameters??[]),...(original.parameters??[])].map(resolve)
        .filter(p=>p.in==='path'||p.in==='query');
      if(!params.length)continue;
      const inputs=params.map(p=>({
        name:p.in==='path'&&p.name==='id'?(idFields[sourcePath.split('/')[2]]??'id'):p.name,
        sourceName:p.name,location:p.in as 'path'|'query',required:p.required===true,schema:structuredClone(resolve(p.schema)??{})
      }));
      let path='/api/json'+sourcePath.slice(4).replace(/\/\{[^}]+\}/g,'');
      const method=sourceMethod==='get'?'post':sourceMethod;
      if(sourceMethod==='get'&&!sourcePath.endsWith('/export'))path+=/\{[^}]+\}$/.test(sourcePath)?'/detail':'/search';
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
        bodySchema.properties[input.name]={...input.schema,description:(params.find(p=>p.in===input.location&&p.name===input.sourceName)?.description??'')};
        if(input.required&&!bodySchema.required.includes(input.name))bodySchema.required.push(input.name);
      }
      const operation=structuredClone(original);
      operation.parameters=(operation.parameters??[]).filter((p:any)=>!['path','query'].includes(resolve(p)?.in));
      operation.requestBody={required:true,content:{'application/json':{schema:bodySchema}}};
      // Original examples lack newly required IDs/filters; let the expanded schema expose every field.
      operation['x-original-operation']={method:sourceMethod.toUpperCase(),path:sourcePath};
      result.push({method,path,sourceMethod,sourcePath,inputs,bodySchema,operation,protected:!!original.security?.length});
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
      if(/\{[^}]+\}/.test(path)||parameters.some(p=>['path','query'].includes(p.in)))
        throw Error('JSON API still exposes URL inputs: '+method.toUpperCase()+' '+path);
    }
  }
  doc.info.description='API quản lý học vụ, đăng ký và kết quả OJT.';
  return doc;
}

