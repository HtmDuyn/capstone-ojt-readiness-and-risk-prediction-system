import { useCallback, useEffect, useMemo, useState } from "react";
import { getAcademicPeriods } from "@/services/qhdnService";
import { errorMessage } from "@/components/qhdn/QhdnUi";
import { loadAllPages } from "@/utils/shared/loadAllPages";
import { sharedRead } from "@/utils/shared/sharedRead";
import { academicYears, linkedOjtSemesterId, preferredAcademicPeriod } from "@/utils/qhdn/qhdnAcademicPeriods";
import type { AcademicPeriodItem } from "@/types/qhdn/qhdnTypes";
import { clearSharedReads } from '@/utils/shared/sharedRead';
import { useQhdnCacheRefresh } from './useQhdnCacheRefresh';

export function useQhdnAcademicPeriods(initialOjtId = "", allowAll = false, semestersOnly = false) {
  const [catalog, setCatalog] = useState<AcademicPeriodItem[]>([]);
  const [yearId, setYearId] = useState("");
  const [periodId, setPeriodId] = useState(allowAll ? "ALL" : "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useQhdnCacheRefresh(['/academic-periods:'],()=>{clearSharedReads();setRevision(value=>value+1);});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    sharedRead('catalog:qhdn-periods', () => loadAllPages(page => getAcademicPeriods({ page, limit: 100 },controller.signal)), controller.signal, 5 * 60_000)
      .then((items) => { if (!controller.signal.aborted) setCatalog(items); })
      .catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const periods = useMemo(() => catalog.filter(period => (period.status === 'ACTIVE' || period.status === 'CLOSED')
    && (!semestersOnly || period.kind === 'SEMESTER')), [catalog, semestersOnly]);
  const years = useMemo(() => academicYears(periods), [periods]);
  const selectedYearId = years.some(year => String(year.id) === yearId) ? yearId : "";
  const filteredPeriods = useMemo(() => periods.filter((p) =>
    !selectedYearId || String(p.academicYearId) === selectedYearId,
  ), [periods, selectedYearId]);
  const allPeriods = allowAll && periodId === "ALL";
  const selectedPeriod = allPeriods ? undefined :
    filteredPeriods.find((p) => String(p.id) === periodId)
      ?? preferredAcademicPeriod(filteredPeriods, initialOjtId);
  const ojtSemesterId = linkedOjtSemesterId(selectedPeriod);
  const selectYear = useCallback((id: string) => {
    setYearId(id);
    setPeriodId(allowAll ? "ALL" : "");
  }, [allowAll]);

  const selectPeriod = useCallback((id: string) => setPeriodId(id), []);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return {
    periods, years, filteredPeriods, yearId: selectedYearId, selectYear,
    periodId: allPeriods ? "ALL" : selectedPeriod ? String(selectedPeriod.id) : "",
    selectPeriod, selectedPeriod, allPeriods, allowAll,
    ojtSemesterId, semesterId: ojtSemesterId === null ? "" : String(ojtSemesterId),
    loading, error, semestersOnly, reload,
    canOpenRecruitment: !loading && !error && selectedPeriod?.kind === 'SEMESTER' && selectedPeriod.status === 'ACTIVE',
  };
}
