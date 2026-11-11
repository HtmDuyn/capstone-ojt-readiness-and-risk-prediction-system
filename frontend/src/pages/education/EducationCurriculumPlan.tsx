import { PageBanner } from "@/components/common/PageBanner";
import { CurriculumImportActions } from "@/components/education/CurriculumImportActions";
import { curriculumService } from '@/services/curriculum.service';
import { getAllItems } from "@/services/educationApi";
import type { CurriculumDetail, CurriculumSummary, Major } from '@/types/education/curriculum.types';
import React from "react";
const EducationCurriculumPlan: React.FC = () => {
  const [majors, setMajors] = React.useState<Major[]>([]),
    [programs, setPrograms] = React.useState<CurriculumSummary[]>([]),
    [majorId, setMajorId] = React.useState(""),
    [programId, setProgramId] = React.useState("");
  const [detail, setDetail] = React.useState<CurriculumDetail | null>(null),
    [error, setError] = React.useState(""),
    [loading, setLoading] = React.useState(false),
    [refresh, setRefresh] = React.useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  React.useEffect(() => {
    const c = new AbortController();
    setError("");
    setLoading(true);
    Promise.all([
      getAllItems<Major>("/majors", {}, c.signal),
      getAllItems<CurriculumSummary>("/curricula", {}, c.signal),
    ])
      .then(([m, p]) => {
        setMajors(m);
        setPrograms(p);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [refresh]);
  React.useEffect(() => {
    let active = true;
    setDetail(null);
    setDescriptionExpanded(false);
    if (!programId) return;
    setError("");
    setLoading(true);
    curriculumService
      .getCurriculumDetail(Number(programId))
      .then((r) => {
        if (active) setDetail(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [programId, refresh]);
  const selectedMajor = majors.find((m) => String(m.id) === majorId);
  const description = detail?.description?.trim() ?? "";
  const hasLongDescription = description.length > 240;
  return (
    <div className="space-y-6">
      <PageBanner
        title="Khung chương trình đào tạo"
        description="Nhập và tra cứu khung chương trình, môn học và combo. Không sửa, xóa hoặc thay thế dữ liệu đã nhập."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Chuyên ngành"
            className="min-w-44 flex-1 rounded border p-2"
            value={majorId}
            onChange={(e) => {
              setMajorId(e.target.value);
              setProgramId("");
            }}
          >
            <option value="">Tất cả chuyên ngành</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Khung chương trình"
            className="min-w-60 flex-[2] rounded border p-2"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">Chọn khung chương trình</option>
            {programs
              .filter((p) => !majorId || String(p.majorId) === majorId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
          </select>
          <CurriculumImportActions
            majors={majors}
            selectedMajorCode={selectedMajor?.code ?? null}
            curriculumDetail={detail}
            onCommitted={() => setRefresh((v) => v + 1)}
          />
        </div>
        {loading && <p role="status">Đang tải dữ liệu...</p>}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {!programId && (
          <p>
            Chọn khung đã nhập để xem; sử dụng chức năng import để thêm khung
            mới.
          </p>
        )}
        {detail && (
          <>
            <div className="space-y-4 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Thông tin khung chương trình</h2>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Mã khung chương trình</p>
                <p className="mt-1 break-words text-sm font-semibold text-orange-700">{detail.code}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">Tên khung chương trình</p>
                <p className="mt-1 break-words text-base font-semibold text-slate-900">{detail.name}</p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Chuyên ngành', detail.majorName],
                  ['Tổng số tín chỉ', detail.totalCredits],
                  ['Phiên bản', detail.version ?? '—'],
                  ['Năm áp dụng', detail.effectiveYear ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">Mô tả khung chương trình</h3>
                <p className={`mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 ${hasLongDescription && !descriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {description || 'Chưa có mô tả'}
                </p>
                {hasLongDescription && <button type="button" onClick={() => setDescriptionExpanded(value => !value)} aria-expanded={descriptionExpanded} className="mt-2 text-sm font-medium text-orange-700 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}</button>}
              </div>
            </div>
            <h3 className="font-semibold">Môn học trong khung</h3>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EFF6FF] text-[#334155]">
                  <tr className="border-b border-[#D6E4F0]">
                    {[
                      "Mã môn",
                      "Tên môn",
                      "Kỳ khuyến nghị",
                      "Tín chỉ",
                      "Loại",
                      "Tiên quyết",
                    ].map((h) => (
                      <th key={h} className="p-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.courses.map((c) => (
                    <tr key={c.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                      <td className="p-2">{c.courseCode}</td>
                      <td>{c.name}</td>
                      <td>{c.semester}</td>
                      <td>{c.credits ?? "—"}</td>
                      <td>{c.entryKind}</td>
                      <td>{c.prerequisiteText || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="font-semibold">Combo</h3>
            {!detail.combos.length && <p>Khung này chưa có combo.</p>}
            {detail.combos.map((combo) => (
              <section key={combo.id} className="space-y-2 rounded border p-4">
                <h4 className="font-semibold">
                  {combo.code} — {combo.name}
                </h4>
                <p>{combo.note}</p>
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#EFF6FF] text-[#334155]">
                      <tr className="border-b border-[#D6E4F0]">
                        {[
                          "Mã môn",
                          "Tên môn",
                          "Kỳ",
                          "Tín chỉ",
                          "Tiên quyết",
                        ].map((h) => (
                          <th className="p-2 font-semibold" key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combo.courses.map((c) => (
                        <tr className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]" key={c.id}>
                          <td className="p-2">{c.courseCode}</td>
                          <td>{c.name}</td>
                          <td>{c.semester}</td>
                          <td>{c.credits ?? "—"}</td>
                          <td>{c.prerequisiteText || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </>
        )}
      </section>
    </div>
  );
};
export default EducationCurriculumPlan;
