import React from "react";
import * as XLSX from "xlsx";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

import {
  curriculumService,
  type CurriculumDetail,
  type CurriculumImportPayload,
  type CurriculumImportPreviewResponse,
  type Major,
} from "@/service/curriculum.service";

/* =========================================================
   TYPES
   ========================================================= */

type ExcelRow = Record<
  string,
  unknown
>;

interface CurriculumImportActionsProps {
  majors: Major[];

  selectedMajorCode: string | null;

  curriculumDetail: CurriculumDetail | null;

  onCommitted?: () => void;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const REQUIRED_SHEETS = [
  "01_Curriculum",
  "02_Courses",
  "03_Prerequisites",
  "04_Combos",
  "05_ComboCourses",
  "06_ChoiceGroups",
  "07_Equivalences",
] as const;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

const getString = (
  value: unknown,
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const getOptionalString = (
  value: unknown,
) => {
  const result =
    getString(value);

  return result
    ? result
    : null;
};

const getNumber = (
  value: unknown,
  fieldName: string,
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    throw new Error(
      `${fieldName} không được để trống.`,
    );
  }

  const result =
    Number(value);

  if (
    !Number.isFinite(result)
  ) {
    throw new Error(
      `${fieldName} phải là số hợp lệ.`,
    );
  }

  return result;
};

const getInteger = (
  value: unknown,
  fieldName: string,
) => {
  const result =
    getNumber(
      value,
      fieldName,
    );

  if (
    !Number.isInteger(result)
  ) {
    throw new Error(
      `${fieldName} phải là số nguyên.`,
    );
  }

  return result;
};

const getBoolean = (
  value: unknown,
  fieldName: string,
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  const normalized =
    getString(value)
      .toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "y",
      "có",
      "co",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
      "không",
      "khong",
    ].includes(normalized)
  ) {
    return false;
  }

  throw new Error(
    `${fieldName} chỉ nhận TRUE/FALSE hoặc 1/0.`,
  );
};

const splitCodes = (
  value: unknown,
) => {
  return getString(value)
    .split(/[;,|]/)
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
};

const getSemesterLabel = (
  semester: number,
) => {
  if (semester === 0) {
    return "Chuẩn bị";
  }

  return `Kỳ ${semester}`;
};

const createIdempotencyKey =
  () => {
    const suffix =
      typeof crypto !==
        "undefined" &&
      "randomUUID" in crypto
        ? crypto
            .randomUUID()
            .replace(
              /-/g,
              "",
            )
            .slice(0, 16)
        : Math.random()
            .toString(36)
            .slice(2, 16);

    return `curriculum-import-${Date.now()}-${suffix}`;
  };

/* =========================================================
   EXCEL HELPERS
   ========================================================= */

const getRows = (
  workbook: XLSX.WorkBook,
  sheetName: string,
) => {
  const sheet =
    workbook.Sheets[
      sheetName
    ];

  if (!sheet) {
    throw new Error(
      `Thiếu sheet "${sheetName}".`,
    );
  }

  const rows =
    XLSX.utils.sheet_to_json<ExcelRow>(
      sheet,
      {
        defval: "",
        raw: false,
      },
    );

  return rows.filter(
    (row) =>
      !Object.values(
        row,
      ).every(
        (value) =>
          getString(
            value,
          ) === "",
      ),
  );
};

const setWidths = (
  sheet: XLSX.WorkSheet,
  widths: number[],
) => {
  sheet["!cols"] =
    widths.map(
      (width) => ({
        wch: width,
      }),
    );
};

