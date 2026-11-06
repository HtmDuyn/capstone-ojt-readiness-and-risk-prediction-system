import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import { getAllItems } from '@/services/educationApi';
import { loadAndCalculateLocalEligibility, loadSavedLocalOjtResults, saveLocalOjtResults } from '@/services/localOjtEligibility.service';
import type { ImportedStudent } from '@/types/education/import.types';
import React from 'react';

type Target = { student: ImportedStudent; reason: string };
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

export function useEducationOjtEligibility() {
  const [targets, setTargets] = React.useState<Target[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savedCount, setSavedCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState('');
  const [revision, setRevision] = React.useState(0);
  const [results, setResults] = React.useState<Record<number, LocalOjtResult>>({});
  const [failures, setFailures] = React.useState<Record<number, string>>({});
  const [notice, setNotice] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const activeRequest = React.useRef<AbortController | null>(null);
  const running = React.useRef(false);
  const savingRequest = React.useRef(false);
  const saveKey = React.useRef<string | null>(null);
  React.useEffect(() => {
    const c = new AbortController();
    setLoading(true); setError(''); setResults({}); setFailures({}); setNotice(''); setTargets([]); activeRequest.current?.abort();
    setSavedCount(null); saveKey.current = null;
    Promise.allSettled([
      getAllItems<ImportedStudent>('/students', {}, c.signal),
      loadSavedLocalOjtResults(c.signal),
    ]).then(([studentResponse, savedResponse]) => {
      if (c.signal.aborted) return;
      if (studentResponse.status === 'rejected') throw studentResponse.reason;
      const students = studentResponse.value;
      setTargets(students.map(student => ({ student, reason: student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Tài khoản hoặc trạng thái học vụ không hoạt động.' : '' })));
      const stored = savedResponse.status === 'fulfilled' ? savedResponse.value : students.flatMap(student => student.calculatedEligibility ? [{ ...student.calculatedEligibility, studentId: student.id }] : []);
      const studentIds = new Set(students.map(student => student.id));
      const restored = stored.filter(result => studentIds.has(result.studentId));
      setResults(Object.fromEntries(restored.map(result => [result.studentId, { ...result, reasons: result.reasons ?? [], academicIssues: result.academicIssues ?? [] }])));
      if (restored.length) {
        setSavedCount(restored.length);
        setNotice('Đã tải ' + restored.length + ' kết quả đã lưu.' + (restored.some(result => result.isStale) ? ' Có dữ liệu đã thay đổi; hãy xét lại trước khi sử dụng.' : ''));
      }
      if (savedResponse.status === 'rejected') setError('Không tải được API kết quả đã lưu: ' + (savedResponse.reason instanceof Error ? savedResponse.reason.message : 'Lỗi kết nối.'));
    }).catch(e => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được sinh viên.'); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => { c.abort(); activeRequest.current?.abort(); };
  }, [revision]);
  const ready = targets.filter(t => !t.reason);
  async function runAll() {
    if (running.current || savingRequest.current || loading || !ready.length) return;
    const controller = new AbortController(); activeRequest.current = controller;
    running.current = true; setBusy(true); setError(''); setNotice(''); setFailures({}); setResults({});
    setSavedCount(null); saveKey.current = null;
    let next = 0, completed = 0, failed = 0;
    try {
      await Promise.all(Array.from({ length: Math.min(4, ready.length) }, async () => {
        while (next < ready.length && !controller.signal.aborted) {
          const target = ready[next++];
          try {
            const result = await loadAndCalculateLocalEligibility(target.student.id, controller.signal);
            if (controller.signal.aborted) return;
            completed++;
            setResults(previous => ({ ...previous, [target.student.id]: result }));
          } catch (e) {
            if (controller.signal.aborted) return;
            failed++;
            const message = e instanceof Error ? e.message : 'Không tải đủ dữ liệu để xét.';
            setFailures(previous => ({ ...previous, [target.student.id]: message }));
          }
          setNotice('Đã xét ' + completed + '/' + ready.length + ' sinh viên' + (failed ? '; ' + failed + ' hồ sơ gặp lỗi.' : '...'));
        }
      }));
      if (!controller.signal.aborted) setNotice('Đã xét ' + completed + ' sinh viên bằng FE. ' + (targets.length - ready.length) + ' sinh viên không hoạt động; ' + failed + ' hồ sơ gặp lỗi. Kết quả chưa lưu vào database.');
    } finally { running.current = false; if (!controller.signal.aborted) setBusy(false); }
  }
  async function saveResults() {
    const calculated = Object.values(results);
    if (running.current || savingRequest.current || !calculated.length || savedCount !== null) return;
    savingRequest.current = true; setSaving(true); setError('');
    saveKey.current ??= crypto.randomUUID();
    try {
      const count = await saveLocalOjtResults(calculated, saveKey.current);
      setSavedCount(count);
      setNotice(`Đã lưu ${count} kết quả xét điều kiện OJT vào hệ thống.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa lưu được kết quả xét điều kiện OJT.');
    } finally { savingRequest.current = false; setSaving(false); }
  }
  const visible = targets.filter(t => (!search.trim() || normalize(`${t.student.studentCode} ${t.student.fullName}`).includes(normalize(search)))
    && (filter === 'ALL' || (filter === 'PENDING' ? !results[t.student.id] || results[t.student.id].isStale : !results[t.student.id]?.isStale && results[t.student.id]?.status === filter)));
  React.useEffect(() => setPage(1), [search, filter, revision]);
  const pages = Math.max(1, Math.ceil(visible.length / 20)), currentPage = Math.min(page, pages);
  const checked = Object.values(results);
  const currentResults = checked.filter(result => !result.isStale);

  return { ready, runAll, saveResults, visible, pages, checked, currentResults, targets, loading, busy, saving, savedCount, error, setRevision, results, failures, notice, search, setSearch, filter, setFilter, setPage, currentPage };
}
