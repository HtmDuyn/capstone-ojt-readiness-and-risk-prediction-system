import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ChevronRight, FileText, MapPin, Search, Send, BriefcaseBusiness, Inbox, AlertCircle, RefreshCw, Mail, Phone, UserRound, Clock3, Gift } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { ApiError, allStudentPages, studentGet, studentQuery, type StudentCertificate } from '@/services/studentService';
import { buttonClass, dateText, Empty, inputClass, Pagination, ResourceState, statusText, StudentPage } from '@/components/student/PortalUI';
import { StudentCvCard } from '@/components/student/StudentCvCard';
import { StudentJobMatches } from '@/components/student/StudentJobMatches';
import { StudentDialog } from '@/components/student/StudentDialog';
import { OjtApplicationDialog } from '@/components/student/OjtApplicationDialog';
import { explainOjtBlockers, workModeText, type Opportunity, type PartnerCompany } from '@/components/student/ojt';
import type { CV, Page } from '@/types/student/portal';
import { subscribeVisibleRefresh } from '@/utils/shared/visibleRefresh';

type RegistrationWindow = {
  id: number; name: string; startsAt: string; endsAt: string; status: string;
  ojtSemesterId: number; recruitmentRoundId?: number | null;
  semester?: { id: number; name: string; code?: string };
  period?: { id: number; name: string };
  isApplicationOpen: boolean;
  applicationStatus: 'OPEN' | 'UPCOMING' | 'CLOSED';
  canSubmit: boolean; blockingReasons: string[]; blockingMessages: string[];
};
type Application = {
  id: number; status: string; appliedAt: string; company: { name: string };
  position: { title: string }; cv?: CV | null;
  certificates?: StudentCertificate[];
  coordination?: { decision: string; rejectReason?: string | null } | null;
};
type OpportunityResults = Page<Opportunity> & { blockers: string[] };

function indexCompanies(items: Opportunity[]) {
  const byId = new Map<number, {company: PartnerCompany; positions: Opportunity[]; remaining: number}>();
  for (const item of items) {
    const group = byId.get(item.company.id);
    if (group) {
      group.company = item.company;
      group.positions.push(item);
      group.remaining += item.remainingSlots;
    } else {
      byId.set(item.company.id, {company: item.company, positions: [item], remaining: item.remainingSlots});
    }
  }
  const groups = Array.from(byId.values(), group => ({
    ...group,
    searchText: [group.company.name, group.company.industry, group.company.address,
      ...group.positions.map(position => position.title)].join(' ').toLocaleLowerCase(),
  }));
  return {byId, groups, companies: groups.map(group => group.company)};
}

