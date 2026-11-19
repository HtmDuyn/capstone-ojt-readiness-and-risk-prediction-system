import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { createOjtCreditThreshold, loadCurrentOjtRule, loadOjtCreditThresholds, previewOjtPolicy, publishOjtPolicy, type CurrentOjtRule, type OjtCreditThreshold } from '@/services/educationService';

const errorMessage = (error: unknown) => (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Không lưu được điều kiện xét OJT.';

export default function EducationOjtPolicy() {
  const [thresholds, setThresholds] = React.useState<OjtCreditThreshold[]>([]);
  const [policy, setPolicy] = React.useState<CurrentOjtRule | null>(null);
  const [mode, setMode] = React.useState<'create-policy' | 'edit-policy' | 'create-threshold' | null>(null);
  const [credits, setCredits] = React.useState('');
  const [courses, setCourses] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const refresh = React.useCallback(async (signal?: AbortSignal) => {
    const [rows, current] = await Promise.all([loadOjtCreditThresholds(signal), loadCurrentOjtRule(signal)]);
    if (!signal?.aborted) { setThresholds(rows); setPolicy(current); setError(''); }
  }, []);
  React.useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch(() => { if (!controller.signal.aborted) setError('Không tải được điều kiện xét OJT.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const close = () => { setMode(null); setCredits(''); setCourses(''); setFormError(''); };
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !mode) return;
    const minCredits = Number(credits);
    if (!credits.trim() || !Number.isFinite(minCredits) || minCredits < 0 || minCredits > 9999.99 || Math.abs(minCredits * 100 - Math.round(minCredits * 100)) > 1e-8) {
      setFormError('Tín chỉ phải từ 0 đến 9999,99 và có tối đa hai chữ số thập phân.'); return;
    }
    if (mode === 'create-threshold' && thresholds.some(item => item.minCredits === minCredits)) { setFormError('Mức tín chỉ này đã tồn tại.'); return; }
    const maxUnpassedCourses = Number(courses);
    if (mode !== 'create-threshold' && (!courses.trim() || !Number.isSafeInteger(maxUnpassedCourses) || maxUnpassedCourses < 0)) { setFormError('Số môn chưa đạt phải là số nguyên không âm.'); return; }
    setSaving(true); setFormError('');
    try {
      if (mode === 'create-threshold') await createOjtCreditThreshold(minCredits);
      else {
        const preview = await previewOjtPolicy(minCredits, maxUnpassedCourses);
        if (!preview.allowed) { setFormError(preview.programs.flatMap(item => item.reasons).slice(0, 3).join(' ') || 'Có khung chương trình chưa đáp ứng điều kiện.'); return; }
        await publishOjtPolicy(minCredits, maxUnpassedCourses, preview.token);
      }
      await refresh(); close();
    } catch (caught) { setFormError(errorMessage(caught)); }
    finally { setSaving(false); }
  }

  return <div className="space-y-4">
    <PageBanner title="Điều kiện xét OJT" badge="Phòng Đào tạo" />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Điều kiện xét OJT hiện tại</h2>{policy?.updatedAt && <p className="mt-1 text-xs text-slate-500">Cập nhật gần nhất: {new Date(policy.updatedAt).toLocaleString('vi-VN')}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-medium ${policy?.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{policy?.id ? 'Đã công bố' : 'Quy tắc mặc định'}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{[
          ['Tín chỉ tích lũy tối thiểu', policy ? `${policy.minCredits.toLocaleString('vi-VN')} tín chỉ` : '—'],
          ['Số môn chưa đạt tối đa', policy ? `${policy.maxUnpassedCourses} môn` : '—'],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{loading ? 'Đang tải…' : value}</p></div>)}</div>
      </div>
      <div className="border-t border-slate-200 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">Danh sách điều kiện xét OJT</h2><button type="button" disabled={loading || !!error || saving} onClick={() => { setMode('create-threshold'); setCredits(''); setCourses(''); setFormError(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Thêm mức tín chỉ tùy chọn</button><button type="button" disabled={loading || !!error || saving} onClick={() => { setMode('create-policy'); setCredits(policy ? String(policy.minCredits) : ''); setCourses(policy ? String(policy.maxUnpassedCourses) : ''); setFormError(''); }} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">{policy?.id ? 'Công bố phiên bản mới' : 'Tạo điều kiện mới'}</button></div>
        {mode && <form onSubmit={save} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-3 font-medium text-slate-900">{mode === 'create-threshold' ? 'Tạo mức tín chỉ tùy chọn' : mode === 'create-policy' ? (policy?.id ? 'Công bố phiên bản điều kiện chung mới' : 'Tạo điều kiện chung') : 'Chỉnh sửa điều kiện chung'}</h3><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Tín chỉ tích lũy tối thiểu <span className="text-red-600">*</span><input autoFocus required type="number" min="0" max="9999.99" step="0.01" value={credits} disabled={saving} onChange={event => { setCredits(event.target.value); setFormError(''); }} className="rounded-lg border border-slate-300 bg-white p-2" /></label>{mode !== 'create-threshold' && <label className="grid gap-1 text-sm font-medium">Số môn chưa đạt tối đa <span className="text-red-600">*</span><input required type="number" min="0" step="1" value={courses} disabled={saving} onChange={event => { setCourses(event.target.value); setFormError(''); }} className="rounded-lg border border-slate-300 bg-white p-2" /></label>}</div>{formError && <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" disabled={saving} onClick={close} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">Hủy</button><button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu điều kiện'}</button></div></form>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['STT', 'Tên điều kiện', 'Giá trị', 'Phạm vi áp dụng', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
          {policy && <tr className="hover:bg-orange-50/50"><td className="px-4 py-3">1</td><td className="px-4 py-3 font-medium">Điều kiện chung</td><td className="px-4 py-3">{policy.minCredits.toLocaleString('vi-VN')} tín chỉ · tối đa {policy.maxUnpassedCourses} môn chưa đạt</td><td className="px-4 py-3">Các khung chương trình</td><td className="px-4 py-3"><span className={policy.id ? "rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"}>{policy.id ? "Đã công bố" : "Quy tắc mặc định"}</span></td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><button type="button" title="Chỉnh sửa" aria-label="Chỉnh sửa điều kiện chung" onClick={() => { setMode('edit-policy'); setCredits(String(policy.minCredits)); setCourses(String(policy.maxUnpassedCourses)); setFormError(''); }} className="rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"><Pencil size={18} aria-hidden="true" /></button><span title="Xóa điều kiện" className="cursor-not-allowed rounded-lg p-2 text-slate-300" aria-label="Chưa hỗ trợ xóa điều kiện"><Trash2 size={18} aria-hidden="true" /></span></div></td></tr>}
          {thresholds.map((item, index) => <tr key={item.id} className="hover:bg-orange-50/50"><td className="px-4 py-3">{index + (policy ? 2 : 1)}</td><td className="px-4 py-3 font-medium">Mức tín chỉ tùy chọn</td><td className="px-4 py-3">{item.minCredits.toLocaleString('vi-VN')} tín chỉ</td><td className="px-4 py-3">Khi xét sinh viên</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Có thể chọn</span></td><td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><span title="Chỉnh sửa" className="cursor-not-allowed rounded-lg p-2 text-slate-300" aria-label="Chưa hỗ trợ chỉnh sửa mức tín chỉ"><Pencil size={18} aria-hidden="true" /></span><span title="Xóa điều kiện" className="cursor-not-allowed rounded-lg p-2 text-slate-300" aria-label="Chưa hỗ trợ xóa điều kiện"><Trash2 size={18} aria-hidden="true" /></span></div></td></tr>)}
          {!loading && !error && !policy && thresholds.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có điều kiện xét OJT.</td></tr>}{loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải điều kiện…</td></tr>}
        </tbody></table></div>
        <p className="mt-2 text-xs text-slate-500">Chưa hỗ trợ chỉnh sửa từng mức tín chỉ hoặc xóa điều kiện.</p>
      </div>
    </section>
  </div>;
}
