import * as XLSX from 'xlsx';
import type { CurriculumDetail, CurriculumImportPayload, Major } from '@/types/education/curriculum.types';
import { downloadCurriculumTemplate } from './curriculumTemplateWorkbook';
type ExcelRow = Record<
  string,
  unknown
>;

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

export const getSemesterLabel = (
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

export function createCurriculumWorkbookTools(majors: Major[], selectedMajorCode: string | null, curriculumDetail: CurriculumDetail | null, resolveCourseIds: (codes: string[]) => Promise<Map<string, number>>) {
    const handleDownloadTemplate = downloadCurriculumTemplate;

    /* =====================================================
       COURSE ID RESOLVER
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
              rows.map((row) => {
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

 return { handleDownloadTemplate, parseWorkbook };
}
