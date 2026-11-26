import { useEffect, useState } from 'react';
import { StudentDialog } from '@/components/student/StudentDialog';
import { getOjtCertificateFile, type OjtCertificate } from '@/services/ojtCertificateService';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

export function OjtCertificatePreviewDialog({certificate,student=false,onClose}:{certificate:OjtCertificate;student?:boolean;onClose:()=>void}) {
  const [preview,setPreview] = useState<{url:string;type:string}|null>(null);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setPreview(null);setError('');
    getOjtCertificateFile(certificate,student,controller.signal).then(blob=>{
      if(controller.signal.aborted)return;
      if(!['application/pdf','image/jpeg','image/png'].includes(blob.type))throw new Error('Định dạng chứng chỉ không hỗ trợ xem trực tiếp.');
      objectUrl=URL.createObjectURL(blob);
      setPreview({url:objectUrl,type:blob.type});
    }).catch(e=>{
      if(!controller.signal.aborted)setError(friendlyErrorMessage(e,'Không xem được chứng chỉ. Vui lòng thử lại.'));
    });
    return ()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[certificate,student,retry]);
  return <StudentDialog title="Xem chứng chỉ" onClose={onClose}>
    <p className="mb-4 break-all text-sm font-medium text-slate-700">{certificate.fileName}</p>
    {error?<div role="alert" className="py-6 text-sm text-rose-700">{error}<button type="button" className="ml-2 font-medium underline" onClick={()=>setRetry(value=>value+1)}>Thử lại</button></div>
      :!preview?<p role="status" className="py-12 text-center text-sm text-slate-500">Đang tải chứng chỉ…</p>
      :preview.type==='application/pdf'?<iframe title={`Chứng chỉ ${certificate.fileName}`} src={preview.url} className="h-[65dvh] min-h-64 w-full rounded-lg border border-slate-200"/>
      :<div className="flex max-h-[65dvh] justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2"><img src={preview.url} alt={`Chứng chỉ ${certificate.fileName}`} className="max-h-[62dvh] max-w-full object-contain"/></div>}
  </StudentDialog>;
}
