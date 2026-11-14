import { useEducationOjtHandoff } from '@/hooks/useEducationOjtHandoff';
import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { Fragment, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { handoffDisplayById } from '@/utils/educationOjtHandoffDisplay';

const date = (value: string) => new Date(value).toLocaleString('vi-VN');

export default function EducationOjtHandoff() {
  const { candidates, visible, available, allChecked, submit, history, students, results, selected, setSelected, search, setSearch, reason, setReason, loading, saving, error, success, semesterError } = useEducationOjtHandoff();
  const [activeTab, setActiveTab] = useState<'students' | 'history'>('students');
  const [expandedHandoffId, setExpandedHandoffId] = useState<number | null>(null);
  const studentsById = new Map(students.map(student => [student.id, student]));
  const handoffDisplay = handoffDisplayById(history);
  useEffect(() => { if (success) setActiveTab('history'); }, [success]);
  return <div className="space-y-4">
    <PageBanner title="Bàn giao OJT" description="Bàn giao sinh viên đủ điều kiện sang Phòng Quan hệ doanh nghiệp." badge="Phòng Đào tạo" />
    <div className="grid gap-3 sm:grid-cols-3">
      {[['Sinh viên có kết quả đủ điều kiện đã lưu', candidates.length], ['Có thể chọn trong bộ lọc', available.length], ['Đã chọn bàn giao', selected.length]].map(([label, count]) => <div key={label} className="flex min-h-24 flex-col justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"><p className="text-sm leading-5 text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold leading-7 text-orange-600">{count}</p></div>)}
    </div>
    <main className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div role="tablist" aria-label="Bàn giao OJT" className="flex gap-6 border-b border-slate-200 px-4 sm:px-6">
      <button type="button" role="tab" id="handoff-students-tab" aria-controls="handoff-students-panel" aria-selected={activeTab === 'students'} onClick={() => setActiveTab('students')} className={`-mb-px border-b-2 py-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${activeTab === 'students' ? 'border-orange-600 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600 hover:text-slate-900'}`}>Bàn giao sinh viên</button>
      <button type="button" role="tab" id="handoff-history-tab" aria-controls="handoff-history-panel" aria-selected={activeTab === 'history'} onClick={() => setActiveTab('history')} className={`-mb-px border-b-2 py-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${activeTab === 'history' ? 'border-orange-600 font-semibold text-slate-900' : 'border-transparent font-medium text-slate-600 hover:text-slate-900'}`}>Lịch sử bàn giao</button>
    </div>
    {success && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-700">{success}</p>}
    <div id="handoff-students-panel" role="tabpanel" aria-labelledby="handoff-students-tab" hidden={activeTab !== 'students'}>
    <section className="space-y-4 p-4 sm:p-6">
      <div>
        <input aria-label="Tìm sinh viên bàn giao" placeholder="Tìm mã, tên sinh viên hoặc chương trình" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3" />
      </div>
      {(error || semesterError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error || semesterError}</p>}
      <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4"><label className="block text-sm font-medium" htmlFor="handoff-reason">Nội dung bàn giao <span className="text-red-600">*</span></label><textarea id="handoff-reason" maxLength={2000} disabled={saving} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập nội dung bàn giao cho Phòng Quan hệ doanh nghiệp" className="w-full rounded-xl border border-slate-200 p-3" /><p className="text-xs text-slate-500">Vui lòng nhập nội dung trước khi bàn giao.</p><button disabled={loading || saving || !selected.length || selected.length > 1000 || !reason.trim()} onClick={submit} className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang bàn giao...' : `Bàn giao ${selected.length} sinh viên sang Phòng QHDN`}</button></div>
      {loading ? <p role="status">Đang tải danh sách bàn giao...</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="border-b border-[#D6E4F0] bg-[#EFF6FF] font-semibold text-[#334155]"><tr><th className="p-3"><input type="checkbox" aria-label="Chọn tất cả sinh viên có thể bàn giao trong bộ lọc" checked={allChecked} disabled={saving || !available.length} onChange={e => setSelected(old => e.target.checked ? [...new Set([...old, ...available.map(c => c.student.id)])] : old.filter(id => !available.some(c => c.student.id === id)))} /></th>{['Sinh viên', 'Chương trình / Lớp', 'Tín chỉ đạt', 'Môn còn rớt', 'Xét gần nhất', 'Kỳ chương trình', 'Kỳ OJT', 'Trạng thái bàn giao'].map(h => <th key={h} className={`p-3 ${h === 'Kỳ chương trình' ? 'w-28' : h === 'Kỳ OJT' ? 'min-w-36' : ''}`}>{h}</th>)}</tr></thead>
        <tbody>{visible.map(({ student: s, result: r, blocked, targetName, curriculumSemester }) => <tr key={s.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="p-3"><input type="checkbox" aria-label={`Chọn ${s.studentCode}`} checked={selected.includes(s.id)} disabled={saving || Boolean(blocked)} onChange={e => setSelected(old => e.target.checked ? [...old, s.id] : old.filter(id => id !== s.id))} /></td><td className="p-3"><Link className="font-semibold text-orange-700" to={`/education/student-import/students/${s.id}`}>{s.studentCode}</Link><p>{s.fullName}</p></td><td className="p-3">{s.program?.name ?? '—'}<p className="text-slate-500">{s.className ?? '—'}</p></td><td className="p-3">{r.earnedCredits ?? '—'}</td><td className="p-3">{r.unpassedCourseCount}</td><td className="p-3">{date(r.checkedAt)}</td><td className="whitespace-nowrap p-3">{curriculumSemester === null ? '—' : `Kỳ ${curriculumSemester}`}</td><td className="min-w-36 p-3">{targetName}</td><td className={`p-3 ${blocked ? 'text-amber-700' : 'text-green-700'}`}>{blocked || 'Sẵn sàng bàn giao'}</td></tr>)}</tbody>
      </table>{!visible.length && <p className="p-8 text-center text-slate-500">Không có sinh viên phù hợp.</p>}</div>}
    </section>
    </div>
    <div id="handoff-history-panel" role="tabpanel" aria-labelledby="handoff-history-tab" hidden={activeTab !== 'history'}>
    <section className="space-y-4 p-4 sm:p-6">
      <h2 className="text-lg font-bold">Lịch sử bàn giao</h2>
      {!history.length ? <p className="text-slate-500">Chưa có đợt bàn giao.</p> : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]"><tr>{['Đợt', 'Kỳ OJT', 'Thời gian', 'Số sinh viên', 'Nội dung', 'Nơi nhận', ''].map((heading, index) => <th key={index} scope="col" className="p-3">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-200">{history.map(h => {
            const expanded = expandedHandoffId === h.id;
            return <Fragment key={h.id}>
              <tr role="button" tabIndex={0} aria-expanded={expanded} aria-controls={`handoff-detail-${h.id}`} onClick={() => setExpandedHandoffId(expanded ? null : h.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedHandoffId(expanded ? null : h.id); } }} className={`cursor-pointer border-l-4 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${expanded ? 'border-l-orange-500 bg-orange-50' : 'border-l-transparent bg-white hover:bg-slate-50'}`}>
                <td className="whitespace-nowrap p-3">Đợt {handoffDisplay.get(h.id)?.roundNumber}</td><td className="p-3">{handoffDisplay.get(h.id)?.semesterName ?? '—'}</td><td className="p-3">{date(h.createdAt)}</td><td className="p-3">{h.studentCount}</td><td className="max-w-64 break-words p-3">{h.reason}</td><td className="p-3">Phòng QHDN</td><td className="p-3 text-right"><ChevronDown size={16} aria-hidden="true" className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} /></td>
              </tr>
              {expanded && <tr id={`handoff-detail-${h.id}`} className="bg-white"><td colSpan={7} className="px-3 pb-4 pt-2 sm:px-5 sm:pb-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Danh sách sinh viên bàn giao – Đợt {handoffDisplay.get(h.id)?.roundNumber} ({h.studentCount} sinh viên)</h3>
                {!Array.isArray(h.studentIds) || h.studentIds.length !== h.studentCount ? <p role="alert" className="mb-3 text-sm text-amber-700">Danh sách sinh viên của đợt chưa tải đầy đủ. Vui lòng tải lại trang.</p> : null}
                {Array.isArray(h.studentIds) && h.studentIds.length > 0 ? <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-200/70 text-xs text-slate-700"><tr>{['STT', 'Mã sinh viên', 'Họ và tên', 'Khung chương trình', 'Tín chỉ đạt', 'Số môn chưa đạt'].map(heading => <th key={heading} scope="col" className="px-3 py-2 font-semibold">{heading}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-200">{h.studentIds.map((studentId, index) => {
                      const student = studentsById.get(studentId);
                      const result = results[studentId];
                      return <tr key={studentId} className="odd:bg-white even:bg-slate-50 hover:!bg-orange-50"><td className="px-3 py-2 tabular-nums">{index + 1}</td><td className="whitespace-nowrap px-3 py-2 font-medium">{student?.studentCode ?? 'Chưa tải được'}</td><td className="px-3 py-2">{student?.fullName ?? 'Không tải được hồ sơ sinh viên'}</td><td className="px-3 py-2">{student?.program?.name ?? '—'}</td><td className="px-3 py-2 tabular-nums">{result?.earnedCredits ?? '—'}</td><td className="px-3 py-2 tabular-nums">{result?.unpassedCourseCount ?? '—'}</td></tr>;
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
    </div>
    </main>
  </div>;
}
