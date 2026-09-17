import React from "react";
import {
  Search,
  Eye,
  ArrowLeft,
  GraduationCap,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  AlertTriangle,
  BriefcaseBusiness,
  Users,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

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

  // Ngày thực tập riêng của từng sinh viên.
  startDate?: string;
  endDate?: string;

  timeline: TimelineItem[];
}

/* =========================================================
   MOCK DATA
   ========================================================= */

const INITIAL_STUDENTS: StudentOjtStatus[] = [
  // ========================================================
  // FALL 2026
  // ========================================================
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

    // Theo kế hoạch Ly phải đi Summer 2026,
    // nhưng chưa đủ điều kiện nên chuyển sang batch Fall 2026.
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

    // Cùng Fall 2026 nhưng bắt đầu muộn hơn Nhật.
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

  // ========================================================
  // SUMMER 2026
  // Sinh viên này thuộc batch khác.
  // Khi chọn Fall 2026 sẽ không xuất hiện.
  // ========================================================
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

  /*
   * Một lần theo dõi tập trung vào một đợt OJT.
   * Fall 2026 và Summer 2026 không trộn chung.
   */
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

  const [companyFilter, setCompanyFilter] =
    React.useState("all");

  /* =======================================================
     OPTIONS
     ======================================================= */

  const ojtTerms = Array.from(
    new Set(INITIAL_STUDENTS.map((student) => student.ojtTerm)),
  );

  const studentsInSelectedTerm = INITIAL_STUDENTS.filter(
    (student) => student.ojtTerm === ojtTermFilter,
  );

  /*
   * Các filter phía dưới chỉ lấy dữ liệu trong batch đang chọn.
   * Ví dụ đang xem Fall thì không lấy company/lớp của Summer.
   */
  const cohorts = Array.from(
    new Set(
      studentsInSelectedTerm.map((student) => student.cohort),
    ),
  );

  const classes = Array.from(
    new Set(
      studentsInSelectedTerm.map(
        (student) => student.studentClass,
      ),
    ),
  );

  const companies = Array.from(
    new Set(
      studentsInSelectedTerm
        .map((student) => student.company)
        .filter(
          (company): company is string => Boolean(company),
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
        student.studentCode.toLowerCase().includes(keyword) ||
        student.fullName.toLowerCase().includes(keyword);

      const matchesCohort =
        cohortFilter === "all" ||
        student.cohort === cohortFilter;

      const matchesClass =
        classFilter === "all" ||
        student.studentClass === classFilter;

      const matchesSemester =
        semesterFilter === "all" ||
        student.currentSemester === Number(semesterFilter);

      const matchesEligibility =
        eligibilityFilter === "all" ||
        student.eligibilityStatus === eligibilityFilter;

      const matchesProgress =
        progressFilter === "all" ||
        student.progressStatus === progressFilter;

      const matchesOjtStatus =
        ojtStatusFilter === "all" ||
        student.ojtStatus === ojtStatusFilter;

      const matchesCompany =
        companyFilter === "all" ||
        student.company === companyFilter;

      return (
        matchesSearch &&
        matchesCohort &&
        matchesClass &&
        matchesSemester &&
        matchesEligibility &&
        matchesProgress &&
        matchesOjtStatus &&
        matchesCompany
      );
    },
  );

  /* =======================================================
     STATISTICS
     ======================================================= */

  const delayedCount = studentsInSelectedTerm.filter(
    (student) => student.progressStatus === "Chậm tiến độ",
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
     ACTION
     ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setCohortFilter("all");
    setClassFilter("all");
    setSemesterFilter("all");
    setEligibilityFilter("all");
    setProgressFilter("all");
    setOjtStatusFilter("all");
    setCompanyFilter("all");
  };

  const handleChangeOjtTerm = (term: string) => {
    setOjtTermFilter(term);

    /*
     * Khi đổi batch thì reset filter phụ để tránh
     * giữ lại company/lớp không tồn tại trong batch mới.
     */
    setSearch("");
    setCohortFilter("all");
    setClassFilter("all");
    setSemesterFilter("all");
    setEligibilityFilter("all");
    setProgressFilter("all");
    setOjtStatusFilter("all");
    setCompanyFilter("all");
  };

  /* =======================================================
     DETAIL
     ======================================================= */

  if (selectedStudent) {
    const student = selectedStudent;

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedStudent(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách sinh viên
        </button>

        <PageBanner
          title="Chi tiết Trạng thái Sinh viên"
          description="Theo dõi tiến trình của sinh viên trong đợt OJT."
          badge="Quản lý sinh viên"
        />

        {/* =================================================
            STUDENT INFORMATION
            ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <GraduationCap size={27} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {student.fullName}
                </h2>

                <p className="mt-1 font-semibold text-orange-600">
                  {student.studentCode}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {student.cohort}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {student.studentClass}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Kỳ {student.currentSemester}
                  </span>

                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    {student.curriculumCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Trạng thái hiện tại
              </span>

              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  OJT_STATUS_STYLE[student.ojtStatus]
                }`}
              >
                {student.ojtStatus}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">
                Ngành
              </p>

              <p className="mt-1 font-medium text-slate-700">
                {student.major}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Điều kiện OJT
              </p>

              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  ELIGIBILITY_STYLE[
                    student.eligibilityStatus
                  ]
                }`}
              >
                {student.eligibilityStatus}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Tiến độ học tập
              </p>

              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  PROGRESS_STYLE[student.progressStatus]
                }`}
              >
                {student.progressStatus}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Hồ sơ đăng ký OJT
              </p>

              <p className="mt-1 font-medium text-slate-700">
                {student.applicationStatus}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            OJT TERM + COMPANY
            ================================================= */}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* OJT TERM */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarDays
                size={20}
                className="text-orange-500"
              />

              <h3 className="font-semibold text-slate-800">
                Tiến độ OJT
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">
                  Kỳ OJT theo kế hoạch
                </span>

                <span className="font-semibold text-slate-700">
                  {student.plannedOjtTerm}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">
                  Đợt OJT thực tế
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                  {student.ojtTerm}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Độ trễ
                </span>

                {student.delayTerms === 0 ? (
                  <span className="font-semibold text-emerald-600">
                    Không trễ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 font-semibold text-red-600">
                    <AlertTriangle size={16} />
                    {student.delayTerms} kỳ
                  </span>
                )}
              </div>
            </div>

            {student.delayTerms > 0 && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Sinh viên bị chậm tiến độ OJT
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-600">
                      Theo kế hoạch sinh viên tham gia{" "}
                      {student.plannedOjtTerm}, nhưng hiện được
                      chuyển sang đợt {student.ojtTerm}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COMPANY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2
                size={20}
                className="text-orange-500"
              />

              <h3 className="font-semibold text-slate-800">
                Thông tin thực tập
              </h3>
            </div>

            {student.company ? (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Doanh nghiệp
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {student.company}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Vị trí thực tập
                  </p>

                  <p className="mt-1 flex items-center gap-2 font-medium text-slate-700">
                    <BriefcaseBusiness size={16} />
                    {student.position || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Ngày bắt đầu
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {student.startDate || "Chưa xác định"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Ngày kết thúc
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {student.endDate || "Chưa xác định"}
                    </p>
                  </div>
                </div>

                {!student.startDate && (
                  <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-700">
                    Sinh viên đã có doanh nghiệp/vị trí mong muốn
                    hoặc đang được xử lý với doanh nghiệp, nhưng
                    chưa xác định lịch thực tập chính thức.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-600">
                  Chưa có doanh nghiệp thực tập
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Sinh viên chưa có thông tin doanh nghiệp tiếp
                  nhận trong đợt OJT này.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            TIMELINE
            ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-semibold text-slate-800">
              Timeline OJT
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi sinh viên đang ở bước nào trong đợt{" "}
              {student.ojtTerm}.
            </p>
          </div>

          <div className="mt-7 space-y-0">
            {student.timeline.map((item, index) => {
              const isLast =
                index === student.timeline.length - 1;

              return (
                <div
                  key={item.id}
                  className="relative flex gap-4"
                >
                  {!isLast && (
                    <div className="absolute left-[11px] top-6 h-full w-px bg-slate-200" />
                  )}

                  <div className="relative z-10 mt-0.5 shrink-0 bg-white">
                    {item.completed ? (
                      <CheckCircle2
                        size={23}
                        className="text-emerald-500"
                      />
                    ) : item.current ? (
                      <Clock3
                        size={23}
                        className="text-orange-500"
                      />
                    ) : (
                      <Circle
                        size={23}
                        className="text-slate-300"
                      />
                    )}
                  </div>

                  <div className="pb-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-semibold ${
                          item.current
                            ? "text-orange-700"
                            : "text-slate-700"
                        }`}
                      >
                        {item.title}
                      </p>

                      {item.current && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                          Hiện tại
                        </span>
                      )}
                    </div>

                    {item.date && (
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {item.date}
                      </p>
                    )}

                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     LIST PAGE
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Theo dõi Trạng thái Sinh viên"
        description="Theo dõi tình trạng điều kiện, hồ sơ, doanh nghiệp và quá trình tham gia OJT của sinh viên theo từng đợt."
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
                Sinh viên trong cùng một đợt có thể được doanh
                nghiệp tiếp nhận và bắt đầu OJT ở các thời điểm
                khác nhau.
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
          {/* COHORT */}

          <select
            value={cohortFilter}
            onChange={(event) =>
              setCohortFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả khóa
            </option>

            {cohorts.map((cohort) => (
              <option
                key={cohort}
                value={cohort}
              >
                {cohort}
              </option>
            ))}
          </select>

          {/* STUDENT CLASS */}

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

          {/* CURRICULUM SEMESTER */}

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

          {/* ELIGIBILITY */}

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

          {/* PROGRESS */}

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

          {/* OJT STATUS */}

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

          {/* COMPANY */}

          <select
            value={companyFilter}
            onChange={(event) =>
              setCompanyFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="all">
              Tất cả doanh nghiệp
            </option>

            {companies.map((company) => (
              <option
                key={company}
                value={company}
              >
                {company}
              </option>
            ))}
          </select>

          {/* RESET */}

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
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3">
                  Sinh viên
                </th>

                <th className="px-5 py-3">
                  Kỳ hiện tại
                </th>

                <th className="px-5 py-3">
                  Điều kiện OJT
                </th>

                <th className="px-5 py-3">
                  Tiến độ
                </th>

                <th className="px-5 py-3">
                  Đợt OJT
                </th>

                <th className="px-5 py-3">
                  Hồ sơ
                </th>

                <th className="px-5 py-3">
                  Trạng thái hiện tại
                </th>

                <th className="px-5 py-3">
                  Doanh nghiệp
                </th>

                <th className="px-5 py-3">
                  Thời gian OJT
                </th>

                <th className="px-5 py-3 text-right">
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
                    <p className="font-semibold text-slate-800">
                      {student.fullName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-orange-600">
                      {student.studentCode}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {student.cohort} ·{" "}
                      {student.studentClass}
                    </p>
                  </td>

                  {/* SEMESTER */}

                  <td className="px-5 py-4 font-semibold text-slate-700">
                    Kỳ {student.currentSemester}
                  </td>

                  {/* ELIGIBILITY */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        ELIGIBILITY_STYLE[
                          student.eligibilityStatus
                        ]
                      }`}
                    >
                      {student.eligibilityStatus}
                    </span>
                  </td>

                  {/* PROGRESS */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        PROGRESS_STYLE[
                          student.progressStatus
                        ]
                      }`}
                    >
                      {student.progressStatus}
                    </span>

                    {student.delayTerms > 0 && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        Trễ {student.delayTerms} kỳ
                      </p>
                    )}
                  </td>

                  {/* OJT TERM */}

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">
                      {student.ojtTerm}
                    </p>

                    {student.delayTerms > 0 && (
                      <p className="mt-1 text-xs text-red-500">
                        Kế hoạch:{" "}
                        {student.plannedOjtTerm}
                      </p>
                    )}
                  </td>

                  {/* APPLICATION */}

                  <td className="px-5 py-4 text-slate-600">
                    {student.applicationStatus}
                  </td>

                  {/* CURRENT STATUS */}

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        OJT_STATUS_STYLE[
                          student.ojtStatus
                        ]
                      }`}
                    >
                      {student.ojtStatus}
                    </span>
                  </td>

                  {/* COMPANY */}

                  <td className="px-5 py-4">
                    {student.company ? (
                      <>
                        <p className="font-semibold text-slate-700">
                          {student.company}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.position}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        —
                      </span>
                    )}
                  </td>

                  {/* OJT DATES */}

                  <td className="px-5 py-4">
                    {student.startDate ? (
                      <>
                        <p className="font-medium text-slate-700">
                          {student.startDate}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          đến{" "}
                          {student.endDate ||
                            "Chưa xác định"}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Chưa xác định
                      </span>
                    )}
                  </td>

                  {/* DETAIL */}

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStudent(student)
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-orange-600 transition hover:bg-orange-50"
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
    </div>
  );
};

export default EducationStudentStatus;