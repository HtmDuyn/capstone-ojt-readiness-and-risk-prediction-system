import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Filter,
  Info,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";
import {
  errorMessage,
  Field,
  Notice,
  Pager,
  useIdempotencyKey,
} from "@/components/qhdn/QhdnUi";
import {
  EmptyStudents,
  AcademicPeriodFilter,
  StatCard,
  StudentIdentity,
  WorkflowBadge,
  WorkflowModal,
  WorkflowSteps,
  workflowInput,
  workflowPrimary,
  workflowSecondary,
} from "@/components/qhdn/StudentWorkflowUi";
import { InternshipAssignments } from "@/components/qhdn/InternshipAssignments";
import { useQhdnRoster, useQhdnSemesters } from "@/hooks/useQhdnRoster";
import {
  getCvFile,
  listPositions,
  reassignStudent,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { downloadFile } from "@/utils/downloadFile";
import {
  companyName,
  coordinationId,
  placementLabels,
  placementStatus,
  programName,
  receptionStatus,
  studentMatches,
  type PlacementStatus,
} from "@/utils/qhdnStudentStatus";
import type {
  HandoffStudentItem,
  PositionListItem,
} from "@/types/qhdn/qhdnTypes";
const time = (s?: string) =>
  s
    ? new Date(s).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Chưa cập nhật";
export default function QhdnOjtCoordination() {
  const [url] = useSearchParams();
  const semester = useQhdnSemesters(url.get("semester") || "");
  const roster = useQhdnRoster(semester.semesterId);
  const [view, setView] = useState<"tracking" | "assignments">("tracking"),
    [status, setStatus] = useState<PlacementStatus | "ALL">("ALL");
  const [search, setSearch] = useState(""),
    [company, setCompany] = useState("ALL"),
    [cohort, setCohort] = useState("ALL"),
    [page, setPage] = useState(1),
    [message, setMessage] = useState("");
  const [detail, setDetail] = useState<HandoffStudentItem | null>(null),
    [reassign, setReassign] = useState<HandoffStudentItem | null>(null);
  const [positions, setPositions] = useState<PositionListItem[]>([]),
    [loadingPositions, setLoadingPositions] = useState(false),
    [positionError, setPositionError] = useState("");
  const [nextCompany, setNextCompany] = useState(""),
    [nextPosition, setNextPosition] = useState(""),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const keyFor = useIdempotencyKey();
  const students = useMemo(
    () =>
      roster.students.filter(
        (s) => receptionStatus(s) === "APPROVED" || !!coordinationId(s),
      ),
    [roster.students],
  );
  const counts = students.reduce(
    (a, s) => {
      a[placementStatus(s)]++;
      return a;
    },
    { UNSENT: 0, PENDING: 0, ACCEPTED: 0, REJECTED: 0 },
  );
  useEffect(() => {
    setPage(1);
  }, [status, search, company, cohort, semester.semesterId]);
  useEffect(() => {
    setDetail(null);
    setReassign(null);
    setMessage("");
    setCompany("ALL");
    setCohort("ALL");
  }, [semester.semesterId]);
  useEffect(() => {
    if (!reassign) return;
    let active = true;
    setPositions([]);
    setPositionError("");
    setLoadingPositions(true);
    loadAllPages((page) =>
      listPositions({
        page,
        limit: 100,
        ojtSemesterId: Number(semester.semesterId),
        status: "OPEN",
      }).then((r) => r.data),
    )
      .then((p) => {
        if (active) setPositions(p);
      })
      .catch((e) => {
        if (active) setPositionError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoadingPositions(false);
      });
    return () => {
      active = false;
    };
  }, [reassign, semester.semesterId]);
  const filtered = students.filter(
    (s) =>
      (status === "ALL" || placementStatus(s) === status) &&
      (company === "ALL" ||
        String(s.enterpriseId ?? s.company?.id) === company) &&
      (cohort === "ALL" || s.cohortName === cohort) &&
      studentMatches(s, search),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))),
    visible = filtered.slice((safePage - 1) * 10, safePage * 10);
  const companies = new Map<number, string>();
  students.forEach((s) => {
    const id = s.enterpriseId ?? s.company?.id;
    if (id) companies.set(id, companyName(s));
  });
  const cohorts = [
    ...new Set(
      students.map((s) => s.cohortName).filter((s): s is string => !!s),
    ),
  ].sort();
  const available = positions.filter(
    (p) =>
      p.remainingSlots > 0 &&
      p.status === "OPEN" &&
      p.id !== (reassign?.positionId ?? reassign?.position?.id) &&
      (!p.company?.status || p.company.status === "ACTIVE"),
  );
  const nextCompanies = new Map<number, string>();
  available.forEach((p) =>
    nextCompanies.set(
      p.companyId,
      p.company?.name || p.companyName || "Doanh nghiệp #" + p.companyId,
    ),
  );
  const selectedPosition = available.find(
    (p) => String(p.id) === nextPosition && String(p.companyId) === nextCompany,
  );
  const openReassign = (s: HandoffStudentItem) => {
    setDetail(null);
    setReassign(s);
    setNextCompany("");
    setNextPosition("");
    setReason("");
    setConfirmed(false);
    setError("");
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !reassign ||
      busy ||
      !selectedPosition ||
      !confirmed ||
      !reason.trim() ||
      placementStatus(reassign) !== "REJECTED"
    )
      return;
    setBusy(true);
    setError("");
    try {
      const id = coordinationId(reassign)!;
      const payload = {
        positionId: selectedPosition.id,
        reason: reason.trim(),
      };
      await reassignStudent(id, {
        ...payload,
        idempotencyKey: keyFor({ id, ...payload }),
      });
      setReassign(null);
      setMessage(
        "Đã gửi lại hồ sơ " +
          reassign.studentCode +
          " sang " +
          (selectedPosition.company?.name ||
            selectedPosition.companyName ||
            "doanh nghiệp mới") +
          ". Sinh viên chuyển sang nhóm chờ doanh nghiệp duyệt.",
      );
      roster.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const cv = async (s: HandoffStudentItem) => {
    setBusy(true);
    setError("");
    try {
      await downloadFile(
        () => getCvFile(s.studentId, s.cv?.id),
        "cv-" + s.studentCode + ".pdf",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const receptionLink = (s?: HandoffStudentItem) =>
    "/qhdn/registration-windows?semester=" +
    semester.semesterId +
    (s ? "&student=" + encodeURIComponent(s.studentCode) : "");
  const loading = semester.loading || roster.loading;
  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Theo dõi & Điều phối OJT"
        description="Theo dõi phản hồi doanh nghiệp, ưu tiên xử lý sinh viên bị từ chối và điều phối lại đến vị trí phù hợp."
        badge="Phòng QHDN"
      />
      <WorkflowSteps current="placement" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {(["UNSENT", "PENDING", "ACCEPTED", "REJECTED"] as const).map((s) => (
          <StatCard
            key={s}
            title={placementLabels[s]}
            value={counts[s]}
            caption={
              s === "UNSENT"
                ? "Đã duyệt, chưa gửi doanh nghiệp"
                : s === "PENDING"
                  ? "Đã gửi, đang đợi phản hồi"
                  : s === "ACCEPTED"
                    ? "Doanh nghiệp đồng ý tiếp nhận"
                    : "Cần chọn vị trí tiếp nhận khác"
            }
            status={s}
            selected={status === s}
            loading={loading}
            onClick={() => {
              setStatus(s);
              setView("tracking");
            }}
          />
        ))}
      </div>
      {counts.REJECTED > 0 && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <XCircle size={22} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-bold text-rose-900">
                {counts.REJECTED} sinh viên cần được điều phối lại
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-700">
                Xem lý do doanh nghiệp từ chối và chọn nơi tiếp nhận khác còn
                chỉ tiêu.
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            onClick={() => {
              setStatus("REJECTED");
              setView("tracking");
            }}
          >
            Xử lý danh sách bị từ chối
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm xl:flex-row xl:items-end">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Danh sách sinh viên sau duyệt hồ sơ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi lượt gửi gần nhất của từng sinh viên trong học kỳ.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <AcademicPeriodFilter selection={semester} disabled={busy} />
          <button
            className={workflowSecondary}
            aria-label="Tải lại điều phối"
            disabled={busy || loading}
            onClick={roster.reload}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>
      {semester.error && <Notice>{semester.error}</Notice>}
      {!semester.loading && semester.selectedPeriod && !semester.semesterId && (
        <Notice>Học kỳ / Block 3 này chưa liên kết kỳ OJT. Chưa có dữ liệu điều phối OJT để hiển thị.</Notice>
      )}
      {roster.error && <Notice>{roster.error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap gap-6 border-b border-slate-200">
        {(
          [
            ["tracking", "Theo dõi điều phối"],
            ["assignments", "Phân công thực tập"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={
              "border-b-2 px-1 py-3.5 text-sm font-semibold " +
              (view === id
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-slate-500")
            }
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "assignments" ? (
        <InternshipAssignments
          semesterId={semester.semesterId}
          accepted={students.filter((s) => placementStatus(s) === "ACCEPTED")}
          onUpdated={roster.reload}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
            <button
              className={
                "rounded-lg px-3 py-2 text-xs font-semibold " +
                (status === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-500")
              }
              onClick={() => setStatus("ALL")}
            >
              Tất cả · {students.length}
            </button>
            {(["UNSENT", "PENDING", "ACCEPTED", "REJECTED"] as const).map(
              (s) => (
                <button
                  key={s}
                  aria-pressed={status === s}
                  className={
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition " +
                    (status === s
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-transparent text-slate-500 hover:bg-slate-50")
                  }
                  onClick={() => setStatus(s)}
                >
                  {placementLabels[s]}
                  <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-600">
                    {counts[s]}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="space-y-3 border-b border-slate-100 p-4 sm:px-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <SlidersHorizontal size={15} />
              Bộ lọc danh sách
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(200px,1.5fr)_1fr_1fr_auto]">
              <label className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-400"
                />
                <input
                  className={workflowInput + " !pl-10"}
                  aria-label="Tìm sinh viên điều phối"
                  placeholder="Tìm tên, MSSV, doanh nghiệp…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                className={workflowInput}
                aria-label="Lọc doanh nghiệp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              >
                <option value="ALL">Tất cả doanh nghiệp</option>
                {[...companies].map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className={workflowInput}
                aria-label="Lọc khóa"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
              >
                <option value="ALL">Tất cả khóa</option>
                {cohorts.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                className={workflowSecondary}
                onClick={() => {
                  setSearch("");
                  setCompany("ALL");
                  setCohort("ALL");
                  setStatus("ALL");
                }}
              >
                <Filter size={15} />
                Đặt lại
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {[
                    "Sinh viên",
                    "Doanh nghiệp / vị trí",
                    "Lần gửi gần nhất",
                    "Trạng thái tiếp nhận",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading &&
                  visible.map((s) => {
                    const state = placementStatus(s);
                    return (
                      <tr
                        key={s.studentId}
                        className={
                          "transition hover:bg-slate-50/80 " +
                          (state === "REJECTED" ? "bg-rose-50/30" : "")
                        }
                      >
                        <td className="px-5 py-4">
                          <StudentIdentity student={s} />
                          <p className="ml-[52px] mt-1 max-w-[210px] text-xs text-slate-500">
                            {programName(s)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Building2
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            {companyName(s)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {s.position?.title ||
                              s.positionTitle ||
                              "Chưa có vị trí tiếp nhận"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {state === "UNSENT"
                            ? "Chưa gửi hồ sơ"
                            : time(s.coordination?.coordinatedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <WorkflowBadge status={state} />
                          {state === "REJECTED" && (
                            <p className="mt-2 max-w-[240px] text-xs leading-5 text-rose-700">
                              {s.coordination?.rejectReason ||
                                "Doanh nghiệp chưa cung cấp lý do."}
                            </p>
                          )}
                          {state === "ACCEPTED" && (
                            <p className="mt-2 text-xs text-emerald-700">
                              {s.assignmentId
                                ? "Đã có phân công thực tập"
                                : "Sẵn sàng lập phân công"}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {state === "REJECTED" ? (
                              <button
                                className={workflowPrimary}
                                onClick={() => openReassign(s)}
                              >
                                <RotateCcw size={15} />
                                Điều phối lại
                              </button>
                            ) : state === "UNSENT" ? (
                              <Link
                                className={workflowSecondary}
                                to={receptionLink(s)}
                              >
                                Xem hồ sơ
                                <ArrowRight size={14} />
                              </Link>
                            ) : (
                              <button
                                className={workflowSecondary}
                                onClick={() => {
                                  setDetail(s);
                                  setError("");
                                }}
                              >
                                <Eye size={15} />
                                Chi tiết
                              </button>
                            )}
                            {state === "REJECTED" && (
                              <button
                                className={workflowSecondary + " !px-2.5"}
                                aria-label={"Chi tiết " + s.studentCode}
                                onClick={() => {
                                  setDetail(s);
                                  setError("");
                                }}
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {(loading || !visible.length) && (
            <EmptyStudents
              loading={loading}
              title={
                status === "REJECTED"
                  ? "Không có sinh viên bị từ chối"
                  : "Không có sinh viên phù hợp"
              }
              description={
                status === "UNSENT"
                  ? "Hồ sơ đã duyệt nhưng chưa có lượt điều phối sẽ hiển thị ở đây."
                  : "Thử đổi bộ lọc hoặc học kỳ. Sinh viên sẽ xuất hiện sau bước duyệt hồ sơ."
              }
            />
          )}
          <footer className="border-t border-slate-100 p-5">
            <Pager
              page={safePage}
              total={filtered.length}
              limit={10}
              busy={loading}
              onChange={setPage}
            />
          </footer>
        </section>
      )}
      {detail && (
        <WorkflowModal
          title="Chi tiết tiếp nhận sinh viên"
          subtitle="Thông tin phản hồi ở lượt điều phối gần nhất."
          busy={busy}
          onClose={() => setDetail(null)}
        >
          <div className="space-y-5">
            <StudentIdentity student={detail} />
            <WorkflowBadge status={placementStatus(detail)} />
            {error && <Notice>{error}</Notice>}
            <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-sm">
              {[
                ["Doanh nghiệp", companyName(detail)],
                [
                  "Vị trí",
                  detail.position?.title ||
                    detail.positionTitle ||
                    "Chưa cập nhật",
                ],
                ["Ngày gửi hồ sơ", time(detail.coordination?.coordinatedAt)],
                ["Ngày phản hồi", time(detail.coordination?.decisionAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            {placementStatus(detail) === "REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="mb-1 font-bold">Lý do doanh nghiệp từ chối</p>
                {detail.coordination?.rejectReason || "Chưa có lý do."}
              </div>
            )}
            {placementStatus(detail) === "PENDING" && (
              <p className="flex gap-2 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <Clock3 size={18} className="mt-1 shrink-0" />
                Hồ sơ đang chờ doanh nghiệp phản hồi. Chỉ điều phối lại sau khi
                doanh nghiệp từ chối.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                className={workflowSecondary}
                disabled={busy || !detail.cv}
                onClick={() => cv(detail)}
              >
                <Download size={15} />
                Tải CV
              </button>
              {placementStatus(detail) === "REJECTED" && (
                <button
                  className={workflowPrimary}
                  onClick={() => openReassign(detail)}
                >
                  <RotateCcw size={15} />
                  Điều phối lại
                </button>
              )}
              {placementStatus(detail) === "ACCEPTED" && (
                <button
                  className={workflowPrimary}
                  onClick={() => {
                    setDetail(null);
                    setView("assignments");
                  }}
                >
                  Quản lý thực tập
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </WorkflowModal>
      )}
      {reassign && (
        <WorkflowModal
          wide
          title="Điều phối lại sinh viên"
          subtitle="Chọn vị trí tiếp nhận khác còn chỉ tiêu để gửi lại hồ sơ."
          busy={busy}
          onClose={() => setReassign(null)}
        >
          <form
            onSubmit={submit}
            className="grid gap-6 md:grid-cols-[0.85fr_1.15fr]"
          >
            <aside className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <StudentIdentity student={reassign} />
              <WorkflowBadge status="REJECTED" />
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
                <p className="font-semibold text-rose-900">
                  {companyName(reassign)}
                </p>
                <p className="mt-1 text-xs text-rose-700">
                  {reassign.position?.title || reassign.positionTitle}
                </p>
                <p className="mt-3 border-t border-rose-100 pt-3 leading-6 text-rose-800">
                  {reassign.coordination?.rejectReason ||
                    "Doanh nghiệp chưa cung cấp lý do từ chối."}
                </p>
              </div>
              <p className="flex gap-2 text-xs leading-5 text-slate-500">
                <Info size={15} className="mt-0.5 shrink-0" />
                Lượt gửi cũ được giữ lại. Hồ sơ chuyển sang chờ doanh nghiệp
                duyệt sau khi gửi lại thành công.
              </p>
            </aside>
            <div className="space-y-4">
              {error && <Notice>{error}</Notice>}
              {positionError && <Notice>{positionError}</Notice>}
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Building2 size={17} className="text-orange-600" />
                Nơi tiếp nhận mới
              </h3>
              {loadingPositions ? (
                <p role="status" className="py-6 text-sm text-slate-500">
                  Đang tìm vị trí đang mở và còn chỉ tiêu…
                </p>
              ) : (
                <>
                  <Field label="Doanh nghiệp">
                    <select
                      className={workflowInput}
                      aria-label="Doanh nghiệp điều phối lại"
                      value={nextCompany}
                      required
                      disabled={busy}
                      onChange={(e) => {
                        setNextCompany(e.target.value);
                        setNextPosition("");
                      }}
                    >
                      <option value="">Chọn doanh nghiệp tiếp nhận</option>
                      {[...nextCompanies].map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Vị trí thực tập">
                    <select
                      className={workflowInput}
                      aria-label="Vị trí điều phối lại"
                      value={nextPosition}
                      required
                      disabled={busy || !nextCompany}
                      onChange={(e) => setNextPosition(e.target.value)}
                    >
                      <option value="">Chọn vị trí còn chỉ tiêu</option>
                      {available
                        .filter((p) => String(p.companyId) === nextCompany)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} · còn {p.remainingSlots} chỗ
                          </option>
                        ))}
                    </select>
                  </Field>
                </>
              )}
              {!loadingPositions && !available.length && (
                <Notice>
                  Hiện chưa có vị trí khác còn chỉ tiêu trong kỳ. Cần cập nhật
                  tuyển dụng trước khi gửi lại.
                </Notice>
              )}
              {selectedPosition && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">
                      {selectedPosition.title}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Còn {selectedPosition.remainingSlots}/
                      {selectedPosition.capacity} chỉ tiêu · Đúng kỳ OJT
                    </p>
                  </div>
                </div>
              )}
              <Field label="Lý do điều phối lại">
                <textarea
                  className={workflowInput}
                  rows={3}
                  required
                  maxLength={2000}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nêu lý do chọn vị trí mới và ghi chú cho doanh nghiệp…"
                />
              </Field>
              <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1 accent-orange-600"
                  checked={confirmed}
                  required
                  disabled={busy}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Tôi đã kiểm tra vị trí mới và xác nhận gửi lại hồ sơ sinh viên.
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className={workflowSecondary}
                  disabled={busy}
                  onClick={() => setReassign(null)}
                >
                  Hủy
                </button>
                <button
                  className={workflowPrimary}
                  disabled={
                    busy ||
                    !selectedPosition ||
                    !confirmed ||
                    !reason.trim() ||
                    loadingPositions ||
                    !!positionError
                  }
                >
                  <Send size={16} />
                  {busy ? "Đang gửi…" : "Gửi lại doanh nghiệp"}
                </button>
              </div>
            </div>
          </form>
        </WorkflowModal>
      )}
    </div>
  );
}
