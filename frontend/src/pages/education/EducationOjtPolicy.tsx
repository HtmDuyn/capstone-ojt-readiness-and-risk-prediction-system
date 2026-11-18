import React from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { createOjtCreditThreshold, loadOjtCreditThresholds, type OjtCreditThreshold } from '@/services/educationService';

export default function EducationOjtPolicy() {
  const [thresholds, setThresholds] = React.useState<OjtCreditThreshold[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [credits, setCredits] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    const controller = new AbortController();
    loadOjtCreditThresholds(controller.signal)
      .then(rows => { if (!controller.signal.aborted) setThresholds(rows); })
      .catch(() => { if (!controller.signal.aborted) setError('Không tải được danh sách điều kiện xét OJT.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !credits.trim()) return;
    const minCredits = Number(credits);
    if (thresholds.some(item => item.minCredits === minCredits)) {
      setFormError('Mức tín chỉ này đã tồn tại.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const item = await createOjtCreditThreshold(minCredits);
      setThresholds(previous => [...previous, item].sort((a, b) => a.minCredits - b.minCredits));
      setCreating(false);
      setCredits('');
    } catch (error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      setFormError(response?.data?.message ?? 'Không tạo được điều kiện xét OJT.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Điều kiện xét OJT" badge="Phòng Đào tạo" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={creating || loading} onClick={() => { setFormError(''); setCreating(true); }}
          className="rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white disabled:opacity-50">
          Tạo điều kiện mới
        </button>
        <Link to="/education/ojt-conditions" className="text-sm font-medium text-orange-700 underline">Đi tới trang xét điều kiện</Link>
      </div>
      {creating && (
        <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4">
          <label className="grid max-w-xs gap-1 text-sm font-medium">
            Số tín chỉ tối thiểu
            <input autoFocus required type="number" min="0" max="9999.99" step="0.01" value={credits} disabled={saving}
              onChange={event => { setCredits(event.target.value); setFormError(''); }} className="rounded-lg border p-2" />
          </label>
          {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white">{saving ? 'Đang lưu…' : 'Lưu điều kiện'}</button>
            <button type="button" disabled={saving} onClick={() => { setCreating(false); setCredits(''); }} className="rounded-lg border px-3 py-2 text-sm">Hủy</button>
          </div>
        </form>
      )}
      <section aria-label="Danh sách điều kiện xét OJT" className="overflow-hidden rounded-xl border bg-white">
        {loading ? <p role="status" className="p-4 text-sm">Đang tải điều kiện…</p>
          : error ? <p role="alert" className="p-4 text-sm text-red-700">{error}</p>
          : thresholds.length === 0 ? <p className="p-4 text-sm text-slate-500">Chưa có điều kiện xét OJT.</p>
          : <table className="w-full text-left text-sm">
            <thead className="bg-slate-50"><tr><th scope="col" className="px-4 py-3">Số tín chỉ tối thiểu</th></tr></thead>
            <tbody className="divide-y">{thresholds.map(item => (
              <tr key={item.id}><td className="px-4 py-3 tabular-nums">{item.minCredits.toLocaleString('vi-VN')} tín chỉ</td></tr>
            ))}</tbody>
          </table>}
      </section>
    </div>
  );
}
