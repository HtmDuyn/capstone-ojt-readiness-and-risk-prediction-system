import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, RefreshCw, Search } from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";
import { AcademicPeriodFilter, StudentIdentity, WorkflowBadge, workflowInput, workflowSecondary } from "@/components/qhdn/StudentWorkflowUi";
import { Notice, Pager } from "@/components/qhdn/QhdnUi";
import { useQhdnRoster, useQhdnSemesters } from "@/hooks/useQhdnRoster";
import {
  companyName,
  coordinationId,
  placementLabels,
  placementStatus,
  studentMatches,
  type PlacementStatus,
} from "@/utils/qhdnStudentStatus";

const time = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
    : "Chưa cập nhật";

export default function QhdnOjtCoordination() {
  const [url] = useSearchParams();
  const semester = useQhdnSemesters(url.get("semester") || "");
  const roster = useQhdnRoster(semester.semesterId);
  const [status, setStatus] = useState<PlacementStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const applications = useMemo(
    () => roster.students.filter((student) => !!coordinationId(student)),
    [roster.students],
  );
  const counts = useMemo(
    () =>
      applications.reduce(
        (result, student) => {
          result[placementStatus(student)] += 1;
          return result;
        },
        { UNSENT: 0, PENDING: 0, ACCEPTED: 0, REJECTED: 0 },
      ),
    [applications],
  );
  const filtered = applications.filter(
    (student) =>
      (status === "ALL" || placementStatus(student) === status) &&
      studentMatches(student, search),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const visible = filtered.slice((safePage - 1) * 10, safePage * 10);

  useEffect(() => setPage(1), [status, search, semester.semesterId]);

  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Theo dõi hồ sơ OJT"
        description="Theo dõi trạng thái các hồ sơ sinh viên đã gửi trực tiếp đến doanh nghiệp. Doanh nghiệp phản hồi và tiếp nhận sinh viên; assignment được tạo tự động khi chấp nhận."
        badge="Phòng QHDN"
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {(["PENDING", "ACCEPTED", "REJECTED"] as const).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setStatus(status === value ? "ALL" : value)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              status === value
                ? "border-orange-300 bg-orange-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-sm font-semibold text-slate-600">{placementLabels[value]}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts[value]}</p>
          </button>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Tổng hồ sơ trực tiếp</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{applications.length}</p>
        </div>
      </div>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Hồ sơ gửi đến doanh nghiệp</h2>
          <p className="mt-1 text-xs text-slate-500">Chỉ xem và theo dõi; không cần điều phối hoặc lập phân công thủ công.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <AcademicPeriodFilter selection={semester} />
          <button type="button" className={workflowSecondary} aria-label="Làm mới danh sách" disabled={roster.loading} onClick={roster.reload}>
            <RefreshCw size={17} className={roster.loading ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {semester.error && <Notice>{semester.error}</Notice>}
      {roster.error && <Notice>{roster.error}</Notice>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${status === "ALL" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"}`}
            onClick={() => setStatus("ALL")}
          >
            Tất cả · {applications.length}
          </button>
          {(["PENDING", "ACCEPTED", "REJECTED"] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setStatus(value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${status === value ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {placementLabels[value]} · {counts[value]}
            </button>
          ))}
          <label className="relative ml-auto min-w-[220px] flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              className={`${workflowInput} !pl-10`}
              aria-label="Tìm hồ sơ OJT"
              placeholder="Tìm tên, MSSV, doanh nghiệp..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                {["Sinh viên", "Doanh nghiệp / vị trí", "Ngày gửi", "Phản hồi", "Thực tập"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((student) => {
                const state = placementStatus(student);
                return (
                  <tr key={student.studentId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><StudentIdentity student={student} /></td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-medium text-slate-800"><Building2 size={14} className="text-slate-400" />{companyName(student)}</p>
                      <p className="mt-1 text-xs text-slate-500">{student.position?.title || student.positionTitle || "Chưa cập nhật vị trí"}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{time(student.coordination?.coordinatedAt)}</td>
                    <td className="px-5 py-4">
                      <WorkflowBadge status={state} />
                      {state === "REJECTED" && <p className="mt-2 max-w-[240px] text-xs leading-5 text-rose-700">{student.coordination?.rejectReason || "Doanh nghiệp chưa cung cấp lý do."}</p>}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {state === "ACCEPTED"
                        ? student.assignmentId || student.assignment
                          ? "Đã tạo tự động"
                          : "Đang đồng bộ assignment"
                        : "Chưa tiếp nhận"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(roster.loading || visible.length === 0) && (
          <div className="p-8 text-center text-sm text-slate-500">
            {roster.loading ? "Đang tải hồ sơ..." : "Chưa có hồ sơ phù hợp với bộ lọc."}
          </div>
        )}
        <footer className="border-t border-slate-100 p-4">
          <Pager page={safePage} total={filtered.length} limit={10} busy={roster.loading} onChange={setPage} />
        </footer>
      </section>
    </div>
  );
}
