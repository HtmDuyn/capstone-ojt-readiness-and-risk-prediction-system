import { useEffect,useRef,useState } from 'react';
import { cvAnalysisApi,type CvAnalysis,type CvEntry,type CvProfile,type MatchingProfile } from '@/services/studentCvAnalysis.service';
import { buttonClass,inputClass } from './PortalUI';
import { useAuth } from '@/hooks/useAuth';
type Section=Exclude<keyof CvProfile,'summary'>;
const sections:{key:Section;label:string;fields:{key:string;label:string;kind?:'list'|'number'}[]}[]=[
 {key:'skills',label:'Kỹ năng',fields:[{key:'name',label:'Kỹ năng'}]},
 {key:'projects',label:'Dự án',fields:[{key:'name',label:'Tên dự án'},{key:'description',label:'Mô tả'},{key:'technologies',label:'Công nghệ (ngăn cách dấu phẩy)',kind:'list'}]},
 {key:'experience',label:'Kinh nghiệm',fields:[{key:'role',label:'Vai trò'},{key:'organization',label:'Đơn vị'},{key:'description',label:'Mô tả'}]},
 {key:'languages',label:'Ngoại ngữ',fields:[{key:'language',label:'Ngôn ngữ'},{key:'level',label:'Trình độ'},{key:'certificate',label:'Chứng chỉ'},{key:'score',label:'Điểm/chỉ số ghi trong CV'}]},
 {key:'education',label:'Học vấn tự khai trong CV',fields:[{key:'institution',label:'Cơ sở đào tạo'},{key:'degree',label:'Bằng cấp'},{key:'major',label:'Ngành'},{key:'gpa',label:'GPA',kind:'number'},{key:'gpaScale',label:'Thang GPA',kind:'number'}]},
];
export function CvExtractionCard({cvFileId}:{cvFileId:number}) {
 const {token,user}=useAuth();
 const [result,setResult]=useState<MatchingProfile|null>(null),[analysis,setAnalysis]=useState<CvAnalysis|null>(null),[draft,setDraft]=useState<CvProfile|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [consent,setConsent]=useState(false),[confirm,setConfirm]=useState(false),[reload,setReload]=useState(0);
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>{
  const controller=new AbortController();pending.current?.abort();pending.current=null;
  setResult(null);setAnalysis(null);setDraft(null);setConsent(false);setConfirm(false);setError('');setNotice('');setLoading(true);setBusy(false);
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
 const add=(section:typeof sections[number])=>{const row:CvEntry={evidence:null};for(const f of section.fields)row[f.key]=f.kind==='list'?[]:f.key==='name'||f.key==='role'||f.key==='language'?'':null;setConfirm(false);setDraft(p=>p?{...p,[section.key]:[...p[section.key],row]}:p);};
 const stateLabel={PROCESSING:'Đang đọc CV',NEEDS_REVIEW:'Chờ bạn kiểm tra',CONFIRMED:'Đã xác nhận',FAILED:'Chưa đọc được CV'};
 return <section className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4" aria-label="Đọc và xác nhận CV">
  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Đọc CV và chuẩn hóa hồ sơ</h3><button type="button" disabled={busy||loading} onClick={()=>setReload(v=>v+1)} className="text-xs font-semibold text-orange-700 disabled:opacity-50">Cập nhật trạng thái</button></div>
  {loading?<p role="status" className="text-sm text-slate-500">Đang tải kết quả đọc CV…</p>:<>
   <p className="text-sm text-slate-600">{analysis?stateLabel[analysis.status]:'File đã lưu, chưa có kết quả phân tích.'}</p>
   {(!analysis||analysis.status==='FAILED'||analysis.canRetry)&&<>
    <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/><span>Tôi đồng ý gửi nội dung CV hiện tại đến Claude để trích xuất kỹ năng, dự án, kinh nghiệm và ngoại ngữ. CV có thể chứa thông tin cá nhân. Kết quả cần được tôi kiểm tra trước khi xác nhận.</span></label>
    <button type="button" className={buttonClass} disabled={!consent||busy} onClick={()=>run(async signal=>{const r=await cvAnalysisApi.analyze(cvFileId,signal);if(signal.aborted)return;setAnalysis(r.analysis);setDraft(r.analysis.profile);setConfirm(false);if(r.analysis.status==='FAILED')setError(r.analysis.error?.message??'Không đọc được CV.');})}>{busy?'Đang đọc CV bằng Claude…':'Phân tích CV bằng Claude'}</button>
   </>}
   {analysis?.status==='PROCESSING'&&!analysis.canRetry&&<p className="text-xs text-slate-500">Yêu cầu đang xử lý. Hãy cập nhật trạng thái sau; nếu tác vụ bị ngắt, bạn có thể thử lại sau khoảng 2 phút.</p>}
   {analysis?.error&&<p className="text-xs text-amber-800">{analysis.error.code}: {analysis.error.message}</p>}
   {result&&<div className="rounded-xl bg-white p-3 text-xs text-slate-600"><p>Dữ liệu trường: {result.officialAcademic.major??'Chưa có ngành'} · GPA {result.officialAcademic.gpa??'chưa đủ dữ liệu'} / {result.officialAcademic.gpaScale??'—'}</p>{result.discrepancies.length>0&&<p className="mt-1 text-amber-800">Ngành/GPA trong CV cần đối chiếu với hồ sơ trường. Khi sử dụng dữ liệu học vụ, hệ thống ưu tiên dữ liệu trường.</p>}</div>}
   {draft&&<>
    <p className="text-xs text-slate-500">Thông tin AI trích xuất chưa được xác minh tự động. Bạn có thể sửa hoặc thêm mục; thiếu thông tin thì để trống, không tự điền cho đủ.</p>
    <label className="block text-xs">Tóm tắt<textarea disabled={busy} className={inputClass+' mt-1'} rows={3} value={draft.summary??''} onChange={e=>{setConfirm(false);setDraft(p=>p?{...p,summary:e.target.value||null}:p);}}/></label>
    {sections.map(section=><details key={section.key} open={section.key==='skills'} className="rounded-xl border border-slate-200 bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">{section.label} ({draft[section.key].length})</summary><div className="mt-3 space-y-3">{draft[section.key].map((row,index)=><fieldset disabled={busy} key={index} className="space-y-2 rounded-xl bg-slate-50 p-3">{section.fields.map(f=><label key={f.key} className="block text-xs">{f.label}<input className={inputClass+' mt-1'} type={f.kind==='number'?'number':'text'} step={f.kind==='number'?'any':undefined} maxLength={f.kind==='number'?undefined:2000} value={Array.isArray(row[f.key])?(row[f.key] as string[]).join(', '):typeof row[f.key]==='string'||typeof row[f.key]==='number'?row[f.key] as string|number:''} onChange={e=>edit(section.key,index,f.key,f.kind==='list'?e.target.value.split(',').map(s=>s.trim()).filter(Boolean):f.kind==='number'?e.target.value===''?null:Number(e.target.value):e.target.value||(['name','role','language'].includes(f.key)?'':null))}/></label>)}{row.evidence&&<p className="text-xs text-slate-500">Căn cứ do model cung cấp, trang {row.evidence.page}: “{row.evidence.quote}”</p>}<button type="button" className="text-xs text-red-700" onClick={()=>{setConfirm(false);setDraft(p=>p?{...p,[section.key]:p[section.key].filter((_,i)=>i!==index)}:p);}}>Xóa mục</button></fieldset>)}<button type="button" className="text-xs font-semibold text-orange-700" disabled={busy||draft[section.key].length>=50} onClick={()=>add(section)}>+ Bổ sung {section.label.toLowerCase()}</button></div></details>)}
    <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={confirm} disabled={busy} onChange={e=>setConfirm(e.target.checked)}/><span>Tôi đã đối chiếu với CV và xác nhận nội dung hồ sơ bên trên.</span></label>
    <div className="flex flex-wrap gap-2">{[false,true].map(confirmed=><button key={String(confirmed)} type="button" className={buttonClass} disabled={busy||!analysis||(confirmed&&!confirm)} onClick={()=>run(async signal=>{const r=await cvAnalysisApi.save(analysis!.id,analysis!.revision,draft,confirmed,signal);if(signal.aborted)return;setAnalysis(r.analysis);setDraft(r.analysis.profile);setConfirm(false);setNotice(confirmed?'Đã xác nhận hồ sơ CV. Chức năng matching doanh nghiệp sẽ được tích hợp sau.':'Đã lưu bản chỉnh sửa, chưa xác nhận.');})}>{confirmed?'Xác nhận hồ sơ':'Lưu bản nháp'}</button>)}</div>
   </>}
  </>}
  {notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
 </section>;
}
