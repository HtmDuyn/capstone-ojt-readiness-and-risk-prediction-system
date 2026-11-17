import React from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import API from '@/services/api';

type Policy = { id: number | null; version: number; minCredits: number; maxUnpassedCourses: number; updatedAt: string | null; effectiveAt: string | null; updatedBy: number | null; updatedByName: string | null };
type Program = { programId: number; code: string; name: string; ojtSemester: number | null; minCredits: number | null; maxCredits: number | null; proposedCredits: number; difference: number | null; status: 'VALID' | 'WARNING' | 'INVALID' | 'INSUFFICIENT_DATA'; reasons: string[] };
type Preview = { values: { minCredits: number; maxUnpassedCourses: number }; currentVersion: number; allowed: boolean; token: string; programs: Program[] };
const label = { VALID: 'Hợp lệ', WARNING: 'Cần cảnh báo', INVALID: 'Không hợp lệ', INSUFFICIENT_DATA: 'Chưa đủ dữ liệu để kiểm tra' };
const dateText = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa cập nhật';
const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error instanceof Error ? error.message : 'Có lỗi khi kết nối.');

export default function EducationOjtPolicy() {
  const [policy, setPolicy] = React.useState<Policy | null>(null);
  const [credits, setCredits] = React.useState('');
  const [failed, setFailed] = React.useState('');
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  React.useEffect(() => {
    const controller = new AbortController();
    API.get<{ data: Policy }>('/ojt-condition-policy', { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      setPolicy(data.data); setCredits(String(data.data.minCredits)); setFailed(String(data.data.maxUnpassedCourses));
    }).catch(reason => { if (!controller.signal.aborted) setError(errorText(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const values = () => ({ minCredits: Number(credits), maxUnpassedCourses: Number(failed) });
  const validInput = credits.trim() !== '' && failed.trim() !== '' && Number.isFinite(Number(credits)) && Number(credits) >= 0 &&
    Number.isInteger(Number(failed)) && Number(failed) >= 0;
  async function check() {
    if (!validInput || busy) return;
    setBusy(true); setError(''); setNotice(''); setPreview(null);
    try {
      const { data } = await API.post<{ data: Preview }>('/ojt-condition-policy/preview', values());
      setPreview(data.data);
    } catch (reason) { setError(errorText(reason)); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!preview?.allowed || !policy || busy || !window.confirm('Xác nhận áp dụng điều kiện mới cho tất cả khung chương trình đang công bố?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await API.post<{ data: Policy }>('/ojt-condition-policy', { ...preview.values, token: preview.token });
      setPolicy(data.data); setPreview(null); setNotice(`Đã áp dụng quy định phiên bản ${data.data.version}. Kết quả xét đã lưu trước đó không bị thay đổi.`);
    } catch (reason) { setError(errorText(reason)); setPreview(null); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    <PageBanner title="Quản lý điều kiện xét OJT" description="Kiểm tra ngưỡng theo lộ trình trước kỳ OJT của từng khung chương trình trước khi áp dụng." badge="Phòng Đào tạo" />
    <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Điều kiện đang áp dụng</h2>
      {loading ? <p className="mt-3 text-sm text-slate-500">Đang tải điều kiện...</p> : policy && <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-sm text-slate-500">Tín chỉ tích lũy tối thiểu</p><p className="mt-1 text-2xl font-semibold text-slate-900">{policy.minCredits}</p></div>
        <div><p className="text-sm text-slate-500">Số môn chưa đạt tối đa</p><p className="mt-1 text-2xl font-semibold text-slate-900">{policy.maxUnpassedCourses}</p></div>
        <div><p className="text-sm text-slate-500">Trạng thái</p><p className="mt-1 font-semibold text-emerald-700">Đang áp dụng {policy.version ? `· v${policy.version}` : '· quy định ban đầu'}</p>{policy.effectiveAt && <p className="text-xs text-slate-500">Có hiệu lực: {dateText(policy.effectiveAt)}</p>}</div>
        <div><p className="text-sm text-slate-500">Cập nhật gần nhất</p><p className="mt-1 font-medium text-slate-900">{dateText(policy.updatedAt)}</p>{policy.updatedBy && <p className="text-xs text-slate-500">Người cập nhật: {policy.updatedByName ?? `#${policy.updatedBy}`}</p>}</div>
      </div>}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold text-slate-900">Chỉnh sửa điều kiện</h2>
        <p className="mt-1 text-sm text-slate-600">Chỉ lưu được khi mọi khung chương trình đang công bố có đủ dữ liệu và đáp ứng điều kiện.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Tín chỉ tích lũy tối thiểu<input type="number" min="0" step="0.01" value={credits} onChange={event => { setCredits(event.target.value); setPreview(null); }} className="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" /></label>
          <label className="block text-sm font-medium text-slate-700">Số môn chưa đạt tối đa<input type="number" min="0" step="1" value={failed} onChange={event => { setFailed(event.target.value); setPreview(null); }} className="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void check()} disabled={!validInput || busy || loading} className="rounded-lg border border-orange-600 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50">{busy ? 'Đang kiểm tra...' : 'Kiểm tra điều kiện'}</button><button type="button" onClick={() => void save()} disabled={!preview?.allowed || busy} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">Lưu thay đổi</button></div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>}
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-semibold text-slate-900">Đối chiếu khung chương trình</h2>
        {!preview ? <p className="mt-2 text-sm text-slate-500">Nhập điều kiện và chọn “Kiểm tra điều kiện” để xem kết quả.</p> : <>
          <p className={`mt-2 text-sm font-medium ${preview.allowed ? 'text-emerald-700' : 'text-red-700'}`}>{preview.allowed ? 'Các khung chương trình đáp ứng điều kiện; hãy xem các cảnh báo nếu có.' : 'Chưa thể lưu: có khung chương trình không hợp lệ hoặc chưa đủ dữ liệu.'}</p>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-300 bg-[#EFF6FF] text-[#334155]"><tr>{['Mã chương trình', 'Tên chương trình', 'Kỳ OJT', 'Tín chỉ trước OJT', 'Ngưỡng đề xuất', 'Chênh lệch', 'Kết quả'].map(title => <th key={title} className="px-3 py-3 font-semibold">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{preview.programs.map(row => <tr key={row.programId} className="bg-white align-top hover:bg-[#EAF2FF]"><td className="px-3 py-3 font-medium">{row.code}</td><td className="px-3 py-3">{row.name}</td><td className="px-3 py-3">{row.ojtSemester ?? '—'}</td><td className="px-3 py-3">{row.minCredits === null ? 'Chưa xác định' : row.minCredits === row.maxCredits ? row.minCredits : `${row.minCredits}–${row.maxCredits}`}</td><td className="px-3 py-3">{row.proposedCredits}</td><td className="px-3 py-3">{row.difference ?? '—'}</td><td className="px-3 py-3"><span className={row.status === 'VALID' ? 'text-emerald-700' : row.status === 'WARNING' ? 'text-amber-700' : 'text-red-700'}>{label[row.status]}</span>{row.reasons.map(reason => <p key={reason} className="mt-1 text-xs text-slate-600">{reason}</p>)}</td></tr>)}</tbody></table></div>
        </>}
      </div>
    </section>
  </div>;
}
