// Real browser -> frontend Axios -> backend -> disposable PostgreSQL.
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
if(address.hostname!=='127.0.0.1'||!['55440','55442'].includes(address.port)||address.pathname!=='/enterprise_recruitment_test') throw Error('Refusing a database other than local enterprise_recruitment_test on port 55440 or 55442.');
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
let db, pool, server, vite, browser, cdp;

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
const clickText = text => evaluate(`Array.from((document.querySelector('dialog[open][role=alertdialog]')||document.querySelector('dialog[open]')||document).querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
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
 await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "Status"='OPEN'`);
 const users=(await db.query(`SELECT u.*,r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID")`)).rows;
 const ent=users.find(u=>u.Username==='enterprise01'),staff=users.find(u=>u.RoleCode==='OJT_COORD'),student=users.find(u=>u.Username==='student01');
 const jwt=backendRequire('jsonwebtoken');
 const token=user=>jwt.sign({userId:user.UserID,username:user.Username,authVersion:user.AuthVersion,roleCode:user.RoleCode},process.env.JWT_SECRET,{expiresIn:'1h'});
 const {saveWindow}=backendRequire('./dist/modules/recruitment/window.service');
 const period=(await db.query(`SELECT p."AcademicPeriodID" id FROM "AcademicPeriods" p WHERE "Kind"='SEMESTER' AND "Status"='PLANNED' AND NOT EXISTS(SELECT 1 FROM "OJTSemesters" o WHERE o."AcademicPeriodID"=p."AcademicPeriodID") ORDER BY "StartDate" DESC LIMIT 1`)).rows[0];
 const base=Date.now(),at=ms=>new Date(base+ms).toISOString();
 const schedule={name:'Browser posting',postingStartsAt:at(1000),postingEndsAt:at(120000),applicationStartsAt:at(120000),applicationEndsAt:at(180000),resultsStartsAt:at(120000),resultsEndsAt:at(240000)};
 const campaign=await saveWindow({academicPeriodId:period.id,name:'Browser posting',startsAt:schedule.postingStartsAt,endsAt:schedule.resultsEndsAt,rounds:[schedule]},staff.UserID);
 const round=campaign.rounds[0];await saveWindow({status:'OPEN',reason:'Browser fixture'},staff.UserID,round.id);
 const registration=(await db.query('SELECT "WindowID" FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1',[round.id])).rows[0];
 const app=backendRequire('./dist/app').default;pool=backendRequire('./dist/config/database').pool;
 const logger=backendRequire('./dist/config/logger').logger,log=logger.error.bind(logger);
 logger.error=error=>{if(!error?.statusCode||error.statusCode>=500)log(error);};
 server=http.createServer((req,res)=>{
  const record={method:req.method,path:req.url,status:null},chunks=[];
  req.on('data',chunk=>chunks.push(chunk));req.on('end',()=>{if(chunks.length)record.body=JSON.parse(Buffer.concat(chunks).toString());});
  res.on('finish',()=>{record.status=res.statusCode;records.push(record);});app(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const backendOrigin='http://127.0.0.1:'+server.address().port;
 const opportunities=async()=>{
  const r=await fetch(backendOrigin+`/api/students/me/opportunities?windowId=${registration.WindowID}&limit=100`,{headers:{Authorization:'Bearer '+token(student)}});
  assert.equal(r.status,200);return(await r.json()).data.items;
 };
 process.env.VITE_API_URL='/api';process.env.API_PROXY_TARGET=backendOrigin;
 const {createServer}=await import('vite');
 vite=await createServer({root:frontend,define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:backendOrigin,changeOrigin:true}},watch:{ignored:['**/.cache/**']}}});
 await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
 await sleep(Math.max(0,base+1100-Date.now()));
 cdp=await startChrome();await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
 await cdp.send('Network.setBlockedURLs',{urls:['*onrender.com*','*supabase.com*','*googleapis.com*','*gstatic.com*']});
 const runtimeErrors=[];cdp.on('Runtime.exceptionThrown',e=>runtimeErrors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.confirm=window.alert=()=>{throw Error('Native browser dialogs must not be used');};localStorage.setItem('ojt_auth_token',${JSON.stringify(token(ent))});localStorage.setItem('ojt_auth_user',${JSON.stringify(JSON.stringify({id:String(ent.UserID),name:ent.FullName,email:ent.Email,role:'enterprise'}))});`});
 await cdp.send('Page.navigate',{url:origin+'/enterprise/jobs'});
 await waitFor(`document.body.innerText.includes('Hạn doanh nghiệp đăng / công bố tin')`,'jobs loaded');
 const checkOverview = async columns => {
  const layout = await evaluate(`(() => {
   const overview = document.querySelector('dl[aria-label="Tổng quan tuyển dụng"]');
   const panel = document.querySelector('[role="tablist"]').closest('section');
   const cards = Array.from(overview.children, card => card.getBoundingClientRect());
   return { count: cards.length, columns: cards.filter(card => card.top === cards[0].top).length,
    separate: !panel.contains(overview) && overview.getBoundingClientRect().bottom < panel.getBoundingClientRect().top };
  })()`);
  assert.deepEqual(layout, { count: 4, columns, separate: true });
 };
 await checkOverview(4);
 const fillPost=async title=>{
  await clickText('Tạo tin tuyển dụng');await waitFor(`!!document.querySelector('#recruitment-title')`,'create dialog');
  await fill('#recruitment-title',title);await fill('#recruitment-content','Thực tập phát triển API.');
  await fill('#recruitment-position-0-title','Backend Intern');await fill('#recruitment-position-0-description','Phát triển REST API');
  await fill('#recruitment-position-0-requirements','TypeScript và PostgreSQL');await fill('#recruitment-position-0-capacity','3');
 };
 const postByTitle=async title=>(await db.query('SELECT * FROM "RecruitmentPosts" WHERE "Title"=$1 ORDER BY "PostID" DESC LIMIT 1',[title])).rows[0];
 const article=id=>`article[data-post-id="${id}"]`;
 const centeredFeedback=async()=>{
  await waitFor(`!!document.querySelector('dialog[open][role=alertdialog]')`,'feedback popup visible');
  const geometry=await evaluate(`(() => {const el=document.querySelector('dialog[open][role=alertdialog]'),d=el.getBoundingClientRect(),s=getComputedStyle(el);return {open:document.querySelectorAll('dialog[open]').length,left:d.left,top:d.top,width:d.width,height:d.height,viewportWidth:innerWidth,viewportHeight:innerHeight,position:s.position,margin:s.margin,inset:s.inset};})()`);
  assert(geometry.open===1&&Math.abs(geometry.left+geometry.width/2-geometry.viewportWidth/2)<2&&Math.abs(geometry.top+geometry.height/2-geometry.viewportHeight/2)<2&&geometry.left>=0&&geometry.left+geometry.width<=geometry.viewportWidth&&geometry.top>=0&&geometry.top+geometry.height<=geometry.viewportHeight,'One centered dialog within the viewport: '+JSON.stringify(geometry));
 };
 const dismissFeedback=async()=>{
  await centeredFeedback();await clickText('Đã hiểu');
  await waitFor(`!document.querySelector('dialog[open][role=alertdialog]')`,'feedback dismissed');
 };
 const acceptConfirmation=async()=>{
  await waitFor(`!!document.querySelector('[data-feedback-cancel]')`,'custom confirmation');
  await centeredFeedback();await click('[data-feedback-confirm]');
 };
 const finishSuccess=async()=>{
  await waitFor(`document.querySelector('[role=alertdialog]')?.textContent.includes('Đã')&&!document.querySelector('[data-feedback-cancel]')`,'success popup');
  await dismissFeedback();
 };
 await fillPost('E2E Bản nháp');await fill('#recruitment-position-0-capacity','0');await clickText('Lưu nháp');
 await waitFor(`document.querySelector('[role=alertdialog]')?.textContent.includes('ít nhất một vị trí')`,'invalid capacity');
 await dismissFeedback();
 assert(!records.some(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts'));
 await fill('#recruitment-position-0-capacity','3');await clickText('Lưu nháp');
 await finishSuccess();
 let post=await postByTitle('E2E Bản nháp');assert.equal(post.Status,'DRAFT');assert.equal(post.PublishedAt,null);
 assert(!(await opportunities()).some(p=>p.postId===post.PostID));
 assert.equal(records.find(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts').body.status,'DRAFT');
 passed('Lưu nháp sends DRAFT and remains invisible to students');
 await click(article(post.PostID)+' [data-edit-post]');await fill('#recruitment-title','E2E Nháp đã sửa');await clickText('Lưu nháp');
 await finishSuccess();
 await waitFor(`!document.querySelector('dialog[open]')&&document.querySelector(${JSON.stringify(article(post.PostID))})?.textContent.includes('Nháp đã sửa')`,'draft edited');
 assert.equal((await postByTitle('E2E Nháp đã sửa')).Status,'DRAFT');
 await click(article(post.PostID)+' [data-publish-post]');
 await centeredFeedback();await click('[data-feedback-cancel]');
 await waitFor(`!document.querySelector('dialog[open]')`,'cancel card publication');
 assert.equal(records.filter(r=>r.method==='POST'&&r.path.endsWith('/publish')).length,0);
 await click(article(post.PostID)+' [data-publish-post]');await acceptConfirmation();await finishSuccess();
 assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(article(post.PostID)+' [data-edit-post]')})`),false);
 assert((await opportunities()).some(p=>p.postId===post.PostID));
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(article(post.PostID)+' [data-delete-post]')}).disabled`),false);
 assert.equal(await evaluate(`!!document.querySelector('[data-close-post]')`),false);
 await click(article(post.PostID)+' [data-view-post]');
 await waitFor(`!!document.querySelector('#recruitment-details-title')`,'published details');
 assert.equal(await evaluate(`document.querySelector('dialog footer button:last-child').disabled`),true);
 await screenshot('published-details');await click('dialog footer button:first-child');
 passed('draft edits stay DRAFT; publishing shows students the post and disables editing in cards/details');
 await click(article(post.PostID)+' [data-delete-post]');
 await acceptConfirmation();await finishSuccess();
 await waitFor(`!document.querySelector(${JSON.stringify(article(post.PostID))})`,'Published post removed from active list');
 assert(!(await opportunities()).some(p=>p.postId===post.PostID));
 assert.equal((await postByTitle('E2E Nháp đã sửa')).Status,'ARCHIVED');
 const deletedTab='#jobs-tab-deleted';
 const currentTab='#jobs-tab-current';
 const statusFilter='select[aria-label="Lọc trạng thái tin"]';
 const expired=(await db.query(`INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","WindowID","Title","Content","CreatedBy","Status","PublishedAt","DeadlineAt")
   SELECT "EnterpriseID","OJTSemesterID","WindowID",'E2E Hết hạn',"Content","CreatedBy",'PUBLISHED',now()-interval '2 days',now()-interval '1 day' FROM "RecruitmentPosts" WHERE "PostID"=$1 RETURNING "PostID"`,[post.PostID])).rows[0];
 await fill(statusFilter,'ARCHIVED');
 await waitFor(`location.pathname==='/enterprise/jobs'&&location.search==='?tab=deleted'&&document.querySelector(${JSON.stringify(article(post.PostID))})`,'deleted tab in recruitment');
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(deletedTab)}).getAttribute('aria-selected')`),'true');
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(statusFilter)}).value`),'ARCHIVED');
 assert.equal(await evaluate(`!!document.querySelector('a[href="/enterprise/jobs/deleted"]')`),false);
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(article(post.PostID))}).textContent.includes('Đã xóa')`),true);
 assert.equal(await evaluate(`!!document.querySelector('article [data-delete-post],article [data-edit-post],article [data-publish-post],[data-close-post]')`),false);
 await screenshot('deleted-posts-desktop');
 await click(article(post.PostID)+' [data-view-post]');await waitFor(`!!document.querySelector('#recruitment-details-title')`,'deleted post detail');
 assert.equal(await evaluate(`document.querySelector('dialog').textContent.includes('Thực tập phát triển API.')`),true);
 assert.equal(await evaluate(`document.querySelectorAll('dialog footer button').length`),1);
 await click('dialog footer button');
 await fill(statusFilter,'CLOSED');
 await waitFor(`document.querySelector(${JSON.stringify(article(expired.PostID))})&&document.querySelector('#jobs-tab-current').getAttribute('aria-selected')==='true'`,'expired filter switches to current posts');
 assert(await evaluate(`Array.from(document.querySelectorAll('[data-post-id]')).every(card=>card.innerText.includes('Hết hạn'))`));
 await evaluate(`document.querySelector('#jobs-tab-current').focus()`);
 await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
 await waitFor(`document.activeElement.id==='jobs-tab-deleted'&&document.querySelector(${JSON.stringify(article(post.PostID))})`,'arrow key switches tab and focus');
 await click(currentTab);
 await waitFor(`location.pathname==='/enterprise/jobs'&&document.body.innerText.includes('Hạn doanh nghiệp đăng / công bố tin')`,'back to active posts');
 assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(article(post.PostID))})`),false);
 passed('Published soft deletion in Hạn 1 hides it from students; deleted cards and details are available in the recruitment tab');
 await fillPost('E2E Xóa nháp');await clickText('Lưu nháp');await finishSuccess();
 const deleted=await postByTitle('E2E Xóa nháp');await click(article(deleted.PostID)+' [data-delete-post]');
 await acceptConfirmation();await finishSuccess();
 await waitFor(`!document.querySelector(${JSON.stringify(article(deleted.PostID))})`,'draft removed');
 assert.equal((await postByTitle('E2E Xóa nháp')).Status,'ARCHIVED');
 passed('delete removes only a draft from the enterprise list');
 await fillPost('E2E Công bố trực tiếp');await clickText('Công bố');
 await centeredFeedback();await screenshot('publication-confirmation-desktop');
 await click('[data-feedback-cancel]');
 await waitFor(`!!document.querySelector('dialog[open] #recruitment-title')`,'form restored after cancellation');
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Công bố trực tiếp');
 await clickText('Công bố');await acceptConfirmation();await finishSuccess();
 const direct=await postByTitle('E2E Công bố trực tiếp');assert.equal(direct.Status,'PUBLISHED');
 assert.equal(records.findLast(r=>r.method==='POST'&&r.path==='/api/enterprise/recruitment/posts').body.status,'PUBLISHED');
 passed('form Công bố button atomically creates a Published post');
 await fillPost('E2E Nháp chờ hạn');await clickText('Lưu nháp');await finishSuccess();
 assert(await evaluate(`Array.from(document.querySelectorAll('article[data-post-id]')).every(card=>card.getBoundingClientRect().height<300&&card.scrollWidth<=card.clientWidth+1)`),'Compact cards stay below 300px');
 await screenshot('compact-cards-desktop');
 const boundary=await postByTitle('E2E Nháp chờ hạn');await click(article(boundary.PostID)+' [data-edit-post]');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate(`document.activeElement.blur()`);
 assert(await evaluate(`(() => {const d=document.querySelector('dialog').getBoundingClientRect(),f=document.querySelector('dialog footer').getBoundingClientRect();return d.width<=innerWidth&&d.height<=innerHeight&&f.bottom<=d.bottom+1&&document.querySelector('dialog footer').scrollWidth<=document.querySelector('dialog footer').clientWidth+1;})()`));
 await screenshot('draft-mobile');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await fill('#recruitment-title','E2E Nội dung chưa lưu');
 const deadline=new Date(Date.now()+1800).toISOString();
 await backendRequire('./dist/modules/recruitment/schedule.service').editWindowSchedule(round.id,{...schedule,reason:'Boundary UI check',postingEndsAt:deadline,applicationStartsAt:deadline,resultsStartsAt:deadline},staff.UserID);
 await sleep(Math.max(0,Date.parse(deadline)+100-Date.now()));
 await clickText('Công bố');
 await centeredFeedback();
 if(await evaluate(`!!document.querySelector('[data-feedback-cancel]')`))await acceptConfirmation();
 await waitFor(`/Hạn 1|Đã hết hạn đăng tin/.test(document.querySelector('dialog[open][role=alertdialog]')?.textContent||'')`,'publication rejection popup');
 assert.equal(await evaluate(`document.activeElement.textContent.trim()`),'Đã hiểu');
 await clickText('Đã hiểu');
 assert.equal(await evaluate(`document.querySelectorAll('dialog[open]').length`),1);
 assert.equal(await evaluate(`document.querySelector('#recruitment-title').value`),'E2E Nội dung chưa lưu');
 assert.equal((await postByTitle('E2E Nháp chờ hạn')).Title,'E2E Nháp chờ hạn');
 await clickText('Lưu nháp');await finishSuccess();
 assert.equal((await postByTitle('E2E Nội dung chưa lưu')).Status,'DRAFT');
 await clickText('Tải lại');
 await waitFor(`document.body.innerText.includes('Chưa có đợt nào đang nhận tin')`,'phase 2 loaded');
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tạo tin tuyển dụng').disabled`),true);
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(article(direct.PostID)+' [data-delete-post]')}).disabled`),true);
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(article(boundary.PostID)+' [data-delete-post]')}).disabled`),false);
 assert.equal(await evaluate(`document.querySelector(${JSON.stringify(article(boundary.PostID)+' [data-edit-post]')}).disabled`),false);
 await click(article(boundary.PostID)+' [data-publish-post]');
 await waitFor(`document.querySelector('dialog[open][role=alertdialog]')?.textContent.includes('Đã hết hạn đăng tin')`,'card publication deadline popup');
 await centeredFeedback();
 await screenshot('publication-notice-desktop');
 await dismissFeedback();
 await click(article(boundary.PostID)+' [data-edit-post]');
 await fill('#recruitment-content','Saved again during Hạn 2');
 await clickText('Công bố');
 await waitFor(`document.querySelector('dialog[open][role=alertdialog]')?.textContent.includes('Đã hết hạn đăng tin')`,'form publication deadline popup');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await centeredFeedback();
 await screenshot('publication-notice-mobile');
 await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await waitFor(`!document.querySelector('dialog[open][role=alertdialog]')&&document.querySelector('#recruitment-title')`,'Escape dismisses only the notice');
 assert.equal(await evaluate(`document.querySelector('#recruitment-content').value`),'Saved again during Hạn 2');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await clickText('Lưu nháp');await finishSuccess();
 assert.equal((await postByTitle('E2E Nội dung chưa lưu')).Content,'Saved again during Hạn 2');
 const finalOpportunities=await opportunities();assert(finalOpportunities.some(p=>p.postId===direct.PostID));assert(!finalOpportunities.some(p=>p.postId===post.PostID||p.postId===boundary.PostID));
 await click(article(boundary.PostID)+' [data-delete-post]');
 await acceptConfirmation();await finishSuccess();
 await waitFor(`!document.querySelector(${JSON.stringify(article(boundary.PostID))})`,'draft deleted after Hạn 1');
 assert.equal((await postByTitle('E2E Nội dung chưa lưu')).Status,'ARCHIVED');
 await cdp.send('Page.navigate',{url:origin+'/enterprise/jobs/deleted'});
 await waitFor(`location.pathname==='/enterprise/jobs'&&location.search==='?tab=deleted'&&document.querySelector(${JSON.stringify(article(boundary.PostID))})`,'legacy link opens the deleted tab with retained posts');
 assert.equal(await evaluate(`!!document.querySelector(${JSON.stringify(article(post.PostID))})`),true);
 await screenshot('phase-2-locked');
 for(const [width,height] of [[390,844],[320,640]]){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1&&Array.from(document.querySelectorAll('article[data-post-id]')).every(card=>card.scrollWidth<=card.clientWidth+1)`),'Mobile cards have no overflow');
  await checkOverview(2);
 }
 await screenshot('compact-cards-mobile');
 assert(!records.some(record=>record.path.endsWith('/close')));
 passed('centered popups and compact deleted cards fit desktop/mobile; no closing/locking actions remain');
 assert.equal(runtimeErrors.length,0,runtimeErrors.join('\n'));
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
