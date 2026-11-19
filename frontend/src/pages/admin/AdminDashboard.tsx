import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users, GraduationCap, Building2 } from 'lucide-react';
import { Chart, CategoryScale, LinearScale, BarElement, BarController, ArcElement, DoughnutController, Tooltip, type Plugin } from 'chart.js';
import { PageBanner } from '@/components/common/PageBanner';
import { getAccounts, getSummary, ROLE_NAMES, type AccountCount, type Summary } from '@/services/adminService';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, ArcElement, DoughnutController, Tooltip);

const roles = Object.entries(ROLE_NAMES);
const statuses = [
  { code: 'ACTIVE', label: 'Đang hoạt động', color: '#2563eb' },
  { code: 'LOCKED', label: 'Đã khóa', color: '#f59e0b' },
  { code: 'INACTIVE', label: 'Ngừng hoạt động', color: '#94a3b8' },
];
const countBy = (rows: AccountCount[], key: 'roleCode' | 'status', value: string) =>
  rows.reduce((total, row) => total + (row[key] === value ? row.count : 0), 0);

const barValues: Plugin<'bar'> = {
  id: 'adminBarValues',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save(); ctx.fillStyle = '#334155'; ctx.font = '600 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    chart.getDatasetMeta(0).data.forEach((bar, index) => {
      const value = Number(chart.data.datasets[0].data[index] ?? 0);
      ctx.fillText(value.toLocaleString('vi-VN'), bar.x + 8, bar.y);
    });
    ctx.restore();
  },
};

