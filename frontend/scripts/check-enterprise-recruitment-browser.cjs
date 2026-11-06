// Real browser -> frontend Axios -> unchanged backend -> disposable PostgreSQL.
// Requires a built backend and the explicitly named local test database.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const frontend = path.resolve(__dirname,'..');
const backend = path.resolve(process.env.ENTERPRISE_BACKEND_ROOT || path.join(frontend,'../backend'));
const backendRequire = createRequire(path.join(backend,'package.json'));
const target = process.env.ENTERPRISE_TEST_DATABASE_URL;
if (!target) throw Error('Set ENTERPRISE_TEST_DATABASE_URL to the disposable local test database.');
const address = new URL(target);
if(address.hostname!=='127.0.0.1'||address.port!=='55440'||address.pathname!=='/enterprise_recruitment_test') throw Error('Refusing a database other than 127.0.0.1:55440/enterprise_recruitment_test.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'enterprise-frontend-local-test-only';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';
const cache = path.join(frontend,'.cache');
const artifactDir = path.join(cache,'enterprise-recruitment-'+process.pid);
const profileDir = path.join(artifactDir,'chrome-profile');
const records = [], checks = [];
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
let db, pool, server, vite, browser, cdp, failWindows = false, loseCreateResponse = false, duplicatePostRows = false;

class CDP {
 constructor(url) {
  this.socket = new WebSocket(url);this.pending=new Map();this.sequence=0;this.listeners=new Map();
  this.ready = new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',()=>reject(Error('Chrome CDP connection failed.')),{once:true});});
  this.socket.addEventListener('message',({data})=>{
   const message=JSON.parse(data);
   if(message.id) {const pending=this.pending.get(message.id);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(message.id);message.error?pending.reject(Error(message.error.message)):pending.resolve(message.result);}
   else for(const listener of this.listeners.get(message.method)||[])listener(message.params);
  });
 }
 on(method,listener){const list=this.listeners.get(method)||[];list.push(listener);this.listeners.set(method,list);}
 async send(method,params={}) {
  await this.ready;const id=++this.sequence;
  const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method));},15000);this.pending.set(id,{resolve,reject,timer});});
  this.socket.send(JSON.stringify({id,method,params}));return result;
 }
}
async function evaluate(expression) {
 const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
}
async function waitFor(expression,label) {
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){if(await evaluate(`Boolean(${expression})`))return;await sleep(100);}
 throw Error('Timed out: '+label+'\n'+await evaluate('document.body.innerText.slice(-1600)'));
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const clickText = text => evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
const fill = (selector,value) => evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
const passed = name => {checks.push(name);console.log('PASS '+name);};
async function screenshot(name) {
 const metrics=await cdp.send('Page.getLayoutMetrics');
 const size=metrics.cssContentSize;
 const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:Math.min(size.height,2600),scale:1}});
 await fs.writeFile(path.join(artifactDir,name+'.png'),Buffer.from(result.data,'base64'));
}
async function startChrome() {
 await fs.mkdir(profileDir,{recursive:true});
 const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
 browser=spawn(chrome,['--headless=new','--disable-gpu','--disable-extensions','--no-first-run','--no-default-browser-check','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profileDir,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let launchError;browser.once('error',error=>{launchError=error;});
 for(let attempt=0;attempt<150;attempt++){
  if(launchError)throw launchError;if(browser.exitCode!==null)throw Error('Chrome exited before startup.');
  try {const active=await fs.readFile(path.join(profileDir,'DevToolsActivePort'),'utf8');const port=Number(active.split(/\r?\n/)[0]);const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();const page=targets.find(t=>t.type==='page');if(page)return new CDP(page.webSocketDebuggerUrl);}catch{}
  await sleep(100);
 }
 throw Error('Chrome did not start.');
}

async function main() {
 const {Client}=backendRequire('pg');db=new Client({connectionString:target});await db.connect();
 await db.query(await fs.readFile(path.join(backend,'DB'),'utf8'));
 const window=(await db.query(`SELECT w.* FROM "RecruitmentWindows" w JOIN "OJTSemesters" s USING("OJTSemesterID") WHERE s."SemesterCode"='DEMO-OJT-S6' LIMIT 1`)).rows[0];
 await db.query(`UPDATE "RecruitmentWindows" SET "StartsAt"=clock_timestamp()-interval '1 day',"EndsAt"=clock_timestamp()+interval '1 hour',"Status"='OPEN' WHERE "WindowID"=$1`,[window.WindowID]);
 const registration=(await db.query('SELECT * FROM "OJTRegistrationWindows" WHERE "OJTSemesterID"=$1 ORDER BY "WindowID" LIMIT 1',[window.OJTSemesterID])).rows[0];
 await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT' WHERE "OJTSemesterID"=$1`,[window.OJTSemesterID]);
 const users=(await db.query(`SELECT u.*,r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Username" IN ('enterprise01','student01') OR r."RoleCode"='OJT_COORD' ORDER BY u."UserID"`)).rows;
 const ent=users.find(u=>u.Username==='enterprise01'),staff=users.find(u=>u.RoleCode==='OJT_COORD'),student=users.find(u=>u.Username==='student01');
 const jwt=backendRequire('jsonwebtoken');const token=user=>jwt.sign({userId:user.UserID,username:user.Username,authVersion:user.AuthVersion,roleCode:user.RoleCode},process.env.JWT_SECRET,{expiresIn:'1h'});
 const app=backendRequire('./dist/app').default;pool=backendRequire('./dist/config/database').pool;
 const logger=backendRequire('./dist/config/logger').logger,oldError=logger.error.bind(logger);
 logger.error=error=>{if(!error?.statusCode||error.statusCode>=500)oldError(error);};
 server=http.createServer((req,res)=>{
  const record={method:req.method,path:req.url,status:null};const chunks=[];
  req.on('data',data=>chunks.push(data));req.on('end',()=>{if(chunks.length)try{record.body=JSON.parse(Buffer.concat(chunks).toString());}catch{}});
  res.on('finish',()=>{record.status=res.statusCode;records.push(record);});
  if(failWindows&&req.url.startsWith('/api/enterprise/recruitment/windows')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,message:'Không thể tải đợt đăng tin thử nghiệm.'}));return;}
  const end=res.end;
  res.end=function(chunk,encoding,callback) {
   if(chunk)try{record.response=JSON.parse(chunk.toString());}catch{}
   if(loseCreateResponse&&req.method==='POST'&&record.path==='/api/enterprise/recruitment/posts'&&res.statusCode===201){
    loseCreateResponse=false;res.statusCode=503;
    chunk=JSON.stringify({success:false,message:'Ph\u1ea3n h\u1ed3i b\u1ecb gi\u00e1n \u0111o\u1ea1n. Th\u1eed l\u1ea1i \u0111\u1ec3 l\u1ea5y tin \u0111\u00e3 l\u01b0u.'});
    res.setHeader('Content-Length',Buffer.byteLength(chunk));
   } else if(duplicatePostRows&&req.method==='GET'&&record.path.startsWith('/api/enterprise/recruitment/posts')&&record.response?.data?.items?.length){
    record.response.data.items.push(record.response.data.items[0]);chunk=JSON.stringify(record.response);res.setHeader('Content-Length',Buffer.byteLength(chunk));
   }
   return end.call(this,chunk,encoding,callback);
  };
  app(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const backendOrigin='http://127.0.0.1:'+server.address().port;
 process.env.VITE_API_URL='/api';process.env.API_PROXY_TARGET=backendOrigin;
 const {createServer}=await import('vite');
 vite=await createServer({root:frontend,define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:0,open:false,proxy:{'/api':{target:backendOrigin,changeOrigin:true}},watch:{ignored:['**/.cache/**']}}});
 await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
 cdp=await startChrome();await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
 await cdp.send('Network.setBlockedURLs',{urls:['*onrender.com*','*supabase.com*','*googleapis.com*','*gstatic.com*']});
 const runtimeErrors=[];cdp.on('Runtime.exceptionThrown',e=>runtimeErrors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const authScript=await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token',${JSON.stringify(token(ent))});localStorage.setItem('ojt_auth_user',${JSON.stringify(JSON.stringify({id:String(ent.UserID),name:ent.FullName,email:ent.Email,role:'enterprise'}))});`});
 await cdp.send('Page.navigate',{url:origin+'/enterprise/jobs'});
 await waitFor(`document.body.innerText.includes('Hạn doanh nghiệp đăng / sửa tin')`,'jobs loaded');
 assert(records.some(r=>r.method==='GET'&&r.path.startsWith('/api/enterprise/recruitment/windows')&&r.status===200));
 passed('loads enterprise windows and combined post/position API');
 await clickText('Tạo tin tuyển dụng');await waitFor(`!!document.querySelector('dialog[open]')`,'create form');
 assert(await evaluate(`!document.querySelector('dialog input[type="datetime-local"],dialog input[type="date"]')`));
 await fill('#recruitment-title','E2E Backend và Frontend');await fill('#recruitment-content','Thực tập phát triển API và giao diện.');
 await fill('#recruitment-benefits','Có mentor hướng dẫn');await fill('#recruitment-instructions','Ứng tuyển qua hệ thống');
 await fill('#recruitment-position-0-title','Backend Intern');await fill('#recruitment-position-0-description','Phát triển REST API');await fill('#recruitment-position-0-requirements','TypeScript và PostgreSQL');
 await fill('#recruitment-position-0-capacity','0');await fill('#recruitment-position-0-mode','HYBRID');
 await clickText('Thêm vị trí tuyển dụng');await fill('#recruitment-position-1-title','Frontend Intern');await fill('#recruitment-position-1-description','Xây dựng giao diện React');await fill('#recruitment-position-1-requirements','React và CSS');await fill('#recruitment-position-1-capacity','0');
 await clickText('Đăng tin tuyển dụng');
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('ít nhất một vị trí')`,'capacity validation');
 assert.equal(records.filter(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts').length,0);
 passed('zero total capacity is rejected without an API mutation');
 await fill('#recruitment-position-0-capacity','3');await fill('#recruitment-position-1-capacity','2');
 await screenshot('create-desktop');
 loseCreateResponse=true;
 await evaluate(`(() => {const b=document.querySelector('dialog button[type=submit]');b.click();b.click();})()`);
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('Phản hồi bị gián đoạn')`,'response lost after commit');
 assert.equal(records.filter(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts').length,1);
 assert.equal((await db.query(`SELECT count(*)::int n FROM "RecruitmentPosts" WHERE "Title"='E2E Backend và Frontend'`)).rows[0].n,1);
 await fill('#recruitment-title','E2E Changed retry payload');await clickText('Đăng tin tuyển dụng');
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('nội dung khác')`,'changed retry cannot duplicate');
 assert.equal((await db.query(`SELECT count(*)::int n FROM "RecruitmentPosts" WHERE "Title"='E2E Changed retry payload'`)).rows[0].n,0);
 passed('editing a retried form keeps its request key and cannot create a second post after an ambiguous response');
 await fill('#recruitment-title','E2E Backend và Frontend');
 await clickText('Đăng tin tuyển dụng');
 await waitFor(`!document.querySelector('dialog[open]')&&document.body.innerText.includes('Sinh viên có thể xem ngay')`,'idempotent retry');
 const creates=records.filter(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts');
 assert.equal(creates.length,3);assert(creates.every(r=>r.body.idempotencyKey===creates[0].body.idempotencyKey));assert.equal(creates[2].response.data.replayed,true);
 assert(creates.every(r=>!('deadlineAt'in r.body)&&!('companyId'in r.body)&&!('status'in r.body)));
 assert.equal(creates[1].body.positions.length,2);
 let post=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "Title"='E2E Backend và Frontend'`)).rows[0];
 assert.equal(post.Status,'PUBLISHED');assert.equal(post.ReviewedAt,null);
 assert.equal((await db.query(`SELECT count(*)::int n FROM "RecruitmentPosts" WHERE "Title"='E2E Backend và Frontend'`)).rows[0].n,1);
 const ids=(await db.query('SELECT "PositionID" id FROM "RecruitmentPostPositions" WHERE "PostID"=$1 ORDER BY "PositionID"',[post.PostID])).rows.map(p=>p.id);
 const article=`article[data-post-id="${post.PostID}"]`;
 passed('double click sends once; retry after committed response loss reuses the key and creates no duplicates');
 const opportunities=await fetch(backendOrigin+`/api/students/me/opportunities?windowId=${registration.WindowID}&limit=100`,{headers:{Authorization:'Bearer '+token(student)}});
 assert.equal(opportunities.status,200);assert((await opportunities.json()).data.items.some(item=>item.postId===post.PostID));
 passed('student API sees the enterprise post immediately without QHDN review');
 const readCount=records.filter(r=>r.method==='GET'&&r.path.includes('/enterprise/recruitment/')).length;
 await click(article+' button');await waitFor(`!!document.querySelector('dialog[open]')`,'edit form');
 assert(await evaluate(`document.querySelector('#recruitment-deadline').textContent===new Intl.DateTimeFormat('vi-VN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(${JSON.stringify(post.DeadlineAt.toISOString())}))`));
 await fill('#recruitment-title','E2E Tin đã cập nhật');await fill('#recruitment-position-0-capacity','4');
 await clickText('Lưu thay đổi');await waitFor(`!document.querySelector('dialog[open]')&&document.querySelector(${JSON.stringify(article)})?.innerText.includes('E2E Tin đã cập nhật')`,'saved edit');
 const edit=records.findLast(r=>r.method==='PATCH'&&r.path==='/api/enterprise/recruitment/posts/'+post.PostID);
 assert.equal(edit.status,200);assert(!('deadlineAt'in edit.body));assert(!('windowId'in edit.body));assert.deepEqual(edit.body.positions.map(p=>p.id),ids);
 const stored=(await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1',[post.PostID])).rows[0];
 assert.equal(stored.Status,'PUBLISHED');assert.equal(stored.DeadlineAt.toISOString(),post.DeadlineAt.toISOString());
 assert.equal(records.filter(r=>r.method==='GET'&&r.path.includes('/enterprise/recruitment/')).length,readCount);
 passed('PATCH preserves deadlines/position IDs, stays published and updates UI without redundant list reloads');
 await screenshot('jobs-desktop');
 duplicatePostRows=true;await clickText('Tải lại');await waitFor(`!document.body.innerText.includes('Đang tải tin')&&document.querySelector(${JSON.stringify(article)})`,'duplicate response');
 assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(article)}).length`),1);
 duplicatePostRows=false;
 passed('repeated post rows in an API page are deduplicated by ID');
 const other=(await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'E2E Future intake',clock_timestamp()+interval '1 day',clock_timestamp()+interval '2 days','DRAFT',$3) RETURNING "WindowID" id`,[window.AcademicPeriodID,window.OJTSemesterID,staff.UserID])).rows[0];
 await clickText('Tải lại');await waitFor(`!!document.querySelector('#recruitment-window-view option[value="${other.id}"]')`,'second window loaded');
 await fill('#recruitment-window-view',other.id);await waitFor(`!document.querySelector(${JSON.stringify(article)})`,'window filtering');
 await fill('#recruitment-window-view','0');await waitFor(`!!document.querySelector(${JSON.stringify(article)})`,'all windows');
 await clickText('Tải lại');await waitFor(`!document.body.innerText.includes('Đang tải tin')&&document.querySelector(${JSON.stringify(article)})`,'refresh all windows');
 assert.equal(await evaluate(`document.querySelector('#recruitment-window-view').value`),'0');
 passed('window selection filters posts and all-window selection survives refresh');
 await fill('#recruitment-window-view',window.WindowID);
 await click(article+' button');await fill('#recruitment-title','E2E Nội dung chưa lưu');
 await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='OPEN',"StartsAt"=clock_timestamp()-interval '1 hour',"EndsAt"=clock_timestamp()+interval '1 hour' WHERE "WindowID"=$1`,[registration.WindowID]);
 await clickText('Lưu thay đổi');await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('đăng ký OJT')`,'server-side edit lock');
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Nội dung chưa lưu');
 assert.equal((await db.query('SELECT "Title" FROM "RecruitmentPosts" WHERE "PostID"=$1',[post.PostID])).rows[0].Title,'E2E Tin đã cập nhật');
 await clickText('Hủy');await clickText('Tải lại');await waitFor(`document.querySelector(${JSON.stringify(article+' button')})?.disabled===true`,'metadata lock');
 assert(await evaluate(`document.querySelector(${JSON.stringify(article)}).textContent.includes('đang đăng ký OJT')`));
 assert(await evaluate(`!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tạo tin tuyển dụng').disabled`));
 passed('OJT registration lock is explained, blocks editing and preserves unsaved input after 409; creating remains available');
 await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`,[registration.WindowID]);
 await clickText('Tải lại');await waitFor(`document.querySelector(${JSON.stringify(article+' button')})?.disabled===false`,'unlock');
 await click(article+' button');
 const candidate=(await db.query(`SELECT "CoordinationID" id,"ApplicationID" application_id FROM "StudentEnterpriseCoordination" WHERE "EnterpriseID"=$1 AND "Decision"='PENDING' ORDER BY "CoordinationID" LIMIT 1`,[post.EnterpriseID])).rows[0];
 assert(candidate);
 await db.query('UPDATE "StudentEnterpriseCoordination" SET "PositionID"=$2,"ApplicationID"=NULL WHERE "CoordinationID"=$1',[candidate.id,ids[0]]);
 await db.query('UPDATE "JobApplications" SET "PositionID"=$2,"PostID"=$3 WHERE "ApplicationID"=$1',[candidate.application_id,ids[0],post.PostID]);
 await db.query('UPDATE "StudentEnterpriseCoordination" SET "ApplicationID"=$2 WHERE "CoordinationID"=$1',[candidate.id,candidate.application_id]);
 const accept=await fetch(backendOrigin+`/api/enterprise/candidates/${candidate.id}/decision`,{method:'PATCH',headers:{Authorization:'Bearer '+token(ent),'Content-Type':'application/json'},body:JSON.stringify({decision:'ACCEPTED',reason:'E2E quota protection'})});
 assert.equal(accept.status,200);
 await fill('#recruitment-position-0-capacity','0');await clickText('Lưu thay đổi');
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('Chỉ tiêu')`,'quota floor conflict');
 assert(records.some(r=>r.status===409&&r.response?.errorCode==='CAPACITY_BELOW_ACCEPTED'));
 await clickText('Hủy');await clickText('Tải lại');await waitFor(`document.querySelector(${JSON.stringify(article+' button')})?.disabled===false`,'quota reload');
 await click(article+' button');assert.equal(await evaluate(`document.querySelector('#recruitment-position-0-capacity').min`),'1');
 passed('backend quota race is shown correctly; refreshed form enforces the accepted-student floor');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate(`document.querySelector('dialog input').blur()`);
 assert(await evaluate(`(() => {const d=document.querySelector('dialog').getBoundingClientRect(),f=document.querySelector('dialog footer').getBoundingClientRect();return d.width<=innerWidth&&d.height<=innerHeight&&f.bottom<=d.bottom+1&&f.top>=d.top;})()`));
 assert(await evaluate(`document.querySelector('dialog fieldset').scrollWidth<=document.querySelector('dialog fieldset').clientWidth+1`));
 await screenshot('edit-mobile');
 await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await waitFor(`!document.querySelector('dialog[open]')`,'Escape closes');
 assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`));await screenshot('jobs-mobile');
 passed('mobile dialog has one scroll area, visible footer, no horizontal overflow and closes with Escape');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await click(article+' button');await fill('#recruitment-title','E2E Quá hạn');
 await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()-interval '1 second' WHERE "WindowID"=$1`,[window.WindowID]);
 await clickText('Lưu thay đổi');await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('hết hạn')`,'expired intake');
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Quá hạn');await clickText('Hủy');
 await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`,[window.WindowID]);
 await clickText('Tải lại');await waitFor(`document.body.innerText.includes('Chưa có đợt nào đang nhận tin')`,'closed window');
 assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tạo tin tuyển dụng').disabled`));
 passed('expired and closed intakes block mutations while preserving form input');
 failWindows=true;await clickText('Tải lại');await waitFor(`!!document.querySelector('[role=alert]')`,'windows failure');
 failWindows=false;await clickText('Thử lại');await waitFor(`!document.querySelector('[role=alert]')&&document.body.innerText.includes('Hạn doanh nghiệp đăng / sửa tin')`,'retry');
 passed('failed window load is visible and retry recovers');
 assert(!records.some(r=>/\/(review|submit|continue|offers)(\?|$)/.test(r.path)));
 assert.equal(runtimeErrors.length,0,runtimeErrors.join('\n'));
 passed('no review/submit/continue requests and no uncaught browser errors');
 await cdp.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:authScript.identifier});
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token',${JSON.stringify(token(staff))});localStorage.setItem('ojt_auth_user',${JSON.stringify(JSON.stringify({id:String(staff.UserID),name:staff.FullName,email:staff.Email,role:'qhdn'}))});`});
 await cdp.send('Page.navigate',{url:origin+'/qhdn/enterprises'});
 await waitFor(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Tin tuyển dụng')`,'QHDN page');
 await clickText('Tin tuyển dụng');await waitFor(`document.querySelector('[data-qhdn-recruitment] select')?.options.length>1`,'QHDN company list');
 await fill('[data-qhdn-recruitment] select',post.EnterpriseID);
 await waitFor(`!!document.querySelector('[data-qhdn-recruitment] article')`,'QHDN post list');
 await click('[data-qhdn-recruitment] article button');
 await waitFor(`document.querySelector('[role=dialog]')||document.querySelector('dialog[open]')`,'QHDN post detail');
 assert(await evaluate(`!document.querySelector('[role=dialog] form,[role=dialog] select,[role=dialog] textarea,dialog[open] form')`));
 assert(!await evaluate(`document.body.innerText.includes('Duyệt & công bố')||document.body.innerText.includes('Xem & duyệt tin')||document.body.innerText.includes('Từ chối công bố')`));
 assert(!records.some(r=>/\/recruitment\/posts\/\d+\/review/.test(r.path)));
 assert.equal(runtimeErrors.length,0,runtimeErrors.join('\n'));
 passed('QHDN recruitment is read-only with no publish/reject form and no review API calls');
 await screenshot('qhdn-recruitment-readonly');
 await fs.writeFile(path.join(artifactDir,'report.json'),JSON.stringify({checks,requests:records,backend,artifacts:artifactDir},null,2));
 console.log('Artifacts: '+artifactDir);
}


async function cleanup() {
 if(cdp){try{await cdp.send('Browser.close');}catch{}cdp.socket.close();}
 if(browser&&browser.exitCode===null){await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),sleep(1500)]);if(browser.exitCode===null)browser.kill();}
 await vite?.close();
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 await pool?.end();await db?.end();
 // Only remove this run's Chrome profile inside the verified frontend cache directory.
 if(path.dirname(profileDir)!==artifactDir||path.dirname(artifactDir)!==cache||!path.basename(artifactDir).startsWith('enterprise-recruitment-'))throw Error('Unexpected browser cleanup path.');
 await fs.rm(profileDir,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
main().catch(async error=>{if(cdp)try{await screenshot('failure');}catch{}console.error(error.message);process.exitCode=1;}).finally(cleanup);
