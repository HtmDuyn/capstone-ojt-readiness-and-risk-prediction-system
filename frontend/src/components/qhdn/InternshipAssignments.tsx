import { useState, type FormEvent } from "react";
import { CalendarDays, Plus, UserRound } from "lucide-react";
import {
  assignInternship,
  editInternship,
  listAssignments,
} from "@/services/qhdnService";
import { coordinationId } from "@/utils/qhdnStudentStatus";
import { errorMessage, Field, Notice, Pager, usePaged } from "./QhdnUi";
import {
  EmptyStudents,
  WorkflowModal,
  workflowInput,
  workflowPrimary,
  workflowSecondary,
} from "./StudentWorkflowUi";
import type {
  AssignmentItem,
  HandoffStudentItem,
} from "@/types/qhdn/qhdnTypes";

export function InternshipAssignments({
  semesterId,
  accepted,
  onUpdated,
}: {
  semesterId: string;
  accepted: HandoffStudentItem[];
  onUpdated: () => void;
}) {
  const data = usePaged(
    (page) =>
      listAssignments({
        ojtSemesterId: Number(semesterId),
        page,
        limit: 10,
      }).then((r) => r.data),
    semesterId,
    !!semesterId,
  );
  const [task, setTask] = useState<{ assignment?: AssignmentItem } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const unassigned = accepted.filter((s) => !s.assignmentId && !s.assignment);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task || busy) return;
    const form = new FormData(e.currentTarget),
      value = (k: string) => String(form.get(k) || "").trim();
    const status = value("status"),
      reason = value("reason");
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      if (status && task.assignment)
        await editInternship(task.assignment.id, {
          status: status as "ACTIVE" | "COMPLETED" | "CANCELLED",
          reason,
        });
      else {
        if (value("endDate") < value("startDate"))
          throw new Error("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
        const payload = {
          startDate: value("startDate"),
          endDate: value("endDate"),
          enterpriseSupervisorName: value("supervisor"),
          reason,
        };
        if (task.assignment) await editInternship(task.assignment.id, payload);
        else
          await assignInternship({
            ...payload,
            coordinationId: Number(value("coordinationId")),
          });
      }
      setTask(null);
      setMessage("Đã cập nhật phân công thực tập.");
      data.reload();
      onUpdated();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">
            Quản lý thực tập sau tiếp nhận
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ lập phân công cho sinh viên đã được doanh nghiệp tiếp nhận.
          </p>
        </div>
        <button
          className={workflowPrimary}
          disabled={!unassigned.length}
          onClick={() => {
            setTask({});
            setError("");
          }}
        >
          <Plus size={16} />
          Tạo phân công
        </button>
      </div>
      {message && <Notice>{message}</Notice>}
      {data.error && <Notice>{data.error}</Notice>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {[
                  "Sinh viên / doanh nghiệp",
                  "Thời gian thực tập",
                  "Người hướng dẫn",
                  "Tiến độ",
                  "Thao tác",
                ].map((h) => (
                  <th className="px-5 py-4" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data.busy &&
                data.data.items.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {a.student?.fullName || "Chưa cập nhật"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {a.company?.name || "Chưa cập nhật"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <CalendarDays size={15} className="mb-1 text-slate-400" />
                      {a.startDate?.slice(0, 10) || "—"} →{" "}
                      {a.endDate?.slice(0, 10) || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <UserRound size={15} className="mb-1 text-slate-400" />
                      {a.enterpriseSupervisorName || "Chưa cập nhật"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {
                          {
                            ASSIGNED: "Đã phân công",
                            ACTIVE: "Đang thực tập",
                            IN_PROGRESS: "Đang thực tập",
                            COMPLETED: "Hoàn thành",
                            FAILED: "Không đạt",
                            CANCELLED: "Đã hủy",
                          }[a.status]
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className={workflowSecondary}
                        disabled={
                          !["ASSIGNED", "ACTIVE", "IN_PROGRESS"].includes(
                            a.status,
                          )
                        }
                        onClick={() => {
                          setTask({ assignment: a });
                          setError("");
                        }}
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {(data.busy || !data.data.items.length) && (
          <EmptyStudents
            loading={data.busy}
            title="Chưa có phân công thực tập"
            description="Sau khi doanh nghiệp tiếp nhận, bạn có thể tạo phân công cho sinh viên tại đây."
          />
        )}
        <div className="border-t border-slate-100 p-5">
          <Pager
            page={data.page}
            total={data.data.total}
            limit={data.data.limit}
            busy={data.busy}
            onChange={data.setPage}
          />
        </div>
      </div>
      {task && (
        <WorkflowModal
          title={
            task.assignment
              ? "Cập nhật phân công thực tập"
              : "Tạo phân công thực tập"
          }
          busy={busy}
          onClose={() => setTask(null)}
        >
          <form onSubmit={submit} className="space-y-4">
            {error && <Notice>{error}</Notice>}
            {!task.assignment && (
              <Field label="Sinh viên đã được tiếp nhận">
                <select
                  className={workflowInput}
                  name="coordinationId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Chọn sinh viên
                  </option>
                  {unassigned.map((s) => (
                    <option key={s.studentId} value={coordinationId(s)}>
                      {s.studentCode} · {s.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {task.assignment && (
              <Field label="Trạng thái (để trống nếu chỉ sửa thông tin)">
                <select className={workflowInput} name="status">
                  <option value="">Giữ trạng thái hiện tại</option>
                  {task.assignment.status === "ASSIGNED" ? (
                    <option value="ACTIVE">Bắt đầu thực tập</option>
                  ) : (
                    <option value="COMPLETED">
                      Hoàn thành (cần có đánh giá)
                    </option>
                  )}
                  <option value="CANCELLED">Hủy phân công</option>
                </select>
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ngày bắt đầu">
                <input
                  className={workflowInput}
                  name="startDate"
                  type="date"
                  required
                  defaultValue={task.assignment?.startDate?.slice(0, 10)}
                />
              </Field>
              <Field label="Ngày kết thúc">
                <input
                  className={workflowInput}
                  name="endDate"
                  type="date"
                  required
                  defaultValue={task.assignment?.endDate?.slice(0, 10)}
                />
              </Field>
            </div>
            <Field label="Người hướng dẫn doanh nghiệp">
              <input
                className={workflowInput}
                name="supervisor"
                maxLength={100}
                defaultValue={task.assignment?.enterpriseSupervisorName || ""}
              />
            </Field>
            <Field label="Lý do">
              <textarea
                className={workflowInput}
                name="reason"
                required
                maxLength={2000}
                rows={3}
              />
            </Field>
            <p className="text-xs text-slate-500">
              Khi chọn trạng thái mới, chỉ trạng thái và lý do được cập nhật.
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                className={workflowSecondary}
                type="button"
                disabled={busy}
                onClick={() => setTask(null)}
              >
                Hủy
              </button>
              <button className={workflowPrimary} disabled={busy}>
                {busy ? "Đang lưu…" : "Xác nhận"}
              </button>
            </div>
          </form>
        </WorkflowModal>
      )}
    </div>
  );
}
