import { clearSharedReads, sharedRead } from '@/utils/shared/sharedRead';
import { educationOverviewService } from '@/services/educationService';
import { academicReportingService } from '@/services/educationService';
import { getAllItems, getJson } from '@/services/educationService';
import type { AcademicPeriod, AcademicYear, QueryParams } from '@/types/education/dashboard.types';
import type { Major } from '@/types/education/curriculum.types';
import type { RetakeClassReport } from '@/types/education/reporting.types';
import { downloadCourseDemand } from '@/utils/shared/downloadFile';
import { getErrorMessage, isCanceledRequest, parseAcademicPeriods, parseAcademicYears, parseCohortProgress, parsePeriodStatistics, readNumber, toApiId } from '@/utils/education/educationDashboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cleanQuery } from '@/services/educationService';
import { educationReadKey } from '@/utils/education/educationReadCache';
import { useEducationCacheRefresh } from './useEducationCacheRefresh';

/* =========================================================
   API PATHS
   ========================================================= */

const API_PATHS = {
  years: "/academic-years",
  periods: "/academic-periods",
} as const;

/* =========================================================
   EDUCATION DASHBOARD
   ========================================================= */

export function useEducationDashboard(loadCourseDemand: boolean) {

  /* ---------------- FILTER DATA ---------------- */

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);

  const [selectedYear, setSelectedYear] = useState("");
  const defaultYearInitialized = useRef(false);

  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [majors, setMajors] = useState<Major[]>([]);

  const [selectedMajor, setSelectedMajor] = useState('');

  const [exporting, setExporting] = useState(false);

  const [exportError, setExportError] = useState('');

  /* ---------------- BACKEND DATA ---------------- */

  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [studentTotal, setStudentTotal] = useState<number | null>(null);
  const [dashboardWarning, setDashboardWarning] = useState("");
  const [supportProposalLoading, setSupportProposalLoading] = useState(true);
  const [supportProposalData, setSupportProposalData] = useState<RetakeClassReport | null>(null);

  /* ---------------- LOADING ---------------- */

  const [filtersLoading, setFiltersLoading] = useState(true);

  const [dashboardLoading, setDashboardLoading] = useState(true);


  /* ---------------- ERRORS ---------------- */

  const [filtersError, setFiltersError] = useState("");

  const [dashboardError, setDashboardError] = useState("");

  const [supportProposalError, setSupportProposalError] = useState("");


  const [refreshKey, setRefreshKey] = useState(0);
  useEducationCacheRefresh(['/academic-years:','/academic-periods:','/majors:','/retake-class-proposals:'],()=>{clearSharedReads();setRefreshKey(value=>value+1);});

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
        sharedRead('catalog:years', () => getAllItems(API_PATHS.years), controller.signal, 5 * 60_000),
        sharedRead('catalog:periods', () => getAllItems(API_PATHS.periods), controller.signal, 5 * 60_000),
        sharedRead('catalog:majors', () => getAllItems<Major>('/majors'), controller.signal, 5 * 60_000),
      ]);

      if (controller.signal.aborted) return;

      const errors: string[] = [];

      if (results[0].status === "fulfilled") {
        const years = parseAcademicYears(results[0].value);
        setAcademicYears(years);
        if (!defaultYearInitialized.current) {
          setSelectedYear(years.find(year => year.code === '2026-2027')?.id ?? '');
          defaultYearInitialized.current = true;
        }
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

      if (results[2].status === 'fulfilled') setMajors(results[2].value);
      else { setMajors([]); errors.push(`Chuyên ngành: ${getErrorMessage(results[2].reason)}`); }
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
  const supportPeriod = useMemo(() => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const isUpcoming = (period: AcademicPeriod) => period.kind === 'SEMESTER'
      && period.status === 'PLANNED' && Boolean(period.startDate && period.startDate.slice(0, 10) > today);
    const selected = academicPeriods.find(period => period.id === selectedPeriod);
    return (selected && isUpcoming(selected) ? selected : null)
      ?? filteredPeriods.filter(isUpcoming).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? '') || a.id.localeCompare(b.id))[0]
      ?? null;
  }, [academicPeriods, filteredPeriods, selectedPeriod]);

  const dashboardParams = useMemo<QueryParams>(() => {
    const params: QueryParams = {};

    if (selectedPeriod) params.academicPeriodId = toApiId(selectedPeriod);
    if (selectedOjtSemesterId) {
      params.ojtSemesterId = toApiId(selectedOjtSemesterId);
    }
    if (selectedMajor) params.majorId = toApiId(selectedMajor);

    return params;
  }, [selectedOjtSemesterId, selectedPeriod, selectedMajor]);

  // Scope the overview roster by its current academic placement when a period is selected.
  const overviewParams = useMemo<QueryParams>(() => ({
    ...(selectedPeriod ? { academicPeriodId: toApiId(selectedPeriod) } : {}),
    ...(selectedMajor ? { majorId: toApiId(selectedMajor) } : {}),
  }), [selectedPeriod, selectedMajor]);

  /* =====================================================
     LOAD DASHBOARD AND COURSE DEMAND

     GET /api/students/overview scoped by current academic period and cohort
     GET /api/course-demands

     Kỳ học lọc roster theo kỳ hiện tại; kỳ OJT dùng riêng cho nhu cầu học phần.
     ===================================================== */

  useEffect(() => {
    const controller = new AbortController();
    setDashboardLoading(true); setDashboardError(''); setDashboardWarning('');
    setDashboardData(null); setStudentTotal(null);
    sharedRead(`overview:${JSON.stringify(overviewParams)}`, () => educationOverviewService.load(overviewParams), controller.signal, 30_000).then(data => {
      if (!controller.signal.aborted) setStudentTotal(data.summary.total);
      return data;
    }).then(data => {
      if (!controller.signal.aborted) { setDashboardData(data); setDashboardWarning(data.warning); }
    }).catch(error => {
      if (!controller.signal.aborted) setDashboardError(getErrorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setDashboardLoading(false);
    });
    return () => controller.abort();
  }, [overviewParams, refreshKey]);

  useEffect(()=>{
    const expectedKey=educationReadKey('/students/overview',cleanQuery(overviewParams));
    const controller=new AbortController();
    const refreshCachedOverview=(event:Event)=>{
      const key=(event as CustomEvent<{key?:string}>).detail?.key;
      if(key!==expectedKey)return;
      void educationOverviewService.load(overviewParams,controller.signal).then(data=>{
        if(!controller.signal.aborted){setStudentTotal(data.summary.total);setDashboardData(data);setDashboardWarning(data.warning);setDashboardError('');}
      }).catch(error=>{if(!controller.signal.aborted)setDashboardError(getErrorMessage(error));});
    };
    window.addEventListener('education:read-cache-updated',refreshCachedOverview);
    return()=>{controller.abort();window.removeEventListener('education:read-cache-updated',refreshCachedOverview);};
  },[overviewParams]);

  useEffect(() => {
    if (!loadCourseDemand) return;
    if (!supportPeriod) {
      setSupportProposalData(null);
      setSupportProposalError('');
      setSupportProposalLoading(false);
      return;
    }
    const controller = new AbortController();
    setSupportProposalLoading(true); setSupportProposalError(''); setSupportProposalData(null);
    academicReportingService.retakeClassProposals(Number(supportPeriod.id), selectedMajor ? { majorId: Number(selectedMajor) } : {}, 1, controller.signal, 'CALCULATED')
      .then(data => { if (!controller.signal.aborted) setSupportProposalData(data); })
      .catch(error => { if (!controller.signal.aborted && !isCanceledRequest(error)) setSupportProposalError(getErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setSupportProposalLoading(false); });
    return () => controller.abort();
  }, [refreshKey, loadCourseDemand, selectedMajor, supportPeriod]);

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
  const reviewRequiredStudents = readNumber(dashboardData, ["summary.insufficientData", "summary.currentEvaluation.reviewRequired"]);


  const assessedStudents =
    eligibleStudents !== null && ineligibleStudents !== null && reviewRequiredStudents !== null
      ? eligibleStudents + ineligibleStudents + reviewRequiredStudents
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
    clearSharedReads();
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
        ...(selectedMajor ? { majorId: Number(selectedMajor) } : {}),
      }, false, true));
    } catch (error) { setExportError(getErrorMessage(error)); }
    finally { setExporting(false); }
  };
  return { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, majors, selectedMajor, setSelectedMajor, exporting, exportError, filtersLoading, dashboardLoading, supportProposalLoading, supportProposalError, supportProposalData, supportPeriod, dashboardWarning, filtersError, dashboardError, filteredPeriods, selectedOjtSemesterId, totalStudents, eligibleStudents, ineligibleStudents, reviewRequiredStudents, assessedStudents, eligiblePercent, ineligiblePercent, periodStatistics, cohortProgress, maxPeriodStudents, insufficientDataStudents, awaitingConfirmationStudents, handleRefresh, handleYearChange, handleExport };
}
