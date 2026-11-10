import { useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Notice } from "./QhdnUi";
import {
  WorkflowModal,
  workflowPrimary,
  workflowSecondary,
} from "./StudentWorkflowUi";

import { positionTotals, recruitmentLabels } from "@/utils/qhdnEnterprise";
import type { CompanyListItem, PositionListItem } from "@/types/qhdn/qhdnTypes";

export function EnterpriseStatus({ status }: { status: string }) {
  const tone = ["ACTIVE", "OPEN", "PUBLISHED"].includes(status)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "PENDING_REVIEW"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : ["REJECTED", "INACTIVE"].includes(status)
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {recruitmentLabels[status] || status}
    </span>
  );
}

export function EnterpriseDetailsModal({
  company,
  positions,
  positionsError,
  scope,
  initialTab = "overview",
  onClose,
}: {
  company: CompanyListItem;
  positions: PositionListItem[];
  positionsError: string;
  scope: string;
  initialTab?: "overview" | "positions";
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const busy = false, error = "";
  const [positionId, setPositionId] = useState<number | null>(null);
  const totals = positionTotals(positions);
  return (
    <WorkflowModal
      wide
      title={company.name}
      subtitle={`Mã ${company.code} · Thông tin đối tác và nhu cầu tiếp nhận sinh viên`}
      busy={busy}
      onClose={onClose}
    >
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {(
          [
            ["overview", "Tổng quan", Building2],
            ["positions", "Vị trí & chỉ tiêu", BriefcaseBusiness],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            disabled={busy}
            className={tab === id ? workflowPrimary : workflowSecondary}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">Tình trạng hợp tác</p>
              <p className="mt-1 font-semibold">
                {company.industry || "Chưa cập nhật lĩnh vực"}
              </p>
            </div>
            <EnterpriseStatus status={company.status} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Vị trí tuyển dụng", totals.count],
              ["Tổng chỉ tiêu", totals.capacity],
              ["Chỗ còn nhận (đang mở)", totals.available],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {positionsError ? "—" : value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Phạm vi tuyển dụng: {scope}. Tổng chỉ tiêu gồm tất cả vị trí trong
            phạm vi này.
          </p>
          {positionsError && <Notice>{positionsError}</Notice>}
          <div className="grid gap-4 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2">
            {[
              [UserRound, "Người liên hệ", company.contactPersonName],
              [Mail, "Email", company.contactEmail],
              [Phone, "Điện thoại", company.contactPhone],
              [MapPin, "Địa chỉ", company.address],
            ].map(([Icon, label, value]) => {
              const ContactIcon = Icon as typeof Mail;
              return (
                <div key={String(label)} className="flex gap-3">
                  <ContactIcon
                    size={18}
                    className="mt-1 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{String(label)}</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-800">
                      {value ? String(value) : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab === "positions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800">
                Vị trí & nhu cầu tiếp nhận
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {scope} · {positions.length} vị trí · {totals.open} đang mở
              </p>
            </div>
          </div>
          {positionsError ? (
            <Notice>{positionsError}</Notice>
          ) : !positions.length ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
              Chưa có vị trí tuyển dụng trong phạm vi đã chọn.
            </div>
          ) : (
            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {positions.map((p, index) => (
                <article
                  key={p.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-slate-800"><span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-500">STT {index + 1}</span>{p.title}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.recruitmentCode || `Vị trí #${p.id}`} ·{" "}
                        {p.semester?.name ||
                          p.semesterCode ||
                          `Kỳ OJT #${p.ojtSemesterId}`}
                      </p>
                    </div>
                    <EnterpriseStatus status={p.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                    <span>
                      Chỉ tiêu{" "}
                      <strong className="ml-1 text-slate-900">
                        {p.capacity} SV
                      </strong>
                    </span>
                    <span
                      className={
                        p.status === "OPEN" && p.remainingSlots > 0
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }
                    >
                      Còn trống <strong>{p.remainingSlots} chỗ</strong>
                    </span>
                    <button
                      className="ml-auto font-semibold text-orange-600 hover:underline"
                      onClick={() =>
                        setPositionId(positionId === p.id ? null : p.id)
                      }
                    >
                      {positionId === p.id ? "Thu gọn" : "Xem yêu cầu"}
                    </button>
                  </div>
                  {positionId === p.id && (
                    <div className="mt-4 space-y-3 border-t pt-4 text-sm text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Mô tả công việc
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {p.description || "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Yêu cầu</p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {p.requirements || "Chưa cập nhật"}
                        </p>
                      </div>
                      <p>
                        {p.location || "Chưa cập nhật địa điểm"}
                        {p.workMode ? ` · ${p.workMode}` : ""}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </WorkflowModal>
  );
}
