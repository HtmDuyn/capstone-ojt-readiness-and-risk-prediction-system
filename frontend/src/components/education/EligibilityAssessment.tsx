import { getAllItems, getPage } from '@/services/educationApi';
import { ojtEligibilityService as eligibility } from '@/services/ojtEligibility.service';
import type { AcademicPeriod } from '@/types/education/academic.types';
import type { Page } from '@/types/education/api.types';
import type { AssessmentWindow, EligibilityBatch, EligibilityFilter, StudentEligibility } from '@/types/education/eligibility.types';
import { eligibilityReasonLabel, eligibilityStatusLabel, filterEligibilityResults } from '@/utils/educationEligibility';
import React from 'react';
import { Link } from 'react-router-dom';

type Student = { id: number; studentCode: string; fullName: string };
const time = (value: string) => new Date(value).toLocaleString('vi-VN');
const message = (error: unknown) => {
  const code = (error as { errorCode?: string })?.errorCode;
  const labels: Record<string, string> = {
    OJT_ASSESSMENT_NOT_CONFIGURED: 'Cần cấu hình đợt xét sau Block 3 trước.',
    OJT_ASSESSMENT_NOT_OPEN: 'Đợt xét chưa mở hoặc đã hết thời gian xét. Kiểm tra lịch và xác nhận chốt điểm.',
    OJT_ASSESSMENT_BEFORE_BLOCK_END: 'Chỉ mở xét chính thức sau khi kết thúc Block 3.',
    OJT_ASSESSMENT_BEFORE_SEMESTER_END: 'Thời gian xét phải sau khi kết thúc học kỳ chuẩn bị.',
    BATCH_SCOPE_EMPTY: 'Không có sinh viên đang hoạt động trong phạm vi đã chọn.',
    BATCH_TOO_LARGE: 'Mỗi lần chỉ xét tối đa 1.000 sinh viên.',
    ELIGIBILITY_CHECK_STALE: 'Dữ liệu đã thay đổi. Hãy chạy xét lại.',
    ASSESSMENT_SEMESTER_MISMATCH: 'Sinh viên chưa đúng học kỳ xét; cần kiểm tra lộ trình hoặc ngoại lệ đã duyệt.',
  };
  return (code && labels[code]) || (error instanceof Error ? error.message : 'Không thực hiện được yêu cầu.');
};

