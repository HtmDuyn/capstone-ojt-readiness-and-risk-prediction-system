import type { HandoffStudentItem } from "@/types/qhdn/qhdnTypes";

export type ReceptionStatus = "NOT_REGISTERED" | "SUBMITTED" | "APPROVED";
export type PlacementStatus = "UNSENT" | "PENDING" | "ACCEPTED" | "REJECTED";
export const receptionLabels: Record<ReceptionStatus, string> = {
  NOT_REGISTERED: "Chưa đăng ký",
  SUBMITTED: "Đã nộp hồ sơ",
  APPROVED: "Đã duyệt",
};
export const placementLabels: Record<PlacementStatus, string> = {
  UNSENT: "Cần điều phối",
  PENDING: "Chờ doanh nghiệp duyệt",
  ACCEPTED: "Đã tiếp nhận",
  REJECTED: "Doanh nghiệp từ chối",
};
export const registrationId = (s: HandoffStudentItem) =>
  s.registration?.id ?? s.registrationId ?? undefined;
export const registrationStatus = (s: HandoffStudentItem) =>
  s.registration?.status ?? s.registrationStatus;
export const coordinationId = (s: HandoffStudentItem) =>
  s.coordination?.id ?? s.coordinationId;
export function receptionStatus(s: HandoffStudentItem): ReceptionStatus {
  if (registrationStatus(s) === "APPROVED") return "APPROVED";
  return registrationId(s) ? "SUBMITTED" : "NOT_REGISTERED";
}
export function receptionNote(s: HandoffStudentItem): string | undefined {
  if (registrationStatus(s) === "REJECTED")
    return "Hồ sơ cần bổ sung và nộp lại trước khi duyệt.";
  if (
    ["HANDED_OFF", "LEGACY_REVIEW_REQUIRED"].includes(
      registrationStatus(s) || "",
    )
  )
    return "Hồ sơ cũ cần được đối soát trước khi duyệt.";
}
export function placementStatus(s: HandoffStudentItem): PlacementStatus {
  if (!coordinationId(s)) return "UNSENT";
  const decision = (
    s.coordination?.decision ??
    s.enterpriseDecision ??
    s.coordinationStatus ??
    ""
  ).toUpperCase();
  if (["ACCEPTED", "ACCEPT", "APPROVED"].includes(decision)) return "ACCEPTED";
  if (["REJECTED", "REJECT"].includes(decision)) return "REJECTED";
  return "PENDING";
}
export const companyName = (s: HandoffStudentItem) =>
  s.company?.name || s.enterpriseName || "Chưa có doanh nghiệp";
export const programName = (s: HandoffStudentItem) =>
  s.programName || s.program?.name || s.major || "Chưa cập nhật";
export const studentMatches = (s: HandoffStudentItem, search: string) =>
  [
    s.fullName,
    s.studentCode,
    s.email,
    companyName(s),
    s.positionTitle,
    s.position?.title,
  ].some((v) =>
    String(v || "")
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi")),
  );
