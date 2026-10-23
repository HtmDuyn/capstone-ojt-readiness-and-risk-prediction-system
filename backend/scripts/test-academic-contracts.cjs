// Runs the real Express routes against an isolated PostgreSQL-compatible database.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {once}=require('node:events');
const {PGlite}=require('@electric-sql/pglite');
const jwt=require('jsonwebtoken');
process.env.JWT_SECRET='academic-contract-test-only';

(async()=>{
  const db=new PGlite();
  const config=require('../dist/config/database');
  const originalPool=config.pool;
  const query=async(sql,args)=>{
    if(args===undefined&&sql.includes(';'))return (await db.exec(sql)).at(-1);
    const result=await db.query(sql,args);
    for(const row of result.rows)if(row.Content instanceof Uint8Array)row.Content=Buffer.from(row.Content);
    return {...result,rowCount:result.fields.length?result.rows.length:result.affectedRows};
  };
  config.pool={query,connect:async()=>({query,release(){}})};
  let server;
  try{
    await db.exec(fs.readFileSync(path.join(__dirname,'../DB'),'utf8'));
    const actor=(await query(`SELECT "UserID" id FROM "Users" WHERE "Username"='academic01'`)).rows[0].id;
    const student=(await query(`SELECT "StudentID" id,"UserID" user_id FROM "Students" ORDER BY "StudentID" LIMIT 1`)).rows[0];
    const program=(await query('SELECT "ProgramID" id FROM "TrainingPrograms" ORDER BY "ProgramID" LIMIT 1')).rows[0].id;
    const course=(await query('SELECT "CourseID" id FROM "ProgramCourses" WHERE "ProgramID"=$1 AND "EntryKind"=\'COURSE\' LIMIT 1',[program])).rows[0].id;
    await db.exec(`
      INSERT INTO "AcademicYears"("YearCode","StartDate","EndDate","Status") VALUES
        ('2026','2026-01-01','2026-12-31','ACTIVE'),('2027','2027-01-01','2027-12-31','PLANNED');
      INSERT INTO "AcademicPeriods"("AcademicYearID","PeriodCode","Name","Kind","ParentPeriodID","StartDate","EndDate") VALUES
        (1,'PREP','Preparation','SEMESTER',NULL,'2026-01-01','2026-04-30'),
        (1,'BLOCK','Block 3','BLOCK3',1,'2026-05-01','2026-05-31'),
        (1,'OJT','OJT','SEMESTER',NULL,'2026-06-01','2026-08-31'),
        (2,'NEXT','Next OJT','SEMESTER',NULL,'2027-01-01','2027-04-30');
      INSERT INTO "OJTSemesters"("AcademicYearID","AcademicPeriodID","SemesterCode","Name","StartDate","EndDate","Status") VALUES
        (1,3,'OJT-2026','OJT 2026','2026-06-01','2026-08-31','ACTIVE'),
        (2,4,'OJT-2027','OJT 2027','2027-01-01','2027-04-30','PLANNED');
      INSERT INTO "Cohorts"("CohortCode","Name","EnrollmentYear") VALUES('TEST','Test cohort',2026);
      INSERT INTO "CohortGroups" VALUES(1,'A',1),(1,'B',1),(1,'C',1),(1,'D',1);
      INSERT INTO "StudentAcademicPlacements"("StudentID","CohortID","GroupCode","EntryAcademicPeriodID","CurrentAcademicPeriodID","UpdatedBy")
        VALUES(${student.id},1,'A',1,2,${actor});
      UPDATE "Students" SET "ProgramID"=${program} WHERE "StudentID"=${student.id};
      INSERT INTO "ComboPhaseSchedules"("AcademicPeriodID","Phase","StartsAt","EndsAt","Reason","ConfirmedBy")
        VALUES(1,'INITIAL','2026-01-01T00:00:00+07','2026-01-20T00:00:00+07','Test',${actor});
      INSERT INTO "OJTAssessmentWindows"("OJTSemesterID","BlockPeriodID","OpensAt","ClosesAt","ConfiguredBy","Reason","AssessmentAcademicPeriodID")
        VALUES(1,2,'2026-06-01T00:00:00+07','2026-06-02T00:00:00+07',${actor},'Test',1);
      INSERT INTO "ProgramOJTGradeMappings"("ProgramID","OJTSemesterID","CourseID","AcademicPeriodID","GradeBands","Reason","ConfirmedBy")
        VALUES(${program},1,${course},3,'[{"minimumScore":0,"outcome":"FAILED","gradePoints":0}]','Test',${actor});
      INSERT INTO "ComboRegistrationWindows"("Name","Phase","AcademicPeriodID","OJTSemesterID","Scope","StartsAt","EndsAt","CreatedBy")
        VALUES('Test window','INITIAL',1,1,'{}','2026-01-01T00:00:00+07','2026-01-20T00:00:00+07',${actor});
      INSERT INTO "OJTAdvisorySchedules"("AcademicPeriodID","OJTSemesterID","SendAt","AssessmentDeadline","Scope","UpdatedBy")
        VALUES(1,1,'2026-02-01T00:00:00+07','2026-06-02T00:00:00+07','{}',${actor});
      INSERT INTO "OJTAdvisoryRuns"("Kind","IdempotencyKey","RequestHash","Request","CreatedBy")
        VALUES('SUMMARY','test-run','test','{"ojtSemesterId":1,"academicPeriodId":1,"reason":"test"}',${actor});
      INSERT INTO "OJTAdvisoryRunItems"("RunID","StudentID") VALUES(1,${student.id});
      INSERT INTO "StudentCVFiles"("StudentID","FileName","MimeType","Content","Sha256","UploadedBy")
        VALUES(${student.id},'cv.pdf','application/pdf',decode('255044462d312e340a2525454f46','hex'),repeat('a',64),${student.user_id});
    `);
    const token=jwt.sign({userId:actor,authVersion:0},process.env.JWT_SECRET);
    const {academicOperations}=require('../dist/shared/academic-api-contract');
    const {swaggerSpec}=require('../dist/config/swagger');
    assert.deepEqual(swaggerSpec.paths['/api/academic-years'].get.parameters,[],'Year list must show no Swagger input fields');
    assert.deepEqual(swaggerSpec.paths['/api/academic-periods'].get.parameters,[],'Period list must show no Swagger input fields');
    assert.deepEqual(swaggerSpec.paths['/api/cohorts'].get.parameters,[],'Cohort list must show no Swagger input fields');
    assert.deepEqual(swaggerSpec.paths['/api/academic-years'].patch.parameters,[],'Year update must show only JSON body');
    assert.equal(swaggerSpec.paths['/api/academic-years/{id}'],undefined,'Legacy year update must not show a separate ID box');
    assert.deepEqual(swaggerSpec.paths['/api/academic-periods'].patch.parameters,[],'Period update must show only JSON body');
    assert.equal(swaggerSpec.paths['/api/academic-periods/{id}'],undefined,'Legacy period update must not show a separate ID box');
    assert.deepEqual(swaggerSpec.paths['/api/cohorts'].patch.parameters,[],'Cohort update must show only JSON body');
    assert.equal(swaggerSpec.paths['/api/cohorts/{id}'],undefined,'Legacy cohort update must not show a separate ID box');
    const app=require('../dist/app').default;
    server=app.listen(0,'127.0.0.1');await once(server,'listening');
    const origin='http://127.0.0.1:'+server.address().port;
    const responses=new Map();
    const urlFor=route=>route.replace('{semesterId}','1').replace('{exceptionId}','1').replace('{id}',String(route.startsWith('/students/')?student.id:route.startsWith('/curricula/')?program:1));
    const request=async(route,options={})=>{
      const result=await fetch(origin+'/api'+route,{...options,headers:{authorization:'Bearer '+token,...options.headers}});
      const raw=await result.text();
      let body;try{body=JSON.parse(raw);}catch{body=raw;}
      return {status:result.status,body,headers:result.headers};
    };
    let operations=0,reads=0,jsonChecks=0;
    for(const [route,methods]of Object.entries(academicOperations))for(const method of methods){
      operations++;
      const op=swaggerSpec.paths['/api'+route]?.[method];assert.ok(op,`${method} ${route} documented`);
      if(method==='get'){
        assert.equal(op.requestBody,undefined,route+' must not describe a GET body');
        assert.ok(!(op.parameters??[]).some(p=>p.in==='query'&&p.required),route+' must not require query inputs');
        const response=await request(urlFor(route));
        assert.equal(response.status,200,route+': '+JSON.stringify(response.body));
        if(typeof response.body==='object')assert.ok(!/PasswordHash|password_hash|EncryptedPayload/.test(JSON.stringify(response.body)),route+' must not expose credentials');
        responses.set(route,response);reads++;
      }else{
        if(op.requestBody)assert.deepEqual(Object.keys(op.requestBody.content),['application/json'],route+' must use JSON');
        const response=await request(urlFor(route),{method:method.toUpperCase(),headers:{'content-type':'application/x-www-form-urlencoded'},body:'name=test'});
        assert.equal(response.status,415,route+' rejects form input');jsonChecks++;
      }
    }
    assert.equal(responses.get('/academic/dashboard').body.data.semesterCount,2);
    assert.equal(responses.get('/students/{id}/eligibility').body.data.total,2);
    const single=await request('/students/'+student.id+'/eligibility?ojtSemesterId=1');assert.equal(single.body.data.ojtSemesterId,1);
    assert.equal(responses.get('/cohorts').body.items[0].groups[0].entryAcademicPeriod.code,'PREP');
    assert.equal(responses.get('/academic-years').body.items.find(y=>y.yearCode==='2026').periods.length,3);
    assert.equal(responses.get('/academic-periods').body.items.find(p=>p.kind==='BLOCK3').parentPeriod.code,'PREP');
    assert.ok(responses.get('/curricula').body.data.items.every(p=>Array.isArray(p.courses)&&Array.isArray(p.combos)&&Array.isArray(p.prerequisites)));
    assert.ok(responses.get('/ojt-semesters/{id}/assessment-window').body.data.blockPeriod);
    assert.ok(responses.get('/curricula/{id}/ojt-grade-mappings/{semesterId}').body.data.course);
    assert.equal(responses.get('/academic/alerts').body.data.scopes.find(s=>s.ojtSemesterId===2).assessmentDeadline,null);
    assert.equal(responses.get('/academic/advisory-runs').body.data.items[0].studentCount,1);
    const badQuery=await request('/academic-years?yearCode=INVALID',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(badQuery.status,400);
    const createYear=await request('/academic-years',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({yearCode:'2028',startDate:'2028-01-01',endDate:'2028-12-31'})});assert.equal(createYear.status,201);
    const updateYear=await request('/academic-years',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:1,yearCode:'UPDATED-2026',startDate:'2026-01-01',endDate:'2026-12-31',status:'ACTIVE'})});
    assert.equal(updateYear.status,200,JSON.stringify(updateYear.body));
    assert.equal(updateYear.body.data.yearCode,'UPDATED-2026');assert.equal(updateYear.body.data.periods.length,3);
    assert.equal(updateYear.body.data.periods.find(p=>p.kind==='BLOCK3').parentPeriod.code,'PREP');
    const patchYear=async body=>request('/academic-years',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await patchYear({status:'CLOSED'})).status,400,'ID is required');
    assert.equal((await patchYear({id:1})).status,400,'At least one changed field is required');
    assert.equal((await patchYear({id:999999,status:'ACTIVE'})).status,404,'Missing year is explicit');
    assert.equal((await patchYear({id:1,startDate:'2026-03-01'})).status,409,'Period boundaries remain protected');
    assert.equal((await patchYear({id:1,yearCode:'2027'})).status,409,'Duplicate year codes remain protected');
    const patchPeriod=async body=>request('/academic-periods',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const updatedSemester=await patchPeriod({id:3,academicYearId:1,periodCode:'OJT-UPDATED',name:'Updated OJT semester',kind:'SEMESTER',parentPeriodId:null,
      startDate:'2026-06-01',endDate:'2026-08-31',status:'ACTIVE',ojt:{startDate:'2026-06-01',endDate:'2026-08-31',regStartDate:'2026-05-01',regEndDate:'2026-05-31',status:'ACTIVE'}});
    assert.equal(updatedSemester.status,200,JSON.stringify(updatedSemester.body));
    assert.equal(updatedSemester.body.data.periodCode,'OJT-UPDATED');
    assert.equal(updatedSemester.body.data.academicYear.code,'UPDATED-2026');
    assert.equal(updatedSemester.body.data.ojt.status,'ACTIVE');assert.equal(updatedSemester.body.data.semester.id,1);
    const updatedBlock=await patchPeriod({id:2,academicYearId:1,periodCode:'BLOCK-UPDATED',name:'Updated Block 3',kind:'BLOCK3',parentPeriodId:1,startDate:'2026-05-01',endDate:'2026-05-31',status:'CLOSED'});
    assert.equal(updatedBlock.status,200,JSON.stringify(updatedBlock.body));
    assert.equal(updatedBlock.body.data.parentPeriod.code,'PREP');assert.equal(updatedBlock.body.data.ojt,null);
    assert.equal((await patchPeriod({name:'Missing ID'})).status,400);
    assert.equal((await patchPeriod({id:3})).status,400);
    assert.equal((await patchPeriod({id:999999,name:'Missing period'})).status,404);
    assert.equal((await patchPeriod({id:3,periodCode:'PREP'})).status,409);
    assert.equal((await patchPeriod({id:3,startDate:'2026-04-01',ojt:{startDate:'2026-06-01'}})).status,409,'Overlap rules still apply');
    assert.equal((await patchPeriod({id:2,parentPeriodId:4})).status,409,'Block 3 must remain in the same year as its parent');
    await db.exec(`INSERT INTO "AcademicYears"("YearCode","StartDate","EndDate") SELECT 'TEST-'||n,make_date(n,1,1),make_date(n,12,31) FROM generate_series(2030,2050) n`);
    const allYears=await request('/academic-years');assert.equal(allYears.body.items.length,allYears.body.total);assert.ok(allYears.body.total>20);
    await db.exec(`INSERT INTO "AcademicPeriods"("AcademicYearID","PeriodCode","Name","Kind","StartDate","EndDate","Status")
      SELECT "AcademicYearID",'LIST-'||"AcademicYearID",'List test','SEMESTER',"StartDate","EndDate",
      CASE WHEN "AcademicYearID"%2=0 THEN 'ARCHIVED' ELSE 'CLOSED' END FROM "AcademicYears" WHERE "YearCode" LIKE 'TEST-%'`);
    const allPeriods=await request('/academic-periods');
    assert.equal(allPeriods.status,200);assert.ok(allPeriods.body.total>20);
    assert.equal(allPeriods.body.items.length,allPeriods.body.total,'Execute must return every period beyond the old 20-row default');
    assert.ok(allPeriods.body.items.some(p=>p.kind==='BLOCK3'&&p.parentPeriod.code==='PREP'));
    assert.ok(allPeriods.body.items.every(p=>p.academicYear));
    assert.ok(allPeriods.body.items.some(p=>p.ojt&&p.semester));
    assert.ok(allPeriods.body.items.some(p=>p.status==='ARCHIVED'));
    assert.ok(allPeriods.body.items.some(p=>p.status==='CLOSED'));
    const filteredPeriods=await request('/academic-periods?kind=BLOCK3&limit=1');
    assert.equal(filteredPeriods.body.items.length,1);assert.equal(filteredPeriods.body.items[0].kind,'BLOCK3');
    await db.exec(`INSERT INTO "Cohorts"("CohortCode","Name","EnrollmentYear","Status") SELECT 'LIST-'||n,'List cohort '||n,2026,
      CASE WHEN n%2=0 THEN 'ARCHIVED' ELSE 'CLOSED' END FROM generate_series(1,21) n;
      INSERT INTO "CohortGroups"("CohortID","GroupCode","EntryAcademicPeriodID") SELECT c."CohortID",g.code,1
      FROM "Cohorts" c CROSS JOIN (VALUES ('A'),('B'),('C'),('D')) g(code) WHERE c."CohortCode" LIKE 'LIST-%';`);
    const allCohorts=await request('/cohorts');assert.equal(allCohorts.status,200);
    assert.match(allCohorts.headers.get('content-type'),/application\/json/);
    assert.ok(allCohorts.body.total>20);assert.equal(allCohorts.body.items.length,allCohorts.body.total);
    assert.ok(allCohorts.body.items.every(c=>c.groups.length===4&&c.groups.every(g=>g.entryAcademicPeriod.code==='PREP')));
    assert.ok(allCohorts.body.items.some(c=>c.status==='ARCHIVED'));
    const filteredCohorts=await request('/cohorts?limit=1');assert.equal(filteredCohorts.body.items.length,1);
    const patchCohort=async body=>request('/cohorts',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const updatedCohort=await patchCohort({id:1,cohortCode:'UPDATED-COHORT',name:'Updated cohort',enrollmentYear:2026,status:'ACTIVE',
      groups:[{groupCode:'A',entryAcademicPeriodId:1},{groupCode:'B',entryAcademicPeriodId:3},{groupCode:'C',entryAcademicPeriodId:1},{groupCode:'D',entryAcademicPeriodId:1}]});
    assert.equal(updatedCohort.status,200,JSON.stringify(updatedCohort.body));
    assert.equal(updatedCohort.body.data.cohortCode,'UPDATED-COHORT');assert.equal(updatedCohort.body.data.groups.length,4);
    assert.equal(updatedCohort.body.data.groups.find(g=>g.groupCode==='B').entryAcademicPeriod.code,'OJT-UPDATED');
    const partialCohort=await patchCohort({id:1,groups:[{groupCode:'C',entryAcademicPeriodId:3}]});
    assert.equal(partialCohort.status,200);assert.equal(partialCohort.body.data.groups.length,4);
    assert.equal(partialCohort.body.data.groups.find(g=>g.groupCode==='A').entryAcademicPeriod.code,'PREP');
    assert.equal(partialCohort.body.data.groups.find(g=>g.groupCode==='C').entryAcademicPeriod.code,'OJT-UPDATED');
    const metadataOnlyCohort=await patchCohort({id:1,name:'Metadata-only update'});
    assert.equal(metadataOnlyCohort.status,200);assert.equal(metadataOnlyCohort.body.data.groups.length,4);
    assert.equal((await patchCohort({name:'Missing ID'})).status,400);
    assert.equal((await patchCohort({id:1})).status,400);
    assert.equal((await patchCohort({id:999999,name:'Unknown cohort'})).status,404);
    assert.equal((await patchCohort({id:1,cohortCode:'LIST-1'})).status,409);
    assert.equal((await patchCohort({id:1,groups:[{groupCode:'A',entryAcademicPeriodId:1},{groupCode:'A',entryAcademicPeriodId:3}]})).status,400);
    assert.equal((await patchCohort({id:1,groups:[{groupCode:'A',entryAcademicPeriodId:2}]})).status,409,'A group must enter in a semester, not Block 3');
    assert.equal((await patchCohort({id:1,enrollmentYear:2027})).status,409,'Entry dates must not precede enrollment year');
    const emptyImport=await request('/imports/preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'STUDENT',idempotencyKey:'test-empty',rows:[]})});assert.equal(emptyImport.status,400);
    const foreignToken=jwt.sign({userId:student.user_id,authVersion:0},process.env.JWT_SECRET);
    const forbidden=await fetch(origin+'/api/academic/dashboard',{headers:{authorization:'Bearer '+foreignToken}});assert.equal(forbidden.status,403);
    await db.exec('DELETE FROM "OJTAdvisoryRunItems"; DELETE FROM "OJTAdvisoryRuns"; DELETE FROM "OJTAdvisorySchedules"; DELETE FROM "ProgramOJTGradeMappings"; DELETE FROM "OJTAssessmentWindows"; DELETE FROM "ComboRegistrationWindows"; DELETE FROM "ComboPhaseSchedules"; DELETE FROM "OJTSemesters";');
    for(const route of ['/academic/dashboard','/academic/alerts','/academic/course-demand','/academic/course-demand/export','/students/'+student.id+'/eligibility']){
      const empty=await request(route);assert.equal(empty.status,200,route+' handles an empty database scope');
    }
    console.log(`PASS: ${operations} OpenAPI contracts, ${reads} GET routes without query/body, ${jsonChecks} JSON-only write routes, related fields, JSON creation, role checks and empty scopes.`);
  }finally{
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    config.pool=originalPool;await originalPool?.end();await db.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
