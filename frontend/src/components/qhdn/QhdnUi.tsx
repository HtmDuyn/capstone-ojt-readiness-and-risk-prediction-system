import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Page } from "@/types/qhdn/workflowTypes";

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
  page,
  total,
  limit,
  busy,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  busy: boolean;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <span>
        {total} bản ghi · Trang {page}/{pages}
      </span>
      <div className="flex gap-2">
        <button
          className={control}
          disabled={busy || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
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
              <th className="whitespace-nowrap p-3" key={h}>
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
  loader: (page: number) => Promise<Page<T>>,
  key: string,
  enabled = true,
) {
  const [page, setPage] = useState(1),
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
  const previousKey = useRef(key);
  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      setPage(1);
      if (page !== 1) return;
    }
    let active = true;
    setData({ items: [], total: 0, page, limit: 10 });
    setError("");
    if (!enabled) {
      setBusy(false);
      return;
    }
    setBusy(true);
    latest
      .current(page)
      .then((value) => {
        if (active) {
          setData(value);
          const last = Math.max(1, Math.ceil(value.total / value.limit));
          if (page > last) setPage(last);
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [key, page, revision, enabled]);
  return {
    page,
    setPage,
    data,
    busy,
    error,
    reload: () => setRevision((v) => v + 1),
  };
}
