import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Building2, RefreshCw, Send } from "lucide-react";
import API from "@/services/api";
import { allStudentPages, studentGet, studentQuery } from '@/services/student';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { StudentPage, statusText } from '@/components/student/PortalUI';
import { StudentCvCard } from '@/components/student/StudentCvCard';

type RegistrationWindow = {
  id: number;
  name: string;
  ojtSemesterId: number;
  startsAt: string;
  endsAt: string;
  status: string;
  canSubmit: boolean;
  blockingReasons: string[];
  blockingMessages: string[];
  registration?: { id: number; status: string; latestDecision?: string | null } | null;
};
type Opportunity = {
  id: number;
  postId: number;
  ojtSemesterId: number;
  title: string;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  workMode?: string | null;
  remainingSlots: number;
  canApply: boolean;
  blockers: string[];
  company: { id: number; name: string; address?: string | null };
  post: { title: string; deadlineAt?: string | null; content?: string | null; benefits?: string | null };
};
type Application = {
  id: number;
  status: string;
  appliedAt: string;
  company: { name: string };
  position: { title: string };
  coordination?: { decision: string; rejectReason?: string | null } | null;
};
type Page<T> = { items: T[]; total: number; page: number; limit: number };
type OpportunityResults = Page<Opportunity> & {
  canApply: boolean;
  blockers: string[];
};
const blockerLabels: Record<string, string> = {
  ELIGIBLE_HANDOFF_REQUIRED: "Chưa được Phòng Đào tạo bàn giao danh sách đủ điều kiện.",
  CONFIRMED_ELIGIBILITY_REQUIRED: "Cần có kết quả eligibility chính thức còn hiệu lực.",
  ELIGIBILITY_CHECK_STALE: "Kết quả eligibility đã cũ; cần được cập nhật.",
  ELIGIBILITY_HANDOFF_STALE: 'Dữ liệu đã thay đổi sau bàn giao; liên hệ Phòng Đào tạo để rà soát.',
  APPLICATION_ALREADY_IN_PROCESS: "Đã có hồ sơ đang chờ hoặc đã được doanh nghiệp tiếp nhận.",
  POSITION_FULL: "Vị trí đã đủ chỉ tiêu.",
  OJT_REGISTRATION_WINDOW_UNAVAILABLE: "Đợt đăng ký chưa mở hoặc đã hết hạn.",
  REGISTRATION_OUT_OF_SCOPE: "Sinh viên không thuộc phạm vi của đợt đăng ký.",
  ASSIGNMENT_EXISTS: "Đã có phân công thực tập trong kỳ này.",
  REGISTRATION_PROGRAM_CHANGED: "Chương trình đào tạo đã thay đổi; cần được rà soát.",
};
const explainBlockers = (blockers: string[]) =>
  blockers.map((blocker) => blockerLabels[blocker] || blocker).join(" ");

function errorText(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Không thể hoàn tất yêu cầu.";
}

