// Integration checks for an isolated, bootstrapped PostgreSQL instance only.
// Refuses deployment URLs and requires explicit isolation before importing the app.
const assert = require('node:assert/strict');

async function runTaskChecks({ pool, base }) {
  if (process.env.TASK_CHECK_ISOLATED !== 'true' || !['127.0.0.1', 'localhost'].includes(process.env.DB_HOST)
    || process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.LOCAL_DATABASE_URL)
    throw new Error('Task checks require an explicitly isolated loopback database.');
  const jwt = require('jsonwebtoken');
  const axios = (await import('../../frontend/node_modules/axios/index.js')).default;
  const client = axios.create({ baseURL: base + '/api', adapter: 'http', timeout: 15000, validateStatus: () => true });
  const users = (await pool.query(`SELECT u."UserID" AS id,u."Username" AS username,u."AuthVersion" AS version,r."RoleCode" AS role
    FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Status"='ACTIVE'`)).rows;
  const token = username => {
    const user = users.find(item => item.username === username); assert.ok(user, username);
    return jwt.sign({userId:user.id,username:user.username,roleCode:user.role,authVersion:user.version}, process.env.JWT_SECRET, { expiresIn: '10m' });
  };
  let checks = 0;
  const call = async (username, method, url, data, status = 200, headers = {}) => {
    const result = await client.request({method,url,data,headers:{...(username ? {Authorization:'Bearer '+token(username)} : {}),...headers}});
    assert.equal(result.status,status,`${method} ${url}: ${JSON.stringify(result.data)}`); checks++;
    return result.data.data;
  };
  const assignment = (await pool.query(`SELECT a."AssignmentID" AS id,a."StudentID" AS "studentId",a."EnterpriseID" AS "companyId",a."Status" AS status,
    greatest(a."StartDate",current_date+1)::text AS due,u."Username" AS username,co."OJTSemesterID" AS term
    FROM "InternshipAssignments" a JOIN "Students" s USING("StudentID") JOIN "Users" u USING("UserID")
    JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
    WHERE a."Status" IN ('ASSIGNED','ACTIVE','IN_PROGRESS') ORDER BY a."AssignmentID" LIMIT 1`)).rows[0];
  assert.ok(assignment, 'An ongoing demo internship is required');
  const owner = assignment.username;
  const stranger = owner === 'student01' ? 'student20' : 'student01';
  const companyUser = (await pool.query('SELECT u."Username" AS name FROM "EnterpriseUsers" eu JOIN "Users" u USING("UserID") WHERE eu."EnterpriseID"=$1 ORDER BY u."UserID" LIMIT 1', [assignment.companyId])).rows[0].name;
  await call('enterprise02','post','/enterprise/tasks/bulk',{assignmentIds:[assignment.id],tasks:[{name:'Scope denied',dueDate:assignment.due}],idempotencyKey:'task-scope-denied'},403);
  const batch = await call(companyUser,'post','/enterprise/tasks/bulk',{assignmentIds:[assignment.id],tasks:[{name:'Nộp API thực tập',description:'Hoàn thành API và gửi đường dẫn bài làm.',dueDate:assignment.due}],idempotencyKey:'task-submission-integration'});
  const taskId = batch.tasks[0].id;
  const ownPath = `/students/me/tasks/${taskId}/submissions`;
  const companyPath = `/enterprise/tasks/${taskId}`;
  const own = await call(owner,'get',`/students/me/tasks?ojtSemesterId=${assignment.term}`);
  assert.ok(own.items.some(item => item.id === taskId && item.canSubmit));
  assert.ok(!(await call(stranger,'get','/students/me/tasks')).items.some(item => item.id === taskId));
  await call(owner,'get','/students/me/tasks?studentId='+assignment.studentId,undefined,400);
  assert.equal((await call(owner,'get',ownPath)).total,0);
  await call(stranger,'get',ownPath,undefined,404);
  await call(stranger,'post',ownPath,{content:'Wrong owner'},404);
  await call(null,'post',ownPath,{content:'No session'},401);
  await call(companyUser,'post',ownPath,{content:'Wrong role'},403);
  await call(owner,'post',ownPath,{content:'   '},400);
  await call(owner,'post',ownPath,{content:'Test',studentId:assignment.studentId},400);
  await call(owner,'post',ownPath,'plain text',415,{'Content-Type':'text/plain'});
  await call(owner,'post',ownPath,{content:'x'.repeat(10001)},400);
  await call('enterprise02','get',companyPath+'/submissions',undefined,404);
  const content = 'Đã hoàn thành API. Bài làm: https://example.test/repository';
  const [first, replay] = await Promise.all([call(owner,'post',ownPath,{content},201),call(owner,'post',ownPath,{content},201)]);
  assert.equal(first.id,replay.id); assert.notEqual(first.replayed,replay.replayed);
  const tasks = await call(companyUser,'get','/internship-tasks?companyId='+assignment.companyId+'&limit=100');
  const received = tasks.items.find(item => item.id === taskId);
  assert.equal(received.latestSubmission.content,content); assert.equal(received.submissionCount,1); assert.equal(received.status,'TODO');
  assert.equal((await call(companyUser,'get',companyPath+'/submissions')).items[0].content,content);
  await call(stranger,'patch',companyPath+'/status',{status:'DONE'},403);
  await call('enterprise02','patch',companyPath+'/status',{status:'DONE'},404);
  await call(companyUser,'patch',companyPath+'/status',{status:'UNKNOWN'},400);
  await call(companyUser,'patch',companyPath+'/status',{status:'DONE'});
  const closed = (await call(owner,'get','/students/me/tasks?limit=100')).items.find(item => item.id === taskId);
  assert.equal(closed.status,'DONE'); assert.equal(closed.canSubmit,false);
  await call(owner,'post',ownPath,{content:'Nộp lại sau xác nhận'},409);
  await call(companyUser,'patch',companyPath+'/status',{status:'IN_PROGRESS'});
  const second = await call(owner,'post',ownPath,{content:'Bài đã bổ sung theo phản hồi doanh nghiệp.'},201);
  assert.notEqual(first.id,second.id);
  const history = await call(companyUser,'get',companyPath+'/submissions?limit=1&page=2');
  assert.equal(history.total,2); assert.equal(history.items[0].id,first.id);
  await pool.query('UPDATE "InternshipTasks" SET "DueDate"=current_date-1 WHERE "TaskID"=$1',[taskId]);
  assert.equal((await call(owner,'post',ownPath,{content:'Bổ sung muộn, giữ lịch sử.'},201)).isLate,true);
  try {
    await pool.query('UPDATE "InternshipAssignments" SET "Status"=\'CANCELLED\' WHERE "AssignmentID"=$1',[assignment.id]);
    await call(owner,'post',ownPath,{content:'Nộp trong đợt đã hủy'},409);
    await call(companyUser,'patch',companyPath+'/status',{status:'DONE'},409);
  } finally { await pool.query('UPDATE "InternshipAssignments" SET "Status"=$2 WHERE "AssignmentID"=$1',[assignment.id,assignment.status]); }
  const { swaggerSpec } = require('../dist/config/swagger');
  for (const endpoint of ['/api/students/me/tasks','/api/students/me/tasks/{id}/submissions','/api/enterprise/tasks/{id}/submissions','/api/enterprise/tasks/{id}/status']) assert.ok(swaggerSpec.paths[endpoint],endpoint);
  console.log(JSON.stringify({passed:checks,feature:'task assignment, submission, ownership, history, idempotency and enterprise status'}));
  return { taskId, assignment, owner, companyUser, token:token(owner), content:second.content };
}
module.exports = { runTaskChecks };
if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const net = require('node:net');
  const { spawnSync } = require('node:child_process');
  const { Pool } = require('pg');
  const cache = path.resolve(__dirname, '../.cache');
  const directory = path.join(cache, 'task-submissions-' + Date.now());
  const pgBin = process.env.PG_BIN || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin' : '');
  let localPool, server, started = false;
  const run = (name, args) => {
    const executable = name + (process.platform === 'win32' ? '.exe' : '');
    const result = spawnSync(pgBin ? path.join(pgBin, executable) : executable, args, {
      windowsHide:true, stdio:name==='pg_ctl'?'ignore':'pipe', encoding:'utf8', timeout:60000,
    });
    if (result.status !== 0) throw new Error(name + ' failed. Install PostgreSQL or set PG_BIN. ' + (result.stderr || result.error || ''));
  };
  (async () => {
    fs.mkdirSync(directory,{recursive:true});
    const probe = net.createServer();
    await new Promise(resolve => probe.listen(0,'127.0.0.1',resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    run('initdb',['-D',directory,'-U','postgres','--auth=trust','--encoding=UTF8','--locale=C']);
    run('pg_ctl',['-D',directory,'-l',path.join(directory,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w','start']);
    started = true;
    Object.assign(process.env, {TASK_CHECK_ISOLATED:'true',DATABASE_URL:'',SUPABASE_DATABASE_URL:'',LOCAL_DATABASE_URL:'',
      DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_NAME:'postgres',DB_USER:'postgres',DB_PASSWORD:'isolated',DB_SSL:'false',
      JWT_SECRET:require('node:crypto').randomBytes(32).toString('hex'),NODE_ENV:'test',CORS_ORIGIN:''});
    localPool = new Pool({host:'127.0.0.1',port,user:'postgres',database:'postgres'});
    await localPool.query(fs.readFileSync(path.resolve(__dirname,'../DB'),'utf8'));
    const app = require('../dist/app').default;
    server = app.listen(0,'127.0.0.1');
    await new Promise(resolve => server.once('listening',resolve));
    await runTaskChecks({pool:localPool,base:'http://127.0.0.1:'+server.address().port});
  })().catch(error => { console.error(error.stack || error); process.exitCode=1; }).finally(async () => {
    if(server){server.closeAllConnections();await new Promise(resolve => server.close(resolve));}
    try{await require('../dist/config/database').pool?.end();}catch{}
    if(localPool)await localPool.end();
    if(started)run('pg_ctl',['-D',directory,'-m','fast','-w','stop']);
  });
}
