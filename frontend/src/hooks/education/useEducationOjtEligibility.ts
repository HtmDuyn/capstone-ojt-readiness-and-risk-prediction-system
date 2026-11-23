import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import type { SavedOjtEligibility } from '@/utils/education/savedOjtEligibility';
import {
  educationOjtWorkflowService, getAllItems, loadAndCalculateLocalEligibility,
  loadOjtConditions, loadSavedLocalOjtResults, saveLocalOjtResults, type CurrentOjtRule,
} from '@/services/educationService';
import type { ImportedStudent } from '@/types/education/import.types';
import { educationOjtDisplayStatus, type OjtDisplayStatus } from '@/utils/education/educationOjtReason';
import { handoffsByStudent, matchesHandoffFilter, selectFullCheckTargets, selectPendingSaveResults } from '@/utils/education/educationOjtCheckQueue';
import { handoffDisplayById } from '@/utils/education/educationOjtHandoffDisplay';
import React from 'react';
import { ojtSourceEndpoints, partitionOjtLoad, type OjtLoadIssue, type OjtSourceKey } from '@/utils/education/ojtEligibilityLoad';

type Target = { student: ImportedStudent; reason: string };
export const OJT_ELIGIBILITY_PAGE_SIZE = 20;
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const normalizeResults = (rows: (SavedOjtEligibility & { studentId: number })[] | LocalOjtResult[]): Record<number, LocalOjtResult> =>
  Object.fromEntries(rows.map(row => [row.studentId, { ...row, reasons: row.reasons ?? [], academicIssues: row.academicIssues ?? [] }]));

