import { useRef, useState, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/useStudentResource';
import {
  applyForPosition,
  getApplications,
  getOpportunities,
  getRegistrations,
  getRegistrationWindows,
  submitOjtRegistration,
} from '@/services/student';
import type { Opportunity } from '@/types/student/portal';
import { StudentCvCard } from '@/components/student/StudentCvCard';
import {
  Blockers,
  buttonClass,
  Card,
  dateText,
  Empty,
  inputClass,
  Pagination,
  ResourceState,
  statusText,
  StudentPage,
} from '@/components/student/PortalUI';

function RegistrationContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [windowPage, setWindowPage] = useState(1);
  const [registrationPage, setRegistrationPage] = useState(1);
  const [opportunityPage, setOpportunityPage] = useState(1);
  const [applicationPage, setApplicationPage] = useState(1);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [note, setNote] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const key = profile!.id + ':' + semesterId + ':' + revision;
  const windows = useStudentResource(
    'registration-windows:' + key + ':' + windowPage,
    (signal) => getRegistrationWindows(semesterId!, windowPage, signal),
  );
  const registrations = useStudentResource(
    'registrations:' + key + ':' + registrationPage,
    (signal) => getRegistrations(semesterId!, registrationPage, signal),
  );
  const opportunities = useStudentResource(
    'opportunities:' + key + ':' + opportunityPage,
    (signal) => getOpportunities(semesterId!, opportunityPage, signal),
  );
  const applications = useStudentResource(
    'applications:' + key + ':' + applicationPage,
    (signal) => getApplications(semesterId!, applicationPage, signal),
  );
  const mutate = async (work: () => Promise<unknown>, success: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      setSelected(null);
      setCoverLetter('');
      windows.reload();
      registrations.reload();
      opportunities.reload();
      applications.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-emerald-800"
        >
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card title="Đợt đăng ký OJT">
            <ResourceState
              loading={windows.loading}
              error={windows.error}
              retry={windows.reload}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm">
                Số điện thoại liên hệ
                <input
                  className={inputClass}
                  value={phone}
                  maxLength={30}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="text-sm">
                Email liên hệ
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  maxLength={100}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>
            <label className="block text-sm">
              Ghi chú hồ sơ
              <textarea
                className={inputClass}
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                disabled={busy}
              />
            </label>
            {windows.data && (
              <>
                {windows.data.items.map((window) => (
                  <form
                    key={window.id}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setError('Email liên hệ không hợp lệ.');
                        return;
                      }
                      if (window.canSubmit)
                        void mutate(
                          () =>
                            submitOjtRegistration(window.id, {
                              contactPhone: phone,
                              contactEmail: email,
                              note,
                            }),
                          'Đã nộp hồ sơ đăng ký OJT.',
                        );
                    }}
                  >
                    <h3 className="font-bold">{window.name}</h3>
                    <p className="text-sm">
                      {statusText(window.status)} · {dateText(window.startsAt)}{' '}
                      – {dateText(window.endsAt)}
                    </p>
                    {window.registration && (
                      <p className="text-sm">
                        Hồ sơ #{window.registration.id}:{' '}
                        {statusText(window.registration.status)}
                      </p>
                    )}
                    <Blockers
                      values={
                        window.blockingMessages?.length
                          ? window.blockingMessages
                          : window.blockingReasons
                      }
                    />
                    <button
                      type="submit"
                      className={buttonClass}
                      disabled={busy || !window.canSubmit}
                    >
                      {busy
                        ? 'Đang gửi...'
                        : window.registration?.status === 'REJECTED'
                          ? 'Nộp lại hồ sơ'
                          : 'Nộp hồ sơ OJT'}
                    </button>
                  </form>
                ))}
                {!windows.data.items.length && (
                  <Empty>
                    Chưa có đợt đăng ký dành cho bạn. Đợt đăng ký chỉ hiển thị
                    sau khi được nhà trường bàn giao danh sách đủ điều kiện.
                  </Empty>
                )}
                <Pagination
                  page={windowPage}
                  total={windows.data.total}
                  onChange={setWindowPage}
                  disabled={busy}
                />
              </>
            )}
          </Card>
          <Card title="Doanh nghiệp & vị trí thực tập">
            <ResourceState
              loading={opportunities.loading}
              error={opportunities.error}
              retry={opportunities.reload}
            />
            {opportunities.data && (
              <>
                <Blockers values={opportunities.data.blockers} />
                {opportunities.data.items.map((opportunity) => (
                  <article
                    key={opportunity.id + ':' + opportunity.post.id}
                    className="rounded-2xl border border-slate-200 p-5 space-y-3"
                  >
                    <h3 className="text-lg font-bold">{opportunity.title}</h3>
                    <p className="font-semibold text-orange-600">
                      {opportunity.company.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {opportunity.location ||
                        opportunity.company.address ||
                        'Chưa cập nhật địa điểm'}{' '}
                      · Còn {opportunity.remainingSlots}/{opportunity.capacity}{' '}
                      chỗ · Hạn: {dateText(opportunity.post.deadlineAt)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {opportunity.description || opportunity.post.content}
                    </p>
                    {opportunity.requirements && (
                      <div className="text-sm whitespace-pre-wrap">
                        <strong>Yêu cầu:</strong> {opportunity.requirements}
                      </div>
                    )}
                    {opportunity.post.benefits && (
                      <div className="text-sm whitespace-pre-wrap">
                        <strong>Quyền lợi:</strong> {opportunity.post.benefits}
                      </div>
                    )}
                    <Blockers values={opportunity.blockers} />
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={
                        busy ||
                        !opportunity.canApply ||
                        !opportunities.data?.registrationId
                      }
                      onClick={() => {
                        setSelected(opportunity);
                        setCoverLetter('');
                        setError('');
                      }}
                    >
                      Ứng tuyển
                    </button>
                  </article>
                ))}
                {!opportunities.data.items.length && (
                  <Empty>Chưa có vị trí đang tuyển trong đợt này.</Empty>
                )}
                <Pagination
                  page={opportunityPage}
                  total={opportunities.data.total}
                  onChange={setOpportunityPage}
                  disabled={busy}
                />
              </>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <StudentCvCard />
          <Card title="Hồ sơ đăng ký của bạn">
            <ResourceState
              loading={registrations.loading}
              error={registrations.error}
              retry={registrations.reload}
            />
            {registrations.data && (
              <>
                {registrations.data.items.map((registration) => (
                  <div
                    key={registration.id}
                    className="text-sm rounded-xl bg-slate-50 p-4 space-y-2"
                  >
                    <h3 className="font-bold">
                      Hồ sơ #{registration.id} ·{' '}
                      {statusText(registration.status)}
                    </h3>
                    <p>{registration.window?.name}</p>
                    <p>Nộp lúc: {dateText(registration.registeredAt)}</p>
                    {registration.review?.reason && (
                      <p>Nhận xét: {registration.review.reason}</p>
                    )}
                    {registration.application?.note && (
                      <p>Ghi chú: {registration.application.note}</p>
                    )}
                  </div>
                ))}
                {!registrations.data.items.length && (
                  <Empty>Bạn chưa có hồ sơ đăng ký trong đợt này.</Empty>
                )}
                <Pagination
                  page={registrationPage}
                  total={registrations.data.total}
                  onChange={setRegistrationPage}
                  disabled={busy}
                />
              </>
            )}
          </Card>
        </div>
      </div>
      <Card title="Lịch sử ứng tuyển">
        <ResourceState
          loading={applications.loading}
          error={applications.error}
          retry={applications.reload}
        />
        {applications.data && (
          <>
            {applications.data.items.map((application) => (
              <div
                key={application.id}
                className="rounded-xl bg-slate-50 p-4 text-sm space-y-1"
              >
                <h3 className="font-bold">
                  {application.company.name} · {application.position.title}
                </h3>
                <p>
                  {statusText(application.status)} ·{' '}
                  {dateText(application.appliedAt)}
                </p>
                {application.coverLetter && (
                  <p className="whitespace-pre-wrap">
                    {application.coverLetter}
                  </p>
                )}
                {application.reviewNote && (
                  <p>Nhận xét: {application.reviewNote}</p>
                )}
                {application.coordination?.decision && (
                  <p>
                    Điều phối: {statusText(application.coordination.decision)}
                  </p>
                )}
                {application.coordination?.rejectReason && (
                  <p>Lý do từ chối: {application.coordination.rejectReason}</p>
                )}
              </div>
            ))}
            {!applications.data.items.length && (
              <Empty>Bạn chưa ứng tuyển vị trí nào.</Empty>
            )}
            <Pagination
              page={applicationPage}
              total={applications.data.total}
              onChange={setApplicationPage}
              disabled={busy}
            />
          </>
        )}
      </Card>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Nộp đơn ứng tuyển"
            className="w-full max-w-xl space-y-4 rounded-3xl bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              const registrationId = opportunities.data?.registrationId;
              if (registrationId && selected.canApply)
                void mutate(
                  () =>
                    applyForPosition(
                      registrationId,
                      selected.post.id,
                      selected.id,
                      coverLetter,
                    ),
                  'Đã gửi đơn ứng tuyển.',
                );
            }}
          >
            <h2 className="text-xl font-bold">Ứng tuyển {selected.title}</h2>
            <p>{selected.company.name}</p>
            <label className="block text-sm">
              Thư giới thiệu
              <textarea
                className={inputClass + ' min-h-32'}
                maxLength={5000}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                disabled={busy}
              />
            </label>
            <p className="text-sm text-slate-500">
              CV hiện tại: {profile?.cv?.fileName ?? 'Chưa có CV'}
            </p>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button disabled={busy} type="submit" className={buttonClass}>
                {busy ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
              </button>
              <button
                disabled={busy}
                type="button"
                className="text-sm underline"
                onClick={() => setSelected(null)}
              >
                Đóng
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
export const StudentOjtRegistration = () => {
  const { profile, semesterId, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Đăng ký thực tập doanh nghiệp"
      description="Nộp hồ sơ OJT, cập nhật CV, lựa chọn vị trí và theo dõi kết quả ứng tuyển."
    >
      {!loading && profile && semesterId && (
        <RegistrationContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentOjtRegistration;
