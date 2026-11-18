import { useEducationOjtHandoff } from '@/hooks/useEducationOjtHandoff';
import { PageBanner } from '@/components/common/PageBanner';
import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { filterHandoffHistory, handoffDisplayById, matchingHandoffStudentIds } from '@/utils/educationOjtHandoffDisplay';

const date = (value: string) => new Date(value).toLocaleString('vi-VN');

export default function EducationOjtHandoff() {
  const { history, students, loading, error } = useEducationOjtHandoff();
  const [expandedHandoffId, setExpandedHandoffId] = useState<number | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySemester, setHistorySemester] = useState('');
  const [historyRound, setHistoryRound] = useState('');
  const studentsById = new Map(students.map(student => [student.id, student]));
  const handoffDisplay = handoffDisplayById(history);
  const historySemesters = [...new Map(history.map(h => [h.ojtSemesterId, handoffDisplay.get(h.id)?.semesterName ?? '—'])).entries()];
  const historyRounds = [...new Set(history.filter(h => !historySemester || String(h.ojtSemesterId) === historySemester).map(h => handoffDisplay.get(h.id)?.roundNumber).filter((round): round is number => round !== undefined))].sort((a, b) => a - b);
  const filteredHistory = filterHandoffHistory(history, studentsById, historySearch, historySemester, historyRound);
  return <div className="space-y-4">
    <PageBanner title="Lịch sử bàn giao OJT" description="Tra cứu các đợt bàn giao sang Phòng Quan hệ doanh nghiệp theo kỳ OJT." badge="Phòng Đào tạo" />
    <main className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <section className="space-y-4 p-4 sm:p-6">
      <h2 className="text-lg font-bold">Lịch sử bàn giao</h2>
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <input aria-label="Tìm lịch sử bàn giao" placeholder="Tìm mã, tên sinh viên hoặc nội dung bàn giao" value={historySearch} onChange={event => setHistorySearch(event.target.value)} className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <select aria-label="Lọc lịch sử theo kỳ OJT" value={historySemester} onChange={event => { setHistorySemester(event.target.value); setHistoryRound(''); }} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Tất cả kỳ OJT</option>{historySemesters.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select aria-label="Lọc lịch sử theo đợt bàn giao" value={historyRound} onChange={event => setHistoryRound(event.target.value)} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Tất cả đợt</option>{historyRounds.map(round => <option key={round} value={round}>Đợt {round}</option>)}</select>
      </div>
      {loading ? <p role="status">Đang tải lịch sử bàn giao…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : !history.length ? <p className="text-slate-500">Chưa có đợt bàn giao.</p> : !filteredHistory.length ? <p role="status" className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Không tìm thấy đợt bàn giao phù hợp.</p> : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]"><tr>{['Đợt', 'Kỳ OJT', 'Thời gian', 'Số sinh viên', 'Nội dung', 'Nơi nhận', ''].map((heading, index) => <th key={index} scope="col" className="p-3">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-200">{filteredHistory.map(h => {
            const expanded = expandedHandoffId === h.id;
            const matchingStudents = matchingHandoffStudentIds(h, studentsById, historySearch);
            return <Fragment key={h.id}>
              <tr role="button" tabIndex={0} aria-expanded={expanded} aria-controls={`handoff-detail-${h.id}`} onClick={() => setExpandedHandoffId(expanded ? null : h.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedHandoffId(expanded ? null : h.id); } }} className={`cursor-pointer border-l-4 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${expanded ? 'border-l-orange-500 bg-orange-50' : 'border-l-transparent bg-white hover:bg-slate-50'}`}>
                <td className="whitespace-nowrap p-3">Đợt {handoffDisplay.get(h.id)?.roundNumber}</td><td className="p-3">{handoffDisplay.get(h.id)?.semesterName ?? '—'}</td><td className="p-3">{date(h.createdAt)}</td><td className="p-3">{h.studentCount}</td><td className="max-w-64 break-words p-3">{h.reason}</td><td className="p-3">Phòng QHDN</td><td className="p-3 text-right"><ChevronDown size={16} aria-hidden="true" className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} /></td>
              </tr>
              {expanded && <tr id={`handoff-detail-${h.id}`} className="bg-white"><td colSpan={7} className="px-3 pb-4 pt-2 sm:px-5 sm:pb-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Danh sách sinh viên bàn giao – Đợt {handoffDisplay.get(h.id)?.roundNumber} ({h.studentCount} sinh viên)</h3>
                {!Array.isArray(h.studentIds) || h.studentIds.length !== h.studentCount ? <p role="alert" className="mb-3 text-sm text-amber-700">Danh sách sinh viên của đợt chưa tải đầy đủ. Vui lòng tải lại trang.</p> : null}
                {Array.isArray(h.studentIds) && h.studentIds.length > 0 ? <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-200/70 text-xs text-slate-700"><tr>{['STT', 'Mã sinh viên', 'Họ và tên', 'Khung chương trình'].map(heading => <th key={heading} scope="col" className="px-3 py-2 font-semibold">{heading}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-200">{h.studentIds.map((studentId, index) => {
                      const student = studentsById.get(studentId);
                      return <tr key={studentId} className={`${matchingStudents.has(studentId) ? 'bg-orange-100 font-semibold' : 'odd:bg-white even:bg-slate-50'} hover:!bg-orange-50`}><td className="px-3 py-2 tabular-nums">{index + 1}</td><td className="whitespace-nowrap px-3 py-2 font-medium">{student?.studentCode ?? 'Chưa tải được'}</td><td className="px-3 py-2">{student?.fullName ?? 'Không tải được hồ sơ sinh viên'}</td><td className="px-3 py-2">{student?.program?.name ?? '—'}</td></tr>;
                    })}</tbody>
                  </table>
                </div> : <p className="text-sm text-slate-500">Chưa tải được danh sách sinh viên của đợt này.</p>}
                </div>
              </td></tr>}
            </Fragment>;
          })}</tbody>
        </table>
      </div>}
    </section>
    </main>
  </div>;
}
