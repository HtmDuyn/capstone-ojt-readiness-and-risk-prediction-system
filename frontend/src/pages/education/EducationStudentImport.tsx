import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  Upload,
  X,
} from "lucide-react";

import * as XLSX from "xlsx";

import { PageBanner } from "@/components/common/PageBanner";

import {
  importService,
  type ImportCommitResponse,
  type ImportPreviewResponse,
  type StudentImportRow,
} from "@/service/import.service";

/* =========================================================
   TYPES
   ========================================================= */

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_STUDENT_FORM: StudentImportRow = {
  code: "",
  email: "",
  fullName: "",
};

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Chuẩn hóa tên cột trong Excel/CSV.
 *
 * Ví dụ:
 * "Mã sinh viên" -> "masinhvien"
 * "Student Code" -> "studentcode"
 * "full_name"    -> "fullname"
 */
const normalizeHeader = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const getValueByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key);

    if (normalizedAliases.includes(normalizedKey)) {
      return String(value ?? "").trim();
    }
  }

  return "";
};

/**
 * Backend hiện tại đã xác nhận các field:
 *
 * code
 * email
 * fullName
 *
 * FE hỗ trợ thêm một số tên cột tương đương
 * để file Excel dễ sử dụng hơn.
 */
const convertExcelRowToStudent = (
  row: Record<string, unknown>,
): StudentImportRow => {
  const code = getValueByAliases(row, [
    "code",
    "studentCode",
    "student_code",
    "MSSV",
    "Mã sinh viên",
    "Ma sinh vien",
  ]);

  const email = getValueByAliases(row, [
    "email",
    "studentEmail",
    "student_email",
    "Email sinh viên",
  ]);

  const fullName = getValueByAliases(row, [
    "fullName",
    "full_name",
    "name",
    "studentName",
    "student_name",
    "Họ tên",
    "Ho ten",
    "Tên sinh viên",
  ]);

  return {
    code,
    email,
    fullName,
  };
};

