import React from 'react';
import { Plus, FileCheck2, CalendarDays, FileText, ShieldCheck } from 'lucide-react';
import { displayTaskTime, vietnamTaskMinute } from '@/utils/shared/taskTime';
import { PageBanner } from '@/components/common/PageBanner';
import { createOjtCondition, latestEffectiveOjtRule, loadOjtConditions, type CurrentOjtRule } from '@/services/educationService';

export default function EducationOjtPolicy() {
  const [conditions, setConditions] = React.useState<CurrentOjtRule[]>([]);
  const [credits, setCredits] = React.useState('');
  const [document, setDocument] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(() => vietnamTaskMinute(new Date(Date.now() + 86_400_000)).slice(0, 10));
  const earliestDate = vietnamTaskMinute(new Date(Date.now() + 86_400_000)).slice(0, 10);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const refresh = React.useCallback(async () => { setLoading(true); try { const loaded = await loadOjtConditions(); setConditions(loaded); const current = latestEffectiveOjtRule(loaded); if (current) { setCredits(String(current.minCredits)); setDocument(current.issuingDocument); } setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được danh sách điều kiện.'); } finally { setLoading(false); } }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const minCredits = Number(credits);
    if (!/^\d+(\.\d{1,2})?$/.test(credits) || !Number.isFinite(minCredits) || minCredits < 0 || minCredits > 9999.99) { setError('Tín chỉ phải là số không âm, tối đa hai chữ số thập phân.'); return; }
    if (!document.trim()) { setError('Vui lòng nhập văn bản ban hành.'); return; }
    if (!effectiveFrom || effectiveFrom <= vietnamTaskMinute().slice(0, 10)) {
      setError('Ngày bắt đầu áp dụng phải sau ngày hiện tại theo giờ Việt Nam.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try { const created = await createOjtCondition(minCredits, document.trim(), effectiveFrom); setConditions(previous => [created, ...previous]); setCredits(String(created.minCredits)); setDocument(created.issuingDocument); setEffectiveFrom(vietnamTaskMinute(new Date(Date.now() + 86_400_000)).slice(0, 10)); setNotice(`Đã thêm điều kiện phiên bản ${created.version}. Nhật ký thao tác đã được lưu.`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thêm được điều kiện xét OJT.'); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto w-full max-w-7xl space-y-5">
    <PageBanner variant="education" title="Điều kiện xét OJT" description="Thiết lập ngưỡng tín chỉ, văn bản ban hành và ngày bắt đầu áp dụng." badge="Phòng Đào tạo" />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ShieldCheck size={20}/></span>
        <div><h2 className="text-base font-bold text-slate-900">Thêm điều kiện mới</h2><p className="mt-1 text-sm text-slate-500">Phiên bản mới sẽ được áp dụng từ ngày bạn chọn.</p></div>
      </div>
      <form onSubmit={submit} className="grid gap-x-6 gap-y-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="grid content-start gap-5">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Ngưỡng tín chỉ
            <div className="relative"><input type="number" min="0" max="9999.99" step="0.01" required value={credits} onChange={event => setCredits(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 text-sm font-normal outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Ngưỡng tín chỉ theo quy chế hiện hành"/><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-normal text-slate-400">tín chỉ</span></div>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-slate-400"/>Ngày bắt đầu áp dụng</span>
            <input type="date" required min={earliestDate} value={effectiveFrom} onChange={event => setEffectiveFrom(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            <span className="text-xs font-normal text-slate-500">Chọn từ ngày mai theo giờ Việt Nam.</span>
          </label>
        </div>
        <label className="grid content-start gap-1.5 text-sm font-semibold text-slate-700"><span className="inline-flex items-center gap-2"><FileText size={15} className="text-slate-400"/>Văn bản ban hành</span>
          <textarea required maxLength={10000} rows={6} value={document} onChange={event => setDocument(event.target.value)} className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal leading-6 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder="Văn bản hiện hành về điều kiện thực tập OJT" />
          <span className="text-xs font-normal text-slate-500">Có thể nhập số hiệu và trích yếu để tiện tra cứu.</span>
        </label>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
          <p className="text-xs leading-5 text-slate-500">Thông tin điều kiện sẽ được ghi vào lịch sử khi lưu thành công.</p>
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17}/>{busy ? 'Đang lưu…' : 'Thêm điều kiện'}</button>
        </div>
      </form>
      {(error || notice) && <div className="px-5 pb-5 sm:px-6">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}</div>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><FileCheck2 size={19}/></span><div><h2 className="font-bold text-slate-900">Lịch sử điều kiện</h2><p className="mt-0.5 text-xs text-slate-500">Các phiên bản đã được thiết lập</p></div><span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tabular-nums text-slate-600">{loading ? '…' : `${conditions.length} phiên bản`}</span></div>
      {loading ? <p role="status" className="p-6 text-sm text-slate-500">Đang tải lịch sử…</p> : !conditions.length ? <p className="p-8 text-center text-sm text-slate-500">Chưa có điều kiện nào. Thêm điều kiện đầu tiên ở biểu mẫu phía trên.</p> : <div className="divide-y divide-slate-100">{conditions.map(item => <article key={item.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[180px_minmax(0,1fr)_210px] lg:items-start"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:block"><p className="font-semibold text-slate-900">Phiên bản {item.version}</p><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">{item.minCredits} tín chỉ</span><p className="w-full text-xs text-slate-500 lg:mt-2">Áp dụng từ {displayTaskTime(item.effectiveFrom)}{!item.isEffective && ' · Chưa đến ngày áp dụng'}</p></div><p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.issuingDocument}</p><p className="text-xs leading-5 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}{item.createdByName ? <span className="block">Người tạo: {item.createdByName}</span> : null}</p></article>)}</div>}
    </section>
  </div>;
}
