import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { academicService } from '@/services/educationService';

type Criterion = { key: string; label: string; weight: number };
type Semester = { id: number; code: string; name: string; startDate: string; endDate: string; status: string };
type Version = { id: number; ojtSemesterId: number | null; effectiveFrom: string | null; effectiveAt: string | null; name: string; criteria: Criterion[]; version: number };

export default function EducationGradingCriteria() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [name, setName] = useState('Bộ tiêu chí đánh giá OJT');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { key: 'criterion_1', label: 'Kỹ năng chuyên ngành', weight: 40 },
    { key: 'criterion_2', label: 'Kỹ năng mềm', weight: 30 },
    { key: 'criterion_3', label: 'Thái độ', weight: 30 },
  ]);
  const [reason, setReason] = useState('Cập nhật tỷ trọng đánh giá để phản ánh đầy đủ năng lực chuyên môn, kỹ năng phối hợp và thái độ làm việc trong kỳ thực tập.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    try {
      const data = await academicService.getOjtGradingCriteria();
      setSemesters(data.semesters);
      setVersions(data.items);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được cấu hình.');
    }
  };
  useEffect(() => { void load(); }, []);
  const sum = useMemo(() => Math.round(criteria.reduce((total, item) => total + (Number(item.weight) || 0), 0) * 100) / 100, [criteria]);
  const update = (index: number, key: keyof Criterion, value: string) => setCriteria(old => old.map((item, i) => i === index ? { ...item, [key]: key === 'weight' ? Number(value) : value } : item));
  const save = async () => {
    if (sum !== 100) { setError('Tổng tỷ lệ phải bằng đúng 100%.'); return; }
    if (!reason.trim()) { setError('Nhập lý do thay đổi để lưu lịch sử.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await academicService.saveOjtGradingCriteria({ name, criteria, reason });
      setNotice('Đã tạo phiên bản tiêu chí mới và áp dụng cho toàn hệ thống từ thời điểm lưu.');
      setReason('Cập nhật tỷ trọng đánh giá để phản ánh đầy đủ năng lực chuyên môn, kỹ năng phối hợp và thái độ làm việc trong kỳ thực tập.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được.');
    } finally { setBusy(false); }
  };
  const formatEffectiveAt = (version: Version) => version.effectiveAt
    ? new Date(version.effectiveAt).toLocaleString('vi-VN')
    : version.effectiveFrom ?? '—';

  return <div className="mx-auto w-full max-w-7xl space-y-5">
    <PageBanner variant="education" title="Quản lý chấm điểm OJT" description="Thiết lập bộ tiêu chí dùng chung cho doanh nghiệp trên toàn hệ thống." badge="Phòng Đào tạo" />
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mr-2 inline" size={17} />{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline" size={17} />{notice}</div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-lg font-bold text-slate-900">Phiên bản tiêu chí mới</h2><p className="mt-1 text-sm leading-6 text-slate-500">Bộ tiêu chí được áp dụng cho toàn bộ doanh nghiệp ngay sau khi lưu. Các điểm đã gửi chính thức vẫn giữ phiên bản đã chấm.</p></div>
      <div className="space-y-5 p-5 sm:p-6">
        <label className="block text-sm font-medium text-slate-700">Tên bộ tiêu chí<input className="mt-1.5 block min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" value={name} onChange={event => setName(event.target.value)} /></label>
        <div className="space-y-3">
          {criteria.map((item, index) => <div key={item.key} className="grid items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,1fr)_150px_auto]">
            <label className="text-sm font-medium text-slate-700">Tiêu chí<input className="mt-1.5 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={item.label} onChange={event => update(index, 'label', event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Tỷ lệ (%)<input type="number" min="0.01" max="100" step="0.01" className="mt-1.5 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={item.weight} onChange={event => update(index, 'weight', event.target.value)} /></label>
            <button type="button" aria-label="Xóa tiêu chí" disabled={criteria.length < 2} onClick={() => setCriteria(old => old.filter((_, i) => i !== index))} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:opacity-40"><Trash2 size={17} /></button>
          </div>)}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" disabled={criteria.length >= 20} onClick={() => setCriteria(old => [...old, { key: `criterion_${Date.now()}`, label: '', weight: 0 }])} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"><Plus size={16} />Thêm tiêu chí</button>
            <p className={`text-sm font-semibold ${sum === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>Tổng tỷ lệ: {sum.toFixed(2)}% {sum === 100 ? '✓' : '— cần bằng 100%'}</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-700">Lý do thay đổi<textarea className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 leading-6 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" rows={3} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Nêu lý do ban hành hoặc cập nhật bộ tiêu chí" /></label>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Thời điểm lưu được dùng làm thời điểm hiệu lực của phiên bản.</p><button type="button" onClick={() => void save()} disabled={busy || sum !== 100 || !reason.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={17} />{busy ? 'Đang lưu…' : 'Lưu và áp dụng toàn hệ thống'}</button></div>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="text-lg font-bold text-slate-900">Lịch sử cấu hình</h2><p className="mt-1 text-sm text-slate-500">Thời điểm áp dụng và phạm vi của từng phiên bản</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr><th className="px-5 py-3 font-semibold">Phạm vi</th><th className="px-4 py-3 font-semibold">Phiên bản</th><th className="px-4 py-3 font-semibold">Tiêu chí và tỷ lệ</th><th className="px-4 py-3 font-semibold">Thời điểm áp dụng</th></tr></thead><tbody className="divide-y divide-slate-100">{versions.map(version => <tr key={version.id} className="align-top"><td className="px-5 py-4 font-medium text-slate-800">{version.ojtSemesterId == null ? 'Toàn hệ thống' : `Kỳ OJT ${semesters.find(semester => semester.id === version.ojtSemesterId)?.code ?? version.ojtSemesterId} · phiên bản cũ`}</td><td className="px-4 py-4">v{version.version}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2">{version.criteria.map(item => <span key={item.key} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">{item.label}: <strong>{item.weight}%</strong></span>)}</div></td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatEffectiveAt(version)}</td></tr>)}</tbody></table>{!versions.length && <p className="p-8 text-center text-sm text-slate-500">Chưa có phiên bản cấu hình.</p>}</div>
    </section>
  </div>;
}
