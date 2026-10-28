import type {
  AcademicPeriodItem,
  EnterpriseImportRow,
  EnterpriseImportPayload,
  ImportPreviewApiResponse,
  ImportPreviewResponse,
  ImportPreviewRowResult,
  PositionListItem,
} from "../types/qhdn/qhdnTypes";
import type { RecruitmentWindow } from "../types/qhdn/workflowTypes";

export function enterpriseImportPeriods(
  periods: AcademicPeriodItem[],
  windows: RecruitmentWindow[],
  now = Date.now(),
) {
  return periods.flatMap((period) => {
    if (period.kind !== "SEMESTER") return [];
    const semesterId = period.ojtSemesterId || period.ojt?.id;
    if (!Number.isSafeInteger(semesterId) || !semesterId || semesterId <= 0) return [];
    const matches = [...new Map(windows.map((window) => [window.id, window])).values()]
      .filter((window) =>
        Number.isSafeInteger(window.id) && window.id > 0 &&
        window.academicPeriodId === period.id &&
        (window.ojtSemesterId === undefined || window.ojtSemesterId === semesterId) &&
        window.status === "OPEN" &&
        Date.parse(window.startsAt ?? "") <= now &&
        Date.parse(window.endsAt ?? "") > now,
      );
    return [{
      id: period.id,
      semesterId,
      name: period.ojt?.name || period.name,
      code: period.periodCode,
      window: matches.length === 1 ? matches[0] : undefined,
    }];
  });
}

export function selectEnterpriseImportPayload(
  source: EnterpriseImportPayload,
  selectedCodes: ReadonlySet<string>,
  idempotencyKey: string,
): EnterpriseImportPayload {
  const rows = source.rows.filter((row) => selectedCodes.has(row.code));
  if (!rows.length)
    throw new Error("Chọn ít nhất một doanh nghiệp để import.");
  if (rows.length !== selectedCodes.size)
    throw new Error("Danh sách doanh nghiệp đã chọn không khớp với file.");
  return { ...source, idempotencyKey, rows };
}

export function buildEnterpriseImportPreviewRows(
  results: ImportPreviewRowResult[],
  enterprises: EnterpriseImportRow[],
) {
  const byCode = new Map(
    enterprises.map((enterprise) => [
      enterprise.code.trim().toUpperCase(),
      enterprise,
    ]),
  );
  return results.map((result) => {
    const enterprise = byCode.get(result.code?.trim().toUpperCase() ?? "");
    return {
      ...result,
      enterprise,
      totalCapacity: enterprise?.positions.reduce(
        (total, position) => total + position.capacity,
        0,
      ),
    };
  });
}

export function normalizeEnterpriseImportPreview(
  response: ImportPreviewApiResponse,
): ImportPreviewResponse {
  const errors = response.errors ?? [];
  const rows = response.rows ?? [];
  // Account-import previews return row actions and counts without canCommit.
  const validSummary =
    [response.total, response.created, response.updated].every(
      (count) => Number.isSafeInteger(count) && count >= 0,
    ) && response.total > 0;
  return {
    ...response,
    errors,
    rows,
    canCommit:
      response.success === true &&
      response.preview === true &&
      response.canCommit !== false &&
      validSummary &&
      errors.length === 0 &&
      !rows.some((row) => row.action === "ERROR" || row.error),
  };
}

export const recruitmentLabels: Record<string, string> = {
  ACTIVE: "Đang hợp tác",
  INACTIVE: "Ngừng hợp tác",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã công bố",
  REJECTED: "Đã từ chối",
  ARCHIVED: "Đã lưu trữ",
};

export function positionTotals(positions: PositionListItem[]) {
  // Chỗ còn nhận chỉ tính vị trí đang mở; không suy ra số SV đã nhận từ capacity.
  return {
    count: positions.length,
    open: positions.filter((p) => p.status === "OPEN").length,
    capacity: positions.reduce((n, p) => n + p.capacity, 0),
    available: positions.reduce(
      (n, p) => n + (p.status === "OPEN" ? p.remainingSlots : 0),
      0,
    ),
  };
}

export function importErrorText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const error = value as {
      message?: string;
      field?: string;
      rowNumber?: number;
    };
    if (error.message)
      return [
        error.rowNumber ? `Dòng ${error.rowNumber}` : "",
        error.field,
        error.message,
      ]
        .filter(Boolean)
        .join(" · ");
    return JSON.stringify(value);
  }
  return String(value ?? "Lỗi dữ liệu chưa xác định");
}
