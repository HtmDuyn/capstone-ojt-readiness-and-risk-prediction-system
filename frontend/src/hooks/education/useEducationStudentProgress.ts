import { studentProgressService } from '@/services/educationService';
import type { StudentProgress } from '@/types/education/studentProgress.types';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import React from 'react';
import { useEducationCacheRefresh } from './useEducationCacheRefresh';

export function useEducationStudentProgress() {
  const [revision, setRevision] = React.useState(0);
  const reload = React.useCallback(() => setRevision(value => value + 1), []);
  useEducationCacheRefresh(['/students/progress:'],reload,350);
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
      setStudents([]);

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

  const loadDetails = React.useCallback(async (studentId: number) => {
    const detail = await studentProgressService.loadDetails(studentId);
    setStudents(current => current.map(student => student.id === detail.id ? detail : student));
    return detail;
  }, []);

  const loadGpa = React.useCallback(async (studentIds: string[]) => {
    const pending = [...new Set(studentIds)].filter(id => {
      const student = students.find(item => item.id === id);
      return student && !student.gpaLoaded && !student.gpaLoading && !student.detailsLoaded;
    });
    if (!pending.length) return;
    setStudents(current => current.map(student => pending.includes(student.id)
      ? { ...student, gpaLoading: true }
      : student));
    let resolved: Map<number, {
      gpa: number | null; gpaScale: number | null;
      completedCredits: number | null; totalCredits: number | null;
    }>;
    try {
      resolved = await studentProgressService.loadGpa(pending.map(Number));
    } catch {
      resolved = new Map();
    }
    setStudents(current => current.map(student => {
      if (!pending.includes(student.id)) return student;
      const value = resolved.get(Number(student.id));
      return {
        ...student,
        ...(value ?? {}),
        gpaLoaded: Boolean(value),
        gpaLoading: false,
      };
    }));
  }, [students]);

  return { students, loading, loadError, loadWarning, reload, loadDetails, loadGpa };
}
