import { useState } from 'react';
import { Search } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getAllCourseResults, getCurriculum } from '@/services/studentService';
import {
  Empty,
  ResourceState,
  statusText,
  StudentPage,
  StudentSemesterSelect,
  valueText,
} from '@/components/student/PortalUI';

export const StudentAcademicProfile = () => {
  const { profile, revision, loading } = useStudentPortal();
  const [courseSearch, setCourseSearch] = useState('');
  const [studySemester, setStudySemester] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'curriculum'>('results');
  const results = useStudentResource(
    !loading && profile
      ? 'courses:' + profile.id + ':' + revision
      : null,
    (signal) => getAllCourseResults(profile!.id, signal),
  );
  const curriculum = useStudentResource(
    !loading && profile ? 'curriculum:' + profile.id + ':' + revision : null,
    (signal) => getCurriculum(profile!.id, signal),
  );
  const progress = profile?.academicProgress;
  const semesters = [...new Set((results.data ?? []).flatMap((item) => item.semesterTaken == null ? [] : [item.semesterTaken]))].sort((a, b) => a - b);
  const filtered = (results.data ?? []).filter((item) =>
    (studySemester === '' || String(item.semesterTaken) === studySemester) &&
    (item.courseCode + ' ' + item.courseName).toLocaleLowerCase().includes(courseSearch.trim().toLocaleLowerCase()),
  );
  const courses = curriculum.data?.courses ?? [];
  return (
    <StudentPage
      title="Hồ sơ học tập & tiến độ"
      description="Theo dõi bảng điểm theo kỳ và lộ trình chương trình đào tạo của bạn."
      needsSemester={false}
      showRefreshAction={false}
      showSemesterInBanner={false}
    >
      {profile && progress && (
        <>
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 className="min-w-0 text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <div className="w-full min-w-0 sm:ml-auto sm:w-64 sm:max-w-full"><StudentSemesterSelect /></div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Mã sinh viên</dt><dd className="font-semibold text-slate-800">{profile.studentCode}</dd></div>
                <div><dt className="text-slate-500">Chuyên ngành</dt><dd className="break-words text-slate-800">{profile.program?.majorName || 'Chưa cập nhật'}</dd></div>
              </div>
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Lớp</dt><dd className="break-words text-slate-800">{profile.className || 'Chưa cập nhật'}</dd></div>
                <div><dt className="text-slate-500">Chương trình</dt><dd className="break-words text-slate-800">{profile.program?.name || 'Chưa cập nhật'}</dd></div>
              </div>
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Email</dt><dd className="break-all text-slate-800">{profile.email}</dd></div>
                <div><dt className="text-slate-500">Học kỳ hiện tại</dt><dd className="break-words text-slate-800">{profile.currentAcademicPeriod?.name || profile.currentSemester || 'Chưa cập nhật'}</dd></div>
              </div>
            </dl>
            <dl className="mt-5 grid grid-cols-2 gap-y-4 border-t border-slate-200 pt-5 lg:grid-cols-4">
              {[
                { label: 'GPA', value: progress.gpa == null ? 'Chưa có dữ liệu' : progress.gpa + ' / ' + (progress.gpaScale ?? '—') },
                { label: 'Tín chỉ đã đạt', value: progress.credits.earned },
                { label: 'Tổng tín chỉ chương trình', value: valueText(progress.credits.total) },
                { label: 'Tín chỉ còn lại', value: valueText(progress.credits.remaining) },
              ].map((metric, index) => <div key={metric.label} className={`min-w-0 ${index % 2 ? 'border-l border-slate-200 pl-4' : ''} ${index > 1 ? 'lg:border-l lg:pl-5' : ''} ${index === 1 ? 'lg:border-l lg:pl-5' : ''}`}><dt className="text-xs text-slate-500">{metric.label}</dt><dd className="mt-1 text-xl font-bold text-slate-900">{metric.value}</dd></div>)}
            </dl>
            {!!progress.issues.length && <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="text-sm font-semibold text-slate-800">Dữ liệu cần đối soát</h3><p className="mt-1 text-sm text-amber-700">{progress.issues.join(' · ')}</p></div>}
          </section>
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div role="tablist" aria-label="Dữ liệu học tập" className="flex gap-6 overflow-x-auto border-b border-slate-200">
              <button type="button" role="tab" id="results-tab" aria-controls="results-panel" aria-selected={activeTab === 'results'} onClick={() => setActiveTab('results')} className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'results' ? 'border-orange-500 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600'}`}>Bảng điểm học tập</button>
              <button type="button" role="tab" id="curriculum-tab" aria-controls="curriculum-panel" aria-selected={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'curriculum' ? 'border-orange-500 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600'}`}>Chương trình và lộ trình môn học</button>
            </div>
          <div role="tabpanel" id="results-panel" aria-labelledby="results-tab" hidden={activeTab !== 'results'} className="space-y-4 pt-5">
            <ResourceState
              loading={results.loading}
              error={results.error}
              retry={results.reload}
            />
            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <label className="block min-w-0 text-left text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">Kỳ học</span>
                <select className="h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 transition-colors hover:border-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" aria-label="Lọc bảng điểm theo kỳ" value={studySemester} onChange={(event) => setStudySemester(event.target.value)}>
                  <option value="">Tất cả các kỳ</option>
                  {semesters.map((semester) => <option key={semester} value={semester}>{semester === 0 ? 'Kỳ 0 (dự bị)' : `Kỳ ${semester}`}</option>)}
                </select>
              </label>
              <label className="block min-w-0 text-left text-sm font-medium text-slate-700">
                <span className="mb-1.5 block">Tìm môn học</span>
                <span className="relative block">
                  <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 transition-colors hover:border-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  aria-label="Tìm môn trong bảng điểm"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Nhập mã môn hoặc tên môn học..."
                />
                </span>
              </label>
            </div>
            {results.data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 [&>th]:font-semibold">
                        <th className="p-3">Môn học</th>
                        <th className="px-3 whitespace-nowrap">Kỳ</th>
                        <th className="px-3 whitespace-nowrap">Học kỳ</th>
                        <th>Lần học</th>
                        <th>Điểm</th>
                        <th>Điểm GPA</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id} className="border-b border-slate-200 bg-white transition-colors duration-150 hover:bg-slate-50">
                          <td className="p-3">
                            <strong className="text-slate-800">{item.courseCode}</strong>
                            <p className="mt-0.5 text-xs text-slate-500">{item.courseName}</p>
                          </td>
                          <td className="px-3 whitespace-nowrap">{item.semesterTaken == null ? '—' : `Kỳ ${item.semesterTaken}`}</td>
                          <td className="px-3 whitespace-nowrap">{item.periodCode || 'Chưa cập nhật'}</td>
                          <td>{item.attemptNumber}</td>
                          <td className={item.score == null ? 'text-slate-600' : item.status === 'PASSED' ? 'font-semibold text-emerald-600' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'text-slate-600'}>{item.score ?? '—'}</td>
                          <td className={item.gradePoints == null ? 'text-slate-600' : item.status === 'PASSED' ? 'font-semibold text-emerald-600' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'text-slate-600'}>{item.gradePoints ?? '—'}</td>
                          <td className={item.status === 'PASSED' ? 'font-semibold text-emerald-600' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'text-slate-600'}>{statusText(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && <Empty>Không có môn học phù hợp.</Empty>}
                <p className="text-sm text-slate-500">Tổng cộng {filtered.length} bản ghi điểm học tập.</p>
              </>
            )}
          </div>
          <div role="tabpanel" id="curriculum-panel" aria-labelledby="curriculum-tab" hidden={activeTab !== 'curriculum'} className="space-y-4 pt-5">
            <ResourceState
              loading={curriculum.loading}
              error={curriculum.error}
              retry={curriculum.reload}
            />
            {curriculum.data && (
              <>
                <p className="text-sm text-slate-500">
                  {curriculum.data.name} · {curriculum.data.code} · Phiên bản{' '}
                  {curriculum.data.version}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 [&>th]:font-semibold">
                        <th className="p-3">Môn học</th>
                        <th>Kỳ gợi ý</th>
                        <th>Tín chỉ</th>
                        <th>Tiên quyết</th>
                        <th>Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => {
                        const requirement = progress.requirements.find(
                          (item) => item.id === course.id,
                        );
                        return (
                          <tr key={course.id} className="border-b border-slate-200 bg-white transition-colors duration-150 hover:bg-slate-50">
                            <td className="p-3">
                              <strong className="text-slate-800">{course.courseCode}</strong>
                              <p className="mt-0.5 text-xs text-slate-500">{course.name}</p>
                            </td>
                            <td>{course.semester ?? '—'}</td>
                            <td>{course.credits ?? '—'}</td>
                            <td className="max-w-xs">
                              {course.prerequisiteText || 'Chưa ghi nhận'}
                            </td>
                            <td>
                              {requirement?.completed
                                ? 'Đã hoàn thành'
                                : 'Chưa hoàn thành'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!curriculum.data.courses.length && (
                  <Empty>Chưa có môn học được công bố.</Empty>
                )}
                <p className="text-sm text-slate-500">Tổng cộng {courses.length} môn học trong chương trình.</p>
              </>
            )}
            {!curriculum.loading &&
              !curriculum.error &&
              curriculum.data === null && (
                <Empty>Chương trình đào tạo chưa được công bố.</Empty>
              )}
          </div>
          </section>
        </>
      )}
    </StudentPage>
  );
};
export default StudentAcademicProfile;
