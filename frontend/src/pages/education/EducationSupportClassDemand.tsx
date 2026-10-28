import { PageBanner } from "@/components/common/PageBanner";
import { academicReportingService as reports } from '@/services/academicReporting.service';
import type { Cohort, DemandReport, ReportPeriod, ReportScope } from '@/types/education/reporting.types';
import { downloadCourseDemand } from '@/utils/downloadFile';
import React from "react";
const EducationSupportClassDemand: React.FC = () => {
  const [periods, setPeriods] = React.useState<ReportPeriod[]>([]);
  const [cohorts, setCohorts] = React.useState<Cohort[]>([]);
  const [periodId, setPeriodId] = React.useState('');
  const [semesterId, setSemesterId] = React.useState('');
  const [cohortId, setCohortId] = React.useState('');
  const [includeInProgress, setIncludeInProgress] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const [data, setData] = React.useState<DemandReport | null>(null);
  const [catalogLoading, setCatalogLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState('');
  const [error, setError] = React.useState('');
  const [exportError, setExportError] = React.useState('');
  const scope = React.useMemo<ReportScope>(() => ({
    ...(periodId ? { academicPeriodId: Number(periodId) } : {}), ...(semesterId ? { ojtSemesterId: Number(semesterId) } : {}),
    ...(cohortId ? { cohortId: Number(cohortId) } : {}),
  }), [periodId, semesterId, cohortId]);
  React.useEffect(() => {
    const c = new AbortController();
    setCatalogLoading(true); setCatalogError('');
    Promise.all([reports.periods(c.signal), reports.cohorts(c.signal)])
      .then(([p, rows]) => { if (!c.signal.aborted) { setPeriods(p); setCohorts(rows); } })
      .catch(e => { if (!c.signal.aborted) setCatalogError(e.message); })
      .finally(() => { if (!c.signal.aborted) setCatalogLoading(false); });
    return () => c.abort();
  }, [refresh]);
  React.useEffect(() => {
    const c = new AbortController();
    setData(null); setError(''); setExportError(''); setLoading(true);
    reports.courseDemand(scope, page, includeInProgress, c.signal)
      .then(r => { if (!c.signal.aborted) setData(r); })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [scope, page, includeInProgress, refresh]);
  async function exportReport() {
    if (exporting) return;
    setExporting(true); setExportError('');
    try { downloadCourseDemand(await reports.exportCourseDemand(scope, includeInProgress)); }
    catch (e) { setExportError(e instanceof Error ? e.message : 'Không xuất được báo cáo.'); }
    finally { setExporting(false); }
  }
  return (
  <div className="space-y-6">
    <PageBanner
      title="Nhu cầu lớp hỗ trợ"
      description="Thống kê số sinh viên chưa hoàn thành các học phần theo lộ trình chương trình đào tạo, giúp Phòng Đào tạo xem xét nhu cầu tổ chức lớp học bổ sung hoặc lớp học lại."
      badge="Phòng Đào tạo"
    />
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">Số liệu dùng để tham khảo nhu cầu hỗ trợ học tập, không đồng nghĩa với số sinh viên chắc chắn đăng ký học và không phải quyết định mở lớp.</p>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Kỳ đánh giá học tập" className="rounded border p-2" disabled={catalogLoading} value={periodId} onChange={e => { setPeriodId(e.target.value); setPage(1); }}>
          <option value="">Tất cả kỳ đánh giá học tập</option>
          {periods.map(p => <option key={p.id} value={p.id}>{p.periodCode} — {p.name}</option>)}
        </select>
        <select aria-label="Kỳ OJT mục tiêu" className="rounded border p-2" disabled={catalogLoading} value={semesterId} onChange={e => { setSemesterId(e.target.value); setPage(1); }}>
          <option value="">Tất cả kỳ OJT mục tiêu</option>
          {periods.filter(p => p.ojt).map(p => <option key={p.ojt!.id} value={p.ojt!.id}>{p.ojt!.semesterCode} — {p.ojt!.name}</option>)}
        </select>
        <select aria-label="Khóa sinh viên" className="rounded border p-2" disabled={catalogLoading} value={cohortId} onChange={e => { setCohortId(e.target.value); setPage(1); }}>
          <option value="">Tất cả khóa</option>
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.cohortCode} — {c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeInProgress} onChange={e => { setIncludeInProgress(e.target.checked); setPage(1); }} />Tính cả sinh viên đang học</label>
        <button className="rounded border p-2" onClick={() => setRefresh(v => v + 1)}>Tải lại</button>
        <button className="rounded border p-2 disabled:opacity-50" disabled={loading || exporting} onClick={exportReport}>{exporting ? 'Đang xuất...' : 'Xuất nhu cầu CSV'}</button>
      </div>
      {catalogLoading && <p role="status">Đang tải danh mục...</p>}
      {catalogError && <p role="alert" className="text-red-700">{catalogError}</p>}
      {!catalogLoading && !catalogError && periods.length === 0 && <p>Chưa có kỳ học. Hãy khởi tạo năm học, kỳ học và kỳ OJT trước khi xem nhu cầu.</p>}
      <p className="text-sm text-slate-500">Để trống bộ lọc để xem tổng hợp; hệ thống dùng kỳ đánh giá đã cấu hình của từng kỳ OJT.</p>
      {loading && <p role="status">Đang tổng hợp nhu cầu học phần...</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {exportError && <p role="alert" className="text-red-700">{exportError}</p>}
      {data && <>
        <p className="text-sm">Tổng: {data.total} học phần. Cập nhật: {new Date(data.computedAt).toLocaleString('vi-VN')}.</p>
        {(data.studentsWithDataIssues.length > 0 || data.unresolvedAlternatives.length > 0) && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">Có {data.studentsWithDataIssues.length} sinh viên cần đối soát và {data.unresolvedAlternatives.length} sinh viên cần xác định môn thay thế. Nhu cầu có thể chưa đầy đủ.</p>}
        {data.items.length === 0 ? <p>Không có nhu cầu học phần trong phạm vi đã chọn.</p> : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#D6E4F0] bg-[#EFF6FF] font-semibold text-[#334155]">
                <tr>{['Mã môn học', 'Tên môn học', 'Kỳ đánh giá', 'SV chưa hoàn thành', 'Trong đó: Học lại', 'Trong đó: Đang học'].map((h, index) => (
                  <th key={h} scope="col" className={`px-4 py-3 font-semibold ${index >= 3 ? 'text-right' : ''}`}>{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map(c => (
                  <tr key={`${c.ojtSemesterId}:${c.academicPeriodId}:${c.courseId}`} className="bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.courseCode}</td>
                    <td className="px-4 py-3 text-slate-700">{c.courseName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.periodCode}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-blue-700">{c.studentCount}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${c.retakeCount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{c.retakeCount}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${c.inProgressCount > 0 ? 'text-green-700' : 'text-slate-400'}`}>{c.inProgressCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-3"><button className="rounded border p-2 disabled:opacity-50" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)}>Trước</button><span>Trang {page} / {Math.max(1, Math.ceil(data.total / data.limit))}</span><button className="rounded border p-2 disabled:opacity-50" disabled={page * data.limit >= data.total || loading} onClick={() => setPage(v => v + 1)}>Sau</button></div>
      </>}
    </section>
  </div>
  );
};
export default EducationSupportClassDemand;
