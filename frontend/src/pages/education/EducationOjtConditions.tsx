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
  const eligibleCount = targets.filter(({ student }) => savedResults[student.id]?.status === 'ELIGIBLE').length;
  return <div className="space-y-4">
    <PageBanner title="Xét điều kiện đi OJT" description="Xét sinh viên cần xét từ tín chỉ tích lũy và bảng điểm, không cần chọn năm học hoặc kỳ OJT." badge="Phòng Đào tạo" />
    <section className="space-y-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={20} className="text-orange-600" />{rule ? `Điều kiện đang áp dụng: ${rule.minCredits} tín chỉ · phiên bản ${rule.version}` : 'Chưa có điều kiện OJT đến ngày áp dụng'}</h2>
      <div className="flex flex-wrap items-end gap-3">
        {rule && <p className="text-sm text-slate-600">Ngày bắt đầu áp dụng {rule.effectiveFrom.split('-').reverse().join('/')}</p>}
        <Link to="/education/ojt-policy" className="px-2 py-2 text-sm font-medium text-orange-700 underline">Quản lý điều kiện</Link>
      </div>
      {rule?.issuingDocument && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Văn bản ban hành: {rule.issuingDocument}</p>}
      <p className="text-sm text-slate-600">Tín chỉ xét lấy theo khung chương trình, loại trừ Giáo dục thể chất, Quốc phòng – An ninh và học phần nhạc cụ. Hệ thống tự xét theo ngày kết thúc đã lưu của Block 10, Block 3 và học kỳ. Có thể dùng nút xét để chạy thủ công khi cần.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void runAll()} disabled={loading || busy || selectionLocked}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
          <CheckCircle2 size={18} />{busy ? 'Đang xét điều kiện...' : 'Xét toàn bộ sinh viên'}
        </button>
      </div>
      {!loading && targets.length > 0 && <p className="text-xs text-slate-500">Hệ thống có thể chưa phát hiện mọi thay đổi cấu hình học vụ; PĐT có thể xét lại sau đối soát khi đã bổ sung dữ liệu.</p>}
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {failedSources.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-medium">Chưa tải được một số dữ liệu. Dữ liệu đã tải thành công vẫn được giữ nguyên{dataLoaded ? '.' : '; hiện chưa thể xét.'}</p><ul className="mt-2 space-y-1">{failedSources.map(([key, issue]) => <li key={key}>• {ojtSourceLabels[key]}: {issue.message}</li>)}</ul><button type="button" disabled={retrying || busy} onClick={() => void retryFailedSources()} className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium hover:bg-red-100 disabled:opacity-50">{retrying ? 'Đang thử tải lại…' : 'Thử tải lại dữ liệu'}</button></div>}
      {sortingCredits && loadingCredits && <p role="status" className="text-sm text-slate-600">Đang tải tín chỉ để sắp xếp toàn bộ kết quả lọc…</p>}
      {creditFailures.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Chưa tải được tín chỉ học tập của {creditFailures.length} sinh viên từ hồ sơ. <button type="button" disabled={loadingCredits} onClick={retryCreditFailures} className="ml-2 underline disabled:opacity-50">Thử tải lại</button></div>}
      {showNotice && <p role="status" className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}
    </section>
    <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-white px-4 py-3 text-sm"><span>Đủ điều kiện đã lưu: <strong>{sourceLoaded.results && sourceLoaded.students ? eligibleCount : '—'}</strong></span></section>
    <div className="space-y-2"><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">{[
      ['Tổng sinh viên', targets.length, 'text-slate-900'], ['Đủ điều kiện', statusCounts.ELIGIBLE, 'text-emerald-700'],
      ['Chưa đủ điều kiện', statusCounts.NOT_ELIGIBLE, 'text-rose-700'], ['Cần đối soát', statusCounts.REVIEW_REQUIRED, 'text-amber-700'], ['Chưa xét', statusCounts.PENDING, 'text-slate-700'],
    ].map(([label, count, color]) => <div key={label} className="flex min-h-20 flex-col justify-between rounded-xl border bg-white px-4 py-3"><p className="text-xs leading-4 text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold leading-7 ${color}`}>{loading || !sourceLoaded.students || (label !== 'Tổng sinh viên' && !sourceLoaded.results) ? '—' : count}</p></div>)}</div>
      {!loading && visibleOtherStatuses.length > 0 && <p className="text-xs text-slate-600">Trạng thái cần lưu ý: {visibleOtherStatuses.map(([label, count]) => `${label} ${count}`).join(' · ')}.</p>}
    </div>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="space-y-3 p-4"><h2 className="font-semibold">Danh sách sinh viên và kết quả xét</h2><div className="flex w-full max-w-4xl flex-col gap-2 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} placeholder="MSSV hoặc họ tên" className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" /></label><select aria-label="Lọc kết quả OJT" disabled={!sourceLoaded.results} value={filter} onChange={e => setFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm sm:w-48"><option value="ALL">Tất cả sinh viên</option><option value="ELIGIBLE">Đủ điều kiện</option><option value="NOT_ELIGIBLE">Chưa đủ điều kiện</option><option value="REVIEW_REQUIRED">Cần đối soát</option><option value="PENDING">Chưa xét</option><option value="ERROR">Gặp lỗi</option><option value="STALE">Cần xét lại</option><option value="INACTIVE">Không hoạt động</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]"><tr><th scope="col" className="w-14 px-3 py-2.5 text-xs font-semibold">STT</th>{([
        ['Mã số sinh viên', 'studentCode'], ['Họ và tên', 'fullName'], ['Khóa', 'cohort'], ['Nhóm', 'group'], ['Chương trình', 'program'], ['Tín chỉ xét', 'credits'], ['Kết quả', 'status'], ['Lý do', 'reason'],
      ] as const).map(([label, key]) => <th key={key} scope="col" aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'} className={`px-3 py-2.5 text-xs font-semibold ${key === 'group' ? 'w-14' : key === 'cohort' || key === 'studentCode' ? 'w-36' : key === 'fullName' ? 'min-w-40' : ''}`}><button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{label}{sortKey === key ? sortDirection === 'asc' ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} className="text-slate-400" aria-hidden="true" />}</button></th>)}<th scope="col" className="px-3 py-2.5">Chi tiết</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{sortedVisible.slice(pageStart, pageEnd).map((t, index) => {
        const r = results[t.student.id];
        const displayStatus = statusByStudent[t.student.id];
        const statusLabel = ojtDisplayStatusLabels[displayStatus];
        return <tr key={t.student.id} className="bg-white align-top transition-colors duration-150 hover:bg-[#EAF2FF]">
          <td className="px-3 py-2.5 tabular-nums">{pageStart + index + 1}</td>
          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-orange-700">{t.student.studentCode}</td>
          <td className="min-w-40 break-words px-3 py-2.5">{t.student.fullName}</td>
          <td className="w-36 break-words px-3 py-2.5">{t.student.cohort?.code ?? '—'}</td>
          <td className="w-14 px-3 py-2.5">{t.student.groupCode ?? '—'}</td>
          <td className="px-3 py-2.5 text-xs">{t.student.program?.code ?? '—'}</td>
          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{r?.earnedCredits ?? academicCredits[t.student.id] ?? '—'}{r?.rule && <span className="block text-xs text-slate-500">Ngưỡng {r.rule.minCredits}</span>}</td>
          <td className="px-3 py-2.5"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs ${sourceLoaded.results && displayStatus === 'ELIGIBLE' ? 'bg-green-50 text-green-700' : sourceLoaded.results && displayStatus === 'NOT_ELIGIBLE' ? 'bg-red-50 text-red-700' : sourceLoaded.results && displayStatus === 'ERROR' ? 'bg-red-50 text-red-700' : sourceLoaded.results && displayStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{sourceLoaded.results ? statusLabel : 'Chưa tải được kết quả'}</span></td>
          <td className="min-w-48 max-w-sm whitespace-normal break-words px-3 py-2.5 text-xs leading-5 text-slate-600">{sourceLoaded.results ? educationOjtReason(r, failures[t.student.id], t.reason) : 'Chưa tải được kết quả xét.'}{savedResults[t.student.id] && <span className="mt-1 block text-emerald-700">Đã lưu kết quả</span>}</td>

          <td className="px-3 py-2 text-center"><button type="button" title="Xem chi tiết" aria-label={`Xem chi tiết ${t.student.studentCode}`} onClick={() => setDetailStudentId(t.student.id)} className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><Eye size={18} aria-hidden="true" /></button></td>
        </tr>;
      })}{!visible.length && <tr><td colSpan={10} className="p-10 text-center text-slate-500">{loading ? 'Đang tải...' : !sourceLoaded.students ? 'Chưa tải được danh sách sinh viên.' : 'Không có sinh viên phù hợp.'}</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{sourceLoaded.students ? `${visible.length} sinh viên · Trang ${currentPage}/${pages}` : 'Chưa tải được danh sách sinh viên'}</span><div className="flex gap-2"><button disabled={!sourceLoaded.students || currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={!sourceLoaded.students || currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div></div>
    </section>
    <p className="text-sm text-slate-500">Tra cứu tiếp tại <Link to="/education/student-status" className="text-orange-700 underline">Trạng thái sinh viên</Link>.</p>
    {detailTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3" onMouseDown={event => { if (event.target === event.currentTarget) setDetailStudentId(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ojt-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3"><h2 id="ojt-detail-title" className="text-lg font-bold text-slate-900">Chi tiết xét điều kiện OJT</h2><button type="button" aria-label="Đóng chi tiết" onClick={() => setDetailStudentId(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="space-y-5 text-sm">
          <section><h3 className="mb-2 font-semibold text-slate-900">Thông tin sinh viên</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Mã sinh viên</dt><dd>{detailTarget.student.studentCode}</dd></div><div><dt className="text-slate-500">Họ và tên</dt><dd>{detailTarget.student.fullName}</dd></div>
            <div><dt className="text-slate-500">Khóa / Nhóm</dt><dd>{detailTarget.student.cohort?.code ?? 'Chưa có dữ liệu xác nhận'} / {detailTarget.student.groupCode ?? 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Mã khung chương trình</dt><dd>{detailTarget.student.program?.code ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Kỳ chương trình hiện tại</dt><dd>{detailTarget.student.currentSemester == null ? 'Chưa có dữ liệu xác nhận' : `Kỳ ${detailTarget.student.currentSemester}`}</dd></div>
          </dl></section>
          <section><h3 className="mb-2 font-semibold text-slate-900">Thông tin học tập</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Tín chỉ dùng để xét (đã loại trừ nhóm không tính)</dt><dd>{detailResult?.earnedCredits ?? academicCredits[detailTarget.student.id] ?? 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Điều kiện đã áp dụng</dt><dd>{detailResult?.rule ? `${detailResult.rule.minCredits} tín chỉ · ${detailResult.rule.issuingDocument ?? `Phiên bản ${detailResult.rule.version ?? '—'}`}` : 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Ngưỡng tín chỉ đã dùng</dt><dd>{detailResult?.rule?.minCredits ?? '—'}</dd></div>
          </dl></section>
          <section><h3 className="mb-2 font-semibold text-slate-900">Kết quả xét hiện hành</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Kết quả đã lưu</dt><dd>{!sourceLoaded.results ? 'Chưa tải được kết quả xét' : detailSaved ? ojtDisplayStatusLabels[detailSaved.isStale ? 'STALE' : detailSaved.status] : 'Chưa xét'}</dd></div>
            <div><dt className="text-slate-500">Kết quả đang hiển thị</dt><dd>{!sourceLoaded.results ? 'Chưa tải được kết quả xét' : ojtDisplayStatusLabels[statusByStudent[detailTarget.student.id]]}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Lý do chi tiết</dt><dd>{educationOjtReason(detailResult, failures[detailTarget.student.id], detailTarget.reason)}</dd></div>
            <div><dt className="text-slate-500">Thời gian xét</dt><dd>{detailResult?.checkedAt ? new Date(detailResult.checkedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Tình trạng lưu</dt><dd>{detailSaved ? 'Đã lưu kết quả' : 'Chưa có kết quả đã lưu'}</dd></div>
          </dl></section>
        </div>
      </div>
    </div>}
  </div>;
};
export default EducationOjtConditions;
