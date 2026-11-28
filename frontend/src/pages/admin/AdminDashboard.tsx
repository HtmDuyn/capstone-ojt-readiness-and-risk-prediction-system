import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, GraduationCap, UserRoundPlus, Users } from 'lucide-react';
import { DonutChart } from "@/components/common/DonutChart";
import { PageBanner } from '@/components/common/PageBanner';
import { ADMIN_SUMMARY_CACHE_KEY, getAccountRoles, getSummary, type AccountCount, type Summary } from '@/services/adminService';
import { readAdminCache, subscribeAdminCache } from '@/utils/admin/adminReadCache';

const roles = [
  { code: 'STUDENT', label: 'Sinh viên', color: '#6366f1' },
  { code: 'ENTERPRISE', label: 'Doanh nghiệp', color: '#f97316' },
  { code: 'OJT_COORD', label: 'Phòng Quan hệ Doanh nghiệp', color: '#8b5cf6' },
  { code: 'ACADEMIC', label: 'Phòng Đào tạo', color: '#06b6d4' },
  { code: 'ADMIN', label: 'Quản trị viên', color: '#f59e0b' },
] as const;
const statuses = [
  { code: 'ACTIVE', label: 'Đang hoạt động', color: '#22c55e' },
  { code: 'LOCKED', label: 'Đã khóa', color: '#f59e0b' },
  { code: 'INACTIVE', label: 'Ngừng hoạt động', color: '#94a3b8' },
] as const;
const number = (value: number) => value.toLocaleString('vi-VN');
const percent = (part: number, total: number) => total ? part / total * 100 : 0;
const percentText = (part: number, total: number) => `${percent(part, total).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
const countBy = (rows: AccountCount[], key: 'roleCode' | 'status', value: string) =>
  rows.reduce((sum, row) => sum + (row[key] === value ? row.count : 0), 0);

function RoleDistribution({ counts, total }: { counts: AccountCount[]; total: number }) {
  const values = useMemo(() => roles.map(role => countBy(counts, 'roleCode', role.code)), [counts]);
  return <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:items-center">
    <div className="relative size-52 shrink-0 sm:size-56">
      <DonutChart segments={roles.map((role, index) => ({ label: role.label, value: values[index], color: role.color }))}
        label={roles.map((role, index) => `${role.label}: ${values[index]}`).join(", ")} unit="tài khoản" />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl font-extrabold tabular-nums text-slate-900">{number(total)}</strong>
        <span className="text-xs text-slate-500">Tài khoản</span>
      </div>
    </div>
    <ul className="w-full min-w-0 space-y-3">{roles.map((role, index) =>
      <li key={role.code} className="flex items-center gap-2 text-sm">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
        <span className="min-w-0 flex-1 text-slate-600">{role.label}</span>
        <strong className="tabular-nums text-slate-900">{number(values[index])}</strong>
        <span className="w-12 text-right tabular-nums text-slate-500">{percentText(values[index], total)}</span>
      </li>)}</ul>
  </div>;
}

function AccountStatus({ counts, total }: { counts: AccountCount[]; total: number }) {
  const navigate = useNavigate();
  const values = statuses.map(status => countBy(counts, 'status', status.code));
  return <>
    <div className="mt-7"><strong className="text-4xl font-extrabold tabular-nums text-slate-900">{percentText(values[0], total)}</strong><p className="mt-1 text-sm text-slate-500">Tài khoản đang hoạt động</p></div>
    <div role="img" aria-label={statuses.map((status, index) => `${status.label}: ${values[index]}`).join(', ')} className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
      {statuses.map((status, index) => <span key={status.code} style={{ width: `${percent(values[index], total)}%`, backgroundColor: status.color }} />)}
    </div>
    <ul className="mt-7 space-y-4">{statuses.map((status, index) =>
      <li key={status.code} className="flex items-center gap-3 text-sm"><span className="size-2.5 rounded-full" style={{ backgroundColor: status.color }} /><span className="flex-1 text-slate-600">{status.label}</span><strong className="tabular-nums text-slate-900">{number(values[index])}</strong></li>)}</ul>
    <button type="button" onClick={() => navigate('/admin/users')} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">Xem danh sách tài khoản <ArrowRight size={16} /></button>
  </>;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [counts, setCounts] = useState<AccountCount[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const applySummary = useCallback((next: Summary) => {
    setSummary(next);
    setCounts(Array.isArray(next.accountBreakdown) ? next.accountBreakdown : null);
  }, []);
  const load = useCallback(async () => {
    const cached=readAdminCache<{data:{summary:Summary}}>(ADMIN_SUMMARY_CACHE_KEY);
    if(cached?.data?.summary)applySummary(cached.data.summary);
    setLoading(!cached); setError('');
    try {
      const { data: { summary: next } } = await getSummary();
      applySummary(next);
    } catch { if(!cached){setSummary(null);setCounts(null);setError('Không tải được tổng quan tài khoản.');} }
    finally { setLoading(false); }
  }, [applySummary]);
  useEffect(() => { void load(); }, [load]);
  useEffect(()=>subscribeAdminCache<{data:{summary:Summary}}>(ADMIN_SUMMARY_CACHE_KEY,result=>{if(result?.data?.summary){applySummary(result.data.summary);setError('');}}),[applySummary]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void getAccountRoles().catch(()=>undefined);},1200);return()=>window.clearTimeout(timer);},[]);
  const total = summary?.accounts ?? 0;
  const studentCount = counts ? countBy(counts, 'roleCode', 'STUDENT') : null;
  const enterpriseCount = counts ? countBy(counts, 'roleCode', 'ENTERPRISE') : null;
  const cards = [
    { title: 'Tài khoản hệ thống', value: summary?.accounts ?? null, description: 'Tổng số tài khoản trong hệ thống', icon: Users },
    { title: 'Sinh viên', value: studentCount, description: studentCount === null ? 'Chưa có dữ liệu' : `${percentText(studentCount, total)} tổng số tài khoản`, icon: GraduationCap },
    { title: 'Doanh nghiệp', value: enterpriseCount, description: enterpriseCount === null ? 'Chưa có dữ liệu' : `${percentText(enterpriseCount, total)} tổng số tài khoản`, icon: Building2 },
    { title: 'Tài khoản mới trong 30 ngày', value: summary?.newAccounts30 ?? null, description: 'Được tạo trong 30 ngày gần nhất', icon: UserRoundPlus },
  ];
  return <div className="mx-auto max-w-[1440px] space-y-5">
    <PageBanner title="Trung tâm Quản trị Hệ thống" badge={<span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">Quản trị viên</span>}
      description="Tổng quan tài khoản, sinh viên và doanh nghiệp" />
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} <button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button></div>}
    <section aria-label="Tổng quan tài khoản" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, description, icon: Icon }) =>
      <div key={title} className="min-h-40 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-slate-600">{title}</h2><span className="rounded-xl bg-slate-50 p-2.5 text-indigo-600"><Icon size={20} aria-hidden="true" /></span></div>
        <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">{loading ? '…' : value === null ? '—' : number(value)}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>)}</section>
    <section aria-label="Thống kê tài khoản" className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Tài khoản theo vai trò</h2><p className="mt-1 text-sm text-slate-500">Phân bố tài khoản theo 5 vai trò</p>{loading ? <p role="status" className="py-20 text-center text-sm text-slate-500">Đang tải thống kê…</p> : counts ? <RoleDistribution counts={counts} total={total} /> : <p className="py-20 text-center text-sm text-slate-500">Chưa có dữ liệu theo vai trò.</p>}</div>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Trạng thái tài khoản</h2><p className="mt-1 text-sm text-slate-500">Tình trạng hoạt động của toàn bộ tài khoản</p>{loading ? <p role="status" className="py-20 text-center text-sm text-slate-500">Đang tải thống kê…</p> : counts ? <AccountStatus counts={counts} total={total} /> : <p className="py-20 text-center text-sm text-slate-500">Chưa có dữ liệu trạng thái.</p>}</div>
    </section>
  </div>;
}
