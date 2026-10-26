import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Users, Search, Inbox } from 'lucide-react';
import { useEducationImportedStudents } from '@/hooks/useEducationImportedStudents';
import type { AcademicCatalogs, ImportedRelation, ImportedStudent, StudentAcademicStatus } from '@/types/education/import.types';
import { STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';

const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const relation = (row: ImportedRelation | null, fallback?: number | null) => row ? [row.code, row.name].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' — ') || text(row.id) : text(fallback);
const status = (value: string) => STUDENT_STATUS_LABELS[value as StudentAcademicStatus] ?? value;
const ojtStatus = (row: ImportedStudent) => !row.latestOjtCheck ? 'Chưa xét' : row.latestOjtCheck.isStale ? 'Cần xét lại' : ({ELIGIBLE:'Đủ điều kiện',NOT_ELIGIBLE:'Chưa đủ điều kiện',REVIEW_REQUIRED:'Cần đối soát'}[row.latestOjtCheck.status]);

export function ImportedStudents({ revision, catalogs }: { revision: number; catalogs: AcademicCatalogs | null }) {
  const model = useEducationImportedStudents(revision);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRestored = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(model.filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (model.page > 1) params.set('page', String(model.page));
    const search = params.toString();
    if (search !== location.search.slice(1)) navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true, state: location.state });
  }, [model.filters, model.page, navigate, location.pathname, location.search, location.state]);
  useEffect(() => {
    const scrollY = (location.state as { restoreScrollY?: number } | null)?.restoreScrollY;
    if (model.data && !scrollRestored.current && typeof scrollY === 'number') {
      scrollRestored.current = true;
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  }, [model.data, location.state]);
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Users size={22} className="text-orange-600" />Danh sách sinh viên trên hệ thống</h2><p className="mt-2 text-sm text-slate-500">Tra cứu hồ sơ sinh viên và kết quả học tập đã lưu trong hệ thống.</p></div><button onClick={model.reload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700"><RefreshCw size={16} />Tải lại dữ liệu</button></div>
    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="relative md:col-span-2 xl:col-span-4"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Tìm sinh viên đã import" value={model.filters.search} onChange={e => model.changeFilter('search', e.target.value)} placeholder="Tìm theo mã sinh viên, họ tên hoặc email" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>
      <select aria-label="Lọc chương trình đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.programId} onChange={e => model.changeFilter('programId', e.target.value)}><option value="">Tất cả chương trình</option>{catalogs?.programs.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
      <select aria-label="Lọc khóa đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.cohortId} onChange={e => model.changeFilter('cohortId', e.target.value)}><option value="">Tất cả khóa</option>{catalogs?.cohorts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
      <select aria-label="Lọc trạng thái sinh viên đã import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.status} onChange={e => model.changeFilter('status', e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Lọc đợt import" className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-sm" value={model.filters.importBatchId} onChange={e => model.changeFilter('importBatchId', e.target.value)}><option value="">Tất cả đợt import</option>{model.batches.filter(b => b.sourceAccountBatchId).map(batch => <option key={batch.id} value={batch.sourceAccountBatchId!}>Đợt #{batch.id} — {new Date(batch.createdAt).toLocaleString('vi-VN')}</option>)}</select>
      <button onClick={model.clearFilters} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:text-orange-700">Xóa bộ lọc</button>
    </div>
    {model.error && <p role="alert" className="text-red-700">{model.error}</p>}
    {model.batchError && <p role="alert" className="text-amber-800">Chưa tải được danh sách đợt import: {model.batchError}</p>}
    {model.loading && <p role="status">Đang tải dữ liệu đã import...</p>}
    {model.data && <>
      <p className="text-sm text-slate-600">Tổng {model.data.total} sinh viên phù hợp. Bấm xem hồ sơ để xem đủ thông tin và bảng điểm.</p>
      <div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-[#EFF6FF] text-[#334155]"><tr className="border-b border-[#D6E4F0]">{['Sinh viên', 'Liên hệ', 'Lớp', 'Chương trình', 'Khóa / nhóm', 'Bắt đầu chuyên ngành', 'Kỳ hiện tại', 'Trạng thái học vụ', 'Kết quả OJT', ''].map((label, i) => <th className="whitespace-nowrap px-4 py-3 font-semibold" key={label || i}>{label}</th>)}</tr></thead><tbody>{model.data.items.map(row => <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-orange-50/30"><td className="px-4 py-4"><strong className="text-slate-900">{row.studentCode}</strong><span className="mt-1 block">{row.fullName}</span>{row.courseSemesterTag != null && <span className="mt-2 inline-block rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">Tag kỳ {row.courseSemesterTag}</span>}</td><td className="px-4 py-4"><span className="block">{row.email}</span><span className="mt-1 block text-slate-500">{text(row.phone)}</span></td><td className="px-4 py-4">{text(row.className)}</td><td className="px-4 py-4">{relation(row.program, row.programId)}</td><td className="px-4 py-4">{relation(row.cohort, row.cohortId)}<span className="mt-1 block text-slate-500">Nhóm {text(row.groupCode)}</span></td><td className="px-4 py-4">{relation(row.entryAcademicPeriod, row.entryAcademicPeriodId)}</td><td className="px-4 py-4">{relation(row.currentAcademicPeriod, row.currentAcademicPeriodId)}</td><td className="whitespace-nowrap px-4 py-4">{status(row.status)}</td><td className="whitespace-nowrap px-4 py-4">{ojtStatus(row)}</td><td className="px-4 py-4"><button className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-orange-700 hover:underline" onClick={() => navigate(`${location.pathname}/students/${row.id}${location.search}`, { state: { returnTo: `${location.pathname}${location.search}`, scrollY: window.scrollY } })}><Eye size={15} />Xem hồ sơ và bảng điểm</button></td></tr>)}</tbody></table>{!model.data.items.length && <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500"><span className="rounded-full bg-orange-50 p-4 text-orange-500"><Inbox size={28} /></span><p className="font-semibold text-slate-700">Không tìm thấy sinh viên</p><p className="text-sm">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</p></div>}</div>
      <div className="flex items-center justify-between text-sm"><button disabled={model.page <= 1 || model.loading} onClick={() => model.setPage(p => p - 1)} className="rounded border px-3 py-2 disabled:opacity-50">Trước</button><span>Trang {model.page} / {Math.max(1, Math.ceil(model.data.total / model.data.limit))}</span><button disabled={model.page * model.data.limit >= model.data.total || model.loading} onClick={() => model.setPage(p => p + 1)} className="rounded border px-3 py-2 disabled:opacity-50">Sau</button></div>
    </>}
  </section>;
}
