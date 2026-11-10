export const placementStatuses = ["REJECTED", "ACCEPTED", "APPLIED", "WAITING_RESPONSE", "NOT_APPLIED", "RECEIVED"] as const;
export type PlacementStatus = typeof placementStatuses[number];

export const placementStatusLabels: Record<PlacementStatus, string> = {
  REJECTED: "Doanh nghiệp từ chối",
  ACCEPTED: "Doanh nghiệp đã nhận",
  APPLIED: "Đã ứng tuyển",
  WAITING_RESPONSE: "Chờ phản hồi DN",
  NOT_APPLIED: "Chưa ứng tuyển",
  RECEIVED: "Thực nhận",
};

export const placementStatusColors: Record<PlacementStatus, string> = {
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  ACCEPTED: "border-blue-200 bg-blue-50 text-blue-700",
  APPLIED: "border-amber-200 bg-amber-50 text-amber-800",
  WAITING_RESPONSE: "border-violet-200 bg-violet-50 text-violet-700",
  NOT_APPLIED: "border-slate-200 bg-slate-100 text-slate-600",
  RECEIVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function placementStatus(student: { receivedAt?: string | null; decision?: string | null; registrationId?: number | null; registrationStatus?: string | null }): PlacementStatus {
  if (student.receivedAt) return "RECEIVED";
  if (student.decision === "ACCEPTED") return "ACCEPTED";
  if (student.decision === "REJECTED") return "REJECTED";
  if (student.decision === "PENDING") return "WAITING_RESPONSE";
  if (!student.decision && student.registrationId && ['SUBMITTED', 'APPROVED'].includes(student.registrationStatus ?? '')) return "APPLIED";
  return "NOT_APPLIED";
}
