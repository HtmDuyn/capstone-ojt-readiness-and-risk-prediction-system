import React, { useCallback, useEffect, useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Award, CheckCircle2, ClipboardCheck, Loader2, AlertCircle, Send, ListChecks } from 'lucide-react';
import {
  enterpriseService,
  type EnterpriseInternshipItem,
  type EnterpriseInternshipTask,
} from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { loadAllPages } from '@/components/enterprise/recruitment';

interface EvaluationRow {
  id: number;
  studentCode: string;
  fullName: string;
  position: string;
  completionScore: number | null;
  attitudeScore: number | null;
  skillScore: number | null;
  overallScore: number | null;
  comments: string;
  status: 'DRAFT' | 'SUBMITTED';
  evaluationLocked: boolean;
}

interface EvaluationForm {
  completionScore: string;
  attitudeScore: string;
  skillScore: string;
  overallScore: string;
  comments: string;
}

interface TaskProgress {
  completed: number;
  total: number;
}

type EvaluationScoreKey = keyof Pick<
  EvaluationForm,
  'completionScore' | 'attitudeScore' | 'skillScore' | 'overallScore'
>;

const scoreFields: { key: EvaluationScoreKey; label: string }[] = [
  { key: 'completionScore', label: 'Điểm hoàn thành' },
  { key: 'attitudeScore', label: 'Điểm thái độ' },
  { key: 'skillScore', label: 'Điểm kỹ năng' },
  { key: 'overallScore', label: 'Điểm tổng kết OJT' },
];

const emptyForm: EvaluationForm = {
  completionScore: '',
  attitudeScore: '',
  skillScore: '',
  overallScore: '',
  comments: '',
};

const toEvaluationRow = (item: EnterpriseInternshipItem): EvaluationRow => {
  const evaluation = item.evaluation;
  return {
    id: item.id,
    studentCode: item.student?.studentCode || '',
    fullName: item.student?.fullName || '',
    position: item.position?.title || '',
    completionScore: evaluation?.completionScore ?? null,
    attitudeScore: evaluation?.attitudeScore ?? null,
    skillScore: evaluation?.skillScore ?? null,
    overallScore: evaluation?.overallScore ?? null,
    comments: evaluation?.comments || '',
    status: evaluation?.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
    evaluationLocked: item.evaluationLocked === true,
  };
};

