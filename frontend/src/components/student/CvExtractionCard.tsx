import { Sparkles, CheckCircle2, FileText, Code2, FolderKanban, BriefcaseBusiness, Languages, GraduationCap, ChevronDown, Save, LoaderCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';
import { cvAnalysisApi,type CvAnalysis,type CvEntry,type CvProfile,type MatchingProfile } from '@/services/studentCvAnalysis.service';
import { buttonClass,inputClass } from './PortalUI';
import { useAuth } from '@/hooks/useAuth';
const skillCategories:Record<string,string>={TOOL:'Công cụ',TECHNOLOGY:'Ngôn ngữ lập trình và công nghệ',PROFESSIONAL:'Kỹ năng chuyên môn',SOFT:'Kỹ năng mềm',OTHER:'Chưa phân loại'};
type Section=Exclude<keyof CvProfile,'summary'>;
const sections:{key:Section;label:string;fields:{key:string;label:string;kind?:'list'|'number'|'paragraph'|'category'}[]}[]=[
 {key:'skills',label:'Kỹ năng chuyên môn',fields:[{key:'name',label:'Tên ngắn gọn'},{key:'category',label:'Nhóm',kind:'category'}]},
 {key:'projects',label:'Dự án đã thực hiện',fields:[{key:'name',label:'Tên dự án'},{key:'description',label:'Mô tả',kind:'paragraph'},{key:'technologies',label:'Công nghệ (ngăn cách dấu phẩy)',kind:'list'}]},
 {key:'experience',label:'Kinh nghiệm làm việc',fields:[{key:'role',label:'Vai trò'},{key:'organization',label:'Đơn vị'},{key:'description',label:'Mô tả',kind:'paragraph'}]},
 {key:'languages',label:'Ngoại ngữ',fields:[{key:'language',label:'Ngôn ngữ'},{key:'level',label:'Trình độ'},{key:'certificate',label:'Chứng chỉ'},{key:'score',label:'Điểm/chỉ số ghi trong CV'}]},
 {key:'education',label:'Học vấn',fields:[{key:'institution',label:'Cơ sở đào tạo'},{key:'degree',label:'Bằng cấp'},{key:'major',label:'Ngành'},{key:'gpa',label:'GPA',kind:'number'},{key:'gpaScale',label:'Thang GPA',kind:'number'}]},
];
export function CvExtractionCard({cvFileId}:{cvFileId:number}) {
 const {token,user}=useAuth();
 const [result,setResult]=useState<MatchingProfile|null>(null),[analysis,setAnalysis]=useState<CvAnalysis|null>(null),[draft,setDraft]=useState<CvProfile|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [consent,setConsent]=useState(false),[confirm,setConfirm]=useState(false),[reload,setReload]=useState(0);
 const [editing,setEditing]=useState(false);
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>{
  const controller=new AbortController();pending.current?.abort();pending.current=null;
  setEditing(false);setResult(null);setAnalysis(null);setDraft(null);setConsent(false);setConfirm(false);setError('');setNotice('');setLoading(true);setBusy(false);
  cvAnalysisApi.get(controller.signal).then(r=>{if(!controller.signal.aborted){if(r.cv?.id!==cvFileId){setError('CV đã thay đổi. Hãy tải lại hồ sơ.');return;}setResult(r);setAnalysis(r.analysis);setDraft(r.analysis?.profile??null);}})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được hồ sơ đọc CV.');})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>{controller.abort();pending.current?.abort();};
 },[cvFileId,reload,token,user?.id]);
 const run=async(work:(signal:AbortSignal)=>Promise<void>)=>{
  if(pending.current)return;const controller=new AbortController();pending.current=controller;setBusy(true);setError('');setNotice('');
  try{await work(controller.signal);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không xử lý được hồ sơ CV.');}
  finally{if(pending.current===controller){pending.current=null;setBusy(false);}}
 };
 const edit=(section:Section,index:number,key:string,value:CvEntry[string])=>{setConfirm(false);setDraft(p=>p?{...p,[section]:p[section].map((row,i)=>i===index?{...row,[key]:value}:row)}:p);};
 const add=(section:typeof sections[number])=>{const row:CvEntry={evidence:null};for(const f of section.fields)row[f.key]=f.kind==='category'?'OTHER':f.kind==='list'?[]:f.key==='name'||f.key==='role'||f.key==='language'?'':null;setConfirm(false);setDraft(p=>p?{...p,[section.key]:[...p[section.key],row]}:p);};

 const stateLabel={PROCESSING:'Đang phân tích',NEEDS_REVIEW:'Phân tích thành công',CONFIRMED:'Đã xác nhận hồ sơ',FAILED:'Phân tích thất bại'};
 const icons={skills:Code2,projects:FolderKanban,experience:BriefcaseBusiness,languages:Languages,education:GraduationCap};
 const card='min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
 const secondary='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';
 const friendlyError=/internal server error|timeout|network error|failed to fetch/i.test(error)?'Không thể xử lý hồ sơ lúc này. Vui lòng thử lại.':error;
 return <div className="min-w-0 space-y-5">
  <section className={card} aria-label="Hoàn thiện hồ sơ từ CV">
   <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
    <div className="flex min-w-0 flex-1 items-start gap-3"><span className="rounded-xl bg-orange-50 p-2.5 text-orange-600"><Sparkles size={22}/></span><div><h2 className="text-lg font-semibold text-slate-800">Hoàn thiện hồ sơ từ CV</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">Phân tích thông tin từ CV để hoàn thiện hồ sơ kỹ năng, kinh nghiệm và học vấn trước khi ứng tuyển.</p></div></div>
    <button type="button" disabled={busy||loading} onClick={()=>setReload(v=>v+1)} className={secondary+' w-full shrink-0 sm:w-auto'}><RefreshCw size={15} className={loading?'animate-spin':''}/><span>Cập nhật trạng thái</span></button>
   </header>
   {loading?<div role="status" aria-label="Đang tải kết quả đọc CV" className="mt-5 animate-pulse space-y-3"><div className="h-6 w-40 rounded-full bg-slate-100"/><div className="h-16 rounded-xl bg-slate-100"/></div>:<div className="mt-5 space-y-4">
    <span role="status" className={'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold '+(analysis?.status==='FAILED'?'bg-red-50 text-red-700':analysis?.status==='CONFIRMED'||analysis?.status==='NEEDS_REVIEW'?'bg-emerald-50 text-emerald-700':'bg-orange-50 text-orange-700')}>{analysis?.status==='PROCESSING'&&<LoaderCircle size={14} className="animate-spin"/>}{analysis?stateLabel[analysis.status]:'Chưa phân tích'}</span>
    {analysis?.status==='CONFIRMED'&&<div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800"><CheckCircle2 size={20} className="mt-0.5 shrink-0"/><p>Hồ sơ của bạn đã được xác nhận và sẵn sàng sử dụng cho việc gợi ý vị trí thực tập.</p></div>}
    {(!analysis||analysis.status==='FAILED'||analysis.canRetry)&&<>
     <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"><input className="mt-1 h-4 w-4 shrink-0 accent-orange-500" type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>Tôi đồng ý gửi nội dung CV hiện tại đến Claude AI để trích xuất thông tin phục vụ tư vấn và gợi ý vị trí thực tập. Tôi sẽ kiểm tra lại kết quả trước khi xác nhận hồ sơ.</span></label>
     <button type="button" className={buttonClass+' inline-flex w-full items-center justify-center gap-2 py-3 sm:w-auto'} disabled={!consent||busy} onClick={()=>run(async signal=>{const r=await cvAnalysisApi.analyze(cvFileId,signal);if(signal.aborted)return;setAnalysis(r.analysis);setDraft(r.analysis.profile);setConfirm(false);if(r.reviewMessage)setNotice(r.reviewMessage);if(r.analysis.status==='FAILED')setError(r.analysis.error?.message??'Không đọc được CV.');})}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<Sparkles size={17}/ >}{busy?'Đang phân tích CV…':'Phân tích CV'}</button>
    </>}
    {analysis?.status==='PROCESSING'&&!analysis.canRetry&&<p className="rounded-xl bg-orange-50 p-4 text-sm leading-relaxed text-orange-800">Yêu cầu đang xử lý. Hãy cập nhật trạng thái sau; nếu tác vụ bị ngắt, bạn có thể thử lại sau khoảng 2 phút.</p>}
    {analysis?.error&&<div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p>{analysis.error.message}</p><details className="mt-2 text-xs"><summary className="cursor-pointer">Chi tiết kỹ thuật</summary>{analysis.error.code}</details></div>}
   </div>}
   {notice&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800">{notice}</p>}
   {error&&<div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p>{friendlyError}</p>{friendlyError!==error&&<details className="mt-2 text-xs"><summary className="cursor-pointer">Chi tiết kỹ thuật</summary><p className="break-words">{error}</p></details>}</div></div>}
  </section>
  {draft&&<section className={card} aria-label="Kiểm tra và hoàn thiện hồ sơ">
   <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CheckCircle2 size={22}/></span><div><h2 className="text-lg font-semibold text-slate-800">Kiểm tra và hoàn thiện hồ sơ</h2><span className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Phân tích thành công</span></div></div></header>
   <p className="mt-4 text-sm leading-relaxed text-slate-600">CV của bạn đã được phân tích thành công. Vui lòng đối chiếu các thông tin bên dưới với CV trước khi xác nhận hồ sơ.</p>
   <p className="mt-1 text-xs leading-relaxed text-slate-500">Thông tin được xác nhận sẽ được sử dụng để hỗ trợ gợi ý các vị trí thực tập phù hợp với kỹ năng và kinh nghiệm của bạn.</p>
   {result&&<div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600"><p>Dữ liệu trường: {result.officialAcademic.major??'Chưa có ngành'} · GPA {result.officialAcademic.gpa??'chưa đủ dữ liệu'} / {result.officialAcademic.gpaScale??'—'}</p>{result.discrepancies.length>0&&<p className="mt-1 text-amber-800">Ngành/GPA trong CV cần đối chiếu với hồ sơ trường. Khi sử dụng dữ liệu học vụ, hệ thống ưu tiên dữ liệu trường.</p>}</div>}
   <div className="mt-5 space-y-3">
    <details open className="group rounded-2xl border border-slate-200"><summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"><FileText size={18} className="text-orange-500"/>Giới thiệu bản thân<span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{draft.summary?1:0}</span><ChevronDown size={17} className="transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary><div className="border-t border-slate-100 p-4"><label className="sr-only" htmlFor={'cv-summary-'+cvFileId}>Giới thiệu bản thân</label><textarea id={'cv-summary-'+cvFileId} readOnly={!editing} disabled={busy} className={inputClass+' min-h-28 resize-y leading-relaxed'} rows={4} placeholder="Chưa có phần giới thiệu bản thân." value={draft.summary??''} onChange={e=>{setConfirm(false);setDraft(p=>p?{...p,summary:e.target.value||null}:p);}}/></div></details>
    {sections.map(section=>{const Icon=icons[section.key];return <details key={section.key} className="group min-w-0 rounded-2xl border border-slate-200"><summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"><Icon size={18} className="shrink-0 text-orange-500"/><span>{section.label}</span><span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{draft[section.key].length}</span><ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"/></summary>
     <div className="space-y-3 border-t border-slate-100 p-4">
      {!draft[section.key].length&&<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có thông tin trong nhóm này.{editing?' Bạn có thể bổ sung bên dưới.':''}</p>}
      <div className={section.key==='skills'?'grid gap-3 sm:grid-cols-2 xl:grid-cols-3':'grid gap-3 lg:grid-cols-2'}>
       {draft[section.key].map((row,index)=><fieldset disabled={busy} key={index} className="min-w-0 space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        {section.fields.map(f=><label key={f.key} className="block min-w-0 text-xs font-medium text-slate-500">{f.label}{!editing?<div className={f.kind==='category'?'mt-1 inline-block rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800':'mt-1 whitespace-pre-wrap break-words text-sm font-normal leading-relaxed text-slate-800'}>{f.kind==='category'?skillCategories[typeof row.category==='string'?row.category:'OTHER']??skillCategories.OTHER:Array.isArray(row[f.key])?(row[f.key] as string[]).join(', ')||'Chưa có thông tin':typeof row[f.key]==='string'||typeof row[f.key]==='number'?String(row[f.key])||'Chưa có thông tin':'Chưa có thông tin'}</div>:f.kind==='category'?<select className={inputClass+' mt-1 w-full'} value={typeof row.category==='string'?row.category:'OTHER'} onChange={e=>edit(section.key,index,f.key,e.target.value)}>{Object.entries(skillCategories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>:f.kind==='paragraph'?<textarea rows={4} maxLength={2000} className={inputClass+' mt-1 w-full font-normal leading-relaxed'} value={typeof row[f.key]==='string'?row[f.key] as string:''} onChange={e=>edit(section.key,index,f.key,e.target.value||null)}/>:<input className={inputClass+' mt-1 min-w-0 w-full font-normal'} type={f.kind==='number'?'number':'text'} step={f.kind==='number'?'any':undefined} maxLength={f.kind==='number'?undefined:2000} value={Array.isArray(row[f.key])?(row[f.key] as string[]).join(', '):typeof row[f.key]==='string'||typeof row[f.key]==='number'?row[f.key] as string|number:''} onChange={e=>edit(section.key,index,f.key,f.kind==='list'?e.target.value.split(',').map(s=>s.trim()).filter(Boolean):f.kind==='number'?e.target.value===''?null:Number(e.target.value):e.target.value||(['name','role','language'].includes(f.key)?'':null))}/>}</label>)}
        {row.evidence&&<details className="text-xs text-slate-500"><summary className="cursor-pointer py-1 font-medium">Xem trích dẫn CV · trang {row.evidence.page}</summary><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">“{row.evidence.quote}”</p></details>}
        {editing&&<button type="button" className="rounded-lg py-1 text-xs font-medium text-red-700 hover:text-red-800" onClick={()=>{setConfirm(false);setDraft(p=>p?{...p,[section.key]:p[section.key].filter((_,i)=>i!==index)}:p);}}>Xóa mục</button>}
       </fieldset>)}
      </div>
      {editing&&<button type="button" className="rounded-lg py-2 text-sm font-semibold text-orange-700 hover:text-orange-800 disabled:opacity-50" disabled={busy||draft[section.key].length>=50} onClick={()=>add(section)}>+ Bổ sung {section.label.toLowerCase()}</button>}
     </div>
    </details>;})}
   </div>
   <footer className="mt-5 space-y-4 border-t border-slate-200 pt-5">
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"><input className="mt-1 h-4 w-4 shrink-0 accent-orange-500" type="checkbox" checked={confirm} disabled={busy} onChange={e=>setConfirm(e.target.checked)}/><span>Tôi đã kiểm tra và xác nhận các thông tin được trích xuất từ CV là chính xác.</span></label>
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">{[false,true].map(confirmed=><button key={String(confirmed)} type="button" className={confirmed?buttonClass+' inline-flex items-center justify-center gap-2 py-3':secondary} disabled={busy||!analysis||(confirmed&&!confirm)} onClick={()=>run(async signal=>{const r=await cvAnalysisApi.save(analysis!.id,analysis!.revision,draft,confirmed,signal);if(signal.aborted)return;setAnalysis(r.analysis);setDraft(r.analysis.profile);setConfirm(false);setEditing(false);setNotice(confirmed?'Đã xác nhận hồ sơ CV.':'Đã lưu bản chỉnh sửa, chưa xác nhận.');})}>{busy?<LoaderCircle size={17} className="animate-spin"/>:confirmed?<CheckCircle2 size={17}/>:<Save size={17}/ >}{confirmed?'Xác nhận hồ sơ':'Lưu bản nháp'}</button>)}</div>
   </footer>
  </section>}
 </div>;
}
