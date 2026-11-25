import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { StudentBanner } from '@/components/student/StudentBanner';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import type {
  AcademicSummary,
  Eligibility,
} from '@/types/student/portal';

export const buttonClass =
  'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed';
export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';
export const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
export const valueText = (value: number | string | null | undefined) =>
  value ?? 'Chưa có dữ liệu';
export const statusText = (status?: string | null): string =>
  ({
    ELIGIBLE: 'Đủ điều kiện',
    NOT_ELIGIBLE: 'Chưa đủ điều kiện',
    REVIEW_REQUIRED: 'Chờ đối soát',
    SUBMITTED: 'Đã nộp',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    HANDED_OFF: 'Đã bàn giao',
    LEGACY_REVIEW_REQUIRED: 'Cần rà soát hồ sơ cũ',
    CONFIRMED: 'Đã xác nhận',
    PUBLISHED: 'Đã công bố',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    FINALIZED: 'Đã chốt',
    DRAFT: 'Bản nháp',
    TODO: 'Chưa thực hiện',
    IN_PROGRESS: 'Đang thực hiện',
    DONE: 'Hoàn thành',
    COMPLETED: 'Hoàn thành',
    PASSED: 'Đạt',
    FAILED: 'Chưa đạt',
    RECOGNIZED: 'Được công nhận',
    WITHDRAWN: 'Đã rút',
    ACCEPTED: 'Doanh nghiệp đồng ý nhận',
    PENDING: 'Chờ doanh nghiệp phản hồi',
    REVIEWING: 'Đang xét',
    INTERVIEW: 'Phỏng vấn',
    OFFERED: 'Đề nghị tiếp nhận',
    ASSIGNED: 'Đã phân công',
    ACTIVE: 'Đang hoạt động',
    PASS: 'Đạt',
    FAIL: 'Chưa đạt',
    INSUFFICIENT_CONFIGURATION: 'Chưa đủ cấu hình học vụ',
    CALCULATED: 'Đã tính từ dữ liệu học vụ',
  })[status ?? ''] ??
  status ??
  'Chưa có dữ liệu';
