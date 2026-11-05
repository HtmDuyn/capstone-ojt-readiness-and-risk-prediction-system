// Real browser -> frontend Axios -> unchanged backend -> disposable PostgreSQL.
// Requires a built backend and the explicitly named local test database.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const frontend = path.resolve(__dirname,'..');
const backend = path.resolve(frontend,'../backend');
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
let db, pool, server, vite, browser, cdp, failWindows = false;

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
 while(Date.now()<deadline){if(await evaluate(expression))return;await sleep(100);}
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
 const users=(await db.query(`SELECT u.*,r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Username"='enterprise01' OR r."RoleCode"='OJT_COORD' ORDER BY u."UserID"`)).rows;
 const ent=users.find(u=>u.Username==='enterprise01'),staff=users.find(u=>u.RoleCode==='OJT_COORD');
 const jwt=backendRequire('jsonwebtoken');const token=user=>jwt.sign({userId:user.UserID,username:user.Username,authVersion:user.AuthVersion,roleCode:user.RoleCode},process.env.JWT_SECRET,{expiresIn:'1h'});
 const app=backendRequire('./dist/app').default;pool=backendRequire('./dist/config/database').pool;
 const logger=backendRequire('./dist/config/logger').logger,oldError=logger.error.bind(logger);
 logger.error=error=>{if(!error?.statusCode||error.statusCode>=500)oldError(error);};
 server=http.createServer((req,res)=>{
  const record={method:req.method,path:req.url,status:null};const chunks=[];
  req.on('data',data=>chunks.push(data));req.on('end',()=>{if(chunks.length)try{record.body=JSON.parse(Buffer.concat(chunks).toString());}catch{}});
  res.on('finish',()=>{record.status=res.statusCode;records.push(record);});
  if(failWindows&&req.url.startsWith('/api/enterprise/recruitment/windows')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,message:'Không thể tải đợt đăng tin thử nghiệm.'}));return;}
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
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token',${JSON.stringify(token(ent))});localStorage.setItem('ojt_auth_user',${JSON.stringify(JSON.stringify({id:String(ent.UserID),name:ent.FullName,email:ent.Email,role:'enterprise'}))});`});
 await cdp.send('Page.navigate',{url:origin+'/enterprise/jobs'});
 await waitFor(`document.querySelector('button')&&document.body.innerText.includes('Hạn doanh nghiệp đăng / sửa tin')`,'initial jobs page');
 assert(records.some(r=>r.method==='GET'&&r.path.startsWith('/api/enterprise/recruitment/windows')&&r.status===200));
 assert(!records.some(r=>r.path.includes('/json/recruitment')));
 passed('GET real enterprise windows and post APIs; dates render on the jobs page');

 await clickText('Tạo tin tuyển dụng');await waitFor(`!!document.querySelector('dialog[open]')`,'create form');
 await fill('#recruitment-title','E2E Tuyển Backend và Frontend');await fill('#recruitment-content','Thực tập phát triển REST API và giao diện React.');
 await fill('#recruitment-benefits','Có mentor hướng dẫn');await fill('#recruitment-instructions','Ứng tuyển qua hệ thống');
 await fill('#recruitment-position-0-title','Backend Intern');await fill('#recruitment-position-0-description','Phát triển REST API');await fill('#recruitment-position-0-requirements','TypeScript và PostgreSQL');
 await fill('#recruitment-position-0-capacity','0');await fill('#recruitment-position-0-mode','HYBRID');
 await clickText('Thêm vị trí tuyển dụng');await fill('#recruitment-position-1-title','Frontend Intern');await fill('#recruitment-position-1-description','Xây dựng giao diện React');await fill('#recruitment-position-1-requirements','React và CSS');await fill('#recruitment-position-1-capacity','0');
 await clickText('Tạo tin và gửi duyệt');
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('ít nhất một vị trí')`,'zero-capacity validation');
 assert.equal(records.filter(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts').length,0);
 passed('zero total capacity is blocked before sending a request');
 await fill('#recruitment-position-0-capacity','3');await fill('#recruitment-position-1-capacity','2');
 await screenshot('create-desktop');
 await evaluate(`(() => {const b=document.querySelector('dialog button[type=submit]');b.click();b.click();})()`);
 await waitFor(`!document.querySelector('dialog[open]')&&document.body.innerText.includes('E2E Tuyển Backend và Frontend')&&!document.body.innerText.includes('Đang tải tin')`,'successful creation');
 const creates=records.filter(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts');assert.equal(creates.length,1);assert.equal(creates[0].status,201);
 assert.equal(creates[0].body.windowId,window.WindowID);assert(!('companyId'in creates[0].body));assert.equal(creates[0].body.positions.length,2);assert(creates[0].body.positions.every(p=>!('id'in p)));assert(creates[0].body.deadlineAt.endsWith('Z'));
 let post=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "Title"=$1`,['E2E Tuyển Backend và Frontend'])).rows[0];
 assert.equal(post.Status,'PENDING_REVIEW');
 const positionIds=(await db.query(`SELECT "PositionID" id FROM "RecruitmentPostPositions" WHERE "PostID"=$1 ORDER BY "PositionID"`,[post.PostID])).rows.map(p=>p.id);
 passed('POST creates a real pending-review post with two positions; double-click sends exactly once');

 const article=`article[data-post-id="${post.PostID}"]`;
 await click(article+' button');await waitFor(`!!document.querySelector('dialog[open]')`,'edit form');
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Tuyển Backend và Frontend');
 await fill('#recruitment-title','E2E Đã cập nhật tin tuyển dụng');await fill('#recruitment-position-0-capacity','4');
 await clickText('Lưu và gửi duyệt');
 await waitFor(`!document.querySelector('dialog[open]')&&document.body.innerText.includes('E2E Đã cập nhật tin tuyển dụng')&&!document.body.innerText.includes('Đang tải tin')`,'successful update');
 const edits=records.filter(r=>r.method==='PATCH'&&r.path==='/api/enterprise/recruitment/posts/'+post.PostID);assert.equal(edits.length,1);assert.equal(edits[0].status,200);
 assert(!('windowId'in edits[0].body));assert(!('companyId'in edits[0].body));assert.deepEqual(edits[0].body.positions.map(p=>p.id),positionIds);
 assert.equal((await db.query(`SELECT "Title" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[post.PostID])).rows[0].Title,'E2E Đã cập nhật tin tuyển dụng');
 passed('PATCH updates the same real post and preserves all existing position IDs');
 await screenshot('jobs-desktop');

 await click(article+' button');await fill('#recruitment-title','E2E Nội dung chưa lưu');
 await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()-interval '1 second' WHERE "WindowID"=$1`,[window.WindowID]);
 await clickText('Lưu và gửi duyệt');
 await waitFor(`document.querySelector('dialog [role=alert]')?.textContent.includes('hết hạn')`,'backend 409 deadline conflict');
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Nội dung chưa lưu');
 assert.equal((await db.query(`SELECT "Title" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[post.PostID])).rows[0].Title,'E2E Đã cập nhật tin tuyển dụng');
 assert(records.some(r=>r.method==='PATCH'&&r.status===409));
 passed('real deadline conflict preserves form input and leaves saved DB content unchanged');
 await clickText('Hủy');
 await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()+interval '1 hour' WHERE "WindowID"=$1`,[window.WindowID]);
 const review=await fetch(backendOrigin+'/api/recruitment/posts/'+post.PostID+'/review',{method:'POST',headers:{Authorization:'Bearer '+token(staff),'Content-Type':'application/json'},body:JSON.stringify({decision:'PUBLISH',reason:'Approved in local frontend test'})});assert.equal(review.status,200);
 await clickText('Tải lại');await waitFor(`document.querySelector(${JSON.stringify(article+' button')})?.disabled===true`,'published post locked');
 passed('QHDN publication locks the edit action without changing other roles');

 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await screenshot('jobs-mobile');
 assert(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),'Jobs page should not overflow horizontally on mobile.');
 await clickText('Tạo tin tuyển dụng');await screenshot('create-mobile');
 assert(await evaluate(`document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth`),'Dialog should not overflow horizontally.');
 await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await waitFor(`!document.querySelector('dialog[open]')`,'Escape closes dialog');
 passed('mobile page and dialog have no horizontal overflow; Escape closes the form');

 await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`,[window.WindowID]);
 await clickText('Tải lại');await waitFor(`document.body.innerText.includes('Chưa có đợt nào đang nhận tin')`,'closed window display');
 assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tạo tin tuyển dụng').disabled`));
 passed('no open window disables creating posts and explains the deadline state');

 failWindows=true;await clickText('Tải lại');await waitFor(`!!document.querySelector('[role=alert]')`,'window API failure');
 failWindows=false;await clickText('Thử lại');await waitFor(`!document.querySelector('[role=alert]')&&document.body.innerText.includes('Hạn doanh nghiệp đăng / sửa tin')`,'retry after API failure');
 passed('window API error is visible and retry restores the page');
 assert.equal(runtimeErrors.length,0,runtimeErrors.join('\n'));
 passed('no uncaught browser runtime errors');
 await fs.writeFile(path.join(artifactDir,'report.json'),JSON.stringify({checks,requests:records,artifacts:artifactDir},null,2));
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
