import { useEffect,useState } from 'react';
import { Info,RefreshCw } from 'lucide-react';
import { academicReportingService as reports } from '@/services/academicReporting.service';
import type { Cohort,ReportPeriod,RetakeClassReport } from '@/types/education/reporting.types';

export function RetakeClassProposals({periods,cohorts,catalogLoading}:{periods:ReportPeriod[];cohorts:Cohort[];catalogLoading:boolean}){
  const [chosenBlockId,setChosenBlockId]=useState<string | null>(null),[page,setPage]=useState(1),[reload,setReload]=useState(0);
  const [mode,setMode]=useState<'CALCULATED'|'CONFIGURED'>('CALCULATED');
  const [data,setData]=useState<RetakeClassReport|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const [cohortId, setCohortId] = useState('');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const upcomingSemesters = periods.filter(period =>
    period.kind === 'SEMESTER' && period.status === 'PLANNED' && period.startDate.slice(0, 10) > today
  ).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
  const blocks = mode === 'CALCULATED' ? upcomingSemesters : periods.filter(period =>
    period.kind === 'BLOCK3' && period.status === 'PLANNED' &&
    upcomingSemesters.some(semester => semester.id === period.parentPeriodId)
  );
  const defaultSemester = upcomingSemesters[0];
  const blockId = chosenBlockId ?? (mode === 'CALCULATED' && defaultSemester ? String(defaultSemester.id) : '');
  useEffect(()=>{
    const controller=new AbortController();setData(null);setError('');
    if(!blockId){setLoading(false);return ()=>controller.abort();}
    setLoading(true);
    reports.retakeClassProposals(Number(blockId),cohortId ? { cohortId: Number(cohortId) } : {},page,controller.signal,mode)
      .then(r=>{if(!controller.signal.aborted)setData(r);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Không tải được đề xuất mở lớp.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[blockId,mode,cohortId,page,reload]);
  const selectedPeriod = blocks.find(period => String(period.id) === blockId);
  const semester = mode === 'CALCULATED'
    ? selectedPeriod
    : periods.find(period => period.id === selectedPeriod?.parentPeriodId);
  const day = (value: string) => new Date(value).toLocaleDateString('vi-VN', { timeZone: 'UTC' });
  return <section id="retake-class-proposals" aria-label="Đề xuất mở lớp học lại Block 3" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-slate-600">Chế độ lịch<select value={mode} onChange={e=>{setMode(e.target.value as 'CALCULATED'|'CONFIGURED');setChosenBlockId(null);setPage(1);setData(null);}} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="CALCULATED">Tính lịch trong học kỳ</option><option value="CONFIGURED">Dùng Block 3 đã cấu hình</option></select></label><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600 sm:max-w-md">{mode==='CALCULATED'?'Học kỳ':'Block 3'}<select value={blockId} disabled={catalogLoading} onChange={e=>{setChosenBlockId(e.target.value);setPage(1);}} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Chọn kỳ học</option>{blocks.map(p=><option key={p.id} value={p.id}>{p.periodCode} — {p.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Khóa sinh viên<select value={cohortId} disabled={catalogLoading} onChange={event => { setCohortId(event.target.value); setPage(1); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Tất cả khóa</option>{cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.cohortCode} — {cohort.name}</option>)}</select></label><button type="button" disabled={!blockId||loading} onClick={()=>setReload(v=>v+1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={15} className={loading?'animate-spin':''} aria-hidden="true"/>{loading?'Đang cập nhật…':'Cập nhật số lượng'}</button></div>
    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-relaxed text-blue-900"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true"/><p>Từ <strong>18–22 sinh viên</strong>, bắt đầu đề xuất chuẩn bị mở lớp. Mỗi lớp tối đa <strong>35 sinh viên</strong>. Nếu phần dư đủ 18 sinh viên, hệ thống đề xuất thêm một lớp. Đây chưa phải quyết định mở lớp.</p></div>
    {catalogLoading&&<p role="status" className="text-sm text-slate-500">Đang tải kỳ học…</p>}
    {!catalogLoading&&blocks.length===0&&<p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Chưa có học kỳ sắp tới phù hợp với chế độ lịch đã chọn.</p>}
    {!blockId&&blocks.length>0&&<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Chọn kỳ học để xem lịch Block 3 và đề xuất lớp học lại.</p>}
    {loading&&<p role="status" className="text-sm text-slate-500">Đang tổng hợp nhu cầu học lại…</p>}
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {data&&<>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div>
          <h3 className="font-semibold text-slate-900">{semester?.name ?? 'Lịch Block 3'}</h3>
          {semester && <p className="mt-1 text-xs text-slate-500">{day(semester.startDate)} – {day(semester.endDate)}</p>}
          {data.calendarPreview && <p className="mt-1 text-xs text-slate-500">Lịch xem trước</p>}
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          {data.calendarPreview && <>
            <div><dt className="font-semibold">Block 10 · 10 tuần</dt><dd>{day(data.calendarPreview.mainSemester.startDate)} – {day(data.calendarPreview.mainSemester.endDate)}</dd></div>
            <div><dt className="font-semibold">Nghỉ · 1 tuần</dt><dd>{day(data.calendarPreview.break.startDate)} – {day(data.calendarPreview.break.endDate)}</dd></div>
          </>}
          <div><dt className="font-semibold">{data.calendarPreview ? 'Block 3 · 3 tuần' : 'Block 3 đã cấu hình'}</dt><dd>{day(data.block.startDate)} – {day(data.block.endDate)}</dd></div>
        </dl>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{[['Môn được đề xuất',data.summary.courseCount],['Lớp đề xuất chuẩn bị',data.summary.proposedClassCount]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>)}</div>
      {(data.excludedStudentCount>0||data.unresolvedAlternativeStudentCount>0)&&<p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Có {data.excludedStudentCount} sinh viên cần đối soát dữ liệu và {data.unresolvedAlternativeStudentCount} sinh viên có môn lựa chọn chưa xác định. Số liệu có thể chưa đầy đủ.</p>}
      {data.items.length===0?<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Chưa có môn đạt ngưỡng đề xuất mở lớp trong học kỳ đã chọn.</p>:<div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Môn học','SV cần học lại','Đề xuất lớp'].map(label=><th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.items.map(item=><tr key={item.courseId} className="align-top hover:bg-slate-50/60"><td className="px-4 py-4"><p className="font-semibold text-slate-800">{item.courseCode}</p><p className="mt-1 max-w-xs text-xs text-slate-500">{item.courseName}</p></td><td className="px-4 py-4 font-semibold tabular-nums text-slate-700">{item.failedStudentCount}</td><td className="px-4 py-4"><p className="font-semibold text-blue-700">{item.proposedClassCount} lớp</p><p className="mt-1 text-xs text-slate-500">{item.fullCapacityClassCount>0?`${item.fullCapacityClassCount} lớp × ${data.policy.classCapacity} SV`:''}{item.additionalClassStudentCount>0?`${item.fullCapacityClassCount>0?' + ':''}1 lớp ${item.additionalClassStudentCount} SV`:''}</p></td></tr>)}</tbody></table></div>}
      {data.total>data.limit&&<div className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><span className="text-slate-500">Trang {page} / {Math.ceil(data.total/data.limit)}</span><button type="button" disabled={page*data.limit>=data.total||loading} onClick={()=>setPage(v=>v+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div>}
    </>}
  </section>;
}