export const EnterpriseEvaluation: React.FC = () => {
  const { loading: profileLoading, companyId } = useEnterprise();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<number, TaskProgress>>({});
  const [taskProgressLoading, setTaskProgressLoading] = useState(true);
  const [taskProgressError, setTaskProgressError] = useState<string | null>(null);
  const [selectedEval, setSelectedEval] = useState<EvaluationRow | null>(null);
  const [scores, setScores] = useState<EvaluationForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    if (profileLoading) return;
    setLoading(true);
    setTaskProgressLoading(true);
    setError(null);
    setTaskProgressError(null);
    const signal = new AbortController().signal;
    try {
      const internships = await loadAllPages<EnterpriseInternshipItem>(
        (page) => enterpriseService.listInternships({ page, limit: 100 }, signal),
        signal,
        'danh sách sinh viên thực tập',
      );

      setEvaluations(
        internships
          .filter((item) =>
            ['ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status?.toUpperCase() || '')
          )
          .map(toEvaluationRow)
      );

      try {
        if (!companyId) {
          throw new Error('Không tìm thấy doanh nghiệp để tải tiến độ task.');
        }
        const tasks = await loadAllPages<EnterpriseInternshipTask>(
          (page) => enterpriseService.listInternshipTasks(companyId, { page, limit: 100 }, signal),
          signal,
          'tiến độ task của sinh viên',
        );
        const progressByAssignment: Record<number, TaskProgress> = {};
        for (const task of tasks) {
          const progress = progressByAssignment[task.assignmentId] ?? { completed: 0, total: 0 };
          progress.total += 1;
          if (['DONE', 'COMPLETED'].includes(task.status.toUpperCase())) {
            progress.completed += 1;
          }
          progressByAssignment[task.assignmentId] = progress;
        }
        setTaskProgress(progressByAssignment);
      } catch (taskError: unknown) {
        const message = taskError instanceof Error
          ? taskError.message
          : 'Không thể tải tiến độ task của sinh viên.';
        setTaskProgressError(message);
        console.error('Failed to load internship task progress:', taskError);
      } finally {
        setTaskProgressLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách đánh giá OJT';
      setError(message);
      console.error('Failed to load internship evaluations:', err);
    } finally {
      setLoading(false);
      setTaskProgressLoading(false);
    }
  }, [companyId, profileLoading]);

  useEffect(() => {
    void fetchEvaluations();
  }, [fetchEvaluations]);

  const handleOpenEvaluation = (item: EvaluationRow) => {
    setSelectedEval(item);
    setActionError(null);
    setScores({
      completionScore: item.completionScore == null ? '' : String(item.completionScore),
      attitudeScore: item.attitudeScore == null ? '' : String(item.attitudeScore),
      skillScore: item.skillScore == null ? '' : String(item.skillScore),
      overallScore: item.overallScore == null ? '' : String(item.overallScore),
      comments: item.comments,
    });
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEval) return;

    const scoreValues = {
      completionScore: Number(scores.completionScore),
      attitudeScore: Number(scores.attitudeScore),
      skillScore: Number(scores.skillScore),
      overallScore: Number(scores.overallScore),
    };
    if (
      Object.values(scoreValues).some(
        (score) => !Number.isFinite(score) || score < 0 || score > 10
      )
    ) {
      setActionError('Vui lòng nhập đầy đủ điểm từ 0 đến 10 cho tất cả tiêu chí.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await enterpriseService.evaluateInternship(selectedEval.id, {
        ...scoreValues,
        comments: scores.comments.trim() || null,
        reason: 'Đánh giá kết quả thực tập OJT',
      });

      setEvaluations((current) =>
        current.map((item) =>
          item.id === selectedEval.id
            ? {
                ...item,
                completionScore: scoreValues.completionScore,
                attitudeScore: scoreValues.attitudeScore,
                skillScore: scoreValues.skillScore,
                overallScore: scoreValues.overallScore,
                comments: scores.comments.trim(),
                status: 'SUBMITTED',
              }
            : item
        )
      );
      setToastMessage(`Đã gửi đánh giá OJT cho sinh viên ${selectedEval.fullName} thành công.`);
      setSelectedEval(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      const errorCode = err?.response?.data?.errorCode;
      let displayMessage = serverMessage || err?.message || 'Không thể gửi đánh giá OJT';
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
        displayMessage = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!';
      }
      setActionError(displayMessage);
      console.error('Failed to submit internship evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const submittedCount = evaluations.filter((item) => item.status === 'SUBMITTED').length;
  const selectedProgress = taskProgress[selectedEval?.id ?? -1] ?? { completed: 0, total: 0 };
  const selectedProgressPercent = selectedProgress.total
    ? Math.round((selectedProgress.completed / selectedProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Đánh giá & Chấm điểm Kết quả Thực tập OJT"
        description="Đánh giá điểm hoàn thành, thái độ, kỹ năng và kết quả OJT của sinh viên đang thực tập."
        badge="Chấm điểm OJT"
      />

      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="font-bold text-emerald-500">
            ✕
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Danh sách đánh giá OJT</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Dữ liệu sinh viên và điểm số được tải từ hệ thống.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Đã nộp: {submittedCount} / {evaluations.length} phiếu
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách đánh giá...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <button
              onClick={() => void fetchEvaluations()}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Thử lại
            </button>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Chưa có sinh viên đủ điều kiện đánh giá.</p>
            <p className="mt-1 text-xs text-slate-400">
              Sinh viên có trạng thái đang thực tập hoặc đã hoàn thành sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Sinh viên</th>
                  <th className="px-5 py-3.5">Vị trí thực tập</th>
                  <th className="px-5 py-3.5 text-center">Hoàn thành</th>
                  <th className="px-5 py-3.5 text-center">Thái độ</th>
                  <th className="px-5 py-3.5 text-center">Kỹ năng</th>
                  <th className="px-5 py-3.5 text-center">Điểm OJT</th>
                  <th className="px-5 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {evaluations.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.fullName}</div>
                      <div className="text-[11px] text-slate-400">{item.studentCode}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{item.position || '—'}</td>
                    <td className="px-5 py-4 text-center">{item.completionScore ?? '—'}</td>
                    <td className="px-5 py-4 text-center">{item.attitudeScore ?? '—'}</td>
                    <td className="px-5 py-4 text-center">{item.skillScore ?? '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-extrabold text-sm text-orange-600">
                        {item.overallScore == null ? '—' : `${item.overallScore} / 10`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === 'SUBMITTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'SUBMITTED' ? 'Đã nộp' : 'Chưa đánh giá'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenEvaluation(item)}
                        disabled={item.evaluationLocked}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {item.evaluationLocked
                          ? 'Đã khóa'
                          : item.status === 'SUBMITTED'
                            ? 'Chỉnh sửa'
                            : 'Đánh giá'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
            <div className="flex items-start justify-between bg-gradient-to-r from-orange-50 via-white to-amber-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Đánh giá kết quả OJT</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {selectedEval.fullName} <span className="text-slate-300">·</span> {selectedEval.studentCode}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">{selectedEval.position || 'Chưa cập nhật vị trí'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                aria-label="Đóng biểu mẫu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="max-h-[calc(92vh-84px)] space-y-5 overflow-y-auto px-6 py-5 text-xs">
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800">
                    <ListChecks className="h-4 w-4 text-emerald-600" />
                    Tiến độ task
                  </h4>
                  {!taskProgressLoading && !taskProgressError && (
                    <span className="rounded-lg bg-white px-2.5 py-1.5 font-bold text-slate-700 shadow-sm">
                      {selectedProgress.completed} / {selectedProgress.total} hoàn thành
                    </span>
                  )}
                </div>
                {taskProgressLoading ? (
                  <p className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải tiến độ task...
                  </p>
                ) : taskProgressError ? (
                  <p role="alert" className="text-rose-700">{taskProgressError}</p>
                ) : (
                  <>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-emerald-100"
                      role="progressbar"
                      aria-label="Tiến độ hoàn thành task"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={selectedProgressPercent}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-700"
                        style={{ width: `${selectedProgressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {selectedProgress.total
                        ? `Đã hoàn thành ${selectedProgressPercent}% số task được giao.`
                        : 'Sinh viên chưa có task được giao.'}
                    </p>
                  </>
                )}
              </section>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Chấm điểm theo tiêu chí</h4>
                  <span className="text-[11px] text-slate-400">Thang điểm 0–10</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {scoreFields.map(({ key, label }) => (
                    <label
                      key={key}
                      className={`rounded-2xl border p-3.5 transition-colors ${
                        key === 'overallScore'
                          ? 'border-orange-200 bg-orange-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="mb-2 block font-semibold text-slate-700">{label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          required
                          inputMode="decimal"
                          placeholder="0.00"
                          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-base font-bold focus:outline-none focus:ring-2 ${
                            key === 'overallScore'
                              ? 'border-orange-200 text-orange-600 focus:ring-orange-400'
                              : 'border-slate-200 text-slate-800 focus:ring-slate-300'
                          }`}
                          value={scores[key]}
                          onChange={(e) => setScores({ ...scores, [key]: e.target.value })}
                        />
                        <span className="shrink-0 text-[11px] font-medium text-slate-400">/ 10</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Nhận xét <span className="font-normal text-slate-400">(không bắt buộc)</span></span>
                <textarea
                  rows={2}
                  maxLength={5000}
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ghi rõ ưu điểm và những điểm sinh viên cần phát triển thêm..."
                  value={scores.comments}
                  onChange={(e) => setScores({ ...scores, comments: e.target.value })}
                />
              </label>

              {actionError && (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedEval(null)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseEvaluation;
