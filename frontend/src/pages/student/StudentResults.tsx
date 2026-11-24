import { useState } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
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
  const list = useStudentResource(semesterId ? 'ojt-results:' + key + ':' + page : null, (signal) =>
    getOjtResults(semesterId!, page, signal),
  );
  const detail = useStudentResource(
    selected && semesterId ? 'ojt-result:' + key + ':' + selected : null,
    (signal) => getOjtResult(selected!, semesterId!, signal),
  );
  const items = list.data?.items ?? [];
  const latest = items[0];
  return (
    <>
      <Metrics values={[
        { label: 'Điểm tổng OJT', value: latest?.overallScore == null ? '—' : latest.overallScore.toFixed(2) },
        { label: 'Doanh nghiệp đánh giá', value: latest?.enterpriseName || '—' },
        { label: 'Kỳ OJT', value: latest?.semesterCode || '—' },
        { label: 'Ngày công bố', value: latest?.publishedAt ? dateText(latest.publishedAt) : '—' },
      ]} />
      <Card title="Kết quả đã công bố">
        <ResourceState
          loading={list.loading}
          error={list.error}
          retry={list.reload}
        />
        <>
            {items.map((result) => (
              <article
                key={result.id}
                className="rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <h3 className="font-bold text-lg">
                  {result.enterpriseName} · {result.semesterCode}
                </h3>
                <p className="text-sm">
                  Điểm trung bình OJT:{' '}
                  <strong>{result.overallScore == null ? 'Chưa có' : result.overallScore.toFixed(2)}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  QHDN công bố: {dateText(result.publishedAt)}
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
            {!list.loading && !list.error && !items.length && (
              <Empty>{semesterId ? 'Chưa có kết quả OJT được công bố trong đợt này.' : 'Chưa có điểm và nhận xét. Kết quả sẽ được cập nhật sau khi bạn tham gia OJT và được công bố đánh giá.'}</Empty>
            )}
            <Pagination
              page={page}
              total={list.data?.total ?? 0}
              onChange={(value) => {
                setPage(value);
                setSelected(null);
              }}
              disabled={list.loading || !semesterId}
            />
          </>
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
                    label: 'Điểm trung bình',
                    value: detail.data.overallScore == null ? '—' : detail.data.overallScore.toFixed(2),
                  },
                  {
                    label: 'Kỹ năng chuyên ngành',
                    value: detail.data.completionScore ?? '—',
                  },
                  { label: 'Thái độ', value: detail.data.attitudeScore ?? '—' },
                  { label: 'Kỹ năng mềm', value: detail.data.skillScore ?? '—' },
                ]}
              />
              <p className="text-sm whitespace-pre-wrap">
                Nhận xét: {detail.data.comments || 'Chưa có nhận xét'}
              </p>
              <p className="text-sm">
                Trạng thái: Đã công bố · {dateText(detail.data.publishedAt)}
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
      description="Điểm và nhận xét từ doanh nghiệp được Phòng Quan hệ doanh nghiệp công bố cho sinh viên."
    >
      {!loading && profile && (
        <ResultsContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentEvaluationResults;
