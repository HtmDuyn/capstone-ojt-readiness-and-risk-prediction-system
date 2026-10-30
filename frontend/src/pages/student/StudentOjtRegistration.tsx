import { useMemo, useState } from 'react';
import { Building2, ChevronRight, FileText, MapPin, Search, Send } from 'lucide-react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import { allStudentPages, studentGet, studentQuery } from '@/services/studentService';
import { buttonClass, Card, dateText, Empty, inputClass, Pagination, ResourceState, statusText, StudentPage } from '@/components/student/PortalUI';
import { StudentCvCard } from '@/components/student/StudentCvCard';
import { StudentDialog } from '@/components/student/StudentDialog';
import { OjtApplicationDialog } from '@/components/student/OjtApplicationDialog';
import { explainOjtBlockers, workModeText, type Opportunity, type PartnerCompany } from '@/components/student/ojt';
import type { CV, Page } from '@/types/student/portal';

type RegistrationWindow = {
  id: number; name: string; startsAt: string; endsAt: string; status: string;
  canSubmit: boolean; blockingMessages: string[];
};
type Application = {
  id: number; status: string; appliedAt: string; company: { name: string };
  position: { title: string }; cv?: CV | null;
  coordination?: { decision: string; rejectReason?: string | null } | null;
};
type OpportunityResults = Page<Opportunity> & { blockers: string[] };

function RegistrationContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [windowChoice, setWindowChoice] = useState('');
  const [search, setSearch] = useState('');
  const [companyPage, setCompanyPage] = useState(1);
  const [applicationPage, setApplicationPage] = useState(1);
  const [detailCompany, setDetailCompany] = useState<PartnerCompany | null>(null);
  const [applying, setApplying] = useState(false);
  const [initialPosition, setInitialPosition] = useState<Opportunity>();
  const [savedCv, setSavedCv] = useState<CV | null>(null);
  const [message, setMessage] = useState('');
  const scope = `${profile?.id}:${semesterId}:${revision}`;
  const windows = useStudentResource('ojt-windows:' + scope,
    (signal) => allStudentPages<RegistrationWindow>('/ojt-registration-windows' + studentQuery({ ojtSemesterId: semesterId }), signal));
  const applications = useStudentResource('ojt-applications:' + scope,
    (signal) => allStudentPages<Application>('/job-applications' + studentQuery({ ojtSemesterId: semesterId }), signal));
  const chosenWindow = windows.data?.find((item) => String(item.id) === windowChoice)
    ?? windows.data?.find((item) => item.status === 'OPEN') ?? windows.data?.[0];
  const opportunities = useStudentResource(chosenWindow ? 'ojt-opportunities:' + scope + ':' + chosenWindow.id : null,
    async (signal) => {
      const items: Opportunity[] = [];
      for (let page = 1; ; page++) {
        const result = await studentGet<OpportunityResults>('/students/me/opportunities' + studentQuery({ windowId: chosenWindow!.id, page, limit: 100 }), signal);
        items.push(...result.items);
        if (items.length >= result.total || !result.items.length) return { ...result, items };
      }
    });
  const companies = useMemo(() => [...new Map((opportunities.data?.items ?? []).map((item) => [item.company.id, item.company])).values()], [opportunities.data]);
  const filteredCompanies = companies.filter((company) => {
    const positions = opportunities.data?.items.filter((item) => item.company.id === company.id) ?? [];
    return [company.name, company.industry, company.address, ...positions.map((item) => item.title)].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });
  const currentCompanyPage = Math.min(companyPage, Math.max(1, Math.ceil(filteredCompanies.length / 20)));
  const applicationItems = applications.data ?? [];
  const currentApplicationPage = Math.min(applicationPage, Math.max(1, Math.ceil(applicationItems.length / 20)));
  const cv = savedCv ?? profile?.cv ?? null;
  const blockers = opportunities.data?.blockers ?? [];
  const canApply = !!chosenWindow && !windows.loading && !opportunities.loading && !opportunities.error && !!opportunities.data?.items.some((item) => item.canApply);
  const refreshRecruitment = () => { windows.reload(); opportunities.reload(); applications.reload(); };
  const openApplication = (position?: Opportunity) => {
    setInitialPosition(position); setDetailCompany(null); setMessage(''); setApplying(true);
  };
  return (
    <div className="space-y-6">
      {message && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      <Card title="Ứng tuyển thực tập">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="w-full space-y-2 text-sm text-slate-600 sm:max-w-lg">Đợt đăng ký
            <select aria-label="Chọn đợt đăng ký" className={inputClass} value={chosenWindow?.id ?? ''} disabled={windows.loading || !windows.data?.length} onChange={(event) => { setWindowChoice(event.target.value); setCompanyPage(1); setSearch(''); }}>
              {!windows.data?.length && <option value="">Chưa có đợt đăng ký</option>}
              {windows.data?.map((item) => <option key={item.id} value={item.id}>{item.name} · {statusText(item.status)}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => openApplication()} disabled={!canApply} className={buttonClass + ' inline-flex shrink-0 items-center justify-center gap-2 py-3'}><Send size={17} />Nộp đơn đăng ký OJT</button>
        </div>
        <ResourceState loading={windows.loading} error={windows.error} retry={windows.reload} />
        {chosenWindow && <p className="text-xs text-slate-500">Nhận hồ sơ: {dateText(chosenWindow.startsAt)} – {dateText(chosenWindow.endsAt)}</p>}
        {!!blockers.length && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{explainOjtBlockers(blockers)} Bạn vẫn có thể xem thông tin doanh nghiệp bên dưới.</p>}
      </Card>

      <Card title="Doanh nghiệp liên kết">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">{companies.length} doanh nghiệp · {opportunities.data?.total ?? 0} vị trí trong đợt đã chọn</p>
          <label className="relative block sm:w-80"><Search size={17} className="absolute left-3 top-2.5 text-slate-400" /><input className={inputClass + ' pl-10'} aria-label="Tìm doanh nghiệp hoặc vị trí" placeholder="Tìm doanh nghiệp, vị trí, địa điểm..." value={search} onChange={(event) => { setSearch(event.target.value); setCompanyPage(1); }} /></label>
        </div>
        <ResourceState loading={opportunities.loading} error={opportunities.error} retry={opportunities.reload} />
        {!opportunities.loading && !opportunities.error && !filteredCompanies.length && <Empty>{search ? 'Không tìm thấy doanh nghiệp phù hợp.' : 'Chưa có doanh nghiệp công bố tuyển dụng trong đợt này.'}</Empty>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.slice((currentCompanyPage - 1) * 20, currentCompanyPage * 20).map((company) => {
            const positions = opportunities.data?.items.filter((item) => item.company.id === company.id) ?? [];
            return <article key={company.id} className="flex flex-col rounded-2xl border border-slate-200 p-5 transition hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/40">
              <div className="mb-4 flex items-start gap-3"><div className="rounded-2xl bg-orange-50 p-3 text-orange-600"><Building2 size={23} /></div><div><h3 className="font-bold text-slate-900">{company.name}</h3><p className="mt-1 text-xs text-slate-500">{company.industry || 'Doanh nghiệp liên kết OJT'}</p></div></div>
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500"><MapPin size={16} className="mt-0.5 shrink-0" />{company.address || positions[0]?.location || 'Địa điểm chưa cập nhật'}</p>
              <p className="mb-4 text-sm text-slate-600">{positions.length} vị trí · {positions.reduce((sum, item) => sum + item.remainingSlots, 0)} chỗ còn nhận</p>
              <button type="button" onClick={() => setDetailCompany(company)} className="mt-auto flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700">Xem chi tiết & vị trí tuyển dụng<ChevronRight size={17} /></button>
            </article>;
          })}
        </div>
        {filteredCompanies.length > 20 && <Pagination page={currentCompanyPage} total={filteredCompanies.length} onChange={setCompanyPage} />}
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <StudentCvCard cv={cv} onUploaded={(uploaded) => { setSavedCv(uploaded); setMessage('Đã lưu CV vào hồ sơ của bạn.'); }} />
        <Card title="Hồ sơ đã nộp">
          <ResourceState loading={applications.loading} error={applications.error} retry={applications.reload} />
          {!applications.loading && !applications.error && !applicationItems.length && <Empty>Chưa có đơn đăng ký. Chọn doanh nghiệp và nộp đơn khi đợt đăng ký mở.</Empty>}
          <div className="divide-y divide-slate-100">
            {applicationItems.slice((currentApplicationPage - 1) * 20, currentApplicationPage * 20).map((application) => <article key={application.id} className="space-y-2 py-4 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{application.position.title}</h3><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">{statusText(application.coordination?.decision || application.status)}</span></div>
              <p className="text-sm text-slate-500">{application.company.name} · {dateText(application.appliedAt)}</p>
              {application.cv && <p className="flex items-center gap-2 break-all text-xs text-slate-500"><FileText size={14} />CV đã gửi: {application.cv.fileName}</p>}
              {application.coordination?.rejectReason && <p className="text-sm text-red-700">Lý do từ chối: {application.coordination.rejectReason}</p>}
            </article>)}
          </div>
          {applicationItems.length > 20 && <Pagination page={currentApplicationPage} total={applicationItems.length} onChange={setApplicationPage} />}
        </Card>
      </div>

      {detailCompany && <StudentDialog title={detailCompany.name} onClose={() => setDetailCompany(null)}>
        <div className="space-y-6">
          <dl className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            {[['Lĩnh vực', detailCompany.industry], ['Địa chỉ', detailCompany.address], ['Người liên hệ', detailCompany.contactPersonName], ['Email', detailCompany.contactEmail], ['Điện thoại', detailCompany.contactPhone]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium">{value || 'Chưa cập nhật'}</dd></div>)}
          </dl>
          <h3 className="font-bold">Vị trí đang tuyển</h3>
          {opportunities.data?.items.filter((item) => item.company.id === detailCompany.id).map((item) => <article key={`${item.postId}:${item.id}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap justify-between gap-2"><h4 className="font-bold">{item.title}</h4><span className="text-sm font-semibold text-emerald-700">{item.remainingSlots} chỗ</span></div>
            <p className="text-xs text-slate-500">{item.location || detailCompany.address || 'Chưa cập nhật địa điểm'} · {workModeText(item.workMode)}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description || item.post.content}</p>
            {item.requirements && <p className="whitespace-pre-line text-sm text-slate-600"><strong>Yêu cầu: </strong>{item.requirements}</p>}
            {item.post.benefits && <p className="whitespace-pre-line text-sm text-slate-600"><strong>Quyền lợi: </strong>{item.post.benefits}</p>}
            {item.post.applicationInstructions && <p className="text-sm text-slate-600"><strong>Cách ứng tuyển: </strong>{item.post.applicationInstructions}</p>}
            <p className="text-xs text-slate-500">{item.post.title} · Hạn nộp: {item.post.deadlineAt ? dateText(item.post.deadlineAt) : 'Theo đợt đăng ký'}</p>
            {!item.canApply && <p className="text-sm text-amber-800">{explainOjtBlockers(item.blockers)}</p>}
            <button type="button" disabled={!item.canApply} onClick={() => openApplication(item)} className={buttonClass}>Ứng tuyển vị trí này</button>
          </article>)}
        </div>
      </StudentDialog>}
      {applying && profile && chosenWindow && <OjtApplicationDialog profile={profile} windowId={chosenWindow.id} companies={companies} opportunities={opportunities.data?.items ?? []} initialPosition={initialPosition} cv={cv} onUploaded={setSavedCv} onClose={() => setApplying(false)} onSubmitted={() => { setApplying(false); setMessage('Đã gửi đơn đăng ký OJT. Bạn có thể theo dõi phản hồi tại mục Hồ sơ đã nộp.'); refreshRecruitment(); }} />}
    </div>
  );
}

export default function StudentOjtRegistration() {
  const { profile, semesterId } = useStudentPortal();
  return <StudentPage title="OJT & hồ sơ ứng tuyển" description="Khám phá doanh nghiệp liên kết, quản lý CV và theo dõi đơn đăng ký thực tập.">
    <RegistrationContent key={`${profile?.id}:${semesterId}`} />
  </StudentPage>;
}
