import React, { useCallback, useEffect, useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Award, CheckCircle2, ClipboardCheck, Loader2, AlertCircle, Send } from 'lucide-react';
import {
  enterpriseService,
  type EnterpriseInternshipItem,
} from '@/service/enterpriseService';

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
  reason: string;
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
  reason: '',
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
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [selectedEval, setSelectedEval] = useState<EvaluationRow | null>(null);
  const [scores, setScores] = useState<EvaluationForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const firstPage = await enterpriseService.listInternships({ page: 1, limit: 100 });
      if (!firstPage?.success || !firstPage.data) {
        throw new Error('Không thể tải danh sách sinh viên thực tập');
      }

      const items = [...firstPage.data.items];
      const total = firstPage.data.total;
      const totalPages = Math.ceil(total / firstPage.data.limit);
      for (let page = 2; page <= totalPages; page += 1) {
        const response = await enterpriseService.listInternships({ page, limit: 100 });
        if (!response?.success || !response.data) {
          throw new Error(`Không thể tải danh sách thực tập ở trang ${page}`);
        }
        items.push(...response.data.items);
      }

      setEvaluations(
        items
          .filter((item) =>
            ['ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(item.status?.toUpperCase() || '')
          )
          .map(toEvaluationRow)
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách đánh giá OJT';
      setError(message);
      console.error('Failed to load internship evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      reason: '',
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
        comments: scores.comments,
        reason: scores.reason,
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
                comments: scores.comments,
                status: 'SUBMITTED',
              }
            : item
        )
      );
      setToastMessage(`Đã gửi đánh giá OJT cho sinh viên ${selectedEval.fullName} thành công.`);
      setSelectedEval(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể gửi đánh giá OJT';
      setActionError(message);
      console.error('Failed to submit internship evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const submittedCount = evaluations.filter((item) => item.status === 'SUBMITTED').length;

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
          <div className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">Đánh giá thực tập OJT</h3>
                  <p className="text-xs text-slate-500">
                    {selectedEval.fullName} ({selectedEval.studentCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEval(null)}
                aria-label="Đóng biểu mẫu"
                className="font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {scoreFields.map(({ key, label }) => (
                  <label key={key} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="block font-bold text-slate-700">{label} (0–10)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        required
                        inputMode="decimal"
                        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={scores[key]}
                        onChange={(e) => setScores({ ...scores, [key]: e.target.value })}
                      />
                      <span className="text-slate-400">/ 10 điểm</span>
                    </div>
                  </label>
                ))}
              </div>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Lý do nộp/cập nhật đánh giá</span>
                <input
                  required
                  maxLength={2000}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ví dụ: Đánh giá kết quả thực tập cuối kỳ"
                  value={scores.reason}
                  onChange={(e) => setScores({ ...scores, reason: e.target.value })}
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Nhận xét chi tiết</span>
                <textarea
                  rows={3}
                  maxLength={5000}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
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

              <div className="flex items-center justify-end gap-3 pt-1">
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
