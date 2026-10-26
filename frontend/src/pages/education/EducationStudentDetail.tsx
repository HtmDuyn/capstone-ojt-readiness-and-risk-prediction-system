import { ArrowLeft, RefreshCw, UserRound, GraduationCap, BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { useImportedStudentDetail } from '@/hooks/useEducationImportedStudents';
import type { ImportedRelation, StudentAcademicStatus } from '@/types/education/import.types';
import { STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';

const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const relation = (row: ImportedRelation | null, fallback?: number | null) => row ? [row.code, row.name].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' — ') || text(row.id) : text(fallback);
const courseStatus: Record<string, string> = { PASSED: 'Đạt', FAILED: 'Không đạt', IN_PROGRESS: 'Đang học', WITHDRAWN: 'Rút môn', RECOGNIZED: 'Được công nhận' };

function StudentDetailContent({ id, onBack }: { id: number; onBack: () => void }) {
  const detail = useImportedStudentDetail(id, 0);
  const row = detail.profile;
  return <div className="space-y-6">
    {detail.profileLoading && <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">Đang tải hồ sơ sinh viên...</p>}
    {detail.error && <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-800">Không tìm thấy hoặc không tải được hồ sơ sinh viên</h2><p role="alert" className="mt-2 text-sm text-red-700">{detail.error}</p><button onClick={onBack} className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700">Quay lại danh sách sinh viên</button></section>}
    {row && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-orange-50 p-3 text-orange-600"><UserRound size={24} /></div><div><p className="text-sm font-semibold text-orange-700">{row.studentCode}</p><h2 className="text-xl font-bold text-slate-900">{row.fullName}</h2><p className="mt-1 text-sm text-slate-500">Hồ sơ sinh viên trên hệ thống</p></div></div><button onClick={detail.reload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700"><RefreshCw size={16} />Tải lại dữ liệu</button></div>
        <div className="mt-6 flex items-center gap-2"><GraduationCap size={20} className="text-orange-600" /><h3 className="font-bold text-slate-900">Thông tin sinh viên và học vụ</h3></div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">{[
          ['Mã sinh viên', row.studentCode], ['Họ và tên', row.fullName], ['Email', row.email], ['Số điện thoại', row.phone], ['Lớp', row.className],
          ['Trạng thái học vụ', STUDENT_STATUS_LABELS[row.status as StudentAcademicStatus] ?? row.status], ['Chương trình đào tạo', relation(row.program, row.programId)], ['Chuyên ngành', row.program?.majorName],
          ['Khóa', relation(row.cohort, row.cohortId)], ['Nhóm', row.groupCode], ['Kỳ bắt đầu chuyên ngành', relation(row.entryAcademicPeriod, row.entryAcademicPeriodId)],
          ['Kỳ hiện tại', relation(row.currentAcademicPeriod, row.currentAcademicPeriodId)], ['Năm nhập học', row.enrollmentYear], ['Kỳ chuyên ngành thứ', row.currentSemester],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{text(value)}</dd></div>)}</dl>
        {row.academicProgress && <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-sm text-slate-600">GPA</p><p className="mt-1 text-2xl font-bold text-orange-700">{text(row.academicProgress.gpa)}{row.academicProgress.gpaScale ? <span className="text-sm font-medium text-slate-500"> / {row.academicProgress.gpaScale}</span> : null}</p></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm text-slate-600">Tín chỉ tích lũy</p><p className="mt-1 text-2xl font-bold text-blue-800">{text(row.academicProgress.credits.earned)}<span className="text-sm font-medium text-slate-500"> / {text(row.academicProgress.credits.total)}</span></p></div>{Boolean(row.academicProgress.issues?.length) && <p className="text-sm text-amber-800 sm:col-span-2">Dữ liệu cần đối soát: {row.academicProgress.issues!.join(', ')}.</p>}</div>}
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2"><BookOpen size={20} className="text-orange-600" /><div><h3 className="font-bold text-slate-900">Toàn bộ bảng điểm đã lưu {detail.results ? `(${detail.results.total} kết quả)` : ''}</h3><p className="mt-1 text-xs text-slate-500">Bao gồm các lần học và học lại; chuyển trang để xem đầy đủ.</p></div></div>
        {detail.resultsLoading && <p role="status" className="text-sm text-slate-500">Đang tải bảng điểm...</p>}
        {detail.resultsError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{detail.resultsError}</p>}
        {detail.results && <><div className="overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Mã môn', 'Tên môn', 'Kỳ học', 'Lần học', 'Trạng thái', 'Điểm số', 'Hệ 4', 'Điểm chữ', 'Nguồn dữ liệu'].map(label => <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{detail.results.items.map(result => <tr key={result.id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{result.courseCode}</td><td className="px-4 py-3">{result.courseName}</td><td className="whitespace-nowrap px-4 py-3">{result.academicPeriod ? relation(result.academicPeriod) : text(result.periodCode ?? result.academicPeriodId)}</td><td className="px-4 py-3">{result.attemptNumber}</td><td className="whitespace-nowrap px-4 py-3">{courseStatus[result.status] ?? result.status}</td><td className="px-4 py-3">{text(result.score)}</td><td className="px-4 py-3">{text(result.gradePoints)}</td><td className="px-4 py-3">{text(result.grade)}</td><td className="px-4 py-3">{text(result.sourceReference)}</td></tr>)}</tbody></table>{!detail.results.items.length && <p className="p-8 text-center text-sm text-slate-500">Chưa có kết quả học tập đã lưu.</p>}</div><div className="flex items-center justify-between text-sm"><button className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-50" disabled={detail.page <= 1 || detail.resultsLoading} onClick={() => detail.setPage(page => page - 1)}>Trước</button><span>Trang {detail.page} / {Math.max(1, Math.ceil(detail.results.total / detail.results.limit))}</span><button className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-50" disabled={detail.page * detail.results.limit >= detail.results.total || detail.resultsLoading} onClick={() => detail.setPage(page => page + 1)}>Sau</button></div></>}
      </section>
    </>}
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
  return <div className="space-y-5 pb-8"><button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"><ArrowLeft size={17} />Quay lại danh sách sinh viên</button><PageBanner title="Hồ sơ và bảng điểm sinh viên" description="Thông tin học vụ và toàn bộ kết quả học tập đã lưu trên hệ thống." badge="Phòng Đào tạo" />{Number.isSafeInteger(id) && id > 0 ? <StudentDetailContent id={id} onBack={onBack} /> : <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Mã định danh sinh viên không hợp lệ.</section>}</div>;
}
