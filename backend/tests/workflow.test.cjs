const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {PGlite}=require('@electric-sql/pglite');
const ExcelJS=require('exceljs');
const bcrypt=require('bcryptjs');
const Module=require('node:module');
process.env.EMAIL_OUTBOX_KEY='ab'.repeat(32);
process.env.FRONTEND_LOGIN_URL='http://localhost/login';
process.env.JWT_SECRET='isolated-workflow-regression-no-real-secrets';
let db,services,smtp,mail=[];
const query=async(sql,args)=>{const result=await db.query(sql,args);return {...result,rowCount:Math.max(result.affectedRows??0,result.rows.length)};};
const database={query,pool:{connect:async()=>({query,release(){}})}};
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){if(request.endsWith('/config/database'))return database;return originalLoad.apply(this,arguments);};
const rows=async(sql,args)=>(await query(sql,args)).rows;
const count=async(table)=>Number((await rows(`SELECT count(*)::int AS n FROM "${table}"`))[0].n);
const enterprise=(key='first',code='DN01',email='hr@example.test',position='DEV01')=>({kind:'ENTERPRISE',windowId:1,idempotencyKey:key,rows:[{code,email,fullName:'HR Demo',name:'Demo Enterprise',positions:[{code:position,title:'Developer',description:'Internship',requirements:'TypeScript',capacity:5}]}]});
const actor={userId:5,roleCode:'ENTERPRISE'};
async function seedAssignment({enterpriseId=1,status='ACTIVE'}={}){
 await query('INSERT INTO "StudentEnterpriseCoordination" ("OJTSemesterID") VALUES (1)');
 return (await rows('INSERT INTO "InternshipAssignments" ("CoordinationID","StudentID","EnterpriseID","PositionID","StartDate","EndDate","Status") VALUES ((SELECT max("CoordinationID") FROM "StudentEnterpriseCoordination"),1,$1,1,current_date-10,current_date+10,$2) RETURNING "AssignmentID"',[enterpriseId,status]))[0].AssignmentID;
}
async function excel(headers,data,kind='STUDENT'){
 const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Import');sheet.addRow(headers);for(const row of data)sheet.addRow(row);
 return services.parseImportSheet({kind,idempotencyKey:'excel',windowId:'1'},{originalname:'import.xlsx',buffer:Buffer.from(await book.xlsx.writeBuffer())});
}
before(async()=>{
 db=new PGlite();await db.exec(fs.readFileSync(path.join(__dirname,'workflow-fixture.sql'),'utf8'));
 services={...require('../src/modules/imports/import.service.ts'),...require('../src/modules/imports/import-sheet.service.ts'),...require('../src/modules/imports/email.crypto.ts'),...require('../src/modules/qhdn/task.service.ts'),...require('../src/modules/qhdn/workflow.service.ts'),...require('../src/modules/ojt-results/completion-notification.service.ts'),results:require('../src/modules/ojt-results/result.service.ts'),...require('../src/jobs/provisioning.ts')};
 smtp=net.createServer(socket=>{
  socket.setEncoding('utf8');socket.write('220 localhost test SMTP\r\n');let buffer='',inData=false,data='';
  socket.on('data',chunk=>{buffer+=chunk;for(;;){const end=buffer.indexOf('\r\n');if(end<0)break;const line=buffer.slice(0,end);buffer=buffer.slice(end+2);
   if(inData){if(line==='.'){mail.push(data);data='';inData=false;socket.write('250 queued\r\n');}else data+=line+'\r\n';continue;}
   if(/^EHLO|^HELO/.test(line))socket.write('250 localhost\r\n');else if(/^DATA/.test(line)){inData=true;socket.write('354 send data\r\n');}else if(/^QUIT/.test(line)){socket.end('221 bye\r\n');}else socket.write('250 OK\r\n');
  }});
 });await new Promise(resolve=>smtp.listen(0,'127.0.0.1',resolve));
 Object.assign(process.env,{SMTP_HOST:'127.0.0.1',SMTP_PORT:String(smtp.address().port),SMTP_FROM:'ojt@example.test',SMTP_SECURE:'false'});delete process.env.SMTP_USER;delete process.env.SMTP_PASSWORD;
});
beforeEach(async()=>{
 const tables=(await rows("SELECT tablename FROM pg_tables WHERE schemaname='public'")).map(r=>'"'+r.tablename+'"');
 await db.exec('TRUNCATE '+tables.join(',')+' RESTART IDENTITY CASCADE');mail=[];
 await db.exec(`INSERT INTO "Roles" ("RoleCode") VALUES ('OJT_COORD'),('ADMIN'),('ACADEMIC'),('STUDENT'),('ENTERPRISE');
 INSERT INTO "Users" ("Username","Email","FullName","RoleID") VALUES ('coord','coord@example.test','Coordinator',1),('admin','admin@example.test','Admin',2),('academic','academic@example.test','Academic',3),('student','student@example.test','Student',4);
 INSERT INTO "AcademicYears" ("StartDate","EndDate") VALUES ('2000-01-01','2200-12-31');
 INSERT INTO "AcademicPeriods" ("AcademicYearID","PeriodCode","Name","Kind","Status","StartDate","EndDate") VALUES (1,'TERM','Term','SEMESTER','ACTIVE',current_date-90,current_date+90);
 INSERT INTO "OJTSemesters" ("AcademicPeriodID","AcademicYearID","SemesterCode","StartDate","EndDate") VALUES (1,1,'OJT',current_date-90,current_date+90);
 INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Status","StartsAt","EndsAt") VALUES (1,1,'OPEN',now()-interval '1 day',now()+interval '30 days');
 INSERT INTO "TrainingPrograms" DEFAULT VALUES;
 INSERT INTO "Cohorts" ("Status","EnrollmentYear") VALUES ('ACTIVE',2000);
 INSERT INTO "CohortGroups" VALUES (1,'A',1);
 INSERT INTO "Students" ("UserID","StudentCode","ProgramID") VALUES (4,'BASE',1);
 INSERT INTO "Courses" ("CourseCode") VALUES ('PRF192'),('PRO192');`);
});
after(async()=>{Module._load=originalLoad;if(smtp)await new Promise(resolve=>smtp.close(resolve));await db?.close();});

