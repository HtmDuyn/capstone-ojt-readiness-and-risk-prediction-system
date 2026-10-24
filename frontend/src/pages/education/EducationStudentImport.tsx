import { PageBanner } from "@/components/common/PageBanner";
import { ImportedStudents } from '@/components/education/ImportedStudents';
import { loadAcademicCatalogs } from '@/services/educationCatalog.service';
import { importService } from '@/services/import.service';
import type { AcademicCatalogs, ImportCommitResponse, ImportPreviewResponse, StudentImportRow } from '@/types/education/import.types';
import { downloadStudentImportTemplate, parseStudentImportWorkbook, STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';
import React from "react";
const EducationStudentImport: React.FC = () => {
  const [savedRevision, setSavedRevision] = React.useState(0);
  const [catalogs, setCatalogs] = React.useState<AcademicCatalogs | null>(null),
    [rows, setRows] = React.useState<StudentImportRow[]>([]);
  const [preview, setPreview] = React.useState<ImportPreviewResponse | null>(
      null,
    ),
    [result, setResult] = React.useState<ImportCommitResponse | null>(null);
  const [busy, setBusy] = React.useState(""),
    [error, setError] = React.useState(""),
    [fileName, setFileName] = React.useState(""),
    [search, setSearch] = React.useState(""),
    [selected, setSelected] = React.useState<StudentImportRow | null>(null);
  const key = React.useRef(""),
    [catalogRefresh, setCatalogRefresh] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    setCatalogs(null);
    setError("");
    loadAcademicCatalogs()
      .then((data) => {
        if (active) setCatalogs(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [catalogRefresh]);
  const gradeCount = rows.reduce(
    (n, row) => n + row.academic.courseResults.length,
    0,
  );
  const canCommit =
    preview?.preview === true &&
    preview.total === rows.length &&
    preview.created + preview.updated === rows.length &&
    !preview.rows?.some((row) => row.errors?.length) &&
    !result;
  const payload = () => ({
    kind: "STUDENT" as const,
    idempotencyKey: key.current,
    rows,
  });
  async function readFile(file: File) {
    if (!catalogs) return;
    setBusy("read");
    setRows([]);
    setPreview(null);
    setResult(null);
    setSelected(null);
    setError("");
    setFileName("");
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name))
        throw new Error("Chọn tệp Excel .xlsx hoặc .xls theo mẫu hai sheet.");
      if (file.size > 8 * 1024 * 1024)
        throw new Error("Tệp Excel không được vượt quá 8 MB.");
      const parsed = await parseStudentImportWorkbook(file, catalogs);
      key.current = crypto.randomUUID();
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được tệp.");
    } finally {
      setBusy("");
    }
  }
  async function check() {
    setBusy("preview");
    setError("");
    setPreview(null);
    try {
      const response = await importService.previewStudentImport(payload());
      setPreview(response);
      if (
        response.preview !== true ||
        response.total !== rows.length ||
        response.created + response.updated !== rows.length ||
        response.rows?.some((row) => row.errors?.length)
      )
        throw new Error(
          "Kết quả kiểm tra chưa hợp lệ; chưa thể xác nhận import.",
        );
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Không kiểm tra được dữ liệu.");
    } finally {
      setBusy("");
    }
  }
  async function commit() {
    if (!canCommit || busy) return;
    if (
      !window.confirm(
        `Nhập ${rows.length} sinh viên và ${gradeCount} kết quả học tập vào hệ thống?`,
      )
    )
      return;
    setBusy("commit");
    setError("");
    try {
      setResult(await importService.commitStudentImport(payload()));
      setPreview(null);
      setRows([]); setSelected(null); setSearch('');
      setSavedRevision(value => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được dữ liệu.");
    } finally {
      setBusy("");
    }
  }
  const visible = rows.filter((row) =>
    (row.code + " " + row.fullName + " " + row.email)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageBanner
        title="Import sinh viên và bảng điểm"
        description="Một tệp nhập thông tin sinh viên, trạng thái học vụ, chương trình, khóa/nhóm, kỳ bắt đầu chuyên ngành, kỳ hiện tại và bảng điểm."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <p>
          Tệp gồm sheet <strong>Danh sách sinh viên</strong> và{" "}
          <strong>Kết quả học tập</strong>. Mỗi dòng điểm có MSSV để gắn vào
          đúng hồ sơ. Sinh viên chưa có điểm được để trống sheet kết quả.
          Mẫu có thêm sheet <strong>Danh mục</strong> chứa ID/mã hợp lệ tại lúc tải và <strong>Hướng dẫn</strong> cho từng cột.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded border p-2"
            disabled={!!busy}
            onClick={() => downloadStudentImportTemplate(catalogs)}
          >
            Tải mẫu Excel đầy đủ
          </button>
          <label className="rounded border p-2">
            Chọn tệp Excel
            <input
              aria-label="Tệp sinh viên và bảng điểm"
              className="ml-2"
              type="file"
              accept=".xlsx,.xls"
              disabled={!!busy || !catalogs}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </label>
          <button
            className="rounded border p-2"
            disabled={!!busy}
            onClick={() => setCatalogRefresh((v) => v + 1)}
          >
            Tải lại danh mục
          </button>
        </div>
        {!catalogs && <p>Đang chờ danh mục chương trình, khóa và kỳ học.</p>}
        {busy && (
          <p role="status">
            {busy === "read"
              ? "Đang đọc và ghép dữ liệu..."
              : busy === "preview"
                ? "Đang kiểm tra dữ liệu với hệ thống..."
                : "Đang nhập dữ liệu..."}
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <p>
              {fileName}: <strong>{rows.length} sinh viên</strong>,{" "}
              <strong>{gradeCount} kết quả học tập</strong>.
            </p>
            <input
              aria-label="Tìm sinh viên trong tệp"
              className="rounded border p-2"
              value={search}
              placeholder="MSSV, tên hoặc email"
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "MSSV",
                      "Họ tên / Email",
                      "Chương trình",
                      "Khóa / Nhóm",
                      "Kỳ hiện tại",
                      "Số kết quả",
                      "",
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.code} className="border-t">
                      <td className="p-3">{row.code}</td>
                      <td>
                        {row.fullName}
                        <br />
                        {row.email}
                      </td>
                      <td>
                        {catalogs?.programs.find(
                          (p) => p.id === row.academic.programId,
                        )?.label ?? row.academic.programId}
                      </td>
                      <td>
                        {catalogs?.cohorts.find(
                          (c) => c.id === row.academic.placement.cohortId,
                        )?.label ?? row.academic.placement.cohortId}{" "}
                        / {row.academic.placement.groupCode}
                      </td>
                      <td>
                        {catalogs?.periods.find(
                          (p) =>
                            p.id ===
                            row.academic.placement.currentAcademicPeriodId,
                        )?.label ??
                          row.academic.placement.currentAcademicPeriodId}
                      </td>
                      <td>{row.academic.courseResults.length}</td>
                      <td>
                        <button
                          className="text-orange-700"
                          onClick={() => setSelected(row)}
                        >
                          Xem hồ sơ và bảng điểm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button
                className="rounded border p-2"
                disabled={!!busy || !!result}
                onClick={() => void check()}
              >
                Kiểm tra dữ liệu
              </button>
              <button
                className="rounded bg-orange-500 p-2 text-white disabled:opacity-50"
                disabled={!!busy || !canCommit}
                onClick={() => void commit()}
              >
                Xác nhận import
              </button>
            </div>
          </>
        )}
        {preview && (
          <p role="status">
            Kiểm tra: {preview.total} sinh viên, tạo mới {preview.created}, hồ
            sơ hiện có {preview.updated}. Dữ liệu chưa được lưu.
          </p>
        )}
        {result && (
          <p role="status" className="text-green-700">
            Đã nhập {result.total} sinh viên cùng bảng điểm tương ứng. Mã đợt:{" "}
            {result.academicImportId ?? result.batchId ?? "—"}
            {result.replayed ? " (yêu cầu đã được xử lý trước đó)" : ""}.
          </p>
        )}
      </section>
      <ImportedStudents revision={savedRevision} catalogs={catalogs} />
      {selected && (
        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <button className="float-right" onClick={() => setSelected(null)}>
            Đóng
          </button>
          <h2 className="font-bold">
            {selected.code} — {selected.fullName}
          </h2>
          <p>
            Email: {selected.email}; Điện thoại:{" "}
            {selected.academic.phone ?? "—"}; Lớp:{" "}
            {selected.academic.className ?? "—"}
          </p>
          <p>Trạng thái sinh viên: {selected.academic.status ? STUDENT_STATUS_LABELS[selected.academic.status] : 'Mặc định ACTIVE khi tạo mới; giữ trạng thái khi cập nhật'}.</p>
          <p>Kỳ bắt đầu chuyên ngành: {selected.academic.placement.entryAcademicPeriodId
            ? catalogs?.periods.find(p => p.id === selected.academic.placement.entryAcademicPeriodId)?.label ?? selected.academic.placement.entryAcademicPeriodId
            : 'Theo kỳ vào của nhóm khi tạo mới/đổi nhóm; giữ kỳ đã gán khi cập nhật'}.</p>
          {!selected.academic.courseResults.length ? (
            <p>Chưa có kết quả học tập trong tệp.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Môn",
                      "Kỳ",
                      "Lần học",
                      "Trạng thái",
                      "Điểm",
                      "Hệ 4",
                      "Điểm chữ",
                    ].map((h) => (
                      <th key={h} className="p-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.academic.courseResults.map((r, i) => (
                    <tr className="border-t" key={i}>
                      <td className="p-2">{r.courseCode}</td>
                      <td>
                        {catalogs?.periods.find(
                          (p) => p.id === r.academicPeriodId,
                        )?.label ?? r.academicPeriodId}
                      </td>
                      <td>{r.attemptNumber ?? 1}</td>
                      <td>{r.status}</td>
                      <td>{r.score ?? "—"}</td>
                      <td>{r.gradePoints ?? "—"}</td>
                      <td>{r.grade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
export default EducationStudentImport;
