import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { subscribeVisibleRefresh } from '@/utils/shared/visibleRefresh';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, UserPlus, Eye } from 'lucide-react';
import API from '@/services/apiService';
import { PageBanner } from '@/components/common/PageBanner';
import { useQhdnAcademicPeriods } from '@/hooks/qhdn/useQhdnAcademicPeriods';
import { AcademicPeriodFilter, WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { Field, Notice, Pager, errorMessage } from '@/components/qhdn/QhdnUi';
import { StudentProfileModal } from '@/components/qhdn/StudentProfileModal';
import { placementStatus, placementStatuses, placementStatusLabels, placementStatusColors, type PlacementStatus } from '@/utils/qhdn/qhdnPlacement';
import { canSelectForCoordination, coordinateBatch } from '@/utils/qhdn/qhdnCoordination';
import { summarizePlacementCompanies } from '@/utils/qhdn/qhdnCompanySummary';
import { paginateItems, selectPage } from '@/utils/qhdn/qhdnPagination';

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
  companyId?:number;
  positionId?:number;
  positionTitle?: string;
  receivedAt?: string;
  hasAssignment: boolean;
  needsFollowUp?: boolean;
  rejectReason?: string;
  canCoordinate?: boolean;
  coordinationBlockedReason?: string | null;
};
type Position = { id: number; title: string;companyId?:number; companyName: string; capacity: number | null; actualCount: number };
type Company = { id:number;name:string;availableSlots:number;capacity:number;actualCount:number };
type Board = { canCoordinate: boolean; context: { roundCount: number; unfinished: number }; companies:Company[];positions: Position[]; items: Student[] };
const cell = 'px-4 py-4 align-middle';
const filterInput = workflowInput + ' h-11 min-w-0 truncate';
const compactAction = 'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export default function QhdnOjtCoordination() {
  const [url] = useSearchParams(), semester = useQhdnAcademicPeriods(url.get('semester') || '', false, true);
  const [data, setData] = useState<Board | null>(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState<PlacementStatus | 'ALL'>('ALL'), [busy, setBusy] = useState(false);
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [page, setPage] = useState(1), [limit, setLimit] = useState(10);
  const [task, setTask] = useState<{ students: Student[];bulk:boolean } | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [completed, setCompleted] = useState(0);
  const request = useRef<AbortController | null>(null);
  const companies=useMemo(()=>data?summarizePlacementCompanies(data):[],[data]);

  useEffect(() => { setSelectedIds(new Set()); }, [semester.semesterId, search, filter, followUpOnly]);
  useEffect(() => { setPage(1); }, [semester.semesterId, semester.periodId, semester.yearId, search, filter, followUpOnly, limit]);
  useEffect(() => {
    const selectable = new Set(data?.items.filter(canSelectForCoordination).map(student => student.id));
    setSelectedIds(previous => new Set([...previous].filter(id => selectable.has(id))));
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
    const controller = new AbortController();
    request.current = controller;
    if (!data) setLoading(true);
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return API.get('/qhdn/placements', { params: { ojtSemesterId: semester.semesterId }, signal: controller.signal });
    }).then(r => { if (!controller.signal.aborted) setData(r.data.data); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => {
        if (request.current === controller) request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [semester.semesterId, revision]);

  useEffect(() => {
    if (!semester.semesterId || busy || task || detail) return;
    return subscribeVisibleRefresh(() => setRevision(v => v + 1), { interval: 30_000, canRefresh: () => !request.current });
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
        const companyId=Number(form.get('companyId'));
        if(task.bulk){
          const company=companies.find(item=>item.id===companyId);
          if(!company)throw new Error('Chọn doanh nghiệp tiếp nhận hồ sơ.');
        }
        const result = await coordinateBatch(task.students, student => API.post('/qhdn/placements', {
          studentId: student.id, ojtSemesterId: Number(semester.semesterId),
          ...(task.bulk?{companyId}:{positionId:Number(form.get('positionId'))}), source: form.get('source'), reason: form.get('reason'),
        }), setCompleted);
        setSelectedIds(previous => new Set([...previous].filter(id => !result.succeeded.some(student => student.id === id))));
        setMessage(`Đã điều phối ${result.succeeded.length}/${task.students.length} sinh viên đến doanh nghiệp. Hồ sơ đã gửi đang chờ doanh nghiệp phản hồi.`);
        refresh();
        if (result.failed.length) {
          setBatchErrors(result.failed.map(({ student, error }) => `${student.fullName} (${student.studentCode}): ${errorMessage(error)}`));
          setTask({ students: result.failed.map(item => item.student),bulk:task.bulk });
          return;
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
  const paged = paginateItems(students, page, limit);
  const pageSelectable = paged.items.filter(canSelectForCoordination);
  const pageSelectedCount = pageSelectable.filter(student => selectedIds.has(student.id)).length;
  const allSelected = pageSelectable.length > 0 && pageSelectedCount === pageSelectable.length;
  useEffect(() => { setPage(current => Math.min(current, paged.pages)); }, [paged.pages]);
  const openCoordination = (students: Student[],bulk=false) => {
    setError(''); setBatchErrors([]); setCompleted(0);
    setTask({ students,bulk });
  };

  return <div className="space-y-5 pb-10">
    <PageBanner variant="qhdn" title="Điều phối sinh viên và quản lý thực nhận" description="Điều phối sinh viên bị doanh nghiệp từ chối hoặc chưa ứng tuyển khi đã hết hạn đăng ký, kể cả doanh nghiệp đã đủ chỉ tiêu." badge="Phòng QHDN" />
    {(error || semester.error) && <Notice>{error || semester.error}</Notice>}
    {message && <Notice>{message}</Notice>}
    {data && data.context.unfinished > 0 && <Notice>Sinh viên bị doanh nghiệp từ chối được điều phối ngay. Sinh viên chưa ứng tuyển được điều phối khi hết hạn đăng ký, không cần chờ chốt tổng hợp. Hồ sơ đang chờ doanh nghiệp phản hồi được giữ nguyên.</Notice>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
          <button type="button" className={workflowPrimary} disabled={!selected.length || busy || loading} onClick={() => openCoordination(selected,true)}><UserPlus size={16} />Điều phối hàng loạt{selected.length > 0 && ` (${selected.length})`}</button>
        </div>
      </div>
      {loading ? <p className="p-8 text-center text-slate-500">Đang tải danh sách…</p> : !students.length ?
        <p className="p-8 text-center text-slate-500">Không có sinh viên phù hợp trong danh sách bàn giao.</p> :
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
            <colgroup><col className="w-12" /><col className="w-16" /><col className="w-[26%]" /><col /><col className="w-[220px]" /><col className="w-[192px]" /></colgroup>
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>
              <th scope="col" className="px-4 py-4 text-center"><input type="checkbox" className="size-4 accent-orange-600" aria-label="Chọn tất cả sinh viên có thể điều phối trên trang này" disabled={!pageSelectable.length || busy} checked={allSelected}
                ref={element => { if (element) element.indeterminate = pageSelectedCount > 0 && !allSelected; }}
                onChange={e => { const checked = e.target.checked; setSelectedIds(previous => selectPage(previous, pageSelectable.map(student => student.id), checked)); }} /></th>
              {['STT', 'Sinh viên', 'Doanh nghiệp / Vị trí', 'Trạng thái', 'Thao tác'].map((label, index) =>
                <th scope="col" key={label} className={'px-4 py-4 font-semibold ' + (index === 0 ? 'text-center' : index === 4 ? 'text-right' : '')}>{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paged.items.map((student, index) => {
                const status = placementStatus(student);
                const canCoordinate = canSelectForCoordination(student);
                return <tr key={student.id} className={selectedIds.has(student.id) ? 'bg-orange-50/60 hover:bg-orange-50' : 'hover:bg-slate-50/60'}>
                  <td className="px-4 py-4 text-center"><input type="checkbox" className="size-4 accent-orange-600" aria-label={'Chọn điều phối ' + student.fullName + ' ' + student.studentCode}
                    title={canCoordinate ? 'Chọn sinh viên để điều phối' : student.coordinationBlockedReason || 'Sinh viên chưa thể điều phối'} disabled={!canCoordinate || busy} checked={selectedIds.has(student.id)}
                    onChange={e => { const checked = e.target.checked; setSelectedIds(previous => { const next = new Set(previous); if (checked) next.add(student.id); else next.delete(student.id); return next; }); }} /></td>
                  <td className={cell + ' text-center tabular-nums text-slate-500'}>{paged.offset + index + 1}</td>
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
                    {status !== 'ACCEPTED' &&
                      <button className={compactAction + ' border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700'} disabled={!canCoordinate || busy}
                        aria-label={'Điều phối ' + student.fullName} title={student.coordinationBlockedReason || 'Điều phối sinh viên đến doanh nghiệp'}
                        onClick={() => openCoordination([student])}><UserPlus size={14} />Điều phối</button>}
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
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <Pager page={paged.page} total={students.length} limit={limit} busy={loading || busy} onChange={setPage} onLimitChange={setLimit} />
      </div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-5"><h2 className="font-bold text-slate-800">Chỉ tiêu và số lượng thực nhận</h2><p className="mt-1 text-sm text-slate-500">Số thực nhận tính sinh viên doanh nghiệp đã nhận hoặc đã có phân công, mỗi sinh viên một lần. Số này có thể thấp hơn, bằng hoặc vượt chỉ tiêu; chỉ tiêu ban đầu được giữ nguyên.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['STT', 'Doanh nghiệp', 'Chỉ tiêu', 'Sinh viên thực nhận', 'Vượt chỉ tiêu'].map((label, index) => <th scope="col" key={label} className={'px-4 py-3 font-semibold ' + (index === 0 ? 'w-16 text-center' : index > 1 ? 'text-right' : '')}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{companies.map((company, index) => <tr key={company.key}>
          <td className={cell + ' text-center tabular-nums text-slate-500'}>{index + 1}</td>
          <td className={cell + ' font-medium text-slate-700'}>{company.name}</td>
          <td className={cell + ' text-right tabular-nums'}>{company.capacity}</td>
          <td className={cell + ' text-right tabular-nums'}>{company.actualCount}</td>
          <td className={cell + ' text-right tabular-nums'}>{Math.max(0, company.actualCount - company.capacity)}</td>
        </tr>)}</tbody>
      </table></div>
      {!companies.length && <p className="p-6 text-center text-sm text-slate-500">{loading?'Đang tải chỉ tiêu và số lượng thực nhận…':error?'Không tải được dữ liệu. Vui lòng thử tải lại.':'Chưa có doanh nghiệp tiếp nhận trong học kỳ này.'}</p>}
    </section>
    {detail && <StudentProfileModal key={detail.id + ':' + semester.semesterId} studentId={detail.id} ojtSemesterId={Number(semester.semesterId)} fullName={detail.fullName} onClose={() => setDetail(null)} />}
    {task && <WorkflowModal wide title={task.bulk ? `Điều phối hàng loạt ${task.students.length} sinh viên` : 'Điều phối sinh viên đến doanh nghiệp'} busy={busy} onClose={() => setTask(null)}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {batchErrors.length > 0 && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Có {batchErrors.length} hồ sơ chưa gửi được. Có thể gửi lại các hồ sơ này.</p><ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">{batchErrors.map(item => <li key={item}>{item}</li>)}</ul></div>}
        <div><p className="font-semibold text-slate-800">Danh sách điều phối ({task.students.length} sinh viên)</p><ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{task.students.map(student => <li key={student.id}>{student.fullName} · {student.studentCode}</li>)}</ul></div>
        <fieldset disabled={busy} className="min-w-0 space-y-4">
        <>
          <Notice>Hồ sơ điều phối được gửi ở trạng thái chờ phản hồi. Doanh nghiệp sẽ xác nhận việc tiếp nhận sinh viên.</Notice>
          {task.bulk?<>
            <p className="text-sm text-slate-500">Doanh nghiệp và lý do được áp dụng cho tất cả sinh viên đã chọn. Có thể điều phối vượt chỉ tiêu; số thực nhận cập nhật khi doanh nghiệp đồng ý nhận.</p>
            <input type="hidden" name="source" value="QHDN_COORDINATION"/>
            <Field label="Danh sách tiếp nhận hồ sơ"><select name="companyId" className={workflowInput} required defaultValue=""><option value="" disabled>Chọn doanh nghiệp tiếp nhận</option>{companies.map(company=><option key={company.key} value={company.id??''} disabled={!company.id}>{company.name} · Còn {company.availableSlots} slot</option>)}</select></Field>
            {!companies.length&&<p className="text-sm text-amber-700">Chưa có doanh nghiệp tiếp nhận trong học kỳ này.</p>}
            {companies.length>0&&!companies.some(company=>company.id)&&<p className="text-sm text-amber-700">Chưa thể xác định doanh nghiệp tiếp nhận. Vui lòng tải lại danh sách hoặc liên hệ quản trị viên.</p>}
          </>:<>
            <input type="hidden" name="source" value="QHDN_COORDINATION"/>
            <Field label="Doanh nghiệp và vị trí"><select name="positionId" className={workflowInput} required defaultValue=""><option value="" disabled>Chọn doanh nghiệp / vị trí</option>{data?.positions.map(position => <option key={position.id} value={position.id}>{position.companyName} — {position.title} · Chỉ tiêu {position.capacity ?? 0}, thực nhận {position.actualCount}</option>)}</select></Field>
          </>}
        </>
        <Field label="Lý do điều phối"><textarea name="reason" className={workflowInput} required maxLength={2000} rows={3} /></Field>
        </fieldset>
        <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={() => setTask(null)}>Đóng</button><button className={workflowPrimary} disabled={busy}>{busy ? `Đang điều phối ${completed}/${task.students.length}…` : `Xác nhận điều phối (${task.students.length})`}</button></div>
      </form>
    </WorkflowModal>}
  </div>;
}
