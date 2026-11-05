import { useEffect,useRef,useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { studentAcademic,type AcademicWarning,type Advice,type CourseAdvice,type Impact,type Simulation } from '@/services/studentAcademic.service';

const colors={LOW:'bg-emerald-50 text-emerald-800 border-emerald-200',MEDIUM:'bg-amber-50 text-amber-900 border-amber-200',HIGH:'bg-red-50 text-red-800 border-red-200',INSUFFICIENT_DATA:'bg-slate-100 text-slate-700 border-slate-200'};
const button='rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed';
const field='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
export function AcademicWarningPanel(){
  const {token,user}=useAuth();
  const [warning,setWarning]=useState<AcademicWarning|null>(null);
  const [context,setContext]=useState<{ojtSemesterId:number|null;available:boolean}|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState('');
  const [reload,setReload]=useState(0),[advice,setAdvice]=useState<Advice|null>(null),[courses,setCourses]=useState<CourseAdvice|null>(null);
  const [code,setCode]=useState(''),[codes,setCodes]=useState(''),[impact,setImpact]=useState<Impact|null>(null),[simulation,setSimulation]=useState<Simulation|null>(null);
  const [taskError,setTaskError]=useState('');
  const pending=useRef<AbortController|null>(null);
  useEffect(()=>{
    const controller=new AbortController();pending.current?.abort();pending.current=null;
    setWarning(null);setContext(null);setAdvice(null);setCourses(null);setImpact(null);setSimulation(null);setCode('');setCodes('');setTaskError('');setError('');setLoading(true);setBusy('');
    if(!token){setLoading(false);return ()=>controller.abort();}
    studentAcademic.readiness(controller.signal)
      .then(async p=>{const w=p.academic?.academicWarning??await studentAcademic.warning(controller.signal);if(!controller.signal.aborted){setWarning(w);setContext({ojtSemesterId:p.ojtSemesterId,available:p.academic?.earlyWarning.available??false});}})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được cảnh báo học vụ.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>{controller.abort();pending.current?.abort();};
  },[token,user?.id,reload]);
  const run=async(name:string,work:(signal:AbortSignal)=>Promise<void>)=>{
    if(pending.current)return;
    const controller=new AbortController();pending.current=controller;setBusy(name);setTaskError('');
    try{await work(controller.signal);}catch(e){if(!controller.signal.aborted)setTaskError(e instanceof Error?e.message:'Yêu cầu không thành công.');}
    finally{if(pending.current===controller){pending.current=null;setBusy('');}}
  };
  const available=!!context?.available&&!!context.ojtSemesterId;
  const value=(n:number|null|undefined)=>n==null?'Chưa có dữ liệu':n.toLocaleString('vi-VN');
  return <section className="card-glass p-5 sm:p-6 space-y-5" aria-labelledby="academic-warning-title">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 id="academic-warning-title" className="text-lg font-bold text-slate-900">Cảnh báo sớm và tư vấn học vụ</h2><p className="mt-1 text-sm text-slate-500">Dữ liệu của {user?.name??'sinh viên đang đăng nhập'}</p></div>
      <button type="button" disabled={loading||!!busy} className="text-sm font-semibold text-orange-700 disabled:opacity-50" onClick={()=>setReload(n=>n+1)}>Cập nhật</button></div>
    {loading?<p role="status">Đang tải dữ liệu học vụ…</p>:error?<p role="alert" className="text-sm text-red-700">{error}</p>:!warning?<p>Đăng nhập tài khoản sinh viên để xem cảnh báo.</p>:<>
      <div className={`rounded-xl border p-4 ${colors[warning.level]}`}><span className="text-sm font-bold">Mức cảnh báo: {warning.label}</span><p className="mt-1 text-xs">Đánh giá dựa trên tiến độ học tập và điều kiện OJT hiện tại của bạn.</p></div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[
        ['Kỳ hiện tại',value(warning.evidence.currentSemester)],['Tín chỉ tích lũy',value(warning.evidence.earnedCredits)],['Tín chỉ còn thiếu',value(warning.evidence.missingCredits)],['Môn còn nợ',value(warning.evidence.failedCourseCount)],
      ].map(([label,text])=><div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-xl font-bold text-slate-900">{text}</dd></div>)}</dl>
      <div><h3 className="text-sm font-semibold">Nguyên nhân</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{warning.reasons.map(r=><li key={r.code}>{r.message}</li>)}</ul></div>
      <div><h3 className="text-sm font-semibold">Việc nên làm</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{warning.actions.map(a=><li key={a}>{a}</li>)}</ul></div>
      <p className="text-xs text-slate-500">Hạn xét: {warning.evidence.assessmentDeadline?new Date(warning.evidence.assessmentDeadline).toLocaleString('vi-VN'):'Chưa cấu hình'}</p>
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Phạm vi đánh giá</summary><ul className="mt-2 list-disc space-y-1 pl-4">{warning.limitations.map(l=><li key={l}>{l}</li>)}</ul></details>
      <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={!available||!!busy} onClick={()=>run('advice',async signal=>{const r=await studentAcademic.advice(context!.ojtSemesterId!,signal);if(!signal.aborted)setAdvice(r);})}>{busy==='advice'?'Đang tư vấn…':'Nhận tư vấn OJT'}</button>
        <button type="button" className={button} disabled={!available||!!busy} onClick={()=>run('courses',async signal=>{const r=await studentAcademic.courses(signal);if(!signal.aborted)setCourses(r);})}>{busy==='courses'?'Đang tìm môn…':'Gợi ý môn ưu tiên'}</button></div>
      {!available&&<p className="text-xs text-slate-500">Tư vấn được bật từ kỳ 2 khi có tín chỉ tích lũy, dữ liệu hợp lệ và kỳ OJT đã được cấu hình.</p>}
      {taskError&&<p role="alert" className="text-sm text-red-700">{taskError}</p>}
      {advice&&<div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm"><p>{advice.explanation}</p><ul className="mt-2 list-disc pl-5">{advice.recommendations.map(r=><li key={r}>{r}</li>)}</ul><p className="mt-2 text-xs">Khuyến nghị hỗ trợ lập kế hoạch học tập. Kết quả xét OJT chính thức do nhà trường xác nhận.</p></div>}
      {courses&&<div className="space-y-3"><h3 className="text-sm font-semibold">Môn nên ưu tiên</h3><p className="text-xs text-slate-500">{courses.coursePlan?.message??courses.message}</p>{courses.coursePlan?.items.map(c=><article key={c.courseId} className="rounded-xl border border-slate-200 p-4 text-sm"><h4 className="font-semibold">{c.priority}. {c.courseCode} · {c.action==='RETAKE'?'Học lại':'Học mới'}</h4><p className="mt-2">{c.explanation}</p><p className="mt-2 text-xs text-slate-500">{c.canPlan?'Đã đáp ứng tiên quyết theo dữ liệu hiện tại.':'Cần hoàn thành tiên quyết trước.'}</p>{c.prerequisites.filter(p=>!p.satisfied).map((p,i)=><p key={i} className="mt-1 text-xs text-amber-800">Cần đạt thêm {p.remainingRequired} môn trong nhóm: {p.courses.filter(m=>!m.passed).map(m=>m.courseCode).join(', ')}</p>)}</article>)}</div>}
      <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Tra cứu ảnh hưởng của một môn</summary><form className="mt-3 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setImpact(null);run('impact',async signal=>{const r=await studentAcademic.impact(code.trim().toUpperCase(),signal);if(!signal.aborted)setImpact(r);});}}><label className="flex-1 min-w-36"><span className="sr-only">Mã môn cần tra cứu</span><input className={field} required maxLength={20} placeholder="Ví dụ: EXE101" value={code} onChange={e=>setCode(e.target.value)}/></label><button className={button} disabled={!!busy}>{busy==='impact'?'Đang tra cứu…':'Xem ảnh hưởng'}</button></form>{impact&&<div role="status" className="mt-3 text-sm"><p>{impact.explanation}</p>{impact.indirectCourses.length>0&&<p className="mt-2">Liên hệ gián tiếp: {impact.indirectCourses.map(c=>c.courseCode).join(', ')}.</p>}<p className="mt-2 text-xs text-slate-500">{impact.message}</p></div>}</details>
      <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Mô phỏng nếu đạt các môn đã chọn</summary><form className="mt-3 space-y-2" onSubmit={e=>{e.preventDefault();setSimulation(null);run('simulation',async signal=>{const r=await studentAcademic.simulate(codes.split(/[,;\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean),signal);if(!signal.aborted)setSimulation(r);});}}><label className="block text-xs text-slate-600">Các mã môn, cách nhau bằng dấu phẩy<input className={`${field} mt-1`} required maxLength={420} placeholder="SWP391, SWR302" value={codes} onChange={e=>setCodes(e.target.value)}/></label><button className={button} disabled={!available||!!busy}>{busy==='simulation'?'Đang mô phỏng…':'Mô phỏng'}</button></form>{simulation&&<div role="status" className="mt-3 text-sm"><p>Tín chỉ: {simulation.before.earnedCredits} → {simulation.after.earnedCredits}. Còn thiếu {simulation.after.missingCredits} tín chỉ; còn {simulation.after.failedCourseCount} môn nợ.</p>{simulation.prerequisiteWarnings.map(w=><p key={w.courseCode} className="mt-2 text-amber-800">{w.courseCode}: {w.message}</p>)}<p className="mt-2 text-xs text-slate-500">{simulation.message}</p></div>}</details>
    </>}
  </section>;
}
