import { useEffect, useRef, useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import {
  getStudentNotifications,
  markStudentNotificationRead,
  type StudentNotification,
} from '@/services/studentService';
import {
  buttonClass,
  Card,
  dateText,
  Empty,
  inputClass,
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
  const [readIds, setReadIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const key = profile!.id + ':' + revision + ':' + page + ':' + onlyUnread;
  const resource = useStudentResource(key, (signal) =>
    getStudentNotifications(page, signal, onlyUnread ? true : undefined),
  );
  useEffect(() => {
    setSelected(null);
    setReadIds([]);
  }, [key]);
  useEffect(() => {
    if (!resource.data) return;
    setUnreadCount(resource.data.unreadCount);
    const max = Math.max(1, Math.ceil(resource.data.total / 20));
    if (page > max) setPage(max);
  }, [resource.data, page, setUnreadCount]);
  const isRead = (item: StudentNotification) =>
    Boolean(item.isRead) || readIds.includes(item.id);
  const markRead = async (items: StudentNotification[]) => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      for (const item of items.filter((row) => !isRead(row))) {
        const response = await markStudentNotificationRead(String(item.id));
        setReadIds((previous) => [...previous, item.id]);
        setUnreadCount(response.data.unreadCount);
        setSelected((previous) =>
          previous?.id === item.id ? { ...previous, isRead: true } : previous,
        );
      }
      resource.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không lưu được trạng thái đã đọc.',
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  const visible = resource.data?.items.filter(
    (item) =>
      (!onlyUnread || !isRead(item)) &&
      (item.title + ' ' + (item.content ?? ''))
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  return (
    <Card title={'Thông báo của bạn · ' + (unreadCount ?? '—') + ' chưa đọc'}>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          className={inputClass + ' sm:max-w-md'}
          aria-label="Tìm thông báo trong trang"
          placeholder="Tìm nội dung trong trang hiện tại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyUnread}
            disabled={saving}
            onChange={(e) => {
              setOnlyUnread(e.target.checked);
              setPage(1);
            }}
          />
          Chỉ chưa đọc
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={
            saving ||
            resource.loading ||
            !resource.data?.items.some((item) => !isRead(item))
          }
          onClick={() => void markRead(resource.data?.items ?? [])}
        >
          {saving ? 'Đang lưu...' : 'Đọc tất cả trong trang'}
        </button>
      </div>
      {visible?.map((item) => (
        <article
          key={item.id}
          className={
            'rounded-2xl border p-4 flex items-start gap-4 ' +
            (isRead(item)
              ? 'border-slate-100 bg-white'
              : 'border-orange-200 bg-orange-50/50')
          }
        >
          <button
            type="button"
            className="text-left flex-1 space-y-2"
            onClick={() => {
              setSelected(item);
              if (!isRead(item)) void markRead([item]);
            }}
          >
            <h3 className={isRead(item) ? 'font-medium' : 'font-bold'}>
              {item.title}
            </h3>
            <p className="line-clamp-2 text-sm text-slate-600">
              {item.content}
            </p>
            <p className="text-xs text-slate-500">{dateText(item.sentAt)}</p>
          </button>
          <button
            type="button"
            className="text-sm text-orange-700 disabled:text-slate-400"
            disabled={saving || isRead(item)}
            onClick={() => void markRead([item])}
          >
            {isRead(item) ? 'Đã đọc' : 'Đánh dấu đã đọc'}
          </button>
        </article>
      ))}
      {!resource.loading && !resource.error && !visible?.length && (
        <Empty>Không có thông báo phù hợp.</Empty>
      )}
      {resource.data && (
        <Pagination
          page={page}
          total={resource.data.total}
          onChange={setPage}
          disabled={saving}
        />
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết thông báo"
            className="w-full max-w-xl rounded-3xl bg-white p-6 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold">{selected.title}</h2>
            <p className="text-xs text-slate-500">
              {dateText(selected.sentAt)}
            </p>
            <p className="text-sm whitespace-pre-wrap">{selected.content}</p>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <button
              type="button"
              className={buttonClass}
              onClick={() => setSelected(null)}
            >
              Đóng
            </button>
          </section>
        </div>
      )}
    </Card>
  );
}
export const StudentNotifications = () => {
  const { profile, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Trung tâm thông báo"
      description="Thông báo học vụ và thực tập được gửi đến tài khoản của bạn."
      needsSemester={false}
    >
      {!loading && profile && <NotificationsContent key={profile.id} />}
    </StudentPage>
  );
};
export default StudentNotifications;
