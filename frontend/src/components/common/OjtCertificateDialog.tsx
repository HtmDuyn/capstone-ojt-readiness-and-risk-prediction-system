import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileCheck2, Loader2, Upload } from 'lucide-react';
import { StudentDialog } from '@/components/student/StudentDialog';
import { dateText } from '@/components/student/PortalUI';
import { OjtCertificatePreviewDialog } from '@/components/common/OjtCertificatePreviewDialog';
import { downloadOjtCertificate, getOjtCertificate, uploadOjtCertificate, type OjtCertificate } from '@/services/ojtCertificateService';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

const primary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export function OjtCertificatePanel({assignmentId,studentName,onClose,disabled=false,readOnly=false,compact=false,onBusyChange}:{assignmentId:number;studentName?:string;onClose?:()=>void;disabled?:boolean;readOnly?:boolean;compact?:boolean;onBusyChange?:(busy:boolean)=>void}) {
  const [certificate,setCertificate] = useState<OjtCertificate|null>(null);
  const [file,setFile] = useState<File|null>(null);
  const [loading,setLoading] = useState(true);
  const [ready,setReady] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [retry,setRetry] = useState(0);
  const [viewingCertificate,setViewingCertificate] = useState<OjtCertificate|null>(null);
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(()=>{
    const controller = new AbortController();
    setLoading(true);setReady(false);setError('');
    getOjtCertificate(assignmentId,controller.signal).then(value=>{
      if(!controller.signal.aborted){setCertificate(value);setReady(true);}
    }).catch(e=>{if(!controller.signal.aborted)setError(friendlyErrorMessage(e,'Không tải được chứng chỉ.'));})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[assignmentId,retry]);
  const upload = async () => {
    if(readOnly||!file||!ready||loading||disabled||lock.current)return;
    lock.current=true;setBusy(true);onBusyChange?.(true);setError('');setMessage('');
    try {
      const saved = await uploadOjtCertificate(assignmentId,file);
      setCertificate(saved);setFile(null);
      if(input.current)input.current.value='';
      setMessage('Đã lưu chứng chỉ hoàn thành OJT.');
    } catch(e) {setError(friendlyErrorMessage(e,'Không tải được chứng chỉ lên.'));}
    finally {lock.current=false;setBusy(false);onBusyChange?.(false);}
  };
  const download = async () => {
    if(!certificate||disabled||lock.current)return;
    lock.current=true;setBusy(true);onBusyChange?.(true);setError('');
    try{await downloadOjtCertificate(certificate);}catch(e){setError(friendlyErrorMessage(e,'Không tải được chứng chỉ.'));}
    finally{lock.current=false;setBusy(false);onBusyChange?.(false);}
  };
  return <fieldset disabled={disabled} className="min-w-0 space-y-2.5">
      {!studentName&&<legend className="mb-1 text-sm font-semibold text-slate-800">Chứng chỉ hoàn thành OJT <span className="font-normal text-slate-500">(không bắt buộc)</span></legend>}
      {studentName&&<p className="break-words text-sm font-semibold text-slate-800">{studentName}</p>}
      {!readOnly&&!compact&&<p className="text-xs leading-relaxed text-slate-500">Sinh viên xem và tải chứng chỉ sau khi QHDN công bố kết quả OJT.</p>}
      {loading?<p role="status" className="text-xs text-slate-500">Đang tải chứng chỉ…</p>:certificate?<div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2"><FileCheck2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true"/><div className="min-w-0"><p className="break-all text-sm font-medium text-slate-900">{certificate.fileName}</p><p className="mt-0.5 text-xs text-slate-500">{(certificate.size/1024/1024).toFixed(2)} MB · {dateText(certificate.uploadedAt)} · {certificate.uploadedRole==='ENTERPRISE'?'Doanh nghiệp':certificate.uploadedRole==='OJT_COORD'?'Phòng QHDN':'Quản trị viên'}</p></div></div>
        {readOnly
          ? <button type="button" className="inline-flex shrink-0 items-center gap-1.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50" disabled={busy} onClick={()=>setViewingCertificate(certificate)}><Eye size={14}/>Xem</button>
          : <button type="button" className="inline-flex shrink-0 items-center gap-1.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50" disabled={busy} onClick={()=>void download()}><Download size={14}/>Tải về</button>}
      </div>:!error&&<p className="text-xs text-slate-400">Chưa có chứng chỉ.</p>}
      {!readOnly&&<div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" tabIndex={-1} aria-label="Chọn chứng chỉ hoàn thành OJT" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" disabled={busy||loading||!ready} onChange={e=>{setFile(e.target.files?.[0]??null);setMessage('');}} className="sr-only"/>
        <button type="button" className={secondary} disabled={busy||loading||!ready} onClick={()=>input.current?.click()}><Upload size={14}/>{certificate?'Chọn tệp thay thế':'Chọn tệp'}</button>
        <span className={'min-w-0 flex-1 basis-32 text-xs text-slate-500'+(file?' truncate':'')} title={file?.name}>{file?.name??'PDF, JPG, PNG · Tối đa 10 MB'}</span>
        <button type="button" onClick={()=>void upload()} className={primary+' ml-auto'} disabled={!file||busy||loading||!ready}>{busy?<Loader2 size={14} className="animate-spin"/>:<Upload size={14}/>} {busy?'Đang xử lý…':certificate?'Thay chứng chỉ':'Lưu chứng chỉ'}</button>
      </div>}
      {!readOnly&&certificate&&file&&<p className="text-xs text-slate-500">Tệp mới sẽ thay thế chứng chỉ hiện tại. PDF, JPG, PNG · Tối đa 10 MB.</p>}
      {error&&<div role="alert" className="text-xs text-rose-700">{error}{!file&&<button type="button" className="ml-2 underline" onClick={()=>setRetry(v=>v+1)} disabled={busy}>Thử lại</button>}</div>}
      {message&&<p role="status" className="text-xs text-emerald-700">{message}</p>}
      {onClose&&<div className="flex justify-end pt-1"><button type="button" className={secondary} disabled={busy} onClick={onClose}>Đóng</button></div>}
      {viewingCertificate&&<OjtCertificatePreviewDialog certificate={viewingCertificate} onClose={()=>setViewingCertificate(null)}/>}
    </fieldset>;
}

export function OjtCertificateDialog({assignmentId,studentName,onClose}:{assignmentId:number;studentName:string;onClose:()=>void}) {
  const [busy,setBusy] = useState(false);
  return <StudentDialog title="Chứng chỉ hoàn thành OJT" onClose={onClose} busy={busy}>
    <OjtCertificatePanel assignmentId={assignmentId} studentName={studentName} onClose={onClose} onBusyChange={setBusy}/>
  </StudentDialog>;
}
