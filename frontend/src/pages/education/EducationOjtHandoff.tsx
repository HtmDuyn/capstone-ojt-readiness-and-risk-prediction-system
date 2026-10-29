import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import API from '@/services/api';
import { apiData, getAllItems } from '@/services/educationApi';
import { loadSavedLocalOjtResults } from '@/services/localOjtEligibility.service';
import type { ImportedStudent } from '@/types/education/import.types';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import { handoffTarget, type HandoffCohort } from '@/utils/ojtHandoff';

type Handoff = { id: number; studentCount: number; studentIds: number[]; createdAt: string; reason: string };
type Candidate = { student: ImportedStudent; result: SavedOjtEligibility; blocked: string; targetName: string };
const date = (value: string) => new Date(value).toLocaleString('vi-VN');

export default function EducationOjtHandoff() {
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [semesterId, setSemesterId] = useState('');
  const [students, setStudents] = useState<ImportedStudent[]>([]);
  const [results, setResults] = useState<Record<number, SavedOjtEligibility>>({});
  const [cohorts, setCohorts] = useState<HandoffCohort[]>([]);
  const [history, setHistory] = useState<Handoff[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refresh, setRefresh] = useState(0);
  const request = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected([]); setStudents([]); setResults({}); setHistory([]); setCohorts([]);
    Promise.all([
      getAllItems<ImportedStudent>('/students', {}, controller.signal),
      loadSavedLocalOjtResults(controller.signal),
      semesterId ? getAllItems<Handoff>('/eligible-student-handoffs', { ojtSemesterId: Number(semesterId) }, controller.signal) : Promise.resolve([]),
      getAllItems<HandoffCohort>('/cohorts', {}, controller.signal),
    ]).then(([allStudents, saved, handoffs, allCohorts]) => {
      if (controller.signal.aborted) return;
      setStudents(allStudents); setResults(Object.fromEntries(saved.map(r => [r.studentId, r])));
      setHistory(handoffs); setCohorts(allCohorts);
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được danh sách bàn giao.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [semesterId, refresh]);

  const candidates = useMemo<Candidate[]>(() => {
    const handed = new Set(history.flatMap(h => h.studentIds));
    return students.flatMap(student => {
      const eligibility = handoffTarget(student, results[student.id], cohorts, semesters);
      if (!eligibility) return [];
      const { result, target, issue } = eligibility;
      if (semesterId && target && target.id !== Number(semesterId)) return [];
      const blocked = issue || (!semesterId ? 'Chọn kỳ OJT để bàn giao'
        : handed.has(student.id) ? 'Đã bàn giao trong kỳ này'
        : target?.status === 'CLOSED' || target?.status === 'ARCHIVED' ? 'Kỳ OJT đã đóng'
        : '');
      return [{ student, result, blocked, targetName: target ? `${target.name} (${target.semesterCode})` : 'Chưa cấu hình' }];
    });
  }, [students, results, cohorts, semesters, history, semesterId]);
  const visible = candidates.filter(({ student }) => `${student.studentCode} ${student.fullName} ${student.program?.name ?? ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const available = visible.filter(c => !c.blocked);
  const allChecked = available.length > 0 && available.every(c => selected.includes(c.student.id));

  async function submit() {
    if (!semesterId || !selected.length || !reason.trim() || loading || saving) return;
    const ids = [...selected].sort((a, b) => a - b);
    if (ids.length > 1000) { setError('Mỗi lần bàn giao tối đa 1.000 sinh viên.'); return; }
    if (ids.some(id => !candidates.some(c => c.student.id === id && !c.blocked))) { setError('Danh sách đã thay đổi. Hãy chọn lại sinh viên.'); return; }
    const signature = JSON.stringify({ ojtSemesterId: Number(semesterId), studentIds: ids, reason: reason.trim() });
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() };
    setSaving(true); setError(''); setSuccess('');
    try {
      const result = apiData<{ handoffId: number; total: number; recipientRole: string }>((await API.post('/eligible-student-handoffs', {
        ojtSemesterId: Number(semesterId), studentIds: ids, reason: reason.trim(), idempotencyKey: request.current.key,
      })).data);
      if (!result.handoffId || result.total !== ids.length || result.recipientRole !== 'OJT_COORD') throw new Error('Chưa nhận được xác nhận bàn giao đầy đủ từ hệ thống. Hãy tải lại để kiểm tra.');
      setSuccess(`Đã bàn giao ${result.total} sinh viên sang Phòng Quan hệ doanh nghiệp (đợt #${result.handoffId}).`);
      setSelected([]); setReason(''); request.current = null; setRefresh(n => n + 1);
    } catch (e) {
      const code = (e as { response?: { data?: { errorCode?: string; code?: string } } })?.response?.data;
      const message = e instanceof Error ? e.message : 'Bàn giao không thành công.';
      setError(code?.errorCode === 'CONFIRMED_ELIGIBILITY_REQUIRED' || code?.code === 'CONFIRMED_ELIGIBILITY_REQUIRED' || message.includes('Current confirmed eligible result required')
        ? 'Chưa thể bàn giao: hệ thống chưa hỗ trợ sử dụng kết quả xét đã lưu.' : message);
    }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageBanner title="Bàn giao OJT" description="Bàn giao sinh viên đủ điều kiện sang Phòng Quan hệ doanh nghiệp." badge="Phòng Đào tạo" />
    <div className="grid gap-4 sm:grid-cols-3">
      {[['Sinh viên kỳ 5 đủ điều kiện', candidates.length], ['Có thể chọn trong bộ lọc', available.length], ['Đã chọn bàn giao', selected.length]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-orange-600">{count}</p></div>)}
    </div>
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <select aria-label="Kỳ bàn giao OJT" value={semesterId} disabled={saving} onChange={e => { setSemesterId(e.target.value); setSelected([]); setSuccess(''); }} className="rounded-xl border border-slate-200 p-3"><option value="">Chọn kỳ OJT</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.semesterCode})</option>)}</select>
        <input aria-label="Tìm sinh viên bàn giao" placeholder="Tìm mã, tên sinh viên hoặc chương trình" value={search} onChange={e => setSearch(e.target.value)} className="min-w-64 flex-1 rounded-xl border border-slate-200 p-3" />
        <button disabled={saving || loading} onClick={() => { reloadSemesters(); setRefresh(n => n + 1); }} className="rounded-xl border px-4 py-2 disabled:opacity-50">Tải lại</button>
      </div>
      {(error || semesterError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error || semesterError}</p>}
      {success && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-700">{success}</p>}
      <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4"><label className="block text-sm font-medium" htmlFor="handoff-reason">Nội dung bàn giao</label><textarea id="handoff-reason" maxLength={2000} disabled={saving} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nhập nội dung bàn giao cho Phòng Quan hệ doanh nghiệp" className="w-full rounded-xl border border-slate-200 p-3" /><button disabled={loading || saving || !semesterId || !selected.length || selected.length > 1000 || !reason.trim()} onClick={submit} className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang bàn giao...' : `Bàn giao ${selected.length} sinh viên sang Phòng QHDN`}</button></div>
      {loading ? <p role="status">Đang tải danh sách bàn giao...</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-b border-[#D6E4F0] bg-[#EFF6FF] font-semibold text-[#334155]"><tr><th className="p-3"><input type="checkbox" aria-label="Chọn tất cả sinh viên có thể bàn giao trong bộ lọc" checked={allChecked} disabled={saving || !available.length} onChange={e => setSelected(old => e.target.checked ? [...new Set([...old, ...available.map(c => c.student.id)])] : old.filter(id => !available.some(c => c.student.id === id)))} /></th>{['Sinh viên', 'Chương trình / Lớp', 'Tín chỉ đạt', 'Môn còn rớt', 'Xét gần nhất', 'Kỳ OJT tiếp theo (kỳ 6)', 'Trạng thái bàn giao'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{visible.map(({ student: s, result: r, blocked, targetName }) => <tr key={s.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="p-3"><input type="checkbox" aria-label={`Chọn ${s.studentCode}`} checked={selected.includes(s.id)} disabled={saving || Boolean(blocked)} onChange={e => setSelected(old => e.target.checked ? [...old, s.id] : old.filter(id => id !== s.id))} /></td><td className="p-3"><Link className="font-semibold text-orange-700" to={`/education/student-import/students/${s.id}`}>{s.studentCode}</Link><p>{s.fullName}</p></td><td className="p-3">{s.program?.name ?? '—'}<p className="text-slate-500">{s.className ?? '—'}</p></td><td className="p-3">{r.earnedCredits ?? '—'}</td><td className="p-3">{r.unpassedCourseCount}</td><td className="p-3">{date(r.checkedAt)}</td><td className="p-3">{targetName}</td><td className={`p-3 ${blocked ? 'text-amber-700' : 'text-green-700'}`}>{blocked || 'Sẵn sàng bàn giao'}</td></tr>)}</tbody>
      </table>{!visible.length && <p className="p-8 text-center text-slate-500">Không có sinh viên phù hợp.</p>}</div>}
    </section>
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Lịch sử bàn giao trong kỳ</h2>{!semesterId ? <p className="text-slate-500">Chọn kỳ OJT để xem lịch sử.</p> : !history.length ? <p className="text-slate-500">Chưa có đợt bàn giao.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]"><tr>{['Đợt', 'Thời gian', 'Số sinh viên', 'Nội dung', 'Nơi nhận'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{history.map(h => <tr key={h.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"><td className="p-3">#{h.id}</td><td className="p-3">{date(h.createdAt)}</td><td className="p-3">{h.studentCount}</td><td className="p-3">{h.reason}</td><td className="p-3">Phòng QHDN</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
