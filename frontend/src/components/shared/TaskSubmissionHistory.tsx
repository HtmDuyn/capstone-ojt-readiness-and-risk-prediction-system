import { useRef, useState } from 'react';
import { Download, Paperclip } from 'lucide-react';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { dateText, Empty, Pagination, ResourceState } from '@/components/student/PortalUI';
import { downloadTaskSubmissionAttachment } from '@/services/taskSubmissionService';
import type { Page, TaskSubmission } from '@/types/student/portal';

export function TaskSubmissionHistory({ taskId, load, emptyAttachmentMessage }: {
  taskId: number;
  load: (page: number, signal: AbortSignal) => Promise<Page<TaskSubmission>>;
  emptyAttachmentMessage?: string;
}) {
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const downloadLock = useRef(false);
  const history = useStudentResource('task-submissions:' + taskId + ':' + page, signal => load(page, signal));

  async function download(item: TaskSubmission) {
    if (downloadLock.current) return;
    downloadLock.current = true; setDownloading(item.id); setError('');
    try { await downloadTaskSubmissionAttachment(item); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không tải được file bài nộp.'); }
    finally { downloadLock.current = false; setDownloading(null); }
  }

  return <div className="min-w-0 space-y-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold text-slate-800">Lịch sử nộp bài{history.data ? ` (${history.data.total})` : ''}</h3>
      <button type="button" disabled={history.pending} onClick={history.reload} className="rounded-lg px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50">Cập nhật bài nộp</button>
    </div>
    <ResourceState loading={history.loading} error={history.error} retry={history.reload} />
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!history.loading && !history.error && !history.data?.items.length && <>
      <Empty>Chưa có bài nộp cho nhiệm vụ này.</Empty>
      {emptyAttachmentMessage && <div className="rounded-lg bg-slate-50 p-3">
        <p className="mb-1 text-xs font-semibold text-slate-500">File bài làm</p>
        <p className="text-xs text-slate-500">{emptyAttachmentMessage}</p>
      </div>}
    </>}
    {history.data?.items.map((item, index) => <article key={item.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Nộp lúc {dateText(item.submittedAt)}</span>
        {page === 1 && index === 0 && <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">Bài nộp mới nhất</span>}
        <span className={`rounded-full px-2 py-0.5 font-medium ${item.isLate ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.isLate ? 'Nộp sau hạn' : 'Đúng hạn'}</span>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-slate-500">Nội dung bài làm</p>
        <p className="whitespace-pre-wrap break-words text-slate-700">{item.content || 'Sinh viên không nhập nội dung bài làm.'}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">File bài làm</p>
        {item.attachment ? <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/50 p-3">
          <Paperclip size={17} className="shrink-0 text-orange-600" />
          <span className="min-w-0 flex-1 break-all text-slate-800">{item.attachment.fileName}<span className="ml-2 text-xs text-slate-500">{Math.max(1, Math.ceil(item.attachment.size / 1024))} KB</span></span>
          <button type="button" disabled={downloading !== null} onClick={() => void download(item)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"><Download size={16} />{downloading === item.id ? 'Đang tải...' : 'Tải về'}</button>
        </div> : <p className="text-xs text-slate-500">{emptyAttachmentMessage || 'Bài nộp này không có file đính kèm.'}</p>}
      </div>
    </article>)}
    {history.data && history.data.total > history.data.limit && <Pagination page={page} total={history.data.total} onChange={setPage} disabled={history.pending || downloading !== null} />}
  </div>;
}