function RoleChart({ counts }: { counts: AccountCount[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const values = useMemo(() => roles.map(([code]) => countBy(counts, 'roleCode', code)), [counts]);
  const total = values.reduce((sum, value) => sum + value, 0);
  useEffect(() => {
    if (!canvas.current || !total) return;
    const chart = new Chart(canvas.current, {
      type: 'bar',
      data: { labels: roles.map(([, label]) => label), datasets: [{ data: values, backgroundColor: '#6366f1', hoverBackgroundColor: '#4f46e5', borderRadius: 6, maxBarThickness: 25 }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 },
        layout: { padding: { right: 48 } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e2e8f0' } }, y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 11 } } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${(context.parsed.x ?? 0).toLocaleString('vi-VN')} tài khoản (${(values[context.dataIndex] / total * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%)` } } },
      },
      plugins: [barValues],
    });
    return () => chart.destroy();
  }, [values, total]);
  return <div className="h-60">{total ? <canvas ref={canvas} role="img" aria-label={roles.map(([, label], index) => `${label}: ${values[index]} tài khoản`).join(', ')} /> : <p className="flex h-full items-center justify-center text-sm text-slate-500">Chưa có tài khoản theo vai trò.</p>}</div>;
}

function StatusChart({ counts }: { counts: AccountCount[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const values = useMemo(() => statuses.map(({ code }) => countBy(counts, 'status', code)), [counts]);
  const total = values.reduce((sum, value) => sum + value, 0);
  useEffect(() => {
    if (!canvas.current || !total) return;
    const chart = new Chart(canvas.current, {
      type: 'doughnut',
      data: { labels: statuses.map(status => status.label), datasets: [{ data: values, backgroundColor: statuses.map(status => status.color), hoverOffset: 6, borderColor: '#fff', borderWidth: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '69%',
        animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.label}: ${context.parsed.toLocaleString('vi-VN')} tài khoản (${(context.parsed / total * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%)` } } },
      },
    });
    return () => chart.destroy();
  }, [values, total]);
  return <div className="flex min-h-60 flex-col items-center justify-center gap-3 sm:flex-row"><div className="h-52 w-52 shrink-0">{total ? <canvas ref={canvas} role="img" aria-label={statuses.map((status, index) => `${status.label}: ${values[index]} tài khoản`).join(', ')} /> : <p className="flex h-full items-center justify-center text-center text-sm text-slate-500">Chưa có tài khoản.</p>}</div><ul className="grid gap-2 text-sm">{statuses.map((status, index) => <li key={status.code} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} /><span className="text-slate-600">{status.label}</span><strong className="ml-auto tabular-nums text-slate-900">{values[index].toLocaleString('vi-VN')}</strong></li>)}</ul></div>;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accountCounts, setAccountCounts] = useState<AccountCount[] | null>(null);
  const [newAccounts30, setNewAccounts30] = useState<number | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [chartError, setChartError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setSummaryError(''); setChartError(''); setNewAccounts30(null);
    try {
      const { data: { summary: next } } = await getSummary();
      setSummary(next);
      if (Array.isArray(next.accountBreakdown)) setAccountCounts(next.accountBreakdown);
      try {
        const accounts = await getAccounts();
        if (!Array.isArray(next.accountBreakdown)) setAccountCounts(accounts.data.map(account => ({ roleCode: account.role_code, status: account.status, count: 1 })));
        if (accounts.total === next.accounts && accounts.data.length === accounts.total && accounts.data.every(account => account.created_at && Number.isFinite(Date.parse(account.created_at)))) {
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          setNewAccounts30(accounts.data.filter(account => Date.parse(account.created_at!) >= cutoff).length);
        }
      } catch { if (!Array.isArray(next.accountBreakdown)) { setAccountCounts(null); setChartError('Không tải được thống kê tài khoản.'); } }
    } catch { setSummary(null); setAccountCounts(null); setSummaryError('Không tải được tổng quan hệ thống.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const cards = [
    { name: 'Tài khoản hệ thống', value: summary?.accounts, icon: Users },
    { name: 'Sinh viên', value: summary?.students, icon: GraduationCap },
    { name: 'Doanh nghiệp', value: summary?.companies, icon: Building2 },
  ];
  return <div className="space-y-4">
    <PageBanner title="Trung tâm Quản trị Hệ thống" description="Tổng quan tài khoản, sinh viên và doanh nghiệp." badge="Quản trị viên" />
    {summaryError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{summaryError}</p>}
    <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section className="px-4 py-4 sm:px-6"><h2 className="mb-3 text-base font-bold text-slate-900">Tổng quan hệ thống</h2>
        <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">{cards.map(({ name, value, icon: Icon }) => <div key={name} className="flex items-center gap-3 sm:px-5 sm:first:pl-0 sm:last:pr-0"><Icon className="shrink-0 text-indigo-500" size={19} aria-hidden="true" /><div><p className="text-xs text-slate-500">{name}</p><p className="mt-0.5 text-3xl font-bold tabular-nums text-slate-900">{loading || summaryError ? '—' : value?.toLocaleString('vi-VN') ?? '—'}</p></div></div>)}</div>
        {!loading && newAccounts30 !== null && <p className="mt-3 text-xs text-slate-600">Tài khoản mới trong 30 ngày: <strong className="tabular-nums text-slate-900">{newAccounts30.toLocaleString('vi-VN')}</strong></p>}
      </section>
      <section className="border-t border-slate-200 px-4 py-4 sm:px-6"><h2 className="mb-3 text-base font-bold text-slate-900">Thống kê tài khoản</h2>
        <div className="grid lg:grid-cols-2"><div className="min-w-0 pb-4 lg:pb-0 lg:pr-6"><h3 className="mb-2 text-sm font-semibold text-slate-700">Tài khoản theo vai trò</h3>{loading ? <p role="status" className="py-20 text-center text-sm text-slate-500">Đang tải biểu đồ…</p> : accountCounts ? <RoleChart counts={accountCounts} /> : <p role="alert" className="py-20 text-center text-sm text-slate-500">{chartError || summaryError}</p>}</div><div className="min-w-0 border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><h3 className="mb-2 text-sm font-semibold text-slate-700">Trạng thái tài khoản</h3>{loading ? <p role="status" className="py-20 text-center text-sm text-slate-500">Đang tải biểu đồ…</p> : accountCounts ? <StatusChart counts={accountCounts} /> : <p role="alert" className="py-20 text-center text-sm text-slate-500">{chartError || summaryError}</p>}</div></div>
      </section>
    </main>
  </div>;
}