const blockerLabels: Record<string, string> = {
  ELIGIBLE_HANDOFF_REQUIRED:
    'Chưa có kết quả đủ điều kiện tham gia OJT.',
  CONFIRMED_ELIGIBILITY_REQUIRED:
    'Chưa có kết quả xét OJT đủ điều kiện hiện hành.',
  OFFICIAL_ELIGIBILITY_REQUIRED: 'Chưa có xác nhận đủ điều kiện OJT hiện hành.',
  ELIGIBILITY_CHECK_STALE: 'Kết quả xét đã cũ, cần được xét lại.',
  ELIGIBILITY_HANDOFF_STALE: 'Kết quả xét OJT đã cũ do dữ liệu học tập thay đổi; liên hệ Phòng Đào tạo để rà soát.',
  REGISTRATION_REQUIRED: 'Cần nộp hồ sơ đăng ký OJT.',
  REGISTRATION_EXISTS: 'Đã có hồ sơ đăng ký.',
  OJT_REGISTRATION_WINDOW_UNAVAILABLE: 'Đợt đăng ký chưa mở hoặc đã hết hạn.',
  WINDOW_UNAVAILABLE: 'Đợt đăng ký chưa mở hoặc đã hết hạn.',
  ASSIGNMENT_EXISTS: 'Đã có phân công thực tập.',
  APPLICATION_EXISTS: 'Đã ứng tuyển vị trí này.',
  POSITION_FULL: 'Vị trí đã hết chỉ tiêu.',
  REGISTRATION_PROGRAM_CHANGED:
    'Chương trình đào tạo đã thay đổi, cần rà soát hồ sơ.',
  MIN_CREDITS_NOT_MET: 'Chưa đủ tín chỉ theo quy định.',
  MAX_UNPASSED_COURSES_EXCEEDED: 'Số môn nợ vượt ngưỡng cho phép.',
};
export function Blockers({ values }: { values?: string[] }) {
  return values?.length ? (
    <ul className="space-y-1 text-sm text-amber-800">
      {values.map((v, i) => (
        <li key={v + i}>{blockerLabels[v] ?? v}</li>
      ))}
    </ul>
  ) : null;
}
export function Card({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        'rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30 space-y-4 ' +
        className
      }
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
export function Empty({
  children = 'Chưa có dữ liệu.',
}: {
  children?: ReactNode;
}) {
  return <p className="py-4 text-sm text-slate-500">{children}</p>;
}
export function ResourceState({
  loading,
  refreshing = false,
  error,
  retry,
}: {
  loading: boolean;
  refreshing?: boolean;
  error: string;
  retry: () => void;
}) {
  return (
    <>
      {loading && (
        <p role="status" className="p-4 text-slate-600">
          Đang tải dữ liệu...
        </p>
      )}
      {refreshing && <p role="status" className="py-2 text-xs text-slate-500">Đang cập nhật dữ liệu…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}{' '}
          <button type="button" className="ml-3 underline" onClick={retry}>
            Thử lại
          </button>
        </div>
      )}
    </>
  );
}
export function StudentAcademicPeriodSelect({ label = 'Học kỳ theo dõi' }: { label?: string } = {}) {
  const portal = useStudentPortal();
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-600 sm:min-w-60">
      {label}
      <select
        aria-label={label === 'Học kỳ theo dõi' ? 'Chọn học kỳ theo dõi' : `Chọn ${label.toLocaleLowerCase('vi')}`}
        className={inputClass + ' text-slate-800'}
        disabled={portal.loading || portal.academicPeriodsLoading || !portal.academicPeriods.length}
        value={portal.academicPeriodId ?? ''}
        onChange={(e) => portal.selectAcademicPeriod(Number(e.target.value))}
      >
        <option value="" disabled>{portal.academicPeriodsLoading ? 'Đang tải học kỳ…' : 'Chưa có dữ liệu học kỳ'}</option>
        {portal.academicPeriods.map((semester) => (
          <option key={semester.id} value={semester.id}>{semester.name}{semester.curriculumSemester == null ? '' : ` · Kỳ ${semester.curriculumSemester}`}{semester.isCurrent || semester.hasOjtEnrollment ? ' · Đang học' : ' · Đã học'}</option>
        ))}
      </select>
    </label>
  );
}

export function StudentCurrentAcademicPeriod({ currentSemester }: { currentSemester?: number | null } = {}) {
  const portal = useStudentPortal();
  const period = portal.academicPeriods.find(item => item.isCurrent);
  if (currentSemester !== undefined) {
    return <div className="text-sm sm:text-right">
      <p className="text-xs text-slate-500">Học kỳ theo lịch sử học vụ</p>
      <p className="mt-1 font-semibold text-slate-800">
        {currentSemester === null ? 'Chưa xác định học kỳ' : `Kỳ ${currentSemester}`}
      </p>
    </div>;
  }
  const stage = period?.curriculumSemester ?? portal.profile?.currentSemester;
  return <div className="text-sm sm:text-right"><p className="text-xs text-slate-500">Học kỳ đang học</p><p className="mt-1 font-semibold text-slate-800">{period
    ? `${period.name}${stage == null ? '' : ` · Kỳ ${stage}`}`
    : stage != null ? `Kỳ ${stage} · Theo hồ sơ sinh viên`
    : portal.academicPeriodsLoading ? 'Đang xác định học kỳ…' : 'Chưa xác định học kỳ đang học'}</p></div>;
}

