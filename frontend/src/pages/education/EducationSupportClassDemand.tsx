import { useEffect, useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { RetakeClassProposals } from '@/components/education/RetakeClassProposals';
import { academicReportingService as reports } from '@/services/academicReporting.service';
import type { Cohort, ReportPeriod } from '@/types/education/reporting.types';

export default function EducationSupportClassDemand() {
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([reports.periods(controller.signal), reports.cohorts(controller.signal)])
      .then(([periods, cohorts]) => {
        if (controller.signal.aborted) return;
        setPeriods(periods);
        setCohorts(cohorts);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Không tải được học kỳ và khóa sinh viên.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="space-y-4">
      <PageBanner title="Nhu cầu lớp hỗ trợ" description="Đề xuất lớp học lại trong Block 3 của học kỳ sắp tới." badge="Phòng Đào tạo" />
      {error ? (
        <div className="flex items-center gap-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          <p role="alert">{error}</p>
          <button type="button" className="font-semibold underline" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
        </div>
      ) : (
        <RetakeClassProposals periods={periods} cohorts={cohorts} catalogLoading={loading} />
      )}
    </div>
  );
}
