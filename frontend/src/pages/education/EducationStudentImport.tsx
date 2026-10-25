import { PageBanner } from "@/components/common/PageBanner";
import { ImportedStudents } from '@/components/education/ImportedStudents';
import { loadAcademicCatalogs } from '@/services/educationCatalog.service';
import { importService } from '@/services/import.service';
import type { AcademicCatalogs, ImportCommitResponse, ImportPreviewResponse, StudentImportRow } from '@/types/education/import.types';
import { downloadStudentImportTemplate, parseStudentImportWorkbook, STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';
import React from "react";
import { FileSpreadsheet, Download, RefreshCw, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
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
    <div className="space-y-6 pb-8">
      <PageBanner
        title="Import sinh viên và bảng điểm"
        description="Một tệp nhập thông tin sinh viên, trạng thái học vụ, chương trình, khóa/nhóm, kỳ bắt đầu chuyên ngành, kỳ hiện tại và bảng điểm."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-orange-50 p-3 text-orange-600"><FileSpreadsheet size={24} /></div>
          <div><h2 className="text-xl font-bold text-slate-900">Nhập dữ liệu từ Excel</h2><p className="mt-1 text-sm text-slate-600">Một tệp cho hồ sơ sinh viên mới và kết quả học tập theo từng kỳ.</p></div>
        </div>
        <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Tệp gồm sheet <strong>Danh sách sinh viên</strong> và{" "}
          <strong>Kết quả học tập</strong>. Mỗi dòng điểm có MSSV để gắn vào
          đúng hồ sơ. Sinh viên chưa có điểm được để trống sheet kết quả.
          Mẫu có thêm sheet <strong>Danh mục</strong> chứa ID/mã hợp lệ tại lúc tải và <strong>Hướng dẫn</strong> cho từng cột.
        </p>
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-orange-300 bg-orange-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-3"><UploadCloud className="mt-0.5 shrink-0 text-orange-600" size={22} /><div><p className="font-semibold text-slate-900">Chọn tệp Excel để bắt đầu</p><p className="mt-1 text-sm text-slate-500">Định dạng .xlsx hoặc .xls, tối đa 8 MB. Dữ liệu sẽ được kiểm tra trước khi lưu.</p></div></div>
          <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-within:ring-4 focus-within:ring-orange-200 ${!!busy || !catalogs ? 'cursor-not-allowed opacity-50' : ''}`}>
            <FileSpreadsheet size={18} /> Chọn tệp Excel
            <input
              aria-label="Tệp sinh viên và bảng điểm"
              className="sr-only"
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
          <span className="min-w-0 break-all text-sm text-slate-600" aria-live="polite">{fileName || 'Chưa chọn tệp'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-50"
            disabled={!!busy}
            onClick={() => downloadStudentImportTemplate(catalogs)}
          >
            <Download size={16} /> Tải mẫu Excel đầy đủ
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-50"
            disabled={!!busy}
            onClick={() => setCatalogRefresh((v) => v + 1)}
          >
            <RefreshCw size={16} /> Tải lại danh mục
          </button>
        </div>
        {!catalogs && <p className="text-sm text-slate-500">Đang chờ danh mục chương trình, khóa và kỳ học.</p>}
        {busy && (
          <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {busy === "read"
              ? "Đang đọc và ghép dữ liệu..."
              : busy === "preview"
                ? "Đang kiểm tra dữ liệu với hệ thống..."
                : "Đang nhập dữ liệu..."}
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-slate-700">
              {fileName}: <strong>{rows.length} sinh viên</strong>,{" "}
              <strong>{gradeCount} kết quả học tập</strong>.
            </p>
            <input
              aria-label="Tìm sinh viên trong tệp"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:max-w-sm"
              value={search}
              placeholder="MSSV, tên hoặc email"
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
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
                      <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.code} className="border-t border-slate-100 hover:bg-orange-50/30">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.code}</td>
                      <td className="px-4 py-3">
                        {row.fullName}
                        <br />
                        {row.email}
                      </td>
                      <td className="px-4 py-3">
                        {catalogs?.programs.find(
                          (p) => p.id === row.academic.programId,
                        )?.label ?? row.academic.programId}
                      </td>
                      <td className="px-4 py-3">
                        {catalogs?.cohorts.find(
                          (c) => c.id === row.academic.placement.cohortId,
                        )?.label ?? row.academic.placement.cohortId}{" "}
                        / {row.academic.placement.groupCode}
                      </td>
                      <td className="px-4 py-3">
                        {catalogs?.periods.find(
                          (p) =>
                            p.id ===
                            row.academic.placement.currentAcademicPeriodId,
                        )?.label ??
                          row.academic.placement.currentAcademicPeriodId}
                      </td>
                      <td className="px-4 py-3">{row.academic.courseResults.length}</td>
                      <td className="px-4 py-3">
                        <button
                          className="font-medium text-orange-700 hover:underline"
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
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={!!busy || !!result}
                onClick={() => void check()}
              >
                Kiểm tra dữ liệu
              </button>
              <button
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                disabled={!!busy || !canCommit}
                onClick={() => void commit()}
              >
                Xác nhận import
              </button>
            </div>
          </>
        )}
        {preview && (
          <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Kiểm tra: {preview.total} sinh viên, tạo mới {preview.created}, hồ
            sơ hiện có {preview.updated}. Dữ liệu chưa được lưu.
          </p>
        )}
        {result && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 size={18} className="shrink-0" />
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
