import { useEffect, useMemo, useState } from "react";
import { getAcademicPeriods } from "@/services/qhdnService";
import { errorMessage } from "@/components/qhdn/QhdnUi";
import { loadAllPages } from "@/utils/loadAllPages";
import { academicYears, linkedOjtSemesterId, preferredAcademicPeriod } from "@/utils/qhdnAcademicPeriods";
import type { AcademicPeriodItem } from "@/types/qhdn/qhdnTypes";

export function useQhdnAcademicPeriods(initialOjtId = "", allowAll = false) {
  const [periods, setPeriods] = useState<AcademicPeriodItem[]>([]);
  const [yearId, setYearId] = useState("");
  const [periodId, setPeriodId] = useState(allowAll ? "ALL" : "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadAllPages((page) => getAcademicPeriods({ page, limit: 100 }))
      .then((items) => { if (active) setPeriods(items); })
      .catch((e) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const years = useMemo(() => academicYears(periods), [periods]);
  const filteredPeriods = useMemo(() => periods.filter((p) =>
    !yearId || String(p.academicYearId) === yearId,
  ), [periods, yearId]);
  const allPeriods = allowAll && periodId === "ALL";
  const selectedPeriod = allPeriods ? undefined :
    filteredPeriods.find((p) => String(p.id) === periodId)
      ?? preferredAcademicPeriod(filteredPeriods, initialOjtId);
  const ojtSemesterId = linkedOjtSemesterId(selectedPeriod);
  const selectYear = (id: string) => {
    setYearId(id);
    setPeriodId(allowAll ? "ALL" : "");
  };
  return {
    periods, years, filteredPeriods, yearId, selectYear,
    periodId: allPeriods ? "ALL" : selectedPeriod ? String(selectedPeriod.id) : "",
    selectPeriod: setPeriodId, selectedPeriod, allPeriods, allowAll,
    ojtSemesterId, semesterId: ojtSemesterId === null ? "" : String(ojtSemesterId),
    loading, error,
  };
}
