import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Page } from "@/types/qhdn/workflowTypes";
import { pageNumbers } from '@/utils/qhdn/qhdnPagination';

export const control =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50";
export const action =
  "rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50";
export function errorMessage(error: unknown): string {
  const e = error as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  if (e.response?.status === 401)
    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  return (
    e.response?.data?.message ||
    e.message ||
    "Không thực hiện được yêu cầu. Vui lòng thử lại."
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-slate-800"
    >
      {children}
    </p>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
export function Pager({
  page: requestedPage,
  total,
  limit,
  busy,
  onChange,
  onLimitChange,
}: {
  page: number;
  total: number;
  limit: number;
  busy: boolean;
  onChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.max(1, Math.min(requestedPage, pages));
  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-3 text-slate-500">
        <span aria-live="polite">{total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} / {total} bản ghi · Trang {page}/{pages}</span>
        {onLimitChange && <label className="flex items-center gap-2 text-xs">
          Số dòng/trang
          <select aria-label="Số dòng mỗi trang" className={control + ' !py-1.5'} disabled={busy} value={limit} onChange={event => onLimitChange(Number(event.target.value))}>
            {[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={control}
          disabled={busy || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        {pageNumbers(page, pages).map((number, index) => number === 'ellipsis'
          ? <span key={`gap-${index}`} className="px-1 text-slate-400" aria-hidden="true">…</span>
          : <button type="button" key={number} aria-label={`Trang ${number}`} aria-current={number === page ? 'page' : undefined}
              className={control + (number === page ? ' !border-orange-600 !bg-orange-600 font-semibold text-white' : ' hover:border-orange-300 hover:bg-orange-50')}
              disabled={busy || number === page} onClick={() => onChange(number)}>{number}</button>)}
        <button
          type="button"
          className={control}
          disabled={busy || page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </nav>
  );
}
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th scope="col" className={'whitespace-nowrap p-3 ' + (h === 'STT' ? 'w-16 text-center' : '')} key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y [&_td]:p-3">{children}</tbody>
      </table>
    </div>
  );
}

export function useIdempotencyKey() {
  const last = useRef({ signature: "", key: "" });
  // Dùng lại key khi gửi lại cùng dữ liệu sau lỗi mạng.
  return (payload: unknown) => {
    const signature = JSON.stringify(payload);
    if (last.current.signature !== signature)
      last.current = { signature, key: crypto.randomUUID() };
    return last.current.key;
  };
}

// Bỏ phản hồi cũ khi đổi bộ lọc hoặc rời trang.
export function usePaged<T>(
  loader: (page: number, signal: AbortSignal) => Promise<Page<T>>,
  key: string,
  enabled = true,
) {
  const [selection, setSelection] = useState({ key, page: 1 }),
    [data, setData] = useState<Page<T>>({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const latest = useRef(loader);
  latest.current = loader;
  const page = selection.key === key ? selection.page : 1;
  const setPage = useCallback((next: number) => setSelection({ key, page: next }), [key]);
  const reload = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setSelection(current => current.key === key ? current : { key, page: 1 });
    setData({ items: [], total: 0, page, limit: 10 });
    setError("");
    if (!enabled) {
      setBusy(false);
      return;
    }
    setBusy(true);
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return latest.current(page, controller.signal);
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value);
          const last = Math.max(1, Math.ceil(value.total / value.limit));
          if (page > last) setPage(last);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [key, page, revision, enabled, setPage]);
  return {
    page,
    setPage,
    data,
    busy,
    error,
    reload,
  };
}
