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
  const scope = React.useMemo<ReportScope | null>(() => periodId && semesterId ? {
    academicPeriodId: Number(periodId), ojtSemesterId: Number(semesterId),
    ...(cohortId ? { cohortId: Number(cohortId) } : {}),
  } : null, [periodId, semesterId, cohortId]);
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
    setData(null); setError(''); setExportError(''); setLoading(Boolean(scope));
    if (scope) reports.courseDemand(scope, page, includeInProgress, c.signal)
      .then(r => { if (!c.signal.aborted) setData(r); })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [scope, page, includeInProgress, refresh]);
  async function exportReport() {
    if (!scope || exporting) return;
    setExporting(true); setExportError('');
    try { downloadCourseDemand(await reports.exportCourseDemand(scope, includeInProgress)); }
    catch (e) { setExportError(e instanceof Error ? e.message : 'Không xuất được báo cáo.'); }
    finally { setExporting(false); }
  }
  return (
  <div className="space-y-6">
    <PageBanner
      title="Nhu cầu lớp hỗ trợ"
      description="Thống kê học phần cần học hoặc học lại để cân nhắc mở lớp hỗ trợ."
      badge="Phòng Đào tạo"
    />
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">Số liệu tổng hợp từ hồ sơ học tập và điều kiện OJT; chưa phải đề xuất do AI tạo hoặc quyết định mở lớp.</p>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Kỳ học đánh giá" className="rounded border p-2" disabled={catalogLoading} value={periodId} onChange={e => { setPeriodId(e.target.value); setPage(1); }}>
          <option value="">Chọn kỳ học / Block đánh giá</option>
          {periods.map(p => <option key={p.id} value={p.id}>{p.periodCode} — {p.name}</option>)}
        </select>
        <select aria-label="Kỳ OJT" className="rounded border p-2" disabled={catalogLoading} value={semesterId} onChange={e => { setSemesterId(e.target.value); setPage(1); }}>
          <option value="">Chọn kỳ OJT</option>
          {periods.filter(p => p.ojt).map(p => <option key={p.ojt!.id} value={p.ojt!.id}>{p.ojt!.semesterCode} — {p.ojt!.name}</option>)}
        </select>
        <select aria-label="Khóa" className="rounded border p-2" disabled={catalogLoading} value={cohortId} onChange={e => { setCohortId(e.target.value); setPage(1); }}>
          <option value="">Tất cả khóa</option>
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.cohortCode} — {c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeInProgress} onChange={e => { setIncludeInProgress(e.target.checked); setPage(1); }} />Bao gồm môn đang học</label>
        <button className="rounded border p-2" onClick={() => setRefresh(v => v + 1)}>Tải lại</button>
        <button className="rounded border p-2 disabled:opacity-50" disabled={!scope || loading || exporting || Boolean(catalogError)} onClick={exportReport}>{exporting ? 'Đang xuất...' : 'Xuất nhu cầu CSV'}</button>
      </div>
      {catalogLoading && <p role="status">Đang tải danh mục...</p>}
      {catalogError && <p role="alert" className="text-red-700">{catalogError}</p>}
      {!catalogLoading && !catalogError && periods.length === 0 && <p>Chưa có kỳ học. Hãy khởi tạo năm học, kỳ học và kỳ OJT trước khi xem nhu cầu.</p>}
      {!scope && periods.length > 0 && <p>Chọn kỳ học đánh giá và kỳ OJT để xem nhu cầu.</p>}
      {loading && <p role="status">Đang tổng hợp nhu cầu học phần...</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {exportError && <p role="alert" className="text-red-700">{exportError}</p>}
      {data && <>
        <p className="text-sm">Tổng: {data.total} học phần. Cập nhật: {new Date(data.computedAt).toLocaleString('vi-VN')}.</p>
        {(data.studentsWithDataIssues.length > 0 || data.unresolvedAlternatives.length > 0) && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">Có {data.studentsWithDataIssues.length} sinh viên cần đối soát và {data.unresolvedAlternatives.length} sinh viên cần xác định môn thay thế. Nhu cầu có thể chưa đầy đủ.</p>}
        {data.items.length === 0 ? <p>Không có nhu cầu học phần trong phạm vi đã chọn.</p> : <div className="overflow-auto"><table className="w-full text-left text-sm">
          <thead><tr>{['Mã môn', 'Tên môn', 'Kỳ / Block', 'Sinh viên', 'Học lại', 'Đang học'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{data.items.map(c => <tr key={c.courseId} className="border-t"><td className="p-2">{c.courseCode}</td><td>{c.courseName}</td><td>{c.periodCode}</td><td>{c.studentCount}</td><td>{c.retakeCount}</td><td>{c.inProgressCount}</td></tr>)}</tbody>
        </table></div>}
        <div className="flex items-center gap-3"><button className="rounded border p-2 disabled:opacity-50" disabled={page === 1 || loading} onClick={() => setPage(v => v - 1)}>Trước</button><span>Trang {page} / {Math.max(1, Math.ceil(data.total / data.limit))}</span><button className="rounded border p-2 disabled:opacity-50" disabled={page * data.limit >= data.total || loading} onClick={() => setPage(v => v + 1)}>Sau</button></div>
      </>}
    </section>
  </div>
  );
};
export default EducationSupportClassDemand;
