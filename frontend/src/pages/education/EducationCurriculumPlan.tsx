import React from "react";

import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

import {
  curriculumService,
  type CourseCatalogItem,
  type CurriculumCombo,
  type CurriculumCourse,
  type CurriculumDetail,
  type CurriculumSummary,
  type Major,
} from "@/service/curriculum.service";

/* =========================================================
   CONSTANTS
   ========================================================= */

const SUPPORTED_MAJOR_CODES = [
  "AI",
  "SE",
  "IA",
  "IS",
] as const;

const SEMESTERS = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
];

/* =========================================================
   TYPES
   ========================================================= */

type ToastType =
  | "success"
  | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

interface CourseFormState {
  code: string;
  name: string;

  semester: number;
  credits: number;

  prerequisiteText: string;

  isOjtPrerequisite: boolean;
}

interface ComboCourseFormRow {
  localId: string;

  code: string;
  name: string;

  semester: number;
  credits: number;

  prerequisiteText: string;
  note: string;
}

interface ComboFormState {
  code: string;
  name: string;
  note: string;

  courses: ComboCourseFormRow[];
}

/* =========================================================
   HELPERS
   ========================================================= */

const getSemesterLabel = (
  semester: number,
) => {
  if (semester === 0) {
    return "Chuẩn bị";
  }

  return `Kỳ ${semester}`;
};

const getStatusLabel = (
  status: string,
) => {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";

    case "PUBLISHED":
      return "Đã ban hành";

    case "ACTIVE":
      return "Đang áp dụng";

    case "ARCHIVED":
      return "Đã lưu trữ";

    default:
      return status;
  }
};

