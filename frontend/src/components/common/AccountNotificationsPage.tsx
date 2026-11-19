import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Check, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
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
}: {
  description: string;
  badge: string;
  bannerVariant?: 'default' | 'enterprise' | 'qhdn';
  banner?: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AccountNotificationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
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

  return <div className="space-y-6 pb-12">
    {banner ?? <PageBanner title="Thông báo" description={description} badge={badge} variant={bannerVariant} />}
    <section aria-label="Danh sách thông báo" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-900">Thông báo của bạn</h2>
          <p className="mt-1 text-sm text-slate-500">{data ? `${data.unreadCount} chưa đọc · ${data.total} thông báo` : 'Thông báo mới nhất từ hệ thống'}</p>
        </div>
        <button type="button" className={buttonClass} disabled={loading || savingId !== null} onClick={reload}><RefreshCw size={16} />Tải lại</button>
      </div>
      {(error || actionError) && <div role="alert" className="border-b border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error || actionError}{error && <button type="button" onClick={reload} className="ml-2 underline">Thử lại</button>}</div>}
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
