
import React from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
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
  type CourseResultImportRow,
  type StudentImportRow,
  type StudentPlacement,
} from "@/service/import.service";

import {
  downloadCourseResultImportTemplate,
  downloadStudentImportTemplate,
  loadAcademicCatalogs,
  parseCourseResultImportWorkbook,
  parseStudentImportWorkbook,
  type AcademicCatalogs,
  type CatalogOption,
} from "@/service/studentImportWorkbook";

type Tab = "students" | "grades";

type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

type PreviewState = {
  tab: Tab;
  raw: unknown;
  problems: string[];
};

type CommitState = {
  tab: Tab;
  raw: unknown;
};

type StudentForm = {
  code: string;
  fullName: string;
  email: string;
  programId: string;
  cohortId: string;
  groupCode: string;
  currentAcademicPeriodId: string;
};

const EMPTY_FORM: StudentForm = {
  code: "",
  fullName: "",
  email: "",
  programId: "",
  cohortId: "",
  groupCode: "",
  currentAcademicPeriodId: "",
};

const createKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${crypto.randomUUID()}`;

const asObject = (
  value: unknown,
): Record<string, unknown> | null =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const normalize = (value: string) =>
  value.trim().toLowerCase();

const inspectPreview = (
  raw: unknown,
  expected: number,
): string[] => {
  const result = asObject(raw);

  if (!result || result.success !== true) {
    return [
      "Backend chưa xác nhận Preview thành công.",
    ];
  }

  const problems: string[] = [];

  // Chỉ cho Commit khi Backend xác nhận rõ Preview.
  if (result.preview !== true) {
    problems.push(
      "Backend chưa xác nhận preview: true. Cần đối chiếu response Swagger.",
    );
  }

  if (
    typeof result.total !== "number" ||
    result.total !== expected
  ) {
    problems.push(
      "Tổng số bản ghi Backend trả về không khớp số dòng gửi.",
    );
  }

  if (
    typeof result.created === "number" &&
    typeof result.updated === "number"
  ) {
    if (
      result.created + result.updated !== expected
    ) {
      problems.push(
        "Số bản ghi tạo mới/cập nhật không khớp tổng số dòng.",
      );
    }
  }

  if (Array.isArray(result.rows)) {
    for (const entry of result.rows) {
      const item = asObject(entry);
      if (!item) continue;

      const row = String(item.rowNumber ?? "?");

      if (
        Array.isArray(item.errors) &&
        item.errors.length
      ) {
        problems.push(
          `Dòng ${row}: ${item.errors
            .map(String)
            .join("; ")}`,
        );
      }

      const action = String(
        item.action ?? "",
      ).toUpperCase();

      if (
        action &&
        ![
          "CREATE",
          "CREATED",
          "UPDATE",
          "UPDATED",
        ].includes(action)
      ) {
        problems.push(
          `Dòng ${row}: ${String(
            item.message ?? action,
          )}`,
        );
      }
    }
  }

  return problems;
};

const validateStudents = (
  rows: StudentImportRow[],
): string[] => {
  const errors: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const number = index + 2;

    if (
      !row.code.trim() ||
      !row.fullName.trim() ||
      !row.email.trim()
    ) {
      errors.push(
        `Dòng ${number}: Thiếu MSSV, họ tên hoặc email.`,
      );
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        row.email,
      )
    ) {
      errors.push(
        `Dòng ${number}: Email không hợp lệ.`,
      );
    }

    if (seen.has(normalize(row.code))) {
      errors.push(
        `Dòng ${number}: Trùng MSSV.`,
      );
    }

    seen.add(normalize(row.code));

    const academic = row.academic;

    if (
      !Number.isSafeInteger(academic?.programId) ||
      academic.programId <= 0 ||
      !Number.isSafeInteger(
        academic?.placement?.cohortId,
      ) ||
      academic.placement.cohortId <= 0 ||
      !Number.isSafeInteger(
        academic?.placement
          ?.currentAcademicPeriodId,
      ) ||
      academic.placement.currentAcademicPeriodId <=
        0 ||
      !["A", "B", "C", "D"].includes(
        academic?.placement?.groupCode ?? "",
      ) ||
      !Array.isArray(academic?.courseResults)
    ) {
      errors.push(
        `Dòng ${number}: Thiếu hoặc sai thông tin học vụ, khóa, nhóm, kỳ hiện tại.`,
      );
    }
  });

  return errors;
};

const validateGrades = (
  rows: CourseResultImportRow[],
): string[] => {
  const errors: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const number = index + 2;

    if (
      !row.code ||
      !row.courseCode ||
      !Number.isSafeInteger(
        row.academicPeriodId,
      )
    ) {
      errors.push(
        `Dòng ${number}: Thiếu MSSV, mã môn hoặc kỳ học.`,
      );
    }

    if (
      !["PASSED", "FAILED"].includes(
        row.status,
      )
    ) {
      errors.push(
        `Dòng ${number}: Trạng thái phải là Đạt hoặc Không đạt.`,
      );
    }

    if (
      row.score !== undefined &&
      (row.score < 0 || row.score > 10)
    ) {
      errors.push(
        `Dòng ${number}: Điểm số phải từ 0 đến 10.`,
      );
    }

    if (
      row.gradePoints !== undefined &&
      (row.gradePoints < 0 ||
        row.gradePoints > 4)
    ) {
      errors.push(
        `Dòng ${number}: Điểm hệ 4 phải từ 0 đến 4.`,
      );
    }

    const key = [
      normalize(row.code),
      normalize(row.courseCode),
      row.academicPeriodId,
    ].join("|");

    if (seen.has(key)) {
      errors.push(
        `Dòng ${number}: Trùng môn trong cùng kỳ.`,
      );
    }

    seen.add(key);
  });

  return errors;
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50";

const optionName = (
  options: CatalogOption[] | undefined,
  id: number,
) =>
  options?.find((item) => item.id === id)
    ?.label ?? `ID ${id}`;

export const EducationStudentImport: React.FC =
  () => {
    const [tab, setTab] =
      React.useState<Tab>("students");

    const [catalogs, setCatalogs] =
      React.useState<AcademicCatalogs | null>(
        null,
      );

    const [catalogError, setCatalogError] =
      React.useState("");

    const [catalogLoading, setCatalogLoading] =
      React.useState(false);

    const [catalogRefresh, setCatalogRefresh] =
      React.useState(0);

    const [students, setStudents] =
      React.useState<StudentImportRow[]>([]);

    const [grades, setGrades] =
      React.useState<CourseResultImportRow[]>(
        [],
      );

    const [studentFile, setStudentFile] =
      React.useState("");

    const [gradeFile, setGradeFile] =
      React.useState("");

    const [notice, setNotice] =
      React.useState<Notice | null>(null);

    const [busy, setBusy] = React.useState<
      "read" | "preview" | "commit" | null
    >(null);

    const [preview, setPreview] =
      React.useState<PreviewState | null>(
        null,
      );

    const [commit, setCommit] =
      React.useState<CommitState | null>(
        null,
      );

    const [search, setSearch] =
      React.useState("");

    const [showModal, setShowModal] =
      React.useState(false);

    const [showConfirm, setShowConfirm] =
      React.useState(false);

    const [form, setForm] =
      React.useState<StudentForm>(
        EMPTY_FORM,
      );

    const [keys, setKeys] = React.useState({
      students: createKey("student-import"),
      grades: createKey("grade-import"),
    });

    const inputRef =
      React.useRef<HTMLInputElement>(null);

    const isStudent = tab === "students";

    const total = isStudent
      ? students.length
      : grades.length;

    const issues = isStudent
      ? validateStudents(students)
      : validateGrades(grades);

    const activePreview =
      preview?.tab === tab
        ? preview
        : null;

    const activeCommit =
      commit?.tab === tab
        ? commit
        : null;

    const canCommit = Boolean(
      activePreview &&
        !activePreview.problems.length &&
        !activeCommit,
    );

    /* ===================================
       LOAD CATALOGS
       =================================== */

    React.useEffect(() => {
      let active = true;

      setCatalogLoading(true);
      setCatalogError("");

      void loadAcademicCatalogs()
        .then((data) => {
          if (active) {
            setCatalogs(data);
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setCatalogs(null);

            setCatalogError(
              error instanceof Error
                ? error.message
                : "Không tải được danh mục học vụ.",
            );
          }
        })
        .finally(() => {
          if (active) {
            setCatalogLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [catalogRefresh]);

    /* ===================================
       RESET BATCH
       =================================== */

    const resetBatch = (target: Tab) => {
      setPreview((old) =>
        old?.tab === target ? null : old,
      );

      setCommit((old) =>
        old?.tab === target ? null : old,
      );

      setKeys((old) => ({
        ...old,
        [target]: createKey(target),
      }));
    };

    /* ===================================
       READ FILE
       =================================== */

    const onFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];

      if (!file) return;

      try {
        if (!catalogs) {
          throw new Error(
            "Chưa tải được danh mục học vụ. Hãy bấm Tải lại danh mục.",
          );
        }

        if (
          !/\.(xlsx|xls|csv)$/i.test(file.name)
        ) {
          throw new Error(
            "Chỉ hỗ trợ tệp Excel hoặc CSV.",
          );
        }

        setBusy("read");
        setNotice(null);

        if (isStudent) {
          const parsed =
            await parseStudentImportWorkbook(
              file,
              catalogs,
            );

          setStudents(parsed);
          setStudentFile(file.name);

          resetBatch("students");

          setNotice({
            type: "success",
            message:
              `Đã đọc ${parsed.length} sinh viên cùng thông tin học vụ. ` +
              "Chưa lưu database.",
          });
        } else {
          const parsed =
            await parseCourseResultImportWorkbook(
              file,
              catalogs,
            );

          setGrades(parsed);
          setGradeFile(file.name);

          resetBatch("grades");

          setNotice({
            type: "success",
            message:
              `Đã đọc ${parsed.length} kết quả môn học. ` +
              "Chưa lưu database.",
          });
        }

        setSearch("");
      } catch (error) {
        setNotice({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không đọc được tệp.",
        });
      } finally {
        setBusy(null);
        event.target.value = "";
      }
    };

    /* ===================================
       ADD STUDENT
       =================================== */

    const onAddStudent = () => {
      if (!catalogs) return;

      const programId = Number(
        form.programId,
      );

      const cohortId = Number(
        form.cohortId,
      );

      const currentAcademicPeriodId =
        Number(
          form.currentAcademicPeriodId,
        );

      if (
        !catalogs.programs.some(
          (x) => x.id === programId,
        ) ||
        !catalogs.cohorts.some(
          (x) => x.id === cohortId,
        ) ||
        !catalogs.periods.some(
          (x) =>
            x.id ===
            currentAcademicPeriodId,
        ) ||
        !["A", "B", "C", "D"].includes(
          form.groupCode,
        )
      ) {
        setNotice({
          type: "error",
          message:
            "Vui lòng chọn đầy đủ chương trình, khóa, nhóm và kỳ học hợp lệ.",
        });

        return;
      }

      const row: StudentImportRow = {
        code: form.code.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        academic: {
          programId,
          placement: {
            cohortId,
            groupCode:
              form.groupCode as StudentPlacement["groupCode"],
            currentAcademicPeriodId,
          },
          courseResults: [],
        },
      };

      const errors = validateStudents([
        ...students,
        row,
      ]);

      if (errors.length) {
        setNotice({
          type: "error",
          message: errors[0],
        });

        return;
      }

      setStudents((old) => [
        ...old,
        row,
      ]);

      resetBatch("students");

      setForm(EMPTY_FORM);
      setShowModal(false);

      setNotice({
        type: "success",
        message:
          "Đã thêm sinh viên vào danh sách chờ Import. Chưa lưu database.",
      });
    };

    /* ===================================
       PREVIEW
       =================================== */

    const onPreview = async () => {
      if (
        busy ||
        !total ||
        issues.length
      ) {
        return;
      }

      setBusy("preview");
      setNotice(null);
      setPreview(null);
      setCommit(null);

      try {
        const raw = isStudent
          ? await importService.previewStudentImport({
              kind: "STUDENT",
              idempotencyKey:
                keys.students,
              rows: students,
            })
          : await importService.previewCourseResultImport({
              idempotencyKey:
                keys.grades,
              rows: grades,
            });

        const problems = inspectPreview(
          raw,
          total,
        );

        setPreview({
          tab,
          raw,
          problems,
        });

        setNotice({
          type: problems.length
            ? "error"
            : "success",
          message: problems.length
            ? "Backend đã phản hồi nhưng chưa đủ điều kiện xác nhận lưu. Xem chi tiết bên dưới."
            : "Preview từ Backend thành công. Chưa ghi dữ liệu vào database.",
        });
      } catch (error) {
        setNotice({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể Preview dữ liệu.",
        });
      } finally {
        setBusy(null);
      }
    };

    /* ===================================
       COMMIT
       =================================== */

    const onCommit = async () => {
      if (!canCommit || busy) {
        return;
      }

      setShowConfirm(false);
      setBusy("commit");

      try {
        const raw = isStudent
          ? await importService.commitStudentImport({
              kind: "STUDENT",
              idempotencyKey:
                keys.students,
              rows: students,
            })
          : await importService.commitCourseResultImport({
              idempotencyKey:
                keys.grades,
              rows: grades,
            });

        setCommit({
          tab,
          raw,
        });

        setNotice({
          type: "success",
          message:
            `Backend đã xác nhận lưu ${total} bản ghi. ` +
            "Kiểm tra kết quả ở bên dưới.",
        });
      } catch (error) {
        setNotice({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể Commit dữ liệu.",
        });
      } finally {
        setBusy(null);
      }
    };

    /* ===================================
       REMOVE / CLEAR
       =================================== */

    const removeRow = (index: number) => {
      if (isStudent) {
        setStudents((old) =>
          old.filter(
            (_, i) => i !== index,
          ),
        );
      } else {
        setGrades((old) =>
          old.filter(
            (_, i) => i !== index,
          ),
        );
      }

      resetBatch(tab);
    };

    const clearRows = () => {
      if (isStudent) {
        setStudents([]);
        setStudentFile("");
      } else {
        setGrades([]);
        setGradeFile("");
      }

      resetBatch(tab);
      setNotice(null);
    };

    /* ===================================
       FILTER
       =================================== */

    const filteredStudents = students
      .map((row, index) => ({
        row,
        index,
      }))
      .filter(({ row }) =>
        [
          row.code,
          row.fullName,
          row.email,
        ].some((v) =>
          normalize(v).includes(
            normalize(search),
          ),
        ),
      );

    const filteredGrades = grades
      .map((row, index) => ({
        row,
        index,
      }))
      .filter(({ row }) =>
        [
          row.code,
          row.courseCode,
          String(
            row.academicPeriodId,
          ),
        ].some((v) =>
          normalize(v).includes(
            normalize(search),
          ),
        ),
      );

    const visibleRows = isStudent
      ? filteredStudents.length
      : filteredGrades.length;

    /* ===================================
       RENDER
       =================================== */

    return (
      <div className="space-y-6 pb-10">
        <PageBanner
          title="Import dữ liệu học vụ"
          description="Nhập sinh viên mới và cập nhật kết quả học tập theo kỳ."
          badge="Phòng Đào tạo"
        />

        {notice && (
          <div
            className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <span className="flex items-start gap-2">
              {notice.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}

              {notice.message}
            </span>

            <button
              type="button"
              onClick={() =>
                setNotice(null)
              }
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* CHỌN CHỨC NĂNG */}

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              key: "students" as const,
              icon: Users,
              title: "Import sinh viên",
              description:
                "Sinh viên mới cần chương trình, khóa, nhóm và kỳ hiện tại.",
              count: students.length,
            },
            {
              key: "grades" as const,
              icon: GraduationCap,
              title:
                "Cập nhật kết quả học tập",
              description:
                "Nhập kết quả môn học theo từng kỳ cho sinh viên đã có.",
              count: grades.length,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                setTab(item.key);
                setSearch("");
                setNotice(null);
              }}
              className={`flex items-start gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
                tab === item.key
                  ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <span className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <item.icon size={24} />
              </span>

              <span>
                <span className="block text-lg font-bold text-slate-900">
                  {item.title}
                </span>

                <span className="mt-1 block text-sm text-slate-500">
                  {item.description}
                </span>

                <span className="mt-3 block text-xs font-semibold text-orange-600">
                  {item.count} dòng đang chuẩn bị
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* DANH MỤC BACKEND */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Danh mục học vụ từ Backend
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Chỉ sử dụng ID thật từ danh mục chương trình, khóa và kỳ học.
              </p>
            </div>

            <button
              type="button"
              className={secondaryButton}
              disabled={
                catalogLoading ||
                Boolean(busy)
              }
              onClick={() =>
                setCatalogRefresh(
                  (n) => n + 1,
                )
              }
            >
              <RefreshCw
                size={16}
                className={
                  catalogLoading
                    ? "animate-spin"
                    : ""
                }
              />
              Tải lại danh mục
            </button>
          </div>

          {catalogLoading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2
                size={16}
                className="animate-spin"
              />
              Đang tải danh mục...
            </p>
          ) : catalogError ? (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {catalogError}
            </p>
          ) : catalogs ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} />
              {catalogs.programs.length} chương trình
              {" · "}
              {catalogs.cohorts.length} khóa
              {" · "}
              {catalogs.periods.length} kỳ học
            </p>
          ) : null}
        </section>

        {/* UPLOAD */}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Bước 1 · Chọn tệp
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {isStudent
                    ? "Nhập danh sách sinh viên"
                    : "Nhập bảng điểm theo kỳ"}
                </h2>
              </div>

              <button
                type="button"
                className={secondaryButton}
                onClick={
                  isStudent
                    ? downloadStudentImportTemplate
                    : downloadCourseResultImportTemplate
                }
              >
                <Download size={17} />
                Tải file mẫu
              </button>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <FileSpreadsheet
                size={32}
                className="mx-auto text-emerald-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Chọn file Excel (.xlsx, .xls) hoặc CSV
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isStudent
                  ? studentFile
                  : gradeFile ||
                    "Chưa chọn file"}
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
                  className={primaryButton}
                  disabled={
                    !catalogs ||
                    Boolean(busy)
                  }
                  onClick={() =>
                    inputRef.current?.click()
                  }
                >
                  {busy === "read" ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload size={17} />
                  )}
                  Chọn file Excel
                </button>

                {isStudent && (
                  <button
                    type="button"
                    className={secondaryButton}
                    disabled={
                      !catalogs ||
                      Boolean(busy)
                    }
                    onClick={() =>
                      setShowModal(true)
                    }
                  >
                    <Plus size={17} />
                    Thêm sinh viên thủ công
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* HƯỚNG DẪN */}

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <BookOpen
                size={19}
                className="text-orange-500"
              />
              Quy trình sử dụng
            </h3>

            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
              <li>
                Tải mẫu Excel và điền thông tin theo danh mục Backend.
              </li>
              <li>
                Chọn file, kiểm tra dữ liệu trên giao diện.
              </li>
              <li>
                Gửi Preview để Backend kiểm tra.
              </li>
              <li>
                Chỉ xác nhận lưu khi Preview hợp lệ.
              </li>
            </ol>

            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              {isStudent
                ? "Sinh viên mới chưa có điểm vẫn gửi academic.courseResults: []."
                : "API nhập điểm mới chưa được xác nhận request/response và chưa deploy. Cần đối chiếu Swagger BE trước khi sử dụng thật."}
            </p>
          </aside>
        </div>

        {/* DATA TABLE */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Bước 2 · Kiểm tra dữ liệu
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {isStudent
                  ? "Danh sách sinh viên"
                  : "Danh sách kết quả môn học"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} dòng · {issues.length} lỗi
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  className={`${fieldClass} pl-9`}
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value,
                    )
                  }
                  placeholder="Tìm MSSV, tên, mã môn..."
                />
              </label>

              <button
                type="button"
                className={secondaryButton}
                disabled={
                  !total ||
                  Boolean(busy)
                }
                onClick={clearRows}
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
            </div>
          </div>

          {!total ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
              <FileSpreadsheet
                size={34}
                className="mx-auto mb-3"
              />
              Chưa có dữ liệu. Hãy chọn file hoặc thêm sinh viên.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  {isStudent ? (
                    <tr>
                      {[
                        "Dòng",
                        "MSSV",
                        "Họ và tên",
                        "Email",
                        "Chương trình",
                        "Khóa / Nhóm",
                        "Kỳ hiện tại",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  ) : (
                    <tr>
                      {[
                        "Dòng",
                        "MSSV",
                        "Mã môn",
                        "Kỳ học",
                        "Trạng thái",
                        "Điểm",
                        "Điểm hệ 4",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isStudent
                    ? filteredStudents
                        .slice(0, 50)
                        .map(
                          ({
                            row,
                            index,
                          }) => (
                            <tr
                              key={`${row.code}-${index}`}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-3 py-3 text-slate-400">
                                {index + 2}
                              </td>

                              <td className="px-3 py-3 font-semibold">
                                {row.code}
                              </td>

                              <td className="px-3 py-3">
                                {row.fullName}
                              </td>

                              <td className="px-3 py-3">
                                {row.email}
                              </td>

                              <td className="px-3 py-3">
                                {optionName(
                                  catalogs?.programs,
                                  row.academic.programId,
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {optionName(
                                  catalogs?.cohorts,
                                  row.academic.placement.cohortId,
                                )}
                                {" / "}
                                {
                                  row.academic.placement.groupCode
                                }
                              </td>

                              <td className="px-3 py-3">
                                {optionName(
                                  catalogs?.periods,
                                  row.academic.placement.currentAcademicPeriodId,
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  aria-label="Xóa dòng"
                                  disabled={Boolean(
                                    busy,
                                  )}
                                  onClick={() =>
                                    removeRow(
                                      index,
                                    )
                                  }
                                  className="text-red-500"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </td>
                            </tr>
                          ),
                        )
                    : filteredGrades
                        .slice(0, 50)
                        .map(
                          ({
                            row,
                            index,
                          }) => (
                            <tr
                              key={`${row.code}-${row.courseCode}-${index}`}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-3 py-3 text-slate-400">
                                {index + 2}
                              </td>

                              <td className="px-3 py-3 font-semibold">
                                {row.code}
                              </td>

                              <td className="px-3 py-3">
                                {
                                  row.courseCode
                                }
                              </td>

                              <td className="px-3 py-3">
                                {optionName(
                                  catalogs?.periods,
                                  row.academicPeriodId,
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {row.status ===
                                "PASSED"
                                  ? "Đạt"
                                  : "Không đạt"}
                              </td>

                              <td className="px-3 py-3">
                                {row.score ??
                                  "—"}
                              </td>

                              <td className="px-3 py-3">
                                {row.gradePoints ??
                                  "—"}
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  aria-label="Xóa dòng"
                                  disabled={Boolean(
                                    busy,
                                  )}
                                  onClick={() =>
                                    removeRow(
                                      index,
                                    )
                                  }
                                  className="text-red-500"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                </tbody>
              </table>

              {visibleRows > 50 && (
                <p className="border-t p-3 text-xs text-slate-500">
                  Chỉ hiển thị 50 dòng đầu; toàn bộ dữ liệu vẫn được giữ để Import.
                </p>
              )}
            </div>
          )}

          {issues.length > 0 && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">
                Dữ liệu cần sửa
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-5">
                {issues
                  .slice(0, 8)
                  .map(
                    (
                      error,
                      index,
                    ) => (
                      <li key={index}>
                        {error}
                      </li>
                    ),
                  )}
              </ul>

              {issues.length > 8 && (
                <p className="mt-2">
                  Còn{" "}
                  {issues.length - 8}{" "}
                  lỗi khác.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className={primaryButton}
              disabled={
                !total ||
                Boolean(
                  issues.length,
                ) ||
                Boolean(busy)
              }
              onClick={onPreview}
            >
              {busy === "preview" ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <ShieldCheck
                  size={17}
                />
              )}
              Kiểm tra với Backend
            </button>
          </div>
        </section>

        {/* PREVIEW BACKEND */}

        {activePreview && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Bước 3 · Kết quả Preview từ Backend
            </h2>

            {(() => {
              const result =
                asObject(
                  activePreview.raw,
                );

              return (
                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  Tổng:{" "}
                  {String(
                    result?.total ??
                      "Chưa xác nhận",
                  )}
                  {" · "}
                  Tạo mới:{" "}
                  {String(
                    result?.created ??
                      "—",
                  )}
                  {" · "}
                  Cập nhật:{" "}
                  {String(
                    result?.updated ??
                      "—",
                  )}
                </p>
              );
            })()}

            {activePreview.problems.length ? (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <p className="font-bold">
                  Chưa thể Commit
                </p>

                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {activePreview.problems.map(
                    (
                      problem,
                      index,
                    ) => (
                      <li key={index}>
                        {problem}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2
                  size={18}
                />
                Preview hợp lệ. Chưa lưu database.
              </p>
            )}

            {activeCommit && (
              <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">
                Backend đã phản hồi Commit thành công.
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={
                  !canCommit ||
                  Boolean(busy)
                }
                onClick={() =>
                  setShowConfirm(
                    true,
                  )
                }
              >
                <Upload size={17} />
                {activeCommit
                  ? "Đã lưu"
                  : "Xác nhận lưu dữ liệu"}
              </button>
            </div>
          </section>
        )}

        {/* MODAL THÊM SINH VIÊN */}

        {showModal && catalogs && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setShowModal(
                  false,
                );
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Thêm sinh viên thủ công
                </h3>

                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() =>
                    setShowModal(
                      false,
                    )
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Thông tin học vụ bắt buộc. Sinh viên mới có courseResults: [].
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  [
                    "Mã sinh viên",
                    "code",
                  ],
                  [
                    "Họ và tên",
                    "fullName",
                  ],
                  [
                    "Email",
                    "email",
                  ],
                ].map(
                  ([label, key]) => (
                    <label
                      key={key}
                      className={
                        key === "email"
                          ? "sm:col-span-2"
                          : ""
                      }
                    >
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {label} *
                      </span>

                      <input
                        className={
                          fieldClass
                        }
                        value={
                          form[
                            key as "code" | "fullName" | "email"
                          ]
                        }
                        onChange={(
                          e,
                        ) =>
                          setForm(
                            (
                              old,
                            ) => ({
                              ...old,
                              [key]:
                                e
                                  .target
                                  .value,
                            }),
                          )
                        }
                      />
                    </label>
                  ),
                )}

                {(
                  [
                    [
                      "Chương trình đào tạo",
                      "programId",
                      catalogs.programs,
                    ],
                    [
                      "Khóa",
                      "cohortId",
                      catalogs.cohorts,
                    ],
                    [
                      "Kỳ hiện tại",
                      "currentAcademicPeriodId",
                      catalogs.periods,
                    ],
                  ] as const
                ).map(
                  ([
                    label,
                    key,
                    options,
                  ]) => (
                    <label
                      key={key}
                    >
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {label} *
                      </span>

                      <select
                        className={
                          fieldClass
                        }
                        value={
                          form[
                            key
                          ]
                        }
                        onChange={(
                          e,
                        ) =>
                          setForm(
                            (
                              old,
                            ) => ({
                              ...old,
                              [key]:
                                e
                                  .target
                                  .value,
                            }),
                          )
                        }
                      >
                        <option value="">
                          -- Chọn --
                        </option>

                        {options.map(
                          (
                            item,
                          ) => (
                            <option
                              key={
                                item.id
                              }
                              value={
                                item.id
                              }
                            >
                              {
                                item.label
                              }{" "}
                              (ID{" "}
                              {
                                item.id
                              }
                              )
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  ),
                )}

                <label>
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nhóm *
                  </span>

                  <select
                    className={
                      fieldClass
                    }
                    value={
                      form.groupCode
                    }
                    onChange={(
                      e,
                    ) =>
                      setForm(
                        (
                          old,
                        ) => ({
                          ...old,
                          groupCode:
                            e
                              .target
                              .value,
                        }),
                      )
                    }
                  >
                    <option value="">
                      -- Chọn --
                    </option>

                    {[
                      "A",
                      "B",
                      "C",
                      "D",
                    ].map(
                      (
                        value,
                      ) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {
                            value
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className={
                    secondaryButton
                  }
                  onClick={() =>
                    setShowModal(
                      false,
                    )
                  }
                >
                  Hủy
                </button>

                <button
                  type="button"
                  className={
                    primaryButton
                  }
                  onClick={
                    onAddStudent
                  }
                >
                  <Plus
                    size={16}
                  />
                  Thêm vào danh sách
                </button>
              </div>
            </div>
          </div>
        )}

        {/* XÁC NHẬN COMMIT */}

        {showConfirm && activePreview && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                setShowConfirm(
                  false,
                );
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <AlertTriangle
                size={30}
                className="text-amber-600"
              />

              <h3 className="mt-3 text-xl font-bold text-slate-900">
                Xác nhận ghi dữ liệu thật?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Bạn sắp gọi{" "}
                <strong>
                  {isStudent
                    ? "POST /api/imports/commit"
                    : "POST /api/course-result-imports/commit"}
                </strong>{" "}
                để lưu {total} bản ghi vào database.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className={
                    secondaryButton
                  }
                  onClick={() =>
                    setShowConfirm(
                      false,
                    )
                  }
                >
                  Hủy
                </button>

                <button
                  type="button"
                  className={
                    primaryButton
                  }
                  disabled={Boolean(
                    busy,
                  )}
                  onClick={
                    onCommit
                  }
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
