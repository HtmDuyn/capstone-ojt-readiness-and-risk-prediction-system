import { useEffect, useRef, useState } from 'react';
import { Download, FileCheck2, Loader2, Upload } from 'lucide-react';
import { StudentDialog } from '@/components/student/StudentDialog';
import { dateText } from '@/components/student/PortalUI';
import { downloadOjtCertificate, getOjtCertificate, uploadOjtCertificate, type OjtCertificate } from '@/services/ojtCertificateService';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50';

export function OjtCertificatePanel({assignmentId,studentName,onClose,disabled=false,onBusyChange}:{assignmentId:number;studentName?:string;onClose?:()=>void;disabled?:boolean;onBusyChange?:(busy:boolean)=>void}) {
  const [certificate,setCertificate] = useState<OjtCertificate|null>(null);
  const [file,setFile] = useState<File|null>(null);
  const [loading,setLoading] = useState(true);
  const [ready,setReady] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [retry,setRetry] = useState(0);
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
    if(!file||!ready||loading||disabled||lock.current)return;
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
  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
      {!studentName&&<legend className="mb-3 text-sm font-semibold text-slate-800">Chứng chỉ hoàn thành OJT <span className="font-normal text-slate-500">(không bắt buộc)</span></legend>}
      {studentName&&<p className="break-words text-sm font-semibold text-slate-800">{studentName}</p>}
      <p className="text-sm leading-relaxed text-slate-500">Chứng chỉ gắn với đợt thực tập của sinh viên. Sinh viên xem và tải được sau khi QHDN công bố kết quả OJT.</p>
      {loading?<p role="status" className="text-sm text-slate-500">Đang tải chứng chỉ…</p>:certificate?<div className="flex flex-wrap items-start justify-between gap-3 border-y border-slate-200 py-4">
        <div className="flex min-w-0 gap-2.5"><FileCheck2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true"/><div className="min-w-0"><p className="break-all text-sm font-medium text-slate-900">{certificate.fileName}</p><p className="mt-1 text-xs text-slate-500">{(certificate.size/1024/1024).toFixed(2)} MB · {dateText(certificate.uploadedAt)}</p><p className="mt-1 text-xs text-slate-500">Tải lên bởi {certificate.uploadedRole==='ENTERPRISE'?'Doanh nghiệp':certificate.uploadedRole==='OJT_COORD'?'Phòng QHDN':'Quản trị viên'}</p></div></div>
        <button type="button" className={secondary} disabled={busy} onClick={()=>void download()}><Download size={15}/>Tải về</button>
      </div>:!error&&<p className="border-y border-slate-200 py-4 text-sm text-slate-500">Chưa có chứng chỉ cho đợt thực tập này.</p>}
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>{certificate?'Thay chứng chỉ':'Tải chứng chỉ lên'}</span>
        <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" disabled={busy||loading||!ready} onChange={e=>{setFile(e.target.files?.[0]??null);setMessage('');}} className="block w-full min-w-0 rounded-xl border border-slate-200 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:font-semibold file:text-orange-700 disabled:opacity-50"/>
        <span className="block text-xs font-normal text-slate-500">PDF, JPG hoặc PNG · Tối đa 10 MB.{certificate?' File mới sẽ thay thế chứng chỉ hiện tại.':''}</span>
      </label>
      {error&&<div role="alert" className="text-sm text-rose-700">{error}{!file&&<button type="button" className="ml-2 underline" onClick={()=>setRetry(v=>v+1)} disabled={busy}>Thử lại</button>}</div>}
      {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        {onClose&&<button type="button" className={secondary} disabled={busy} onClick={onClose}>Đóng</button>}
        <button type="button" onClick={()=>void upload()} className={primary} disabled={!file||busy||loading||!ready}>{busy?<Loader2 size={16} className="animate-spin"/>:<Upload size={16}/>} {busy?'Đang xử lý…':certificate?'Thay chứng chỉ':'Lưu chứng chỉ'}</button>
      </div>
    </fieldset>;
}

export function OjtCertificateDialog({assignmentId,studentName,onClose}:{assignmentId:number;studentName:string;onClose:()=>void}) {
  const [busy,setBusy] = useState(false);
  return <StudentDialog title="Chứng chỉ hoàn thành OJT" onClose={onClose} busy={busy}>
    <OjtCertificatePanel assignmentId={assignmentId} studentName={studentName} onClose={onClose} onBusyChange={setBusy}/>
  </StudentDialog>;
}
