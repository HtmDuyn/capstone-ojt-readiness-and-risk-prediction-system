import { useEffect, useState } from 'react';
import { Download, Inbox, Send } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { listOjtResults, exportQhdnReport, exportOjtResults, publishOjtResults } from '@/services/qhdnService';
import { downloadFile } from '@/utils/shared/downloadFile';
import { useQhdnAcademicPeriods } from '@/hooks/qhdn/useQhdnAcademicPeriods';
import { subscribeVisibleRefresh } from '@/utils/shared/visibleRefresh';
import { AcademicPeriodFilter, WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { errorMessage, Field, Notice, Pager, Table, usePaged } from '@/components/qhdn/QhdnUi';
import type { ReportType } from '@/types/qhdn/workflowTypes';

const reports:Record<ReportType,{label:string;description:string}>={
 acceptance:{label:'Tiếp nhận sinh viên',description:'Tổng hợp tình hình tiếp nhận và quyết định của doanh nghiệp trong kỳ OJT.'},
 internships:{label:'Thực tập',description:'Danh sách thực tập và trạng thái phân công của sinh viên trong kỳ OJT.'},
 'enterprise-feedback':{label:'Phản hồi doanh nghiệp',description:'Tổng hợp phản hồi của doanh nghiệp theo kỳ OJT và bộ lọc đã chọn.'},
};
const statusLabels:Record<string,string>={SUBMITTED:'Chờ công bố',PUBLISHED:'Đã công bố'};
const scoreColumns=[
 {key:'completionScore',label:'Kỹ năng chuyên ngành'},
 {key:'skillScore',label:'Kỹ năng mềm'},
 {key:'attitudeScore',label:'Thái độ'},
 {key:'overallScore',label:'Điểm trung bình'},
] as const;

export default function QhdnEnterpriseEvaluations(){
 const [publishTarget,setPublishTarget]=useState<{evaluationIds?:number[];studentName?:string}|null>(null);
 const [tab,setTab]=useState<'results'|'reports'>('results');
 const catalog=useQhdnAcademicPeriods('',false,true);
 const {semesterId}=catalog;
 const [type,setType]=useState<ReportType>('acceptance');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [publishBusy,setPublishBusy]=useState(false);
 const [limit,setLimit]=useState(10);
 const results=usePaged((page,signal)=>listOjtResults({ojtSemesterId:Number(semesterId),page,limit},signal).then(r=>r.data),`${semesterId}:${limit}`,!!semesterId&&tab==='results');
 useEffect(()=>{
  if(tab!=='results'||!semesterId||results.busy||publishBusy)return;
  return subscribeVisibleRefresh(results.reload, { interval: 30_000 });
 },[tab,semesterId,results.busy,results.reload,publishBusy]);
 useEffect(()=>{setMessage('');setError('');},[catalog.periodId,type,tab]);
 const run=async(work:()=>Promise<unknown>,success:string)=>{
  if(busy||publishBusy||!semesterId)return;
  setBusy(true);setMessage('');setError('');
  try{await work();setMessage(success);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 const exportResults=(format:'csv'|'pdf')=>run(()=>downloadFile(()=>exportOjtResults(Number(semesterId),format),`ojt-results-${semesterId}.${format}`),'Đã tải kết quả OJT.');
 const exportReport=()=>run(()=>downloadFile(()=>exportQhdnReport(type,{ojtSemesterId:Number(semesterId)}),`qhdn-${type}-${semesterId}.csv`),'Đã tải báo cáo CSV.');
 const openPublishAll=()=>{setMessage('');setError('');setPublishTarget({});};
 const openPublishOne=(evaluationId:number,studentName:string)=>{setMessage('');setError('');setPublishTarget({evaluationIds:[evaluationId],studentName});};
 const confirmPublish=async()=>{
  if(!publishTarget||!semesterId||publishBusy)return;
  setPublishBusy(true);setMessage('');setError('');
  try{
   const response=await publishOjtResults({ojtSemesterId:Number(semesterId),reason:'QHDN công bố kết quả đánh giá OJT.',...(publishTarget.evaluationIds?{evaluationIds:publishTarget.evaluationIds}:{})});
   const result=response.data;
   setMessage(result.published
    ?`Đã công bố ${result.published} kết quả, tạo thông báo hệ thống và xếp ${result.queuedEmails} email vào hàng đợi.${result.alreadyPublished?` ${result.alreadyPublished} kết quả đã được công bố trước đó.`:''}${result.skipped?` ${result.skipped} hồ sơ có tài khoản hoặc trạng thái sinh viên không hoạt động nên chưa được gửi.`:''}`
    :`Không có kết quả mới được công bố.${result.alreadyPublished?` ${result.alreadyPublished} kết quả đã được công bố trước đó.`:''}${result.skipped?` ${result.skipped} hồ sơ có tài khoản hoặc trạng thái sinh viên không hoạt động.`:''}`);
   setPublishTarget(null);
   results.reload();
  }catch(e){setError(errorMessage(e));setPublishTarget(null);}finally{setPublishBusy(false);}
 };
 return <div className="space-y-5 pb-10">
  <PageBanner variant="qhdn" title="Báo cáo OJT" description="Theo dõi điểm đánh giá doanh nghiệp, công bố trực tiếp cho sinh viên và xuất báo cáo theo học kỳ." badge="Phòng QHDN"/>
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <div role="tablist" aria-label="Nội dung báo cáo" className="flex gap-6 border-b border-slate-200 px-5">
    {([['results','Kết quả đánh giá'],['reports','Xuất báo cáo']] as const).map(([id,label])=><button key={id} id={`report-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`report-panel-${id}`} type="button" disabled={busy||publishBusy} onClick={()=>setTab(id)} className={'border-b-2 px-0.5 py-4 text-sm font-semibold transition focus-visible:outline-orange-500 '+(tab===id?'border-orange-600 text-orange-700':'border-transparent text-slate-500 hover:text-slate-800')}>{label}</button>)}
   </div>
   <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
    <AcademicPeriodFilter selection={catalog} disabled={busy||publishBusy}/>
   </div>
   <div className="space-y-3 px-5 empty:hidden">{(catalog.error||error)&&<div className="pt-4"><Notice>{catalog.error||error}</Notice></div>}{message&&<p role="status" className="pt-4 text-sm font-medium text-emerald-700">{message}</p>}</div>
   <div id={`report-panel-${tab}`} role="tabpanel" aria-labelledby={`report-tab-${tab}`}>
    {tab==='results'?<>
     <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Kết quả OJT</h2><p className="mt-1 text-xs text-slate-500">{results.busy?'Đang tải dữ liệu…':`${results.data.total} kết quả trong học kỳ đã chọn`}</p></div><div className="flex flex-wrap gap-2"><button type="button" className={workflowPrimary+' !py-2'} disabled={busy||publishBusy||results.busy||!semesterId||!results.data.total} onClick={openPublishAll}><Send size={14}/>{publishBusy?'Đang công bố…':'Công bố hàng loạt'}</button>{(['csv','pdf'] as const).map(format=><button key={format} type="button" className={workflowSecondary+' !py-2'} disabled={busy||publishBusy||results.busy||!semesterId} onClick={()=>exportResults(format)}><Download size={14}/>{format.toUpperCase()}</button>)}</div></div>
     {results.error?<div className="px-5 pb-5"><Notice>{results.error}</Notice></div>:<Table headers={['STT','Sinh viên','Doanh nghiệp',...scoreColumns.map(column=>column.label),'Trạng thái','Thao tác']}>
      {results.busy?<tr><td colSpan={9} className="h-40 text-center text-slate-500" role="status">Đang tải kết quả…</td></tr>:!results.data.items.length?<tr><td colSpan={9}><div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-400"><Inbox size={30} strokeWidth={1.5}/><p className="text-sm text-slate-500">{!semesterId?'Chọn học kỳ có kỳ OJT để xem kết quả.':'Chưa có điểm đánh giá doanh nghiệp trong học kỳ này.'}</p></div></td></tr>:results.data.items.map((result,index)=><tr key={result.evaluationId??result.id} className="hover:bg-slate-50/70"><td className="text-center tabular-nums text-slate-400">{(results.page-1)*results.data.limit+index+1}</td><td><p className="font-medium text-slate-800">{result.fullName||'—'}</p><p className="mt-0.5 text-xs text-slate-500">{result.studentCode}</p></td><td className="text-slate-600">{result.enterpriseName||result.company?.name||'—'}</td>{scoreColumns.map(column=><td key={column.key} className={'tabular-nums '+(column.key==='overallScore'?'font-bold text-orange-600':'font-semibold')}>{result[column.key]==null?'—':Number(result[column.key])}</td>)}<td><span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{statusLabels[result.status]||result.status}</span></td><td>{result.publishedToStudent?<span className="whitespace-nowrap rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Đã công bố</span>:result.evaluationId?<button type="button" className="whitespace-nowrap rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50" disabled={busy||publishBusy||results.busy} onClick={()=>{const evaluationId=result.evaluationId;if(evaluationId)openPublishOne(evaluationId,result.fullName);}}>Công bố</button>:<span className="text-xs text-slate-400">—</span>}</td></tr>)}
     </Table>}
     <div className="border-t border-slate-100 px-5 py-4"><Pager page={results.page} total={results.data.total} limit={limit} busy={busy||results.busy} onChange={results.setPage} onLimitChange={size=>{results.setPage(1);setLimit(size);}}/></div>
    </>:<div className="space-y-5 p-5 sm:p-6">
     <div><h2 className="font-semibold text-slate-900">Xuất báo cáo theo kỳ</h2><p className="mt-1 text-sm text-slate-500">Dùng bộ lọc phía trên để chọn phạm vi dữ liệu cần tải.</p></div>
     <div className="flex flex-wrap items-end gap-3"><div className="w-full sm:max-w-sm"><Field label="Loại báo cáo"><select className={workflowInput} value={type} disabled={busy} onChange={event=>setType(event.target.value as ReportType)}>{Object.entries(reports).map(([key,report])=><option key={key} value={key}>{report.label}</option>)}</select></Field></div><button type="button" className={workflowPrimary} disabled={busy||!semesterId} onClick={exportReport}><Download size={16}/>{busy?'Đang xuất…':'Tải báo cáo CSV'}</button></div>
     <p className="text-sm leading-relaxed text-slate-500">{reports[type].description}</p>
     {!catalog.loading&&!semesterId&&<p className="border-t border-slate-100 pt-4 text-sm text-amber-700">Học kỳ này chưa liên kết kỳ OJT. Hãy chọn học kỳ khác để xuất báo cáo.</p>}
    </div>}
   </div>
  </section>
  {publishTarget&&<WorkflowModal title="Xác nhận công bố điểm OJT" subtitle={publishTarget.evaluationIds?`Sinh viên: ${publishTarget.studentName||'đã chọn'}`:'Toàn bộ kết quả đủ điều kiện trong kỳ OJT đang chọn'} busy={publishBusy} onClose={()=>setPublishTarget(null)}>
   <div className="space-y-5 p-5 sm:p-6">
    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-orange-900">
     {publishTarget.evaluationIds?'Thông báo gồm điểm của sinh viên này.':'Hệ thống sẽ rà soát toàn bộ kết quả đủ điều kiện trong kỳ; chỉ gửi mới những kết quả chưa công bố.'}
     {' '}Điểm và nhận xét sẽ hiển thị ngay tại mục Kết quả đánh giá OJT của sinh viên. Hệ thống tạo thông báo và xếp email vào hàng đợi gửi cho sinh viên có email.
    </div>
    <div className="flex justify-end gap-2">
     <button type="button" className={workflowSecondary} disabled={publishBusy} onClick={()=>setPublishTarget(null)}>Hủy</button>
     <button type="button" className={workflowPrimary} disabled={publishBusy||!semesterId} onClick={confirmPublish}><Send size={15}/>{publishBusy?'Đang công bố…':'Xác nhận công bố'}</button>
    </div>
   </div>
  </WorkflowModal>}
 </div>;
}
