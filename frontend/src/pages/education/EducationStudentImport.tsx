import React from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Info,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";
import {
  importService,
  type ImportCommitResponse,
  type ImportPreviewResponse,
  type StudentImportRow,
} from "@/service/import.service";
import { parseStudentImportWorkbook } from "@/service/studentImportWorkbook";

/* ===================== TYPES ===================== */

type Tab = "students" | "grades";

type GradeRow = {
  code: string;
  courseCode: string;
  period: string;
  status: string;
  score: string;
  gradePoints: string;
  grade: string;
};

type Issue = {
  row: number;
  message: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

/* ===================== HELPERS ===================== */

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getCell = (row: Record<string, unknown>, aliases: string[]) => {
  const names = aliases.map(normalize);

  const found = Object.entries(row).find(([key]) =>
    names.includes(normalize(key)),
  );

  return String(found?.[1] ?? "").trim();
};

const parseStatus = (value: string) => {
  const key = normalize(value);

  if (key === "dat" || key === "passed") {
    return "PASSED";
  }

  if (key === "khongdat" || key === "failed") {
    return "FAILED";
  }

  return value.trim();
};

const createKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${
    window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  }`;

/* ===================== VALIDATION ===================== */

const validateStudents = (rows: StudentImportRow[]): Issue[] => {
  const issues: Issue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const number = index + 2;

    if (!row.code.trim() || !row.fullName.trim() || !row.email.trim()) {
      issues.push({
        row: number,
        message: "Thiếu MSSV, họ tên hoặc email.",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
      issues.push({
        row: number,
        message: "Email không hợp lệ.",
      });
    }

    const key = normalize(row.code);

    if (key && seen.has(key)) {
      issues.push({
        row: number,
        message: "Trùng MSSV trong file.",
      });
    }

    if (key) seen.add(key);
  });

  return issues;
};

const validateGrades = (rows: GradeRow[]): Issue[] => {
  const issues: Issue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const number = index + 2;

    if (!row.code || !row.courseCode || !row.period) {
      issues.push({
        row: number,
        message: "Thiếu MSSV, mã môn hoặc kỳ học.",
      });
    }

    if (!["PASSED", "FAILED"].includes(row.status)) {
      issues.push({
        row: number,
        message: "Trạng thái phải là Đạt hoặc Không đạt.",
      });
    }

    for (const [label, value, max] of [
      ["Điểm số", row.score, 10],
      ["Điểm hệ 4", row.gradePoints, 4],
    ] as const) {
      if (value.trim()) {
        const score = Number(value.replace(",", "."));

        if (!Number.isFinite(score) || score < 0 || score > max) {
          issues.push({
            row: number,
            message: `${label} phải từ 0 đến ${max}.`,
          });
        }
      }
    }

    const key = [row.code, row.courseCode, row.period].map(normalize).join("|");

    if (seen.has(key)) {
      issues.push({
        row: number,
        message: "Trùng môn trong cùng kỳ học.",
      });
    }

    seen.add(key);
  });

  return issues;
};

/* ===================== EXCEL TEMPLATE ===================== */

const downloadTemplate = (tab: Tab) => {
  const isStudent = tab === "students";

  const headers = isStudent
    ? [
        "Mã sinh viên",
        "Họ và tên",
        "Email",
        "Chương trình đào tạo",
        "Khóa",
        "Nhóm",
        "Kỳ hiện tại",
      ]
    : [
        "Mã sinh viên",
        "Mã môn",
        "Kỳ học",
        "Trạng thái",
        "Điểm số",
        "Điểm hệ 4",
        "Điểm chữ",
      ];

  const example = isStudent
    ? ["DEMO001", "Nguyễn Văn An", "demo001@example.com", "", "", "", ""]
    : ["DEMO001", "PRF192", "Fall 2027", "Đạt", 8, 3.5, "B"];

  const book = XLSX.utils.book_new();

  const data = XLSX.utils.aoa_to_sheet([headers]);

  data["!cols"] = headers.map((_, index) => ({
    wch: index === 2 ? 34 : 24,
  }));

  XLSX.utils.book_append_sheet(
    book,
    data,
    isStudent ? "Danh sách sinh viên" : "Kết quả học tập",
  );

  const guide = XLSX.utils.aoa_to_sheet([
    ["HƯỚNG DẪN"],
    ["Nhập dữ liệu ở sheet đầu tiên. Không thay đổi tên cột."],
    ["Dữ liệu dưới đây chỉ là ví dụ, KHÔNG tự động được Import."],
    [],
    headers,
    example,
    [],
    [
      isStudent
        ? "Sinh viên mới không cần có bảng điểm. Không nhập lớp."
        : "Một dòng là một kết quả môn học của một sinh viên trong một kỳ.",
    ],
  ]);

  guide["!cols"] = headers.map(() => ({
    wch: 30,
  }));

  XLSX.utils.book_append_sheet(book, guide, "Hướng dẫn");

  XLSX.writeFile(
    book,
    isStudent ? "mau-import-sinh-vien.xlsx" : "mau-cap-nhat-bang-diem.xlsx",
  );
};

/* ===================== BACKEND PREVIEW ===================== */

const getPreviewProblems = (
  preview: ImportPreviewResponse,
  expected: number,
): string[] => {
  const problems: string[] = [];

  if (preview.total !== expected) {
    problems.push("Số dòng Backend xử lý khác số dòng đã gửi.");
  }

  if (preview.created + preview.updated !== preview.total) {
    problems.push(
      "Số bản ghi tạo mới/cập nhật không khớp tổng số. Cần xem lại trước khi lưu.",
    );
  }

  for (const item of preview.rows ?? []) {
    const row = item as unknown as Record<string, unknown>;

    const action = String(row.action ?? "").toUpperCase();

    if (action && action !== "CREATED" && action !== "UPDATED") {
      problems.push(
        `Dòng ${row.rowNumber ?? "?"}: ${String(row.message ?? action)}`,
      );
    }

    if (Array.isArray(row.errors) && row.errors.length) {
      problems.push(
        `Dòng ${row.rowNumber ?? "?"}: ${row.errors.map(String).join("; ")}`,
      );
    }
  }

  return problems;
};

/* ===================== COMPONENT ===================== */

export const EducationStudentImport: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>("students");

  const [students, setStudents] = React.useState<StudentImportRow[]>([]);

  const [grades, setGrades] = React.useState<GradeRow[]>([]);

  const [studentFile, setStudentFile] = React.useState("");

  const [gradeFile, setGradeFile] = React.useState("");

  const [fileError, setFileError] = React.useState("");

  const [preview, setPreview] = React.useState<ImportPreviewResponse | null>(
    null,
  );

  const [previewProblems, setPreviewProblems] = React.useState<string[]>([]);

  const [commit, setCommit] = React.useState<ImportCommitResponse | null>(null);

  const [gradesChecked, setGradesChecked] = React.useState(false);

  const [busy, setBusy] = React.useState<"read" | "preview" | "commit" | null>(
    null,
  );

  const [notice, setNotice] = React.useState<Notice | null>(null);

  const [search, setSearch] = React.useState("");

  const [showModal, setShowModal] = React.useState(false);

  const [showConfirm, setShowConfirm] = React.useState(false);

  const [form, setForm] = React.useState({
    code: "",
    fullName: "",
    email: "",
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  const isStudent = tab === "students";

  const issues = isStudent
    ? validateStudents(students)
    : validateGrades(grades);

  const badRows = new Set(issues.map((issue) => issue.row));

  const total = isStudent ? students.length : grades.length;

  const fileName = isStudent ? studentFile : gradeFile;

  /* ===================== RESET ===================== */

  const resetStudentPreview = () => {
    setPreview(null);
    setPreviewProblems([]);
    setCommit(null);
  };

  /* ===================== READ EXCEL ===================== */

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;
    setFileError("");
    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        throw new Error("Chỉ hỗ trợ Excel hoặc CSV.");
      }

      setBusy("read");

      if (isStudent) {
        const book = XLSX.read(await file.arrayBuffer(), { type: "array" });

        // Tìm sheet Danh sách sinh viên.
        // Nếu file chỉ có một sheet thì dùng sheet đó.
        const studentSheetName =
          book.SheetNames.find(
            (name) => normalize(name) === normalize("Danh sách sinh viên"),
          ) ?? (book.SheetNames.length === 1 ? book.SheetNames[0] : undefined);

        if (!studentSheetName) {
          throw new Error(
            'Không tìm thấy sheet "Danh sách sinh viên" trong file Excel.',
          );
        }

        // Tạo workbook tạm chỉ chứa sheet sinh viên.
        // Nhờ vậy parser không xử lý nhầm bảng điểm.
        const studentOnlyBook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          studentOnlyBook,
          book.Sheets[studentSheetName],
          "Danh sách sinh viên",
        );

        const studentOnlyData = XLSX.write(studentOnlyBook, {
          bookType: "xlsx",
          type: "array",
        });

        const studentOnlyFile = new File(
          [studentOnlyData],
          "danh-sach-sinh-vien.xlsx",
          {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        );

        // Chỉ phân tích dữ liệu sinh viên
        const parsed = await parseStudentImportWorkbook(studentOnlyFile);

        if (!parsed.length) {
          throw new Error("Không có sinh viên nào trong file.");
        }

        // Chỉ giữ dữ liệu sinh viên.
        // Không gửi className hoặc courseResults.
        const cleaned: StudentImportRow[] = parsed.map((row) => {
          const academic = row.academic;

          const safeAcademic = academic
            ? {
                ...(academic.programId != null
                  ? {
                      programId: academic.programId,
                    }
                  : {}),
                ...(academic.placement
                  ? {
                      placement: academic.placement,
                    }
                  : {}),
              }
            : undefined;

          return {
            code: row.code,
            email: row.email,
            fullName: row.fullName,
            ...(safeAcademic && Object.keys(safeAcademic).length
              ? {
                  academic: safeAcademic,
                }
              : {}),
          };
        });

        setStudents(cleaned);
        setStudentFile(file.name);

        resetStudentPreview();

        setNotice({
          type: "success",
          message: `Đã đọc ${cleaned.length} sinh viên. Chưa ghi database.`,
        });
      } else {
        // Đọc file Excel
        const book = XLSX.read(await file.arrayBuffer(), { type: "array" });

        // Ưu tiên sheet "Kết quả học tập"
        const gradeSheetName = book.SheetNames.find(
          (name) => normalize(name) === normalize("Kết quả học tập"),
        );

        // Cho phép file bảng điểm chỉ có 1 sheet
        const sheetName =
          gradeSheetName ??
          (book.SheetNames.length === 1 ? book.SheetNames[0] : undefined);

        if (!sheetName) {
          throw new Error(
            'Không tìm thấy sheet "Kết quả học tập". ' +
              "Hãy chọn đúng file bảng điểm.",
          );
        }

        const sheet = book.Sheets[sheetName];

        if (!sheet) {
          throw new Error("Không thể đọc sheet kết quả học tập.");
        }

        // Đọc dạng mảng để nhận diện đúng hàng tiêu đề
        const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        const headerIndex = grid.findIndex((row) => {
          const columns = row.map((value) => normalize(String(value ?? "")));

          return (
            columns.includes("masinhvien") &&
            (columns.includes("mamon") || columns.includes("coursecode"))
          );
        });

        if (headerIndex === -1) {
          throw new Error(
            'Sheet bảng điểm thiếu cột "Mã sinh viên" ' +
              'hoặc "Mã môn". Hãy kiểm tra lại file.',
          );
        }

        const headers = grid[headerIndex].map((value) =>
          String(value ?? "").trim(),
        );

        const rawRows = grid
          .slice(headerIndex + 1)
          .filter((values) =>
            values.some((value) => String(value ?? "").trim()),
          )
          .map((values) => {
            const record: Record<string, unknown> = {};

            headers.forEach((header, index) => {
              record[header] = values[index] ?? "";
            });

            return record;
          });

        if (rawRows.length === 0) {
          throw new Error(
            'Sheet "Kết quả học tập" đang trống. ' +
              "File này chưa có điểm để Import. " +
              "Hãy dùng file bảng điểm có dữ liệu.",
          );
        }

        const rows: GradeRow[] = rawRows.map((row) => ({
          code: getCell(row, ["Mã sinh viên", "MSSV", "code"]),
          courseCode: getCell(row, ["Mã môn", "courseCode"]),
          period: getCell(row, ["Kỳ học", "period", "academicPeriodId"]),
          status: parseStatus(getCell(row, ["Trạng thái", "status"])),
          score: getCell(row, ["Điểm số", "score"]),
          gradePoints: getCell(row, ["Điểm hệ 4", "gradePoints"]),
          grade: getCell(row, ["Điểm chữ", "grade"]),
        }));

        // Cập nhật bảng kết quả học tập
        setGrades(rows);
        setGradeFile(file.name);
        setGradesChecked(false);
        setFileError("");

        setNotice({
          type: "success",
          message:
            `Đã đọc thành công ${rows.length} ` +
            "kết quả học tập. Chưa ghi database.",
        });
      }

      setSearch("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không đọc được file Excel.";

      setFileError(message);

      if (!isStudent) {
        setGrades([]);
        setGradeFile("");
        setGradesChecked(false);
      }

      setNotice({
        type: "error",
        message,
      });
    } finally {
      setBusy(null);
      event.target.value = "";
    }
  };

  const translateImportMessage = (message: string): string => {
    const rawMessage = String(message ?? "").trim();

    const rowMatch = rawMessage.match(/Row\s+(\d+)/i);
    const rowPrefix = rowMatch ? `Sinh viên thứ ${rowMatch[1]}: ` : "";
    if (
      /academic profile/i.test(rawMessage) &&
      /placement/i.test(rawMessage) &&
      /courseResults/i.test(rawMessage)
    ) {
      return (
        rowPrefix +
        "Hệ thống yêu cầu bổ sung thông tin học vụ, " +
        "khóa/kỳ học và kết quả học tập của sinh viên. " +
        "Vui lòng kiểm tra lại dữ liệu."
      );
    }

    return rawMessage
      .replace(/Row\s+(\d+)\s*:/gi, "Dòng $1:")
      .replace(/academic profile/gi, "thông tin học vụ")
      .replace(/placement/gi, "thông tin khóa và kỳ học")
      .replace(/courseResults/gi, "kết quả học tập")
      .replace(/are required/gi, "là bắt buộc")
      .replace(/is required/gi, "là bắt buộc");
  };

  /* ===================== PREVIEW ===================== */

  const onPreview = async () => {
    if (!total || issues.length || busy) return;
    setNotice(null);

    if (!isStudent) {
      setGradesChecked(true);

      setNotice({
        type: "success",
        message:
          "Đã kiểm tra định dạng bảng điểm trên giao diện. Chưa gửi API hoặc lưu dữ liệu.",
      });

      return;
    }

    try {
      setBusy("preview");
      resetStudentPreview();

      const result = await importService.previewStudentImport({
        kind: "STUDENT",
        idempotencyKey: createKey("student-preview"),
        rows: students,
      });

      setPreview(result);

      const problems = getPreviewProblems(result, students.length);

      setPreviewProblems(problems);

      setNotice({
        type: problems.length ? "error" : "success",
        message: problems.length
          ? "Hệ thống phát hiện dữ liệu cần kiểm tra lại."
          : "Kiểm tra thành công. Dữ liệu chưa được lưu vào hệ thống.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra dữ liệu sinh viên.";

      setNotice({
        type: "error",
        message: translateImportMessage(message),
      });
    } finally {
      setBusy(null);
    }
  };

  /* ===================== COMMIT ===================== */

  const onCommit = async () => {
    if (!preview || previewProblems.length || commit || busy) {
      return;
    }

    setShowConfirm(false);

    try {
      setBusy("commit");

      const result = await importService.commitStudentImport({
        kind: "STUDENT",
        idempotencyKey: createKey("student-commit"),
        rows: students,
      });

      setCommit(result);

      setNotice({
        type: "success",
        message: `Đã Import thành công: ${result.created} tạo mới, ${result.updated} cập nhật.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Không thể Commit dữ liệu.",
      });
    } finally {
      setBusy(null);
    }
  };

  /* ===================== MANUAL ===================== */

  const onAddStudent = () => {
    const next = [...students, { ...form }];

    const errors = validateStudents(next);

    if (errors.length) {
      setNotice({
        type: "error",
        message: `Dòng ${errors[0].row}: ${errors[0].message}`,
      });
      return;
    }

    setStudents(next);
    resetStudentPreview();
    setShowModal(false);

    setForm({
      code: "",
      fullName: "",
      email: "",
    });

    setNotice({
      type: "success",
      message: "Đã thêm sinh viên vào danh sách chờ Import.",
    });
  };

  const removeRow = (index: number) => {
    if (isStudent) {
      setStudents((old) => old.filter((_, i) => i !== index));

      resetStudentPreview();
    } else {
      setGrades((old) => old.filter((_, i) => i !== index));

      setGradesChecked(false);
    }
  };

  /* ===================== FILTER ===================== */

  const filteredStudents = students
    .map((row, index) => ({
      row,
      index,
    }))
    .filter(({ row }) =>
      [row.code, row.fullName, row.email].some((value) =>
        normalize(value).includes(normalize(search)),
      ),
    );

  const filteredGrades = grades
    .map((row, index) => ({
      row,
      index,
    }))
    .filter(({ row }) =>
      [row.code, row.courseCode, row.period].some((value) =>
        normalize(value).includes(normalize(search)),
      ),
    );

  /* ===================== RENDER ===================== */

  return (
    <div className="space-y-6 pb-10">
      <PageBanner
        title="Import dữ liệu học vụ"
        description="Nhập sinh viên mới và cập nhật kết quả học tập theo từng kỳ."
        badge="Phòng Đào tạo"
      />

      {/* NOTIFICATION */}

      {notice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertTriangle size={19} />
            )}

            <span>{translateImportMessage(notice.message)}</span>
          </div>

          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={() => setNotice(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* TWO FUNCTION CARDS */}

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setTab("students");
            setSearch("");
            setNotice(null);
          }}
          className={`flex items-start gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
            isStudent
              ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
              : "border-slate-200 bg-white hover:border-orange-200"
          }`}
        >
          <span
            className={`rounded-xl p-3 ${
              isStudent
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Users size={24} />
          </span>

          <span>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Chức năng 01
            </span>

            <span className="mt-1 block text-lg font-bold text-slate-900">
              Import sinh viên
            </span>

            <span className="mt-1 block text-sm text-slate-500">
              Khi có sinh viên mới nhập học. Không yêu cầu bảng điểm.
            </span>

            <span className="mt-3 block text-xs font-semibold text-orange-600">
              {students.length} sinh viên đang chuẩn bị
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("grades");
            setSearch("");
            setNotice(null);
          }}
          className={`flex items-start gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
            !isStudent
              ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
              : "border-slate-200 bg-white hover:border-orange-200"
          }`}
        >
          <span
            className={`rounded-xl p-3 ${
              !isStudent
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <GraduationCap size={24} />
          </span>

          <span>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Chức năng 02
            </span>

            <span className="mt-1 block text-lg font-bold text-slate-900">
              Cập nhật kết quả học tập
            </span>

            <span className="mt-1 block text-sm text-slate-500">
              Khi có bảng điểm mới sau mỗi kỳ học.
            </span>

            <span className="mt-3 block text-xs font-semibold text-orange-600">
              {grades.length} kết quả môn học đang chuẩn bị
            </span>
          </span>
        </button>
      </div>

      {/* UPLOAD AND GUIDE */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Bước 1 · Chọn tệp dữ liệu
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {isStudent
                  ? "Nhập danh sách sinh viên"
                  : "Cập nhật bảng điểm theo kỳ"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Chọn tệp Excel có sẵn hoặc sử dụng tệp mẫu của hệ thống.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadTemplate(tab)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={17} />
              Tải file mẫu
            </button>
          </div>

          <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <FileSpreadsheet size={29} />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-800">
              {isStudent
                ? "Chọn tệp danh sách sinh viên"
                : "Chọn tệp bảng điểm"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Định dạng hỗ trợ file: .xlsx, .xls, .csv
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onFileChange}
            />

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {busy === "read" ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Upload size={17} />
                )}

                {busy === "read" ? "Đang đọc file..." : "Chọn file Excel"}
              </button>

              {isStudent && (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Plus size={17} />
                  Thêm sinh viên
                </button>
              )}
            </div>

            {fileName && (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={16} />
                {fileName}
              </p>
            )}

            {fileError && (
              <div
                role="alert"
                className="mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />

                <span>{fileError}</span>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpen size={19} className="text-orange-500" />

            <h3 className="font-bold text-slate-900">Quy trình sử dụng</h3>
          </div>

          <div className="mt-5 space-y-4">
            {[
              [
                "01",
                "Chuẩn bị tệp Excel",
                "Sử dụng tệp có sẵn hoặc tải tệp mẫu của hệ thống.",
              ],
              [
                "02",
                "Chọn tệp và xem trước",
                "Hiển thị danh sách và kiểm tra thông tin còn thiếu.",
              ],
              [
                "03",
                "Kiểm tra dữ liệu",
                isStudent
                  ? "Đối chiếu thông tin sinh viên với hệ thống."
                  : "Kiểm tra định dạng và thông tin bảng điểm.",
              ],
              [
                "04",
                isStudent ? "Xác nhận lưu" : "Lưu bảng điểm",
                isStudent
                  ? "Lưu dữ liệu sau khi kiểm tra và xác nhận."
                  : "Chức năng lưu bảng điểm đang được hoàn thiện.",
              ],
            ].map(([number, title, detail]) => (
              <div key={number} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">
                  {number}
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <ShieldCheck size={18} className="shrink-0" />

            <span>
              {isStudent
                ? "Dữ liệu chỉ được lưu vào hệ thống sau khi bạn kiểm tra và xác nhận."
                : "Hiện tại chỉ hỗ trợ xem trước và kiểm tra bảng điểm, chưa hỗ trợ lưu dữ liệu."}
            </span>
          </div>
        </aside>
      </div>

      {/* DATA TABLE */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Bước 2 · Xem trước và kiểm tra
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {isStudent
                ? "Danh sách sinh viên đã tải lên"
                : "Bảng điểm đã tải lên"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {total} dòng · {badRows.size} dòng cần sửa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm MSSV, mã môn..."
                className="w-52 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
              />
            </label>

            <button
              type="button"
              disabled={!total || Boolean(busy)}
              onClick={() => {
                if (isStudent) {
                  setStudents([]);
                  setStudentFile("");
                  resetStudentPreview();
                } else {
                  setGrades([]);
                  setGradeFile("");
                  setGradesChecked(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Xóa tất cả
            </button>
          </div>
        </div>

        {!total ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-400">
            <FileSpreadsheet size={36} className="mx-auto" />

            <p className="mt-3 text-sm">
              Chưa có dữ liệu. Hãy chọn file Excel để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isStudent ? (
                  <tr>
                    <th className="px-4 py-3">Dòng</th>
                    <th className="px-4 py-3">MSSV</th>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Kiểm tra</th>
                    <th className="px-4 py-3" />
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3">Dòng</th>
                    <th className="px-4 py-3">MSSV</th>
                    <th className="px-4 py-3">Mã môn</th>
                    <th className="px-4 py-3">Kỳ học</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Điểm</th>
                    <th className="px-4 py-3">Kiểm tra</th>
                    <th className="px-4 py-3" />
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isStudent
                  ? filteredStudents.slice(0, 50).map(({ row, index }) => (
                      <tr
                        key={`${row.code}-${index}`}
                        className={
                          badRows.has(index + 2)
                            ? "bg-red-50"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {index + 2}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {row.code || "—"}
                        </td>

                        <td className="px-4 py-3">{row.fullName || "—"}</td>

                        <td className="px-4 py-3">{row.email || "—"}</td>

                        <td className="px-4 py-3">
                          {badRows.has(index + 2) ? (
                            <span className="font-semibold text-red-600">
                              Cần sửa
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600">
                              Hợp lệ
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            aria-label="Xóa dòng"
                            onClick={() => removeRow(index)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  : filteredGrades.slice(0, 50).map(({ row, index }) => (
                      <tr
                        key={`${row.code}-${row.courseCode}-${index}`}
                        className={
                          badRows.has(index + 2)
                            ? "bg-red-50"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {index + 2}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {row.code || "—"}
                        </td>

                        <td className="px-4 py-3">{row.courseCode || "—"}</td>

                        <td className="px-4 py-3">{row.period || "—"}</td>

                        <td className="px-4 py-3">
                          {row.status === "PASSED"
                            ? "Đạt"
                            : row.status === "FAILED"
                              ? "Không đạt"
                              : row.status || "—"}
                        </td>

                        <td className="px-4 py-3">{row.score || "—"}</td>

                        <td className="px-4 py-3">
                          {badRows.has(index + 2) ? (
                            <span className="font-semibold text-red-600">
                              Cần sửa
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600">
                              Hợp lệ
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            aria-label="Xóa dòng"
                            onClick={() => removeRow(index)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {(isStudent ? filteredStudents.length : filteredGrades.length) >
              50 && (
              <p className="border-t border-slate-100 p-3 text-xs text-slate-500">
                Chỉ hiển thị 50 dòng đầu. Các dòng khác vẫn được giữ trong danh
                sách.
              </p>
            )}
          </div>
        )}

        {/* VALIDATION ISSUES */}

        {issues.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold">Dữ liệu cần sửa</p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {issues.slice(0, 8).map((issue, index) => (
                <li key={index}>
                  Dòng {issue.row}: {issue.message}
                </li>
              ))}
            </ul>

            {issues.length > 8 && (
              <p className="mt-2 text-xs">Còn {issues.length - 8} lỗi khác.</p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onPreview}
            disabled={!total || issues.length > 0 || Boolean(busy)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {busy === "preview" ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ShieldCheck size={17} />
            )}

            {isStudent ? "Kiểm tra dữ liệu sinh viên" : "Kiểm tra bảng điểm"}
          </button>
        </div>

        {/* Trạng thái kiểm tra dữ liệu */}
        {busy === "preview" && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
          >
            <Loader2 size={18} className="animate-spin" />
            Đang gửi dữ liệu đến hệ thống để kiểm tra...
          </div>
        )}

        {notice && busy !== "preview" && (
          <div
            role="status"
            className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}

            <span>{notice.message}</span>
          </div>
        )}
      </section>

      {/* STUDENT API PREVIEW */}

      {isStudent && preview && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Bước 3 · Kết quả từ Backend
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Tổng sinh viên", preview.total],
              ["Tạo mới", preview.created],
              ["Cập nhật", preview.updated],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{label}</p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {previewProblems.length > 0 ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">Chưa thể lưu</p>

              <ul className="mt-2 list-disc space-y-1 pl-5">
                {previewProblems.map((problem, index) => (
                  <li key={index}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} />
              Preview thành công. Chưa ghi dữ liệu vào database.
            </p>
          )}

          {commit && (
            <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">
              Đã Import thành công: {commit.created} tạo mới, {commit.updated}{" "}
              cập nhật.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={
                Boolean(busy) || Boolean(commit) || previewProblems.length > 0
              }
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Upload size={17} />

              {commit ? "Đã lưu" : "Xác nhận Import sinh viên"}
            </button>
          </div>
        </section>
      )}

      {/* GRADE PREVIEW - NO DATABASE WRITE */}

      {!isStudent && gradesChecked && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
          <Info size={20} className="shrink-0" />

          <div>
            <p className="font-bold">
              Đã kiểm tra định dạng {grades.length} kết quả học tập
            </p>

            <p className="mt-1 leading-6">
              Đây là kiểm tra tại Frontend, chưa gọi API và chưa lưu bảng điểm.
              Chức năng Commit sẽ được kết nối khi BE xác nhận cách cập nhật
              cộng dồn, xử lý môn học lại và chống trùng.
            </p>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}

      {showModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Thêm sinh viên
              </h3>

              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Thêm thông tin cơ bản. Chưa ghi database.
            </p>

            <div className="mt-5 space-y-4">
              {(
                [
                  ["Mã sinh viên", "code"],
                  ["Họ và tên", "fullName"],
                  ["Email", "email"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    {label} <span className="text-red-500">*</span>
                  </span>

                  <input
                    value={form[key]}
                    onChange={(event) =>
                      setForm((old) => ({
                        ...old,
                        [key]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={onAddStudent}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM COMMIT MODAL */}

      {showConfirm && preview && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowConfirm(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle size={24} />
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              Xác nhận ghi dữ liệu thật?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Thao tác này gọi <strong>POST /api/imports/commit</strong> và có
              thể tạo mới hoặc cập nhật sinh viên trong database.
            </p>

            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {preview.created} tạo mới · {preview.updated} cập nhật
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={onCommit}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationStudentImport;
