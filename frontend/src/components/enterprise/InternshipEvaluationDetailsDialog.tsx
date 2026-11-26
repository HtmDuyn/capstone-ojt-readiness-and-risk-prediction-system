import type { ReactNode } from 'react';
import { ClipboardCheck, GraduationCap, UserRound } from 'lucide-react';
import { StudentDialog } from '@/components/student/StudentDialog';
import type { EnterpriseInternshipItem } from '@/services/enterpriseService';
import { parseEvaluationScore } from '@/utils/enterprise/enterpriseEvaluation';

const text = (value?: string | number | null) => value === undefined || value === null || value === '' ? 'Chưa cập nhật' : String(value);
const score = (value?: number | null) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(2);
const dateText = (value?: string | null, withTime = false) => {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Chưa ghi nhận';
  return new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } as const : {}),
  });
};
const internshipStatuses: Record<string, string> = {
  ASSIGNED: 'Đã phân công', ACTIVE: 'Đang thực tập', IN_PROGRESS: 'Đang thực tập',
  COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy', FAILED: 'Chưa đạt',
};

function Fields({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
  </div>)}</dl>;
}

export function InternshipEvaluationDetailsDialog({ internship, semesterLabel, companyName, onClose }: {
  internship: EnterpriseInternshipItem;
  semesterLabel: string;
  companyName?: string;
  onClose: () => void;
}) {
  const { student, evaluation, template, academicSupervisor } = internship;
  const templateMatches = !evaluation || evaluation.templateId === template?.id;
  // An older evaluation must keep its own issued criteria and weights.
  const criteria = evaluation?.criteria?.length ? evaluation.criteria : templateMatches ? template?.criteria ?? [] : [];
  const complete = criteria.length > 0 && criteria.every(field => parseEvaluationScore(String(evaluation?.scoreDetails?.[field.key] ?? '')) !== null);
  const status = evaluation?.status === 'SUBMITTED' ? 'Đã gửi QHDN' : evaluation && complete ? 'Đã lưu' : 'Thiếu điểm';
  const templateName = templateMatches && template ? `${template.name} · Phiên bản ${template.version}` : 'Bộ tiêu chí theo đánh giá đã lưu';

  return <StudentDialog title={`Chi tiết sinh viên và đánh giá · ${student.fullName || student.studentCode}`} onClose={onClose}>
    <div className="space-y-6">
      <section aria-labelledby="evaluation-student-heading" className="space-y-3">
        <h3 id="evaluation-student-heading" className="flex items-center gap-2 text-base font-semibold text-slate-900"><UserRound size={18} className="text-orange-600" />Thông tin sinh viên</h3>
        <Fields items={[
          ['Họ và tên', text(student.fullName)], ['Mã sinh viên', text(student.studentCode)],
          ['Email', text(student.email)], ['Số điện thoại', text(student.phone)],
          ['Chương trình đào tạo', text(student.programName || student.programCode)], ['Năm nhập học', text(student.enrollmentYear)],
          ['Khóa sinh viên', text(student.cohortName)], ['Lớp / Nhóm', text(student.groupCode)],
        ]} />
      </section>
      <section aria-labelledby="evaluation-internship-heading" className="space-y-3">
        <h3 id="evaluation-internship-heading" className="flex items-center gap-2 text-base font-semibold text-slate-900"><GraduationCap size={19} className="text-orange-600" />Thông tin thực tập</h3>
        <Fields items={[
          ['Doanh nghiệp', text(companyName)], ['Vị trí thực tập', text(internship.position?.title)],
          ['Kỳ OJT', internship.semester?.name || internship.semester?.code || semesterLabel],
          ['Trạng thái thực tập', internshipStatuses[internship.status?.toUpperCase()] || 'Chưa cập nhật'],
          ['Ngày bắt đầu', dateText(internship.startDate)], ['Ngày kết thúc', dateText(internship.endDate)],
          ['Người hướng dẫn tại doanh nghiệp', text(internship.enterpriseSupervisorName)],
          ['Giảng viên hướng dẫn', text(academicSupervisor?.fullName)],
          ['Email giảng viên', text(academicSupervisor?.email)], ['Số điện thoại giảng viên', text(academicSupervisor?.phone)],
        ]} />
      </section>
      <section aria-labelledby="evaluation-scores-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="evaluation-scores-heading" className="flex items-center gap-2 text-base font-semibold text-slate-900"><ClipboardCheck size={18} className="text-orange-600" />Đánh giá của doanh nghiệp</h3>
          <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (evaluation?.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{status}</span>
        </div>
        {!evaluation && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Doanh nghiệp chưa lưu đánh giá cho sinh viên này.</p>}
        {criteria.length > 0 ? <div className="overflow-hidden rounded-xl border border-slate-200">
          <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{templateName}</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <caption className="sr-only">Điểm đánh giá đã lưu theo tiêu chí và trọng số, thang điểm 0–10</caption>
            <thead className="bg-slate-50/60 text-xs text-slate-500"><tr><th scope="col" className="px-4 py-3">Tiêu chí</th><th scope="col" className="px-4 py-3 text-right">Trọng số</th><th scope="col" className="px-4 py-3 text-right">Điểm</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{criteria.map(field => <tr key={field.key}>
              <th scope="row" className="px-4 py-3 font-medium text-slate-700">{field.label}</th>
              <td className="px-4 py-3 text-right tabular-nums text-slate-500">{field.weight}%</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{score(evaluation?.scoreDetails?.[field.key])}</td>
            </tr>)}</tbody>
          </table></div>
        </div> : evaluation && <p className="text-sm text-slate-500">Chưa có thông tin chi tiết về bộ tiêu chí đã sử dụng.</p>}
        <div className="flex items-center justify-between gap-4 rounded-xl bg-orange-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">Điểm tổng đã lưu</span>
          <strong className="text-xl font-bold tabular-nums text-orange-600">{score(evaluation?.overallScore)} <span className="text-xs font-medium text-slate-500">/ 10</span></strong>
        </div>
        <p className="text-xs text-slate-500">Ngày đánh giá: {dateText(evaluation?.evaluatedAt, true)}</p>
        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-800">Nhận xét của doanh nghiệp</h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{evaluation?.comments?.trim() || 'Doanh nghiệp chưa có nhận xét.'}</p>
        </div>
      </section>
      <div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Đóng</button></div>
    </div>
  </StudentDialog>;
}