function RegistrationContent() {
  const { profile, semesterId, semesters, revision, refreshing: profileRefreshing } = useStudentPortal();
  const [windowChoice, setWindowChoice] = useState('auto');
  const [search, setSearch] = useState('');
  const [companyPage, setCompanyPage] = useState(1);
  const [applicationPage, setApplicationPage] = useState(1);
  const [detailCompany, setDetailCompany] = useState<PartnerCompany | null>(null);
  const [applying, setApplying] = useState(false);
  const [initialPosition, setInitialPosition] = useState<Opportunity>();
  const [savedCv, setSavedCv] = useState<CV | null>(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'apply' | 'records'>('apply');
  const [recordsRequested, setRecordsRequested] = useState(false);
  const [submissionRefresh, setSubmissionRefresh] = useState(false);
  const submissionRefreshStarted = useRef(false);
  const scope = `${profile?.id}:${semesterId}:${profile?.recruitmentAssignment?.roundId ?? 'none'}:${revision}`;
  const windows = useStudentResource(profile ? 'ojt-windows:' + scope : null,
    (signal) => allStudentPages<RegistrationWindow>('/ojt-registration-windows?status=OPEN', signal), { snapshot: true });
  const applications = useStudentResource(recordsRequested && profile ? 'ojt-applications:' + scope + ':' + applicationPage : null,
    (signal) => studentGet<Page<Application>>('/job-applications' + studentQuery({ page: applicationPage, limit: 20 }), signal), { snapshot: true });
  const assignedWindow = windows.data?.find(item => item.id === profile?.recruitmentAssignment?.registrationWindowId);
  const automaticWindow = assignedWindow ?? windows.data?.find(item => item.canSubmit)
    ?? windows.data?.find(item => item.isApplicationOpen)
    ?? windows.data?.find(item => item.applicationStatus === 'UPCOMING');
  const chosenWindow = windowChoice === 'auto' ? automaticWindow : windows.data?.find(item => String(item.id) === windowChoice);
  const windowAccessKey = (windows.data ?? []).map(item => `${item.id}:${item.applicationStatus}:${item.canSubmit}:${item.blockingReasons?.join(',')}`).join(';');
  const opportunities = useStudentResource<OpportunityResults>(profile && !windows.loading && !windows.error ? 'ojt-opportunities:' + scope + ':' + (chosenWindow?.id ?? 'all') + ':' + windowAccessKey : null,
    async (signal, publish) => {
      const loadAll = async (windowId?: number) => {
        const items: Opportunity[] = []; let result: OpportunityResults;
        for (let page = 1; ; page++) {
          result = await studentGet<OpportunityResults>('/students/me/opportunities' + studentQuery({ windowId, page, limit: 100 }), signal);
          items.push(...result.items);
          if (items.length >= result.total) return { ...result, items };
          if (!result.items.length) throw new ApiError('Chưa tải đủ danh sách vị trí tuyển dụng. Vui lòng thử lại.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
        }
      };
      if (chosenWindow) {
        const selected = await loadAll(chosenWindow.id);
        return {...selected, items:selected.items.map(item=>({...item,applicationWindowId:chosenWindow.id}))};
      }
      const catalog = await loadAll();
      const candidates = (windows.data ?? []).filter(item => item.status === 'OPEN' || item.canSubmit);
      const qualified = await Promise.all(candidates.map(async window => ({window, data: await loadAll(window.id)})));
      const qualifiedByPosition = new Map<string, Opportunity>();
      for (const {window, data} of qualified) for (const item of data.items) {
        const key = `${item.postId}:${item.id}`;
        if (!qualifiedByPosition.get(key)?.canApply)
          qualifiedByPosition.set(key, {...item, applicationWindowId: item.canApply ? window.id : null});
      }
      return {...catalog, items: catalog.items.map(item => {
        const checked = qualifiedByPosition.get(`${item.postId}:${item.id}`);
        if (checked) return {...item, applicationWindowId: checked.applicationWindowId, canApply: checked.canApply, blockers: checked.blockers};
        const related = (windows.data ?? []).find(window => window.ojtSemesterId === item.ojtSemesterId
          && (!window.recruitmentRoundId || window.recruitmentRoundId === item.post.windowId));
        return {...item, applicationWindowId: null, canApply: false,
          blockers: [...(related?.blockingReasons?.length ? related.blockingReasons : ['OJT_REGISTRATION_WINDOW_REQUIRED']),
            ...(item.remainingSlots <= 0 ? ['POSITION_FULL'] : [])]};
      })};
    }, { snapshot: true });
  const {byId, groups, companies} = useMemo(() => indexCompanies(opportunities.data?.items ?? []), [opportunities.data?.items]);
  const query = search.trim().toLocaleLowerCase();
  const filteredCompanies = useMemo(() => groups.filter(group => group.searchText.includes(query)), [groups, query]);
  const currentCompanyPage = Math.min(companyPage, Math.max(1, Math.ceil(filteredCompanies.length / 20)));
  const applicationItems = applications.data?.items ?? [];
  const cv = savedCv ?? profile?.cv ?? null;
  const canApply = !profileRefreshing && !submissionRefresh && !windows.loading && !windows.error && !opportunities.loading && !opportunities.error && !!opportunities.data?.items.some((item) => item.canApply);
  const displayedSemester = chosenWindow?.semester?.name || chosenWindow?.period?.name
    || semesters.find(item => item.id === chosenWindow?.ojtSemesterId)?.name;
  useEffect(() => {
    if (!submissionRefresh) return;
    if (windows.pending || opportunities.pending) submissionRefreshStarted.current = true;
    else if (submissionRefreshStarted.current) {
      submissionRefreshStarted.current = false;
      setSubmissionRefresh(false);
    }
  }, [submissionRefresh, windows.pending, opportunities.pending]);
  const applicationBlockers = [...new Set((opportunities.data?.items ?? []).flatMap(item => item.blockers))];
  const refreshRecruitment = () => { windows.reload(); opportunities.reload(); applications.reload(); };
  const refreshRef = useRef(refreshRecruitment);
  const pauseRefresh = useRef(false);
  refreshRef.current = refreshRecruitment;
  pauseRefresh.current = applying || windows.pending || opportunities.pending || applications.pending;
  useEffect(() => subscribeVisibleRefresh(() => refreshRef.current(), {
    interval: 60_000, canRefresh: () => !pauseRefresh.current,
  }), [scope]);
  const openApplication = (position?: Opportunity) => {
    if (!canApply) return;
    setInitialPosition(position); setDetailCompany(null); setMessage(''); setApplying(true);
  };
  return (
    <div className="space-y-4">
      {message && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-6">
        <div role="tablist" aria-label="OJT và hồ sơ ứng tuyển" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1.5">
          <button type="button" role="tab" id="apply-tab" aria-controls="apply-panel" aria-selected={activeTab === 'apply'} onClick={() => setActiveTab('apply')} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'apply' ? 'bg-white font-semibold text-orange-700 shadow-sm' : 'font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>Ứng tuyển thực tập</button>
          <button type="button" role="tab" id="records-tab" aria-controls="records-panel" aria-selected={activeTab === 'records'} onClick={() => { setActiveTab('records'); setRecordsRequested(true); }} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'records' ? 'bg-white font-semibold text-orange-700 shadow-sm' : 'font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>Hồ sơ ứng tuyển của tôi</button>
        </div>
        <div role="tabpanel" id="apply-panel" aria-labelledby="apply-tab" hidden={activeTab !== 'apply'} className="space-y-5 pt-5">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2 sm:p-4">
          <div className="min-w-0 space-y-2 text-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Kỳ OJT</p><p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-800">{windows.loading ? 'Đang kiểm tra kỳ OJT…' : displayedSemester || (chosenWindow ? 'Chưa có thông tin học kỳ' : windowChoice === 'all' ? 'Tất cả kỳ OJT đang tuyển' : 'Chưa có đợt đang nhận hồ sơ')}</p></div>
          <label className="block min-w-0 space-y-2 text-sm font-medium text-slate-600">Đợt đăng ký
          <select aria-label="Chọn đợt đăng ký" className={inputClass + ' bg-white'} value={chosenWindow?.id ?? 'all'} disabled={windows.loading} onChange={(event) => { setWindowChoice(event.target.value); setCompanyPage(1); setSearch(''); }}>
              <option value="all">Tất cả tin tuyển dụng đang công bố</option>
              {windows.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.isApplicationOpen ? 'Đang nhận hồ sơ' : item.applicationStatus === 'UPCOMING' ? 'Chưa đến hạn' : 'Đã hết hạn'}</option>)}
            </select>
          </label>
        </div>
        <ResourceState loading={windows.loading} refreshing={windows.refreshing} error={windows.error} retry={windows.reload} />
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-orange-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {chosenWindow && <div className="space-y-2 text-sm text-slate-600">
            <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${chosenWindow.isApplicationOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}><span className="size-2 rounded-full bg-current"/>{chosenWindow.isApplicationOpen ? 'Đang nhận hồ sơ' : chosenWindow.applicationStatus === 'UPCOMING' ? 'Chưa đến hạn nhận hồ sơ' : 'Đã hết hạn nhận hồ sơ'}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm"><p>Bắt đầu <strong className="text-slate-800">{dateText(chosenWindow.startsAt)}</strong></p><p>Hạn nộp <strong className="text-orange-700">{dateText(chosenWindow.endsAt)}</strong></p></div>
          </div>}
          <button type="button" onClick={() => openApplication()} disabled={!canApply} title={!canApply ? 'Chỉ vị trí thuộc đợt OJT đủ điều kiện mới nhận đơn' : undefined} className={buttonClass + ' inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5 disabled:translate-y-0 sm:ml-auto'}><Send size={17} />Nộp đơn đăng ký OJT</button>
        </div>
        {canApply && <p role="status" className="text-sm font-medium text-emerald-700">Bạn đủ điều kiện nộp đơn ứng tuyển trong {chosenWindow?.name || 'các đợt đang nhận hồ sơ'}.</p>}
        {!windows.pending && !windows.error && !opportunities.pending && !opportunities.error && !canApply && applicationBlockers.length > 0 &&
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">{explainOjtBlockers(applicationBlockers)}</p>}
        {!chosenWindow && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">Danh sách gồm tin tuyển dụng thuộc tất cả kỳ đang có. Bạn có thể nộp đơn cho vị trí có nút ứng tuyển được bật khi đủ điều kiện.</p>}
        {!opportunities.pending && !opportunities.error && <p className="text-sm leading-relaxed text-slate-500">Mỗi lần chỉ được nộp một hồ sơ. Khi doanh nghiệp từ chối, bạn được chọn vị trí khác, kể cả trong cùng tin và cùng doanh nghiệp nếu còn hạn. Không được nộp lại đúng vị trí đã ứng tuyển trong tin đó. Sinh viên đã có điểm hoặc đã pass OJT không được nộp mới.</p>}
        {chosenWindow && <StudentJobMatches key={`${scope}:${chosenWindow.id}:${cv?.id??'no-cv'}`} windowId={chosenWindow.id} cvFileId={cv?.id??null} opportunities={opportunities.data?.items??[]} onApply={openApplication}/>}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[.12em] text-orange-600">Cơ hội thực tập</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Doanh nghiệp liên kết</h3>
          <p className="mt-1 text-sm text-slate-500">{companies.length} doanh nghiệp · {opportunities.data?.total ?? 0} vị trí {chosenWindow ? 'trong đợt đã chọn' : 'đang tuyển'}</p>
          </div>
          <label className="relative block sm:w-80"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input className={inputClass + ' rounded-xl py-2.5 pl-10'} aria-label="Tìm doanh nghiệp hoặc vị trí" placeholder="Tìm doanh nghiệp, vị trí, địa điểm..." value={search} onChange={(event) => { setSearch(event.target.value); setCompanyPage(1); }} /></label>
        </div>
        <ResourceState loading={opportunities.loading} refreshing={opportunities.refreshing} error={opportunities.error} retry={opportunities.reload} />
        {!opportunities.pending && !opportunities.error && !filteredCompanies.length && <Empty>{search ? 'Không tìm thấy doanh nghiệp phù hợp.' : chosenWindow ? 'Chưa có tin đã công bố còn hạn trong đợt này.' : 'Hiện chưa có tin tuyển dụng đã công bố và còn hạn.'}</Empty>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.slice((currentCompanyPage - 1) * 20, currentCompanyPage * 20).map(({company, positions, remaining}) => {
            return <article key={company.id} className="group flex min-h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/60 sm:p-5">
              <div className="mb-4 flex min-w-0 items-start gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-orange-700 ring-1 ring-orange-100"><Building2 size={22} /></div><div className="min-w-0"><h3 className="break-words font-bold leading-snug text-slate-900">{company.name}</h3><p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{company.industry || 'Doanh nghiệp liên kết OJT'}</p></div></div>
              <p className="mb-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500"><MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />{company.address || positions[0]?.location || 'Địa điểm chưa cập nhật'}</p>
              <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-xs font-medium text-slate-600">{positions.length} vị trí</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{remaining} chỗ trống</span></div>
              <button type="button" onClick={() => setDetailCompany(company)} className="mt-auto flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-800">Xem chi tiết &amp; vị trí tuyển dụng<ChevronRight size={17} /></button>
            </article>;
          })}
        </div>
        {filteredCompanies.length > 20 && <Pagination page={currentCompanyPage} total={filteredCompanies.length} onChange={setCompanyPage} />}
      </div>
        </div>

        <div role="tabpanel" id="records-panel" aria-labelledby="records-tab" hidden={activeTab !== 'records'} className="pt-5">
        <div className="min-w-0 space-y-5 rounded-2xl bg-slate-50/70 p-0 sm:p-4">
        {recordsRequested && <StudentCvCard embedded cv={cv} onUploaded={(uploaded) => { setSavedCv(uploaded); setMessage('Đã lưu CV vào hồ sơ của bạn.'); }} />}
        <section aria-label="Hồ sơ đã nộp" className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <header className="flex items-start gap-3"><span className="rounded-xl bg-orange-50 p-2.5 text-orange-600"><BriefcaseBusiness size={22}/></span><div><h2 className="text-lg font-semibold text-slate-800">Hồ sơ đã nộp</h2><p className="mt-1 text-sm text-slate-500">Theo dõi các vị trí thực tập mà bạn đã ứng tuyển.</p></div></header>
          {applications.loading&&<div role="status" aria-label="Đang tải hồ sơ đã nộp" className="animate-pulse space-y-3">{[0,1,2].map(i=><div key={i} className="h-20 rounded-xl bg-slate-100"/>)}</div>}
          {applications.error&&<div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600"/><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-800">Không thể tải danh sách hồ sơ</h3><p className="mt-1 text-sm text-slate-600">Đã xảy ra sự cố khi tải dữ liệu. Vui lòng thử lại.</p><button type="button" onClick={applications.reload} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={15}/>Thử lại</button></div></div>}
          {!applications.loading && !applications.error && !applicationItems.length && <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center"><span className="rounded-full bg-white p-3 text-slate-400"><Inbox size={28}/></span><h3 className="mt-3 text-sm font-semibold text-slate-700">Bạn chưa có hồ sơ ứng tuyển nào</h3><p className="mt-1 text-sm text-slate-500">Các vị trí bạn đã ứng tuyển sẽ được hiển thị tại đây.</p></div>}
          <div className="space-y-3">
            {applicationItems.map((application) => <article key={application.id} className="min-w-0 space-y-2 rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{application.position.title}</h3><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">{statusText(application.coordination?.decision || application.status)}</span></div>
              <p className="text-sm text-slate-500">{application.company.name} · {dateText(application.appliedAt)}</p>
              {application.cv && <p className="flex items-center gap-2 break-all text-xs text-slate-500"><FileText size={14} />CV đã gửi: {application.cv.fileName}</p>}
              {!!application.certificates?.length&&<div className="space-y-1 text-xs text-slate-600"><p>Chứng chỉ đã đính kèm:</p>{application.certificates.map((item,index)=><a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="block break-all text-left text-blue-600 underline">{item.name}</a>)}</div>}
              {application.coordination?.rejectReason && <p className="text-sm text-red-700">Lý do từ chối: {application.coordination.rejectReason}</p>}
            </article>)}
          </div>
          {applications.refreshing && <p role="status" className="text-xs text-slate-500">Đang cập nhật hồ sơ ứng tuyển…</p>}
          {(applications.data?.total ?? 0) > 20 && <Pagination page={applicationPage} total={applications.data!.total} onChange={setApplicationPage} disabled={applications.pending} />}
        </section>
        </div>
        </div>
      </section>

      {detailCompany && <StudentDialog title={detailCompany.name} onClose={() => setDetailCompany(null)} wide>
        <div className="space-y-6">
          <section className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 sm:p-6" aria-label="Thông tin doanh nghiệp">
            <div aria-hidden="true" className="absolute -right-8 -top-12 -z-10 size-40 rounded-full bg-blue-100/60" />
            <div className="flex min-w-0 items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"><Building2 size={27} aria-hidden="true" /></span><div className="min-w-0"><span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-800">{detailCompany.industry || 'Doanh nghiệp liên kết OJT'}</span><p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-600"><MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />{detailCompany.address || 'Chưa cập nhật địa chỉ'}</p></div></div>
            <dl className="mt-5 grid gap-2 sm:grid-cols-3">
              {[{label:'Người liên hệ',value:detailCompany.contactPersonName,icon:UserRound},{label:'Email',value:detailCompany.contactEmail,icon:Mail},{label:'Điện thoại',value:detailCompany.contactPhone,icon:Phone}].map(({label,value,icon:Icon})=><div key={label} className="flex min-w-0 items-start gap-2.5 rounded-xl border border-white/80 bg-white/80 p-3"><Icon size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true"/><div className="min-w-0"><dt className="text-[11px] font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || 'Chưa cập nhật'}</dd></div></div>)}
            </dl>
          </section>
          <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-orange-600">Cơ hội thực tập</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Vị trí đang tuyển</h3></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{byId.get(detailCompany.id)?.positions.length ?? 0} vị trí</span></div>
          <div className="grid gap-4 xl:grid-cols-2">
          {byId.get(detailCompany.id)?.positions.map((item) => <article key={`${item.postId}:${item.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">{item.post.title}</p><h4 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900">{item.title}</h4></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.remainingSlots>0?'bg-emerald-100 text-emerald-800':'bg-slate-200 text-slate-600'}`}>{item.remainingSlots} chỗ</span></div>
              <div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"><MapPin size={13} aria-hidden="true"/>{item.location || detailCompany.address || 'Chưa cập nhật địa điểm'}</span><span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">{workModeText(item.workMode)}</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600"><Clock3 size={13} aria-hidden="true"/>Hạn: {item.post.deadlineAt ? dateText(item.post.deadlineAt) : 'Theo đợt'}</span></div>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5"><p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description || item.post.content || 'Thông tin mô tả đang được cập nhật.'}</p>
              {(item.requirements || item.post.benefits) && <div className="grid gap-3 sm:grid-cols-2">{item.requirements&&<div className="rounded-xl bg-blue-50/70 p-3.5"><h5 className="text-xs font-bold text-blue-900">Yêu cầu</h5><p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{item.requirements}</p></div>}{item.post.benefits&&<div className="rounded-xl bg-emerald-50/70 p-3.5"><h5 className="flex items-center gap-1.5 text-xs font-bold text-emerald-900"><Gift size={14} aria-hidden="true"/>Quyền lợi</h5><p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{item.post.benefits}</p></div>}</div>}
              {item.post.applicationInstructions&&<details className="rounded-xl border border-slate-200"><summary className="cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-slate-700">Cách ứng tuyển</summary><p className="border-t border-slate-100 px-3.5 py-3 text-sm leading-relaxed text-slate-600">{item.post.applicationInstructions}</p></details>}
              {!item.canApply&&<p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">{explainOjtBlockers(item.blockers)}</p>}
              <button type="button" disabled={!canApply || !item.canApply} onClick={() => openApplication(item)} className={buttonClass + ' mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl shadow-sm disabled:shadow-none'}><Send size={16} aria-hidden="true"/>Ứng tuyển vị trí này</button>
            </div>
          </article>)}
          </div>
        </div>
      </StudentDialog>}
      {applying && profile && <OjtApplicationDialog profile={profile} companies={companies} opportunities={opportunities.data?.items ?? []} initialPosition={initialPosition} cv={cv} onUploaded={setSavedCv} onClose={() => setApplying(false)} onSubmitted={() => { setSubmissionRefresh(true); setApplying(false); setMessage('Đã gửi đơn đăng ký OJT. Bạn có thể theo dõi phản hồi tại mục Hồ sơ đã nộp.'); refreshRecruitment(); }} />}
    </div>
  );
}

export default function StudentOjtRegistration() {
  const { profile, semesterId } = useStudentPortal();
  return <StudentPage title="OJT & hồ sơ ứng tuyển" description="Khám phá doanh nghiệp liên kết, quản lý CV và theo dõi đơn đăng ký thực tập." needsSemester={false} showSemesterInBanner={false} compactTopSpacing>
    <RegistrationContent key={`${profile?.id}:${semesterId}`} />
  </StudentPage>;
}
