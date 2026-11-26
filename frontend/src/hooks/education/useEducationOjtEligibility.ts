import React from 'react';
import type { ImportedStudent } from '@/types/education/import.types';
import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { SavedOjtEligibility } from '@/utils/education/savedOjtEligibility';
import {
  getAllItems, latestEffectiveOjtRule, loadOjtConditions, loadSavedOjtEligibilityResults,
  runOjtEligibilityAssessment, type CurrentOjtRule,
} from '@/services/educationService';
import { educationOjtDisplayStatus, type OjtDisplayStatus } from '@/utils/education/educationOjtReason';
import { ojtSourceEndpoints, partitionOjtLoad, type OjtLoadIssue, type OjtSourceKey } from '@/utils/education/ojtEligibilityLoad';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

type Target = { student: ImportedStudent; reason: string };
export const OJT_ELIGIBILITY_PAGE_SIZE = 20;
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const normalizeResults = (rows: (SavedOjtEligibility & { studentId: number })[]): Record<number, LocalOjtResult> =>
  Object.fromEntries(rows.map(row => [row.studentId, { ...row, reasons: row.reasons ?? [], academicIssues: row.academicIssues ?? [] }]));

export function useEducationOjtEligibility() {
  const [targets, setTargets] = React.useState<Target[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sourceLoaded, setSourceLoaded] = React.useState<Record<OjtSourceKey, boolean>>({ students: false, results: false, policy: false });
  const [sourceErrors, setSourceErrors] = React.useState<Partial<Record<OjtSourceKey, OjtLoadIssue>>>({});
  const [retrying, setRetrying] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [rule, setRule] = React.useState<CurrentOjtRule | null>(null);
  const [error, setError] = React.useState('');
  const [savedResults, setSavedResults] = React.useState<Record<number, LocalOjtResult>>({});
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const running = React.useRef(false);
  const loadController = React.useRef<AbortController | null>(null);
  const sourceKeys = React.useMemo(() => Object.keys(ojtSourceEndpoints) as OjtSourceKey[], []);

  const loadSource = React.useCallback((key: OjtSourceKey, signal: AbortSignal) => {
    switch (key) {
      case 'students': return getAllItems<ImportedStudent>('/students', {}, signal);
      case 'results': return loadSavedOjtEligibilityResults(signal);
      case 'policy': return loadOjtConditions(signal);
    }
  }, []);

  const applySource = React.useCallback((key: OjtSourceKey, value: unknown) => {
    switch (key) {
      case 'students': {
        const students = value as ImportedStudent[];
        setTargets(students.filter(student => student.hasPassedOjt202 !== true).map(student => ({ student, reason: student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Tài khoản hoặc trạng thái học vụ không hoạt động.' : '' })));
        break;
      }
      case 'results': {
        const stored = value as (SavedOjtEligibility & { studentId: number })[];
        setSavedResults(normalizeResults(stored));
        if (stored.some(result => result.isStale)) setNotice('Có kết quả đã cũ do dữ liệu học vụ hoặc điều kiện OJT thay đổi; hãy xét lại trước khi sử dụng.');
        break;
      }
      case 'policy': setRule(latestEffectiveOjtRule(value as CurrentOjtRule[])); break;
    }
    setSourceLoaded(previous => ({ ...previous, [key]: true }));
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    loadController.current = controller;
    setLoading(true); setError('');
    Promise.allSettled(sourceKeys.map(key => loadSource(key, controller.signal))).then(settled => {
      if (controller.signal.aborted) return;
      const { values, issues } = partitionOjtLoad(sourceKeys, settled);
      sourceKeys.forEach(key => { if (key in values) applySource(key, values[key]); });
      setSourceErrors(issues);
    }).catch(loadError => {
      if (!controller.signal.aborted) setError(friendlyErrorMessage(loadError, 'Không tải được dữ liệu xét OJT. Vui lòng thử lại.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applySource, loadSource, sourceKeys]);

  React.useEffect(() => {
    if (loading || retrying || busy) return;
    const controller = new AbortController();
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.hidden || running.current) return;
      refreshing = true;
      try {
        const keys = ['policy', 'results'] as const;
        const data = await Promise.allSettled(keys.map(key => loadSource(key, controller.signal)));
        if (controller.signal.aborted || running.current) return;
        data.forEach((item, index) => { if (item.status === 'fulfilled') applySource(keys[index], item.value); });
      } finally { refreshing = false; }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [applySource, loadSource, loading, retrying, busy]);

  async function retryFailedSources() {
    const keys = sourceKeys.filter(key => sourceErrors[key]);
    if (!keys.length || retrying || busy) return;
    loadController.current?.abort();
    const controller = new AbortController(); loadController.current = controller;
    setRetrying(true);
    try {
      const settled = await Promise.allSettled(keys.map(key => loadSource(key, controller.signal)));
      if (controller.signal.aborted) return;
      const { values, issues } = partitionOjtLoad(keys, settled);
      keys.forEach(key => { if (key in values) applySource(key, values[key]); });
      setSourceErrors(previous => {
        const next = { ...previous };
        keys.forEach(key => { if (issues[key]) next[key] = issues[key]; else delete next[key]; });
        return next;
      });
    } finally { if (!controller.signal.aborted) setRetrying(false); }
  }

  const dataLoaded = sourceKeys.every(key => sourceLoaded[key]);
  const canCheck = !loading && !retrying;
  const selectionLocked = loading || retrying || busy;

  async function runAll() {
    if (running.current || !canCheck) return;
    running.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await runOjtEligibilityAssessment();
      const summary = `Đã xét ${result.checkedCount} sinh viên; lưu ${result.savedCount} kết quả. QHDN có ${result.eligibleCount} sinh viên đủ điều kiện (${result.assignedCount} đã vào đợt đang mở, ${result.waitingCount} chờ đợt). Loại ${result.excludedPassedOjt202Count} sinh viên đã đạt OJT202.`;
      setNotice(summary);
      const keys = ['results', 'policy'] as const;
      const refreshed = await Promise.allSettled([loadSavedOjtEligibilityResults(), loadOjtConditions()]);
      const { values, issues } = partitionOjtLoad(keys, refreshed);
      keys.forEach(key => { if (key in values) applySource(key, values[key]); });
      setSourceErrors(previous => {
        const next = { ...previous };
        keys.forEach(key => { if (issues[key]) next[key] = issues[key]; else delete next[key]; });
        return next;
      });
      if (Object.keys(issues).length) {
        setSourceLoaded(previous => ({ ...previous, results: !issues.results, policy: !issues.policy }));
        setError('Đã xét và lưu kết quả, nhưng chưa tải lại được một số dữ liệu. Hãy thử tải lại nguồn lỗi.');
      }
      setNotice(summary);
    } catch (assessmentError) {
      setError(friendlyErrorMessage(assessmentError, 'Chưa xét được điều kiện OJT. Vui lòng thử lại.'));
    } finally { running.current = false; setBusy(false); }
  }

  const failures = React.useMemo<Record<number, string>>(() => ({}), []);
  const statusByStudent = React.useMemo(() => Object.fromEntries(targets.map(target =>
    [target.student.id, educationOjtDisplayStatus(savedResults[target.student.id], undefined, target.reason)],
  )) as Record<number, OjtDisplayStatus>, [targets, savedResults]);
  const statusCounts = React.useMemo(() => targets.reduce((counts, target) => {
    counts[statusByStudent[target.student.id]]++;
    return counts;
  }, { ELIGIBLE: 0, NOT_ELIGIBLE: 0, REVIEW_REQUIRED: 0, PENDING: 0, ERROR: 0, STALE: 0, INACTIVE: 0 }), [targets, statusByStudent]);
  const visible = React.useMemo(() => {
    const term = normalize(search);
    return targets.filter(target => {
      return (filter === 'ALL' || statusByStudent[target.student.id] === filter)
        && (!term || normalize(`${target.student.studentCode} ${target.student.fullName}`).includes(term));
    });
  }, [targets, search, filter, statusByStudent]);
  React.useEffect(() => setPage(1), [search, filter]);
  const pages = Math.max(1, Math.ceil(visible.length / OJT_ELIGIBILITY_PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  return {
    runAll, visible, pages, statusByStudent, statusCounts, targets, loading, retrying,
    dataLoaded, sourceLoaded, sourceErrors, retryFailedSources, busy, error,
    results: savedResults, savedResults, failures, notice, search, setSearch, filter, setFilter,
    setPage, currentPage, rule, selectionLocked,
  };
}
