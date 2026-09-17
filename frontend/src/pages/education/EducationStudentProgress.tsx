import React from "react";
import {
  Search,
  Eye,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Clock3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronRight,
  XCircle,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ";

type SubjectStatus = "Passed" | "Not Passed" | "Not Started";

interface StudentSubject {
  id: string;
  curriculumSemester: number;
  actualTerm: string;
  code: string;
  name: string;
  credits: number;
  grade: number | null;
  status: SubjectStatus;
  prerequisite: string[];
}

interface StudentProgress {
  id: string;
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  curriculumCode: string;
  currentCurriculumSemester: number;
  currentTerm: string;
  gpa: number;
  completedCredits: number;
  totalCredits: number;

  plannedOjtTerm: string;
  currentEstimatedOjtTerm: string;
  delayTerms: number;

  progressStatus: ProgressStatus;

  subjects: StudentSubject[];
}

const STUDENTS: StudentProgress[] = [
  {
    id: "student-1",
    studentCode: "SE182521",
    fullName: "Lê Minh Nhật",
    cohort: "K18",
    studentClass: "K18D-19A",
    curriculumCode: "BIT_IS_EIS_18D",
    currentCurriculumSemester: 9,
    currentTerm: "Fall 2026",
    gpa: 7.126,
    completedCredits: 132,
    totalCredits: 145,

    plannedOjtTerm: "Fall 2025",
    currentEstimatedOjtTerm: "Fall 2025",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "s1",
        curriculumSemester: 1,
        actualTerm: "Spring 2024",
        code: "CSI104",
        name: "Introduction to Computing",
        credits: 3,
        grade: 6.4,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "s2",
        curriculumSemester: 1,
        actualTerm: "Summer 2024",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 5.9,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "s3",
        curriculumSemester: 2,
        actualTerm: "Fall 2024",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: 5.1,
        status: "Passed",
        prerequisite: ["PRF192"],
      },
      {
        id: "s4",
        curriculumSemester: 3,
        actualTerm: "Spring 2025",
        code: "CSD201",
        name: "Data Structures and Algorithms",
        credits: 3,
        grade: 5.4,
        status: "Passed",
        prerequisite: ["PRO192"],
      },
      {
        id: "s5",
        curriculumSemester: 3,
        actualTerm: "Fall 2024",
        code: "DBI202",
        name: "Database Systems",
        credits: 3,
        grade: 5.5,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "s6",
        curriculumSemester: 4,
        actualTerm: "Summer 2025",
        code: "PRJ302",
        name: "Java Web Application Development",
        credits: 3,
        grade: 5.7,
        status: "Passed",
        prerequisite: ["DBI202", "PRO192"],
      },
      {
        id: "s7",
        curriculumSemester: 5,
        actualTerm: "Spring 2026",
        code: "ISP392",
        name: "Information System Programming Project",
        credits: 3,
        grade: 8,
        status: "Passed",
        prerequisite: ["LAB211", "SWE201c", "PRJ302"],
      },
      {
        id: "s8",
        curriculumSemester: 6,
        actualTerm: "Fall 2025",
        code: "OJT202",
        name: "On-the-Job Training",
        credits: 10,
        grade: 9.1,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "s9",
        curriculumSemester: 8,
        actualTerm: "Summer 2026",
        code: "DTA301",
        name: "Data Analysis",
        credits: 3,
        grade: 7.5,
        status: "Passed",
        prerequisite: ["CSD201", "DBI202", "MAS291", "PRO192"],
      },
      {
        id: "s10",
        curriculumSemester: 9,
        actualTerm: "Fall 2026",
        code: "ISP490",
        name: "IS Capstone Project",
        credits: 10,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
      {
        id: "s11",
        curriculumSemester: 9,
        actualTerm: "Fall 2026",
        code: "MLN131",
        name: "Scientific Socialism",
        credits: 2,
        grade: null,
        status: "Not Started",
        prerequisite: ["MLN111", "MLN122"],
      },
    ],
  },

  {
    id: "student-2",
    studentCode: "SE181666",
    fullName: "Nguyễn Khánh Ly",
    cohort: "K18",
    studentClass: "K18D-19A",
    curriculumCode: "BIT_IS_EIS_18D",
    currentCurriculumSemester: 5,
    currentTerm: "Summer 2025",
    gpa: 6.84,
    completedCredits: 91,
    totalCredits: 145,

    plannedOjtTerm: "Fall 2025",
    currentEstimatedOjtTerm: "Spring 2026",
    delayTerms: 1,

    progressStatus: "Chậm tiến độ",

    subjects: [
      {
        id: "l1",
        curriculumSemester: 1,
        actualTerm: "Spring 2024",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 6.5,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "l2",
        curriculumSemester: 2,
        actualTerm: "Fall 2024",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: 6.2,
        status: "Passed",
        prerequisite: ["PRF192"],
      },
      {
        id: "l3",
        curriculumSemester: 3,
        actualTerm: "Spring 2025",
        code: "DBI202",
        name: "Database Systems",
        credits: 3,
        grade: 7,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "l4",
        curriculumSemester: 4,
        actualTerm: "Summer 2025",
        code: "PRJ302",
        name: "Java Web Application Development",
        credits: 3,
        grade: 3.8,
        status: "Not Passed",
        prerequisite: ["DBI202", "PRO192"],
      },
      {
        id: "l5",
        curriculumSemester: 5,
        actualTerm: "—",
        code: "ISP392",
        name: "Information System Programming Project",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["LAB211", "SWE201c", "PRJ302"],
      },
      {
        id: "l6",
        curriculumSemester: 6,
        actualTerm: "—",
        code: "OJT202",
        name: "On-the-Job Training",
        credits: 10,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
    ],
  },

  {
    id: "student-3",
    studentCode: "SE193577",
    fullName: "Nguyễn Minh Hoàng",
    cohort: "K19",
    studentClass: "K19A",
    curriculumCode: "BIT_IS_EIS_19A",
    currentCurriculumSemester: 5,
    currentTerm: "Fall 2026",
    gpa: 7.42,
    completedCredits: 105,
    totalCredits: 145,

    plannedOjtTerm: "Spring 2027",
    currentEstimatedOjtTerm: "Spring 2027",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "h1",
        curriculumSemester: 1,
        actualTerm: "Spring 2025",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 7.5,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "h2",
        curriculumSemester: 2,
        actualTerm: "Summer 2025",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: 7,
        status: "Passed",
        prerequisite: ["PRF192"],
      },
      {
        id: "h3",
        curriculumSemester: 3,
        actualTerm: "Fall 2025",
        code: "DBI202",
        name: "Database Systems",
        credits: 3,
        grade: 7.8,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "h4",
        curriculumSemester: 4,
        actualTerm: "Spring 2026",
        code: "PRJ302",
        name: "Java Web Application Development",
        credits: 3,
        grade: 7.2,
        status: "Passed",
        prerequisite: ["DBI202", "PRO192"],
      },
      {
        id: "h5",
        curriculumSemester: 5,
        actualTerm: "Fall 2026",
        code: "ISP392",
        name: "Information System Programming Project",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["LAB211", "SWE201c", "PRJ302"],
      },
    ],
  },
  // =====================================================
  // SINH VIÊN MỚI - KỲ 0
  // =====================================================
  {
    id: "student-4",
    studentCode: "SE201245",
    fullName: "Trần Gia Huy",
    cohort: "K20",
    studentClass: "K20A",
    curriculumCode: "BIT_IS_EIS_20A",
    currentCurriculumSemester: 0,
    currentTerm: "Fall 2026",
    gpa: 0,
    completedCredits: 0,
    totalCredits: 145,

    plannedOjtTerm: "Summer 2028",
    currentEstimatedOjtTerm: "Summer 2028",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "huy-1",
        curriculumSemester: 0,
        actualTerm: "Fall 2026",
        code: "OTP101",
        name: "Orientation and General Training Program",
        credits: 0,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
      {
        id: "huy-2",
        curriculumSemester: 0,
        actualTerm: "Fall 2026",
        code: "PEN",
        name: "Preparation English",
        credits: 0,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
      {
        id: "huy-3",
        curriculumSemester: 0,
        actualTerm: "Fall 2026",
        code: "PHE_COM*1",
        name: "Physical Education 1",
        credits: 2,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
    ],
  },

  // =====================================================
  // SINH VIÊN KỲ 1
  // =====================================================
  {
    id: "student-5",
    studentCode: "SE201386",
    fullName: "Nguyễn Hoàng Anh",
    cohort: "K20",
    studentClass: "K20A",
    curriculumCode: "BIT_IS_EIS_20A",
    currentCurriculumSemester: 1,
    currentTerm: "Fall 2026",
    gpa: 7.35,
    completedCredits: 12,
    totalCredits: 145,

    plannedOjtTerm: "Spring 2028",
    currentEstimatedOjtTerm: "Spring 2028",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "anh-1",
        curriculumSemester: 1,
        actualTerm: "Fall 2026",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 7.6,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "anh-2",
        curriculumSemester: 1,
        actualTerm: "Fall 2026",
        code: "MAE101",
        name: "Mathematics for Engineering",
        credits: 3,
        grade: 7.2,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "anh-3",
        curriculumSemester: 1,
        actualTerm: "Fall 2026",
        code: "CEA201",
        name: "Computer Organization and Architecture",
        credits: 3,
        grade: 7.1,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "anh-4",
        curriculumSemester: 2,
        actualTerm: "—",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["PRF192"],
      },
    ],
  },

  // =====================================================
  // SINH VIÊN KỲ 2 - VẪN ĐÚNG TIẾN ĐỘ
  // =====================================================
  {
    id: "student-6",
    studentCode: "SE195214",
    fullName: "Phạm Minh Thư",
    cohort: "K19",
    studentClass: "K19B",
    curriculumCode: "BIT_IS_EIS_19A",
    currentCurriculumSemester: 2,
    currentTerm: "Fall 2026",
    gpa: 7.81,
    completedCredits: 31,
    totalCredits: 145,

    plannedOjtTerm: "Fall 2027",
    currentEstimatedOjtTerm: "Fall 2027",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "thu-1",
        curriculumSemester: 1,
        actualTerm: "Spring 2026",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 8.1,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "thu-2",
        curriculumSemester: 1,
        actualTerm: "Spring 2026",
        code: "MAE101",
        name: "Mathematics for Engineering",
        credits: 3,
        grade: 7.8,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "thu-3",
        curriculumSemester: 2,
        actualTerm: "Fall 2026",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: 7.5,
        status: "Passed",
        prerequisite: ["PRF192"],
      },
      {
        id: "thu-4",
        curriculumSemester: 2,
        actualTerm: "Fall 2026",
        code: "MAD101",
        name: "Discrete Mathematics",
        credits: 3,
        grade: 7.9,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "thu-5",
        curriculumSemester: 3,
        actualTerm: "—",
        code: "CSD201",
        name: "Data Structures and Algorithms",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["PRO192"],
      },
    ],
  },

  // =====================================================
  // SINH VIÊN KỲ 3 - CÓ MÔN NOT PASSED
  // NHƯNG CHƯA KẾT LUẬN TRỄ OJT
  // =====================================================
  {
    id: "student-7",
    studentCode: "SE194728",
    fullName: "Lê Quốc Bảo",
    cohort: "K19",
    studentClass: "K19B",
    curriculumCode: "BIT_IS_EIS_19A",
    currentCurriculumSemester: 3,
    currentTerm: "Fall 2026",
    gpa: 6.62,
    completedCredits: 43,
    totalCredits: 145,

    plannedOjtTerm: "Fall 2027",
    currentEstimatedOjtTerm: "Fall 2027",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "bao-1",
        curriculumSemester: 1,
        actualTerm: "Spring 2026",
        code: "PRF192",
        name: "Programming Fundamentals",
        credits: 3,
        grade: 6.5,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "bao-2",
        curriculumSemester: 2,
        actualTerm: "Summer 2026",
        code: "PRO192",
        name: "Object-Oriented Programming",
        credits: 3,
        grade: 6.1,
        status: "Passed",
        prerequisite: ["PRF192"],
      },
      {
        id: "bao-3",
        curriculumSemester: 3,
        actualTerm: "Fall 2026",
        code: "DBI202",
        name: "Database Systems",
        credits: 3,
        grade: 3.7,
        status: "Not Passed",
        prerequisite: [],
      },
      {
        id: "bao-4",
        curriculumSemester: 3,
        actualTerm: "Fall 2026",
        code: "CSD201",
        name: "Data Structures and Algorithms",
        credits: 3,
        grade: 6.8,
        status: "Passed",
        prerequisite: ["PRO192"],
      },
      {
        id: "bao-5",
        curriculumSemester: 4,
        actualTerm: "—",
        code: "PRJ302",
        name: "Java Web Application Development",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["DBI202", "PRO192"],
      },
    ],
  },

  // =====================================================
  // SINH VIÊN KỲ 4 - ĐANG TIẾN GẦN MỐC OJT
  // =====================================================
  {
    id: "student-8",
    studentCode: "SE193842",
    fullName: "Võ Ngọc Mai",
    cohort: "K19",
    studentClass: "K19A",
    curriculumCode: "BIT_IS_EIS_19A",
    currentCurriculumSemester: 4,
    currentTerm: "Fall 2026",
    gpa: 7.24,
    completedCredits: 72,
    totalCredits: 145,

    plannedOjtTerm: "Summer 2027",
    currentEstimatedOjtTerm: "Summer 2027",
    delayTerms: 0,

    progressStatus: "Đúng tiến độ",

    subjects: [
      {
        id: "mai-1",
        curriculumSemester: 3,
        actualTerm: "Summer 2026",
        code: "DBI202",
        name: "Database Systems",
        credits: 3,
        grade: 7.2,
        status: "Passed",
        prerequisite: [],
      },
      {
        id: "mai-2",
        curriculumSemester: 3,
        actualTerm: "Summer 2026",
        code: "CSD201",
        name: "Data Structures and Algorithms",
        credits: 3,
        grade: 7.5,
        status: "Passed",
        prerequisite: ["PRO192"],
      },
      {
        id: "mai-3",
        curriculumSemester: 4,
        actualTerm: "Fall 2026",
        code: "PRJ302",
        name: "Java Web Application Development",
        credits: 3,
        grade: 7,
        status: "Passed",
        prerequisite: ["DBI202", "PRO192"],
      },
      {
        id: "mai-4",
        curriculumSemester: 4,
        actualTerm: "Fall 2026",
        code: "MAS291",
        name: "Statistics & Probability",
        credits: 3,
        grade: 7.4,
        status: "Passed",
        prerequisite: ["MAE101"],
      },
      {
        id: "mai-5",
        curriculumSemester: 5,
        actualTerm: "—",
        code: "ISP392",
        name: "Information System Programming Project",
        credits: 3,
        grade: null,
        status: "Not Started",
        prerequisite: ["LAB211", "SWE201c", "PRJ302"],
      },
      {
        id: "mai-6",
        curriculumSemester: 6,
        actualTerm: "—",
        code: "OJT202",
        name: "On-the-Job Training",
        credits: 10,
        grade: null,
        status: "Not Started",
        prerequisite: [],
      },
    ],
  },
];

