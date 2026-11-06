import { createCurriculumWorkbookTools, getSemesterLabel } from '@/utils/curriculumImportWorkbook';
import { resolveCurriculumCourseIds } from '@/services/curriculumCourseResolver';
import React from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Upload, X } from "lucide-react";
import { curriculumService } from '@/services/curriculum.service';
import type { CurriculumDetail, CurriculumImportPayload, CurriculumImportPreviewResponse, Major } from '@/types/education/curriculum.types';

/* =========================================================
   TYPES
   ========================================================= */

interface CurriculumImportActionsProps {
  majors: Major[];

  selectedMajorCode: string | null;

  curriculumDetail: CurriculumDetail | null;

  onCommitted?: () => void;
}

export const CurriculumImportActions:
  React.FC<
    CurriculumImportActionsProps
  > = ({
    majors,
    selectedMajorCode,
    curriculumDetail,
    onCommitted,
  }) => {
    const [
      isOpen,
      setIsOpen,
    ] =
      React.useState(false);

    const [
      file,
      setFile,
    ] =
      React.useState<File | null>(
        null,
      );

    const [
      payload,
      setPayload,
    ] =
      React.useState<CurriculumImportPayload | null>(
        null,
      );

    const [
      preview,
      setPreview,
    ] =
      React.useState<
        CurriculumImportPreviewResponse["data"] | null
      >(null);

    const [
      isChecking,
      setIsChecking,
    ] =
      React.useState(false);

    const [
      isCommitting,
      setIsCommitting,
    ] =
      React.useState(false);

    const [
      message,
      setMessage,
    ] =
      React.useState<{
        type:
          | "success"
          | "error";

        text: string;
      } | null>(null);

    const inputRef =
      React.useRef<HTMLInputElement | null>(
        null,
      );

    /* =====================================================
       RESET
       ===================================================== */

    const resetImport =
      () => {
        setFile(null);

        setPayload(null);

        setPreview(null);

        setMessage(null);

        if (
          inputRef.current
        ) {
          inputRef.current.value =
            "";
        }
      };

    const openModal =
      () => {
        resetImport();

        setIsOpen(true);
      };

    const closeModal =
      () => {
        if (
          isChecking ||
          isCommitting
        ) {
          return;
        }

        resetImport();

        setIsOpen(false);
      };

    /* =====================================================
       DOWNLOAD TEMPLATE
       ===================================================== */

    const { handleDownloadTemplate, parseWorkbook } = createCurriculumWorkbookTools(majors, selectedMajorCode, curriculumDetail, codes => resolveCurriculumCourseIds(codes, curriculumDetail));

    const handleFileChange =
      (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => {
        const selectedFile =
          event.target.files?.[0];

        if (!selectedFile) {
          return;
        }

        const lowerName =
          selectedFile.name.toLowerCase();

        if (
          !lowerName.endsWith(
            ".xlsx",
          ) &&
          !lowerName.endsWith(
            ".xls",
          )
        ) {
          setMessage({
            type: "error",

            text:
              "Chỉ hỗ trợ file Excel .xlsx hoặc .xls.",
          });

          event.target.value =
            "";

          return;
        }

        setFile(
          selectedFile,
        );

        /*
         * Đổi file → preview cũ không còn hợp lệ.
         */
        setPayload(null);

        setPreview(null);

        setMessage(null);
      };

    /* =====================================================
       PREVIEW
       ===================================================== */

    const handlePreview =
      async () => {
        if (!file) {
          setMessage({
            type: "error",

            text:
              "Vui lòng chọn file Excel trước.",
          });

          return;
        }

        setIsChecking(true);

        setMessage(null);

        setPayload(null);

        setPreview(null);

        try {
          const parsedPayload =
            await parseWorkbook(
              file,
            );

          /*
           * Payload này được giữ nguyên.
           * Service đối chiếu đúng payload này
           * rồi commit bằng ID BE trả về khi kiểm tra.
           */
          setPayload(
            parsedPayload,
          );

          const response =
            await curriculumService.previewCurriculumImport(
              parsedPayload,
            );

          setPreview(
            response.data,
          );

          if (
            response.data.canCommit
          ) {
            setMessage({
              type:
                "success",

              text:
                "Dữ liệu hợp lệ và có thể nhập vào hệ thống.",
            });
          } else {
            setMessage({
              type: "error",

              text:
                "Backend đã kiểm tra nhưng dữ liệu chưa đủ điều kiện để nhập.",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",

            text:
              error instanceof Error
                ? error.message
                : "Không thể kiểm tra dữ liệu import.",
          });
        } finally {
          setIsChecking(
            false,
          );
        }
      };

    /* =====================================================
       COMMIT
       ===================================================== */

    const handleCommit =
      async () => {
        if (
          !payload ||
          !preview?.canCommit
        ) {
          return;
        }

        setIsCommitting(
          true,
        );

        setMessage(null);

        try {
          /*
           * Quan trọng:
           * Service lấy ID đã kiểm tra cho đúng payload,
           * gửi PATCH status COMMITTED và giữ ID khi thử lại.
           */
          await curriculumService.commitCurriculumImport(
            payload,
          );

          setMessage({
            type: "success",

            text:
              "Đã nhập chương trình đào tạo vào hệ thống thành công.",
          });

          /*
           * Cho người dùng thấy trạng thái success
           * một chút trước khi đóng modal.
           */
          window.setTimeout(
            () => {
              setIsOpen(
                false,
              );

              resetImport();

              onCommitted?.();
            },
            700,
          );
        } catch (error) {
          setMessage({
            type: "error",

            text:
              error instanceof Error
                ? error.message
                : "Không thể nhập chương trình đào tạo.",
          });
        } finally {
          setIsCommitting(
            false,
          );
        }
      };

    /* =====================================================
       RENDER
       ===================================================== */

    return (
      <>
        {/* ============================
            ACTION BUTTONS
            ============================ */}

        <button
          type="button"
          onClick={
            handleDownloadTemplate
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Download
            size={17}
          />

          Tải file mẫu
        </button>

        <button
          type="button"
          onClick={
            openModal
          }
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
        >
          <Upload
            size={17}
          />

          Import dữ liệu
        </button>

        {/* ============================
            MODAL
            ============================ */}

        {isOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 px-4 py-6">
            <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Import chương trình đào tạo
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Kiểm tra dữ liệu Excel trước khi nhập chính thức vào hệ thống.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    isChecking ||
                    isCommitting
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                {/* FILE UPLOAD */}

                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <FileSpreadsheet
                      size={24}
                    />
                  </div>

                  <h4 className="mt-4 font-semibold text-slate-800">
                    Chọn file chương trình đào tạo
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Hỗ trợ Excel (.xlsx, .xls)
                  </p>

                  <input
                    ref={
                      inputRef
                    }
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={
                      handleFileChange
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      inputRef.current?.click()
                    }
                    disabled={
                      isChecking ||
                      isCommitting
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    <Upload
                      size={17}
                    />

                    Chọn file
                  </button>

                  {file && (
                    <div className="mx-auto mt-4 max-w-lg rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
                      <p className="text-sm font-semibold text-slate-700">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {(
                          file.size /
                          1024
                        ).toFixed(
                          1,
                        )}{" "}
                        KB
                      </p>
                    </div>
                  )}
                </div>

                {/* TEMPLATE INFO */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                  <p className="text-sm font-semibold text-blue-800">
                    File mẫu gồm 7 sheet
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    01_Curriculum,
                    02_Courses,
                    03_Prerequisites,
                    04_Combos,
                    05_ComboCourses,
                    06_ChoiceGroups và
                    07_Equivalences.
                    Các sheet không có dữ liệu vẫn giữ nguyên hàng tiêu đề.
                  </p>
                </div>

                {/* MESSAGE */}

                {message && (
                  <div
                    className={`rounded-2xl border px-5 py-4 ${
                      message.type ===
                      "success"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.type ===
                      "success" ? (
                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />
                      ) : (
                        <AlertTriangle
                          size={20}
                          className="mt-0.5 shrink-0 text-red-600"
                        />
                      )}

                      <p
                        className={`text-sm leading-6 ${
                          message.type ===
                          "success"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {
                          message.text
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* PREVIEW */}

                {preview &&
                  payload && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              Kết quả kiểm tra
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              Dữ liệu dưới đây đã được backend kiểm tra và chuẩn hóa.
                            </p>
                          </div>

                          {preview.canCommit ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              Có thể nhập dữ liệu
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                              Chưa thể nhập
                            </span>
                          )}
                        </div>

                        {/* COUNTS */}

                        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <div className="rounded-xl bg-blue-50 p-4">
                            <p className="text-xs font-medium text-blue-600">
                              Môn học
                            </p>

                            <p className="mt-1 text-xl font-bold text-blue-800">
                              {
                                preview.courseCount
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-purple-50 p-4">
                            <p className="text-xs font-medium text-purple-600">
                              Combo
                            </p>

                            <p className="mt-1 text-xl font-bold text-purple-800">
                              {
                                preview.comboCount
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-amber-50 p-4">
                            <p className="text-xs font-medium text-amber-600">
                              Nhóm tiên quyết
                            </p>

                            <p className="mt-1 text-xl font-bold text-amber-800">
                              {
                                preview.prerequisiteGroupCount
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-xs font-medium text-emerald-600">
                              Tương đương
                            </p>

                            <p className="mt-1 text-xl font-bold text-emerald-800">
                              {
                                preview.equivalenceCount
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CURRICULUM INFO */}

                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h4 className="font-semibold text-slate-800">
                          Thông tin chương trình
                        </h4>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-400">
                              Mã chương trình
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {
                                preview.normalized.curriculum.code
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Phiên bản
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {
                                preview.normalized.curriculum.version
                              }
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-xs text-slate-400">
                              Tên chương trình
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {
                                preview.normalized.curriculum.name
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Tổng tín chỉ
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {
                                preview.normalized.curriculum.totalCredits
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Năm áp dụng
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                              {
                                preview.normalized.curriculum.effectiveYear
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COURSE PREVIEW */}

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4">
                          <h4 className="font-semibold text-slate-800">
                            Danh sách môn trong khung
                          </h4>
                        </div>

                        <div className="max-h-[320px] overflow-auto">
                          <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="sticky top-0 border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]">
                              <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">
                                  Mã môn
                                </th>

                                <th className="px-4 py-3 font-semibold text-slate-600">
                                  Tên môn
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                                  Kỳ
                                </th>

                                <th className="px-4 py-3 text-center font-semibold text-slate-600">
                                  Tín chỉ
                                </th>

                                <th className="px-4 py-3 font-semibold text-slate-600">
                                  Loại
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E2E8F0]">
                              {payload.courses.map(
                                (
                                  course,
                                  index,
                                ) => {
                                  const normalized =
                                    preview.normalized.courses[
                                      index
                                    ];

                                  return (
                                    <tr
                                      key={`${course.courseCode}-${index}`}
                                      className="bg-white transition-colors duration-150 hover:bg-[#EAF2FF]"
                                    >
                                      <td className="px-4 py-3 font-semibold text-orange-600">
                                        {
                                          course.courseCode
                                        }
                                      </td>

                                      <td className="px-4 py-3 text-slate-700">
                                        {normalized?.name ??
                                          "—"}
                                      </td>

                                      <td className="px-4 py-3 text-center text-slate-600">
                                        {getSemesterLabel(
                                          course.semester,
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-center text-slate-600">
                                        {
                                          course.credits
                                        }
                                      </td>

                                      <td className="px-4 py-3 text-slate-600">
                                        {
                                          course.entryKind
                                        }
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* FOOTER */}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    isChecking ||
                    isCommitting
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={
                    handlePreview
                  }
                  disabled={
                    !file ||
                    isChecking ||
                    isCommitting
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <Upload
                        size={17}
                      />

                      Kiểm tra dữ liệu
                    </>
                  )}
                </button>

                {preview && (
                  <button
                    type="button"
                    onClick={
                      handleCommit
                    }
                    disabled={
                      !preview.canCommit ||
                      !payload ||
                      isChecking ||
                      isCommitting
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCommitting ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />

                        Đang nhập...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={17}
                        />

                        Xác nhận nhập dữ liệu
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
