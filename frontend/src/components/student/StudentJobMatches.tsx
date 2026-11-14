import { useEffect, useRef, useState } from 'react';
import { Sparkles, LoaderCircle, RefreshCw, MapPin } from 'lucide-react';
import { matchStudentJobs, type JobMatchingResult } from '@/services/studentJobMatching.service';
import { buttonClass, dateText } from './PortalUI';
import { explainOjtBlockers, workModeText, type Opportunity } from './ojt';

export function StudentJobMatches({windowId,cvFileId,opportunities,onApply}:{
  windowId:number;cvFileId:number|null;opportunities:Opportunity[];onApply:(opportunity:Opportunity)=>void;
}) {
  const [consent,setConsent] = useState(false);
  const [result,setResult] = useState<JobMatchingResult|null>(null);
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const pending = useRef<AbortController|null>(null);
  useEffect(()=>()=>pending.current?.abort(),[]);
  async function run() {
    if(!consent||!cvFileId||pending.current)return;
    const controller = new AbortController();pending.current=controller;
    setBusy(true);setError('');setResult(null);
    try {
      const data=await matchStudentJobs(windowId,controller.signal);
      if(!controller.signal.aborted)setResult(data);
    } catch(error) {
      if(!controller.signal.aborted)setError(error instanceof Error?error.message:'Chưa tìm được gợi ý. Vui lòng thử lại.');
    } finally {
      pending.current=null;
      if(!controller.signal.aborted)setBusy(false);
    }
  }
  return <section aria-labelledby="job-matches-title" className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/30 p-5">
    <header><h3 id="job-matches-title" className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Sparkles size={20} className="text-orange-600"/>Top 5 vị trí phù hợp với CV</h3>
      <p className="mt-1 text-sm text-slate-600">Gợi ý trong đợt đăng ký đã chọn, dựa trên CV mới nhất đã được bạn xác nhận. Nếu ít hơn 5 vị trí hợp lệ, hệ thống hiển thị số thực có.</p></header>
    {!cvFileId && <p className="text-sm text-amber-800">Bạn cần tải CV, đọc và xác nhận hồ sơ CV trước khi tìm gợi ý.</p>}
    <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1 accent-orange-600" checked={consent} disabled={busy||!cvFileId} onChange={e=>setConsent(e.target.checked)}/>
      <span>Tôi đồng ý gửi thông tin nghề nghiệp đã xác nhận (kỹ năng, công nghệ dự án, vai trò, ngoại ngữ và ngành/bằng cấp) đến Cohere để xếp hạng vị trí tuyển dụng. Không gửi file CV gốc.</span></label>
    <button type="button" onClick={()=>void run()} disabled={busy||!consent||!cvFileId} className={buttonClass+' inline-flex items-center gap-2'}>
      {busy?<LoaderCircle size={17} className="animate-spin"/>:result?<RefreshCw size={17}/>:<Sparkles size={17}/>}{busy?'Đang tìm vị trí phù hợp…':result?'Cập nhật gợi ý':'Tìm vị trí phù hợp'}
    </button>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {result && <div className="space-y-3" aria-live="polite">
      <p className="text-xs text-slate-500">{result.scoreMeaning}{result.generatedAt?` Kết quả tại ${dateText(result.generatedAt)}.`:''}</p>
      {result.status==='WINDOW_UNAVAILABLE' && <p className="text-sm text-amber-800">{explainOjtBlockers(result.blockers)}</p>}
      {result.status==='NO_READY_POSITIONS' && <p className="text-sm text-slate-600">Chưa có vị trí còn chỗ, chưa ứng tuyển và đã được đọc tin trong đợt này. Bạn có thể xem danh sách doanh nghiệp bên dưới hoặc thử lại sau.</p>}
      <div className="grid gap-3 lg:grid-cols-2">{result.matches.map(match=>{
        const opportunity=opportunities.find(o=>o.id===match.positionId&&o.postId===match.postId);
        return <article key={`${match.postId}:${match.positionId}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-orange-700">Gợi ý #{match.rank}</p><h4 className="font-semibold text-slate-900">{match.title}</h4><p className="text-sm text-slate-600">{match.company.name}</p></div>
            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600" title="Điểm liên quan 0–1, không phải xác suất trúng tuyển">{match.relevanceScore.toFixed(3)}</span></div>
          <p className="flex items-start gap-1 text-xs text-slate-500"><MapPin size={14} className="shrink-0"/>{match.location||'Chưa cập nhật địa điểm'} · {workModeText(match.workMode)} · Còn {match.remainingSlots} chỗ</p>
          <p className="text-sm text-slate-700">{match.reason}</p>
          {!!match.requirementsNotEvidenced.length && <p className="text-sm text-amber-800">Cần đối chiếu thêm trong CV: {match.requirementsNotEvidenced.join(', ')}.</p>}
          <p className="text-xs text-slate-500">{match.reviewNote}</p>
          {!!match.blockers.length && <p className="text-xs text-amber-800">{explainOjtBlockers(match.blockers)}</p>}
          <button type="button" disabled={!match.canApply||!opportunity?.canApply} onClick={()=>opportunity&&onApply(opportunity)} className={buttonClass}>Ứng tuyển vị trí này</button>
        </article>;
      })}</div>
    </div>}
  </section>;
}
