import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Search,
  Send,
  Upload,
} from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { getAssignedTasks, submitAssignedTask } from '@/services/studentService';
import type { Task } from '@/types/student/portal';
import { StudentBanner } from '@/components/student/StudentBanner';
import { StudentDialog } from '@/components/student/StudentDialog';
import { TaskSubmissionsDialog } from '@/components/student/TaskSubmissionsDialog';
import { displayTaskTime } from '@/utils/shared/taskTime';
import { buttonClass, dateText, Empty, Pagination, ResourceState, statusText } from '@/components/student/PortalUI';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
type TaskFilter = 'ALL' | TaskStatus;

const filters: { value: TaskFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'TODO', label: 'Chưa thực hiện' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'DONE', label: 'Hoàn thành' },
];

function taskStatus(task: Task): TaskStatus {
  const status = task.status.toUpperCase();
  return status === 'DONE' || status === 'COMPLETED'
    ? 'DONE'
    : status === 'IN_PROGRESS'
      ? 'IN_PROGRESS'
      : 'TODO';
}

function statusStyle(status: TaskStatus) {
  if (status === 'DONE') return 'bg-emerald-50 text-emerald-700';
  if (status === 'IN_PROGRESS') return 'bg-orange-50 text-orange-700';
  return 'bg-slate-100 text-slate-600';
}

function deadlineNotice(task: Task) {
  if (taskStatus(task) === 'DONE') return null;
  const due = task.dueAt ?? task.dueDate;
  if (!due) return null;
  const timeLeft = new Date(due).getTime() - Date.now();
  if (!Number.isFinite(timeLeft)) return null;
  if (timeLeft < 0) return { label: 'Quá hạn', style: 'bg-red-50 text-red-700' };
  if (timeLeft <= 3 * 24 * 60 * 60 * 1000)
    return { label: 'Sắp đến hạn', style: 'bg-orange-50 text-orange-700' };
  return null;
}

