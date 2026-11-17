import { studentProgressService } from '@/services/studentProgress.service';
import { educationOjtWorkflowService } from '@/services/educationOjtWorkflow.service';
import { progressHandoffStatus } from '@/utils/educationOjtCheckQueue';
import type { StudentProgress } from '@/types/education/studentProgress.types';
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
        const [result, handoffs] = await Promise.all([
          studentProgressService.loadAll(controller.signal),
          educationOjtWorkflowService.getHandoffs(undefined, controller.signal).then(
            rows => ({ rows, error: false }),
            () => ({ rows: [], error: true }),
          ),
        ]);
        if (active) {
          setStudents(result.map(student => ({ ...student, handoffStatus: progressHandoffStatus(Number(student.id), handoffs.error ? null : handoffs.rows) })));
          const partialCount = result.filter(
            (student) => student.dataWarning,
          ).length;
          setLoadWarning([
            partialCount > 0 ? `${partialCount} hồ sơ chưa tải đủ dữ liệu chi tiết từ API. Các trường chưa có dữ liệu sẽ hiển thị “—”.` : '',
            handoffs.error ? 'Không tải được lịch sử bàn giao; trạng thái bàn giao đang hiển thị “Chưa xác định”.' : '',
          ].filter(Boolean).join(' ') || null);
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
      controller.abort();
    };
  }, [revision]);

  return { students, loading, loadError, loadWarning, reload };
}