export function EligibilityAssessment({ programId, semesterId, scopeLabel, onBusyChange }: {
  programId: number | null; semesterId: number | null; scopeLabel: string; onBusyChange: (busy: boolean) => void;
}) {
  const [window, setWindow] = React.useState<AssessmentWindow | null>(null);
  const [missingWindow, setMissingWindow] = React.useState(false);
  const [blocks, setBlocks] = React.useState<AcademicPeriod[]>([]);
  const [students, setStudents] = React.useState<Page<Student> | null>(null);
  const [page, setPage] = React.useState(1);
  const [result, setResult] = React.useState<EligibilityBatch | null>(null);
  const [status, setStatus] = React.useState<EligibilityFilter>('ALL');
  const [search, setSearch] = React.useState('');
  const [resultPage, setResultPage] = React.useState(1);
  const [preview, setPreview] = React.useState<{ student: Student; data: StudentEligibility } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [windowError, setWindowError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [finalized, setFinalized] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [now, setNow] = React.useState(Date.now());
  const [form, setForm] = React.useState({ blockPeriodId: '', opensAt: '', closesAt: '' });
  const key = React.useRef<string | null>(null);
  const previewRequest = React.useRef<AbortController | null>(null);
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setResult(null); setPreview(null); setNotice(''); setPage(1); key.current = null;
    return () => previewRequest.current?.abort();
  }, [programId, semesterId]);

  React.useEffect(() => {
    const c = new AbortController();
    setWindow(null); setWindowError(''); setMissingWindow(false); setFinalized(false);
    if (semesterId) eligibility.assessment(semesterId, c.signal)
      .then(w => { if (!c.signal.aborted) { setWindow(w); setMissingWindow(!w); } })
      .catch((e: any) => {
        if (c.signal.aborted) return;
        if (e.response?.data?.errorCode === 'OJT_ASSESSMENT_NOT_CONFIGURED') setMissingWindow(true);
        else setWindowError(message(e));
      });
    return () => c.abort();
  }, [semesterId, refresh]);

  React.useEffect(() => {
    const c = new AbortController();
    getAllItems<AcademicPeriod>('/academic-periods', { kind: 'BLOCK3' }, c.signal)
      .then(rows => { if (!c.signal.aborted) setBlocks(rows); })
      .catch(e => { if (!c.signal.aborted) setError(message(e)); });
    return () => c.abort();
  }, []);

  React.useEffect(() => {
    const c = new AbortController();
    setStudents(null); setError(''); setLoading(Boolean(programId));
    if (programId) getPage<Student>('/students', { programId, status: 'ACTIVE', page, limit: 20 }, c.signal)
      .then(rows => { if (!c.signal.aborted) setStudents(rows); })
      .catch(e => { if (!c.signal.aborted) setError(message(e)); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [programId, page, refresh]);

  async function mutate(work: () => Promise<void>) {
    previewRequest.current?.abort(); setPreview(null);
    setBusy(true); onBusyChange(true); setError(''); setNotice('');
    try { await work(); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); onBusyChange(false); }
  }
  async function runBatch() {
    if (!programId || !semesterId || busy) return;
    await mutate(async () => {
      key.current ??= crypto.randomUUID();
      const data = await eligibility.checkBatch({ programIds: [programId], ojtSemesterId: semesterId, idempotencyKey: key.current });
      setResult(data); setPreview(null); key.current = null;
      setStatus('ALL'); setSearch(''); setResultPage(1);
      setNotice('Đã xét và cập nhật kết quả. Hồ sơ cần đối soát chưa được xác nhận chính thức.');
      setRefresh(v => v + 1);
    });
  }
  async function viewStudent(student: Student) {
    if (!semesterId) return;
    previewRequest.current?.abort();
    const c = new AbortController(); previewRequest.current = c;
    setPreview(null); setError('');
    try {
      const data = await eligibility.getStudentEligibility(student.id, semesterId, c.signal);
      if (!c.signal.aborted) setPreview({ student, data });
    } catch (e) { if (!c.signal.aborted) setError(message(e)); }
  }

  const withinWindow = Boolean(window && now >= new Date(window.OpensAt).getTime() && now < new Date(window.ClosesAt).getTime());
  const canRun = Boolean(programId && semesterId && window?.Status === 'OPEN' && window.ResultsFinalizedAt && withinWindow && students?.total && students.total <= 1000);
  const filtered = React.useMemo(() => filterEligibilityResults(result?.items ?? [], status, search), [result, status, search]);
  const visibleResults = filtered.slice((resultPage - 1) * 20, resultPage * 20);
  return <section className="space-y-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
    <div><h2 className="text-lg font-bold text-slate-900">Xét và lập danh sách sinh viên</h2>
      <p className="mt-2 text-sm text-slate-600">{scopeLabel}</p>
    </div>
    {!semesterId && <p>Chọn kỳ OJT để kiểm tra đợt xét.</p>}
    {windowError && <p role="alert" className="text-red-700">{windowError}</p>}
    {window && <div className="rounded-lg bg-slate-50 p-4 text-sm">
      <p>Xét học vụ chính thức: <strong>{({ DRAFT: 'Chưa sẵn sàng', OPEN: 'Sẵn sàng', CLOSED: 'Đã kết thúc' })[window.Status]}</strong></p>
      <p>Từ {time(window.OpensAt)} đến {time(window.ClosesAt)}.</p>
      <p>Điểm Block 3: {window.ResultsFinalizedAt ? `Đã chốt lúc ${time(window.ResultsFinalizedAt)}` : 'Chưa xác nhận chốt điểm'}.</p>
      {!withinWindow && <p className="text-amber-800">Hiện ngoài khoảng thời gian xét đã cấu hình.</p>}
    </div>}
    {(missingWindow || window?.Status === 'DRAFT') && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Cần hoàn tất điểm và thiết lập thời gian xét học vụ trước khi lưu kết quả chính thức. Mở mục thiết lập bên dưới để thực hiện.</p>}
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-semibold">Thiết lập thời gian xét học vụ và chốt điểm</summary>
      <p className="my-3 text-sm text-slate-500">Đây là lịch xét học vụ của Phòng Đào tạo, khác với đợt đăng ký OJT do Phòng QHDN mở trong học kỳ.</p>
    {semesterId && (missingWindow || window?.Status === 'DRAFT') && <form className="space-y-3 rounded-lg border p-4" onSubmit={e => {
      e.preventDefault(); if (!semesterId || busy) return;
      void mutate(async () => {
        const saved = await eligibility.saveAssessment(semesterId, { blockPeriodId: Number(form.blockPeriodId), opensAt: new Date(form.opensAt).toISOString(), closesAt: new Date(form.closesAt).toISOString(), reason });
        setWindow(saved); setMissingWindow(false); setNotice('Đã lưu lịch xét. Khi đến thời gian mở, xác nhận chốt điểm để mở đợt xét.');
      });
    }}>
      <h3 className="font-semibold">Thời gian xét học vụ sau Block 3</h3>
      {blocks.length === 0 && <p className="text-amber-800">Chưa tải được Block 3. Kiểm tra dữ liệu tại <Link className="underline" to="/education/academic-year">Quản lý năm học</Link> rồi tải lại trang.</p>}
      <p className="text-sm text-slate-600">Thời gian mở phải sau khi kết thúc học kỳ chuẩn bị và Block 3. BE kiểm tra lịch, học kỳ tương đối 5 và các ngoại lệ đã duyệt.</p>
      <div className="flex flex-wrap gap-3">
        <label>Block 3<select required disabled={busy} className="ml-2 rounded border p-2" value={form.blockPeriodId} onChange={e => setForm({ ...form, blockPeriodId: e.target.value })}><option value="">Chọn Block 3</option>{blocks.map(b => <option key={b.id} value={b.id}>{b.periodCode} — {b.name}</option>)}</select></label>
        <label>Mở lúc<input required disabled={busy} type="datetime-local" className="ml-2 rounded border p-2" value={form.opensAt} onChange={e => setForm({ ...form, opensAt: e.target.value })} /></label>
        <label>Đóng lúc<input required disabled={busy} type="datetime-local" className="ml-2 rounded border p-2" value={form.closesAt} onChange={e => setForm({ ...form, closesAt: e.target.value })} /></label>
      </div>
      <label className="block">Lý do cấu hình<input required maxLength={2000} disabled={busy} className="ml-2 rounded border p-2" value={reason} onChange={e => setReason(e.target.value)} /></label>
      <button disabled={busy || !blocks.length} className="rounded border px-3 py-2 disabled:opacity-50">Lưu lịch xét</button>
    </form>}
    {window?.Status === 'DRAFT' && <div className="space-y-3 rounded-lg border p-4">
      <label className="flex items-center gap-2"><input type="checkbox" disabled={busy} checked={finalized} onChange={e => setFinalized(e.target.checked)} />Tôi xác nhận đã hoàn tất cập nhật điểm Block 3.</label>
      <label className="block">Lý do xác nhận<input maxLength={2000} disabled={busy} className="ml-2 rounded border p-2" value={reason} onChange={e => setReason(e.target.value)} /></label>
      <button disabled={busy || !finalized || !reason.trim() || !withinWindow} className="rounded border px-3 py-2 disabled:opacity-50" onClick={() => {
        if (!semesterId) return;
        void mutate(async () => { setWindow(await eligibility.openAssessment(semesterId, reason)); setNotice('Đã mở đợt xét.'); });
      }}>Xác nhận chốt điểm và bắt đầu xét học vụ</button>
    </div>}
    {window?.Status === 'CLOSED' && <p className="text-amber-800">Đợt xét đã đóng. Không cập nhật kết quả chính thức trong đợt này.</p>}
    </details>
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={!canRun || busy || loading} onClick={runBatch} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang xét sinh viên...' : result ? 'Xét lại và cập nhật danh sách' : 'Xét điều kiện và lưu danh sách'}</button>
      <button disabled={busy} onClick={() => setRefresh(v => v + 1)} className="rounded border px-3 py-2">Tải lại</button>
      <Link className="text-orange-700 underline" to="/education/student-status">Theo dõi kết quả và trạng thái OJT</Link>
    </div>
    <p className="text-sm text-slate-600">Xét toàn bộ sinh viên đang hoạt động thuộc chương trình đã chọn, tối đa 1.000 sinh viên/lần. Hệ thống lưu kết quả theo quy tắc chung; hồ sơ thiếu dữ liệu được đưa vào nhóm cần đối soát. Sau khi xét, danh sách đủ điều kiện phục vụ bàn giao cho Phòng QHDN.</p>
    {students && students.total > 1000 && <p role="alert" className="text-amber-800">Phạm vi vượt 1.000 sinh viên; cần thu hẹp trước khi xét.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status" className="text-green-700">{notice}</p>}
    {result && <div className="space-y-4 border-t pt-5">
      <div><h3 className="text-lg font-bold">Danh sách kết quả xét OJT</h3><p className="mt-1 text-sm text-slate-500">Lần xét #{result.runId} · {result.total} sinh viên · Kết quả tại thời điểm xét</p></div>
      <div role="group" aria-label="Lọc kết quả xét OJT" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          { value: 'ALL', name: 'Tất cả', count: result.total, color: 'border-slate-300 bg-slate-50' },
          { value: 'ELIGIBLE', name: 'Đủ điều kiện', count: result.eligible, color: 'border-green-300 bg-green-50' },
          { value: 'NOT_ELIGIBLE', name: 'Không đủ điều kiện', count: result.notEligible, color: 'border-red-300 bg-red-50' },
          { value: 'REVIEW_REQUIRED', name: 'Cần đối soát', count: result.reviewRequired, color: 'border-amber-300 bg-amber-50' },
        ] as const).map(tab => <button key={tab.value} aria-pressed={status === tab.value} onClick={() => { setStatus(tab.value); setResultPage(1); }} className={`rounded-xl border p-4 text-left ${tab.color} ${status === tab.value ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}><span className="block text-sm">{tab.name}</span><strong className="mt-1 block text-2xl">{tab.count}</strong></button>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><input aria-label="Tìm trong kết quả xét" placeholder="Tìm mã hoặc tên sinh viên" className="w-full rounded-lg border p-3 sm:max-w-sm" value={search} onChange={e => { setSearch(e.target.value); setResultPage(1); }} /><span className="text-sm text-slate-500">{filtered.length} / {result.total} sinh viên</span></div>
      <div className="overflow-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Sinh viên', 'Tín chỉ đạt', 'Môn còn rớt', 'Kết quả', 'Chi tiết', ''].map((h, i) => <th className="p-3" key={h || i}>{h}</th>)}</tr></thead><tbody>
        {visibleResults.map(r => <tr key={r.checkId} className="border-t align-top"><td className="p-3"><strong>{r.studentCode ?? `SV #${r.studentId}`}</strong><span className="mt-1 block text-slate-500">{r.fullName ?? '—'}</span></td><td className="p-3">{r.earnedCredits}<span className="block text-xs text-slate-500">Thiếu: {r.missingCredits ?? 'chưa xác định'}</span></td><td className="p-3">{r.unpassedCourseCount}</td><td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${r.status === 'ELIGIBLE' ? 'bg-green-100 text-green-800' : r.status === 'NOT_ELIGIBLE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{eligibilityStatusLabel(r.status)}</span><span className="mt-1 block text-xs text-slate-500">{r.confirmedAt ? 'Đã lưu chính thức' : 'Chưa xác nhận chính thức'}</span></td><td className="max-w-xs p-3">{r.reasons.map(eligibilityReasonLabel).join(' ') || 'Đạt cả hai điều kiện.'}{r.academicIssues.length > 0 && <span className="block text-amber-800">Dữ liệu cần đối soát: {r.academicIssues.join(', ')}</span>}</td><td className="p-3"><button disabled={busy} className="whitespace-nowrap text-orange-700" onClick={() => void viewStudent({ id: r.studentId, studentCode: r.studentCode ?? `SV #${r.studentId}`, fullName: r.fullName ?? '' })}>Xem hồ sơ</button></td></tr>)}
      </tbody></table>{!visibleResults.length && <p className="p-6 text-center text-slate-500">Không có sinh viên phù hợp với bộ lọc.</p>}</div>
      <div className="flex items-center justify-between gap-3 text-sm"><button className="rounded border px-3 py-2 disabled:opacity-50" disabled={resultPage <= 1} onClick={() => setResultPage(p => p - 1)}>Trước</button><span>Trang {resultPage} / {Math.max(1, Math.ceil(filtered.length / 20))}</span><button className="rounded border px-3 py-2 disabled:opacity-50" disabled={resultPage * 20 >= filtered.length} onClick={() => setResultPage(p => p + 1)}>Sau</button></div>
    </div>}
    {!result && <><h3 className="font-semibold">Sinh viên trong phạm vi xét</h3><p className="text-sm text-slate-600">Có thể xem trước từng hồ sơ. Sau khi xét, danh sách kết quả và bộ lọc sẽ xuất hiện tại đây.</p></>}
    {loading && <p role="status">Đang tải sinh viên...</p>}
    {!programId && <p>Chọn chương trình để tải sinh viên.</p>}
    {students && !result && <>
      <p>{students.total} sinh viên đang hoạt động.</p>
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Mã sinh viên</th><th>Họ tên</th><th /></tr></thead><tbody>{students.items.map(s => <tr key={s.id} className="border-t"><td className="p-2">{s.studentCode}</td><td>{s.fullName}</td><td><button disabled={!semesterId || busy} onClick={() => void viewStudent(s)} className="text-orange-700 disabled:opacity-50">Xem điều kiện hiện tại</button></td></tr>)}</tbody></table></div>
      {students.total === 0 && <p>Chưa có sinh viên phù hợp.</p>}
      <div className="flex items-center gap-3"><button disabled={page <= 1 || loading || busy} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page}</span><button disabled={page * 20 >= students.total || loading || busy} onClick={() => setPage(p => p + 1)}>Sau</button></div>
    </>}
    {preview && <div className="space-y-2 rounded-lg border p-4">
      <button className="float-right" onClick={() => { previewRequest.current?.abort(); setPreview(null); }}>Đóng</button>
      <h3 className="font-bold">{preview.student.studentCode} — {preview.student.fullName}</h3>
      <p>Tính hiện tại: <strong>{eligibilityStatusLabel(preview.data.current.status)}</strong>. Tín chỉ đạt: {preview.data.current.earnedCredits}; còn thiếu: {preview.data.current.missingCredits ?? 'chưa xác định'}; môn còn rớt: {preview.data.current.unpassedCourseCount}.</p>
      <p>Môn còn rớt: {preview.data.current.unpassedCourses.map(c => c.courseCode).join(', ') || 'Không có'}.</p>
      <p>{preview.data.current.reasons.map(eligibilityReasonLabel).join(' ')}</p>
      {preview.data.current.academicIssues.length > 0 && <p className="text-amber-800">Dữ liệu cần đối soát: {preview.data.current.academicIssues.join(', ')}.</p>}
      <p>Kết quả chính thức: {!preview.data.official ? 'Chưa được xác nhận' : preview.data.official.isStale ? 'Đã cũ — cần xét lại' : eligibilityStatusLabel(preview.data.official.status)}.</p>
    </div>}
  </section>;
}
