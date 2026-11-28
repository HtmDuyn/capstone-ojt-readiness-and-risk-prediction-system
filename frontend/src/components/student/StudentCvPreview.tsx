import { useEffect, useState } from 'react';
import { ExternalLink, Eye, LoaderCircle, RefreshCw } from 'lucide-react';
import { API } from '@/services/studentService';
import type { CV } from '@/types/student/portal';
import { WorkflowModal } from '@/components/qhdn/StudentWorkflowUi';

export function StudentCvPreview({ studentId, cv }: { studentId: number; cv: CV }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setUrl('');
    setError('');
    if (!open) return;
    const controller = new AbortController();
    let objectUrl = '';
    setLoading(true);
    void API.get<Blob>(`/students/${studentId}/cv`, {
      params: { cvFileId: cv.id }, responseType: 'blob', signal: controller.signal,
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      setUrl(objectUrl);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Không thể tải bản xem CV. Vui lòng thử lại hoặc chọn “Tải CV”.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, studentId, cv.id, revision]);
  const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  return <section aria-label="Xem CV của tôi" className="space-y-4 border-t border-slate-100 pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0"><h3 className="text-base font-semibold text-slate-800">Xem CV của tôi</h3><p className="mt-1 break-words text-sm text-slate-500">{cv.fileName}</p></div>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} className={button} onClick={() => setOpen(true)}><Eye size={17} aria-hidden="true" />Xem CV</button>
    </div>
    {open && <WorkflowModal title="CV của tôi" subtitle={cv.fileName} fullscreen onClose={() => setOpen(false)}
      headerActions={url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500"><ExternalLink size={14} aria-hidden="true" /><span className="hidden sm:inline">Mở tab mới</span><span className="sr-only sm:hidden">Mở CV trong tab mới</span></a>}>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
      {loading && <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-12 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" />Đang tải CV…</p>}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-2 inline-flex items-center gap-2 rounded font-semibold focus-visible:ring-2 focus-visible:ring-rose-500"><RefreshCw size={15} aria-hidden="true" />Thử lại</button></div>}
      {url && <><iframe title={`CV của tôi: ${cv.fileName}`} src={`${url}#view=Fit&navpanes=0`} className="min-h-0 w-full flex-1 rounded-lg border border-slate-200 bg-slate-100" /><p className="shrink-0 text-xs leading-5 text-slate-500">Bạn có thể phóng to trong trình xem PDF. Nếu CV không hiển thị trên thiết bị, chọn “Mở CV trong tab mới” hoặc “Tải CV”.</p></>}
      </div>
    </WorkflowModal>}
  </section>;
}
