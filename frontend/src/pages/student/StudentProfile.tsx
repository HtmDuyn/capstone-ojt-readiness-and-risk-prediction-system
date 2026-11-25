import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { getCurriculum } from '@/services/studentService';
import { useStudentAcademicView } from '@/hooks/student/useStudentAcademicView';
import {
  Empty,
  ResourceState,
  statusText,
  StudentPage,
  StudentAcademicPeriodSelect,
  valueText,
} from '@/components/student/PortalUI';

export const StudentAcademicProfile = () => {
  const { profile, revision, loading } = useStudentPortal();
  const [courseSearch, setCourseSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'curriculum'>('results');
  const [curriculumRequested, setCurriculumRequested] = useState(false);
  const study = useStudentAcademicView();
  const results = { ...study, data: study.data?.courseResults.filter(item =>
    item.periodStartDate && item.periodStartDate.slice(0, 10) >= study.data!.period.startDate) ?? null };
  const curriculum = useStudentResource(
    !loading && profile && curriculumRequested ? 'curriculum:' + profile.id + ':' + revision : null,
    (signal) => getCurriculum(profile!.id, signal),
    { snapshot: true },
  );
  const academic = { ...study, data: study.data?.academic.academicProgress ?? null };
  const progress = academic.data;
  const query = courseSearch.trim().toLocaleLowerCase();
  const filtered = useMemo(() => (results.data ?? []).filter(item =>
    (item.courseCode + ' ' + item.courseName).toLocaleLowerCase().includes(query)
  ), [results.data, query]);
  const requirementsById = useMemo(() => new Map(progress?.requirements.map(item => [item.id, item])), [progress?.requirements]);
  const ojtEligibleCredits = progress?.credits.historyOjtEarned ?? progress?.credits.ojtEarned;
  const courses = curriculum.data?.courses ?? [];
  return (
    <StudentPage
      title="Hồ sơ học tập & tiến độ"
      description="Theo dõi bảng điểm theo kỳ và lộ trình chương trình đào tạo của bạn."
      needsSemester={false}
      showRefreshAction={false}
      showSemesterInBanner={false}
    >
      {profile && (
        <>
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 className="min-w-0 text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <div className="w-full min-w-0 sm:ml-auto sm:w-80 sm:max-w-full"><StudentAcademicPeriodSelect /></div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Mã sinh viên</dt><dd className="font-semibold text-slate-800">{profile.studentCode}</dd></div>
                <div><dt className="text-slate-500">Chuyên ngành</dt><dd className="break-words text-slate-800">{profile.program?.majorName || 'Chưa cập nhật'}</dd></div>
              </div>
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Chương trình</dt><dd className="break-words text-slate-800">{profile.program?.name || 'Chưa cập nhật'}</dd></div>
              </div>
              <div className="min-w-0 space-y-3">
                <div><dt className="text-slate-500">Email</dt><dd className="break-all text-slate-800">{profile.email}</dd></div>
                <div><dt className="text-slate-500">Học kỳ hiện tại</dt><dd className="break-words text-slate-800">{profile.currentAcademicPeriod?.name || profile.currentSemester || 'Chưa cập nhật'}</dd></div>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-6 text-slate-500">Chỉ số tích lũy tính đến học kỳ được chọn. Bảng điểm bên dưới hiển thị các môn thuộc học kỳ đó; chương trình đào tạo là phiên bản hiện hành.</p>
            {study.data?.historical && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-6 text-blue-900">{study.data.note}</p>}
            <ResourceState loading={academic.loading} refreshing={academic.refreshing} error={academic.error} retry={academic.reload} />
            {progress && <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-600">Tín chỉ tích lũy</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {progress.credits.earned}<span className="ml-1 text-base font-medium text-slate-500">/ {valueText(progress.credits.total)}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Tín chỉ đã đạt hoặc được công nhận trong chương trình.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {progress.credits.remaining == null ? 'Chưa xác định số tín chỉ còn lại' : `Còn ${progress.credits.remaining} tín chỉ`}
                  {' · GPA '}{progress.gpa == null ? 'chưa có dữ liệu' : `${progress.gpa} / ${progress.gpaScale ?? '—'}`}
                </p>
              </article>
              <article className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="text-sm font-semibold text-amber-900">Tín chỉ xét OJT</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-950">{valueText(ojtEligibleCredits)}</p>
                <p className="mt-1 text-xs text-amber-800">Chỉ tính các môn đủ điều kiện theo quy định xét OJT.</p>
              </article>
            </div>}
            {!!progress?.issues.length && <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="text-sm font-semibold text-slate-800">Dữ liệu cần đối soát</h3><p className="mt-1 text-sm text-amber-700">{progress.issues.join(' · ')}</p></div>}
          </section>
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div role="tablist" aria-label="Dữ liệu học tập" className="flex gap-6 overflow-x-auto border-b border-slate-200">
              <button type="button" role="tab" id="results-tab" aria-controls="results-panel" aria-selected={activeTab === 'results'} onClick={() => setActiveTab('results')} className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'results' ? 'border-orange-500 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600'}`}>Bảng điểm học tập</button>
              <button type="button" role="tab" id="curriculum-tab" aria-controls="curriculum-panel" aria-selected={activeTab === 'curriculum'} onClick={() => { setActiveTab('curriculum'); setCurriculumRequested(true); }} className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'curriculum' ? 'border-orange-500 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600'}`}>Chương trình và lộ trình môn học</button>
            </div>
          <div role="tabpanel" id="results-panel" aria-labelledby="results-tab" hidden={activeTab !== 'results'} className="space-y-4 pt-5">
            <ResourceState
              loading={results.loading}
              refreshing={results.refreshing}
              error={results.error}
              retry={results.reload}
            />
            <div className="grid gap-3">
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
                        <th className="p-3 whitespace-nowrap">Mã môn</th>
                        <th className="p-3">Tên môn</th>
                        <th className="px-3 whitespace-nowrap">Kỳ</th>
                        <th className="px-3 whitespace-nowrap">Học kỳ</th>
                        <th>Lần học</th>
                        <th>Điểm</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const excludedFromOjt = item.excludedFromOjtCredits === true;
                        const markedCell = excludedFromOjt ? 'border-y border-amber-400 bg-amber-50' : '';
                        return (
                          <tr key={item.id} className={`border-b border-slate-200 transition-colors duration-150 hover:bg-slate-50 ${excludedFromOjt ? 'bg-amber-50/60' : 'bg-white'}`}>
                            <td className={`p-3 whitespace-nowrap ${markedCell} ${excludedFromOjt ? 'border-l-2' : ''}`}>
                              <strong className="text-slate-800">{item.courseCode}</strong>
                            </td>
                            <td className={`p-3 text-slate-800 ${markedCell} ${excludedFromOjt ? 'border-r-2' : ''}`}>
                              {item.courseName}
                              {excludedFromOjt && <span className="mt-1 block text-xs font-semibold text-amber-800">Không tính vào tín chỉ xét OJT</span>}
                            </td>
                            <td className="px-3 whitespace-nowrap">{item.semesterTaken == null ? '—' : `Kỳ ${item.semesterTaken}`}</td>
                            <td className="px-3 whitespace-nowrap">{(item.courseCode === 'OJT202' && (item.periodName || study.data?.period.name)) || item.periodCode || 'Chưa cập nhật'}</td>
                            <td>{item.attemptNumber}</td>
                            <td className={item.score == null ? 'text-slate-600' : item.status === 'PASSED' ? 'font-semibold text-emerald-600' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'text-slate-600'}>{item.score ?? '—'}</td>
                            <td className={item.status === 'PASSED' ? 'font-semibold text-emerald-600' : item.status === 'FAILED' ? 'font-semibold text-red-600' : 'text-slate-600'}>{item.status === 'IN_PROGRESS' ? 'Đang học' : statusText(item.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!results.pending && !filtered.length && <Empty>Không có môn học phù hợp.</Empty>}
                <p className="text-sm text-slate-500">{results.pending ? 'Đã tải' : 'Tổng cộng'} {filtered.length} bản ghi điểm học tập.</p>
              </>
            )}
          </div>
          <div role="tabpanel" id="curriculum-panel" aria-labelledby="curriculum-tab" hidden={activeTab !== 'curriculum'} className="space-y-4 pt-5">
            <ResourceState
              loading={curriculum.loading}
              refreshing={curriculum.refreshing}
              error={curriculum.error}
              retry={curriculum.reload}
            />
            {curriculum.data && (
              <>
                <p className="text-sm text-slate-500">
                  {curriculum.data.name} · {curriculum.data.code} · Phiên bản{' '}
                  {curriculum.data.version}
                </p>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Môn được viền vàng không được tính vào tín chỉ xét OJT.</p>
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
                        const requirement = requirementsById.get(course.id);
                        const excludedFromOjt = requirement?.excludedFromOjtCredits === true;
                        return (
                          <tr key={course.id} className={`border-b border-slate-200 transition-colors duration-150 hover:bg-slate-50 ${excludedFromOjt ? 'bg-amber-50/60' : 'bg-white'}`}>
                            <td className="p-3">
                              <div className={excludedFromOjt ? 'rounded-lg border border-amber-400 bg-amber-50 p-2' : ''}>
                                <strong className="text-slate-800">{course.courseCode}</strong>
                                <p className="mt-0.5 text-xs text-slate-500">{course.name}</p>
                                {excludedFromOjt && <p className="mt-1 text-xs font-semibold text-amber-800">Không tính vào tín chỉ xét OJT</p>}
                              </div>
                            </td>
                            <td>{course.semester ?? '—'}</td>
                            <td>{course.credits ?? '—'}</td>
                            <td className="max-w-xs">
                              {course.prerequisiteText || 'Chưa ghi nhận'}
                            </td>
                            <td>
                              {!progress ? academic.pending ? 'Đang tải tiến độ…' : 'Chưa có dữ liệu tiến độ' : requirement?.completed
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
