import { useEffect,useState,type ReactNode } from 'react';
import { CircleAlert,GraduationCap,RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOjtRiskAssessment,type RiskAssessment } from '@/services/studentOjtRisk.service';
import { RiskOverview } from '../ojt-risk/RiskOverview';
import { AcademicMetrics } from '../ojt-risk/AcademicMetrics';
import { RiskInsights } from '../ojt-risk/RiskInsights';
import { LearningRoadmap } from '../ojt-risk/LearningRoadmap';
import { RoadmapNotes } from '../ojt-risk/LearningRoadmap';
import { RecommendationSummary } from '../ojt-risk/RecommendationSummary';
import { cardClass,focusClass } from '../ojt-risk/risk-ui';
import { StudentSemesterSelect } from '../PortalUI';

function AssessmentSkeleton({showSemesterSelector=false}:{showSemesterSelector?:boolean}){
  return <div role="status" aria-label="Đang tải đánh giá OJT" className="space-y-4"><span className="sr-only">Đang tải dữ liệu học vụ và lộ trình…</span><div className={`${cardClass} space-y-4 p-6`}><div className="flex flex-wrap items-start justify-between gap-4"><div aria-hidden="true" className="h-5 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none"/>{showSemesterSelector && <div className="w-full sm:w-60"><StudentSemesterSelect /></div>}</div><div aria-hidden="true" className="space-y-4 animate-pulse motion-reduce:animate-none"><div className="h-8 w-28 rounded-full bg-slate-100"/><div className="h-4 w-full rounded bg-slate-100"/><div className="h-4 w-3/4 rounded bg-slate-100"/></div></div><div aria-hidden="true" className="space-y-4 animate-pulse motion-reduce:animate-none"><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0,1,2,3].map(i=><div key={i} className={`${cardClass} space-y-4 p-5`}><div className="size-10 rounded-xl bg-slate-100"/><div className="h-3 w-3/4 rounded bg-slate-100"/><div className="h-8 w-1/2 rounded bg-slate-100"/></div>)}</div><div className={`${cardClass} h-52 bg-white p-6`}><div className="h-5 w-1/2 rounded bg-slate-100"/><div className="mt-6 h-24 rounded-xl bg-slate-50"/></div></div></div>;
}

export function OjtRiskPanel({showRefreshAction=true,showSemesterSelector=false,compactTop=false,compactLayout=false,renderDashboard}:{showRefreshAction?:boolean;showSemesterSelector?:boolean;compactTop?:boolean;compactLayout?:boolean;renderDashboard?:(data:RiskAssessment|null)=>ReactNode}){
  const {token,user}=useAuth();
  const identity=`${user?.id??''}:${token??''}`;
  const [result,setResult]=useState<{identity:string;data:RiskAssessment}|null>(null);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
  const data=result?.identity===identity?result.data:null;
  useEffect(()=>{
    const controller=new AbortController();setError('');setLoading(true);
    if(!token){setResult(null);setLoading(false);return ()=>controller.abort();}
    getOjtRiskAssessment(controller.signal).then(r=>{if(!controller.signal.aborted)setResult({identity,data:r});})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được đánh giá rủi ro.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[token,user?.id,identity,reload]);
  const refresh=()=>setReload(n=>n+1);
  return <section id="ojt-risk" aria-label="Rủi ro và lộ trình OJT" aria-busy={loading} className={renderDashboard||compactLayout?'min-w-0 scroll-mt-6 space-y-4':`min-w-0 scroll-mt-6 space-y-5 rounded-[24px] bg-[#F8FAFC] sm:space-y-6 ${compactTop ? 'px-3 pb-3 pt-0 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6' : 'p-3 sm:p-5 lg:p-6'}`}>
    {error&&<div role="alert" className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><CircleAlert size={20} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true"/><div><p className="text-sm font-semibold text-rose-900">{data?'Chưa thể cập nhật đánh giá':'Không tải được đánh giá OJT'}</p><p className="mt-1 max-w-xl text-sm leading-relaxed text-rose-700">{error}</p>{data&&<p className="mt-1 text-xs text-rose-700">Đang hiển thị kết quả đã tải trước đó.</p>}</div></div><div className="flex flex-wrap items-end gap-3">{showSemesterSelector&&!data&&!loading&&<div className="w-full sm:w-60"><StudentSemesterSelect /></div>}<button type="button" disabled={loading} onClick={refresh} className={`inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50 ${focusClass}`}><RefreshCw size={14} aria-hidden="true"/>Thử lại</button></div></div>}
    {renderDashboard?renderDashboard(data):loading&&!data?<AssessmentSkeleton showSemesterSelector={showSemesterSelector}/>:data&&compactLayout?<>
      <RiskOverview data={data} refreshing={loading} onRefresh={refresh} showRefreshAction={showRefreshAction} showSemesterSelector={showSemesterSelector}/>
      <section className={`${cardClass} min-w-0 p-5 sm:p-6`} aria-label="Tiến độ và phân tích OJT">
        <AcademicMetrics data={data} embedded />
        <div className="mt-5 grid gap-6 border-t border-slate-200 pt-5 lg:grid-cols-2 lg:gap-0">
          <div className="min-w-0 lg:pr-6"><RiskInsights data={data} embedded /></div>
          <div className="min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><LearningRoadmap key={`${user?.id??''}:${data.risk.computedAt}`} roadmap={data.roadmap} embedded /></div>
        </div>
        <RoadmapNotes roadmap={data.roadmap} />
      </section>
      <section className={`${cardClass} min-w-0 p-5 sm:p-6`}><RecommendationSummary data={data} embedded /></section>
    </>:data?<>
      <RiskOverview data={data} refreshing={loading} onRefresh={refresh} showRefreshAction={showRefreshAction} showSemesterSelector={showSemesterSelector}/>
      <AcademicMetrics data={data}/>
      <RiskInsights data={data}/>
      <LearningRoadmap key={`${user?.id??''}:${data.risk.computedAt}`} roadmap={data.roadmap}/>
      <RecommendationSummary data={data}/>
    </>:!error&&<div className={`${cardClass} flex flex-col items-center p-8 text-center sm:p-12`}><span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400"><GraduationCap size={28} aria-hidden="true"/></span><h2 className="font-bold text-slate-800">Chưa có đánh giá học tập</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">Đăng nhập tài khoản sinh viên để xem mức rủi ro và lộ trình OJT của bạn.</p></div>}
  </section>;
}
