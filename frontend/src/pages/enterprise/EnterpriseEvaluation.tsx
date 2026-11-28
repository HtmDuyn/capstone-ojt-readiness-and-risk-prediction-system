import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Eye, FilePenLine, Loader2, LockKeyhole, Pencil, Save, Search, Send } from 'lucide-react';
import { OjtCertificatePanel } from '@/components/common/OjtCertificateDialog';
import { PageBanner } from '@/components/common/PageBanner';
import { StudentDialog } from '@/components/student/StudentDialog';
import { InternshipEvaluationDetailsDialog } from '@/components/enterprise/InternshipEvaluationDetailsDialog';
import { enterpriseService, type EnterpriseInternshipItem, type EnterpriseInternshipTask } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { loadAllPages } from '@/utils/enterprise/recruitment';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { applyEvaluationScore, evaluationAverage, parseEvaluationScore, taskScoreSuggestion,
  type EvaluationScores } from '@/utils/enterprise/enterpriseEvaluation';

interface EvaluationRow extends EvaluationScores {
  id: number;
  internship: EnterpriseInternshipItem;
  fullName: string;
  studentCode: string;
  position: string;
  semester: string;
  roundId: number | null;
  roundName: string;
  roundStatus: 'ACTIVE' | 'CLOSED' | null;
  comments: string;
  status: 'NEW' | 'DRAFT' | 'SUBMITTED';
  locked: boolean;
  suggestion: number | null;
  submittedAverage: number | null;
  templateId: number | null;
  templateName: string;
  gradingChanged: boolean;
  tasks: EnterpriseInternshipTask[];
  criteria: Array<{key:string;label:string;weight:number}>;
  scoreDetails: Record<string,string>;
}

interface ScoreEditor {
  id: number;
  comments: string;
  scoreDetails: Record<string,string>;
}

