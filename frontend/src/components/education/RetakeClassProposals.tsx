import { useEffect, useState } from 'react';
import { BookOpen, Info, Layers3, RefreshCw, UsersRound } from 'lucide-react';
import { academicReportingService as reports } from '@/services/educationService';
import type { ReportPeriod, RetakeClassReport } from '@/types/education/reporting.types';
import { useEducationCacheRefresh } from '@/hooks/education/useEducationCacheRefresh';

type Props = { periods: ReportPeriod[]; catalogLoading: boolean };

const dateLabel = (value: string) => new Date(value).toLocaleDateString('vi-VN', { timeZone: 'UTC' });

export function RetakeClassProposals({ periods, catalogLoading }: Props) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RetakeClassReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEducationCacheRefresh(['/retake-class-proposals:'],()=>setRetry(value=>value+1),300);

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const upcomingSemesters = periods
    .filter(period => period.kind === 'SEMESTER' && period.status === 'PLANNED' && period.startDate.slice(0, 10) > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id);
  const defaultSemester = upcomingSemesters[0];
  const semesterId = defaultSemester ? String(defaultSemester.id) : '';
  const semester = upcomingSemesters.find(period => String(period.id) === semesterId);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    if (!semesterId) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    reports.retakeClassProposals(
      Number(semesterId),
      {},
      page,
      controller.signal,
      'CALCULATED',
    )
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không tải được đề xuất mở lớp.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [semesterId, page, retry]);

  const metricCards = data ? [
    { label: 'Môn cần hỗ trợ', value: data.summary.courseCount, detail: 'Môn có sinh viên cần học', icon: BookOpen, tone: 'orange' },
    { label: 'Lượt sinh viên có nhu cầu', value: data.summary.demandStudentCount, detail: 'Một sinh viên có thể cần nhiều môn', icon: UsersRound, tone: 'blue' },
    { label: 'Lớp đề xuất', value: data.summary.proposedClassCount, detail: 'Tham khảo theo sĩ số từng môn', icon: Layers3, tone: 'emerald' },
  ] as const : [];

  return (
    <section id="retake-class-proposals" aria-label="Đề xuất lớp hỗ trợ" className="space-y-5">
      {catalogLoading && <p role="status" className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Đang tải học kỳ…</p>}
      {!catalogLoading && upcomingSemesters.length === 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Chưa có học kỳ sắp tới để lập đề xuất lớp hỗ trợ.</div>}
      {loading && <div role="status" className="grid gap-3 sm:grid-cols-3"><div className="h-24 animate-pulse rounded-xl bg-slate-100 sm:col-span-3" /><div className="h-16 animate-pulse rounded-xl bg-slate-100 sm:col-span-3" /></div>}
      {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-rose-200 bg-white px-3 py-2 font-semibold hover:bg-rose-100 sm:self-auto"><RefreshCw size={15} /> Thử lại</button></div>}

      {data && !loading && <>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Kỳ dự kiến</p>
            <h3 className="mt-1 text-lg font-bold">{semester?.periodCode ?? data.block.periodCode}</h3>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200">
            {data.calendarPreview && <span><span className="text-slate-400">Block 10</span> · {dateLabel(data.calendarPreview.mainSemester.startDate)} – {dateLabel(data.calendarPreview.mainSemester.endDate)}</span>}
            <span><span className="text-slate-400">Block 3</span> · {dateLabel(data.block.startDate)} – {dateLabel(data.block.endDate)}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {metricCards.map(({ label, value, detail, icon: Icon, tone }) => {
            const colors = tone === 'orange' ? 'bg-orange-50 text-orange-600' : tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
            return <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-600">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors}`}><Icon size={18} aria-hidden="true" /></span></div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value.toLocaleString('vi-VN')}</p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </div>;
          })}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-sm leading-5 text-blue-900">
          <Info size={17} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
          <p>Mỗi môn có nhu cầu từ <strong>1–35 sinh viên</strong> được đề xuất 1 lớp; trên 35 sinh viên được đề xuất 2 lớp. Số liệu chỉ để tham khảo, chưa phải quyết định mở lớp.</p>
        </div>

        {data.excludedStudentCount > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{data.excludedStudentCount} sinh viên thiếu dữ liệu học vụ. Số liệu có thể chưa đầy đủ.</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div><h3 className="font-bold text-slate-900">Danh sách môn cần hỗ trợ</h3><p className="mt-1 text-xs text-slate-500">{data.total.toLocaleString('vi-VN')} môn trong phạm vi đã chọn</p></div>
            <p className="text-xs text-slate-500">Tính lúc {new Date(data.computedAt).toLocaleString('vi-VN')}</p>
          </div>
          {data.items.length === 0 ? <div className="px-4 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><BookOpen size={22} /></span><p className="mt-3 font-semibold text-slate-700">Chưa có môn cần hỗ trợ</p><p className="mt-1 text-sm text-slate-500">Không tìm thấy sinh viên rớt môn cần học lại hoặc còn môn kỳ 5 chưa học.</p></div> : <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600"><tr>
                <th scope="col" className="w-16 px-4 py-3 text-center">STT</th><th scope="col" className="w-36 px-4 py-3">Mã môn</th><th scope="col" className="px-4 py-3">Tên môn</th><th scope="col" className="w-56 px-4 py-3 text-center">Số lượng sinh viên có nhu cầu</th><th scope="col" className="w-48 px-4 py-3 text-center">Số lượng lớp đề xuất</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{data.items.map((item, index) => <tr key={item.courseId} className="transition-colors hover:bg-orange-50/50">
                <td className="px-4 py-3.5 text-center tabular-nums text-slate-400">{(page - 1) * data.limit + index + 1}</td><td className="px-4 py-3.5 font-bold text-slate-800">{item.courseCode}</td><td className="px-4 py-3.5 text-slate-700">{item.courseName}</td><td className="px-4 py-3.5 text-center font-semibold tabular-nums text-slate-700">{item.demandStudentCount.toLocaleString('vi-VN')}</td><td className="px-4 py-3.5 text-center"><span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-1 font-bold tabular-nums text-blue-700">{item.proposedClassCount}</span></td>
              </tr>)}</tbody>
            </table>
          </div>}
          {data.total > data.limit && <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-4 py-3 text-sm"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Trước</button><span className="text-slate-500">Trang {page} / {Math.ceil(data.total / data.limit)}</span><button type="button" disabled={page * data.limit >= data.total || loading} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Sau</button></div>}
        </div>
      </>}
    </section>
  );
}
