import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, UserPlus, CheckCheck, Eye } from 'lucide-react';
import API from '@/services/api';
import { PageBanner } from '@/components/common/PageBanner';
import { useQhdnAcademicPeriods } from '@/hooks/useQhdnAcademicPeriods';
import { AcademicPeriodFilter, WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { Field, Notice, errorMessage } from '@/components/qhdn/QhdnUi';
import { StudentProfileModal } from '@/components/qhdn/StudentProfileModal';
import { placementStatus, placementStatuses, placementStatusLabels, placementStatusColors, type PlacementStatus } from '@/utils/qhdnPlacement';
import { canSelectForCoordination, coordinateBatch } from '@/utils/qhdnCoordination';

type Student = {
  id: number;
  studentCode: string;
  fullName: string;
  coordinationId?: number;
  registrationId?: number;
  registrationStatus?: string;
  decision?: string;
  source?: string;
  companyName?: string;
  positionTitle?: string;
  receivedAt?: string;
  hasAssignment: boolean;
  needsFollowUp?: boolean;
  rejectReason?: string;
  canCoordinate?: boolean;
  coordinationBlockedReason?: string | null;
};
type Position = { id: number; title: string; companyName: string; capacity: number | null; actualCount: number };
type Board = { canCoordinate: boolean; context: { roundCount: number; unfinished: number }; positions: Position[]; items: Student[] };
const cell = 'px-4 py-4 align-middle';
const filterInput = workflowInput + ' h-11 min-w-0 truncate';
const compactAction = 'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export default function QhdnOjtCoordination() {
  const [url] = useSearchParams(), semester = useQhdnAcademicPeriods(url.get('semester') || '', false, true);
  const [data, setData] = useState<Board | null>(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState<PlacementStatus | 'ALL'>('ALL'), [busy, setBusy] = useState(false);
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [task, setTask] = useState<{ students: Student[]; kind: 'coordinate' } | { student: Student; kind: 'receive' } | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [completed, setCompleted] = useState(0);

  useEffect(() => { setSelectedIds(new Set()); }, [semester.semesterId, search, filter, followUpOnly]);
  useEffect(() => {
    setSelectedIds(previous => new Set([...previous].filter(id => data?.items.some(student => student.id === id && canSelectForCoordination(student)))));
  }, [data]);

  useEffect(() => {
    setData(null);
    setDetail(null);
    setTask(null);
    setLoading(!!semester.semesterId);
  }, [semester.semesterId]);
  useEffect(() => {
    setError('');
    if (!semester.semesterId) { setLoading(false); return; }
    let active = true;
    if (!data) setLoading(true);
    API.get('/qhdn/placements', { params: { ojtSemesterId: semester.semesterId } })
      .then(r => { if (active) setData(r.data.data); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [semester.semesterId, revision]);

  useEffect(() => {
    const refreshIfIdle = () => { if (semester.semesterId && !busy && !task && !detail && document.visibilityState === 'visible') setRevision(v => v + 1); };
    const timer = window.setInterval(refreshIfIdle, 15000);
    window.addEventListener('focus', refreshIfIdle);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshIfIdle); };
  }, [semester.semesterId, busy, task, detail]);

  const refresh = () => setRevision(v => v + 1);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    setBatchErrors([]);
    setCompleted(0);
    const form = new FormData(e.currentTarget);
    try {
      if (task.kind === 'coordinate') {
        const result = await coordinateBatch(task.students, student => API.post('/qhdn/placements', {
          studentId: student.id, ojtSemesterId: Number(semester.semesterId),
          positionId: Number(form.get('positionId')), source: form.get('source'), reason: form.get('reason'),
        }), setCompleted);
        setSelectedIds(previous => new Set([...previous].filter(id => !result.succeeded.some(student => student.id === id))));
        setMessage(`Đã điều phối ${result.succeeded.length}/${task.students.length} sinh viên đến doanh nghiệp. Hồ sơ đã gửi đang chờ doanh nghiệp phản hồi.`);
        refresh();
        if (result.failed.length) {
          setBatchErrors(result.failed.map(({ student, error }) => `${student.fullName} (${student.studentCode}): ${errorMessage(error)}`));
          setTask({ kind: 'coordinate', students: result.failed.map(item => item.student) });
          return;
        }
      } else {
        await API.post(`/qhdn/placements/${task.student.coordinationId}/receive`, { reason: form.get('reason') });
        setMessage('Đã ghi nhận sinh viên thực nhận. Chỉ tiêu đăng tuyển được giữ nguyên.');
        refresh();
      }
      setTask(null);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const students = (data?.items ?? []).filter(s => (!followUpOnly || s.needsFollowUp) &&
    (filter === 'ALL' || placementStatus(s) === filter) &&
    `${s.studentCode} ${s.fullName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selectable = students.filter(canSelectForCoordination);
  const selected = selectable.filter(student => selectedIds.has(student.id));
  const allSelected = selectable.length > 0 && selected.length === selectable.length;
  const openCoordination = (students: Student[]) => {
    setError(''); setBatchErrors([]); setCompleted(0);
    setTask({ kind: 'coordinate', students });
  };

  return <div className="space-y-5 pb-10">
    <PageBanner title="Điều phối sinh viên và quản lý thực nhận" description="Sinh viên bị doanh nghiệp từ chối có thể được điều phối ngay trong đợt tuyển dụng, hoặc xử lý cùng tổng hợp cuối đợt." badge="Phòng QHDN" />
    {(error || semester.error) && <Notice>{error || semester.error}</Notice>}
    {message && <Notice>{message}</Notice>}
    {data && data.context.unfinished > 0 && <Notice>Đợt tuyển dụng đang diễn ra. QHDN có thể điều phối ngay các sinh viên đã bị doanh nghiệp từ chối. Mốc kết thúc và chốt tổng hợp dùng để thống kê toàn bộ sinh viên chưa được nhận, không chặn xử lý sớm hồ sơ bị từ chối.</Notice>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {placementStatuses.map(status => <button key={status} disabled={busy} aria-pressed={filter === status}
        className={'rounded-2xl border p-4 text-left transition ' + (filter === status ? placementStatusColors[status] : 'border-slate-200 bg-white hover:border-slate-300')}
        onClick={() => setFilter(filter === status ? 'ALL' : status)}>
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span className={'h-2.5 w-2.5 shrink-0 rounded-full border ' + placementStatusColors[status]} />
          {placementStatusLabels[status]}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-800">{data?.items.filter(s => placementStatus(s) === status).length ?? 0}</p>
      </button>)}
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.75fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <Field label="Tìm sinh viên">
            <input className={filterInput} placeholder="Tìm mã hoặc tên sinh viên…" aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} />
          </Field>
        </div>
        <AcademicPeriodFilter selection={semester} layout="grid" controlClassName={filterInput} />
        <Field label="Trạng thái">
          <select className={filterInput} aria-label="Lọc trạng thái" value={filter} onChange={e => setFilter(e.target.value as PlacementStatus | 'ALL')}>
            <option value="ALL">Tất cả trạng thái</option>
            {placementStatuses.map(status => <option key={status} value={status}>{placementStatusLabels[status]}</option>)}
          </select>
        </Field>
        <button className={workflowSecondary + ' h-11 whitespace-nowrap sm:justify-self-end'} disabled={loading || busy} onClick={refresh}><RefreshCw size={16} />Tải lại</button>
      </fieldset>
      <label className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm text-slate-600"><input type="checkbox" disabled={busy} checked={followUpOnly} onChange={e => setFollowUpOnly(e.target.checked)} />Chỉ hồ sơ doanh nghiệp quá hạn phản hồi ({data?.items.filter(s => s.needsFollowUp).length ?? 0})</label>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-orange-50/50 px-5 py-3">
        <p className="text-sm text-slate-600" aria-live="polite">Đã chọn <strong className="text-orange-700">{selected.length}</strong> sinh viên <span className="text-slate-500">· {selectable.length} hồ sơ có thể điều phối trong danh sách</span></p>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && <button type="button" className={workflowSecondary} disabled={busy} onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>}
          <button type="button" className={workflowPrimary} disabled={!selected.length || busy || loading} onClick={() => openCoordination(selected)}><UserPlus size={16} />Điều phối hàng loạt{selected.length > 0 && ` (${selected.length})`}</button>
        </div>
      </div>
      {loading ? <p className="p-8 text-center text-slate-500">Đang tải danh sách…</p> : !students.length ?
        <p className="p-8 text-center text-slate-500">Không có sinh viên phù hợp trong danh sách bàn giao.</p> :
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
            <colgroup><col className="w-12" /><col className="w-16" /><col className="w-[26%]" /><col /><col className="w-[220px]" /><col className="w-[192px]" /></colgroup>
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>
              <th scope="col" className="px-4 py-4 text-center"><input type="checkbox" className="size-4 accent-orange-600" aria-label="Chọn tất cả sinh viên có thể điều phối trong danh sách" disabled={!selectable.length || busy} checked={allSelected}
                ref={element => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }}
                onChange={e => setSelectedIds(new Set(e.target.checked ? selectable.map(student => student.id) : []))} /></th>
              {['STT', 'Sinh viên', 'Doanh nghiệp / Vị trí', 'Trạng thái', 'Thao tác'].map((label, index) =>
                <th scope="col" key={label} className={'px-4 py-4 font-semibold ' + (index === 0 ? 'text-center' : index === 4 ? 'text-right' : '')}>{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => {
                const status = placementStatus(student);
                const canCoordinate = canSelectForCoordination(student);
                return <tr key={student.id} className={selectedIds.has(student.id) ? 'bg-orange-50/60 hover:bg-orange-50' : 'hover:bg-slate-50/60'}>
                  <td className="px-4 py-4 text-center"><input type="checkbox" className="size-4 accent-orange-600" aria-label={'Chọn điều phối ' + student.fullName + ' ' + student.studentCode}
                    title={canCoordinate ? 'Chọn sinh viên để điều phối' : student.coordinationBlockedReason || 'Sinh viên chưa thể điều phối'} disabled={!canCoordinate || busy} checked={selectedIds.has(student.id)}
                    onChange={e => { const checked = e.target.checked; setSelectedIds(previous => { const next = new Set(previous); if (checked) next.add(student.id); else next.delete(student.id); return next; }); }} /></td>
                  <td className={cell + ' text-center tabular-nums text-slate-500'}>{index + 1}</td>
                  <td className={cell}><p className="font-semibold text-slate-800">{student.fullName}</p><p className="mt-1 text-xs text-slate-500">{student.studentCode}</p></td>
                  <td className={cell}><p className="break-words text-slate-700">{student.companyName || 'Chưa có doanh nghiệp'}</p><p className="mt-1 break-words text-xs text-slate-500">{student.positionTitle}</p></td>
                  <td className={cell}>
                    <span className={'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ' + placementStatusColors[status]}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />{placementStatusLabels[status]}
                    </span>
                    {student.receivedAt && <p className="mt-2 text-xs text-slate-500">{new Date(student.receivedAt).toLocaleString('vi-VN')}</p>}
                    {student.needsFollowUp && <p className="mt-2 text-xs font-medium text-red-600">Doanh nghiệp quá hạn phản hồi · Cần QHDN theo dõi điều phối</p>}
                  </td>
                  <td className={cell + ' text-right'}>
                    <div className="flex items-center justify-end gap-1.5">
                    {status !== 'RECEIVED' && (student.decision === 'ACCEPTED' ?
                      <button className={compactAction + ' border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'} disabled={busy}
                        aria-label={'Ghi nhận thực nhận cho ' + student.fullName} title="Ghi nhận sinh viên thực tế được tiếp nhận"
                        onClick={() => { setError(''); setTask({ student, kind: 'receive' }); }}><CheckCheck size={14} />Thực nhận</button> :
                      <button className={compactAction + ' border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700'} disabled={!canCoordinate || busy}
                        aria-label={'Điều phối ' + student.fullName} title={student.coordinationBlockedReason || 'Điều phối sinh viên đến doanh nghiệp'}
                        onClick={() => openCoordination([student])}><UserPlus size={14} />Điều phối</button>)}
                    <button type="button" aria-label={'Xem hồ sơ ' + student.fullName} title="Xem hồ sơ sinh viên và CV"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => setDetail(student)}><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-5"><h2 className="font-bold text-slate-800">Chỉ tiêu và số lượng thực nhận</h2><p className="mt-1 text-sm text-slate-500">Thực nhận có thể vượt chỉ tiêu đăng tuyển. Hệ thống giữ nguyên chỉ tiêu ban đầu và lưu lý do từng lần xác nhận.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['STT', 'Doanh nghiệp / Vị trí', 'Chỉ tiêu', 'Thực nhận', 'Vượt chỉ tiêu'].map((label, index) => <th scope="col" key={label} className={'px-4 py-3 font-semibold ' + (index === 0 ? 'w-16 text-center' : index > 1 ? 'text-right' : '')}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{data?.positions.map((position, index) => <tr key={position.id}>
          <td className={cell + ' text-center tabular-nums text-slate-500'}>{index + 1}</td>
          <td className={cell}><p className="font-medium text-slate-700">{position.companyName}</p><p className="mt-1 text-xs text-slate-500">{position.title}</p></td>
          <td className={cell + ' text-right tabular-nums'}>{position.capacity ?? 'Chưa có'}</td>
          <td className={cell + ' text-right tabular-nums'}>{position.actualCount}</td>
          <td className={cell + ' text-right tabular-nums'}>{Math.max(0, position.actualCount - Number(position.capacity ?? 0))}</td>
        </tr>)}</tbody>
      </table></div>
      {!data?.positions.length && <p className="p-6 text-center text-sm text-slate-500">Chưa có vị trí tiếp nhận trong học kỳ này.</p>}
    </section>
    {detail && <StudentProfileModal key={detail.id + ':' + semester.semesterId} studentId={detail.id} ojtSemesterId={Number(semester.semesterId)} fullName={detail.fullName} onClose={() => setDetail(null)} />}
    {task && <WorkflowModal wide title={task.kind === 'coordinate' ? task.students.length > 1 ? `Điều phối hàng loạt ${task.students.length} sinh viên` : 'Điều phối sinh viên đến doanh nghiệp' : 'Ghi nhận sinh viên thực nhận'} busy={busy} onClose={() => setTask(null)}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {batchErrors.length > 0 && task.kind === 'coordinate' && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Có {batchErrors.length} hồ sơ chưa gửi được. Có thể gửi lại các hồ sơ này.</p><ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">{batchErrors.map(item => <li key={item}>{item}</li>)}</ul></div>}
        {task.kind === 'receive' ? <p className="font-semibold text-slate-800">{task.student.fullName} · {task.student.studentCode}</p> : <div><p className="font-semibold text-slate-800">Danh sách điều phối ({task.students.length} sinh viên)</p><ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{task.students.map(student => <li key={student.id}>{student.fullName} · {student.studentCode}</li>)}</ul></div>}
        <fieldset disabled={busy} className="min-w-0 space-y-4">
        {task.kind === 'coordinate' ? <>
          <Notice>Hồ sơ điều phối được gửi ở trạng thái chờ phản hồi. Doanh nghiệp sẽ xác nhận việc tiếp nhận sinh viên.</Notice>
          {task.students.length > 1 && <p className="text-sm text-slate-500">Doanh nghiệp, vị trí và lý do được áp dụng cho tất cả sinh viên trong danh sách đã chọn.</p>}
          <Field label="Danh sách tiếp nhận hồ sơ"><select name="source" className={workflowInput}><option value="QHDN_COORDINATION">Danh sách điều phối của QHDN</option><option value="QHDN_APPLICATION">Danh sách ứng tuyển do QHDN điều phối</option></select></Field>
          <Field label="Doanh nghiệp và vị trí"><select name="positionId" className={workflowInput} required defaultValue=""><option value="" disabled>Chọn doanh nghiệp / vị trí</option>{data?.positions.map(position => <option key={position.id} value={position.id}>{position.companyName} — {position.title} · Chỉ tiêu {position.capacity ?? 0}, thực nhận {position.actualCount}</option>)}</select></Field>
        </> : <Notice>Doanh nghiệp đã nhận. Chỉ xác nhận thực nhận khi sinh viên thực tế được tiếp nhận. Nếu vượt chỉ tiêu, ghi rõ lý do bên dưới.</Notice>}
        <Field label={task.kind === 'coordinate' ? 'Lý do điều phối' : 'Lý do xác nhận thực nhận'}><textarea name="reason" className={workflowInput} required maxLength={2000} rows={3} /></Field>
        </fieldset>
        <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={() => setTask(null)}>Đóng</button><button className={workflowPrimary} disabled={busy}>{busy ? task.kind === 'coordinate' ? `Đang điều phối ${completed}/${task.students.length}…` : 'Đang lưu…' : task.kind === 'coordinate' ? `Xác nhận điều phối (${task.students.length})` : 'Xác nhận thực nhận'}</button></div>
      </form>
    </WorkflowModal>}
  </div>;
}
