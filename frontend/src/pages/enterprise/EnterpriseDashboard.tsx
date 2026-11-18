import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  BriefcaseBusiness,
  ClipboardCheck,
  ListChecks,
  Loader2,
  AlertCircle,
  Send,
  AlertTriangle,
  RefreshCw,
  Clock3,
  CalendarClock,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  enterpriseService,
  type EnterpriseCandidateItem,
  type EnterpriseInternshipTask,
  type RecruitmentPost,
} from '@/services/enterpriseService';
import { loadAllPages, recruitmentTotals } from '@/components/enterprise/recruitment';
import { RecruitmentSlotsChart } from '@/components/enterprise/RecruitmentSlotsChart';
import type { EnterpriseProfileSummary } from '@/types/enterprise/enterpriseTypes';
import { Link } from 'react-router-dom';
import { useEnterprise } from '@/contexts/EnterpriseContext';

interface EnterpriseDashboardStats {
  totalRecruitmentPosts: number;
  publishedRecruitmentPosts: number;
  pendingRecruitmentPosts: number;
  remainingPositions: number;
  pendingCandidates: number;
  acceptedInterns: number;
  rejectedCandidates: number;
  activeInterns: number;
  completedInterns: number;
}

const emptyDashboardStats: EnterpriseDashboardStats = {
  totalRecruitmentPosts: 0,
  publishedRecruitmentPosts: 0,
  pendingRecruitmentPosts: 0,
  remainingPositions: 0,
  pendingCandidates: 0,
  acceptedInterns: 0,
  rejectedCandidates: 0,
  activeInterns: 0,
  completedInterns: 0,
};

interface CandidateStage {
  label: string;
  value: number;
  color: string;
}

const isTaskComplete = (status: string) => ['DONE', 'COMPLETED'].includes(status.toUpperCase());

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTaskDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Chưa xác định ngày'
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
};

const TaskCompletionDonut: React.FC<{
  completed: number;
  total: number;
  animated: boolean;
}> = ({ completed, total, animated }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div
      role="img"
      aria-label={`Biểu đồ tròn tiến độ task toàn sinh viên: ${percentage}% hoàn thành, ${completed}/${total} task`}
      className="relative mx-auto h-56 w-56 shrink-0"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="task-completion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="46"
          pathLength="100"
          fill="none"
          stroke="url(#task-completion-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${animated ? percentage : 0} 100`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
          data-chart-label={`Task hoàn thành: ${percentage}%`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <span className="text-4xl font-black tracking-tight text-slate-900">{percentage}%</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          task hoàn thành
        </span>
        <span className="mt-1 text-[10px] font-semibold tabular-nums text-slate-500">{completed}/{total} task</span>
      </div>
    </div>
  );
};

