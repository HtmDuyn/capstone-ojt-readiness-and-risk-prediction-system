const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');

function fixture() {
  const state={submission:null,canSubmit:true,inactive:false,foreign:false,fail:false,commits:0,rollbacks:0,inserts:0,audits:[],file:null};
  let before;
  const client={release(){},query:async(sql,args=[])=>{
    if(sql==='BEGIN'){before={...state,audits:[...state.audits]};return {rows:[]};}
    if(sql==='ROLLBACK'){Object.assign(state,before);state.rollbacks++;return {rows:[]};}
    if(sql==='COMMIT'){state.commits++;return {rows:[]};}
    if(sql.includes('FROM "Students"'))return {rows:state.inactive?[]:[{StudentID:10}]};
    if(sql.startsWith('SELECT t."TaskID"'))return {rows:state.foreign?[]:[{id:21,assignmentId:2,canSubmit:state.canSubmit}]};
    if(sql.startsWith('SELECT a."StudentID"'))return {rows:state.foreign||sql.includes('a."StudentID"=$2')&&args[1]!==10?[]:[{StudentID:10,EnterpriseID:7}]};
    if(sql.startsWith('SELECT "TaskID"'))return {rows:state.submission?[{TaskID:21,UpdatedByStudentID:10}]:[]};
    if(sql.startsWith('SELECT "AttachmentName"'))return {rows:[{FileName:state.submission?.attachment?.fileName,MimeType:'text/plain',Content:state.file}]};
    if(sql.startsWith('INSERT INTO "TaskProgressUpdates"')){
      state.inserts++;state.file=args[5];
      state.submission={id:1,taskId:args[0],studentId:args[1],content:args[2],percentComplete:100,isLate:false,submittedAt:'2026-11-27T00:00:00Z',
        attachment:args[3]?{fileName:args[3],mimeType:args[4],size:args[5].length,sha256:args[6]}:null};
      return {rows:[{UpdateID:1}]};
    }
    if(sql.startsWith('UPDATE "InternshipTasks"')){if(state.fail)throw Error('storage write failed');state.canSubmit=false;return {rows:[]};}
    if(sql.includes('SELECT count(*)::int AS total'))return {rows:[{total:state.submission?1:0}]};
    if(sql.includes('SELECT u."UpdateID"'))return {rows:state.submission?[state.submission]:[]};
    throw Error('Unexpected query: '+sql);
  }};
  const root=path.join(__dirname,'../src'),validation=require('../dist/modules/students/student.validation');
  const mocks={
    'config/database.ts':{pool:{connect:async()=>client}},
    'modules/academic/academic.repository.ts':{audit:async(...args)=>state.audits.push(args)},
    'modules/qhdn/read.repository.ts':{readTransaction:work=>work(client)},
    'modules/students/student.validation.ts':validation,
    'modules/student-portal/shared.ts':{ownStudent:async(c,actor)=>{
      if(state.inactive)throw validation.invalid('Inactive',403);
      return {StudentID:actor.userId===11?10:999};
    }},
    'modules/qhdn/qhdn.repository.ts':{enterpriseScope:async(c,actor)=>{
      if(['OJT_COORD','ADMIN'].includes(actor.roleCode))return null;
      if(actor.roleCode==='ENTERPRISE')return actor.userId===1?7:8;
      throw validation.invalid('Forbidden',403);
    }},
  };
  const cache=new Map();
  function load(file){
    file=file.replaceAll('\\','/');if(mocks[file])return mocks[file];if(cache.has(file))return cache.get(file).exports;
    const mod={exports:{}};cache.set(file,mod);
    const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>name.startsWith('.')?load(path.posix.normalize(path.posix.join(path.posix.dirname(file),name+'.ts'))):require(name),mod,mod.exports);
    return mod.exports;
  }
  return {state,service:load('modules/student-portal/task.service.ts'),attachments:load('modules/student-portal/task-attachment.service.ts')};
}
const student={userId:11,roleCode:'STUDENT'},enterprise={userId:1,roleCode:'ENTERPRISE'};
const file=(text='bài làm riêng tư',name='bai-lam.txt')=>({originalname:name,mimetype:'application/octet-stream',buffer:Buffer.from(text)});

