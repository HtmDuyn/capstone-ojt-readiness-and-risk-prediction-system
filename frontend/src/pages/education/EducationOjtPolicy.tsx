import React from 'react';
import { Plus, FileCheck2 } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { createOjtCondition, loadOjtConditions, type CurrentOjtRule } from '@/services/educationService';

export default function EducationOjtPolicy() {
  const [conditions, setConditions] = React.useState<CurrentOjtRule[]>([]);
  const [credits, setCredits] = React.useState('');
  const [document, setDocument] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const refresh = React.useCallback(async () => { setLoading(true); try { setConditions(await loadOjtConditions()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được danh sách điều kiện.'); } finally { setLoading(false); } }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const minCredits = Number(credits);
    if (!/^\d+(\.\d{1,2})?$/.test(credits) || !Number.isFinite(minCredits) || minCredits < 0 || minCredits > 9999.99) { setError('Tín chỉ phải là số không âm, tối đa hai chữ số thập phân.'); return; }
    if (!document.trim()) { setError('Vui lòng nhập văn bản ban hành.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { const created = await createOjtCondition(minCredits, document.trim()); setConditions(previous => [created, ...previous]); setCredits(''); setDocument(''); setNotice(`Đã thêm điều kiện phiên bản ${created.version}. Nhật ký thao tác đã được lưu.`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thêm được điều kiện xét OJT.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <PageBanner title="Điều kiện xét OJT" description="Tạo điều kiện theo ngưỡng tín chỉ và lưu văn bản ban hành kèm theo." badge="Phòng Đào tạo" />
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Thêm điều kiện</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Tín chỉ<input type="number" min="0" max="9999.99" step="0.01" required value={credits} onChange={event => setCredits(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Ví dụ: 70" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 md:row-span-2">Văn bản ban hành<textarea required maxLength={10000} rows={5} value={document} onChange={event => setDocument(event.target.value)} className="resize-y rounded-lg border border-slate-300 px-3 py-2" placeholder="Nhập số hiệu, nội dung hoặc trích yếu văn bản ban hành" /></label>
        <div className="flex items-end"><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"><Plus size={17}/>{busy ? 'Đang lưu…' : 'Thêm điều kiện'}</button></div>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b p-4"><FileCheck2 size={19} className="text-orange-600"/><h2 className="font-semibold text-slate-900">Lịch sử điều kiện đã thêm</h2><span className="ml-auto text-xs text-slate-500">Ghi log tự động khi tạo</span></div>
      {loading ? <p className="p-6 text-sm text-slate-500">Đang tải lịch sử…</p> : !conditions.length ? <p className="p-8 text-center text-sm text-slate-500">Chưa có điều kiện nào. Thêm điều kiện đầu tiên ở biểu mẫu phía trên.</p> : <div className="divide-y">{conditions.map(item => <article key={item.id} className="grid gap-2 p-4 md:grid-cols-[160px_1fr_220px]"><div><p className="font-semibold text-slate-900">Phiên bản {item.version}</p><p className="mt-1 text-sm text-orange-700">{item.minCredits} tín chỉ</p></div><p className="whitespace-pre-wrap break-words text-sm text-slate-700">{item.issuingDocument}</p><p className="text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}{item.createdByName ? ` · ${item.createdByName}` : ''}</p></article>)}</div>}
    </section>
  </div>;
}
