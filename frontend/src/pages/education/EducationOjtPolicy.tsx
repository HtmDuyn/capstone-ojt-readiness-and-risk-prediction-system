import React from 'react';
import { Pencil } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { loadCurrentOjtRule, previewOjtPolicy, publishOjtPolicy, type CurrentOjtRule, type OjtPolicyPreview } from '@/services/educationService';

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Không lưu được điều kiện xét OJT.';
const reviewMessage = 'Chưa thể lưu điều kiện vì có khung chương trình cần đối soát.';
type ProgramIssue = OjtPolicyPreview['programs'][number];
function reasonInVietnamese(reason: string): string {
  const detail = reason.replace(/^Khung chương trình cần đối soát:\s*/, '');
  if (detail.includes('Review and set prerequisites explicitly')) return 'Cần rà soát và xác nhận dữ liệu môn tiên quyết, kể cả khi không có môn tiên quyết.';
  if (detail.includes('Review and set course equivalences explicitly')) return 'Cần rà soát và xác nhận dữ liệu môn tương đương.';
  if (/prerequisiteText/i.test(detail)) return 'Mô tả tiên quyết của học phần chưa hợp lệ hoặc chưa đầy đủ.';
  if (detail.includes('Equivalent prerequisites cannot count')) return 'Các môn tiên quyết tương đương không được tính thành nhiều môn đạt riêng trong cùng nhóm.';
  if (detail.includes('Equivalent curriculum courses must have identical credit weights')) return 'Các môn tương đương trong khung phải có cùng số tín chỉ.';
  if (detail.includes('Specialization and effective year')) return 'Cần bổ sung chuyên ngành và năm bắt đầu áp dụng.';
  if (detail.includes('Confirm GPA scale')) return 'Cần xác nhận thang điểm và quy định tính kết quả học tập.';
  if (detail.includes('Curriculum must contain courses')) return 'Khung chương trình chưa có học phần.';
  if (detail.includes('Total credits must equal')) return 'Tổng tín chỉ của khung không khớp với các học phần và ô lựa chọn.';
  if (detail.includes('Prerequisites after applying equivalences')) return 'Quan hệ tiên quyết sau khi xét môn tương đương có vòng lặp.';
  if (/^[\x00-\x7F]+$/.test(detail)) return 'Cấu hình học phần cần được đối soát thêm.';
  return detail;
}

