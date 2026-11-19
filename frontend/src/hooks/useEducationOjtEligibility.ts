import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { Handoff } from '@/types/education/ojtWorkflow.types';
import type { SavedOjtEligibility } from '@/utils/education/savedOjtEligibility';
import { getAllItems } from '@/services/educationService';
import { educationOjtWorkflowService } from '@/services/educationService';
import { loadAndCalculateLocalEligibility, loadCurrentOjtRule, loadOjtCreditThresholds, loadSavedLocalOjtResults, saveLocalOjtResults } from '@/services/educationService';
import type { OjtCreditThreshold } from '@/services/educationService';
import type { CurrentOjtRule } from '@/services/educationService';
import type { ImportedStudent } from '@/types/education/import.types';
import { educationOjtDisplayStatus, type OjtDisplayStatus } from '@/utils/education/educationOjtReason';
import { handoffsByStudent, matchesHandoffFilter, selectFullCheckTargets, selectPendingSaveResults } from '@/utils/education/educationOjtCheckQueue';
import { handoffDisplayById } from '@/utils/education/educationOjtHandoffDisplay';
import React from 'react';

type Target = { student: ImportedStudent; reason: string };
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
const normalizeResults = (rows: (SavedOjtEligibility & { studentId: number })[] | LocalOjtResult[]): Record<number, LocalOjtResult> =>
  Object.fromEntries(rows.map(row => [row.studentId, { ...row, reasons: row.reasons ?? [], academicIssues: row.academicIssues ?? [] }]));

