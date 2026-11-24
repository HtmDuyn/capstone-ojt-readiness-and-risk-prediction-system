import { useEffect, useState } from 'react';
import { Notice, Pager, errorMessage } from './QhdnUi';
import API from '@/services/apiService';

type RosterStatus = 'ASSIGNED' | 'WAITING';
type Student = { id: number; studentCode: string; fullName: string; programName: string | null; semesterName: string | null; roundName: string | null };

export function EligibleOjtRoster({ semesterId, refreshKey }: { semesterId: string; refreshKey: number }) {
  const [status, setStatus] = useState<RosterStatus>('ASSIGNED');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Student[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const limit = 10;
  useEffect(() => setPage(1), [semesterId]);
  useEffect(() => {
    setData(null);
    setError('');
    if (status === 'ASSIGNED' && !semesterId) return;
    const controller = new AbortController();
    API.get<{ data: { items: Student[]; total: number } }>('/qhdn/eligible-students', {
      params: { rosterStatus: status, ojtSemesterId: status === 'ASSIGNED' ? semesterId : undefined, page, limit },
      signal: controller.signal,
    }).then(response => {
      if (!controller.signal.aborted) setData(response.data.data);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(errorMessage(cause));
    });
    return () => controller.abort();
  }, [semesterId, refreshKey, status, page]);

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-semibold text-slate-900">Sinh viên đủ điều kiện và chưa có kết quả OJT</h2>
    <div className="flex flex-wrap gap-2">
      {(['ASSIGNED','WAITING'] as const).map(key => <button key={key} type="button" aria-pressed={status === key}
        onClick={() => { setStatus(key); setPage(1); }}
        className={`rounded-lg border px-3 py-2 text-sm font-medium ${status === key ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600'}`}>
        {key === 'ASSIGNED' ? 'Đã xếp vào đợt' : 'Danh sách chờ'}
      </button>)}
    </div>
    {error ? <Notice>{error}</Notice> : status === 'ASSIGNED' && !semesterId ? <p className="text-sm text-slate-500">Chọn kỳ OJT để xem sinh viên đã xếp đợt.</p>
      : !data ? <p role="status" className="text-sm text-slate-500">Đang tải danh sách…</p>
      : !data.items.length ? <p className="text-sm text-slate-500">Chưa có sinh viên trong danh sách này.</p>
      : <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr>{['Mã sinh viên','Họ tên','Chương trình','Kỳ OJT','Đợt OJT'].map(label => <th key={label} scope="col" className="px-3 py-2">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{data.items.map(student => <tr key={student.id}>
            <td className="px-3 py-2">{student.studentCode}</td><td className="px-3 py-2">{student.fullName}</td>
            <td className="px-3 py-2">{student.programName ?? '—'}</td><td className="px-3 py-2">{student.semesterName ?? 'Chưa xác định'}</td>
            <td className="px-3 py-2">{student.roundName ?? 'Chờ đợt mở'}</td>
          </tr>)}</tbody>
        </table></div>
        <Pager page={page} total={data.total} limit={limit} busy={false} onChange={setPage} />
      </>}
  </section>;
}
