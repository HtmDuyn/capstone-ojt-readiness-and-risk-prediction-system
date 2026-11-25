import { studentProgressService } from '@/services/educationService';
import type { StudentProgress } from '@/types/education/studentProgress.types';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import React from 'react';

export function useEducationStudentProgress() {
  const [revision, setRevision] = React.useState(0);
  const reload = React.useCallback(() => setRevision(value => value + 1), []);
  const [students, setStudents] = React.useState<StudentProgress[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [loadWarning, setLoadWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadStudents = async () => {
      setLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      try {
        const result = await studentProgressService.loadAll(controller.signal);
        if (active) {
          setStudents(result);
          const partialCount = result.filter(
            (student) => student.dataWarning,
          ).length;
          setLoadWarning([
            partialCount > 0 ? `${partialCount} hồ sơ chưa tải đủ thông tin chi tiết. Các trường chưa có dữ liệu sẽ hiển thị “—”.` : '',
          ].filter(Boolean).join(' ') || null);
        }
      } catch (error) {
        if (active) {
          setStudents([]);
          setLoadError(
            error instanceof Error
              ? friendlyErrorMessage(error, 'Không tải được tiến độ học tập. Vui lòng thử lại.')
              : "Không thể tải danh sách sinh viên.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStudents();

    return () => {
      active = false;
      controller.abort();
    };
  }, [revision]);

  return { students, loading, loadError, loadWarning, reload };
}
