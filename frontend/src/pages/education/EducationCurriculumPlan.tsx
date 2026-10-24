import React from "react";
import { PageBanner } from "@/components/common/PageBanner";
import { CurriculumImportActions } from "@/components/education/CurriculumImportActions";
import { getAllItems } from "@/service/educationApi";
import {
  curriculumService,
  type Major,
  type CurriculumSummary,
  type CurriculumDetail,
} from "@/service/curriculum.service";
const EducationCurriculumPlan: React.FC = () => {
  const [majors, setMajors] = React.useState<Major[]>([]),
    [programs, setPrograms] = React.useState<CurriculumSummary[]>([]),
    [majorId, setMajorId] = React.useState(""),
    [programId, setProgramId] = React.useState("");
  const [detail, setDetail] = React.useState<CurriculumDetail | null>(null),
    [error, setError] = React.useState(""),
    [loading, setLoading] = React.useState(false),
    [refresh, setRefresh] = React.useState(0);
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
            className="rounded border p-2"
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
            className="rounded border p-2"
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
          <button
            className="rounded border p-2"
            onClick={() => setRefresh((v) => v + 1)}
          >
            Tải lại
          </button>
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
            <h2 className="text-lg font-bold">
              {detail.code} — {detail.name}
            </h2>
            <p>
              Chuyên ngành: {detail.majorName}; tổng tín chỉ:{" "}
              {detail.totalCredits}; phiên bản: {detail.version ?? "—"}; năm áp
              dụng: {detail.effectiveYear ?? "—"}
            </p>
            <h3 className="font-semibold">Môn học trong khung</h3>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Mã môn",
                      "Tên môn",
                      "Kỳ khuyến nghị",
                      "Tín chỉ",
                      "Loại",
                      "Tiên quyết",
                    ].map((h) => (
                      <th key={h} className="p-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.courses.map((c) => (
                    <tr key={c.id} className="border-t">
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
                    <thead>
                      <tr>
                        {[
                          "Mã môn",
                          "Tên môn",
                          "Kỳ",
                          "Tín chỉ",
                          "Tiên quyết",
                        ].map((h) => (
                          <th className="p-2" key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combo.courses.map((c) => (
                        <tr className="border-t" key={c.id}>
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