export const EnterpriseDashboard: React.FC = () => {
  // Context supplies the company scope; dashboard figures are fetched on each visit.
  const { profile, companyId, loading, error: profileError } = useEnterprise();
  const [summary, setSummary] = useState<EnterpriseProfileSummary | null>(null);
  const [revision, setRevision] = useState(0);
  const [tasks, setTasks] = useState<EnterpriseInternshipTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState(emptyDashboardStats);
  const [recruitmentPosts, setRecruitmentPosts] = useState<RecruitmentPost[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [chartAnimated, setChartAnimated] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState({
    studentId: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const taskSummary = useMemo(() => {
    const today = new Date();
    const todayKey = dateKey(today);
    const dueLimit = new Date(today);
    dueLimit.setDate(dueLimit.getDate() + 7);
    const dueLimitKey = dateKey(dueLimit);
    const activeTasks = tasks.filter(task => !isTaskComplete(task.status));

    return {
      total: tasks.length,
      completed: tasks.filter(task => isTaskComplete(task.status)).length,
      inProgress: tasks.filter(task => task.status.toUpperCase() === 'IN_PROGRESS').length,
      todo: tasks.filter(task => !isTaskComplete(task.status) && task.status.toUpperCase() !== 'IN_PROGRESS').length,
      overdue: activeTasks.filter(task => Boolean(task.dueDate) && task.dueDate!.slice(0, 10) < todayKey).length,
      dueSoon: activeTasks
        .filter(task => Boolean(task.dueDate) && task.dueDate!.slice(0, 10) >= todayKey && task.dueDate!.slice(0, 10) <= dueLimitKey)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
      attention: activeTasks
        .filter(task => Boolean(task.dueDate) && task.dueDate!.slice(0, 10) <= dueLimitKey)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
        .slice(0, 3),
    };
  }, [tasks]);

  useEffect(() => {
    if (loading) return;
    if (!companyId) {
      setStatsError(profileError || 'Không tìm thấy doanh nghiệp để tải thống kê.');
      setStatsLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const [posts, profileResponse, rejectedCandidates] = await Promise.all([
          loadAllPages<RecruitmentPost>(
            page => enterpriseService.listRecruitmentPosts({ page, limit: 100 }, controller.signal),
            controller.signal,
            'danh sách tin tuyển dụng',
          ),
          enterpriseService.getProfile(controller.signal),
          loadAllPages<EnterpriseCandidateItem>(
            page => enterpriseService.listCandidates({ decision: 'REJECTED', page, limit: 100 }, controller.signal),
            controller.signal,
            'danh sách hồ sơ bị từ chối',
          ),
        ]);
        if (controller.signal.aborted) return;

        const publishedPosts = posts.filter(post => post.status === 'PUBLISHED'
          && (!post.deadlineAt || Date.parse(post.deadlineAt) > Date.now()));
        if (!profileResponse.success || !profileResponse.data?.summary) throw new Error('Không thể tải thống kê doanh nghiệp.');
        const currentSummary = profileResponse.data.summary;
        const rejectedStudents = new Set(
          rejectedCandidates
            .filter(candidate => candidate.decision === 'REJECTED' && candidate.isLatestCoordination)
            .map(candidate => candidate.studentId)
        );
        const counts = [
          currentSummary.pendingCandidates,
          currentSummary.acceptedInterns,
          currentSummary.completedInterns,
          currentSummary.activeInterns,
          currentSummary.pendingPosts,
          currentSummary.publishedPosts,
          rejectedStudents.size,
        ];
        if (!counts.every(count => Number.isSafeInteger(count) && count >= 0)) {
          throw new Error('Chưa tải được đầy đủ số liệu thống kê. Vui lòng thử lại.');
        }
        setSummary(currentSummary);
        setRecruitmentPosts(publishedPosts);
        setDashboardStats({
          totalRecruitmentPosts: posts.length,
          publishedRecruitmentPosts: publishedPosts.length,
          pendingRecruitmentPosts: currentSummary.pendingPosts,
          remainingPositions: recruitmentTotals(publishedPosts).remaining,
          pendingCandidates: currentSummary.pendingCandidates,
          acceptedInterns: currentSummary.acceptedInterns,
          rejectedCandidates: rejectedStudents.size,
          activeInterns: currentSummary.activeInterns,
          completedInterns: currentSummary.completedInterns,
        });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Không thể tải thống kê dashboard';
        setStatsError(message);
        console.error('Failed to load enterprise dashboard statistics:', err);
      } finally {
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    };

    void loadDashboardStats();
    return () => controller.abort();
  }, [companyId, loading, profileError, revision]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRevision(value => value + 1); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  useEffect(() => {
    if (statsLoading || statsError || tasksLoading || tasksError) {
      setChartAnimated(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setChartAnimated(true));
    return () => window.cancelAnimationFrame(frame);
  }, [statsLoading, statsError, tasksLoading, tasksError]);

  useEffect(() => {
    // Chờ companyId sẵn có mới gọi API tasks
    if (!companyId) return;
    const controller = new AbortController();
    const loadTaskProgress = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        // Truyền companyId — bắt buộc để backend scope đúng doanh nghiệp
        const firstPage = await enterpriseService.listInternshipTasks(companyId, { page: 1, limit: 100 }, controller.signal);
        if (!firstPage?.success || !firstPage.data) {
          throw new Error('Không thể tải dữ liệu tiến độ task');
        }

        const tasks = [...firstPage.data.items];
        const totalPages = Math.ceil(firstPage.data.total / firstPage.data.limit);
        for (let page = 2; page <= totalPages; page += 1) {
          const response = await enterpriseService.listInternshipTasks(companyId, { page, limit: 100 }, controller.signal);
          if (!response?.success || !response.data) {
            throw new Error(`Không thể tải dữ liệu task ở trang ${page}`);
          }
          tasks.push(...response.data.items);
        }

        if (!controller.signal.aborted) setTasks(tasks);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu tiến độ task';
        setTasksError(message);
        console.error('Failed to load enterprise task progress:', err);
      } finally {
        if (!controller.signal.aborted) setTasksLoading(false);
      }
    };

    void loadTaskProgress();
    return () => controller.abort();
  }, [companyId, revision]);

  const handleSendIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Đã gửi báo cáo sự cố về Phòng QHDN Trường FPT thành công!');
    setShowIncidentModal(false);
    setIncidentReport({ studentId: '', severity: 'MEDIUM', title: '', description: '' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const companyName = profile?.name || 'Doanh nghiệp Đối tác';
  const candidateStages: CandidateStage[] = [
    { label: 'Chờ duyệt', value: dashboardStats.pendingCandidates, color: '#f59e0b' },
    {
      label: 'Đã nhận',
      value: dashboardStats.activeInterns,
      color: '#6366f1',
    },
    { label: 'Đã hoàn thành', value: dashboardStats.completedInterns, color: '#10b981' },
    { label: 'Đã từ chối', value: dashboardStats.rejectedCandidates, color: '#f43f5e' },
  ];
  const maxCandidateStage = Math.max(1, ...candidateStages.map(stage => stage.value));
  const candidateChartLabel = candidateStages.map(stage => `${stage.label}: ${stage.value}`).join(', ');
  const statCards = [
    {
      label: 'Hồ sơ chờ duyệt',
      value: dashboardStats.pendingCandidates,
      detail: 'Ứng viên đang chờ phản hồi',
      icon: Users,
      to: '/enterprise/candidates',
      tone: 'amber',
    },
    {
      label: 'Đã tiếp nhận',
      value: dashboardStats.activeInterns,
      detail: 'Đã tiếp nhận và chưa kết thúc thực tập',
      icon: BriefcaseBusiness,
      to: '/enterprise/interns',
      tone: 'emerald',
    },
    {
      label: 'Đã hoàn thành',
      value: dashboardStats.completedInterns,
      detail: 'Sinh viên đã được chấm điểm OJT',
      icon: CheckCircle2,
      to: '/enterprise/interns',
      tone: 'indigo',
    },
    {
      label: 'Tin tuyển dụng',
      value: dashboardStats.totalRecruitmentPosts,
      detail: `${dashboardStats.publishedRecruitmentPosts} tin đang hiển thị${dashboardStats.pendingRecruitmentPosts ? ` · ${dashboardStats.pendingRecruitmentPosts} chờ duyệt` : ''}`,
      icon: BriefcaseBusiness,
      to: '/enterprise/jobs',
      tone: 'blue',
    },
    {
      label: 'Vị trí còn trống',
      value: dashboardStats.remainingPositions,
      detail: 'Trong các tin đang tuyển',
      icon: ClipboardCheck,
      to: '/enterprise/jobs',
      tone: 'cyan',
    },
  ];
  const statTones: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  };

  return (
    <div className="enterprise-dashboard space-y-6 pb-12">
      <PageBanner
        variant="enterprise"
        title={companyName}
        breadcrumb={<span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">Tổng quan hoạt động doanh nghiệp</span>}
        description="Quản lý tiếp nhận sinh viên, vị trí tuyển dụng, tiến độ thực tập và các đầu việc cần xử lý tại một nơi."
        badge={profile?.status === 'ACTIVE' ? 'Đối tác chính thức' : 'Doanh nghiệp đối tác'}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setRevision(value => value + 1)}
          disabled={statsLoading || tasksLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${statsLoading || tasksLoading ? 'animate-spin' : ''}`} />
          Làm mới số liệu
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              data-stat-label={stat.label}
              style={{ animationDelay: `${80 + index * 70}ms` }}
              className="enterprise-reveal group relative overflow-hidden rounded-2xl border border-white/70 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg sm:p-5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    {statsLoading ? '—' : statsError ? '—' : stat.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${statTones[stat.tone]}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2 text-[10px]">
                <span className="font-medium leading-relaxed text-slate-500">{stat.detail}</span>
                <ChevronRight className="mb-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
        <div className="min-w-0 space-y-5">
          <RecruitmentSlotsChart posts={recruitmentPosts} loading={statsLoading} error={statsError} />
          <article className="enterprise-reveal overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">Task completion</p>
                  <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
                    <ListChecks className="h-4 w-4 text-teal-500" />
                    Tiến độ hoàn thành Task
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Tỷ lệ task hoàn thành trên tổng số task được giao cho toàn bộ sinh viên.
                  </p>
                </div>
                <Link
                  to="/enterprise/interns"
                  aria-label="Quản lý task thực tập"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-teal-50 hover:text-teal-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {tasksLoading ? (
                <div role="status" className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
                  <p className="text-xs font-medium text-slate-500">Đang tính tiến độ task...</p>
                </div>
              ) : tasksError ? (
                <div role="alert" className="rounded-xl bg-rose-50 p-5 text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
                  <p className="text-sm font-medium text-rose-700">{tasksError}</p>
                </div>
              ) : (
                <>
                  <TaskCompletionDonut
                    completed={taskSummary.completed}
                    total={taskSummary.total}
                    animated={chartAnimated}
                  />
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Hoàn thành', value: taskSummary.completed, color: 'text-teal-700', tone: 'bg-teal-50' },
                      { label: 'Đang làm', value: taskSummary.inProgress, color: 'text-indigo-700', tone: 'bg-indigo-50' },
                      { label: 'Chưa bắt đầu', value: taskSummary.todo, color: 'text-slate-700', tone: 'bg-slate-50' },
                    ].map(metric => (
                      <div key={metric.label} className={`rounded-xl px-2.5 py-2.5 ${metric.tone}`}>
                        <p className={`text-lg font-black tabular-nums ${metric.color}`}>{metric.value}</p>
                        <p className="text-[9px] font-semibold text-slate-500">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] leading-relaxed text-slate-500">
                    Phần trăm được tính từ tổng số task đã hoàn thành chia cho toàn bộ task của doanh nghiệp.
                  </p>
                </>
              )}
            </div>
          </article>
        </div>
        <div className="min-w-0 space-y-5">
          <article className="enterprise-reveal overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]" style={{ animationDelay: '100ms' }}>
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Student status</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Trạng thái tiếp nhận sinh viên
                </h2>
                <p className="mt-1 text-xs text-slate-500">Số lượng theo từng giai đoạn xử lý hồ sơ và thực tập.</p>
              </div>
              <Link
                to="/enterprise/candidates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                Quản lý hồ sơ <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-5 sm:p-6">
              {statsLoading ? (
                <div role="status" className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                  <p className="text-xs font-medium text-slate-500">Đang tải trạng thái sinh viên...</p>
                </div>
              ) : statsError ? (
                <div role="alert" className="rounded-xl bg-rose-50 p-5 text-center">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
                  <p className="text-sm font-medium text-rose-700">{statsError}</p>
                </div>
              ) : (
                <>
                  <div
                    role="img"
                    aria-label={`Biểu đồ cột trạng thái sinh viên: ${candidateChartLabel}`}
                    className="relative h-64"
                  >
                    <div className="absolute inset-x-7 bottom-11 top-2 flex flex-col justify-between" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map(tick => (
                        <span key={tick} className="border-t border-dashed border-slate-200" />
                      ))}
                    </div>
                    <div className="absolute inset-x-0 bottom-11 top-2 flex items-end justify-around">
                      {candidateStages.map((stage, index) => {
                        const height = chartAnimated && stage.value > 0
                          ? Math.max((stage.value / maxCandidateStage) * 100, 4)
                          : 0;
                      return (
                        <div key={stage.label} className="relative flex h-full w-1/5 items-end justify-center">
                          <span
                            className="absolute z-10 text-xs font-extrabold tabular-nums text-slate-700"
                            style={{ bottom: `calc(${height}% + 7px)` }}
                          >
                            {stage.value}
                          </span>
                          <div
                            data-chart-status={stage.label}
                            className="w-10 rounded-t-xl transition-[height] duration-1000 ease-out sm:w-14"
                            style={{
                              height: `${height}%`,
                              background: `linear-gradient(180deg, ${stage.color} 0%, ${stage.color}cc 100%)`,
                              boxShadow: `0 8px 18px ${stage.color}33`,
                              transitionDelay: `${index * 100}ms`,
                            }}
                            title={`${stage.label}: ${stage.value}`}
                          />
                        </div>
                      );
                    })}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-around">
                      {candidateStages.map(stage => (
                        <span key={stage.label} className="w-1/4 px-0.5 text-center text-[10px] font-semibold leading-tight text-slate-600">
                          {stage.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {!tasksLoading && !tasksError && (
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CalendarClock className="h-4 w-4 text-orange-500" />
                    Việc cần theo dõi
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-semibold">
                    <span className={taskSummary.overdue > 0 ? 'text-rose-600' : 'text-slate-500'}>
                      {taskSummary.overdue} task quá hạn
                    </span>
                    <span className="text-amber-600">{taskSummary.dueSoon.length} sắp đến hạn</span>
                  </div>
                </div>
                {taskSummary.attention.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {taskSummary.attention.map(task => {
                      const dueDate = (task.dueDate || '').slice(0, 10);
                      const overdue = dueDate < dateKey(new Date());
                      return (
                        <div key={task.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {overdue ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-bold text-slate-700">{task.name}</p>
                            <p className="truncate text-[9px] text-slate-400">{task.student?.fullName || task.fullName || 'Sinh viên'}</p>
                          </div>
                          <span className={`shrink-0 text-[9px] font-bold ${overdue ? 'text-rose-600' : 'text-amber-600'}`}>
                            {formatTaskDate(dueDate)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white bg-white px-3 py-3 text-[10px] font-medium text-slate-500">
                    Chưa có task quá hạn hoặc đến hạn trong 7 ngày tới.
                  </p>
                )}
              </div>
            )}
          </article>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Sinh viên Chờ duyệt</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinh viên đăng ký OJT nguyện vọng vào doanh nghiệp
                </p>
              </div>
              <Link
                to="/enterprise/candidates"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-5 sm:p-6">
              {statsLoading ? <p role="status" className="py-6 text-center text-sm text-slate-500">Đang tải số hồ sơ chờ duyệt…</p> : statsError ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Không tải được số hồ sơ chờ duyệt. Vui lòng làm mới số liệu.</p> : summary && summary.pendingCandidates > 0 ? (
                <div className="flex flex-col gap-4 rounded-xl bg-orange-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                      <Users className="h-5 w-5" />
                    </span>
                    <p className="text-sm text-slate-700">
                      Có <strong>{summary.pendingCandidates}</strong> ứng viên mới cần duyệt hồ sơ.
                    </p>
                  </div>
                    <Link
                      to="/enterprise/candidates"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                    >
                      <span>Vào duyệt hồ sơ ngay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-7 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    Hiện chưa có hồ sơ ứng viên nào đang chờ duyệt tiếp nhận.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Hồ sơ mới đăng ký của sinh viên sẽ tự động hiển thị tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Báo cáo Sự cố Phát sinh về Phòng QHDN</span>
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã hoặc Tên sinh viên phát sinh sự cố
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SE170012 - Phạm Minh Tuấn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.studentId}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, studentId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ sự cố
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.severity}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, severity: e.target.value })
                  }
                >
                  <option value="LOW">Thấp (Nhắc nhở nội bộ)</option>
                  <option value="MEDIUM">Trung bình (Vắng 3 ngày không phép / Chậm tiến độ)</option>
                  <option value="HIGH">Nghiêm trọng (Vi phạm bảo mật / Tự ý bỏ thực tập)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề báo cáo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sinh viên nghỉ tự do 3 ngày liên tiếp không lý do"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.title}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết sự việc
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả hoàn cảnh, thái độ và đề xuất phương án xử lý từ phía Doanh nghiệp..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.description}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo sự cố</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDashboard;
