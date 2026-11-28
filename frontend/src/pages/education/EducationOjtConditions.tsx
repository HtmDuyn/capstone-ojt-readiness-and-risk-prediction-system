import { OJT_ELIGIBILITY_PAGE_SIZE, useEducationOjtEligibility } from '@/hooks/education/useEducationOjtEligibility';
import { useEducationStudentCredits } from '@/hooks/education/useEducationStudentCredits';
import { PageBanner } from '@/components/common/PageBanner';
import { educationOjtReason } from '@/utils/education/educationOjtReason';
import { ojtDisplayStatusLabels, sortOjtTargets, type OjtSortDirection, type OjtSortKey } from '@/utils/education/educationOjtSorting';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Search, ShieldCheck, Eye, X } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ojtSourceLabels, type OjtSourceKey } from '@/utils/education/ojtEligibilityLoad';

const EducationOjtConditions: React.FC = () => {
  const { runAll, visible, pages, statusByStudent, statusCounts, targets, loading, retrying, dataLoaded, sourceLoaded, sourceErrors, retryFailedSources, busy, error, results, savedResults, failures, notice, search, setSearch, filter, setFilter, setPage, currentPage, rule, selectionLocked } = useEducationOjtEligibility();
  const failedSources = Object.entries(sourceErrors) as [OjtSourceKey, NonNullable<(typeof sourceErrors)[OjtSourceKey]>][];
  const [detailStudentId, setDetailStudentId] = React.useState<number | null>(null);
  const detailTarget = targets.find(target => target.student.id === detailStudentId);
  const detailSaved = detailStudentId === null ? undefined : savedResults[detailStudentId];
  React.useEffect(() => {
    if (detailStudentId === null) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDetailStudentId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailStudentId]);
  const detailResult = detailStudentId === null ? undefined : results[detailStudentId];
  const [sortKey, setSortKey] = React.useState<OjtSortKey | null>(null);
  const [sortDirection, setSortDirection] = React.useState<OjtSortDirection>('asc');
  const sortingCredits = sortKey === 'credits';
  const pageStart = (currentPage - 1) * OJT_ELIGIBILITY_PAGE_SIZE;
  const pageEnd = pageStart + OJT_ELIGIBILITY_PAGE_SIZE;
  const sortContext = React.useMemo(() => ({ results, failures, statuses: statusByStudent }), [results, failures, statusByStudent]);
  const pageOrder = React.useMemo(() =>
    sortOjtTargets(visible, sortingCredits ? null : sortKey, sortDirection, sortContext),
    [visible, sortKey, sortDirection, sortContext, sortingCredits],
  );
  const creditIds = React.useMemo(() => {
    const rows = sortingCredits ? visible : pageOrder.slice(pageStart, pageEnd);
    return [...rows.map(row => row.student.id), ...(detailStudentId === null ? [] : [detailStudentId])];
  }, [sortingCredits, visible, pageOrder, pageStart, pageEnd, detailStudentId]);
  const { credits: academicCredits, failures: creditFailures, loading: loadingCredits, retry: retryCreditFailures } = useEducationStudentCredits(creditIds);
  const sortedVisible = React.useMemo(() => sortingCredits && !loadingCredits
    ? sortOjtTargets(visible, 'credits', sortDirection, { ...sortContext, academicCredits })
    : pageOrder, [sortingCredits, loadingCredits, visible, sortDirection, sortContext, academicCredits, pageOrder]);
  const sortBy = (key: OjtSortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortKey(null); setSortDirection('asc'); }
    setPage(1);
  };
  const showNotice = notice && !/^Đã tải \d+ kết quả đã lưu\.$/.test(notice);
  const otherStatuses = [
    ['Gặp lỗi', statusCounts.ERROR], ['Cần xét lại', statusCounts.STALE], ['Không hoạt động', statusCounts.INACTIVE],
  ] as const;
  const visibleOtherStatuses = otherStatuses.filter(([, count]) => count > 0);
  return <div className="space-y-4">
    <PageBanner variant="education" title="Xét điều kiện đi OJT" description="Xét sinh viên cần xét từ tín chỉ tích lũy và bảng điểm, không cần chọn năm học hoặc kỳ OJT." badge="Phòng Đào tạo" />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ShieldCheck size={21} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quy định hiện hành</p><h2 className="mt-0.5 font-bold text-slate-900">{rule ? `${rule.minCredits} tín chỉ · phiên bản ${rule.version}` : 'Chưa có điều kiện OJT đến ngày áp dụng. Mặc định xét theo mức 70 tín chỉ'}</h2></div></div>
        <Link to="/education/ojt-policy" className="inline-flex min-h-10 items-center rounded-lg border border-orange-200 px-3.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50">Quản lý điều kiện</Link>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <p><span className="text-slate-500">Ngày áp dụng</span><strong className="ml-2 text-slate-800">{rule?.effectiveFrom.split('-').reverse().join('/') ?? '—'}</strong></p>
            <p><span className="text-slate-500">Văn bản</span><strong className="ml-2 break-words text-slate-800">{rule?.issuingDocument ?? 'Chưa cập nhật'}</strong></p>
          </div>
          <p className="max-w-4xl text-xs leading-5 text-slate-500">Tín chỉ xét theo khung chương trình, loại trừ Giáo dục thể chất, Quốc phòng – An ninh và học phần nhạc cụ.</p>
        </div>
        <button type="button" onClick={() => void runAll()} disabled={loading || busy || selectionLocked}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCircle2 size={18} />{busy ? 'Đang xét...' : 'Xét toàn bộ'}
        </button>
      </div>
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {failedSources.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-medium">Chưa tải được một số dữ liệu. Dữ liệu đã tải thành công vẫn được giữ nguyên{dataLoaded ? '.' : '; hiện chưa thể xét.'}</p><ul className="mt-2 space-y-1">{failedSources.map(([key, issue]) => <li key={key}>• {ojtSourceLabels[key]}: {issue.message}</li>)}</ul><button type="button" disabled={retrying || busy} onClick={() => void retryFailedSources()} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium hover:bg-red-100 disabled:opacity-50">{retrying ? 'Đang thử tải lại…' : 'Thử tải lại dữ liệu'}</button></div>}
      {sortingCredits && loadingCredits && <p role="status" className="text-sm text-slate-600">Đang tải tín chỉ để sắp xếp toàn bộ kết quả lọc…</p>}
      {creditFailures.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Chưa tải được tín chỉ học tập của {creditFailures.length} sinh viên từ hồ sơ. <button type="button" disabled={loadingCredits} onClick={retryCreditFailures} className="ml-2 underline disabled:opacity-50">Thử tải lại</button></div>}
      {showNotice && <p role="status" className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}
    </section>
    <div className="space-y-2"><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">{[
      ['Cần xét', targets.length, 'text-slate-900'], ['Đủ điều kiện', statusCounts.ELIGIBLE, 'text-emerald-700'],
      ['Chưa đủ điều kiện', statusCounts.NOT_ELIGIBLE, 'text-rose-700'], ['Chưa xét', statusCounts.PENDING, 'text-slate-700'],
    ].map(([label, count, color]) => <div key={label} className="flex min-h-24 flex-col justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-xs leading-4 text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold leading-7 tabular-nums ${color}`}>{loading || !sourceLoaded.students || (label !== 'Cần xét' && !sourceLoaded.results) ? '—' : count}</p></div>)}</div>
      {!loading && visibleOtherStatuses.length > 0 && <p className="text-xs text-slate-600">Trạng thái cần lưu ý: {visibleOtherStatuses.map(([label, count]) => `${label} ${count}`).join(' · ')}.</p>}
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Danh sách sinh viên</h2><p className="mt-1 text-xs text-slate-500">Kết quả xét điều kiện OJT theo hồ sơ hiện có</p></div><p className="text-sm font-medium text-slate-500">{sourceLoaded.students ? `${visible.length} kết quả` : 'Đang tải...'}</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_240px]"><label className="relative block min-w-0"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo mã sinh viên hoặc họ tên" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label><select aria-label="Lọc kết quả OJT" disabled={!sourceLoaded.students} value={filter} onChange={e => setFilter(e.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><option value="ALL">Tất cả sinh viên cần xét</option><option value="ELIGIBLE" disabled={!sourceLoaded.results}>Đủ điều kiện</option><option value="NOT_ELIGIBLE" disabled={!sourceLoaded.results}>Chưa đủ điều kiện</option><option value="REVIEW_REQUIRED" disabled={!sourceLoaded.results}>Chưa đủ dữ liệu</option><option value="PENDING" disabled={!sourceLoaded.results}>Chưa xét</option><option value="ERROR" disabled={!sourceLoaded.results}>Gặp lỗi</option><option value="STALE" disabled={!sourceLoaded.results}>Cần xét lại</option><option value="INACTIVE" disabled={!sourceLoaded.results}>Không hoạt động</option></select></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-left text-sm"><thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600"><tr><th scope="col" className="w-14 px-3 py-3 text-xs font-semibold">STT</th>{([
        ['Mã số sinh viên', 'studentCode'], ['Họ và tên', 'fullName'], ['Khóa', 'cohort'], ['Nhóm', 'group'], ['Chương trình', 'program'], ['Tín chỉ xét', 'credits'], ['Kết quả', 'status'], ['Lý do', 'reason'],
      ] as const).map(([label, key]) => <th key={key} scope="col" aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'} className={`px-3 py-2.5 text-xs font-semibold ${key === 'group' ? 'w-14' : key === 'cohort' || key === 'studentCode' ? 'w-36' : key === 'fullName' ? 'min-w-40' : ''}`}><button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{label}{sortKey === key ? sortDirection === 'asc' ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} className="text-slate-400" aria-hidden="true" />}</button></th>)}<th scope="col" className="px-3 py-2.5">Chi tiết</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{sortedVisible.slice(pageStart, pageEnd).map((t, index) => {
        const r = results[t.student.id];
        const currentCredits = r?.earnedCredits ?? academicCredits[t.student.id];
        const requiredCredits = r?.rule?.minCredits ?? rule?.minCredits ?? 70;
        const nearCreditThreshold = currentCredits != null && requiredCredits - currentCredits >= 1 && requiredCredits - currentCredits <= 3;
        const displayStatus = statusByStudent[t.student.id];
        const statusLabel = ojtDisplayStatusLabels[displayStatus];
        return <tr key={t.student.id} className={`${nearCreditThreshold ? 'bg-amber-50' : 'bg-white'} align-top transition-colors duration-150 hover:bg-[#EAF2FF]`}>
          <td className="px-3 py-2.5 tabular-nums">{pageStart + index + 1}</td>
          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-orange-700">{t.student.studentCode}</td>
          <td className="min-w-40 break-words px-3 py-2.5">{t.student.fullName}</td>
          <td className="w-36 break-words px-3 py-2.5">{t.student.cohort?.code ?? '—'}</td>
          <td className="w-14 px-3 py-2.5">{t.student.groupCode ?? '—'}</td>
          <td className="px-3 py-2.5 text-xs">{t.student.program?.code ?? '—'}</td>
          <td className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${nearCreditThreshold ? 'font-semibold text-amber-800' : ''}`} title={nearCreditThreshold ? 'Còn thiếu từ 1 đến 3 tín chỉ so với ngưỡng' : undefined}>{currentCredits ?? '—'}{(r?.rule || rule) && <span className={`block text-xs ${nearCreditThreshold ? 'font-medium text-amber-700' : 'text-slate-500'}`}>Ngưỡng {requiredCredits}</span>}</td>
          <td className="px-3 py-2.5"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs ${sourceLoaded.results && displayStatus === 'ELIGIBLE' ? 'bg-green-50 text-green-700' : sourceLoaded.results && displayStatus === 'NOT_ELIGIBLE' ? 'bg-red-50 text-red-700' : sourceLoaded.results && displayStatus === 'ERROR' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{sourceLoaded.results ? statusLabel : 'Chưa tải được kết quả'}</span></td>
          <td className="min-w-48 max-w-sm whitespace-normal break-words px-3 py-2.5 text-xs leading-5 text-slate-600">{sourceLoaded.results ? educationOjtReason(r, failures[t.student.id], t.reason) : 'Chưa tải được kết quả xét.'}{savedResults[t.student.id] && <span className="mt-1 block text-emerald-700">Đã lưu kết quả</span>}</td>

          <td className="px-3 py-2 text-center"><button type="button" title="Xem chi tiết" aria-label={`Xem chi tiết ${t.student.studentCode}`} onClick={() => setDetailStudentId(t.student.id)} className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><Eye size={18} aria-hidden="true" /></button></td>
        </tr>;
      })}{!visible.length && <tr><td colSpan={10} className="p-10 text-center text-slate-500">{loading ? 'Đang tải...' : !sourceLoaded.students ? 'Chưa tải được danh sách sinh viên.' : 'Không có sinh viên phù hợp.'}</td></tr>}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-500"><span>{sourceLoaded.students ? `Trang ${currentPage} / ${pages}` : 'Chưa tải được danh sách sinh viên'}</span><div className="flex gap-2"><button type="button" disabled={!sourceLoaded.students || currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Trước</button><button type="button" disabled={!sourceLoaded.students || currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sau</button></div></div>
    </section>
    <p className="text-sm text-slate-500">Tra cứu tiếp tại <Link to="/education/student-status" className="text-orange-700 underline">Trạng thái sinh viên</Link>.</p>
    {detailTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setDetailStudentId(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ojt-detail-title" className="flex max-h-[min(88vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/25">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">Phòng Đào tạo · Xét OJT</p><h2 id="ojt-detail-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Chi tiết sinh viên</h2><p className="mt-1 truncate text-sm text-slate-500">{detailTarget.student.studentCode} · {detailTarget.student.fullName}</p></div>
          <button type="button" aria-label="Đóng chi tiết" onClick={() => setDetailStudentId(null)} className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><X size={19} /></button>
        </header>
        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900">Thông tin sinh viên</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[["Mã sinh viên", detailTarget.student.studentCode], ["Họ và tên", detailTarget.student.fullName], ["Khóa / Nhóm", `${detailTarget.student.cohort?.code ?? 'Chưa xác nhận'} / ${detailTarget.student.groupCode ?? '—'}`], ["Mã chương trình", detailTarget.student.program?.code ?? '—'], ["Kỳ chương trình hiện tại", detailTarget.student.currentSemester == null ? 'Chưa xác nhận' : `Kỳ ${detailTarget.student.currentSemester}`]].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2.5"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd></div>)}
            </dl>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900">Thông tin học tập</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(() => { const current = detailResult?.earnedCredits ?? academicCredits[detailTarget.student.id]; const required = detailResult?.rule?.minCredits ?? rule?.minCredits; const gap = current != null && required != null ? required - current : null; const near = gap != null && gap >= 1 && gap <= 3; return <div className={`rounded-lg border p-3 ${near ? 'border-amber-200 bg-amber-50' : 'border-orange-100 bg-orange-50/70'}`}><p className="text-xs font-medium leading-5 text-slate-600">Tín chỉ dùng để xét</p><p className={`mt-1 text-2xl font-bold tabular-nums ${near ? 'text-amber-800' : 'text-orange-700'}`}>{current ?? '—'} <span className="text-sm font-semibold">tín chỉ</span></p><p className={`mt-1 text-xs ${near ? 'text-amber-700' : 'text-slate-500'}`}>{near ? `Còn thiếu ${gap} tín chỉ` : 'Đã loại trừ nhóm không tính'}</p></div>; })()}
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Ngưỡng áp dụng</p><p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{detailResult?.rule?.minCredits ?? '—'} <span className="text-sm font-semibold">tín chỉ</span></p><p className="mt-1 break-words text-xs text-slate-500">{detailResult?.rule ? detailResult.rule.issuingDocument ?? `Phiên bản ${detailResult.rule.version ?? '—'}` : 'Chưa có dữ liệu điều kiện'}</p></div>
            </div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">Kết quả xét hiện hành</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusByStudent[detailTarget.student.id] === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800' : statusByStudent[detailTarget.student.id] === 'NOT_ELIGIBLE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{!sourceLoaded.results ? 'Chưa tải kết quả' : ojtDisplayStatusLabels[statusByStudent[detailTarget.student.id]]}</span></div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2.5"><dt className="text-xs font-medium text-slate-500">Kết quả đã lưu</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{!sourceLoaded.results ? 'Chưa tải được kết quả' : detailSaved ? ojtDisplayStatusLabels[detailSaved.isStale ? 'STALE' : detailSaved.status] : 'Chưa xét'}</dd></div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5"><dt className="text-xs font-medium text-slate-500">Tình trạng lưu</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{detailSaved ? 'Đã lưu kết quả' : 'Chưa có kết quả đã lưu'}</dd></div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 sm:col-span-2"><dt className="text-xs font-medium text-slate-500">Lý do chi tiết</dt><dd className="mt-1 text-sm leading-6 text-slate-800">{educationOjtReason(detailResult, failures[detailTarget.student.id], detailTarget.reason)}</dd></div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 sm:col-span-2"><dt className="text-xs font-medium text-slate-500">Thời gian xét</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{detailResult?.checkedAt ? new Date(detailResult.checkedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu xác nhận'}</dd></div>
            </dl>
          </section>
        </div>
        <footer className="flex justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-7"><button type="button" onClick={() => setDetailStudentId(null)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">Đóng</button></footer>
      </div>
    </div>}
  </div>;
};
export default EducationOjtConditions;