/* =========================================================
   COMPONENT
   ========================================================= */

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

    const handleDownloadTemplate =
      () => {
        const workbook =
          XLSX.utils.book_new();

        /* -------------------------
           01 Curriculum
           ------------------------- */

        const curriculumSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "code",
                "name",
                "version",
                "majorCode",
                "totalCredits",
                "effectiveYear",
                "gpaScale",
              ],
              [
                "",
                "",
                "",
                selectedMajorCode ??
                  "",
                "",
                "",
                "",
              ],
            ],
          );

        setWidths(
          curriculumSheet,
          [
            26,
            58,
            14,
            16,
            18,
            18,
            14,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          curriculumSheet,
          "01_Curriculum",
        );

        /* -------------------------
           02 Courses
           ------------------------- */

        const coursesSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "courseCode",
                "credits",
                "semester",
                "isRequired",
                "entryKind",
                "prerequisiteText",
              ],
            ],
          );

        setWidths(
          coursesSheet,
          [
            20,
            12,
            12,
            14,
            20,
            48,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          coursesSheet,
          "02_Courses",
        );

        /* -------------------------
           03 Prerequisites
           ------------------------- */

        const prerequisiteSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "courseCode",
                "groupCode",
                "minimumPassed",
                "prerequisiteCourseCodes",
              ],
            ],
          );

        setWidths(
          prerequisiteSheet,
          [
            20,
            20,
            18,
            52,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          prerequisiteSheet,
          "03_Prerequisites",
        );

        /* -------------------------
           04 Combos
           ------------------------- */

        const combosSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "code",
                "name",
                "selectionGroup",
                "note",
              ],
            ],
          );

        setWidths(
          combosSheet,
          [
            22,
            52,
            22,
            48,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          combosSheet,
          "04_Combos",
        );

        /* -------------------------
           05 Combo Courses
           ------------------------- */

        const comboCoursesSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "comboCode",
                "courseCode",
                "credits",
                "semester",
                "prerequisiteText",
                "note",
                "slotCourseCodes",
              ],
            ],
          );

        setWidths(
          comboCoursesSheet,
          [
            22,
            20,
            12,
            12,
            42,
            42,
            42,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          comboCoursesSheet,
          "05_ComboCourses",
        );

        /* -------------------------
           06 Choice Groups
           ------------------------- */

        const choiceGroupSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "comboCode",
                "code",
                "minCourses",
                "maxCourses",
                "courseCodes",
              ],
            ],
          );

        setWidths(
          choiceGroupSheet,
          [
            22,
            20,
            14,
            14,
            52,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          choiceGroupSheet,
          "06_ChoiceGroups",
        );

        /* -------------------------
           07 Equivalences
           ------------------------- */

        const equivalenceSheet =
          XLSX.utils.aoa_to_sheet(
            [
              [
                "sourceCourseCode",
                "targetCourseCode",
                "reason",
              ],
            ],
          );

        setWidths(
          equivalenceSheet,
          [
            22,
            22,
            52,
          ],
        );

        XLSX.utils.book_append_sheet(
          workbook,
          equivalenceSheet,
          "07_Equivalences",
        );

        XLSX.writeFile(
          workbook,
          "curriculum-import-template.xlsx",
        );
      };

    /* =====================================================
       COURSE ID RESOLVER
       ===================================================== */

    const resolveCourseIds =
      async (
        courseCodes: string[],
      ) => {
        const uniqueCodes =
          Array.from(
            new Set(
              courseCodes
                .map(
                  (code) =>
                    code.trim(),
                )
                .filter(Boolean),
            ),
          );

        const cache =
          new Map<
            string,
            number
          >();

        /*
         * Tận dụng data đã có trên màn hiện tại.
         */
        curriculumDetail?.courses.forEach(
          (course) => {
            cache.set(
              course.courseCode
                .trim()
                .toLowerCase(),
              course.courseId,
            );
          },
        );

        curriculumDetail?.combos.forEach(
          (combo) => {
            combo.courses.forEach(
              (course) => {
                cache.set(
                  course.courseCode
                    .trim()
                    .toLowerCase(),
                  course.courseId,
                );
              },
            );
          },
        );

        const unresolved =
          uniqueCodes.filter(
            (code) =>
              !cache.has(
                code.toLowerCase(),
              ),
          );

        /*
         * Không gọi cùng lúc quá nhiều API.
         */
        const concurrency =
          6;

        for (
          let index = 0;
          index <
          unresolved.length;
          index +=
            concurrency
        ) {
          const batch =
            unresolved.slice(
              index,
              index +
                concurrency,
            );

          const results =
            await Promise.all(
              batch.map(
                async (
                  code,
                ) => {
                  const response =
                    await curriculumService.searchCourses(
                      {
                        page: 1,
                        limit: 20,
                        search:
                          code,
                      },
                    );

                  const found =
                    response.data.items.find(
                      (
                        item,
                      ) =>
                        item.code
                          .trim()
                          .toLowerCase() ===
                        code.toLowerCase(),
                    );

                  if (!found) {
                    throw new Error(
                      `Không tìm thấy môn "${code}" trong danh mục môn học.`,
                    );
                  }

                  return {
                    code,
                    id:
                      found.id,
                  };
                },
              ),
            );

          results.forEach(
            (item) => {
              cache.set(
                item.code.toLowerCase(),
                item.id,
              );
            },
          );
        }

        return cache;
      };

    /* =====================================================
       PARSE WORKBOOK
       ===================================================== */

    const parseWorkbook =
      async (
        selectedFile: File,
      ) => {
        const buffer =
          await selectedFile.arrayBuffer();

        const workbook =
          XLSX.read(
            buffer,
            {
              type: "array",
            },
          );

        /*
         * Kiểm tra đủ 7 sheet.
         */
        REQUIRED_SHEETS.forEach(
          (sheetName) => {
            if (
              !workbook.SheetNames.includes(
                sheetName,
              )
            ) {
              throw new Error(
                `File Excel thiếu sheet "${sheetName}". Hãy dùng file mẫu mới nhất.`,
              );
            }
          },
        );

        /* =================================================
           01 CURRICULUM
           ================================================= */

        const curriculumRows =
          getRows(
            workbook,
            "01_Curriculum",
          );

        if (
          curriculumRows.length !==
          1
        ) {
          throw new Error(
            'Sheet "01_Curriculum" phải có đúng 1 dòng dữ liệu.',
          );
        }

        const curriculumRow =
          curriculumRows[0];

        const curriculumCode =
          getString(
            curriculumRow.code,
          );

        const curriculumName =
          getString(
            curriculumRow.name,
          );

        const version =
          getString(
            curriculumRow.version,
          );

        const majorCode =
          getString(
            curriculumRow.majorCode,
          ).toUpperCase();

        if (!curriculumCode) {
          throw new Error(
            "Mã chương trình không được để trống.",
          );
        }

        if (
          curriculumCode.length >
          100
        ) {
          throw new Error(
            "Mã chương trình tối đa 100 ký tự.",
          );
        }

        if (!curriculumName) {
          throw new Error(
            "Tên chương trình không được để trống.",
          );
        }

        if (
          curriculumName.length >
          200
        ) {
          throw new Error(
            "Tên chương trình tối đa 200 ký tự.",
          );
        }

        if (!version) {
          throw new Error(
            "Version không được để trống.",
          );
        }

        if (
          version.length >
          10
        ) {
          throw new Error(
            "Version tối đa 10 ký tự.",
          );
        }

        const major =
          majors.find(
            (item) =>
              item.code
                .toUpperCase() ===
              majorCode,
          );

        if (!major) {
          throw new Error(
            `Không tìm thấy chuyên ngành "${majorCode}".`,
          );
        }

        const totalCredits =
          getNumber(
            curriculumRow.totalCredits,
            "totalCredits",
          );

        if (
          totalCredits <=
            0 ||
          totalCredits >
            9999.99
        ) {
          throw new Error(
            "totalCredits phải lớn hơn 0 và không vượt quá 9999.99.",
          );
        }

        const effectiveYear =
          getInteger(
            curriculumRow.effectiveYear,
            "effectiveYear",
          );

        if (
          effectiveYear <
            1900 ||
          effectiveYear >
            2200
        ) {
          throw new Error(
            "effectiveYear phải nằm trong khoảng 1900–2200.",
          );
        }

        const gpaScale =
          getInteger(
            curriculumRow.gpaScale,
            "gpaScale",
          );

        /* =================================================
           02 COURSES
           ================================================= */

        const courseRows =
          getRows(
            workbook,
            "02_Courses",
          );

        if (
          courseRows.length ===
          0
        ) {
          throw new Error(
            'Sheet "02_Courses" phải có ít nhất 1 dòng.',
          );
        }

        const courses:
          CurriculumImportPayload["courses"] =
          courseRows.map(
            (
              row,
              index,
            ) => {
              const rowNumber =
                index + 2;

              const courseCode =
                getString(
                  row.courseCode,
                );

              if (!courseCode) {
                throw new Error(
                  `02_Courses dòng ${rowNumber}: thiếu courseCode.`,
                );
              }

              if (
                courseCode.length >
                20
              ) {
                throw new Error(
                  `02_Courses dòng ${rowNumber}: courseCode tối đa 20 ký tự.`,
                );
              }

              const credits =
                getNumber(
                  row.credits,
                  `02_Courses dòng ${rowNumber}: credits`,
                );

              if (
                credits <
                  0 ||
                credits >
                  9999.99
              ) {
                throw new Error(
                  `02_Courses dòng ${rowNumber}: credits không hợp lệ.`,
                );
              }

              const semester =
                getInteger(
                  row.semester,
                  `02_Courses dòng ${rowNumber}: semester`,
                );

              /*
               * Đồ án của mình có:
               * Chuẩn bị = 0
               * Kỳ 1 ... Kỳ 9
               */
              if (
                semester <
                  0 ||
                semester >
                  9
              ) {
                throw new Error(
                  `02_Courses dòng ${rowNumber}: semester chỉ nhận 0–9.`,
                );
              }

              const isRequired =
                getBoolean(
                  row.isRequired,
                  `02_Courses dòng ${rowNumber}: isRequired`,
                );

              const entryKind =
                (
                  getString(
                    row.entryKind,
                  ) ||
                  "COURSE"
                ).toUpperCase();

              if (
                ![
                  "COURSE",
                  "COMBO_SLOT",
                  "ELECTIVE_SLOT",
                ].includes(
                  entryKind,
                )
              ) {
                throw new Error(
                  `02_Courses dòng ${rowNumber}: entryKind chỉ nhận COURSE, COMBO_SLOT hoặc ELECTIVE_SLOT.`,
                );
              }

              return {
                courseCode,

                credits,

                semester,

                isRequired,

                entryKind:
                  entryKind as
                    | "COURSE"
                    | "COMBO_SLOT"
                    | "ELECTIVE_SLOT",

                prerequisiteText:
                  getOptionalString(
                    row.prerequisiteText,
                  ),
              };
            },
          );

        /*
         * Không cho trùng mã trong khung.
         */
        const lowerCourseCodes =
          courses.map(
            (course) =>
              (
                course.courseCode ??
                ""
              ).toLowerCase(),
          );

        const duplicateCodes =
          lowerCourseCodes.filter(
            (
              code,
              index,
              all,
            ) =>
              all.indexOf(
                code,
              ) !==
              index,
          );

        if (
          duplicateCodes.length >
          0
        ) {
          throw new Error(
            `02_Courses bị trùng mã môn: ${Array.from(
              new Set(
                duplicateCodes,
              ),
            ).join(", ")}.`,
          );
        }

        /*
         * Một kỳ tối đa 5 môn/học phần.
         *
         * COURSE + COMBO_SLOT + ELECTIVE_SLOT
         * đều chiếm 1 vị trí trong khung.
         */
        for (
          let semester = 0;
          semester <= 9;
          semester += 1
        ) {
          const count =
            courses.filter(
              (course) =>
                course.semester ===
                semester,
            ).length;

          if (count > 5) {
            throw new Error(
              `${getSemesterLabel(
                semester,
              )} có ${count} môn/học phần, vượt giới hạn tối đa 5.`,
            );
          }
        }

        /* =================================================
           OTHER SHEETS
           ================================================= */

        const prerequisiteRows =
          getRows(
            workbook,
            "03_Prerequisites",
          );

        const comboRows =
          getRows(
            workbook,
            "04_Combos",
          );

        const comboCourseRows =
          getRows(
            workbook,
            "05_ComboCourses",
          );

        const choiceGroupRows =
          getRows(
            workbook,
            "06_ChoiceGroups",
          );

        const equivalenceRows =
          getRows(
            workbook,
            "07_Equivalences",
          );

        /* =================================================
           RESOLVE ALL REQUIRED COURSE IDS
           ================================================= */

        const referencedCodes:
          string[] = [];

        prerequisiteRows.forEach(
          (row) => {
            referencedCodes.push(
              getString(
                row.courseCode,
              ),
            );

            referencedCodes.push(
              ...splitCodes(
                row.prerequisiteCourseCodes,
              ),
            );
          },
        );

        comboCourseRows.forEach(
          (row) => {
            referencedCodes.push(
              getString(
                row.courseCode,
              ),
            );

            referencedCodes.push(
              ...splitCodes(
                row.slotCourseCodes ??
                  row.slotCourseCode,
              ),
            );
          },
        );

        choiceGroupRows.forEach(
          (row) => {
            referencedCodes.push(
              ...splitCodes(
                row.courseCodes,
              ),
            );
          },
        );

        equivalenceRows.forEach(
          (row) => {
            referencedCodes.push(
              getString(
                row.sourceCourseCode,
              ),
            );

            referencedCodes.push(
              getString(
                row.targetCourseCode,
              ),
            );
          },
        );

        /*
         * COMBO_SLOT trong 02_Courses cũng cần ID
         * để tự map slot cho môn combo.
         */
        courses
          .filter(
            (course) =>
              course.entryKind ===
              "COMBO_SLOT",
          )
          .forEach(
            (course) => {
              if (
                course.courseCode
              ) {
                referencedCodes.push(
                  course.courseCode,
                );
              }
            },
          );

        /*
         * Nếu không khai báo ChoiceGroups,
         * FE tự tạo ALL nên cần ID của toàn bộ
         * môn trong combo.
         */
        if (
          choiceGroupRows.length ===
          0
        ) {
          comboCourseRows.forEach(
            (row) => {
              referencedCodes.push(
                getString(
                  row.courseCode,
                ),
              );
            },
          );
        }

        const courseIdMap =
          await resolveCourseIds(
            referencedCodes.filter(
              Boolean,
            ),
          );

        const getCourseId = (
          courseCode: string,
          context: string,
        ) => {
          if (!courseCode) {
            throw new Error(
              `${context}: thiếu mã môn.`,
            );
          }

          const id =
            courseIdMap.get(
              courseCode
                .trim()
                .toLowerCase(),
            );

          if (!id) {
            throw new Error(
              `${context}: không tìm thấy ID của môn ${courseCode}.`,
            );
          }

          return id;
        };

        /* =================================================
           03 PREREQUISITES
           ================================================= */

        const prerequisites:
          CurriculumImportPayload["prerequisites"] =
          prerequisiteRows.map(
            (
              row,
              index,
            ) => {
              const rowNumber =
                index + 2;

              const courseCode =
                getString(
                  row.courseCode,
                );

              const groupCode =
                getString(
                  row.groupCode,
                );

              if (!groupCode) {
                throw new Error(
                  `03_Prerequisites dòng ${rowNumber}: thiếu groupCode.`,
                );
              }

              if (
                groupCode.length >
                50
              ) {
                throw new Error(
                  `03_Prerequisites dòng ${rowNumber}: groupCode tối đa 50 ký tự.`,
                );
              }

              const minimumPassed =
                getInteger(
                  row.minimumPassed,
                  `03_Prerequisites dòng ${rowNumber}: minimumPassed`,
                );

              if (
                minimumPassed <
                1
              ) {
                throw new Error(
                  `03_Prerequisites dòng ${rowNumber}: minimumPassed phải >= 1.`,
                );
              }

              const prerequisiteCodes =
                splitCodes(
                  row.prerequisiteCourseCodes,
                );

              if (
                prerequisiteCodes.length ===
                0
              ) {
                throw new Error(
                  `03_Prerequisites dòng ${rowNumber}: phải có ít nhất 1 môn tiên quyết.`,
                );
              }

              return {
                courseId:
                  getCourseId(
                    courseCode,
                    `03_Prerequisites dòng ${rowNumber}`,
                  ),

                groupCode,

                minimumPassed,

                prerequisiteCourseIds:
                  prerequisiteCodes.map(
                    (
                      code,
                    ) =>
                      getCourseId(
                        code,
                        `03_Prerequisites dòng ${rowNumber}`,
                      ),
                  ),
              };
            },
          );

        /* =================================================
           04 COMBOS
           ================================================= */

        const comboDefinitions =
          comboRows.map(
            (
              row,
              index,
            ) => {
              const rowNumber =
                index + 2;

              const code =
                getString(
                  row.code,
                );

              const name =
                getString(
                  row.name,
                );

              if (!code) {
                throw new Error(
                  `04_Combos dòng ${rowNumber}: thiếu code.`,
                );
              }

              if (
                code.length >
                50
              ) {
                throw new Error(
                  `04_Combos dòng ${rowNumber}: code tối đa 50 ký tự.`,
                );
              }

              if (!name) {
                throw new Error(
                  `04_Combos dòng ${rowNumber}: thiếu name.`,
                );
              }

              if (
                name.length >
                200
              ) {
                throw new Error(
                  `04_Combos dòng ${rowNumber}: name tối đa 200 ký tự.`,
                );
              }

              return {
                code,
                name,

                selectionGroup:
                  getOptionalString(
                    row.selectionGroup,
                  ),

                note:
                  getOptionalString(
                    row.note,
                  ),
              };
            },
          );

        const comboMap =
          new Map(
            comboDefinitions.map(
              (combo) => [
                combo.code.toLowerCase(),
                combo,
              ],
            ),
          );

        /*
         * Nếu có dòng môn combo nhưng comboCode
         * không nằm trong 04_Combos thì chặn.
         */
        comboCourseRows.forEach(
          (
            row,
            index,
          ) => {
            const comboCode =
              getString(
                row.comboCode,
              );

            if (
              !comboMap.has(
                comboCode.toLowerCase(),
              )
            ) {
              throw new Error(
                `05_ComboCourses dòng ${index + 2}: combo "${comboCode}" không tồn tại trong 04_Combos.`,
              );
            }
          },
        );

        /* =================================================
           BUILD COMBO SLOT MAP
           ================================================= */

        const slotCodesBySemester =
          new Map<
            number,
            string[]
          >();

        courses
          .filter(
            (course) =>
              course.entryKind ===
              "COMBO_SLOT",
          )
          .forEach(
            (course) => {
              if (
                !course.courseCode
              ) {
                return;
              }

              const current =
                slotCodesBySemester.get(
                  course.semester,
                ) ?? [];

              current.push(
                course.courseCode,
              );

              slotCodesBySemester.set(
                course.semester,
                current,
              );
            },
          );

        /* =================================================
           05 COMBO COURSES
           ================================================= */

        const comboCoursesByCode =
          new Map<
            string,
            CurriculumImportPayload["combos"][number]["courses"]
          >();

        for (
          const combo of
          comboDefinitions
        ) {
          const rows =
            comboCourseRows.filter(
              (row) =>
                getString(
                  row.comboCode,
                ).toLowerCase() ===
                combo.code.toLowerCase(),
            );

          /*
           * Mỗi combo tự có index slot riêng.
           *
           * Ví dụ kỳ 7 có 2 slot:
           * môn 1 → slot 1
           * môn 2 → slot 2
           */
          const usedSlotCount =
            new Map<
              number,
              number
            >();

          const comboCourses:
            CurriculumImportPayload["combos"][number]["courses"] =
            [];

          for (
            let index = 0;
            index <
            rows.length;
            index += 1
          ) {
            const row =
              rows[index];

            const rowNumber =
              comboCourseRows.indexOf(
                row,
              ) + 2;

            const courseCode =
              getString(
                row.courseCode,
              );

            if (!courseCode) {
              throw new Error(
                `05_ComboCourses dòng ${rowNumber}: thiếu courseCode.`,
              );
            }

            const credits =
              getNumber(
                row.credits,
                `05_ComboCourses dòng ${rowNumber}: credits`,
              );

            const semester =
              getInteger(
                row.semester,
                `05_ComboCourses dòng ${rowNumber}: semester`,
              );

            if (
              semester <
                0 ||
              semester >
                9
            ) {
              throw new Error(
                `05_ComboCourses dòng ${rowNumber}: semester chỉ nhận 0–9.`,
              );
            }

            let slotCodes =
              splitCodes(
                row.slotCourseCodes ??
                  row.slotCourseCode,
              );

            /*
             * Nếu PĐT để trống slotCourseCodes:
             * FE tự lấy COMBO_SLOT đúng kỳ.
             */
            if (
              slotCodes.length ===
              0
            ) {
              const availableSlots =
                slotCodesBySemester.get(
                  semester,
                ) ?? [];

              const used =
                usedSlotCount.get(
                  semester,
                ) ?? 0;

              const slot =
                availableSlots[
                  used
                ];

              if (!slot) {
                throw new Error(
                  `${combo.code}: ${getSemesterLabel(
                    semester,
                  )} không còn vị trí combo cho môn ${courseCode}.`,
                );
              }

              slotCodes = [
                slot,
              ];

              usedSlotCount.set(
                semester,
                used + 1,
              );
            }

            comboCourses.push({
              /*
               * Combo course có thể dùng courseCode,
               * backend tự normalize thành CourseID.
               */
              courseCode,

              credits,

              semester,

              prerequisiteText:
                getOptionalString(
                  row.prerequisiteText,
                ),

              note:
                getOptionalString(
                  row.note,
                ),

              slotCourseIds:
                slotCodes.map(
                  (
                    slotCode,
                  ) =>
                    getCourseId(
                      slotCode,
                      `05_ComboCourses dòng ${rowNumber}`,
                    ),
                ),
            });
          }

          /*
           * Kiểm tra số môn của từng combo trong kỳ
           * không vượt số COMBO_SLOT.
           */
          for (
            let semester = 0;
            semester <= 9;
            semester += 1
          ) {
            const comboCourseCount =
              comboCourses.filter(
                (course) =>
                  course.semester ===
                  semester,
              ).length;

            if (
              comboCourseCount ===
              0
            ) {
              continue;
            }

            const slotCount =
              slotCodesBySemester.get(
                semester,
              )?.length ?? 0;

            if (
              comboCourseCount >
              slotCount
            ) {
              throw new Error(
                `${combo.code}: ${getSemesterLabel(
                  semester,
                )} có ${comboCourseCount} môn combo nhưng chỉ có ${slotCount} vị trí combo.`,
              );
            }
          }

          comboCoursesByCode.set(
            combo.code.toLowerCase(),
            comboCourses,
          );
        }

        /* =================================================
           06 CHOICE GROUPS
           ================================================= */

        const choiceGroupsByCombo =
          new Map<
            string,
            CurriculumImportPayload["combos"][number]["choiceGroups"]
          >();

        for (
          const combo of
          comboDefinitions
        ) {
          const rows =
            choiceGroupRows.filter(
              (row) =>
                getString(
                  row.comboCode,
                ).toLowerCase() ===
                combo.code.toLowerCase(),
            );

          const comboCourses =
            comboCoursesByCode.get(
              combo.code.toLowerCase(),
            ) ?? [];

          let groups:
            CurriculumImportPayload["combos"][number]["choiceGroups"] =
            [];

          if (
            rows.length ===
            0
          ) {
            /*
             * Không khai báo → chọn combo thì học
             * toàn bộ môn trong combo.
             */
            const ids =
              comboCourses.map(
                (course) =>
                  getCourseId(
                    course.courseCode ??
                      "",
                    `Combo ${combo.code}`,
                  ),
              );

            if (
              ids.length >
              0
            ) {
              groups = [
                {
                  code: "ALL",

                  minCourses:
                    ids.length,

                  maxCourses:
                    ids.length,

                  courseIds:
                    ids,
                },
              ];
            }
          } else {
            groups =
              rows.map(
                (
                  row,
                  index,
                ) => {
                  const rowNumber =
                    choiceGroupRows.indexOf(
                      row,
                    ) + 2;

                  const code =
                    getString(
                      row.code,
                    );

                  if (!code) {
                    throw new Error(
                      `06_ChoiceGroups dòng ${rowNumber}: thiếu code.`,
                    );
                  }

                  const minCourses =
                    getInteger(
                      row.minCourses,
                      `06_ChoiceGroups dòng ${rowNumber}: minCourses`,
                    );

                  const maxCourses =
                    getInteger(
                      row.maxCourses,
                      `06_ChoiceGroups dòng ${rowNumber}: maxCourses`,
                    );

                  if (
                    minCourses <
                      0 ||
                    maxCourses <
                      0 ||
                    minCourses >
                      maxCourses
                  ) {
                    throw new Error(
                      `06_ChoiceGroups dòng ${rowNumber}: min/max không hợp lệ.`,
                    );
                  }

                  const courseCodes =
                    splitCodes(
                      row.courseCodes,
                    );

                  if (
                    courseCodes.length ===
                    0
                  ) {
                    throw new Error(
                      `06_ChoiceGroups dòng ${rowNumber}: courseCodes không được để trống.`,
                    );
                  }

                  return {
                    code,

                    minCourses,

                    maxCourses,

                    courseIds:
                      courseCodes.map(
                        (
                          courseCode,
                        ) =>
                          getCourseId(
                            courseCode,
                            `06_ChoiceGroups dòng ${rowNumber}`,
                          ),
                      ),
                  };
                },
              );
          }

          /*
           * Backend rule đã test:
           * mỗi môn combo phải thuộc đúng 1 group.
           */
          const comboCourseIds =
            comboCourses.map(
              (course) =>
                getCourseId(
                  course.courseCode ??
                    "",
                  `Combo ${combo.code}`,
                ),
            );

          const memberships =
            new Map<
              number,
              number
            >();

          comboCourseIds.forEach(
            (id) => {
              memberships.set(
                id,
                0,
              );
            },
          );

          groups.forEach(
            (group) => {
              group.courseIds.forEach(
                (id) => {
                  if (
                    memberships.has(
                      id,
                    )
                  ) {
                    memberships.set(
                      id,
                      (
                        memberships.get(
                          id,
                        ) ??
                        0
                      ) + 1,
                    );
                  }
                },
              );
            },
          );

          for (
            const [
              courseId,
              membershipCount,
            ] of memberships
          ) {
            if (
              membershipCount !==
              1
            ) {
              throw new Error(
                `Combo ${combo.code}: môn ID ${courseId} phải thuộc đúng 1 nhóm lựa chọn.`,
              );
            }
          }

          choiceGroupsByCombo.set(
            combo.code.toLowerCase(),
            groups,
          );
        }

        /* =================================================
           BUILD COMBOS
           ================================================= */

        const combos:
          CurriculumImportPayload["combos"] =
          comboDefinitions.map(
            (combo) => ({
              code:
                combo.code,

              name:
                combo.name,

              selectionGroup:
                combo.selectionGroup,

              note:
                combo.note,

              courses:
                comboCoursesByCode.get(
                  combo.code.toLowerCase(),
                ) ?? [],

              choiceGroups:
                choiceGroupsByCombo.get(
                  combo.code.toLowerCase(),
                ) ?? [],
            }),
          );

        /* =================================================
           07 EQUIVALENCES
           ================================================= */

        const equivalences:
          CurriculumImportPayload["equivalences"] =
          equivalenceRows.map(
            (
              row,
              index,
            ) => {
              const rowNumber =
                index + 2;

              const sourceCode =
                getString(
                  row.sourceCourseCode,
                );

              const targetCode =
                getString(
                  row.targetCourseCode,
                );

              const reason =
                getString(
                  row.reason,
                );

              if (!reason) {
                throw new Error(
                  `07_Equivalences dòng ${rowNumber}: reason không được để trống.`,
                );
              }

              return {
                sourceCourseId:
                  getCourseId(
                    sourceCode,
                    `07_Equivalences dòng ${rowNumber}`,
                  ),

                targetCourseId:
                  getCourseId(
                    targetCode,
                    `07_Equivalences dòng ${rowNumber}`,
                  ),

                reason,
              };
            },
          );

        /* =================================================
           FINAL PAYLOAD
           ================================================= */

        const importPayload:
          CurriculumImportPayload =
          {
            idempotencyKey:
              createIdempotencyKey(),

            sourceName:
              selectedFile.name
                .slice(
                  0,
                  150,
                ),

            curriculum: {
              code:
                curriculumCode,

              name:
                curriculumName,

              version,

              majorId:
                major.id,

              totalCredits,

              effectiveYear,

              gpaScale,
            },

            courses,

            prerequisites,

            combos,

            equivalences,
          };

        return importPayload;
      };

    /* =====================================================
       FILE CHANGE
       ===================================================== */

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
           * Commit sẽ gửi lại đúng payload
           * đã dùng cho preview.
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
           * gửi lại đúng payload gốc,
           * cùng idempotencyKey đã preview.
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
                            <thead className="sticky top-0 bg-slate-50">
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

                            <tbody className="divide-y divide-slate-100">
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