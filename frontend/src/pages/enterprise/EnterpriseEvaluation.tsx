import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, Pencil, Save, Search, Send } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { StudentDialog } from '@/components/student/StudentDialog';
import { enterpriseService, type EnterpriseInternshipItem, type EnterpriseInternshipTask } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { loadAllPages } from '@/components/enterprise/recruitment';
import { applyEvaluationScore, evaluationAverage, evaluationScoreFields, parseEvaluationScore, taskScoreSuggestion,
  type EvaluationScoreKey, type EvaluationScores } from '@/utils/enterpriseEvaluation';

interface EvaluationRow extends EvaluationScores {
  id: number;
  fullName: string;
  studentCode: string;
  position: string;
  semesterId: number;
  semester: string;
  comments: string;
  status: 'NEW' | 'DRAFT' | 'SUBMITTED';
  locked: boolean;
  dirty: boolean;
  suggestion: number | null;
  submittedAverage: number | null;
  fromTask: boolean;
  tasks: EnterpriseInternshipTask[];
}

interface ScoreEditor extends EvaluationScores {
  id: number;
  comments: string;
}

function makeRow(item: EnterpriseInternshipItem, tasks: EnterpriseInternshipTask[], tasksAvailable: boolean): EvaluationRow {
  const ev = item.evaluation;
  const completed = tasks.filter(task => task.enterpriseStatus === 'DONE').length;
  const suggestion = tasksAvailable ? taskScoreSuggestion(completed, tasks.length) : null;
  const useSuggestion = !ev && suggestion !== null;
  return {
    id: item.id, fullName: item.student?.fullName || '', studentCode: item.student?.studentCode || '',
    position: item.position?.title || '', semesterId: item.ojtSemesterId,
    semester: tasks[0]?.semesterCode || `Kỳ OJT #${item.ojtSemesterId}`,
    completionScore: ev?.completionScore == null ? (useSuggestion ? String(suggestion) : '') : String(ev.completionScore),
    skillScore: ev?.skillScore == null ? '' : String(ev.skillScore),
    attitudeScore: ev?.attitudeScore == null ? '' : String(ev.attitudeScore),
    comments: ev?.comments || '', status: ev?.status === 'SUBMITTED' ? 'SUBMITTED' : ev ? 'DRAFT' : 'NEW',
    locked: item.evaluationLocked === true || ev?.status === 'SUBMITTED'
      || !['ASSIGNED','ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status?.toUpperCase()), dirty: false,
    suggestion, submittedAverage: ev?.overallScore == null ? null : Number(ev.overallScore), fromTask: useSuggestion, tasks,
  };
}

function errorText(error: unknown): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || 'Không thể lưu đánh giá. Vui lòng thử lại.';
}

const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400';
const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';

