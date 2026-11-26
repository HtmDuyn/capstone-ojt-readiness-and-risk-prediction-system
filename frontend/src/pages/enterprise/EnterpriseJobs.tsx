import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, FileText, LayoutGrid, Loader2, LockKeyhole, Plus, Search, UserCheck, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageBanner } from '@/components/common/PageBanner';
import { RecruitmentPostDialog } from '@/components/enterprise/RecruitmentPostDialog';
import { RecruitmentPostDetailsDialog } from '@/components/enterprise/RecruitmentPostDetailsDialog';
import { useRecruitmentFeedback } from '@/components/enterprise/RecruitmentNoticeDialog';
import { RecruitmentPostCard } from '@/components/enterprise/RecruitmentPostCard';
import { enterprisePeriodLabels, formatRecruitmentDate, loadRecruitmentData, postDeleteLockReason, postEditLockReason, postPublishLockReason, recruitmentError, recruitmentStatusLabels, recruitmentTotals, windowAcceptsPosts, windowAllowsPostCreation } from '@/utils/enterprise/recruitment';
import { enterpriseService, type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';

const PAGE_SIZE = 6;
const currentStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED'] as const;

export function EnterpriseJobs() {
  const [params, setParams] = useSearchParams();
  const status = currentStatuses.find(value => value === params.get('status')) ?? '';
  const selectStatus = (next: string) => {
    if (next === status) return;
    setParams(next ? { status: next } : {}, { preventScrollReset: true });
  };

  const { reload: reloadProfile } = useEnterprise();
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [windows, setWindows] = useState<RecruitmentWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const feedback = useRecruitmentFeedback();
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [selectedWindowId, setSelectedWindowId] = useState<number>(-1);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ post: RecruitmentPost | null } | null>(null);
  const [detailPost, setDetailPost] = useState<RecruitmentPost | null>(null);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    void loadRecruitmentData(controller.signal).then(({ posts: newPosts, windows: newWindows }) => {
      if (controller.signal.aborted) return;
      setPosts(newPosts); setWindows(newWindows);
      setSelectedWindowId(current => current === 0 || newWindows.some(w => w.id === current) ? current :
        newWindows.find(w => windowAcceptsPosts(w))?.id ?? newWindows.find(windowAllowsPostCreation)?.id ?? newWindows[0]?.id ?? 0);
    }).catch(err => { if (!controller.signal.aborted) setError(recruitmentError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const deadlines = posts.flatMap(post => post.status === 'PUBLISHED' && post.deadlineAt ? [Date.parse(post.deadlineAt)] : []);
    const next = windows.flatMap(w => [Date.parse(w.postingStartsAt ?? w.startsAt), Date.parse(w.postingDeadlineAt ?? w.endsAt), Date.parse(w.applicationEndsAt ?? w.endsAt), Date.parse(w.resultsEndsAt ?? w.endsAt)]).concat(deadlines).filter(time => time > now);
    const delay = next.length ? Math.min(30000, Math.min(...next) - now + 20) : 30000;
    const timer = setTimeout(() => { setNow(Date.now()); if (next.some(time => time <= Date.now())) setRevision(v => v + 1); }, delay);
    return () => clearTimeout(timer);
  }, [windows, posts, now]);
  const selectedWindow = windows.find(w => w.id === selectedWindowId);
  const accepts = windowAcceptsPosts(selectedWindow, now);
  const creationWindows = windows.filter(windowAllowsPostCreation);
  const canCreate = creationWindows.length > 0 && (!selectedWindow || windowAllowsPostCreation(selectedWindow));
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
    feedback.notify(post.status === 'PUBLISHED'
      ? `Đã công bố tin “${post.title}”. Sinh viên có thể xem ngay.`
      : `Đã lưu tin “${post.title}”. Trạng thái: ${recruitmentStatusLabels[post.status]}.`, post.status === 'PUBLISHED' ? 'Công bố thành công' : 'Đã lưu bản nháp', 'success');
    setPosts(current => [...current.filter(item => item.id !== post.id), post].sort((a, b) => b.id - a.id));
    setSelectedWindowId(post.windowId); setEditor(null); setPage(1); setSearch(''); selectStatus(''); reloadProfile();
  };

  const changePost = async (post: RecruitmentPost, action: 'publish' | 'delete') => {
    if (actionBusy !== null) return;
    const lockReason = action === 'publish' ? postPublishLockReason(post, windows) : postDeleteLockReason(post);
    if (lockReason) { feedback.notify(lockReason, 'Không thể thực hiện'); return; }
    const confirmation = action === 'publish' ? 'Sinh viên sẽ thấy tin sau khi công bố. Sau đó, bạn không thể xóa tin.'
      : `Tin nháp “${post.title}” và toàn bộ dữ liệu riêng liên quan sẽ bị xóa vĩnh viễn, không thể khôi phục. Vị trí còn được tin khác hoặc lịch sử OJT sử dụng sẽ được giữ lại.`;
    if (!await feedback.confirm({ message: confirmation, title: action === 'publish' ? 'Công bố tin tuyển dụng?' : 'Xóa hoàn toàn tin nháp?', confirmLabel: action === 'publish' ? 'Công bố tin' : 'Xóa hoàn toàn', tone: action === 'delete' ? 'danger' : 'warning' })) return;
    setActionBusy(post.id);
    try {
      if (action === 'delete') {
        const response = await enterpriseService.deleteRecruitmentPost(post.id);
        if (!response.success || !response.data.deleted) throw new Error('Chưa xóa được tin tuyển dụng.');
        setPosts(current => current.filter(item => item.id !== post.id));
        setDetailPost(current => current?.id === post.id ? null : current);
        refresh();
        feedback.notify(`Đã xóa hoàn toàn tin nháp “${post.title}” và dữ liệu riêng liên quan.`, 'Đã xóa hoàn toàn', 'success');
      } else {
        const response = await enterpriseService.publishRecruitmentPost(post.id);
        if (!response.success || !response.data) throw new Error('Chưa cập nhật được trạng thái tin.');
        setPosts(current => current.map(item => item.id === post.id ? response.data : item));
        feedback.notify(`Đã công bố tin “${post.title}”. Sinh viên có thể xem ngay.`, 'Công bố thành công', 'success');
      }
      reloadProfile();
    } catch (err) { feedback.notify(recruitmentError(err), 'Không thể thực hiện'); refresh(); }
    finally { setActionBusy(null); }
  };

  const listContent = loading ? <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
      <Loader2 size={20} className="animate-spin text-orange-600" />Đang tải tin tuyển dụng và thời hạn đăng tin...
    </div> : error ? <div role="alert" className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
      <AlertCircle size={22} className="mx-auto mb-2 text-rose-600" /><p className="text-sm text-rose-800">{error}</p>
      <button type="button" onClick={refresh} className="mt-3 text-sm font-semibold text-orange-700 hover:underline">Thử lại</button>
    </div> : <div>
      <section aria-label="Đợt và hạn đăng tin" className="border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 lg:max-w-md">
            <label htmlFor="recruitment-window-view" className="mb-1.5 block text-xs font-medium text-slate-500">Đợt đăng tin</label>
            {windows.length > 0 ? <select id="recruitment-window-view" value={selectedWindowId}
              onChange={e => { setSelectedWindowId(Number(e.target.value)); setPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
              <option value="0">Tất cả đợt đăng tin</option>
              {windows.map(w => <option key={w.id} value={w.id}>{w.name}{w.periodCode ? ` · ${w.periodCode}` : ''} · {enterprisePeriodLabels[w.periodStatus]}</option>)}
            </select> : <p className="text-sm text-slate-500">QHDN chưa thiết lập đợt đăng tin.</p>}
          </div>
          {selectedWindow && <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div><p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500"><Clock3 size={13} />Hạn doanh nghiệp đăng / công bố tin <strong className="text-sm font-semibold text-slate-800">{formatRecruitmentDate(selectedWindow.postingDeadlineAt ?? selectedWindow.endsAt)}</strong></p>
              <p className="mt-1 text-xs text-slate-400">Mở từ {formatRecruitmentDate(selectedWindow.startsAt)} · QHDN quản lý thời hạn</p>
            </div>
            <p className={`inline-flex items-center gap-2 text-xs font-medium ${accepts ? 'text-emerald-700' : 'text-slate-500'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{accepts ? 'Đang nhận tin' : 'Hiện không nhận tin'}
            </p>
          </div>}
        </div>
        <p className="mt-3 text-xs text-slate-500">Tạo tin trong học kỳ đang diễn ra. Công bố tin trong Hạn 1 để sinh viên ứng tuyển ở Hạn 2.</p>
        {!creationWindows.length && <p className="mt-3 text-xs text-amber-800">Chưa có đợt đăng tin khả dụng trong học kỳ đang diễn ra.</p>}
        {creationWindows.length > 0 && !canCreate && <p className="mt-3 text-xs text-amber-800">Chọn đợt đăng tin trong học kỳ đang diễn ra để tạo tin.</p>}
        {selectedWindow?.periodStatus === 'ACTIVE' && selectedWindow.editLockCode === 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION' && <p role="status" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800">
          <LockKeyhole size={14} className="shrink-0" />Sinh viên đang đăng ký hoặc xét tuyển: không thể công bố tin. Bạn vẫn có thể chỉnh sửa và lưu tin nháp.
        </p>}
      </section>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Tìm tin tuyển dụng" type="search" placeholder="Tìm tin hoặc vị trí..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Lọc trạng thái tin" value={status} onChange={e => { setPage(1); selectStatus(e.target.value); }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <option value="">Tất cả trạng thái</option>
            {currentStatuses.map(value => <option key={value} value={value}>{recruitmentStatusLabels[value]}</option>)}
          </select>
          <button type="button" disabled={!canCreate} onClick={() => setEditor({ post: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus size={17} />Tạo tin tuyển dụng
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
        {search || status ? <p className="mt-1 text-sm text-slate-400">Thử đổi từ khóa hoặc trạng thái.</p> :
          canCreate && <p className="mt-1 text-sm text-slate-400">Tạo tin đầu tiên để bắt đầu tuyển thực tập sinh.</p>}
      </div> : <section aria-label="Danh sách tin tuyển dụng" className="grid grid-cols-1 gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map(post => <RecruitmentPostCard key={post.id} post={post} windows={windows} now={now} busy={actionBusy !== null}
          onView={() => setDetailPost(post)} onEdit={() => setEditor({ post })} onAction={action => void changePost(post, action)} />)}
      </section>}
      {totalPages > 1 && <nav aria-label="Phân trang tin tuyển dụng" className="flex items-center justify-end gap-4 border-t border-slate-100 px-5 py-4 sm:px-7">
        <span className="text-xs text-slate-500">Trang {currentPage}/{totalPages}</span>
        <button type="button" aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={17} /></button>
      </nav>}
      </div>;

  return <div className="min-w-0 space-y-6">
    <PageBanner variant="enterprise" title={<><BriefcaseBusiness size={27} className="shrink-0 text-orange-400" />Tin tuyển dụng</>}
      breadcrumb={<span className="text-xs font-medium text-cyan-100">Doanh nghiệp / Tuyển dụng thực tập</span>}
      description="Quản lý tin và chỉ tiêu tuyển dụng thực tập của doanh nghiệp."
      badge="Tuyển dụng thực tập" />
    <dl aria-label="Tổng quan tuyển dụng" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        { label: 'Tin tuyển dụng', value: filtered.length, icon: FileText, tone: 'bg-blue-50 text-blue-600' },
        { label: 'Vị trí tuyển', value: totals.positions, icon: LayoutGrid, tone: 'bg-violet-50 text-violet-600' },
        { label: 'Tổng chỉ tiêu', value: totals.capacity, icon: Users, tone: 'bg-emerald-50 text-emerald-600' },
        { label: 'Chỗ còn lại', value: totals.remaining, icon: UserCheck, tone: 'bg-orange-50 text-orange-600' },
      ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <dt className="flex items-center justify-between gap-3 text-sm font-medium text-slate-500">
          <span>{label}</span><span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={20} aria-hidden="true" /></span>
        </dt>
        <dd className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${label === 'Chỗ còn lại' ? 'text-orange-600' : 'text-slate-900'}`}>{loading || error ? '—' : value}</dd>
      </div>)}
    </dl>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {listContent}
    </section>
    {feedback.dialog}
    {detailPost && <RecruitmentPostDetailsDialog post={detailPost} lockReason={postEditLockReason(detailPost, windows, now)} onClose={() => setDetailPost(null)}
      onEdit={() => { setDetailPost(null); setEditor({ post: detailPost }); }} />}
    {editor && <RecruitmentPostDialog windows={editor.post ? windows : creationWindows} initialWindowId={selectedWindow?.id} post={editor.post} now={now} onClose={() => setEditor(null)} onSaved={onSaved} />}
  </div>;
}

export default EnterpriseJobs;
