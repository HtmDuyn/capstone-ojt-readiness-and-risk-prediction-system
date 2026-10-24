import { useState, useRef } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import {
  getAcademicSummary,
  getSupplementary,
  getRoadmap,
} from '@/services/student';
import type { Roadmap } from '@/types/student/portal';
import {
  AcademicMetrics,
  Blockers,
  buttonClass,
  Card,
  EligibilityCard,
  Empty,
  ResourceState,
  StudentPage,
  valueText,
} from '@/components/student/PortalUI';

export function RoadmapAdvice() {
  const { semesterId, profile } = useStudentPortal();
  const [state, setState] = useState<{
    semesterId: number;
    data?: Roadmap;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const request = async () => {
    if (!semesterId || !profile || lock.current) return;
    const selected = semesterId;
    lock.current = true;
    setBusy(true);
    setState(null);
    try {
      setState({ semesterId: selected, data: await getRoadmap(selected) });
    } catch (err) {
      setState({
        semesterId: selected,
        error: err instanceof Error ? err.message : 'Dịch vụ AI chưa khả dụng.',
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const visible = state?.semesterId === semesterId ? state : null;
  return (
    <Card title="AI tư vấn lộ trình">
      <p className="text-sm text-slate-500">
        Dịch vụ AI tư vấn dựa trên dữ liệu học vụ của đợt OJT đang chọn.
      </p>
      <button
        type="button"
        className={buttonClass}
        disabled={busy || !semesterId}
        onClick={() => void request()}
      >
        {busy ? 'Đang lấy tư vấn...' : 'Yêu cầu tư vấn AI'}
      </button>
      {visible?.error && (
        <p role="alert" className="text-sm text-amber-800">
          {visible.error}
        </p>
      )}
      {visible?.data && (
        <>
          <p className="text-xs text-slate-500">
            Mô hình: {visible.data.modelVersion}
          </p>
          <ul className="space-y-3 text-sm">
            {visible.data.recommendations.map((text, index) => (
              <li key={index} className="rounded-xl bg-orange-50 p-3">
                {text}
              </li>
            ))}
          </ul>
          {!visible.data.recommendations.length && (
            <Empty>Chưa có khuyến nghị từ dịch vụ AI.</Empty>
          )}
        </>
      )}
    </Card>
  );
}
export const StudentAIRiskPrediction = () => {
  const { profile, semesterId, revision, loading } = useStudentPortal();
  const key =
    !loading && profile && semesterId
      ? profile.id + ':' + semesterId + ':' + revision
      : null;
  const summary = useStudentResource(key && 'summary:' + key, (signal) =>
    getAcademicSummary(semesterId!, signal),
  );
  const supplementary = useStudentResource(
    key && 'supplementary:' + key,
    (signal) => getSupplementary(semesterId!, signal),
  );
  return (
    <StudentPage
      title="Phân tích học vụ & tư vấn lộ trình"
      description="Đối chiếu điều kiện OJT, các môn cần bổ sung và tư vấn AI dựa trên dữ liệu học tập."
    >
      <ResourceState
        loading={summary.loading}
        error={summary.error}
        retry={summary.reload}
      />
      {summary.data && (
        <>
          <AcademicMetrics data={summary.data} />
          <EligibilityCard
            official={summary.data.officialEligibility}
            current={summary.data.currentEligibility}
          />
          <Card title="Kịch bản hoàn thành các môn đang học">
            <p className="text-sm">
              Nếu tất cả môn đang học đều đạt, tổng tín chỉ có thể tích lũy:{' '}
              <strong>
                {valueText(summary.data.scenario.potentialCredits)}
              </strong>
              .
            </p>
            <p className="text-sm text-slate-500">
              Đây là kịch bản tính theo chương trình đào tạo, không phải xác
              suất dự báo AI.
            </p>
            {!!summary.data.issues.length && (
              <Blockers values={summary.data.issues} />
            )}
          </Card>
        </>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Môn cần học / học lại">
          <ResourceState
            loading={supplementary.loading}
            error={supplementary.error}
            retry={supplementary.reload}
          />
          {supplementary.data && (
            <>
              {supplementary.data.items.map((course) => (
                <div
                  key={course.requirementId}
                  className="rounded-xl bg-slate-50 p-4 text-sm space-y-1"
                >
                  <h3 className="font-bold">
                    {course.courseCode} · {course.name}
                  </h3>
                  <p>
                    {course.credits ?? '—'} tín chỉ ·{' '}
                    {course.reason === 'RETAKE'
                      ? 'Cần học lại'
                      : 'Chưa hoàn thành yêu cầu'}
                  </p>
                  {course.prerequisites.map((pre, index) => (
                    <p key={index}>
                      Tiên quyết: đạt ít nhất {pre.minimumPassed} môn trong nhóm{' '}
                      {pre.courseIds.map((id) => '#' + id).join(', ')}.
                    </p>
                  ))}
                </div>
              ))}
              {!supplementary.data.items.length && (
                <Empty>Không có môn cần bổ sung theo dữ liệu hiện tại.</Empty>
              )}
              <p className="text-xs text-slate-500">
                Lịch mở lớp và đăng ký học chưa được quản lý trên hệ thống.
              </p>
            </>
          )}
        </Card>
        <RoadmapAdvice key={key} />
      </div>
      <Card title="Dự báo rủi ro">
        <Empty>
          Hệ thống hiện chưa cung cấp API dự báo rủi ro. Kết quả điều kiện OJT ở
          trên do backend đối chiếu theo quy định học vụ.
        </Empty>
      </Card>
    </StudentPage>
  );
};
export default StudentAIRiskPrediction;