export function EnterpriseEvaluation() {
  const { loading: profileLoading, companyId } = useEnterprise();
  const [rows, setRows] = useState<EvaluationRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [semester, setSemester] = useState('all');
  const [column, setColumn] = useState<EvaluationScoreKey | 'all'>('all');
  const [bulkScore, setBulkScore] = useState('8');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editor, setEditor] = useState<ScoreEditor | null>(null);
  const [editorError, setEditorError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const savingRef = useRef(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const limit = 20;

  const fetchRows = useCallback(async (background = false) => {
    if (profileLoading || savingRef.current) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (!background) { setLoading(true); setError(''); }
    try {
      const internships = await loadAllPages<EnterpriseInternshipItem>(
        page => enterpriseService.listInternships({ page, limit: 100 }, controller.signal), controller.signal, 'sinh viên thực tập');
      let tasks: EnterpriseInternshipTask[] = [];
      let tasksAvailable = true;
      try {
        if (!companyId) throw new Error('Không tìm thấy doanh nghiệp để tải task.');
        tasks = await loadAllPages<EnterpriseInternshipTask>(
          page => enterpriseService.listInternshipTasks(companyId, { page, limit: 100 }, controller.signal), controller.signal, 'tiến độ task');
      } catch (e) {
        if (controller.signal.aborted) return;
        tasksAvailable = false;
        setTaskError(`Không tải được tiến độ task. Bạn vẫn có thể nhập điểm thủ công. ${errorText(e)}`);
      }
      if (controller.signal.aborted) return;
      const byAssignment = new Map<number, EnterpriseInternshipTask[]>();
      for (const task of tasks) byAssignment.set(task.assignmentId, [...(byAssignment.get(task.assignmentId) || []), task]);
      if (tasksAvailable) setTaskError('');
      const roster = internships.map(item => makeRow(item, byAssignment.get(item.id) || [], tasksAvailable));
      setRows(current => {
        const edits = new Map(current.filter(row => row.dirty).map(row => [row.id, row]));
        return roster.map(row => {
          const draft = edits.get(row.id);
          if (!draft || row.locked || !background) return row;
          return { ...draft, tasks: row.tasks, suggestion: row.suggestion,
            completionScore: draft.fromTask && row.suggestion !== null ? String(row.suggestion) : draft.completionScore };
        });
      });
      if (!background) setSelected(new Set());
    } catch (e) { if (!controller.signal.aborted) setError(errorText(e)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [companyId, profileLoading]);

  useEffect(() => { void fetchRows(); return () => requestRef.current?.abort(); }, [fetchRows]);
  useEffect(() => {
    if (editor || confirming || busy || loading) return;
    const refresh = () => { if (!document.hidden) void fetchRows(true); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [fetchRows, editor, confirming, busy, loading]);
  const hasUnsaved = rows.some(row => row.dirty);
  useEffect(() => {
    if (!hasUnsaved) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [hasUnsaved]);

  const filtered = useMemo(() => rows.filter(row => {
    const query = search.trim().toLocaleLowerCase('vi');
    return (!query || `${row.fullName} ${row.studentCode} ${row.position}`.toLocaleLowerCase('vi').includes(query))
      && (semester === 'all' || String(row.semesterId) === semester)
      && (status === 'all' || (status === 'missing' ? evaluationAverage(row) === null && !row.locked : row.status === status));
  }), [rows, search, semester, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const visible = filtered.slice((page - 1) * limit, page * limit);
  const editableVisible = visible.filter(row => !row.locked);
  const checked = editableVisible.length > 0 && editableVisible.every(row => selected.has(row.id));
  const selectedRows = rows.filter(row => selected.has(row.id) && !row.locked);
  const detail = rows.find(row => row.id === detailId);
  const editingRow = rows.find(row => row.id === editor?.id);
  const semesters = Array.from(new Map(rows.map(row => [row.semesterId, row.semester])).entries());
  useEffect(() => { setPage(1); }, [search, status, semester]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = !checked && editableVisible.some(row => selected.has(row.id));
  }, [checked, editableVisible, selected]);

  const edit = (id: number, patch: Partial<EvaluationRow>) => {
    if (savingRef.current) return;
    setRows(current => current.map(row => row.id === id && !row.locked ? { ...row, ...patch, dirty: true } : row));
    setSelected(current => new Set(current).add(id));
    setMessage(''); setError('');
  };
  const openEditor = (row: EvaluationRow) => {
    if (busy || row.locked) return;
    setEditor({ id: row.id, completionScore: row.completionScore, skillScore: row.skillScore,
      attitudeScore: row.attitudeScore, comments: row.comments });
    setEditorError('');
  };
  const updateScores = () => {
    if (!editor || !editingRow || editingRow.locked || savingRef.current) return;
    if (evaluationScoreFields.some(({ key }) => editor[key].trim() !== '' && parseEvaluationScore(editor[key]) === null)) {
      setEditorError('Điểm phải từ 0 đến 10, tối đa 2 chữ số thập phân. Có thể để trống tiêu chí khi lưu nháp.');
      return;
    }
    if (evaluationScoreFields.some(({ key }) => editor[key] !== editingRow[key]) || editor.comments !== editingRow.comments) {
      const { id, ...scores } = editor;
      edit(id, { ...scores, fromTask: scores.completionScore === editingRow.completionScore && editingRow.fromTask });
      setMessage(`Đã cập nhật điểm ${editingRow.fullName} trên bảng. Bấm Lưu nháp hoặc Lưu chính thức để lưu đánh giá.`);
    }
    setEditor(null);
  };
  const toggle = (id: number) => setSelected(current => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const applyBulk = () => {
    if (!selectedRows.length) { setError('Vui lòng chọn sinh viên cần áp dụng điểm.'); return; }
    if (parseEvaluationScore(bulkScore) === null) { setError('Điểm phải từ 0 đến 10, tối đa 2 chữ số thập phân.'); return; }
    setRows(current => current.map(row => selected.has(row.id) && !row.locked
      ? { ...applyEvaluationScore(row, column, bulkScore), dirty: true, fromTask: column === 'all' || column === 'completionScore' ? false : row.fromTask } : row));
    setError(''); setMessage(`Đã áp dụng điểm cho ${selectedRows.length} sinh viên. Chưa lưu đánh giá.`);
  };
  const validate = (submitting: boolean) => {
    if (!selectedRows.length || selectedRows.length > 300) { setError('Vui lòng chọn từ 1 đến 300 sinh viên để lưu.'); return false; }
    const invalid = selectedRows.find(row => evaluationScoreFields.some(({ key }) =>
      (row[key].trim() !== '' || submitting) && parseEvaluationScore(row[key]) === null));
    if (invalid) { setError(`${invalid.fullName} (${invalid.studentCode}): ${submitting ? 'cần đủ 3 tiêu chí, ' : ''}điểm từ 0 đến 10 và tối đa 2 chữ số thập phân.`); return false; }
    setError(''); return true;
  };
  const save = async (target: 'DRAFT' | 'SUBMITTED') => {
    if (savingRef.current || !validate(target === 'SUBMITTED')) return;
    requestRef.current?.abort();
    savingRef.current = true; setBusy(true); setMessage('');
    try {
      const response = await enterpriseService.saveBulkEvaluations(selectedRows.map(row => ({
        assignmentId: row.id, completionScore: parseEvaluationScore(row.completionScore),
        skillScore: parseEvaluationScore(row.skillScore), attitudeScore: parseEvaluationScore(row.attitudeScore),
        comments: row.comments.trim() || null,
      })), target, target === 'SUBMITTED');
      const saved = new Map(response.data.items.map(item => [item.assignmentId, item]));
      setRows(current => current.map(row => {
        const ev = saved.get(row.id);
        return ev ? { ...row, status: target, dirty: false, locked: target === 'SUBMITTED',
          submittedAverage: ev.overallScore ?? null,
          completionScore: ev.completionScore == null ? '' : String(ev.completionScore),
          skillScore: ev.skillScore == null ? '' : String(ev.skillScore),
          attitudeScore: ev.attitudeScore == null ? '' : String(ev.attitudeScore) } : row;
      }));
      if (target === 'SUBMITTED') setSelected(current => new Set([...current].filter(id => !saved.has(id))));
      setConfirming(false);
      setMessage(target === 'DRAFT' ? `Đã lưu nháp ${saved.size} sinh viên. Bạn có thể tiếp tục chỉnh sửa.`
        : `Đã gửi điểm ${saved.size} sinh viên. Điểm đã cập nhật sang Phòng Quan hệ doanh nghiệp.`);
    } catch (e) { setError(errorText(e)); setConfirming(false); }
    finally { savingRef.current = false; setBusy(false); }
  };

  return <div className="space-y-5 pb-10">
    <PageBanner variant="enterprise" title="Đánh giá OJT hàng loạt" badge="Chấm điểm OJT"
      description="Xem điểm, chỉnh sửa qua cột Thao tác, lưu nháp và gửi kết quả đến Phòng Quan hệ doanh nghiệp." />
    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />{message}</div>}
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18} />{error}</div>}
    {taskError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{taskError}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-busy={loading || busy}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div><h2 className="text-lg font-bold text-slate-900">Đánh giá thực tập sinh</h2><p className="mt-1 text-sm text-slate-500">Điểm trung bình = (Chuyên ngành + Kỹ năng mềm + Thái độ) / 3</p></div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">Đã gửi {rows.filter(row => row.status === 'SUBMITTED').length} / {rows.length} sinh viên</span>
      </div>
      <div className="space-y-4 border-b border-slate-100 bg-slate-50/60 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-52 flex-1 text-xs font-semibold text-slate-600">Tìm sinh viên<div className="relative mt-1.5"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className={inputClass + ' w-full pl-9'} placeholder="Họ tên, mã sinh viên, vị trí…" value={search} disabled={busy || loading} onChange={e => setSearch(e.target.value)} /></div></label>
          <label className="text-xs font-semibold text-slate-600">Kỳ OJT<select className={inputClass + ' mt-1.5 block'} value={semester} disabled={busy || loading} onChange={e => setSemester(e.target.value)}><option value="all">Tất cả kỳ OJT</option>{semesters.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Trạng thái<select className={inputClass + ' mt-1.5 block'} value={status} disabled={busy || loading} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="NEW">Chưa lưu</option><option value="DRAFT">Bản nháp</option><option value="SUBMITTED">Đã gửi QHDN</option><option value="missing">Thiếu điểm</option></select></label>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-xs font-semibold text-slate-600">Nhập điểm<input type="number" min={0} max={10} step="0.01" inputMode="decimal" placeholder="0–10" className={inputClass + ' mt-1.5 block w-32'} value={bulkScore} disabled={busy || loading} aria-invalid={bulkScore !== '' && parseEvaluationScore(bulkScore) === null} onChange={e => setBulkScore(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Chọn cột điểm<select className={inputClass + ' mt-1.5 block'} value={column} disabled={busy || loading} onChange={e => setColumn(e.target.value as EvaluationScoreKey | 'all')}><option value="all">Tất cả tiêu chí</option>{evaluationScoreFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
          <button type="button" className={primaryClass} disabled={busy || loading || !selectedRows.length} onClick={applyBulk}>Áp dụng điểm</button>
          <span className="pb-2 text-xs text-slate-500">Áp dụng cho {selectedRows.length} sinh viên đã chọn, kể cả ở trang khác.</span>
          <button type="button" className="pb-2 text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50" disabled={busy || loading || !filtered.some(row => !row.locked)} onClick={() => setSelected(new Set(filtered.filter(row => !row.locked).map(row => row.id)))}>Chọn tất cả kết quả lọc</button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">Gợi ý chuyên ngành = số task hoàn thành / tổng task × 10. Bạn có thể điều chỉnh điểm hoặc áp dụng điểm hàng loạt. Gợi ý chưa phải điểm chính thức.</p>
      </div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 size={22} className="animate-spin text-orange-500" />Đang tải sinh viên và tiến độ task…</div>
        : !rows.length ? <div className="space-y-3 p-12 text-center text-sm text-slate-500"><ClipboardCheck className="mx-auto text-slate-300" size={32} /><p>{error ? 'Không thể tải danh sách đánh giá.' : 'Chưa có sinh viên trong danh sách thực tập.'}</p>{error && <button type="button" className={secondaryClass} onClick={() => void fetchRows()}>Thử lại</button>}</div>
        : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr>
                <th className="w-12 px-4 py-4"><input ref={selectAllRef} type="checkbox" aria-label="Chọn sinh viên có thể chấm trên trang này" className="h-4 w-4 accent-orange-500" checked={checked} disabled={busy || !editableVisible.length} onChange={() => setSelected(current => { const next = new Set(current); for (const row of editableVisible) { if (checked) next.delete(row.id); else next.add(row.id); } return next; })} /></th>
                <th className="min-w-56 px-3 py-4">Sinh viên</th>
                <th className="w-32 px-3 py-4">Task</th>
                {evaluationScoreFields.map(field => <th key={field.key} className="w-36 px-3 py-4 text-center">{field.label}</th>)}
                <th className="w-32 px-3 py-4 text-center">Điểm trung bình</th><th className="w-36 px-4 py-4">Trạng thái</th>
                <th className="w-36 px-4 py-4 text-right">Thao tác</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{!visible.length ? <tr><td colSpan={9} className="py-14 text-center text-slate-500">Không có sinh viên phù hợp với bộ lọc.</td></tr> : visible.map(row => {
                const completed = row.tasks.filter(task => task.enterpriseStatus === 'DONE').length;
                const average = row.status === 'SUBMITTED' ? row.submittedAverage : evaluationAverage(row);
                return <tr key={row.id} className={selected.has(row.id) ? 'bg-orange-50/40' : 'hover:bg-slate-50/50'}>
                  <td className="px-4 py-5 align-top"><input type="checkbox" aria-label={`Chọn ${row.fullName} (${row.studentCode})`} className="mt-1 h-4 w-4 accent-orange-500" checked={selected.has(row.id)} disabled={busy || row.locked} onChange={() => toggle(row.id)} /></td>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-900">{row.fullName}</p><p className="mt-0.5 text-xs text-slate-500">{row.studentCode}</p><p className="mt-1 text-xs text-slate-500">{row.position || 'Chưa có vị trí'}</p></td>
                  <td className="px-3 py-4">
                    <p className="text-sm font-semibold tabular-nums text-slate-700">{taskError ? '—' : `${completed}/${row.tasks.length}`}</p>
                    {!taskError && row.tasks.length > 0 && <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Tiến độ task của ${row.fullName}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(completed / row.tasks.length * 100)}><div className={'h-full rounded-full ' + (completed / row.tasks.length >= 0.8 ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${completed / row.tasks.length * 100}%` }} /></div>}
                    <button type="button" disabled={busy} onClick={() => setDetailId(row.id)} aria-label={`Chi tiết task của ${row.fullName}`} className="mt-2 text-xs text-emerald-700 hover:underline">Chi tiết</button>
                  </td>
                  {evaluationScoreFields.map(field => <td key={field.key} className="px-3 py-4 text-center align-middle">
                    <div className="flex min-h-[2.875rem] flex-col items-center justify-center">
                      <span aria-label={`${field.label} của ${row.fullName} (${row.studentCode})`} className="text-base font-semibold tabular-nums text-slate-800">{row[field.key] || '—'}</span>
                      {field.key === 'completionScore' && row.suggestion !== null
                        ? <p className="mt-1 h-4 whitespace-nowrap text-[11px] leading-4 text-slate-500">{row.fromTask ? 'Gợi ý từ task' : 'Gợi ý task'}: {row.suggestion.toFixed(2)}</p>
                        : field.key === 'completionScore' && !taskError && !row.tasks.length
                          ? <p className="mt-1 h-4 whitespace-nowrap text-[11px] leading-4 text-slate-400">Chưa có task để gợi ý</p>
                          : <span aria-hidden="true" className="mt-1 h-4" />}
                    </div>
                  </td>)}
                  <td className="px-3 py-4 text-center align-middle">
                    <div className="flex min-h-[2.875rem] flex-col items-center justify-center">
                      <output aria-label={`Điểm trung bình của ${row.fullName}`} className="text-base font-bold tabular-nums text-orange-600">{average === null ? '—' : average.toFixed(2)}</output>
                      <span aria-hidden="true" className="mt-1 h-4" />
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ' + (row.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : row.dirty ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600')}>{row.status === 'SUBMITTED' ? 'Đã gửi QHDN' : row.dirty ? 'Chưa lưu thay đổi' : row.status === 'DRAFT' ? 'Bản nháp' : 'Chưa lưu'}</span>{average === null && !row.locked && <p className="mt-2 text-xs text-rose-600">Thiếu điểm</p>}</td>
                  <td className="px-4 py-4 text-right"><button type="button" className={secondaryClass + ' whitespace-nowrap !px-3 !py-2 !text-xs'} disabled={busy || row.locked} aria-label={`Chỉnh sửa điểm của ${row.fullName} (${row.studentCode})`} onClick={() => openEditor(row)}>{!row.locked && <Pencil size={14} />}{row.locked ? 'Đã khóa' : 'Chỉnh sửa'}</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
            <span>{filtered.length ? `${(page - 1) * limit + 1}–${Math.min(page * limit, filtered.length)}` : '0'} / {filtered.length} sinh viên</span>
            <div className="flex items-center gap-3"><button type="button" aria-label="Trang trước" className="rounded-lg border p-2 disabled:opacity-40" disabled={busy || page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button><span>Trang {page} / {totalPages}</span><button type="button" aria-label="Trang sau" className="rounded-lg border p-2 disabled:opacity-40" disabled={busy || page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div>
          </div>
        </>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div><p className="text-sm font-semibold text-slate-800">{selectedRows.length} sinh viên được chọn <button type="button" className="ml-2 text-xs font-normal text-orange-600 hover:underline disabled:opacity-50" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Bỏ chọn</button></p><p className="mt-1 text-xs text-slate-500">Bản nháp có thể chỉnh sửa. Điểm đã gửi QHDN sẽ được khóa.</p></div>
        <div className="flex gap-3"><button type="button" className={secondaryClass} disabled={busy || loading || !selectedRows.length} onClick={() => void save('DRAFT')}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Lưu nháp</button><button type="button" className={primaryClass} disabled={busy || loading || !selectedRows.length} onClick={() => { if (validate(true)) setConfirming(true); }}><Send size={16} />Lưu chính thức</button></div>
      </div>
    </section>
    {editor && editingRow && <StudentDialog title={`Chỉnh sửa điểm · ${editingRow.fullName}`} busy={busy} onClose={() => setEditor(null)}>
      <form onSubmit={event => { event.preventDefault(); updateScores(); }} className="space-y-5">
        <p className="text-sm text-slate-500">{editingRow.studentCode} · {editingRow.position || 'Chưa có vị trí'} · Thang điểm 0–10</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {evaluationScoreFields.map(field => <label key={field.key} className="text-sm font-semibold text-slate-700">
            {field.label}
            <input type="number" min={0} max={10} step="0.01" inputMode="decimal" placeholder="Chưa có điểm" className={inputClass + ' mt-2 w-full font-normal tabular-nums'} value={editor[field.key]} disabled={busy} onChange={event => { setEditor({ ...editor, [field.key]: event.target.value }); setEditorError(''); }} />
            {field.key === 'completionScore' && editingRow.suggestion !== null && <span className="mt-2 block text-xs font-normal text-slate-500">Gợi ý từ task: {editingRow.suggestion.toFixed(2)}. Có thể điều chỉnh.</span>}
          </label>)}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3"><span className="text-sm font-medium text-slate-700">Điểm trung bình</span><output aria-label="Điểm trung bình sau chỉnh sửa" className="text-xl font-bold tabular-nums text-orange-600">{evaluationAverage(editor)?.toFixed(2) ?? '—'}</output></div>
        <label className="block text-sm font-semibold text-slate-700">Nhận xét (không bắt buộc)<textarea className={inputClass + ' mt-2 w-full font-normal'} rows={3} maxLength={5000} disabled={busy} value={editor.comments} onChange={event => setEditor({ ...editor, comments: event.target.value })} placeholder="Ưu điểm và những điểm sinh viên cần cải thiện…" /></label>
        {editorError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{editorError}</p>}
        <p className="text-xs leading-relaxed text-slate-500">Thay đổi được cập nhật vào bảng. Bấm Lưu nháp hoặc Lưu chính thức ở cuối bảng để lưu đánh giá.</p>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" className={secondaryClass} disabled={busy} onClick={() => setEditor(null)}>Hủy</button><button type="submit" className={primaryClass} disabled={busy}>Cập nhật vào bảng</button></div>
      </form>
    </StudentDialog>}
    {confirming && <StudentDialog title="Xác nhận gửi điểm chính thức" busy={busy} onClose={() => setConfirming(false)}>
      <p className="text-sm leading-6 text-slate-600">Bạn sắp gửi điểm của <strong className="text-slate-900">{selectedRows.length} sinh viên</strong> đến Phòng Quan hệ doanh nghiệp. Điểm sẽ được cập nhật ngay và không thể chỉnh sửa trực tiếp sau khi gửi.</p>
      <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Sinh viên</th>{evaluationScoreFields.map(field => <th className="p-3" key={field.key}>{field.label}</th>)}<th className="p-3">TB</th></tr></thead><tbody>{selectedRows.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-3">{row.fullName}<p className="text-xs text-slate-400">{row.studentCode}</p></td>{evaluationScoreFields.map(field => <td className="p-3 tabular-nums" key={field.key}>{row[field.key]}</td>)}<td className="p-3 font-bold text-orange-600">{evaluationAverage(row)?.toFixed(2)}</td></tr>)}</tbody></table></div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} className={secondaryClass} onClick={() => setConfirming(false)}>Quay lại chỉnh sửa</button><button type="button" disabled={busy} className={primaryClass} onClick={() => void save('SUBMITTED')}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{busy ? 'Đang gửi…' : 'Xác nhận'}</button></div>
    </StudentDialog>}
    {detail && <StudentDialog title={`Chi tiết task · ${detail.fullName}`} busy={busy} onClose={() => setDetailId(null)}>
      <p className="mb-4 text-sm text-slate-500">{detail.studentCode} · {detail.position}</p>
      {taskError ? <p className="text-sm text-amber-700">{taskError}</p> : !detail.tasks.length ? <p className="text-sm text-slate-500">Sinh viên chưa có task được giao.</p> : <ul className="max-h-64 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200 px-4">{detail.tasks.map(task => <li key={task.id} className="flex items-start justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-slate-800">{task.name}</p>{task.description && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{task.description}</p>}</div><span className="shrink-0 text-xs text-emerald-700">{task.enterpriseStatus === 'DONE' ? 'Đã xong' : task.enterpriseStatus === 'OVERDUE' ? 'Quá hạn' : 'Chưa làm'}</span></li>)}</ul>}
      <div className="mt-5"><h3 className="text-sm font-semibold text-slate-700">Nhận xét</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{detail.comments || 'Chưa có nhận xét.'}</p></div>
      <div className="mt-5 flex justify-end"><button type="button" className={secondaryClass} onClick={() => setDetailId(null)}>Đóng</button></div>
    </StudentDialog>}
  </div>;
}

export default EnterpriseEvaluation;
