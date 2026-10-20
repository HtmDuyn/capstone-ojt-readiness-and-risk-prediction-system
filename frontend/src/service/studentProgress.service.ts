const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com";

export type ProgressStatus =
  | "Đúng tiến độ"
  | "Chậm tiến độ"
  | "Chưa xác định";

export type SubjectStatus =
  | "Passed"
  | "Not Passed"
  | "Not Started"
  | "In Progress"
  | "Chưa xác định";

export type OjtEligibilityStatus =
  | "Đủ điều kiện"
  | "Chưa đủ điều kiện"
  | "Chưa có kết quả";

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

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
};

const asText = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const asNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const firstValue = (
  sources: ApiRecord[],
  keys: string[],
): unknown => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return undefined;
};

export const unwrapApiData = (response: unknown): unknown => {
  const root = asRecord(response);
  return root.data !== undefined ? root.data : response;
};

export const getApiItems = (response: unknown): unknown[] => {
  const root = asRecord(response);
  const data = unwrapApiData(response);

  if (Array.isArray(data)) return data;

  const dataRecord = asRecord(data);
  const nestedData = asRecord(dataRecord.data);
  const candidates = [
    dataRecord.items,
    dataRecord.results,
    dataRecord.subjects,
    dataRecord.courses,
    nestedData.items,
    root.items,
  ];

  const items = candidates.find(Array.isArray);
  return Array.isArray(items) ? items : [];
};

const getAuthToken = (): string => {
  const token = localStorage.getItem("ojt_auth_token");
  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }
  return token;
};

const postJson = async (path: string, body: unknown): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let result: unknown = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText) as unknown;
    } catch {
      throw new Error("API trả về dữ liệu không phải JSON hợp lệ.");
    }
  }

  const errorBody = asRecord(result);
  if (!response.ok || errorBody.success === false) {
    if (response.status === 401) {
      throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
    }
    throw new Error(
      asText(errorBody.message) || `Yêu cầu API thất bại (${response.status}).`,
    );
  }

  return result;
};

const searchStudents = async (): Promise<unknown[]> => {
  const limit = 100;
  const allStudents: unknown[] = [];
  let page = 1;

  // API có phân trang; đọc từng trang để không giới hạn danh sách ở 100 sinh viên.
  while (page <= 20) {
    const response = await postJson("/api/json/students/search", {
      page,
      limit,
      search: "",
    });

    const items = getApiItems(response);
    allStudents.push(...items);

    const root = asRecord(response);
    const data = asRecord(unwrapApiData(response));
    const total = asNumber(data.total, root.total);

    if (items.length < limit || (total !== null && allStudents.length >= total)) {
      break;
    }
    page += 1;
  }

  return allStudents;
};

const searchStudentAcademicProgress = (studentId: number) => {
  return postJson("/api/json/students/academic-progress/search", {
    studentId,
    page: 1,
    limit: 100,
  });
};

const searchStudentCourseResults = (studentId: number) => {
  return postJson("/api/json/students/course-results/search", {
    studentId,
    page: 1,
    limit: 100,
  });
};

const searchStudentEligibility = (studentId: number) => {
  return postJson("/api/json/students/eligibility/search", {
    studentId,
    page: 1,
    limit: 100,
  });
};

const normalizeProgressStatus = (
  rawStatus: unknown,
  delayTerms: number | null,
): ProgressStatus => {
  const status = (asText(rawStatus) || "").toUpperCase();

  if (
    status.includes("DELAY") ||
    status.includes("BEHIND") ||
    status.includes("LATE") ||
    status.includes("CHẬM")
  ) {
    return "Chậm tiến độ";
  }

  if (
    status.includes("ON_TRACK") ||
    status.includes("ON TRACK") ||
    status.includes("ONTIME") ||
    status.includes("ON_TIME") ||
    status.includes("ĐÚNG")
  ) {
    return "Đúng tiến độ";
  }

  if (delayTerms !== null) {
    return delayTerms > 0 ? "Chậm tiến độ" : "Đúng tiến độ";
  }

  return "Chưa xác định";
};

const normalizeEligibilityStatus = (rawStatus: unknown): OjtEligibilityStatus => {
  const status = (asText(rawStatus) || "").toUpperCase();

  // Kiểm tra trạng thái phủ định trước vì NOT_ELIGIBLE cũng chứa ELIGIBLE.
  if (
    status.includes("NOT_ELIGIBLE") ||
    status.includes("INELIGIBLE") ||
    status.includes("NOT ELIGIBLE") ||
    status.includes("CHƯA ĐỦ ĐIỀU KIỆN")
  ) {
    return "Chưa đủ điều kiện";
  }

  if (status.includes("ELIGIBLE") || status.includes("ĐỦ ĐIỀU KIỆN")) {
    return "Đủ điều kiện";
  }

  return "Chưa có kết quả";
};

const normalizeSubjectStatus = (rawStatus: unknown): SubjectStatus => {
  const status = (asText(rawStatus) || "").toUpperCase().replace(/[\s-]+/g, "_");

  if (
    status.includes("NOT_PASSED") ||
    status.includes("NOT_PASS") ||
    status.includes("FAILED") ||
    status === "FAIL"
  ) {
    return "Not Passed";
  }

  if (
    status.includes("PASSED") ||
    status === "PASS" ||
    status.includes("RECOGNIZED") ||
    status.includes("COMPLETED")
  ) {
    return "Passed";
  }

  if (
    status.includes("IN_PROGRESS") ||
    status.includes("ENROLLED") ||
    status.includes("STUDYING") ||
    status.includes("ONGOING")
  ) {
    return "In Progress";
  }

  if (
    status.includes("NOT_STARTED") ||
    status.includes("NOT_ENROLLED") ||
    status === "PENDING"
  ) {
    return "Not Started";
  }

  return "Chưa xác định";
};

const mapSubject = (
  rawSubject: unknown,
  studentId: number,
  index: number,
): StudentSubject => {
  const row = asRecord(rawSubject);
  const course = asRecord(row.course ?? row.subject);
  const period = asRecord(row.academicPeriod ?? row.period ?? row.term);
  const sources = [row, course];

  const prerequisiteValue = firstValue(sources, [
    "prerequisite",
    "prerequisites",
    "prerequisiteCodes",
    "prerequisiteCourseCodes",
  ]);

  let prerequisite: string[] = [];
  if (Array.isArray(prerequisiteValue)) {
    prerequisite = prerequisiteValue
      .map((item) => {
        if (typeof item === "string") return item;
        const itemRecord = asRecord(item);
        return asText(itemRecord.code ?? itemRecord.courseCode ?? itemRecord.name);
      })
      .filter((item): item is string => item !== null && item.trim() !== "");
  } else if (typeof prerequisiteValue === "string") {
    prerequisite = prerequisiteValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const id =
    asText(firstValue(sources, ["id", "courseResultId", "resultId"])) ||
    `${studentId}-course-${index}`;

  return {
    id,
    curriculumSemester: asNumber(
      firstValue(sources, [
        "curriculumSemester",
        "semesterNumber",
        "semester",
        "termNumber",
      ]),
    ),
    actualTerm:
      asText(
        firstValue([row], [
          "actualTerm",
          "academicPeriodName",
          "periodName",
          "termName",
        ]),
      ) ||
      asText(firstValue([period], ["name", "periodCode", "code"])) ||
      "—",
    code:
      asText(firstValue(sources, ["courseCode", "subjectCode", "code"])) || "—",
    name:
      asText(firstValue(sources, ["courseName", "subjectName", "name"])) || "—",
    credits: asNumber(
      firstValue(sources, ["credits", "credit", "courseCredits", "defaultCredits"]),
    ),
    grade: asNumber(
      firstValue(sources, [
        "grade",
        "score",
        "finalGrade",
        "gradePoint",
        "gradePoints",
      ]),
    ),
    status: normalizeSubjectStatus(
      firstValue([row], [
        "status",
        "resultStatus",
        "gradeStatus",
        "outcome",
        "completionStatus",
      ]),
    ),
    prerequisite,
  };
};

const buildStudentProgress = async (
  rawStudent: unknown,
): Promise<StudentProgress | null> => {
  const student = asRecord(rawStudent);
  const nestedStudent = asRecord(student.student);
  const profile = asRecord(student.profile ?? nestedStudent.profile);
  const account = asRecord(
    student.account ?? nestedStudent.account ?? student.user ?? profile.user,
  );
  const studentId = asNumber(firstValue([student, nestedStudent], ["id", "studentId"]));

  if (studentId === null) return null;

  const [progressResult, courseResult, eligibilityResult] = await Promise.allSettled([
    searchStudentAcademicProgress(studentId),
    searchStudentCourseResults(studentId),
    searchStudentEligibility(studentId),
  ]);

  const progressResponse =
    progressResult.status === "fulfilled" ? progressResult.value : null;
  const courseResponse =
    courseResult.status === "fulfilled" ? courseResult.value : null;
  const eligibilityResponse =
    eligibilityResult.status === "fulfilled" ? eligibilityResult.value : null;

  const failedDetailApis = [
    progressResult.status === "rejected" ? "tiến độ học tập" : null,
    courseResult.status === "rejected" ? "kết quả môn học" : null,
    eligibilityResult.status === "rejected" ? "điều kiện OJT" : null,
  ].filter((item): item is string => item !== null);

  const progressData = asRecord(unwrapApiData(progressResponse));
  const progressSummary = asRecord(
    progressData.summary ??
      progressData.progress ??
      progressData.academicProgress ??
      progressData.snapshot ??
      progressData,
  );

  const placement = asRecord(
    firstValue([student, nestedStudent, progressSummary], [
      "academicPlacement",
      "placement",
    ]),
  );
  const curriculum = asRecord(
    firstValue([student, nestedStudent, progressSummary, placement], [
      "curriculum",
      "program",
    ]),
  );
  const cohort = asRecord(firstValue([student, nestedStudent], ["cohort"]));
  const studentClass = asRecord(
    firstValue([student, nestedStudent], ["studentClass", "class"]),
  );
  const currentPeriod = asRecord(
    firstValue([progressSummary, progressData, student, placement], [
      "currentAcademicPeriod",
      "currentPeriod",
      "academicPeriod",
      "period",
    ]),
  );

  const sources = [
    progressSummary,
    progressData,
    student,
    nestedStudent,
    placement,
    curriculum,
  ];
  const delayTerms = asNumber(
    firstValue(sources, ["delayTerms", "delayedTerms", "delayCount", "termsDelayed"]),
  );

  const courseItems = getApiItems(courseResponse);
  const progressItems = getApiItems(progressResponse);
  const subjectItems = courseItems.length > 0 ? courseItems : progressItems;

  const eligibilityData = asRecord(unwrapApiData(eligibilityResponse));
  const eligibilityItems = getApiItems(eligibilityResponse);
  const eligibilityRecord =
    eligibilityItems.length > 0
      ? asRecord(eligibilityItems[0])
      : asRecord(
          eligibilityData.latestCheck ??
            eligibilityData.eligibility ??
            eligibilityData.result ??
            eligibilityData,
        );

  const eligibilitySources = [
    eligibilityRecord,
    asRecord(eligibilityRecord.latestCheck),
    asRecord(eligibilityRecord.eligibility),
    eligibilityData,
  ];
  const eligibilityFlag = firstValue(eligibilitySources, ["eligible", "isEligible"]);
  const rawEligibilityStatus = firstValue(eligibilitySources, [
    "eligibilityStatus",
    "status",
    "resultStatus",
    "decision",
    "outcome",
    "result",
  ]);

  const eligibilityStatus =
    typeof eligibilityFlag === "boolean"
      ? eligibilityFlag
        ? "Đủ điều kiện"
        : "Chưa đủ điều kiện"
      : normalizeEligibilityStatus(rawEligibilityStatus);

  return {
    id: String(studentId),
    studentCode:
      asText(
        firstValue([student, nestedStudent, profile, account], [
          "studentCode",
          "code",
          "studentNumber",
          "username",
        ]),
      ) || "—",
    fullName:
      asText(
        firstValue([student, nestedStudent, profile, account], [
          "fullName",
          "studentName",
          "name",
          "displayName",
        ]),
      ) || "Chưa cập nhật",
    cohort:
      asText(
        firstValue([student, nestedStudent], [
          "cohortCode",
          "cohortName",
          "cohort",
        ]),
      ) ||
      asText(firstValue([cohort], ["code", "name", "cohortCode"])) ||
      "—",
    studentClass:
      asText(
        firstValue([student, nestedStudent], [
          "classCode",
          "className",
          "studentClassName",
          "studentClass",
        ]),
      ) ||
      asText(firstValue([studentClass], ["code", "name", "classCode"])) ||
      "—",
    curriculumCode:
      asText(
        firstValue([student, nestedStudent, progressSummary], [
          "curriculumCode",
          "programCode",
        ]),
      ) ||
      asText(
        firstValue([curriculum], [
          "code",
          "curriculumCode",
          "programCode",
          "name",
        ]),
      ) ||
      "—",
    currentCurriculumSemester: asNumber(
      firstValue(sources, [
        "currentCurriculumSemester",
        "currentSemester",
        "semesterNumber",
        "relativeSemester",
        "currentTermNumber",
      ]),
    ),
    currentTerm:
      asText(
        firstValue(sources, [
          "currentTerm",
          "currentTermName",
          "currentPeriodName",
          "currentAcademicPeriodName",
          "academicPeriodName",
          "termName",
        ]),
      ) ||
      asText(firstValue([currentPeriod], ["name", "periodCode", "code"])) ||
      "—",
    gpa: asNumber(
      firstValue(sources, [
        "gpa",
        "currentGpa",
        "cumulativeGpa",
        "gradePointAverage",
        "averageGpa",
      ]),
    ),
    completedCredits: asNumber(
      firstValue(sources, [
        "completedCredits",
        "earnedCredits",
        "accumulatedCredits",
        "creditsEarned",
        "passedCredits",
        "totalEarnedCredits",
      ]),
    ),
    totalCredits: asNumber(
      firstValue(sources, [
        "totalCredits",
        "requiredCredits",
        "curriculumTotalCredits",
        "programTotalCredits",
        "creditsRequired",
      ]),
    ),
    plannedOjtTerm:
      asText(
        firstValue(sources, [
          "plannedOjtTerm",
          "plannedOjtPeriodName",
          "ojtPlannedTerm",
          "targetOjtTerm",
        ]),
      ) || "—",
    currentEstimatedOjtTerm:
      asText(
        firstValue(sources, [
          "currentEstimatedOjtTerm",
          "estimatedOjtTerm",
          "expectedOjtTerm",
          "ojtEstimatedTerm",
        ]),
      ) || "—",
    delayTerms,
    progressStatus: normalizeProgressStatus(
      firstValue(progressSummary ? [progressSummary, progressData] : [progressData], [
        "progressStatus",
        "academicProgressStatus",
        "timelineStatus",
        "status",
      ]),
      delayTerms,
    ),
    eligibilityStatus,
    subjects: subjectItems.map((item, index) => mapSubject(item, studentId, index)),
    dataWarning:
      failedDetailApis.length > 0
        ? `Không tải được ${failedDetailApis.join(", ")}.`
        : undefined,
  };
};

export const studentProgressService = {
  async loadAll(): Promise<StudentProgress[]> {
    const rawStudents = await searchStudents();
    const mappedStudents: (StudentProgress | null)[] = new Array(rawStudents.length);
    let nextIndex = 0;

    // Giới hạn số hồ sơ tải song song để tránh bắn quá nhiều request cùng lúc.
    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= rawStudents.length) return;
        mappedStudents[index] = await buildStudentProgress(rawStudents[index]);
      }
    };

    const workerCount = Math.min(6, rawStudents.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return mappedStudents.filter(
      (student): student is StudentProgress => student !== null,
    );
  },
};