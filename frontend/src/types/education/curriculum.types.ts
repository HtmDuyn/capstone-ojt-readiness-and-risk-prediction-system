export interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisite: string;
}

export interface Curriculum {
  code: string;
  name: string;
  totalSubjects: number;
  totalCredits: number;
  subjects: CurriculumSubject[];
}

export interface CurriculumSubjectForm {
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisite: string;
}

export interface Major {
  id: number;
  code: string;
  name: string;

  parentMajorId: number | null;
  parentMajorCode: string | null;
  parentMajorName: string | null;
}

export interface SearchMajorsPayload {
  page: number;
  limit: number;
  search: string;

  parentMajorId?: number;
}

export interface SearchMajorsResponse {
  success: boolean;

  data: {
    total: number;
    items: Major[];
    page: number;
    limit: number;
  };
}

export interface CourseCatalogItem {
  id: number;

  code: string;
  name: string;

  defaultCredits: number | null;

  isOjtPrerequisite: boolean;
}

export interface SearchCoursesPayload {
  page: number;
  limit: number;
  search: string;
}

export interface SearchCoursesResponse {
  success: boolean;

  data: {
    total: number;
    items: CourseCatalogItem[];
    page: number;
    limit: number;
  };
}

export interface CurriculumSummary {
  id: number;

  code: string;
  name: string;

  status: string;

  majorId: number;
  majorName: string;

  version: string | null;
  gpaScale: number | null;

  createdAt: string | null;
  createdBy: number | null;

  updatedAt: string | null;

  publishedAt: string | null;
  publishedBy: number | null;

  retakePolicy: string | null;

  totalCredits: number;

  effectiveYear: number | null;

  equivalencesReviewed: boolean;
  prerequisitesReviewed: boolean;
}

export interface SearchCurriculaPayload {
  page: number;
  limit: number;
  search: string;

  majorId: number;

  status?: string;
  version?: string;
}

export interface SearchCurriculaResponse {
  success: boolean;

  data: {
    total: number;
    items: CurriculumSummary[];
    page: number;
    limit: number;
  };
}

export type CurriculumEntryKind =
  "COURSE" | "COMBO_SLOT" | "ELECTIVE_SLOT" | string;

export interface CurriculumCourse {
  id: number;

  courseId: number;
  courseCode: string;

  name: string;

  credits: number;
  semester: number;

  isRequired: boolean | null;

  entryKind: CurriculumEntryKind;

  prerequisiteText: string;
}

export interface ComboCourse {
  id: number;

  courseId: number;
  courseCode: string;

  name: string;

  note: string;

  credits: number | null;
  semester: number;

  slotCourseIds: number[];

  prerequisiteText: string;
}

export interface ComboChoiceGroup {
  code: string;

  minCourses: number;
  maxCourses: number;

  courseIds: number[];
}

export interface CurriculumCombo {
  id: number;

  code: string;
  name: string;

  selectionGroup: string | null;
  note: string;

  coursesReviewed: boolean;

  courses: ComboCourse[];

  choiceGroups: ComboChoiceGroup[];
}

export interface CurriculumDetail {
  id: number;

  code: string;
  name: string;

  version: string | null;

  majorId: number;
  majorName: string;

  totalCredits: number;

  effectiveYear: number | null;

  status: string;

  prerequisitesReviewed: boolean;
  equivalencesReviewed: boolean;

  createdBy: number | null;
  createdAt: string | null;

  updatedAt: string | null;

  publishedBy: number | null;
  publishedAt: string | null;

  gpaScale: number | null;
  retakePolicy: string | null;

  courses: CurriculumCourse[];

  prerequisites: unknown[];

  combos: CurriculumCombo[];

  equivalences: unknown[];
}

export interface CurriculumDetailResponse {
  success: boolean;

  data: CurriculumDetail;
}

export type CurriculumImportEntryKind =
  "COURSE" | "COMBO_SLOT" | "ELECTIVE_SLOT";

export interface CurriculumImportPayload {
  idempotencyKey: string;

  sourceName: string | null;

  curriculum: {
    code: string;
    name: string;
    version: string;

    majorId: number;

    totalCredits: number;
    effectiveYear: number;
    gpaScale: number;
  };

  courses: Array<{
    /*
     * Backend yêu cầu đúng một trong:
     * courseId HOẶC courseCode.
     *
     * Khi import Excel, FE ưu tiên courseCode
     * để người PĐT không phải nhập ID database.
     */
    courseId?: number;
    courseCode?: string;

    credits: number;
    semester: number;

    isRequired: boolean;

    entryKind: CurriculumImportEntryKind;

    prerequisiteText: string | null;
  }>;

  prerequisites: Array<{
    courseId: number;

    groupCode: string;

    minimumPassed: number;

    prerequisiteCourseIds: number[];
  }>;

  combos: Array<{
    code: string;
    name: string;

    selectionGroup: string | null;

    note: string | null;

    courses: Array<{
      /*
       * Backend yêu cầu đúng một:
       * courseId HOẶC courseCode.
       */
      courseId?: number;
      courseCode?: string;

      credits: number;
      semester: number;

      prerequisiteText: string | null;

      note: string | null;

      /*
       * Đây là CourseID của COMBO_SLOT.
       * Người dùng Excel nhập slotCourseCode,
       * FE sẽ tự đổi thành ID.
       */
      slotCourseIds: number[];
    }>;

    choiceGroups: Array<{
      code: string;

      minCourses: number;
      maxCourses: number;

      courseIds: number[];
    }>;
  }>;

  equivalences: Array<{
    sourceCourseId: number;

    targetCourseId: number;

    reason: string;
  }>;
}

export interface CurriculumImportPreviewResponse {
  success: boolean;

  data: {
    courseCount: number;
    comboCount: number;

    prerequisiteGroupCount: number;
    equivalenceCount: number;

    canCommit: boolean;
    action?: "CREATE" | "REPLACE";

    preview: boolean;

    normalized: {
      key: string;

      sourceName: string | null;

      curriculum: {
        code: string;
        name: string;
        version: string;

        majorId: number;

        totalCredits: number;
        effectiveYear: number;
        gpaScale: number;
      };

      courses: Array<{
        courseId: number;

        name: string;

        credits: number;
        semester: number;

        isRequired: boolean;

        entryKind: CurriculumImportEntryKind;

        prerequisiteText: string | null;
      }>;

      /*
       * Preview hiện mình chỉ cần số lượng
       * và dữ liệu chương trình để render UI.
       * Không đoán thêm response schema.
       */
      combos: unknown[];

      prerequisites: unknown[];

      equivalences: unknown[];
    };
  };
}
