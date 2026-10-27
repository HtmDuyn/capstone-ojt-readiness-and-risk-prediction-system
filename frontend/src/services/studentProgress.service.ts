import type { OjtEligibilityStatus, StudentProgress, StudentSubject, SubjectStatus } from '@/types/education/studentProgress.types';
import { apiData, getAllItems, getJson } from "./educationApi";
import { savedOjtLabel, type SavedOjtEligibility } from '@/utils/savedOjtEligibility';

type Row = Record<string, any>;
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
  signal?: AbortSignal,
): Promise<StudentProgress> {
  const profile = apiData<Row>(await getJson(`/students/${row.id}`, { include: 'academicProgress,courseResults', resultsLimit: 100 }, signal));
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
        getJson(`/curricula/${programId}`, {}, signal).then((response) =>
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
  const attempts: Row[] = [...(first?.items ?? [])];
  // Results are a paginated section of the student profile.
  for (let page = (first?.page ?? 1) + 1; attempts.length < (first?.total ?? 0); page++) {
    const next = apiData<Row>(await getJson(`/students/${row.id}`, {
      include: "courseResults", resultsPage: page, resultsLimit: first.limit,
    }, signal)).courseResults;
    if (!next?.items?.length) throw new Error("Không tải đủ kết quả học tập của sinh viên.");
    attempts.push(...next.items);
  }
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
      actualTerm: text(result?.academicPeriod?.name ?? result?.periodName ?? result?.periodCode),
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
  const saved = profile.calculatedEligibility as SavedOjtEligibility | null | undefined;
  const eligibilityStatus: OjtEligibilityStatus = saved ? savedOjtLabel(saved) :
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
    courseSemesterTag: number(profile.courseSemesterTag),
    currentTerm: text(profile.currentAcademicPeriod?.name),
    gpa: number(progress.gpa),
    completedCredits: number(credits.earned),
    totalCredits: number(credits.total ?? program.totalCredits),
    plannedOjtTerm: "—",
    currentEstimatedOjtTerm: "—",
    delayTerms: null,
    progressStatus: "Chưa xác định",
    eligibilityStatus,
    eligibilitySource: saved ? 'FRONTEND' : ['ELIGIBLE', 'NOT_ELIGIBLE'].includes(decision) ? 'OFFICIAL' : null,
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
  async loadAll(signal?: AbortSignal): Promise<StudentProgress[]> {
    const curricula = new Map<number, Promise<Row>>();
    const students = await getAllItems<Row>("/students", {}, signal),
      items: StudentProgress[] = new Array(students.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, students.length) }, async () => {
        while (next < students.length) {
          signal?.throwIfAborted();
          const index = next++;
          try {
            items[index] = await loadStudent(students[index], curricula, signal);
          } catch (error) {
            signal?.throwIfAborted();
            const row = students[index];
            const message = text(row.studentCode) +
                ": " +
                (error instanceof Error
                  ? error.message
                  : "Không tải được hồ sơ");
            items[index] = {
              id: String(row.id), studentCode: text(row.studentCode), fullName: text(row.fullName),
              cohort: text(row.cohort?.code ?? row.cohortCode), studentClass: text(row.className),
              curriculumCode: text(row.program?.code), currentCurriculumSemester: number(row.currentSemester),
              currentTerm: text(row.currentAcademicPeriod?.name), gpa: null,
              completedCredits: null, totalCredits: null, plannedOjtTerm: '—',
              currentEstimatedOjtTerm: '—', delayTerms: null, progressStatus: 'Chưa xác định',
              eligibilityStatus: 'Chưa có kết quả', subjects: [], dataWarning: message, detailsUnavailable: true,
            };
          }
        }
      }),
    );
    return items;
  },
};
