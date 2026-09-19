import React from "react";
import {
  Search,
  Eye,
  CalendarDays,
  AlertTriangle,
  Users,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type EligibilityStatus =
  | "Đủ điều kiện"
  | "Dự kiến đủ điều kiện"
  | "Chưa đủ điều kiện";

type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ";

type ApplicationStatus =
  | "Chưa đăng ký"
  | "Chờ duyệt"
  | "Yêu cầu bổ sung"
  | "Đã duyệt"
  | "Từ chối";

type OjtStatus =
  | "Sắp đến kỳ OJT"
  | "Đủ điều kiện OJT"
  | "Đang đăng ký OJT"
  | "Đã duyệt hồ sơ"
  | "Chờ xử lý với Phòng QHDN"
  | "Chờ doanh nghiệp phản hồi"
  | "Đã được doanh nghiệp tiếp nhận"
  | "Đang OJT"
  | "Hoàn thành OJT";

interface TimelineItem {
  id: string;
  title: string;
  date?: string;
  description?: string;
  completed: boolean;
  current?: boolean;
}

interface StudentOjtStatus {
  id: string;

  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  major: string;
  curriculumCode: string;
  currentSemester: number;

  eligibilityStatus: EligibilityStatus;
  progressStatus: ProgressStatus;

  // Kỳ OJT theo kế hoạch học tập ban đầu.
  plannedOjtTerm: string;

  // Đợt OJT thực tế mà sinh viên đang thuộc về.
  ojtTerm: string;

  // Số kỳ bị trễ so với kế hoạch ban đầu.
  delayTerms: number;

  applicationStatus: ApplicationStatus;
  ojtStatus: OjtStatus;

  company?: string;
  position?: string;

  startDate?: string;
  endDate?: string;

  timeline: TimelineItem[];
}

/* =========================================================
   MOCK DATA
   ========================================================= */

const INITIAL_STUDENTS: StudentOjtStatus[] = [
  {
    id: "student-status-1",
    studentCode: "SE182521",
    fullName: "Lê Minh Nhật",
    cohort: "K18",
    studentClass: "K18D-19A",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 6,

    eligibilityStatus: "Đủ điều kiện",
    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    ojtTerm: "Fall 2026",
    delayTerms: 0,

    applicationStatus: "Đã duyệt",
    ojtStatus: "Đang OJT",

    company: "FPT IS",
    position: "Business Analyst Intern",

    startDate: "01/10/2026",
    endDate: "31/12/2026",

    timeline: [
      {
        id: "nhat-1",
        title: "Đủ điều kiện OJT",
        date: "20/08/2026",
        completed: true,
      },
      {
        id: "nhat-2",
        title: "Đã gửi hồ sơ đăng ký OJT",
        date: "05/09/2026",
        completed: true,
      },
      {
        id: "nhat-3",
        title: "PĐT đã duyệt hồ sơ",
        date: "08/09/2026",
        completed: true,
      },
      {
        id: "nhat-4",
        title: "Chuyển sang Phòng Quan hệ Doanh nghiệp",
        date: "09/09/2026",
        completed: true,
      },
      {
        id: "nhat-5",
        title: "Doanh nghiệp tiếp nhận",
        date: "20/09/2026",
        description: "FPT IS - Business Analyst Intern",
        completed: true,
      },
      {
        id: "nhat-6",
        title: "Đang OJT",
        date: "01/10/2026 - 31/12/2026",
        description: "Thực tập tại FPT IS.",
        completed: false,
        current: true,
      },
      {
        id: "nhat-7",
        title: "Hoàn thành OJT",
        completed: false,
      },
    ],
  },

  {
    id: "student-status-2",
    studentCode: "SE181666",
    fullName: "Nguyễn Khánh Ly",
    cohort: "K18",
    studentClass: "K18D-19A",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 5,

    eligibilityStatus: "Chưa đủ điều kiện",
    progressStatus: "Chậm tiến độ",

    plannedOjtTerm: "Summer 2026",
    ojtTerm: "Fall 2026",
    delayTerms: 1,

    applicationStatus: "Chưa đăng ký",
    ojtStatus: "Sắp đến kỳ OJT",

    timeline: [
      {
        id: "ly-1",
        title: "Kỳ OJT theo kế hoạch ban đầu",
        date: "Summer 2026",
        description:
          "Sinh viên chưa đạt đủ điều kiện để tham gia OJT theo kế hoạch ban đầu.",
        completed: true,
      },
      {
        id: "ly-2",
        title: "Hoàn thành các học phần còn thiếu",
        description:
          "Sinh viên đang tiếp tục hoàn thành tín chỉ để đáp ứng điều kiện OJT.",
        completed: false,
        current: true,
      },
      {
        id: "ly-3",
        title: "Đợt OJT dự kiến tiếp theo",
        date: "Fall 2026",
        completed: false,
      },
      {
        id: "ly-4",
        title: "Đăng ký OJT",
        completed: false,
      },
    ],
  },

  {
    id: "student-status-3",
    studentCode: "SE182687",
    fullName: "Trần Vĩnh Phước",
    cohort: "K18",
    studentClass: "K18D-19B",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 5,

    eligibilityStatus: "Dự kiến đủ điều kiện",
    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    ojtTerm: "Fall 2026",
    delayTerms: 0,

    applicationStatus: "Chờ duyệt",
    ojtStatus: "Đang đăng ký OJT",

    company: "NashTech",
    position: "Data Analyst Intern",

    timeline: [
      {
        id: "phuoc-1",
        title: "Dự kiến đủ điều kiện OJT",
        date: "Fall 2026",
        description:
          "Dự kiến đạt điều kiện sau khi hoàn thành các học phần đang học.",
        completed: true,
      },
      {
        id: "phuoc-2",
        title: "Đã gửi hồ sơ đăng ký OJT",
        date: "10/09/2026",
        completed: true,
      },
      {
        id: "phuoc-3",
        title: "PĐT duyệt hồ sơ",
        description: "Hồ sơ đang chờ Phòng Đào tạo xử lý.",
        completed: false,
        current: true,
      },
      {
        id: "phuoc-4",
        title: "Chuyển Phòng Quan hệ Doanh nghiệp",
        completed: false,
      },
      {
        id: "phuoc-5",
        title: "Doanh nghiệp phản hồi",
        completed: false,
      },
    ],
  },

  {
    id: "student-status-4",
    studentCode: "SE182618",
    fullName: "Nguyễn Minh Hải",
    cohort: "K18",
    studentClass: "K18D-19A",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 6,

    eligibilityStatus: "Đủ điều kiện",
    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    ojtTerm: "Fall 2026",
    delayTerms: 0,

    applicationStatus: "Đã duyệt",
    ojtStatus: "Chờ doanh nghiệp phản hồi",

    company: "KMS Technology",
    position: "Software Engineer Intern",

    timeline: [
      {
        id: "hai-1",
        title: "Đủ điều kiện OJT",
        date: "18/08/2026",
        completed: true,
      },
      {
        id: "hai-2",
        title: "Đã gửi hồ sơ đăng ký OJT",
        date: "04/09/2026",
        completed: true,
      },
      {
        id: "hai-3",
        title: "PĐT đã duyệt hồ sơ",
        date: "07/09/2026",
        completed: true,
      },
      {
        id: "hai-4",
        title: "Chuyển Phòng Quan hệ Doanh nghiệp",
        date: "08/09/2026",
        completed: true,
      },
      {
        id: "hai-5",
        title: "Chờ doanh nghiệp phản hồi",
        description: "KMS Technology - Software Engineer Intern",
        completed: false,
        current: true,
      },
      {
        id: "hai-6",
        title: "Doanh nghiệp tiếp nhận",
        completed: false,
      },
      {
        id: "hai-7",
        title: "Bắt đầu OJT",
        completed: false,
      },
    ],
  },

  {
    id: "student-status-5",
    studentCode: "SE182744",
    fullName: "Võ Minh Khang",
    cohort: "K18",
    studentClass: "K18D-19B",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 6,

    eligibilityStatus: "Đủ điều kiện",
    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    ojtTerm: "Fall 2026",
    delayTerms: 0,

    applicationStatus: "Đã duyệt",
    ojtStatus: "Đã được doanh nghiệp tiếp nhận",

    company: "FPT Software",
    position: "Business Intelligence Intern",

    startDate: "15/10/2026",
    endDate: "15/01/2027",

    timeline: [
      {
        id: "khang-1",
        title: "Đủ điều kiện OJT",
        date: "19/08/2026",
        completed: true,
      },
      {
        id: "khang-2",
        title: "Đã gửi hồ sơ đăng ký OJT",
        date: "06/09/2026",
        completed: true,
      },
      {
        id: "khang-3",
        title: "PĐT đã duyệt hồ sơ",
        date: "09/09/2026",
        completed: true,
      },
      {
        id: "khang-4",
        title: "Chuyển Phòng Quan hệ Doanh nghiệp",
        date: "10/09/2026",
        completed: true,
      },
      {
        id: "khang-5",
        title: "Doanh nghiệp tiếp nhận",
        date: "25/09/2026",
        description: "FPT Software - Business Intelligence Intern",
        completed: false,
        current: true,
      },
      {
        id: "khang-6",
        title: "Bắt đầu OJT",
        date: "15/10/2026",
        completed: false,
      },
      {
        id: "khang-7",
        title: "Dự kiến kết thúc OJT",
        date: "15/01/2027",
        completed: false,
      },
    ],
  },

  {
    id: "student-status-6",
    studentCode: "SE180932",
    fullName: "Phạm Gia Hân",
    cohort: "K18",
    studentClass: "K18D-19B",
    major: "Information Systems",
    curriculumCode: "BIT_IS_K18D_19A",
    currentSemester: 7,

    eligibilityStatus: "Đủ điều kiện",
    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Summer 2026",
    ojtTerm: "Summer 2026",
    delayTerms: 0,

    applicationStatus: "Đã duyệt",
    ojtStatus: "Hoàn thành OJT",

    company: "NashTech",
    position: "Data Analyst Intern",

    startDate: "01/06/2026",
    endDate: "31/08/2026",

    timeline: [
      {
        id: "han-1",
        title: "Đủ điều kiện OJT",
        date: "10/05/2026",
        completed: true,
      },
      {
        id: "han-2",
        title: "Đã gửi hồ sơ đăng ký OJT",
        date: "12/05/2026",
        completed: true,
      },
      {
        id: "han-3",
        title: "PĐT đã duyệt hồ sơ",
        date: "15/05/2026",
        completed: true,
      },
      {
        id: "han-4",
        title: "Doanh nghiệp tiếp nhận",
        date: "25/05/2026",
        description: "NashTech - Data Analyst Intern",
        completed: true,
      },
      {
        id: "han-5",
        title: "Tham gia OJT",
        date: "01/06/2026 - 31/08/2026",
        completed: true,
      },
      {
        id: "han-6",
        title: "Hoàn thành OJT",
        date: "31/08/2026",
        completed: true,
        current: true,
      },
    ],
  },
];

/* =========================================================
   STYLE
   ========================================================= */

const ELIGIBILITY_STYLE: Record<EligibilityStatus, string> = {
  "Đủ điều kiện":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Dự kiến đủ điều kiện":
    "border-amber-200 bg-amber-50 text-amber-700",
  "Chưa đủ điều kiện":
    "border-red-200 bg-red-50 text-red-700",
};

const PROGRESS_STYLE: Record<ProgressStatus, string> = {
  "Đúng tiến độ":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Chậm tiến độ":
    "border-red-200 bg-red-50 text-red-700",
};

const OJT_STATUS_STYLE: Record<OjtStatus, string> = {
  "Sắp đến kỳ OJT":
    "border-slate-200 bg-slate-50 text-slate-700",

  "Đủ điều kiện OJT":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đang đăng ký OJT":
    "border-blue-200 bg-blue-50 text-blue-700",

  "Đã duyệt hồ sơ":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Chờ xử lý với Phòng QHDN":
    "border-amber-200 bg-amber-50 text-amber-700",

  "Chờ doanh nghiệp phản hồi":
    "border-amber-200 bg-amber-50 text-amber-700",

  "Đã được doanh nghiệp tiếp nhận":
    "border-blue-200 bg-blue-50 text-blue-700",

  "Đang OJT":
    "border-orange-200 bg-orange-50 text-orange-700",

  "Hoàn thành OJT":
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationStudentStatus: React.FC = () => {
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentOjtStatus | null>(null);

  const [ojtTermFilter, setOjtTermFilter] =
    React.useState("Fall 2026");

  const [search, setSearch] = React.useState("");
  const [cohortFilter, setCohortFilter] =
    React.useState("all");
  const [classFilter, setClassFilter] =
    React.useState("all");
  const [semesterFilter, setSemesterFilter] =
    React.useState("all");
  const [eligibilityFilter, setEligibilityFilter] =
    React.useState("all");
  const [progressFilter, setProgressFilter] =
    React.useState("all");
  const [ojtStatusFilter, setOjtStatusFilter] =
    React.useState("all");

  /* =======================================================
     OPTIONS
     ======================================================= */

  const ojtTerms = Array.from(
    new Set(
      INITIAL_STUDENTS.map((student) => student.ojtTerm),
    ),
  );

  const studentsInSelectedTerm = INITIAL_STUDENTS.filter(
    (student) => student.ojtTerm === ojtTermFilter,
  );

  const cohorts = Array.from(
    new Set(
      studentsInSelectedTerm.map(
        (student) => student.cohort,
      ),
    ),
  );

  const classes = Array.from(
    new Set(
      studentsInSelectedTerm.map(
        (student) => student.studentClass,
      ),
    ),
  );

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredStudents = studentsInSelectedTerm.filter(
    (student) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        student.studentCode
          .toLowerCase()
          .includes(keyword) ||
        student.fullName
          .toLowerCase()
          .includes(keyword);

      const matchesCohort =
        cohortFilter === "all" ||
        student.cohort === cohortFilter;

      const matchesClass =
        classFilter === "all" ||
        student.studentClass === classFilter;

      const matchesSemester =
        semesterFilter === "all" ||
        student.currentSemester ===
          Number(semesterFilter);

      const matchesEligibility =
        eligibilityFilter === "all" ||
        student.eligibilityStatus ===
          eligibilityFilter;

      const matchesProgress =
        progressFilter === "all" ||
        student.progressStatus === progressFilter;

      const matchesOjtStatus =
        ojtStatusFilter === "all" ||
        student.ojtStatus === ojtStatusFilter;

      return (
        matchesSearch &&
        matchesCohort &&
        matchesClass &&
        matchesSemester &&
        matchesEligibility &&
        matchesProgress &&
        matchesOjtStatus
      );
    },
  );

  /* =======================================================
     STATISTICS
     ======================================================= */

  const delayedCount = studentsInSelectedTerm.filter(
    (student) =>
      student.progressStatus === "Chậm tiến độ",
  ).length;

  const waitingEnterpriseCount =
    studentsInSelectedTerm.filter(
      (student) =>
        student.ojtStatus ===
        "Chờ doanh nghiệp phản hồi",
    ).length;

  const doingOjtCount = studentsInSelectedTerm.filter(
    (student) => student.ojtStatus === "Đang OJT",
  ).length;

  /* =======================================================
     ACTIONS
     ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setCohortFilter("all");
    setClassFilter("all");
    setSemesterFilter("all");
    setEligibilityFilter("all");
    setProgressFilter("all");
    setOjtStatusFilter("all");
  };

  const handleChangeOjtTerm = (term: string) => {
    setOjtTermFilter(term);

    setSearch("");
    setCohortFilter("all");
    setClassFilter("all");
    setSemesterFilter("all");
    setEligibilityFilter("all");
    setProgressFilter("all");
    setOjtStatusFilter("all");
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi Trạng thái Sinh viên"
        description="Theo dõi tình trạng điều kiện và quá trình tham gia OJT của sinh viên theo từng đợt."
        badge="Quản lý sinh viên"
      />

      {/* ===================================================
          OJT BATCH
          =================================================== */}

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
              <CalendarDays size={22} />
            </div>

            <div>
              <p className="text-sm font-semibold text-orange-600">
                Đợt OJT đang theo dõi
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-800">
                {ojtTermFilter}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Sinh viên trong cùng một đợt có thể bắt đầu
                và kết thúc OJT ở các thời điểm khác nhau.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              Chọn đợt OJT
            </label>

            <select
              value={ojtTermFilter}
              onChange={(event) =>
                handleChangeOjtTerm(event.target.value)
              }
              className="w-full min-w-[210px] rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-orange-400 md:w-auto"
            >
              {ojtTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ===================================================
          STATISTICS
          =================================================== */}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Sinh viên trong đợt
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {studentsInSelectedTerm.length}
              </p>
            </div>

            <Users
              size={24}
              className="text-slate-300"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Chậm tiến độ
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {delayedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Chờ doanh nghiệp
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {waitingEnterpriseCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Đang OJT
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-600">
            {doingOjtCount}
          </p>
        </div>
      </section>

      {/* ===================================================
          FILTER
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo MSSV hoặc họ tên..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={cohortFilter}
            onChange={(event) =>
              setCohortFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
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
            onChange={(event) =>
              setClassFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả lớp sinh viên
            </option>

            {classes.map((studentClass) => (
              <option
                key={studentClass}
                value={studentClass}
              >
                {studentClass}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(event) =>
              setSemesterFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả kỳ chương trình
            </option>
            <option value="4">Kỳ 4</option>
            <option value="5">Kỳ 5</option>
            <option value="6">Kỳ 6</option>
            <option value="7">Kỳ 7</option>
            <option value="8">Kỳ 8</option>
            <option value="9">Kỳ 9</option>
          </select>

          <select
            value={eligibilityFilter}
            onChange={(event) =>
              setEligibilityFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả điều kiện OJT
            </option>
            <option value="Đủ điều kiện">
              Đủ điều kiện
            </option>
            <option value="Dự kiến đủ điều kiện">
              Dự kiến đủ điều kiện
            </option>
            <option value="Chưa đủ điều kiện">
              Chưa đủ điều kiện
            </option>
          </select>

          <select
            value={progressFilter}
            onChange={(event) =>
              setProgressFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả tiến độ
            </option>
            <option value="Đúng tiến độ">
              Đúng tiến độ
            </option>
            <option value="Chậm tiến độ">
              Chậm tiến độ
            </option>
          </select>

          <select
            value={ojtStatusFilter}
            onChange={(event) =>
              setOjtStatusFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả trạng thái OJT
            </option>

            {Object.keys(OJT_STATUS_STYLE).map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-orange-300 hover:text-orange-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* ===================================================
          STUDENT LIST
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">
              Sinh viên đợt {ojtTermFilter}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Hiển thị {filteredStudents.length} /{" "}
              {studentsInSelectedTerm.length} sinh viên.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-5 py-3">
                  Sinh viên
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Kỳ hiện tại
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Điều kiện OJT
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Tiến độ
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Đợt OJT
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Hồ sơ
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Trạng thái hiện tại
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Ngày bắt đầu
                </th>

                <th className="whitespace-nowrap px-5 py-3">
                  Ngày kết thúc
                </th>

                <th className="whitespace-nowrap px-5 py-3 text-right">
                  Chi tiết
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="transition hover:bg-slate-50/70"
                >
                  {/* STUDENT */}

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap font-semibold text-slate-800">
                      {student.fullName}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-xs font-semibold text-orange-600">
                      {student.studentCode}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                      {student.cohort} ·{" "}
                      {student.studentClass}
                    </p>
                  </td>

                  {/* SEMESTER */}

                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                    Kỳ {student.currentSemester}
                  </td>

                  {/* ELIGIBILITY */}

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        ELIGIBILITY_STYLE[
                          student.eligibilityStatus
                        ]
                      }`}
                    >
                      {student.eligibilityStatus}
                    </span>
                  </td>

                  {/* PROGRESS */}

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        PROGRESS_STYLE[
                          student.progressStatus
                        ]
                      }`}
                    >
                      {student.progressStatus}
                    </span>
                  </td>

                  {/* OJT TERM */}

                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="font-semibold text-slate-700">
                      {student.ojtTerm}
                    </span>
                  </td>

                  {/* APPLICATION */}

                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {student.applicationStatus}
                  </td>

                  {/* CURRENT STATUS */}

                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        OJT_STATUS_STYLE[
                          student.ojtStatus
                        ]
                      }`}
                    >
                      {student.ojtStatus}
                    </span>
                  </td>

                  {/* START DATE */}

                  <td className="whitespace-nowrap px-5 py-4">
                    {student.startDate ? (
                      <span className="font-medium text-slate-700">
                        {student.startDate}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Chưa xác định
                      </span>
                    )}
                  </td>

                  {/* END DATE */}

                  <td className="whitespace-nowrap px-5 py-4">
                    {student.endDate ? (
                      <span className="font-medium text-slate-700">
                        {student.endDate}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Chưa xác định
                      </span>
                    )}
                  </td>

                  {/* DETAIL */}

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudent(student)
                      }
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-orange-600 transition hover:bg-orange-50"
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center"
                  >
                    <p className="font-medium text-slate-500">
                      Không tìm thấy sinh viên phù hợp.
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Thử thay đổi hoặc xóa bộ lọc hiện tại.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================================================
          STUDENT DETAIL MODAL
          =================================================== */}

      {selectedStudent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Chi tiết trạng thái sinh viên
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Theo dõi tiến độ và trạng thái OJT
                  hiện tại.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(null)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="overflow-y-auto px-6 py-6">
              {/* STUDENT */}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Sinh viên
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {selectedStudent.fullName}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="font-bold text-orange-600">
                        {selectedStudent.studentCode}
                      </span>

                      <span className="text-slate-500">
                        {selectedStudent.cohort}
                      </span>

                      <span className="text-slate-500">
                        {selectedStudent.studentClass}
                      </span>

                      <span className="text-slate-500">
                        {selectedStudent.major}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
                      OJT_STATUS_STYLE[
                        selectedStudent.ojtStatus
                      ]
                    }`}
                  >
                    {selectedStudent.ojtStatus}
                  </span>
                </div>
              </section>

              {/* CURRENT INFORMATION */}

              <section className="mt-5">
                <h3 className="text-base font-black text-slate-800">
                  Thông tin hiện tại
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Kỳ hiện tại
                    </p>

                    <p className="mt-2 font-bold text-slate-800">
                      Kỳ{" "}
                      {selectedStudent.currentSemester}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Điều kiện OJT
                    </p>

                    <span
                      className={`mt-2 inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        ELIGIBILITY_STYLE[
                          selectedStudent
                            .eligibilityStatus
                        ]
                      }`}
                    >
                      {
                        selectedStudent.eligibilityStatus
                      }
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Tiến độ
                    </p>

                    <span
                      className={`mt-2 inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        PROGRESS_STYLE[
                          selectedStudent
                            .progressStatus
                        ]
                      }`}
                    >
                      {selectedStudent.progressStatus}
                    </span>
                  </div>
                </div>
              </section>

              {/* OJT PROGRESS */}

              <section className="mt-6">
                <h3 className="text-base font-black text-slate-800">
                  Tiến độ OJT
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Kỳ OJT theo kế hoạch
                    </p>

                    <p className="mt-2 whitespace-nowrap font-bold text-slate-800">
                      {
                        selectedStudent.plannedOjtTerm
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Đợt OJT hiện tại
                    </p>

                    <p className="mt-2 whitespace-nowrap font-bold text-slate-800">
                      {selectedStudent.ojtTerm}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Độ trễ
                    </p>

                    <p
                      className={`mt-2 font-bold ${
                        selectedStudent.delayTerms >
                        0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {selectedStudent.delayTerms > 0
                        ? `${selectedStudent.delayTerms} kỳ`
                        : "Không trễ"}
                    </p>
                  </div>
                </div>

                {selectedStudent.delayTerms > 0 && (
                  <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <AlertTriangle
                        size={19}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <div>
                        <p className="font-bold text-red-700">
                          Sinh viên đang chậm tiến độ
                          OJT
                        </p>

                        <p className="mt-1 text-sm leading-6 text-red-600">
                          Theo kế hoạch sinh viên tham
                          gia OJT vào{" "}
                          <strong>
                            {
                              selectedStudent.plannedOjtTerm
                            }
                          </strong>
                          , nhưng hiện được theo dõi ở
                          đợt{" "}
                          <strong>
                            {selectedStudent.ojtTerm}
                          </strong>
                          . Sinh viên đang trễ{" "}
                          <strong>
                            {
                              selectedStudent.delayTerms
                            }{" "}
                            kỳ
                          </strong>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* OJT DATES */}

              <section className="mt-6">
                <h3 className="text-base font-black text-slate-800">
                  Thời gian OJT
                </h3>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Ngày bắt đầu
                    </p>

                    <p className="mt-2 font-bold text-slate-800">
                      {selectedStudent.startDate ||
                        "Chưa xác định"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">
                      Ngày kết thúc
                    </p>

                    <p className="mt-2 font-bold text-slate-800">
                      {selectedStudent.endDate ||
                        "Chưa xác định"}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(null)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationStudentStatus;