import { PageBanner } from "@/components/common/PageBanner";
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import API from "@/services/api";
import { apiData, getPage } from '@/services/educationApi';
import type { Page } from '@/types/education/api.types';
import React from "react";
type Result = {
  id: number;
  studentCode: string;
  fullName: string;
  enterpriseName: string;
  semesterCode: string;
  status: string;
  officialScore: number | null;
  completionScore: number | null;
  attitudeScore: number | null;
  skillScore: number | null;
  comments: string | null;
  outcome: string | null;
  confirmedAt: string | null;
};
const statuses: Record<string, string> = {
  PENDING_ACADEMIC_CONFIRMATION: "Chờ xác nhận",
  REVISION_REQUESTED: "Chờ QHDN đối soát",
  CONFIRMED: "Đã xác nhận",
};
const outcome = (value: string | null) =>
  value === "PASSED"
    ? "Đạt"
    : value === "FAILED"
      ? "Không đạt"
      : (value ?? "Chưa có kết quả chính thức");
const EducationOjtFinalResults: React.FC = () => {
  const [data, setData] = React.useState<Page<Result> | null>(null),
    [selected, setSelected] = React.useState<Result | null>(null);
  const [semesterId, setSemesterId] = React.useState('');
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [search, setSearch] = React.useState(""),
    [status, setStatus] = React.useState(""),
    [page, setPage] = React.useState(1),
    [refresh, setRefresh] = React.useState(0);
  const [loading, setLoading] = React.useState(false),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(""),
    [notice, setNotice] = React.useState(""),
    [reason, setReason] = React.useState("");
  const keys = React.useRef(new Map<number, { reason: string; key: string }>());

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    getPage<Result>(
      "/ojt-results",
      { page, limit: 20, search, status, ojtSemesterId: semesterId },
      controller.signal,
    )
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, search, status, semesterId, refresh]);
  async function confirm() {
    if (!selected || busy || !reason.trim()) return;
    const id = selected.id,
      trimmed = reason.trim();
    let attempt = keys.current.get(id);
    if (!attempt || attempt.reason !== trimmed) {
      attempt = { reason: trimmed, key: crypto.randomUUID() };
      keys.current.set(id, attempt);
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await API.post(`/ojt-results/${id}/confirm`, {
        reason: trimmed,
        idempotencyKey: attempt.key,
      });
      apiData(response.data);
      setSelected(null);
      setReason("");
      setPage(1);
      setRefresh((v) => v + 1);
      setNotice("Đã xác nhận và ghi nhận kết quả OJT trên hệ thống.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xác nhận kết quả.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <PageBanner
        title="Kết quả OJT cuối kỳ"
        description="Kết quả do QHDN chuyển; điểm và kết quả chính thức do backend quy đổi khi xác nhận."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Tìm kết quả OJT"
            className="rounded border p-2"
            placeholder="Mã hoặc tên sinh viên"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Kỳ OJT"
            className="rounded border p-2"
            value={semesterId}
            onChange={(e) => {
              setSemesterId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả kỳ OJT</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Trạng thái kết quả"
            className="rounded border p-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statuses).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
          <button
            className="rounded border px-3"
            onClick={() => { reloadSemesters(); setRefresh((v) => v + 1); }}
          >
            Tải lại
          </button>
        </div>
        {(error || semesterError) && (
          <p role="alert" className="text-red-700">
            {error || semesterError}
          </p>
        )}
        {notice && (
          <p role="status" className="text-green-700">
            {notice}
          </p>
        )}
        {loading && <p role="status">Đang tải...</p>}
        {data && (
          <>
            <p>Tổng: {data.total} kết quả</p>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]">
                  <tr>
                    {[
                      "Sinh viên",
                      "Doanh nghiệp",
                      "Kỳ",
                      "Điểm chính thức",
                      "Trạng thái",
                      "",
                    ].map((h) => (
                      <th className="p-3" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                      <td className="p-3">
                        {r.studentCode}
                        <br />
                        {r.fullName}
                      </td>
                      <td>{r.enterpriseName}</td>
                      <td>{r.semesterCode}</td>
                      <td>{r.officialScore ?? "—"}</td>
                      <td>{statuses[r.status] ?? r.status}</td>
                      <td>
                        <button
                          disabled={busy}
                          className="text-orange-700"
                          onClick={() => {
                            setSelected(r);
                            setReason("");
                            setError("");
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.items.length && <p>Không có kết quả phù hợp.</p>}
            <div className="flex gap-4">
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span>Trang {page}</span>
              <button
                disabled={loading || page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </>
        )}
      </section>
      {selected && (
        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <button
            className="float-right"
            disabled={busy}
            onClick={() => setSelected(null)}
          >
            Đóng
          </button>
          <h2 className="font-bold">
            {selected.fullName} — {selected.studentCode}
          </h2>
          <p>Doanh nghiệp: {selected.enterpriseName}</p>
          <p>
            Hoàn thành: {selected.completionScore ?? "—"}; Thái độ:{" "}
            {selected.attitudeScore ?? "—"}; Kỹ năng:{" "}
            {selected.skillScore ?? "—"}
          </p>
          <p>Nhận xét: {selected.comments ?? "—"}</p>
          <p>Điểm chính thức: {selected.officialScore ?? "Chưa xác nhận"}</p>
          <p>Kết quả: {outcome(selected.outcome)}</p>
          <p>
            Ngày xác nhận:{" "}
            {selected.confirmedAt
              ? new Date(selected.confirmedAt).toLocaleString("vi-VN")
              : "—"}
          </p>
          {selected.status === "PENDING_ACADEMIC_CONFIRMATION" && (
            <>
              <label className="block">
                Lý do xác nhận
                <textarea
                  aria-label="Lý do xác nhận"
                  className="mt-2 block w-full rounded border p-2"
                  maxLength={2000}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className="rounded bg-orange-500 px-4 py-2 text-white disabled:opacity-50"
                disabled={busy || !reason.trim()}
                onClick={() => void confirm()}
              >
                {busy ? "Đang xác nhận..." : "Xác nhận và ghi nhận điểm"}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
};
export default EducationOjtFinalResults;