const getStatusClassName = (
  status: string,
) => {
  switch (status) {
    case "DRAFT":
      return "bg-amber-50 text-amber-700";

    case "PUBLISHED":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const matchesSearch = (
  keyword: string,
  ...values: Array<
    string | null | undefined
  >
) => {
  const normalizedKeyword =
    keyword
      .trim()
      .toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return values.some((value) =>
    (value ?? "")
      .toLowerCase()
      .includes(
        normalizedKeyword,
      ),
  );
};

const deduplicateMajors = (
  majors: Major[],
) => {
  const map =
    new Map<number, Major>();

  majors.forEach((major) => {
    map.set(
      major.id,
      major,
    );
  });

  return Array.from(
    map.values(),
  );
};

const createEmptyCourseForm = (
  semester: number,
): CourseFormState => ({
  code: "",
  name: "",

  semester,
  credits: 3,

  prerequisiteText: "",

  isOjtPrerequisite: false,
});

const createLocalId = () => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const createEmptyComboCourseRow = (
  semester: number,
): ComboCourseFormRow => ({
  localId: createLocalId(),

  code: "",
  name: "",

  semester,
  credits: 3,

  prerequisiteText: "",
  note: "",
});

const createEmptyComboForm = (
  semester: number,
): ComboFormState => ({
  code: "",
  name: "",
  note: "",

  courses: [
    createEmptyComboCourseRow(
      semester,
    ),
  ],
});

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationCurriculumPlan: React.FC =
  () => {
    /* ===================== DATA ===================== */

    const [
      majors,
      setMajors,
    ] =
      React.useState<Major[]>(
        [],
      );

    const [
      curriculums,
      setCurriculums,
    ] =
      React.useState<
        CurriculumSummary[]
      >([]);

    const [
      curriculumDetail,
      setCurriculumDetail,
    ] =
      React.useState<CurriculumDetail | null>(
        null,
      );

    /* ===================== SELECTION ===================== */

    const [
      selectedMajorId,
      setSelectedMajorId,
    ] =
      React.useState<number | null>(
        null,
      );

    const [
      selectedProgramId,
      setSelectedProgramId,
    ] =
      React.useState<number | null>(
        null,
      );

    const [
      selectedSemester,
      setSelectedSemester,
    ] =
      React.useState(1);

    const [
      searchTerm,
      setSearchTerm,
    ] =
      React.useState("");

    /* ===================== ADD COURSE ===================== */

    const [
      isCourseModalOpen,
      setIsCourseModalOpen,
    ] =
      React.useState(false);

    const [
      isSavingCourse,
      setIsSavingCourse,
    ] =
      React.useState(false);

    const [
      courseForm,
      setCourseForm,
    ] =
      React.useState<CourseFormState>(
        createEmptyCourseForm(1),
      );

    /* ===================== ADD COMBO ===================== */

    const [
      isComboModalOpen,
      setIsComboModalOpen,
    ] =
      React.useState(false);

    const [
      isSavingCombo,
      setIsSavingCombo,
    ] =
      React.useState(false);

    const [
      comboForm,
      setComboForm,
    ] =
      React.useState<ComboFormState>(
        createEmptyComboForm(1),
      );

    /* ===================== LOADING ===================== */

    const [
      isLoadingMajors,
      setIsLoadingMajors,
    ] =
      React.useState(true);

    const [
      isLoadingCurriculums,
      setIsLoadingCurriculums,
    ] =
      React.useState(false);

    const [
      isLoadingDetail,
      setIsLoadingDetail,
    ] =
      React.useState(false);

    /* ===================== TOAST ===================== */

    const [
      toast,
      setToast,
    ] =
      React.useState<ToastState | null>(
        null,
      );

    const toastTimeoutRef =
      React.useRef<number | null>(
        null,
      );

    const showToast =
      React.useCallback(
        (
          type: ToastType,
          message: string,
        ) => {
          setToast({
            type,
            message,
          });

          if (
            toastTimeoutRef.current !==
            null
          ) {
            window.clearTimeout(
              toastTimeoutRef.current,
            );
          }

          toastTimeoutRef.current =
            window.setTimeout(
              () => {
                setToast(
                  null,
                );

                toastTimeoutRef.current =
                  null;
              },
              3500,
            );
        },
        [],
      );

    React.useEffect(() => {
      return () => {
        if (
          toastTimeoutRef.current !==
          null
        ) {
          window.clearTimeout(
            toastTimeoutRef.current,
          );
        }
      };
    }, []);

    /* =====================================================
       LOAD SUPPORTED MAJORS
       ===================================================== */

    React.useEffect(() => {
      let cancelled = false;

      const loadMajors =
        async () => {
          try {
            setIsLoadingMajors(
              true,
            );

            const responses =
              await Promise.all(
                SUPPORTED_MAJOR_CODES.map(
                  (code) =>
                    curriculumService.searchMajors(
                      {
                        page: 1,
                        limit: 20,
                        search: code,
                      },
                    ),
                ),
              );

            if (cancelled) {
              return;
            }

            const allMajors =
              responses.flatMap(
                (response) =>
                  response.data.items,
              );

            const supportedMajors =
              deduplicateMajors(
                allMajors.filter(
                  (major) =>
                    SUPPORTED_MAJOR_CODES.includes(
                      major.code as
                        (typeof SUPPORTED_MAJOR_CODES)[number],
                    ),
                ),
              );

            const orderedMajors =
              SUPPORTED_MAJOR_CODES.flatMap(
                (code) =>
                  supportedMajors.filter(
                    (major) =>
                      major.code ===
                      code,
                  ),
              );

            setMajors(
              orderedMajors,
            );

            const preferredMajor =
              orderedMajors.find(
                (major) =>
                  major.code ===
                  "IS",
              ) ??
              orderedMajors[0];

            if (preferredMajor) {
              setSelectedMajorId(
                preferredMajor.id,
              );
            } else {
              throw new Error(
                "Không tìm thấy chuyên ngành phù hợp.",
              );
            }
          } catch (error) {
            if (cancelled) {
              return;
            }

            const message =
              error instanceof
              Error
                ? error.message
                : "Không thể tải danh sách chuyên ngành.";

            showToast(
              "error",
              message,
            );
          } finally {
            if (!cancelled) {
              setIsLoadingMajors(
                false,
              );
            }
          }
        };

      void loadMajors();

      return () => {
        cancelled = true;
      };
    }, [showToast]);

    /* =====================================================
       LOAD CURRICULUMS
       ===================================================== */

    React.useEffect(() => {
      if (
        selectedMajorId ===
        null
      ) {
        return;
      }

      const selectedMajor =
        majors.find(
          (major) =>
            major.id ===
            selectedMajorId,
        );

      if (!selectedMajor) {
        return;
      }

      let cancelled = false;

      const loadCurriculums =
        async () => {
          try {
            setIsLoadingCurriculums(
              true,
            );

            setCurriculumDetail(
              null,
            );

            setSelectedProgramId(
              null,
            );

            const response =
              await curriculumService.searchCurricula(
                {
                  page: 1,
                  limit: 100,

                  search:
                    selectedMajor.code,

                  majorId:
                    selectedMajor.id,
                },
              );

            if (cancelled) {
              return;
            }

            const items =
              response.data.items;

            setCurriculums(
              items,
            );

            if (
              items.length === 0
            ) {
              showToast(
                "error",
                `Chưa có khung chương trình cho chuyên ngành ${selectedMajor.name}.`,
              );

              return;
            }

            const preferred =
              selectedMajor.code ===
              "IS"
                ? items.find(
                    (
                      curriculum,
                    ) =>
                      curriculum.code ===
                      "BIT_IS_K18D_19A",
                  )
                : null;

            setSelectedProgramId(
              preferred?.id ??
                items[0].id,
            );

            setSelectedSemester(
              1,
            );

            setSearchTerm("");
          } catch (error) {
            if (cancelled) {
              return;
            }

            const message =
              error instanceof
              Error
                ? error.message
                : "Không thể tải danh sách khung chương trình.";

            setCurriculums([]);

            showToast(
              "error",
              message,
            );
          } finally {
            if (!cancelled) {
              setIsLoadingCurriculums(
                false,
              );
            }
          }
        };

      void loadCurriculums();

      return () => {
        cancelled = true;
      };
    }, [
      majors,
      selectedMajorId,
      showToast,
    ]);

    /* =====================================================
       LOAD DETAIL
       ===================================================== */

    React.useEffect(() => {
      if (
        selectedProgramId ===
        null
      ) {
        return;
      }

      let cancelled = false;

      const loadDetail =
        async () => {
          try {
            setIsLoadingDetail(
              true,
            );

            setCurriculumDetail(
              null,
            );

            const response =
              await curriculumService.getCurriculumDetail(
                selectedProgramId,
              );

            if (cancelled) {
              return;
            }

            setCurriculumDetail(
              response.data,
            );
          } catch (error) {
            if (cancelled) {
              return;
            }

            const message =
              error instanceof
              Error
                ? error.message
                : "Không thể tải chi tiết chương trình đào tạo.";

            showToast(
              "error",
              message,
            );
          } finally {
            if (!cancelled) {
              setIsLoadingDetail(
                false,
              );
            }
          }
        };

      void loadDetail();

      return () => {
        cancelled = true;
      };
    }, [
      selectedProgramId,
      showToast,
    ]);

    /* =====================================================
       SELECTED DATA
       ===================================================== */

    const selectedCurriculum =
      curriculums.find(
        (curriculum) =>
          curriculum.id ===
          selectedProgramId,
      ) ?? null;

    /* =====================================================
       COMBO SLOT STRUCTURE
       ===================================================== */

    const allComboSlots =
      curriculumDetail?.courses.filter(
        (course) =>
          course.entryKind ===
          "COMBO_SLOT",
      ) ?? [];

    const comboSlotsBySemester =
      React.useMemo(() => {
        const map =
          new Map<
            number,
            CurriculumCourse[]
          >();

        allComboSlots.forEach(
          (slot) => {
            const current =
              map.get(
                slot.semester,
              ) ?? [];

            current.push(
              slot,
            );

            current.sort(
              (a, b) =>
                a.courseId -
                b.courseId,
            );

            map.set(
              slot.semester,
              current,
            );
          },
        );

        return map;
      }, [allComboSlots]);

    const comboSemesterOptions =
      React.useMemo(
        () =>
          Array.from(
            comboSlotsBySemester.keys(),
          ).sort(
            (a, b) =>
              a - b,
          ),
        [
          comboSlotsBySemester,
        ],
      );

    const hasAnyComboSlots =
      allComboSlots.length >
      0;

    /* =====================================================
       SEMESTER DATA
       ===================================================== */

    const semesterEntries =
      curriculumDetail?.courses.filter(
        (course) =>
          course.semester ===
          selectedSemester,
      ) ?? [];

    const commonCourses =
      semesterEntries.filter(
        (course) =>
          course.entryKind ===
            "COURSE" &&
          matchesSearch(
            searchTerm,
            course.courseCode,
            course.name,
            course.prerequisiteText,
          ),
      );

    const comboSlots =
      semesterEntries.filter(
        (course) =>
          course.entryKind ===
          "COMBO_SLOT",
      );

    const electiveSlots =
      semesterEntries.filter(
        (course) =>
          course.entryKind ===
            "ELECTIVE_SLOT" &&
          matchesSearch(
            searchTerm,
            course.courseCode,
            course.name,
            course.prerequisiteText,
          ),
      );

    const combosInSemester:
      Array<
        CurriculumCombo & {
          visibleCourses: CurriculumCombo["courses"];
        }
      > =
      curriculumDetail?.combos
        .map((combo) => {
          const courses =
            combo.courses.filter(
              (course) =>
                course.semester ===
                  selectedSemester &&
                matchesSearch(
                  searchTerm,
                  course.courseCode,
                  course.name,
                  course.prerequisiteText,
                ),
            );

          return {
            ...combo,
            visibleCourses:
              courses,
          };
        })
        .filter(
          (combo) =>
            combo.visibleCourses
              .length > 0,
        ) ?? [];

    const totalComboOptionsInSemester =
      curriculumDetail?.combos.filter(
        (combo) =>
          combo.courses.some(
            (course) =>
              course.semester ===
              selectedSemester,
          ),
      ).length ?? 0;

    /* =====================================================
       COMMON CATALOG RESOLVER
       ===================================================== */

    const resolveCatalogCourse =
      async ({
        code,
        name,
        credits,
        isOjtPrerequisite,
      }: {
        code: string;
        name: string;
        credits: number;
        isOjtPrerequisite: boolean;
      }): Promise<{
        course: CourseCatalogItem;
        created: boolean;
      }> => {
        const normalizedCode =
          code.trim();

        const response =
          await curriculumService.searchCourses(
            {
              page: 1,
              limit: 20,
              search:
                normalizedCode,
            },
          );

        let found =
          response.data.items.find(
            (course) =>
              course.code
                .trim()
                .toLowerCase() ===
              normalizedCode.toLowerCase(),
          );

        if (found) {
          return {
            course: found,
            created: false,
          };
        }

        await curriculumService.createCourse(
          {
            code:
              normalizedCode,

            name:
              name.trim(),

            defaultCredits:
              credits,

            isOjtPrerequisite,
          },
        );

        const afterCreate =
          await curriculumService.searchCourses(
            {
              page: 1,
              limit: 20,
              search:
                normalizedCode,
            },
          );

        found =
          afterCreate.data.items.find(
            (course) =>
              course.code
                .trim()
                .toLowerCase() ===
              normalizedCode.toLowerCase(),
          );

        if (!found) {
          throw new Error(
            `Đã tạo môn ${normalizedCode} nhưng chưa thể xác định ID môn vừa tạo.`,
          );
        }

        return {
          course: found,
          created: true,
        };
      };

    /* =====================================================
       HANDLERS
       ===================================================== */

    const handleMajorChange = (
      event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
      setSelectedMajorId(
        Number(
          event.target.value,
        ),
      );

      setSearchTerm("");
    };

    const handleCurriculumChange =
      (
        event: React.ChangeEvent<HTMLSelectElement>,
      ) => {
        setSelectedProgramId(
          Number(
            event.target.value,
          ),
        );

        setSelectedSemester(
          1,
        );

        setSearchTerm("");
      };

    /* =====================================================
       ADD COURSE MODAL
       ===================================================== */

    const openAddCourseModal =
      () => {
        if (!curriculumDetail) {
          return;
        }

        setCourseForm(
          createEmptyCourseForm(
            selectedSemester,
          ),
        );

        setIsCourseModalOpen(
          true,
        );
      };

    const closeAddCourseModal =
      () => {
        if (isSavingCourse) {
          return;
        }

        setIsCourseModalOpen(
          false,
        );
      };

    /* =====================================================
       ADD NORMAL COURSE
       ===================================================== */

    const handleAddCourseSubmit =
      async (
        event: React.FormEvent,
      ) => {
        event.preventDefault();

        if (!curriculumDetail) {
          showToast(
            "error",
            "Chưa chọn khung chương trình.",
          );

          return;
        }

        const code =
          courseForm.code.trim();

        const name =
          courseForm.name.trim();

        const prerequisiteText =
          courseForm.prerequisiteText.trim();

        if (!code) {
          showToast(
            "error",
            "Vui lòng nhập mã môn học.",
          );

          return;
        }

        if (!name) {
          showToast(
            "error",
            "Vui lòng nhập tên môn học.",
          );

          return;
        }

        if (
          courseForm.credits <
            0 ||
          Number.isNaN(
            courseForm.credits,
          )
        ) {
          showToast(
            "error",
            "Số tín chỉ không hợp lệ.",
          );

          return;
        }

        const alreadyInCurriculum =
          curriculumDetail.courses.some(
            (course) =>
              course.courseCode
                .trim()
                .toLowerCase() ===
              code.toLowerCase(),
          );

        if (
          alreadyInCurriculum
        ) {
          showToast(
            "error",
            `Môn ${code} đã có trong khung ${curriculumDetail.code}.`,
          );

          return;
        }

        /*
         * Một sinh viên học tối đa 5 môn/học phần
         * trong một kỳ.
         */
        const semesterStructure =
          curriculumDetail.courses.filter(
            (course) =>
              course.semester ===
              courseForm.semester,
          );

        const currentStudySlots =
          semesterStructure.filter(
            (course) =>
              course.entryKind ===
                "COURSE" ||
              course.entryKind ===
                "COMBO_SLOT" ||
              course.entryKind ===
                "ELECTIVE_SLOT",
          ).length;

        if (
          currentStudySlots >=
          5
        ) {
          showToast(
            "error",
            `${getSemesterLabel(
              courseForm.semester,
            )} đã đủ tối đa 5 môn/học phần theo khung chương trình.`,
          );

          return;
        }

        setIsSavingCourse(
          true,
        );

        let createdNewCourse =
          false;

        try {
          const resolved =
            await resolveCatalogCourse(
              {
                code,
                name,

                credits:
                  courseForm.credits,

                isOjtPrerequisite:
                  courseForm.isOjtPrerequisite,
              },
            );

          createdNewCourse =
            resolved.created;

          const catalogCourse =
            resolved.course;

          const existingCourses =
            curriculumDetail.courses.map(
              (course) => ({
                courseId:
                  course.courseId,

                credits:
                  course.credits,

                semester:
                  course.semester,

                isRequired:
                  course.isRequired ??
                  true,

                entryKind:
                  course.entryKind,

                prerequisiteText:
                  course.prerequisiteText?.trim() ||
                  "None",
              }),
            );

          const newCourse = {
            courseId:
              catalogCourse.id,

            credits:
              courseForm.credits,

            semester:
              courseForm.semester,

            isRequired: true,

            entryKind:
              "COURSE" as const,

            prerequisiteText:
              prerequisiteText ||
              "None",
          };

          await curriculumService.updateCurriculumCourses(
            {
              programId:
                curriculumDetail.id,

              courses: [
                ...existingCourses,
                newCourse,
              ],
            },
          );

          const detailResponse =
            await curriculumService.getCurriculumDetail(
              curriculumDetail.id,
            );

          setCurriculumDetail(
            detailResponse.data,
          );

          setSelectedSemester(
            courseForm.semester,
          );

          setSearchTerm("");

          setIsCourseModalOpen(
            false,
          );

          showToast(
            "success",
            `Đã thêm môn ${catalogCourse.code} vào ${getSemesterLabel(
              courseForm.semester,
            )} của khung ${curriculumDetail.code}.`,
          );
        } catch (error) {
          const message =
            error instanceof
            Error
              ? error.message
              : "Không thể thêm môn học.";

          if (
            createdNewCourse
          ) {
            showToast(
              "error",
              `${message} Môn đã được tạo nhưng có thể chưa được gắn vào khung chương trình.`,
            );
          } else {
            showToast(
              "error",
              message,
            );
          }
        } finally {
          setIsSavingCourse(
            false,
          );
        }
      };

    /* =====================================================
       ADD COMBO MODAL
       ===================================================== */

    const getDefaultComboSemester =
      () => {
        if (
          comboSlotsBySemester.has(
            selectedSemester,
          )
        ) {
          return selectedSemester;
        }

        return (
          comboSemesterOptions[0] ??
          1
        );
      };

    const openAddComboModal =
      () => {
        if (!curriculumDetail) {
          return;
        }

        if (
          !hasAnyComboSlots
        ) {
          showToast(
            "error",
            "Khung chương trình này chưa có vị trí môn combo.",
          );

          return;
        }

        setComboForm(
          createEmptyComboForm(
            getDefaultComboSemester(),
          ),
        );

        setIsComboModalOpen(
          true,
        );
      };

    const closeAddComboModal =
      () => {
        if (isSavingCombo) {
          return;
        }

        setIsComboModalOpen(
          false,
        );
      };

    const updateComboCourseRow =
      (
        localId: string,
        patch: Partial<ComboCourseFormRow>,
      ) => {
        setComboForm(
          (previous) => ({
            ...previous,

            courses:
              previous.courses.map(
                (course) =>
                  course.localId ===
                  localId
                    ? {
                        ...course,
                        ...patch,
                      }
                    : course,
              ),
          }),
        );
      };

    const addComboCourseRow =
      () => {
        const defaultSemester =
          getDefaultComboSemester();

        setComboForm(
          (previous) => ({
            ...previous,

            courses: [
              ...previous.courses,

              createEmptyComboCourseRow(
                defaultSemester,
              ),
            ],
          }),
        );
      };

    const removeComboCourseRow =
      (
        localId: string,
      ) => {
        setComboForm(
          (previous) => {
            if (
              previous.courses
                .length <= 1
            ) {
              return previous;
            }

            return {
              ...previous,

              courses:
                previous.courses.filter(
                  (course) =>
                    course.localId !==
                    localId,
                ),
            };
          },
        );
      };

    /* =====================================================
       CREATE COMBO
       ===================================================== */

    const handleAddComboSubmit =
      async (
        event: React.FormEvent,
      ) => {
        event.preventDefault();

        if (!curriculumDetail) {
          showToast(
            "error",
            "Chưa chọn khung chương trình.",
          );

          return;
        }

        const comboCode =
          comboForm.code.trim();

        const comboName =
          comboForm.name.trim();

        const comboNote =
          comboForm.note.trim();

        if (!comboCode) {
          showToast(
            "error",
            "Vui lòng nhập mã combo.",
          );

          return;
        }

        if (!comboName) {
          showToast(
            "error",
            "Vui lòng nhập tên combo.",
          );

          return;
        }

        if (
          comboForm.courses.length ===
          0
        ) {
          showToast(
            "error",
            "Combo phải có ít nhất một môn học.",
          );

          return;
        }

        /*
         * Chuẩn hóa các dòng môn.
         */
        const normalizedRows =
          comboForm.courses.map(
            (course) => ({
              ...course,

              code:
                course.code.trim(),

              name:
                course.name.trim(),

              prerequisiteText:
                course.prerequisiteText.trim(),

              note:
                course.note.trim(),
            }),
          );

        /*
         * Validate từng môn.
         */
        for (const row of normalizedRows) {
          if (!row.code) {
            showToast(
              "error",
              "Vui lòng nhập đầy đủ mã môn cho combo.",
            );

            return;
          }

          if (!row.name) {
            showToast(
              "error",
              `Vui lòng nhập tên môn ${row.code}.`,
            );

            return;
          }

          if (
            Number.isNaN(
              row.credits,
            ) ||
            row.credits < 0
          ) {
            showToast(
              "error",
              `Số tín chỉ của môn ${row.code} không hợp lệ.`,
            );

            return;
          }

          if (
            !comboSlotsBySemester.has(
              row.semester,
            )
          ) {
            showToast(
              "error",
              `${getSemesterLabel(
                row.semester,
              )} không có vị trí môn combo trong khung này.`,
            );

            return;
          }
        }

        /*
         * Không cho lặp mã môn trong cùng combo.
         */
        const normalizedCodes =
          normalizedRows.map(
            (row) =>
              row.code.toLowerCase(),
          );

        if (
          new Set(
            normalizedCodes,
          ).size !==
          normalizedCodes.length
        ) {
          showToast(
            "error",
            "Một môn không thể xuất hiện hai lần trong cùng combo.",
          );

          return;
        }

        /*
         * Số môn combo trong một kỳ
         * không được vượt số COMBO_SLOT
         * của kỳ đó.
         */
        const rowCountBySemester =
          new Map<number, number>();

        normalizedRows.forEach(
          (row) => {
            rowCountBySemester.set(
              row.semester,

              (rowCountBySemester.get(
                row.semester,
              ) ?? 0) + 1,
            );
          },
        );

        for (
          const [
            semester,
            count,
          ] of rowCountBySemester
        ) {
          const slotCount =
            comboSlotsBySemester.get(
              semester,
            )?.length ?? 0;

          if (
            count >
            slotCount
          ) {
            showToast(
              "error",
              `${getSemesterLabel(
                semester,
              )} chỉ có ${slotCount} vị trí môn combo nhưng bạn đang thêm ${count} môn.`,
            );

            return;
          }
        }

        /*
         * Kiểm tra trùng code ngay trên detail hiện tại.
         */
        const existingOnDetail =
          curriculumDetail.combos.find(
            (combo) =>
              combo.code
                .trim()
                .toLowerCase() ===
              comboCode.toLowerCase(),
          );

        if (
          existingOnDetail &&
          existingOnDetail.courses
            .length > 0
        ) {
          showToast(
            "error",
            `Combo ${comboCode} đã tồn tại trong khung chương trình.`,
          );

          return;
        }

        setIsSavingCombo(
          true,
        );

        let createdCombo =
          false;

        let createdCatalogCourse =
          false;

        try {
          /*
           * Search combo thật từ backend.
           */
          const comboSearch =
            await curriculumService.searchCurriculumCombos(
              {
                programId:
                  curriculumDetail.id,
              },
            );

          let targetCombo =
            comboSearch.data.find(
              (combo) =>
                combo.code
                  .trim()
                  .toLowerCase() ===
                comboCode.toLowerCase(),
            );

          /*
           * Nếu tồn tại và đã có môn thì chặn.
           * Nếu tồn tại nhưng chưa có môn có thể là
           * lần tạo trước bị lỗi ở bước PUT,
           * nên FE tiếp tục dùng combo đó.
           */
          if (
            targetCombo &&
            targetCombo.courses
              .length > 0
          ) {
            throw new Error(
              `Combo ${comboCode} đã tồn tại và đã được cấu hình môn học.`,
            );
          }

          /*
           * Chưa có → tạo combo.
           */
          if (!targetCombo) {
            await curriculumService.createCurriculumCombo(
              {
                code:
                  comboCode,

                name:
                  comboName,

                selectionGroup:
                  null,

                note:
                  comboNote ||
                  null,

                programId:
                  curriculumDetail.id,
              },
            );

            createdCombo =
              true;

            /*
             * Search lại để lấy comboId thật.
             */
            const afterCreate =
              await curriculumService.searchCurriculumCombos(
                {
                  programId:
                    curriculumDetail.id,
                },
              );

            targetCombo =
              afterCreate.data.find(
                (combo) =>
                  combo.code
                    .trim()
                    .toLowerCase() ===
                  comboCode.toLowerCase(),
              );

            if (!targetCombo) {
              throw new Error(
                `Đã tạo combo ${comboCode} nhưng chưa thể xác định ID combo.`,
              );
            }
          }

          /*
           * Dùng thứ tự môn trong từng kỳ
           * để map lần lượt vào COMBO_SLOT.
           *
           * slotCourseIds phải là CourseID
           * của placeholder COMBO_SLOT.
           */
          const nextSlotIndexBySemester =
            new Map<number, number>();

          const comboCoursePayload = [];

          for (const row of normalizedRows) {
            const resolved =
              await resolveCatalogCourse(
                {
                  code:
                    row.code,

                  name:
                    row.name,

                  credits:
                    row.credits,

                  isOjtPrerequisite:
                    false,
                },
              );

            if (
              resolved.created
            ) {
              createdCatalogCourse =
                true;
            }

            const slotIndex =
              nextSlotIndexBySemester.get(
                row.semester,
              ) ?? 0;

            const slots =
              comboSlotsBySemester.get(
                row.semester,
              ) ?? [];

            const slot =
              slots[
                slotIndex
              ];

            if (!slot) {
              throw new Error(
                `Không tìm thấy vị trí combo phù hợp ở ${getSemesterLabel(
                  row.semester,
                )}.`,
              );
            }

            nextSlotIndexBySemester.set(
              row.semester,
              slotIndex + 1,
            );

            comboCoursePayload.push(
              {
                /*
                 * Chỉ gửi courseId,
                 * không gửi courseCode cùng lúc.
                 */
                courseId:
                  resolved.course.id,

                credits:
                  row.credits,

                semester:
                  row.semester,

                prerequisiteText:
                  row.prerequisiteText ||
                  null,

                note:
                  row.note ||
                  null,

                /*
                 * CourseID của COMBO_SLOT.
                 */
                slotCourseIds: [
                  slot.courseId,
                ],
              },
            );
          }

          /*
           * choiceGroups là field bắt buộc.
           * Combo hiện tại không có nhóm chọn nội bộ.
           */
          await curriculumService.updateComboCourses(
            {
              comboId:
                targetCombo.id,

              courses:
                comboCoursePayload,

              choiceGroups: [],
            },
          );

          /*
           * Reload detail.
           */
          const detailResponse =
            await curriculumService.getCurriculumDetail(
              curriculumDetail.id,
            );

          setCurriculumDetail(
            detailResponse.data,
          );

          const firstSemester =
            normalizedRows[0]
              ?.semester;

          if (
            firstSemester !==
            undefined
          ) {
            setSelectedSemester(
              firstSemester,
            );
          }

          setSearchTerm("");

          setIsComboModalOpen(
            false,
          );

          showToast(
            "success",
            `Đã tạo combo ${comboCode} và cấu hình ${normalizedRows.length} môn học.`,
          );
        } catch (error) {
          const message =
            error instanceof
            Error
              ? error.message
              : "Không thể tạo combo.";

          if (
            createdCombo ||
            createdCatalogCourse
          ) {
            showToast(
              "error",
              `${message} Một phần dữ liệu có thể đã được tạo nhưng chưa cấu hình hoàn tất.`,
            );
          } else {
            showToast(
              "error",
              message,
            );
          }
        } finally {
          setIsSavingCombo(
            false,
          );
        }
      };

    /* =====================================================
       COURSE TABLE
       ===================================================== */

    const renderCourseTable =
      (
        courses: CurriculumCourse[],
      ) => {
        if (
          courses.length === 0
        ) {
          return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-400">
              Không có môn học phù hợp.
            </div>
          );
        }

        return (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[48%]" />
                <col className="w-[12%]" />
                <col className="w-[26%]" />
              </colgroup>

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Mã môn
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Tên môn học
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-slate-600">
                    Tín chỉ
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Môn tiên quyết / Điều kiện
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {courses.map(
                  (course) => (
                    <tr
                      key={
                        course.id
                      }
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 align-top">
                        <span className="font-semibold text-orange-600">
                          {
                            course.courseCode
                          }
                        </span>
                      </td>

                      <td className="break-words px-4 py-3 align-top font-medium text-slate-700">
                        {
                          course.name
                        }
                      </td>

                      <td className="px-4 py-3 text-center align-top font-medium text-slate-700">
                        {
                          course.credits
                        }
                      </td>

                      <td className="break-words px-4 py-3 align-top text-slate-600">
                        {course.prerequisiteText ||
                          "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        );
      };

    /* =====================================================
       RENDER
       ===================================================== */

    return (
      <div className="space-y-6">
        {/* ===================== TOAST ===================== */}

        {toast && (
          <div className="fixed right-6 top-6 z-[9999] w-[400px] max-w-[calc(100vw-3rem)]">
            <div
              className={`rounded-2xl border bg-white p-4 shadow-2xl ${
                toast.type ===
                "success"
                  ? "border-emerald-200"
                  : "border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {toast.type ===
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

                <p className="text-sm leading-6 text-slate-700">
                  {
                    toast.message
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== BANNER ===================== */}

        <PageBanner
          title="Quản lý Chương trình Đào tạo"
          description="Theo dõi cấu trúc từng khung chương trình, các môn học chung và các môn theo combo của từng kỳ."
          badge="Quản lý dữ liệu"
        />

        {/* ===================== SELECTORS ===================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Chuyên ngành
              </label>

              <select
                value={
                  selectedMajorId ??
                  ""
                }
                onChange={
                  handleMajorChange
                }
                disabled={
                  isLoadingMajors
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              >
                {isLoadingMajors && (
                  <option value="">
                    Đang tải...
                  </option>
                )}

                {majors.map(
                  (major) => (
                    <option
                      key={
                        major.id
                      }
                      value={
                        major.id
                      }
                    >
                      {
                        major.code
                      }{" "}
                      -{" "}
                      {
                        major.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Khung chương trình
              </label>

              <select
                value={
                  selectedProgramId ??
                  ""
                }
                onChange={
                  handleCurriculumChange
                }
                disabled={
                  isLoadingCurriculums ||
                  curriculums.length ===
                    0
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
              >
                {isLoadingCurriculums ? (
                  <option value="">
                    Đang tải...
                  </option>
                ) : (
                  curriculums.map(
                    (
                      curriculum,
                    ) => (
                      <option
                        key={
                          curriculum.id
                        }
                        value={
                          curriculum.id
                        }
                      >
                        {
                          curriculum.code
                        }
                      </option>
                    ),
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        {/* ===================== INFO ===================== */}

        {selectedCurriculum && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Layers3
                  size={23}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Khung đang chọn
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-800">
                  {
                    selectedCurriculum.code
                  }
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                  {
                    selectedCurriculum.name
                  }
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {
                      selectedCurriculum.majorName
                    }
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    {
                      selectedCurriculum.totalCredits
                    }{" "}
                    tín chỉ
                  </span>

                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                    9 kỳ
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClassName(
                      selectedCurriculum.status,
                    )}`}
                  >
                    {getStatusLabel(
                      selectedCurriculum.status,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================== LOADING ===================== */}

        {isLoadingDetail && (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-orange-500"
            />

            <p className="mt-3 text-sm text-slate-500">
              Đang tải cấu trúc chương trình...
            </p>
          </section>
        )}

        {/* ===================== DETAIL ===================== */}

        {curriculumDetail &&
          !isLoadingDetail && (
            <>
              {/* SEMESTER NAV */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-800">
                  Cấu trúc chương trình
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Chọn kỳ để xem môn chung, môn theo combo và học phần tự chọn.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {SEMESTERS.map(
                    (semester) => (
                      <button
                        key={
                          semester
                        }
                        type="button"
                        onClick={() => {
                          setSelectedSemester(
                            semester,
                          );

                          setSearchTerm(
                            "",
                          );
                        }}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          selectedSemester ===
                          semester
                            ? "bg-orange-500 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        {getSemesterLabel(
                          semester,
                        )}
                      </button>
                    ),
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        searchTerm
                      }
                      onChange={(
                        event,
                      ) =>
                        setSearchTerm(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Tìm mã môn, tên môn, môn tiên quyết..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </section>

              {/* COMMON COURSES */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen
                        size={19}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-800">
                          Môn học chung
                        </h2>

                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          {getSemesterLabel(
                            selectedSemester,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Các môn thuộc khung chương trình và không phụ thuộc combo sinh viên lựa chọn.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {
                        commonCourses.length
                      }{" "}
                      môn học
                    </span>

                    <button
                      type="button"
                      onClick={
                        openAddCourseModal
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      <Plus
                        size={17}
                      />

                      Thêm môn học
                    </button>
                  </div>
                </div>

                {renderCourseTable(
                  commonCourses,
                )}
              </section>

              {/* COMBO */}

              {(hasAnyComboSlots ||
                curriculumDetail
                  .combos.length >
                  0) && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Boxes
                          size={19}
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-800">
                            Môn theo combo
                          </h2>

                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            {getSemesterLabel(
                              selectedSemester,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                          Sinh viên học các môn của combo đã chọn song song với các môn chung trong cùng kỳ.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {comboSlots.length >
                        0 && (
                        <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                          {
                            comboSlots.length
                          }{" "}
                          vị trí môn combo
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {
                          totalComboOptionsInSemester
                        }{" "}
                        combo
                      </span>

                      <button
                        type="button"
                        onClick={
                          openAddComboModal
                        }
                        disabled={
                          !hasAnyComboSlots
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus
                          size={17}
                        />

                        Thêm combo
                      </button>
                    </div>
                  </div>

                  {combosInSemester.length >
                  0 ? (
                    <div className="space-y-5">
                      {combosInSemester.map(
                        (
                          combo,
                        ) => (
                          <div
                            key={
                              combo.id
                            }
                            className="overflow-hidden rounded-2xl border border-purple-100 bg-purple-50/20"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-100 bg-purple-50/60 px-5 py-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-purple-600">
                                  {
                                    combo.code
                                  }
                                </p>

                                <h3 className="mt-1 break-words font-semibold text-slate-800">
                                  {
                                    combo.name
                                  }
                                </h3>
                              </div>

                              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                                {
                                  combo
                                    .visibleCourses
                                    .length
                                }{" "}
                                môn trong kỳ
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[900px] table-fixed text-left text-sm">
                                <colgroup>
                                  <col className="w-[14%]" />
                                  <col className="w-[48%]" />
                                  <col className="w-[12%]" />
                                  <col className="w-[26%]" />
                                </colgroup>

                                <thead className="bg-white/70">
                                  <tr>
                                    <th className="px-5 py-3 font-semibold text-slate-600">
                                      Mã môn
                                    </th>

                                    <th className="px-5 py-3 font-semibold text-slate-600">
                                      Tên môn học
                                    </th>

                                    <th className="px-5 py-3 text-center font-semibold text-slate-600">
                                      Tín chỉ
                                    </th>

                                    <th className="px-5 py-3 font-semibold text-slate-600">
                                      Môn tiên quyết / Điều kiện
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-purple-50 bg-white">
                                  {combo.visibleCourses.map(
                                    (
                                      course,
                                    ) => (
                                      <tr
                                        key={
                                          course.id
                                        }
                                        className="transition hover:bg-purple-50/30"
                                      >
                                        <td className="px-5 py-3 align-top">
                                          <span className="font-semibold text-purple-700">
                                            {
                                              course.courseCode
                                            }
                                          </span>
                                        </td>

                                        <td className="break-words px-5 py-3 align-top font-medium text-slate-700">
                                          {
                                            course.name
                                          }
                                        </td>

                                        <td className="px-5 py-3 text-center align-top text-slate-700">
                                          {course.credits ??
                                            "—"}
                                        </td>

                                        <td className="break-words px-5 py-3 align-top text-slate-600">
                                          {course.prerequisiteText ||
                                            "—"}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-400">
                      Kỳ này chưa có môn combo để hiển thị.
                    </div>
                  )}
                </section>
              )}

              {/* ELECTIVE */}

              {electiveSlots.length >
                0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-800">
                          Học phần tự chọn
                        </h2>

                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          {getSemesterLabel(
                            selectedSemester,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Các vị trí học phần tự chọn được quy định trong khung chương trình.
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      {
                        electiveSlots.length
                      }{" "}
                      học phần
                    </span>
                  </div>

                  {renderCourseTable(
                    electiveSlots,
                  )}
                </section>
              )}
            </>
          )}

        {/* ===================== EMPTY ===================== */}

        {!isLoadingDetail &&
          selectedProgramId ===
            null &&
          !isLoadingCurriculums && (
            <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <BookOpen
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                Chưa có khung chương trình để hiển thị.
              </p>
            </section>
          )}

        {/* ===================== ADD COURSE MODAL ===================== */}

        {isCourseModalOpen &&
          curriculumDetail && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/45 px-4 py-8">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Thêm môn học
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Thêm môn vào khung{" "}
                      <span className="font-semibold text-slate-700">
                        {
                          curriculumDetail.code
                        }
                      </span>
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      isSavingCourse
                    }
                    onClick={
                      closeAddCourseModal
                    }
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    <X
                      size={20}
                    />
                  </button>
                </div>

                <form
                  onSubmit={
                    handleAddCourseSubmit
                  }
                >
                  <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Mã môn{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        maxLength={20}
                        value={
                          courseForm.code
                        }
                        onChange={(
                          event,
                        ) =>
                          setCourseForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              code:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Ví dụ: ISM302"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kỳ chương trình{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <select
                        value={
                          courseForm.semester
                        }
                        onChange={(
                          event,
                        ) =>
                          setCourseForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              semester:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      >
                        {SEMESTERS.map(
                          (
                            semester,
                          ) => (
                            <option
                              key={
                                semester
                              }
                              value={
                                semester
                              }
                            >
                              {getSemesterLabel(
                                semester,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tên môn học{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={
                          courseForm.name
                        }
                        onChange={(
                          event,
                        ) =>
                          setCourseForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              name:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Nhập tên môn học"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Số tín chỉ{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="9999.99"
                        step="0.5"
                        value={
                          courseForm.credits
                        }
                        onChange={(
                          event,
                        ) =>
                          setCourseForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              credits:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Điều kiện OJT
                      </label>

                      <label className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={
                            courseForm.isOjtPrerequisite
                          }
                          onChange={(
                            event,
                          ) =>
                            setCourseForm(
                              (
                                previous,
                              ) => ({
                                ...previous,

                                isOjtPrerequisite:
                                  event
                                    .target
                                    .checked,
                              }),
                            )
                          }
                          className="h-4 w-4 accent-orange-500"
                        />

                        <span className="text-sm text-slate-700">
                          Môn liên quan đến điều kiện OJT
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Môn tiên quyết / Điều kiện
                      </label>

                      <input
                        type="text"
                        maxLength={10000}
                        value={
                          courseForm.prerequisiteText
                        }
                        onChange={(
                          event,
                        ) =>
                          setCourseForm(
                            (
                              previous,
                            ) => ({
                              ...previous,

                              prerequisiteText:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Ví dụ: DBI202, PRO192"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={
                        closeAddCourseModal
                      }
                      disabled={
                        isSavingCourse
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSavingCourse
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                      {isSavingCourse ? (
                        <>
                          <RefreshCw
                            size={17}
                            className="animate-spin"
                          />

                          Đang thêm...
                        </>
                      ) : (
                        <>
                          <Plus
                            size={17}
                          />

                          Thêm môn học
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        {/* ===================== ADD COMBO MODAL ===================== */}

        {isComboModalOpen &&
          curriculumDetail && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/45 px-4 py-6">
              <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                {/* HEADER */}

                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Thêm combo môn học
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Tạo gói combo cho khung{" "}
                      <span className="font-semibold text-slate-700">
                        {
                          curriculumDetail.code
                        }
                      </span>
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeAddComboModal
                    }
                    disabled={
                      isSavingCombo
                    }
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    <X
                      size={20}
                    />
                  </button>
                </div>

                <form
                  onSubmit={
                    handleAddComboSubmit
                  }
                >
                  <div className="space-y-6 px-6 py-6">
                    {/* SLOT SUMMARY */}

                    <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                      <p className="text-sm font-semibold text-purple-800">
                        Cấu trúc vị trí combo của khung
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {comboSemesterOptions.map(
                          (
                            semester,
                          ) => (
                            <span
                              key={
                                semester
                              }
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm"
                            >
                              {getSemesterLabel(
                                semester,
                              )}
                              :{" "}
                              {
                                comboSlotsBySemester.get(
                                  semester,
                                )?.length
                              }{" "}
                              vị trí
                            </span>
                          ),
                        )}
                      </div>

                      <p className="mt-3 text-xs leading-5 text-purple-700">
                        Số môn của combo trong từng kỳ không được vượt quá số vị trí combo tương ứng.
                      </p>
                    </div>

                    {/* COMBO INFO */}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Mã combo{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          maxLength={50}
                          value={
                            comboForm.code
                          }
                          onChange={(
                            event,
                          ) =>
                            setComboForm(
                              (
                                previous,
                              ) => ({
                                ...previous,

                                code:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Ví dụ: IS_COM6"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Tên combo{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>

                        <input
                          type="text"
                          maxLength={200}
                          value={
                            comboForm.name
                          }
                          onChange={(
                            event,
                          ) =>
                            setComboForm(
                              (
                                previous,
                              ) => ({
                                ...previous,

                                name:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Ví dụ: Business Analytics"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Ghi chú
                        </label>

                        <textarea
                          maxLength={2000}
                          rows={3}
                          value={
                            comboForm.note
                          }
                          onChange={(
                            event,
                          ) =>
                            setComboForm(
                              (
                                previous,
                              ) => ({
                                ...previous,

                                note:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Ghi chú thêm về combo nếu có..."
                          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>
                    </div>

                    {/* COURSES HEADER */}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          Môn thuộc combo
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          Mỗi môn sẽ tự động được gắn vào một vị trí combo phù hợp của kỳ đã chọn.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addComboCourseRow
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                      >
                        <Plus
                          size={16}
                        />

                        Thêm môn vào combo
                      </button>
                    </div>

                    {/* COURSE ROWS */}

                    <div className="space-y-4">
                      {comboForm.courses.map(
                        (
                          course,
                          index,
                        ) => (
                          <div
                            key={
                              course.localId
                            }
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  Môn combo{" "}
                                  {index +
                                    1}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Chọn kỳ có vị trí combo trong khung chương trình.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeComboCourseRow(
                                    course.localId,
                                  )
                                }
                                disabled={
                                  comboForm
                                    .courses
                                    .length <=
                                  1
                                }
                                className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Xóa môn này"
                              >
                                <Trash2
                                  size={18}
                                />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {/* CODE */}

                              <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Mã môn{" "}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  maxLength={20}
                                  value={
                                    course.code
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        code:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="Ví dụ: SAP311"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                />
                              </div>

                              {/* SEMESTER */}

                              <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Kỳ học{" "}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <select
                                  value={
                                    course.semester
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        semester:
                                          Number(
                                            event
                                              .target
                                              .value,
                                          ),
                                      },
                                    )
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                >
                                  {comboSemesterOptions.map(
                                    (
                                      semester,
                                    ) => (
                                      <option
                                        key={
                                          semester
                                        }
                                        value={
                                          semester
                                        }
                                      >
                                        {getSemesterLabel(
                                          semester,
                                        )}
                                        {" — "}
                                        {
                                          comboSlotsBySemester.get(
                                            semester,
                                          )?.length
                                        }{" "}
                                        vị trí
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>

                              {/* NAME */}

                              <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Tên môn học{" "}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  value={
                                    course.name
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        name:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="Nhập tên môn học"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                />
                              </div>

                              {/* CREDIT */}

                              <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Số tín chỉ{" "}
                                  <span className="text-red-500">
                                    *
                                  </span>
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  max="9999.99"
                                  step="0.5"
                                  value={
                                    course.credits
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        credits:
                                          Number(
                                            event
                                              .target
                                              .value,
                                          ),
                                      },
                                    )
                                  }
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                />
                              </div>

                              {/* PREREQUISITE */}

                              <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Môn tiên quyết / Điều kiện
                                </label>

                                <input
                                  type="text"
                                  maxLength={10000}
                                  value={
                                    course.prerequisiteText
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        prerequisiteText:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="Có thể để trống"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                />
                              </div>

                              {/* NOTE */}

                              <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                  Ghi chú cho môn
                                </label>

                                <input
                                  type="text"
                                  maxLength={2000}
                                  value={
                                    course.note
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateComboCourseRow(
                                      course.localId,
                                      {
                                        note:
                                          event
                                            .target
                                            .value,
                                      },
                                    )
                                  }
                                  placeholder="Có thể để trống"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                />
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={
                        closeAddComboModal
                      }
                      disabled={
                        isSavingCombo
                      }
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      disabled={
                        isSavingCombo
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingCombo ? (
                        <>
                          <RefreshCw
                            size={17}
                            className="animate-spin"
                          />

                          Đang tạo combo...
                        </>
                      ) : (
                        <>
                          <Plus
                            size={17}
                          />

                          Tạo combo
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    );
  };

export default EducationCurriculumPlan;