function makeRow(item: EnterpriseInternshipItem, tasks: EnterpriseInternshipTask[], tasksAvailable: boolean): EvaluationRow {
  const ev = item.evaluation;
  const criteria = item.template?.criteria ?? [];
  const templateId = item.template?.id ?? null;
  const submitted = ev?.status === 'SUBMITTED';
  const matchingTemplate = templateId !== null && ev?.templateId === templateId;
  const completed = tasks.filter(task => task.enterpriseStatus === 'DONE').length;
  const suggestion = tasksAvailable ? taskScoreSuggestion(completed, tasks.length) : null;
  return {
    id: item.id, internship: item, fullName: item.student?.fullName || '', studentCode: item.student?.studentCode || '',
    position: item.position?.title || '',
    semester: item.semester?.name || item.semester?.code || tasks[0]?.semesterCode || 'Chưa cập nhật kỳ OJT',
    roundId: item.recruitmentRound?.id ?? null,
    roundName: item.recruitmentRound?.name || 'Chưa liên kết đợt OJT',
    roundStatus: item.recruitmentRound?.periodStatus ?? null,
    comments: ev?.comments || '', status: ev?.status === 'SUBMITTED' ? 'SUBMITTED' : ev ? 'DRAFT' : 'NEW',
    locked: item.evaluationLocked === true || submitted || !templateId || !criteria.length
      || !['ASSIGNED','ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status?.toUpperCase()),
    suggestion, submittedAverage: ev?.overallScore == null ? null : Number(ev.overallScore), tasks, criteria,
    templateId, templateName: item.template ? `${item.template.name} · Phiên bản ${item.template.version}` : '',
    gradingChanged: !!ev && !submitted && !matchingTemplate,
    scoreDetails: Object.fromEntries(criteria.map(c => [c.key, matchingTemplate ? String(ev?.scoreDetails?.[c.key] ?? '') : ''])),
  };
}

function errorText(error: unknown): string {
  return friendlyErrorMessage(error, 'Không thể hoàn thành đánh giá lúc này. Vui lòng thử lại.');
}

function evaluationState(row: EvaluationRow): 'saved' | 'submitted' | 'missing' {
  if (row.status === 'SUBMITTED') return 'submitted';
  return row.status === 'DRAFT' && evaluationAverage(row) !== null ? 'saved' : 'missing';
}

const inputClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400';
const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const iconActionClass = secondaryClass + ' !h-9 !w-9 shrink-0 !rounded-lg !p-0';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';

export function EnterpriseEvaluation() {
  const { loading: profileLoading, companyId, profile } = useEnterprise();
  const [rows, setRows] = useState<EvaluationRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [round, setRound] = useState('all');
  const [roundStatus, setRoundStatus] = useState<'all' | 'ACTIVE' | 'CLOSED'>('all');
  const [column, setColumn] = useState('');
  const [bulkScore, setBulkScore] = useState('8');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [evaluationDetailId, setEvaluationDetailId] = useState<number | null>(null);
  const [certificateBusy, setCertificateBusy] = useState(false);
  const [editor, setEditor] = useState<ScoreEditor | null>(null);
  const [editorError, setEditorError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const savingRef = useRef(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const limit = 20;

  const fetchRows = useCallback(async (background = false) => {
    if (profileLoading || savingRef.current || (background && requestRef.current)) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (!background) { setLoading(true); setError(''); }
    try {
      const [rosterResult, taskResult] = await Promise.allSettled([
        loadAllPages<EnterpriseInternshipItem>(
          page => enterpriseService.listInternships({ page, limit: 100 }, controller.signal), controller.signal, 'sinh viên thực tập'),
        companyId ? loadAllPages<EnterpriseInternshipTask>(
          page => enterpriseService.listInternshipTasks(companyId, { page, limit: 100 }, controller.signal), controller.signal, 'tiến độ task')
          : Promise.reject(new Error('Không tìm thấy doanh nghiệp để tải task.')),
      ] as const);
      if (controller.signal.aborted) return;
      if (rosterResult.status === 'rejected') throw rosterResult.reason;
      const byAssignment = new Map<number, EnterpriseInternshipTask[]>();
      if (taskResult.status === 'fulfilled') {
        setTaskError('');
        for (const task of taskResult.value) {
          const group = byAssignment.get(task.assignmentId);
          if (group) group.push(task);
          else byAssignment.set(task.assignmentId, [task]);
        }
      } else {
        setTaskError(`Không tải được tiến độ task. Bạn vẫn có thể nhập điểm thủ công. ${errorText(taskResult.reason)}`);
      }
      const roster = rosterResult.value.map(item => makeRow(item, byAssignment.get(item.id) || [], taskResult.status === 'fulfilled'));
      setRows(roster);
      if (!background) setSelected(new Set());
    } catch (e) { if (!controller.signal.aborted) setError(errorText(e)); }
    finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [companyId, profileLoading]);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) void fetchRows(); });
    return () => { mounted = false; requestRef.current?.abort(); };
  }, [fetchRows]);
  const filtered = useMemo(() => rows.filter(row => {
    const query = search.trim().toLocaleLowerCase('vi');
    return (!query || `${row.fullName} ${row.studentCode} ${row.position}`.toLocaleLowerCase('vi').includes(query))
      && (round === 'all' || (row.roundId === null ? 'unlinked' : String(row.roundId)) === round)
      && (roundStatus === 'all' || row.roundStatus === roundStatus)
      && (status === 'all' || evaluationState(row) === status);
  }), [rows, search, round, roundStatus, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const visible = filtered.slice((page - 1) * limit, page * limit);
  const editableVisible = visible.filter(row => !row.locked);
  const checked = editableVisible.length > 0 && editableVisible.every(row => selected.has(row.id));
  const selectedRows = filtered.filter(row => selected.has(row.id) && !row.locked);
  // Keep columns separate across issued templates, even when their keys are identical.
  const tableColumns = Array.from(new Map(filtered.flatMap(row => row.criteria.map(field => ({
    ...field, templateId: row.templateId, templateName: row.templateName, columnId: `${row.templateId}:${field.key}`,
  }))).map(field => [field.columnId, field])).values());
  const bulkColumns = selectedRows.length && selectedRows.every(row => row.templateId === selectedRows[0].templateId)
    ? selectedRows[0].criteria : [];
  const mixedTemplates = new Set(filtered.map(row => row.templateId).filter(id => id !== null)).size > 1;
  const detail = rows.find(row => row.id === detailId);
  const evaluationDetail = rows.find(row => row.id === evaluationDetailId);
  const editingRow = rows.find(row => row.id === editor?.id);
  const rounds = Array.from(new Map(rows.filter(row => roundStatus === 'all' || row.roundStatus === roundStatus)
    .map(row => [row.roundId === null ? 'unlinked' : String(row.roundId), row.roundName])).entries());
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, status, round, roundStatus]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { if (column && !bulkColumns.some(field => field.key === column)) setColumn(''); }, [column, bulkColumns]);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = !checked && editableVisible.some(row => selected.has(row.id));
  }, [checked, editableVisible, selected]);

  const openEditor = (row: EvaluationRow) => {
    if (busy || row.locked) return;
    setEditor({ id: row.id, comments: row.comments, scoreDetails:{...row.scoreDetails} });
    setEditorError('');
  };
  const toggle = (id: number) => setSelected(current => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const persistEvaluations = async (evaluations: EvaluationRow[], target: 'DRAFT' | 'SUBMITTED') => {
    if (savingRef.current) return false;
    if (!evaluations.length || evaluations.length > 300) throw new Error('Mỗi lần lưu cần chọn từ 1 đến 300 sinh viên.');
    if (evaluations.some(row => row.locked || !row.templateId || !row.criteria.length))
      throw new Error('Một số sinh viên chưa được mở chấm điểm. Vui lòng kiểm tra lại danh sách.');
    requestRef.current?.abort();
    savingRef.current = true; setBusy(true); setMessage(''); setError('');
    try {
      const response = await enterpriseService.saveBulkEvaluations(evaluations.map(row => ({
        assignmentId: row.id, templateId: row.templateId!,
        comments: row.comments.trim() || null, scoreDetails:Object.fromEntries(row.criteria.map(c=>[c.key,parseEvaluationScore(row.scoreDetails[c.key]??'')])),
      })), target, target === 'SUBMITTED');
      if (!response.success) throw new Error('Chưa thể lưu đánh giá. Vui lòng thử lại.');
      const saved = new Map(response.data.items.map(item => [item.assignmentId, item]));
      if (evaluations.some(row => !saved.has(row.id))) throw new Error('Chưa nhận đủ kết quả lưu đánh giá. Vui lòng tải lại danh sách để kiểm tra.');
      const requested = new Map(evaluations.map(row => [row.id, row]));
      setRows(current => current.map(row => {
        const ev = saved.get(row.id);
        const input = requested.get(row.id);
        if (!ev || !input) return row;
        const scoreDetails = ev.scoreDetails ?? Object.fromEntries(input.criteria.map(c => [c.key, parseEvaluationScore(input.scoreDetails[c.key] ?? '')]));
        const comments = ev.comments === undefined ? input.comments.trim() || null : ev.comments;
        return { ...row, status: target, locked: row.locked || target === 'SUBMITTED', comments: comments ?? '',
          internship: { ...row.internship, evaluationLocked: row.internship.evaluationLocked || target === 'SUBMITTED',
            evaluation: { ...row.internship.evaluation, ...ev, status: target, templateId: input.templateId,
              criteria: ev.criteria?.length ? ev.criteria : input.criteria, scoreDetails,
              overallScore: ev.overallScore ?? null, comments } },
          submittedAverage: ev.overallScore ?? null,
          gradingChanged: false, scoreDetails:Object.fromEntries(row.criteria.map(c=>[c.key,String(scoreDetails[c.key]??'')])) };
      }));
      setSelected(current => target === 'SUBMITTED'
        ? new Set([...current].filter(id => !saved.has(id)))
        : new Set([...current, ...saved.keys()]));
      return true;
    }
    finally { savingRef.current = false; setBusy(false); }
  };
  const saveEditor = async () => {
    if (!editor || !editingRow || editingRow.locked || certificateBusy || savingRef.current) return;
    if (editingRow.criteria.some(c => (editor.scoreDetails[c.key]??'').trim() !== '' && parseEvaluationScore(editor.scoreDetails[c.key]) === null)) {
      setEditorError('Điểm phải từ 0 đến 10, tối đa 2 chữ số thập phân.');
      return;
    }
    setEditorError('');
    try {
      if (!await persistEvaluations([{ ...editingRow, comments: editor.comments, scoreDetails: editor.scoreDetails }], 'DRAFT')) return;
      setMessage(`Đã lưu đánh giá của ${editingRow.fullName}. Bạn có thể tiếp tục chỉnh sửa trước khi xác nhận đánh giá.`);
      setEditor(null);
    } catch (e) { setEditorError(errorText(e)); }
  };
  const saveBulkScores = async () => {
    if (savingRef.current) return;
    if (!selectedRows.length) { setError('Vui lòng chọn sinh viên cần lưu điểm.'); return; }
    if (column && !bulkColumns.some(field => field.key === column)) { setError('Vui lòng chọn cột thuộc bộ tiêu chí đang áp dụng cho các sinh viên được chọn.'); return; }
    if (parseEvaluationScore(bulkScore) === null) { setError('Điểm phải từ 0 đến 10, tối đa 2 chữ số thập phân.'); return; }
    try {
      if (!await persistEvaluations(selectedRows.map(row => applyEvaluationScore(row, column || null, bulkScore)), 'DRAFT')) return;
      setMessage(`Đã lưu điểm cho ${selectedRows.length} sinh viên. Bạn có thể tiếp tục chỉnh sửa trước khi xác nhận đánh giá.`);
    } catch (e) { setError(errorText(e)); }
  };
  const validateSubmission = () => {
    if (!selectedRows.length || selectedRows.length > 300) { setError('Vui lòng chọn từ 1 đến 300 sinh viên để xác nhận đánh giá.'); return false; }
    const invalid = selectedRows.find(row => evaluationState(row) !== 'saved');
    if (invalid) { setError(`${invalid.fullName} (${invalid.studentCode}): vui lòng nhập và lưu đủ điểm cho tất cả tiêu chí trước khi xác nhận đánh giá.`); return false; }
    setError(''); return true;
  };
  const confirmEvaluations = async () => {
    if (savingRef.current) return;
    if (!validateSubmission()) { setConfirming(false); return; }
    setConfirmationError('');
    try {
      if (!await persistEvaluations(selectedRows, 'SUBMITTED')) return;
      setMessage(`Đã chốt điểm cho ${selectedRows.length} sinh viên và gửi kết quả đến Phòng QHDN.`);
      setConfirming(false);
    } catch (e) { setConfirmationError(errorText(e)); }
  };

  return <div className="space-y-5 pb-10">
    <PageBanner variant="enterprise" title="Đánh giá kết quả OJT" badge="Chấm điểm OJT"
      description="Chấm điểm, lưu và chỉnh sửa đánh giá; xác nhận khi hoàn tất để gửi kết quả đến Phòng QHDN." />
    {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />{message}</div>}
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18} />{error}</div>}
    {taskError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{taskError}</div>}
    {rows.some(row => !row.templateId && row.status !== 'SUBMITTED') && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Một số kỳ OJT chưa có quy ước chấm điểm do Phòng Đào tạo ban hành. Sinh viên thuộc các kỳ này sẽ được mở chấm điểm sau khi có bộ tiêu chí áp dụng.</div>}
    {rows.some(row => row.gradingChanged && !row.locked) && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Bộ tiêu chí áp dụng đã thay đổi so với đánh giá đã lưu. Vui lòng nhập lại điểm theo các cột và tỷ lệ mới trước khi lưu.</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-busy={loading || busy}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div><h2 className="text-lg font-bold text-slate-900">Đánh giá thực tập sinh</h2><p className="mt-1 text-sm text-slate-500">Điểm tổng = tổng (điểm từng tiêu chí × tỷ lệ %) / 100. Các cột và tỷ lệ do Phòng Đào tạo ban hành, chấm theo thang 0–10.</p></div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">Đã chốt điểm {rows.filter(row => row.status === 'SUBMITTED').length} / {rows.length} sinh viên</span>
      </div>
      <div className="space-y-4 border-b border-slate-100 bg-slate-50/60 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-52 flex-1 text-xs font-semibold text-slate-600">Tìm sinh viên<div className="relative mt-1.5"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className={inputClass + ' w-full pl-9'} placeholder="Họ tên, mã sinh viên, vị trí…" value={search} disabled={busy || loading} onChange={e => setSearch(e.target.value)} /></div></label>
          <label className="text-xs font-semibold text-slate-600">Trạng thái đợt<select aria-label="Lọc trạng thái đợt OJT" className={inputClass + ' mt-1.5 block max-w-full'} value={roundStatus} disabled={busy || loading} onChange={e => { const value = e.target.value; setRoundStatus(value === 'ACTIVE' || value === 'CLOSED' ? value : 'all'); setRound('all'); }}><option value="all">Tất cả trạng thái đợt</option><option value="ACTIVE">Đang diễn ra</option><option value="CLOSED">Đã đóng</option></select></label>
          <label className="min-w-0 max-w-full text-xs font-semibold text-slate-600">Đợt OJT<select aria-label="Lọc đợt OJT" className={inputClass + ' mt-1.5 block max-w-full'} value={round} disabled={busy || loading} onChange={e => setRound(e.target.value)}><option value="all">Tất cả đợt OJT</option>{rounds.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Trạng thái điểm<select aria-label="Lọc trạng thái điểm" className={inputClass + ' mt-1.5 block max-w-full'} value={status} disabled={busy || loading} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái điểm</option><option value="saved">Đã lưu</option><option value="submitted">Đã chốt điểm</option><option value="missing">Thiếu điểm</option></select></label>
        </div>
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-xs font-semibold text-slate-600">Nhập điểm<input type="number" min={0} max={10} step="0.01" inputMode="decimal" placeholder="0–10" className={inputClass + ' mt-1.5 block w-32'} value={bulkScore} disabled={busy || loading} aria-invalid={bulkScore !== '' && parseEvaluationScore(bulkScore) === null} onChange={e => setBulkScore(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">Chọn cột điểm<select className={inputClass + ' mt-1.5 block'} value={column} disabled={busy || loading || !selectedRows.length} onChange={e => setColumn(e.target.value)}><option value="">Tất cả tiêu chí</option>{bulkColumns.map(field => <option key={field.key} value={field.key}>{field.label} ({field.weight}%)</option>)}</select></label>
          <button type="button" className={primaryClass} disabled={busy || loading || !selectedRows.length} onClick={() => void saveBulkScores()}><Save size={16} />Lưu điểm</button>
          <button type="button" className="pb-2 text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50" disabled={busy || loading || !filtered.some(row => !row.locked)} onClick={() => setSelected(new Set(filtered.filter(row => !row.locked).map(row => row.id)))}>Chọn tất cả kết quả lọc</button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">Nhập điểm cho đúng các tiêu chí được ban hành. Khi chọn sinh viên thuộc nhiều bộ tiêu chí, áp dụng hàng loạt sẽ điền điểm vào tất cả tiêu chí của từng sinh viên.</p>
      </div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 size={22} className="animate-spin text-orange-500" />Đang tải sinh viên và tiến độ task…</div>
        : !rows.length ? <div className="space-y-3 p-12 text-center text-sm text-slate-500"><ClipboardCheck className="mx-auto text-slate-300" size={32} /><p>{error ? 'Không thể tải danh sách đánh giá.' : 'Chưa có sinh viên trong danh sách thực tập.'}</p>{error && <button type="button" className={secondaryClass} onClick={() => void fetchRows()}>Thử lại</button>}</div>
        : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr>
                <th className="w-12 px-4 py-4"><input ref={selectAllRef} type="checkbox" aria-label="Chọn sinh viên có thể chấm trên trang này" className="h-4 w-4 accent-orange-500" checked={checked} disabled={busy || !editableVisible.length} onChange={() => setSelected(current => { const next = new Set(current); for (const row of editableVisible) { if (checked) next.delete(row.id); else next.add(row.id); } return next; })} /></th>
                <th scope="col" className="w-14 px-3 py-4 text-center">STT</th>
                <th className="min-w-56 px-3 py-4">Sinh viên</th>
                <th className="w-32 px-3 py-4">Task</th>
                {tableColumns.map(field => <th key={field.columnId} className="w-36 px-3 py-4 text-center">{field.label}<span className="block font-normal">{field.weight}%</span>{mixedTemplates && <span className="mt-1 block font-normal text-slate-400">{field.templateName}</span>}</th>)}
                <th className="w-32 px-3 py-4 text-center">Điểm tổng</th><th className="w-36 px-4 py-4">Trạng thái</th>
                <th className="w-32 px-4 py-4 text-right">Thao tác</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{!visible.length ? <tr><td colSpan={tableColumns.length + 7} className="py-14 text-center text-slate-500">Không có sinh viên phù hợp với bộ lọc.</td></tr> : visible.map((row, index) => {
                const completed = row.tasks.filter(task => task.enterpriseStatus === 'DONE').length;
                const average = row.status === 'SUBMITTED' ? row.submittedAverage : evaluationAverage(row);
                const state = evaluationState(row);
                const hasScores = row.criteria.some(field => (row.scoreDetails[field.key] ?? '').trim() !== '');
                const scoreAction = row.locked ? 'Đã khóa chấm điểm' : hasScores ? 'Chỉnh sửa điểm' : 'Chấm điểm';
                return <tr key={row.id} className={selected.has(row.id) ? 'bg-orange-50/40' : 'hover:bg-slate-50/50'}>
                  <td className="px-4 py-5 align-top"><input type="checkbox" aria-label={`Chọn ${row.fullName} (${row.studentCode})`} className="mt-1 h-4 w-4 accent-orange-500" checked={selected.has(row.id)} disabled={busy || row.locked} onChange={() => toggle(row.id)} /></td>
                  <td className="px-3 py-4 text-center tabular-nums text-slate-500">{(page - 1) * limit + index + 1}</td>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-900">{row.fullName}</p><p className="mt-0.5 text-xs text-slate-500">{row.studentCode} · {row.roundName}</p><p className="mt-1 text-xs text-slate-500">{row.position || 'Chưa có vị trí'}</p></td>
                  <td className="px-3 py-4">
                    <p className="text-sm font-semibold tabular-nums text-slate-700">{taskError ? '—' : `${completed}/${row.tasks.length}`}</p>
                    {!taskError && row.tasks.length > 0 && <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Tiến độ task của ${row.fullName}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(completed / row.tasks.length * 100)}><div className={'h-full rounded-full ' + (completed / row.tasks.length >= 0.8 ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${completed / row.tasks.length * 100}%` }} /></div>}
                    <button type="button" disabled={busy} onClick={() => setDetailId(row.id)} aria-label={`Chi tiết task của ${row.fullName}`} className="mt-2 text-xs text-emerald-700 hover:underline">Chi tiết</button>
                  </td>
                  {tableColumns.map(field => <td key={field.columnId} className="px-3 py-4 text-center align-middle">
                    <div className="flex min-h-[2.875rem] flex-col items-center justify-center">
                      <span aria-label={`${field.label} của ${row.fullName} (${row.studentCode})`} className="text-base font-semibold tabular-nums text-slate-800">{row.templateId === field.templateId ? row.scoreDetails[field.key] || '—' : '—'}</span>
                      {row.templateId === field.templateId && field.key === 'completionScore' && row.suggestion !== null
                        ? <p className="mt-1 h-4 whitespace-nowrap text-[11px] leading-4 text-slate-500">Gợi ý task: {row.suggestion.toFixed(2)}</p>
                        : row.templateId === field.templateId && field.key === 'completionScore' && !taskError && !row.tasks.length
                          ? <p className="mt-1 h-4 whitespace-nowrap text-[11px] leading-4 text-slate-400">Chưa có task để gợi ý</p>
                          : <span aria-hidden="true" className="mt-1 h-4" />}
                    </div>
                  </td>)}
                  <td className="px-3 py-4 text-center align-middle">
                    <div className="flex min-h-[2.875rem] flex-col items-center justify-center">
                      <output aria-label={`Điểm tổng của ${row.fullName}`} className="text-base font-bold tabular-nums text-orange-600">{average === null ? '—' : average.toFixed(2)}</output>
                      <span aria-hidden="true" className="mt-1 h-4" />
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ' + (state === 'submitted' ? 'bg-emerald-50 text-emerald-700' : state === 'saved' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-600')}>{state === 'submitted' ? 'Đã chốt điểm' : state === 'saved' ? 'Đã lưu' : 'Thiếu điểm'}</span>{!row.templateId && row.status !== 'SUBMITTED' ? <p className="mt-2 text-xs text-amber-700">Chờ Đào tạo ban hành tiêu chí</p> : row.gradingChanged && !row.locked && <p className="mt-2 text-xs text-amber-700">Cần chấm lại theo quy ước mới</p>}</td>
                  <td className="px-4 py-4 text-right"><div className="flex items-center justify-end gap-2">
                    <button type="button" className={iconActionClass} disabled={busy} title="Xem thông tin sinh viên và đánh giá doanh nghiệp" aria-label={`Xem thông tin sinh viên và đánh giá của ${row.fullName} (${row.studentCode})`} onClick={() => setEvaluationDetailId(row.id)}><Eye size={16} aria-hidden="true" /></button>
                    <button type="button" className={iconActionClass} disabled={busy || row.locked} title={scoreAction} aria-label={`${scoreAction} của ${row.fullName} (${row.studentCode})`} onClick={() => openEditor(row)}>{row.locked ? <LockKeyhole size={16} aria-hidden="true" /> : hasScores ? <Pencil size={16} aria-hidden="true" /> : <FilePenLine size={16} aria-hidden="true" />}</button>
                  </div></td>
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
        <div><p className="text-sm font-semibold text-slate-800">{selectedRows.length} sinh viên được chọn <button type="button" className="ml-2 text-xs font-normal text-orange-600 hover:underline disabled:opacity-50" disabled={busy || !selected.size} onClick={() => setSelected(new Set())}>Bỏ chọn</button></p><p className="mt-1 text-xs text-slate-500">Điểm đã lưu có thể chỉnh sửa. Xác nhận đánh giá sẽ gửi điểm đến QHDN và khóa chỉnh sửa.</p></div>
        <button type="button" className={primaryClass} disabled={busy || loading || !selectedRows.length} onClick={() => { if (validateSubmission()) { setConfirmationError(''); setConfirming(true); } }}><Send size={16} />Xác nhận đánh giá</button>
      </div>
    </section>
    {evaluationDetail && <InternshipEvaluationDetailsDialog internship={evaluationDetail.internship} semesterLabel={evaluationDetail.semester} companyName={profile?.name} onClose={() => setEvaluationDetailId(null)} />}
    {editor && editingRow && <StudentDialog wide title={`${editingRow.criteria.some(field => (editingRow.scoreDetails[field.key] ?? '').trim() !== '') ? 'Chỉnh sửa điểm' : 'Chấm điểm'} · ${editingRow.fullName}`} busy={busy||certificateBusy} onClose={() => setEditor(null)}>
      <form onSubmit={event => { event.preventDefault(); void saveEditor(); }} className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
          <span><strong className="font-semibold text-slate-800">MSSV:</strong> {editingRow.studentCode}</span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <span>{editingRow.position || 'Chưa có vị trí'}</span>
          <span className="ml-auto font-medium text-slate-500">Thang điểm 0–10</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{editingRow.templateName}</p>
          <p className="text-xs text-slate-500">Nhập điểm theo từng tiêu chí</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {editingRow.criteria.map(field => <label key={field.key} className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
            <span className="flex min-h-10 items-start justify-between gap-2">
              <span className="leading-5">{field.label}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{field.weight}%</span>
            </span>
            <input type="number" min={0} max={10} step="0.01" inputMode="decimal" placeholder="Chưa có điểm" aria-label={`${field.label} (${field.weight}%)`} className={inputClass + ' mt-2 h-11 w-full text-base font-semibold tabular-nums'} value={editor.scoreDetails[field.key]??''} disabled={busy} onChange={event => setEditor({...editor,scoreDetails:{...editor.scoreDetails,[field.key]:event.target.value}})} />
            {field.key === 'completionScore' && editingRow.suggestion !== null && <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Gợi ý từ task: {editingRow.suggestion.toFixed(2)} · Có thể điều chỉnh</span>}
          </label>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-100 bg-orange-50/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Điểm tổng có trọng số</p>
            <p className="mt-0.5 text-xs text-slate-500">Tự động tính theo tiêu chí đã nhập</p>
          </div>
          <output aria-label="Điểm tổng sau chỉnh sửa" className="text-2xl font-bold tabular-nums text-orange-600">{evaluationAverage({ criteria: editingRow.criteria, scoreDetails: editor.scoreDetails })?.toFixed(2) ?? '—'}<span className="ml-1 text-xs font-medium text-slate-500">/ 10</span></output>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Nhận xét <span className="font-normal text-slate-500">(không bắt buộc)</span>
          <textarea className={inputClass + ' mt-1.5 w-full font-normal'} rows={3} maxLength={5000} disabled={busy} value={editor.comments} onChange={event => setEditor({ ...editor, comments: event.target.value })} placeholder="Ưu điểm và những điểm sinh viên cần cải thiện…" />
        </label>
        <div className="border-t border-slate-100 pt-3"><OjtCertificatePanel key={editingRow.id} assignmentId={editingRow.id} disabled={busy} compact onBusyChange={setCertificateBusy}/></div>
        {editorError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{editorError}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="max-w-2xl text-xs leading-relaxed text-slate-500">Bạn vẫn có thể chỉnh sửa trước khi xác nhận gửi đến QHDN. Tiêu chí chưa nhập điểm sẽ được ghi nhận là thiếu điểm.</p>
          <div className="flex shrink-0 justify-end gap-2">
            <button type="button" className={secondaryClass} disabled={busy||certificateBusy} onClick={() => setEditor(null)}>Hủy</button>
            <button type="submit" className={primaryClass} disabled={busy||certificateBusy}>{busy ? <><Loader2 size={16} className="animate-spin" />Đang lưu…</> : 'Lưu điểm'}</button>
          </div>
        </div>
      </form>
    </StudentDialog>}
    {confirming && <StudentDialog title="Xác nhận đánh giá" busy={busy} onClose={() => setConfirming(false)}>
      <p className="text-sm leading-6 text-slate-600">Bạn sắp gửi đánh giá của <strong className="text-slate-900">{selectedRows.length} sinh viên</strong> đến Phòng QHDN. Sau khi gửi, điểm sẽ được khóa chỉnh sửa. Sinh viên chỉ xem được điểm và nhận thông báo khi Phòng QHDN công bố kết quả.</p>
      <ol aria-label="Danh sách sinh viên gửi đánh giá" className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto border-y border-slate-100 pr-2">
        {selectedRows.map((row, index) => <li key={row.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-3 py-3.5">
          <span className="pt-0.5 text-xs font-medium tabular-nums text-slate-400">{index + 1}</span>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-slate-800">{row.fullName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{row.studentCode}</p>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed text-slate-500">{row.criteria.map(field => <div key={field.key} className="flex flex-wrap gap-x-1"><dt>{field.label} ({field.weight}%):</dt><dd className="font-medium tabular-nums text-slate-700">{row.scoreDetails[field.key]}</dd></div>)}</dl>
          </div>
          <div className="text-right"><p className="text-[10px] text-slate-400">Điểm tổng</p><p className="mt-1 text-base font-bold tabular-nums text-orange-600">{evaluationAverage(row)?.toFixed(2) ?? '—'}</p></div>
        </li>)}
      </ol>
      {confirmationError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{confirmationError}</p>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} className={secondaryClass} onClick={() => setConfirming(false)}>Quay lại chỉnh sửa</button><button type="button" disabled={busy} className={primaryClass} onClick={() => void confirmEvaluations()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{busy ? 'Đang gửi…' : 'Xác nhận gửi QHDN'}</button></div>
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
