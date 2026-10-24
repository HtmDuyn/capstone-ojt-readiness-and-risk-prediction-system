import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getCourseResults, getCurriculum } from '@/services/student';
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
import { ComboRegistration } from '@/components/student/ComboRegistration';

export const StudentAcademicProfile = () => {
  const { profile, revision, loading } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [courseSearch, setCourseSearch] = useState('');
  const results = useStudentResource(
    !loading && profile
      ? 'courses:' + profile.id + ':' + page + ':' + revision
      : null,
    (signal) => getCourseResults(profile!.id, page, signal),
  );
  const curriculum = useStudentResource(
    !loading && profile ? 'curriculum:' + profile.id + ':' + revision : null,
    getCurriculum,
  );
  const progress = profile?.academicProgress;
  const visible = results.data?.items.filter((item) =>
    (item.courseCode + ' ' + item.courseName)
      .toLocaleLowerCase()
      .includes(courseSearch.toLocaleLowerCase()),
  );
  return (
    <StudentPage
      title="Hồ sơ học tập & tiến độ"
      description="Bảng điểm, chương trình đào tạo và đăng ký combo từ dữ liệu học vụ của bạn."
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
                Kỳ học:{' '}
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
            <input
              className={inputClass}
              aria-label="Tìm môn trong trang bảng điểm"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Tìm mã hoặc tên môn trong trang hiện tại..."
            />
            {results.data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="p-3">Môn học</th>
                        <th>Kỳ học</th>
                        <th>Lần học</th>
                        <th>Điểm</th>
                        <th>Điểm GPA</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible?.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <strong>{item.courseCode}</strong>
                            <p>{item.courseName}</p>
                          </td>
                          <td>{item.periodCode || 'Chưa cập nhật'}</td>
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
                  page={page}
                  total={results.data.total}
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
                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-left text-sm">
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
                      {curriculum.data.courses.map((course) => {
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
              </>
            )}
          </Card>
          <Card title="Combo đã xác nhận">
            {profile.comboSelections.length ? (
              profile.comboSelections.map((combo) => (
                <div key={combo.id}>
                  <h3 className="font-bold">
                    {combo.code} · {combo.name}
                  </h3>
                  <ul className="text-sm text-slate-600">
                    {combo.courses.map((course) => (
                      <li key={course.id}>
                        {course.code} · {course.name} · {course.credits ?? '—'}{' '}
                        tín chỉ
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <Empty>Chưa có combo được xác nhận.</Empty>
            )}
          </Card>
          <ComboRegistration />
        </>
      )}
    </StudentPage>
  );
};
export default StudentAcademicProfile;
