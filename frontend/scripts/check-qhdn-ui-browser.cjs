// Browser checks use local API fixtures; no account or database is modified.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'.cache','qhdn-ui-'+process.pid);
const records=[],errors=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let vite,browser,cdp,legacySummary=false,bulkAccepted=false,extraAccepted=0,legacyDashboard=false;
const notificationRead={qhdn:false,enterprise:false};
class CDP {
 constructor(url){
  this.socket=new WebSocket(url);this.pending=new Map();this.id=0;
  this.ready=new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',reject,{once:true});});
  this.socket.addEventListener('message',({data})=>{const message=JSON.parse(data);if(message.id){const item=this.pending.get(message.id);if(item){this.pending.delete(message.id);clearTimeout(item.timer);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);});
 }
 async send(method,params={}){await this.ready;const id=++this.id;const result=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('CDP timeout: '+method)),15000);this.pending.set(id,{resolve,reject,timer});});this.socket.send(JSON.stringify({id,method,params}));return result;}
}
async function evaluate(expression){const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function waitFor(expression){const deadline=Date.now()+15000;while(Date.now()<deadline){if(await evaluate(`Boolean(${expression})`))return;await sleep(100);}throw Error('Timed out: '+expression+'\n'+await evaluate('document.body.innerText.slice(-2000)'));}
const clickText=text=>evaluate(`Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()===${JSON.stringify(text)}).click()`);
const fill=(selector,value)=>evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
async function screenshot(name){const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(artifacts,name+'.png'),Buffer.from(result.data,'base64'));}
const period={id:1,academicYearId:1,academicYear:{id:1,code:'2028–2029'},periodCode:'FALL-2028',name:'Fall 2028',kind:'SEMESTER',status:'PLANNED',startDate:'2028-09-01',endDate:'2028-12-31',ojtSemesterId:1};
const round={id:1,name:'Tuyển dụng Fall 2028',campaignId:1,roundNumber:1,status:'OPEN',currentPhase:'SCHEDULED',startsAt:'2028-11-11T07:40:00Z',endsAt:'2028-11-13T13:00:00Z',postingStartsAt:'2028-11-11T07:40:00Z',postingEndsAt:'2028-11-11T12:40:00Z',applicationStartsAt:'2028-11-12T07:40:00Z',applicationEndsAt:'2028-11-12T12:40:00Z',resultsStartsAt:'2028-11-12T07:40:00Z',resultsEndsAt:'2028-11-13T13:00:00Z',canOpen:false,pendingCount:0};
const enterpriseProfile={id:17,code:'TECHVIET',name:'TechViet',status:'ACTIVE',industry:'Information Technology',address:null,contactPersonName:'HR Department',contactEmail:'hr@techviet.example',contactPhone:null,createdAt:'2026-10-27T02:54:00Z',representative:{id:1,userId:1,username:'enterprise01',fullName:'TechViet HR',email:'hr@techviet.example',phone:null,positionTitle:'HR'},summary:{scope:'ALL_SEMESTERS',pendingCandidates:3,activeInterns:0,pendingEvaluations:0}};
function fixtures(server){server.middlewares.use('/api',(req,res)=>{
 const account=req.headers.authorization==='Bearer enterprise-fixture'?'enterprise':'qhdn';
 const url=new URL(req.url,'http://localhost');const record={path:url.pathname,method:req.method,account};records.push(record);
 const paged=items=>({items,total:items.length,page:1,limit:100});
 const send=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:true,data}));};
 if(req.method==='PATCH'||req.method==='POST'){let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
  record.body=JSON.parse(body);
  if(url.pathname==='/enterprise/profile'){assert.equal(record.body.companyId,17);const {companyId,...changes}=record.body;Object.assign(enterpriseProfile,changes);return send(enterpriseProfile);}
  if(url.pathname==='/accounts/me/notifications/1'){assert.equal(record.body.isRead,true);notificationRead[account]=true;return send({id:1,isRead:true});}
  if(url.pathname==='/enterprise/candidates/acceptance-preview')return send({candidateIds:record.body.candidateIds,confirmationToken:'fixture',totalSelected:record.body.candidateIds.length,overCapacity:true,semesters:[{ojtSemesterId:1,name:'Fall 2028',capacity:2,currentCount:0,selectedCount:3,afterCount:3,excessCount:1}]});
  if(url.pathname==='/enterprise/candidates/accept-bulk'){assert.equal(record.body.allowOverCapacity,true);bulkAccepted=true;return send({acceptedCount:3});}
  send(round);
 });return;}
 if(url.pathname==='/auth/me'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({user:{mustChangePassword:false}}));return;}
 if(url.pathname==='/enterprise/profile'){const summary={...enterpriseProfile.summary,pendingCandidates:bulkAccepted?0:3,acceptedInterns:(bulkAccepted?3:0)+extraAccepted,completedInterns:0};if(legacyDashboard){delete summary.acceptedInterns;delete summary.completedInterns;}return send({...enterpriseProfile,summary});}
 if(url.pathname==='/accounts/me/notifications')return send({...paged([{id:1,title:'Đợt tuyển dụng mới',content:'Kiểm tra lịch tiếp nhận sinh viên của doanh nghiệp.',isRead:notificationRead[account],sentAt:'2026-11-16T09:00:00Z'},{id:2,title:'Hồ sơ đã cập nhật',content:'Thông tin doanh nghiệp đã được lưu.',isRead:true,sentAt:'2026-11-15T09:00:00Z'}]),unreadCount:notificationRead[account]?0:1});
 if(url.pathname==='/enterprise/candidate-periods')return send({items:[]});
 if(url.pathname==='/enterprise/candidates')return send(paged([1,2,3].map(id=>({id,decision:bulkAccepted?'ACCEPTED':'PENDING',isLatestCoordination:true,canRespond:!bulkAccepted,introducedAt:'2026-11-16T00:00:00Z',student:{id,fullName:'Ứng viên '+id,studentCode:'SE18000'+id},position:{id:1,title:'Intern',code:'INTERN'}}))));
 if(url.pathname==='/academic-periods'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:true,...paged([period])}));return;}
 if(url.pathname==='/companies')return send(paged([{id:1,name:'Công ty Phần mềm Việt',status:'ACTIVE'}]));
 if(url.pathname==='/recruitment/windows')return send({items:[round],campaigns:[{id:1,name:round.name}],total:1});
 if(url.pathname==='/qhdn/placements'){
  if(legacySummary)return send({context:{roundCount:1,unfinished:0},canCoordinate:false,...(legacySummary==='empty'?{companies:[]}:{}),positions:[{id:1,companyName:'TechViet',title:'Backend',capacity:2,actualCount:0},{id:2,companyName:'TechViet',title:'Frontend',capacity:3,actualCount:0}],items:[1,2,3].map(id=>({id,studentCode:'SE25000'+id,fullName:'Đã nhận '+id,companyName:'TechViet',decision:'ACCEPTED',canCoordinate:false,hasAssignment:false}))});
  return send({context:{roundCount:1,unfinished:1,applicationDeadlinePassed:true},canCoordinate:true,positions:[],companies:[{id:1,name:'Công ty Phần mềm Việt',capacity:1,actualCount:2,availableSlots:0}],items:[...[1,2].map(id=>({id,studentCode:'SE18000'+id,fullName:'Sinh viên '+id,canCoordinate:true,hasAssignment:false,decision:'REJECTED'})),{id:3,studentCode:'SE180003',fullName:'Đã được nhận',companyName:'Công ty Phần mềm Việt',canCoordinate:false,hasAssignment:false,decision:'ACCEPTED'},{id:4,studentCode:'SE180004',fullName:'Chưa đăng ký đã quá hạn',canCoordinate:true,hasAssignment:false}]});
 }
 if(url.pathname==='/ojt-results'){assert.equal(url.searchParams.get('includeUntransferred'),'true');return send(paged([{id:1,evaluationId:1,resultId:null,fullName:'Nguyễn Minh Anh',studentCode:'SE180001',enterpriseName:'Công ty Phần mềm Việt',completionScore:8,attitudeScore:9,skillScore:0,overallScore:8.25,officialScore:null,status:'SUBMITTED'}]));}
 if(url.pathname.includes('/export')){res.setHeader('Content-Type','text/csv');res.end('student,score\nSE180001,8.5');return;}
 return send({...paged([]),unreadCount:0});
});}
async function main(){
 await fs.mkdir(artifacts,{recursive:true});
 const {createServer}=await import('vite');
 delete process.env.VITE_API_URL;delete process.env.VITE_API_BASE_URL;
 vite=await createServer({root,envDir:artifacts,plugins:[{name:'qhdn-ui-fixtures',configureServer:fixtures}],server:{host:'127.0.0.1',port:0,open:false,watch:{ignored:['**/.cache/**']}}});
 await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
 const profile=path.join(artifacts,'chrome');
 browser=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run','--disable-background-networking','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 for(let i=0;i<100;i++){try{const active=await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8');const targets=await(await fetch('http://127.0.0.1:'+Number(active.split(/\r?\n/)[0])+'/json/list')).json();cdp=new CDP(targets.find(target=>target.type==='page').webSocketDebuggerUrl);break;}catch{await sleep(100);}}
 assert.ok(cdp,'Chrome started');await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
 await cdp.send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Ho_Chi_Minh'});
 await cdp.send('Network.setBlockedURLs',{urls:['*onrender.com*','*supabase.com*','*googleapis.com*','*gstatic.com*']});
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token','local-fixture');localStorage.setItem('ojt_auth_user',JSON.stringify({id:'1',name:'Phòng QHDN',email:'qhdn@example.test',role:'qhdn'}));`});
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp.send('Page.navigate',{url:origin+'/qhdn/evaluations'});
 await waitFor(`document.body.innerText.includes('Nguyễn Minh Anh')`);
 assert.equal(await evaluate(`!!document.querySelector('header input')`),false,'QHDN header has no search bar');
 assert.equal(await evaluate(`!!document.querySelector('header button[title="Đổi ngôn ngữ"]')`),false,'QHDN header has no language selector');
 assert.equal(await evaluate(`!!document.querySelector('header button[aria-label^="Thông báo"]')`),false,'QHDN header has no notification bell');
 assert.equal(await evaluate(`import('/src/config/api.ts').then(module=>module.API_BASE_URL)`),'/api','Development defaults to the local API proxy without a test-only URL override');
 assert.equal(await evaluate(`document.querySelectorAll('[role="tab"]').length`),2);
 assert.equal(await evaluate(`document.body.innerText.includes('Phiếu đánh giá')`),false);
 assert.ok(await evaluate(`document.querySelector('[role="tabpanel"]').textContent.includes('Đã đánh giá · Chưa chuyển giao')`));
 assert.equal(await evaluate(`document.querySelector('[role="tabpanel"]').textContent.includes('Điểm chính thức')`),false);
 assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[role="tabpanel"] thead th')).map(cell=>cell.textContent)`),['STT','Sinh viên','Doanh nghiệp','Điểm hoàn thành','Điểm thái độ','Điểm kỹ năng','Điểm tổng kết OJT','Trạng thái']);
 assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[role="tabpanel"] tbody tr:first-child td')).slice(3,7).map(cell=>cell.textContent)`),['8','9','0','8.25']);
 await clickText('CSV');
 await waitFor(`document.body.innerText.includes('Đã tải kết quả OJT.')`);
 assert.ok(records.some(record=>record.path==='/ojt-semesters/1/results/export'));
 await screenshot('reports-results-desktop');
 await clickText('Xuất báo cáo');await waitFor(`document.body.innerText.includes('Tải báo cáo CSV')`);await screenshot('reports-export-desktop');
 assert.equal(await evaluate(`document.body.innerText.includes('Tất cả doanh nghiệp')`),false);
 assert.equal(await evaluate(`document.querySelectorAll('[role="tabpanel"] select').length`),1);
 await clickText('Tải báo cáo CSV');await waitFor(`document.body.innerText.includes('Đã tải báo cáo CSV')`);
 assert.ok(records.some(record=>record.path==='/qhdn/reports/export'));
 assert.ok(!records.some(record=>record.path.includes('internship-evaluations')));
 assert.ok(!records.some(record=>record.path==='/companies'));
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await screenshot('reports-mobile');
 assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Report fits mobile width');
 await cdp.send('Page.navigate',{url:origin+'/qhdn/registration-windows'});
 await waitFor(`document.body.innerText.includes('Sửa lịch')`);await clickText('Sửa lịch');
 await waitFor(`!!document.querySelector('[role="dialog"] input[type="date"]')`);
 assert.equal(await evaluate(`document.querySelectorAll('[role="dialog"] input[type="date"]:not(:disabled)').length`),6);
 assert.equal(await evaluate(`document.querySelectorAll('[role="dialog"] input[type="time"]:not(:disabled)').length`),6);
 await screenshot('schedule-mobile');
 assert.ok(await evaluate(`document.querySelector('[role="dialog"]').scrollWidth<=document.querySelector('[role="dialog"]').clientWidth`),'Date controls fit mobile dialog');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await screenshot('schedule-desktop');
 assert.equal(await evaluate(`document.querySelector('#resultsStartsAt-date').type`),'text');
 assert.equal(await evaluate(`document.querySelector('#resultsStartsAt-time').type`),'text');
 await fill('#resultsStartsAt-date','12/11/2028');await fill('[aria-label="Giờ bắt đầu 3. doanh nghiệp xét tuyển, phản hồi"]','16:00');
 assert.equal(await evaluate(`document.querySelector('#resultsStartsAt-date').value`),'12/11/2028');
 assert.equal(await evaluate(`document.querySelector('#resultsStartsAt-time').value`),'16:00');
 await fill('#resultsStartsAt-picker','2028-11-12');
 assert.equal(await evaluate(`document.querySelector('#resultsStartsAt-date').value`),'12/11/2028');
 await fill('[role="dialog"] textarea[name="reason"]','Điều chỉnh lịch trước giờ bắt đầu');await clickText('Lưu lịch');
 await waitFor(`!document.querySelector('[role="dialog"]')`);
 assert.ok(records.some(record=>record.method==='PATCH'&&record.path==='/recruitment/windows/1/schedule'&&record.body.resultsStartsAt==='2028-11-12T09:00:00.000Z'));
 await cdp.send('Page.navigate',{url:origin+'/qhdn/coordination'});
 await waitFor(`document.body.innerText.includes('Sinh viên 2')`);
 assert.equal(await evaluate(`!!document.querySelector('button[aria-label^="Ghi nhận thực nhận"]')`),false);
 assert.equal(await evaluate(`Array.from(document.querySelector('select[aria-label="Lọc trạng thái"]').options).some(option=>option.textContent==='Thực nhận')`),false);
 await evaluate(`document.querySelector('input[aria-label="Chọn tất cả sinh viên có thể điều phối trong danh sách"]').click()`);
 await clickText('Điều phối hàng loạt (3)');
 await waitFor(`!!document.querySelector('[role="dialog"] select[name="companyId"]')`);
 assert.equal(await evaluate(`!!document.querySelector('[role="dialog"] select[name="positionId"]')`),false);
 assert.equal(await evaluate(`!!document.querySelector('[role="dialog"] select[name="source"]')`),false);
 assert.ok(await evaluate(`document.querySelector('select[name="companyId"]').textContent.includes('Còn 0 slot')`));
 await fill('select[name="companyId"]','1');await fill('[role="dialog"] textarea[name="reason"]','Điều phối bổ sung vượt chỉ tiêu');
 await screenshot('bulk-company-coordination');await clickText('Xác nhận điều phối (3)');
 await waitFor(`!document.querySelector('[role="dialog"]')`);
 const referrals=records.filter(record=>record.method==='POST'&&record.path==='/qhdn/placements');
 assert.equal(referrals.length,3);assert.ok(referrals.every(record=>record.body.companyId===1&&!('positionId' in record.body)));
 assert.ok(referrals.some(record=>record.body.studentId===4));assert.ok(referrals.every(record=>record.body.studentId!==3));
 for(const mode of ['missing','empty']){
  legacySummary=mode;
  await cdp.send('Page.navigate',{url:origin+'/qhdn/coordination'});
  await waitFor(`document.body.innerText.includes('Đã nhận 3')`);
  const summary=await evaluate(`(()=>{const section=Array.from(document.querySelectorAll('section')).find(node=>node.querySelector('h2')?.textContent==='Chỉ tiêu và số lượng thực nhận');return Array.from(section.querySelectorAll('tbody tr')).map(row=>Array.from(row.querySelectorAll('td')).map(cell=>cell.textContent.trim()));})()`);
  assert.deepEqual(summary,[['1','TechViet','5','3','0']]);
  await screenshot('company-summary-'+mode);
 }
 assert.equal(records.some(record=>record.path==='/accounts/me/notifications'),false,'Notification requests start from the menu page instead of header polling');
 await clickText('Thông báo');
 await waitFor(`location.pathname==='/qhdn/notifications'&&document.body.innerText.includes('Đợt tuyển dụng mới')`);
 assert.ok(await evaluate(`document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('1 chưa đọc')`));
 assert.ok(await evaluate(`document.body.innerText.includes('tài khoản Quan hệ Doanh nghiệp')`));
 await screenshot('qhdn-notifications-desktop');
 await clickText('Đánh dấu đã đọc');
 await waitFor(`document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('0 chưa đọc')`);
 await clickText('Tải lại');
 await waitFor(`!document.querySelector('[role="status"]')&&document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('0 chưa đọc')`);
 assert.equal(records.filter(record=>record.account==='qhdn'&&record.method==='PATCH'&&record.path==='/accounts/me/notifications/1').length,1);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await screenshot('qhdn-notifications-mobile');
 assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),'Notification page fits mobile width');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('ojt_auth_token','enterprise-fixture');localStorage.setItem('ojt_auth_user',JSON.stringify({id:'1',name:'Doanh nghiệp',email:'enterprise@example.test',role:'enterprise'}));`});
 await cdp.send('Page.navigate',{url:origin+'/enterprise/candidates'});
 await waitFor(`document.body.innerText.includes('Ứng viên 3')`);
 await screenshot('enterprise-candidates-desktop');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await screenshot('enterprise-candidates-mobile');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.querySelector('input[aria-label="Chọn tất cả hồ sơ có thể tiếp nhận"]').click()`);
 await clickText('Nhận sinh viên đã chọn (3)');
 await waitFor(`!!document.querySelector('[role="dialog"]')`);
 assert.ok(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes('Vượt chỉ tiêu')`));
 assert.equal(await evaluate(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(button=>button.textContent==='Đồng ý nhận vượt chỉ tiêu').disabled`),true);
 await screenshot('enterprise-bulk-excess-confirmation');
 await clickText('Hủy');assert.ok(!records.some(record=>record.path==='/enterprise/candidates/accept-bulk'));
 await clickText('Nhận sinh viên đã chọn (3)');await waitFor(`!!document.querySelector('[role="dialog"]')`);
 await evaluate(`document.querySelector('[role="dialog"] input[type="checkbox"]').click()`);
 await clickText('Đồng ý nhận vượt chỉ tiêu');
 await waitFor(`!document.querySelector('[role="dialog"]')&&document.body.innerText.includes('Số thực nhận và chênh lệch chỉ tiêu đã được cập nhật')`);
 const bulkRequests=records.filter(record=>record.path==='/enterprise/candidates/accept-bulk');
 assert.equal(bulkRequests.length,1);assert.equal(bulkRequests[0].body.allowOverCapacity,true);assert.deepEqual(bulkRequests[0].body.candidateIds,[1,2,3]);
 const priorProfileLoads=records.filter(record=>record.path==='/enterprise/profile').length;
 await clickText('Tổng quan');
 await waitFor(`location.pathname==='/enterprise/dashboard'&&!!document.querySelector('[role="img"][aria-label*="Đã tiếp nhận: 3 sinh viên"]')`);
 assert.ok(records.filter(record=>record.path==='/enterprise/profile').length>priorProfileLoads,'Returning to dashboard fetches fresh figures instead of cached context');
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('main a')).find(link=>link.textContent.includes('Sinh viên đã tiếp nhận')).textContent.includes('3sinh viên')`));
 assert.ok(await evaluate(`document.querySelector('[role="img"][aria-label*="Đã tiếp nhận"]').getAttribute('aria-label').includes('Chờ duyệt: 0 sinh viên')`));
 await waitFor(`document.querySelector('[role="img"] [title="Đã tiếp nhận: 3 sinh viên"]').getBoundingClientRect().height>100`);
 await screenshot('enterprise-dashboard-after-acceptance');
 extraAccepted=1;
 await waitFor(`!Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()==='Làm mới số liệu').disabled`);
 await clickText('Làm mới số liệu');
 await waitFor(`!!document.querySelector('[role="img"][aria-label*="Đã tiếp nhận: 4 sinh viên"]')`);
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('main a')).find(link=>link.textContent.includes('Sinh viên đã tiếp nhận')).textContent.includes('4sinh viên')`));
 legacyDashboard=true;await clickText('Làm mới số liệu');
 await waitFor(`document.body.innerText.includes('Chưa tải được đầy đủ số liệu thống kê')`);
 assert.equal(await evaluate(`!!document.querySelector('[role="img"][aria-label*="Đã tiếp nhận"]')`),false,'Missing counts produce an error instead of NaN/blank bars');
 legacyDashboard=false;await clickText('Làm mới số liệu');
 await waitFor(`!!document.querySelector('[role="img"][aria-label*="Đã tiếp nhận: 4 sinh viên"]')`);
 assert.equal(await evaluate(`!!document.querySelector('header button[aria-label^="Thông báo"]')`),false);
 await clickText('Thông báo');
 await waitFor(`location.pathname==='/enterprise/notifications'&&document.body.innerText.includes('Đợt tuyển dụng mới')`);
 assert.ok(await evaluate(`document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('1 chưa đọc')`));
 await screenshot('enterprise-notifications-desktop');
 await clickText('Đánh dấu đã đọc');
 await waitFor(`document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('0 chưa đọc')`);
 await clickText('Tải lại');
 await waitFor(`!document.querySelector('[role="status"]')&&document.querySelector('section[aria-label="Danh sách thông báo"]').textContent.includes('0 chưa đọc')`);
 assert.equal(records.filter(record=>record.account==='enterprise'&&record.method==='PATCH'&&record.path==='/accounts/me/notifications/1').length,1);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await screenshot('enterprise-notifications-mobile');
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await cdp.send('Page.navigate',{url:origin+'/enterprise/profile'});
 await waitFor(`document.body.innerText.includes('Mã doanh nghiệp: TECHVIET')`);
 assert.equal(await evaluate(`document.body.innerText.includes('Mã định danh (ID)')||document.body.innerText.includes('#17')`),false);
 await screenshot('enterprise-profile-business-code');
 await clickText('Cập nhật hồ sơ');await waitFor(`!!document.querySelector('form input')`);
 await fill('form input[type="text"]','TechViet cập nhật');await clickText('Lưu thay đổi');
 await waitFor(`!document.querySelector('form')&&document.body.innerText.includes('TechViet cập nhật')`);
 const profileUpdate=records.find(record=>record.method==='PATCH'&&record.path==='/enterprise/profile');
 assert.equal(profileUpdate.body.companyId,17);assert.equal('code' in profileUpdate.body,false);
 assert.ok(await evaluate(`document.body.innerText.includes('Mã doanh nghiệp: TECHVIET')`));
 assert.deepEqual(errors,[]);
 console.log('PASS reports, dates, coordination, bulk acceptance, dashboard intake/refresh, notifications and profile updates.');
 console.log('Screenshots: '+artifacts);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(cdp){try{await cdp.send('Browser.close');}catch{}cdp.socket.close();}if(browser&&!browser.killed)browser.kill();if(vite)await vite.close();});
