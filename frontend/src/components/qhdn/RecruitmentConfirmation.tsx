import { useEffect, useRef } from 'react';
import { ArrowRight, CalendarDays, GraduationCap } from 'lucide-react';
import { workflowPrimary, workflowSecondary } from './StudentWorkflowUi';

export function RecruitmentSemesterNotice({ semesterName }: { semesterName?: string }) {
  return <div className="space-y-4">
    <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:p-5">
      <p className="text-sm leading-7 text-slate-700">
        Sinh viên đủ điều kiện OJT trong <strong className="font-semibold text-slate-900">{semesterName ? `học kỳ ${semesterName}` : 'học kỳ hiện tại'}</strong> được đăng ký doanh nghiệp trong đợt này và sẽ bắt đầu thực tập vào <strong className="font-semibold text-orange-700">học kỳ kế tiếp</strong>.
      </p>
    </div>
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays size={16} className="text-orange-600" />Học kỳ xét điều kiện và đăng ký doanh nghiệp</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{semesterName || 'Học kỳ hiện tại'}</p>
      </div>
      <ArrowRight size={18} className="hidden text-slate-400 sm:block" aria-hidden="true" />
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-500"><GraduationCap size={17} className="text-blue-600" />Học kỳ bắt đầu thực tập OJT</p>
        <p className="mt-2 text-sm font-semibold text-blue-800">Học kỳ kế tiếp</p>
      </div>
    </div>
  </div>;
}

export function RecruitmentConfirmationContent({ action, semesterName, roundName, busy, disabled, onBack, onConfirm }: {
  action: 'create' | 'save' | 'open';
  semesterName?: string;
  roundName: string;
  busy: boolean;
  disabled?: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { backButton.current?.focus(); }, []);
  const label = action === 'open' ? 'Xác nhận mở đợt' : action === 'save' ? 'Xác nhận lưu lịch' : 'Xác nhận tạo đợt';

  return <div className="space-y-5">
    <p className="break-words text-base font-semibold text-slate-900">{roundName}</p>
    <RecruitmentSemesterNotice semesterName={semesterName} />
    <p className="text-sm leading-relaxed text-slate-500">Vui lòng kiểm tra thông tin học kỳ trước khi xác nhận.</p>
    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
      <button ref={backButton} type="button" className={workflowSecondary} disabled={busy} onClick={onBack}>{action === 'open' ? 'Hủy' : 'Quay lại chỉnh sửa'}</button>
      <button type="button" className={workflowPrimary} disabled={busy || disabled} onClick={onConfirm}>{busy ? 'Đang xử lý…' : label}</button>
    </div>
  </div>;
}
