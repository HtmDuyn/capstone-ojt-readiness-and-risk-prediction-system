import { PageBanner } from "@/components/common/PageBanner";
import { useEducationSemesters } from '@/hooks/useEducationSemesters';
import { getPage } from '@/services/educationApi';
import { ojtEligibilityService } from '@/services/ojtEligibility.service';
import { loadSavedLocalOjtResults } from '@/services/localOjtEligibility.service';
import { savedOjtLabel, type SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import type { Page } from '@/types/education/api.types';
import type { StudentEligibility } from '@/types/education/eligibility.types';
import { eligibilityReasonLabel, eligibilityStatusLabel } from '@/utils/educationEligibility';
import React from "react";
import { Link } from 'react-router-dom';
type Row = Record<string, any>;
const label = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const statusNames: Record<string, string> = {
  ELIGIBLE: "Đủ điều kiện",
  NOT_ELIGIBLE: "Chưa đủ điều kiện",
  REVIEW_REQUIRED: "Chờ đối soát",
  SUBMITTED: "Đã đăng ký",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  NOT_REGISTERED: "Chưa đăng ký",
  HANDED_OFF: "Đã bàn giao",
  NOT_HANDED_OFF: "Chưa bàn giao",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang OJT",
  COMPLETED: "Hoàn thành",
  FAILED: "Không đạt",
  COORDINATING: "Đang điều phối",
  ENTERPRISE_ACCEPTED: "Doanh nghiệp tiếp nhận",
  ENTERPRISE_REJECTED: "Doanh nghiệp từ chối",
  LEGACY_REVIEW_REQUIRED: "Cần đối soát dữ liệu cũ",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
};
const state = (value: unknown) => statusNames[String(value)] ?? label(value);
const EducationStudentStatus: React.FC = () => {
  const [semesterId, setSemesterId] = React.useState('');
  const { semesters, error: semesterError, reload: reloadSemesters } = useEducationSemesters();
  const [search, setSearch] = React.useState(""),
    [page, setPage] = React.useState(1),
    [refresh, setRefresh] = React.useState(0);
  const [data, setData] = React.useState<Page<Row> | null>(null),
    [selected, setSelected] = React.useState<Row | null>(null);
  const [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState("");
  const [eligibility, setEligibility] = React.useState<StudentEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = React.useState(false);
  const [eligibilityError, setEligibilityError] = React.useState('');
  const [savedResults, setSavedResults] = React.useState<Record<number, SavedOjtEligibility>>({});
  const [savedError, setSavedError] = React.useState('');
  React.useEffect(() => {
    const controller = new AbortController();
    setSavedResults({}); setSavedError('');
    loadSavedLocalOjtResults(controller.signal)
      .then(rows => { if (!controller.signal.aborted) setSavedResults(Object.fromEntries(rows.map(row => [row.studentId, row]))); })
      .catch(e => { if (!controller.signal.aborted) setSavedError(e instanceof Error ? e.message : 'Không tải được kết quả FE đã lưu.'); });
    return () => controller.abort();
  }, [refresh]);
  React.useEffect(() => {
    const controller = new AbortController();
    setEligibility(null); setEligibilityError(''); setEligibilityLoading(Boolean(selected && semesterId));
    if (selected && semesterId) ojtEligibilityService.getStudentEligibility(selected.studentId, Number(semesterId), controller.signal)
      .then(data => { if (!controller.signal.aborted) setEligibility(data); })
      .catch(e => { if (!controller.signal.aborted) setEligibilityError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setEligibilityLoading(false); });
    return () => controller.abort();
  }, [selected, semesterId]);

  React.useEffect(() => {
    if (!semesterId) {
      setData(null);
      setSelected(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    setSelected(null);
    getPage<Row>(
      `/ojt-semesters/${semesterId}/students`,
      { page, limit: 20, search },
      controller.signal,
    )
      .then(response => { if (!controller.signal.aborted) setData(response); })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [semesterId, page, search, refresh]);
  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi trạng thái sinh viên"
        description="Trạng thái đăng ký, bàn giao và thực tập theo kỳ OJT từ backend."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Kỳ OJT"
            className="rounded border p-2"
            value={semesterId}
            onChange={(e) => {
              setSemesterId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Chọn kỳ OJT</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.semesterCode})
              </option>
            ))}
          </select>
          <input
            aria-label="Tìm sinh viên"
            className="rounded border p-2"
            placeholder="Mã hoặc tên sinh viên"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <button
            onClick={() => { reloadSemesters(); setRefresh((v) => v + 1); }}
            className="rounded border px-3"
          >
            Tải lại
          </button>
          <Link to="/education/ojt-conditions" className="rounded border p-2 text-orange-700">Xét và cập nhật điều kiện OJT</Link>
        </div>
        {(error || semesterError || savedError) && (
          <p role="alert" className="text-red-700">
            {error || semesterError || savedError}
          </p>
        )}
        {loading && <p role="status">Đang tải...</p>}
        {!semesterId && <p>Chọn kỳ OJT để xem dữ liệu.</p>}
        {data && (
          <>
            <p>
              Tổng: {data.total} sinh viên. Kết quả điều kiện hiển thị là kết
              quả đã lưu, có thể cần đối soát lại.
            </p>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] font-semibold text-[#334155]">
                  <tr>
                    {[
                      "Sinh viên",
                      "Kết quả FE đã lưu",
                      "Quyết định OJT chính thức",
                      "Đăng ký",
                      "Bàn giao",
                      "Trạng thái OJT",
                      "",
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.studentId} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                      <td className="p-3">
                        {r.studentCode}
                        <br />
                        {r.fullName}
                      </td>
                      <td>{savedResults[r.studentId] ? savedOjtLabel(savedResults[r.studentId]) : 'Chưa xét'}</td>
                      <td>{state(r.officialEligibilityStatus)}</td>
                      <td>{state(r.registrationStatus)}</td>
                      <td>{state(r.handoffStatus)}</td>
                      <td>{state(r.ojtStatus)}</td>
                      <td>
                        <button
                          className="text-orange-700"
                          onClick={() => setSelected(r)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.items.length && (
              <p>Không có sinh viên phù hợp trong kỳ này.</p>
            )}
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
        <section className="space-y-2 rounded-2xl bg-white p-6 shadow-sm">
          <button className="float-right" onClick={() => setSelected(null)}>
            Đóng
          </button>
          <h2 className="font-bold">
            {selected.fullName} — {selected.studentCode}
          </h2>
          <p>Email: {label(selected.email)}</p>
          <p>Nhóm: {label(selected.groupCode)}</p>
          {eligibilityLoading && <p role="status">Đang tính điều kiện từ dữ liệu hiện tại...</p>}
          {eligibilityError && <p role="alert" className="text-red-700">{eligibilityError}</p>}
          {eligibility && <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-semibold">Điều kiện OJT: từ 70 tín chỉ, tối đa 2 môn còn rớt</h3>
            <p>Tính hiện tại (chưa phải quyết định chính thức): <strong>{eligibilityStatusLabel(eligibility.current.status)}</strong>.</p>
            <p>Tín chỉ đạt: {eligibility.current.earnedCredits}; còn thiếu: {eligibility.current.missingCredits ?? 'chưa xác định'}; môn còn rớt: {eligibility.current.unpassedCourseCount}.</p>
            <p>Môn còn rớt: {eligibility.current.unpassedCourses.map(c => c.courseCode).join(', ') || 'Không có'}.</p>
            <p>{eligibility.current.reasons.map(eligibilityReasonLabel).join(' ')}</p>
            {eligibility.current.academicIssues.length > 0 && <p className="text-amber-800">Cần đối soát: {eligibility.current.academicIssues.join(', ')}.</p>}
            <p>Quyết định chính thức: {!eligibility.official ? 'Chưa xác nhận' : eligibility.official.isStale ? 'Đã cũ — cần xét lại trước khi sử dụng' : eligibilityStatusLabel(eligibility.official.status)}.</p>
            {eligibility.official?.confirmation && <p>Đã xác nhận lúc {new Date(eligibility.official.confirmation.confirmedAt).toLocaleString('vi-VN')}.</p>}
          </div>}
          <p>
            Doanh nghiệp:{" "}
            {label(
              selected.coordination?.company?.name ??
                selected.coordination?.companyName ??
                selected.company?.name ??
                selected.enterprise?.name,
            )}
          </p>
          <p>
            Vị trí:{" "}
            {label(
              selected.coordination?.position?.title ??
                selected.coordination?.positionTitle,
            )}
          </p>
          <p>Ngày bắt đầu: {label(selected.assignment?.startDate)}</p>
          <p>Ngày kết thúc: {label(selected.assignment?.endDate)}</p>
          <p>Trạng thái phân công: {state(selected.assignment?.status)}</p>
        </section>
      )}
    </div>
  );
};
export default EducationStudentStatus;
