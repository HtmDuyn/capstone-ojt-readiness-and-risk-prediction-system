import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Users, UserPlus, Eye, CircleX, BadgeCheck, Send, Clock3, UserRound } from 'lucide-react';
import API from '@/services/apiService';
import { PageBanner } from '@/components/common/PageBanner';
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { Field, Notice, Pager, errorMessage } from '@/components/qhdn/QhdnUi';
import { StudentProfileModal } from '@/components/qhdn/StudentProfileModal';
import { placementStatus, placementStatuses, placementStatusLabels, placementStatusColors, type PlacementStatus } from '@/utils/qhdn/qhdnPlacement';
import { canSelectForCoordination, coordinateBatch } from '@/utils/qhdn/qhdnCoordination';
import { summarizePlacementCompanies } from '@/utils/qhdn/qhdnCompanySummary';
import { paginateItems, selectPage } from '@/utils/qhdn/qhdnPagination';
import { loadAllPages } from '@/utils/shared/loadAllPages';

type Student = {
  id: number;
  studentCode: string;
  fullName: string;
  ojtSemesterId: number | null;
  semesterName: string | null;
  semesterStatus: string | null;
  coordinationId?: number;
  registrationId?: number | null;
  registrationStatus?: string | null;
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
type SemesterBoard = { ojtSemesterId: number; canCoordinate: boolean; context: { roundCount: number; unfinished: number }; companies:Company[];positions: Position[]; items: Student[] };
type Board = { items: Student[]; semesterBoards: SemesterBoard[]; total: number; limit: number; page: number };
const cell = 'px-4 py-4 align-middle';
const filterInput = workflowInput + ' h-11 min-w-0 truncate';
const compactAction = 'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

const semesterStatusLabels: Record<string, string> = { PLANNED: 'Sắp diễn ra', ACTIVE: 'Đang diễn ra', OPEN: 'Đang mở', CLOSED: 'Đã đóng', ARCHIVED: 'Đã lưu trữ', DRAFT: 'Bản nháp' };
const statusIcons = { REJECTED: CircleX, ACCEPTED: BadgeCheck, APPLIED: Send, WAITING_RESPONSE: Clock3, NOT_APPLIED: UserRound };

export default function QhdnOjtCoordination() {
  const [data, setData] = useState<Board | null>(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(''), [filter, setFilter] = useState<PlacementStatus | 'ALL'>('ALL'), [busy, setBusy] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [semesterStatusFilter, setSemesterStatusFilter] = useState('ALL');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [page, setPage] = useState(1), [limit, setLimit] = useState(10);
  const [companyPage, setCompanyPage] = useState(1), [companyLimit, setCompanyLimit] = useState(10);
  const [task, setTask] = useState<{ students: Student[];bulk:boolean } | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [completed, setCompleted] = useState(0);
  const request = useRef<AbortController | null>(null);
  const companies=useMemo(()=>data?data.semesterBoards.flatMap(board=>{
    const label=data.items.find(student=>student.ojtSemesterId===board.ojtSemesterId)?.semesterName??`Kỳ OJT #${board.ojtSemesterId}`;
    return summarizePlacementCompanies(board).map(company=>({...company,key:`${board.ojtSemesterId}:${company.key}`,name:`${company.name} · ${label}`}));
  }):[],[data]);
  const taskSemesterId = task?.students[0]?.ojtSemesterId ?? null;
  const taskBoard = data?.semesterBoards.find(board => board.ojtSemesterId === taskSemesterId);
  const taskCompanies = taskBoard ? summarizePlacementCompanies(taskBoard) : [];

  useEffect(() => { setSelectedIds(new Set()); }, [search, filter, followUpOnly, semesterFilter, semesterStatusFilter]);
  useEffect(() => { setPage(1); }, [search, filter, followUpOnly, semesterFilter, semesterStatusFilter, limit]);
  useEffect(() => {
    const selectable = new Set(data?.items.filter(canSelectForCoordination).map(student => student.id));
    setSelectedIds(previous => new Set([...previous].filter(id => selectable.has(id))));
  }, [data]);

  useEffect(() => {
    setData(null);
    setDetail(null);
    setTask(null);
    setLoading(true);
  }, []);
  useEffect(() => {
    setError('');
    const controller = new AbortController();
    request.current = controller;
    if (!data) setLoading(true);
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      let firstPage: Board | null = null;
      const semesterBoards = new Map<number, SemesterBoard>();
      return loadAllPages(async page => {
        const response = await API.get<{ data: Board & { total: number; limit: number } }>('/qhdn/eligible-students', {
          params: { page, limit: 100 }, signal: controller.signal,
        });
        const result = response.data.data;
        if (page === 1) firstPage = result;
        for (const board of result.semesterBoards ?? []) semesterBoards.set(board.ojtSemesterId, board);
        return result;
      }, controller.signal).then(items => {
        if (!firstPage) throw new Error('Không tải được danh sách sinh viên đủ điều kiện.');
        return { ...(firstPage as Board), items, semesterBoards: [...semesterBoards.values()] };
      });
    }).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e)); })
      .finally(() => {
        if (request.current === controller) request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

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
        if (task.students.some(student => !student.ojtSemesterId || student.ojtSemesterId !== task.students[0].ojtSemesterId))
          throw new Error('Chỉ điều phối các sinh viên có cùng kỳ OJT.');
        const companyId=Number(form.get('companyId'));
        if(task.bulk){
          const company=taskCompanies.find(item=>item.id===companyId);
          if(!company)throw new Error('Chọn doanh nghiệp tiếp nhận hồ sơ.');
        }
        const result = await coordinateBatch(task.students, student => API.post('/qhdn/placements', {
          studentId: student.id, ojtSemesterId: Number(student.ojtSemesterId),
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
  const semesters = [...new Map((data?.items ?? []).filter(student => student.ojtSemesterId !== null).map(student => [String(student.ojtSemesterId), { id: String(student.ojtSemesterId), name: student.semesterName ?? 'Kỳ OJT #' + student.ojtSemesterId, status: student.semesterStatus }])).values()];
  const availableSemesters = semesters.filter(semester => semesterStatusFilter === 'ALL' || semester.status === semesterStatusFilter);
  const semesterStudents = (data?.items ?? []).filter(student =>
    (semesterFilter === 'ALL' || String(student.ojtSemesterId) === semesterFilter) &&
    (semesterStatusFilter === 'ALL' || student.semesterStatus === semesterStatusFilter));
  const students = semesterStudents.filter(s => (!followUpOnly || s.needsFollowUp) &&
    (filter === 'ALL' || placementStatus(s) === filter) &&
    `${s.studentCode} ${s.fullName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selectable = students.filter(canSelectForCoordination);
  const selected = selectable.filter(student => selectedIds.has(student.id));
  const paged = paginateItems(students, page, limit);
  const pagedCompanies = paginateItems(companies, companyPage, companyLimit);
  const selectedSemesterId = selected[0]?.ojtSemesterId ?? null;
  const pageCandidateStudents = paged.items.filter(canSelectForCoordination);
  const pageSemesterId = selectedSemesterId ?? pageCandidateStudents[0]?.ojtSemesterId ?? null;
  const pageSelectable = pageCandidateStudents.filter(student => student.ojtSemesterId === pageSemesterId);
  const pageSelectedCount = pageSelectable.filter(student => selectedIds.has(student.id)).length;
  const allSelected = pageSelectable.length > 0 && pageSelectedCount === pageSelectable.length;
  useEffect(() => { setPage(current => Math.min(current, paged.pages)); }, [paged.pages]);
  useEffect(() => { setCompanyPage(current => Math.min(current, pagedCompanies.pages)); }, [pagedCompanies.pages]);
  const openCoordination = (students: Student[],bulk=false) => {
    setError(''); setBatchErrors([]); setCompleted(0);
    setTask({ students,bulk });
  };

  return <div className="space-y-5 pb-10">
    <PageBanner variant="qhdn" title="Điều phối sinh viên và quản lý thực nhận" description="Điều phối sinh viên có kết quả xét OJT hợp lệ đến doanh nghiệp; theo dõi phản hồi tiếp nhận và số lượng thực nhận." badge="Phòng QHDN" />
    {error && <Notice>{error}</Notice>}
    {message && <Notice>{message}</Notice>}
    <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-3 overflow-x-auto pb-2" aria-label="Thống kê trạng thái điều phối">
      {(['ALL', ...placementStatuses] as const).map(status => {
        const Icon = status === 'ALL' ? Users : statusIcons[status];
        const count = status === 'ALL' ? semesterStudents.length : semesterStudents.filter(student => placementStatus(student) === status).length;
        return <div key={status} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
          <div className="flex w-full items-center justify-between gap-2">
            <span className={'flex size-10 items-center justify-center rounded-xl border ' + (status === 'ALL' ? 'border-orange-200 bg-orange-50 text-orange-700' : placementStatusColors[status])}><Icon size={20} aria-hidden="true" /></span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-slate-900">{loading ? '—' : count}</p>
          <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-slate-600">{status === 'ALL' ? 'Tổng số sinh viên' : placementStatusLabels[status]}</p>
        </div>;
      })}
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <div className="min-w-0">
          <div className="min-w-0">
            <input className={filterInput} placeholder="Tìm mã hoặc tên sinh viên…" aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="min-w-0">
          <select className={filterInput} aria-label="Lọc trạng thái kỳ" value={semesterStatusFilter} onChange={e => { setSemesterStatusFilter(e.target.value); setSemesterFilter('ALL'); }}>
            <option value="ALL">Tất cả trạng thái kỳ</option>
            {[...new Set(semesters.map(semester => semester.status).filter((status): status is string => !!status))].map(status => <option key={status} value={status}>{semesterStatusLabels[status] ?? status}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <select className={filterInput} aria-label="Lọc kỳ OJT" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
            <option value="ALL">Tất cả kỳ OJT</option>
            {availableSemesters.map(semester => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <select className={filterInput} aria-label="Lọc trạng thái" value={filter} onChange={e => setFilter(e.target.value as PlacementStatus | 'ALL')}>
            <option value="ALL">Tất cả trạng thái</option>
            {placementStatuses.map(status => <option key={status} value={status}>{placementStatusLabels[status]}</option>)}
          </select>
        </div>
      </fieldset>
      <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">Danh sách và số liệu thống kê hiển thị theo kỳ OJT và trạng thái kỳ đã chọn. Chọn sinh viên cùng kỳ OJT để điều phối hàng loạt.</p>
      <label className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm text-slate-600"><input type="checkbox" disabled={busy} checked={followUpOnly} onChange={e => setFollowUpOnly(e.target.checked)} />Chỉ hồ sơ doanh nghiệp quá hạn phản hồi ({semesterStudents.filter(s => s.needsFollowUp).length})</label>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-orange-50/50 px-5 py-3">
        <p className="text-sm text-slate-600" aria-live="polite">Đã chọn <strong className="text-orange-700">{selected.length}</strong> sinh viên <span className="text-slate-500">· {selectable.length} hồ sơ có thể điều phối trong danh sách</span></p>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && <button type="button" className={workflowSecondary} disabled={busy} onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>}
          <button type="button" className={workflowPrimary} disabled={!selected.length || busy || loading} onClick={() => openCoordination(selected,true)}><UserPlus size={16} />Điều phối hàng loạt{selected.length > 0 && ` (${selected.length})`}</button>
        </div>
      </div>
      {loading ? <p className="p-8 text-center text-slate-500">Đang tải danh sách…</p> : !students.length ?
        <p className="p-8 text-center text-slate-500">Không có sinh viên đủ điều kiện phù hợp.</p> :
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
                    title={canCoordinate ? 'Chọn sinh viên để điều phối' : student.coordinationBlockedReason || 'Sinh viên chưa thể điều phối'} disabled={!canCoordinate || busy || (selectedSemesterId !== null && student.ojtSemesterId !== selectedSemesterId)} checked={selectedIds.has(student.id)}
                    onChange={e => { const checked = e.target.checked; setSelectedIds(previous => { const next = new Set(previous); if (checked) { for (const id of [...next]) { const existing = data?.items.find(item => item.id === id); if (existing?.ojtSemesterId !== student.ojtSemesterId) next.delete(id); } next.add(student.id); } else next.delete(student.id); return next; }); }} /></td>
                  <td className={cell + ' text-center tabular-nums text-slate-500'}>{paged.offset + index + 1}</td>
                  <td className={cell}><p className="font-semibold text-slate-800">{student.fullName}</p><p className="mt-1 text-xs text-slate-500">{student.studentCode}</p><p className="mt-1 text-xs text-orange-700">{student.semesterName ?? 'Chưa xác định kỳ OJT'}</p></td>
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
                      disabled={!student.ojtSemesterId}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['STT', 'Doanh nghiệp', 'Chỉ tiêu', 'Sinh viên thực nhận', 'Vượt chỉ tiêu'].map((label, index) => <th scope="col" key={label} className={'px-4 py-3 font-semibold ' + (index === 0 ? 'w-16 text-center' : index > 1 ? 'text-center' : '')}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{pagedCompanies.items.map((company, index) => <tr key={company.key}>
          <td className={cell + ' text-center tabular-nums text-slate-500'}>{pagedCompanies.offset + index + 1}</td>
          <td className={cell + ' font-medium text-slate-700'}>{company.name}</td>
          <td className={cell + ' text-center tabular-nums'}>{company.capacity}</td>
          <td className={cell + ' text-center tabular-nums'}>{company.actualCount}</td>
          <td className={cell + ' text-center tabular-nums'}>{Math.max(0, company.actualCount - company.capacity)}</td>
        </tr>)}</tbody>
      </table></div>
      {!companies.length && <p className="p-6 text-center text-sm text-slate-500">{loading?'Đang tải chỉ tiêu và số lượng thực nhận…':error?'Không tải được dữ liệu.':'Chưa có doanh nghiệp tiếp nhận trong các kỳ OJT này.'}</p>}
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <Pager page={pagedCompanies.page} total={companies.length} limit={companyLimit} busy={loading} onChange={setCompanyPage} onLimitChange={setCompanyLimit} />
      </div>
    </section>
    {detail?.ojtSemesterId && <StudentProfileModal key={detail.id + ':' + detail.ojtSemesterId} studentId={detail.id} ojtSemesterId={detail.ojtSemesterId} fullName={detail.fullName} onClose={() => setDetail(null)} />}
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
            <Field label={'Danh sách tiếp nhận hồ sơ · ' + (task.students[0].semesterName ?? 'Kỳ OJT')}><select name="companyId" className={workflowInput} required defaultValue=""><option value="" disabled>Chọn doanh nghiệp tiếp nhận</option>{taskCompanies.map(company=><option key={company.key} value={company.id??''} disabled={!company.id}>{company.name} · Còn {company.availableSlots} slot</option>)}</select></Field>
            {!taskCompanies.length&&<p className="text-sm text-amber-700">Chưa có doanh nghiệp tiếp nhận cho kỳ OJT này.</p>}
            {taskCompanies.length>0&&!taskCompanies.some(company=>company.id)&&<p className="text-sm text-amber-700">Chưa thể xác định doanh nghiệp tiếp nhận. Vui lòng liên hệ quản trị viên.</p>}
          </>:<>
            <input type="hidden" name="source" value="QHDN_COORDINATION"/>
            <Field label={'Doanh nghiệp và vị trí · ' + (task.students[0].semesterName ?? 'Kỳ OJT')}><select name="positionId" className={workflowInput} required defaultValue=""><option value="" disabled>Chọn doanh nghiệp / vị trí</option>{taskBoard?.positions.map(position => <option key={position.id} value={position.id}>{position.companyName} — {position.title} · Chỉ tiêu {position.capacity ?? 0}, thực nhận {position.actualCount}</option>)}</select></Field>
          </>}
        </>
        <Field label="Lý do điều phối"><textarea name="reason" className={workflowInput} required maxLength={2000} rows={3} /></Field>
        </fieldset>
        <div className="flex justify-end gap-3"><button type="button" className={workflowSecondary} disabled={busy} onClick={() => setTask(null)}>Đóng</button><button className={workflowPrimary} disabled={busy}>{busy ? `Đang điều phối ${completed}/${task.students.length}…` : `Xác nhận điều phối (${task.students.length})`}</button></div>
      </form>
    </WorkflowModal>}
  </div>;
}
