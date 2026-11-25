import { useEffect, useMemo, useRef, useState } from 'react';
import { educationOjtWorkflowService, getAllItems, loadSavedLocalOjtResults } from '@/services/educationService';
import { useEducationSemesters } from './useEducationSemesters';
import { handoffTarget, type HandoffCohort } from '@/utils/education/ojtHandoff';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import type { ImportedStudent } from '@/types/education/import.types';
import type { SavedOjtEligibility } from '@/utils/education/savedOjtEligibility';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

type Candidate = { student: ImportedStudent; result: SavedOjtEligibility; blocked: string; targetName: string; targetId?: number };

export function useEducationOjtHandoff() {
  const { semesters, loading: semestersLoading, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [history, setHistory] = useState<Handoff[]>([]);
  const [students, setStudents] = useState<ImportedStudent[]>([]);
  const [results, setResults] = useState<Record<number, SavedOjtEligibility>>({});
  const [cohorts, setCohorts] = useState<HandoffCohort[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const request = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true); setLoadError(''); setHistoryLoaded(false); setCandidatesLoaded(false);
    Promise.allSettled([
      educationOjtWorkflowService.getHandoffs(undefined, signal),
      getAllItems<ImportedStudent>('/students', {}, signal),
      loadSavedLocalOjtResults(signal),
      getAllItems<HandoffCohort>('/cohorts', {}, signal),
    ]).then(([historyResult, studentsResult, savedResult, cohortsResult]) => {
      if (signal.aborted) return;
      if (historyResult.status === 'fulfilled') { setHistory(historyResult.value); setHistoryLoaded(true); }
      if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value);
      if (savedResult.status === 'fulfilled') setResults(Object.fromEntries(savedResult.value.map(row => [row.studentId, row])));
      if (cohortsResult.status === 'fulfilled') setCohorts(cohortsResult.value);
      setCandidatesLoaded([historyResult, studentsResult, savedResult, cohortsResult].every(result => result.status === 'fulfilled'));
      const failed = [historyResult, studentsResult, savedResult, cohortsResult].map((result, index) => result.status === 'rejected' ? ['lịch sử bàn giao', 'danh sách sinh viên', 'kết quả xét đã lưu', 'dữ liệu khóa học'][index] : null).filter(Boolean);
      if (failed.length) setLoadError(`Chưa tải được ${failed.join(', ')}. Vui lòng tải lại trang.`);
    }).finally(() => { if (!signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const candidates = useMemo<Candidate[]>(() => {
    const handed = new Set(history.flatMap(h => h.studentIds.map(id => `${h.ojtSemesterId}:${id}`)));
    return students.flatMap(student => {
      const eligibility = handoffTarget(student, results[student.id], cohorts, semesters);
      if (!eligibility) return [];
      const { result, target, issue } = eligibility;
      const blocked = target && handed.has(`${target.id}:${student.id}`) ? 'Đã bàn giao' : issue
        || (target?.status === 'CLOSED' || target?.status === 'ARCHIVED' ? 'Kỳ OJT đã đóng' : '');
      return [{ student, result, blocked, targetId: target?.id, targetName: target?.name ?? 'Chưa xác định' }];
    });
  }, [students, results, cohorts, semesters, history]);
  const visible = candidates.filter(({ student }) => `${student.studentCode} ${student.fullName} ${student.program?.name ?? ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const available = visible.filter(candidate => !candidate.blocked);
  const waiting = candidates.filter(candidate => !candidate.blocked);
  const allChecked = available.length > 0 && available.every(candidate => selected.includes(candidate.student.id));

  async function submit() {
    if (loading || semestersLoading || semesterError || !candidatesLoaded || saving || !selected.length || !reason.trim()) return false;
    const ids = [...new Set(selected)].sort((a, b) => a - b);
    if (ids.length > 1000) { setError('Mỗi lần bàn giao tối đa 1.000 sinh viên.'); return false; }
    if (ids.some(id => !candidates.some(candidate => candidate.student.id === id && !candidate.blocked && candidate.targetId))) {
      setError('Danh sách hoặc kỳ OJT đã thay đổi. Hãy tải lại và chọn lại sinh viên.'); return false;
    }
    const groups = new Map<number, number[]>();
    ids.forEach(id => {
      const targetId = candidates.find(candidate => candidate.student.id === id)!.targetId!;
      groups.set(targetId, [...(groups.get(targetId) ?? []), id]);
    });
    const signature = JSON.stringify({ groups: [...groups], reason: reason.trim() });
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() };
    setSaving(true); setError(''); setSuccess('');
    try {
      let total = 0;
      for (const [ojtSemesterId, studentIds] of groups) {
        const response = await educationOjtWorkflowService.handoff({
          ojtSemesterId, studentIds, reason: reason.trim(), idempotencyKey: `${request.current.key}-${ojtSemesterId}`,
        });
        if (!response.handoffId || response.total !== studentIds.length || response.recipientRole !== 'OJT_COORD')
          throw new Error('Chưa nhận được xác nhận bàn giao đầy đủ. Vui lòng tải lại để kiểm tra.');
        total += response.total;
      }
      setSuccess(`Đã bàn giao ${total} sinh viên sang Phòng QHDN.`);
      setSelected([]); setReason(''); request.current = null;
      setRevision(value => value + 1); reloadSemesters();
      return true;
    } catch (error) {
      setError(friendlyErrorMessage(error, 'Bàn giao không thành công. Vui lòng thử lại.'));
      setRevision(value => value + 1);
      return false;
    } finally { setSaving(false); }
  }

  return { history, students, visible, available, waiting, allChecked, selected, setSelected, search, setSearch, reason, setReason, loading: loading || semestersLoading, historyLoaded, candidatesLoaded, saving, error: error || semesterError, loadError, success, submit };
}
