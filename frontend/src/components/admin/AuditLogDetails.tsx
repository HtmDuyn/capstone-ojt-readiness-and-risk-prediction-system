import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, Clock3, FileText, Globe, UserRound, X } from 'lucide-react';
import { formatDate, ROLE_NAMES, type AuditLog } from '@/services/admin';
import { actionLabel, entityLabel, fieldLabel, isRecord, parseLogValue, valuesEqual } from './audit-display';

function LogValue({ value, name = '' }: { value: unknown; name?: string }) {
  const parsed = parseLogValue(value);
  if (parsed === null || parsed === undefined) return <span className="text-slate-400">Không có</span>;
  if (Array.isArray(parsed)) return parsed.length ? (
    <ol className="space-y-2">{parsed.map((item, index) => (
      <li key={index} className="rounded-lg border border-slate-200/80 bg-white/70 p-3">
        <p className="mb-1 text-xs font-semibold text-slate-400">Mục {index + 1}</p>
        <LogValue value={item} />
      </li>
    ))}</ol>
  ) : <span className="text-slate-400">Danh sách trống</span>;
  if (isRecord(parsed)) return Object.keys(parsed).length ? (
    <dl className="space-y-3">{Object.entries(parsed).map(([key, item]) => (
      <div key={key} className="min-w-0 border-l-2 border-slate-200 pl-3">
        <dt className="mb-1 text-xs font-medium text-slate-500">{fieldLabel(key)}</dt>
        <dd className="min-w-0"><LogValue value={item} name={key} /></dd>
      </div>
    ))}</dl>
  ) : <span className="text-slate-400">Không có trường dữ liệu</span>;
  if (typeof parsed === 'boolean') return <span className={parsed ? 'font-medium text-emerald-700' : 'text-slate-500'}>{parsed ? 'Có' : 'Không'}</span>;
  if (typeof parsed === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(parsed) && !Number.isNaN(Date.parse(parsed))) {
    return <span title={parsed}>{formatDate(parsed)}</span>;
  }
  const text = String(parsed);
  const statuses: Record<string, string> = { ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa', PENDING: 'Đang chờ', COMPLETED: 'Hoàn tất', FAILED: 'Thất bại', QUEUED: 'Đã xếp hàng', SENT: 'Đã gửi' };
  if (name.toLowerCase() === 'status' && statuses[text]) return <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{statuses[text]} · {text}</span>;
  return <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text || 'Chuỗi trống'}</span>;
}

function ChangeTable({ before, after }: { before: unknown; after: unknown }) {
  const previous = parseLogValue(before);
  const next = parseLogValue(after);
  const objectPair = (isRecord(previous) || previous == null) && (isRecord(next) || next == null);
  const rows = objectPair
    ? [...new Set([...Object.keys(isRecord(previous) ? previous : {}), ...Object.keys(isRecord(next) ? next : {})])]
      .map(key => ({ key, before: isRecord(previous) ? previous[key] : undefined, after: isRecord(next) ? next[key] : undefined }))
    : [{ key: 'detail', before: previous, after: next }];
  if (!rows.length) return <p className="p-5 text-sm text-slate-500">Không có dữ liệu trước và sau thay đổi.</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-left text-sm">
    <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="w-[26%] px-4 py-3">Trường thông tin</th><th className="w-[37%] px-4 py-3">Trước thay đổi</th><th className="w-[37%] px-4 py-3">Sau thay đổi</th></tr></thead>
    <tbody>{rows.map(row => {
      const changed = !valuesEqual(row.before, row.after);
      return <tr key={row.key} className="border-b border-slate-100 last:border-0">
        <th scope="row" className="px-4 py-4 align-top font-medium text-slate-700">{fieldLabel(row.key)}{changed && <span className="mt-2 block w-fit rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">{row.before === undefined ? 'Đã thêm' : row.after === undefined ? 'Đã bỏ' : 'Đã thay đổi'}</span>}</th>
        <td className="px-4 py-4 align-top text-slate-600"><LogValue value={row.before} name={row.key} /></td>
        <td className={'px-4 py-4 align-top ' + (changed ? 'bg-emerald-50/60 text-slate-800' : 'text-slate-600')}><LogValue value={row.after} name={row.key} /></td>
      </tr>;
    })}</tbody>
  </table></div>;
}

