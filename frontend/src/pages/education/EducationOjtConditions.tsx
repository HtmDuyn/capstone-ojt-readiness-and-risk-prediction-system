import { useEducationOjtEligibility } from '@/hooks/useEducationOjtEligibility';
import { PageBanner } from '@/components/common/PageBanner';
import { educationOjtReason } from '@/utils/educationOjtReason';
import { ojtDisplayStatusLabels, sortOjtTargets, type OjtSortDirection, type OjtSortKey } from '@/utils/educationOjtSorting';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Save, Search, ShieldCheck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const EducationOjtConditions: React.FC = () => {
  const { needsCheck, fullCheck, runNeeded, runAll, runReview, saveResults, visible, pages, checked, statusByStudent, statusCounts, targets, loading, busy, saving, error, results, savedResults, pendingResults, handoffByStudent, handoffDisplay, failures, notice, search, setSearch, filter, setFilter, handoffFilter, setHandoffFilter, setPage, currentPage, rule } = useEducationOjtEligibility();
  const [sortKey, setSortKey] = React.useState<OjtSortKey | null>(null);
  const [sortDirection, setSortDirection] = React.useState<OjtSortDirection>('asc');
  const sortedVisible = sortOjtTargets(visible, sortKey, sortDirection, { results, failures, statuses: statusByStudent });
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
    <PageBanner title="Xét điều kiện đi OJT" description="Xét sinh viên cần xét từ tín chỉ tích lũy và bảng điểm, không cần chọn năm học hoặc kỳ OJT." badge="Phòng Đào tạo" />
    <section className="space-y-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={20} className="text-orange-600" />{rule ? `Từ ${rule.minCredits} tín chỉ tích lũy, tối đa ${rule.maxUnpassedCourses} môn chưa đạt` : 'Đang tải điều kiện OJT'}</h2>
      <p className="text-sm text-slate-600">Xét sinh viên đang hoạt động; môn đã học lại đạt hoặc được công nhận không tính là chưa đạt.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => void runNeeded()} disabled={loading || busy || saving || !needsCheck.length || Boolean(error && !targets.length)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={18} />{busy ? 'Đang xét điều kiện...' : `Xét sinh viên cần xét (${needsCheck.length})`}</button>
        <button onClick={() => { if (window.confirm(`Xét lại ${fullCheck.length} sinh viên đang hoạt động, chưa bàn giao? Kết quả đã lưu chỉ thay đổi sau khi bạn nhấn Lưu kết quả.`)) void runAll(); }} disabled={loading || busy || saving || !fullCheck.length} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50">Xét lại toàn bộ</button>
        {checked.length > 0 && !busy && <button onClick={() => void saveResults()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={18} />{saving ? 'Đang lưu kết quả...' : `Lưu kết quả (${checked.length})`}</button>}
      </div>
      {!loading && targets.length > 0 && needsCheck.length === 0 && <p className="text-xs text-slate-500">Không có sinh viên mới hoặc kết quả đã cũ cần xét tự động. Sinh viên đã bàn giao được giữ nguyên.</p>}
      {!loading && targets.length > 0 && <p className="text-xs text-slate-500">Hệ thống có thể chưa phát hiện mọi thay đổi cấu hình học vụ; PĐT có thể xét lại sau đối soát khi đã bổ sung dữ liệu.</p>}
      {checked.length > 0 && <p className="text-xs text-slate-500">Chỉ {checked.length} kết quả vừa xét trong phiên này sẽ được lưu, kể cả kết quả ngoài bộ lọc đang xem. Kết quả chưa lưu sẽ mất khi tải lại hoặc rời trang.</p>}
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {showNotice && <p role="status" className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}
    </section>
    <div className="space-y-2"><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">{[
      ['Tổng sinh viên', targets.length, 'text-slate-900'], ['Đủ điều kiện', statusCounts.ELIGIBLE, 'text-emerald-700'],
      ['Chưa đủ điều kiện', statusCounts.NOT_ELIGIBLE, 'text-rose-700'], ['Cần đối soát', statusCounts.REVIEW_REQUIRED, 'text-amber-700'], ['Chưa xét', statusCounts.PENDING, 'text-slate-700'],
    ].map(([label, count, color]) => <div key={label} className="flex min-h-20 flex-col justify-between rounded-xl border bg-white px-4 py-3"><p className="text-xs leading-4 text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold leading-7 ${color}`}>{loading ? '—' : count}</p></div>)}</div>
      {!loading && visibleOtherStatuses.length > 0 && <p className="text-xs text-slate-600">Trạng thái cần lưu ý: {visibleOtherStatuses.map(([label, count]) => `${label} ${count}`).join(' · ')}.</p>}
    </div>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="space-y-3 p-4"><h2 className="font-semibold">Danh sách sinh viên và kết quả xét</h2><div className="flex w-full max-w-4xl flex-col gap-2 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} placeholder="MSSV hoặc họ tên" className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" /></label><select aria-label="Lọc kết quả OJT" value={filter} onChange={e => setFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm sm:w-48"><option value="ALL">Tất cả sinh viên</option><option value="ELIGIBLE">Đủ điều kiện</option><option value="NOT_ELIGIBLE">Chưa đủ điều kiện</option><option value="REVIEW_REQUIRED">Cần đối soát</option><option value="PENDING">Chưa xét</option><option value="ERROR">Gặp lỗi</option><option value="STALE">Cần xét lại</option><option value="INACTIVE">Không hoạt động</option></select><select aria-label="Trạng thái bàn giao" value={handoffFilter} onChange={e => setHandoffFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm sm:w-44"><option value="ALL">Tất cả bàn giao</option><option value="NOT_HANDED_OFF">Chưa bàn giao</option><option value="HANDED_OFF">Đã bàn giao</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]"><tr><th scope="col" className="w-14 px-3 py-2.5 text-xs font-semibold">STT</th>{([
        ['Mã số sinh viên', 'studentCode'], ['Họ và tên', 'fullName'], ['Khóa', 'cohort'], ['Nhóm', 'group'], ['Chương trình', 'program'], ['Tín chỉ đạt', 'credits'], ['Môn chưa đạt', 'courses'], ['Kết quả', 'status'], ['Lý do', 'reason'],
      ] as const).map(([label, key]) => <th key={key} scope="col" aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'} className={`px-3 py-2.5 text-xs font-semibold ${key === 'group' ? 'w-14' : key === 'cohort' || key === 'studentCode' ? 'w-36' : key === 'fullName' ? 'min-w-40' : ''}`}><button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{label}{sortKey === key ? sortDirection === 'asc' ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} className="text-slate-400" aria-hidden="true" />}</button></th>)}<th scope="col" className="min-w-36 px-3 py-2.5 text-xs font-semibold">Trạng thái bàn giao</th><th scope="col" className="min-w-36 px-3 py-2.5 text-xs font-semibold">Kỳ OJT</th><th scope="col" className="min-w-28 px-3 py-2.5 text-xs font-semibold">Đợt bàn giao</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{sortedVisible.slice((currentPage - 1) * 20, currentPage * 20).map((t, index) => {
        const r = results[t.student.id];
        const displayStatus = statusByStudent[t.student.id];
        const statusLabel = ojtDisplayStatusLabels[displayStatus];
        const studentHandoffs = handoffByStudent.get(t.student.id) ?? [];
        return <tr key={t.student.id} className="bg-white align-top transition-colors duration-150 hover:bg-[#EAF2FF]">
          <td className="px-3 py-2.5 tabular-nums">{(currentPage - 1) * 20 + index + 1}</td>
          <td className="whitespace-nowrap px-3 py-2.5 font-medium text-orange-700">{t.student.studentCode}</td>
          <td className="min-w-40 break-words px-3 py-2.5">{t.student.fullName}</td>
          <td className="w-36 break-words px-3 py-2.5">{t.student.cohort?.code ?? '—'}</td>
          <td className="w-14 px-3 py-2.5">{t.student.groupCode ?? '—'}</td>
          <td className="px-3 py-2.5 text-xs">{t.student.program?.code ?? '—'}</td>
          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{r?.earnedCredits ?? '—'}</td>
          <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{r?.unpassedCourseCount ?? '—'}</td>
          <td className="px-3 py-2.5"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs ${displayStatus === 'ELIGIBLE' ? 'bg-green-50 text-green-700' : displayStatus === 'NOT_ELIGIBLE' ? 'bg-red-50 text-red-700' : displayStatus === 'ERROR' ? 'bg-red-50 text-red-700' : displayStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{statusLabel}</span></td>
          <td className="min-w-48 max-w-sm whitespace-normal break-words px-3 py-2.5 text-xs leading-5 text-slate-600">{educationOjtReason(r, failures[t.student.id], t.reason)}{savedResults[t.student.id]?.status === 'REVIEW_REQUIRED' && !studentHandoffs.length && !t.reason && !busy && !saving && <button type="button" onClick={() => { if (window.confirm(`Bạn đã bổ sung dữ liệu cần đối soát cho ${t.student.studentCode} và muốn xét lại sinh viên này?`)) void runReview(t.student.id); }} className="mt-1 block text-orange-700 underline">Xét lại sau đối soát</button>}{pendingResults[t.student.id] ? <span className="mt-1 block text-blue-700">Kết quả chưa lưu</span> : savedResults[t.student.id] && <span className="mt-1 block text-emerald-700">Đã lưu kết quả</span>}</td>
          <td className="min-w-36 px-3 py-2.5 text-xs">{studentHandoffs.length ? <><span className="font-semibold text-orange-700">Đã bàn giao</span>{savedResults[t.student.id]?.isStale && <span className="mt-1 block font-medium text-amber-700">Dữ liệu đã thay đổi – cần kiểm tra</span>}</> : <span className="text-slate-500">Chưa bàn giao</span>}</td>
          <td className="min-w-36 px-3 py-2.5 text-xs">{studentHandoffs.length ? studentHandoffs.map(h => <span key={h.id} className="block break-words">{handoffDisplay.get(h.id)?.semesterName ?? '—'}</span>) : '—'}</td>
          <td className="min-w-28 px-3 py-2.5 text-xs">{studentHandoffs.length ? studentHandoffs.map(h => <span key={h.id} className="block whitespace-nowrap">Đợt {handoffDisplay.get(h.id)?.roundNumber ?? '—'}</span>) : '—'}</td>
        </tr>;
      })}{!visible.length && <tr><td colSpan={13} className="p-10 text-center text-slate-500">{loading ? 'Đang tải...' : 'Không có sinh viên phù hợp.'}</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{visible.length} sinh viên · Trang {currentPage}/{pages}</span><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div></div>
    </section>
    <p className="text-sm text-slate-500">Tra cứu tiếp tại <Link to="/education/student-status" className="text-orange-700 underline">Trạng thái sinh viên</Link>.</p>
  </div>;
};
export default EducationOjtConditions;