function ProgressContent({ onMessage }: { onMessage: (message: string) => void }) {
  const { profile, semesterId, revision } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasks = useStudentResource(
    semesterId ? `assigned-tasks:${profile!.id}:${semesterId}:${revision}:${page}` : null,
    signal => getAssignedTasks(semesterId!, page, signal),
  );
  const taskPage = tasks.data ?? { items: [], total: 0 };
  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return taskPage.items.filter(task => {
      const matchesSearch = (task.name + ' ' + (task.description ?? '')).toLocaleLowerCase().includes(query);
      return matchesSearch && (filter === 'ALL' || taskStatus(task) === filter);
    });
  }, [taskPage.items, search, filter]);
  const counts = useMemo(() => {
    const values: Record<TaskFilter, number> = { ALL: taskPage.items.length, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const task of taskPage.items) values[taskStatus(task)] += 1;
    return values;
  }, [taskPage.items]);

  useEffect(() => {
    if (!visibleTasks.length) {
      setSelectedTaskId(null);
    } else if (!visibleTasks.some(task => task.id === selectedTaskId)) {
      setSelectedTaskId(visibleTasks[0].id);
    }
  }, [visibleTasks, selectedTaskId]);

  const activeTask = visibleTasks.find(task => task.id === selectedTaskId) ?? visibleTasks[0] ?? null;
  const dueNotice = activeTask ? deadlineNotice(activeTask) : null;

  return (
    <>
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(19rem,0.92fr)_minmax(0,1.08fr)]">
        <section className="flex min-h-[34rem] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Danh sách nhiệm vụ">
          <div className="relative">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Tìm nhiệm vụ"
              placeholder="Tìm nhiệm vụ"
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Lọc nhiệm vụ theo trạng thái">
            {filters.map(item => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  filter === item.value
                    ? 'border-orange-100 bg-orange-100 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-700'
                }`}
              >
                {item.label} <span className="ml-1 tabular-nums opacity-70">{counts[item.value]}</span>
              </button>
            ))}
          </div>

          <ResourceState loading={tasks.loading} error={tasks.error} retry={tasks.reload} />
          {tasks.loading && !taskPage.items.length ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Đang tải nhiệm vụ…</div>
          ) : tasks.error ? null : !visibleTasks.length ? (
            <div className="flex flex-1 items-center justify-center px-3 text-center">
              <Empty>
                {!semesterId
                    ? 'Nhiệm vụ sẽ hiển thị sau khi đợt OJT của bạn được liên kết.'
                  : search || filter !== 'ALL'
                    ? 'Không có nhiệm vụ phù hợp với bộ lọc.'
                    : 'Bạn chưa được doanh nghiệp giao nhiệm vụ trong đợt này.'}
              </Empty>
            </div>
          ) : (
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto lg:max-h-[30rem] lg:pr-1" role="list" aria-label="Các nhiệm vụ">
              {visibleTasks.map(task => {
                const status = taskStatus(task);
                const due = task.dueAt ?? task.dueDate;
                const isSelected = activeTask?.id === task.id;
                return (
                  <div key={task.id} role="listitem">
                    <button
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusStyle(status)}`}>
                          {status === 'DONE' ? <Check size={18} /> : status === 'IN_PROGRESS' ? <Clock3 size={18} /> : <ClipboardList size={18} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-start justify-between gap-2">
                            <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900">{task.name}</span>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(status)}`}>{statusText(status)}</span>
                          </span>
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarDays size={14} aria-hidden="true" />
                            Hạn nộp: {displayTaskTime(due)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-3">
            <Pagination page={page} total={taskPage.total} onChange={setPage} disabled={tasks.loading || !semesterId} />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Danh sách tự cập nhật khi bạn quay lại trang.</p>
          </div>
        </section>

        <section className="min-h-[34rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Chi tiết nhiệm vụ">
          {activeTask ? (
            <>
              <header className="border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{activeTask.name}</h2>
                    {activeTask.company?.name && <p className="mt-1 text-sm text-slate-500">{activeTask.company.name}</p>}
                  </div>
                  {dueNotice && (
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${dueNotice.style}`}>
                      <AlertTriangle size={15} /> {dueNotice.label}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${statusStyle(taskStatus(activeTask))}`}>
                    {taskStatus(activeTask) === 'DONE' ? <Check size={15} /> : <Clock3 size={15} />}
                    {statusText(taskStatus(activeTask))}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={17} className="text-slate-500" />
                    Hạn nộp {displayTaskTime(activeTask.dueAt ?? activeTask.dueDate)}
                  </span>
                </div>
              </header>

              <section className="border-b border-slate-200 py-5">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText size={20} /> Yêu cầu nhiệm vụ
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {activeTask.description || 'Doanh nghiệp chưa bổ sung mô tả cho nhiệm vụ này.'}
                </p>
              </section>

              <section className="pt-5">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Upload size={20} /> Bài nộp của bạn
                </h3>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 sm:px-4">
                  <div className="min-w-0 text-sm">
                    {activeTask.latestSubmission ? (
                      <>
                        <p className="font-semibold text-emerald-700">
                          Đã nộp · {dateText(activeTask.latestSubmission.submittedAt)}
                          {activeTask.latestSubmission.isLate && <span className="ml-2 text-amber-700">Nộp sau hạn</span>}
                        </p>
                        <p className="mt-1 line-clamp-2 break-all text-slate-600">{activeTask.latestSubmission.content || activeTask.latestSubmission.attachment?.fileName}</p>
                      </>
                    ) : (
                      <p className="text-slate-600">Chưa nộp bài</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={buttonClass + ' inline-flex shrink-0 items-center gap-2 rounded-lg'}
                    onClick={() => { onMessage(''); setSelectedTask(activeTask); }}
                  >
                    <Send size={16} />
                    {activeTask.canSubmit ? activeTask.latestSubmission ? 'Nộp lại' : 'Nộp bài' : 'Xem bài nộp'}
                  </button>
                </div>
              </section>

            </>
          ) : (
            <div className="flex min-h-[30rem] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ClipboardList size={24} />
              </span>
              <h2 className="mt-4 font-bold text-slate-800">Chọn một nhiệm vụ</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Thông tin yêu cầu, hạn nộp và bài nộp sẽ hiển thị tại đây.</p>
            </div>
          )}
        </section>
      </div>

      {selectedTask && (
        <TaskSubmissionsDialog
          key={selectedTask.id}
          name={selectedTask.name}
          initialContent={selectedTask.latestSubmission?.content}
          latestSubmission={selectedTask.latestSubmission}
          submit={selectedTask.canSubmit ? (content, attachment) => submitAssignedTask(selectedTask.id, content, attachment) : undefined}
          onClose={() => setSelectedTask(null)}
          onSubmitted={() => { setSelectedTask(null); onMessage('Đã gửi bài nộp cho doanh nghiệp.'); tasks.reload(); }}
        />
      )}
    </>
  );
}

export default function StudentOJTProgress() {
  const portal = useStudentPortal();
  const [message, setMessage] = useState('');
  const currentRegistration = portal.profile?.ojtRegistrations.items.find(item => item.ojtSemesterId === portal.semesterId);
  const semesterName = currentRegistration?.semester?.name
    ?? currentRegistration?.semester?.code
    ?? (portal.semesterId ? `Đợt OJT #${portal.semesterId}` : 'Chưa có đợt OJT');

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-12 font-outfit">
      <StudentBanner
        title="Nhiệm vụ thực tập"
        description="Theo dõi yêu cầu, hạn nộp và phản hồi cho các nhiệm vụ OJT."
        badge={null}
        extra={
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-medium text-slate-600">Đợt OJT</span>
            <div className="inline-flex min-w-48 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm">
              <span className="truncate">{semesterName}</span>
              <CalendarDays size={17} className="shrink-0 text-orange-600" />
            </div>
          </div>
        }
      />

      <ResourceState loading={portal.loading} refreshing={portal.refreshing} error={portal.error} retry={portal.refresh} />
      {portal.warnings.map(warning => (
        <div key={warning} role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {warning}{' '}
          <button type="button" className="underline" onClick={portal.refresh}>Thử lại</button>
        </div>
      ))}
      {!portal.loading && !portal.error && portal.profile && (
        <ProgressContent onMessage={setMessage} />
      )}
      {message && <StudentDialog title="Nộp bài thành công" onClose={() => setMessage('')} compact>
        <div className="flex flex-col items-center gap-4 pb-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={36} aria-hidden="true" /></span>
          <p className="text-sm font-medium text-emerald-700">{message}</p>
          <button type="button" className={buttonClass + ' mt-2'} onClick={() => setMessage('')}>Đóng</button>
        </div>
      </StudentDialog>}
    </div>
  );
}