export function StudentPage({
  title,
  description,
  children,
  needsSemester = true,
  showSemesterInBanner = false,
  compactTopSpacing = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  needsSemester?: boolean;
  showRefreshAction?: boolean;
  showSemesterInBanner?: boolean;
  compactTopSpacing?: boolean;
}) {
  const portal = useStudentPortal();
  return (
    <div className={`${compactTopSpacing ? 'space-y-5' : 'space-y-6'} pb-12 max-w-[1400px] mx-auto font-outfit`}>
      <StudentBanner
        title={title}
        description={description}
        badge={null}
        extra={showSemesterInBanner ? <StudentAcademicPeriodSelect /> : undefined}
      />
      <ResourceState
        loading={portal.loading}
        refreshing={portal.refreshing}
        error={portal.error}
        retry={portal.refresh}
      />
      {portal.warnings.map((warning) => (
        <div
          key={warning}
          role="alert"
          className="rounded-xl bg-amber-50 p-3 text-amber-800"
        >
          {warning}{' '}
          <button className="underline" onClick={portal.refresh}>
            Thử lại
          </button>
        </div>
      ))}
      {!portal.loading && !portal.error && portal.profile && <>
        {needsSemester && !portal.semesterId && <p role="status" className="rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm leading-relaxed text-slate-600">
          Chưa có đợt OJT được liên kết. Bạn vẫn có thể xem các mục bên dưới; dữ liệu và thao tác theo đợt sẽ mở khi nhà trường cập nhật.
        </p>}
        {children}
      </>}
    </div>
  );
}
export function Metrics({
  values,
}: {
  values: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {values.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
export function AcademicMetrics({ data }: { data: AcademicSummary }) {
  return (
    <Metrics
      values={[
        {
          label: 'GPA',
          value:
            data.gpa == null
              ? 'Chưa có dữ liệu'
              : `${data.gpa} / ${data.gpaScale ?? '—'}`,
        },
        { label: 'Tín chỉ tích lũy', value: data.earnedCredits },
        {
          label: 'Tín chỉ còn thiếu để OJT',
          value: valueText(data.missingCredits),
        },
        { label: 'Số môn chưa đạt', value: data.failedCourseCount },
      ]}
    />
  );
}
export function EligibilityCard({
  official,
  current,
  admission,
}: {
  official: Eligibility | null;
  current?: Eligibility | null;
  admission?: import('@/types/student/portal').AdmissionEligibility | null;
}) {
  return (
    <Card title="Điều kiện tham gia OJT">
      {admission && (
        <p className="font-semibold">
          Kết quả xét để tham gia OJT:{' '}
          {admission.isStale ? 'Dữ liệu đã thay đổi, cần rà soát' : statusText(admission.status)}
        </p>
      )}
      <p className="font-semibold">
        Kết quả chính thức:{' '}
        {official?.isStale
          ? 'Đã cũ, chờ xét lại'
          : statusText(official?.status)}
      </p>
      {current && (
        <p className="text-sm text-slate-600">
          Đối chiếu hiện tại: {statusText(current.status)}
        </p>
      )}
      <Blockers values={official?.reasons ?? current?.reasons} />
      {current?.rule && (
        <p className="text-sm text-slate-500">
          Ngưỡng theo quy định: {current.rule.minCredits} tín chỉ, tối đa{' '}
          {current.rule.maxUnpassedCourses} môn nợ.
        </p>
      )}
      {admission?.appliedCondition && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm"><p className="font-semibold text-slate-800">Điều kiện Phòng Đào tạo đã dùng</p><p className="mt-1 text-slate-700">Phiên bản {admission.appliedCondition.version} · tối thiểu {admission.appliedCondition.minCredits} tín chỉ</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{admission.appliedCondition.issuingDocument}</p></div>}
    </Card>
  );
}
export function Pagination({
  page,
  total,
  onChange,
  disabled = false,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>
        {total} bản ghi · Trang {page}/{Math.max(1, Math.ceil(total / 20))}
      </span>
      <div className="flex gap-3">
        <button
          className={buttonClass}
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
          className={buttonClass}
          disabled={disabled || page * 20 >= total}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
