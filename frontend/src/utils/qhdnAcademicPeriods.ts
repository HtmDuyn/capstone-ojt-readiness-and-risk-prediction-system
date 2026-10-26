import type { AcademicPeriodItem } from "@/types/qhdn/qhdnTypes";

// Academic period IDs and OJT semester IDs belong to different catalogs.
export const linkedOjtSemesterId = (period?: AcademicPeriodItem): number | null =>
  period?.ojtSemesterId ?? period?.ojt?.id ?? period?.semester?.id ?? null;

export const academicPeriodStatus = (status: string): string =>
  ({ ACTIVE: "Đang diễn ra", PLANNED: "Dự kiến", CLOSED: "Đã đóng" })[status] || status;

export function academicYears(periods: AcademicPeriodItem[]) {
  return [...new Map(periods.map((p) => [p.academicYearId, {
    id: p.academicYearId,
    code: p.academicYear?.code || `Năm học #${p.academicYearId}`,
  }])).values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function preferredAcademicPeriod(periods: AcademicPeriodItem[], initialOjtId = "") {
  return periods.find((p) => initialOjtId && String(linkedOjtSemesterId(p)) === initialOjtId)
    ?? periods.find((p) => linkedOjtSemesterId(p) !== null)
    ?? periods.find((p) => p.kind === "SEMESTER" && p.status === "ACTIVE")
    ?? periods[0];
}

export const academicPeriodLabel = (period: AcademicPeriodItem) =>
  `${period.name} (${period.periodCode}) · ${period.kind === "BLOCK3" ? "Block 3" : "Học kỳ"} · ${academicPeriodStatus(period.status)}`;