const SUBJECT_STATUS_STYLES: Record<SubjectStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Not Passed": "bg-red-50 text-red-700 border-red-200",
  "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
};

const PROGRESS_STATUS_STYLES: Record<ProgressStatus, string> = {
  "Đúng tiến độ": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Chậm tiến độ": "bg-red-50 text-red-700 border-red-200",
};

const EducationStudentProgress: React.FC = () => {
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentProgress | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [cohortFilter, setCohortFilter] = React.useState("all");
  const [classFilter, setClassFilter] = React.useState("all");
  const [curriculumFilter, setCurriculumFilter] = React.useState("all");
  const [semesterFilter, setSemesterFilter] = React.useState("all");
  const [termFilter, setTermFilter] = React.useState("all");
  const [progressFilter, setProgressFilter] = React.useState("all");
  const [subjectFilter, setSubjectFilter] = React.useState("all");
  const [subjectStatusFilter, setSubjectStatusFilter] = React.useState("all");

  const [detailSubjectStatus, setDetailSubjectStatus] = React.useState("all");

  const cohorts = React.useMemo(
    () => Array.from(new Set(STUDENTS.map((student) => student.cohort))),
    [],
  );

  const studentClasses = React.useMemo(
    () => Array.from(new Set(STUDENTS.map((student) => student.studentClass))),
    [],
  );

  const curriculums = React.useMemo(
    () =>
      Array.from(new Set(STUDENTS.map((student) => student.curriculumCode))),
    [],
  );

  const terms = React.useMemo(
    () => Array.from(new Set(STUDENTS.map((student) => student.currentTerm))),
    [],
  );

  const subjects = React.useMemo(() => {
    const map = new Map<string, string>();

    STUDENTS.forEach((student) => {
      student.subjects.forEach((subject) => {
        map.set(subject.code, subject.name);
      });
    });

    return Array.from(map.entries()).map(([code, name]) => ({
      code,
      name,
    }));
  }, []);

  const filteredStudents = STUDENTS.filter((student) => {
    const keyword = searchTerm.trim().toLowerCase();

    const searchMatch =
      !keyword ||
      student.studentCode.toLowerCase().includes(keyword) ||
      student.fullName.toLowerCase().includes(keyword);

    const cohortMatch =
      cohortFilter === "all" || student.cohort === cohortFilter;

    const classMatch =
      classFilter === "all" || student.studentClass === classFilter;

    const curriculumMatch =
      curriculumFilter === "all" || student.curriculumCode === curriculumFilter;

    const semesterMatch =
      semesterFilter === "all" ||
      student.currentCurriculumSemester === Number(semesterFilter);

    const termMatch =
      termFilter === "all" || student.currentTerm === termFilter;

    const progressMatch =
      progressFilter === "all" || student.progressStatus === progressFilter;

    const subjectMatch =
      subjectFilter === "all" ||
      student.subjects.some((subject) => {
        if (subject.code !== subjectFilter) {
          return false;
        }

        if (subjectStatusFilter === "all") {
          return true;
        }

        return subject.status === subjectStatusFilter;
      });

    return (
      searchMatch &&
      cohortMatch &&
      classMatch &&
      curriculumMatch &&
      semesterMatch &&
      termMatch &&
      progressMatch &&
      subjectMatch
    );
  });

  const resetFilters = () => {
    setSearchTerm("");
    setCohortFilter("all");
    setClassFilter("all");
    setCurriculumFilter("all");
    setSemesterFilter("all");
    setTermFilter("all");
    setProgressFilter("all");
    setSubjectFilter("all");
    setSubjectStatusFilter("all");
  };

  if (selectedStudent) {
    const completedPercentage = Math.min(
      100,
      Math.round(
        (selectedStudent.completedCredits / selectedStudent.totalCredits) * 100,
      ),
    );

    const unfinishedSubjects = selectedStudent.subjects.filter(
      (subject) => subject.status !== "Passed",
    );

    const visibleSubjects = selectedStudent.subjects.filter(
      (subject) =>
        detailSubjectStatus === "all" || subject.status === detailSubjectStatus,
    );

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedStudent(null);
            setDetailSubjectStatus("all");
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách sinh viên
        </button>

        <PageBanner
          title="Chi tiết Tiến độ Học tập"
          description="Theo dõi kết quả học tập thực tế và đối chiếu với khung chương trình của sinh viên."
          badge="Quản lý sinh viên"
        />

        {/* STUDENT INFO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <GraduationCap size={27} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedStudent.fullName}
                </h2>

                <p className="mt-1 font-semibold text-orange-600">
                  {selectedStudent.studentCode}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
                    Khóa {selectedStudent.cohort}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
                    Lớp {selectedStudent.studentClass}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                    {selectedStudent.curriculumCode}
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                PROGRESS_STATUS_STYLES[selectedStudent.progressStatus]
              }`}
            >
              {selectedStudent.progressStatus === "Đúng tiến độ" ? (
                <CheckCircle2 size={17} />
              ) : (
                <AlertTriangle size={17} />
              )}

              {selectedStudent.progressStatus}
            </span>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">GPA hiện tại</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {selectedStudent.gpa.toFixed(3)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Thang điểm 10</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tín chỉ hoàn thành</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {selectedStudent.completedCredits}/{selectedStudent.totalCredits}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {completedPercentage}% chương trình
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Kỳ chương trình hiện tại</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              Kỳ {selectedStudent.currentCurriculumSemester}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {selectedStudent.currentTerm}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Mốc OJT hiện ước tính</p>
            <p className="mt-2 text-xl font-bold text-slate-800">
              {selectedStudent.currentEstimatedOjtTerm}
            </p>

            {selectedStudent.delayTerms > 0 ? (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Chậm {selectedStudent.delayTerms} kỳ so với dự kiến
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Không thay đổi so với dự kiến
              </p>
            )}
          </div>
        </section>

        {/* PROGRESS + OJT */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-orange-500" />
              <div>
                <h3 className="font-semibold text-slate-800">
                  Tiến độ theo khung chương trình
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Đối chiếu kết quả học tập với các kỳ trong chương trình.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-600">
                  Tín chỉ đã hoàn thành
                </span>
                <span className="font-semibold text-slate-800">
                  {completedPercentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{
                    width: `${completedPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-5 gap-3 md:grid-cols-10">
              {Array.from({ length: 10 }, (_, semester) => {
                const semesterSubjects = selectedStudent.subjects.filter(
                  (subject) => subject.curriculumSemester === semester,
                );

                const hasKnownSubjects = semesterSubjects.length > 0;

                const allPassed =
                  hasKnownSubjects &&
                  semesterSubjects.every(
                    (subject) => subject.status === "Passed",
                  );

                const hasNotPassed = semesterSubjects.some(
                  (subject) => subject.status === "Not Passed",
                );

                return (
                  <div key={semester} className="text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                        allPassed
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : hasNotPassed
                            ? "border-red-200 bg-red-50 text-red-700"
                            : semester ===
                                selectedStudent.currentCurriculumSemester
                              ? "border-orange-200 bg-orange-50 text-orange-600"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {semester}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">
                      Kỳ {semester}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Màu trạng thái kỳ đang được minh họa từ dữ liệu môn học mock hiện
              có; khi có API sẽ đối chiếu đầy đủ toàn bộ môn trong khung chương
              trình.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 size={20} className="text-orange-500" />

              <h3 className="font-semibold text-slate-800">So sánh mốc OJT</h3>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Theo lộ trình ban đầu
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedStudent.plannedOjtTerm}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <ChevronRight size={18} className="text-slate-400" />
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Hiện tại ước tính
                </p>
                <p
                  className={`mt-1 font-semibold ${
                    selectedStudent.delayTerms > 0
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {selectedStudent.currentEstimatedOjtTerm}
                </p>
              </div>

              {selectedStudent.delayTerms > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="flex gap-2">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <p className="text-sm leading-6 text-red-700">
                      Tiến độ tín chỉ hiện tại làm mốc OJT ước tính bị lùi{" "}
                      {selectedStudent.delayTerms} kỳ so với lộ trình ban đầu.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* UNFINISHED SUBJECTS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500" />

            <div>
              <h3 className="font-semibold text-slate-800">
                Môn chưa hoàn thành
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi các môn chưa đạt hoặc chưa bắt đầu trong dữ liệu hiện
                có.
              </p>
            </div>
          </div>

          {unfinishedSubjects.length === 0 ? (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              Không có môn chưa hoàn thành trong dữ liệu hiện tại.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {unfinishedSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {subject.code}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {subject.name}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        SUBJECT_STATUS_STYLES[subject.status]
                      }`}
                    >
                      {subject.status}
                    </span>
                  </div>

                  {subject.prerequisite.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-400">Môn tiên quyết</p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {subject.prerequisite.map((prerequisite) => (
                          <span
                            key={prerequisite}
                            className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600"
                          >
                            {prerequisite}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SUBJECT TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-orange-500" />

              <div>
                <h3 className="font-semibold text-slate-800">
                  Chi tiết môn học
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Kết quả học tập theo từng môn.
                </p>
              </div>
            </div>

            <select
              value={detailSubjectStatus}
              onChange={(event) => setDetailSubjectStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Passed">Passed</option>
              <option value="Not Passed">Not Passed</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Kỳ CT
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Kỳ học thực tế
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Mã môn
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Tên môn
                  </th>
                  <th className="px-5 py-3 text-center font-semibold text-slate-600">
                    TC
                  </th>
                  <th className="px-5 py-3 text-center font-semibold text-slate-600">
                    Điểm TB
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Môn tiên quyết
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Trạng thái
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      Kỳ {subject.curriculumSemester}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {subject.actualTerm}
                    </td>

                    <td className="px-5 py-4 font-semibold text-orange-600">
                      {subject.code}
                    </td>

                    <td className="px-5 py-4 text-slate-700">{subject.name}</td>

                    <td className="px-5 py-4 text-center">{subject.credits}</td>

                    <td className="px-5 py-4 text-center font-semibold">
                      {subject.grade ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {subject.prerequisite.length > 0 ? (
                        <div className="flex max-w-[250px] flex-wrap gap-1.5">
                          {subject.prerequisite.map((prerequisite) => (
                            <span
                              key={prerequisite}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                              {prerequisite}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          SUBJECT_STATUS_STYLES[subject.status]
                        }`}
                      >
                        {subject.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi Tiến độ Học tập"
        description="Theo dõi tiến độ học tập của sinh viên và đối chiếu với lộ trình dự kiến trước kỳ OJT."
        badge="Quản lý sinh viên"
      />

      {/* FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo MSSV hoặc họ tên..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={cohortFilter}
            onChange={(event) => setCohortFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả khóa</option>

            {cohorts.map((cohort) => (
              <option key={cohort} value={cohort}>
                {cohort}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả lớp sinh viên</option>

            {studentClasses.map((studentClass) => (
              <option key={studentClass} value={studentClass}>
                {studentClass}
              </option>
            ))}
          </select>

          <select
            value={curriculumFilter}
            onChange={(event) => setCurriculumFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả khung chương trình</option>

            {curriculums.map((curriculum) => (
              <option key={curriculum} value={curriculum}>
                {curriculum}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả kỳ chương trình</option>

            {Array.from({ length: 10 }, (_, semester) => (
              <option key={semester} value={semester}>
                Kỳ {semester}
              </option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(event) => setTermFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả kỳ học thực tế</option>

            {terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <select
            value={progressFilter}
            onChange={(event) => setProgressFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả trạng thái tiến độ</option>
            <option value="Đúng tiến độ">Đúng tiến độ</option>
            <option value="Chậm tiến độ">Chậm tiến độ</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(event) => {
              setSubjectFilter(event.target.value);

              if (event.target.value === "all") {
                setSubjectStatusFilter("all");
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">Tất cả môn học</option>

            {subjects.map((subject) => (
              <option key={subject.code} value={subject.code}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>

          <select
            value={subjectStatusFilter}
            disabled={subjectFilter === "all"}
            onChange={(event) => setSubjectStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="all">Tất cả trạng thái môn</option>
            <option value="Passed">Passed</option>
            <option value="Not Passed">Not Passed</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-semibold text-slate-500 transition hover:text-orange-500"
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sinh viên hiển thị</p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {filteredStudents.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đúng tiến độ</p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {
                  filteredStudents.filter(
                    (student) => student.progressStatus === "Đúng tiến độ",
                  ).length
                }
              </p>
            </div>

            <CheckCircle2 size={25} className="text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Chậm tiến độ</p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {
                  filteredStudents.filter(
                    (student) => student.progressStatus === "Chậm tiến độ",
                  ).length
                }
              </p>
            </div>

            <AlertTriangle size={25} className="text-red-500" />
          </div>
        </div>
      </section>

      {/* STUDENT TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">
              Danh sách sinh viên
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chọn sinh viên để xem chi tiết tiến độ học tập.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600">MSSV</th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Họ và tên
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Khóa / Lớp
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Khung CT
                </th>

                <th className="px-5 py-3 text-center font-semibold text-slate-600">
                  Kỳ CT
                </th>

                <th className="px-5 py-3 text-center font-semibold text-slate-600">
                  GPA
                </th>

                <th className="px-5 py-3 text-center font-semibold text-slate-600">
                  Tín chỉ
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Tiến độ
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  OJT ước tính
                </th>

                <th className="px-5 py-3 text-right font-semibold text-slate-600">
                  Chi tiết
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-semibold text-orange-600">
                      {student.studentCode}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {student.fullName}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {student.cohort}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {student.studentClass}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {student.curriculumCode}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Kỳ {student.currentCurriculumSemester}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center font-semibold text-slate-700">
                      {student.gpa.toFixed(3)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="font-semibold text-slate-700">
                        {student.completedCredits}
                      </span>

                      <span className="text-slate-400">
                        /{student.totalCredits}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          PROGRESS_STATUS_STYLES[student.progressStatus]
                        }`}
                      >
                        {student.progressStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className={`font-semibold ${
                          student.delayTerms > 0
                            ? "text-red-600"
                            : "text-slate-700"
                        }`}
                      >
                        {student.currentEstimatedOjtTerm}
                      </p>

                      {student.delayTerms > 0 && (
                        <p className="mt-1 text-xs text-red-500">
                          Chậm {student.delayTerms} kỳ
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                      >
                        <Eye size={16} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <Circle size={28} className="mx-auto text-slate-300" />

                    <p className="mt-3 text-sm text-slate-400">
                      Không tìm thấy sinh viên phù hợp với bộ lọc.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EducationStudentProgress;
