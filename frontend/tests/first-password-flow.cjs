// Build first, start `npm run preview -- --host 127.0.0.1 --port 5196`, then
// run `npm run test:auth-first-password`. All API traffic is mocked, including
// password changes. Set AUTH_TEST_URL or CHROME_PATH for another local setup.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const chrome=process.env.CHROME_PATH||[
 process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1255/chrome-win64/chrome.exe'),
 '/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome',
].find(candidate=>candidate&&fs.existsSync(candidate));
if(!chrome)throw Error('Set CHROME_PATH to an installed Chromium or Chrome executable.');
const out=path.resolve(__dirname,'../../.cache/first-password-preview');fs.mkdirSync(out,{recursive:true});
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9275','--user-data-dir='+path.join(out,'profile-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,role='STUDENT',mustChange=true,wrongPassword=false,passwordPosts=0;
let protectedRequests=[];const errors=[];
const token='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.preview';
const profile=()=>({id:1,username:'test.account',email:'test@example.com',fullName:'Tài khoản thử nghiệm',status:'ACTIVE',roleCode:role,roleName:role,studentId:10,mustChangePassword:mustChange});
const timer=setTimeout(()=>{console.error('First-password browser check timed out.');browser.kill();process.exit(1)},55000);
(async()=>{try{
 let target;for(let i=0;i<40;i++){try{target=await fetch('http://127.0.0.1:9275/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await pause(150)}}assert.ok(target);
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map();
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});ws.send(JSON.stringify({id:n,method,params}));});
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.j(Error(m.error.message)):p.r(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused')void(async()=>{
   const p=m.params,url=new URL(p.request.url);let body,status=200;
   if(p.request.method==='OPTIONS')body={};
   else if(url.pathname==='/api/auth/login')body={success:true,token,user:profile(),mustChangePassword:mustChange};
   else if(url.pathname==='/api/auth/me'){await pause(150);body={success:true,user:profile()};}
   else if(url.pathname==='/api/auth/change-password'){
    passwordPosts++;
    if(wrongPassword){status=401;body={success:false,errorCode:'INVALID_CREDENTIALS',message:'Current password is incorrect.'};}
    else{mustChange=false;body={success:true,message:'Password changed.'};}
   }else if(url.pathname==='/api/auth/logout')body={success:true};
   else{
    protectedRequests.push(url.pathname);
    if(url.pathname==='/api/students/10')body={success:true,data:{id:10,userId:1,email:'test@example.com',fullName:'Tài khoản thử nghiệm',phone:null,studentCode:'SE000010',currentSemester:1,program:{id:1,code:'SE',name:'Kỹ thuật phần mềm'},ojtSemesterId:null,ojtRegistrations:{items:[],total:0,page:1,limit:100}}};
    else if(url.pathname==='/api/students/me/study-periods')body={success:true,data:{items:[],currentAcademicPeriodId:null}};
    else if(['/api/ojt-registration-windows','/api/ojt-registrations'].includes(url.pathname))body={success:true,data:{items:[],total:0,page:1,limit:100}};
    else{status=503;body={success:false,message:'Chưa có dữ liệu thử nghiệm.'};}
   }
   await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type,cache-control,pragma'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,PUT,OPTIONS'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
  })().catch(e=>errors.push(e.message));
 };
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await pause(100);}console.log('Browser state:',JSON.stringify({body:await ev('document.body.innerText'),errors}));throw Error('Timed out: '+expression);};
 const fill=async values=>{await ev(`(()=>{const values=${JSON.stringify(values)};for(const [id,value]of Object.entries(values)){const input=document.getElementById(id);if(!input)throw Error('Missing input '+id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}})()`);};
 const submit=()=>ev('document.querySelector("form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));void 0');
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__sawStudentShell=false;new MutationObserver(()=>{if(document.body?.innerText.includes('CỔNG SINH VIÊN'))window.__sawStudentShell=true;}).observe(document,{childList:true,subtree:true});`});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const base=process.env.AUTH_TEST_URL||'http://127.0.0.1:5196';
 await send('Page.navigate',{url:base+'/login'});await wait('!!document.getElementById("login-account")');
 const loginBackground=await ev(`document.querySelector('img[src="/login_bg.webp"]').getAttribute('src')`);
 const loginGradient=await ev('getComputedStyle(document.getElementById("login-submit")).backgroundImage');
 await fill({'login-account':'test@example.com','login-password':'TemporaryPass1!'});await submit();
 await wait('location.pathname==="/change-password"&&!!document.getElementById("first-password-currentPassword")');
 assert.equal(await ev('window.__sawStudentShell'),false);assert.deepEqual(protectedRequests,[]);
 assert.equal(await ev(`document.querySelector('img[src="/login_bg.webp"]').getAttribute('src')`),loginBackground);
 assert.equal(await ev('getComputedStyle(document.querySelector("button[type=submit]")).backgroundImage'),loginGradient);
 assert.ok(await ev('document.body.innerText.includes("tài khoản sinh viên")'));
 await pause(950);fs.writeFileSync(path.join(out,'student-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await fill({'first-password-currentPassword':'TemporaryPass1!','first-password-newPassword':'NewPassword123!','first-password-confirmation':'MismatchPass123!'});await submit();
 await wait('document.body.innerText.includes("Mật khẩu xác nhận không khớp")');assert.equal(passwordPosts,0);
 const tooManyBytes='ắ'.repeat(25);
 await fill({'first-password-newPassword':tooManyBytes,'first-password-confirmation':tooManyBytes});await submit();
 await wait('!!document.querySelector("[role=alert]")&&document.querySelector("[role=alert]").innerText.includes("72 byte")');assert.equal(passwordPosts,0);
 await fill({'first-password-newPassword':'NewPassword123!','first-password-confirmation':'NewPassword123!'});wrongPassword=true;await submit();
 await wait('document.body.innerText.includes("Mật khẩu tạm chưa chính xác")');assert.equal(await ev('!!localStorage.getItem("ojt_auth_token")'),true);
 wrongPassword=false;await submit();await wait('location.pathname==="/login"&&document.body.innerText.includes("Đổi mật khẩu thành công")');
 assert.equal(passwordPosts,2);assert.equal(await ev('localStorage.getItem("ojt_auth_token")'),null);
 await fill({'login-account':'test@example.com','login-password':'NewPassword123!'});await submit();
 await wait('document.body.innerText.includes("CỔNG SINH VIÊN")');assert.equal(await ev('!!document.getElementById("first-password-title")'),false);
 console.log('PASS new student: standalone gate before portal, shared login background/colors, validation, wrong password preserves session, change succeeds, login returns to student portal.');
 await pause(400);protectedRequests=[];mustChange=true;
 await ev(`localStorage.setItem('ojt_auth_token',${JSON.stringify(token)});localStorage.setItem('ojt_auth_user',JSON.stringify({id:'1',name:'Cached',email:'test@example.com',role:'student',mustChangePassword:false}));`);
 await send('Page.navigate',{url:base+'/student/profile'});
 await wait('location.pathname==="/change-password"&&!!document.getElementById("first-password-title")');
 assert.equal(await ev('window.__sawStudentShell'),false);assert.deepEqual(protectedRequests,[]);
 await send('Page.reload');await wait('!!document.getElementById("first-password-title")');assert.deepEqual(protectedRequests,[]);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(950);
 assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
 fs.writeFileSync(path.join(out,'student-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 console.log('PASS cached false flag, direct student profile URL, reload and mobile; student shell never mounts before password setup.');
 role='ENTERPRISE';protectedRequests=[];
 await ev(`localStorage.setItem('ojt_auth_token',${JSON.stringify(token)});localStorage.setItem('ojt_auth_user',JSON.stringify({id:'1',name:'Cached',email:'test@example.com',role:'enterprise'}));`);
 await send('Page.navigate',{url:base+'/enterprise/dashboard'});
 await wait('location.pathname==="/change-password"&&document.body.innerText.includes("tài khoản doanh nghiệp")');assert.deepEqual(protectedRequests,[]);
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(950);
 fs.writeFileSync(path.join(out,'enterprise-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await ev('localStorage.clear()');await send('Page.navigate',{url:base+'/change-password'});await wait('location.pathname==="/login"&&!!document.getElementById("login-account")');
 assert.deepEqual(errors,[]);console.log('PASS new enterprise uses the same standalone design; anonymous setup route returns to login; no real API calls or account changes.');
 await send('Browser.close');
 }finally{clearTimeout(timer);ws?.close();browser.kill();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