test('text-only, file-only without content field, and combined submissions commit completion and history',async()=>{
  for(const [body,attachment] of [[{content:'link github'},undefined],[{},file()],[{content:'nội dung'},file()]]){
    const {service,state}=fixture();const result=await service.submitTask(21,body,student,attachment);
    assert.equal(result.content,body.content??'');assert.equal(state.canSubmit,false);assert.equal(state.commits,1);
    assert.equal(result.percentComplete,100);assert.equal(result.replayed,false);assert.equal(!!result.attachment,!!attachment);
    if(attachment){assert.deepEqual(state.file,attachment.buffer);assert.equal(result.attachment.mimeType,'text/plain');}
    assert.ok(!JSON.stringify(state.audits).includes('bài làm riêng tư'));
  }
});
test('identical retry replays; changed content, bytes or filename cannot overwrite a completed submission',async()=>{
  const {service,state}=fixture();await service.submitTask(21,{},student,file());
  assert.equal((await service.submitTask(21,{},student,file())).replayed,true);
  for(const [body,attachment] of [[{},file('different')],[{},file('bài làm riêng tư','renamed.txt')],[{content:'changed'},file()],[{content:'text'},undefined]]){
    await assert.rejects(service.submitTask(21,body,student,attachment),{statusCode:409});
  }
  assert.equal(state.inserts,1);assert.equal(state.submission.attachment.fileName,'bai-lam.txt');
});
test('inactive, foreign, closed or nonstudent submissions and invalid payloads save nothing',async()=>{
  const {service}=fixture();
  await assert.rejects(service.submitTask(21,{content:''},student));
  await assert.rejects(service.submitTask(21,{content:'x'},enterprise,file()),{statusCode:403});
  for(const body of [{content:null},{content:123},{content:'x',unexpected:true},{content:'x'.repeat(10001)}])await assert.rejects(service.submitTask(21,body,student,file()));
  for(const flag of ['inactive','foreign','canSubmit']){
    const f=fixture();f.state[flag]=flag!=='canSubmit';await assert.rejects(f.service.submitTask(21,{},student,file()));assert.equal(f.state.inserts,0);
  }
});
test('transaction failure rolls back the file, history and completion together',async()=>{
  const {service,state}=fixture();state.fail=true;await assert.rejects(service.submitTask(21,{content:'x'},student,file()));
  assert.equal(state.submission,null);assert.equal(state.file,null);assert.equal(state.canSubmit,true);assert.equal(state.commits,0);assert.equal(state.rollbacks,1);
});
test('history and private file access require student ownership or assigned enterprise/staff scope',async()=>{
  const {service,attachments,state}=fixture();await service.submitTask(21,{},student,file());
  for(const actor of [student,enterprise,{userId:2,roleCode:'ADMIN'},{userId:2,roleCode:'OJT_COORD'}]){
    assert.deepEqual((await attachments.readTaskAttachment(1,actor)).Content,file().buffer);
    assert.equal((await service.taskSubmissions(21,{},actor)).total,1);
  }
  for(const actor of [{userId:2,roleCode:'ENTERPRISE'},{userId:12,roleCode:'STUDENT'},{userId:2,roleCode:'ACADEMIC'}]){
    await assert.rejects(attachments.readTaskAttachment(1,actor));await assert.rejects(service.taskSubmissions(21,{},actor));
  }
  state.file=null;await assert.rejects(attachments.readTaskAttachment(1,student),{errorCode:'TASK_ATTACHMENT_NOT_FOUND'});
  await assert.rejects(service.taskSubmissions(21,{page:2147483647,limit:100},student));
});
test('file validation rejects mismatched bytes, executables, empty/oversized files and normalizes Vietnamese names',()=>{
  const {attachments:a}=fixture();
  const name='bài-tập.txt';assert.equal(a.validateTaskAttachment(file('abc',Buffer.from(name).toString('latin1'))).originalname,name);
  assert.equal(a.validateTaskAttachment(file('abc','../bai.txt')).originalname,'bai.txt');
  assert.equal(a.validateTaskAttachment(file('abc',name)).originalname,name);
  for(const f of [file('MZ...','bad.exe'),file('bad','fake.pdf'),file('bad','fake.docx'),file('','empty.txt'),{...file(),buffer:Buffer.alloc(10485761)},file('a\0b')])assert.throws(()=>a.validateTaskAttachment(f));
});
test('real multipart HTTP supports file-only and combined submissions and preserves the JSON API',async()=>{
  const express=require('express'),app=express(),{attachments}=fixture();app.use(express.json());
  app.post('/',attachments.receiveTaskSubmission,async(req,res,next)=>{
    try{const f=fixture();res.status(201).json(await f.service.submitTask(21,req.body,student,req.file));}catch(error){next(error);}
  });
  app.use((error,req,res,next)=>res.status(error.statusCode||500).json({message:error.message}));
  const server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
  try{
    const url='http://127.0.0.1:'+server.address().port;
    for(const content of [undefined,'description']){
      const form=new FormData();if(content!==undefined)form.append('content',content);form.append('attachment',new Blob([file().buffer]),'bai-lam.txt');
      const response=await fetch(url,{method:'POST',body:form});assert.equal(response.status,201,await response.clone().text());
      assert.equal((await response.json()).attachment.fileName,'bai-lam.txt');
    }
    for(const [name,bytes,status] of [['bad.exe',Buffer.from('MZ...'),400],['bad.txt',Buffer.alloc(10485761),413]]){
      const form=new FormData();form.append('attachment',new Blob([bytes]),name);assert.equal((await fetch(url,{method:'POST',body:form})).status,status);
    }
    const extra=new FormData();extra.append('attachment',new Blob(['one']),'a.txt');extra.append('attachment',new Blob(['two']),'b.txt');assert.equal((await fetch(url,{method:'POST',body:extra})).status,400);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'legacy json'})})).status,201);
    assert.equal((await fetch(url,{method:'POST',body:'unsupported'})).status,415);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
