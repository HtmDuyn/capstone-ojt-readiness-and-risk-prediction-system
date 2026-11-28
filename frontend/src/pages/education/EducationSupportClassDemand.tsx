import { useEffect, useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { RetakeClassProposals } from '@/components/education/RetakeClassProposals';
import { academicReportingService as reports } from '@/services/educationService';
import type { ReportPeriod } from '@/types/education/reporting.types';
import { useEducationCacheRefresh } from '@/hooks/education/useEducationCacheRefresh';

export default function EducationSupportClassDemand() {
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEducationCacheRefresh(['/academic-periods:'],()=>setAttempt(value=>value+1));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    reports.periods(controller.signal)
      .then(periods => {
        if (controller.signal.aborted) return;
        setPeriods(periods);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Không tải được danh sách học kỳ.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="space-y-4">
      <PageBanner variant="education" title="Nhu cầu lớp hỗ trợ" description="Đề xuất lớp học lại trong Block 3 của học kỳ sắp tới." badge="Phòng Đào tạo" />
      {error ? (
        <div className="flex items-center gap-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          <p role="alert">{error}</p>
          <button type="button" className="font-semibold underline" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
        </div>
      ) : (
        <RetakeClassProposals periods={periods} catalogLoading={loading} />
      )}
    </div>
  );
}
