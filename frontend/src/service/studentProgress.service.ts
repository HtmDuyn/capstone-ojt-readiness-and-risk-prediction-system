import { getAllItems, getJson, apiData } from "./educationApi";
import { API_ORIGIN } from "./apiConfig";
const API_BASE_URL = API_ORIGIN;

export type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ" | "Chưa xác định";

export type SubjectStatus =
  "Passed" | "Not Passed" | "Not Started" | "In Progress" | "Chưa xác định";

export type OjtEligibilityStatus =
  "Đủ điều kiện" | "Chưa đủ điều kiện" | "Chưa có kết quả";

export interface StudentSubject {
  id: string;
  curriculumSemester: number | null;
  actualTerm: string;
  code: string;
  name: string;
  credits: number | null;
  grade: number | null;
  status: SubjectStatus;
  prerequisite: string[];
}

export interface StudentProgress {
  id: string;
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  curriculumCode: string;
  currentCurriculumSemester: number | null;
  currentTerm: string;
  gpa: number | null;
  completedCredits: number | null;
  totalCredits: number | null;
  plannedOjtTerm: string;
  currentEstimatedOjtTerm: string;
  delayTerms: number | null;
  progressStatus: ProgressStatus;
  eligibilityStatus: OjtEligibilityStatus;
  subjects: StudentSubject[];
  dataWarning?: string;
}

type Row = Record<string, any>;
export const unwrapApiData = (response: unknown): unknown => apiData(response);
export const getApiItems = (response: unknown): unknown[] => {
  const data = apiData<Row>(response);
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
};
const text = (value: unknown) =>
  value === undefined || value === null || value === "" ? "—" : String(value);
const number = (value: unknown): number | null =>
  value === null || value === undefined
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
async function loadStudent(
  row: Row,
  curricula: Map<number, Promise<Row>>,
): Promise<StudentProgress> {
  const profile = apiData<Row>(await getJson(`/students/${row.id}`));
  const progress = profile.academicProgress ?? {},
    program = profile.program ?? {},
    credits = progress.credits ?? {};
  let curriculum: Row | null = null,
    curriculumWarning = "";
  const programId = profile.programId ?? program.id;
  if (programId) {
    if (!curricula.has(programId))
      curricula.set(
        programId,
        getJson(`/curricula/${programId}`).then((response) =>
          apiData<Row>(response),
        ),
      );
    try {
      curriculum = await curricula.get(programId)!;
    } catch {
      curriculumWarning =
        "Không tải được khung chương trình để hiển thị kỳ khuyến nghị và môn tiên quyết.";
    }
  }
  const first = profile.courseResults;
  const attempts: Row[] =
    first?.items?.length >= first?.total
      ? first.items
      : await getAllItems<Row>(`/students/${row.id}/course-results`);
  const requirements: Row[] = progress.requirements ?? [];
  const subjects: StudentSubject[] = requirements.map((required: Row) => {
    const matching = attempts.filter((a) =>
      required.choices?.includes(a.courseId),
    );
    const result =
      matching.find((a) =>
        progress.gpaCourses?.some((g: Row) => g.resultId === a.id),
      ) ?? matching[0];
    const course = curriculum?.courses?.find(
      (c: Row) => c.courseId === required.courseId,
    );
    const prerequisiteIds: number[] = (curriculum?.prerequisites ?? [])
      .filter((g: Row) => g.courseId === required.courseId)
      .flatMap((g: Row) => g.prerequisiteCourseIds ?? []);
    const prerequisite = prerequisiteIds.map(
      (id) =>
        curriculum?.courses?.find((c: Row) => c.courseId === id)?.courseCode ??
        String(id),
    );
    const status: SubjectStatus = required.completed
      ? "Passed"
      : result?.status === "FAILED"
        ? "Not Passed"
        : result?.status === "IN_PROGRESS"
          ? "In Progress"
          : result
            ? "Chưa xác định"
            : "Not Started";
    return {
      id: String(required.id),
      curriculumSemester: number(course?.semester),
      actualTerm: text(result?.academicPeriod?.name ?? result?.periodCode),
      code: text(required.courseCode),
      name: text(required.name),
      credits: number(required.credits),
      grade: number(result?.score),
      status,
      prerequisite,
    };
  });
  const official = profile.officialEligibility;
  const decision = official?.isStale
    ? "REVIEW_REQUIRED"
    : profile.officialDecision;
  const eligibilityStatus: OjtEligibilityStatus =
    decision === "ELIGIBLE"
      ? "Đủ điều kiện"
      : decision === "NOT_ELIGIBLE"
        ? "Chưa đủ điều kiện"
        : "Chưa có kết quả";
  return {
    id: String(profile.id),
    studentCode: text(profile.studentCode),
    fullName: text(profile.fullName),
    cohort: text(profile.cohort?.code ?? profile.cohortCode),
    studentClass: text(profile.className),
    curriculumCode: text(program.code),
    currentCurriculumSemester: number(profile.currentSemester),
    currentTerm: text(profile.currentAcademicPeriod?.name),
    gpa: number(progress.gpa),
    completedCredits: number(credits.earned),
    totalCredits: number(credits.total ?? program.totalCredits),
    plannedOjtTerm: "—",
    currentEstimatedOjtTerm: "—",
    delayTerms: null,
    progressStatus: "Chưa xác định",
    eligibilityStatus,
    subjects,
    dataWarning:
      [
        curriculumWarning,
        progress.issues?.length
          ? "Dữ liệu học vụ cần đối soát: " + progress.issues.join(", ")
          : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined,
  };
}
export const studentProgressService = {
  async loadAll(): Promise<StudentProgress[]> {
    const curricula = new Map<number, Promise<Row>>();
    const students = await getAllItems<Row>("/students"),
      items: StudentProgress[] = new Array(students.length);
    let next = 0;
    const errors: string[] = [];
    await Promise.all(
      Array.from({ length: Math.min(4, students.length) }, async () => {
        while (next < students.length) {
          const index = next++;
          try {
            items[index] = await loadStudent(students[index], curricula);
          } catch (error) {
            errors.push(
              text(students[index].studentCode) +
                ": " +
                (error instanceof Error
                  ? error.message
                  : "Không tải được hồ sơ"),
            );
          }
        }
      }),
    );
    if (errors.length)
      throw new Error("Không tải đủ hồ sơ sinh viên. " + errors.join("; "));
    return items;
  },
};
