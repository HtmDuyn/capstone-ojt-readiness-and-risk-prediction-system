import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Plus, CheckCheck } from 'lucide-react';
import API from '@/services/api';
import { recruitmentPhases, validateRecruitmentPhases, type PhaseSchedule } from '@/utils/recruitmentSchedule';
import type { useQhdnAcademicPeriods } from '@/hooks/useQhdnAcademicPeriods';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from './StudentWorkflowUi';
import { Field, Notice, errorMessage } from './QhdnUi';
import { emptySchedule,formatScheduleDate as formatDateTime,parseScheduleDate as parseDateTime,updateScheduleDraft,type ScheduleDraft,type ScheduleField } from '@/utils/qhdnRecruitmentSchedule';

type Round=Partial<PhaseSchedule>&{canEditSchedule?:boolean;canDelete?:boolean;editableScheduleFields?:string[];canPost?:boolean;canApply?:boolean;canRespond?:boolean;id:number;name:string;campaignId?:number;campaignName?:string;roundNumber?:number;status:string;currentPhase:string;startsAt:string;endsAt:string;resultsFinalizedAt?:string;pendingCount:number;canOpen:boolean;openBlockedReason?:string;canFinalize:boolean;resultsSummary?:{total:number;accepted:number;rejected:number;withdrawn:number;pending?:number}};
type Campaign={id:number;name:string;startsAt?:string;endsAt?:string};
const labels:Record<string,string>={DRAFT:'Chưa mở',SCHEDULED:'Chờ bắt đầu',OPEN:'Đang tuyển dụng',ENDED:'Kết thúc · Chờ tổng hợp',FINALIZED:'Đã chốt tổng hợp',LEGACY:'Đợt cũ',CLOSED:'Đã đóng',POSTING:'Đang mở đăng tin',APPLICATION:'Đang nhận hồ sơ',APPLICATION_AND_RESULTS:'Ứng tuyển và xét tuyển',RESULTS:'Đang xét tuyển, phản hồi',BETWEEN_PHASES:'Chờ hạn tiếp theo'};
const fmt=(v?:string)=>v?formatDateTime(new Date(v)):'—';
function RecruitmentDateInput({name,label,error,defaultValue,value,onValueChange,disabled=false}:{name:string;label:string;error?:string;defaultValue?:string;value?:string;onValueChange?:(value:string)=>void;disabled?:boolean}){
 const text=useRef<HTMLInputElement>(null),picker=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  const date=parseDateTime(value??defaultValue??'');
  if(picker.current)picker.current.value=date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`:'';
 },[value,defaultValue]);
 return <Field label={label}><div className="relative"><input ref={text} name={name} defaultValue={defaultValue} value={value} disabled={disabled} type="text" placeholder="dd/mm/yyyy HH:mm" maxLength={16} required
  aria-label={label} aria-invalid={!!error} aria-describedby={error?`${name}-date-error`:`${name}-date-format`}
  className={workflowInput+' pr-12'+(error?' border-red-400 focus:border-red-500':'')}
  onChange={event=>{onValueChange?.(event.target.value);if(picker.current){const date=parseDateTime(event.target.value);picker.current.value=date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`:'';}}}/>
  <div className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 focus-within:ring-2 focus-within:ring-orange-400"><CalendarDays size={18}/><input ref={picker} type="datetime-local" disabled={disabled} aria-label={`Chọn ${label.toLowerCase()} trên lịch`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={event=>{if(event.target.value){const formatted=formatDateTime(new Date(event.target.value));if(onValueChange)onValueChange(formatted);else if(text.current)text.current.value=formatted;}}}/></div>
 </div><p id={`${name}-date-format`} className="mt-1 text-xs text-slate-500">Ngày/tháng/năm · Giờ:phút (24 giờ)</p>{error&&<p id={`${name}-date-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}</Field>;
}
export function RecruitmentRounds({selection:catalog,createRequest=0,refreshKey=0,onChanged}:{selection:ReturnType<typeof useQhdnAcademicPeriods>;createRequest?:number;refreshKey?:number;onChanged?:()=>void}){
 const [items,setItems]=useState<Round[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [creating,setCreating]=useState(false),[revision,setRevision]=useState(0),[migrationRequired,setMigrationRequired]=useState(false);
 const [extending,setExtending]=useState<Round|null>(null);
 const [editing,setEditing]=useState<Round|null>(null);
 const [draft,setDraft]=useState<ScheduleDraft>({...emptySchedule});
 const manuallyEdited=useRef(new Set<ScheduleField>());
 const startCreate=()=>{setEditing(null);setDraft({...emptySchedule});manuallyEdited.current.clear();setDateErrors({});setError('');setCreating(true);};
 const startEdit=(round:Round)=>{setDraft(Object.fromEntries(Object.keys(emptySchedule).map(key=>[key,fmt(round[key as ScheduleField])])) as ScheduleDraft);manuallyEdited.current=new Set(Object.keys(emptySchedule) as ScheduleField[]);setEditing(round);setDateErrors({});setError('');setCreating(true);};
 const canSupplement=items.length>0&&items.every(item=>!!item.resultsFinalizedAt);
 const isSupplemental=campaigns.length>0;
 const [action,setAction]=useState<{round:Round;type:'finalize'|'delete'}|null>(null);
 const [dateErrors,setDateErrors]=useState<Record<string,string>>({});
 useEffect(()=>{if(creating)setDateErrors({});},[creating]);
 const validateDates=()=>{
  const errors:Record<string,string>={};
  for(const [key,value] of Object.entries(draft))if(!parseDateTime(value))errors[key]='Nhập ngày giờ hợp lệ theo dạng dd/mm/yyyy HH:mm.';
  setDateErrors(errors);return Object.keys(errors).length===0;
 };
 const changeDate=(key:ScheduleField,value:string)=>{
  manuallyEdited.current.add(key);
  setDraft(previous=>updateScheduleDraft(previous,key,value,manuallyEdited.current));
  setDateErrors({});
 };
 const dateField=(key:ScheduleField,label:string)=><RecruitmentDateInput name={key} label={label} value={draft[key]} onValueChange={value=>changeDate(key,value)} disabled={busy||!!editing&&!editing.editableScheduleFields?.includes(key)} error={dateErrors[key]}/>;
 useEffect(()=>{if(createRequest)startCreate();},[createRequest]);
 useEffect(()=>{if(migrationRequired)return;const timer=window.setInterval(()=>setRevision(v=>v+1),60000);return()=>window.clearInterval(timer);},[migrationRequired]);
 useEffect(()=>{
  
  if(!catalog.selectedPeriod)return;
  let active=true;setLoading(true);setError('');
  API.get('/recruitment/windows',{params:{academicPeriodId:catalog.selectedPeriod.id}})
   .then(r=>{if(active){setItems(r.data.data.items);setCampaigns(r.data.data.campaigns??[]);setMigrationRequired(false);}})
   .catch(e=>{if(active){setError(errorMessage(e));setMigrationRequired(e?.response?.status===503);}}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[catalog.selectedPeriod?.id,revision,refreshKey]);
 const create=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!validateDates())return;
  const f=new FormData(e.currentTarget);setBusy(true);setError('');
  try{
   const schedule=Object.fromEntries(Object.entries(draft).map(([key,value])=>[key,editing&&value===fmt(editing[key as ScheduleField])?editing[key as ScheduleField]:parseDateTime(value)!.toISOString()])) as PhaseSchedule;
   validateRecruitmentPhases(schedule);
   const name=String(f.get('name'));
   if(editing)await API.patch(`/recruitment/windows/${editing.id}/schedule`,{name,...schedule,reason:String(f.get('reason'))});
   else await API.post('/recruitment/windows',{academicPeriodId:catalog.selectedPeriod?.id,name,
    startsAt:schedule.postingStartsAt,endsAt:schedule.resultsEndsAt,rounds:[{name,...schedule}],supplemental:isSupplemental});
   setCreating(false);setRevision(v=>v+1);onChanged?.();setMessage(editing?'Đã cập nhật lịch đợt tuyển dụng.':'Đã tạo đợt tuyển dụng với ba hạn. Bạn có thể mở đợt theo lịch đã thiết lập.');setEditing(null);
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 const extend=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!extending)return;setBusy(true);setError('');
  try{
   const values=new FormData(e.currentTarget);const patch:Record<string,string>={};
   for(const phase of recruitmentPhases){
    const raw=values.get(phase.key);if(raw===null)continue;
    const date=parseDateTime(String(raw));if(!date)throw new Error('Vui lòng nhập thời điểm kết thúc hợp lệ.');
    const key=(phase.key+'EndsAt') as keyof PhaseSchedule;
    if(+date!==+new Date(extending[key]!))patch[key]=date.toISOString();
   }
   if(!Object.keys(patch).length)throw new Error('Chọn thời hạn mới dài hơn hiện tại.');
   await API.patch('/recruitment/windows/'+extending.id,patch);
   setExtending(null);setRevision(v=>v+1);onChanged?.();setMessage('Đã gia hạn và gửi thông báo đến sinh viên, doanh nghiệp và QHDN.');
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 const openRound=async(round:Round)=>{
  if(busy||!round.canOpen)return;
  setBusy(true);setError('');setMessage('');
  try{
   await API.patch(`/recruitment/windows/${round.id}`,{status:'OPEN',reason:'QHDN mở đợt tuyển dụng theo lịch đã thiết lập.'});
   setRevision(v=>v+1);onChanged?.();setMessage('Đã mở đợt tuyển dụng.');
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 const confirm=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!action)return;setBusy(true);setError('');
  try{
   const reason=String(new FormData(e.currentTarget).get('reason'));
   if(action.type==='delete')await API.delete(`/recruitment/windows/${action.round.id}`,{data:{reason}});
   else await API.post(`/recruitment/windows/${action.round.id}/finalize`,{reason});
   setAction(null);setRevision(v=>v+1);onChanged?.();setMessage('Đã cập nhật đợt tuyển dụng.');
  }catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 };
 return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><CalendarDays size={22} className="text-orange-500"/>Đợt tuyển dụng OJT</h2><p className="mt-1 text-sm text-slate-500">Thiết lập một đợt tuyển dụng với ba hạn: đăng tin, ứng tuyển và xét tuyển, phản hồi.</p></div><button className={workflowPrimary} disabled={busy||loading||migrationRequired||!catalog.selectedPeriod||(isSupplemental&&!canSupplement)} onClick={startCreate}><Plus size={16}/>{isSupplemental?'Tạo đợt bổ sung':'Tạo đợt tuyển dụng'}</button></div>
  {isSupplemental&&!canSupplement&&<p className="text-xs text-slate-500">Hoàn tất và chốt tổng hợp đợt hiện tại để tạo đợt bổ sung với ba hạn mới.</p>}
  <p className="text-sm font-medium text-slate-700">{catalog.selectedPeriod?.name||'Chọn học kỳ chính ở bộ lọc phía trên.'}</p>
  {(error||catalog.error)&&<Notice>{error||catalog.error}</Notice>}{message&&<Notice>{message}</Notice>}
  <p className="text-xs text-slate-500">Giờ bắt đầu xét tuyển được gợi ý theo giờ bắt đầu ứng tuyển và có thể chỉnh tay; hạn phản hồi kết thúc bằng hoặc sau hạn ứng tuyển. Đợt chưa mở được sửa lịch và xóa; đợt đã mở không được xóa. Khi đang mở, chỉ sửa các mốc còn thời gian, không mở lại hạn đã hết.</p>
  {migrationRequired?<button className={workflowSecondary} onClick={()=>setRevision(v=>v+1)}>Kiểm tra lại sau khi cập nhật database</button>:loading?<p className="text-sm text-slate-500">Đang tải…</p>:!items.length?<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Chưa có đợt tuyển dụng. Chọn “Tạo đợt tuyển dụng” để thiết lập ba hạn tuyển dụng.</p>:<div className="space-y-3">{items.map((r,i)=>{
   const canOpen=r.canOpen;
   return <article key={r.id} className="space-y-3 rounded-xl border border-slate-200 p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-500">STT {i+1}</span><span>{r.roundNumber?`Đợt ${r.roundNumber} · `:''}{r.name}</span></h3><p className="mt-2 text-sm text-slate-500">{fmt(r.startsAt)} → {fmt(r.endsAt)}</p></div><span className="self-start rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{labels[r.currentPhase]||r.currentPhase}</span></div>
    {r.postingStartsAt&&<div className="grid gap-3 md:grid-cols-3">{recruitmentPhases.map(phase=>{const active=phase.key==='posting'?r.canPost:phase.key==='application'?r.canApply:r.canRespond;return <div key={phase.key} className={'rounded-lg border p-3 '+(active?'border-emerald-200 bg-emerald-50':'border-slate-100 bg-slate-50')}><p className="text-sm font-semibold text-slate-700">{phase.label}</p><p className="mt-1 text-xs text-slate-500">{fmt(r[(phase.key+'StartsAt') as keyof PhaseSchedule])} → {fmt(r[(phase.key+'EndsAt') as keyof PhaseSchedule])}</p>{active&&<p className="mt-2 text-xs font-semibold text-emerald-700">Đang mở</p>}</div>;})}</div>}
    {r.resultsSummary&&<p className="text-sm text-slate-600">Tổng {r.resultsSummary.total} hồ sơ · Nhận {r.resultsSummary.accepted} · Từ chối {r.resultsSummary.rejected} · Đã rút {r.resultsSummary.withdrawn} · Chưa có phản hồi {r.resultsSummary.pending??0}</p>}
    {!r.resultsFinalizedAt&&<div className="flex flex-wrap items-center gap-3">{r.status==='DRAFT'&&r.campaignId&&<button className={workflowPrimary} disabled={!canOpen||busy||loading} title={r.openBlockedReason||undefined} onClick={()=>openRound(r)}>Mở đợt</button>}{r.status==='OPEN'&&(r.canPost||r.canApply||r.canRespond)&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>{setExtending(r);setError('');}}>Gia hạn</button>}{r.canEditSchedule&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>startEdit(r)}>Sửa lịch</button>}{r.canDelete&&<button className={workflowSecondary+' text-red-600'} disabled={busy||loading} onClick={()=>{setError('');setAction({round:r,type:'delete'});}}>Xóa đợt</button>}{r.canFinalize&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>setAction({round:r,type:'finalize'})}><CheckCheck size={16}/>Chốt tổng hợp</button>}<span className="text-xs text-slate-500">{r.pendingCount?`${r.pendingCount} hồ sơ chờ phản hồi`:!canOpen&&r.status==='DRAFT'?r.openBlockedReason:'Hết hạn phản hồi, hồ sơ chưa có kết quả được chuyển thành Doanh nghiệp từ chối để QHDN theo dõi điều phối đợt sau.'}</span></div>}
   </article>;
  })}</div>}
  {creating&&<WorkflowModal wide title={editing?'Sửa lịch đợt tuyển dụng':isSupplemental?'Tạo đợt bổ sung':'Tạo đợt tuyển dụng'} busy={busy} onClose={()=>setCreating(false)}><form className="space-y-5" onSubmit={create}>{error&&<Notice>{error}</Notice>}{!editing&&isSupplemental&&!canSupplement?<Notice>Hoàn tất và chốt đợt trước trước khi tạo đợt bổ sung.</Notice>:<>
   <Field label="Tên đợt tuyển dụng"><input name="name" defaultValue={editing?.name} className={workflowInput} required maxLength={150} placeholder="Ví dụ: Tuyển dụng OJT tháng 12"/></Field>
   <div className="space-y-4">{recruitmentPhases.map(phase=><div key={phase.key} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><h3 className="font-semibold text-slate-800">{phase.label}</h3><p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">{phase.description}</p><div className="grid gap-3 sm:grid-cols-2">{dateField((phase.key+'StartsAt') as ScheduleField,'Bắt đầu '+phase.label.toLowerCase())}{dateField((phase.key+'EndsAt') as ScheduleField,'Kết thúc '+phase.label.toLowerCase())}</div></div>)}</div>
   <Notice>Hạn 2 mặc định bắt đầu khi hạn 1 kết thúc và kéo dài 7 ngày. Hạn 3 được gợi ý bắt đầu cùng hạn 2 và kết thúc bằng hạn 2. Bạn có thể chỉnh tay cả giờ bắt đầu và kết thúc; các mốc đã chỉnh tay sẽ không bị gợi ý ghi đè. Mốc bắt đầu đã diễn ra và các hạn đã hết sẽ được khóa khi sửa lịch.</Notice></>}
   {editing&&<Field label="Lý do sửa lịch"><textarea name="reason" className={workflowInput} required maxLength={2000}/></Field>}
   <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={()=>setCreating(false)}>Đóng</button>{(!!editing||!isSupplemental||canSupplement)&&<button className={workflowPrimary} disabled={busy||migrationRequired}>{busy?'Đang lưu…':editing?'Lưu lịch':isSupplemental?'Tạo đợt bổ sung':'Tạo đợt tuyển dụng'}</button>}</div>
  </form></WorkflowModal>}
  {extending&&<WorkflowModal title="Gia hạn đợt tuyển dụng" busy={busy} onClose={()=>setExtending(null)}><form className="space-y-4" onSubmit={extend}>{error&&<Notice>{error}</Notice>}<p className="text-sm text-slate-600">Chỉ kéo dài thời điểm kết thúc của giai đoạn đang mở. Không mở lại ứng tuyển đã đóng. Hệ thống thông báo các bên sau khi gia hạn.</p>{recruitmentPhases.filter(phase=>phase.key==='posting'?extending.canPost:phase.key==='application'?extending.canApply:extending.canRespond).map(phase=><RecruitmentDateInput key={phase.key} name={phase.key} label={'Kết thúc mới: '+phase.label} defaultValue={fmt(extending[(phase.key+'EndsAt') as keyof PhaseSchedule])}/>)}<button className={workflowPrimary} disabled={busy}>{busy?'Đang cập nhật…':'Xác nhận gia hạn'}</button></form></WorkflowModal>}
  {action&&<WorkflowModal title={action.type==='delete'?'Xóa đợt chưa mở':'Chốt tổng hợp kết quả'} busy={busy} onClose={()=>setAction(null)}><form onSubmit={confirm} className="space-y-4">{error&&<Notice>{error}</Notice>}<p className="text-sm text-slate-600">{action.round.name} · {fmt(action.round.startsAt)} – {fmt(action.round.endsAt)}</p>{action.type==='delete'&&<Notice>Chỉ xóa đợt chưa từng mở và chưa có dữ liệu liên quan. Thao tác sẽ xóa cả lịch ứng tuyển đi kèm.</Notice>}<Field label="Lý do xác nhận"><textarea name="reason" className={workflowInput} required maxLength={2000}/></Field><button className={workflowPrimary} disabled={busy}>{busy?'Đang xử lý…':'Xác nhận'}</button></form></WorkflowModal>}
 </section>;
}
