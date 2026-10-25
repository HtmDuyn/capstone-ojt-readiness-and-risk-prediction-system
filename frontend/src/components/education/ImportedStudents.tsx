import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Users, X, Search, Inbox } from 'lucide-react';
import { useEducationImportedStudents, useImportedStudentDetail } from '@/hooks/useEducationImportedStudents';
import type { AcademicCatalogs, ImportedRelation, ImportedStudent, StudentAcademicStatus } from '@/types/education/import.types';
import { STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';

const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const relation = (row: ImportedRelation | null, fallback?: number | null) => row ? [row.code, row.name].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' — ') || text(row.id) : text(fallback);
const status = (value: string) => STUDENT_STATUS_LABELS[value as StudentAcademicStatus] ?? value;
const courseStatus: Record<string, string> = { PASSED: 'Đạt', FAILED: 'Không đạt', IN_PROGRESS: 'Đang học', WITHDRAWN: 'Rút môn', RECOGNIZED: 'Được công nhận' };

function StoredStudentDetail({ student, revision, onClose }: { student: ImportedStudent; revision: number; onClose: () => void }) {
  const detail = useImportedStudentDetail(student.id, revision);
  const row = detail.profile;
  return <section className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/20 p-5" aria-label="Hồ sơ sinh viên đã lưu">
    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">{student.studentCode} — {student.fullName}</h3><div className="flex gap-2"><button className="rounded border bg-white p-2" aria-label="Tải lại hồ sơ đã lưu" onClick={detail.reload}><RefreshCw size={16} /></button><button className="rounded border bg-white p-2" aria-label="Đóng hồ sơ đã lưu" onClick={onClose}><X size={16} /></button></div></div>
    {detail.profileLoading && <p role="status">Đang tải hồ sơ từ hệ thống...</p>}
    {detail.error && <p role="alert" className="text-red-700">{detail.error}</p>}
    {row && <>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">{[
        ['Mã sinh viên', row.studentCode], ['Họ và tên', row.fullName], ['Email', row.email], ['Số điện thoại', row.phone], ['Lớp', row.className],
        ['Trạng thái học vụ', status(row.status)], ['Chương trình', relation(row.program, row.programId)], ['Chuyên ngành', row.program?.majorName],
        ['Khóa', relation(row.cohort, row.cohortId)], ['Nhóm', row.groupCode], ['Kỳ bắt đầu chuyên ngành', relation(row.entryAcademicPeriod, row.entryAcademicPeriodId)],
        ['Kỳ hiện tại', relation(row.currentAcademicPeriod, row.currentAcademicPeriodId)], ['Năm nhập học (hệ thống)', row.enrollmentYear], ['Kỳ chuyên ngành thứ (hệ thống)', row.currentSemester],
      ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-900">{text(value)}</dd></div>)}</dl>
      {row.academicProgress && <div className="rounded-lg bg-white p-3 text-sm"><p>Hệ thống tính: GPA {text(row.academicProgress.gpa)}{row.academicProgress.gpaScale ? ` / ${row.academicProgress.gpaScale}` : ''}; tín chỉ tích lũy {text(row.academicProgress.credits.earned)} / {text(row.academicProgress.credits.total)}.</p>{Boolean(row.academicProgress.issues?.length) && <p className="mt-1 text-amber-800">Dữ liệu cần đối soát: {row.academicProgress.issues!.join(', ')}.</p>}</div>}
    </>}
    <div className="border-t pt-4"><h4 className="font-semibold">Toàn bộ bảng điểm đã lưu {detail.results ? `(${detail.results.total} kết quả)` : ''}</h4><p className="mt-1 text-xs text-slate-500">Bao gồm các lần học và học lại; chuyển trang để xem đầy đủ.</p></div>
    {detail.resultsLoading && <p role="status">Đang tải bảng điểm...</p>}
    {detail.resultsError && <p role="alert" className="text-red-700">{detail.resultsError}</p>}
    {detail.results && <>
      <div className="overflow-auto rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Mã môn', 'Tên môn', 'Kỳ học', 'Lần học', 'Trạng thái', 'Điểm số', 'Hệ 4', 'Điểm chữ', 'Nguồn dữ liệu'].map(label => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{detail.results.items.map(result => <tr key={result.id} className="border-t"><td className="p-3 font-medium">{result.courseCode}</td><td className="p-3">{result.courseName}</td><td className="whitespace-nowrap p-3">{result.academicPeriod ? relation(result.academicPeriod) : text(result.periodCode ?? result.academicPeriodId)}</td><td className="p-3">{result.attemptNumber}</td><td className="whitespace-nowrap p-3">{courseStatus[result.status] ?? result.status}</td><td className="p-3">{text(result.score)}</td><td className="p-3">{text(result.gradePoints)}</td><td className="p-3">{text(result.grade)}</td><td className="p-3">{text(result.sourceReference)}</td></tr>)}</tbody></table>{!detail.results.items.length && <p className="p-5 text-center text-slate-500">Chưa có kết quả học tập đã lưu.</p>}</div>
      <div className="flex items-center justify-between text-sm"><button className="rounded border bg-white px-3 py-2 disabled:opacity-50" disabled={detail.page <= 1 || detail.resultsLoading} onClick={() => detail.setPage(p => p - 1)}>Trước</button><span>Trang {detail.page} / {Math.max(1, Math.ceil(detail.results.total / detail.results.limit))}</span><button className="rounded border bg-white px-3 py-2 disabled:opacity-50" disabled={detail.page * detail.results.limit >= detail.results.total || detail.resultsLoading} onClick={() => detail.setPage(p => p + 1)}>Sau</button></div>
    </>}
  </section>;
}

