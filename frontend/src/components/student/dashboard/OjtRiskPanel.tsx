import { useEffect,useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOjtRiskAssessment,type RiskAssessment } from '@/services/studentOjtRisk.service';

const colors={LOW:'bg-emerald-50 text-emerald-800 border-emerald-200',MEDIUM:'bg-amber-50 text-amber-900 border-amber-200',HIGH:'bg-red-50 text-red-800 border-red-200',INSUFFICIENT_DATA:'bg-slate-100 text-slate-700 border-slate-200'};
export function OjtRiskPanel(){
  const {token,user}=useAuth();
  const [data,setData]=useState<RiskAssessment|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setData(null);setError('');setLoading(true);
    if(!token){setLoading(false);return ()=>controller.abort();}
    getOjtRiskAssessment(controller.signal).then(r=>{if(!controller.signal.aborted)setData(r);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được đánh giá rủi ro.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[token,user?.id,reload]);
  const value=(n:number|null|undefined)=>n==null?'Chưa có dữ liệu':n.toLocaleString('vi-VN');
  return <section id="ojt-risk" className="card-glass space-y-5 scroll-mt-6 p-5 sm:p-6" aria-labelledby="ojt-risk-title">
    <div className="flex flex-wrap justify-between gap-3"><h2 id="ojt-risk-title" className="text-lg font-bold text-slate-900">Rủi ro và lộ trình OJT</h2><button type="button" disabled={loading} onClick={()=>setReload(n=>n+1)} className="text-sm font-semibold text-orange-700 disabled:opacity-50">Cập nhật đánh giá</button></div>
    {loading?<p role="status">Đang đánh giá tiến độ học tập…</p>:error?<p role="alert" className="text-red-700">{error}</p>:!data?<p>Đăng nhập tài khoản sinh viên để xem đánh giá.</p>:<>
      <div className={`rounded-xl border p-4 ${colors[data.risk.level]}`}><h3 className="font-bold">1. Mức rủi ro OJT: {data.risk.label}</h3><p className="mt-1 text-sm">Đánh giá dựa trên tiến độ học tập và điều kiện OJT hiện tại của bạn.</p></div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[['Kỳ hiện tại',data.student.currentSemester],['Tín chỉ tích lũy',data.risk.evidence.earnedCredits],['Tín chỉ còn thiếu',data.risk.evidence.missingCredits],['Môn còn nợ',data.status==='ASSESSED'?data.risk.evidence.failedCourseCount:null]].map(([label,n])=><div key={String(label)} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-xl font-bold">{value(n as number|null)}</dd></div>)}</dl>
      <div><h3 className="font-semibold">Căn cứ đánh giá</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{data.risk.reasons.map(r=><li key={r.code}>{r.message}</li>)}</ul></div>
      <p className="text-xs text-slate-500">Hạn xét OJT: {data.risk.evidence.assessmentDeadline?new Date(data.risk.evidence.assessmentDeadline).toLocaleString('vi-VN'):'Chưa được nhà trường cấu hình'}</p>
      <div className="space-y-3 border-t border-slate-200 pt-5"><h3 className="font-bold">2. Lộ trình đề xuất</h3><p className="text-sm">{data.roadmap.status==='READY'?data.roadmap.objective:data.roadmap.message}</p>
        <p className="text-xs text-slate-500">Phạm vi đề xuất: đến kỳ thực tập {data.roadmap.targetSemester}. Không bao gồm môn của các kỳ sau thực tập.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">{data.roadmap.actions.map(a=><li key={a}>{a}</li>)}</ul>
        {data.roadmap.status==='READY'&&<><p className="text-xs text-slate-500">{data.roadmap.message}</p>{data.roadmap.items.length===0&&<p className="text-sm">Hiện không có môn cần bổ sung trong danh sách đề xuất. Tiếp tục hoàn thành môn đang học và theo dõi kết quả xét OJT.</p>}
          {data.roadmap.items.map(c=><article key={c.courseId} className="rounded-xl border border-slate-200 p-4 text-sm"><h4 className="font-semibold">{c.priority}. {c.courseCode??c.name??'Môn học'} · {c.action==='RETAKE'?'Học lại':'Học mới'}</h4><p className="mt-2">{c.explanation}</p><p className="mt-2 text-xs text-slate-500">{c.canPlan?'Có thể ưu tiên theo điều kiện tiên quyết hiện tại.':'Chỉ lên kế hoạch sau khi hoàn thành tiên quyết.'}{c.isAlternative?' Đây là một phương án trong nhóm môn lựa chọn.':''}</p>{c.prerequisites.filter(p=>!p.satisfied).map((p,i)=><p key={i} className="mt-1 text-xs text-amber-800">Cần đạt thêm {p.remainingRequired} môn trong nhóm: {p.courses.filter(m=>!m.passed).map(m=>m.courseCode??`Môn ${m.courseId}`).join(', ')}.</p>)}</article>)}</>}
      </div>
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Lưu ý khi sử dụng kết quả</summary><ul className="mt-2 list-disc space-y-1 pl-4">{[...data.risk.limitations,...data.roadmap.limitations].map((l,i)=><li key={i}>{l}</li>)}</ul></details>
    </>}
  </section>;
}
