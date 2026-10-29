import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getAllCourseResults, getCurriculum } from '@/services/studentService';
import {
  Card,
  Empty,
  Metrics,
  Pagination,
  ResourceState,
  statusText,
  StudentPage,
  valueText,
  inputClass,
} from '@/components/student/PortalUI';

export const StudentAcademicProfile = () => {
  const { profile, revision, loading } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [courseSearch, setCourseSearch] = useState('');
  const [studySemester, setStudySemester] = useState('');
  const [curriculumPage, setCurriculumPage] = useState(1);
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
  const resultPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 20)));
  const visible = filtered.slice((resultPage - 1) * 20, resultPage * 20);
  const courses = curriculum.data?.courses ?? [];
  const roadmapPage = Math.min(curriculumPage, Math.max(1, Math.ceil(courses.length / 20)));
  return (
    <StudentPage
      title="Hồ sơ học tập & tiến độ"
      description="Theo dõi bảng điểm theo kỳ và lộ trình chương trình đào tạo của bạn."
      needsSemester={false}
    >
      {profile && progress && (
        <>
          <Card title={profile.fullName}>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                Mã sinh viên: <strong>{profile.studentCode}</strong>
              </div>
              <div>Email: {profile.email}</div>
              <div>Lớp: {profile.className || 'Chưa cập nhật'}</div>
              <div>
                Chương trình: {profile.program?.name || 'Chưa cập nhật'}
              </div>
              <div>
                Chuyên ngành: {profile.program?.majorName || 'Chưa cập nhật'}
              </div>
              <div>
                Học kỳ hiện tại:{' '}
                {profile.currentAcademicPeriod?.name ||
                  profile.currentSemester ||
                  'Chưa cập nhật'}
              </div>
            </dl>
          </Card>
          <Metrics
            values={[
              {
                label: 'GPA',
                value:
                  progress.gpa == null
                    ? 'Chưa có dữ liệu'
                    : progress.gpa + ' / ' + (progress.gpaScale ?? '—'),
              },
              { label: 'Tín chỉ đã đạt', value: progress.credits.earned },
              {
                label: 'Tổng tín chỉ chương trình',
                value: valueText(progress.credits.total),
              },
              {
                label: 'Tín chỉ còn lại',
                value: valueText(progress.credits.remaining),
              },
            ]}
          />
          {!!progress.issues.length && (
            <Card title="Dữ liệu cần đối soát">
              <p className="text-sm text-amber-700">
                {progress.issues.join(' · ')}
              </p>
            </Card>
          )}
          <Card title="Bảng điểm học tập">
            <ResourceState
              loading={results.loading}
              error={results.error}
              retry={results.reload}
            />
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <label className="space-y-1 text-sm text-slate-600">
                <span>Kỳ</span>
                <select className={inputClass} aria-label="Lọc bảng điểm theo kỳ" value={studySemester} onChange={(event) => { setStudySemester(event.target.value); setPage(1); }}>
                  <option value="">Tất cả các kỳ</option>
                  {semesters.map((semester) => <option key={semester} value={semester}>{semester === 0 ? 'Kỳ 0 (dự bị)' : `Kỳ ${semester}`}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                <span>Tìm môn học</span>
                <input
                  className={inputClass}
                  aria-label="Tìm môn trong bảng điểm"
                  value={courseSearch}
                  onChange={(e) => { setCourseSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm mã hoặc tên môn trong toàn bộ bảng điểm..."
                />
              </label>
            </div>
            {results.data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm text-left">
                    <thead>
                      <tr className="border-b text-slate-500">
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
                      {visible.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <strong>{item.courseCode}</strong>
                            <p>{item.courseName}</p>
                          </td>
                          <td className="px-3 whitespace-nowrap">{item.semesterTaken == null ? '—' : `Kỳ ${item.semesterTaken}`}</td>
                          <td className="px-3 whitespace-nowrap">{item.periodCode || 'Chưa cập nhật'}</td>
                          <td>{item.attemptNumber}</td>
                          <td>{item.score ?? '—'}</td>
                          <td>{item.gradePoints ?? '—'}</td>
                          <td>{statusText(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!visible?.length && <Empty>Không có môn học phù hợp.</Empty>}
                <Pagination
                  page={resultPage}
                  total={filtered.length}
                  onChange={setPage}
                />
              </>
            )}
          </Card>
          <Card title="Chương trình và lộ trình môn học">
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
                      <tr className="border-b">
                        <th className="p-3">Môn học</th>
                        <th>Kỳ gợi ý</th>
                        <th>Tín chỉ</th>
                        <th>Tiên quyết</th>
                        <th>Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.slice((roadmapPage - 1) * 20, roadmapPage * 20).map((course) => {
                        const requirement = progress.requirements.find(
                          (item) => item.id === course.id,
                        );
                        return (
                          <tr key={course.id} className="border-b">
                            <td className="p-3">
                              <strong>{course.courseCode}</strong>
                              <p>{course.name}</p>
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
                <Pagination page={roadmapPage} total={courses.length} onChange={setCurriculumPage} />
              </>
            )}
            {!curriculum.loading &&
              !curriculum.error &&
              curriculum.data === null && (
                <Empty>Chương trình đào tạo chưa được công bố.</Empty>
              )}
          </Card>
        </>
      )}
    </StudentPage>
  );
};
export default StudentAcademicProfile;