export function ImportedStudents({ revision, catalogs }: { revision: number; catalogs: AcademicCatalogs | null }) {
  const model = useEducationImportedStudents(revision);
  const [selected, setSelected] = useState<ImportedStudent | null>(null);
  useEffect(() => { setSelected(null); }, [revision, model.filters, model.page]);
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Users size={22} className="text-orange-600" />Danh sách sinh viên trên hệ thống</h2><p className="mt-2 text-sm text-slate-500">Tra cứu hồ sơ sinh viên và kết quả học tập đã lưu trong hệ thống.</p></div><button onClick={() => { setSelected(null); model.reload(); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700"><RefreshCw size={16} />Tải lại dữ liệu</button></div>
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
      <div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Sinh viên', 'Liên hệ', 'Lớp', 'Chương trình', 'Khóa / nhóm', 'Bắt đầu chuyên ngành', 'Kỳ hiện tại', 'Trạng thái', ''].map((label, i) => <th className="whitespace-nowrap px-4 py-3 font-semibold" key={label || i}>{label}</th>)}</tr></thead><tbody>{model.data.items.map(row => <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-orange-50/30"><td className="px-4 py-4"><strong className="text-slate-900">{row.studentCode}</strong><span className="mt-1 block">{row.fullName}</span></td><td className="px-4 py-4"><span className="block">{row.email}</span><span className="mt-1 block text-slate-500">{text(row.phone)}</span></td><td className="px-4 py-4">{text(row.className)}</td><td className="px-4 py-4">{relation(row.program, row.programId)}</td><td className="px-4 py-4">{relation(row.cohort, row.cohortId)}<span className="mt-1 block text-slate-500">Nhóm {text(row.groupCode)}</span></td><td className="px-4 py-4">{relation(row.entryAcademicPeriod, row.entryAcademicPeriodId)}</td><td className="px-4 py-4">{relation(row.currentAcademicPeriod, row.currentAcademicPeriodId)}</td><td className="whitespace-nowrap px-4 py-4">{status(row.status)}</td><td className="px-4 py-4"><button className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-orange-700 hover:underline" onClick={() => setSelected(row)}><Eye size={15} />Xem hồ sơ và bảng điểm</button></td></tr>)}</tbody></table>{!model.data.items.length && <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-500"><span className="rounded-full bg-orange-50 p-4 text-orange-500"><Inbox size={28} /></span><p className="font-semibold text-slate-700">Không tìm thấy sinh viên</p><p className="text-sm">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</p></div>}</div>
      <div className="flex items-center justify-between text-sm"><button disabled={model.page <= 1 || model.loading} onClick={() => model.setPage(p => p - 1)} className="rounded border px-3 py-2 disabled:opacity-50">Trước</button><span>Trang {model.page} / {Math.max(1, Math.ceil(model.data.total / model.data.limit))}</span><button disabled={model.page * model.data.limit >= model.data.total || model.loading} onClick={() => model.setPage(p => p + 1)} className="rounded border px-3 py-2 disabled:opacity-50">Sau</button></div>
    </>}
    {selected && <StoredStudentDetail key={selected.id} student={selected} revision={revision} onClose={() => setSelected(null)} />}
  </section>;
}
