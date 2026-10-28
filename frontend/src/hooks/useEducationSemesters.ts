import { academicService } from '@/services/academic.service';
import type { OjtSemester } from '@/types/education/academic.types';
import { useEffect, useState } from 'react';

export function useEducationSemesters() {
  const [semesters, setSemesters] = useState<OjtSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    academicService.searchOjtSemesters({ page: 1, limit: 10000 })
      .then(items => { if (active) setSemesters(items); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Không tải được kỳ OJT.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  return { semesters, loading, error, reload: () => setRevision(value => value + 1) };
}
