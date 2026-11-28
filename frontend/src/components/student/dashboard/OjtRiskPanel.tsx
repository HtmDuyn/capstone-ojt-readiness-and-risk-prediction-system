import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert,GraduationCap,RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/shared/useAuth';
import { useStudentRisk, type StudentRiskResource } from '@/hooks/student/useStudentRisk';
import { type RiskAssessment } from '@/services/studentService';
import { RiskOverview } from '../ojt-risk/RiskOverview';
import { AcademicMetrics } from '../ojt-risk/AcademicMetrics';
import { RiskInsights } from '../ojt-risk/RiskInsights';
import { LearningRoadmap } from '../ojt-risk/LearningRoadmap';
import { RoadmapNotes } from '../ojt-risk/LearningRoadmap';
import { RecommendationSummary } from '../ojt-risk/RecommendationSummary';
import { cardClass,focusClass } from '../ojt-risk/risk-ui';
import { StudentCurrentAcademicPeriod } from '../PortalUI';

function AssessmentSkeleton(){
  return <div role="status" aria-label="Đang tải đánh giá OJT" className="space-y-4"><span className="sr-only">Đang tải dữ liệu học vụ và lộ trình…</span><div className={`${cardClass} space-y-4 p-6`}><div className="flex flex-wrap items-start justify-between gap-4"><div aria-hidden="true" className="h-5 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none"/><StudentCurrentAcademicPeriod /></div><div aria-hidden="true" className="space-y-4 animate-pulse motion-reduce:animate-none"><div className="h-8 w-28 rounded-full bg-slate-100"/><div className="h-4 w-full rounded bg-slate-100"/><div className="h-4 w-3/4 rounded bg-slate-100"/></div></div><div aria-hidden="true" className="space-y-4 animate-pulse motion-reduce:animate-none"><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0,1,2,3].map(i=><div key={i} className={`${cardClass} space-y-4 p-5`}><div className="size-10 rounded-xl bg-slate-100"/><div className="h-3 w-3/4 rounded bg-slate-100"/><div className="h-8 w-1/2 rounded bg-slate-100"/></div>)}</div><div className={`${cardClass} h-52 bg-white p-6`}><div className="h-5 w-1/2 rounded bg-slate-100"/><div className="mt-6 h-24 rounded-xl bg-slate-50"/></div></div></div>;
}

function EmptyAssessment() {
  return <div className="space-y-4">
    <section className={`${cardClass} border-l-4 border-l-slate-300 p-5 sm:p-6`} aria-label="Tổng quan đánh giá OJT">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><GraduationCap size={24} aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-slate-900">Đánh giá mức độ rủi ro OJT</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Chưa có kết quả đánh giá. Các chỉ số sẽ hiển thị khi có đủ dữ liệu học vụ.</p></div></div><StudentCurrentAcademicPeriod /></div>
      <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Chưa có dữ liệu đánh giá</p>
    </section>
    <section className={`${cardClass} space-y-5 p-5 sm:p-6`} aria-label="Tiến độ và phân tích OJT">
      <div><h3 className="text-base font-semibold text-slate-900">Tín chỉ tích lũy</h3><p className="mt-3 text-3xl font-bold text-slate-900">—</p><p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu tín chỉ trong đánh giá.</p></div>
      <div className="grid gap-5 border-t border-slate-200 pt-5 lg:grid-cols-2">
        <section aria-label="Phân tích nguyên nhân rủi ro"><h3 className="text-base font-semibold text-slate-900">Phân tích nguyên nhân rủi ro</h3><p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Chưa có thông tin phân tích. Các yếu tố ảnh hưởng sẽ được cập nhật sau khi hệ thống đánh giá dữ liệu học tập.</p></section>
        <section aria-label="Lộ trình học tập đề xuất"><h3 className="text-base font-semibold text-slate-900">Lộ trình học tập đề xuất</h3><p className="mt-3 text-sm leading-6 text-slate-500">Chưa có môn học đề xuất. Bạn vẫn có thể xem bảng điểm và chương trình đào tạo của mình.</p></section>
      </div>
    </section>
    <section className={`${cardClass} p-5 sm:p-6`} aria-label="Hướng hành động tiếp theo"><h3 className="text-base font-semibold text-slate-900">Bạn nên làm gì tiếp theo?</h3><p className="mt-3 text-sm leading-6 text-slate-500">Theo dõi tiến độ học tập và kiểm tra dữ liệu các môn đã hoàn thành để chuẩn bị cho kỳ OJT.</p><Link to="/student/academic-profile" className={`mt-3 inline-block rounded text-sm font-medium text-orange-600 hover:underline ${focusClass}`}>Xem hồ sơ học tập</Link></section>
  </div>;
}

