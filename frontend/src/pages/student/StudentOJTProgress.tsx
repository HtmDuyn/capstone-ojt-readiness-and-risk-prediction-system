import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  CalendarClock,
  UploadCloud,
  AlertCircle,
  Lock,
  X,
  Search,
  CheckCircle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { BotSparkleIcon } from '@/components/common/icons/AppIcons';
import { mockOJTTasks, mockWeeklyReports } from '@/data/student/mockOjtProgressData';
import type { TaskItem, WeeklyReportItem, TaskPriority, TaskStatus } from '@/types/student/ojtProgressTypes';
import { TaskDetailModal } from '@/components/student/ojtProgress/TaskDetailModal';
import { SubmitReportModal } from '@/components/student/ojtProgress/SubmitReportModal';
import { ViewReportModal } from '@/components/student/ojtProgress/ViewReportModal';
import { TaskKanbanColumn } from '@/components/student/ojtProgress/TaskKanbanColumn';

export const StudentOJTProgress: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();

  // State Management
  const [tasks, setTasks] = useState<TaskItem[]>(mockOJTTasks);
  const [reports, setReports] = useState<WeeklyReportItem[]>(mockWeeklyReports);

  // Filter state for Tasks
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  // Modal states
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [submitReportTarget, setSubmitReportTarget] = useState<WeeklyReportItem | null>(null);
  const [viewReportTarget, setViewReportTarget] = useState<WeeklyReportItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Derived Metrics
  const totalAssigned = tasks.length;
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);
  const remainingCount = totalAssigned - completedCount;
  const completionRate = Math.round((completedCount / (totalAssigned || 1)) * 100);
  const urgentCount = useMemo(
    () => tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
    [tasks]
  );

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, selectedPriority, selectedStatus, taskSearchQuery]);

  const todoTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'todo'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'in_progress'), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'done'), [filteredTasks]);

  // Handlers
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast('Cập nhật trạng thái nhiệm vụ thành công!');
  };

  const handleSubmitReport = (
    reportId: string,
    formData: { taskTitle: string; summary: string; challenges: string; fileName: string }
  ) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'submitted',
              submittedAt: formattedDate,
              taskTitle: formData.taskTitle,
              summary: formData.summary,
              challenges: formData.challenges,
              fileName: formData.fileName || `Bao_Cao_${r.weekLabel.replace(/\s+/g, '_')}.pdf`,
              fileUrl: '#',
            }
          : r
      )
    );

    setSubmitReportTarget(null);
    showToast('Đã nộp báo cáo thành công!');
  };

  const hasActiveFilters = selectedPriority !== 'all' || selectedStatus !== 'all' || taskSearchQuery.trim() !== '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full max-w-[1400px] mx-auto font-outfit">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
          <CheckCircle className="text-emerald-400" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Banner - Premium Overlapping Style */}
      <PageBanner
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200/80 font-outfit">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-white/40">›</span>
            <span className="text-amber-300 font-bold drop-shadow-md">Tiến độ thực tập</span>
          </div>
        }
        title="Theo dõi tiến độ thực tập OJT"
        description="Quản lý danh sách nhiệm vụ được giao từ doanh nghiệp, theo dõi tiến độ hoàn thành và nộp báo cáo thực tập hàng tuần."
        primaryAction={{
          label: 'Hỏi AI về tiến độ',
          icon: <BotSparkleIcon size={16} />,
          className: "bg-white text-purple-700 hover:bg-purple-50",
          onClick: () =>
            openAIConsult(
              'Hãy đánh giá tiến độ thực tập OJT hiện tại của tôi và gợi ý những điều cần cải thiện.'
            ),
        }}
        secondaryAction={{
          label: 'Về Dashboard',
          className: "bg-white/10 text-white hover:bg-white/20",
          onClick: () => navigate('/student/dashboard'),
        }}
        className="pb-32"
      />

      <div className="px-4 lg:px-8 relative z-10 -mt-24 space-y-8">
        {/* 2. Stats Overview - Premium Glassmorphism Look */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Nhiệm vụ đã giao</p>
                <h2 className="text-4xl font-extrabold text-slate-800 font-outfit">{totalAssigned}</h2>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                <ClipboardList size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-700">
              <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-inner">
                <Sparkles size={14} className="text-blue-500" /> +2 nhiệm vụ tuần này
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Đã hoàn thành</p>
                <h2 className="text-4xl font-extrabold text-slate-800 font-outfit">
                  {String(completedCount).padStart(2, '0')}
                </h2>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <div className="mt-6 text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> Đạt {completionRate}% kế hoạch
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Còn lại</p>
                <h2 className="text-4xl font-extrabold text-slate-800 font-outfit">
                  {String(remainingCount).padStart(2, '0')}
                </h2>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform">
                <CalendarClock size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs font-medium">
              {urgentCount > 0 ? (
                <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full font-bold text-rose-700 shadow-inner">
                  <AlertCircle size={14} className="text-rose-500 animate-pulse" /> {urgentCount} nhiệm vụ gấp cần làm
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Không có nhiệm vụ quá hạn</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700/50 flex items-center gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
            <div className="relative w-20 h-20 flex-shrink-0 z-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-orange-500 transition-all duration-1000"
                  strokeWidth="3.5"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold text-white">{completionRate}%</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Tỷ lệ hoàn thành</h3>
              <p className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-lg w-fit">Kỳ thực tập Fall 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Task Board Section (Redesigned Compact & Minimalist) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        {/* Streamlined Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <ClipboardList className="text-orange-500" size={22} />
            <h2 className="text-lg sm:text-xl font-bold">Bảng nhiệm vụ</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {filteredTasks.length} / {tasks.length} task
            </span>
          </div>

          {/* Compact Inline Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                placeholder="Tìm nhiệm vụ, tag..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {taskSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTaskSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Priority Select */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Độ ưu tiên: Tất cả</option>
              <option value="urgent">Gấp</option>
              <option value="high"> Ưu tiên cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thường</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Cột: Tất cả</option>
              <option value="todo">Cần làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPriority('all');
                  setSelectedStatus('all');
                  setTaskSearchQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Compact Kanban Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <TaskKanbanColumn
            title="CẦN LÀM"
            type="todo"
            count={todoTasks.length}
            tasks={todoTasks}
            onTaskClick={(task) => setSelectedTask(task)}
          />
          <TaskKanbanColumn
            title="ĐANG LÀM"
            type="in_progress"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            onTaskClick={(task) => setSelectedTask(task)}
          />
          <TaskKanbanColumn
            title="HOÀN THÀNH"
            type="done"
            count={doneTasks.length}
            tasks={doneTasks}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </div>
      </div>

      {/* 4. Weekly Report Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarClock className="text-orange-500" />
            <h2 className="text-xl font-bold">Báo cáo hàng tuần</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const openReport = reports.find((r) => r.status === 'open') || reports[0];
              setSubmitReportTarget(openReport);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <UploadCloud size={18} />
            <span>Nộp báo cáo</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs sm:text-sm">
                <th className="pb-3 font-semibold px-3">Tuần</th>
                <th className="pb-3 font-semibold px-3">Thời gian</th>
                <th className="pb-3 font-semibold px-3 text-center">Trạng thái</th>
                <th className="pb-3 font-semibold px-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-3 font-bold text-slate-800">{report.weekLabel}</td>
                  <td className="py-4 px-3 text-slate-600">{report.dateRange}</td>
                  <td className="py-4 px-3 text-center">
                    {report.status === 'open' && (
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        Đang mở
                      </span>
                    )}
                    {report.status === 'submitted' && (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        Đã nộp
                      </span>
                    )}
                    {report.status === 'late' && (
                      <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold">
                        Quá hạn
                      </span>
                    )}
                    {report.status === 'locked' && (
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                        Chưa mở
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-right">
                    {report.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => setSubmitReportTarget(report)}
                        className="text-orange-600 font-bold hover:text-orange-700 hover:underline cursor-pointer"
                      >
                        Nộp ngay
                      </button>
                    )}
                    {report.status === 'submitted' && (
                      <button
                        type="button"
                        onClick={() => setViewReportTarget(report)}
                        className="text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
                      >
                        Xem lại
                      </button>
                    )}
                    {report.status === 'late' && (
                      <button
                        type="button"
                        onClick={() => setViewReportTarget(report)}
                        className="text-rose-600 font-semibold hover:underline cursor-pointer"
                      >
                        Xem lý do
                      </button>
                    )}
                    {report.status === 'locked' && <Lock size={16} className="text-slate-300 inline-block" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subcomponent Modals */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={handleUpdateTaskStatus}
      />

      <SubmitReportModal
        report={submitReportTarget}
        isOpen={!!submitReportTarget}
        onClose={() => setSubmitReportTarget(null)}
        onSubmit={handleSubmitReport}
      />

      <ViewReportModal
        report={viewReportTarget}
        isOpen={!!viewReportTarget}
        onClose={() => setViewReportTarget(null)}
        onDownloadFile={(fileName) => showToast(`Đang tải file ${fileName}...`)}
      />
    </div>
  );
};

export default StudentOJTProgress;
