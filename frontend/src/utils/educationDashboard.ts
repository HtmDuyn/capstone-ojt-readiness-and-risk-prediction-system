import type { AcademicAlert, AcademicPeriod, AcademicYear, CohortProgress, CourseDemand, JsonObject, PeriodStatistic } from '@/types/education/dashboard.types';

export const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getPath = (value: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isObject(current)) return undefined;
    return current[key];
  }, value);
};

export const readValue = (value: unknown, paths: string[]): unknown => {
  const sources = [
    value,
    getPath(value, "data"),
    getPath(value, "result"),
    getPath(value, "data.data"),
    getPath(value, "data.result"),
  ];

  for (const source of sources) {
    for (const path of paths) {
      const result = getPath(source, path);

      if (result !== undefined && result !== null) {
        return result;
      }
    }
  }

  return undefined;
};

export const readString = (value: unknown, paths: string[]): string | null => {
  const result = readValue(value, paths);

  if (typeof result === "string" && result.trim()) {
    return result.trim();
  }

  if (typeof result === "number" && Number.isFinite(result)) {
    return String(result);
  }

  return null;
};

export const readNumber = (value: unknown, paths: string[]): number | null => {
  const result = readValue(value, paths);

  if (typeof result === "number" && Number.isFinite(result)) {
    return result;
  }

  if (
    typeof result === "string" &&
    result.trim() !== "" &&
    Number.isFinite(Number(result))
  ) {
    return Number(result);
  }

  return null;
};

export const readList = (value: unknown, paths: string[] = []): JsonObject[] => {
  if (Array.isArray(value)) {
    return value.filter(isObject);
  }

  const candidates = [
    ...paths,
    "items",
    "rows",
    "results",
    "content",
    "records",
    "list",
    "data.items",
    "data.rows",
    "data.results",
    "data",
    "result.items",
    "result",
  ];

  for (const path of candidates) {
    const result = readValue(value, [path]);

    if (Array.isArray(result)) {
      return result.filter(isObject);
    }
  }

  return [];
};

export const formatNumber = (value: number | null): string => {
  if (value === null) return "—";

  return new Intl.NumberFormat("vi-VN").format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })}%`;
};

export const formatDate = (value: string | null): string => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
};

export const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, value));

export const toApiId = (value: string): string | number =>
  /^\d+$/.test(value) ? Number(value) : value;

export const getErrorMessage = (error: unknown): string => {
  const apiError = error as {
    response?: {
      status?: number;
      data?: unknown;
    };
    message?: string;
  };

  const status = apiError?.response?.status;

  const message = readString(apiError?.response?.data, [
    "message",
    "error.message",
    "error",
    "detail",
  ]);

  if (status === 404) {
    return "API không tồn tại trên Backend hiện tại (HTTP 404).";
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.";
  }

  if (status === 403) {
    return "Tài khoản không có quyền truy cập API này.";
  }

  if (status === 400) {
    return message || "Tham số API không hợp lệ.";
  }

  if (status) {
    return message || `Backend trả về HTTP ${status}.`;
  }

  return apiError?.message || "Không thể kết nối Backend.";
};

export const parseAcademicYears = (value: unknown): AcademicYear[] => {
  return readList(value)
    .map((item) => {
      const id = readString(item, ["id"]);
      const code = readString(item, ["yearCode", "code", "name"]);

      if (!id || !code) return null;

      return { id, code };
    })
    .filter((item): item is AcademicYear => item !== null);
};

export const parseAcademicPeriods = (value: unknown): AcademicPeriod[] => {
  return readList(value)
    .map((item) => {
      const id = readString(item, ["id"]);

      if (!id) return null;

      return {
        id,
        academicYearId: readString(item, ["academicYearId", "academicYear.id"]),
        code: readString(item, ["periodCode", "code"]) || "",
        name:
          readString(item, ["name", "periodName", "periodCode"]) || "Kỳ học",
        ojtSemesterId: readString(item, [
          "ojtSemesterId",
          "ojtSemester.id",
          "ojt.id",
        ]),
        assessmentDeadline: readString(item, [
          "assessmentDeadline",
          "ojt.assessmentDeadline",
          "ojtSemester.assessmentDeadline",
          "assessmentWindow.deadline",
        ]),
      };
    })
    .filter((item): item is AcademicPeriod => item !== null);
};

export const parsePeriodStatistics = (value: unknown): PeriodStatistic[] => {
  const items = readList(value, [
    "statistics.groups",
    "eligibilityByPeriod",
    "eligibilityTrend",
    "periodStatistics",
    "statisticsByPeriod",
    "byPeriod",
    "charts.eligibilityByPeriod",
  ]);

  return items
    .map((item) => {
      const label = readString(item, [
        "periodName",
        "academicPeriodName",
        "periodCode",
        "name",
        "label",
      ]) ?? (item.id === null ? 'Chưa phân khóa' : null);

      const eligible = readNumber(item, [
        "eligibleStudents",
        "eligibleCount",
        "eligible",
      ]);

      const ineligible = readNumber(item, [
        "ineligibleStudents",
        "ineligibleCount",
        "notEligibleCount",
        "ineligible",
        "notEligible",
      ]);

      if (!label || (eligible === null && ineligible === null)) {
        return null;
      }

      return {
        label,
        eligible: eligible ?? 0,
        ineligible: ineligible ?? 0,
      };
    })
    .filter((item): item is PeriodStatistic => item !== null);
};

export const parseCohortProgress = (value: unknown): CohortProgress[] => {
  const items = readList(value, [
    "statistics.groups",
    "cohortProgress",
    "progressByCohort",
    "cohortStatistics",
    "academicProgressByCohort",
    "charts.cohortProgress",
  ]);

  return items
    .map((item) => {
      const label = readString(item, [
        "cohortCode",
        "cohortName",
        "name",
        "label",
      ]) ?? (item.id === null ? 'Chưa phân khóa' : null);

      const total = readNumber(item, ['total']);
      const eligible = readNumber(item, ['eligible']);
      const percent = total !== null && total > 0 && eligible !== null
        ? eligible / total * 100
        : readNumber(item, [
        "completionPercentage",
        "completionPercent",
        "completionRate",
        "progressPercentage",
        "progressPercent",
      ]);

      if (!label || percent === null) return null;

      return {
        label,
        percent: clampPercent(percent),
      };
    })
    .filter((item): item is CohortProgress => item !== null);
};

export const parseCourseDemand = (value: unknown): CourseDemand[] => {
  return readList(value)
    .map((item, index) => {
      const code = readString(item, ["courseCode", "code", "course.code"]);

      const name = readString(item, ["courseName", "name", "course.name"]);

      if (!code && !name) return null;

      return {
        id: readString(item, ["id", "courseId"]) || `course-${index}`,
        code: code || "—",
        name: name || "Chưa có tên học phần",
        count: readNumber(item, [
          "studentCount",
          "demandCount",
          "affectedStudents",
          "totalStudents",
          "count",
        ]),
      };
    })
    .filter((item): item is CourseDemand => item !== null);
};

export const parseAlerts = (value: unknown): AcademicAlert[] =>
  readList(value).map((item, index) => ({
    id: readString(item, ["studentId"]) ?? String(index),
    title: [readString(item, ["studentCode"]), readString(item, ["fullName"])]
      .filter(Boolean)
      .join(" — "),
    description: Array.isArray(item.alertTypes)
      ? item.alertTypes.join(", ")
      : (readString(item, ["category"]) ?? ""),
    date: null,
  }));
