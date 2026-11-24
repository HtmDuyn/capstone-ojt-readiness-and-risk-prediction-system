import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { getAssignedTasks, getTaskSubmissions, submitAssignedTask } from '@/services/studentService';
import type { Task } from '@/types/student/portal';
import { TaskSubmissionsDialog } from '@/components/student/TaskSubmissionsDialog';
import { displayTaskTime } from '@/utils/shared/taskTime';
import { buttonClass, Card, dateText, Empty, inputClass, Pagination, ResourceState, statusText, StudentPage } from '@/components/student/PortalUI';

function ProgressContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [message, setMessage] = useState('');
  const tasks = useStudentResource(semesterId ? `assigned-tasks:${profile!.id}:${semesterId}:${revision}:${page}` : null,
    signal => getAssignedTasks(semesterId!, page, signal));
  const taskPage = tasks.data ?? { items: [], total: 0 };
  const reload = useRef(tasks.reload);
  reload.current = tasks.reload;
  // Pick up newly assigned tasks when returning to the tab and while it is visible.
  // Keep the submission form intact while the student is writing.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !selectedTask) reload.current(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [selectedTask]);
  const query = search.trim().toLocaleLowerCase();
  const columns = useMemo(() => {
    const groups: Record<'TODO' | 'IN_PROGRESS' | 'DONE', Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of tasks.data?.items ?? []) {
      if (!(task.name + ' ' + (task.description ?? '')).toLocaleLowerCase().includes(query)) continue;
      const status = task.status.toUpperCase();
      const column = status === 'DONE' || status === 'COMPLETED' ? 'DONE' : status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO';
      groups[column].push(task);
    }
    return Object.entries(groups);
  }, [tasks.data?.items, query]);
  return <>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    <Card title="Nhiệm vụ được doanh nghiệp giao">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className={inputClass} aria-label="Tìm nhiệm vụ trong trang" placeholder="Tìm nhiệm vụ trong trang hiện tại..." value={search} onChange={event => setSearch(event.target.value)} />
        <button type="button" disabled={tasks.loading || !semesterId} title={!semesterId ? 'Cần có đợt OJT để cập nhật nhiệm vụ' : undefined} onClick={tasks.reload} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={16} />Cập nhật nhiệm vụ</button>
      </div>
      <ResourceState loading={tasks.loading} error={tasks.error} retry={tasks.reload} />
      <>
        {!tasks.loading && !tasks.error && columns.every(([, items]) => items.length === 0) && <Empty>{!semesterId ? 'Chưa có nhiệm vụ vì bạn chưa được liên kết với đợt OJT. Các nhiệm vụ sẽ hiển thị theo trạng thái bên dưới khi được giao.' : search ? 'Không có nhiệm vụ phù hợp trong trang này.' : 'Bạn chưa được doanh nghiệp giao nhiệm vụ trong đợt này.'}</Empty>}
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map(([status, items]) => {
            return <section key={status} className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <h3 className="font-bold text-slate-700">{statusText(status)} ({items.length})</h3>
              {!items.length && <p className="py-4 text-sm text-slate-400">{tasks.loading ? 'Đang tải nhiệm vụ…' : 'Chưa có nhiệm vụ'}</p>}
              {items.map(task => <article key={task.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <h4 className="font-bold text-slate-900">{task.name}</h4>
                {task.company?.name && <p className="text-xs text-slate-500">{task.company.name}</p>}
                <p className="whitespace-pre-wrap break-words text-slate-600">{task.description}</p>
                <div className="space-y-1 text-xs text-slate-500"><p>Ngày giao: {displayTaskTime(task.assignedAt ?? task.assignedDate)}</p><p>Hạn nộp: {displayTaskTime(task.dueAt ?? task.dueDate)}</p></div>
                {task.latestSubmission && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">Đã nộp {dateText(task.latestSubmission.submittedAt)}{task.latestSubmission.isLate ? ' · Sau hạn' : ''}</p>}
                <button type="button" className={task.canSubmit ? buttonClass : 'text-sm font-semibold text-orange-600 underline'} onClick={() => { setMessage(''); setSelectedTask(task); }}>{task.canSubmit ? (task.latestSubmission ? 'Nộp lại / xem bài đã nộp' : 'Nộp nhiệm vụ') : 'Xem bài đã nộp'}</button>
              </article>)}
            </section>;
          })}
        </div>
        <Pagination page={page} total={taskPage.total} onChange={setPage} disabled={tasks.loading || !semesterId} />
      </>
      <p className="text-xs text-slate-500">Danh sách tự cập nhật mỗi 30 giây khi bạn đang xem trang. Nộp bài không tự xác nhận hoàn thành; trạng thái do doanh nghiệp cập nhật.</p>
    </Card>
    {selectedTask && <TaskSubmissionsDialog taskId={selectedTask.id} name={selectedTask.name} initialContent={selectedTask.latestSubmission?.content}
      load={(historyPage, signal) => getTaskSubmissions(selectedTask.id, historyPage, signal)}
      submit={selectedTask.canSubmit ? content => submitAssignedTask(selectedTask.id, content) : undefined}
      onClose={() => setSelectedTask(null)} onSubmitted={() => { setSelectedTask(null); setMessage('Đã gửi bài nộp cho doanh nghiệp.'); tasks.reload(); }} />}
  </>;
}
export default function StudentOJTProgress() {
  const { profile, semesterId, loading } = useStudentPortal();
  return <StudentPage title="Nhiệm vụ thực tập" description="Nhận nhiệm vụ từ doanh nghiệp, nộp bài làm và theo dõi phản hồi.">
    {!loading && profile && <ProgressContent key={`${profile.id}:${semesterId}`} />}
  </StudentPage>;
}
