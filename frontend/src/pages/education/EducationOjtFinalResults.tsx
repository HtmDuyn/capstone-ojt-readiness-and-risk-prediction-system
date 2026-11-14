import { useEducationOjtFinalResults } from '@/hooks/useEducationOjtFinalResults';
import { PageBanner } from "@/components/common/PageBanner";
import React from "react";

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
  const { data, allTotal, totalError, selected, setSelected, semesterId, setSemesterId, search, setSearch, status, setStatus, page, setPage, loading, busy, error, setError, notice, reason, setReason, semesters, semesterError, confirm } = useEducationOjtFinalResults();
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;
  return (
    <div className="space-y-4">
      <PageBanner
        title="Kết quả OJT cuối kỳ"
        description="Kết quả do QHDN chuyển; điểm và kết quả chính thức do backend quy đổi khi xác nhận."
        badge="Phòng Đào tạo"
      />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            aria-label="Tìm kết quả OJT"
            className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 sm:min-w-64"
            placeholder="Mã hoặc tên sinh viên"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Kỳ OJT"
            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 sm:w-52"
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
            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 sm:w-48"
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
        </div>
        {(error || semesterError) && (
          <p role="alert" className="px-4 pb-3 text-sm text-red-700">
            {error || semesterError}
          </p>
        )}
        {notice && (
          <p role="status" className="px-4 pb-3 text-sm text-green-700">
            {notice}
          </p>
        )}
        {loading && <p role="status" className="px-4 pb-5 text-sm text-slate-500">Đang tải kết quả...</p>}
        {data && (
          <>
            {data.items.length > 0 ? <>
              <p className="px-4 pb-3 text-sm text-slate-500">{data.total} kết quả</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-y border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]">
                    <tr>
                      <th scope="col" className="w-48 px-4 py-3 font-semibold">Sinh viên</th>
                      <th scope="col" className="min-w-40 px-4 py-3 font-semibold">Doanh nghiệp</th>
                      <th scope="col" className="w-36 px-4 py-3 font-semibold">Kỳ</th>
                      <th scope="col" className="w-36 px-4 py-3 font-semibold">Điểm chính thức</th>
                      <th scope="col" className="w-48 px-4 py-3 font-semibold">Trạng thái</th>
                      <th scope="col" className="w-24 px-4 py-3 font-semibold"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.items.map((r) => (
                      <tr key={r.id} className="bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                        <td className="px-4 py-3"><span className="block font-semibold text-slate-800">{r.studentCode}</span><span className="block text-slate-600">{r.fullName}</span></td>
                        <td className="px-4 py-3">{r.enterpriseName}</td>
                        <td className="px-4 py-3">{r.semesterCode}</td>
                        <td className="px-4 py-3 tabular-nums">{r.officialScore ?? "—"}</td>
                        <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${r.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : r.status === 'REVISION_REQUESTED' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{statuses[r.status] ?? r.status}</span></td>
                        <td className="px-4 py-3"><button disabled={busy} className="font-medium text-orange-700 hover:underline disabled:opacity-50" onClick={() => { setSelected(r); setReason(''); setError(''); }}>Chi tiết</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.total > 20 && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span>Trang {page}/{totalPages}</span>
                <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
                <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sau</button>
              </div>}
            </> : <p role="status" className="px-4 py-8 text-center text-sm text-slate-500">{allTotal === 0 || (allTotal === null && !search.trim() && !semesterId && !status)
              ? 'Chưa có kết quả OJT cuối kỳ'
              : totalError
                ? totalError
                : allTotal === null
                  ? 'Đang kiểm tra dữ liệu...'
                  : 'Không tìm thấy kết quả phù hợp với điều kiện tìm kiếm.'}</p>}
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