function RegistrationContent() {
  const { profile, semesterId } = useStudentPortal();
  const submitLock = useRef(false);
  const [windows, setWindows] = useState<RegistrationWindow[]>([]);
  const [windowId, setWindowId] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityBlockers, setOpportunityBlockers] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [note, setNote] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '');
  const [contactEmail, setContactEmail] = useState(profile?.email ?? '');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadWindows = useCallback(async () => {
    const items = await allStudentPages<RegistrationWindow>('/ojt-registration-windows' + studentQuery({ ojtSemesterId: semesterId }));
    setWindows(items);
    setWindowId((current) =>
      items.some((item) => String(item.id) === current)
        ? current
        : String(items.find((item) => item.canSubmit)?.id ?? items[0]?.id ?? ""),
    );
  }, [semesterId]);

  const loadApplications = useCallback(async () => {
    setApplications(await allStudentPages<Application>('/job-applications' + studentQuery({ ojtSemesterId: semesterId })));
  }, [semesterId]);

  const loadOpportunities = useCallback(async (selectedWindowId: string, signal?: AbortSignal): Promise<OpportunityResults | null> => {
    if (!selectedWindowId) {
      return null;
    }
    let result: OpportunityResults | null = null;
    const items: Opportunity[] = [];
    for (let page = 1; ; page++) {
      result = await studentGet<OpportunityResults>('/students/me/opportunities' + studentQuery({ windowId: Number(selectedWindowId), page, limit: 100 }), signal);
      items.push(...result.items);
      if (items.length >= result.total || !result.items.length) return { ...result, items };
    }
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await Promise.all([loadWindows(), loadApplications()]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [loadApplications, loadWindows]);

  const refreshAll = useCallback(async () => {
    await refresh();
    if (!windowId) return;
    try {
      const result = await loadOpportunities(windowId);
      if (result) {
        setOpportunities(result.items);
        setOpportunityBlockers(result.blockers);
      }
    } catch (e) {
      setError(errorText(e));
    }
  }, [loadOpportunities, refresh, windowId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setOpportunities([]);
    setOpportunityBlockers([]);
    setSelected(null);
    if (!windowId) {
      setOpportunities([]);
      setOpportunityBlockers([]);
      return;
    }
    setLoading(true);
    loadOpportunities(windowId, controller.signal)
      .then((result) => {
        if (active && result) {
          setOpportunities(result.items);
          setOpportunityBlockers(result.blockers);
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [loadOpportunities, windowId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !windowId || submitLock.current || loading) return;
    submitLock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await API.post("/job-applications", {
        windowId: Number(windowId),
        postId: selected.postId,
        positionId: selected.id,
        coverLetter,
        application: { contactPhone, contactEmail, note },
      });
      setMessage("Đã gửi hồ sơ trực tiếp đến doanh nghiệp. Bạn có thể theo dõi phản hồi phía dưới.");
      setSelected(null);
      setCoverLetter("");
      setNote("");
      const [, , result] = await Promise.all([loadWindows(), loadApplications(), loadOpportunities(windowId)]);
      if (result) {
        setOpportunities(result.items);
        setOpportunityBlockers(result.blockers);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  };

  const chosenWindow = windows.find((item) => String(item.id) === windowId);
  const actionableOpportunities = opportunities.filter((item) => item.canApply);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Chọn đợt đăng ký và vị trí phù hợp. Hồ sơ được gửi trực tiếp đến doanh nghiệp; Phòng QHDN theo dõi trạng thái.</p>
      <StudentCvCard />

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {message && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-[260px] flex-1 text-sm font-semibold text-slate-700">
            Đợt đăng ký
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              value={windowId}
              onChange={(event) => {
                setSelected(null);
                setWindowId(event.target.value);
              }}
              disabled={loading || busy || !windows.length}
            >
              {!windows.length && <option value="">Chưa có đợt đăng ký phù hợp</option>}
              {windows.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.status === "OPEN" ? "Đang mở" : item.status}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void refreshAll()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
        {chosenWindow && (
          <div className="mt-3 text-xs text-slate-500">
            Thời gian: {new Date(chosenWindow.startsAt).toLocaleString("vi-VN")} – {new Date(chosenWindow.endsAt).toLocaleString("vi-VN")}
            {chosenWindow.registration?.latestDecision === "REJECTED" && (
              <span className="ml-2 font-semibold text-amber-700">Hồ sơ trước đã bị từ chối — bạn có thể nộp lại.</span>
            )}
          </div>
        )}
        {chosenWindow?.blockingMessages?.length ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {chosenWindow.blockingMessages.join(" ")}
          </div>
        ) : null}
        {opportunityBlockers.length > 0 && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Không thể nộp hồ sơ: {explainBlockers(opportunityBlockers)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Vị trí đang tuyển</h2>
          <p className="mt-1 text-sm text-slate-500">
            {actionableOpportunities.length} vị trí đủ điều kiện để nộp hồ sơ trong đợt này.
          </p>
        </div>
        {!loading && !opportunities.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Không có vị trí tuyển dụng phù hợp hoặc bạn chưa đáp ứng điều kiện OJT của đợt này.
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {opportunities.map((item) => (
            <article key={`${item.postId}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Building2 size={15} />{item.company.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{item.remainingSlots} chỗ</span>
              </div>
              {item.location && <p className="mt-3 text-xs text-slate-500">{item.location}{item.workMode ? ` · ${item.workMode}` : ""}</p>}
              {(item.description || item.post.content) && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{item.description || item.post.content}</p>}
              {item.requirements && <p className="mt-2 text-sm text-slate-600"><strong>Yêu cầu:</strong> {item.requirements}</p>}
              <div className="mt-4">
                {item.canApply ? (
                  <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
                    <Send size={16} /> Nộp hồ sơ
                  </button>
                ) : (
                  <p className="text-xs text-amber-700">{explainBlockers(item.blockers)}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="application-title">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <h2 id="application-title" className="text-xl font-bold text-slate-900">Nộp hồ sơ đến {selected.company.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.title}</p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Thư giới thiệu / nội dung ứng tuyển
              <textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={4} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" placeholder="Giới thiệu ngắn về bản thân và lý do ứng tuyển..." />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Số điện thoại
                <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} maxLength={30} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Email liên hệ
                <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={100} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Ghi chú
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Hủy</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Send size={16} />{busy ? "Đang gửi..." : "Gửi trực tiếp"}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Hồ sơ đã nộp</h2>
        {applications.length ? (
          <div className="mt-3 divide-y divide-slate-100">
            {applications.map((application) => (
              <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{application.position.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{application.company.name} · {new Date(application.appliedAt).toLocaleDateString("vi-VN")}</p>
                  {application.coordination?.rejectReason && <p className="mt-1 text-xs text-red-600">Lý do từ chối: {application.coordination.rejectReason}</p>}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{statusText(application.coordination?.decision || application.status)}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-slate-500">Chưa có hồ sơ ứng tuyển.</p>}
      </section>
    </div>
  );
}

export default function StudentOjtRegistration() {
  const { profile, semesterId } = useStudentPortal();
  return (
    <StudentPage title="Đăng ký OJT" description="Chọn doanh nghiệp, nộp hồ sơ và theo dõi phản hồi trong đợt OJT của bạn.">
      <RegistrationContent key={`${profile?.id}:${semesterId}`} />
    </StudentPage>
  );
}