export function useEducationOjtEligibility() {
  const [targets, setTargets] = React.useState<Target[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sourceLoaded, setSourceLoaded] = React.useState<Record<OjtSourceKey, boolean>>({ students: false, results: false, policy: false, handoffs: false, thresholds: false });
  const [sourceErrors, setSourceErrors] = React.useState<Partial<Record<OjtSourceKey, OjtLoadIssue>>>({});
  const [retrying, setRetrying] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [rule, setRule] = React.useState<CurrentOjtRule | null>(null);
  const [conditions, setConditions] = React.useState<CurrentOjtRule[]>([]);
  const [error, setError] = React.useState('');
  const [savedResults, setSavedResults] = React.useState<Record<number, LocalOjtResult>>({});
  const [pendingResults, setPendingResults] = React.useState<Record<number, LocalOjtResult>>({});
  const [handoffs, setHandoffs] = React.useState<Handoff[]>([]);
  const [failures, setFailures] = React.useState<Record<number, string>>({});
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');
  const [handoffFilter, setHandoffFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const activeRequest = React.useRef<AbortController | null>(null);
  const running = React.useRef(false);
  const savingRequest = React.useRef(false);
  const saveKey = React.useRef<string | null>(null);
  const loadController = React.useRef<AbortController | null>(null);
  const sourceKeys = React.useMemo(() => (Object.keys(ojtSourceEndpoints) as OjtSourceKey[]).filter(key => key !== 'thresholds'), []);

  const loadSource = React.useCallback((key: OjtSourceKey, signal: AbortSignal) => {
    switch (key) {
      case 'students': return getAllItems<ImportedStudent>('/students', {}, signal);
      case 'results': return loadSavedLocalOjtResults(signal);
      case 'policy': return loadOjtConditions(signal);
      case 'handoffs': return educationOjtWorkflowService.getHandoffs(undefined, signal);
      case 'thresholds': throw new Error('Nguồn mức tín chỉ tùy chọn không còn được sử dụng.');
    }
  }, []);

  const applySource = React.useCallback((key: OjtSourceKey, value: unknown) => {
    switch (key) {
      case 'students': {
        const students = value as ImportedStudent[];
        setTargets(students.map(student => ({ student, reason: student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Tài khoản hoặc trạng thái học vụ không hoạt động.' : '' })));
        break;
      }
      case 'results': {
        const stored = value as (SavedOjtEligibility & { studentId: number })[];
        setSavedResults(normalizeResults(stored));
        if (stored.some(result => result.isStale)) setNotice('Có kết quả đã cũ; hãy xét lại sinh viên chưa bàn giao trước khi sử dụng.');
        break;
      }
      case 'policy': { const list = value as CurrentOjtRule[]; setConditions(list); setRule(previous => list.find(item => item.id === previous?.id) ?? list[0] ?? null); break; }
      case 'handoffs': setHandoffs(value as Handoff[]); break;
      case 'thresholds': break;
    }
    setSourceLoaded(previous => ({ ...previous, [key]: true }));
  }, []);

  React.useEffect(() => {
    const c = new AbortController();
    loadController.current = c;
    setLoading(true); setError('');
    Promise.resolve().then(() => {
      c.signal.throwIfAborted();
      return Promise.allSettled(sourceKeys.map(key => loadSource(key, c.signal)));
    }).then(settled => {
      if (c.signal.aborted) return;
      const { values, issues } = partitionOjtLoad(sourceKeys, settled);
      sourceKeys.forEach(key => { if (key in values) applySource(key, values[key]); });
      setSourceErrors(issues);
    }, error => {
      if (!c.signal.aborted) setError(error instanceof Error ? error.message : 'Không tải được dữ liệu xét OJT.');
    }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => { c.abort(); activeRequest.current?.abort(); };
  }, [applySource, loadSource, sourceKeys]);

  async function retryFailedSources() {
    const keys = sourceKeys.filter(key => sourceErrors[key]);
    if (!keys.length || retrying || busy || saving) return;
    loadController.current?.abort();
    const c = new AbortController(); loadController.current = c;
    setRetrying(true);
    try {
      const settled = await Promise.allSettled(keys.map(key => loadSource(key, c.signal)));
      if (c.signal.aborted) return;
      const { values, issues } = partitionOjtLoad(keys, settled);
      keys.forEach(key => { if (key in values) applySource(key, values[key]); });
      setSourceErrors(previous => {
        const next = { ...previous };
        keys.forEach(key => { if (issues[key]) next[key] = issues[key]; else delete next[key]; });
        return next;
      });
    } finally { if (!c.signal.aborted) setRetrying(false); }
  }

  const handoffByStudent = React.useMemo(() => handoffsByStudent(handoffs), [handoffs]);
  const handoffDisplay = React.useMemo(() => handoffDisplayById(handoffs), [handoffs]);
  const handedOffIds = React.useMemo(() => new Set(handoffByStudent.keys()), [handoffByStudent]);
  const dataLoaded = sourceKeys.every(key => sourceLoaded[key]);
  const canCheck = !loading && !retrying && dataLoaded && Boolean(rule);
  const fullCheck = React.useMemo(() => canCheck ? selectFullCheckTargets(targets, handedOffIds, savedResults) : [], [canCheck, targets, handedOffIds, savedResults]);
  const selectionLocked = loading || retrying || busy || saving || Object.keys(pendingResults).length > 0;

  async function runTargets(selected: Target[]) {
    if (running.current || savingRequest.current || !canCheck || !selected.length) return;
    const controller = new AbortController(); activeRequest.current = controller;
    running.current = true; setBusy(true); setError(''); setNotice('');
    const ids = new Set(selected.map(t => t.student.id));
    setFailures(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !ids.has(Number(id)))));
    setPendingResults(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !ids.has(Number(id)))));
    saveKey.current = null;
    const calculated: LocalOjtResult[] = [];
    let next = 0, failed = 0;
    try {
      if (!rule) throw new Error('Vui lòng thêm và chọn điều kiện xét OJT trước khi xét sinh viên.');
      const currentRule = rule;
      if (rule.id !== currentRule.id || rule.version !== currentRule.version || rule.minCredits !== currentRule.minCredits) {
        setPendingResults({});
        setNotice('Điều kiện xét đã thay đổi. Kết quả chưa lưu trước đó không còn được sử dụng.');
      }
      setRule(currentRule);
      await Promise.all(Array.from({ length: Math.min(4, selected.length) }, async () => {
        while (next < selected.length && !controller.signal.aborted) {
          const target = selected[next++];
          try {
            const result = await loadAndCalculateLocalEligibility(target.student.id, currentRule, controller.signal);
            if (controller.signal.aborted) return;
            const checked = { ...result, rule: { id: currentRule.id, version: currentRule.version, minCredits: currentRule.minCredits, issuingDocument: currentRule.issuingDocument } };
            calculated.push(checked);
            setPendingResults(previous => ({ ...previous, [target.student.id]: checked }));
          } catch (e) {
            if (controller.signal.aborted) return;
            failed++;
            setFailures(previous => ({ ...previous, [target.student.id]: e instanceof Error ? e.message : 'Không tải đủ dữ liệu để xét.' }));
          }
        }
      }));
      if (controller.signal.aborted) return;
      if (calculated.length) await persistResults(calculated, currentRule, failed);
      else setNotice(`Không xét được ${failed} hồ sơ. Vui lòng kiểm tra lý do ở từng sinh viên.`);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được điều kiện OJT đang áp dụng.');
    } finally { running.current = false; if (!controller.signal.aborted) setBusy(false); }
  }

  const runAll = () => runTargets(fullCheck);

  async function saveResults() {
    const calculated = selectPendingSaveResults(pendingResults);
    if (running.current || savingRequest.current || !calculated.length || !canCheck || !rule) return;
    await persistResults(calculated, rule, Object.keys(failures).length);
  }

  async function persistResults(calculated: LocalOjtResult[], rule: CurrentOjtRule, failed: number) {
    savingRequest.current = true; setSaving(true); setError('');
    saveKey.current ??= crypto.randomUUID();
    try {
      const { handedOffCount } = await saveLocalOjtResults(calculated, saveKey.current, rule);
      setPendingResults({});
      saveKey.current = null;
      setNotice('Đã lưu kết quả xét. Backend báo đã bàn giao ' + handedOffCount + ' sinh viên.' +
        (failed ? ' Có ' + failed + ' hồ sơ chưa xét được. Xem lý do ở từng sinh viên.' : ''));
      const refreshed = await Promise.allSettled([loadSavedLocalOjtResults(), educationOjtWorkflowService.getHandoffs()]);
      const { values, issues } = partitionOjtLoad(['results', 'handoffs'], refreshed);
      if (values.results) applySource('results', values.results);
      if (values.handoffs) applySource('handoffs', values.handoffs);
      setSourceErrors(previous => {
        const next = { ...previous };
        if (issues.results) next.results = issues.results; else delete next.results;
        if (issues.handoffs) next.handoffs = issues.handoffs; else delete next.handoffs;
        return next;
      });
      if (issues.results || issues.handoffs) {
        setSourceLoaded(previous => ({ ...previous, results: !issues.results, handoffs: !issues.handoffs }));
        setError('Đã lưu kết quả nhưng chưa tải lại được đầy đủ dữ liệu. Vui lòng thử tải lại nguồn lỗi.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa lưu được kết quả xét điều kiện OJT.');
    } finally { savingRequest.current = false; setSaving(false); }
  }

  const results = React.useMemo(() => ({ ...savedResults, ...pendingResults }), [savedResults, pendingResults]);
  const statusByStudent = React.useMemo(() => Object.fromEntries(targets.map(t =>
    [t.student.id, educationOjtDisplayStatus(results[t.student.id], failures[t.student.id], t.reason)],
  )) as Record<number, OjtDisplayStatus>, [targets, results, failures]);
  const statusCounts = React.useMemo(() => targets.reduce((counts, t) => {
    counts[statusByStudent[t.student.id]]++;
    return counts;
  }, { ELIGIBLE: 0, NOT_ELIGIBLE: 0, REVIEW_REQUIRED: 0, PENDING: 0, ERROR: 0, STALE: 0, INACTIVE: 0 }), [targets, statusByStudent]);
  const visible = React.useMemo(() => {
    const term = normalize(search);
    return targets.filter(t => (!term || normalize(`${t.student.studentCode} ${t.student.fullName}`).includes(term))
      && (filter === 'ALL' || statusByStudent[t.student.id] === filter)
      && (sourceLoaded.handoffs ? matchesHandoffFilter(t.student.id, handoffFilter, handedOffIds) : handoffFilter === 'ALL'));
  }, [targets, search, filter, statusByStudent, sourceLoaded.handoffs, handoffFilter, handedOffIds]);
  React.useEffect(() => setPage(1), [search, filter, handoffFilter]);
  const pages = Math.max(1, Math.ceil(visible.length / OJT_ELIGIBILITY_PAGE_SIZE)), currentPage = Math.min(page, pages);
  const checked = selectPendingSaveResults(pendingResults);
  return { fullCheck, runAll, saveResults, visible, pages, checked, statusByStudent, statusCounts, targets, loading, retrying, dataLoaded, sourceLoaded, sourceErrors, retryFailedSources, busy, saving, error, results, savedResults, pendingResults, handoffByStudent, handoffDisplay, failures, notice, search, setSearch, filter, setFilter, handoffFilter, setHandoffFilter, setPage, currentPage, rule, conditions,
    setRule: (id: number) => { const selected = conditions.find(item => item.id === id); if (selected) { setPendingResults({}); saveKey.current = null; setRule(selected); setNotice('Đã chọn điều kiện xét OJT.'); } },
    selectionLocked,
    discardPending: () => { setPendingResults({}); saveKey.current = null; },
  };
}