export default function AuditLogDetails({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const titleId = useId();
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button, summary, [href], input, select, textarea, [tabindex="0"]');
      const visible = [...(controls ?? [])].filter(element => element.getClientRects().length && !element.hasAttribute('disabled'));
      const first = visible[0], last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);
  const detail = parseLogValue(log.detail);
  const hasChanges = isRecord(detail) && ('before' in detail || 'after' in detail);
  const extraDetail = isRecord(detail) ? Object.fromEntries(Object.entries(detail).filter(([key]) => !['before', 'after', 'reason'].includes(key))) : detail;
  const hasExtra = isRecord(extraDetail) ? Object.keys(extraDetail).length > 0 : extraDetail !== undefined && extraDetail !== null;
  const reason = isRecord(detail) ? detail.reason : undefined;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-orange-50 p-3 text-orange-600"><FileText size={22} /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhật ký #{log.id}</p><h2 id={titleId} className="mt-1 text-lg font-bold text-slate-900">{actionLabel(log.action)}</h2><p className="mt-1 text-xs text-slate-500">{log.action}</p></div></div>
          <button ref={closeButton} aria-label="Đóng chi tiết nhật ký" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-orange-500"><X size={21} /></button>
        </header>
        <div className="space-y-5 overflow-y-auto bg-slate-50/60 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><UserRound size={15} />Người thực hiện</p><p className="font-semibold text-slate-800">{log.user?.fullName || log.user?.username || (log.userId ? 'Tài khoản #' + log.userId : 'Hệ thống')}</p><p className="mt-1 break-all text-sm text-slate-500">{log.user?.email || 'Không có email'}</p><p className="mt-2 text-xs text-slate-500">{log.user?.roleCode ? ROLE_NAMES[log.user.roleCode] || log.user.roleCode : 'Không có vai trò'}{log.userId != null ? ' · ID ' + log.userId : ''}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock3 size={15} />Thời điểm & nguồn truy cập</p><p className="font-semibold text-slate-800">{formatDate(log.createdAt)}</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Globe size={14} />{log.ipAddress || 'Không ghi nhận địa chỉ IP'}</p><p className="mt-2 break-words text-xs text-slate-500">Đối tượng: {entityLabel(log.entityType)}</p></div>
          </div>
          {reason !== undefined && reason !== null && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><h3 className="mb-2 font-semibold">Lý do thực hiện</h3><LogValue value={reason} /></section>}
          {hasChanges && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><h3 className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 text-sm font-bold text-slate-800"><ArrowRightLeft size={17} className="text-orange-500" />Nội dung thay đổi</h3><ChangeTable before={detail.before} after={detail.after} /></section>}
          {hasExtra && <section className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="mb-4 text-sm font-bold text-slate-800">Thông tin nghiệp vụ</h3><div className="text-sm text-slate-700"><LogValue value={extraDetail} /></div></section>}
          {!hasChanges && !hasExtra && reason == null && <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">Nhật ký này không có nội dung nghiệp vụ bổ sung.</p>}
          <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Thông tin tài khoản đầy đủ</summary><div className="mt-4 text-sm text-slate-700"><LogValue value={log.user} /></div></details>
          <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Tất cả trường dữ liệu nhật ký</summary><div className="mt-4 text-sm text-slate-700"><LogValue value={log.rawLog} /></div></details>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-5 py-4 sm:px-7"><button onClick={onClose} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">Đóng</button></footer>
      </section>
    </div>, document.body,
  );
}
