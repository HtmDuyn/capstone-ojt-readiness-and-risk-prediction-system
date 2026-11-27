const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function fixture() {
  const state = { certificate:null, bytes:null, published:false, status:'ACTIVE', audits:[], writes:0 };
  const client = {query:async(sql,args)=>{
    if(sql.startsWith('SELECT a.')) return {rows:[{EnterpriseID:7,Status:state.status,UserID:11,published:state.published}]};
    if(sql.startsWith('SELECT "AssignmentID"')) return {rows:state.certificate?[{AssignmentID:21}]:[]};
    if(sql.startsWith('SELECT "FileName"')) return {rows:state.certificate?[{FileName:state.certificate.fileName,MimeType:state.certificate.mimeType,Content:state.bytes}]:[]};
    if(sql.startsWith('INSERT INTO')) {
      state.writes++;
      state.bytes=Buffer.from(args[3]);
      state.certificate={id:1,assignmentId:args[0],fileName:args[1],mimeType:args[2],sha256:args[4],uploadedRole:args[6],size:args[3].length};
      return {rows:[]};
    }
    if(sql.includes('FROM "OjtCompletionCertificates"')) {
      if(sql.includes('s."UserID"=$1')) {
        assert.ok(sql.includes('co."OJTSemesterID"=$2'));
        assert.ok(sql.includes("n.\"RelatedEntityType\"='OJT_RESULT_PUBLISHED'"));
        return {rows:state.published&&args[0]===11&&args[1]===5&&state.certificate?[state.certificate]:[]};
      }
      return {rows:state.certificate?[state.certificate]:[]};
    }
    throw Error('Unexpected query: '+sql);
  }};
  const transaction = async work=>{
    const before = {...state,audits:[...state.audits]};
    try{return await work(client);}catch(error){Object.assign(state,before);throw error;}
  };
  const mocks = {
    '../academic/academic.repository':{academicTransaction:transaction,audit:async(...args)=>state.audits.push(args)},
    '../qhdn/read.repository':{readTransaction:work=>work(client)},
    '../qhdn/qhdn.repository':{enterpriseScope:async(_,actor)=>{
      if(['ADMIN','OJT_COORD'].includes(actor.roleCode))return null;
      if(actor.roleCode==='ENTERPRISE')return actor.userId===1?7:8;
      throw Object.assign(Error('forbidden'),{statusCode:403});
    }},
    '../students/student.validation':{invalid:(message,statusCode=400,errorCode='INVALID_INPUT')=>Object.assign(Error(message),{statusCode,errorCode})},
  };
  const source=fs.readFileSync(path.join(__dirname,'../src/modules/ojt-results/certificate.service.ts'),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>mocks[name]||require(name),mod,mod.exports);
  return {state,service:mod.exports};
}
const actor={userId:1,roleCode:'ENTERPRISE'};
const pdf=(name='certificate.pdf',suffix='')=>({originalname:name,mimetype:'application/pdf',buffer:Buffer.from('%PDF-1.7\n'+suffix+'\n%%EOF')});