test('only QHDN imports enterprise accounts; preview does not create accounts/posts/emails',async()=>{
 await assert.rejects(()=>services.importAccounts(enterprise(),2),e=>e.statusCode===403);
 const preview=await services.importAccounts(enterprise(),1,true);assert.equal(preview.created,1);
 assert.equal(await count('Users'),4);assert.equal(await count('RecruitmentPosts'),0);assert.equal(await count('EmailOutbox'),0);
});
test('new enterprise gets a distinct business code, random hashed password and a delivered welcome email',async()=>{
 const result=await services.importAccounts(enterprise(),1);assert.equal(result.created,1);
 const user=(await rows('SELECT * FROM "Users" WHERE "Email"=$1',['hr@example.test']))[0];
 const entity=(await rows('SELECT * FROM "Enterprises"'))[0];assert.equal(entity.EnterpriseCode,'DN01');assert.equal(typeof entity.EnterpriseID,'number');
 const outbox=(await rows('SELECT * FROM "EmailOutbox"'))[0];const message=services.decryptEmail(outbox.EncryptedPayload);
 const password=/Mật khẩu tạm: ([^\n]+)/.exec(message.text)[1];assert.equal(password.length,24);assert.ok(await bcrypt.compare(password,user.PasswordHash));assert.equal(user.MustChangePassword,true);assert.ok(user.TemporaryPasswordExpiresAt>Date.now());
 assert.equal((await services.deliverEmails()),1);assert.equal(mail.length,1);assert.match(mail[0],/To: hr@example.test/);
 const sent=(await rows('SELECT * FROM "EmailOutbox"'))[0];assert.equal(sent.Status,'SENT');assert.equal(sent.EncryptedPayload,null);
 const replay=await services.importAccounts(enterprise(),1);assert.equal(replay.replayed,true);assert.equal(await count('Users'),5);assert.equal(await count('RecruitmentPosts'),1);assert.equal(await count('EmailOutbox'),1);
});
test('duplicate email with a different input code reuses identity, preserves old posts and adds only new recruitment',async()=>{
 await services.importAccounts(enterprise(),1);const before=(await rows('SELECT * FROM "RecruitmentPosts"'))[0];const hash=(await rows('SELECT "PasswordHash" FROM "Users" WHERE "UserID"=5'))[0].PasswordHash;
 const result=await services.importAccounts(enterprise('second','ALIAS','HR@EXAMPLE.TEST','DEV02'),1);assert.equal(result.created,0);assert.equal(result.updated,1);
 assert.equal(await count('Users'),5);assert.equal(await count('Enterprises'),1);assert.equal(await count('RecruitmentPosts'),2);assert.equal(await count('EmailOutbox'),1);
 assert.deepEqual((await rows('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=1'))[0],before);assert.equal((await rows('SELECT "EnterpriseCode" FROM "Enterprises"'))[0].EnterpriseCode,'DN01');assert.equal((await rows('SELECT "PasswordHash" FROM "Users" WHERE "UserID"=5'))[0].PasswordHash,hash);
 await assert.rejects(()=>services.importAccounts(enterprise('duplicate-position'),1),e=>e.errorCode==='RECRUITMENT_CODE_EXISTS');assert.equal(await count('RecruitmentPosts'),2);
});
test('code/email collisions and closed intake roll back without altering old data',async()=>{
 await services.importAccounts(enterprise(),1);await services.importAccounts(enterprise('other','DN02','other@example.test','DEV02'),1);
 await assert.rejects(()=>services.importAccounts(enterprise('conflict','DN01','other@example.test','DEV03'),1),e=>e.errorCode==='IDENTITY_CONFLICT');assert.equal(await count('RecruitmentPosts'),2);
 await query('UPDATE "RecruitmentWindows" SET "Status"=\'CLOSED\'');await assert.rejects(()=>services.importAccounts(enterprise('closed','DN03','new@example.test'),1),e=>e.errorCode==='RECRUITMENT_WINDOW_CLOSED');assert.equal(await count('Enterprises'),2);
});
test('enterprise Excel groups positions and commits through the same import flow',async()=>{
 const input=await excel(['code','email','fullName','name','positionCode','title','description','requirements','capacity'],[['DN01','hr@example.test','HR','Demo','DEV01','Dev','Desc','Req',2],['DN01','hr@example.test','HR','Demo','DEV02','Tester','Desc','Req',2]],'ENTERPRISE');
 assert.equal(input.windowId,1);assert.equal(input.rows.length,1);assert.equal(input.rows[0].positions.length,2);
 await services.importAccounts(input,1);assert.equal(await count('RecruitmentPosts'),2);assert.equal(await count('Users'),5);
});
test('student Excel imports identity, placement and two course attempts atomically',async()=>{
 const headers=['code','email','fullName','programId','cohortId','groupCode','currentAcademicPeriodId','courseCode','academicPeriodId','courseStatus','score','gradePoints','grade','phone'];
 const input=await excel(headers,[['SV01','newstudent@example.test','Student New',1,1,'A',1,'PRF192',1,'PASSED',8,3.5,'B','0901234567'],['SV01','newstudent@example.test','Student New',1,1,'A',1,'PRO192',1,'FAILED',4,1,'D','0901234567']]);
 assert.equal(input.rows.length,1);assert.equal(input.rows[0].academic.courseResults.length,2);
 const result=await services.importAccounts(input,3);assert.equal(result.created,1);assert.equal(await count('StudentCourseResults'),2);assert.equal(await count('StudentAcademicPlacements'),1);assert.equal(await count('AcademicImportBatches'),1);
 assert.equal((await rows('SELECT "CurrentSemester" FROM "Students" WHERE "StudentCode"=\'SV01\''))[0].CurrentSemester,1);
 const bad=structuredClone(input);bad.idempotencyKey='bad';bad.rows[0].code='SV02';bad.rows[0].email='another@example.test';bad.rows[0].academic.courseResults[1].courseCode='UNKNOWN';
 await assert.rejects(()=>services.importAccounts(bad,3));assert.equal(await count('Students'),2);assert.equal(await count('Users'),5);assert.equal(await count('StudentCourseResults'),2);
});
test('Excel rejects conflicting profiles, duplicate headers and missing course codes',async()=>{
 await assert.rejects(()=>excel(['code','email','fullName','programId'],[['SV','s@example.test','A',1],['SV','s@example.test','B',1]]),/inconsistent identity/);
 await assert.rejects(()=>excel(['code','code'],[['SV','SV']]),/Duplicate column/);
 await assert.rejects(()=>excel(['code','email','score'],[['SV','s@example.test',8]]),/courseCode is required/);
});
test('bulk tasks create student × task combinations, replay safely and reject changed payloads',async()=>{
 await services.importAccounts(enterprise(),1);const first=await seedAssignment(),second=await seedAssignment();const due=(await rows("SELECT (current_date+2)::text AS due"))[0].due;
 const body={assignmentIds:[first,second],idempotencyKey:'tasks',tasks:[{name:'Research',dueDate:due},{name:'Build',dueDate:due}]};
 const result=await services.assignTasks(body,actor);assert.equal(result.created,4);assert.equal(await count('InternshipTasks'),4);
 assert.equal((await services.assignTasks(body,actor)).replayed,true);assert.equal(await count('InternshipTasks'),4);
 await assert.rejects(()=>services.assignTasks({...body,tasks:[{name:'Changed',dueDate:due}]},actor),e=>e.statusCode===409);
});
test('bulk tasks reject foreign enterprise, completed internships, past/outside dates, duplicate IDs and role violations',async()=>{
 await services.importAccounts(enterprise(),1);await services.importAccounts(enterprise('other','DN02','other@example.test','OTHER'),1);
 const own=await seedAssignment(),foreign=await seedAssignment({enterpriseId:2}),completed=await seedAssignment({status:'COMPLETED'});const due=(await rows("SELECT (current_date+2)::text AS due"))[0].due;
 const body={assignmentIds:[own,foreign],idempotencyKey:'tasks',tasks:[{name:'Research',dueDate:due}]};
 await assert.rejects(()=>services.assignTasks(body,actor),e=>e.statusCode===403);assert.equal(await count('InternshipTasks'),0);
 await assert.rejects(()=>services.assignTasks({...body,assignmentIds:[completed]},actor),e=>e.statusCode===409);
 for(const delta of [-1,11]){const invalidDate=(await rows(`SELECT (current_date+${delta})::text AS due`))[0].due;await assert.rejects(()=>services.assignTasks({...body,assignmentIds:[own],tasks:[{name:'Task',dueDate:invalidDate}]},actor));}
 await assert.rejects(()=>services.assignTasks({...body,assignmentIds:[own,own]},actor));await assert.rejects(()=>services.assignTasks(body,{userId:1,roleCode:'OJT_COORD'}),e=>e.statusCode===403);assert.equal(await count('InternshipTasks'),0);
 await assert.rejects(()=>services.assignTasks({...body,assignmentIds:Array.from({length:501},(_,i)=>i+1)},actor));
 await assert.rejects(()=>services.assignTasks({...body,assignmentIds:[own],tasks:Array.from({length:51},()=>({name:'Task',dueDate:due}))},actor));
 await assert.rejects(()=>services.assignTasks({...body,assignmentIds:Array.from({length:101},(_,i)=>i+1),tasks:Array.from({length:50},()=>({name:'Task',dueDate:due}))},actor));
});
test('enterprise score is immediately official for academic list and students; end of term queues and delivers one email',async()=>{
 await services.importAccounts(enterprise(),1);const id=await seedAssignment();const body={completionScore:8,attitudeScore:9,skillScore:7,overallScore:8.25,comments:'Good work',reason:'Final evaluation'};
 await assert.rejects(()=>services.evaluate(id,body,{userId:1,roleCode:'OJT_COORD'}),e=>e.statusCode===403);
 await services.evaluate(id,body,actor);const result=await services.results.list({});assert.equal(result.total,1);assert.equal(result.items[0].officialScore,8.25);assert.equal(result.items[0].status,'CONFIRMED');
 assert.equal(result.items[0].student.studentCode,'BASE');assert.equal(result.items[0].student.fullName,'Student');assert.equal(result.items[0].company.code,'DN01');assert.equal(result.items[0].position.title,'Developer');assert.equal(result.items[0].program.name,'Software Engineering');assert.equal(result.items[0].semester.code,'OJT');assert.equal(result.items[0].evaluatedByUser.fullName,'HR Demo');assert.equal(result.items[0].confirmedByUser.fullName,'HR Demo');
 assert.equal((await services.results.list({},undefined,false,4)).total,1);assert.equal((await services.results.list({},undefined,false,3)).total,0);
 assert.equal(await services.notifyCompletedInternships(),0);
 await db.exec('UPDATE "InternshipAssignments" SET "EndDate"=current_date-1;UPDATE "OJTSemesters" SET "EndDate"=current_date-1');
 await assert.rejects(()=>services.evaluate(id,{...body,overallScore:9},actor),e=>e.errorCode==='OJT_SCORE_FINALIZED');
 assert.equal(await services.notifyCompletedInternships(),1);assert.equal(await services.notifyCompletedInternships(),0);
 const email=(await rows('SELECT * FROM "EmailOutbox" WHERE "Kind"=\'OJT_RESULT\''))[0];assert.equal(email.Recipient,'student@example.test');assert.match(services.decryptEmail(email.EncryptedPayload).text,/Điểm OJT chính thức: 8.25/);
 assert.equal(await services.deliverEmails(),2);assert.equal(mail.length,2);assert.equal(await count('OJTCompletionDeliveries'),1);
});
test('Swagger loads, all JSON adapters have route targets and removed APIs are absent; original CV contract remains',async()=>{
 const {swaggerSpec,jsonInputOperations}=require('../src/config/swagger.ts');assert.ok(swaggerSpec.paths['/api/students/me/cv'].post);
 for(const path of Object.keys(swaggerSpec.paths))assert.ok(!/\{/.test(path));
 const removed=['/api/student/cv','/api/student/applications','/api/recruitment-posts','/api/company-imports'];
 for(const path of Object.keys(swaggerSpec.paths))for(const old of removed)assert.ok(!path.startsWith(old)&&!path.startsWith('/api/json'+old.slice(4)));
 const mounts=[['admin/admin',''],['academic/academic',''],['qhdn/qhdn',''],['student-portal/portal',''],['recruitment/recruitment','/recruitment'],['qhdn/enterprise','/enterprise'],['academic-reporting/report',''],['ojt-results/result',''],['academic/workflow',''],['students/student',''],['curriculum/curriculum',''],['combo-registration/combo',''],['eligibility/eligibility',''],['ojt-registration/registration',''],['imports/import','/imports'],['auth/auth','/auth'],['accounts/account','/accounts'],['system/roles/role','/roles'],['system/health/health','/health']];
 const routes=new Set();for(const [file,prefix] of mounts){const router=require('../src/modules/'+file+'.routes.ts').default;for(const layer of router.stack)if(layer.route)for(const method of Object.keys(layer.route.methods))routes.add(method.toUpperCase()+' '+('/api'+prefix+(layer.route.path==='/'?'':layer.route.path)).replace(/:([A-Za-z0-9_]+)/g,'{$1}'));}
 for(const op of jsonInputOperations)assert.ok(routes.has(op.sourceMethod.toUpperCase()+' '+op.sourcePath),op.sourcePath);
 for(const [path,item] of Object.entries(swaggerSpec.paths))for(const method of ['get','post','put','patch','delete'])if(item[method]){
  const source=item[method]['x-original-operation']??{method:method.toUpperCase(),path};
  assert.ok(routes.has(source.method+' '+source.path),source.method+' '+source.path);
 }
 assert.ok(!routes.has('POST /api/ojt-results'));assert.ok(!routes.has('PATCH /api/ojt-results/{id}'));assert.ok(!routes.has('PUT /api/assignments/{id}/internship-evaluation'));
});




test('HTTP routes accept imports, enforce password change and roles, dispatch JSON result reads and return 404 for retired APIs',async()=>{
 const app=require('../src/app.ts').default;const jwt=require('jsonwebtoken');
 let server;await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});const base='http://127.0.0.1:'+server.address().port;
 const token=id=>jwt.sign({userId:id,authVersion:0},process.env.JWT_SECRET,{expiresIn:'1h'});
 const request=(url,body,id=1,method='POST')=>fetch(base+url,{method,headers:{Authorization:'Bearer '+token(id),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 try {
  const docs=await fetch(base+'/api-docs/openapi.json');assert.equal(docs.status,200);const spec=await docs.json();assert.equal(spec.paths['/api/json/ojt-results/list'].post.summary,'Danh sách điểm OJT chính thức do doanh nghiệp đánh giá');
  assert.equal((await request('/api/imports/commit',enterprise(),2)).status,403);
  let response=await request('/api/imports/commit',enterprise());assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  const id=await seedAssignment();const due=(await rows('SELECT (current_date+1)::text AS due'))[0].due;const task={idempotencyKey:'http-task',assignmentIds:[id],tasks:[{name:'Task',dueDate:due}]};
  response=await request('/api/enterprise/tasks/bulk',task,5);assert.equal(response.status,403);assert.equal((await response.json()).errorCode,'PASSWORD_CHANGE_REQUIRED');
  await query('UPDATE "Users" SET "MustChangePassword"=false WHERE "UserID"=5');
  response=await request('/api/enterprise/tasks/bulk',task,5);assert.equal(response.status,200,JSON.stringify(await response.clone().json()));assert.equal((await response.json()).data.created,1);
  assert.equal((await request('/api/enterprise/tasks/bulk',task,3)).status,403);
  response=await request('/api/enterprise/internships/'+id+'/evaluation',{completionScore:8,attitudeScore:8,skillScore:8,overallScore:8,reason:'Official result'},5,'PUT');assert.equal(response.status,200);
  response=await request('/api/json/ojt-results/list',{},3);assert.equal(response.status,200,JSON.stringify(await response.clone().json()));const result=await response.json();assert.equal(result.data.items[0].officialScore,8);
  assert.equal(result.data.items[0].student.fullName,'Student');assert.equal(result.data.items[0].company.code,'DN01');assert.equal(result.data.items[0].position.title,'Developer');assert.equal(result.data.items[0].semester.code,'OJT');
  response=await request('/api/json/student/ojt-results/list',{studentId:1},4);assert.equal(response.status,200);assert.equal((await response.json()).data.items[0].officialScore,8);
  for(const [url,method] of [['/api/recruitment/posts','POST'],['/api/json/recruitment/posts','POST'],['/api/student/cv','POST'],['/api/ojt-results','POST'],['/api/ojt-results/1/confirm','POST'],['/api/assignments/1/internship-evaluation','PUT']])assert.equal((await request(url,{},1,method)).status,404,url);
  // Exercise the actual multipart upload route for student Excel.
  const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Students');sheet.addRow(['code','email','fullName','programId','cohortId','groupCode','currentAcademicPeriodId','courseCode','academicPeriodId','courseStatus','score']);sheet.addRow(['SVHTTP','shttp@example.test','HTTP Student',1,1,'A',1,'PRF192',1,'PASSED',9]);
  const form=new FormData();form.set('kind','STUDENT');form.set('idempotencyKey','http-excel');form.set('file',new Blob([await book.xlsx.writeBuffer()]),'students.xlsx');
  response=await fetch(base+'/api/imports/commit',{method:'POST',headers:{Authorization:'Bearer '+token(3)},body:form});assert.equal(response.status,200,JSON.stringify(await response.clone().json()));assert.equal((await response.json()).created,1);assert.equal(await count('StudentCourseResults'),1);
 } finally {await new Promise(resolve=>server.close(resolve));}
});

test('list display context is batched, preserves source IDs and existing details, and never fetches credentials',async()=>{
 await services.importAccounts(enterprise(),1);
 await query('INSERT INTO "OJTRegistrations" ("StudentID","OJTSemesterID","Status") VALUES (1,1,\'HANDED_OFF\')');
 await query('INSERT INTO "ProgramCombos" ("ComboCode","ComboName","ProgramID") VALUES (\'COMBO-SE\',\'Software Combo\',1)');
 await query('INSERT INTO "Specializations" ("SpecializationCode","SpecializationName","MajorID") VALUES (\'SE\',\'Software\',1)');
 await query('UPDATE "Users" SET "PasswordHash"=\'MUST_NOT_LEAK\' WHERE "UserID"=1');
 const {enrichListRows}=require('../src/shared/list-context.ts');let calls=0;
 const input={id:10,studentId:1,companyId:1,positionId:1,programId:1,cohortId:1,ojtSemesterId:1,academicYearId:1,academicPeriodId:1,entryAcademicPeriodId:1,currentAcademicPeriodId:1,userId:1,courseId:1,sourceCourseId:1,targetCourseId:2,choices:[2,1],courseIds:[1,2],registrationIds:[1,999],comboId:1,comboIds:[1],majorId:1};
 const items=await enrichListRows({query:async(...args)=>{calls++;return query(...args);}},[input,{...input,id:11}]);
 assert.equal(calls,1);assert.equal(items.length,2);const item=items[0];
 assert.equal(item.student.studentCode,'BASE');assert.equal(item.student.fullName,'Student');assert.equal(item.company.code,'DN01');assert.equal(item.position.title,'Developer');assert.equal(item.program.name,'Software Engineering');assert.equal(item.cohort.name,'Test Cohort');assert.equal(item.semester.name,'OJT Term');assert.equal(item.academicPeriod.code,'TERM');assert.equal(item.entryAcademicPeriod.name,'Term');assert.equal(item.currentAcademicPeriod.name,'Term');assert.equal(item.academicYear.code,'TEST');assert.equal(item.course.code,'PRF192');assert.equal(item.targetCourse.code,'PRO192');assert.deepEqual(item.courseChoices.map(c=>c.code),['PRO192','PRF192']);assert.equal(item.registrations[0].fullName,'Student');assert.equal(item.registrations[1],null);assert.equal(item.combo.name,'Software Combo');assert.equal(item.combos[0].code,'COMBO-SE');assert.equal(item.major.name,'Software');assert.equal(item.user.fullName,'Coordinator');assert.deepEqual(item.registrationIds,[1,999]);assert.deepEqual(input.choices,[2,1]);assert.equal(input.student,undefined);
 assert.ok(!/MUST_NOT_LEAK|PasswordHash|EncryptedPayload|AuthVersion/.test(JSON.stringify(items)));
 const [existing]=await enrichListRows(database,[{courseIds:[1],courses:[{id:1,name:'Historical course',snapshot:true}]}]);assert.equal(existing.courses[0].name,'Historical course');assert.equal(existing.courses[0].snapshot,true);
 const [missing]=await enrichListRows(database,[{studentId:999,companyId:null}]);assert.equal(missing.student,null);assert.equal(missing.company,null);
 let emptyCalls=0;assert.deepEqual(await enrichListRows({query:async()=>{emptyCalls++;}},[]),[]);assert.equal(emptyCalls,0);
});

test('task lists include student/company/position/semester, preserve pagination and enforce student scope',async()=>{
 await services.importAccounts(enterprise(),1);const own=await seedAssignment(),other=await seedAssignment();
 await query('INSERT INTO "Users" ("Username","Email","FullName","RoleID") VALUES (\'other-student\',\'otherstudent@example.test\',\'Other Student\',4)');
 await query('INSERT INTO "Students" ("UserID","StudentCode","ProgramID") VALUES (6,\'OTHER\',1)');await query('UPDATE "InternshipAssignments" SET "StudentID"=2 WHERE "AssignmentID"=$1',[other]);
 const due=(await rows('SELECT (current_date+1)::text AS due'))[0].due;await services.assignTasks({assignmentIds:[own,other],idempotencyKey:'list-tasks',tasks:[{name:'Task',dueDate:due}]},actor);
 const all=await services.listTasks({companyId:1,page:1,limit:1},actor);assert.equal(all.total,2);assert.equal(all.items.length,1);assert.equal(all.page,1);
 const mine=await services.listTasks({studentId:1}, {userId:4,roleCode:'STUDENT'});assert.equal(mine.total,1);const item=mine.items[0];assert.equal(item.assignmentId,own);assert.equal(item.student.fullName,'Student');assert.equal(item.company.name,'Demo Enterprise');assert.equal(item.position.title,'Developer');assert.equal(item.semester.code,'OJT');assert.equal(item.assignment.status,'ACTIVE');assert.ok(item.assignedDate);assert.ok(!JSON.stringify(mine).includes('Other Student'));
 const empty=await services.listTasks({companyId:1,page:99,limit:20},actor);assert.equal(empty.total,2);assert.deepEqual(empty.items,[]);
});

test('advisory history includes period/semester/creator and each detail row includes the student identity',async()=>{
 const {advisoryRuns}=require('../src/modules/student-portal/advisory.service.ts');
 await query('INSERT INTO "OJTAdvisoryRuns" ("Kind","Status","CreatedBy","Request") VALUES (\'SUMMARY\',\'COMPLETED\',3,$1)',[{ojtSemesterId:1,academicPeriodId:1}]);
 await query('INSERT INTO "OJTAdvisoryRunItems" ("RunID","StudentID","Status","Snapshot") VALUES (1,1,\'COMPLETED\',$1)',[{earnedCredits:90}]);
 const staff={userId:3,roleCode:'ACADEMIC'},runs=await advisoryRuns({},staff);assert.equal(runs.items[0].semester.code,'OJT');assert.equal(runs.items[0].academicPeriod.code,'TERM');assert.equal(runs.items[0].createdByUser.fullName,'Academic');
 const detail=await advisoryRuns({},staff,1);assert.equal(detail.items[0].studentId,1);assert.equal(detail.items[0].student.studentCode,'BASE');assert.equal(detail.items[0].student.fullName,'Student');assert.equal(detail.items[0].snapshot.earnedCredits,90);
 await assert.rejects(()=>advisoryRuns({}, {userId:4,roleCode:'STUDENT'}),e=>e.statusCode===403);
});

test('every Swagger list documents display fields, with detailed task, result and advisory contexts',()=>{
 const {swaggerSpec:spec}=require('../src/config/swagger.ts');let count=0;
 for(const [path,entry]of Object.entries(spec.paths)){
  const op=entry.post;if(!op||!path.endsWith('/list'))continue;count++;
  const root=op.responses?.['200']?.content?.['application/json']?.schema,data=root?.properties?.data;
  const item=(data?.type==='array'?data.items:data?.properties?.items?.items)??root?.properties?.items?.items;
  const names=Object.keys(item?.properties??{});assert.ok(names.length>1,path+' must describe more than an ID');
  assert.ok(names.some(name=>!/^id$|Id$|IDs?$/.test(name)),path+' must describe readable fields');
 }
 assert.equal(count,48);
 const fields=path=>spec.paths[path].post.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties;
 for(const path of ['/api/json/internship-tasks/list','/api/json/ojt-results/list','/api/json/student/ojt-results/list'])for(const key of ['student','company','position','semester'])assert.ok(fields(path)[key],path+' '+key);
 assert.ok(fields('/api/json/academic/advisory-runs/list').createdByUser);
 assert.ok(fields('/api/json/ojt-semesters/eligible-student-handoffs/list').registrations);
});

test('enterprise recruitment exposes only consolidated post list',()=>{
 const posts=require('../src/modules/recruitment/post.service.ts');assert.equal(posts.updatePost,undefined);
 const {swaggerSpec:spec}=require('../src/config/swagger.ts');
 assert.equal(spec.paths['/api/json/recruitment/posts']?.patch,undefined);
 assert.ok(spec.paths['/api/json/recruitment/posts/list'].post);
 const routes=fs.readFileSync(path.join(__dirname,'../src/modules/recruitment/recruitment.routes.ts'),'utf8');
 assert.ok(!routes.includes("router.patch('/posts/:id'"));
 assert.ok(!routes.includes("router.get('/windows'"));
 assert.equal(spec.paths['/api/json/recruitment/windows/list'],undefined);
 assert.equal(spec.paths['/api/recruitment/windows']?.get,undefined);
});

test('recruitment lists detailed posts by company with scope enforcement',async()=>{
 await services.importAccounts(enterprise(),1);
 await services.importAccounts(enterprise('second','DN02','second@example.test','DEV02'),1);
 const {listPosts}=require('../src/modules/recruitment/post.service.ts');
 const staff={userId:1,roleCode:'OJT_COORD'};
 await assert.rejects(()=>listPosts({},staff),e=>e.statusCode===400);
 assert.equal((await listPosts({companyId:2},staff)).total,1);
 const result=await listPosts({companyId:1,page:1,limit:20},staff);
 assert.equal(result.total,1);assert.equal(result.items[0].companyId,1);
 assert.equal(result.items[0].positions[0].requirements,'TypeScript');
 assert.equal(result.items[0].positions[0].capacity,5);
 assert.equal((await listPosts({companyId:1},actor)).total,1);
 await assert.rejects(()=>listPosts({companyId:2},actor),e=>e.statusCode===403);
 await assert.rejects(()=>listPosts({companyId:0},staff),e=>e.statusCode===400);
 assert.equal((await listPosts({companyId:999},staff)).total,0);
 const {swaggerSpec}=require('../src/config/swagger.ts');
 assert.ok(swaggerSpec.paths['/api/json/recruitment/posts/list'].post.requestBody.content['application/json'].schema.properties.companyId);
});



test('candidate JSON list requires explicit companyId and returns linked details within enterprise scope',async()=>{
 await services.importAccounts(enterprise(),1);
 await services.importAccounts(enterprise('second','DN02','second@example.test','DEV02'),1);
 await db.exec('UPDATE "Users" SET "MustChangePassword"=false WHERE "UserID"=5');
 await db.exec(`INSERT INTO "OJTRegistrations" ("StudentID","OJTSemesterID","Status","Application") VALUES (1,1,'APPROVED','{"skills":["TypeScript"],"cvUrl":"hidden"}');
 INSERT INTO "StudentCVVersions" ("StudentID","Filename","MimeType","SizeBytes","Sha256") VALUES (1,'cv.pdf','application/pdf',123,'hash');
 INSERT INTO "JobApplications" ("PostID","PositionID","CVID","CoverLetter","Status") VALUES (1,1,1,'Apply','PENDING');
 INSERT INTO "StudentEnterpriseCoordination" ("RegistrationID","ApplicationID","EnterpriseID","PositionID","OJTSemesterID","CoordinatedBy") VALUES (1,1,1,1,1,1),(1,NULL,2,2,1,1);`);
 const app=require('../src/app.ts').default,jwt=require('jsonwebtoken');let server;
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port;
 const request=(path,body,userId=5)=>fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+jwt.sign({userId,authVersion:0},process.env.JWT_SECRET),'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  for(const path of ['/api/json/enterprise/candidates/list','/api/json/enterprise/internships/list','/api/json/recruitment/posts/list']){
   assert.equal((await request(path,{})).status,400,path);
   assert.equal((await request(path,{companyId:0})).status,400,path);
   assert.equal((await request(path,{companyId:2})).status,403,path);
  }
  let response=await request('/api/json/enterprise/candidates/list',{companyId:1,page:1,limit:20});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));const list=(await response.json()).data;
  assert.equal(list.total,1);const item=list.items[0];
  assert.equal(item.company.id,1);assert.equal(item.student.studentCode,'BASE');assert.equal(item.position.requirements,'TypeScript');
  assert.equal(item.registration.status,'APPROVED');assert.equal(item.application.cvUrl,undefined);
  assert.equal(item.jobApplication.cv.filename,'cv.pdf');assert.equal(item.recruitmentPost.id,1);
  assert.equal(item.recruitmentPost.positions[0].capacity,5);assert.equal(item.coordinatedByUser.fullName,'Coordinator');
  response=await request('/api/json/enterprise/candidates/list',{companyId:1,studentId:999});assert.equal((await response.json()).data.total,0);
  response=await request('/api/json/enterprise/candidates/list',{companyId:1,page:2,limit:1});assert.deepEqual((await response.json()).data.items,[]);
  assert.equal((await request('/api/json/student/ojt-results/list',{},4)).status,400);
  assert.equal((await request('/api/json/student/ojt-results/list',{studentId:999},4)).status,403);
  assert.equal((await request('/api/json/recruitment/posts/list',{},1)).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('task list explicitly filters company and student with ownership checks',async()=>{
 await services.importAccounts(enterprise(),1);const assignmentId=await seedAssignment();
 const due=(await rows('SELECT (current_date+1)::text AS due'))[0].due;
 await services.assignTasks({assignmentIds:[assignmentId],idempotencyKey:'explicit-tasks',tasks:[{name:'Task',dueDate:due}]},actor);
 await assert.rejects(()=>services.listTasks({},actor),e=>e.statusCode===400);
 await assert.rejects(()=>services.listTasks({companyId:2},actor),e=>e.statusCode===403);
 await assert.rejects(()=>services.listTasks({studentId:999},{userId:4,roleCode:'STUDENT'}),e=>e.statusCode===403);
 const staff={userId:1,roleCode:'OJT_COORD'};
 assert.equal((await services.listTasks({companyId:1,studentId:1,positionId:1,ojtSemesterId:1},staff)).total,1);
 assert.equal((await services.listTasks({companyId:999},staff)).total,0);
 assert.equal((await services.listTasks({studentId:999},staff)).total,0);
});

test('all JSON lists document complete explicit identity inputs and required selectors',()=>{
 const {jsonInputOperations,swaggerSpec}=require('../src/config/swagger.ts');
 for(const op of jsonInputOperations.filter(op=>op.path.endsWith('/list'))){
  const schema=op.bodySchema,roles=op.operation['x-roles'];
  if(roles.includes('ENTERPRISE'))assert.ok(schema.properties.companyId,op.path);
  if(roles.includes('STUDENT'))assert.ok(schema.properties.studentId,op.path);
  for(const field of op.inputs)assert.ok(schema.properties[field.name],op.path+' '+field.name);
 }
 for(const path of ['/api/json/recruitment/posts/list','/api/json/enterprise/candidates/list','/api/json/enterprise/internships/list'])assert.ok(swaggerSpec.paths[path].post.requestBody.content['application/json'].schema.required.includes('companyId'));
 const post=swaggerSpec.paths['/api/json/enterprise/candidates/list'].post.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties.recruitmentPost;
 assert.ok(post.properties.content);assert.ok(post.properties.positions);
});



test('separate enterprise profile edits imported fields, preserves recruitment and enforces ownership',async()=>{
 await services.importAccounts(enterprise(),1);
 await services.importAccounts(enterprise('second','DN02','second@example.test','DEV02'),1);
 const {updateEnterpriseProfile:update}=require('../src/modules/qhdn/enterprise-profile.service.ts');
 const recruitmentBefore=await rows('SELECT * FROM "RecruitmentPosts" ORDER BY "PostID"');
 const positionsBefore=await rows('SELECT * FROM "InternshipPositions" ORDER BY "PositionID"');
 const result=await update({companyId:1,name:'Updated Company',address:'Address',industry:'Software',contactPersonName:'HR Contact',contactPhone:'0901234567',contactEmail:'HR@example.test',positionTitle:'HR Manager'},actor);
 assert.ok(result.createdAt);assert.ok(result.representative.id);
 assert.equal(result.id,1);assert.equal(result.name,'Updated Company');assert.equal(result.contactEmail,'hr@example.test');assert.equal(result.representative.positionTitle,'HR Manager');assert.equal(result.representative.fullName,'HR Demo');
 assert.equal(result.summary,undefined);assert.equal(result.posts,undefined);
 const partial=await update({companyId:1,address:null},actor);assert.equal(partial.address,null);assert.equal(partial.name,'Updated Company');
 await assert.rejects(()=>update({companyId:2,name:'Foreign'},actor),e=>e.statusCode===403);
 await assert.rejects(()=>update({companyId:1,name:'Forbidden'},{userId:1,roleCode:'OJT_COORD'}),e=>e.statusCode===403);
 for(const body of [{},{companyId:1},{name:'Missing ID'},{companyId:1,name:''},{companyId:1,contactEmail:'invalid'},{companyId:1,address:'x'.repeat(301)},{companyId:1,contactEmail:'a'.repeat(90)+'@example.test'},{companyId:1,status:'INACTIVE'},{companyId:1,positions:[]},{companyId:1,fullName:'Personal'}])await assert.rejects(()=>update(body,actor),e=>e.statusCode===400);
 assert.deepEqual(await rows('SELECT * FROM "RecruitmentPosts" ORDER BY "PostID"'),recruitmentBefore);
 assert.deepEqual(await rows('SELECT * FROM "InternshipPositions" ORDER BY "PositionID"'),positionsBefore);
 assert.equal((await rows('SELECT "Name" FROM "Enterprises" WHERE "EnterpriseID"=2'))[0].Name,'Demo Enterprise');
 assert.ok((await rows(`SELECT * FROM "AuditLogs" WHERE "Action"='UPDATE_OWN_PROFILE'`)).length);
 const {parseUpdateOwnProfileInput:parse}=require('../src/modules/accounts/account.schema.ts');
 assert.throws(()=>parse({companyId:1,company:{name:'Wrong endpoint'}}),e=>e.statusCode===400);
 const {swaggerSpec}=require('../src/config/swagger.ts');assert.ok(swaggerSpec.paths['/api/enterprise/profile'].get);assert.ok(swaggerSpec.paths['/api/enterprise/profile'].patch);
 assert.equal(swaggerSpec.paths['/api/accounts/me/profile'].patch.requestBody.content['application/json'].schema.properties.company,undefined);
 await query('UPDATE "Users" SET "MustChangePassword"=false WHERE "UserID"=5');
 const app=require('../src/app.ts').default,jwt=require('jsonwebtoken');let server;
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/enterprise/profile',{method:'PATCH',headers:{Authorization:'Bearer '+jwt.sign({userId:5,authVersion:0},process.env.JWT_SECRET),'Content-Type':'application/json'},body:JSON.stringify({companyId:1,industry:'IT Services'})});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));const body=await response.json();assert.equal(body.data.industry,'IT Services');assert.equal(body.data.representative.userId,5);assert.equal(body.data.posts,undefined);
 }finally{await new Promise(resolve=>server.close(resolve));}

});
