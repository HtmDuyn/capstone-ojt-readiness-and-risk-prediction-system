import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type {
  HandoffStudentItem,
} from "@/types/qhdn/qhdnTypes";
import type { useQhdnAcademicPeriods } from "@/hooks/useQhdnAcademicPeriods";
import { academicPeriodLabel } from "@/utils/qhdnAcademicPeriods";
import {
  placementLabels,
  receptionLabels,
  type PlacementStatus,
  type ReceptionStatus,
} from "@/utils/qhdnStudentStatus";

export const workflowInput =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400";
export const workflowPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50";
export const workflowSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50";
const tones = {
  NOT_REGISTERED: "border-slate-200 bg-slate-50 text-slate-600",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UNSENT: "border-orange-200 bg-orange-50 text-orange-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};
export function WorkflowBadge({
  status,
}: {
  status: ReceptionStatus | PlacementStatus;
}) {
  const Icon =
    status === "REJECTED"
      ? XCircle
      : ["APPROVED", "ACCEPTED"].includes(status)
        ? CheckCircle2
        : status === "PENDING"
          ? Clock3
          : status === "NOT_REGISTERED"
            ? Users
            : FileText;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold " +
        tones[status]
      }
    >
      <Icon size={13} />
      {status in receptionLabels
        ? receptionLabels[status as ReceptionStatus]
        : placementLabels[status as PlacementStatus]}
    </span>
  );
}
export function StudentIdentity({ student }: { student: HandoffStudentItem }) {
  return (
    <div className="flex min-w-[190px] items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-sm font-bold text-orange-700">
        {student.fullName
          ?.split(" ")
          .filter(Boolean)
          .slice(-2)
          .map((n) => n[0])
          .join("") || "SV"}
      </span>
      <div>
        <p className="font-semibold text-slate-900">
          {student.fullName || "Chưa cập nhật"}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {student.studentCode}
          {student.cohortName ? " · " + student.cohortName : ""}
        </p>
      </div>
    </div>
  );
}
export function WorkflowSteps({
  current,
}: {
  current: "reception" | "placement";
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 text-xs font-medium text-slate-500">
      {[
        "Đào tạo bàn giao",
        "Sinh viên gửi trực tiếp",
        "Doanh nghiệp phản hồi",
        "Theo dõi thực tập",
      ].map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className={
              "flex h-6 w-6 items-center justify-center rounded-full " +
              ((current === "reception" ? i === 1 : i === 2)
                ? "bg-orange-600 text-white"
                : "bg-slate-100 text-slate-500")
            }
          >
            {i === 0 ? <Check size={12} /> : i + 1}
          </span>
          <span
            className={
              (current === "reception" ? i === 1 : i === 2)
                ? "font-semibold text-orange-700"
                : ""
            }
          >
            {label}
          </span>
          {i < 3 && <ArrowRight size={14} className="ml-1 text-slate-300" />}
        </div>
      ))}
    </div>
  );
}
export function AcademicPeriodFilter({
  selection,
  disabled,
  controlClassName = workflowInput,
}: {
  selection: ReturnType<typeof useQhdnAcademicPeriods>;
  disabled?: boolean;
  controlClassName?: string;
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
        Năm học
        <select aria-label="Năm học" className={controlClassName} value={selection.yearId}
          disabled={disabled || selection.loading} onChange={(e) => selection.selectYear(e.target.value)}>
          <option value="">Tất cả năm học</option>
          {selection.years.map((year) => <option key={year.id} value={year.id}>{year.code}</option>)}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-500">
        Học kỳ / Block 3
        <select aria-label="Học kỳ / Block 3" className={controlClassName + " max-w-full sm:max-w-md"}
          value={selection.periodId} disabled={disabled || selection.loading || !selection.filteredPeriods.length}
          onChange={(e) => selection.selectPeriod(e.target.value)}>
          {selection.allowAll && <option value="ALL">Tất cả học kỳ / Block 3</option>}
          {!selection.filteredPeriods.length && <option value="">{selection.loading ? "Đang tải…" : "Không có học kỳ / Block 3"}</option>}
          {selection.years.filter((year) => !selection.yearId || String(year.id) === selection.yearId).map((year) => (
            <optgroup key={year.id} label={year.code}>
              {selection.filteredPeriods.filter((p) => p.academicYearId === year.id).map((period) => (
                <option key={period.id} value={period.id}>{academicPeriodLabel(period)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
export function StatCard({
  title,
  value,
  caption,
  status,
  selected,
  onClick,
  loading,
}: {
  title: string;
  value: number;
  caption: string;
  status: ReceptionStatus | PlacementStatus;
  selected?: boolean;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
        (selected
          ? "border-orange-400 ring-2 ring-orange-100"
          : "border-slate-200")
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        <span className={"rounded-lg border p-2 " + tones[status]}>
          {status === "REJECTED" ? (
            <XCircle size={18} />
          ) : status === "PENDING" ? (
            <Clock3 size={18} />
          ) : ["APPROVED", "ACCEPTED"].includes(status) ? (
            <CheckCircle2 size={18} />
          ) : (
            <Users size={18} />
          )}
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {loading ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </button>
  );
}
export function EmptyStudents({
  loading,
  title = "Không tìm thấy sinh viên phù hợp",
  description = "Thử thay đổi bộ lọc hoặc chọn học kỳ khác.",
}: {
  loading?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center px-6 py-14 text-center"
    >
      <span className="mb-4 rounded-2xl bg-slate-50 p-4 text-slate-400">
        {loading ? (
          <Clock3 className="animate-pulse" size={28} />
        ) : (
          <Inbox size={28} />
        )}
      </span>
      <p className="font-semibold text-slate-700">
        {loading ? "Đang tải danh sách sinh viên…" : title}
      </p>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {loading ? "Dữ liệu đang được cập nhật từ hệ thống." : description}
      </p>
    </div>
  );
}
export function WorkflowModal({
  title,
  subtitle,
  busy,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  // Đưa dialog ra ngoài layout để header/sidebar không che popup trên mobile.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close.current();
      }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          "my-3 w-full overflow-hidden rounded-3xl bg-white shadow-2xl outline-none sm:my-6 " +
          (wide ? "max-w-4xl" : "max-w-2xl")
        }
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) close.current();
          if (e.key === "Tab") {
            const nodes = [
              ...(panel.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
              ) || []),
            ].filter((n) => n.getClientRects().length);
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (!first) {
              e.preventDefault();
              return;
            }
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault();
              last.focus();
            } else if (
              !e.shiftKey &&
              (document.activeElement === last ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className={workflowSecondary + " !p-2"}
            onClick={onClose}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
