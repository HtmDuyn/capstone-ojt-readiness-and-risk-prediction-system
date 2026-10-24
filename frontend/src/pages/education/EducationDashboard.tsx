import { getAllItems, apiData } from "@/service/educationApi";
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Database,
  FileDown,
  GraduationCap,
  Info,
  Loader2,
  PieChart,
  RefreshCcw,
  Users,
} from "lucide-react";

import API from "@/service/api";
import { academicReportingService, downloadCourseDemand, type Cohort } from '@/service/academicReporting.service';

/* =========================================================
   API PATHS
   ========================================================= */

const API_PATHS = {
  years: "/academic-years",
  periods: "/academic-periods",
  dashboard: "/academic/dashboard",
  courseDemand: "/academic/course-demand",
  alerts: "/academic/alerts",
} as const;

type JsonObject = Record<string, unknown>;
type QueryParams = Record<string, string | number>;

interface AcademicYear {
  id: string;
  code: string;
}

interface AcademicPeriod {
  id: string;
  academicYearId: string | null;
  code: string;
  name: string;
  ojtSemesterId: string | null;
  assessmentDeadline: string | null;
}

interface PeriodStatistic {
  label: string;
  eligible: number;
  ineligible: number;
}

interface CohortProgress {
  label: string;
  percent: number;
}

interface CourseDemand {
  id: string;
  code: string;
  name: string;
  count: number | null;
}

interface AcademicAlert {
  id: string;
  title: string;
  description: string;
  date: string | null;
}

/* =========================================================
   DATA HELPERS
   ========================================================= */

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPath = (value: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isObject(current)) return undefined;
    return current[key];
  }, value);
};

