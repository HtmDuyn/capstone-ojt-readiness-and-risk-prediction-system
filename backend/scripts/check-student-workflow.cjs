// Transactional regression checks against the configured demo DB.
// Every change is rolled back; no workers, email delivery, or external API calls.
const path = require('node:path');
const assert = require('node:assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
require('dotenv').config({path:path.join(__dirname,'../src/.env'),quiet:true});
const {pool} = require('../dist/config/database');
const {applyToPosition} = require('../dist/modules/students/job-application.service');
const {admissionEligibilityWithClient,requireAdmissionEligibility} = require('../dist/modules/eligibility/admission.service');
const {studentWindows} = require('../dist/modules/students/registration-options.service');
const {uploadStudentCV,readCV} = require('../dist/modules/students/cv.service');
const {readNotification} = require('../dist/modules/student-portal/academic.service');
const {eligibleStudents} = require('../dist/modules/qhdn/eligible-students.service');
let passed=0;
async function main() {
  let targetTerm,ownStudentId;
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query("SET LOCAL lock_timeout='10s'");
    await c.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
    const students=(await c.query(`SELECT u."Username" AS username,u."UserID" AS "userId",s."StudentID" AS "studentId"
      FROM "Users" u JOIN "Students" s USING("UserID") WHERE u."Username" IN ('student01','student02','student05')`)).rows;
    const actor=name=>({...students.find(row=>row.username===name),roleCode:'STUDENT'});
    const own=actor('student01');assert.ok(own.studentId,'This check requires demo student01');
    const window=(await c.query(`SELECT w.* FROM "OJTRegistrationWindows" w JOIN "EligibleStudentHandoffItems" h
      ON h."OJTSemesterID"=w."OJTSemesterID" WHERE h."StudentID"=$1 AND w."Status"='OPEN'
      AND now()>=w."StartsAt" AND now()<w."EndsAt" ORDER BY w."WindowID" DESC LIMIT 1`,[own.studentId])).rows[0];
    assert.ok(window,'An open registration window for student01 is required');
    targetTerm=window.OJTSemesterID;ownStudentId=own.studentId;
    const position=(await c.query(`SELECT p."PositionID" AS "positionId",post."PostID" AS "postId"
      FROM "InternshipPositions" p JOIN "RecruitmentPostPositions" pp USING("PositionID")
      JOIN "RecruitmentPosts" post USING("PostID") WHERE p."OJTSemesterID"=$1 AND p."Status"='OPEN'
      AND post."Status"='PUBLISHED' AND (post."DeadlineAt" IS NULL OR post."DeadlineAt">now())
      AND p."Capacity">(SELECT count(*) FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND a."Status" NOT IN ('CANCELLED','CANCELED'))
      ORDER BY p."PositionID" LIMIT 1`,[window.OJTSemesterID])).rows[0];
    assert.ok(position,'An available position is required');
    const body={windowId:window.WindowID,...position,coverLetter:'Student workflow regression check',application:{note:'Rolled back automatically'}};
    async function check(name,work) {
      await c.query('SAVEPOINT student_check');
      try {await work();passed++;console.log('PASS',name);}
      finally {await c.query('ROLLBACK TO SAVEPOINT student_check');}
    }
    const rejectCode=code=>error=>{assert.equal(error.errorCode,code);return true;};
    await check('Current frontend handoff admits student01 without a legacy EligibilityCheck',async()=>{
      const evidence=await requireAdmissionEligibility(c,own.studentId,window.OJTSemesterID);
      assert.equal(evidence.source,'FRONTEND_HANDOFF');assert.equal(evidence.checkId,null);
      const windows=await studentWindows('ojt',{},own,c);
      assert.equal(windows.items.find(row=>row.id===window.WindowID).canSubmit,true);
      const application=await applyToPosition(body,own,c);
      assert.equal(application.studentId,own.studentId);assert.equal(application.status,'SUBMITTED');
      assert.equal(application.coordination.decision,'PENDING');
      const replay=await applyToPosition(body,own,c);
      assert.equal(replay.id,application.id);assert.equal(replay.replayed,true);
      await assert.rejects(applyToPosition({...body,coverLetter:'A different application'},own,c),rejectCode('APPLICATION_ALREADY_IN_PROCESS'));
      const count=(await c.query('SELECT count(*)::int n FROM "StudentEnterpriseCoordination" WHERE "ApplicationID"=$1',[application.id])).rows[0].n;
      assert.equal(count,1,'Retry must not create duplicate coordination');
    });
    await check('Changed transcript invalidates admission and window submission',async()=>{
      await c.query('UPDATE "StudentCourseResults" SET "UpdatedAt"=now()+interval \'1 second\' WHERE "StudentID"=$1',[own.studentId]);
      const evidence=await admissionEligibilityWithClient(c,own.studentId,window.OJTSemesterID);
      assert.equal(evidence.isStale,true);
      const windows=await studentWindows('ojt',{},own,c);
      assert.equal(windows.items.find(row=>row.id===window.WindowID).canSubmit,false);
      await assert.rejects(applyToPosition(body,own,c),rejectCode('ELIGIBILITY_HANDOFF_STALE'));
    });
    await check('An ineligible saved result cannot reuse the academic handoff',async()=>{
      await c.query('UPDATE "StudentOJTCalculatedResults" SET "Status"=\'NOT_ELIGIBLE\',"Result"=jsonb_set("Result",\'{status}\',\'"NOT_ELIGIBLE"\') WHERE "StudentID"=$1',[own.studentId]);
      await assert.rejects(requireAdmissionEligibility(c,own.studentId,window.OJTSemesterID),rejectCode('CONFIRMED_ELIGIBILITY_REQUIRED'));
    });
    await check('Student without handoff cannot apply to another student window',async()=>{
      await assert.rejects(applyToPosition(body,actor('student05'),c),rejectCode('ELIGIBLE_HANDOFF_REQUIRED'));
    });
    await check('Student cannot use another student registration',async()=>{
      const registration=(await c.query('SELECT "RegistrationID" FROM "OJTRegistrations" WHERE "StudentID"=$1 LIMIT 1',[actor('student02').studentId])).rows[0];
      await assert.rejects(applyToPosition({...body,registrationId:registration.RegistrationID},own,c),rejectCode('FORBIDDEN'));
    });
    await check('Invalid contact form is rejected before application creation',async()=>{
      await assert.rejects(applyToPosition({...body,application:{contactEmail:'invalid'}},own,c),error=>error.statusCode===400);
    });
    await check('Closed window blocks direct application',async()=>{
      await c.query('UPDATE "OJTRegistrationWindows" SET "Status"=\'CLOSED\' WHERE "WindowID"=$1',[window.WindowID]);
      await assert.rejects(applyToPosition(body,own,c),rejectCode('OJT_REGISTRATION_WINDOW_UNAVAILABLE'));
    });
    await check('Rejected student can reapply while preserving coordination history',async()=>{
      const previous=(await c.query(`SELECT co."CoordinationID" AS id,r."RegistrationID" AS "registrationId",
        s."StudentID" AS "studentId",s."UserID" AS "userId" FROM "OJTRegistrations" r
        JOIN "Students" s USING("StudentID") JOIN "StudentEnterpriseCoordination" co USING("RegistrationID")
        WHERE r."OJTSemesterID"=$1 AND co."Decision"='REJECTED'
        AND NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."RegistrationID"=r."RegistrationID" AND newer."CoordinationID">co."CoordinationID")
        ORDER BY co."CoordinationID" LIMIT 1`,[targetTerm])).rows[0];
      assert.ok(previous,'A rejected demo application is required');
      const result=await applyToPosition({...body,registrationId:previous.registrationId},{...previous,roleCode:'STUDENT'},c);
      assert.equal(result.registrationId,previous.registrationId);assert.equal(result.coordination.decision,'PENDING');
      const history=(await c.query('SELECT "PreviousCoordinationID" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1',[result.coordination.id])).rows[0];
      assert.equal(history.PreviousCoordinationID,previous.id);
    });
    await check('CV upload, retry and download preserve file content and ownership',async()=>{
      const PDFDocument=require('pdfkit');
      const pdf=new PDFDocument();const chunks=[];
      const content=new Promise((resolve,reject)=>{pdf.on('data',chunk=>chunks.push(chunk));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);});
      pdf.text('Student workflow regression CV');pdf.end();
      const buffer=await content;const file={originalname:'student-check.pdf',buffer,mimetype:'application/pdf'};
      const cv=await uploadStudentCV(file,own,c);
      const replay=await uploadStudentCV(file,own,c);
      assert.equal(replay.id,cv.id);assert.equal(replay.replayed,true);
      const downloaded=await readCV(own.studentId,own,cv.id,c);
      assert.ok(downloaded.Content.equals(buffer));
      await assert.rejects(readCV(own.studentId,actor('student02'),cv.id,c),rejectCode('FORBIDDEN'));
    });
    await check('Notification read state is idempotent and private to its recipient',async()=>{
      const notification=(await c.query('SELECT "NotificationID" AS id FROM "Notifications" WHERE "UserID"=$1 LIMIT 1',[own.userId])).rows[0];
      const read=await readNotification(notification.id,own,true,c);
      const replay=await readNotification(notification.id,own,true,c);
      assert.equal(read.isRead,true);assert.equal(replay.unreadCount,read.unreadCount);
      const unread=await readNotification(notification.id,own,false,c);assert.equal(unread.isRead,false);
      await assert.rejects(readNotification(notification.id,actor('student02'),true,c),error=>error.statusCode===404);
    });
    // Read-only service verifies downstream staff can actually receive the frontend roster.
    // Run after releasing the outer transaction to avoid consuming its snapshot.
  } finally {await c.query('ROLLBACK');c.release();}
  const staff=(await pool.query(`SELECT u."UserID" AS "userId" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE r."RoleCode"='OJT_COORD' LIMIT 1`)).rows[0];
  const roster=await eligibleStudents({ojtSemesterId:targetTerm,limit:100},{...staff,roleCode:'OJT_COORD'});
  assert.ok(roster.items.some(row=>row.studentId===ownStudentId&&row.eligibilityAtHandoff.source==='FRONTEND'));
  passed++;console.log('PASS QHDN received roster includes frontend-handed-off student01');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await pool.end();console.log(passed+' workflow checks passed; all changes rolled back');});
