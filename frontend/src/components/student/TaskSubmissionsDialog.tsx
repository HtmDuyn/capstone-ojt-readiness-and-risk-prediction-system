import { useRef, useState, type FormEvent } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
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
  const [content, setContent] = useState(initialContent);
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
  return <StudentDialog title={submit ? 'Nộp nhiệm vụ' : 'Bài nộp của sinh viên'} onClose={onClose} busy={busy}>
    <div className="space-y-5">
      <p className="font-semibold text-slate-800">{name}</p>
      {submit && <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-2 text-sm font-medium">Nội dung và đường dẫn bài làm
          <textarea autoComplete="off" disabled={busy} rows={6} maxLength={10000} value={content} onChange={event => setContent(event.target.value)} className={inputClass} placeholder="Mô tả kết quả đã thực hiện. Dán link GitHub, tài liệu hoặc thư mục bài làm tại đây..." />
        </label>
        <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <label className="block space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><Paperclip size={16} />File bài làm</span>
            <input ref={fileInput} type="file" accept={taskAttachmentAccept} disabled={busy} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-orange-800" onChange={event => {
              const file = event.target.files?.[0]; setError(''); setAttachment(undefined);
              if (!file) return;
              try { validateTaskAttachment(file); setAttachment(file); }
              catch (err) { event.target.value = ''; setError(err instanceof Error ? err.message : 'File không hợp lệ.'); }
            }} />
          </label>
          <p className="text-xs text-slate-500">Một file tối đa 10 MB: PDF, Word, Excel, PowerPoint, ZIP, PNG, JPG hoặc TXT. Có thể nộp riêng file hoặc kèm nội dung.</p>
          {attachment && <div className="flex min-w-0 items-center gap-2 text-sm"><span className="min-w-0 flex-1 break-all">{attachment.name} · {Math.max(1, Math.ceil(attachment.size / 1024))} KB</span><button type="button" disabled={busy} aria-label="Bỏ file đính kèm" className="shrink-0 rounded p-1 text-slate-500 hover:text-red-600" onClick={() => { setAttachment(undefined); if (fileInput.current) fileInput.current.value = ''; }}><X size={16} /></button></div>}
        </div>
        <p className="text-xs text-slate-500">Đảm bảo doanh nghiệp có quyền xem các đường dẫn. Bài nộp được lưu vào lịch sử và nhiệm vụ chuyển sang hoàn thành khi gửi thành công.</p>
        <div className="flex justify-end"><button type="submit" disabled={busy || (!content.trim() && !attachment)} className={buttonClass + ' inline-flex items-center gap-2'}><Send size={16} />{busy ? 'Đang gửi...' : 'Gửi bài cho doanh nghiệp'}</button></div>
      </form>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <TaskSubmissionHistory key={`${taskId}:${historyRevision}`} taskId={taskId} load={load} />
      </div>
    </div>
  </StudentDialog>;
}
