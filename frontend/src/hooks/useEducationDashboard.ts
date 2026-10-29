import { clearEducationReadCache, educationRead } from '@/services/educationReadCache';
import { educationOverviewService } from '@/services/educationOverview.service';
import { academicReportingService } from '@/services/academicReporting.service';
import { getAllItems, getJson } from '@/services/educationApi';
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
  courseDemand: "/course-demands",
  alerts: "/academic-alerts",
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
  const [studentTotal, setStudentTotal] = useState<number | null>(null);
  const [dashboardWarning, setDashboardWarning] = useState("");
  const [courseDemandLoading, setCourseDemandLoading] = useState(true);

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
        educationRead('catalog:years', () => getAllItems(API_PATHS.years), controller.signal),
        educationRead('catalog:periods', () => getAllItems(API_PATHS.periods), controller.signal),
        educationRead('catalog:cohorts', () => academicReportingService.cohorts(), controller.signal),
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

  const selectedOjtSemesterId = selectedPeriodInfo?.ojtSemesterId ?? null;

  const dashboardParams = useMemo<QueryParams>(() => {
    const params: QueryParams = {};

    if (selectedPeriod) params.academicPeriodId = toApiId(selectedPeriod);
    if (selectedOjtSemesterId) {
      params.ojtSemesterId = toApiId(selectedOjtSemesterId);
    }
    if (selectedCohort) params.cohortId = toApiId(selectedCohort);

    return params;
  }, [selectedOjtSemesterId, selectedPeriod, selectedCohort]);

  // Overview eligibility depends on cohort and OJT semester, not the assessment period.
  const overviewParams = useMemo<QueryParams>(() => ({
    ...(selectedOjtSemesterId ? { ojtSemesterId: toApiId(selectedOjtSemesterId) } : {}),
    ...(selectedCohort ? { cohortId: toApiId(selectedCohort) } : {}),
  }), [selectedOjtSemesterId, selectedCohort]);

  /* =====================================================
     LOAD DASHBOARD AND COURSE DEMAND

     GET /api/students and GET /api/students/:id?include=eligibility
     GET /api/course-demands

     Truyền academicPeriodId, ojtSemesterId và cohortId khi đã chọn.
     ===================================================== */

  useEffect(() => {
    const controller = new AbortController();
    setDashboardLoading(true); setDashboardError(''); setDashboardWarning('');
    setDashboardData(null); setStudentTotal(null);
    educationOverviewService.load(overviewParams, controller.signal, total => {
      if (!controller.signal.aborted) setStudentTotal(total);
    }).then(data => {
      if (!controller.signal.aborted) { setDashboardData(data); setDashboardWarning(data.warning); }
    }).catch(error => {
      if (!controller.signal.aborted) setDashboardError(getErrorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setDashboardLoading(false);
    });
    return () => controller.abort();
  }, [overviewParams, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    setCourseDemandLoading(true); setCourseDemandError(''); setCourseDemandData(null);
    educationRead(`demand:${JSON.stringify(dashboardParams)}`, () =>
      getJson(API_PATHS.courseDemand, { page: 1, limit: 20, ...dashboardParams }), controller.signal)
      .then(data => { if (!controller.signal.aborted) setCourseDemandData(data); })
      .catch(error => { if (!controller.signal.aborted) setCourseDemandError(getErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setCourseDemandLoading(false); });
    return () => controller.abort();
  }, [dashboardParams, refreshKey]);

  /* =====================================================
     LOAD ACADEMIC ALERTS

     Backend resolves periods and assessment deadlines for omitted filters.
     ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    const loadAlerts = async () => {
      setAlertsLoading(true);
      setAlertsError("");
      setAlertsData(null);

      try {
        const response = await educationRead(`alerts:${JSON.stringify(dashboardParams)}`, () => getJson(
          API_PATHS.alerts,
          {
            page: 1,
            limit: 10,
            ...dashboardParams,
          },
        ), controller.signal);

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
  }, [dashboardParams, refreshKey]);

  /* =====================================================
     STATISTICS FROM BACKEND

     Không tự tính điều kiện OJT từ GPA / tín chỉ.
     ===================================================== */

  const totalStudents = studentTotal ?? readNumber(dashboardData, [
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

  const insufficientDataStudents = readNumber(dashboardData, ["summary.insufficientData"]);
  const awaitingConfirmationStudents = readNumber(dashboardData, ["summary.awaitingConfirmation"]);

  /* =====================================================
     ACTIONS
     ===================================================== */

  const handleRefresh = () => {
    clearEducationReadCache();
    setRefreshKey((current) => current + 1);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
    setSelectedPeriod("");
  };

  useEffect(() => { setExportError(''); }, [dashboardParams]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError('');
    try {
      downloadCourseDemand(await academicReportingService.exportCourseDemand({
        ...(selectedPeriod ? { academicPeriodId: Number(selectedPeriod) } : {}),
        ...(selectedOjtSemesterId ? { ojtSemesterId: Number(selectedOjtSemesterId) } : {}),
        ...(selectedCohort ? { cohortId: Number(selectedCohort) } : {}),
      }));
    } catch (error) { setExportError(getErrorMessage(error)); }
    finally { setExporting(false); }
  };
  return { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, cohorts, selectedCohort, setSelectedCohort, exporting, exportError, filtersLoading, dashboardLoading, courseDemandLoading, dashboardWarning, alertsLoading, filtersError, dashboardError, courseDemandError, alertsError, filteredPeriods, selectedOjtSemesterId,  totalStudents, eligibleStudents, ineligibleStudents, alertCount, assessedStudents, eligiblePercent, ineligiblePercent, periodStatistics, cohortProgress, courseDemands, academicAlerts, maxPeriodStudents, insufficientDataStudents, awaitingConfirmationStudents, handleRefresh, handleYearChange, handleExport };
}
