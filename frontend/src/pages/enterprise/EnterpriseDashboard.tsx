import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  BriefcaseBusiness,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Clock3,
  CalendarClock,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/shared/useReducedMotion';
import { displayTaskTime } from '@/utils/shared/taskTime';
import { PageBanner } from '@/components/common/PageBanner';
import {
  enterpriseService,
  type DashboardCandidate,
  type DashboardTaskSummary,
  type RecruitmentPost,
} from '@/services/enterpriseService';
import { describeApiError } from '@/services/apiService';
import { loadRecruitmentOverview, recruitmentTotals } from '@/utils/enterprise/recruitment';
import { RecruitmentSlotsChart } from '@/components/enterprise/RecruitmentSlotsChart';
import { EnterpriseTaskProgress } from '@/components/enterprise/EnterpriseTaskProgress';
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
}


export const EnterpriseDashboard: React.FC = () => {
  // Context supplies the company scope; dashboard figures are fetched on each visit.
  const { profile, companyId, loading, error: profileError } = useEnterprise();
  const summary = profile?.summary;
  const [taskSummary, setTaskSummary] = useState<DashboardTaskSummary>({
    total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0, dueSoon: 0, attention: [],
  });
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState(emptyDashboardStats);
  const [recruitmentPosts, setRecruitmentPosts] = useState<RecruitmentPost[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<DashboardCandidate[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const candidateGradientId = `enterprise-status-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const statsRequest = useRef<AbortController | null>(null);

  // Tải thống kê bằng hai request song song để dashboard xuất hiện nhanh hơn.
  useEffect(() => {
    if (loading) return;
    if (profileError || !companyId) {
      setStatsError(profileError || 'Không tìm thấy doanh nghiệp để tải thống kê.');
      setStatsLoading(false);
      return;
    }

    const controller = new AbortController();
    statsRequest.current = controller;
    const loadDashboardStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        if (!summary) throw new Error('Không thể tải thống kê doanh nghiệp.');
        const [recruitment, candidates] = await Promise.all([
          loadRecruitmentOverview(summary.publishedPosts, controller.signal),
          enterpriseService.dashboardCandidates(controller.signal),
        ]);
        if (controller.signal.aborted) return;

        const { publishedPosts } = recruitment;
        const currentSummary = summary;
        const counts = [
          currentSummary.pendingCandidates,
          currentSummary.acceptedInterns,
          currentSummary.completedInterns,
          currentSummary.activeInterns,
          currentSummary.pendingPosts,
          currentSummary.publishedPosts,
          candidates.rejectedCount,
        ];
        if (!counts.every(count => Number.isSafeInteger(count) && count >= 0)) {
          throw new Error('Chưa tải được đầy đủ số liệu thống kê. Vui lòng thử lại.');
        }
        setRecruitmentPosts(publishedPosts);
        setPendingCandidates(candidates.items);
        setDashboardStats({
          totalRecruitmentPosts: recruitment.total,
          publishedRecruitmentPosts: publishedPosts.length,
          pendingRecruitmentPosts: currentSummary.pendingPosts,
          remainingPositions: recruitmentTotals(publishedPosts).remaining,
          pendingCandidates: currentSummary.pendingCandidates,
          acceptedInterns: currentSummary.acceptedInterns,
          rejectedCandidates: candidates.rejectedCount,
          activeInterns: currentSummary.activeInterns,
          completedInterns: currentSummary.completedInterns,
        });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = describeApiError(err, 'Không thể tải thống kê dashboard');
        setStatsError(message);
      } finally {
        if (statsRequest.current === controller) statsRequest.current = null;
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    };

    queueMicrotask(() => { if (!controller.signal.aborted) void loadDashboardStats(); });
    return () => {
      controller.abort();
      if (statsRequest.current === controller) statsRequest.current = null;
    };
  }, [companyId, loading, profileError, summary]);

  useEffect(() => {
    // Chờ companyId sẵn có mới gọi API tasks
    if (!companyId) return;
    const controller = new AbortController();
    const loadTaskProgress = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const data = await enterpriseService.dashboardTasks(controller.signal);
        if (!controller.signal.aborted) setTaskSummary(data);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = describeApiError(err, 'Không thể tải dữ liệu tiến độ task');
        setTasksError(message);
      } finally {
        if (!controller.signal.aborted) setTasksLoading(false);
      }
    };

    void loadTaskProgress();
    return () => controller.abort();
  }, [companyId]);

  const companyName = profile?.name || 'Doanh nghiệp Đối tác';
  const candidateStages = useMemo<CandidateStage[]>(() => [
    { label: 'Chờ duyệt', value: dashboardStats.pendingCandidates },
    {
      label: 'Đã nhận',
      value: dashboardStats.activeInterns,
    },
    { label: 'Đã hoàn thành', value: dashboardStats.completedInterns },
    { label: 'Đã từ chối', value: dashboardStats.rejectedCandidates },
  ], [dashboardStats]);
  const candidateChartLabel = useMemo(
    () => candidateStages.map(stage => `${stage.label}: ${stage.value}`).join(', '),
    [candidateStages],
  );
  const statCards = [
    {
      label: 'Hồ sơ chờ duyệt',
      value: profileError ? undefined : summary?.pendingCandidates,
      detail: 'Ứng viên đang chờ phản hồi',
      icon: Users,
      to: '/enterprise/candidates',
      tone: 'amber',
    },
    {
      label: 'Đã tiếp nhận',
      value: profileError ? undefined : summary?.activeInterns,
      detail: 'Đã tiếp nhận và chưa kết thúc thực tập',
      icon: BriefcaseBusiness,
      to: '/enterprise/interns',
      tone: 'emerald',
    },
    {
      label: 'Đã hoàn thành',
      value: profileError ? undefined : summary?.completedInterns,
      detail: 'Sinh viên đã được chấm điểm OJT',
      icon: CheckCircle2,
      to: '/enterprise/interns',
      tone: 'indigo',
    },
    {
      label: 'Tin tuyển dụng',
      value: statsLoading || statsError ? undefined : dashboardStats.totalRecruitmentPosts,
      detail: `${dashboardStats.publishedRecruitmentPosts} tin đang hiển thị${dashboardStats.pendingRecruitmentPosts ? ` · ${dashboardStats.pendingRecruitmentPosts} chờ duyệt` : ''}`,
      icon: BriefcaseBusiness,
      to: '/enterprise/jobs',
      tone: 'blue',
    },
    {
      label: 'Vị trí còn trống',
      value: statsLoading || statsError ? undefined : dashboardStats.remainingPositions,
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
                    {stat.value ?? '—'}
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
          <EnterpriseTaskProgress summary={taskSummary} loading={tasksLoading} error={tasksError} />
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
                    <ChartContainer config={{ value: { label: 'Sinh viên', color: '#38bdf8' } }} className="h-full w-full aspect-auto">
                      <BarChart accessibilityLayer data={candidateStages} margin={{ top: 24, right: 8, left: -24, bottom: 8 }}>
                        <defs>
                          <linearGradient id={candidateGradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7dd3fc" />
                            <stop offset="45%" stopColor="#e0f2fe" />
                            <stop offset="100%" stopColor="#fed7aa" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#e0f2fe" strokeDasharray="3 3" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} interval={0} fontSize={10} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" color="#38bdf8" />} />
                        <Bar dataKey="value" fill={`url(#${candidateGradientId})`} radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={!reducedMotion}>
                          <LabelList dataKey="value" position="top" className="fill-slate-600 text-xs font-semibold" />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
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
                    <span className="text-amber-600">{taskSummary.dueSoon} sắp đến hạn</span>
                  </div>
                </div>
                {taskSummary.attention.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {taskSummary.attention.map(task => {
                      const dueDate = task.dueAt ?? task.dueDate;
                      const overdue = task.enterpriseStatus === 'OVERDUE';
                      return (
                        <div key={task.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {overdue ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-bold text-slate-700">{task.name}</p>
                            <p className="truncate text-[9px] text-slate-400">{task.fullName || 'Sinh viên'}</p>
                          </div>
                          <span className={`shrink-0 text-[9px] font-bold ${overdue ? 'text-rose-600' : 'text-amber-600'}`}>
                            {displayTaskTime(dueDate)}
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
              {statsLoading ? <p role="status" className="py-6 text-center text-sm text-slate-500">Đang tải danh sách hồ sơ chờ duyệt…</p> : statsError ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Không tải được danh sách hồ sơ chờ duyệt.</p> : pendingCandidates.length > 0 ? (
                <div className="space-y-2">
                  {pendingCandidates.map((candidate, index) => (
                    <Link
                      key={candidate.id}
                      to="/enterprise/candidates"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {candidate.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {candidate.studentCode}
                          {candidate.positionTitle ? ` · ${candidate.positionTitle}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-right text-[11px] font-semibold text-slate-400">
                        {candidate.introducedAt
                          ? new Date(candidate.introducedAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Mới'}
                      </span>
                    </Link>
                  ))}
                  <Link
                    to="/enterprise/candidates"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
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

    </div>
  );
};

export default EnterpriseDashboard;
