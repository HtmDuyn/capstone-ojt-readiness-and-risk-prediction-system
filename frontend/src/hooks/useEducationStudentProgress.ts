import { studentProgressService } from '@/services/studentProgress.service';
import type { StudentProgress } from '@/types/education/studentProgress.types';
import React from 'react';

export function useEducationStudentProgress() {
  const [students, setStudents] = React.useState<StudentProgress[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [loadWarning, setLoadWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      setLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      try {
        const result = await studentProgressService.loadAll();
        if (active) {
          setStudents(result);
          const partialCount = result.filter(
            (student) => student.dataWarning,
          ).length;
          setLoadWarning(
            partialCount > 0
              ? `${partialCount} hồ sơ chưa tải đủ dữ liệu chi tiết từ API. Các trường chưa có dữ liệu sẽ hiển thị “—”.`
              : null,
          );
        }
      } catch (error) {
        if (active) {
          setStudents([]);
          setLoadError(
            error instanceof Error
              ? error.message
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
    };
  }, []);

  return { students, loading, loadError, loadWarning };
}
