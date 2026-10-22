import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Building2, CalendarDays } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { getAccounts, getSummary, ROLE_NAMES, type Account, type Summary } from '@/services/admin';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([getSummary(), getAccounts()]);
    if (results[0].status === 'fulfilled') setSummary(results[0].value.data.summary); else setSummary(null);
    if (results[1].status === 'fulfilled') setAccounts(results[1].value.data); else setAccounts([]);
    setError(results.flatMap(r => r.status === 'rejected' ? [r.reason instanceof Error ? r.reason.message : 'Không tải được dữ liệu.'] : []).join(' '));
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const cards = [
    { name: 'Tài khoản hệ thống', value: summary?.accounts, icon: Users },
    { name: 'Sinh viên', value: summary?.students, icon: GraduationCap },
    { name: 'Doanh nghiệp', value: summary?.companies, icon: Building2 },
    { name: 'Kỳ OJT', value: summary?.ojtSemesters, icon: CalendarDays },
  ];
  return <div className="space-y-6">
    <PageBanner title="Trung tâm Quản trị Hệ thống" description="Tổng quan tài khoản, sinh viên, doanh nghiệp và các kỳ OJT." badge="Quản trị viên" primaryAction={{ label: 'Làm mới', onClick: () => void load() }} />
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {loading && <p role="status">Đang tải tổng quan...</p>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({name, value, icon: Icon}) => <div key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{name}</p><p className="mt-2 text-2xl font-bold">{loading ? '…' : value ?? '—'}</p></div><Icon className="text-orange-500" size={26} /></div></div>)}</section>
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Tình trạng tài khoản</h2><dl className="mt-5 space-y-4">{[['Đang hoạt động', summary?.activeAccounts], ['Đã khóa', accounts.filter(a => a.status === 'LOCKED').length], ['Ngừng hoạt động', accounts.filter(a => a.status === 'INACTIVE').length]].map(([name,value]) => <div key={name} className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-sm text-slate-600">{name}</dt><dd className="font-semibold">{loading || error ? '—' : value ?? '—'}</dd></div>)}</dl><Link className="mt-5 inline-block font-semibold text-orange-600" to="/admin/users">Quản lý tài khoản →</Link></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Các nhóm quản trị</h2><div className="mt-5 space-y-3">{Object.entries(ROLE_NAMES).map(([code,name]) => <div key={code} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-medium">{name}</span><span className="text-sm text-slate-500">{loading || error ? '—' : accounts.filter(a => a.role_code === code).length} tài khoản</span></div>)}</div></div>
    </section>
  </div>;
}
