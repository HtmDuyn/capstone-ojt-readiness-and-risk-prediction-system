import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { getOjtResult, getOjtResults } from '@/services/studentService';
import { StudentDialog } from '@/components/student/StudentDialog';
import {
  buttonClass,
  dateText,
  Empty,
  Pagination,
  ResourceState,
  StudentPage,
} from '@/components/student/PortalUI';
import type { OjtResult } from '@/types/student/portal';

function exportResult(result: OjtResult) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ket-qua-ojt-' + result.id + '.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ResultsContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const key = profile!.id + ':' + semesterId + ':' + revision;
  const list = useStudentResource(semesterId ? 'ojt-results:' + key + ':' + page : null, (signal) =>
    getOjtResults(semesterId!, page, signal),
  );
  const detail = useStudentResource(
    selected && semesterId ? 'ojt-result:' + key + ':' + selected : null,
    (signal) => getOjtResult(selected!, semesterId!, signal),
  );
  const items = list.data?.items ?? [];
  return (
    <>
      <div className="min-w-0 space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <section aria-labelledby="published-results-heading" className="space-y-4">
        <h2 id="published-results-heading" className="border-b border-slate-200 pb-3 text-lg font-semibold text-slate-900">Kết quả đã công bố</h2>
        <ResourceState
          loading={list.loading}
          error={list.error}
          retry={list.reload}
        />
        <>
            {items.map((result) => (
              <article
                key={result.id}
                className="flex flex-col gap-3 border-b border-slate-200 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                <h3 className="break-words font-semibold text-slate-900">
                  {result.enterpriseName} · {result.semesterCode}
                </h3>
                <p className="text-xs text-slate-500">
                  QHDN công bố: {dateText(result.publishedAt)}
                </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
                <p className="text-sm text-slate-600">
                  Điểm OJT: <strong className="tabular-nums text-slate-900">{result.overallScore == null ? 'Chưa có' : result.overallScore.toFixed(2)}</strong>
                </p>
                <button
                  className={buttonClass}
                  type="button"
                  onClick={() => setSelected(result.id)}
                >
                  Xem chi tiết đánh giá
                </button>
                </div>
              </article>
            ))}
            {!list.loading && !list.error && !items.length && (
              <Empty>{semesterId ? 'Chưa có kết quả OJT được công bố trong đợt này.' : 'Chưa có điểm và nhận xét. Kết quả sẽ được cập nhật sau khi bạn tham gia OJT và được công bố đánh giá.'}</Empty>
            )}
            {(list.data?.total ?? 0) > 20 && <Pagination
              page={page}
              total={list.data?.total ?? 0}
              onChange={(value) => {
                setPage(value);
                setSelected(null);
              }}
              disabled={list.loading || !semesterId}
            />}
          </>
      </section>
      <section aria-labelledby="ojt-certificates-heading" className="space-y-3 border-t border-slate-200 pt-5">
        <h2 id="ojt-certificates-heading" className="text-lg font-semibold text-slate-900">Chứng chỉ</h2>
        <p className="text-sm text-slate-600">Chứng chỉ hoàn thành OJT</p>
        <Empty>Chưa có chứng chỉ được cập nhật{semesterId ? ' cho kỳ OJT này' : ''}.</Empty>
      </section>
      </div>
      {selected !== null && (
        <StudentDialog title="Chi tiết đánh giá OJT" onClose={() => setSelected(null)}>
          <ResourceState
            loading={detail.loading}
            error={detail.error}
            retry={detail.reload}
          />
          {detail.data && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="break-words text-base font-semibold text-slate-900">{detail.data.enterpriseName}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Đã công bố</span>
              </div>
              <dl className="divide-y divide-slate-100">
                {[
                  {
                    label: 'Điểm trung bình',
                    value: detail.data.overallScore == null ? '—' : detail.data.overallScore.toFixed(2),
                  },
                  {
                    label: 'Kỹ năng chuyên ngành',
                    value: detail.data.completionScore ?? '—',
                  },
                  { label: 'Thái độ', value: detail.data.attitudeScore ?? '—' },
                  { label: 'Kỹ năng mềm', value: detail.data.skillScore ?? '—' },
                ].map(({ label, value }, index) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className={index === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</dt>
                    <dd className={`shrink-0 tabular-nums ${index === 0 ? 'text-xl font-bold text-orange-600' : 'font-semibold text-slate-900'}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-slate-800">Nhận xét từ doanh nghiệp</h4>
                <p className="mt-1.5 whitespace-pre-wrap break-words leading-relaxed text-slate-600">{detail.data.comments || 'Chưa có nhận xét'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">Ngày công bố: {dateText(detail.data.publishedAt)}</p>
                <button
                  className={buttonClass}
                  type="button"
                  onClick={() => exportResult(detail.data!)}
                >
                  Tải kết quả
                </button>
              </div>
            </div>
          )}
          {detail.data === null && !detail.loading && !detail.error && (
            <Empty>Không tìm thấy kết quả đã công bố.</Empty>
          )}
        </StudentDialog>
      )}
    </>
  );
}
export const StudentEvaluationResults = () => {
  const { profile, semesterId, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Kết quả đánh giá thực tập OJT"
      description="Điểm và nhận xét từ doanh nghiệp được Phòng Quan hệ doanh nghiệp công bố cho sinh viên."
      needsSemester={false}
    >
      {!loading && profile && (
        <ResultsContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentEvaluationResults;
