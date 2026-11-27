import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Plus, CheckCheck } from 'lucide-react';
import API from '@/services/apiService';
import { missingRecruitmentRounds, recruitmentPhases, type PhaseSchedule } from '@/utils/shared/recruitmentSchedule';
import { displayTaskTime, vietnamTaskMinute } from '@/utils/shared/taskTime';
import type { useQhdnAcademicPeriods } from '@/hooks/qhdn/useQhdnAcademicPeriods';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from './StudentWorkflowUi';
import { Field, Notice, errorMessage } from './QhdnUi';
import { RecruitmentDateInput } from './RecruitmentDateInput';
import { RecruitmentConfirmationContent } from './RecruitmentConfirmation';
import { emptySchedule, formatScheduleDate as formatDateTime, newRecruitmentSchedule, updateScheduleDraft, recruitmentScheduleAccess, scheduleFields, validateRecruitmentSchedule, type ScheduleDraft, type ScheduleErrors, type ScheduleField } from '@/utils/qhdn/qhdnRecruitmentSchedule';

type Round=Partial<PhaseSchedule>&{canEditSchedule?:boolean;canDelete?:boolean;editableScheduleFields?:string[];canPost?:boolean;canApply?:boolean;canRespond?:boolean;id:number;name:string;campaignId?:number;campaignName?:string;roundNumber?:number;status:string;currentPhase:string;startsAt:string;endsAt:string;resultsFinalizedAt?:string;pendingCount:number;canOpen:boolean;openBlockedReason?:string;canFinalize:boolean;resultsSummary?:{total:number;accepted:number;rejected:number;withdrawn:number;pending?:number}};
type Campaign={id:number;name:string;startsAt?:string;endsAt?:string};
const labels:Record<string,string>={DRAFT:'Chưa mở',SCHEDULED:'Chờ bắt đầu',OPEN:'Đang tuyển dụng',ENDED:'Kết thúc · Chờ tổng hợp',FINALIZED:'Đã chốt tổng hợp',LEGACY:'Đợt cũ',CLOSED:'Đã đóng',POSTING:'Đang mở đăng tin',POSTING_AND_APPLICATION:'Đăng tin và ứng tuyển',POSTING_AND_APPLICATION_AND_RESULTS:'Đăng tin, ứng tuyển và xét tuyển',APPLICATION:'Đang nhận hồ sơ',APPLICATION_AND_RESULTS:'Ứng tuyển và xét tuyển',RESULTS:'Đang xét tuyển, phản hồi',BETWEEN_PHASES:'Chờ hạn tiếp theo'};
const fmt=(v?:string)=>v?formatDateTime(new Date(v)):'—';
const draftFromRound=(round:Round)=>Object.fromEntries(scheduleFields.map(key=>[key,round[key]?fmt(round[key]):''])) as ScheduleDraft;
function focusScheduleError(form: HTMLFormElement, errors: ScheduleErrors) {
 const field = scheduleFields.find(key => errors[key] && form.querySelector(`#${key}-date:enabled`));
 if (field) form.querySelector<HTMLInputElement>(`#${field}-${errors[field]?.startsWith('Nhập giờ')?'time':'date'}`)?.focus();
}
export function RecruitmentRounds({selection:catalog,createRequest=0,refreshKey=0,onChanged}:{selection:ReturnType<typeof useQhdnAcademicPeriods>;createRequest?:number;refreshKey?:number;onChanged?:()=>void}){
 const [items,setItems]=useState<Round[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState(''),[roundsLoaded,setRoundsLoaded]=useState(false);
 const [creating,setCreating]=useState(false),[revision,setRevision]=useState(0),[migrationRequired,setMigrationRequired]=useState(false);
 const [extending,setExtending]=useState<Round|null>(null);
 const [editing,setEditing]=useState<Round|null>(null);
 const [draft,setDraft]=useState<ScheduleDraft>({...emptySchedule});
 const [now,setNow]=useState(Date.now);
 const [lastChanged,setLastChanged]=useState<ScheduleField>();
 const [showAllDateErrors,setShowAllDateErrors]=useState(false);
 const [apiDateErrors,setApiDateErrors]=useState<ScheduleErrors>({});
 const [nameError,setNameError]=useState(''),[reasonError,setReasonError]=useState('');
 const [pendingSave,setPendingSave]=useState<{name:string;reason:string}|null>(null);
 const [pendingOpen,setPendingOpen]=useState<Round|null>(null);
 const [formDetails,setFormDetails]=useState<{name:string;reason:string}|null>(null);
 const creationForm=useRef<HTMLFormElement>(null);
 const submission=useRef(false);
 const manuallyEdited=useRef(new Set<ScheduleField>());
 const touchedFields=useRef(new Set<ScheduleField>());
 const hasRecruitment=items.length>0||campaigns.length>0;
 const canCreate=!busy&&!loading&&roundsLoaded&&!loadError&&!migrationRequired&&catalog.canOpenRecruitment;
 const resetDates=(time:number)=>{
  setNow(time);touchedFields.current.clear();setLastChanged(undefined);setShowAllDateErrors(false);setApiDateErrors({});setError('');setNameError('');setReasonError('');setPendingSave(null);setFormDetails(null);
 };
 const startCreate=()=>{
  if(!canCreate)return;
  const time=Date.now();resetDates(time);setEditing(null);setDraft(newRecruitmentSchedule(time,{semesterStart:catalog.selectedPeriod?.startDate,semesterEnd:catalog.selectedPeriod?.endDate,rounds:items}));manuallyEdited.current.clear();setCreating(true);
 };
 const startEdit=(round:Round)=>{
  resetDates(Date.now());setDraft(draftFromRound(round));manuallyEdited.current=new Set(scheduleFields);setEditing(round);setCreating(true);
 };
 const startExtend=(round:Round)=>{
  resetDates(Date.now());setEditing(null);setExtending(round);setDraft(draftFromRound(round));
 };
 const [action,setAction]=useState<{round:Round;type:'finalize'|'delete'}|null>(null);
 const extensionPhases=extending?recruitmentPhases.filter(phase=>phase.key==='posting'?extending.canPost:phase.key==='application'?extending.canApply:extending.canRespond):[];
 const extensionFields=extensionPhases.map(phase=>`${phase.key}EndsAt` as ScheduleField);
 const validateDates=(time:number,changedField?:ScheduleField)=>{
  const result=validateRecruitmentSchedule(draft,{now:time,semesterStart:catalog.selectedPeriod?.startDate,rounds:items.filter(round=>round.id!==(editing??extending)?.id),semesterEnd:catalog.selectedPeriod?.endDate,original:editing??extending??undefined,requireFutureStart:editing?.status==='DRAFT',changedField});
  for(const key of extensionFields){
   const previous=extending?.[key];
   if(previous&&result.schedule[key]&&result.schedule[key]!==previous&&Date.parse(result.schedule[key])<=Date.parse(previous)){
    result.errors[key]??='Hạn mới phải sau hạn hiện tại.';
   }
  }
  if(extending&&extensionFields.includes('applicationEndsAt')&&!extensionFields.includes('resultsEndsAt')&&
   Date.parse(result.schedule.applicationEndsAt)>Date.parse(result.schedule.resultsEndsAt)){
   result.errors.applicationEndsAt??=result.errors.resultsEndsAt;
   delete result.errors.resultsEndsAt;
  }
  return result;
 };
 const liveErrors=(creating||extending)?validateDates(now,lastChanged).errors:{};
 const changeDate=(key:ScheduleField,value:string)=>{
  manuallyEdited.current.add(key);
  const next=extending?{...draft,[key]:value}:updateScheduleDraft(draft,key,value,manuallyEdited.current);
  touchedFields.current.add(key);
  for(const field of scheduleFields)if(next[field]!==draft[field])touchedFields.current.add(field);
  setDraft(next);setLastChanged(key);setNow(Date.now());setApiDateErrors({});setError('');
 };
 const dateField=(key:ScheduleField,label:string,displayLabel=key.endsWith('StartsAt')?'Bắt đầu':'Kết thúc')=>{
  const touched=touchedFields.current;
  const showError=showAllDateErrors||touched.has(key)||
   (key==='applicationEndsAt'&&touched.has('applicationStartsAt'))||
   (key==='resultsEndsAt'&&touched.has('applicationEndsAt'));
  return <RecruitmentDateInput key={key} name={key} label={label} displayLabel={displayLabel} value={draft[key]} onValueChange={value=>changeDate(key,value)} minDate={vietnamTaskMinute(new Date(now)).slice(0,10)} disabled={busy||!!editing&&!editing.editableScheduleFields?.includes(key)} error={apiDateErrors[key]??(showError?liveErrors[key]:undefined)}/>;
 };
 const reportScheduleError=(failure:unknown,form:HTMLFormElement|null,fields:readonly ScheduleField[])=>{
  const field=(failure as { response?: { data?: { field?: ScheduleField } } })?.response?.data?.field;
  const message=errorMessage(failure);
  if(field&&fields.includes(field)){
   const errors={[field]:message};setApiDateErrors(errors);setPendingSave(null);
   requestAnimationFrame(()=>{const target=form?.isConnected?form:creationForm.current;if(target)focusScheduleError(target,errors);});
  }else setError(message);
 };
 useEffect(()=>{if(createRequest)startCreate();},[createRequest]);
 useEffect(()=>{if(!creating&&!extending)return;const timer=window.setInterval(()=>setNow(Date.now()),15000);return()=>window.clearInterval(timer);},[creating,extending]);
 useEffect(()=>{if(migrationRequired)return;const timer=window.setInterval(()=>setRevision(v=>v+1),60000);return()=>window.clearInterval(timer);},[migrationRequired]);
 useEffect(()=>{
  
  if(!catalog.selectedPeriod)return;
  let active=true;setLoading(true);setRoundsLoaded(false);setLoadError('');
  API.get('/recruitment/windows',{params:{academicPeriodId:catalog.selectedPeriod.id}})
   .then(r=>{if(active){setItems(r.data.data.items.map((item:Round)=>({...item,...recruitmentScheduleAccess(item,!['CLOSED','ARCHIVED'].includes(catalog.selectedPeriod?.status??''))})));setCampaigns(r.data.data.campaigns??[]);setMigrationRequired(false);setRoundsLoaded(true);}})
   .catch(e=>{if(active){setLoadError(errorMessage(e));setMigrationRequired(e?.response?.status===503);}}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[catalog.selectedPeriod?.id,catalog.selectedPeriod?.status,revision,refreshKey]);
 const create=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(busy||(!editing&&!canCreate))return;
  const form=e.currentTarget,f=new FormData(form),time=Date.now();
  const name=String(f.get('name')??'').trim(),reason=String(f.get('reason')??'').trim();
  const {errors}=validateDates(time,lastChanged);
  setNow(time);setShowAllDateErrors(true);setApiDateErrors({});setError('');
  setNameError(name?'':'Nhập tên đợt tuyển dụng.');setReasonError(!editing||reason?'':'Nhập lý do sửa lịch.');
  if(!name){form.querySelector<HTMLInputElement>('[name="name"]')?.focus();return;}
  if(Object.keys(errors).length){focusScheduleError(form,errors);return;}
  if(editing&&!reason){form.querySelector<HTMLTextAreaElement>('[name="reason"]')?.focus();return;}
  setFormDetails({name,reason});setPendingSave({name,reason});
 };
 const saveReviewed=async()=>{
  if(!pendingSave||submission.current||busy||(!editing&&!canCreate))return;
  const time=Date.now(),{errors,schedule}=validateDates(time,lastChanged);
  setNow(time);setError('');
  if(Object.keys(errors).length){
   setApiDateErrors(errors);setShowAllDateErrors(true);setPendingSave(null);
   requestAnimationFrame(()=>{if(creationForm.current)focusScheduleError(creationForm.current,errors);});
   return;
  }
  const {name,reason}=pendingSave;
  submission.current=true;
  setBusy(true);
  try{
   if(editing)await API.patch(`/recruitment/windows/${editing.id}/schedule`,{name,...schedule,reason});
   else {
    const response=await API.post<{data:Campaign&{rounds:Round[]}}>('/recruitment/windows',{academicPeriodId:catalog.selectedPeriod?.id,name,
     startsAt:schedule.postingStartsAt,endsAt:schedule.resultsEndsAt,supplemental:hasRecruitment,rounds:[{name,...schedule}]});
    const campaign=response.data.data;
    setCampaigns(previous=>[...previous.filter(item=>item.id!==campaign.id),campaign]);setItems(previous=>[...previous.filter(item=>!campaign.rounds.some(round=>round.id===item.id)),...campaign.rounds].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)));
   }
   setPendingSave(null);setCreating(false);setRevision(v=>v+1);onChanged?.();setMessage(editing?'Đã cập nhật lịch đợt tuyển dụng.':'Đã tạo đợt tuyển dụng. Hệ thống sẽ gửi thông báo đến doanh nghiệp đang hoạt động.');setEditing(null);
  }catch(e){
   reportScheduleError(e,creationForm.current,scheduleFields);
   if((e as {response?:{data?:{errorCode?:string}}})?.response?.data?.errorCode==='RECRUITMENT_WINDOW_CONFLICT')setRevision(v=>v+1);
  }finally{submission.current=false;setBusy(false);}
 };
 const extend=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!extending||busy)return;
  const form=e.currentTarget,time=Date.now();
  const {errors,schedule}=validateDates(time,lastChanged);
  setNow(time);setShowAllDateErrors(true);setApiDateErrors({});setError('');
  if(Object.keys(errors).length){
   if(extensionFields.some(key=>errors[key]))focusScheduleError(form,errors);
   else setError(Object.values(errors)[0]??'Kiểm tra lại lịch tuyển dụng.');
   return;
  }
  const patch=Object.fromEntries(extensionFields.filter(key=>schedule[key]!==extending[key]).map(key=>[key,schedule[key]]));
  if(!Object.keys(patch).length){setError('Chọn thời hạn mới dài hơn hiện tại.');return;}
  setBusy(true);
  try{
   await API.patch('/recruitment/windows/'+extending.id,patch);
   setExtending(null);setRevision(v=>v+1);onChanged?.();setMessage('Đã gia hạn đợt tuyển dụng.');
  }catch(e){reportScheduleError(e,form,extensionFields);}finally{setBusy(false);}
 };
 const openRound=(round:Round)=>{
  if(busy||!catalog.canOpenRecruitment||!round.canOpen)return;
  setError('');setPendingOpen(round);
 };
 const confirmOpen=async()=>{
  const round=items.find(item=>item.id===pendingOpen?.id);
  if(submission.current||busy||loading||!catalog.canOpenRecruitment||!round?.canOpen)return;
  submission.current=true;
  setBusy(true);setError('');setMessage('');
  try{
   await API.patch(
    `/recruitment/windows/${round.id}`,{status:'OPEN',reason:'QHDN mở đợt tuyển dụng theo lịch đã thiết lập.'});
   setPendingOpen(null);setRevision(v=>v+1);onChanged?.();
   setMessage('Đã mở đợt tuyển dụng.');
  }catch(e){setError(errorMessage(e));}finally{submission.current=false;setBusy(false);}
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
 return <>
 {roundsLoaded&&!loadError&&!catalog.error&&!items.length&&<p role="status" className="text-sm font-medium text-red-700">{missingRecruitmentRounds}</p>}
 <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><CalendarDays size={22} className="text-orange-500"/>Đợt tuyển dụng OJT</h2><p className="mt-1 text-sm text-slate-500">Thiết lập hạn đăng tin, ứng tuyển và xét tuyển.</p></div><button className={workflowPrimary} disabled={!canCreate} onClick={startCreate}><Plus size={16}/>{hasRecruitment?'Tạo đợt bổ sung':'Tạo đợt tuyển dụng'}</button></div>
  {catalog.selectedPeriod?.status==='CLOSED'&&<p className="text-sm text-slate-500">Chỉ tạo và mở đợt tuyển dụng trong học kỳ đang diễn ra.</p>}
  {hasRecruitment&&<p className="text-xs text-slate-500">Có thể tạo và mở thêm đợt bổ sung khi đợt trước đang diễn ra. Lịch các đợt phải không trùng nhau và nằm trong học kỳ đang mở.</p>}
  <p className="text-sm font-medium text-slate-700">{catalog.selectedPeriod?.name||'Chọn học kỳ chính ở bộ lọc phía trên.'}</p>
  {(loadError||(!creating&&!extending&&!action&&!pendingOpen&&error))&&<Notice>{loadError||error}</Notice>}{message&&<Notice>{message}</Notice>}
  <p className="text-xs text-slate-500">Giờ bắt đầu xét tuyển được gợi ý theo giờ bắt đầu ứng tuyển và có thể chỉnh tay; hạn phản hồi kết thúc bằng hoặc sau hạn ứng tuyển. Đợt chưa mở được sửa lịch và xóa; đợt đã mở không được xóa. Khi đang mở, chỉ sửa các mốc còn thời gian, không mở lại hạn đã hết.</p>
  {migrationRequired?<button className={workflowSecondary} onClick={()=>setRevision(v=>v+1)}>Kiểm tra lại sau khi cập nhật database</button>:loading?<p className="text-sm text-slate-500">Đang tải…</p>:items.length>0&&<div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">{items.map((r,i)=>{
   const canOpen=catalog.canOpenRecruitment&&r.canOpen;
   return <article key={r.id} className="space-y-4 p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-500">STT {i+1}</span><span>{r.roundNumber?`Đợt ${r.roundNumber} · `:''}{r.name}</span></h3><p className="mt-2 text-sm text-slate-500">{fmt(r.startsAt)} → {fmt(r.endsAt)}</p></div><span className="self-start rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{labels[r.currentPhase]||r.currentPhase}</span></div>
    {r.postingStartsAt&&<dl className="divide-y divide-slate-100 border-y border-slate-100">{recruitmentPhases.map(phase=>{
     const active=phase.key==='posting'?r.canPost:phase.key==='application'?r.canApply:r.canRespond;
     return <div key={phase.key} className="grid gap-1.5 py-2.5 text-sm lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-center lg:gap-4"><dt className="flex items-center gap-2 font-medium text-slate-700"><span className={'h-1.5 w-1.5 shrink-0 rounded-full '+(active?'bg-emerald-500':'bg-slate-300')}/>{phase.label}</dt><dd className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-3.5 text-xs tabular-nums text-slate-500 lg:pl-0"><time>{fmt(r[(phase.key+'StartsAt') as keyof PhaseSchedule])}</time><span aria-hidden="true">&rarr;</span><time>{fmt(r[(phase.key+'EndsAt') as keyof PhaseSchedule])}</time></dd></div>;
    })}</dl>}
    {r.resultsSummary&&<p className="text-sm text-slate-600">Tổng {r.resultsSummary.total} hồ sơ · Nhận {r.resultsSummary.accepted} · Từ chối {r.resultsSummary.rejected} · Đã rút {r.resultsSummary.withdrawn} · Chưa có phản hồi {r.resultsSummary.pending??0}</p>}
    {!r.resultsFinalizedAt&&<div className="flex flex-wrap items-center gap-3">{r.status==='DRAFT'&&r.campaignId&&<button className={workflowPrimary} disabled={!canOpen||busy||loading} title={r.openBlockedReason||undefined} onClick={()=>openRound(r)}>Mở đợt</button>}{r.status==='OPEN'&&(r.canPost||r.canApply||r.canRespond)&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>startExtend(r)}>Gia hạn</button>}{r.canEditSchedule&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>startEdit(r)}>Sửa lịch</button>}{r.canDelete&&<button className={workflowSecondary+' text-red-600'} disabled={busy||loading} onClick={()=>{setError('');setAction({round:r,type:'delete'});}}>Xóa đợt</button>}{r.canFinalize&&<button className={workflowSecondary} disabled={busy||loading} onClick={()=>setAction({round:r,type:'finalize'})}><CheckCheck size={16}/>Chốt tổng hợp</button>}<span className="text-xs text-slate-500">{r.pendingCount?`${r.pendingCount} hồ sơ chờ phản hồi`:r.currentPhase==='SCHEDULED'?'Chưa tới giờ bắt đầu. Bạn có thể chỉnh sửa lịch.':!canOpen&&r.status==='DRAFT'?r.openBlockedReason:r.currentPhase==='ENDED'?'Đợt đã kết thúc. Chốt tổng hợp kết quả tuyển dụng.':null}</span></div>}
   </article>;
  })}</div>}
  {creating&&<WorkflowModal wide={!pendingSave} title={pendingSave?(editing?'Xác nhận lưu lịch đợt OJT':'Xác nhận tạo đợt OJT'):(editing?'Sửa lịch đợt tuyển dụng':hasRecruitment?'Tạo đợt bổ sung':'Tạo đợt tuyển dụng')} busy={busy} onClose={()=>{if(pendingSave)setPendingSave(null);else setCreating(false);}}>
   {pendingSave?<>{error&&<Notice>{error}</Notice>}<RecruitmentConfirmationContent action={editing?'save':'create'} semesterName={catalog.selectedPeriod?.name} roundName={pendingSave.name} busy={busy} disabled={!editing&&!canCreate} onBack={()=>{setError('');setPendingSave(null);}} onConfirm={()=>void saveReviewed()} /></>:<form ref={creationForm} noValidate className="space-y-5" onSubmit={create}>{error&&<Notice>{error}</Notice>}<>
   {!editing&&<p className="text-xs leading-relaxed text-slate-500">Lịch nằm trong học kỳ: {displayTaskTime(catalog.selectedPeriod?.startDate?.slice(0,10))} – {displayTaskTime(catalog.selectedPeriod?.endDate?.slice(0,10))}. {hasRecruitment?'Hạn 1 được gợi ý nối tiếp ngay khi đợt trước kết thúc. Bạn có thể chọn khoảng thời gian còn trống khác.':'Các mốc được gợi ý tự động và có thể chỉnh sửa.'}{!draft.postingStartsAt&&' Không còn đủ thời gian sau đợt cuối; chọn khoảng trống khác trong học kỳ hoặc điều chỉnh lịch đợt chưa mở.'}</p>}
   <Field label="Tên đợt tuyển dụng"><input name="name" defaultValue={formDetails?.name??editing?.name} className={workflowInput+(nameError?' !border-red-400':'')} required maxLength={150} placeholder="Ví dụ: Tuyển dụng OJT tháng 12" aria-invalid={!!nameError} aria-describedby={nameError?'recruitment-name-error':undefined} onChange={()=>setNameError('')}/>{nameError&&<span id="recruitment-name-error" role="alert" className="text-xs text-red-600">{nameError}</span>}</Field>
   <div className="divide-y divide-slate-100">{recruitmentPhases.map(phase=><fieldset key={phase.key} className="min-w-0 space-y-3 py-4 first:pt-0"><legend className="sr-only">{phase.label}</legend><div><h3 className="text-sm font-semibold text-slate-800">{phase.label}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{phase.description}</p></div><div className="grid gap-3 sm:grid-cols-2">{dateField((phase.key+'StartsAt') as ScheduleField,'Bắt đầu '+phase.label.toLowerCase())}{dateField((phase.key+'EndsAt') as ScheduleField,'Kết thúc '+phase.label.toLowerCase())}</div></fieldset>)}</div>
   <p className="text-xs leading-relaxed text-slate-500">{editing?'Mốc đã qua của đợt đang mở được khóa khi sửa lịch.':'Hạn 2 được gợi ý kết thúc sau 7 ngày kể từ mốc bắt đầu. Bạn có thể chỉnh ngày giờ kết thúc Hạn 2. Chọn mốc kết thúc Hạn 3 bằng hoặc sau khi Hạn 2 kết thúc.'}</p></>
   {editing&&<Field label="Lý do sửa lịch"><textarea name="reason" defaultValue={formDetails?.reason??''} className={workflowInput+(reasonError?' !border-red-400':'')} required maxLength={2000} aria-invalid={!!reasonError} aria-describedby={reasonError?'recruitment-reason-error':undefined} onChange={()=>setReasonError('')}/>{reasonError&&<span id="recruitment-reason-error" role="alert" className="text-xs text-red-600">{reasonError}</span>}</Field>}
   <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={()=>setCreating(false)}>Đóng</button><button className={workflowPrimary} disabled={busy||migrationRequired||(!editing&&!canCreate)}>{busy?'Đang lưu…':editing?'Lưu lịch':'Tạo đợt tuyển dụng'}</button></div>
  </form>}</WorkflowModal>}
  {pendingOpen&&<WorkflowModal title="Xác nhận mở đợt OJT" busy={busy} onClose={()=>setPendingOpen(null)}>
   {error&&<Notice>{error}</Notice>}
   <RecruitmentConfirmationContent action="open" semesterName={catalog.selectedPeriod?.name} roundName={pendingOpen.name} busy={busy} disabled={loading||!catalog.canOpenRecruitment||!items.find(item=>item.id===pendingOpen.id)?.canOpen} onBack={()=>{setError('');setPendingOpen(null);}} onConfirm={()=>void confirmOpen()} />
  </WorkflowModal>}
  {extending&&<WorkflowModal title="Gia hạn đợt tuyển dụng" busy={busy} onClose={()=>setExtending(null)}><form noValidate className="space-y-4" onSubmit={extend}>{error&&<Notice>{error}</Notice>}<p className="text-sm text-slate-600">Chỉ kéo dài thời điểm kết thúc của giai đoạn đang mở. Không mở lại ứng tuyển đã đóng.</p>{extensionPhases.map(phase=>dateField(`${phase.key}EndsAt`,'Kết thúc mới: '+phase.label,'Kết thúc mới: '+phase.label))}<button className={workflowPrimary} disabled={busy}>{busy?'Đang cập nhật…':'Xác nhận gia hạn'}</button></form></WorkflowModal>}
  {action&&<WorkflowModal title={action.type==='delete'?'Xóa đợt chưa mở':'Chốt tổng hợp kết quả'} busy={busy} onClose={()=>setAction(null)}><form onSubmit={confirm} className="space-y-4">{error&&<Notice>{error}</Notice>}<p className="text-sm text-slate-600">{action.round.name} · {fmt(action.round.startsAt)} – {fmt(action.round.endsAt)}</p>{action.type==='delete'&&<Notice>Chỉ xóa đợt chưa từng mở và chưa có dữ liệu liên quan. Thao tác sẽ xóa cả lịch ứng tuyển đi kèm.</Notice>}<Field label="Lý do xác nhận"><textarea name="reason" className={workflowInput} required maxLength={2000}/></Field><button className={workflowPrimary} disabled={busy}>{busy?'Đang xử lý…':'Xác nhận'}</button></form></WorkflowModal>}
 </section>
 </>;
}
