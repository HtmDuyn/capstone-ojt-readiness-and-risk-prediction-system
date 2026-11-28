import { useEffect, useState } from 'react';
import { Notice, Pager, errorMessage } from './QhdnUi';
import { getEligibleStudentsPage } from '@/services/qhdnService';
import { useQhdnCacheRefresh } from '@/hooks/qhdn/useQhdnCacheRefresh';

type AcademicHistory = { resultId: number; courseCode: string; courseName: string; semesterTaken: number; periodName: string | null; score: number | null; grade: string | null; status: string };
type Student = { id: number; studentCode: string; fullName: string; programName: string | null; semesterName: string | null; academicHistory: AcademicHistory[] };

export function EligibleOjtRoster({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Student[]; total: number } | null>(null);
  const [error, setError] = useState('');
  const [cacheRevision,setCacheRevision]=useState(0);
  useQhdnCacheRefresh(['/qhdn/eligible-students:'],()=>setCacheRevision(value=>value+1),300);
  const limit = 10;
  useEffect(() => {
    setData(null);
    setError('');
    const controller = new AbortController();
    getEligibleStudentsPage<{ items:Student[];total:number }>({page,limit},controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(errorMessage(cause));
    });
    return () => controller.abort();
  }, [refreshKey, page,cacheRevision]);

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <div><h2 className="font-semibold text-slate-900">Danh sách sinh viên đủ điều kiện OJT</h2><p className="mt-1 text-xs text-slate-500">Hiển thị sinh viên có kết quả đủ điều kiện, chưa đạt OJT202 ở lần học mới nhất; không phụ thuộc việc đã gán đợt tuyển dụng.</p></div>
    {error ? <Notice>{error}</Notice> : !data ? <p role="status" className="text-sm text-slate-500">Đang tải danh sách…</p>
      : !data.items.length ? <p className="text-sm text-slate-500">Chưa có sinh viên trong danh sách này.</p>
      : <>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="bg-slate-50"><tr>{['Mã sinh viên','Họ tên','Chương trình','Kỳ OJT','Lịch sử học vụ'].map(label => <th key={label} scope="col" className="px-3 py-2">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{data.items.map(student => <tr key={student.id}>
            <td className="px-3 py-2">{student.studentCode}</td><td className="px-3 py-2">{student.fullName}</td>
            <td className="px-3 py-2">{student.programName ?? '—'}</td><td className="px-3 py-2">{student.semesterName}</td>
            <td className="px-3 py-2"><details>
              <summary className="cursor-pointer text-blue-700">Xem {student.academicHistory?.length ?? 0} môn</summary>
              {student.academicHistory?.length ? <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs"><thead className="bg-slate-50"><tr>
                  {['Môn học','Kỳ','Điểm','Trạng thái'].map(label => <th key={label} scope="col" className="px-2 py-1.5">{label}</th>)}
                </tr></thead><tbody className="divide-y divide-slate-100">{student.academicHistory.map(course => <tr key={course.resultId}>
                  <td className="px-2 py-1.5">{course.courseCode} · {course.courseName}</td>
                  <td className="px-2 py-1.5">{course.periodName ?? `Học kỳ ${course.semesterTaken}`}</td>
                  <td className="px-2 py-1.5">{course.grade ?? course.score ?? '—'}</td>
                  <td className="px-2 py-1.5">{course.status}</td>
                </tr>)}</tbody></table>
              </div> : <p className="mt-2 text-xs text-slate-500">Chưa có lịch sử môn học.</p>}
            </details></td>
          </tr>)}</tbody>
        </table></div>
        <Pager page={page} total={data.total} limit={limit} busy={false} onChange={setPage} />
      </>}
  </section>;
}
