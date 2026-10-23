import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Send,
} from "lucide-react";
import {
  coordinateStudent,
  getCvFile,
  listApplications,
  listPositions,
  reviewRegistration,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { downloadFile } from "@/utils/downloadFile";
import {
  coordinationId,
  programName,
  receptionNote,
  receptionStatus,
  registrationId,
  registrationStatus,
} from "@/utils/qhdnStudentStatus";
import { errorMessage, Field, Notice, useIdempotencyKey } from "./QhdnUi";
import {
  StudentIdentity,
  WorkflowBadge,
  WorkflowModal,
  workflowInput,
  workflowPrimary,
  workflowSecondary,
} from "./StudentWorkflowUi";
import type {
  HandoffStudentItem,
  PositionListItem,
} from "@/types/qhdn/qhdnTypes";
import type { Application } from "@/types/qhdn/workflowTypes";

export function StudentReviewModal({
  student,
  semesterId,
  onClose,
  onUpdated,
}: {
  student: HandoffStudentItem;
  semesterId: number;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const regId = registrationId(student),
    coordinated = !!coordinationId(student);
  const [approved, setApproved] = useState(
    registrationStatus(student) === "APPROVED",
  );
  const [applications, setApplications] = useState<Application[]>([]),
    [positions, setPositions] = useState<PositionListItem[]>([]);
  const [destination, setDestination] = useState(""),
    [reason, setReason] = useState(""),
    [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const reviewKey = useIdempotencyKey(),
    sendKey = useIdempotencyKey();
  const canProcess =
    !!regId &&
    !coordinated &&
    ["SUBMITTED", "APPROVED"].includes(registrationStatus(student) || "");
  useEffect(() => {
    if (!regId) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([
      loadAllPages((page) =>
        listApplications({
          page,
          limit: 100,
          registrationId: regId,
          ojtSemesterId: semesterId,
        }),
      ),
      canProcess
        ? loadAllPages((page) =>
            listPositions({
              page,
              limit: 100,
              ojtSemesterId: semesterId,
              status: "OPEN",
            }).then((r) => r.data),
          )
        : Promise.resolve([] as PositionListItem[]),
    ])
      .then(([a, p]) => {
        if (!active) return;
        setApplications(a);
        setPositions(p);
        const valid = a.filter(
          (r) => !["REJECTED", "WITHDRAWN"].includes(r.status),
        );
        if (valid.length === 1) setDestination("application:" + valid[0].id);
      })
      .catch((e) => {
        if (active) setLoadError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [regId, semesterId, canProcess]);
  const selectedApplication = applications.find(
    (a) => destination === "application:" + a.id,
  );
  const positionId =
    selectedApplication?.positionId ??
    (destination.startsWith("position:")
      ? Number(destination.split(":")[1])
      : undefined);
  const selectedPosition = positions.find((p) => p.id === positionId);
  const validTarget =
    !!selectedPosition &&
    selectedPosition.remainingSlots > 0 &&
    selectedPosition.status === "OPEN";
  const eligibleApplications = applications.filter(
    (a) => !["REJECTED", "WITHDRAWN"].includes(a.status),
  );
  const cvId =
    selectedApplication?.cvFileId ??
    selectedApplication?.cv?.id ??
    student.cv?.id;
  const cvAvailable = !!(
    selectedApplication?.cv ||
    selectedApplication?.cvFileId ||
    student.cv
  );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      busy ||
      !regId ||
      !validTarget ||
      !checked ||
      !reason.trim() ||
      !canProcess ||
      loadError
    )
      return;
    setBusy(true);
    setError("");
    let approvedNow = approved;
    try {
      if (!approvedNow) {
        const payload = { decision: "APPROVE" as const, reason: reason.trim() };
        await reviewRegistration(regId, {
          ...payload,
          idempotencyKey: reviewKey({ regId, ...payload }),
        });
        approvedNow = true;
        setApproved(true);
        onUpdated("Hồ sơ đã được duyệt. Đang gửi sang doanh nghiệp…");
      }
      const payload = {
        registrationId: regId,
        positionId: selectedPosition!.id,
        ...(selectedApplication
          ? { applicationId: selectedApplication.id }
          : {}),
        reason: reason.trim(),
      };
      // Hai bước độc lập: gửi lại không gọi duyệt lần nữa khi bước đầu đã thành công.
      await coordinateStudent({ ...payload, idempotencyKey: sendKey(payload) });
      onUpdated(
        "Đã duyệt và gửi hồ sơ " +
          student.studentCode +
          " sang doanh nghiệp. Theo dõi phản hồi tại mục Điều phối.",
      );
      onClose();
    } catch (e) {
      const message = errorMessage(e);
      setError(
        (approvedNow
          ? "Hồ sơ đã duyệt nhưng chưa xác nhận gửi thành công. Bạn có thể thử gửi lại. "
          : "") + message,
      );
      if (approvedNow)
        onUpdated("Hồ sơ đã duyệt, bước gửi doanh nghiệp chưa hoàn tất.");
    } finally {
      setBusy(false);
    }
  };
  const getCv = async () => {
    setBusy(true);
    setError("");
    try {
      await downloadFile(
        () => getCvFile(student.studentId, cvId),
        "cv-" + student.studentCode + ".pdf",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <WorkflowModal
      wide
      title={
        canProcess
          ? "Kiểm tra hồ sơ & gửi doanh nghiệp"
          : "Chi tiết hồ sơ sinh viên"
      }
      subtitle="Kiểm tra thông tin sinh viên, CV và nơi tiếp nhận trước khi xác nhận."
      busy={busy}
      onClose={onClose}
    >
      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
          <StudentIdentity student={student} />
          <WorkflowBadge
            status={approved ? "APPROVED" : receptionStatus(student)}
          />
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">
                Chương trình / chuyên ngành
              </dt>
              <dd className="mt-1 font-medium">{programName(student)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email liên hệ</dt>
              <dd className="mt-1 break-all">
                {student.email || "Chưa cập nhật"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Số điện thoại</dt>
              <dd className="mt-1">{student.phone || "Chưa cập nhật"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Ghi chú đăng ký</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {student.registration?.application?.note || "Không có ghi chú."}
              </dd>
            </div>
          </dl>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} className="text-orange-600" />
              CV sinh viên
            </div>
            <p className="mb-3 text-xs text-slate-500">
              {selectedApplication?.cv?.fileName ||
                student.cv?.fileName ||
                (cvAvailable ? "Có CV trong hồ sơ." : "Sinh viên chưa có CV.")}
            </p>
            <button
              className={workflowSecondary + " w-full"}
              disabled={!cvAvailable || busy}
              onClick={getCv}
            >
              <Download size={15} />
              Tải CV để kiểm tra
            </button>
          </div>
          {receptionNote(student) && <Notice>{receptionNote(student)}</Notice>}
        </aside>
        <div className="space-y-4">
          {loadError && <Notice>{loadError}</Notice>}
          {error && <Notice>{error}</Notice>}
          {loading ? (
            <p
              role="status"
              className="py-10 text-center text-sm text-slate-500"
            >
              Đang tải hồ sơ ứng tuyển và nơi tiếp nhận…
            </p>
          ) : canProcess ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 size={18} className="text-orange-600" />
                Nơi nhận hồ sơ
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {applications.length
                  ? "Chọn vị trí sinh viên đã ứng tuyển. Sau khi duyệt, hồ sơ được gửi đến đúng doanh nghiệp này."
                  : "Sinh viên chưa có ứng tuyển. Chọn vị trí còn chỉ tiêu để gửi hồ sơ theo hình thức QHDN giới thiệu."}
              </p>
              <Field
                label={
                  applications.length
                    ? "Nguyện vọng ứng tuyển"
                    : "Doanh nghiệp & vị trí tuyển dụng"
                }
              >
                <select
                  aria-label="Nơi nhận hồ sơ"
                  className={workflowInput}
                  value={destination}
                  disabled={busy || !!loadError}
                  required
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="">Chọn nơi nhận hồ sơ</option>
                  {applications.length
                    ? eligibleApplications.map((a) => {
                        const p = positions.find((p) => p.id === a.positionId);
                        return (
                          <option
                            value={"application:" + a.id}
                            key={a.id}
                            disabled={!p || p.remainingSlots < 1}
                          >
                            {a.company?.name ||
                              p?.companyName ||
                              "Doanh nghiệp #" + a.companyId}{" "}
                            · {a.position?.title || p?.title}{" "}
                            {p && p.remainingSlots > 0
                              ? "(còn " + p.remainingSlots + " chỗ)"
                              : "(chưa thể tiếp nhận)"}
                          </option>
                        );
                      })
                    : positions
                        .filter((p) => p.remainingSlots > 0)
                        .map((p) => (
                          <option key={p.id} value={"position:" + p.id}>
                            {p.company?.name || p.companyName} · {p.title} (còn{" "}
                            {p.remainingSlots} chỗ)
                          </option>
                        ))}
                </select>
              </Field>
              {selectedPosition && (
                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm">
                  <p className="font-bold text-slate-900">
                    {selectedPosition.company?.name ||
                      selectedPosition.companyName}
                  </p>
                  <p className="mt-1 text-slate-600">
                    {selectedPosition.title}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-orange-700">
                    Còn {selectedPosition.remainingSlots}/
                    {selectedPosition.capacity} chỉ tiêu · Cùng kỳ OJT
                  </p>
                </div>
              )}
              {!validTarget && (
                <p className="text-xs text-amber-700">
                  Cần chọn một vị trí đang mở và còn chỉ tiêu trước khi duyệt &
                  gửi.
                </p>
              )}
              <Field label="Ghi chú duyệt & gửi doanh nghiệp">
                <textarea
                  className={workflowInput}
                  rows={3}
                  required
                  maxLength={2000}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi nhận kết quả kiểm tra hồ sơ và lý do gửi doanh nghiệp…"
                />
              </Field>
              <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1 accent-orange-600"
                  checked={checked}
                  disabled={busy}
                  onChange={(e) => setChecked(e.target.checked)}
                  required
                />
                Tôi đã kiểm tra hồ sơ và xác nhận đúng doanh nghiệp, vị trí tiếp
                nhận.
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-3 text-xs text-slate-500">
                <span
                  className={approved ? "text-emerald-600" : "text-orange-600"}
                >
                  {approved ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <FileCheck2 size={16} />
                  )}
                </span>
                {approved ? "Đã duyệt hồ sơ" : "Duyệt hồ sơ"}
                <ArrowRight size={13} />
                <Send size={15} />
                <span>Gửi doanh nghiệp</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className={workflowSecondary}
                  onClick={onClose}
                  disabled={busy}
                >
                  Để sau
                </button>
                <button
                  className={workflowPrimary}
                  disabled={
                    busy ||
                    !validTarget ||
                    !checked ||
                    !reason.trim() ||
                    !!loadError
                  }
                >
                  <Send size={16} />
                  {busy
                    ? "Đang xử lý…"
                    : approved
                      ? "Gửi lại doanh nghiệp"
                      : "Duyệt & gửi doanh nghiệp"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5">
                <FileCheck2 className="mb-3 text-orange-600" size={24} />
                <h3 className="font-semibold text-slate-900">
                  {coordinated
                    ? "Hồ sơ đã được gửi doanh nghiệp"
                    : regId
                      ? "Hồ sơ chưa thể duyệt"
                      : "Sinh viên chưa đăng ký"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {coordinated
                    ? "Theo dõi kết quả tiếp nhận và điều phối lại tại màn hình Điều phối OJT."
                    : receptionNote(student) ||
                      "Sinh viên cần nộp hồ sơ đăng ký OJT trước khi thực hiện bước duyệt và gửi doanh nghiệp."}
                </p>
              </div>
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-100 p-3 text-sm"
                >
                  <p className="font-semibold">
                    {a.company?.name || "Doanh nghiệp #" + a.companyId}
                  </p>
                  <p className="text-slate-500">
                    {a.position?.title || "Vị trí #" + a.positionId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkflowModal>
  );
}
