import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, Plus, Trash2, UserPlus } from 'lucide-react';
import { commitEnterpriseImport, generateIdempotencyKey, previewEnterpriseImport } from '@/services/qhdnService';
import { errorMessage, Notice } from '../QhdnUi';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '../StudentWorkflowUi';
import type { AcademicPeriodItem, EnterpriseImportRow, EnterpriseImportPayload, ImportPreviewResponse, ImportCommitResponse } from '@/types/qhdn/qhdnTypes';
import type { RecruitmentWindow } from '@/types/qhdn/workflowTypes';
const emptyRow = (): EnterpriseImportRow => ({ code: '', name: '', fullName: '', email: '' });
export function QhdnEnterpriseImportModal({ isOpen, onClose, onImported }: {
 isOpen:boolean;onClose:()=>void;onImported:()=>void;periods?:AcademicPeriodItem[];periodsLoading?:boolean;initialAcademicPeriodId?:number;initialWindow?:RecruitmentWindow|null;
}) {
 const [rows,setRows]=useState<EnterpriseImportRow[]>([emptyRow()]);
 const [payload,setPayload]=useState<EnterpriseImportPayload|null>(null),[preview,setPreview]=useState<ImportPreviewResponse|null>(null),[result,setResult]=useState<ImportCommitResponse|null>(null);
 const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const key=useRef(generateIdempotencyKey('enterprise-account')),lock=useRef(false);
 const invalidate=()=>{setPayload(null);setPreview(null);setConfirmed(false);setError('');key.current=generateIdempotencyKey('enterprise-account');};
 const change=(index:number,field:keyof EnterpriseImportRow,value:string)=>{setRows(current=>current.map((row,i)=>i===index?{...row,[field]:value}:row));invalidate();};
 const check=async(event:FormEvent)=>{
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{
   const normalized=rows.map(row=>({code:row.code.trim().toUpperCase(),name:row.name.trim(),fullName:row.fullName.trim(),email:row.email.trim().toLowerCase()}));
   if(new Set(normalized.map(r=>r.code)).size!==rows.length||new Set(normalized.map(r=>r.email)).size!==rows.length)throw new Error('Mã doanh nghiệp và email không được trùng nhau.');
   const body=payload??{kind:'ENTERPRISE' as const,idempotencyKey:key.current,rows:normalized};
   setPayload(body);setPreview(await previewEnterpriseImport(body));setConfirmed(false);
  }catch(e){setError(errorMessage(e));}finally{lock.current=false;setBusy(false);}
 };
 const commit=async()=>{
  if(lock.current||!payload||!preview?.canCommit||!confirmed)return;lock.current=true;setBusy(true);setError('');
  try{setResult(await commitEnterpriseImport(payload));onImported();}catch(e){setError(errorMessage(e));}finally{lock.current=false;setBusy(false);}
 };
 if(!isOpen)return null;
 const step=result?3:preview?2:1;
 return <WorkflowModal wide title="Tạo tài khoản doanh nghiệp" subtitle="Nhập trực tiếp thông tin đối tác, kiểm tra và xác nhận trước khi tạo tài khoản." busy={busy} onClose={onClose}>
  <ol className="mb-5 grid grid-cols-3 gap-2">{['Nhập thông tin','Kiểm tra & xác nhận','Hoàn tất'].map((label,i)=><li key={label} className={'flex items-center gap-2 rounded-xl p-3 text-xs font-semibold sm:text-sm '+(step===i+1?'bg-orange-50 text-orange-700':'bg-slate-50 text-slate-500')}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">{i+1}</span>{label}</li>)}</ol>
  {error&&<div role="alert" className="mb-4"><Notice>{error}</Notice></div>}
  {result?<div className="space-y-5 py-4 text-center"><CheckCircle2 size={44} className="mx-auto text-emerald-600"/><h3 className="text-xl font-semibold text-slate-800">Đã tạo tài khoản doanh nghiệp</h3><p className="text-sm leading-relaxed text-slate-500">Đã xử lý {result.total} doanh nghiệp, tạo mới {result.created} tài khoản. Thông tin đăng nhập được đưa vào hàng chờ gửi email. Doanh nghiệp cần đổi mật khẩu trước khi cập nhật hồ sơ và đăng tuyển.</p><button type="button" className={workflowPrimary} onClick={onClose}>Hoàn tất & về danh sách</button></div>:!preview?<form onSubmit={check} className="space-y-5">
   <p className="rounded-xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">Chỉ tạo tài khoản cho doanh nghiệp liên kết. Không cần tải file, nhập JD hoặc vị trí tuyển dụng. Doanh nghiệp tự cập nhật hồ sơ sau khi đăng nhập và đổi mật khẩu.</p>
   <fieldset disabled={busy} className="space-y-4">{rows.map((row,index)=><section key={index} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
    <header className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><UserPlus size={18} className="text-orange-500"/>Doanh nghiệp {index+1}</h3>{rows.length>1&&<button type="button" aria-label={'Bỏ doanh nghiệp '+(index+1)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>{setRows(current=>current.filter((_,i)=>i!==index));invalidate();}}><Trash2 size={16}/></button>}</header>
    <div className="grid gap-4 sm:grid-cols-2">
     <label className="space-y-2 text-sm font-medium">Mã doanh nghiệp <span className="text-orange-600">*</span><input required maxLength={20} pattern="[A-Za-z0-9_-]+" title="Chữ cái, chữ số, dấu gạch ngang hoặc gạch dưới; tối đa 20 ký tự." autoComplete="off" className={workflowInput} value={row.code} onChange={e=>change(index,'code',e.target.value)} placeholder="Nhập mã doanh nghiệp"/></label>
     <label className="space-y-2 text-sm font-medium">Tên doanh nghiệp <span className="text-orange-600">*</span><input required maxLength={200} className={workflowInput} value={row.name} onChange={e=>change(index,'name',e.target.value)} placeholder="Nhập tên doanh nghiệp"/></label>
     <label className="space-y-2 text-sm font-medium">Tên người phụ trách <span className="text-orange-600">*</span><input required maxLength={150} className={workflowInput} value={row.fullName} onChange={e=>change(index,'fullName',e.target.value)} placeholder="Người nhận thông tin tài khoản"/></label>
     <label className="space-y-2 text-sm font-medium">Email đăng nhập <span className="text-orange-600">*</span><input required type="email" maxLength={100} className={workflowInput} value={row.email} onChange={e=>change(index,'email',e.target.value)} placeholder="Email của người phụ trách"/><span className="block text-xs font-normal text-slate-500">Thông tin đăng nhập sẽ được gửi đến email này.</span></label>
    </div>
   </section>)}<button type="button" disabled={rows.length>=500} className={workflowSecondary} onClick={()=>{setRows(current=>[...current,emptyRow()]);invalidate();}}><Plus size={16}/>Thêm doanh nghiệp</button></fieldset>
   <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} className={workflowSecondary} onClick={onClose}>Để sau</button><button type="submit" disabled={busy} className={workflowPrimary}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<CheckCircle2 size={17}/>}Kiểm tra thông tin<ArrowRight size={16}/></button></footer>
  </form>:<div className="space-y-5">
   <p className="text-sm text-slate-600">Kiểm tra {payload?.rows.length} tài khoản trước khi tạo. Tài khoản hoặc email đã tồn tại sẽ không bị ghi đè.</p>
   <div className="max-h-[45vh] space-y-3 overflow-y-auto">{payload?.rows.map(row=><article key={row.code} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-800">{row.name}</h3><span className="text-xs text-slate-500">{row.code}</span></div><p className="mt-2 text-sm text-slate-600">{row.fullName}</p><p className="mt-1 break-all text-sm text-slate-500">{row.email}</p></article>)}</div>
   {!preview.canCommit&&<Notice>{preview.errors.join(' ')||'Thông tin chưa hợp lệ. Vui lòng quay lại kiểm tra.'}</Notice>}
   <label className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-sm leading-relaxed text-slate-700"><input type="checkbox" className="mt-1 accent-orange-600" checked={confirmed} disabled={busy||!preview.canCommit} onChange={e=>setConfirmed(e.target.checked)}/><span>Tôi đã kiểm tra thông tin và đồng ý tạo tài khoản cho các doanh nghiệp trên.</span></label>
   <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} className={workflowSecondary} onClick={()=>{setPreview(null);setConfirmed(false);}}><ArrowLeft size={16}/>Sửa thông tin</button><button type="button" disabled={busy||!confirmed||!preview.canCommit} className={workflowPrimary} onClick={commit}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<UserPlus size={17}/>}Tạo tài khoản</button></footer>
  </div>}
 </WorkflowModal>;
}