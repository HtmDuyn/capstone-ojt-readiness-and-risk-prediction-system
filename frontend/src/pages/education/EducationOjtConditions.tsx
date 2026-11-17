import { useEducationOjtResults } from '@/hooks/useEducationOjtResults';
import { PageBanner } from '@/components/common/PageBanner';
import { educationOjtReason } from '@/utils/educationOjtReason';
import { ojtDisplayStatusLabels, sortOjtTargets, type OjtSortDirection, type OjtSortKey } from '@/utils/educationOjtSorting';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Search, X } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const EducationOjtConditions: React.FC = () => {
  const { visible, pages, statusByStudent, statusCounts, targets, loading, error, savedResults, handoffByStudent, handoffDisplay, search, setSearch, filter, setFilter, handoffFilter, setHandoffFilter, setPage, currentPage } = useEducationOjtResults();
  const failures: Record<number, string> = {};
  const [sortKey, setSortKey] = React.useState<OjtSortKey | null>(null);
  const [sortDirection, setSortDirection] = React.useState<OjtSortDirection>('asc');
  const [detailStudentId, setDetailStudentId] = React.useState<number | null>(null);
  const detailTarget = targets.find(target => target.student.id === detailStudentId);
  const detailSaved = detailStudentId === null ? undefined : savedResults[detailStudentId];
  const detailHandoffs = detailStudentId === null ? [] : handoffByStudent.get(detailStudentId) ?? [];
  React.useEffect(() => {
    if (detailStudentId === null) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDetailStudentId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailStudentId]);
  const sortedVisible = sortOjtTargets(visible, sortKey, sortDirection, { results: savedResults, failures, statuses: statusByStudent });
  const sortBy = (key: OjtSortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortKey(null); setSortDirection('asc'); }
    setPage(1);
  };
  const otherStatuses = [
    ['Gặp lỗi', statusCounts.ERROR], ['Cần xét lại', statusCounts.STALE], ['Không hoạt động', statusCounts.INACTIVE],
  ] as const;
  const visibleOtherStatuses = otherStatuses.filter(([, count]) => count > 0);
  const checkedTimes = Object.values(savedResults).map(result => Date.parse(result.checkedAt)).filter(Number.isFinite);
  const latestCheckedAt = checkedTimes.length ? new Date(Math.max(...checkedTimes)).toLocaleString('vi-VN') : null;
  return <div className="space-y-4">
    <PageBanner title="Kết quả xét điều kiện OJT" description="Theo dõi kết quả xét điều kiện thực tập và các hồ sơ cần đối soát." badge="Phòng Đào tạo" />
    <main className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <section className="space-y-2 border-b border-slate-200 pb-3">
      <p className="text-sm text-amber-800">Chức năng xét tự động đang được hoàn thiện.</p>
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
    <div className="space-y-2"><div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">{[
      ['Tổng sinh viên', targets.length, 'text-slate-900'], ['Đủ điều kiện', statusCounts.ELIGIBLE, 'text-emerald-700'],
      ['Chưa đủ điều kiện', statusCounts.NOT_ELIGIBLE, 'text-rose-700'], ['Cần đối soát', statusCounts.REVIEW_REQUIRED, 'text-amber-700'], ['Chưa xét', statusCounts.PENDING, 'text-slate-700'],
    ].map(([label, count, color]) => <div key={label} className="flex min-h-20 flex-col justify-between rounded-xl border bg-white px-4 py-3"><p className="text-xs leading-4 text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold leading-7 ${color}`}>{loading ? '—' : count}</p></div>)}</div>
      {!loading && visibleOtherStatuses.length > 0 && <p className="text-xs text-slate-600">Trạng thái cần lưu ý: {visibleOtherStatuses.map(([label, count]) => `${label} ${count}`).join(' · ')}.</p>}
    </div>
    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
      {latestCheckedAt && <span>Lần xét gần nhất: {latestCheckedAt}</span>}
      <span>Số hồ sơ cần đối soát: {loading ? '—' : statusCounts.REVIEW_REQUIRED}</span>
    </div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="space-y-3 p-4"><h2 className="font-semibold">Danh sách sinh viên và kết quả xét</h2><div className="flex w-full max-w-4xl flex-col gap-2 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} placeholder="MSSV hoặc họ tên" className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" /></label><select aria-label="Lọc kết quả OJT" value={filter} onChange={e => setFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm sm:w-48"><option value="ALL">Tất cả sinh viên</option><option value="ELIGIBLE">Đủ điều kiện</option><option value="NOT_ELIGIBLE">Chưa đủ điều kiện</option><option value="REVIEW_REQUIRED">Cần đối soát</option><option value="PENDING">Chưa xét</option><option value="ERROR">Gặp lỗi</option><option value="STALE">Cần xét lại</option><option value="INACTIVE">Không hoạt động</option></select><select aria-label="Trạng thái bàn giao" value={handoffFilter} onChange={e => setHandoffFilter(e.target.value)} className="w-full rounded-lg border p-2 text-sm sm:w-44"><option value="ALL">Tất cả bàn giao</option><option value="NOT_HANDED_OFF">Chưa bàn giao</option><option value="HANDED_OFF">Đã bàn giao</option></select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]"><tr><th scope="col" className="w-12 px-3 py-2.5 text-xs font-semibold">STT</th>{([
        ['Mã sinh viên', 'studentCode', 'w-32'], ['Họ và tên', 'fullName', 'w-44'], ['Kỳ chương trình', 'semester', 'w-32'], ['Tín chỉ tích lũy', 'credits', 'w-32'], ['Môn chưa đạt', 'courses', 'w-28'], ['Kết quả xét', 'status', 'w-36'],
      ] as const).map(([label, key, width]) => <th key={key} scope="col" aria-sort={sortKey === key ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'} className={`px-3 py-2.5 text-xs font-semibold ${width}`}><button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 text-left hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{label}{sortKey === key ? sortDirection === 'asc' ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" /> : <ArrowUpDown size={13} className="text-slate-400" aria-hidden="true" />}</button></th>)}<th scope="col" className="w-20 px-3 py-2.5 text-center text-xs font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{sortedVisible.slice((currentPage - 1) * 20, currentPage * 20).map((t, index) => {
        const r = savedResults[t.student.id];
        const displayStatus = statusByStudent[t.student.id];
        const statusLabel = ojtDisplayStatusLabels[displayStatus];
        return <tr key={t.student.id} className="h-12 bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
          <td className="px-3 py-2 tabular-nums">{(currentPage - 1) * 20 + index + 1}</td>
          <td className="truncate px-3 py-2 font-medium text-orange-700" title={t.student.studentCode}>{t.student.studentCode}</td>
          <td className="truncate px-3 py-2" title={t.student.fullName}>{t.student.fullName}</td>
          <td className="px-3 py-2">{t.student.currentSemester == null ? '—' : `Kỳ ${t.student.currentSemester}`}</td>
          <td className="px-3 py-2 tabular-nums">{r?.earnedCredits ?? '—'}</td>
          <td className="px-3 py-2 tabular-nums">{r?.unpassedCourseCount ?? '—'}</td>
          <td className="px-3 py-2"><span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${displayStatus === 'ELIGIBLE' ? 'bg-green-100 text-green-800' : displayStatus === 'NOT_ELIGIBLE' || displayStatus === 'ERROR' ? 'bg-red-100 text-red-800' : displayStatus === 'REVIEW_REQUIRED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel}</span></td>
          <td className="px-3 py-2 text-center"><button type="button" title="Xem chi tiết" aria-label={`Xem chi tiết ${t.student.studentCode}`} onClick={() => setDetailStudentId(t.student.id)} className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><Eye size={18} aria-hidden="true" /></button></td>
        </tr>;
      })}{!visible.length && <tr><td colSpan={8} className="p-10 text-center text-slate-500">{loading ? 'Đang tải...' : 'Không có sinh viên phù hợp.'}</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{visible.length} sinh viên · Trang {currentPage}/{pages}</span><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div></div>
    </section>
    </main>
    {detailTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3" onMouseDown={event => { if (event.target === event.currentTarget) setDetailStudentId(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ojt-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3"><h2 id="ojt-detail-title" className="text-lg font-bold text-slate-900">Chi tiết xét điều kiện OJT</h2><button type="button" aria-label="Đóng chi tiết" onClick={() => setDetailStudentId(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="space-y-5 text-sm">
          <section><h3 className="mb-2 font-semibold text-slate-900">Thông tin sinh viên</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Mã sinh viên</dt><dd>{detailTarget.student.studentCode}</dd></div><div><dt className="text-slate-500">Họ và tên</dt><dd>{detailTarget.student.fullName}</dd></div>
            <div><dt className="text-slate-500">Khóa / Nhóm</dt><dd>{detailTarget.student.cohort?.code ?? 'Chưa có dữ liệu xác nhận'} / {detailTarget.student.groupCode ?? 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Mã khung chương trình</dt><dd>Chưa có dữ liệu xác nhận</dd></div>
            <div><dt className="text-slate-500">Kỳ chương trình hiện tại</dt><dd>{detailTarget.student.currentSemester == null ? 'Chưa có dữ liệu xác nhận' : `Kỳ ${detailTarget.student.currentSemester}`}</dd></div>
          </dl></section>
          <section><h3 className="mb-2 font-semibold text-slate-900">Thông tin học tập</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Tín chỉ tích lũy</dt><dd>{detailSaved?.earnedCredits ?? 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Số môn chưa đạt</dt><dd>{detailSaved?.unpassedCourseCount ?? 'Chưa có dữ liệu xác nhận'}</dd></div>
          </dl></section>
          <section><h3 className="mb-2 font-semibold text-slate-900">Kết quả xét hiện hành</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-slate-500">Kết quả đã lưu</dt><dd>{detailSaved ? ojtDisplayStatusLabels[detailSaved.isStale ? 'STALE' : detailSaved.status] : 'Chưa xét'}</dd></div>
            <div><dt className="text-slate-500">Kết quả đang hiển thị</dt><dd>{ojtDisplayStatusLabels[statusByStudent[detailTarget.student.id]]}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Lý do chi tiết</dt><dd>{educationOjtReason(detailSaved, failures[detailTarget.student.id], detailTarget.reason)}</dd></div>
            <div><dt className="text-slate-500">Thời gian xét</dt><dd>{detailSaved?.checkedAt ? new Date(detailSaved.checkedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu xác nhận'}</dd></div>
            <div><dt className="text-slate-500">Tình trạng lưu</dt><dd>{detailSaved ? 'Đã lưu kết quả' : 'Chưa có kết quả đã lưu'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Bàn giao</dt><dd>{detailHandoffs.length ? detailHandoffs.map(h => <span key={h.id} className="block">Đã bàn giao · {handoffDisplay.get(h.id)?.semesterName ?? 'Chưa có dữ liệu xác nhận'} · Đợt {handoffDisplay.get(h.id)?.roundNumber ?? '—'}</span>) : 'Chưa bàn giao'}</dd></div>
          </dl></section>
          <section className="rounded-xl bg-amber-50 p-3"><h3 className="mb-2 font-semibold text-amber-900">Thông tin cần xác minh theo quy trình mới</h3><dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2"><div><dt>Hoàn tất kỳ 5 và nhập đủ điểm</dt><dd className="font-medium">Chưa có dữ liệu xác nhận</dd></div><div><dt>Tổng tín chỉ môn chưa đạt</dt><dd className="font-medium">Chưa có dữ liệu xác nhận</dd></div></dl><p className="mt-2 text-amber-900">Kết quả xét hiện hành chưa xác nhận đầy đủ các điều kiện bàn giao mới.</p></section>
        </div>
      </div>
    </div>}
    <p className="text-sm text-slate-500">Tra cứu tiếp tại <Link to="/education/student-progress" className="text-orange-700 underline">Theo dõi tiến độ học tập</Link>.</p>
  </div>;
};
export default EducationOjtConditions;
