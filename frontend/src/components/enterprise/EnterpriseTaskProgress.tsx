import { useId } from 'react';
import { AlertCircle, ChevronRight, ListChecks, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DonutChart } from '@/components/common/DonutChart';
import type { DashboardTaskSummary } from '@/services/enterpriseService';

export function EnterpriseTaskProgress({ summary, loading, error }: {
  summary: DashboardTaskSummary;
  loading: boolean;
  error: string | null;
}) {
  const headingId = useId();
  const percentage = summary.total > 0 ? Math.round(summary.completed / summary.total * 100) : 0;
  const metrics = [
    { label: 'Hoàn thành', value: summary.completed, dot: 'bg-teal-500', color: 'text-teal-700' },
    { label: 'Đang làm', value: summary.inProgress, dot: 'bg-indigo-400', color: 'text-indigo-700' },
    { label: 'Chưa bắt đầu', value: summary.todo, dot: 'bg-slate-300', color: 'text-slate-700' },
  ];

  return <article aria-labelledby={headingId} className="enterprise-reveal min-w-0 overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]">
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
      <div className="min-w-0">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <ListChecks size={17} className="shrink-0 text-teal-600" />Tiến độ hoàn thành task
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">Theo dõi các nhiệm vụ đã giao.</p>
      </div>
      <Link to="/enterprise/interns" aria-label="Quản lý task thực tập" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500">
        <ChevronRight size={16} />
      </Link>
    </header>

    {loading ? <div role="status" className="flex min-h-36 items-center justify-center gap-2 px-4 py-5 text-xs text-slate-500">
      <Loader2 size={18} className="animate-spin text-teal-500" />Đang tính tiến độ task…
    </div> : error ? <div role="alert" className="flex min-h-36 items-center gap-2 px-4 py-5 text-sm text-rose-700">
      <AlertCircle size={18} className="shrink-0" /><p>{error}</p>
    </div> : <div className="flex items-center gap-4 p-4">
      <div className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
        <DonutChart
          segments={summary.total > 0 ? [
            { label: 'Đã hoàn thành', value: summary.completed, color: '#0d9488', gradientTo: '#2dd4bf' },
            { label: 'Chưa hoàn thành', value: Math.max(0, summary.total - summary.completed), color: '#eef2f6' },
          ] : []}
          label={`Tiến độ task: ${percentage}% hoàn thành, ${summary.completed}/${summary.total} task`}
          innerRadius="72%" appearance="continuous" unit="task"
        >
          <span className="text-xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-2xl">{percentage}%</span>
          <span className="mt-0.5 text-[10px] font-medium text-slate-500">hoàn thành</span>
        </DonutChart>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-slate-100 pb-2 text-xs text-slate-500">
          <span>Đã giao</span><strong className="font-semibold tabular-nums text-slate-800">{summary.total.toLocaleString('vi-VN')} task</strong>
        </p>
        <dl className="space-y-2 pt-2">
          {metrics.map(metric => <div key={metric.label} className="flex items-center justify-between gap-2">
            <dt className="flex min-w-0 items-center gap-2 text-xs text-slate-600"><span aria-hidden="true" className={'h-1.5 w-1.5 shrink-0 rounded-full '+metric.dot} />{metric.label}</dt>
            <dd className={'shrink-0 text-sm font-bold tabular-nums '+metric.color}>{metric.value.toLocaleString('vi-VN')}</dd>
          </div>)}
        </dl>
        {summary.overdue > 0 && <p className="mt-2 text-[11px] font-medium text-rose-600">{summary.overdue.toLocaleString('vi-VN')} task quá hạn</p>}
        {summary.total === 0 && <p className="mt-2 text-[11px] text-slate-400">Chưa có task được giao.</p>}
      </div>
    </div>}
  </article>;
}
