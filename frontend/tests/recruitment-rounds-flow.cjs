// Runs the actual recruitment component in Vite with every API request mocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../.cache/recruitment-rounds-preview');
const chrome=process.env.CHROME_PATH||[process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1255/chrome-win64/chrome.exe'),'/usr/bin/chromium','/usr/bin/google-chrome'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Set CHROME_PATH to an installed Chromium executable.');
fs.mkdirSync(out,{recursive:true});
const fixture=path.join(root,'.cache/recruitment-rounds-preview');fs.mkdirSync(fixture,{recursive:true});
const today=new Date(),day=86400000,start=new Date(+today-day).toISOString().slice(0,10),end=new Date(+today+30*day).toISOString().slice(0,10);
fs.writeFileSync(path.join(fixture,'index.html'),'<div id="root"></div><script type="module" src="./main.tsx"></script>');
fs.writeFileSync(path.join(fixture,'main.tsx'),`import React from 'react';import{createRoot}from'react-dom/client';import{RecruitmentRounds}from'/src/components/qhdn/RecruitmentRounds';import'/src/index.css';createRoot(document.getElementById('root')!).render(<main className="p-4"><RecruitmentRounds selection={{selectedPeriod:{id:7,name:'Học kỳ thử nghiệm',startDate:'${start}',endDate:'${end}',status:'ACTIVE'},canOpenRecruitment:true} as any}/></main>);`);
const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5197','--strictPort'],{cwd:root,windowsHide:true,stdio:'ignore'});
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9277','--user-data-dir='+path.join(out,'profile-'+Date.now()),'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws;const errors=[],writes=[];
const minute=Math.ceil(Date.now()/60000)*60000;
const first={id:1,campaignId:1,roundNumber:1,name:'Đợt đầu đang mở',status:'OPEN',currentPhase:'POSTING',startsAt:new Date(minute-3600000).toISOString(),endsAt:new Date(minute+2*day).toISOString(),postingStartsAt:new Date(minute-3600000).toISOString(),postingEndsAt:new Date(minute+day/2).toISOString(),applicationStartsAt:new Date(minute+day/2).toISOString(),applicationEndsAt:new Date(minute+day).toISOString(),resultsStartsAt:new Date(minute+day/2).toISOString(),resultsEndsAt:new Date(minute+2*day).toISOString(),canPost:true,canOpen:false,pendingCount:0};
let rounds=[first];
const timer=setTimeout(()=>{server.kill();browser.kill();process.exit(1)},55000);
(async()=>{try{
 let target;for(let i=0;i<60;i++){try{target=await fetch('http://127.0.0.1:9277/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await pause(150)}}assert.ok(target);
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5197/.cache/recruitment-rounds-preview/index.html')).ok)break;}catch{}await pause(150);}
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map();
 const send=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});ws.send(JSON.stringify({id:n,method,params}));});
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.j(Error(m.error.message)):p.r(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused')void(async()=>{
   const p=m.params,url=new URL(p.request.url);let body={};
   if(p.request.method!=='OPTIONS'){
    assert.ok(url.pathname.startsWith('/api/recruitment/windows'));
    if(p.request.method==='GET')body={success:true,data:{items:rounds,campaigns:[{id:1,name:'Học kỳ thử nghiệm'}]}};
    else if(p.request.method==='POST'){
     const input=JSON.parse(p.request.postData);writes.push(input);
     const r=input.rounds[0];assert.equal(Date.parse(r.postingStartsAt),Date.parse(first.endsAt));assert.ok(Date.parse(r.resultsEndsAt)<=Date.parse(end+'T00:00:00+07:00')+day);
     rounds=[first,{...r,id:2,campaignId:1,roundNumber:2,startsAt:r.postingStartsAt,endsAt:r.resultsEndsAt,status:'DRAFT',currentPhase:'DRAFT',canOpen:true,pendingCount:0}];
     body={success:true,data:{id:1,name:'Học kỳ thử nghiệm',rounds:[rounds[1]]}};
    }else if(p.request.method==='PATCH'){
     assert.equal(url.pathname,'/api/recruitment/windows/2');rounds[1]={...rounds[1],status:'OPEN',currentPhase:'SCHEDULED',canOpen:false};body={success:true,data:rounds[1]};writes.push({open:2});
    }else throw Error('Unexpected method '+p.request.method);
   }
   await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type,cache-control,pragma'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
  })().catch(e=>errors.push(e.stack));
 };
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await pause(100);}console.log(JSON.stringify({body:await ev('document.body.innerText'),errors}));throw Error('Timed out: '+expression);};
 const click=label=>ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
 const fill=(selector,value)=>ev(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:1365,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5197/.cache/recruitment-rounds-preview/index.html'});
 await wait('document.body.innerText.includes("Đợt đầu đang mở")');
 assert.equal(await ev('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Tạo đợt bổ sung")).disabled'),false);
 await click('Tạo đợt bổ sung');await wait('!!document.getElementById("postingStartsAt-date")');
 const initial=await ev('({date:document.getElementById("postingStartsAt-date").value,time:document.getElementById("postingStartsAt-time").value})');
 const expected=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(first.endsAt));
 assert.equal(initial.date,expected.slice(0,10).split('-').reverse().join('/'));assert.equal(initial.time,expected.slice(11));
 await fill('input[name="name"]','Đợt bổ sung thử nghiệm');
 const overlap=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(Date.parse(first.endsAt)-3600000));
 await fill('#postingStartsAt-date',overlap.slice(0,10).split('-').reverse().join('/'));await fill('#postingStartsAt-time',overlap.slice(11));
 await click('Tạo đợt tuyển dụng');await wait('document.body.innerText.includes("Lịch trùng")');assert.equal(writes.length,0);
 await fill('#postingStartsAt-date',initial.date);await fill('#postingStartsAt-time',initial.time);
 fs.writeFileSync(path.join(out,'supplemental-desktop.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(150);
 assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
 fs.writeFileSync(path.join(out,'supplemental-mobile.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await click('Tạo đợt tuyển dụng');await wait('document.body.innerText.includes("Xác nhận tạo đợt OJT")');await click('Xác nhận tạo đợt');
 await wait('document.querySelectorAll("article").length===2');assert.equal(writes[0].supplemental,true);
 await click('Mở đợt');await wait('document.body.innerText.includes("Xác nhận mở đợt OJT")');await click('Xác nhận mở đợt');
 await wait('document.body.innerText.includes("Chờ bắt đầu")');assert.equal(rounds[0].status,'OPEN');assert.equal(rounds[1].status,'OPEN');assert.equal(writes.length,2);
 assert.deepEqual(errors,[]);console.log('PASS browser: supplemental enabled during ongoing round, exact adjacent suggestions, overlap blocked before API, both rounds retained, future round opens as scheduled, desktop/mobile fit. All API writes mocked.');
 await send('Browser.close');
 }finally{clearTimeout(timer);ws?.close();browser.kill();server.kill();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