export function OjtRiskPanel({showRefreshAction=true,compactTop=false,compactLayout=false,renderDashboard,assessment}:{showRefreshAction?:boolean;compactTop?:boolean;compactLayout?:boolean;renderDashboard?:(data:RiskAssessment|null)=>ReactNode;assessment?:StudentRiskResource}){
  const {user}=useAuth();
  const fallback=useStudentRisk(!assessment);
  const resource=assessment??fallback;
  const {data,error,reload:refresh,currentAcademic}=resource;
  const loading=resource.pending;
  return <section id="ojt-risk" aria-label="Rủi ro và lộ trình OJT" aria-busy={loading} className={renderDashboard||compactLayout?'min-w-0 scroll-mt-6 space-y-4':`min-w-0 scroll-mt-6 space-y-5 rounded-[24px] bg-[#F8FAFC] sm:space-y-6 ${compactTop ? 'px-3 pb-3 pt-0 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6' : 'p-3 sm:p-5 lg:p-6'}`}>
    {error&&<div role="alert" className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><CircleAlert size={20} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true"/><div><p className="text-sm font-semibold text-rose-900">{data?'Chưa thể cập nhật đánh giá':'Không tải được đánh giá OJT'}</p><p className="mt-1 max-w-xl text-sm leading-relaxed text-rose-700">{error}</p>{data&&<p className="mt-1 text-xs text-rose-700">Đang hiển thị kết quả đã tải trước đó.</p>}</div></div><div className="flex flex-wrap items-end gap-3"><button type="button" disabled={loading} onClick={refresh} className={`inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50 ${focusClass}`}><RefreshCw size={14} aria-hidden="true"/>Thử lại</button></div></div>}
    {renderDashboard&&resource.refreshing&&<p role="status" className="text-xs text-slate-500">Đang cập nhật đánh giá rủi ro và lộ trình…</p>}
    {renderDashboard?renderDashboard(data):loading&&!data?<AssessmentSkeleton/>:data&&compactLayout?<>
      <RiskOverview data={data} refreshing={loading} onRefresh={refresh} showRefreshAction={showRefreshAction}/>
      <section className={`${cardClass} min-w-0 p-5 sm:p-6`} aria-label="Tiến độ và phân tích OJT">
        <AcademicMetrics data={data} academicProgress={currentAcademic?.academicProgress} embedded />
        <div className="mt-5 border-t border-slate-200 pt-5">
          <RiskInsights data={data} embedded />
        </div>
        <div className="mt-5 border-t border-slate-200 pt-5">
          <LearningRoadmap key={`${user?.id??''}:${data.risk.computedAt}`} roadmap={data.roadmap} academicProgress={currentAcademic?.academicProgress} embedded />
          <RoadmapNotes roadmap={data.roadmap} />
        </div>
      </section>
      <section className={`${cardClass} min-w-0 p-5 sm:p-6`}><RecommendationSummary data={data} embedded /></section>
    </>:data?<>
      <RiskOverview data={data} refreshing={loading} onRefresh={refresh} showRefreshAction={showRefreshAction}/>
      <AcademicMetrics data={data} academicProgress={currentAcademic?.academicProgress}/>
      <RiskInsights data={data}/>
      <LearningRoadmap key={`${user?.id??''}:${data.risk.computedAt}`} roadmap={data.roadmap} academicProgress={currentAcademic?.academicProgress}/>
      <RecommendationSummary data={data}/>
    </>:<EmptyAssessment />}
  </section>;
}
