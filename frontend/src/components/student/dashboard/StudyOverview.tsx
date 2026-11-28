import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, CircleDashed, ClipboardCheck, ShieldAlert, XCircle } from 'lucide-react';
import type { DashboardSummary } from '@/types/student/portal';
import type { RiskAssessment } from '@/services/studentService';
import { CreditProgressChart, RiskLevelChart } from './DashboardCharts';
import { statusText } from '../PortalUI';
import { riskTheme } from '../ojt-risk/risk-ui';

const card = 'flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30';
const title = 'flex items-center gap-2 text-sm font-semibold text-slate-900';

function Criterion({ label, value, passed }: { label: string; value: number | null; passed: boolean | null }) {
  const Icon = passed === null ? CircleDashed : passed ? CheckCircle2 : XCircle;
  return <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
    <Icon size={18} aria-hidden="true" className={'mt-0.5 shrink-0 ' + (passed === null ? 'text-slate-400' : passed ? 'text-emerald-600' : 'text-rose-500')} />
    <div className="min-w-0 flex-1"><p className="text-xs leading-5 text-slate-600">{label}</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{value ?? '—'}</p></div>
    <span className={'shrink-0 pt-0.5 text-xs font-medium ' + (passed === null ? 'text-slate-500' : passed ? 'text-emerald-700' : 'text-rose-700')}>{passed === null ? 'Chưa có dữ liệu' : passed ? 'Đạt' : 'Chưa đạt'}</span>
  </div>;
}

export function StudyOverview({ academic, risk, pending, summaryPending, summaryError }: {
  academic: DashboardSummary['academic'] | null; risk: RiskAssessment | null; pending: boolean;
  summaryPending: boolean; summaryError: boolean;
}) {
  const progress = academic?.academicProgress;
  const credits = progress?.credits;
  const percent = credits?.total != null && credits.total > 0
    ? Math.max(0, Math.min(100, Math.round(credits.earned / credits.total * 100))) : null;
  const current = academic?.currentEligibility;
  const rule = current?.rule;
  const admission = academic?.admissionEligibility;
  const official = academic?.officialEligibility;
  const level = risk?.risk.level ?? 'INSUFFICIENT_DATA';
  const summaryState = summaryError ? 'Không tải được kết quả' : summaryPending ? 'Đang tải…' : 'Chưa có kết quả';
  return <>
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      <section className={card} aria-label="Mức cảnh báo OJT">
        <h3 className={title}><ShieldAlert size={18} className="text-blue-600" aria-hidden="true" />Mức cảnh báo OJT</h3>
        <div className="flex flex-1 flex-col justify-center py-3"><RiskLevelChart level={level} />
          <p className="mt-5 text-sm leading-6 text-slate-600">{risk ? risk.risk.reasons[0]?.message ?? riskTheme[level].description : pending ? 'Đang tải đánh giá OJT…' : 'Chưa có đánh giá. Cần đủ dữ liệu học vụ để xác định mức cảnh báo.'}</p>
        </div>
        <p className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">Mức cảnh báo hỗ trợ lập kế hoạch học tập, không thay thế kết quả xét OJT.</p>
      </section>
      <section className={card} aria-label="Tiến độ chương trình đào tạo">
        <h3 className={title}><BookOpen size={18} className="text-blue-600" aria-hidden="true" />Tiến độ chương trình đào tạo</h3>
        <div className="my-auto flex flex-wrap items-center justify-center gap-5 py-5">
          <div className="shrink-0"><CreditProgressChart percent={percent} /></div>
          <dl className="min-w-[110px] flex-1 space-y-3 text-xs text-slate-500">
            <div><dt>Tín chỉ tích lũy</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-blue-700">{credits?.earned ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt>Tổng tín chỉ</dt><dd className="font-semibold tabular-nums text-slate-800">{credits?.total ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt>Còn lại</dt><dd className="font-semibold tabular-nums text-slate-800">{credits?.remaining ?? '—'}</dd></div>
          </dl>
        </div>
        {!progress && <p className="mb-3 text-xs text-slate-500">{pending ? 'Đang tải tiến độ…' : 'Chưa có dữ liệu tiến độ.'}</p>}
        {progress && <p className="mb-3 text-xs text-slate-500">{statusText(progress.status)}</p>}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5"><span className="text-xs font-medium text-blue-900">GPA tích lũy</span><span className="text-lg font-semibold tabular-nums text-slate-900">{progress?.gpa?.toFixed(2) ?? '—'} <span className="text-xs font-normal text-slate-500">/ {progress?.gpaScale ?? '—'}</span></span></div>
        <Link to="/student/academic-profile" className="mt-4 rounded text-sm font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Xem bảng điểm và chương trình →</Link>
      </section>
      <section className={card + ' md:col-span-2 xl:col-span-1'} aria-label="Điều kiện tham gia OJT">
        <h3 className={title}><ClipboardCheck size={18} className="text-blue-600" aria-hidden="true" />Điều kiện tham gia OJT</h3>
        <p className="mb-3 mt-3 text-xs text-slate-500">Đối chiếu từ dữ liệu học vụ hiện tại</p>
        <div className="space-y-2">
          <Criterion label={rule ? `Tín chỉ tích lũy ≥ ${rule.minCredits}` : 'Tín chỉ tích lũy · chưa có ngưỡng xét'} value={current?.earnedCredits ?? null} passed={current && rule ? current.earnedCredits >= rule.minCredits : null} />
          <Criterion label={rule?.maxUnpassedCourses != null ? `Số môn rớt hiện tại ≤ ${rule.maxUnpassedCourses}` : 'Số môn rớt · chưa có ngưỡng xét'} value={academic?.failedCourseCount ?? null} passed={academic && rule?.maxUnpassedCourses != null ? academic.failedCourseCount <= rule.maxUnpassedCourses : null} />
        </div>
        <dl className="mt-4 space-y-3 border-t border-slate-100 pt-3 text-xs">
          {current && <div><dt className="text-slate-500">Kết quả đối chiếu học vụ</dt><dd className="mt-1 font-medium text-slate-800">{statusText(current.status)}</dd></div>}
          <div><dt className="text-slate-500">Bàn giao từ Phòng Đào tạo</dt><dd className="mt-1 font-medium text-slate-800">{admission ? admission.isStale ? 'Dữ liệu đã thay đổi, cần rà soát' : statusText(admission.status) : summaryState}</dd></div>
          <div><dt className="text-slate-500">Kết quả xét duyệt chính thức</dt><dd className="mt-1 font-semibold text-slate-900">{official ? official.isStale ? 'Đã cũ, chờ xét lại' : statusText(official.status) : summaryState}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-slate-500">Checklist chỉ là đối chiếu học vụ. Kết quả chính thức do nhà trường xác nhận.</p>
        {(official?.reasons?.length || admission?.appliedCondition) ? <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer rounded font-medium focus-visible:ring-2 focus-visible:ring-blue-500">Chi tiết điều kiện xét</summary><div className="mt-2 space-y-2 leading-5">{official?.reasons.map((reason, index) => <p key={index}>{reason}</p>)}{admission?.appliedCondition && <p>Phiên bản {admission.appliedCondition.version} · tối thiểu {admission.appliedCondition.minCredits} tín chỉ<br />{admission.appliedCondition.issuingDocument}</p>}</div></details> : null}
      </section>
    </div>
  </>;
}
