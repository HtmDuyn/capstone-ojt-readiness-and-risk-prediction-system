import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { getOjtResult, getOjtResults } from '@/services/studentService';
import {
  buttonClass,
  Card,
  dateText,
  Empty,
  Metrics,
  Pagination,
  ResourceState,
  statusText,
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
  const list = useStudentResource('ojt-results:' + key + ':' + page, (signal) =>
    getOjtResults(semesterId!, page, signal),
  );
  const detail = useStudentResource(
    selected ? 'ojt-result:' + key + ':' + selected : null,
    (signal) => getOjtResult(selected!, semesterId!, signal),
  );
  return (
    <>
      <Card title="Kết quả đã công bố">
        <ResourceState
          loading={list.loading}
          error={list.error}
          retry={list.reload}
        />
        {list.data && (
          <>
            {list.data.items.map((result) => (
              <article
                key={result.id}
                className="rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <h3 className="font-bold text-lg">
                  {result.enterpriseName} · {result.semesterCode}
                </h3>
                <p className="text-sm">
                  Điểm chính thức:{' '}
                  <strong>{result.officialScore ?? 'Chưa có'}</strong> · Kết
                  quả: {statusText(result.outcome)}
                </p>
                <p className="text-sm text-slate-500">
                  Công bố: {dateText(result.confirmedAt)}
                </p>
                <button
                  className={buttonClass}
                  type="button"
                  onClick={() => setSelected(result.id)}
                >
                  Xem chi tiết đánh giá
                </button>
              </article>
            ))}
            {!list.data.items.length && (
              <Empty>Chưa có kết quả OJT được công bố trong đợt này.</Empty>
            )}
            <Pagination
              page={page}
              total={list.data.total}
              onChange={(value) => {
                setPage(value);
                setSelected(null);
              }}
            />
          </>
        )}
      </Card>
      {selected && (
        <Card title="Chi tiết đánh giá OJT">
          <ResourceState
            loading={detail.loading}
            error={detail.error}
            retry={detail.reload}
          />
          {detail.data && (
            <>
              <h3 className="font-bold">{detail.data.enterpriseName}</h3>
              <Metrics
                values={[
                  {
                    label: 'Điểm chính thức',
                    value: detail.data.officialScore ?? '—',
                  },
                  {
                    label: 'Hoàn thành công việc',
                    value: detail.data.completionScore ?? '—',
                  },
                  { label: 'Thái độ', value: detail.data.attitudeScore ?? '—' },
                  { label: 'Kỹ năng', value: detail.data.skillScore ?? '—' },
                ]}
              />
              <p className="text-sm whitespace-pre-wrap">
                Nhận xét: {detail.data.comments || 'Chưa có nhận xét'}
              </p>
              <p className="text-sm">
                Trạng thái: {statusText(detail.data.status)} ·{' '}
                {statusText(detail.data.outcome)}
              </p>
              <button
                className={buttonClass}
                type="button"
                onClick={() => exportResult(detail.data!)}
              >
                Tải kết quả JSON
              </button>
            </>
          )}
          {detail.data === null && !detail.loading && !detail.error && (
            <Empty>Không tìm thấy kết quả đã công bố.</Empty>
          )}
        </Card>
      )}
    </>
  );
}
export const StudentEvaluationResults = () => {
  const { profile, semesterId, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Kết quả đánh giá thực tập OJT"
      description="Điểm chính thức và nhận xét đã được nhà trường xác nhận, công bố cho sinh viên."
    >
      {!loading && profile && semesterId && (
        <ResultsContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentEvaluationResults;
