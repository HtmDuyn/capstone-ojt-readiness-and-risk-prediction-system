import { BriefcaseBusiness, Clock3, Eye, Pencil, Send, Trash2 } from 'lucide-react';
import type { RecruitmentPost, RecruitmentWindow } from '@/services/enterpriseService';
import { canDeleteRecruitmentPost, canEditRecruitmentPost, postDeleteLockReason, postEditLockReason, recruitmentStatusLabels, recruitmentTotals } from '@/utils/enterprise/recruitment';

interface Props {
  post: RecruitmentPost;
  windows: RecruitmentWindow[];
  now: number;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onAction: (action: 'publish' | 'delete') => void;
}

const badgeColors: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'bg-amber-100 text-amber-700', PUBLISHED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-500', ARCHIVED: 'bg-rose-100 text-rose-700',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700', REJECTED: 'bg-rose-50 text-rose-700',
};
const cardColors: Partial<Record<RecruitmentPost['status'], string>> = {
  DRAFT: 'border-amber-200 bg-amber-50 hover:border-amber-300',
  PUBLISHED: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
  ARCHIVED: 'border-rose-200 bg-rose-50 hover:border-rose-300',
};
const deadlineFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const iconButton = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35';

export function RecruitmentPostCard({ post, windows, now, busy, onView, onEdit, onAction }: Props) {
  const { capacity, remaining } = recruitmentTotals([post]);
  const positions = post.positions ?? [];
  const editable = canEditRecruitmentPost(post, windows, now);
  const deadline = post.deadlineAt && Number.isFinite(Date.parse(post.deadlineAt)) ? deadlineFormat.format(new Date(post.deadlineAt)) : 'Chưa có thời hạn';

  return <article data-post-id={post.id} className={`flex min-w-0 flex-col rounded-2xl border transition hover:shadow-sm ${cardColors[post.status] ?? 'border-slate-200 bg-white hover:border-slate-300'}`}>
    <div className="flex-1 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><BriefcaseBusiness size={16} /></span>
          <span className="truncate text-[11px] font-semibold tracking-wide text-slate-400">{post.periodCode || 'THỰC TẬP OJT'}</span>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${badgeColors[post.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{recruitmentStatusLabels[post.status]}</span>
      </div>
      <h2 title={post.title} className="min-h-10 break-words text-sm font-semibold leading-5 text-slate-900 line-clamp-2">{post.title}</h2>
      <p title={positions.map(position => position.title).join(', ')} className="mt-1 truncate text-xs text-slate-500">{positions[0]?.title || 'Chưa có vị trí'}{positions.length > 1 ? ` · +${positions.length - 1} vị trí` : ''}</p>
      {post.content?.trim() && <p title={post.content} className="mt-2 break-words text-xs leading-5 text-slate-500 line-clamp-2">{post.content}</p>}
      <div className="mt-3 grid grid-cols-2 divide-x divide-slate-200/70 rounded-lg bg-white/70 py-2 text-xs">
        <p className="px-3 text-slate-500">Chỉ tiêu <strong className="ml-1.5 font-semibold tabular-nums text-slate-800">{capacity}</strong></p>
        <p className="px-3 text-slate-500">Còn trống <strong className="ml-1.5 font-semibold tabular-nums text-orange-600">{remaining}</strong></p>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 size={12} className="shrink-0" /><span className="truncate">Hạn ứng tuyển: {deadline}</span></p>
      {post.deletedAt && <p className="mt-1 text-[11px] text-rose-600">Đã xóa: {deadlineFormat.format(new Date(post.deletedAt))}</p>}
    </div>
    <footer className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-black/5 px-3 py-2">
      <button type="button" data-view-post onClick={onView} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-orange-700"><Eye size={14} />Chi tiết</button>
      <div className="flex items-center gap-1">
        {!post.deleted && post.status === 'DRAFT' && <>
          <button type="button" data-edit-post aria-label="Chỉnh sửa tin nháp" title={postEditLockReason(post, windows, now) || 'Chỉnh sửa tin nháp'} disabled={busy || !editable} onClick={onEdit} className={`${iconButton} text-slate-500 hover:bg-orange-50 hover:text-orange-700`}><Pencil size={14} /></button>
          <button type="button" data-publish-post disabled={busy} onClick={() => onAction('publish')} className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-40"><Send size={12} />Công bố</button>
        </>}
        {!post.deleted && ['DRAFT', 'PUBLISHED'].includes(post.status) && <button type="button" data-delete-post aria-label={post.status === 'DRAFT' ? 'Xóa nháp' : 'Xóa tin tuyển dụng'} title={postDeleteLockReason(post, windows, now) || 'Xóa mềm tin tuyển dụng'} disabled={busy || !canDeleteRecruitmentPost(post, windows, now)} onClick={() => onAction('delete')} className={`${iconButton} text-rose-500 hover:bg-rose-100`}><Trash2 size={14} /></button>}
      </div>
    </footer>
  </article>;
}
