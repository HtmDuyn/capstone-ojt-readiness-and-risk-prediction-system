import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Activity, FileText, RefreshCw } from 'lucide-react';
import AuditLogDetails from '@/components/admin/AuditLogDetails';
import { AUDIT_ACTIONS, actionLabel, entityLabel } from '@/components/admin/audit-display';
import { PageBanner } from '@/components/common/PageBanner';
import { formatDate, getAuditLogs, type AuditFilters, type AuditLog } from '@/services/admin';

export default function AdminSystemMetrics() {
  const [filters, setFilters] = useState({ userId: '', action: '', entityType: '' });
  const [query, setQuery] = useState<AuditFilters>({ page: 1, limit: 20 });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const generation = useRef(0);
  const [observedActions, setObservedActions] = useState<string[]>([]);
  const closeDetails = useCallback(() => setSelected(null), []);
  const actionOptions = [...new Set([...Object.keys(AUDIT_ACTIONS), ...observedActions, ...(filters.action ? [filters.action] : [])])]
    .sort((left, right) => actionLabel(left).localeCompare(actionLabel(right), 'vi'));
  useEffect(() => {
    const current = ++generation.current;
    setLoading(true); setError('');
    const started = performance.now();
    getAuditLogs(query).then(result => {
      if (generation.current !== current) return;
      setLogs(result.data.items); setTotal(result.data.total);
      setObservedActions(current => [...new Set([...current, ...result.data.items.map(log => log.action)])]);
      setDuration(Math.round(performance.now() - started)); setLoadedAt(new Date().toISOString());
    }).catch(e => {
      if (generation.current !== current) return;
      setError(e instanceof Error ? e.message : 'Không tải được nhật ký.'); setLogs([]); setTotal(0); setDuration(null); setLoadedAt(null);
    }).finally(() => { if (generation.current === current) setLoading(false); });
    return () => { generation.current++; };
  }, [query]);
  const apply = (event: FormEvent) => {
    event.preventDefault();
    setQuery({ page: 1, limit: 20, ...(filters.userId ? { userId: Number(filters.userId) } : {}), ...(filters.action.trim() ? { action: filters.action.trim() } : {}), ...(filters.entityType.trim() ? { entityType: filters.entityType.trim() } : {}) });
  };
  const page = query.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / 20));
  return <div className="space-y-6">
    <PageBanner title="Giám sát & Nhật ký hoạt động" description="Tra cứu thao tác thực tế trên hệ thống và xem nội dung nhật ký chi tiết." badge="Nhật ký hệ thống" primaryAction={{ label: 'Làm mới', icon: <RefreshCw size={16} />, onClick: () => setQuery(current => ({ ...current })) }} />
    <section className="grid gap-4 sm:grid-cols-3">{[
      { label: 'Nhật ký khớp bộ lọc', value: error ? '—' : loading ? '…' : total, icon: FileText },
      { label: 'Thời gian tải nhật ký', value: duration === null || loading ? '—' : duration + ' ms', icon: Activity },
      { label: 'Lần tải thành công', value: loading ? '…' : formatDate(loadedAt), icon: RefreshCw },
    ].map(({label,value,icon: Icon}) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon size={22} className="text-orange-500" /><p className="mt-3 text-sm text-slate-500">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>)}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">ID tài khoản<input type="number" min="1" max="2147483647" step="1" value={filters.userId} onChange={e => setFilters(current => ({...current,userId:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="Tất cả tài khoản" /></label>
        <label className="text-sm font-semibold">Hành động<select value={filters.action} onChange={e => setFilters(current => ({...current,action:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><option value="">Tất cả hành động</option>{actionOptions.map(action => <option key={action} value={action}>{actionLabel(action)}</option>)}</select></label>
        <label className="text-sm font-semibold">Loại đối tượng<input maxLength={100} value={filters.entityType} onChange={e => setFilters(current => ({...current,entityType:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="Ví dụ: Users" /></label>
        <div className="flex items-end gap-2"><button disabled={loading} className="rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white disabled:opacity-50">Lọc</button><button type="button" disabled={loading} onClick={() => {setFilters({userId:'',action:'',entityType:''});setQuery({page:1,limit:20});}} className="rounded-xl border px-4 py-3">Xóa lọc</button></div>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading && <p role="status" className="mt-4">Đang tải nhật ký...</p>}
      {!loading && !error && <><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-slate-500">{['ID','Thời gian','Người thực hiện','Hành động','Đối tượng','Địa chỉ IP','Chi tiết'].map(name => <th key={name} className="px-3 py-3">{name}</th>)}</tr></thead><tbody>{logs.map(log => <tr key={log.id} className="border-b border-slate-100"><td className="p-3">{log.id}</td><td className="p-3">{formatDate(log.createdAt)}</td><td className="p-3">{log.user?.fullName || log.user?.username || (log.userId ? '#' + log.userId : 'Hệ thống')}</td><td className="p-3"><span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">{actionLabel(log.action)}</span></td><td className="p-3 font-medium text-slate-700">{entityLabel(log.entityType)}</td><td className="p-3">{log.ipAddress || '—'}</td><td className="p-3"><button className="font-semibold text-orange-600" onClick={() => setSelected(log)}>Xem log</button></td></tr>)}{!logs.length && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Không có nhật ký phù hợp.</td></tr>}</tbody></table></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm text-slate-500">Trang {page}/{pages} · {total} nhật ký</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setQuery(current => ({...current,page:page-1}))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={page >= pages} onClick={() => setQuery(current => ({...current,page:page+1}))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div></div></>}
    </section>
    <p className="text-sm text-slate-500">Backend hiện chưa cung cấp số liệu CPU, RAM, uptime hoặc trạng thái mô hình AI.</p>
    {selected && <AuditLogDetails log={selected} onClose={closeDetails} />}
  </div>;
}
