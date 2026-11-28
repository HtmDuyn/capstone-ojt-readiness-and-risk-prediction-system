import { ArrowLeft, UserRound, GraduationCap, BookOpen, X } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { useImportedStudentDetail } from '@/hooks/education/useEducationImportedStudents';
import type { ImportedRelation } from '@/types/education/import.types';
import { savedOjtLabel } from '@/utils/education/savedOjtEligibility';

const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const relation = (row: ImportedRelation | null, fallback?: number | null) => row ? [row.code, row.name].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' — ') || text(row.id) : text(fallback);
const courseStatus: Record<string, string> = { PASSED: 'Đạt', FAILED: 'Không đạt', IN_PROGRESS: 'Đang học', WITHDRAWN: 'Rút môn', RECOGNIZED: 'Được công nhận' };

function StudentDetailContent({ id, onBack, dialog = false }: { id: number; onBack: () => void; dialog?: boolean }) {
  const detail = useImportedStudentDetail(id, 0);
  const row = detail.profile;
  return <div className="space-y-6">
    {detail.profileLoading && <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">Đang tải hồ sơ sinh viên...</p>}
    {detail.error && <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-800">Không tìm thấy hoặc không tải được hồ sơ sinh viên</h2><p role="alert" className="mt-2 text-sm text-red-700">{detail.error}</p><button onClick={onBack} className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">Quay lại danh sách sinh viên</button></section>}
    {row && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {!dialog && <button onClick={onBack} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"><ArrowLeft size={17} />Quay lại danh sách sinh viên</button>}
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5"><div className="rounded-xl bg-orange-50 p-3 text-orange-600"><UserRound size={24} /></div><div><p className="text-sm font-semibold text-orange-700">{row.studentCode}</p><h2 className="text-xl font-bold text-slate-900">{row.fullName}</h2><p className="mt-1 text-sm text-slate-500">Hồ sơ sinh viên trên hệ thống</p></div></div>
        <div className="mt-6 flex items-center gap-2"><GraduationCap size={20} className="text-orange-600" /><h3 className="font-bold text-slate-900">Thông tin sinh viên và học vụ</h3></div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">{[
          ['Mã sinh viên', row.studentCode], ['Họ và tên', row.fullName], ['Email', row.email], ['Số điện thoại', row.phone],
          ['Mã chương trình đào tạo', row.program?.code], ['Chuyên ngành', row.program?.majorName],
          ['Khóa', relation(row.cohort, row.cohortId)], ['Nhóm', row.groupCode],
          ['Kết quả OJT đã lưu', row.calculatedEligibility ? savedOjtLabel(row.calculatedEligibility) : !row.latestOjtCheck ? 'Chưa xét' : row.latestOjtCheck.isStale ? 'Cần xét lại' : ({ ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Chưa đủ điều kiện', REVIEW_REQUIRED: 'Chưa đủ dữ liệu' }[row.latestOjtCheck.status])], ['Năm nhập học', row.enrollmentYear],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{text(value)}</dd></div>)}</dl>
        {row.academicProgress && <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-sm text-slate-600">GPA</p><p className="mt-1 text-2xl font-bold text-orange-700">{text(row.academicProgress.gpa)}{row.academicProgress.gpaScale ? <span className="text-sm font-medium text-slate-500"> / {row.academicProgress.gpaScale}</span> : null}</p></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm text-slate-600">Tín chỉ tích lũy</p><p className="mt-1 text-2xl font-bold text-blue-800">{text(row.academicProgress.credits.earned)}<span className="text-sm font-medium text-slate-500"> / {text(row.academicProgress.credits.total)}</span></p></div>{Boolean(row.academicProgress.issues?.length) && <p className="text-sm text-amber-800 sm:col-span-2">Vấn đề dữ liệu học vụ: {row.academicProgress.issues!.join(', ')}.</p>}</div>}
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2"><BookOpen size={20} className="text-orange-600" /><div><h3 className="font-bold text-slate-900">Toàn bộ bảng điểm đã lưu {detail.results ? `(${detail.results.items.length} kết quả)` : ''}</h3><p className="mt-1 text-xs text-slate-500">Bao gồm đầy đủ các lần học và học lại.</p></div></div>
        {detail.resultsLoading && <p role="status" className="text-sm text-slate-500">Đang tải bảng điểm...</p>}
        {detail.resultsError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{detail.resultsError}</p>}
        {detail.results && <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#EFF6FF] text-[#334155]"><tr className="border-b border-[#D6E4F0]">{['Mã môn', 'Tên môn', 'Kỳ học', 'Lần học', 'Trạng thái', 'Điểm số'].map(label => <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{detail.results.items.map(result => <tr key={result.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="px-4 py-3 font-medium">{result.courseCode}</td><td className="px-4 py-3">{result.courseName}</td><td className="whitespace-nowrap px-4 py-3">{(result.periodCode ?? result.academicPeriod?.code ?? result.academicPeriod?.name)?.toUpperCase() ?? text(result.academicPeriodId)}</td><td className="px-4 py-3">{result.attemptNumber}</td><td className="whitespace-nowrap px-4 py-3">{courseStatus[result.status] ?? result.status}</td><td className="px-4 py-3">{text(result.score)}</td></tr>)}</tbody></table>{!detail.results.items.length && <p className="p-8 text-center text-sm text-slate-500">Chưa có kết quả học tập đã lưu.</p>}</div>}
      </section>
    </>}
  </div>;
}

export function EducationStudentDetailDialog({ id, onClose }: { id: number; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-2 sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="student-detail-dialog-title" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-3"><h2 id="student-detail-dialog-title" className="font-bold text-slate-900">Hồ sơ và bảng điểm sinh viên</h2><button type="button" aria-label="Đóng hồ sơ" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button></div>
      <div className="overflow-y-auto p-3 sm:p-5"><StudentDetailContent id={id} onBack={onClose} dialog /></div>
    </div>
  </div>;
}

export default function EducationStudentDetail() {
  const { studentId } = useParams();
  useEffect(() => { window.scrollTo(0, 0); }, [studentId]);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { returnTo?: string; scrollY?: number } | null;
  const backTo = state?.returnTo?.startsWith('/education/student-import') ? state.returnTo : `/education/student-import${location.search}`;
  const onBack = () => navigate(backTo, { state: typeof state?.scrollY === 'number' ? { restoreScrollY: state.scrollY } : null });
  const id = Number(studentId);
  return <div className="space-y-5 pb-8"><PageBanner variant="education" title="Hồ sơ và bảng điểm sinh viên" description="Thông tin học vụ và toàn bộ kết quả học tập đã lưu trên hệ thống." badge="Phòng Đào tạo" />{Number.isSafeInteger(id) && id > 0 ? <StudentDetailContent id={id} onBack={onBack} /> : <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"><p>Mã định danh sinh viên không hợp lệ.</p><button onClick={onBack} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} />Quay lại danh sách sinh viên</button></section>}</div>;
}
