// Run after npm run build. Uses a loopback-only server and read-only DB sessions.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../src/.env'), quiet: true });
const { pool } = require('../dist/config/database');
pool.options.options = ((pool.options.options || '') + ' -c default_transaction_read_only=on').trim();
const jwt = require('jsonwebtoken');
const { authConfig } = require('../dist/config/auth');
const app = require('../dist/app').default;
const checks = [];
let server;
async function main() {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const users = (await pool.query(`SELECT u."UserID" AS id,u."Username" AS username,u."AuthVersion" AS version,
    s."StudentID" AS "studentId" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID"
    JOIN "Students" s ON s."UserID"=u."UserID" WHERE r."RoleCode"='STUDENT' AND s."DeletedAt" IS NULL ORDER BY u."Username"`)).rows;
  async function call(user, url, expected = 200, options = {}) {
    const token = jwt.sign({userId:user.id,username:user.username,roleCode:'STUDENT',authVersion:user.version}, authConfig.jwtSecret, {expiresIn:'10m'});
    const response = await fetch(base + url, { ...options, headers: {Authorization:'Bearer '+token,...options.headers}, signal:AbortSignal.timeout(90000) });
    const body = await response.json();
    const check = {user:user.username,url,expected,status:response.status,code:body.errorCode};
    checks.push(check);
    console.log(JSON.stringify(check));
    assert.equal(response.status,expected,body.message);
    return body;
  }
  const selected = process.argv.find(arg=>arg.startsWith('--users='))?.slice(8).split(',') ?? ['student01','student02','student03','student04','student05','student20'];
  for (const user of users) {
    if (!process.argv.includes('--all') && !selected.includes(user.username)) continue;
    const me = await call(user,'/auth/me');
    assert.equal(me.user.studentId,user.studentId,'auth/me must expose the linked StudentID');
    const {data:profile} = await call(user,`/students/${user.studentId}?include=academicProgress,comboSelections,ojtRegistrations,curriculum,courseResults`);
    assert.equal(profile.userId,user.id);
    assert.ok(profile.academicProgress);
    assert.ok(profile.courseResults.total>0);
    const term = profile.ojtSemesterId;
    assert.ok(term,'Cohort mapping must resolve the target OJT semester');
    const {data:dashboard} = await call(user,`/students/me/dashboard?ojtSemesterId=${term}`);
    assert.equal(dashboard.academic.studentId,user.studentId);
    const {data:windows} = await call(user,'/ojt-registration-windows?limit=100');
    await call(user,'/combo-registration-windows?limit=100');
    const {data:registrations} = await call(user,`/ojt-registrations?ojtSemesterId=${term}`);
    assert.ok(registrations.items.every(row=>row.studentId===user.studentId));
    const {data:applications} = await call(user,`/job-applications?ojtSemesterId=${term}`);
    assert.ok(applications.items.every(row=>row.studentId===user.studentId));
    const {data:internships} = await call(user,`/students/me/internships?ojtSemesterId=${term}&tasksPage=1&tasksLimit=20&resultsPage=1&resultsLimit=20`);
    if(internships.assignment) assert.equal(internships.assignment.studentId,user.studentId);
    const {data:notifications} = await call(user,'/students/me/notifications?unread=true');
    assert.ok(notifications.unreadCount>=notifications.total);
    for (const window of windows.items) {
      const {data:opportunities}=await call(user,`/students/me/opportunities?windowId=${window.id}&page=1&limit=20`);
      if (user.username==='student01' && process.argv.includes('--admission')) {
        assert.equal(window.canSubmit,true);
        assert.equal(opportunities.canApply,true,JSON.stringify(opportunities.blockers));
        assert.equal(opportunities.admissionEligibility.source,'FRONTEND_HANDOFF');
        assert.ok(opportunities.items.some(row=>row.canApply));
        assert.equal(dashboard.academic.admissionEligibility.isStale,false);
      }
    }
    if(user.username==='student01') {
      const {data:status}=await call(user,`/ojt-semesters/${term}/students`);
      assert.ok(status.items.every(row=>row.studentId===user.studentId));
      await call(user,`/students/${users.find(row=>row.id!==user.id).studentId}`,403);
      await call(user,'/students',403);
      await call(user,'/internship-tasks',403);
      await call(user,'/students/me/notifications?unread=invalid',400);
      await call(user,'/students/me/dashboard?ojtSemesterId=invalid',400);
      await call(user,`/students/${user.studentId}/cv`,404);
      await call(user,`/students/${users.find(row=>row.id!==user.id).studentId}/cv`,403);
      await call(user,`/students/${user.studentId}?include=courseResults&resultsPage=2&resultsLimit=20`);
      if(!process.env.ROADMAP_SERVICE_URL) await call(user,`/students/me/roadmap-recommendations?ojtSemesterId=${term}`,503);
      const json=body=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      await call(user,'/auth/login',400,json({}));
      await call(user,'/auth/logout',200,json({}));
      await call(user,'/auth/change-password',400,json({currentPassword:'invalid',newPassword:'short'}));
      await call(user,'/ojt-registrations',400,json({}));
      await call(user,'/job-applications',400,json({}));
      await call(user,'/combo-registration-windows/0/preview',400,json({}));
      await call(user,'/combo-registration-windows/0/selections',400,json({}));
      await call(user,'/accounts/me/profile',400,{...json({roleId:1}),method:'PATCH'});
      const invalidCv=new FormData();invalidCv.set('cv',new Blob(['invalid PDF'],{type:'application/pdf'}),'invalid.pdf');
      await call(user,'/students/me/cv',400,{method:'POST',body:invalidCv});
    }
    console.log('SUMMARY',JSON.stringify({user:user.username,studentId:user.studentId,term,gpa:profile.academicProgress.gpa,credits:profile.academicProgress.credits.earned,official:dashboard.academic.officialEligibility?.status??null,windows:windows.total,registrations:registrations.total,applications:applications.total,assignment:internships.assignment?.id??null,tasks:internships.tasks.total,results:internships.results.total}));
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;})
  .finally(async()=>{
    if(server) await new Promise(resolve=>server.close(resolve));
    await pool.end();
    const dir=path.join(__dirname,'../.local');fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,process.argv.includes('--all')?'student-api-checks-all.json':'student-api-checks-focused.json'),JSON.stringify(checks,null,2));
    console.log(`${checks.filter(row=>row.status===row.expected).length}/${checks.length} checks passed`);
  });
