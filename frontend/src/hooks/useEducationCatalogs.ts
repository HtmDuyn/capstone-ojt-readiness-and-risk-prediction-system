import { getAllItems } from '@/services/educationApi';
import type { AcademicYear } from '@/types/education/academic.types';
import type { CurriculumSummary } from '@/types/education/curriculum.types';
import type { ReportPeriod } from '@/types/education/reporting.types';
import { useEffect, useState } from 'react';

export function useEducationCatalogs(revision = 0) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [programs, setPrograms] = useState<CurriculumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      getAllItems<AcademicYear>('/academic-years', {}, controller.signal),
      getAllItems<ReportPeriod>('/academic-periods', {}, controller.signal),
      getAllItems<CurriculumSummary>('/curricula', {}, controller.signal),
    ]).then(([years, periods, programs]) => {
      if (controller.signal.aborted) return;
      setYears(years); setPeriods(periods); setPrograms(programs);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Không tải được danh mục học vụ.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [revision]);
  return { years, periods, programs, loading, error };
}
