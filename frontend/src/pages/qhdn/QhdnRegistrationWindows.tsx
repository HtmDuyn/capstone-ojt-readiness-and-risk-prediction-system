import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { RecruitmentRounds } from '@/components/qhdn/RecruitmentRounds';
import { AcademicPeriodFilter, WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { Field, Notice, Pager, errorMessage } from '@/components/qhdn/QhdnUi';
import { useQhdnAcademicPeriods } from '@/hooks/useQhdnAcademicPeriods';
import { closeRegistrationWindow, listRegistrationWindows, openRegistrationWindow, updateRegistrationWindow } from '@/services/qhdnService';
import { loadAllPages } from '@/utils/loadAllPages';
import type { RegistrationWindowItem } from '@/types/qhdn/qhdnTypes';

const localDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const windowLabels: Record<string, string> = { OPEN: 'Đang mở', DRAFT: 'Bản nháp', CLOSED: 'Đã đóng' };
const cell = 'px-4 py-4 align-middle';

export default function QhdnRegistrationWindows() {
  const [url] = useSearchParams();
  const semester = useQhdnAcademicPeriods(url.get('semester') || '', false, true);
  const [windows, setWindows] = useState<RegistrationWindowItem[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [revision, setRevision] = useState(0), [page, setPage] = useState(1);
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [taskError, setTaskError] = useState('');
  const [task, setTask] = useState<{ kind: 'extend' | 'toggle'; window: RegistrationWindowItem } | null>(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    let active = true;
    setWindows([]); setError('');
    if (!semester.semesterId) { setLoading(false); return; }
    setLoading(true);
    loadAllPages(page => listRegistrationWindows({ ojtSemesterId: Number(semester.semesterId), page, limit: 100 }).then(response => response.data))
      .then(items => { if (active) setWindows(items.filter(window => !window.recruitmentRoundId)); })
      .catch(error => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [semester.semesterId, revision]);

  useEffect(() => { setTask(null); setTaskError(''); setPage(1); setMessage(''); }, [semester.periodId]);

  const openTask = (kind: 'extend' | 'toggle', window: RegistrationWindowItem) => { setTask({ kind, window }); setTaskError(''); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task || busy || !semester.semesterId) return;
    const form = new FormData(event.currentTarget), reason = String(form.get('reason') || '').trim();
    if (!reason) return;
    setBusy(true); setTaskError('');
    try {
      if (task.kind === 'extend') {
        const end = new Date(String(form.get('endsAt') || ''));
        if (!Number.isFinite(end.getTime()) || end <= new Date(task.window.endsAt)) throw new Error('Hạn mới phải sau hạn hiện tại.');
        await updateRegistrationWindow(task.window.id, { endsAt: end.toISOString(), reason });
        setMessage('Đã gia hạn đợt đăng ký.');
      } else {
        if (task.window.status === 'OPEN') await closeRegistrationWindow(task.window.id, reason);
        else await openRegistrationWindow(task.window.id, reason);
        setMessage(task.window.status === 'OPEN' ? 'Đã đóng đợt đăng ký.' : 'Đã mở đợt đăng ký.');
      }
      setTask(null); refresh();
    } catch (error) { setTaskError(errorMessage(error)); refresh(); }
    finally { setBusy(false); }
  };
  const safePage = Math.min(page, Math.max(1, Math.ceil(windows.length / 10)));

  return <div className="space-y-5 pb-10">
    <PageBanner title="Quản lý các đợt OJT" description="Thiết lập đợt OJT, quản lý lịch tuyển dụng, mở đợt con và chốt tổng hợp kết quả theo học kỳ." badge="Phòng QHDN" />
    <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <AcademicPeriodFilter selection={semester} disabled={busy} />
      <button type="button" className={workflowSecondary} disabled={semester.loading || loading || busy} onClick={refresh}><RefreshCw size={16} />Tải lại các đợt</button>
    </section>
    {semester.error && <Notice>{semester.error}</Notice>}
    {!semester.loading && semester.selectedPeriod && !semester.semesterId && <Notice>Học kỳ này chưa liên kết kỳ OJT. Bạn có thể tạo đợt OJT tổng để thiết lập lịch tuyển dụng.</Notice>}
    {message && <Notice>{message}</Notice>}
    <RecruitmentRounds key={semester.periodId} selection={semester} refreshKey={revision} onChanged={refresh} />
    <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <summary className="cursor-pointer p-5 font-semibold text-slate-700">Các đợt đăng ký cũ <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs tabular-nums text-slate-500">{windows.length}</span></summary>
      <div className="space-y-4 border-t border-slate-100 p-5">
        <p className="text-sm text-slate-500">Gia hạn, mở hoặc đóng các đợt đăng ký đã tạo trước đây. Đợt OJT mới được tạo ở phần trên.</p>
        {error && <Notice>{error}</Notice>}
        {loading || semester.loading ? <p role="status" className="py-6 text-center text-sm text-slate-500">Đang tải các đợt đăng ký…</p> : error ? null : !windows.length ?
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có đợt đăng ký cũ trong học kỳ này.</p> : <>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['STT', 'Đợt đăng ký', 'Bắt đầu', 'Kết thúc', 'Trạng thái', 'Thao tác'].map((label, index) => <th scope="col" key={label} className={'px-4 py-3 font-semibold ' + (index === 0 ? 'w-16 text-center' : index === 5 ? 'text-right' : '')}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{windows.slice((safePage - 1) * 10, safePage * 10).map((window, index) => <tr key={window.id}>
                <td className={cell + ' text-center tabular-nums text-slate-500'}>{(safePage - 1) * 10 + index + 1}</td>
                <td className={cell + ' font-medium text-slate-800'}>{window.name}</td>
                <td className={cell + ' whitespace-nowrap text-slate-600'}>{localDate(window.startsAt)}</td>
                <td className={cell + ' whitespace-nowrap text-slate-600'}>{localDate(window.endsAt)}</td>
                <td className={cell}><span className={'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ' + (window.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{windowLabels[window.status] || window.status}</span></td>
                <td className={cell}><div className="flex justify-end gap-2">
                  <button type="button" className={workflowSecondary + ' !rounded-lg !px-3 !py-2 !text-xs'} disabled={busy} onClick={() => openTask('extend', window)}>Gia hạn</button>
                  <button type="button" className={(window.status === 'OPEN' ? workflowSecondary : workflowPrimary) + ' whitespace-nowrap !rounded-lg !px-3 !py-2 !text-xs'} disabled={busy} onClick={() => openTask('toggle', window)}>{window.status === 'OPEN' ? 'Đóng đợt' : 'Mở đợt'}</button>
                </div></td>
              </tr>)}</tbody>
            </table></div>
            <Pager page={safePage} total={windows.length} limit={10} busy={loading || busy} onChange={setPage} />
          </>}
      </div>
    </details>
    {task && <WorkflowModal title={task.kind === 'extend' ? 'Gia hạn đăng ký' : task.window.status === 'OPEN' ? 'Đóng đợt đăng ký' : 'Mở lại đợt đăng ký'} subtitle={task.window.name} busy={busy} onClose={() => setTask(null)}>
      <form onSubmit={submit} className="space-y-4">
        {taskError && <Notice>{taskError}</Notice>}
        {task.kind === 'extend' ? <Field label={'Hạn mới (sau ' + localDate(task.window.endsAt) + ')'}><input name="endsAt" type="datetime-local" className={workflowInput} required /></Field> :
          <Notice>{task.window.status === 'OPEN' ? 'Sinh viên sẽ ngừng nộp hồ sơ trong đợt này.' : 'Đợt cần còn hạn và có sinh viên được bàn giao trong phạm vi.'}</Notice>}
        <Field label="Lý do"><textarea name="reason" className={workflowInput} required maxLength={2000} rows={3} /></Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className={workflowSecondary} disabled={busy} onClick={() => setTask(null)}>Hủy</button>
          <button className={workflowPrimary} disabled={busy || !semester.semesterId}><CheckCircle2 size={16} />{busy ? 'Đang xử lý…' : 'Xác nhận'}</button>
        </div>
      </form>
    </WorkflowModal>}
  </div>;
}
