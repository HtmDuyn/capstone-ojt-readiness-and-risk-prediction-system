import { Link } from 'react-router-dom';
import { OjtRiskPanel } from '@/components/student/dashboard/OjtRiskPanel';
import { CreditProgressChart, RiskLevelChart } from '@/components/student/dashboard/DashboardCharts';
import { RiskInsights } from '@/components/student/ojt-risk/RiskInsights';
import { LearningRoadmap, RoadmapNotes } from '@/components/student/ojt-risk/LearningRoadmap';
import { RecommendationSummary } from '@/components/student/ojt-risk/RecommendationSummary';
import { riskTheme } from '@/components/student/ojt-risk/risk-ui';
import { Blockers, dateText, Empty, ResourceState, StudentPage, StudentSemesterSelect, statusText } from '@/components/student/PortalUI';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getStudentDashboard } from '@/services/studentService';

const card = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';
const heading = 'text-sm font-semibold text-slate-800 sm:text-base';
const link = 'text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm';

export const StudentDashboard = () => {
  const { profile, semesterId, revision, loading } = useStudentPortal();
  const resource = useStudentResource(
    !loading && profile && semesterId ? 'dashboard:' + profile.id + ':' + semesterId + ':' + revision : null,
    (signal) => getStudentDashboard(semesterId!, signal),
  );
  const data = resource.data;
  const credits = profile?.academicProgress.credits;
  const assignment = data?.internship.assignment ?? null;
  const complete = !!assignment;
  const admission = data?.academic.admissionEligibility;
  const eligible = admission?.status === 'ELIGIBLE' && !admission.isStale;
  const percent = credits?.total != null && credits.total > 0
    ? Math.max(0, Math.min(100, Math.round(credits.earned / credits.total * 100))) : null;
  const steps = [
    { title: 'Xét điều kiện', description: eligible ? 'Có kết quả đủ điều kiện hiện hành' : 'Theo kết quả xác nhận của nhà trường', status: eligible || complete ? 'completed' : 'current' },
    { title: 'Đăng ký OJT', description: 'Nộp hồ sơ theo đợt đăng ký', status: complete ? 'completed' : eligible ? 'current' : 'upcoming' },
    { title: 'Thực tập', description: assignment?.enterpriseName ?? 'Chờ doanh nghiệp tiếp nhận', status: complete ? 'current' : 'upcoming' },
  ];

  return <StudentPage title={'Xin chào, ' + (profile?.fullName ?? 'bạn') + '!'}
    description="Tổng quan học tập, điều kiện OJT, nhiệm vụ thực tập và thông báo của bạn."
    showRefreshAction={false} showSemesterInBanner={false} compactTopSpacing>
    <ResourceState loading={resource.loading} error={resource.error} retry={resource.reload} />
    <OjtRiskPanel key={'ojt-risk:' + (profile?.id ?? 'pending') + ':' + revision}
      showRefreshAction={false} renderDashboard={risk => data && <div className="space-y-4">
        <section className={card} aria-labelledby="student-ojt-overview">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div><h2 id="student-ojt-overview" className="text-lg font-bold text-slate-900 sm:text-xl">Tổng quan OJT</h2>
              <p className="mt-1 text-sm text-slate-500">{profile?.fullName}{risk?.student.studentCode && <> · {risk.student.studentCode}</>}</p></div>
            <div className="w-full sm:w-60"><StudentSemesterSelect /></div>
          </div>
          <div className="grid gap-5 py-5 lg:grid-cols-3 lg:gap-0">
            <div className="min-w-0 lg:pr-5"><h3 className={heading}>Mức cảnh báo AI về OJT</h3>
              {risk ? <><RiskLevelChart level={risk.risk.level} />
                <p className={`mx-auto mt-3 w-fit rounded-full border px-3 py-1 text-sm font-bold ${riskTheme[risk.risk.level].badge}`}>{riskTheme[risk.risk.level].label}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{riskTheme[risk.risk.level].description}</p>
                <p className="mt-2 text-xs text-slate-500">Cập nhật: {dateText(risk.risk.computedAt)}</p></>
                : <p className="mt-3 text-sm text-slate-500">Đang tải đánh giá rủi ro…</p>}</div>
            <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:px-5 lg:pt-0">
              <h3 className={heading}>Tiến độ chương trình đào tạo</h3>
              <CreditProgressChart percent={percent} />
              <p className="mt-3 text-center text-xl font-bold text-slate-900">{credits?.earned ?? '—'} / {credits?.total ?? '—'} <span className="text-sm font-medium text-slate-500">tín chỉ</span></p>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-600" />Đã tích lũy</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-200" />Còn lại</span></div>
              <p className="mt-2 text-sm text-slate-500">{statusText(profile?.academicProgress.status)}</p>
              <Link to="/student/academic-profile" className={`${link} mt-3 inline-block`}>Xem bảng điểm và chương trình</Link>
            </div>
            <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <h3 className={heading}>Điều kiện tham gia OJT</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="text-slate-500">Bàn giao từ Phòng Đào tạo</dt><dd className={eligible ? 'font-bold text-emerald-700' : 'font-semibold text-slate-800'}>{admission ? admission.isStale ? 'Dữ liệu đã thay đổi, cần rà soát' : statusText(admission.status) : 'Chưa có dữ liệu'}</dd></div>
                <div><dt className="text-slate-500">Kết quả chính thức</dt><dd className="font-semibold text-slate-800">{data.academic.officialEligibility?.isStale ? 'Đã cũ, chờ xét lại' : statusText(data.academic.officialEligibility?.status)}</dd></div>
                {data.academic.currentEligibility && <div><dt className="text-slate-500">Đối chiếu hiện tại</dt><dd className="font-semibold text-slate-800">{statusText(data.academic.currentEligibility.status)}</dd></div>}
              </dl>
              <Blockers values={data.academic.officialEligibility?.reasons ?? data.academic.currentEligibility?.reasons} />
              {data.academic.currentEligibility?.rule && <p className="mt-3 text-xs leading-relaxed text-slate-500">Ngưỡng theo quy định: {data.academic.currentEligibility.rule.minCredits} tín chỉ, tối đa {data.academic.currentEligibility.rule.maxUnpassedCourses} môn nợ.</p>}
            </div>
          </div>
          {eligible && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <strong className="font-semibold">Hiện đáp ứng đủ tiêu chí để tham gia OJT.</strong>
            <span>Hạn xét điều kiện OJT: {dateText(data.academic.deadline?.assessmentDeadline)}</span></div>}
        </section>

        <section className={card} aria-labelledby="student-ojt-roadmap">
          <h2 id="student-ojt-roadmap" className="text-lg font-bold text-slate-900 sm:text-xl">Lộ trình &amp; kế hoạch OJT</h2>
          <div className="mt-5 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-2 lg:gap-0">
            <div className="min-w-0 lg:pr-6"><h3 className={heading}>Lộ trình OJT</h3>
              <ol className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">{steps.map((step, index) => <li key={step.title} className="relative min-w-0 text-center">
                {index < 2 && <span aria-hidden="true" className="absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 h-px bg-slate-300" />}
                <span className={`relative mx-auto grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${step.status === 'completed' ? 'border-emerald-600 bg-emerald-600 text-white' : step.status === 'current' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500'}`}>{index + 1}</span>
                <p className="mt-3 text-sm font-semibold text-slate-800">{step.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{step.description}</p>
              </li>)}</ol>
            </div>
            <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <h3 className={heading}>Mốc thời gian quan trọng</h3>
              {data.academic.deadline?.assessmentDeadline && <p className="mt-3 text-sm text-slate-600">Hạn xét điều kiện: <strong className="text-slate-800">{dateText(data.academic.deadline.assessmentDeadline)}</strong></p>}
              {data.registrationWindows.items.length ? <div className="mt-3 divide-y divide-slate-100">{data.registrationWindows.items.map(window => <div key={window.id} className="py-2 text-sm"><p className="font-semibold text-slate-800">{window.name}</p><p className="text-slate-500">{dateText(window.startsAt)} – {dateText(window.endsAt)} · {statusText(window.status)}</p></div>)}</div> : <Empty>Chưa có đợt đăng ký.</Empty>}
              <Link className={`${link} mt-3 inline-block`} to="/student/ojt-registration">Xem toàn bộ đợt đăng ký</Link>
            </div>
          </div>
          <div className="mt-5 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-2 lg:gap-0">
            <div className="min-w-0 lg:pr-6">{risk ? <RiskInsights data={risk} embedded /> : <p className="text-sm text-slate-500">Đang tải phân tích rủi ro…</p>}</div>
            <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">{risk ? <LearningRoadmap key={profile?.id + ':' + risk.risk.computedAt} roadmap={risk.roadmap} embedded /> : <p className="text-sm text-slate-500">Đang tải lộ trình học tập…</p>}</div>
          </div>
          {risk && <RoadmapNotes roadmap={risk.roadmap} />}
        </section>

        <section className={card} aria-labelledby="student-actions">
          <h2 id="student-actions" className="text-lg font-bold text-slate-900 sm:text-xl">Thông tin &amp; hành động</h2>
          <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5 md:grid-cols-3 md:gap-0">
            <div className="flex h-full min-w-0 flex-col md:pr-5"><h3 className={heading}>Thông báo gần đây · {data.notifications.unreadCount} chưa đọc</h3>
              {data.notifications.items.length ? <div className="mt-3 text-sm"><p className={data.notifications.items[0].isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}>{data.notifications.items[0].title}</p><p className="mt-1 text-xs text-slate-500">{dateText(data.notifications.items[0].sentAt)}</p></div> : <Empty>Chưa có thông báo.</Empty>}
              <div className="mt-auto pt-3"><Link className={link} to="/student/notifications">Xem tất cả thông báo</Link></div></div>
            <div className="flex h-full min-w-0 flex-col border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:px-5 md:pt-0"><h3 className={heading}>Nhiệm vụ thực tập</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">Xem nhiệm vụ được doanh nghiệp giao và gửi bài làm của bạn.</p><div className="mt-auto pt-3"><Link className={link} to="/student/internship-progress">Xem nhiệm vụ</Link></div></div>
            <div className="flex h-full min-w-0 flex-col border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0"><h3 className={heading}>Tư vấn lộ trình</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">Xem các môn cần hoàn thành và yêu cầu tư vấn từ dịch vụ AI.</p><div className="mt-auto pt-3"><Link className={link} to="/student/risk-prediction">Xem phân tích học vụ</Link></div></div>
          </div>
          {risk && <div className="mt-5 border-t border-slate-200 pt-5"><RecommendationSummary data={risk} embedded /></div>}
        </section>
      </div>} />
  </StudentPage>;
};
export default StudentDashboard;
