import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, Download, Eye, FileText, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { enterpriseService, type EnterpriseCandidateItem } from '@/services/enterpriseService';
import { WorkflowModal, workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { downloadFile } from '@/utils/shared/downloadFile';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

const dateText = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : 'Chưa cập nhật';
const certificateUrl = (value: string) => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};
async function cvError(error: unknown) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    // Backend có thể trả lỗi JSON dưới dạng Blob khi tải CV.
    try { const body = JSON.parse(await data.text()); if (body.message) return friendlyErrorMessage(body.message, 'Không thể tải CV lúc này. Vui lòng thử lại.'); } catch { /* Dùng thông báo mặc định nếu Blob không phải JSON. */ }
  }
  return friendlyErrorMessage(error, 'Không thể tải CV lúc này. Vui lòng thử lại.');
}

function Fields({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
    {items.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
    </div>)}
  </dl>;
}

function SubmittedCv({ candidate }: { candidate: EnterpriseCandidateItem }) {
  const cv = candidate.jobApplication?.cv;
  const [preview, setPreview] = useState(false), [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false), [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    setUrl(''); setError('');
    if (!preview || !cv) return;
    const controller = new AbortController();
    let objectUrl = '';
    setLoading(true);
    enterpriseService.getCandidateCv(candidate.id, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
      })
      .catch(async error => {
        const message = await cvError(error);
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [preview, candidate.id, cv?.id, revision]);
  const download = async () => {
    if (!cv || downloading) return;
    setDownloading(true); setError('');
    try { await downloadFile(() => enterpriseService.getCandidateCv(candidate.id), cv.fileName || 'cv.pdf'); }
    catch (error) { setError(await cvError(error)); }
    finally { setDownloading(false); }
  };
  return <section aria-label="CV đã gửi khi ứng tuyển" className="space-y-3 rounded-xl border-l-4 border-orange-500 bg-orange-50/60 px-4 py-3.5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3"><FileText size={21} className="shrink-0 text-orange-600" />
        <div className="min-w-0"><h3 className="text-sm font-bold text-slate-900">CV đã gửi</h3>
          <p className="mt-0.5 break-all text-xs text-slate-600">{cv ? cv.fileName : 'Hồ sơ này chưa có CV đính kèm.'}</p>
          {cv && <p className="mt-0.5 text-[11px] text-slate-500">PDF · {(cv.size / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} KB</p>}
        </div>
      </div>
      {cv && <div className="flex flex-wrap gap-2">
        <button type="button" className={workflowSecondary} aria-haspopup="dialog" aria-expanded={preview} onClick={() => setPreview(true)}><Eye size={16} />Xem CV</button>
        <button type="button" className={workflowSecondary} disabled={downloading} onClick={download}>{downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}Tải CV</button>
      </div>}
    </div>
    {error && <div role="alert" className="space-y-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><p>{error}</p>{preview && <button type="button" onClick={() => setRevision(value => value + 1)} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={14} />Thử tải lại CV</button>}</div>}
    {preview && <WorkflowModal fullscreen title={'CV của ' + candidate.student.fullName} subtitle={cv?.fileName} onClose={() => setPreview(false)}
      headerActions={<button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50" disabled={downloading} onClick={download}>{downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}Tải CV</button>}>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {loading && <p role="status" className="flex items-center gap-2 py-4 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" />Đang tải CV…</p>}
        {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-2 inline-flex items-center gap-2 font-semibold"><RefreshCw size={14} />Thử tải lại CV</button></div>}
        {url && <iframe title={'CV ứng tuyển của ' + candidate.student.fullName} src={`${url}#view=Fit&navpanes=0`} className="min-h-0 w-full flex-1 rounded-lg border border-slate-200 bg-white" />}
        <p className="shrink-0 text-xs text-slate-500">Có thể phóng to và cuộn để đọc toàn bộ CV. Nếu trình duyệt không hiển thị PDF, chọn “Tải CV” để mở file.</p>
      </div>
    </WorkflowModal>}
  </section>;
}

export function CandidateDetailModal({ candidate, busy, decisionLabel, onClose, onDecision }: {
  candidate: EnterpriseCandidateItem;
  busy: boolean;
  decisionLabel: string;
  onClose: () => void;
  onDecision: (decision: 'ACCEPTED' | 'REJECTED') => void;
}) {
  const application = candidate.application;
  const submitted = candidate.jobApplication;
  const canRespond = candidate.decision === 'PENDING' && candidate.isLatestCoordination && candidate.canRespond !== false;
  const skills = submitted?.skills ?? [];
  const profileSkills = candidate.skills ?? [];
  return <WorkflowModal wide scrollable title={candidate.student.fullName} subtitle={`MSSV: ${candidate.student.studentCode}`} titleClassName="text-xl font-extrabold text-slate-950" busy={busy} onClose={onClose}>
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1" data-candidate-content>
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0"><p className="text-[11px] font-medium text-slate-500">Vị trí ứng tuyển</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{text(candidate.position.title)}</p></div>
          <div><p className="text-[11px] font-medium text-slate-500">Trạng thái</p><p className={`mt-1 text-sm font-bold ${candidate.decision === 'ACCEPTED' ? 'text-emerald-700' : candidate.decision === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'}`}>{decisionLabel}</p></div>
          <div><p className="text-[11px] font-medium text-slate-500">Ngày nộp đơn</p><p className="mt-1 text-sm font-semibold text-slate-800">{dateText(submitted?.appliedAt)}</p></div>
          <div><p className="text-[11px] font-medium text-slate-500">Ngày nhận hồ sơ</p><p className="mt-1 text-sm font-semibold text-slate-800">{dateText(candidate.introducedAt)}</p></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
          <div className="min-w-0 space-y-4">
            <section className="border-b border-slate-100 pb-4">
              <h3 className="mb-3 text-sm font-bold text-slate-900">Thư ứng tuyển</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{submitted?.coverLetter || 'Sinh viên chưa điền thư ứng tuyển.'}</p>
            </section>
            <section className="border-b border-slate-100 pb-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">Chứng chỉ đính kèm</h3><span className="text-xs text-slate-400">{submitted?.certificates?.length || 0} mục</span></div>
              {submitted?.certificates?.length ? <div className="flex flex-wrap gap-2">{submitted.certificates.map((certificate, index) => {
                const href = certificateUrl(certificate.url);
                return href
                  ? <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="max-w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-50 [overflow-wrap:anywhere]">{certificate.name}</a>
                  : <span key={index} className="max-w-full rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 [overflow-wrap:anywhere]">{certificate.name} · Liên kết không hợp lệ</span>;
              })}</div> : <p className="text-sm text-slate-500">Không có chứng chỉ đính kèm.</p>}
            </section>
            <section className="text-sm">
              <h3 className="font-bold text-slate-900">Thông tin vị trí ứng tuyển</h3>
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4 text-slate-600 [overflow-wrap:anywhere]">
                <p>Tên vị trí: <span className="font-medium text-slate-800">{text(candidate.position.title)}</span></p>
                <div><h4 className="font-medium text-slate-800">Mô tả</h4><p className="mt-1 whitespace-pre-wrap leading-relaxed">{text(candidate.position.description)}</p></div>
                <div><h4 className="font-medium text-slate-800">Yêu cầu</h4><p className="mt-1 whitespace-pre-wrap leading-relaxed">{text(candidate.position.requirements)}</p></div>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-4 lg:border-l lg:border-slate-100 lg:pl-4">
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Thông tin sinh viên</h3>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-0.5 break-all font-medium text-slate-800">{text(candidate.student.email)}</dd></div>
                <div><dt className="text-xs text-slate-500">Số điện thoại</dt><dd className="mt-0.5 font-medium text-slate-800">{text(candidate.student.phone)}</dd></div>
              </dl>
            </section>
            <section className="border-t border-slate-100 pt-4"><h3 className="mb-3 text-sm font-bold text-slate-900">Liên hệ trong đơn</h3><dl className="space-y-3 text-sm"><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-0.5 break-all font-medium text-slate-800">{text(application?.contactEmail)}</dd></div><div><dt className="text-xs text-slate-500">Số điện thoại</dt><dd className="mt-0.5 font-medium text-slate-800">{text(application?.contactPhone)}</dd></div></dl></section>
            <section className="border-t border-slate-100 pt-4"><h3 className="mb-3 text-sm font-bold text-slate-900">Kỹ năng nổi bật</h3>
              {!!skills.length && <div className="flex flex-wrap gap-2">{skills.map((skill, index) => <span key={index} className="max-w-full rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800 [overflow-wrap:anywhere]">{skill.name}</span>)}</div>}
              {!!profileSkills.length && <div className={`flex flex-wrap gap-2 ${skills.length ? 'mt-2' : ''}`}>{profileSkills.map((skill, index) => <span key={index} className="max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 [overflow-wrap:anywhere]">{skill.name}{skill.level != null ? ` · Mức ${skill.level}/5` : ''}</span>)}</div>}
              {!skills.length && !profileSkills.length && <p className="text-sm text-slate-500">Chưa có dữ liệu kỹ năng.</p>}
            </section>
          </aside>
        </div>

        {candidate.rejectReason && <p className="whitespace-pre-wrap break-words rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Lý do từ chối: {candidate.rejectReason}</p>}
        {candidate.decision === 'PENDING' && candidate.canRespond === false && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Hiện ngoài hạn xét tuyển. Quyết định chỉ được cập nhật trong thời hạn phản hồi.</p>}
        <SubmittedCv candidate={candidate} />
      </div>
      <footer className="mt-4 flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        {canRespond ? <>
          <button type="button" disabled={busy} onClick={() => onDecision('REJECTED')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><XCircle size={16} />Từ chối</button>
          <button type="button" disabled={busy} onClick={() => onDecision('ACCEPTED')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Tiếp nhận thực tập OJT</button>
        </> : <button type="button" className={workflowSecondary} disabled={busy} onClick={onClose}>Đóng</button>}
      </footer>
    </div>
  </WorkflowModal>;
}