test('validates actual bytes, extension, MIME and size; sanitizes path names',()=>{
  const {service:s}=fixture();
  assert.equal(s.validateCertificateFile(pdf('../certificate.pdf')).originalname,'certificate.pdf');
  const vietnamese='chứng-chỉ.pdf';
  assert.equal(s.validateCertificateFile(pdf(Buffer.from(vietnamese).toString('latin1'))).originalname,vietnamese);
  assert.equal(s.validateCertificateFile(pdf(vietnamese)).originalname,vietnamese);
  for(const file of [pdf('fake.png'),{...pdf(),mimetype:'text/html'},{...pdf(),buffer:Buffer.from('<html>fake</html>')},{...pdf(),buffer:Buffer.alloc(0)},{...pdf(),buffer:Buffer.alloc(10485761)}])assert.throws(()=>s.validateCertificateFile(file));
  assert.equal(s.validateCertificateFile({originalname:'certificate.png',mimetype:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10,0])}).mimetype,'image/png');
  assert.equal(s.validateCertificateFile({originalname:'certificate.jpg',mimetype:'image/jpeg',buffer:Buffer.from([255,216,255,224])}).mimetype,'image/jpeg');
});
test('enterprise upload, duplicate replay, coordinator replacement and audit omit file bytes',async()=>{
  const {service:s,state}=fixture();
  await s.uploadCertificate(21,pdf(),actor);
  assert.equal(state.writes,1);assert.equal(state.audits.length,1);
  await s.uploadCertificate(21,pdf(),actor);
  assert.equal(state.writes,1);assert.equal(state.audits.length,1);
  await s.uploadCertificate(21,pdf('updated.pdf','updated'),{userId:2,roleCode:'OJT_COORD'});
  assert.equal(state.writes,2);assert.equal(state.certificate.fileName,'updated.pdf');
  assert.equal(state.certificate.uploadedRole,'OJT_COORD');assert.equal(state.audits[1][4],'REPLACE_CERTIFICATE');
  assert.ok(!JSON.stringify(state.audits).includes('%PDF'));
  const file=await s.readCertificateFile(1,actor);
  assert.deepEqual(file.Content,pdf('updated.pdf','updated').buffer);
});
test('foreign enterprise, student and invalid assignment cannot upload or replace',async()=>{
  const {service:s,state}=fixture();
  await s.uploadCertificate(21,pdf(),actor);
  for(const user of [{userId:2,roleCode:'ENTERPRISE'},{userId:11,roleCode:'STUDENT'},{userId:3,roleCode:'ACADEMIC'}]) {
    await assert.rejects(s.uploadCertificate(21,pdf('bad.pdf'),user),{statusCode:403});
  }
  state.status='CANCELLED';
  await assert.rejects(s.uploadCertificate(21,pdf('bad.pdf'),actor),{statusCode:409});
  assert.equal(state.writes,1);assert.equal(state.certificate.fileName,'certificate.pdf');
});
test('file reads and student list require publication and student ownership in the selected semester',async()=>{
  const {service:s,state}=fixture();
  await s.uploadCertificate(21,pdf(),actor);
  const student={userId:11,roleCode:'STUDENT'};
  await assert.rejects(s.readCertificateFile(1,student),{statusCode:403});
  assert.deepEqual(await s.studentCertificates(5,student),[]);
  state.published=true;
  assert.equal((await s.studentCertificates(5,student)).length,1);
  assert.deepEqual(await s.studentCertificates(6,student),[]);
  assert.deepEqual((await s.readCertificateFile(1,student)).Content,pdf().buffer);
  await assert.rejects(s.readCertificateFile(1,{userId:12,roleCode:'STUDENT'}),{statusCode:403});
  await assert.rejects(s.readCertificateFile(1,{userId:2,roleCode:'ENTERPRISE'}),{statusCode:403});
});
test('multipart accepts one real file and rejects extra fields and oversized input',async()=>{
  const express=require('express');
  const {service:s}=fixture();
  const app=express();
  app.put('/certificate',s.receiveCertificate,(req,res)=>res.json({name:req.file.originalname,size:req.file.buffer.length}));
  app.use((error,req,res,next)=>res.status(error.statusCode||500).json({message:error.message}));
  const server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
  try {
    const endpoint='http://127.0.0.1:'+server.address().port+'/certificate';
    const form=new FormData();form.append('certificate',new Blob([pdf().buffer],{type:'application/pdf'}),'certificate.pdf');
    const accepted=await fetch(endpoint,{method:'PUT',body:form});
    assert.equal(accepted.status,200,await accepted.text());
    const extra=new FormData();extra.append('certificate',new Blob([pdf().buffer],{type:'application/pdf'}),'certificate.pdf');extra.append('studentId','someone-else');
    assert.equal((await fetch(endpoint,{method:'PUT',body:extra})).status,400);
    const big=new FormData();big.append('certificate',new Blob([Buffer.alloc(10485761)],{type:'application/pdf'}),'certificate.pdf');
    assert.equal((await fetch(endpoint,{method:'PUT',body:big})).status,413);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
