import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Mail, MailOpen, Search, X } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import {
  getStudentNotifications,
  markStudentNotificationRead,
  type StudentNotification,
} from '@/services/studentService';
import {
  buttonClass,
  dateText,
  Empty,
  Pagination,
  ResourceState,
  StudentPage,
} from '@/components/student/PortalUI';

function NotificationsContent() {
  const { profile, revision, unreadCount, setUnreadCount } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentNotification | null>(null);
  const [readIds, setReadIds] = useState(() => new Set<number>());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const key = 'student-notifications:' + profile!.id + ':' + revision + ':' + page + ':' + onlyUnread;
  const resource = useStudentResource(key, (signal) =>
    getStudentNotifications(page, signal, onlyUnread ? true : undefined),
  );
  const totalNotifications = useStudentResource('student-notification-total:' + profile!.id + ':' + revision, signal =>
    getStudentNotifications(1, signal),
  );
  useEffect(() => {
    setSelected(null);
    setReadIds(new Set());
  }, [key]);
  useEffect(() => {
    if (!resource.data) return;
    setUnreadCount(resource.data.unreadCount);
    const max = Math.max(1, Math.ceil(resource.data.total / 20));
    if (page > max) setPage(max);
  }, [resource.data, page, setUnreadCount]);
  const isRead = (item: StudentNotification) => Boolean(item.isRead) || readIds.has(item.id);
  const markRead = async (items: StudentNotification[]) => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      for (const item of items.filter((row) => !isRead(row))) {
        const response = await markStudentNotificationRead(String(item.id));
        setReadIds(previous => new Set(previous).add(item.id));
        setUnreadCount(response.data.unreadCount);
        setSelected(previous => previous?.id === item.id ? { ...previous, isRead: true } : previous);
      }
      resource.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được trạng thái đã đọc.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const query = search.toLocaleLowerCase();
  const visible = resource.data?.items.filter(item =>
    (!onlyUnread || !isRead(item)) && (item.title + ' ' + (item.content ?? '')).toLocaleLowerCase().includes(query),
  );

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2" aria-label="Tổng quan thông báo">
      <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-4 shadow-sm sm:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100"><Bell size={22}/></span>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Chưa đọc</p><p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900">{unreadCount ?? '—'}</p></div>
        <span className="ml-auto hidden text-sm text-slate-500 sm:block">Thông báo cần bạn xem</span>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MailOpen size={22}/></span>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng thông báo</p><p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900">{totalNotifications.data?.total ?? '—'}</p></div>
        <span className="ml-auto hidden text-sm text-slate-500 sm:block">Toàn bộ hộp thư</span>
      </div>
    </section>

    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm" aria-labelledby="notifications-list-heading">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/40 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">Hộp thư của bạn</p><h2 id="notifications-list-heading" className="mt-1 text-lg font-bold text-slate-900">Thông báo</h2><p className="mt-1 text-sm text-slate-500">Cập nhật mới nhất về học vụ và thực tập.</p></div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700"><span className="size-2 rounded-full bg-orange-500"/>{unreadCount ?? '—'} chưa đọc</span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1"><Search size={17} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label="Tìm thông báo trong trang" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="Tìm trong thông báo của trang này..." value={search} onChange={event => setSearch(event.target.value)}/></div>
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-sm font-semibold transition ${onlyUnread ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><input type="checkbox" className="size-4 accent-orange-600" checked={onlyUnread} disabled={saving} onChange={event => { setOnlyUnread(event.target.checked); setPage(1); }}/>Chỉ chưa đọc</label>
          <button type="button" className={buttonClass + ' inline-flex min-h-11 items-center justify-center gap-2 rounded-xl'} disabled={saving || resource.loading || !resource.data?.items.some(item => !isRead(item))} onClick={() => void markRead(resource.data?.items ?? [])}><CheckCheck size={17}/>{saving ? 'Đang lưu...' : 'Đọc tất cả trang này'}</button>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload}/>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="divide-y divide-slate-100">
          {visible?.map(item => <article key={item.id} className={'flex items-start gap-3 rounded-2xl border p-4 transition-colors sm:gap-4 ' + (isRead(item) ? 'border-slate-200/80 bg-white hover:bg-slate-50/70' : 'border-orange-100 bg-orange-50/45 hover:bg-orange-50/80')}>
            <span className={'mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ' + (isRead(item) ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700')} aria-hidden="true">{isRead(item) ? <MailOpen size={18}/> : <Mail size={18}/>}</span>
            <button type="button" className="min-w-0 flex-1 space-y-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2" onClick={() => { setSelected(item); if (!isRead(item)) void markRead([item]); }}>
              <h3 className={'flex flex-wrap items-center gap-2 text-sm text-slate-900 ' + (isRead(item) ? 'font-semibold' : 'font-bold')}><span className="break-words">{item.title}</span>{!isRead(item) && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">Mới</span>}</h3>
              <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{item.content}</p>
              <p className="pt-1 text-xs font-medium text-slate-400">{dateText(item.sentAt)}</p>
            </button>
            <button type="button" aria-label={isRead(item) ? 'Đã đọc thông báo' : `Đánh dấu đã đọc: ${item.title}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:text-slate-400 disabled:hover:bg-transparent" disabled={saving || isRead(item)} onClick={() => void markRead([item])}>{isRead(item) ? <><Check size={14}/>Đã đọc</> : 'Đánh dấu đã đọc'}</button>
          </article>)}
        </div>
        {!resource.loading && !resource.error && !visible?.length && <Empty>Không có thông báo phù hợp.</Empty>}
        {resource.data && <div className="border-t border-slate-100 pt-4"><Pagination page={page} total={resource.data.total} onChange={setPage} disabled={saving}/></div>}
      </div>
    </section>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Chi tiết thông báo" className="max-h-[85vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
        <header className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Bell size={21}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-orange-700">Chi tiết thông báo</p><h2 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900">{selected.title}</h2><p className="mt-1 text-xs text-slate-500">{dateText(selected.sentAt)}</p></div><button type="button" aria-label="Đóng" onClick={() => setSelected(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></header>
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{selected.content}</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" className={buttonClass + ' rounded-xl px-5'} onClick={() => setSelected(null)}>Đóng</button></div>
      </section>
    </div>}
  </div>;
}

export const StudentNotifications = () => {
  const { profile, loading } = useStudentPortal();
  return <StudentPage title="Trung tâm thông báo" description="Thông báo học vụ và thực tập được gửi đến tài khoản của bạn." needsSemester={false}>
    {!loading && profile && <NotificationsContent key={profile.id}/>}
  </StudentPage>;
};
export default StudentNotifications;
