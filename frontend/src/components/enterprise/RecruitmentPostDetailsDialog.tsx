import { useEffect, useRef } from 'react';
import { BriefcaseBusiness, CalendarDays, LockKeyhole, MapPin, Pencil, Users, X } from 'lucide-react';
import type { RecruitmentPost } from '@/services/enterpriseService';
import { formatRecruitmentDate, recruitmentStatusLabels, recruitmentTotals } from './recruitment';

const workModes: Record<string, string> = { ONSITE: 'Tại văn phòng', REMOTE: 'Từ xa', HYBRID: 'Kết hợp' };

interface Props {
  post: RecruitmentPost;
  lockReason: string;
  onClose: () => void;
  onEdit: () => void;
}

export function RecruitmentPostDetailsDialog({ post, lockReason, onClose, onEdit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const totals = recruitmentTotals([post]);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby="recruitment-details-title"
    className="m-auto max-h-none w-[calc(100%-1rem)] max-w-3xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-slate-900/50 sm:w-[calc(100%-3rem)]"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="flex max-h-[92dvh] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600"><BriefcaseBusiness size={15} />Chi tiết tin tuyển dụng</p>
          <h2 id="recruitment-details-title" className="break-words text-xl font-bold text-slate-900">{post.title}</h2>
          <p className="mt-2 text-xs text-slate-500">{recruitmentStatusLabels[post.status]}{post.periodCode ? ` · ${post.periodCode}` : ''}</p>
        </div>
        <button type="button" aria-label="Đóng chi tiết" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
      </header>
      <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p className="flex items-start gap-2 text-slate-600"><Users size={16} className="mt-0.5 shrink-0 text-orange-500" /><span>Còn <strong>{totals.remaining}/{totals.capacity}</strong> chỗ · {totals.positions} vị trí</span></p>
          <p className="flex items-start gap-2 text-slate-600"><CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-500" /><span>Hạn ứng tuyển<br /><strong className="font-medium">{formatRecruitmentDate(post.deadlineAt)}</strong></span></p>
        </div>
        <section><h3 className="mb-2 font-semibold text-slate-900">Nội dung tuyển dụng</h3><p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{post.content}</p></section>
        {post.benefits && <section><h3 className="mb-2 font-semibold text-slate-900">Quyền lợi</h3><p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{post.benefits}</p></section>}
        {post.applicationInstructions && <section><h3 className="mb-2 font-semibold text-slate-900">Hướng dẫn ứng tuyển</h3><p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{post.applicationInstructions}</p></section>}
        <section>
          <h3 className="font-semibold text-slate-900">Vị trí tuyển dụng</h3>
          <div className="mt-3 divide-y divide-slate-100">{(post.positions ?? []).map(position => <div key={position.id} className="space-y-3 py-4 first:pt-0">
            <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-semibold text-slate-800">{position.title}</h4><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">Còn {position.remainingSlots}/{position.capacity} chỗ</span></div>
            {(position.location || position.workMode) && <p className="flex items-start gap-1.5 text-xs text-slate-500"><MapPin size={14} className="shrink-0" />{[position.location, position.workMode ? workModes[position.workMode] ?? position.workMode : null].filter(Boolean).join(' · ')}</p>}
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-600"><strong className="font-medium text-slate-800">Mô tả công việc: </strong>{position.description}</p>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-600"><strong className="font-medium text-slate-800">Yêu cầu ứng viên: </strong>{position.requirements}</p>
          </div>)}</div>
        </section>
        {post.reviewReason && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Ghi chú trước đây: {post.reviewReason}</p>}
      </div>
      <footer className="shrink-0 space-y-3 border-t border-slate-100 px-5 py-4 sm:px-7">
        {lockReason && <p className="flex items-start gap-2 text-xs text-amber-800"><LockKeyhole size={14} className="shrink-0" />{lockReason}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Đóng</button>
          <button type="button" disabled={!!lockReason} title={lockReason || 'Chỉnh sửa tin tuyển dụng'} onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={16} />Chỉnh sửa tin</button>
        </div>
      </footer>
    </div>
  </dialog>;
}