export default function EducationOjtPolicy() {
  const [policy, setPolicy] = React.useState<CurrentOjtRule | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [credits, setCredits] = React.useState('');
  const [pending, setPending] = React.useState<{ minCredits: number; token: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [blockedPrograms, setBlockedPrograms] = React.useState<ProgramIssue[]>([]);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    loadCurrentOjtRule(controller.signal)
      .then(current => { if (!controller.signal.aborted) setPolicy(current); })
      .catch(() => { if (!controller.signal.aborted) setError('Không tải được điều kiện xét OJT.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const close = () => { setEditing(false); setCredits(''); setFormError(''); };
  const open = () => { if (!policy) return; setCredits(String(policy.minCredits)); setFormError(''); setBlockedPrograms([]); setShowDetails(false); setEditing(true); };

  async function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !policy) return;
    const minCredits = Number(credits);
    if (!/^\d+$/.test(credits) || !Number.isSafeInteger(minCredits) || minCredits > 9999) {
      setFormError('Vui lòng nhập số tín chỉ nguyên hợp lệ.'); return;
    }
    if (policy.id && minCredits === policy.minCredits) { close(); return; }
    // The policy API requires this value; preserve the current value returned by Backend.
    const maxUnpassedCourses = policy.maxUnpassedCourses;
    if (!Number.isSafeInteger(maxUnpassedCourses) || maxUnpassedCourses < 0) {
      setFormError('Không có đủ dữ liệu điều kiện hiện tại để lưu.'); return;
    }
    setBusy(true); setFormError(''); setBlockedPrograms([]); setShowDetails(false);
    try {
      const preview = await previewOjtPolicy(minCredits, maxUnpassedCourses);
      if (!preview.allowed) {
        setBlockedPrograms(preview.programs.filter(item => item.status !== 'VALID' && item.status !== 'WARNING'));
        setFormError(reviewMessage);
        return;
      }
      setPending({ minCredits, token: preview.token });
    } catch (caught) { setFormError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  async function confirmPublish() {
    if (busy || !policy || !pending) return;
    setBusy(true); setFormError('');
    try {
      const published = await publishOjtPolicy(pending.minCredits, policy.maxUnpassedCourses, pending.token);
      setPolicy(published);
      setPending(null);
      close();
    } catch (caught) {
      const errorCode = (caught as { response?: { data?: { errorCode?: string } } }).response?.data?.errorCode;
      setPending(null);
      if (errorCode === 'OJT_POLICY_INVALID' || errorCode === 'OJT_POLICY_PREVIEW_STALE') {
        try {
          const latest = await previewOjtPolicy(pending.minCredits, policy.maxUnpassedCourses);
          setBlockedPrograms(latest.programs.filter(item => item.status !== 'VALID' && item.status !== 'WARNING'));
          setFormError(latest.allowed ? 'Dữ liệu đã thay đổi. Vui lòng kiểm tra lại điều kiện.' : reviewMessage);
        } catch { setFormError('Dữ liệu đã thay đổi. Vui lòng kiểm tra lại điều kiện.'); }
      } else setFormError(errorMessage(caught));
    }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <PageBanner title="Điều kiện xét OJT" badge="Phòng Đào tạo" />
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg font-semibold text-slate-900">Điều kiện đang áp dụng</h2>
          {!loading && policy && <span className={`rounded-full px-3 py-1 text-xs font-medium ${policy.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{policy.id ? 'Đã công bố' : 'Quy tắc mặc định'}</span>}
        </div>
        <button type="button" disabled={loading || !!error || !policy || busy} onClick={open} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"><Pencil size={16} aria-hidden="true" />Chỉnh sửa</button>
      </div>
      <div className="mt-4"><p className="text-sm text-slate-500">Tín chỉ tích lũy tối thiểu</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-900" aria-live="polite">{loading ? 'Đang tải…' : policy ? `${policy.minCredits.toLocaleString('vi-VN')} tín chỉ` : '—'}</p>
        {policy?.updatedAt && <p className="mt-2 text-xs text-slate-500">Cập nhật gần nhất: {new Date(policy.updatedAt).toLocaleString('vi-VN')}{policy.updatedByName ? ` · ${policy.updatedByName}` : ''}</p>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {editing && <form onSubmit={review} className="mt-4 border-t border-slate-200 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="grid w-full gap-1 text-sm font-medium text-slate-700 sm:w-[300px]"><span>Tín chỉ tích lũy tối thiểu <span className="text-red-600">*</span></span><input autoFocus type="number" min="0" max="9999" step={1} value={credits} disabled={busy} onKeyDown={event => { if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }} onChange={event => { if (/^\d*$/.test(event.target.value)) { setCredits(event.target.value); setFormError(''); } else setFormError('Vui lòng nhập số tín chỉ nguyên hợp lệ.'); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <div className="flex justify-end gap-2 sm:ml-auto"><button type="button" disabled={busy} onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Hủy</button><button type="submit" disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Đang kiểm tra…' : 'Lưu thay đổi'}</button></div></div>
        {formError && !pending && <div className="mt-3"><p role="alert" className="text-sm text-red-700">{formError}</p>
          {blockedPrograms.length > 0 && <><button type="button" aria-expanded={showDetails} onClick={() => setShowDetails(value => !value)} className="mt-2 text-sm font-medium text-orange-700 underline hover:text-orange-800">{showDetails ? 'Ẩn chi tiết lỗi' : `Xem chi tiết lỗi (${blockedPrograms.length} khung chương trình)`}</button>
            {showDetails && <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">{blockedPrograms.map(program => <div key={program.programId}><p className="font-semibold text-slate-900">{program.code || `Khung ${program.programId}`}{program.name ? ` · ${program.name}` : ''}</p><ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">{program.reasons.map((reason, index) => <li key={index}>{reasonInVietnamese(reason)}</li>)}</ul></div>)}</div>}
          </>}
        </div>}
      </form>}
      <div className="mt-4 border-t border-slate-200 pt-4"><button type="button" disabled title="Chưa hỗ trợ khôi phục điều kiện ban đầu" className="cursor-not-allowed rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">Khôi phục ban đầu</button><p className="mt-2 text-xs text-slate-500">Chưa có dữ liệu giá trị gốc và chức năng khôi phục.</p></div>
      <div className="mt-5 border-t border-slate-200 pt-5"><h2 className="font-semibold text-slate-900">Lịch sử thay đổi</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[660px] text-left text-sm"><thead className="bg-slate-100 text-slate-700"><tr>{['STT', 'Thời gian', 'Giá trị trước', 'Giá trị mới', 'Người thực hiện'].map(label => <th key={label} scope="col" className="px-4 py-2.5 font-medium">{label}</th>)}</tr></thead><tbody><tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa hỗ trợ xem lịch sử thay đổi.</td></tr></tbody></table></div>
      </div>
    </section>
    {pending && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-publish-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h2 id="confirm-publish-title" className="text-lg font-semibold text-slate-900">Xác nhận công bố thay đổi</h2>
        <p className="mt-3 text-sm text-slate-600">Đổi mức tín chỉ tối thiểu từ <strong>{policy?.minCredits.toLocaleString('vi-VN')}</strong> sang <strong>{pending.minCredits.toLocaleString('vi-VN')}</strong> tín chỉ?</p>
        {formError && <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setPending(null); setFormError(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Hủy</button><button type="button" disabled={busy} onClick={() => void confirmPublish()} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? 'Đang lưu…' : 'Xác nhận công bố'}</button></div>
      </div>
    </div>}
  </div>;
}
