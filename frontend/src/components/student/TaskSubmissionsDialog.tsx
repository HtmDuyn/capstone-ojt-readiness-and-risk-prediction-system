import { useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useStudentResource } from '@/hooks/useStudentResource';
import { StudentDialog } from '@/components/student/StudentDialog';
import { buttonClass, dateText, Empty, inputClass, Pagination, ResourceState } from '@/components/student/PortalUI';
import type { Page, TaskSubmission } from '@/types/student/portal';

export function TaskSubmissionsDialog({ taskId, name, initialContent = '', load, submit, onClose, onSubmitted }: {
  taskId: number; name: string; initialContent?: string;
  load: (page: number, signal: AbortSignal) => Promise<Page<TaskSubmission>>;
  submit?: (content: string) => Promise<unknown>; onClose: () => void; onSubmitted?: () => void;
}) {
  const [page, setPage] = useState(1);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const history = useStudentResource('task-submissions:' + taskId + ':' + page, signal => load(page, signal));
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submit || lock.current) return;
    if (!content.trim()) { setError('Vui lòng nhập nội dung bài làm.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { await submit(content.trim()); onSubmitted?.(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không nộp được nhiệm vụ. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <StudentDialog title={submit ? 'Nộp nhiệm vụ' : 'Bài nộp của sinh viên'} onClose={onClose} busy={busy}>
    <div className="space-y-5">
      <p className="font-semibold text-slate-800">{name}</p>
      {submit && <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-2 text-sm font-medium">Nội dung và đường dẫn bài làm
          <textarea required autoComplete="off" disabled={busy} rows={6} maxLength={10000} value={content} onChange={event => setContent(event.target.value)} className={inputClass} placeholder="Mô tả kết quả đã thực hiện. Dán link GitHub, tài liệu hoặc thư mục bài làm tại đây..." />
        </label>
        <p className="text-xs text-slate-500">Đảm bảo doanh nghiệp có quyền xem các đường dẫn. Mỗi nội dung nộp mới được lưu vào lịch sử; doanh nghiệp xác nhận trạng thái hoàn thành.</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end"><button type="submit" disabled={busy || !content.trim()} className={buttonClass + ' inline-flex items-center gap-2'}><Send size={16} />{busy ? 'Đang gửi...' : 'Gửi bài cho doanh nghiệp'}</button></div>
      </form>}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="font-semibold">Lịch sử nộp bài</h3>
        <ResourceState loading={history.loading} error={history.error} retry={history.reload} />
        {!history.loading && !history.error && !history.data?.items.length && <Empty>Chưa có bài nộp cho nhiệm vụ này.</Empty>}
        {history.data?.items.map(item => <article key={item.id} className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-xs text-slate-500">{dateText(item.submittedAt)}{item.isLate && <span className="ml-2 font-semibold text-amber-700">Nộp sau hạn</span>}</p>
          <p className="whitespace-pre-wrap break-words text-slate-700">{item.content}</p>
        </article>)}
        {history.data && history.data.total > 20 && <Pagination page={page} total={history.data.total} onChange={setPage} disabled={history.loading || busy} />}
      </div>
    </div>
  </StudentDialog>;
}
