import { useEducationOjtEligibility } from '@/hooks/useEducationOjtEligibility';
import { PageBanner } from '@/components/common/PageBanner';
import { eligibilityStatusLabel } from '@/utils/educationEligibility';
import { CheckCircle2, RefreshCw, Save, Search, ShieldCheck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const EducationOjtConditions: React.FC = () => {
  const { ready, runAll, saveResults, visible, pages, checked, currentResults, targets, loading, busy, saving, savedCount, error, setRevision, results, failures, notice, search, setSearch, filter, setFilter, setPage, currentPage } = useEducationOjtEligibility();
  return <div className="space-y-6">
    <PageBanner title="Xét điều kiện đi OJT" description="Xét trực tiếp từ tín chỉ tích lũy và bảng điểm của tất cả sinh viên, không cần chọn năm học hoặc kỳ OJT." badge="Phòng Đào tạo" />
    <section className="space-y-4 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={20} className="text-orange-600" />Từ 70 tín chỉ tích lũy, tối đa 2 môn chưa đạt</h2>
      <p className="text-sm text-slate-600">FE tự xét sinh viên đang hoạt động ở tất cả khóa và chương trình. Môn đã học lại đạt hoặc được công nhận không tính là môn còn rớt. Kết quả không có ô chỉnh sửa.</p>
      <div className="flex flex-wrap gap-3">
        {checked.length > 0 && !busy && <button onClick={() => void saveResults()} disabled={saving || savedCount !== null} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={18} />{saving ? 'Đang lưu kết quả...' : savedCount !== null ? 'Đã lưu kết quả' : 'Lưu kết quả'}</button>}
        <button onClick={() => void runAll()} disabled={loading || busy || saving || !ready.length} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={18} />{busy ? 'Đang xét điều kiện...' : Object.keys(failures).length ? 'Thử xét lại' : 'Xét điều kiện OJT tất cả sinh viên'}</button>
        <button disabled={busy || saving || loading} onClick={() => setRevision(v => v + 1)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm disabled:opacity-50"><RefreshCw size={16} />Tải lại danh sách</button>
      </div>
      <p className="text-xs text-slate-500">{savedCount !== null ? 'Kết quả đã được backend xác nhận lưu vào hệ thống.' : 'Sau khi xét xong, bấm Lưu kết quả để lưu toàn bộ kết quả đã tính, kể cả kết quả ngoài bộ lọc đang xem. Kết quả chưa lưu sẽ mất khi tải lại hoặc rời trang.'}</p>
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
    </section>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
      ['Tổng sinh viên', targets.length], ['Đủ điều kiện', currentResults.filter(r => r.status === 'ELIGIBLE').length],
      ['Chưa đủ điều kiện', currentResults.filter(r => r.status === 'NOT_ELIGIBLE').length], ['Cần đối soát', currentResults.filter(r => r.status === 'REVIEW_REQUIRED').length], ['Chưa xét / gặp lỗi', targets.length - currentResults.length],
    ].map(([label, count]) => <div key={label} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '—' : count}</p></div>)}</div>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="font-semibold">Danh sách sinh viên và kết quả xét</h2><div className="flex flex-wrap gap-2"><label className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm sinh viên" value={search} onChange={e => setSearch(e.target.value)} placeholder="MSSV hoặc họ tên" className="rounded-lg border py-2 pl-9 pr-3 text-sm" /></label><select aria-label="Lọc kết quả OJT" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border p-2 text-sm"><option value="ALL">Tất cả sinh viên</option><option value="ELIGIBLE">Đủ điều kiện</option><option value="NOT_ELIGIBLE">Chưa đủ điều kiện</option><option value="REVIEW_REQUIRED">Cần đối soát</option><option value="PENDING">Chưa xét / gặp lỗi</option></select></div></div>
      <div className="overflow-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]"><tr>{['Sinh viên', 'Khóa / Nhóm', 'Chương trình', 'Tín chỉ đạt', 'Môn chưa đạt', 'Kết quả', 'Lý do'].map(h => <th key={h} className="px-4 py-3 text-xs font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{visible.slice((currentPage - 1) * 20, currentPage * 20).map(t => {
        const r = results[t.student.id];
        return <tr key={t.student.id} className="bg-white align-top transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="px-4 py-3"><strong>{t.student.fullName}</strong><p className="mt-1 text-xs text-orange-700">{t.student.studentCode}</p></td><td className="px-4 py-3">{t.student.cohort?.code ?? '—'} / {t.student.groupCode ?? '—'}</td><td className="px-4 py-3 text-xs">{t.student.program?.code ?? '—'}</td><td className="px-4 py-3">{r?.earnedCredits ?? '—'}</td><td className="px-4 py-3">{r?.unpassedCourseCount ?? '—'}</td><td className="px-4 py-3"><span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs ${!r?.isStale && r?.status === 'ELIGIBLE' ? 'bg-green-50 text-green-700' : !r?.isStale && r?.status === 'NOT_ELIGIBLE' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{r?.isStale ? 'Cần xét lại' : r ? eligibilityStatusLabel(r.status) : failures[t.student.id] ? 'Gặp lỗi' : 'Chưa xét'}</span></td><td className="max-w-xs px-4 py-3 text-xs text-slate-600">{failures[t.student.id] || t.reason || (r?.isStale ? 'Dữ liệu học vụ đã thay đổi sau lần xét; cần xét lại.' : '') || (r ? [...r.reasons, ...r.academicIssues].join(' ') || 'Đạt điều kiện.' : 'Chờ chạy xét điều kiện.')}</td></tr>;
      })}{!visible.length && <tr><td colSpan={7} className="p-10 text-center text-slate-500">{loading ? 'Đang tải...' : 'Không có sinh viên phù hợp.'}</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{visible.length} sinh viên · Trang {currentPage}/{pages}</span><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div></div>
    </section>
    <p className="text-sm text-slate-500">Tra cứu tiếp tại <Link to="/education/student-status" className="text-orange-700 underline">Trạng thái sinh viên</Link>.</p>
  </div>;
};
export default EducationOjtConditions;
