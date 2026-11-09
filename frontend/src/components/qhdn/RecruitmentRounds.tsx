import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Plus, CheckCheck, Minus } from 'lucide-react';
import API from '@/services/api';
import type { useQhdnAcademicPeriods } from '@/hooks/useQhdnAcademicPeriods';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from './StudentWorkflowUi';
import { Field, Notice, errorMessage } from './QhdnUi';

type Round={id:number;name:string;campaignId?:number;campaignName?:string;roundNumber?:number;status:string;currentPhase:string;startsAt:string;endsAt:string;resultsFinalizedAt?:string;pendingCount:number;resultsSummary?:{total:number;accepted:number;rejected:number;withdrawn:number}};
type Campaign={id:number;name:string;startsAt?:string;endsAt?:string};
const labels:Record<string,string>={DRAFT:'Chưa mở',SCHEDULED:'Chờ bắt đầu',OPEN:'Đang tuyển dụng',ENDED:'Kết thúc · Chờ tổng hợp',FINALIZED:'Đã chốt tổng hợp',LEGACY:'Đợt cũ'};
const formatDateTime=(date:Date)=>{
 const pad=(n:number)=>String(n).padStart(2,'0');
 return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const parseDateTime=(value:string)=>{
 const parts=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
 if(!parts)return null;
 const [,d,m,y,h,min]=parts.map(Number);
 const date=new Date(y,m-1,d,h,min);
 return formatDateTime(date)===value?date:null;
};
const fmt=(v?:string)=>v?formatDateTime(new Date(v)):'—';
function RecruitmentDateInput({name,label,error}:{name:string;label:string;error?:string}){
 const text=useRef<HTMLInputElement>(null),picker=useRef<HTMLInputElement>(null);
 return <Field label={label}><div className="relative"><input ref={text} name={name} type="text" placeholder="dd/mm/yyyy HH:mm" maxLength={16} required
  aria-label={label} aria-invalid={!!error} aria-describedby={error?`${name}-date-error`:`${name}-date-format`}
  className={workflowInput+' pr-12'+(error?' border-red-400 focus:border-red-500':'')}
  onChange={event=>{if(picker.current){const date=parseDateTime(event.target.value);picker.current.value=date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`:'';}}}/>
  <div className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 focus-within:ring-2 focus-within:ring-orange-400"><CalendarDays size={18}/><input ref={picker} type="datetime-local" aria-label={`Chọn ${label.toLowerCase()} trên lịch`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={event=>{if(text.current&&event.target.value)text.current.value=formatDateTime(new Date(event.target.value));}}/></div>
 </div><p id={`${name}-date-format`} className="mt-1 text-xs text-slate-500">Ngày/tháng/năm · Giờ:phút (24 giờ)</p>{error&&<p id={`${name}-date-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}</Field>;
}
export function RecruitmentRounds({selection:catalog,createRequest=0,onChanged}:{selection:ReturnType<typeof useQhdnAcademicPeriods>;createRequest?:number;onChanged?:()=>void}){
 const [items,setItems]=useState<Round[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [creating,setCreating]=useState(false),[roundCount,setRoundCount]=useState(1),[revision,setRevision]=useState(0),[migrationRequired,setMigrationRequired]=useState(false);
 const [action,setAction]=useState<{round:Round;type:'open'|'finalize'}|null>(null);
 const [dateErrors,setDateErrors]=useState<Record<string,string>>({});
 useEffect(()=>{if(creating)setDateErrors({});},[creating]);
 const validateDates=(form:HTMLFormElement)=>{
  const errors:Record<string,string>={};
  const pairs=[['startsAt','endsAt'],...Array.from({length:roundCount},(_,i)=>[`start${i}`,`end${i}`])];
  for(const [startName,endName] of pairs){
   const start=form.elements.namedItem(startName) as HTMLInputElement|null;
   const end=form.elements.namedItem(endName) as HTMLInputElement|null;
   if(!end)continue;
   for(const input of [start,end]){
    if(!input)continue;
    if(input.value&&!parseDateTime(input.value))errors[input.name]='Vui lòng nhập thời gian hợp lệ theo dạng ngày/tháng/năm giờ:phút, ví dụ 12/12/2026 08:30.';
    input.setCustomValidity(errors[input.name]||'');
   }
   const startDate=parseDateTime(start?.value||''),endDate=parseDateTime(end.value);
   if(startDate&&endDate&&endDate<=startDate)
    errors[endName]='Thời gian kết thúc phải sau thời gian bắt đầu. Vui lòng chọn lại.';
   end.setCustomValidity(errors[endName]||'');
  }
  setDateErrors(errors);
  return Object.keys(errors).length===0;
 };
 const dateField=(name:string,label:string)=><RecruitmentDateInput name={name} label={label} error={dateErrors[name]}/>;
 useEffect(()=>{if(createRequest){setCreating(true);setError('');}},[createRequest]);
 useEffect(()=>{if(migrationRequired)return;const timer=window.setInterval(()=>setRevision(v=>v+1),60000);return()=>window.clearInterval(timer);},[migrationRequired]);
 useEffect(()=>{
  
  if(!catalog.selectedPeriod)return;
  let active=true;setLoading(true);setError('');
  API.get('/recruitment/windows',{params:{academicPeriodId:catalog.selectedPeriod.id}})
   .then(r=>{if(active){setItems(r.data.data.items);setCampaigns(r.data.data.campaigns??[]);setMigrationRequired(false);}})
   .catch(e=>{if(active){setError(errorMessage(e));setMigrationRequired(e?.response?.status===503);}}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[catalog.selectedPeriod?.id,revision]);
 const create=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!validateDates(e.currentTarget)){e.currentTarget.reportValidity();return;}
  const f=new FormData(e.currentTarget);setBusy(true);setError('');
  try{
   const time=(key:string)=>parseDateTime(String(f.get(key)))!.toISOString();
   const rounds=Array.from({length:roundCount},(_,i)=>({name:String(f.get(`name${i}`)),startsAt:time(`start${i}`),endsAt:time(`end${i}`)}));
   const startsAt=time('startsAt'),endsAt=time('endsAt');
   if(endsAt<=startsAt||rounds.some((r,i)=>r.endsAt<=r.startsAt||r.startsAt<startsAt||r.endsAt>endsAt||(i>0&&r.startsAt<rounds[i-1].endsAt)))
    throw new Error('Các đợt con phải nằm trong đợt tổng, theo thứ tự và không trùng thời gian.');
   await API.post('/recruitment/windows',{academicPeriodId:catalog.selectedPeriod?.id,name:f.get('name'),startsAt,endsAt,rounds,reason:f.get('reason')});
   setCreating(false);setRevision(v=>v+1);onChanged?.();setMessage('Đã tạo đợt OJT tổng cùng toàn bộ các đợt con. Bạn có thể mở đợt con đầu tiên.');
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 const confirm=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!action)return;setBusy(true);setError('');
  try{
   const reason=String(new FormData(e.currentTarget).get('reason'));
   if(action.type==='open')await API.patch(`/recruitment/windows/${action.round.id}`,{status:'OPEN',reason});
   else await API.post(`/recruitment/windows/${action.round.id}/finalize`,{reason});
   setAction(null);setRevision(v=>v+1);onChanged?.();setMessage('Đã cập nhật đợt tuyển dụng.');
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><CalendarDays size={22} className="text-orange-500"/>Đợt OJT và các đợt tuyển dụng con</h2><p className="mt-1 text-sm text-slate-500">Tạo đợt tổng cho kỳ OJT và khai báo các đợt tuyển dụng nhỏ ngay trong cùng một lần.</p></div><button className={workflowPrimary} disabled={busy||loading||migrationRequired||!catalog.selectedPeriod||campaigns.length>0} onClick={()=>{setRoundCount(1);setError('');setCreating(true);}}><Plus size={16}/>Tạo đợt OJT</button></div>
  <p className="text-sm font-medium text-slate-700">{catalog.selectedPeriod?.name||'Chọn học kỳ chính ở bộ lọc phía trên.'}</p>
  {(error||catalog.error)&&<Notice>{error||catalog.error}</Notice>}{message&&<Notice>{message}</Notice>}
  {campaigns.map(c=><div key={c.id} className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Đợt OJT tổng</p><h3 className="mt-1 font-bold text-slate-800">{c.name}</h3><p className="mt-1 text-sm text-slate-600">{c.startsAt?`${fmt(c.startsAt)} – ${fmt(c.endsAt)}`:'Đợt tổng đã được tạo trước khi cập nhật giao diện.'} · {items.filter(r=>r.campaignId===c.id).length} đợt con</p></div>)}
  <p className="text-xs text-slate-500">Mỗi đợt con có một khoảng thời gian tuyển dụng chung. Không chia vòng đăng tin, ứng tuyển hay trả kết quả. Lịch được giữ cố định sau khi tạo.</p>
  {migrationRequired?<button className={workflowSecondary} onClick={()=>setRevision(v=>v+1)}>Kiểm tra lại sau khi cập nhật database</button>:loading?<p className="text-sm text-slate-500">Đang tải…</p>:!items.length?<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Chưa có đợt tuyển dụng. Chọn “Tạo đợt OJT” để thiết lập đợt tổng và các đợt con.</p>:<div className="space-y-3">{items.map((r,i)=>{
   const canOpen=r.status==='DRAFT'&&items.slice(0,i).every(p=>!!p.resultsFinalizedAt);
   return <article key={r.id} className="space-y-3 rounded-xl border border-slate-200 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-slate-800">{r.roundNumber?`Đợt ${r.roundNumber} · `:''}{r.name}</h3><p className="mt-2 text-sm text-slate-500">{fmt(r.startsAt)} → {fmt(r.endsAt)}</p></div><span className="self-start rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{labels[r.currentPhase]||r.currentPhase}</span></div>
    {r.resultsSummary&&<p className="text-sm text-slate-600">Tổng {r.resultsSummary.total} hồ sơ · Nhận {r.resultsSummary.accepted} · Từ chối {r.resultsSummary.rejected} · Đã rút {r.resultsSummary.withdrawn}</p>}
    {!r.resultsFinalizedAt&&<div className="flex flex-wrap items-center gap-3">{r.status==='DRAFT'&&r.campaignId&&<button className={workflowPrimary} disabled={!canOpen||busy} onClick={()=>setAction({round:r,type:'open'})}>Mở đợt con</button>}{['ENDED','LEGACY'].includes(r.currentPhase)&&<button className={workflowSecondary} disabled={busy||r.pendingCount>0||new Date(r.endsAt)>new Date()} onClick={()=>setAction({round:r,type:'finalize'})}><CheckCheck size={16}/>Chốt tổng hợp</button>}<span className="text-xs text-slate-500">{r.pendingCount?`${r.pendingCount} hồ sơ chờ phản hồi`:!canOpen&&r.status==='DRAFT'?'Đợi đợt trước kết thúc và được chốt tổng hợp.':'Doanh nghiệp phản hồi hồ sơ trước khi QHDN chốt tổng hợp.'}</span></div>}
   </article>;
  })}</div>}
  {creating&&<WorkflowModal wide title="Tạo đợt OJT và các đợt con" busy={busy} onClose={()=>setCreating(false)}><form className="space-y-5" onSubmit={create} onChange={event=>validateDates(event.currentTarget)}>{error&&<Notice>{error}</Notice>}{campaigns.length>0?<Notice>Kỳ OJT đã có đợt tổng. Các đợt hiện có được giữ nguyên.</Notice>:<>
   <Field label="Tên đợt OJT tổng"><input name="name" className={workflowInput} required maxLength={150} placeholder="Ví dụ: Tuyển dụng OJT tháng 12"/></Field>
   <div className="grid gap-4 sm:grid-cols-2">{dateField('startsAt','Bắt đầu đợt tổng')}{dateField('endsAt','Kết thúc đợt tổng')}</div>
   <div className="space-y-3"><h3 className="font-semibold text-slate-800">Lịch tuyển dụng từng đợt</h3>{Array.from({length:roundCount},(_,i)=><fieldset key={i} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-bold text-orange-700">Đợt {i+1}</legend><div className="space-y-3"><Field label="Tên đợt con"><input name={`name${i}`} className={workflowInput} defaultValue={`Tuyển dụng đợt ${i+1}`} required maxLength={150}/></Field><div className="grid gap-3 sm:grid-cols-2">{dateField(`start${i}`,'Bắt đầu')}{dateField(`end${i}`,'Kết thúc')}</div></div></fieldset>)}<div className="flex flex-wrap gap-2"><button type="button" className={workflowSecondary} disabled={roundCount>=30||busy} onClick={()=>setRoundCount(v=>v+1)}><Plus size={16}/>Thêm đợt con</button><button type="button" className={workflowSecondary} disabled={roundCount<=1||busy} onClick={()=>setRoundCount(v=>v-1)}><Minus size={16}/>Bỏ đợt cuối</button></div></div>
   <Notice>Bạn có thể chia kỳ tuyển dụng thành nhiều đợt với thời hạn riêng. Hãy sắp xếp các đợt nối tiếp nhau trong thời gian đợt OJT tổng. Khi xác nhận, hệ thống sẽ lưu toàn bộ lịch tuyển dụng.</Notice><Field label="Ghi chú thiết lập"><textarea name="reason" className={workflowInput} required maxLength={2000} rows={2}/></Field></>}
   <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={()=>setCreating(false)}>Đóng</button>{!campaigns.length&&<button className={workflowPrimary} disabled={busy||migrationRequired}>{busy?'Đang tạo…':'Tạo đợt OJT và các đợt con'}</button>}</div>
  </form></WorkflowModal>}
  {action&&<WorkflowModal title={action.type==='open'?'Mở đợt tuyển dụng con':'Chốt tổng hợp kết quả'} busy={busy} onClose={()=>setAction(null)}><form onSubmit={confirm} className="space-y-4">{error&&<Notice>{error}</Notice>}<p className="text-sm text-slate-600">{action.round.name} · {fmt(action.round.startsAt)} – {fmt(action.round.endsAt)}</p><Field label="Lý do xác nhận"><textarea name="reason" className={workflowInput} required maxLength={2000}/></Field><button className={workflowPrimary} disabled={busy}>{busy?'Đang xử lý…':'Xác nhận'}</button></form></WorkflowModal>}
 </section>;
}
