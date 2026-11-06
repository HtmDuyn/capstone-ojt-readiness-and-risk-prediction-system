import { useEffect,useState } from 'react';
import { BookOpenCheck,CalendarDays,Info,RefreshCw,Users } from 'lucide-react';
import { academicReportingService as reports } from '@/services/academicReporting.service';
import type { ReportPeriod,ReportScope,RetakeClassReport } from '@/types/education/reporting.types';

export function RetakeClassProposals({periods,scope,revision,catalogLoading}:{periods:ReportPeriod[];scope:ReportScope;revision:number;catalogLoading:boolean}){
  const [blockId,setBlockId]=useState(''),[page,setPage]=useState(1),[reload,setReload]=useState(0);
  const [autoRefresh,setAutoRefresh]=useState(true);
  const [data,setData]=useState<RetakeClassReport|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const ojtSemesterId=scope.ojtSemesterId,cohortId=scope.cohortId;
  useEffect(()=>{setPage(1);},[ojtSemesterId,cohortId]);
  useEffect(()=>{
    const controller=new AbortController();setData(null);setError('');
    if(!blockId){setLoading(false);return ()=>controller.abort();}
    setLoading(true);
    reports.retakeClassProposals(Number(blockId),{...(ojtSemesterId?{ojtSemesterId}:{}),...(cohortId?{cohortId}:{})},page,controller.signal)
      .then(r=>{if(!controller.signal.aborted)setData(r);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được đề xuất mở lớp.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[blockId,ojtSemesterId,cohortId,page,reload,revision]);
  useEffect(()=>{
    if(!blockId||!autoRefresh||loading)return;
    const timer=window.setInterval(()=>{
      if(document.visibilityState==='visible'&&navigator.onLine)setReload(v=>v+1);
    },60000);
    return ()=>window.clearInterval(timer);
  },[blockId,autoRefresh,loading]);
  const blocks=periods.filter(p=>p.kind==='BLOCK3'&&['PLANNED','ACTIVE'].includes(p.status));
  const day=(value:string)=>new Date(value).toLocaleDateString('vi-VN');
  return <section id="retake-class-proposals" aria-label="Đề xuất mở lớp học lại Block 3" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><BookOpenCheck size={22} aria-hidden="true"/></span><div><h2 className="text-lg font-bold text-slate-900">Đề xuất chuẩn bị lớp học lại</h2><p className="mt-1 text-sm text-slate-500">Theo dõi số sinh viên còn rớt từng môn để chuẩn bị lớp trong Block 3.</p></div></div><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><Users size={14} aria-hidden="true"/>Sĩ số tối đa 35 sinh viên/lớp</span></div>
    <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600 sm:max-w-md">Kỳ Block 3 dự kiến<select value={blockId} disabled={catalogLoading} onChange={e=>{setBlockId(e.target.value);setPage(1);}} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"><option value="">Chọn Block 3 để xem đề xuất</option>{blocks.map(p=><option key={p.id} value={p.id}>{p.periodCode} — {p.name}</option>)}</select></label><button type="button" disabled={!blockId||loading} onClick={()=>setReload(v=>v+1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading?'animate-spin':''} aria-hidden="true"/>{loading?'Đang cập nhật…':'Cập nhật số lượng'}</button></div>
    <p className="text-xs leading-relaxed text-slate-500">Áp dụng bộ lọc khóa sinh viên và kỳ OJT của báo cáo phía trên. Chọn Block 3 diễn ra sau khi kết thúc kỳ học chính; ngày mở lớp dự kiến lấy từ lịch đã được nhà trường cấu hình.</p>
    <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} className="size-4 rounded border-slate-300 accent-blue-600"/>Tự động cập nhật mỗi 60 giây khi đang xem báo cáo</label>
    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-relaxed text-blue-900"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true"/><p>Từ <strong>18–22 sinh viên</strong>, bắt đầu đề xuất chuẩn bị mở lớp. Mỗi lớp tối đa <strong>35 sinh viên</strong>. Nếu vượt sĩ số, phần dư tiếp tục được theo dõi; đủ 18 sinh viên sẽ đề xuất thêm lớp. Đây chưa phải quyết định mở lớp.</p></div>
    {catalogLoading&&<p role="status" className="text-sm text-slate-500">Đang tải kỳ học…</p>}
    {!catalogLoading&&blocks.length===0&&<p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Chưa có Block 3 ở trạng thái dự kiến hoặc đang diễn ra. Vui lòng cấu hình kỳ học trước.</p>}
    {!blockId&&blocks.length>0&&<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Chọn kỳ Block 3 để tổng hợp số sinh viên cần học lại và xem đề xuất.</p>}
    {loading&&<p role="status" className="text-sm text-slate-500">Đang tổng hợp nhu cầu học lại…</p>}
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {data&&<><div className="grid gap-3 sm:grid-cols-3">{[['Môn cần theo dõi',data.summary.courseCount],['Lớp đề xuất chuẩn bị',data.summary.proposedClassCount],['Lượt SV–môn còn chờ',data.summary.waitingStudentCourseCount]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>)}</div>
      <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><CalendarDays size={14} aria-hidden="true"/>{data.block.periodCode}: {day(data.block.startDate)} – {day(data.block.endDate)}<span>· Cập nhật: {new Date(data.computedAt).toLocaleString('vi-VN')}</span></p>
      {(data.excludedStudentCount>0||data.unresolvedAlternativeStudentCount>0)&&<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Có {data.excludedStudentCount} sinh viên cần đối soát dữ liệu và {data.unresolvedAlternativeStudentCount} sinh viên có môn lựa chọn chưa xác định. Số liệu có thể chưa đầy đủ.</p>}
      {data.items.length===0?<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Chưa ghi nhận sinh viên cần đăng ký học lại trong phạm vi đã chọn.</p>:<div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Môn học','SV cần học lại','Đề xuất lớp','Tiếp tục theo dõi','Trạng thái'].map(label=><th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.items.map(item=><tr key={item.courseId} className="align-top hover:bg-slate-50/60"><td className="px-4 py-4"><p className="font-semibold text-slate-800">{item.courseCode}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{item.courseName}</p></td><td className="px-4 py-4 font-semibold tabular-nums text-slate-700">{item.failedStudentCount}</td><td className="px-4 py-4"><p className="font-semibold text-blue-700">{item.proposedClassCount} lớp</p><p className="mt-1 text-xs text-slate-500">{item.fullCapacityClassCount>0?`${item.fullCapacityClassCount} lớp × ${data.policy.classCapacity} SV`:''}{item.additionalClassStudentCount>0?`${item.fullCapacityClassCount>0?' + ':''}1 lớp ${item.additionalClassStudentCount} SV`:''}</p></td><td className="px-4 py-4"><p className="font-semibold text-amber-700">{item.waitingStudentCount} SV</p>{item.waitingStudentCount>0&&<p className="mt-1 max-w-44 text-xs text-slate-500">Cần thêm {item.studentsNeededForNextProposal} SV để đề xuất {item.proposedClassCount?'lớp tiếp theo':'lớp đầu tiên'}.</p>}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status==='PREPARE_CLASSES'?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{item.status==='PREPARE_CLASSES'?'Đề xuất chuẩn bị':'Đang theo dõi'}</span>{item.isEarlyPreparation&&<p className="mt-2 text-xs text-slate-500">Đã chạm ngưỡng chuẩn bị mở lớp.</p>}</td></tr>)}</tbody></table></div>}
      {data.total>data.limit&&<div className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><span className="text-slate-500">Trang {page} / {Math.ceil(data.total/data.limit)}</span><button type="button" disabled={page*data.limit>=data.total||loading} onClick={()=>setPage(v=>v+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div>}
      <details className="text-xs text-slate-500"><summary className="cursor-pointer font-medium">Cách tính và phạm vi đề xuất</summary><ul className="mt-3 list-disc space-y-2 pl-4 leading-relaxed">{data.limitations.map((text,i)=><li key={i}>{text}</li>)}</ul></details>
    </>}
  </section>;
}
