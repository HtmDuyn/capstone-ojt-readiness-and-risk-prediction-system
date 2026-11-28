import { Link } from 'react-router-dom';
import { CalendarDays, Check } from 'lucide-react';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { StudyOverview } from '@/components/student/dashboard/StudyOverview';
import { RiskInsights } from '@/components/student/ojt-risk/RiskInsights';
import { LearningRoadmap, RoadmapNotes } from '@/components/student/ojt-risk/LearningRoadmap';
import { RecommendationSummary } from '@/components/student/ojt-risk/RecommendationSummary';
import { dateText, Empty, ResourceState, StudentPage, statusText } from '@/components/student/PortalUI';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { useStudentRisk } from '@/hooks/student/useStudentRisk';
import { getStudentDashboardSummary, getStudentNotifications } from '@/services/studentService';

const card = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';
const heading = 'text-sm font-semibold text-slate-800 sm:text-base';
const link = 'text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm';

export const StudentDashboard = () => {
  const { profile, semesterId, revision, loading, registrationWindows, windowsLoading } = useStudentPortal();
  const assessment = useStudentRisk();
  const resource = useStudentResource(
    !loading && profile && semesterId ? 'dashboard-summary:' + profile.id + ':' + semesterId + ':' + revision : null,
    (signal) => getStudentDashboardSummary(semesterId!, signal),
  );
  const notifications = useStudentResource(
    !loading && profile ? 'dashboard-notifications:' + profile.id + ':' + revision : null,
    signal => getStudentNotifications(1, signal, undefined, 1),
    { snapshot: true },
  );
  const windows = registrationWindows.filter(window => window.ojtSemesterId === semesterId).slice(0, 5);
  const data = assessment.currentAcademic ? {
    academic: { ...assessment.currentAcademic,
      officialEligibility: resource.data?.academic.officialEligibility ?? null,
      admissionEligibility: resource.data?.academic.admissionEligibility ?? profile?.admissionEligibility },
    internship: { assignment: resource.data?.internship.assignment ?? null },
  } : null;
  const assignment = data?.internship.assignment ?? null;
  const complete = !!assignment;
  const admission = data?.academic.admissionEligibility;
  const eligible = admission?.status === 'ELIGIBLE' && !admission.isStale;
  const steps = [
    { title: 'Xét điều kiện', description: eligible ? 'Có kết quả đủ điều kiện hiện hành' : 'Theo kết quả xác nhận của nhà trường', status: eligible || complete ? 'completed' : 'current' },
    { title: 'Đăng ký OJT', description: 'Nộp hồ sơ theo đợt đăng ký', status: complete ? 'completed' : eligible ? 'current' : 'upcoming' },
    { title: 'Thực tập', description: assignment?.enterpriseName ?? 'Chờ doanh nghiệp tiếp nhận', status: complete ? 'current' : 'upcoming' },
  ];

  return <StudentPage title={'Xin chào, ' + (profile?.fullName ?? 'bạn') + '!'}
    description="Tổng quan học tập, điều kiện OJT, nhiệm vụ thực tập và thông báo của bạn."
    needsSemester={false} showRefreshAction={false} showSemesterInBanner={false} compactTopSpacing>
    <ResourceState loading={resource.loading} refreshing={resource.refreshing} error={resource.error} retry={resource.reload} />
    <OjtRiskPanel key={'ojt-risk:' + (profile?.id ?? 'pending') + ':' + revision}
      assessment={assessment} showRefreshAction={false} renderDashboard={risk => <div className="space-y-4">
        <StudyOverview academic={data?.academic ?? null} risk={risk} pending={assessment.pending}
          summaryPending={resource.pending} summaryError={!!resource.error} />

        <section className={card} aria-labelledby="student-ojt-roadmap">
          <h2 id="student-ojt-roadmap" className="text-lg font-bold text-slate-900 sm:text-xl">Lộ trình &amp; kế hoạch OJT</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><h3 className={heading}>Lộ trình OJT</h3>
              <ol aria-label="Các giai đoạn OJT" className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">{steps.map((step, index) => <li key={step.title} aria-current={step.status === 'current' ? 'step' : undefined} className="relative min-w-0 text-center">
                {index < 2 && <span aria-hidden="true" className="absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 h-px bg-slate-300" />}
                <span className={`relative mx-auto grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${step.status === 'completed' ? 'border-emerald-600 bg-emerald-600 text-white' : step.status === 'current' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500'}`}>{step.status === 'completed' ? <Check size={18} aria-hidden="true" /> : index + 1}<span className="sr-only">{step.status === 'completed' ? 'Đã hoàn thành' : step.status === 'current' ? 'Hiện tại' : 'Sắp tới'}</span></span>
                <p className="mt-3 text-sm font-semibold text-slate-800">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{step.description}</p>
              </li>)}</ol>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className={heading}>Mốc thời gian quan trọng</h3>
              {data?.academic.deadline?.assessmentDeadline && <div className="mt-3 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" /><div><p className="text-sm font-medium text-slate-800">Hạn xét điều kiện</p><p className="mt-1 text-xs text-slate-500">{dateText(data.academic.deadline.assessmentDeadline)}</p></div></div>}
              {windows.length ? <ul className="mt-3 divide-y divide-slate-100">{windows.map(window => <li key={window.id} className="flex items-start gap-3 py-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="break-words text-sm font-medium text-slate-800">{window.name}</p><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{statusText(window.status)}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{dateText(window.startsAt)} – {dateText(window.endsAt)}</p></div></li>)}</ul> : <Empty>{windowsLoading ? 'Đang tải đợt đăng ký…' : 'Chưa có đợt đăng ký.'}</Empty>}
              <Link className={`${link} mt-3 inline-block`} to="/student/ojt-registration">Xem toàn bộ đợt đăng ký</Link>
            </div>
          </div>
          <div className="mt-5 space-y-5 border-t border-slate-200 pt-5">
            <div className="min-w-0">{risk ? <RiskInsights data={risk} embedded rows /> : <><h3 className={heading}>Phân tích nguyên nhân rủi ro</h3><p className="mt-3 text-sm text-slate-500">{assessment.pending ? 'Đang tải phân tích rủi ro…' : 'Chưa có dữ liệu phân tích. Các yếu tố rủi ro sẽ hiển thị khi có đánh giá.'}</p></>}</div>
            <div className="min-w-0 border-t border-slate-200 pt-5">{risk ? <LearningRoadmap key={profile?.id + ':' + risk.risk.computedAt} roadmap={risk.roadmap} embedded timeline /> : <><h3 className={heading}>Lộ trình học tập đề xuất</h3><p className="mt-3 text-sm text-slate-500">{assessment.pending ? 'Đang tải lộ trình học tập…' : 'Chưa có lộ trình đề xuất. Bạn vẫn có thể xem bảng điểm và chương trình đào tạo.'}</p></>}</div>
          </div>
          {risk && <RoadmapNotes roadmap={risk.roadmap} accordion />}
        </section>

        <section className={card} aria-labelledby="student-actions">
          <h2 id="student-actions" className="text-lg font-bold text-slate-900 sm:text-xl">Thông tin &amp; hành động</h2>
          <ResourceState loading={notifications.loading} refreshing={notifications.refreshing} error={notifications.error} retry={notifications.reload} />
          <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5 md:grid-cols-3 md:gap-0">
            <div className="flex h-full min-w-0 flex-col md:pr-5"><h3 className={heading}>Thông báo gần đây{notifications.data && <> · {notifications.data.unreadCount} chưa đọc</>}</h3>
              {notifications.data?.items.length ? <div className="mt-3 text-sm"><p className={notifications.data.items[0].isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}>{notifications.data.items[0].title}</p><p className="mt-1 text-xs text-slate-500">{dateText(notifications.data.items[0].sentAt)}</p></div> : <Empty>{notifications.pending ? 'Đang tải thông báo…' : 'Chưa có thông báo.'}</Empty>}
              <div className="mt-auto pt-3"><Link className={link} to="/student/notifications">Xem tất cả thông báo</Link></div></div>
            <div className="flex h-full min-w-0 flex-col border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:px-5 md:pt-0"><h3 className={heading}>Nhiệm vụ thực tập</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">Xem nhiệm vụ được doanh nghiệp giao và gửi bài làm của bạn.</p><div className="mt-auto pt-3"><Link className={link} to="/student/internship-progress">Xem nhiệm vụ</Link></div></div>
            <div className="flex h-full min-w-0 flex-col border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0"><h3 className={heading}>Tư vấn lộ trình</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">Xem các môn cần hoàn thành và yêu cầu tư vấn từ dịch vụ AI.</p><div className="mt-auto pt-3"><Link className={link} to="/student/risk-prediction">Xem rủi ro và lộ trình OJT</Link></div></div>
          </div>
          {risk && <div className="mt-5 border-t border-slate-200 pt-5"><RecommendationSummary data={risk} embedded /></div>}
        </section>
      </div>} />
  </StudentPage>;
};
export default StudentDashboard;
