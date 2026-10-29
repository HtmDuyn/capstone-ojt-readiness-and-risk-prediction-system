import { Link } from 'react-router-dom';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getStudentDashboard } from '@/services/studentService';
import {
  AcademicMetrics,
  AssignmentCard,
  Card,
  dateText,
  EligibilityCard,
  Empty,
  ResourceState,
  StudentPage,
  statusText,
} from '@/components/student/PortalUI';
import { RoadmapStepper } from '@/components/student/dashboard/RoadmapStepper';

export const StudentDashboard = () => {
  const { profile, semesterId, revision, loading } = useStudentPortal();
  const resource = useStudentResource(
    !loading && profile && semesterId
      ? 'dashboard:' + profile.id + ':' + semesterId + ':' + revision
      : null,
    (signal) => getStudentDashboard(semesterId!, signal),
  );
  const data = resource.data;
  const credits = profile?.academicProgress.credits;
  const assignment = data?.internship.assignment ?? null;
  const complete = !!assignment;
  const admission = data?.academic.admissionEligibility;
  const eligible = admission?.status === 'ELIGIBLE' && !admission.isStale;
  return (
    <StudentPage
      title={'Xin chào, ' + (profile?.fullName ?? 'bạn') + '!'}
      description="Tổng quan học tập, điều kiện OJT, phân công thực tập và thông báo của bạn."
    >
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {data && (
        <>
          <AcademicMetrics data={data.academic} />
          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card title="Tiến độ chương trình đào tạo">
                <p className="font-bold text-2xl">
                  {credits?.earned ?? '—'} / {credits?.total ?? '—'} tín chỉ
                </p>
                {credits?.total != null && credits.total > 0 && (
                  <progress
                    className="w-full h-4 accent-orange-500"
                    value={credits.earned}
                    max={credits.total}
                  />
                )}
                <p className="text-sm text-slate-500">
                  {statusText(profile?.academicProgress.status)}
                </p>
                <Link
                  to="/student/academic-profile"
                  className="text-orange-600 font-semibold"
                >
                  Xem bảng điểm và chương trình →
                </Link>
              </Card>
              <Card title="Lộ trình OJT">
                <RoadmapStepper
                  steps={[
                    {
                      id: 1,
                      title: 'Xét điều kiện',
                      status: eligible || complete ? 'completed' : 'current',
                      iconType: 'check',
                      description: eligible
                        ? 'Có kết quả đủ điều kiện hiện hành'
                        : 'Theo kết quả xác nhận của nhà trường',
                    },
                    {
                      id: 2,
                      title: 'Đăng ký OJT',
                      status: complete
                        ? 'completed'
                        : eligible
                          ? 'current'
                          : 'upcoming',
                      iconType: 'register',
                      description: 'Nộp hồ sơ theo đợt đăng ký',
                    },
                    {
                      id: 3,
                      title: 'Thực tập',
                      status: complete ? 'current' : 'upcoming',
                      iconType: 'briefcase',
                      description:
                        assignment?.enterpriseName ??
                        'Chờ phân công doanh nghiệp',
                    },
                  ]}
                />
              </Card>
              <AssignmentCard assignment={assignment} />
            </div>
            <div className="space-y-6">
              <EligibilityCard
                admission={data.academic.admissionEligibility}
                official={data.academic.officialEligibility}
                current={data.academic.currentEligibility}
              />
              <Card title="Mốc thời gian">
                {data.academic.deadline?.assessmentDeadline && (
                  <p className="text-sm">
                    Hạn xét điều kiện:{' '}
                    {dateText(data.academic.deadline.assessmentDeadline)}
                  </p>
                )}
                {data.registrationWindows.items.length ? (
                  data.registrationWindows.items.map((window) => (
                    <div key={window.id} className="text-sm border-b pb-3">
                      <p className="font-bold">{window.name}</p>
                      <p>
                        {dateText(window.startsAt)} – {dateText(window.endsAt)}
                      </p>
                      <p>{statusText(window.status)}</p>
                    </div>
                  ))
                ) : (
                  <Empty>Chưa có đợt đăng ký.</Empty>
                )}
                <Link
                  className="text-orange-600"
                  to="/student/ojt-registration"
                >
                  Xem toàn bộ đợt đăng ký →
                </Link>
              </Card>
              <Card
                title={
                  'Thông báo gần đây · ' +
                  data.notifications.unreadCount +
                  ' chưa đọc'
                }
              >
                {data.notifications.items.length ? (
                  data.notifications.items.map((item) => (
                    <div key={item.id} className="text-sm border-b pb-3">
                      <p className={item.isRead ? '' : 'font-bold'}>
                        {item.title}
                      </p>
                      <p className="text-slate-500">{dateText(item.sentAt)}</p>
                    </div>
                  ))
                ) : (
                  <Empty>Chưa có thông báo.</Empty>
                )}
                <Link className="text-orange-600" to="/student/notifications">
                  Xem tất cả thông báo →
                </Link>
              </Card>
              <Card title="Tư vấn lộ trình">
                <p className="text-sm text-slate-600">
                  Xem các môn cần hoàn thành và yêu cầu tư vấn từ dịch vụ AI.
                </p>
                <Link className="text-orange-600" to="/student/risk-prediction">
                  Xem phân tích học vụ →
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </StudentPage>
  );
};
export default StudentDashboard;
