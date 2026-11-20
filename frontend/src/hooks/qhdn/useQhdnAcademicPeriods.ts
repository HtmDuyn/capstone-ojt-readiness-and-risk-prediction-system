import { useCallback, useEffect, useMemo, useState } from "react";
import { getAcademicPeriods } from "@/services/qhdnService";
import { errorMessage } from "@/components/qhdn/QhdnUi";
import { loadAllPages } from "@/utils/shared/loadAllPages";
import { sharedRead } from "@/utils/shared/sharedRead";
import { academicYears, linkedOjtSemesterId, preferredAcademicPeriod } from "@/utils/qhdn/qhdnAcademicPeriods";
import type { AcademicPeriodItem } from "@/types/qhdn/qhdnTypes";

export function useQhdnAcademicPeriods(initialOjtId = "", allowAll = false, semestersOnly = false) {
  const [catalog, setCatalog] = useState<AcademicPeriodItem[]>([]);
  const [yearId, setYearId] = useState("");
  const [periodId, setPeriodId] = useState(allowAll ? "ALL" : "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    sharedRead('catalog:qhdn-periods', () => loadAllPages(page => getAcademicPeriods({ page, limit: 100 })), controller.signal)
      .then((items) => { if (!controller.signal.aborted) setCatalog(items); })
      .catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const periods = useMemo(() => semestersOnly ? catalog.filter(period => period.kind === 'SEMESTER') : catalog, [catalog, semestersOnly]);
  const years = useMemo(() => academicYears(periods), [periods]);
  const filteredPeriods = useMemo(() => periods.filter((p) =>
    !yearId || String(p.academicYearId) === yearId,
  ), [periods, yearId]);
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
  return {
    periods, years, filteredPeriods, yearId, selectYear,
    periodId: allPeriods ? "ALL" : selectedPeriod ? String(selectedPeriod.id) : "",
    selectPeriod, selectedPeriod, allPeriods, allowAll,
    ojtSemesterId, semesterId: ojtSemesterId === null ? "" : String(ojtSemesterId),
    loading, error, semestersOnly,
  };
}
