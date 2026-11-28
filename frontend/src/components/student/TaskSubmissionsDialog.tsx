import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, FileUp, Paperclip, Send, X } from 'lucide-react';
import { StudentDialog } from '@/components/student/StudentDialog';
import { buttonClass, inputClass } from '@/components/student/PortalUI';
import type { Page, TaskSubmission } from '@/types/student/portal';
import { taskAttachmentAccept, validateTaskAttachment } from '@/services/taskSubmissionService';
import { TaskSubmissionHistory } from '@/components/shared/TaskSubmissionHistory';

export function TaskSubmissionsDialog({ taskId, name, initialContent = '', load, submit, onClose, onSubmitted }: {
  taskId: number; name: string; initialContent?: string;
  load: (page: number, signal: AbortSignal) => Promise<Page<TaskSubmission>>;
  submit?: (content: string, attachment?: File) => Promise<unknown>; onClose: () => void; onSubmitted?: () => void;
}) {
  const [historyRevision, setHistoryRevision] = useState(0);
  const [content, setContent] = useState(initialContent || `Đã hoàn thành các hạng mục chính của nhiệm vụ “${name}”. Em đã kiểm tra lại kết quả, xử lý các lỗi phát sinh và cập nhật tài liệu hướng dẫn để người phụ trách có thể rà soát.`);
  const [attachment, setAttachment] = useState<File>();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submit || lock.current) return;
    if (!content.trim() && !attachment) { setError('Vui lòng nhập nội dung hoặc chọn file bài làm.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      await submit(content.trim(), attachment);
      setContent(''); setAttachment(undefined);
      if (fileInput.current) fileInput.current.value = '';
      if (onSubmitted) onSubmitted(); else setHistoryRevision(value => value + 1);
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Không nộp được nhiệm vụ. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <StudentDialog title={submit ? 'Nộp nhiệm vụ' : 'Bài nộp của sinh viên'} onClose={onClose} busy={busy} wide>
    <div className="space-y-5">
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50/70 to-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100"><FileUp size={22} /></span>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-orange-700">{submit ? 'Bài tập thực tập' : 'Lịch sử bài nộp'}</p><p className="mt-1 break-words text-base font-bold leading-snug text-slate-900 sm:text-lg">{name}</p><p className="mt-1 text-sm text-slate-600">{submit ? 'Gửi nội dung và tài liệu để doanh nghiệp xem xét.' : 'Xem lại các lần bạn đã gửi bài.'}</p></div>
        </div>
      </div>
      {submit && <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2 text-sm font-semibold text-slate-800"><span>Nội dung bài làm <span className="font-normal text-slate-500">(không bắt buộc nếu có file)</span></span>
          <textarea autoComplete="off" disabled={busy} rows={5} maxLength={10000} value={content} onChange={event => setContent(event.target.value)} className={`${inputClass} min-h-36 resize-y rounded-2xl border-slate-200 bg-slate-50/60 p-4 leading-relaxed focus:bg-white`} placeholder="Tóm tắt kết quả đã thực hiện hoặc dán đường dẫn GitHub, tài liệu, thư mục bài làm..." />
          <span className="block text-right text-xs font-normal text-slate-400">{content.length.toLocaleString()} / 10.000 ký tự</span>
        </label>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:p-5">
          <label className="block space-y-3 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Paperclip size={17} className="text-orange-600" /> Tài liệu đính kèm</span>
            <input ref={fileInput} type="file" accept={taskAttachmentAccept} disabled={busy} className="block w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-orange-100 file:px-4 file:py-3 file:font-semibold file:text-orange-800 hover:file:bg-orange-200" onChange={event => {
              const file = event.target.files?.[0]; setError(''); setAttachment(undefined);
              if (!file) return;
              try { validateTaskAttachment(file); setAttachment(file); }
              catch (err) { event.target.value = ''; setError(err instanceof Error ? err.message : 'File không hợp lệ.'); }
            }} />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">Tối đa 10 MB · PDF, Word, Excel, PowerPoint, ZIP, PNG, JPG hoặc TXT. Có thể gửi file riêng hoặc kèm nội dung.</p>
          {attachment && <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><CheckCircle2 size={17} className="shrink-0" /><span className="min-w-0 flex-1 break-all font-medium">{attachment.name}<span className="ml-2 font-normal text-emerald-700">{Math.max(1, Math.ceil(attachment.size / 1024))} KB</span></span><button type="button" disabled={busy} aria-label="Bỏ file đính kèm" className="shrink-0 rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100" onClick={() => { setAttachment(undefined); if (fileInput.current) fileInput.current.value = ''; }}><X size={16} /></button></div>}
        </div>
        <p className="rounded-xl bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-800">Đảm bảo doanh nghiệp có quyền truy cập các đường dẫn. Bài nộp sẽ được lưu vào lịch sử sau khi gửi thành công.</p>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Để sau</button><button type="submit" disabled={busy || (!content.trim() && !attachment)} className={buttonClass + ' inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5'}><Send size={16} />{busy ? 'Đang gửi...' : 'Gửi bài cho doanh nghiệp'}</button></div>
      </form>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <TaskSubmissionHistory key={`${taskId}:${historyRevision}`} taskId={taskId} load={load} />
      </div>
    </div>
  </StudentDialog>;
}
