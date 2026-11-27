// Build and start `npm run preview -- --host 127.0.0.1 --port 5196` first.
// All API responses are mocked. Set CHROME_PATH/AUTH_TEST_URL if necessary.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const chrome=process.env.CHROME_PATH||[process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1255/chrome-win64/chrome.exe'),'/usr/bin/chromium','/usr/bin/google-chrome'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Set CHROME_PATH to an installed Chromium or Chrome executable.');
const out=path.resolve(__dirname,'../../.cache/student-recruitment-preview');fs.mkdirSync(out,{recursive:true});
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9276','--user-data-dir='+path.join(out,'profile-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,oldSemester=false,assigned=false,publishedNew=false,failNext=false;let requests=[];const errors=[];
const token='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.preview';
const window={id:55,name:'Đợt OJT hiện tại',startsAt:new Date(Date.now()-3600000).toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),status:'OPEN',canSubmit:true,blockingMessages:[]};
const post=(id,company,canApply)=>({id,postId:id+100,title:'Thực tập phát triển phần mềm',description:'Phát triển ứng dụng web',requirements:'React và TypeScript',remainingSlots:2,canApply,blockers:canApply?[]:['REGISTRATION_WINDOW_REQUIRED'],company:{id,name:company,address:'Đà Nẵng'},post:{title:'Tin đã công bố',content:'Nội dung tuyển dụng công khai',benefits:'Được hướng dẫn thực tập',deadlineAt:new Date(Date.now()+86400000).toISOString()}});
const timer=setTimeout(()=>{browser.kill();process.exit(1)},55000);
(async()=>{try{
 let target;for(let i=0;i<40;i++){try{target=await fetch('http://127.0.0.1:9276/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await pause(150)}}assert.ok(target);
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map();
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});ws.send(JSON.stringify({id:n,method,params}));});
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.j(Error(m.error.message)):p.r(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused')void(async()=>{
   const p=m.params,url=new URL(p.request.url);let body,status=200;
   if(p.request.method==='OPTIONS')body={};
   else{
    assert.equal(p.request.method,'GET','The browse test must never submit or modify applications.');requests.push(url.pathname+url.search);
    if(url.pathname==='/api/auth/me')body={success:true,user:{id:1,studentId:10,username:'student',email:'student@example.com',fullName:'Sinh viên thử nghiệm',roleCode:'STUDENT',roleName:'Sinh viên',status:'ACTIVE',mustChangePassword:false}};
    else if(url.pathname==='/api/students/10')body={success:true,data:{id:10,userId:1,email:'student@example.com',fullName:'Sinh viên thử nghiệm',phone:null,studentCode:'SE000010',currentSemester:5,program:{id:1,name:'Kỹ thuật phần mềm'},ojtSemesterId:oldSemester?7:null,ojtRegistrations:{items:[],total:0,page:1,limit:100}}};
    else if(url.pathname==='/api/students/me/study-periods')body={success:true,data:{items:[],currentAcademicPeriodId:null}};
    else if(url.pathname==='/api/ojt-registration-windows'){
     assert.equal(url.searchParams.has('ojtSemesterId'),false,'Window choices must not be forced to a historical OJT semester.');
     const items=assigned?[window]:oldSemester?[{...window,id:8,name:'Đợt cũ',status:'CLOSED',canSubmit:false}]:[];
     body={success:true,data:{items,total:items.length,page:1,limit:100}};
    }else if(url.pathname==='/api/students/me/opportunities'){
     if(failNext){failNext=false;status=503;body={success:false,message:'Hệ thống đang gặp sự cố tạm thời.'};}
     else{const selected=url.searchParams.get('windowId');if(selected)assert.equal(selected,'55');const items=[post(21,'Doanh nghiệp đang tuyển',!!selected),...(publishedNew?[post(22,'Doanh nghiệp vừa công bố',!!selected)]:[])];body={success:true,data:{items,total:items.length,page:1,limit:100,blockers:selected?[]:['REGISTRATION_WINDOW_REQUIRED']}};}
    }else if(url.pathname==='/api/job-applications'){assert.equal(url.searchParams.has('ojtSemesterId'),false);body={success:true,data:{items:[],total:0,page:1,limit:20}};}
    else throw Error('Unexpected API request: '+url.pathname);
   }
   await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type,cache-control,pragma'},{name:'Access-Control-Allow-Methods',value:'GET,OPTIONS'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
  })().catch(e=>errors.push(e.message));
 };
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await pause(100);}console.log(JSON.stringify({body:await ev('document.body.innerText'),errors}));throw Error('Timed out: '+expression);};
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token',${JSON.stringify(token)});localStorage.setItem('ojt_auth_user',JSON.stringify({id:'1',name:'Sinh viên thử nghiệm',email:'student@example.com',role:'student'}));`});
 await send('Emulation.setDeviceMetricsOverride',{width:1365,height:1000,deviceScaleFactor:1,mobile:false});
 const url=(process.env.AUTH_TEST_URL||'http://127.0.0.1:5196')+'/student/ojt-registration';
 await send('Page.navigate',{url});await wait('document.body.innerText.includes("Doanh nghiệp đang tuyển")');
 assert.ok(requests.some(url=>url.startsWith('/api/students/me/opportunities?')&&!url.includes('windowId=')));
 assert.equal(await ev(`document.querySelector('select[aria-label="Chọn đợt đăng ký"]').value`),'all');
 assert.equal(await ev('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Nộp đơn đăng ký OJT")).disabled'),true);
 await ev('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Xem chi tiết & vị trí tuyển dụng")).click()');
 await wait('!!document.querySelector("dialog[open]")&&document.querySelector("dialog").innerText.includes("Phát triển ứng dụng web")');
 assert.equal(await ev('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Ứng tuyển vị trí này")).disabled'),true);
 await ev(`document.querySelector('button[aria-label="Đóng cửa sổ"]').click()`);
 console.log('PASS student without OJT semester/roster: published catalog and vacancy details load; applying remains blocked.');
 publishedNew=true;await pause(8100);await ev('window.dispatchEvent(new Event("focus"));void 0');
 await wait('document.body.innerText.includes("Doanh nghiệp vừa công bố")');
 failNext=true;await send('Page.reload');
 await wait('document.body.innerText.includes("Hệ thống đang gặp sự cố tạm thời")');
 await ev('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Thử lại").click()');
 await wait('!document.body.innerText.includes("Hệ thống đang gặp sự cố tạm thời")&&document.body.innerText.includes("Doanh nghiệp vừa công bố")');
 fs.writeFileSync(path.join(out,'catalog-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await ev('document.getElementById("records-tab").click()');await wait('document.body.innerText.includes("Bạn chưa có hồ sơ ứng tuyển nào")');
 assert.ok(requests.some(url=>url.startsWith('/api/job-applications?')&&!url.includes('ojtSemesterId=')));
 oldSemester=true;await send('Page.navigate',{url});await wait('document.body.innerText.includes("Doanh nghiệp vừa công bố")');
 assert.equal(await ev(`document.querySelector('select[aria-label="Chọn đợt đăng ký"]').value`),'all');
 console.log('PASS focus refresh shows newly published posts; retry recovers; old semester/closed round does not hide current vacancies or application history.');
 assigned=true;await send('Page.navigate',{url});await wait('document.body.innerText.includes("Doanh nghiệp vừa công bố")');
 await ev(`(()=>{const s=document.querySelector('select[aria-label="Chọn đợt đăng ký"]');s.value='55';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await wait('![...document.querySelectorAll("button")].find(b=>b.textContent.includes("Nộp đơn đăng ký OJT")).disabled');
 assert.ok(requests.some(url=>url.includes('windowId=55')));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(250);
 assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
 fs.writeFileSync(path.join(out,'catalog-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 assert.deepEqual(errors,[]);console.log('PASS selecting an eligible own round enables applying; desktop/mobile fit; every API request is read-only and mocked.');await send('Browser.close');
 }finally{clearTimeout(timer);ws?.close();browser.kill();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