const readValue = (value: unknown, paths: string[]): unknown => {
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

const readString = (value: unknown, paths: string[]): string | null => {
  const result = readValue(value, paths);

  if (typeof result === "string" && result.trim()) {
    return result.trim();
  }

  if (typeof result === "number" && Number.isFinite(result)) {
    return String(result);
  }

  return null;
};

const readNumber = (value: unknown, paths: string[]): number | null => {
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

const readList = (value: unknown, paths: string[] = []): JsonObject[] => {
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

const formatNumber = (value: number | null): string => {
  if (value === null) return "—";

  return new Intl.NumberFormat("vi-VN").format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })}%`;
};

const formatDate = (value: string | null): string => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
};

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, value));

const toApiId = (value: string): string | number =>
  /^\d+$/.test(value) ? Number(value) : value;

const getErrorMessage = (error: unknown): string => {
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

const getJson = async (
  path: string,
  params: QueryParams,
  signal: AbortSignal,
): Promise<unknown> => {
  const response = await API.get<unknown>(path, {
    params,
    signal,
  });

  return response.data;
};

/* =========================================================
   NORMALIZE ACADEMIC YEARS / PERIODS
   ========================================================= */

const parseAcademicYears = (value: unknown): AcademicYear[] => {
  return readList(value)
    .map((item) => {
      const id = readString(item, ["id"]);
      const code = readString(item, ["yearCode", "code", "name"]);

      if (!id || !code) return null;

      return { id, code };
    })
    .filter((item): item is AcademicYear => item !== null);
};

const parseAcademicPeriods = (value: unknown): AcademicPeriod[] => {
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

/* =========================================================
   NORMALIZE DASHBOARD
   ========================================================= */

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

const parseCourseDemand = (value: unknown): CourseDemand[] => {
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

const parseAlerts = (value: unknown): AcademicAlert[] =>
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

/* =========================================================
   UI COMPONENTS
   ========================================================= */

interface EmptyStateProps {
  title: string;
  description?: string;
  loading?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  loading = false,
}) => (
  <div className="flex min-h-[170px] flex-col items-center justify-center px-5 py-8 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Database size={20} />
      )}
    </div>

    <p className="mt-3 text-sm font-semibold text-slate-700">
      {loading ? "Đang tải dữ liệu..." : title}
    </p>

    {!loading && description && (
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
        {description}
      </p>
    )}
  </div>
);

const ErrorNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
    <span>{message}</span>
  </div>
);

interface MetricCardProps {
  label: string;
  value: number | null;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  loading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  icon,
  iconClass,
  loading,
}) => (
  <div className="min-w-0 p-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
    </div>

    <p className="mt-4 text-2xl font-extrabold text-slate-900">
      {loading ? (
        <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
      ) : (
        formatNumber(value)
      )}
    </p>

    <p className="mt-2 text-[11px] leading-5 text-slate-400">
      {!loading && value === null ? "Chưa có số liệu từ API" : description}
    </p>
  </div>
);

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconClass: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  description,
  iconClass,
}) => (
  <div className="flex items-start gap-3">
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      {icon}
    </div>

    <div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      )}
    </div>
  </div>
);

/* =========================================================
   EDUCATION DASHBOARD
   ========================================================= */

export const EducationDashboard: React.FC = () => {
  /* ---------------- FILTER DATA ---------------- */

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  /* ---------------- BACKEND DATA ---------------- */

  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [courseDemandData, setCourseDemandData] = useState<unknown>(null);
  const [alertsData, setAlertsData] = useState<unknown>(null);

  /* ---------------- LOADING ---------------- */

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);

  /* ---------------- ERRORS ---------------- */

  const [filtersError, setFiltersError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [courseDemandError, setCourseDemandError] = useState("");
  const [alertsError, setAlertsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  /* =====================================================
     LOAD FILTERS

     GET /api/academic-years
     GET /api/academic-periods

     Hai endpoint này đã hoạt động trên Network.
     ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    const loadFilters = async () => {
      setFiltersLoading(true);
      setFiltersError("");

      const results = await Promise.allSettled([
        getAllItems(API_PATHS.years, {}, controller.signal),
        getAllItems(API_PATHS.periods, {}, controller.signal),
        academicReportingService.cohorts(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      const errors: string[] = [];

      if (results[0].status === "fulfilled") {
        setAcademicYears(parseAcademicYears(results[0].value));
      } else {
        setAcademicYears([]);
        errors.push(`Năm học: ${getErrorMessage(results[0].reason)}`);
      }

      if (results[1].status === "fulfilled") {
        setAcademicPeriods(parseAcademicPeriods(results[1].value));
      } else {
        setAcademicPeriods([]);
        errors.push(`Kỳ học: ${getErrorMessage(results[1].reason)}`);
      }

      if (results[2].status === 'fulfilled') setCohorts(results[2].value);
      else { setCohorts([]); errors.push(`Khóa: ${getErrorMessage(results[2].reason)}`); }
      setFiltersError(errors.join(" | "));
      setFiltersLoading(false);
    };

    void loadFilters();

    return () => controller.abort();
  }, [refreshKey]);

  /* =====================================================
     SELECTED FILTERS
     ===================================================== */

  const filteredPeriods = useMemo(() => {
    if (!selectedYear) return academicPeriods;

    return academicPeriods.filter(
      (period) => period.academicYearId === selectedYear,
    );
  }, [academicPeriods, selectedYear]);

  const selectedPeriodInfo = useMemo(() => {
    return (
      academicPeriods.find((period) => period.id === selectedPeriod) || null
    );
  }, [academicPeriods, selectedPeriod]);

  const [advisory, setAdvisory] = useState<{
    periodId: string;
    semesterId: string;
    deadline: string;
  } | null>(null);
  const selectedOjtSemesterId =
    selectedPeriodInfo?.ojtSemesterId ||
    (advisory?.periodId === selectedPeriod ? advisory.semesterId : null);

  /*
   * Backend hiện không chấp nhận academicYearId
   * trong GET /academic/dashboard.
   *
   * Chỉ truyền ojtSemesterId khi kỳ học đã có
   * liên kết với kỳ OJT.
   */

  const unsupportedPeriod = !selectedOjtSemesterId;

  const dashboardParams = useMemo<QueryParams>(() => {
    const params: QueryParams = {};

    if (selectedPeriod) params.academicPeriodId = toApiId(selectedPeriod);
    if (selectedOjtSemesterId) {
      params.ojtSemesterId = toApiId(selectedOjtSemesterId);
    }
    if (selectedCohort) params.cohortId = toApiId(selectedCohort);

    return params;
  }, [selectedOjtSemesterId, selectedPeriod, selectedCohort]);

  /* =====================================================
     LOAD DASHBOARD AND COURSE DEMAND

     GET /api/academic/dashboard
     GET /api/academic/course-demand

     Truyền academicPeriodId, ojtSemesterId và cohortId khi đã chọn.
     ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError("");
      setCourseDemandError("");

      setDashboardData(null);
      setCourseDemandData(null);

      if (unsupportedPeriod) {
        setDashboardLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        getJson(
          API_PATHS.dashboard,
          {
            ...dashboardParams,
          },
          controller.signal,
        ),
        getJson(
          API_PATHS.courseDemand,
          {
            page: 1,
            limit: 20,
            ...dashboardParams,
          },
          controller.signal,
        ),
      ]);

      if (controller.signal.aborted) return;

      if (results[0].status === "fulfilled") {
        setDashboardData(results[0].value);
      } else {
        setDashboardError(getErrorMessage(results[0].reason));
      }

      if (results[1].status === "fulfilled") {
        setCourseDemandData(results[1].value);
      } else {
        setCourseDemandError(getErrorMessage(results[1].reason));
      }

      setDashboardLoading(false);
    };

    void loadDashboard();

    return () => controller.abort();
  }, [dashboardParams, unsupportedPeriod, refreshKey]);

  /* =====================================================
     LOAD ACADEMIC ALERTS

     Chỉ gọi khi có đủ:
     - academicPeriodId
     - ojtSemesterId
     - assessmentDeadline

     Dùng GET /api/academic/alerts
     trong danh sách Swagger mới.
     ===================================================== */

  const [scheduleError, setScheduleError] = useState("");
  useEffect(() => {
    setAdvisory(null);
    setScheduleError("");
    if (!selectedPeriod) return;
    const controller = new AbortController();
    getJson(
      `/academic-periods/${selectedPeriod}/ojt-advisory-schedule`,
      {},
      controller.signal,
    )
      .then((response) => {
        const schedule = apiData<Record<string, unknown>>(response);
        const deadline =
          schedule.AssessmentDeadline ?? schedule.assessmentDeadline;
        const sid = schedule.OJTSemesterID ?? schedule.ojtSemesterId;
        if (typeof deadline === "string" && sid !== undefined)
          setAdvisory({
            periodId: selectedPeriod,
            semesterId: String(sid),
            deadline,
          });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setScheduleError(getErrorMessage(e));
      });
    return () => controller.abort();
  }, [selectedPeriod, refreshKey]);
  const assessmentDeadline =
    advisory?.periodId === selectedPeriod &&
    advisory.semesterId === selectedOjtSemesterId
      ? advisory.deadline
      : null;

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedPeriod || !selectedOjtSemesterId || !assessmentDeadline) {
      setAlertsData(null);
      setAlertsError("");
      setAlertsLoading(false);

      return () => controller.abort();
    }

    const loadAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError("");
      setAlertsData(null);

      try {
        const response = await getJson(
          API_PATHS.alerts,
          {
            page: 1,
            limit: 10,
            academicPeriodId: toApiId(selectedPeriod),
            ojtSemesterId: toApiId(selectedOjtSemesterId),
            assessmentDeadline,
            ...(selectedCohort ? { cohortId: toApiId(selectedCohort) } : {}),
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setAlertsData(response);
      } catch (error) {
        if (controller.signal.aborted) return;

        setAlertsError(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setAlertsLoading(false);
        }
      }
    };

    void loadAlerts();

    return () => controller.abort();
  }, [selectedPeriod, selectedOjtSemesterId, assessmentDeadline, selectedCohort, refreshKey]);

  /* =====================================================
     STATISTICS FROM BACKEND

     Không tự tính điều kiện OJT từ GPA / tín chỉ.
     ===================================================== */

  const totalStudents = readNumber(dashboardData, [
    "totalStudents",
    "totalStudentCount",
    "studentCount",
    "summary.total",
    "summary.totalStudents",
    "overview.totalStudents",
    "statistics.totalStudents",
    "dashboard.totalStudents",
  ]);

  const eligibleStudents = readNumber(dashboardData, [
    "eligibleStudents",
    "eligibleCount",
    "summary.eligible",
    "summary.eligibleStudents",
    "summary.eligibleCount",
    "overview.eligibleStudents",
    "eligibility.eligibleCount",
    "eligibility.eligibleStudents",
    "dashboard.eligibleStudents",
  ]);

  const ineligibleStudents = readNumber(dashboardData, [
    "ineligibleStudents",
    "ineligibleCount",
    "notEligibleCount",
    "summary.notEligible",
    "summary.ineligibleStudents",
    "summary.ineligibleCount",
    "overview.ineligibleStudents",
    "eligibility.ineligibleCount",
    "eligibility.ineligibleStudents",
    "dashboard.ineligibleStudents",
  ]);

  const alertCount =
    readNumber(alertsData, [
      "total",
      "totalItems",
      "totalElements",
      "totalCount",
      "pagination.total",
    ]) ??
    readNumber(dashboardData, [
      "alertCount",
      "totalAlerts",
      "academicAlertCount",
      "summary.alertCount",
      "dashboard.alertCount",
    ]);

  const assessedStudents =
    eligibleStudents !== null && ineligibleStudents !== null
      ? eligibleStudents + ineligibleStudents
      : null;

  const eligiblePercent =
    assessedStudents !== null && assessedStudents > 0
      ? (eligibleStudents! / assessedStudents) * 100
      : null;

  const ineligiblePercent =
    assessedStudents !== null && assessedStudents > 0
      ? (ineligibleStudents! / assessedStudents) * 100
      : null;

  /* =====================================================
     CHART DATA
     ===================================================== */

  const periodStatistics = useMemo(
    () => parsePeriodStatistics(dashboardData),
    [dashboardData],
  );

  const cohortProgress = useMemo(
    () => parseCohortProgress(dashboardData),
    [dashboardData],
  );

  const courseDemands = useMemo(
    () => parseCourseDemand(courseDemandData),
    [courseDemandData],
  );

  const academicAlerts = useMemo(() => parseAlerts(alertsData), [alertsData]);

  const maxPeriodStudents = Math.max(
    1,
    ...periodStatistics.map((item) => item.eligible + item.ineligible),
  );

  const hasAlertContext = Boolean(
    selectedPeriod && selectedOjtSemesterId && assessmentDeadline,
  );

  /* =====================================================
     ACTIONS
     ===================================================== */

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
    setSelectedPeriod("");
  };
  useEffect(() => { setExportError(''); }, [dashboardParams]);
  const handleExport = async () => {
    if (!selectedPeriod || !selectedOjtSemesterId || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      downloadCourseDemand(await academicReportingService.exportCourseDemand({
        academicPeriodId: Number(selectedPeriod), ojtSemesterId: Number(selectedOjtSemesterId),
        ...(selectedCohort ? { cohortId: Number(selectedCohort) } : {}),
      }));
    } catch (error) { setExportError(getErrorMessage(error)); }
    finally { setExporting(false); }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =============================================
            HEADER
            ============================================= */}

        <header className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold text-orange-600">
                Trang chủ / Phòng Đào tạo
              </p>

              <h1 className="mt-2 text-xl font-extrabold text-slate-900">
                Tổng quan học vụ và OJT
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Theo dõi sinh viên, điều kiện OJT và tình hình học vụ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw size={14} />
                Tải lại
              </button>

              <button
                type="button"
                disabled={unsupportedPeriod || exporting || dashboardLoading}
                onClick={handleExport}
                title="Xuất nhu cầu học phần theo phạm vi đang chọn"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileDown size={14} />
                {exporting ? 'Đang xuất...' : 'Xuất nhu cầu CSV'}
              </button>
            </div>
          </div>
        </header>

        {/* =============================================
            FILTERS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-orange-500" />

            <h2 className="text-sm font-bold text-slate-800">
              Phạm vi thống kê
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="dashboard-year"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Năm học
              </label>

              <select
                id="dashboard-year"
                value={selectedYear}
                onChange={handleYearChange}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 disabled:opacity-60"
              >
                <option value="">Tất cả năm học</option>

                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dashboard-period"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Kỳ học
              </label>

              <select
                id="dashboard-period"
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 disabled:opacity-60"
              >
                <option value="">Tất cả kỳ học</option>

                {filteredPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                    {period.code ? ` (${period.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dashboard-cohort"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Khóa
              </label>

              <select
                id="dashboard-cohort"
                value={selectedCohort}
                onChange={event => setSelectedCohort(event.target.value)}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
              >
                <option value="">Tất cả khóa</option>
                {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.cohortCode} — {cohort.name}</option>)}
              </select>
            </div>
          </div>

          {filtersError && (
            <div className="mt-3">
              <ErrorNotice message={filtersError} />
            </div>
          )}
          {exportError && <div className="mt-3"><ErrorNotice message={exportError} /></div>}

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-3 text-xs leading-5 text-blue-600">
            <Info size={15} className="mt-0.5 shrink-0" />

            <span>
              {unsupportedPeriod
                ? "Kỳ học này chưa có mã kỳ OJT trong dữ liệu trả về. Không tải thống kê để tránh hiển thị nhầm dữ liệu toàn hệ thống."
                : selectedOjtSemesterId
                  ? "Đang thống kê theo kỳ OJT được liên kết với kỳ học đã chọn."
                  : selectedYear
                    ? "Năm học đang được dùng để lọc danh sách kỳ học. Backend chưa hỗ trợ lọc trực tiếp thống kê bằng academicYearId nên số liệu bên dưới vẫn thuộc phạm vi toàn hệ thống."
                    : "Đang xem thống kê toàn hệ thống. Chọn kỳ học có cấu hình OJT để lọc theo kỳ OJT."}
            </span>
          </div>
        </section>

        {/* =============================================
            OVERVIEW
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê tổng quan
          </h2>

          {dashboardError && (
            <div className="mb-4">
              <ErrorNotice message={`Dashboard: ${dashboardError}`} />
            </div>
          )}

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
            <div className="border-slate-200 sm:border-r sm:border-b xl:border-b-0">
              <MetricCard
                label="Tổng sinh viên"
                value={totalStudents}
                description="Theo dữ liệu thống kê học vụ"
                icon={<Users size={18} />}
                iconClass="bg-blue-50 text-blue-600"
                loading={dashboardLoading}
              />
            </div>

            <div className="border-slate-200 sm:border-b xl:border-r xl:border-b-0">
              <MetricCard
                label="Đủ điều kiện OJT"
                value={eligibleStudents}
                description="Được Backend xác nhận đủ điều kiện"
                icon={<CheckCircle2 size={18} />}
                iconClass="bg-green-50 text-green-600"
                loading={dashboardLoading}
              />
            </div>

            <div className="border-slate-200 sm:border-r">
              <MetricCard
                label="Chưa đủ điều kiện OJT"
                value={ineligibleStudents}
                description="Cần theo dõi điều kiện OJT"
                icon={<AlertTriangle size={18} />}
                iconClass="bg-red-50 text-red-600"
                loading={dashboardLoading}
              />
            </div>

            <MetricCard
              label="Cảnh báo học vụ"
              value={alertCount}
              description="Cảnh báo được hệ thống ghi nhận"
              icon={<BellRing size={18} />}
              iconClass="bg-orange-50 text-orange-600"
              loading={dashboardLoading || alertsLoading}
            />
          </div>
        </section>

        {/* =============================================
            OJT STATISTICS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê điều kiện OJT
          </h2>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-2">
            {/* OJT PERCENT */}

            <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
              <SectionTitle
                icon={<PieChart size={18} />}
                title="Tỷ lệ đủ điều kiện OJT"
                description="Tính trên nhóm sinh viên đã có kết quả xét."
                iconClass="bg-green-50 text-green-600"
              />

              {eligiblePercent === null ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có kết quả xét điều kiện OJT"
                  description="Biểu đồ sẽ hiển thị khi API Dashboard trả đủ số sinh viên đã xét."
                />
              ) : (
                <div className="py-7">
                  <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                    <div
                      className="relative h-40 w-40 shrink-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #22c55e 0% ${clampPercent(eligiblePercent)}%,
                          #f87171 ${clampPercent(eligiblePercent)}% 100%
                        )`,
                      }}
                    >
                      <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-2xl font-extrabold text-slate-800">
                          {formatPercent(eligiblePercent)}
                        </span>

                        <span className="mt-1 text-[11px] text-slate-400">
                          Đủ điều kiện
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-green-500" />

                        <div>
                          <p className="text-xs text-slate-500">Đủ điều kiện</p>

                          <p className="text-sm font-bold text-slate-800">
                            {formatNumber(eligibleStudents)} sinh viên
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-red-400" />

                        <div>
                          <p className="text-xs text-slate-500">
                            Chưa đủ điều kiện
                          </p>

                          <p className="text-sm font-bold text-slate-800">
                            {formatNumber(ineligibleStudents)} sinh viên
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">
                        Tổng đã xét: {formatNumber(assessedStudents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                    Tỷ lệ chưa đủ điều kiện:{" "}
                    <strong>{formatPercent(ineligiblePercent ?? 0)}</strong>.
                    Kết quả được lấy từ dữ liệu Backend.
                  </div>
                </div>
              )}
            </div>

            {/* OJT BY PERIOD */}

            <div className="p-5">
              <SectionTitle
                icon={<BarChart3 size={18} />}
                title="Điều kiện OJT theo khóa"
                description="Kết quả xét của từng khóa trong phạm vi đã chọn."
                iconClass="bg-blue-50 text-blue-600"
              />

              {periodStatistics.length === 0 ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có thống kê theo khóa"
                  description="Chọn kỳ học có liên kết OJT để xem kết quả theo khóa."
                />
              ) : (
                <div className="mt-6 space-y-5">
                  {periodStatistics.map((period, index) => {
                    const eligibleWidth =
                      (period.eligible / maxPeriodStudents) * 100;

                    const ineligibleWidth =
                      (period.ineligible / maxPeriodStudents) * 100;

                    return (
                      <div key={`${period.label}-${index}`}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-700">
                            {period.label}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatNumber(period.eligible + period.ineligible)}{" "}
                            SV
                          </span>
                        </div>

                        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-green-500"
                            style={{
                              width: `${eligibleWidth}%`,
                            }}
                          />

                          <div
                            className="bg-red-400"
                            style={{
                              width: `${ineligibleWidth}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Đủ điều kiện
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      Chưa đủ điều kiện
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            ACADEMIC STATISTICS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê học tập
          </h2>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-2">
            {/* COHORT PROGRESS */}

            <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
              <SectionTitle
                icon={<GraduationCap size={18} />}
                title="Tỷ lệ đủ điều kiện OJT theo khóa"
                description="Số sinh viên đủ điều kiện trên tổng sinh viên của từng khóa."
                iconClass="bg-blue-50 text-blue-600"
              />

              {cohortProgress.length === 0 ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có tỷ lệ theo khóa"
                  description="Tỷ lệ hiển thị khi phạm vi đã chọn có sinh viên."
                />
              ) : (
                <div className="mt-6 space-y-5">
                  {cohortProgress.map((cohort, index) => (
                    <div key={`${cohort.label}-${index}`}>
                      <div className="mb-2 flex justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-700">
                          {cohort.label}
                        </span>

                        <span className="text-xs font-bold text-blue-600">
                          {formatPercent(cohort.percent)}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${cohort.percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COURSE DEMAND */}

            <div className="p-5">
              <SectionTitle
                icon={<BookOpen size={18} />}
                title="Nhu cầu học phần"
                description="Các học phần có nhu cầu học từ dữ liệu học vụ."
                iconClass="bg-orange-50 text-orange-600"
              />

              {courseDemandError && (
                <div className="mt-4">
                  <ErrorNotice message={courseDemandError} />
                </div>
              )}

              {courseDemands.length === 0 ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có thống kê nhu cầu học phần"
                  description="Chưa có dữ liệu học phần phù hợp từ Backend."
                />
              ) : (
                <div className="mt-5 divide-y divide-slate-100">
                  {courseDemands.slice(0, 5).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">
                          {course.code}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {course.name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-orange-600">
                          {formatNumber(course.count)}
                        </p>

                        <p className="text-[11px] text-slate-400">Sinh viên</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            ACADEMIC ALERTS
            ============================================= */}

        <section className="px-5 py-5 md:px-7">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionTitle
              icon={<BellRing size={18} />}
              title="Danh sách cảnh báo học vụ"
              description="Các cảnh báo được hệ thống ghi nhận để Phòng Đào tạo theo dõi."
              iconClass="bg-orange-50 text-orange-600"
            />

            <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600">
              Tổng cảnh báo: {formatNumber(alertCount)}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            {scheduleError && <ErrorNotice message={scheduleError} />}
            {alertsError && (
              <div className="m-4">
                <ErrorNotice message={alertsError} />
              </div>
            )}

            {!hasAlertContext ? (
              <EmptyState
                title="Chưa đủ thông tin để tải cảnh báo"
                description="Cần chọn kỳ học có cấu hình kỳ OJT và hạn đánh giá. Backend yêu cầu đủ các thông tin này để truy vấn cảnh báo."
              />
            ) : academicAlerts.length === 0 ? (
              <EmptyState
                loading={alertsLoading}
                title="Chưa có cảnh báo học vụ"
                description="Chưa có dữ liệu cảnh báo được trả về cho phạm vi đang chọn."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {academicAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                      <AlertTriangle size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {alert.title}
                      </p>

                      {alert.description && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {alert.description}
                        </p>
                      )}
                    </div>

                    {alert.date && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(alert.date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =============================================
            FOOTER
            ============================================= */}

        <footer className="flex items-start gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 md:px-7">
          <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />

          <span>
            Dashboard chỉ hiển thị số liệu do Backend cung cấp. Hệ thống không
            tự xét điều kiện OJT, không tự tạo cảnh báo AI và không sử dụng dữ
            liệu giả. Những thống kê chưa có dữ liệu phù hợp sẽ được để trống.
          </span>
        </footer>
      </div>
    </div>
  );
};

export default EducationDashboard;
