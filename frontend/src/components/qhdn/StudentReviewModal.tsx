import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { getCvFile, listApplications, reviewRegistration } from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { downloadFile } from "@/utils/downloadFile";
import { coordinationId, programName, receptionNote, receptionStatus, registrationId, registrationStatus } from "@/utils/qhdnStudentStatus";
import { errorMessage, Field, Notice, useIdempotencyKey } from "./QhdnUi";
import { StudentIdentity, WorkflowBadge, WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from "./StudentWorkflowUi";
import type { HandoffStudentItem } from "@/types/qhdn/qhdnTypes";
import type { Application } from "@/types/qhdn/workflowTypes";

export function StudentReviewModal({ student, semesterId, onClose, onUpdated }: {
  student: HandoffStudentItem;
  semesterId: number;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const regId = registrationId(student);
  const canReview = !!regId && !coordinationId(student) && registrationStatus(student) === "SUBMITTED";
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(""), [checked, setChecked] = useState(false);
  const [error, setError] = useState(""), [loadError, setLoadError] = useState("");
  const keyFor = useIdempotencyKey();
  useEffect(() => {
    if (!regId) return;
    let active = true;
    setLoading(true);
    loadAllPages(page => listApplications({ page, limit: 100, registrationId: regId, ojtSemesterId: semesterId }))
      .then(items => { if (active) setApplications(items); })
      .catch(e => { if (active) setLoadError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [regId, semesterId]);
  const getCv = async (cvId?: number | null) => {
    setBusy(true);
    setError("");
    try { await downloadFile(() => getCvFile(student.studentId, cvId), "cv-" + student.studentCode + ".pdf"); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const approve = async (event: FormEvent) => {
    event.preventDefault();
    if (!canReview || busy || loading || loadError || !checked || !reason.trim()) return;
    const payload = { decision: "APPROVE" as const, reason: reason.trim() };
    setBusy(true);
    setError("");
    try {
      await reviewRegistration(regId!, { ...payload, idempotencyKey: keyFor({ regId, ...payload }) });
      onUpdated("Đã duyệt hồ sơ " + student.studentCode + ".");
      onClose();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  return (
    <WorkflowModal wide title={canReview ? "Kiểm tra & Duyệt hồ sơ OJT" : "Chi tiết hồ sơ sinh viên"} subtitle="Kiểm tra thông tin sinh viên, CV và hồ sơ ứng tuyển." busy={busy} onClose={onClose}>
      <div className="grid gap-6 md:grid-cols-2">
        <aside className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <StudentIdentity student={student} />
          <WorkflowBadge status={receptionStatus(student)} />
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-slate-500">Chương trình / chuyên ngành</dt><dd className="mt-1">{programName(student)}</dd></div>
            <div><dt className="text-xs text-slate-500">Email liên hệ</dt><dd className="mt-1 break-all">{student.email || "Chưa cập nhật"}</dd></div>
            <div><dt className="text-xs text-slate-500">Số điện thoại</dt><dd className="mt-1">{student.phone || "Chưa cập nhật"}</dd></div>
            <div><dt className="text-xs text-slate-500">Ghi chú đăng ký</dt><dd className="mt-1 whitespace-pre-wrap">{student.registration?.application?.note || "Không có ghi chú."}</dd></div>
          </dl>
          <button className={workflowSecondary} disabled={!student.cv || busy} onClick={() => getCv(student.cv?.id)}><Download size={15} /> Tải CV sinh viên</button>
          {receptionNote(student) && <Notice>{receptionNote(student)}</Notice>}
        </aside>
        <div className="space-y-4">
          {error && <Notice>{error}</Notice>}
          {loadError && <Notice>{loadError}</Notice>}
          {loading ? <p role="status">Đang tải hồ sơ ứng tuyển…</p> : applications.map(application => (
            <div key={application.id} className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
              <p className="font-semibold">{application.company?.name || "Doanh nghiệp #" + application.companyId}</p>
              <p>{application.position?.title || "Vị trí #" + application.positionId}</p>
              <p className="text-slate-500">{application.status}</p>
              {(application.cv || application.cvFileId) && <button className={workflowSecondary} disabled={busy} onClick={() => getCv(application.cvFileId ?? application.cv?.id)}><FileText size={15} /> Tải CV ứng tuyển</button>}
            </div>
          ))}
          {canReview ? (
            <form onSubmit={approve} className="space-y-4">
              <Field label="Lý do duyệt hồ sơ"><textarea className={workflowInput} required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></Field>
              <label className="flex gap-2 text-sm"><input type="checkbox" required checked={checked} onChange={e => setChecked(e.target.checked)} disabled={busy} /> Tôi đã kiểm tra thông tin và CV của sinh viên.</label>
              <button className={workflowPrimary} disabled={busy || loading || !!loadError || !checked || !reason.trim()}><CheckCircle2 size={16} /> {busy ? "Đang xử lý…" : "Duyệt hồ sơ"}</button>
            </form>
          ) : <Notice>{registrationStatus(student) === "APPROVED" ? "Hồ sơ đã được duyệt." : "Hồ sơ hiện không ở trạng thái chờ duyệt."}</Notice>}
        </div>
      </div>
    </WorkflowModal>
  );
}
