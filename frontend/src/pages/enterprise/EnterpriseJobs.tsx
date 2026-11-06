import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, LockKeyhole, Pencil, Plus, RefreshCw, Search } from 'lucide-react';
import { RecruitmentPostDialog } from '@/components/enterprise/RecruitmentPostDialog';
import { canEditRecruitmentPost, formatRecruitmentDate, loadRecruitmentData, postEditLockReason, recruitmentError, recruitmentStatusLabels, recruitmentTotals, windowAcceptsPosts } from '@/components/enterprise/recruitment';
import { type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';

const PAGE_SIZE = 6;
const statusStyle: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'text-slate-500', PENDING_REVIEW: 'text-amber-700',
  PUBLISHED: 'text-emerald-700', REJECTED: 'text-rose-700',
  CLOSED: 'text-slate-500', ARCHIVED: 'text-slate-500',
};
const workModes: Record<string, string> = { ONSITE: 'Tại văn phòng', REMOTE: 'Từ xa', HYBRID: 'Kết hợp' };

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

  return <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tin tuyển dụng</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý vị trí thực tập. Tin được hiển thị với sinh viên ngay sau khi đăng.</p>
      </div>
      <button type="button" disabled={loading || !!error || !activeWindows.length}
        onClick={() => { setSuccess(''); setEditor({ post: null }); }}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40">
        <Plus size={17} />Tạo tin tuyển dụng
      </button>
    </header>

    {success && <div role="status" className="mx-5 mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 sm:mx-7">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" /><p>{success}</p>
    </div>}

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
      </div> : <section aria-label="Danh sách tin tuyển dụng">
        <div className="hidden grid-cols-[minmax(0,1fr)_140px_80px_150px_120px] gap-4 border-y border-slate-100 bg-slate-50/50 px-7 py-2.5 text-xs text-slate-500 lg:grid">
          <span>Tin tuyển dụng</span><span>Trạng thái</span><span>Còn chỗ</span><span>Hạn ứng tuyển</span><span className="sr-only">Thao tác</span>
        </div>
        {visible.map(post => {
          const editable = canEditRecruitmentPost(post, windows, now);
          const positions = post.positions ?? [];
          const { remaining, capacity } = recruitmentTotals([post]);
          const lockReason = postEditLockReason(post, windows, now);
          return <article key={post.id} data-post-id={post.id} className="border-b border-slate-100 last:border-b-0">
            <div className="grid items-center gap-3 px-5 pb-1 pt-5 sm:px-7 lg:grid-cols-[minmax(0,1fr)_140px_80px_150px_120px] lg:gap-4 lg:pt-4">
              <div className="min-w-0">
                <h2 className="break-words text-sm font-semibold text-slate-900">{post.title}</h2>
                <p className="mt-1 truncate text-xs text-slate-400" title={positions.map(p => p.title).join(' · ')}>
                  {positions.length} vị trí · {positions.map(p => p.title).join(', ') || post.periodCode}
                </p>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium ${statusStyle[post.status]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{recruitmentStatusLabels[post.status]}
              </span>
              <span className="text-xs tabular-nums text-slate-600"><span className="mr-1 text-slate-400 lg:hidden">Còn chỗ:</span>{remaining}/{capacity}</span>
              <span className="text-xs text-slate-500"><span className="mr-1 text-slate-400 lg:hidden">Hạn ứng tuyển:</span>{formatRecruitmentDate(post.deadlineAt)}</span>
              <button type="button" disabled={!editable} onClick={() => { setSuccess(''); setEditor({ post }); }}
                title={editable ? 'Chỉnh sửa tin tuyển dụng' : lockReason}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 lg:justify-self-end">
                <Pencil size={13} />Chỉnh sửa tin
              </button>
            </div>
            {!editable && <p className="flex items-start gap-1.5 px-5 pt-2 text-xs text-slate-500 sm:px-7"><LockKeyhole size={12} className="mt-0.5 shrink-0" />{lockReason}</p>}
            {post.status === 'REJECTED' && post.reviewReason && <p className="px-5 pt-1 text-xs text-rose-700 sm:px-7">QHDN: {post.reviewReason}</p>}
            <details className="px-5 pb-4 sm:px-7">
              <summary className="mt-1 w-fit cursor-pointer text-xs text-slate-400 hover:text-orange-700">Xem chi tiết</summary>
              <div className="mt-4 space-y-5 border-l-2 border-slate-100 pl-4 text-sm text-slate-600">
                <div className="space-y-3 whitespace-pre-line break-words leading-relaxed">
                  <p>{post.content}</p>
                  {post.benefits && <p><strong className="font-medium text-slate-800">Quyền lợi: </strong>{post.benefits}</p>}
                  {post.applicationInstructions && <p><strong className="font-medium text-slate-800">Ứng tuyển: </strong>{post.applicationInstructions}</p>}
                  {post.reviewReason && post.status !== 'REJECTED' && <p className="text-xs"><strong>Phản hồi QHDN: </strong>{post.reviewReason}</p>}
                </div>
                <div className="divide-y divide-slate-100">{positions.map(p => <div key={p.id} className="space-y-1.5 py-3 first:pt-0">
                  <p className="font-medium text-slate-800">{p.title}<span className="ml-3 text-xs font-normal text-slate-400">Còn {p.remainingSlots}/{p.capacity} chỗ</span></p>
                  {(p.location || p.workMode) && <p className="text-xs text-slate-400">{[p.location, p.workMode ? workModes[p.workMode] ?? p.workMode : null].filter(Boolean).join(' · ')}</p>}
                  <p className="whitespace-pre-line break-words text-xs leading-relaxed"><strong className="font-medium">Mô tả: </strong>{p.description}</p>
                  <p className="whitespace-pre-line break-words text-xs leading-relaxed"><strong className="font-medium">Yêu cầu: </strong>{p.requirements}</p>
                </div>)}</div>
              </div>
            </details>
          </article>;
        })}
      </section>}
      {totalPages > 1 && <nav aria-label="Phân trang tin tuyển dụng" className="flex items-center justify-end gap-4 border-t border-slate-100 px-5 py-4 sm:px-7">
        <span className="text-xs text-slate-500">Trang {currentPage}/{totalPages}</span>
        <button type="button" aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={17} /></button>
      </nav>}
    </>}
    {editor && <RecruitmentPostDialog windows={windows} initialWindowId={accepts ? selectedWindowId : activeWindows[0]?.id} post={editor.post} now={now} onClose={() => setEditor(null)} onSaved={onSaved} />}
  </div>;
}

export default EnterpriseJobs;