const createIdempotencyKey = (prefix: string) => {
  const randomPart =
    window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

  return `${prefix}-${Date.now()}-${randomPart}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getActionLabel = (action: string) => {
  if (action === "CREATED") {
    return "Tạo mới";
  }

  if (action === "UPDATED") {
    return "Cập nhật";
  }

  return action;
};

/* =========================================================
   COMPONENT
   ========================================================= */

export const EducationStudentImport: React.FC = () => {
  /* ===================== FILE ===================== */

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  /*
   * Đây là dữ liệu sẽ gửi lên API.
   *
   * Dù lấy từ Excel, CSV hay nhập thủ công,
   * cuối cùng đều chuyển về:
   *
   * {
   *   code,
   *   email,
   *   fullName
   * }
   */
  const [students, setStudents] = React.useState<StudentImportRow[]>([]);

  /* ===================== PREVIEW ===================== */

  const [previewResult, setPreviewResult] =
    React.useState<ImportPreviewResponse | null>(null);

  const [commitResult, setCommitResult] =
    React.useState<ImportCommitResponse | null>(null);

  const [isReadingFile, setIsReadingFile] = React.useState(false);

  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const [isCommitting, setIsCommitting] = React.useState(false);

  /* ===================== ADD STUDENT ===================== */

  const [showAddStudentModal, setShowAddStudentModal] = React.useState(false);

  const [studentForm, setStudentForm] =
    React.useState<StudentImportRow>(EMPTY_STUDENT_FORM);

  /* ===================== TOAST ===================== */

  const [toast, setToast] = React.useState<ToastState | null>(null);

  const toastTimeoutRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((type: ToastType, message: string) => {
    setToast({
      type,
      message,
    });

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);

      toastTimeoutRef.current = null;
    }, 3500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  /* =====================================================
       RESET PREVIEW
       ===================================================== */

  const resetPreview = () => {
    setPreviewResult(null);
    setCommitResult(null);
  };

  /* =====================================================
       FILE ACTIONS
       ===================================================== */

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();

    const supported =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv");

    if (!supported) {
      showToast("error", "Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV.");

      event.target.value = "";

      return;
    }

    try {
      setIsReadingFile(true);

      /*
       * Đọc file thành ArrayBuffer.
       */
      const arrayBuffer = await file.arrayBuffer();

      /*
       * XLSX có thể đọc cả:
       * .xlsx
       * .xls
       * .csv
       */
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("File không có worksheet dữ liệu.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
        },
      );

      const parsedRows = rawRows
        .map(convertExcelRowToStudent)
        .filter((row) => row.code || row.email || row.fullName);

      if (parsedRows.length === 0) {
        throw new Error("Không tìm thấy dữ liệu sinh viên trong file.");
      }

      /*
       * Chọn file mới sẽ thay danh sách
       * đang chuẩn bị import.
       */
      setSelectedFile(file);

      setStudents(parsedRows);

      resetPreview();

      showToast("success", `Đã đọc ${parsedRows.length} dòng dữ liệu từ file.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể đọc file dữ liệu.";

      setSelectedFile(null);

      setStudents([]);

      resetPreview();

      showToast("error", message);
    } finally {
      setIsReadingFile(false);

      /*
       * Cho phép chọn lại cùng một file.
       */
      event.target.value = "";
    }
  };

  /* =====================================================
       DOWNLOAD TEMPLATE
       ===================================================== */

  const handleDownloadTemplate = () => {
    /*
     * Chưa có API tải template trong Swagger,
     * nên tạo file mẫu trực tiếp ở FE.
     */
    const templateRows = [
      {
        code: "SE161234",
        email: "student@example.com",
        fullName: "Nguyễn Văn A",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    XLSX.writeFile(workbook, "student-import-template.xlsx");
  };

  /* =====================================================
       PREVIEW API
       ===================================================== */

  const handlePreview = async () => {
    if (students.length === 0) {
      showToast("error", "Vui lòng chọn file hoặc thêm ít nhất một sinh viên.");

      return;
    }

    /*
     * Kiểm tra tối thiểu ở FE.
     * Validation nghiệp vụ thật vẫn do backend /preview xử lý.
     */
    const invalidIndex = students.findIndex(
      (student) =>
        !student.code.trim() ||
        !student.email.trim() ||
        !student.fullName.trim(),
    );

    if (invalidIndex !== -1) {
      showToast(
        "error",
        `Dòng ${invalidIndex + 1} đang thiếu MSSV, email hoặc họ tên.`,
      );

      return;
    }

    try {
      setIsPreviewing(true);

      setCommitResult(null);

      const result = await importService.previewStudentImport({
        kind: "STUDENT",

        idempotencyKey: createIdempotencyKey("student-preview"),

        rows: students,
      });

      setPreviewResult(result);

      showToast("success", `Kiểm tra hoàn tất ${result.total} sinh viên.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể kiểm tra dữ liệu.";

      setPreviewResult(null);

      showToast("error", message);
    } finally {
      setIsPreviewing(false);
    }
  };

  /* =====================================================
       COMMIT API
       ===================================================== */

  const handleConfirmImport = async () => {
    if (!previewResult) {
      showToast("error", "Vui lòng kiểm tra dữ liệu trước khi xác nhận nhập.");

      return;
    }

    if (students.length === 0) {
      showToast("error", "Không có dữ liệu để nhập.");

      return;
    }

    try {
      setIsCommitting(true);

      const result = await importService.commitStudentImport({
        kind: "STUDENT",

        /*
         * Commit dùng key mới để tránh
         * xung đột với preview.
         */
        idempotencyKey: createIdempotencyKey("student-commit"),

        rows: students,
      });

      setCommitResult(result);

      showToast(
        "success",
        `Nhập thành công ${result.total} sinh viên: ${result.created} tạo mới, ${result.updated} cập nhật.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể nhập dữ liệu sinh viên.";

      showToast("error", message);
    } finally {
      setIsCommitting(false);
    }
  };

  /* =====================================================
       MANUAL STUDENT
       ===================================================== */

  const handleOpenAddStudent = () => {
    setStudentForm(EMPTY_STUDENT_FORM);

    setShowAddStudentModal(true);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudentModal(false);

    setStudentForm(EMPTY_STUDENT_FORM);
  };

  const handleSaveStudent = () => {
    const code = studentForm.code.trim();

    const email = studentForm.email.trim();

    const fullName = studentForm.fullName.trim();

    if (!code || !email || !fullName) {
      showToast("error", "Vui lòng nhập đầy đủ MSSV, email và họ tên.");

      return;
    }

    /*
     * Chỉ chặn duplicate trong batch hiện tại.
     *
     * Nếu MSSV đã tồn tại trong DB,
     * backend preview sẽ trả action UPDATED.
     */
    const duplicated = students.some(
      (student) => student.code.toLowerCase() === code.toLowerCase(),
    );

    if (duplicated) {
      showToast("error", "MSSV này đã có trong danh sách đang chuẩn bị nhập.");

      return;
    }

    const newStudent: StudentImportRow = {
      code,
      email,
      fullName,
    };

    setStudents((current) => [...current, newStudent]);

    resetPreview();

    handleCloseAddStudent();

    showToast("success", `Đã thêm ${code} vào danh sách chờ kiểm tra.`);
  };

  /* =====================================================
       DERIVED DATA
       ===================================================== */

  const getPreviewAction = (index: number) => {
    if (!previewResult) {
      return null;
    }

    /*
     * Backend trả rowNumber bắt đầu từ 1.
     */
    return (
      previewResult.rows.find((row) => row.rowNumber === index + 1) ?? null
    );
  };

  /* =====================================================
       RENDER
       ===================================================== */

  return (
    <div className="space-y-6">
      {/* ===================== TOAST ===================== */}

      {toast && (
        <div className="fixed right-6 top-6 z-[9999] w-[380px] max-w-[calc(100vw-3rem)]">
          <div
            className={`overflow-hidden rounded-2xl border bg-white shadow-2xl ${
              toast.type === "success" ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div
              className={`h-1 ${
                toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
              }`}
            />

            <div className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  toast.type === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${
                    toast.type === "success"
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {toast.type === "success"
                    ? "Thành công"
                    : "Không thể thực hiện"}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== BANNER ===================== */}

      <PageBanner
        title="Import dữ liệu sinh viên"
        description="Nhập dữ liệu sinh viên từ file Excel/CSV hoặc thêm thủ công, kiểm tra trước khi lưu vào hệ thống."
        badge="Quản lý dữ liệu"
      />

      {/* ===================== CHỌN FILE ===================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Nhập dữ liệu sinh viên
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Chọn file Excel/CSV hoặc thêm từng sinh viên thủ công. Dữ liệu sẽ
            được kiểm tra trước khi nhập vào hệ thống.
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <FileSpreadsheet
            size={40}
            className="mx-auto mb-3 text-emerald-500"
          />

          <p className="text-sm font-semibold text-slate-700">
            Chọn file dữ liệu sinh viên
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Hỗ trợ Excel (.xlsx, .xls) hoặc CSV
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Các cột cần có: code, email, fullName
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 ${
                isReadingFile ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload size={17} />

              {isReadingFile ? "Đang đọc file..." : "Chọn file"}

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isReadingFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              <Plus size={17} />
              Thêm sinh viên
            </button>
          </div>

          {selectedFile && (
            <div className="mx-auto mt-5 flex max-w-xl items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet
                  size={22}
                  className="shrink-0 text-emerald-500"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {formatFileSize(selectedFile.size)} • {students.length} dòng
                    dữ liệu
                  </p>
                </div>
              </div>

              <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
            </div>
          )}

          {!selectedFile && students.length > 0 && (
            <div className="mx-auto mt-5 max-w-xl rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Đang có <strong>{students.length}</strong> sinh viên được thêm thủ
              công.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download size={17} />
            Tải file mẫu
          </button>

          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || isReadingFile || students.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPreviewing ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}

            {isPreviewing ? "Đang kiểm tra..." : "Kiểm tra dữ liệu"}
          </button>
        </div>
      </section>

      {/* ===================== PREVIEW RESULT ===================== */}

      {previewResult && (
        <>
          {/* TABLE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Kết quả kiểm tra
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Kiểm tra lại danh sách trước khi xác nhận nhập dữ liệu.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Đã kiểm tra
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Dòng
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      MSSV
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Họ tên
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Email
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Xử lý
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.map((student, index) => {
                    const previewRow = getPreviewAction(index);

                    return (
                      <tr key={`${student.code}-${index}`}>
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-700">
                          {student.code}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {student.fullName}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {student.email}
                        </td>

                        <td className="px-4 py-3">
                          {previewRow ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                previewRow.action === "CREATED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : previewRow.action === "UPDATED"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getActionLabel(previewRow.action)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* READY MESSAGE */}

            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />

                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Dữ liệu đã được kiểm tra
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    {previewResult.created} sinh viên sẽ được tạo mới và{" "}
                    {previewResult.updated} sinh viên sẽ được cập nhật.
                  </p>
                </div>
              </div>
            </div>

            {/* COMMIT SUCCESS */}

            {commitResult && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      Nhập dữ liệu thành công
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Đã xử lý thành công{" "}
                      <strong>{commitResult.total} sinh viên</strong>. Trong đó
                      có{" "}
                      <strong>
                        {commitResult.created} sinh viên được thêm mới
                      </strong>{" "}
                      và{" "}
                      <strong>
                        {commitResult.updated} sinh viên được cập nhật
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRM */}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isCommitting || Boolean(commitResult)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCommitting ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {isCommitting
                  ? "Đang nhập dữ liệu..."
                  : commitResult
                    ? "Đã nhập dữ liệu"
                    : "Xác nhận nhập dữ liệu"}
              </button>
            </div>
          </section>
        </>
      )}

      {/* ===================== ADD STUDENT MODAL ===================== */}

      {showAddStudentModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={handleCloseAddStudent}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Thêm sinh viên
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Thêm sinh viên vào danh sách chờ kiểm tra.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseAddStudent}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {/* MSSV */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  MSSV <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={studentForm.code}
                  onChange={(event) =>
                    setStudentForm((current) => ({
                      ...current,

                      code: event.target.value,
                    }))
                  }
                  placeholder="VD: SE161234"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* FULL NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Họ tên <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={studentForm.fullName}
                  onChange={(event) =>
                    setStudentForm((current) => ({
                      ...current,

                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Nhập họ tên sinh viên"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(event) =>
                    setStudentForm((current) => ({
                      ...current,

                      email: event.target.value,
                    }))
                  }
                  placeholder="VD: student@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseAddStudent}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveStudent}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <Plus size={17} />
                Thêm sinh viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationStudentImport;
