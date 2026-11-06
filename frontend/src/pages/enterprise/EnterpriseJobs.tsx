import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Loader2, LockKeyhole, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { RecruitmentPostDialog } from '@/components/enterprise/RecruitmentPostDialog';
import { RecruitmentPostDetailsDialog } from '@/components/enterprise/RecruitmentPostDetailsDialog';
import { canEditRecruitmentPost, formatRecruitmentDate, loadRecruitmentData, postEditLockReason, recruitmentError, recruitmentStatusLabels, recruitmentTotals, windowAcceptsPosts } from '@/components/enterprise/recruitment';
import { type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';

const PAGE_SIZE = 6;
const statusStyle: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-600', PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-700', REJECTED: 'bg-rose-50 text-rose-700',
  CLOSED: 'bg-slate-100 text-slate-600', ARCHIVED: 'bg-slate-100 text-slate-600',
};

export function EnterpriseJobs() {
  const { reload: reloadProfile } = useEnterprise();
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [windows, setWindows] = useState<RecruitmentWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [selectedWindowId, setSelectedWindowId] = useState<number>(-1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ post: RecruitmentPost | null } | null>(null);
  const [detailPost, setDetailPost] = useState<RecruitmentPost | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    void loadRecruitmentData(controller.signal).then(({ posts: newPosts, windows: newWindows }) => {
      if (controller.signal.aborted) return;
      setPosts(newPosts); setWindows(newWindows);
      setSelectedWindowId(current => current === 0 || newWindows.some(w => w.id === current) ? current : newWindows.find(w => windowAcceptsPosts(w))?.id ?? newWindows[0]?.id ?? 0);
    }).catch(err => { if (!controller.signal.aborted) setError(recruitmentError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const next = windows.flatMap(w => [Date.parse(w.startsAt), Date.parse(w.endsAt)]).filter(time => time > now);
    const delay = next.length ? Math.min(30000, Math.min(...next) - now + 20) : 30000;
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [windows, now]);
  const selectedWindow = windows.find(w => w.id === selectedWindowId);
  const accepts = windowAcceptsPosts(selectedWindow, now);
  const activeWindows = windows.filter(w => windowAcceptsPosts(w, now));
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return posts.filter(post => (selectedWindowId <= 0 || post.windowId === selectedWindowId) && (!status || post.status === status) && (!query || [post.title, post.content, post.periodCode,
      ...(post.positions ?? []).flatMap(p => [p.title, p.description, p.requirements, p.location])]
      .some(value => value?.toLocaleLowerCase('vi').includes(query))));
  }, [posts, search, status, selectedWindowId]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totals = recruitmentTotals(filtered);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const onSaved = (post: RecruitmentPost) => {
    setSuccess(post.status === 'PUBLISHED'
      ? `Đã ${editor?.post ? 'cập nhật' : 'đăng'} tin “${post.title}”. Sinh viên có thể xem ngay.`
      : `Đã lưu tin “${post.title}”. Trạng thái: ${recruitmentStatusLabels[post.status]}.`);
    setPosts(current => [...current.filter(item => item.id !== post.id), post].sort((a, b) => b.id - a.id));
    setSelectedWindowId(post.windowId); setEditor(null); setPage(1); setSearch(''); setStatus(''); reloadProfile();
  };

  return <div className="min-w-0 space-y-6">
    <PageBanner title={<><BriefcaseBusiness size={27} className="shrink-0 text-orange-400" />Tin tuyển dụng</>}
      breadcrumb={<span className="text-xs font-medium text-purple-200">Doanh nghiệp / Tuyển dụng thực tập</span>}
      description="Kết nối với sinh viên, tìm kiếm nhân sự phù hợp. Quản lý các vị trí và tin tuyển dụng của doanh nghiệp tại đây."
      badge={<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200"><CheckCircle2 size={13} />Công bố trực tiếp</span>}
      extra={<button type="button" disabled={loading || !!error || !activeWindows.length}
        onClick={() => { setSuccess(''); setEditor({ post: null }); }}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
        <Plus size={17} />Tạo tin tuyển dụng
      </button>} />

    {success && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" /><p>{success}</p>
    </div>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {loading ? <div role="status" className="flex items-center justify-center gap-3 border-t border-slate-100 py-16 text-sm text-slate-500">
      <Loader2 size={20} className="animate-spin text-orange-600" />Đang tải tin tuyển dụng và thời hạn đăng tin...
    </div> : error ? <div role="alert" className="border-t border-slate-100 px-5 py-12 text-center">
      <AlertCircle size={22} className="mx-auto mb-2 text-rose-600" /><p className="text-sm text-rose-800">{error}</p>
      <button type="button" onClick={refresh} className="mt-3 text-sm font-semibold text-orange-700 hover:underline">Thử lại</button>
    </div> : <>
      <section aria-label="Đợt và hạn đăng tin" className="border-y border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:max-w-md">
            <label htmlFor="recruitment-window-view" className="mb-1.5 block text-xs font-medium text-slate-500">Đợt đăng tin</label>
            {windows.length > 0 ? <select id="recruitment-window-view" value={selectedWindowId}
              onChange={e => { setSelectedWindowId(Number(e.target.value)); setPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
              <option value="0">Tất cả đợt đăng tin</option>
              {windows.map(w => <option key={w.id} value={w.id}>{w.name}{w.periodCode ? ` · ${w.periodCode}` : ''}</option>)}
            </select> : <p className="text-sm text-slate-500">QHDN chưa thiết lập đợt đăng tin.</p>}
          </div>
          {selectedWindow && <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div><p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13} />Hạn doanh nghiệp đăng / sửa tin</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatRecruitmentDate(selectedWindow.endsAt)}</p>
              <p className="mt-0.5 text-xs text-slate-400">Mở từ {formatRecruitmentDate(selectedWindow.startsAt)}</p>
              <p className="mt-0.5 text-xs text-slate-400">Thời hạn do QHDN thiết lập</p>
            </div>
            <p className={`inline-flex items-center gap-2 text-xs font-medium ${accepts ? 'text-emerald-700' : 'text-slate-500'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{accepts ? 'Đang nhận tin' : 'Hiện không nhận tin'}
            </p>
          </div>}
        </div>
        {!activeWindows.length && <p className="mt-3 text-xs text-amber-800">Chưa có đợt nào đang nhận tin. Bạn vẫn có thể xem các tin đã đăng.</p>}
        {selectedWindow?.editLockCode === 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION' && <p role="status" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800">
          <LockKeyhole size={14} className="shrink-0" />Sinh viên đang đăng ký OJT: tạm khóa chỉnh sửa tin{selectedWindow.studentRegistrationWindow?.endsAt ? ` đến ${formatRecruitmentDate(selectedWindow.studentRegistrationWindow.endsAt)}` : ''}. Bạn vẫn có thể tạo tin mới trong hạn đăng tuyển.
        </p>}
      </section>

      <dl aria-label="Tổng quan tuyển dụng" className="grid grid-cols-2 gap-4 border-b border-slate-100 px-5 py-5 sm:grid-cols-4 sm:px-7">
        {[['Tin tuyển dụng', filtered.length], ['Vị trí tuyển', totals.positions], ['Tổng chỉ tiêu', totals.capacity], ['Chỗ còn lại', totals.remaining]].map(([label, value]) => <div key={label}>
          <dt className="text-xs text-slate-500">{label}</dt><dd className={`mt-1 text-2xl font-semibold tabular-nums ${label === 'Chỗ còn lại' ? 'text-orange-600' : 'text-slate-900'}`}>{value}</dd>
        </div>)}
      </dl>

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Tìm tin tuyển dụng" type="search" placeholder="Tìm tin hoặc vị trí..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        </div>
        <div className="flex gap-2">
          <select aria-label="Lọc trạng thái tin" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(recruitmentStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40">
            <RefreshCw size={15} /><span>Tải lại</span>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 px-5 pb-3 text-xs text-slate-400 sm:px-7">
        <p><strong className="font-medium text-slate-600">{filtered.length} tin</strong> · {filtered.filter(p => p.status === 'PUBLISHED').length} đang hiển thị</p>
        <p>Tin mới nhất hiển thị trước</p>
      </div>

      {!visible.length ? <div className="border-t border-slate-100 px-6 py-14 text-center">
        <BriefcaseBusiness size={30} className="mx-auto mb-3 text-slate-300" />
        <h2 className="font-medium text-slate-700">{search || status ? 'Không có tin phù hợp' : 'Chưa có tin tuyển dụng'}</h2>
        <p className="mt-1 text-sm text-slate-400">{search || status ? 'Thử đổi từ khóa hoặc trạng thái.' : 'Tạo tin đầu tiên để bắt đầu tuyển thực tập sinh.'}</p>
      </div> : <section aria-label="Danh sách tin tuyển dụng" className="grid grid-cols-1 gap-4 bg-slate-50/70 p-5 sm:px-7 md:grid-cols-2 xl:grid-cols-3">
        {visible.map(post => {
          const editable = canEditRecruitmentPost(post, windows, now);
          const positions = post.positions ?? [];
          const { remaining, capacity } = recruitmentTotals([post]);
          const lockReason = postEditLockReason(post, windows, now);
          return <article key={post.id} data-post-id={post.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
            <div className="flex-1 space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><BriefcaseBusiness size={20} /></span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[post.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{recruitmentStatusLabels[post.status]}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-400">{post.periodCode || 'Tuyển thực tập sinh'}</p>
                <h2 title={post.title} className="min-h-12 break-words text-base font-semibold leading-6 text-slate-900 line-clamp-2">{post.title}</h2>
                <p className="mt-2 min-h-10 break-words text-sm leading-5 text-slate-500 line-clamp-2">{post.content}</p>
              </div>
              <div className="flex min-h-6 flex-wrap gap-1.5" aria-label="Các vị trí tuyển dụng">
                {positions.slice(0, 2).map(position => <span key={position.id} title={position.title} className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{position.title}</span>)}
                {positions.length > 2 && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">+{positions.length - 2} vị trí</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
                <div><p className="text-xs text-slate-500">Tổng chỉ tiêu</p><p className="mt-1 text-lg font-semibold tabular-nums text-slate-800">{capacity}<span className="ml-1 text-xs font-normal text-slate-400">sinh viên</span></p></div>
                <div className="border-l border-slate-200 pl-4"><p className="text-xs text-slate-500">Chỗ còn lại</p><p className={`mt-1 text-lg font-semibold tabular-nums ${remaining > 0 ? 'text-orange-600' : 'text-slate-500'}`}>{remaining}<span className="ml-1 text-xs font-normal text-slate-400">/{capacity}</span></p></div>
              </div>
              <p className="flex items-start gap-2 text-xs text-slate-500"><Clock3 size={14} className="mt-0.5 shrink-0 text-slate-400" /><span>Hạn ứng tuyển<br /><strong className="mt-0.5 inline-block font-medium text-slate-700">{formatRecruitmentDate(post.deadlineAt)}</strong></span></p>
              {!editable && <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-800"><LockKeyhole size={13} className="mt-0.5 shrink-0" />{lockReason}</p>}
            </div>
            <footer className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 px-5 py-4">
              <button type="button" data-view-post onClick={() => setDetailPost(post)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 py-2.5 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"><Eye size={15} />Xem chi tiết</button>
              <button type="button" data-edit-post disabled={!editable} title={lockReason || 'Chỉnh sửa tin tuyển dụng'} onClick={() => { setSuccess(''); setEditor({ post }); }} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-2 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={15} />Chỉnh sửa</button>
            </footer>
          </article>;
        })}
      </section>}
      {totalPages > 1 && <nav aria-label="Phân trang tin tuyển dụng" className="flex items-center justify-end gap-4 border-t border-slate-100 px-5 py-4 sm:px-7">
        <span className="text-xs text-slate-500">Trang {currentPage}/{totalPages}</span>
        <button type="button" aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={17} /></button>
      </nav>}
    </>}
    </div>
    {detailPost && <RecruitmentPostDetailsDialog post={detailPost} lockReason={postEditLockReason(detailPost, windows, now)} onClose={() => setDetailPost(null)}
      onEdit={() => { setDetailPost(null); setSuccess(''); setEditor({ post: detailPost }); }} />}
    {editor && <RecruitmentPostDialog windows={windows} initialWindowId={accepts ? selectedWindowId : activeWindows[0]?.id} post={editor.post} now={now} onClose={() => setEditor(null)} onSaved={onSaved} />}
  </div>;
}

export default EnterpriseJobs;
