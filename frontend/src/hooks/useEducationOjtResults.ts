import { useEffect, useMemo, useState } from 'react';
import { getAllItems } from '@/services/educationApi';
import { loadSavedLocalOjtResults } from '@/services/localOjtEligibility.service';
import { educationOjtWorkflowService } from '@/services/educationOjtWorkflow.service';
import type { ImportedStudent } from '@/types/education/import.types';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import { handoffsByStudent, matchesHandoffFilter } from '@/utils/educationOjtCheckQueue';
import { handoffDisplayById } from '@/utils/educationOjtHandoffDisplay';
import { savedOjtDisplayStatus, type OjtDisplayStatus } from '@/utils/educationOjtReason';

type Target = { student: ImportedStudent; reason: string };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

export function useEducationOjtResults() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [savedResults, setSavedResults] = useState<Record<number, LocalOjtResult>>({});
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [handoffFilter, setHandoffFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getAllItems<ImportedStudent>('/students', {}, controller.signal),
      loadSavedLocalOjtResults(controller.signal),
      educationOjtWorkflowService.getHandoffs(undefined, controller.signal),
    ]).then(([students, saved, history]) => {
      if (controller.signal.aborted) return;
      const ids = new Set(students.map(student => student.id));
      setTargets(students.map(student => ({ student, reason: student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Tài khoản hoặc trạng thái học vụ không hoạt động.' : '' })));
      setSavedResults(Object.fromEntries(saved.filter(result => ids.has(result.studentId)).map(result => [result.studentId, { ...result, reasons: result.reasons ?? [], academicIssues: result.academicIssues ?? [] }])));
      setHandoffs(history);
    }).catch(cause => { if (!controller.signal.aborted) setError('Không tải được kết quả xét OJT: ' + (cause instanceof Error ? cause.message : 'Lỗi kết nối.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const handoffByStudent = useMemo(() => handoffsByStudent(handoffs), [handoffs]);
  const handoffDisplay = useMemo(() => handoffDisplayById(handoffs), [handoffs]);
  const handedOffIds = useMemo(() => new Set(handoffByStudent.keys()), [handoffByStudent]);
  const statusByStudent = Object.fromEntries(targets.map(target => [target.student.id, savedOjtDisplayStatus(savedResults[target.student.id], target.reason)])) as Record<number, OjtDisplayStatus>;
  const statusCounts = targets.reduce((counts, target) => { counts[statusByStudent[target.student.id]]++; return counts; },
    { ELIGIBLE: 0, NOT_ELIGIBLE: 0, REVIEW_REQUIRED: 0, PENDING: 0, ERROR: 0, STALE: 0, INACTIVE: 0 } as Record<OjtDisplayStatus, number>);
  const visible = targets.filter(target => (!search.trim() || normalize(`${target.student.studentCode} ${target.student.fullName}`).includes(normalize(search)))
    && (filter === 'ALL' || statusByStudent[target.student.id] === filter)
    && matchesHandoffFilter(target.student.id, handoffFilter, handedOffIds));
  useEffect(() => setPage(1), [search, filter, handoffFilter]);
  const pages = Math.max(1, Math.ceil(visible.length / 20));
  return { visible, pages, currentPage: Math.min(page, pages), statusByStudent, statusCounts, targets, loading, error, savedResults, handoffByStudent, handoffDisplay, search, setSearch, filter, setFilter, handoffFilter, setHandoffFilter, setPage };
}
