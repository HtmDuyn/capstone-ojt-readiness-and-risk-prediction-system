import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";
import { Pager, Notice, Field, errorMessage } from "@/components/qhdn/QhdnUi";
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
import { useQhdnRoster, useQhdnSemesters } from "@/hooks/useQhdnRoster";
import {
  closeRegistrationWindow,
  createRegistrationWindow,
  listRegistrationWindows,
  openRegistrationWindow,
  updateRegistrationWindow,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import {
  coordinationId,
  programName,
  receptionLabels,
  receptionNote,
  receptionStatus,
  studentMatches,
  type ReceptionStatus,
} from "@/utils/qhdnStudentStatus";
import type {
  RegistrationWindowItem,
} from "@/types/qhdn/qhdnTypes";
const head =
  "px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500";
const cell = "px-5 py-4 align-middle";
const localDate = (s: string) =>
  new Date(s).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
export default function QhdnRegistrationWindows() {
  const [url] = useSearchParams();
  const semester = useQhdnSemesters(url.get("semester") || "");
  const roster = useQhdnRoster(semester.semesterId, "eligible");
  const [tab, setTab] = useState<"students" | "windows">("students");
  const [search, setSearch] = useState(url.get("student") || ""),
    [status, setStatus] = useState<ReceptionStatus | "ALL">("ALL"),
    [program, setProgram] = useState("ALL"),
    [cohort, setCohort] = useState("ALL");
  const [page, setPage] = useState(1),
    [windowPage, setWindowPage] = useState(1),
    [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [windows, setWindows] = useState<RegistrationWindowItem[]>([]),
    [windowLoading, setWindowLoading] = useState(false),
    [windowError, setWindowError] = useState(""),
    [revision, setRevision] = useState(0);
  const [windowTask, setWindowTask] = useState<{
      kind: "create" | "extend" | "toggle";
      window?: RegistrationWindowItem;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [taskError, setTaskError] = useState(""),
    [createdId, setCreatedId] = useState<number | null>(null);
  const refresh = () => {
    roster.reload();
    setRevision((v) => v + 1);
  };
  useEffect(() => {
    let active = true;
    setWindows([]);
    setWindowError("");
    if (!semester.semesterId) {
      setWindowLoading(false);
      return;
    }
    setWindowLoading(true);
    loadAllPages((page) =>
      listRegistrationWindows({
        ojtSemesterId: Number(semester.semesterId),
        page,
        limit: 100,
      }).then((r) => r.data),
    )
      .then((r) => {
        if (active) setWindows(r);
      })
      .catch((e) => {
        if (active) setWindowError(errorMessage(e));
      })
      .finally(() => {
        if (active) setWindowLoading(false);
      });
    return () => {
      active = false;
    };
  }, [semester.semesterId, revision]);
  useEffect(() => {
    setPage(1);
  }, [search, status, program, cohort, semester.semesterId]);
  useEffect(() => {
    setSelectedIds([]);
    setWindowTask(null);
    setWindowPage(1);
    setMessage("");
  }, [semester.semesterId]);
  const counts = useMemo(
    () =>
      roster.students.reduce(
        (a, s) => {
          a[receptionStatus(s)]++;
          return a;
        },
        { NOT_REGISTERED: 0, SUBMITTED: 0, APPROVED: 0 },
      ),
    [roster.students],
  );
  const programs = [...new Set(roster.students.map(programName))].sort();
  const cohorts = [
    ...new Set(
      roster.students.map((s) => s.cohortName).filter((s): s is string => !!s),
    ),
  ].sort();
  const filtered = roster.students.filter(
    (s) =>
      (status === "ALL" || receptionStatus(s) === status) &&
      (program === "ALL" || programName(s) === program) &&
      (cohort === "ALL" || s.cohortName === cohort) &&
      studentMatches(s, search),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))),
    visible = filtered.slice((safePage - 1) * 10, safePage * 10);
  const selected = roster.students.filter((s) =>
    selectedIds.includes(s.studentId),
  );
  const allSelected =
    filtered.length > 0 &&
    filtered.every((s) => selectedIds.includes(s.studentId));
  const toggleAll = () =>
    setSelectedIds((ids) =>
      allSelected
        ? ids.filter((id) => !filtered.some((s) => s.studentId === id))
        : [...new Set([...ids, ...filtered.map((s) => s.studentId)])],
    );
  const openWindowTask = (
    kind: "create" | "extend" | "toggle",
    window?: RegistrationWindowItem,
  ) => {
    setWindowTask({ kind, window });
    setTaskError("");
    setCreatedId(null);
  };
  const windowSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!windowTask || busy || !semester.semesterId) return;
    const form = new FormData(e.currentTarget),
      value = (k: string) => String(form.get(k) || "").trim(),
      reason = value("reason");
    if (!reason) return;
    setBusy(true);
    setTaskError("");
    try {
      if (windowTask.kind === "create") {
        const target = selected.length ? selected : roster.students;
        if (!target.length || target.length > 1000)
          throw new Error(
            "Phạm vi cần có từ 1 đến 1.000 sinh viên đã bàn giao.",
          );
        const start = new Date(value("startsAt")),
          end = new Date(value("endsAt"));
        if (end <= start)
          throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu.");
        let id = createdId;
        if (!id) {
          const result = await createRegistrationWindow({
            ojtSemesterId: Number(semester.semesterId),
            name: value("name"),
            scope: { studentIds: target.map((s) => s.studentId) },
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            reason,
          });
          id = result.data.id;
          setCreatedId(id);
        }
        if (form.get("autoOpen")) await openRegistrationWindow(id, reason);
        setMessage(
          "Đã tạo đợt đăng ký" +
            (form.get("autoOpen")
              ? " và mở cho sinh viên."
              : " ở trạng thái nháp."),
        );
      } else if (windowTask.kind === "extend") {
        const endsAt = new Date(value("endsAt"));
        if (endsAt <= new Date(windowTask.window!.endsAt))
          throw new Error("Hạn mới phải sau hạn hiện tại.");
        await updateRegistrationWindow(windowTask.window!.id, {
          endsAt: endsAt.toISOString(),
          reason,
        });
        setMessage("Đã gia hạn đợt đăng ký.");
      } else {
        const w = windowTask.window!;
        if (w.status === "OPEN") await closeRegistrationWindow(w.id, reason);
        else await openRegistrationWindow(w.id, reason);
        setMessage(
          w.status === "OPEN" ? "Đã đóng đợt đăng ký." : "Đã mở đợt đăng ký.",
        );
      }
      setWindowTask(null);
      refresh();
    } catch (e) {
      setTaskError(errorMessage(e));
      setRevision((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };
  const loading = roster.loading || semester.loading;
  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Mở đợt & Theo dõi đăng ký OJT"
        description="Mở đợt đăng ký cho sinh viên đã được bàn giao và theo dõi trạng thái hồ sơ gửi trực tiếp đến doanh nghiệp."
        badge="Phòng QHDN"
      />
      <WorkflowSteps current="reception" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["NOT_REGISTERED", "SUBMITTED", "APPROVED"] as const).map((s) => (
          <StatCard
            key={s}
            title={receptionLabels[s]}
            value={counts[s]}
            caption={
              s === "NOT_REGISTERED"
                ? "Đã bàn giao, chưa nộp hồ sơ"
                : s === "SUBMITTED"
                  ? "Đơn đã được gửi trực tiếp đến doanh nghiệp"
                  : "Trạng thái hồ sơ OJT cũ"
            }
            status={s}
            selected={status === s}
            loading={loading}
            onClick={() => {
              setStatus(s);
              setTab("students");
            }}
          />
        ))}
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Users size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Danh sách Phòng Đào tạo bàn giao
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Đang tải dữ liệu…"
                : roster.students.length + " sinh viên trong học kỳ"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <AcademicPeriodFilter selection={semester} disabled={busy} />
          <button
            aria-label="Tải lại danh sách"
            className={workflowSecondary}
            onClick={refresh}
            disabled={loading || busy}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>
      {semester.error && <Notice>{semester.error}</Notice>}
      {!semester.loading && semester.selectedPeriod && !semester.semesterId && (
        <Notice>Học kỳ / Block 3 này chưa liên kết kỳ OJT. Chưa có danh sách bàn giao hoặc đợt đăng ký OJT để hiển thị.</Notice>
      )}
      {roster.error && <Notice>{roster.error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex gap-5">
          <button
            className={
              "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-semibold " +
              (tab === "students"
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-slate-500")
            }
            onClick={() => setTab("students")}
          >
            <FileCheck2 size={17} />
            Hồ sơ sinh viên
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">
              {roster.students.length}
            </span>
          </button>
          <button
            className={
              "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-semibold " +
              (tab === "windows"
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-slate-500")
            }
            onClick={() => setTab("windows")}
          >
            <CalendarDays size={17} />
            Đợt đăng ký
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">
              {windows.length}
            </span>
          </button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 pb-3 lg:w-auto lg:pb-0">
          <Link
            to={
              "/qhdn/coordination" +
              (semester.semesterId ? "?semester=" + semester.semesterId : "")
            }
            className="inline-flex items-center gap-2 py-3 text-xs font-semibold text-orange-700"
          >
            Theo dõi doanh nghiệp phản hồi
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            className={workflowPrimary + " w-full sm:w-auto"}
            disabled={busy || loading || !semester.semesterId}
            onClick={() => openWindowTask("create")}
          >
            <Plus size={17} />
            Mở đợt đăng ký
          </button>
        </div>
      </div>
      {tab === "students" ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <SlidersHorizontal size={15} />
              Tìm kiếm & bộ lọc
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(200px,1.5fr)_1fr_1fr_1fr_auto]">
              <label className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-3 text-slate-400"
                />
                <input
                  aria-label="Tìm sinh viên tiếp nhận"
                  className={workflowInput + " !pl-10"}
                  placeholder="Tìm tên, MSSV, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Trạng thái hồ sơ"
                className={workflowInput}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ReceptionStatus | "ALL")
                }
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(receptionLabels).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Chương trình đào tạo"
                className={workflowInput}
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="ALL">Tất cả chương trình</option>
                {programs.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                aria-label="Khóa sinh viên"
                className={workflowInput}
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
                  setStatus("ALL");
                  setProgram("ALL");
                  setCohort("ALL");
                }}
              >
                <Filter size={15} />
                Đặt lại
              </button>
            </div>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50 px-5 py-3 text-sm">
              <span className="font-semibold text-orange-800">
                Đã chọn {selected.length} sinh viên{" "}
                <span className="font-normal">để mở đăng ký</span>
              </span>
              <div className="flex gap-2">
                <button
                  className={workflowSecondary}
                  onClick={() => setSelectedIds([])}
                >
                  Bỏ chọn
                </button>
                <button
                  className={workflowPrimary}
                  disabled={loading}
                  onClick={() => openWindowTask("create")}
                >
                  <Plus size={15} />
                  Mở đợt cho danh sách đã chọn
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="w-12 px-5 py-4">
                    <input
                      aria-label={
                        "Chọn tất cả " +
                        filtered.length +
                        " sinh viên theo bộ lọc"
                      }
                      type="checkbox"
                      className="h-4 w-4 accent-orange-600"
                      checked={allSelected}
                      disabled={loading || !filtered.length}
                      onChange={toggleAll}
                    />
                  </th>
                  {[
                    "Sinh viên",
                    "Chương trình / khóa",
                    "Hồ sơ đăng ký",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th className={head} key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading &&
                  visible.map((s) => {
                    const state = receptionStatus(s),
                      sent = !!coordinationId(s);
                    return (
                      <tr
                        key={s.studentId}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5">
                          <input
                            type="checkbox"
                            aria-label={"Chọn " + s.studentCode}
                            className="h-4 w-4 accent-orange-600"
                            checked={selectedIds.includes(s.studentId)}
                            onChange={() =>
                              setSelectedIds((ids) =>
                                ids.includes(s.studentId)
                                  ? ids.filter((id) => id !== s.studentId)
                                  : [...ids, s.studentId],
                              )
                            }
                          />
                        </td>
                        <td className={cell}>
                          <StudentIdentity student={s} />
                        </td>
                        <td className={cell}>
                          <p className="max-w-[210px] font-medium text-slate-700">
                            {programName(s)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {s.cohortName || "Chưa có khóa"}
                            {s.groupCode ? " · Nhóm " + s.groupCode : ""}
                          </p>
                        </td>
                        <td className={cell}>
                          <p className="max-w-[190px] text-xs text-slate-600">
                            {s.window?.name || "Chưa có đợt đăng ký"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {s.registration?.registeredAt
                              ? localDate(s.registration.registeredAt)
                              : "Chưa ghi nhận thời gian nộp"}
                          </p>
                          {receptionNote(s) && (
                            <p className="mt-1 max-w-[220px] text-xs text-amber-700">
                              {receptionNote(s)}
                            </p>
                          )}
                        </td>
                        <td className={cell}>
                          <WorkflowBadge status={state} />
                          {state === "APPROVED" && (
                            <p
                              className={
                                "mt-2 text-xs " +
                                (sent ? "text-emerald-700" : "text-orange-700")
                              }
                            >
                              {sent
                                ? "Đã gửi doanh nghiệp"
                                : "Chưa gửi doanh nghiệp"}
                            </p>
                          )}
                        </td>
                        <td className={cell}>
                          <div className="text-right text-xs font-semibold text-slate-600">
                            {state === "SUBMITTED"
                              ? sent
                                ? "Đã gửi doanh nghiệp"
                                : "Đã nộp trực tiếp"
                              : state === "APPROVED"
                                ? "Hồ sơ cũ — theo dõi"
                                : "Chưa đăng ký"}
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
              description={
                roster.error
                  ? "Chưa tải được dữ liệu. Vui lòng thử lại."
                  : "Danh sách hiển thị sinh viên đã được bàn giao trong kỳ. Thử đổi bộ lọc hoặc học kỳ."
              }
            />
          )}
          <footer className="border-t border-slate-100 p-4 sm:px-5">
            <Pager
              page={safePage}
              total={filtered.length}
              limit={10}
              busy={loading}
              onChange={setPage}
            />
          </footer>
        </section>
      ) : (
        <div className="space-y-4">
          {windowError && <Notice>{windowError}</Notice>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Quản lý thời hạn sinh viên nộp hồ sơ OJT.
            </p>
            <button
              className={workflowPrimary}
              disabled={!semester.semesterId || loading}
              onClick={() => openWindowTask("create")}
            >
              <Plus size={16} />
              Tạo đợt đăng ký
            </button>
          </div>
          {windowLoading || !windows.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <EmptyStudents
                loading={windowLoading}
                title="Chưa có đợt đăng ký"
                description="Tạo đợt cho danh sách sinh viên được bàn giao để bắt đầu tiếp nhận hồ sơ."
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {windows
                .slice((windowPage - 1) * 10, windowPage * 10)
                .map((w) => (
                  <article
                    key={w.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-xl bg-orange-50 p-3 text-orange-600">
                        <CalendarDays size={21} />
                      </span>
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-semibold " +
                          (w.status === "OPEN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600")
                        }
                      >
                        {w.status === "OPEN"
                          ? "Đang mở"
                          : w.status === "DRAFT"
                            ? "Bản nháp"
                            : "Đã đóng"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-slate-900">{w.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {localDate(w.startsAt)} → {localDate(w.endsAt)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Phạm vi:{" "}
                      {w.scope?.studentIds?.length
                        ? w.scope.studentIds.length + " sinh viên được chọn"
                        : "Theo phạm vi đã thiết lập"}
                    </p>
                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        className={workflowSecondary}
                        onClick={() => openWindowTask("extend", w)}
                      >
                        Gia hạn
                      </button>
                      <button
                        className={
                          w.status === "OPEN"
                            ? workflowSecondary
                            : workflowPrimary
                        }
                        onClick={() => openWindowTask("toggle", w)}
                      >
                        {w.status === "OPEN" ? "Đóng đăng ký" : "Mở đăng ký"}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
          <Pager
            page={windowPage}
            total={windows.length}
            limit={10}
            busy={windowLoading}
            onChange={setWindowPage}
          />
        </div>
      )}
      {windowTask && (
        <WorkflowModal
          title={
            windowTask.kind === "create"
              ? "Mở đợt đăng ký OJT"
              : windowTask.kind === "extend"
                ? "Gia hạn đăng ký"
                : windowTask.window?.status === "OPEN"
                  ? "Đóng đợt đăng ký"
                  : "Mở lại đợt đăng ký"
          }
          subtitle="Kiểm tra phạm vi và thời hạn trước khi xác nhận."
          busy={busy}
          onClose={() => setWindowTask(null)}
        >
          <form onSubmit={windowSubmit} className="space-y-4">
            {taskError && (
              <Notice>
                {createdId
                  ? "Đợt đã được tạo nhưng chưa mở thành công. Có thể thử mở lại. "
                  : ""}
                {taskError}
              </Notice>
            )}
            {windowTask.kind === "create" && (
              <>
                <Notice>
                  Áp dụng cho {selected.length || roster.students.length} sinh
                  viên {selected.length ? "đã chọn" : "được bàn giao trong kỳ"}.
                </Notice>
                <Field label="Tên đợt đăng ký">
                  <input
                    className={workflowInput}
                    name="name"
                    required
                    maxLength={150}
                    disabled={!!createdId}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Bắt đầu">
                    <input
                      className={workflowInput}
                      type="datetime-local"
                      name="startsAt"
                      required
                      disabled={!!createdId}
                    />
                  </Field>
                  <Field label="Kết thúc">
                    <input
                      className={workflowInput}
                      type="datetime-local"
                      name="endsAt"
                      required
                      disabled={!!createdId}
                    />
                  </Field>
                </div>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="autoOpen"
                    defaultChecked
                    className="accent-orange-600"
                  />
                  Mở đăng ký ngay sau khi tạo
                </label>
              </>
            )}
            {windowTask.kind === "extend" && (
              <Field
                label={
                  "Hạn mới (sau " + localDate(windowTask.window!.endsAt) + ")"
                }
              >
                <input
                  className={workflowInput}
                  type="datetime-local"
                  name="endsAt"
                  required
                />
              </Field>
            )}
            {windowTask.kind === "toggle" && (
              <Notice>
                {windowTask.window!.name} ·{" "}
                {windowTask.window!.status === "OPEN"
                  ? "Sinh viên sẽ ngừng nộp hồ sơ trong đợt này."
                  : "Đợt cần còn hạn và có sinh viên được bàn giao trong phạm vi."}
              </Notice>
            )}
            <Field label="Lý do">
              <textarea
                className={workflowInput}
                name="reason"
                required
                maxLength={2000}
                rows={3}
              />
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className={workflowSecondary}
                disabled={busy}
                onClick={() => setWindowTask(null)}
              >
                Hủy
              </button>
              <button
                className={workflowPrimary}
                disabled={
                  busy ||
                  !semester.semesterId ||
                  (windowTask.kind === "create" && !roster.students.length)
                }
              >
                <CheckCircle2 size={16} />
                {busy ? "Đang xử lý…" : createdId ? "Thử mở lại" : "Xác nhận"}
              </button>
            </div>
          </form>
        </WorkflowModal>
      )}
    </div>
  );
}
