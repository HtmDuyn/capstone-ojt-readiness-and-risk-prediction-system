import { useId } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Clock3, ListChecks, Loader2 } from 'lucide-react';
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
    { label: 'Đang thực hiện', value: summary.inProgress, dot: 'bg-indigo-400', color: 'text-indigo-700' },
    { label: 'Chưa bắt đầu', value: summary.todo, dot: 'bg-slate-300', color: 'text-slate-700' },
  ];

  return <article aria-labelledby={headingId} className="enterprise-reveal min-w-0 overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]">
    <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="min-w-0">
        <h2 id={headingId} className="flex items-center gap-2 text-base font-bold text-slate-900">
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
    </div> : <div className="p-5 sm:p-6">
      <div className="rounded-2xl bg-slate-50/80 px-3 py-4">
        <div className="mx-auto h-40 w-40">
          <DonutChart
          segments={summary.total > 0 ? [
            { label: 'Đã hoàn thành', value: summary.completed, color: '#0d9488', gradientTo: '#2dd4bf' },
            { label: 'Chưa hoàn thành', value: Math.max(0, summary.total - summary.completed), color: '#eef2f6' },
          ] : []}
          label={`Tiến độ task: ${percentage}% hoàn thành, ${summary.completed}/${summary.total} task`}
          innerRadius="72%" appearance="continuous" unit="task"
        >
          <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-900">{percentage}%</span>
          <span className="mt-1 text-xs font-medium text-slate-500">hoàn thành</span>
          </DonutChart>
        </div>
        <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
          <strong className="font-semibold tabular-nums text-slate-800">{summary.completed.toLocaleString('vi-VN')}</strong> / {summary.total.toLocaleString('vi-VN')} task đã hoàn thành
        </p>
      </div>

      {summary.total > 0 ? <>
        <dl className="mt-5 space-y-3">
          {metrics.map(metric => <div key={metric.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
            <dt className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600"><span aria-hidden="true" className={'h-2 w-2 shrink-0 rounded-full '+metric.dot} />{metric.label}</dt>
            <dd className={'text-sm font-bold tabular-nums '+metric.color}>{metric.value.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">task</span></dd>
            <div aria-hidden="true" className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={'h-full rounded-full '+metric.dot} style={{ width: `${Math.min(100, Math.max(0, metric.value / summary.total * 100))}%` }} />
            </div>
          </div>)}
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div className={`rounded-xl p-3 ${summary.overdue > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
            <p className="flex items-center gap-1.5 text-xs font-medium"><AlertTriangle size={14} aria-hidden="true" />Quá hạn</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums">{summary.overdue.toLocaleString('vi-VN')} <span className="text-xs font-normal">task</span></p>
          </div>
          <div className={`rounded-xl p-3 ${summary.dueSoon > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
            <p className="flex items-center gap-1.5 text-xs font-medium"><Clock3 size={14} aria-hidden="true" />Sắp đến hạn</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums">{summary.dueSoon.toLocaleString('vi-VN')} <span className="text-xs font-normal">task</span></p>
          </div>
        </div>
      </> : <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">Chưa có task được giao.</p>}
    </div>}
  </article>;
}
