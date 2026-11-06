import { educationOjtWorkflowService } from '@/services/educationOjtWorkflow.service';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import { getAllItems } from '@/services/educationApi';
import { loadSavedLocalOjtResults } from '@/services/localOjtEligibility.service';
import type { ImportedStudent } from '@/types/education/import.types';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import { handoffTarget, type HandoffCohort } from '@/utils/ojtHandoff';

type Candidate = { student: ImportedStudent; result: SavedOjtEligibility; blocked: string; targetName: string };

export function useEducationOjtHandoff() {
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [semesterId, setSemesterId] = useState('');
  const [students, setStudents] = useState<ImportedStudent[]>([]);
  const [results, setResults] = useState<Record<number, SavedOjtEligibility>>({});
  const [cohorts, setCohorts] = useState<HandoffCohort[]>([]);
  const [history, setHistory] = useState<Handoff[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refresh, setRefresh] = useState(0);
  const request = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected([]); setStudents([]); setResults({}); setHistory([]); setCohorts([]);
    Promise.all([
      getAllItems<ImportedStudent>('/students', {}, controller.signal),
      loadSavedLocalOjtResults(controller.signal),
      semesterId ? educationOjtWorkflowService.getHandoffs(Number(semesterId), controller.signal) : Promise.resolve([]),
      getAllItems<HandoffCohort>('/cohorts', {}, controller.signal),
    ]).then(([allStudents, saved, handoffs, allCohorts]) => {
      if (controller.signal.aborted) return;
      setStudents(allStudents); setResults(Object.fromEntries(saved.map(r => [r.studentId, r])));
      setHistory(handoffs); setCohorts(allCohorts);
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được danh sách bàn giao.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [semesterId, refresh]);

  const candidates = useMemo<Candidate[]>(() => {
    const handed = new Set(history.flatMap(h => h.studentIds));
    return students.flatMap(student => {
      const eligibility = handoffTarget(student, results[student.id], cohorts, semesters);
      if (!eligibility) return [];
      const { result, target, issue } = eligibility;
      if (semesterId && target && target.id !== Number(semesterId)) return [];
      const blocked = issue || (!semesterId ? 'Chọn kỳ OJT để bàn giao'
        : handed.has(student.id) ? 'Đã bàn giao trong kỳ này'
        : target?.status === 'CLOSED' || target?.status === 'ARCHIVED' ? 'Kỳ OJT đã đóng'
        : '');
      return [{ student, result, blocked, targetName: target ? `${target.name} (${target.semesterCode})` : 'Chưa cấu hình' }];
    });
  }, [students, results, cohorts, semesters, history, semesterId]);
  const visible = candidates.filter(({ student }) => `${student.studentCode} ${student.fullName} ${student.program?.name ?? ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const available = visible.filter(c => !c.blocked);
  const allChecked = available.length > 0 && available.every(c => selected.includes(c.student.id));

  async function submit() {
    if (!semesterId || !selected.length || !reason.trim() || loading || saving) return;
    const ids = [...selected].sort((a, b) => a - b);
    if (ids.length > 1000) { setError('Mỗi lần bàn giao tối đa 1.000 sinh viên.'); return; }
    if (ids.some(id => !candidates.some(c => c.student.id === id && !c.blocked))) { setError('Danh sách đã thay đổi. Hãy chọn lại sinh viên.'); return; }
    const signature = JSON.stringify({ ojtSemesterId: Number(semesterId), studentIds: ids, reason: reason.trim() });
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() };
    setSaving(true); setError(''); setSuccess('');
    try {
      const result = await educationOjtWorkflowService.handoff({
        ojtSemesterId: Number(semesterId), studentIds: ids, reason: reason.trim(), idempotencyKey: request.current.key,
      });
      if (!result.handoffId || result.total !== ids.length || result.recipientRole !== 'OJT_COORD') throw new Error('Chưa nhận được xác nhận bàn giao đầy đủ từ hệ thống. Hãy tải lại để kiểm tra.');
      setSuccess(`Đã bàn giao ${result.total} sinh viên sang Phòng Quan hệ doanh nghiệp (đợt #${result.handoffId}).`);
      setSelected([]); setReason(''); request.current = null; setRefresh(n => n + 1);
    } catch (e) {
      const code = (e as { response?: { data?: { errorCode?: string; code?: string } } })?.response?.data;
      const message = e instanceof Error ? e.message : 'Bàn giao không thành công.';
      setError(code?.errorCode === 'CONFIRMED_ELIGIBILITY_REQUIRED' || code?.code === 'CONFIRMED_ELIGIBILITY_REQUIRED' || message.includes('Current confirmed eligible result required')
        ? 'Chưa thể bàn giao: hệ thống chưa hỗ trợ sử dụng kết quả xét đã lưu.' : message);
    }
    finally { setSaving(false); }
  }

  return { candidates, visible, available, allChecked, submit, semesterId, setSemesterId, students, history, selected, setSelected, search, setSearch, reason, setReason, loading, saving, error, success, setSuccess, setRefresh, semesters, semesterError, reloadSemesters };
}