export function useEducationOjtEligibility() {
  const [targets, setTargets] = React.useState<Target[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [rule, setRule] = React.useState<CurrentOjtRule | null>(null);
  const [thresholds, setThresholds] = React.useState<OjtCreditThreshold[]>([]);
  const [thresholdId, setThresholdId] = React.useState<number | undefined>();
  const [error, setError] = React.useState('');
  const [revision, setRevision] = React.useState(0);
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
  React.useEffect(() => {
    const c = new AbortController();
    setLoading(true); setDataLoaded(false); setError(''); setSavedResults({}); setPendingResults({}); setHandoffs([]); setFailures({}); setNotice(''); setTargets([]); activeRequest.current?.abort();
    setRule(null); saveKey.current = null;
    Promise.all([
      getAllItems<ImportedStudent>('/students', {}, c.signal),
      loadSavedLocalOjtResults(c.signal),
      loadCurrentOjtRule(c.signal),
      educationOjtWorkflowService.getHandoffs(undefined, c.signal),
      loadOjtCreditThresholds(c.signal),
    ]).then(([students, stored, currentRule, history, options]) => {
      if (c.signal.aborted) return;
      setRule(currentRule);
      setThresholds(options);
      setTargets(students.map(student => ({ student, reason: student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Tài khoản hoặc trạng thái học vụ không hoạt động.' : '' })));
      setHandoffs(history);
      setDataLoaded(true);
      const studentIds = new Set(students.map(student => student.id));
      const restored = stored.filter(result => studentIds.has(result.studentId));
      setSavedResults(normalizeResults(restored));
      if (restored.some(result => result.isStale)) setNotice('Có kết quả đã cũ; hãy xét lại sinh viên chưa bàn giao trước khi sử dụng.');
    }).catch(e => { if (!c.signal.aborted) setError('Không tải đủ dữ liệu để xác định sinh viên cần xét: ' + (e instanceof Error ? e.message : 'Lỗi kết nối.')); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => { c.abort(); activeRequest.current?.abort(); };
  }, [revision]);

  const handoffByStudent = React.useMemo(() => handoffsByStudent(handoffs), [handoffs]);
  const handoffDisplay = React.useMemo(() => handoffDisplayById(handoffs), [handoffs]);
  const handedOffIds = React.useMemo(() => new Set(handoffByStudent.keys()), [handoffByStudent]);
  const selectedThreshold = thresholds.find(option => option.id === thresholdId);
  const canCheck = !loading && dataLoaded && Boolean(rule && selectedThreshold);
  const fullCheck = canCheck ? selectFullCheckTargets(targets, handedOffIds) : [];
  const selectionLocked = loading || busy || saving || Object.keys(pendingResults).length > 0;

  async function runTargets(selected: Target[]) {
    if (running.current || savingRequest.current || !canCheck || !selectedThreshold || !selected.length) return;
    const controller = new AbortController(); activeRequest.current = controller;
    running.current = true; setBusy(true); setError(''); setNotice('');
    const ids = new Set(selected.map(t => t.student.id));
    setFailures(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !ids.has(Number(id)))));
    setPendingResults(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => !ids.has(Number(id)))));
    saveKey.current = null;
    const calculated: LocalOjtResult[] = [];
    let next = 0, failed = 0;
    try {
      const policy = await loadCurrentOjtRule(controller.signal);
      const currentRule = { ...policy, minCredits: selectedThreshold.minCredits, thresholdId: selectedThreshold.id };
      if (rule && (rule.version !== currentRule.version || rule.minCredits !== currentRule.minCredits || rule.thresholdId !== currentRule.thresholdId)) {
        setPendingResults({});
        setNotice('Quy tắc xét đã thay đổi. Kết quả chưa lưu trước đó không còn được sử dụng.');
      }
      setRule(currentRule);
      await Promise.all(Array.from({ length: Math.min(4, selected.length) }, async () => {
        while (next < selected.length && !controller.signal.aborted) {
          const target = selected[next++];
          try {
            const result = await loadAndCalculateLocalEligibility(target.student.id, currentRule, controller.signal);
            if (controller.signal.aborted) return;
            const checked = { ...result, rule: currentRule };
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
      const eligibleCount = calculated.filter(result => result.status === 'ELIGIBLE').length;
      const waitingCount = Math.max(0, eligibleCount - handedOffCount);
      setNotice('Đã lưu kết quả xét. Đã tự động bàn giao ' + handedOffCount + ' sinh viên.' +
        (waitingCount ? ' Còn ' + waitingCount + ' sinh viên đủ tín chỉ đang chờ bàn giao.' : '') +
        (failed ? ' Có ' + failed + ' hồ sơ chưa xét được. Xem lý do ở từng sinh viên.' : ''));
      try {
        const [refreshed, updatedHandoffs] = await Promise.all([loadSavedLocalOjtResults(), educationOjtWorkflowService.getHandoffs()]);
        setHandoffs(updatedHandoffs);
        setSavedResults(normalizeResults(refreshed));
      } catch {
        setSavedResults(previous => ({ ...previous, ...normalizeResults(calculated) }));
        setError('Đã lưu kết quả nhưng chưa tải lại được danh sách. Vui lòng tải lại trang để kiểm tra.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa lưu được kết quả xét điều kiện OJT.');
    } finally { savingRequest.current = false; setSaving(false); }
  }

  const results = { ...savedResults, ...pendingResults };
  const statusByStudent = Object.fromEntries(targets.map(t => [t.student.id, educationOjtDisplayStatus(results[t.student.id], failures[t.student.id], t.reason)])) as Record<number, OjtDisplayStatus>;
  const statusCounts = targets.reduce((counts, t) => { counts[statusByStudent[t.student.id]]++; return counts; },
    { ELIGIBLE: 0, NOT_ELIGIBLE: 0, REVIEW_REQUIRED: 0, PENDING: 0, ERROR: 0, STALE: 0, INACTIVE: 0 } as Record<OjtDisplayStatus, number>);
  const visible = targets.filter(t => (!search.trim() || normalize(`${t.student.studentCode} ${t.student.fullName}`).includes(normalize(search)))
    && (filter === 'ALL' || statusByStudent[t.student.id] === filter)
    && matchesHandoffFilter(t.student.id, handoffFilter, handedOffIds));
  React.useEffect(() => setPage(1), [search, filter, handoffFilter, revision]);
  const pages = Math.max(1, Math.ceil(visible.length / 20)), currentPage = Math.min(page, pages);
  const checked = selectPendingSaveResults(pendingResults);
  return { fullCheck, runAll, saveResults, visible, pages, checked, statusByStudent, statusCounts, targets, loading, busy, saving, error, results, savedResults, pendingResults, handoffByStudent, handoffDisplay, failures, notice, search, setSearch, filter, setFilter, handoffFilter, setHandoffFilter, setPage, currentPage, rule,
    thresholds, thresholdId, setThresholdId, selectedThreshold, selectionLocked,
    discardPending: () => { setPendingResults({}); saveKey.current = null; },
  };
}
