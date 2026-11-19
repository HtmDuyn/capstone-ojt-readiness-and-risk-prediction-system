import { useEffect, useState } from 'react';
import { educationOjtWorkflowService, getAllItems } from '@/services/educationService';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import type { ImportedStudent } from '@/types/education/import.types';

export function useEducationOjtHandoff() {
  const [history, setHistory] = useState<Handoff[]>([]);
  const [students, setStudents] = useState<ImportedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      educationOjtWorkflowService.getHandoffs(undefined, signal),
      getAllItems<ImportedStudent>('/students', {}, signal),
    ]).then(([historyRows, studentRows]) => {
      if (signal.aborted) return;
      setHistory(historyRows);
      setStudents(studentRows);
    }).catch(() => {
      if (!signal.aborted) setError('Không tải được lịch sử bàn giao.');
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  return { history, students, loading, error };
}
