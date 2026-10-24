import { academicReportingService } from '@/services/academicReporting.service';
import { apiData, getAllItems, getJson } from '@/services/educationApi';
import type { AcademicPeriod, AcademicYear, QueryParams } from '@/types/education/dashboard.types';
import type { Cohort } from '@/types/education/reporting.types';
import { downloadCourseDemand } from '@/utils/downloadFile';
import { getErrorMessage, parseAcademicPeriods, parseAcademicYears, parseAlerts, parseCohortProgress, parseCourseDemand, parsePeriodStatistics, readNumber, toApiId } from '@/utils/educationDashboard';
import React, { useEffect, useMemo, useState } from 'react';

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

/* =========================================================
   EDUCATION DASHBOARD
   ========================================================= */

export function useEducationDashboard() {

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
  return { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, cohorts, selectedCohort, setSelectedCohort, exporting, exportError, filtersLoading, dashboardLoading, alertsLoading, filtersError, dashboardError, courseDemandError, alertsError, filteredPeriods, selectedOjtSemesterId, unsupportedPeriod, scheduleError, totalStudents, eligibleStudents, ineligibleStudents, alertCount, assessedStudents, eligiblePercent, ineligiblePercent, periodStatistics, cohortProgress, courseDemands, academicAlerts, maxPeriodStudents, hasAlertContext, handleRefresh, handleYearChange, handleExport };
}
