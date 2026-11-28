import { useEducationOjtFinalResults } from '@/hooks/education/useEducationOjtFinalResults';
import { PageBanner } from "@/components/common/PageBanner";
import { Award, BookOpen, Building2, CalendarDays, CheckCircle2, MessageSquareText, Search, UserRound } from 'lucide-react';
import { StudentDialog } from '@/components/student/StudentDialog';
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
  const { data, allTotal, totalError, selected, setSelected, semesterId, setSemesterId, search, setSearch, status, setStatus, page, setPage, loading, error, setError, semesters, semesterError } = useEducationOjtFinalResults();
  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageBanner
        variant="education"
        title="Kết quả OJT cuối kỳ"
        description="Kết quả OJT do Phòng Quan hệ Doanh nghiệp công bố."
        badge="Phòng Đào tạo"
      />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><CheckCircle2 size={20}/></span>
          <div className="mr-auto"><h2 className="font-bold text-slate-900">Danh sách kết quả</h2><p className="mt-0.5 text-xs text-slate-500">Tra cứu và xem chi tiết kết quả OJT đã công bố</p></div>
          {data && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold tabular-nums text-slate-600">{data.total} kết quả</span>}
        </div>
        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_220px_220px] sm:p-5">
          <label className="relative block min-w-0">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
            aria-label="Tìm kết quả OJT"
            className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            placeholder="Mã hoặc tên sinh viên"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            />
          </label>
          <select
            aria-label="Kỳ OJT"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
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
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
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
        {loading && <p role="status" className="px-5 py-5 text-sm text-slate-500 sm:px-6">Đang tải kết quả...</p>}
        {data && (
          <>
            {data.items.length > 0 ? <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th scope="col" className="w-36 px-5 py-3 font-semibold">MSSV</th>
                      <th scope="col" className="min-w-48 px-4 py-3 font-semibold">Họ và tên</th>
                      <th scope="col" className="min-w-48 px-4 py-3 font-semibold">Doanh nghiệp</th>
                      <th scope="col" className="w-44 px-4 py-3 font-semibold">Kỳ học</th>
                      <th scope="col" className="w-40 px-4 py-3 font-semibold">Điểm chính thức</th>
                      <th scope="col" className="w-48 px-4 py-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.items.map((r) => (
                      <tr key={r.id} role="button" tabIndex={0} aria-label={`Xem chi tiết kết quả OJT của ${r.fullName}`} onClick={() => { setSelected(r); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(r); setError(''); } }} className="cursor-pointer bg-white align-middle transition-colors hover:bg-orange-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-orange-500">
                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-orange-700">{r.studentCode}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.fullName}</td>
                        <td className="px-4 py-3">{r.enterpriseName}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{r.academicPeriodCode ?? r.semesterCode}</td>
                        <td className="px-4 py-3"><span className="font-bold tabular-nums text-slate-900">{r.officialScore ?? "—"}</span><span className="ml-1 text-xs text-slate-500">/ 10</span></td>
                        <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${r.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : r.status === 'REVISION_REQUESTED' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{statuses[r.status] ?? r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.total > 20 && <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:justify-end">
                <span>Trang {page}/{totalPages}</span>
                <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
                <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sau</button>
              </div>}
            </> : <p role="status" className="px-5 py-12 text-center text-sm text-slate-500">{allTotal === 0 || (allTotal === null && !search.trim() && !semesterId && !status)
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
        <StudentDialog title="Chi tiết kết quả OJT" onClose={() => setSelected(null)}>
          <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100"><UserRound size={22}/></span><div className="min-w-0 flex-1"><h3 className="truncate text-lg font-bold text-slate-900">{selected.fullName}</h3><p className="mt-0.5 text-sm text-slate-500">Mã sinh viên <span className="font-semibold text-slate-700">{selected.studentCode}</span></p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${selected.outcome === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : selected.outcome === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}><span className={`size-1.5 rounded-full ${selected.outcome === 'PASSED' ? 'bg-emerald-500' : selected.outcome === 'FAILED' ? 'bg-rose-500' : 'bg-slate-400'}`}/>{outcome(selected.outcome)}</span></div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-orange-100/80 pt-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5"><Building2 size={14} className="text-slate-400"/>{selected.enterpriseName}</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5"><BookOpen size={14} className="text-slate-400"/>{selected.academicPeriodCode ?? selected.semesterCode}</span></div>
          </div>
          <div className="space-y-4 p-1 text-sm leading-6 text-slate-700">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col justify-center rounded-2xl bg-slate-900 p-4 text-white sm:p-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"><Award size={15}/>Điểm chính thức</p><div className="mt-2 flex items-baseline gap-1.5"><strong className="text-4xl font-bold tabular-nums tracking-tight">{selected.officialScore ?? '—'}</strong><span className="text-sm text-slate-400">/ 10</span></div><p className="mt-1 text-xs text-slate-400">{selected.officialScore == null ? 'Chưa có điểm xác nhận' : 'Kết quả đã được công bố'}</p></div>
            <div className="rounded-2xl border border-slate-200 p-4 sm:p-5"><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><CheckCircle2 size={15}/>Điểm thành phần</p><div className="grid grid-cols-3 gap-2">{[['Hoàn thành',selected.completionScore],['Thái độ',selected.attitudeScore],['Kỹ năng',selected.skillScore]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 px-2 py-3 text-center"><p className="text-[11px] leading-4 text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-800">{value ?? '—'}</p></div>)}</div></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><MessageSquareText size={15}/>Nhận xét của doanh nghiệp</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.comments?.trim() || 'Chưa có nhận xét.'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-w-48"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><CalendarDays size={15}/>Ngày xác nhận</p><p className="mt-2 text-sm font-semibold text-slate-800">{selected.confirmedAt ? new Date(selected.confirmedAt).toLocaleString('vi-VN') : 'Chưa xác nhận'}</p></div>
          </div>
          </div>
        </StudentDialog>
      )}
    </div>
  );
};
export default EducationOjtFinalResults;
