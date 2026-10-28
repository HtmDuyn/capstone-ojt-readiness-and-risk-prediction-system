const assert = require('node:assert/strict');
const test = require('node:test');
const fullFixture = require('./helpers/full-backend-fixture.cjs');

test('full DB script and real HTTP: handoff through enterprise decision, resubmission and guarded official grade', async t => {
  const f = await fullFixture();
  t.after(f.close);
  const { query, request } = f;
  const call = async (role, method, url, body, status = 200) => {
    const r = await request(role, method, url, body);
    assert.equal(r.status, status, method + ' ' + url + ': ' + JSON.stringify(r.body));
    return r.body;
  };
  const { performEligibilityCheck, confirmEligibilityWithClient } = f.service('modules/eligibility/eligibility.service.js');
  const repo = f.service('modules/academic/academic.repository.js');
  // The demo assessment is seeded at today's date while its preparation
  // semester ends later. Move fixture preparation/Block 3 dates into the past
  // so official confirmation exercises the real assessment boundary checks.
  await query(`UPDATE "AcademicPeriods" SET "StartDate"=current_date-8,"EndDate"=current_date-1 WHERE "AcademicPeriodID"=(SELECT "BlockPeriodID" FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=1)`);
  await query(`UPDATE "AcademicPeriods" SET "EndDate"=current_date-1 WHERE "AcademicPeriodID"=(SELECT "AssessmentAcademicPeriodID" FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=1)`);
  await repo.academicTransaction(async c => {
    const check = await performEligibilityCheck(c, 1, 1, 2);
    assert.equal(check.status, 'ELIGIBLE');
    await confirmEligibilityWithClient(c, check.checkId, 2, 'Fixture official handoff');
  });
  await query('DELETE FROM "OJTRegistrationWindows"');
  const actor = (await query('SELECT e."EnterpriseCode" AS code,e."Name" AS name,u."Email" AS email,u."FullName" AS "fullName" FROM "Enterprises" e JOIN "EnterpriseUsers" eu USING("EnterpriseID") JOIN "Users" u USING("UserID") ORDER BY e."EnterpriseID" LIMIT 1')).rows[0];
  let windowId, registrationId, firstCoordination, activeCoordination, assignmentId, cvFileId, resultId, version, competingCoordination, competingStudent, competingReassigned;
  const cvBytes = Buffer.from('%PDF-1.4\nFull workflow fixture CV\n%%EOF');
  await t.test('academic handoff, QHDN opens existing semester, import publishes without recruitment windows', async () => {
    await call('ACADEMIC', 'POST', '/api/eligible-student-handoffs', { ojtSemesterId: 1, studentIds: [1], reason: 'Fixture handoff', idempotencyKey: 'full-handoff' }, 201);
    const handoff = await call('OJT_COORD', 'GET', '/api/qhdn/eligible-students?ojtSemesterId=1');
    assert.equal(handoff.data.items[0].studentId, 1);
    const settings = await call('OJT_COORD', 'PUT', '/api/qhdn/ojt-semesters/1/registration-settings', { startsAt: new Date(Date.now() - 60000).toISOString(), endsAt: new Date(Date.now() + 14 * 86400000).toISOString(), status: 'OPEN', reason: 'Fixture opening' });
    windowId = settings.data.id;
    const before = (await query('SELECT count(*)::int AS n FROM "RecruitmentWindows"')).rows[0].n;
    const imported = await call('OJT_COORD', 'POST', '/api/imports/commit', { kind: 'ENTERPRISE', ojtSemesterId: 1, idempotencyKey: 'full-import', rows: [{ ...actor, positions: [1, 2].map(n => ({ code: 'FLOW-' + n, title: 'Fixture position ' + n, description: 'Fixture vacancy', requirements: 'Fixture skills', capacity: 1 })) }] });
    assert.equal(imported.publicationStatus, 'PUBLISHED');
    assert.equal((await query('SELECT count(*)::int AS n FROM "RecruitmentWindows"')).rows[0].n, before);
  });
  const positions = async () => (await query('SELECT p."PositionID" AS id,post."PostID" AS "postId" FROM "InternshipPositions" p JOIN "RecruitmentPostPositions" pp USING("PositionID") JOIN "RecruitmentPosts" post USING("PostID") WHERE p."RecruitmentCode" LIKE \'FLOW-%\' ORDER BY p."RecruitmentCode"')).rows;
  await t.test('student uploads CV before registration and sees an actionable first submission', async () => {
    const form = new FormData(); form.append('cv', new Blob([cvBytes], { type: 'application/pdf' }), 'fixture.pdf');
    cvFileId = (await call('STUDENT', 'POST', '/api/students/me/cv', form, 201)).data.id;
    const opportunities = await call('STUDENT', 'GET', '/api/students/me/opportunities?ojtSemesterId=1');
    assert.equal(opportunities.data.canApply, true);
    assert.equal(opportunities.data.registrationId, null);
    assert.equal(opportunities.data.windowId, windowId);
    assert.ok(!opportunities.data.blockers.includes('REGISTRATION_REQUIRED'));
    const [position] = await positions();
    const submitted = await call('STUDENT', 'POST', '/api/ojt-registrations', { windowId, postId: position.postId, positionId: position.id, coverLetter: 'Fixture application' }, 201);
    registrationId = submitted.data.id;
    assert.equal(submitted.data.jobApplication.cvFileId, cvFileId);
    const progress = await call('OJT_COORD', 'GET', '/api/qhdn/registered-students?ojtSemesterId=1&status=SUBMITTED');
    assert.equal(progress.data.total, 1);
    await call('OJT_COORD', 'POST', '/api/ojt-registrations/' + registrationId + '/review', { decision: 'APPROVE', reason: 'Fixture review', idempotencyKey: 'full-review' });
  });
  await t.test('QHDN forwards, enterprise rejects, QHDN reassigns and CV stays scoped to introduction', async () => {
    const [p1, p2] = await positions();
    firstCoordination = (await call('OJT_COORD', 'POST', '/api/ojt-coordinations', { registrationId, positionId: p1.id, reason: 'Fixture introduction', idempotencyKey: 'full-coordinate' }, 201)).data.id;
    await call('ENTERPRISE', 'PATCH', '/api/enterprise/candidates/' + firstCoordination + '/decision', { decision: 'REJECTED', reason: 'Fixture rejection' });
    activeCoordination = (await call('OJT_COORD', 'POST', '/api/ojt-coordinations/' + firstCoordination + '/reassign', { positionId: p2.id, reason: 'Fixture reassignment', idempotencyKey: 'full-reassign' }, 201)).data.id;
    const candidates = await call('ENTERPRISE', 'GET', '/api/enterprise/candidates');
    assert.equal(candidates.data.items[0].cv.id, cvFileId);
    const next = new FormData(); next.append('cv', new Blob([Buffer.from('%PDF-1.4\nLater CV\n%%EOF')], { type: 'application/pdf' }), 'later.pdf');
    await call('STUDENT', 'POST', '/api/students/me/cv', next, 201);
    const file = await request('ENTERPRISE', 'GET', '/api/enterprise/candidates/' + activeCoordination + '/cv');
    assert.equal(file.status, 200); assert.deepEqual(file.body, cvBytes);
    await call('OJT_COORD', 'POST', '/api/assignments', {}, 403);
  });
  await t.test('enterprise acceptance creates one ACTIVE internship and reserves one slot atomically', async () => {
    for(let sid=2;sid<=20&&!competingStudent;sid++)await repo.academicTransaction(async c=>{
      const checked=await performEligibilityCheck(c,sid,1,2);
      if(checked.status==='ELIGIBLE'){await confirmEligibilityWithClient(c,checked.checkId,2,'Fixture competitor');competingStudent=sid;}
    });
    assert.ok(competingStudent,'A second eligible fixture student is required');
    const u=(await query('SELECT u."UserID" AS id,u."Username" AS username,u."AuthVersion" AS version FROM "Users" u JOIN "Students" s USING("UserID") WHERE s."StudentID"=$1',[competingStudent])).rows[0];
    f.principals.push({...u,role:'SECOND_STUDENT'});
    await call('ACADEMIC','POST','/api/eligible-student-handoffs',{ojtSemesterId:1,studentIds:[competingStudent],reason:'Fixture competitor',idempotencyKey:'full-second-handoff'},201);
    const [,p2]=await positions();
    const r=(await call('SECOND_STUDENT','POST','/api/ojt-registrations',{windowId,postId:p2.postId,positionId:p2.id},201)).data;
    await call('OJT_COORD','POST','/api/ojt-registrations/'+r.id+'/review',{decision:'APPROVE',reason:'Fixture competitor',idempotencyKey:'full-second-review'});
    competingCoordination=(await call('OJT_COORD','POST','/api/ojt-coordinations',{registrationId:r.id,positionId:p2.id,reason:'Fixture competitor',idempotencyKey:'full-second-send'},201)).data.id;
    const accept = { decision: 'ACCEPTED', reason: 'Fixture acceptance' };
    const accepted = await call('ENTERPRISE', 'PATCH', '/api/enterprise/candidates/' + activeCoordination + '/decision', accept);
    assignmentId = accepted.data.assignmentId;
    assert.equal(accepted.data.assignment.status, 'ACTIVE');
    const repeat = await call('ENTERPRISE', 'PATCH', '/api/enterprise/candidates/' + activeCoordination + '/decision', accept);
    assert.equal(repeat.data.assignmentId, assignmentId); assert.equal(repeat.data.replayed, true);
    assert.equal((await query('SELECT count(*)::int AS n FROM "InternshipAssignments"')).rows[0].n, 1);
    assert.equal((await query('SELECT "RemainingSlots" FROM "InternshipPositions" WHERE "PositionID"=(SELECT "PositionID" FROM "InternshipAssignments" WHERE "AssignmentID"=$1)', [assignmentId])).rows[0].RemainingSlots, 0);
    const dueDate = (await query('SELECT "StartDate"::text AS date FROM "InternshipAssignments" WHERE "AssignmentID"=$1', [assignmentId])).rows[0].date;
    await call('ENTERPRISE', 'POST', '/api/enterprise/tasks/bulk', { assignmentIds: [assignmentId], tasks: [{ name: 'Fixture task', dueDate }], idempotencyKey: 'full-tasks' });
  });
  await t.test('last slot cannot be allocated twice; invalid acceptance rolls back and CV is company-scoped',async()=>{
    const full=await call('ENTERPRISE','PATCH','/api/enterprise/candidates/'+competingCoordination+'/decision',{decision:'ACCEPTED',reason:'Fixture full capacity'},409);
    assert.equal(full.errorCode,'POSITION_FULL');
    assert.equal((await query('SELECT "Decision" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1',[competingCoordination])).rows[0].Decision,'PENDING');
    await call('ENTERPRISE','PATCH','/api/enterprise/candidates/'+competingCoordination+'/decision',{decision:'REJECTED',reason:'Fixture full position'});
    const [p1]=await positions();
    const next=(await call('OJT_COORD','POST','/api/ojt-coordinations/'+competingCoordination+'/reassign',{positionId:p1.id,reason:'Fixture free position',idempotencyKey:'full-second-reassign'},201)).data.id;
    competingReassigned=next;
    const invalid=await call('ENTERPRISE','PATCH','/api/enterprise/candidates/'+next+'/decision',{decision:'ACCEPTED',reason:'Fixture bad dates',startDate:'1900-01-01',endDate:'1900-02-01'},409);
    assert.equal(invalid.errorCode,'INTERNSHIP_DATES_OUT_OF_RANGE');
    assert.equal((await query('SELECT "Decision" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1',[next])).rows[0].Decision,'PENDING');
    assert.equal((await query('SELECT count(*)::int AS n FROM "InternshipAssignments"')).rows[0].n,1);
    const company=(await query('INSERT INTO "Enterprises" ("EnterpriseCode","Name","Status") VALUES (\'FLOW-OTHER\',\'Fixture other company\',\'ACTIVE\') RETURNING "EnterpriseID"')).rows[0];
    const user=(await query('INSERT INTO "Users" ("Username","Email","FullName","PasswordHash","RoleID") SELECT \'flow_other_enterprise\',\'other@fixture.test\',\'Fixture Other\',\'fixture-not-used\',"RoleID" FROM "Roles" WHERE "RoleCode"=\'ENTERPRISE\' RETURNING "UserID" AS id,"Username" AS username,"AuthVersion" AS version')).rows[0];
    await query('INSERT INTO "EnterpriseUsers" ("EnterpriseID","UserID") VALUES ($1,$2)',[company.EnterpriseID,user.id]);
    f.principals.push({...user,role:'OTHER_ENTERPRISE'});
    await call('OTHER_ENTERPRISE','GET','/api/enterprise/candidates/'+activeCoordination+'/cv',undefined,404);
  });
  const evaluation = score => ({ completionScore: score, attitudeScore: score, skillScore: score, overallScore: score, comments: 'Fixture evaluation', reason: 'Fixture official evaluation' });
  await t.test('enterprise evaluation completes internship; QHDN transfers, detects changes and resubmits', async () => {
    const evaluated = await call('ENTERPRISE', 'PUT', '/api/enterprise/internships/' + assignmentId + '/evaluation', evaluation(8.5));
    assert.equal(evaluated.data.assignmentStatus, 'COMPLETED');
    const transferred = await call('OJT_COORD', 'POST', '/api/ojt-results', { assignmentId, reason: 'Fixture transfer', idempotencyKey: 'full-transfer' }, 201);
    resultId = transferred.data.resultId; version = transferred.data.version;
    await call('ENTERPRISE', 'PUT', '/api/enterprise/internships/' + assignmentId + '/evaluation', evaluation(9));
    const stale = await call('ACADEMIC', 'POST', '/api/ojt-results/' + resultId + '/confirm', { reason: 'Fixture confirmation', idempotencyKey: 'full-confirm-stale' }, 409);
    assert.equal(stale.errorCode, 'OJT_RESULT_SOURCE_CHANGED');
    const conflict = await call('OJT_COORD', 'POST', '/api/ojt-results', { assignmentId, expectedVersion: version + 1, reason: 'Fixture resubmission', idempotencyKey: 'full-version-conflict' }, 409);
    assert.equal(conflict.errorCode, 'OJT_RESULT_VERSION_CONFLICT');
    const resubmitted = await call('OJT_COORD', 'POST', '/api/ojt-results', { assignmentId, expectedVersion: version, reason: 'Fixture resubmission', idempotencyKey: 'full-resubmit' }, 201);
    version = resubmitted.data.version;
    assert.equal(resubmitted.data.resultId, resultId);
  });
  await t.test('academic stage advances; real DB guards accept synchronized grade and confirmation is replayable', async () => {
    // Simulate the student's later academic progression in the isolated fixture.
    // Deferred study-history triggers validate both updates together at COMMIT.
    await repo.academicTransaction(async c => {
      await c.query('UPDATE "StudentAcademicPlacements" SET "CurrentAcademicPeriodID"=(SELECT "AcademicPeriodID" FROM "OJTSemesters" WHERE "OJTSemesterID"=1) WHERE "StudentID"=1');
      await c.query('UPDATE "Students" SET "CurrentSemester"=6 WHERE "StudentID"=1');
    });
    const body = { reason: 'Fixture grade confirmation', idempotencyKey: 'full-confirm' };
    const confirmed = await call('ACADEMIC', 'POST', '/api/ojt-results/' + resultId + '/confirm', body);
    assert.equal(confirmed.data.status, 'CONFIRMED');
    const grade = (await query('SELECT g.*,p."AcademicYearID" AS "PeriodYear" FROM "StudentCourseResults" g JOIN "AcademicPeriods" p USING("AcademicPeriodID") WHERE g."OJTResultID"=$1', [resultId])).rows[0];
    assert.equal(grade.SemesterTaken, 6); assert.equal(grade.AcademicYearID, grade.PeriodYear); assert.equal(Number(grade.Score), 9);
    assert.equal((await call('ACADEMIC', 'POST', '/api/ojt-results/' + resultId + '/confirm', body)).data.replayed, true);
    assert.equal((await call('ENTERPRISE','PATCH','/api/enterprise/candidates/'+activeCoordination+'/decision',{decision:'ACCEPTED',reason:'Fixture repeat after completion'})).data.assignmentId,assignmentId);
    await call('ENTERPRISE', 'PUT', '/api/enterprise/internships/' + assignmentId + '/evaluation', evaluation(7), 409);
    await call('OJT_COORD', 'POST', '/api/ojt-results', { assignmentId, expectedVersion: version, reason: 'Cannot rewrite confirmed', idempotencyKey: 'full-immutable' }, 409);
    await call('OJT_COORD', 'POST', '/api/ojt-results/' + resultId + '/confirm', body, 403);
    const report = await call('OJT_COORD', 'GET', '/api/ojt-results?ojtSemesterId=1');
    assert.equal(report.data.items[0].status, 'CONFIRMED');
  });
  await t.test('failed outcome synchronizes correctly and an existing manual grade is never overwritten',async()=>{
    const accepted=await call('ENTERPRISE','PATCH','/api/enterprise/candidates/'+competingReassigned+'/decision',{decision:'ACCEPTED',reason:'Fixture second acceptance'});
    const secondAssignment=accepted.data.assignmentId;
    await call('ENTERPRISE','PUT','/api/enterprise/internships/'+secondAssignment+'/evaluation',evaluation(1));
    const transferred=(await call('OJT_COORD','POST','/api/ojt-results',{assignmentId:secondAssignment,reason:'Fixture failed outcome',idempotencyKey:'full-failed-transfer'},201)).data;
    await repo.academicTransaction(async c=>{
      await c.query('UPDATE "StudentAcademicPlacements" SET "CurrentAcademicPeriodID"=(SELECT "AcademicPeriodID" FROM "OJTSemesters" WHERE "OJTSemesterID"=1) WHERE "StudentID"=$1',[competingStudent]);
      await c.query('UPDATE "Students" SET "CurrentSemester"=6 WHERE "StudentID"=$1',[competingStudent]);
    });
    const manual=(await query(`INSERT INTO "StudentCourseResults" ("StudentID","CourseID","AcademicPeriodID","AcademicYearID","SemesterTaken","Score","Status","RecordedBy") SELECT $1,m."CourseID",m."AcademicPeriodID",p."AcademicYearID",6,2,'FAILED',2 FROM "ProgramOJTGradeMappings" m JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=m."AcademicPeriodID" WHERE m."ProgramID"=(SELECT "ProgramID" FROM "Students" WHERE "StudentID"=$1) AND m."OJTSemesterID"=1 RETURNING "ResultID"`,[competingStudent])).rows[0];
    const confirmation={reason:'Fixture failed confirmation',idempotencyKey:'full-failed-confirm'};
    const conflict=await call('ACADEMIC','POST','/api/ojt-results/'+transferred.resultId+'/confirm',confirmation,409);
    assert.equal(conflict.errorCode,'OJT_COURSE_RESULT_CONFLICT');
    const pending=(await query('SELECT "Version","OfficialScore","Status" FROM "OJTResults" WHERE "ResultID"=$1',[transferred.resultId])).rows[0];
    assert.equal(pending.Version,1);assert.equal(pending.OfficialScore,null);assert.equal(pending.Status,'PENDING_ACADEMIC_CONFIRMATION');
    assert.equal(Number((await query('SELECT "Score" FROM "StudentCourseResults" WHERE "ResultID"=$1',[manual.ResultID])).rows[0].Score),2);
    // Reconcile fixture-only manual data, then retry the same rolled-back request.
    await query('DELETE FROM "StudentCourseResults" WHERE "ResultID"=$1',[manual.ResultID]);
    const confirmed=await call('ACADEMIC','POST','/api/ojt-results/'+transferred.resultId+'/confirm',confirmation);
    assert.equal(confirmed.data.outcome,'FAILED');
    const grade=(await query('SELECT "SemesterTaken","Status","Score" FROM "StudentCourseResults" WHERE "OJTResultID"=$1',[transferred.resultId])).rows[0];
    assert.equal(grade.SemesterTaken,6);assert.equal(grade.Status,'FAILED');assert.equal(Number(grade.Score),1);
  });
});
