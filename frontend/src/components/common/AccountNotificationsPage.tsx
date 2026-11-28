import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight, Loader2, Mail, MailOpen, RefreshCw, Search, X } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  getAccountNotifications,
  markAccountNotificationRead,
  type AccountNotification,
  type AccountNotificationPage,
} from '@/services/apiService';

const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export function AccountNotificationsPage({
  description,
  badge,
  bannerVariant = 'default',
  banner,
  showRefreshAction = true,
  detailed = false,
}: {
  description: string;
  badge: string;
  bannerVariant?: 'default' | 'enterprise' | 'qhdn';
  banner?: ReactNode;
  showRefreshAction?: boolean;
  detailed?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AccountNotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [selected, setSelected] = useState<AccountNotification | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void getAccountNotifications(page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      const lastPage = Math.max(1, Math.ceil(result.total / result.limit));
      if (page > lastPage) { setPage(lastPage); return; }
      setData(result);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Không tải được thông báo. Vui lòng thử lại.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [page, revision]);

  const read = async (item: AccountNotification) => {
    if (item.isRead || saving.current || loading) return;
    saving.current = true;
    setSavingId(item.id);
    setActionError('');
    try {
      await markAccountNotificationRead(item.id);
      setData(previous => previous ? {
        ...previous,
        unreadCount: Math.max(0, previous.unreadCount - (previous.items.some(row => row.id === item.id && !row.isRead) ? 1 : 0)),
        items: previous.items.map(row => row.id === item.id ? { ...row, isRead: true } : row),
      } : previous);
    } catch {
      setActionError('Không cập nhật được trạng thái thông báo. Vui lòng thử lại.');
    } finally {
      saving.current = false;
      setSavingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));
  const reload = () => { setActionError(''); setRevision(value => value + 1); };
  const visibleItems = data?.items.filter(item =>
    (!onlyUnread || !item.isRead) && `${item.title} ${item.content}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  ) ?? [];
  const markAll = async () => {
    const unread = data?.items.filter(item => !item.isRead) ?? [];
    if (!unread.length || saving.current || loading) return;
    saving.current = true;
    setSavingAll(true);
    setActionError('');
    try {
      for (const item of unread) await markAccountNotificationRead(item.id);
      setData(previous => previous ? {
        ...previous,
        unreadCount: Math.max(0, previous.unreadCount - unread.length),
        items: previous.items.map(item => ({ ...item, isRead: true })),
      } : previous);
      setSelected(previous => previous ? { ...previous, isRead: true } : previous);
    } catch {
      setActionError('Không cập nhật được trạng thái thông báo. Vui lòng thử lại.');
    } finally {
      saving.current = false;
      setSavingAll(false);
    }
  };

  if (detailed) return <div className="space-y-5 pb-12">
    {banner ?? <PageBanner title="Thông báo" description={description} badge={badge} variant={bannerVariant} />}
    <section className="grid gap-3 sm:grid-cols-2" aria-label="Tổng quan thông báo">
      <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-4 shadow-sm sm:p-5"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100"><Bell size={22}/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Chưa đọc</p><p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900">{data?.unreadCount ?? '—'}</p></div><span className="ml-auto hidden text-sm text-slate-500 sm:block">Thông báo cần bạn xem</span></div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MailOpen size={22}/></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng thông báo</p><p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900">{data?.total ?? '—'}</p></div><span className="ml-auto hidden text-sm text-slate-500 sm:block">Toàn bộ hộp thư</span></div>
    </section>
    <section aria-label="Danh sách thông báo" className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/40 px-5 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">Hộp thư {badge}</p><h2 className="mt-1 text-lg font-bold text-slate-900">Thông báo</h2><p className="mt-1 text-sm text-slate-500">Theo dõi các cập nhật gửi đến tài khoản của bạn.</p></div><span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700"><span className="size-2 rounded-full bg-orange-500"/>{data?.unreadCount ?? '—'} chưa đọc</span></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label="Tìm thông báo" placeholder="Tìm trong thông báo của trang này..." value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"/></div>
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm font-semibold transition ${onlyUnread ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><input type="checkbox" className="size-4 accent-orange-600" checked={onlyUnread} onChange={event => setOnlyUnread(event.target.checked)}/>Chỉ chưa đọc</label>
          <button type="button" disabled={loading || savingId !== null || savingAll || !data?.items.some(item => !item.isRead)} onClick={() => void markAll()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck size={17}/>{savingAll ? 'Đang lưu...' : 'Đọc tất cả trang này'}</button>
          {showRefreshAction && <button type="button" className={buttonClass + ' min-h-11'} disabled={loading || savingId !== null || savingAll} onClick={reload}><RefreshCw size={16}/>Tải lại</button>}
        </div>
      </div>
      {(error || actionError) && <div role="alert" className="border-b border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error || actionError}{error && showRefreshAction && <button type="button" onClick={reload} className="ml-2 underline">Thử lại</button>}</div>}
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={20} className="animate-spin"/>Đang tải thông báo…</div>
        : !error && !visibleItems.length ? <div className="flex flex-col items-center gap-3 p-12 text-sm text-slate-500"><Bell size={30} className="text-slate-300"/>Không có thông báo phù hợp.</div>
        : !error && <div className="space-y-3 p-4 sm:p-5">{visibleItems.map(item => <article key={item.id} className={'flex items-start gap-3 rounded-2xl border p-4 transition-colors sm:gap-4 ' + (item.isRead ? 'border-slate-200/80 bg-white hover:bg-slate-50/70' : 'border-orange-100 bg-orange-50/45 hover:bg-orange-50/80')}>
          <span className={'mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ' + (item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700')} aria-hidden="true">{item.isRead ? <MailOpen size={18}/> : <Mail size={18}/>}</span>
          <button type="button" className="min-w-0 flex-1 space-y-1.5 text-left" onClick={() => { setSelected(item); if (!item.isRead) void read(item); }}><h3 className={'flex flex-wrap items-center gap-2 text-sm text-slate-900 ' + (item.isRead ? 'font-semibold' : 'font-bold')}><span className="break-words">{item.title}</span>{!item.isRead && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">Mới</span>}</h3><p className="line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{item.content}</p><p className="pt-1 text-xs font-medium text-slate-400">{item.sentAt ? new Date(item.sentAt).toLocaleString('vi-VN') : '—'}</p></button>
          {item.isRead ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-400"><Check size={14}/>Đã đọc</span> : <button type="button" aria-label={`Đánh dấu đã đọc: ${item.title}`} onClick={() => void read(item)} disabled={savingId !== null || savingAll} className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50">{savingId === item.id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</button>}
        </article>)}</div>}
      {data && totalPages > 1 && <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 sm:px-5"><span className="text-xs text-slate-500">Trang {page}/{totalPages}</span><div className="flex gap-2"><button type="button" aria-label="Trang trước" className={buttonClass} disabled={page <= 1 || loading || savingId !== null || savingAll} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16}/>Trước</button><button type="button" aria-label="Trang sau" className={buttonClass} disabled={page >= totalPages || loading || savingId !== null || savingAll} onClick={() => setPage(value => value + 1)}>Sau<ChevronRight size={16}/></button></div></div>}
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="Chi tiết thông báo" className="max-h-[85vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"><header className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Bell size={21}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-orange-700">Chi tiết thông báo</p><h2 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900">{selected.title}</h2><p className="mt-1 text-xs text-slate-500">{selected.sentAt ? new Date(selected.sentAt).toLocaleString('vi-VN') : '—'}</p></div><button type="button" aria-label="Đóng" onClick={() => setSelected(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></header><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{selected.content}</p><div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700" onClick={() => setSelected(null)}>Đóng</button></div></section></div>}
  </div>;

  return <div className="space-y-6 pb-12">
    {banner ?? <PageBanner title="Thông báo" description={description} badge={badge} variant={bannerVariant} />}
    <section aria-label="Danh sách thông báo" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-900">Thông báo của bạn</h2>
          <p className="mt-1 text-sm text-slate-500">{data ? `${data.unreadCount} chưa đọc · ${data.total} thông báo` : 'Thông báo mới nhất từ hệ thống'}</p>
        </div>
        {showRefreshAction && <button type="button" className={buttonClass} disabled={loading || savingId !== null} onClick={reload}><RefreshCw size={16} />Tải lại</button>}
      </div>
      {(error || actionError) && <div role="alert" className="border-b border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error || actionError}{error && showRefreshAction && <button type="button" onClick={reload} className="ml-2 underline">Thử lại</button>}</div>}
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={20} className="animate-spin" />Đang tải thông báo…</div>
        : !error && !data?.items.length ? <div className="flex flex-col items-center gap-3 p-12 text-sm text-slate-500"><Bell size={30} className="text-slate-300" />Chưa có thông báo.</div>
        : !error && data?.items.map(item => <article key={item.id} className={'flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-start sm:px-6 ' + (item.isRead ? '' : 'bg-orange-50/50')}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className={'break-words text-sm text-slate-900 ' + (item.isRead ? 'font-medium' : 'font-semibold')}>{item.title}</h3>{!item.isRead && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Mới</span>}</div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{item.content}</p>
            <p className="mt-2 text-xs text-slate-400">{item.sentAt ? new Date(item.sentAt).toLocaleString('vi-VN') : '—'}</p>
          </div>
          {item.isRead ? <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-400"><Check size={14} />Đã đọc</span>
            : <button type="button" onClick={() => void read(item)} disabled={savingId !== null} className={buttonClass + ' shrink-0 self-start text-orange-700'}>{savingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Đánh dấu đã đọc</button>}
        </article>)}
      {data && totalPages > 1 && <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
        <span className="text-xs text-slate-500">Trang {page}/{totalPages}</span>
        <div className="flex gap-2"><button type="button" aria-label="Trang trước" className={buttonClass} disabled={page <= 1 || loading || savingId !== null} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} />Trước</button><button type="button" aria-label="Trang sau" className={buttonClass} disabled={page >= totalPages || loading || savingId !== null} onClick={() => setPage(value => value + 1)}>Sau<ChevronRight size={16} /></button></div>
      </div>}
    </section>
  </div>;
}
