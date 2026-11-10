import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Plus, Trash2, UserPlus } from 'lucide-react';
import { commitEnterpriseImport, generateIdempotencyKey, previewEnterpriseImport } from '@/services/qhdnService';
import { errorMessage, Notice, Pager } from '../QhdnUi';
import { downloadFile } from '@/utils/downloadFile';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '../StudentWorkflowUi';
import type { AcademicPeriodItem, EnterpriseImportRow, EnterpriseImportPayload, ImportPreviewResponse, ImportCommitResponse } from '@/types/qhdn/qhdnTypes';
import type { RecruitmentWindow } from '@/types/qhdn/workflowTypes';
const emptyRow = (): EnterpriseImportRow => ({ name: '', fullName: '', email: '' });
export function QhdnEnterpriseImportModal({ isOpen, onClose, onImported, mode = 'manual' }: {
 isOpen:boolean;onClose:()=>void;onImported:()=>void;mode?:'manual'|'file';periods?:AcademicPeriodItem[];periodsLoading?:boolean;initialAcademicPeriodId?:number;initialWindow?:RecruitmentWindow|null;
}) {
 const [rows,setRows]=useState<EnterpriseImportRow[]>(mode === 'file' ? [] : [emptyRow()]);
 const [fileName,setFileName]=useState(''),[page,setPage]=useState(1);
 const [payload,setPayload]=useState<EnterpriseImportPayload|null>(null),[preview,setPreview]=useState<ImportPreviewResponse|null>(null),[result,setResult]=useState<ImportCommitResponse|null>(null);
 const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const key=useRef(generateIdempotencyKey('enterprise-account')),lock=useRef(false);
 const invalidate=()=>{setPayload(null);setPreview(null);setConfirmed(false);setError('');key.current=generateIdempotencyKey('enterprise-account');};
 const change=(index:number,field:keyof EnterpriseImportRow,value:string)=>{setRows(current=>current.map((row,i)=>i===index?{...row,[field]:value}:row));invalidate();};
 const loadFile=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(!file||lock.current)return;
  lock.current=true;setBusy(true);setRows([]);setFileName('');setPage(1);invalidate();
  try{const {parseEnterpriseImportFile}=await import('@/utils/qhdnEnterpriseImport');setRows(await parseEnterpriseImportFile(file));setFileName(file.name);}catch(error){setError(errorMessage(error));}finally{lock.current=false;setBusy(false);}
 };
 const template=async()=>{
  try{const {enterpriseImportTemplate}=await import('@/utils/qhdnEnterpriseImport');await downloadFile(async()=>new Blob([enterpriseImportTemplate()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'mau-import-doanh-nghiep.xlsx');}catch(error){setError(errorMessage(error));}
 };
 const check=async(event:FormEvent)=>{
  event.preventDefault();if(lock.current||!rows.length)return;lock.current=true;setBusy(true);setError('');
  try{
   const normalized=rows.map(row=>({...((row.code?.trim())?{code:row.code.trim().toUpperCase()}:{}),name:row.name.trim(),fullName:row.fullName.trim(),email:row.email.trim().toLowerCase()}));
   const codes=normalized.flatMap(row=>row.code?[row.code]:[]);
   if(new Set(codes).size!==codes.length||new Set(normalized.map(r=>r.email)).size!==rows.length)throw new Error('Mã doanh nghiệp và email không được trùng nhau.');
   const body=payload??{kind:'ENTERPRISE' as const,idempotencyKey:key.current,rows:normalized};
   setPayload(body);setPreview(await previewEnterpriseImport(body));setConfirmed(false);setPage(1);
  }catch(e){setError(errorMessage(e));}finally{lock.current=false;setBusy(false);}
 };
 const commit=async()=>{
  if(lock.current||!payload||!preview?.canCommit||!confirmed)return;lock.current=true;setBusy(true);setError('');
  try{setResult(await commitEnterpriseImport(payload));onImported();}catch(e){setError(errorMessage(e));}finally{lock.current=false;setBusy(false);}
 };
 if(!isOpen)return null;
 const step=result?3:preview?2:1;
 const tableRows=preview&&payload?payload.rows:rows;
 const safePage=Math.min(page,Math.max(1,Math.ceil(tableRows.length/20)));
 const rowsTable=<div className="space-y-3"><div className="max-h-[45vh] overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr>{['STT','Mã doanh nghiệp','Tên doanh nghiệp','Người phụ trách','Email nhận tài khoản'].map((label,index)=><th scope="col" key={label} className={'px-3 py-3 font-semibold '+(index===0?'w-14 text-center':'')}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{tableRows.slice((safePage-1)*20,safePage*20).map((row,index)=><tr key={row.email}><td className="px-3 py-3 text-center tabular-nums text-slate-500">{(safePage-1)*20+index+1}</td><td className="px-3 py-3 text-xs font-medium text-slate-500">{row.code||'Tự sinh khi tạo'}</td><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{row.fullName}</td><td className="break-all px-3 py-3">{row.email}</td></tr>)}</tbody></table></div><Pager page={safePage} total={tableRows.length} limit={20} busy={busy} onChange={setPage}/></div>;
 return <WorkflowModal wide title={mode==='file'?'Import danh sách doanh nghiệp':'Tạo tài khoản doanh nghiệp'} subtitle={mode==='file'?'Tạo tài khoản hàng loạt từ Excel/CSV và gửi thông tin đăng nhập đến email từng doanh nghiệp.':'Nhập trực tiếp thông tin đối tác, kiểm tra và xác nhận trước khi tạo tài khoản.'} busy={busy} onClose={onClose}>
  <ol className="mb-5 grid grid-cols-3 gap-2">{[mode==='file'?'Chọn file':'Nhập thông tin','Kiểm tra & xác nhận','Hoàn tất'].map((label,i)=><li key={label} className={'flex items-center gap-2 rounded-xl p-3 text-xs font-semibold sm:text-sm '+(step===i+1?'bg-orange-50 text-orange-700':'bg-slate-50 text-slate-500')}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">{i+1}</span>{label}</li>)}</ol>
  {error&&<div role="alert" className="mb-4"><Notice>{error}</Notice></div>}
  {result?<div className="space-y-5 py-4 text-center"><CheckCircle2 size={44} className="mx-auto text-emerald-600"/><h3 className="text-xl font-semibold text-slate-800">Đã tạo tài khoản doanh nghiệp</h3><p className="text-sm leading-relaxed text-slate-500">Đã xử lý {result.total} doanh nghiệp, tạo mới {result.created} tài khoản. Thông tin đăng nhập được đưa vào hàng chờ gửi email. Doanh nghiệp cần đổi mật khẩu trước khi cập nhật hồ sơ và đăng tuyển.</p><button type="button" className={workflowPrimary} onClick={onClose}>Hoàn tất & về danh sách</button></div>:!preview?<form onSubmit={check} className="space-y-5">
   {mode==='file'?<div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-blue-50 p-4"><p className="max-w-lg text-sm leading-relaxed text-blue-800">Mỗi dòng gồm 3 cột bắt buộc: <strong>name, fullName, email</strong>. Mã doanh nghiệp được tự động sinh khi tạo tài khoản. Email dùng để đăng nhập và nhận tài khoản. Tối đa 500 doanh nghiệp/lần, file 8 MB; chỉ đọc sheet đầu tiên.</p><button type="button" className={workflowSecondary+' whitespace-nowrap'} disabled={busy} onClick={template}><Download size={15}/>Tải file mẫu</button></div>
    <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-orange-300"><FileSpreadsheet size={30} className="text-orange-600"/><span className="text-sm font-semibold text-slate-700">Chọn file Excel (.xlsx) hoặc CSV (.csv)</span><input type="file" aria-label="Chọn file danh sách doanh nghiệp" accept=".xlsx,.csv" disabled={busy} onChange={loadFile} className="block max-w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-orange-700"/>{fileName&&<span className="break-all text-xs text-slate-600">{fileName} · {rows.length} doanh nghiệp hợp lệ</span>}{busy&&<span role="status" className="text-sm text-slate-500">Đang xử lý…</span>}</label>
    {!!rows.length&&rowsTable}
   </div>:<><p className="rounded-xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">Mã doanh nghiệp được tự động sinh khi tạo tài khoản. Bạn chỉ cần nhập tên doanh nghiệp, người phụ trách và email. Doanh nghiệp tự cập nhật hồ sơ sau khi đăng nhập và đổi mật khẩu.</p>
   <fieldset disabled={busy} className="space-y-4">{rows.map((row,index)=><section key={index} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
    <header className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><UserPlus size={18} className="text-orange-500"/>Doanh nghiệp {index+1}</h3>{rows.length>1&&<button type="button" aria-label={'Bỏ doanh nghiệp '+(index+1)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>{setRows(current=>current.filter((_,i)=>i!==index));invalidate();}}><Trash2 size={16}/></button>}</header>
    <div className="grid gap-4 sm:grid-cols-2">
     <label className="space-y-2 text-sm font-medium sm:col-span-2">Tên doanh nghiệp <span className="text-orange-600">*</span><input required maxLength={200} className={workflowInput} value={row.name} onChange={e=>change(index,'name',e.target.value)} placeholder="Nhập tên doanh nghiệp"/></label>
     <label className="space-y-2 text-sm font-medium">Tên người phụ trách <span className="text-orange-600">*</span><input required maxLength={150} className={workflowInput} value={row.fullName} onChange={e=>change(index,'fullName',e.target.value)} placeholder="Người nhận thông tin tài khoản"/></label>
     <label className="space-y-2 text-sm font-medium">Email đăng nhập <span className="text-orange-600">*</span><input required type="email" maxLength={100} className={workflowInput} value={row.email} onChange={e=>change(index,'email',e.target.value)} placeholder="Email của người phụ trách"/><span className="block text-xs font-normal text-slate-500">Thông tin đăng nhập sẽ được gửi đến email này.</span></label>
    </div>
   </section>)}<button type="button" disabled={rows.length>=500} className={workflowSecondary} onClick={()=>{setRows(current=>[...current,emptyRow()]);invalidate();}}><Plus size={16}/>Thêm doanh nghiệp</button></fieldset></>}
   <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} className={workflowSecondary} onClick={onClose}>Để sau</button><button type="submit" disabled={busy||!rows.length} className={workflowPrimary}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<CheckCircle2 size={17}/>}Kiểm tra thông tin<ArrowRight size={16}/></button></footer>
  </form>:<div className="space-y-5">
   <p className="text-sm text-slate-600">Kiểm tra {payload?.rows.length} tài khoản trước khi tạo. Tài khoản hoặc email đã tồn tại sẽ không bị ghi đè.</p>
   {rowsTable}
   {!preview.canCommit&&<Notice>{preview.errors.join(' ')||'Thông tin chưa hợp lệ. Vui lòng quay lại kiểm tra.'}</Notice>}
   <label className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-sm leading-relaxed text-slate-700"><input type="checkbox" className="mt-1 accent-orange-600" checked={confirmed} disabled={busy||!preview.canCommit} onChange={e=>setConfirmed(e.target.checked)}/><span>Tôi đã kiểm tra thông tin và đồng ý tạo tài khoản cho các doanh nghiệp trên.</span></label>
   <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} className={workflowSecondary} onClick={()=>{setPreview(null);setConfirmed(false);}}><ArrowLeft size={16}/>Sửa thông tin</button><button type="button" disabled={busy||!confirmed||!preview.canCommit} className={workflowPrimary} onClick={commit}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<UserPlus size={17}/>}Tạo tài khoản</button></footer>
  </div>}
 </WorkflowModal>;
}
