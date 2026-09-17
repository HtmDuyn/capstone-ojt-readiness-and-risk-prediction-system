import React from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Search,
  School,
  Users,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type ClassSource = "AI" | "Thủ công";

type ClassStatus =
  | "Đang mở đăng ký"
  | "Đã đóng đăng ký";

type RegistrationStatus =
  | "Đã đăng ký"
  | "Đã hủy";

interface RegisteredStudent {
  id: string;

  studentCode: string;
  fullName: string;

  cohort: string;
  studentClass: string;

  email: string;

  registeredAt: string;

  registrationStatus: RegistrationStatus;

  wasAiSuggested: boolean;
}

interface SupportClass {
  id: string;

  classCode: string;

  courseCode: string;
  courseName: string;

  source: ClassSource;

  startDate: string;
  endDate: string;

  schedule: string;
  location: string;

  maxStudents: number;

  status: ClassStatus;

  registeredStudents: RegisteredStudent[];
}

/* =========================================================
   MOCK DATA

   Đây là dữ liệu sinh viên ĐÃ ĐĂNG KÝ lớp.

   Không phải danh sách AI đề xuất.

   wasAiSuggested chỉ dùng để biết sinh viên đăng ký này
   có nằm trong nhóm AI từng đề xuất hay không.

   Sau này backend:
   GET /education/support-classes
   GET /education/support-classes/{id}/registrations
   ========================================================= */

const SUPPORT_CLASSES: SupportClass[] = [
  {
    id: "class-swd392",

    classCode: "SUP-SWD392-01",

    courseCode: "SWD392",

    courseName:
      "Software Architecture and Design",

    source: "AI",

    startDate: "05/10/2026",
    endDate: "30/10/2026",

    schedule:
      "Thứ 3, Thứ 5 - 18:00 đến 20:00",

    location: "Phòng AL-302",

    maxStudents: 30,

    status: "Đang mở đăng ký",

    registeredStudents: [
      {
        id: "registration-001",

        studentCode: "SE181666",
        fullName: "Nguyễn Khánh Ly",

        cohort: "K18",
        studentClass: "K18D-19A",

        email:
          "lyngkse181666@fpt.edu.vn",

        registeredAt:
          "29/09/2026 08:42",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: true,
      },

      {
        id: "registration-002",

        studentCode: "SE181402",
        fullName: "Đặng Hoàng Nam",

        cohort: "K18",
        studentClass: "K18D-19B",

        email:
          "namdhse181402@fpt.edu.vn",

        registeredAt:
          "29/09/2026 10:15",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: true,
      },

      {
        id: "registration-003",

        studentCode: "SE182521",
        fullName: "Lê Minh Nhật",

        cohort: "K18",
        studentClass: "K18D-19A",

        email:
          "nhatlmse182521@fpt.edu.vn",

        registeredAt:
          "30/09/2026 09:20",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: false,
      },

      {
        id: "registration-004",

        studentCode: "SE182104",
        fullName: "Trần Gia Minh",

        cohort: "K18",
        studentClass: "K18D-19B",

        email:
          "minhtgse182104@fpt.edu.vn",

        registeredAt:
          "30/09/2026 13:35",

        registrationStatus:
          "Đã hủy",

        wasAiSuggested: true,
      },
    ],
  },

  {
    id: "class-dbi202",

    classCode: "SUP-DBI202-01",

    courseCode: "DBI202",

    courseName:
      "Introduction to Databases",

    source: "Thủ công",

    startDate: "12/10/2026",
    endDate: "06/11/2026",

    schedule:
      "Thứ 2, Thứ 4 - 18:00 đến 20:00",

    location: "Phòng BE-204",

    maxStudents: 30,

    status: "Đang mở đăng ký",

    registeredStudents: [
      {
        id: "registration-005",

        studentCode: "SE194728",
        fullName: "Lê Quốc Bảo",

        cohort: "K19",
        studentClass: "K19D-20A",

        email:
          "baolqse194728@fpt.edu.vn",

        registeredAt:
          "01/10/2026 08:20",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: false,
      },

      {
        id: "registration-006",

        studentCode: "SE193842",
        fullName: "Võ Ngọc Mai",

        cohort: "K19",
        studentClass: "K19D-20B",

        email:
          "maivnse193842@fpt.edu.vn",

        registeredAt:
          "01/10/2026 09:45",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: false,
      },
    ],
  },

  {
    id: "class-prn231",

    classCode: "SUP-PRN231-01",

    courseCode: "PRN231",

    courseName:
      "Building Cross-Platform Back-End Application With .NET",

    source: "AI",

    startDate: "15/09/2026",
    endDate: "10/10/2026",

    schedule:
      "Thứ 3, Thứ 6 - 18:00 đến 20:00",

    location: "Phòng AL-401",

    maxStudents: 25,

    status: "Đã đóng đăng ký",

    registeredStudents: [
      {
        id: "registration-007",

        studentCode: "SE182301",
        fullName: "Nguyễn Quốc Anh",

        cohort: "K18",
        studentClass: "K18D-19A",

        email: "anhnqse182301@fpt.edu.vn",

        registeredAt:
          "05/09/2026 14:20",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: true,
      },

      {
        id: "registration-008",

        studentCode: "SE182411",
        fullName: "Trần Minh Đức",

        cohort: "K18",
        studentClass: "K18D-19B",

        email:
          "ductmse182411@fpt.edu.vn",

        registeredAt:
          "06/09/2026 09:10",

        registrationStatus:
          "Đã đăng ký",

        wasAiSuggested: true,
      },
    ],
  },
];

/* =========================================================
   STYLES
   ========================================================= */

const CLASS_STATUS_STYLE: Record<
  ClassStatus,
  string
> = {
  "Đang mở đăng ký":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đã đóng đăng ký":
    "border-slate-200 bg-slate-50 text-slate-600",
};

const REGISTRATION_STATUS_STYLE: Record<
  RegistrationStatus,
  string
> = {
  "Đã đăng ký":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đã hủy":
    "border-slate-200 bg-slate-50 text-slate-500",
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationClassStudents: React.FC =
  () => {
    const [
      selectedClass,
      setSelectedClass,
    ] =
      React.useState<SupportClass | null>(
        null,
      );

    const [search, setSearch] =
      React.useState("");

    const [cohortFilter, setCohortFilter] =
      React.useState("ALL");

    const [
      registrationStatusFilter,
      setRegistrationStatusFilter,
    ] = React.useState("ALL");

    /* =====================================================
       DETAIL PAGE DATA
       ===================================================== */

    const filteredStudents =
      React.useMemo(() => {
        if (!selectedClass) {
          return [];
        }

        const keyword =
          search.trim().toLowerCase();

        return selectedClass.registeredStudents.filter(
          (student) => {
            const matchSearch =
              !keyword ||
              student.studentCode
                .toLowerCase()
                .includes(keyword) ||
              student.fullName
                .toLowerCase()
                .includes(keyword);

            const matchCohort =
              cohortFilter === "ALL" ||
              student.cohort ===
                cohortFilter;

            const matchStatus =
              registrationStatusFilter ===
                "ALL" ||
              student.registrationStatus ===
                registrationStatusFilter;

            return (
              matchSearch &&
              matchCohort &&
              matchStatus
            );
          },
        );
      }, [
        selectedClass,
        search,
        cohortFilter,
        registrationStatusFilter,
      ]);

    const activeRegisteredCount =
      selectedClass
        ? selectedClass.registeredStudents.filter(
            (student) =>
              student.registrationStatus ===
              "Đã đăng ký",
          ).length
        : 0;

    const cancelledCount =
      selectedClass
        ? selectedClass.registeredStudents.filter(
            (student) =>
              student.registrationStatus ===
              "Đã hủy",
          ).length
        : 0;

    const aiSuggestedRegisteredCount =
      selectedClass
        ? selectedClass.registeredStudents.filter(
            (student) =>
              student.registrationStatus ===
                "Đã đăng ký" &&
              student.wasAiSuggested,
          ).length
        : 0;

    /* =====================================================
       OPEN CLASS DETAIL
       ===================================================== */

    const openClass = (
      supportClass: SupportClass,
    ) => {
      setSelectedClass(supportClass);

      setSearch("");

      setCohortFilter("ALL");

      setRegistrationStatusFilter(
        "ALL",
      );
    };

    /* =====================================================
       DETAIL PAGE
       ===================================================== */

    if (selectedClass) {
      const fillPercent =
        selectedClass.maxStudents > 0
          ? Math.min(
              100,
              Math.round(
                (activeRegisteredCount /
                  selectedClass.maxStudents) *
                  100,
              ),
            )
          : 0;

      const cohorts = Array.from(
        new Set(
          selectedClass.registeredStudents.map(
            (student) =>
              student.cohort,
          ),
        ),
      );

      return (
        <div className="space-y-6">
          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              setSelectedClass(null)
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
          >
            <ArrowLeft size={18} />

            Quay lại danh sách lớp
          </button>

          <PageBanner
            title="Danh sách Sinh viên Đăng ký Lớp"
            description="Theo dõi danh sách sinh viên đã thực hiện đăng ký lớp học hỗ trợ."
            badge="Quản lý lớp hỗ trợ"
          />

          {/* =============================================
              CLASS HEADER
              ============================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="flex gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                    selectedClass.source ===
                    "AI"
                      ? "bg-violet-50 text-violet-600"
                      : "bg-orange-50 text-orange-500"
                  }`}
                >
                  {selectedClass.source ===
                  "AI" ? (
                    <BrainCircuit
                      size={27}
                    />
                  ) : (
                    <School size={27} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800">
                      {
                        selectedClass.classCode
                      }
                    </h2>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        CLASS_STATUS_STYLE[
                          selectedClass
                            .status
                        ]
                      }`}
                    >
                      {
                        selectedClass.status
                      }
                    </span>

                    {selectedClass.source ===
                      "AI" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        <BrainCircuit
                          size={12}
                        />

                        Từ AI
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-bold text-orange-600">
                    {
                      selectedClass.courseCode
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedClass.courseName
                    }
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sĩ số hiện tại
                </p>

                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-black text-slate-800">
                    {
                      activeRegisteredCount
                    }
                  </span>

                  <span className="mb-1 text-sm font-semibold text-slate-400">
                    /{" "}
                    {
                      selectedClass.maxStudents
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* FILL BAR */}

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  Mức đăng ký
                </span>

                <span className="font-bold text-slate-700">
                  {fillPercent}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{
                    width: `${fillPercent}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {/* =============================================
              CLASS INFO
              ============================================= */}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CalendarDays
                  size={15}
                />

                Thời gian lớp
              </div>

              <p className="mt-3 text-sm font-bold text-slate-700">
                {
                  selectedClass.startDate
                }{" "}
                -{" "}
                {
                  selectedClass.endDate
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Clock3 size={15} />

                Lịch học
              </div>

              <p className="mt-3 text-sm font-bold text-slate-700">
                {
                  selectedClass.schedule
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle2
                  size={15}
                />

                Đang đăng ký
              </div>

              <p className="mt-3 text-2xl font-black text-emerald-600">
                {
                  activeRegisteredCount
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Users size={15} />

                Đã hủy
              </div>

              <p className="mt-3 text-2xl font-black text-slate-500">
                {cancelledCount}
              </p>
            </div>
          </section>

          {/* =============================================
              IMPORTANT AI NOTE
              ============================================= */}

          {selectedClass.source ===
            "AI" && (
            <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <div className="flex gap-3">
                <BrainCircuit
                  size={20}
                  className="mt-0.5 shrink-0 text-violet-600"
                />

                <div>
                  <h3 className="font-bold text-violet-800">
                    Đề xuất AI và đăng
                    ký lớp là hai dữ
                    liệu khác nhau
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-violet-700">
                    Danh sách bên dưới
                    chỉ gồm sinh viên
                    đã thực hiện đăng
                    ký lớp. Trong đó có{" "}
                    <strong>
                      {
                        aiSuggestedRegisteredCount
                      }{" "}
                      sinh viên
                    </strong>{" "}
                    từng nằm trong nhóm
                    được AI đề xuất.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* =============================================
              FILTER
              ============================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_190px]">
              {/* SEARCH */}

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Tìm MSSV hoặc tên sinh viên..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400"
                />
              </div>

              {/* COHORT */}

              <select
                value={cohortFilter}
                onChange={(event) =>
                  setCohortFilter(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-orange-400"
              >
                <option value="ALL">
                  Tất cả khóa
                </option>

                {cohorts.map(
                  (cohort) => (
                    <option
                      key={cohort}
                      value={cohort}
                    >
                      {cohort}
                    </option>
                  ),
                )}
              </select>

              {/* STATUS */}

              <select
                value={
                  registrationStatusFilter
                }
                onChange={(event) =>
                  setRegistrationStatusFilter(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-orange-400"
              >
                <option value="ALL">
                  Tất cả trạng thái
                </option>

                <option value="Đã đăng ký">
                  Đã đăng ký
                </option>

                <option value="Đã hủy">
                  Đã hủy
                </option>
              </select>
            </div>
          </section>

          {/* =============================================
              STUDENT LIST
              ============================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-slate-800">
                  Sinh viên đăng ký
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Hiển thị{" "}
                  {
                    filteredStudents.length
                  }{" "}
                  bản ghi.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={17} />

                {
                  activeRegisteredCount
                }{" "}
                /{" "}
                {
                  selectedClass.maxStudents
                }{" "}
                sinh viên
              </div>
            </div>

            {filteredStudents.length ===
            0 ? (
              <div className="p-12 text-center">
                <GraduationCap
                  size={34}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-semibold text-slate-600">
                  Không tìm thấy sinh
                  viên phù hợp.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-4">
                        Sinh viên
                      </th>

                      <th className="px-5 py-4">
                        Khóa / Lớp
                      </th>

                      <th className="px-5 py-4">
                        Email
                      </th>

                      <th className="px-5 py-4">
                        Thời gian đăng ký
                      </th>

                      {selectedClass.source ===
                        "AI" && (
                        <th className="px-5 py-4">
                          Nguồn AI
                        </th>
                      )}

                      <th className="px-5 py-4">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(
                      (student) => (
                        <tr
                          key={
                            student.id
                          }
                          className="transition hover:bg-slate-50/70"
                        >
                          {/* STUDENT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                <GraduationCap
                                  size={
                                    19
                                  }
                                />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    student.fullName
                                  }
                                </p>

                                <p className="mt-1 text-xs font-semibold text-orange-600">
                                  {
                                    student.studentCode
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* COHORT */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                student.cohort
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                student.studentClass
                              }
                            </p>
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              student.email
                            }
                          </td>

                          {/* TIME */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock3
                                size={15}
                                className="text-slate-400"
                              />

                              {
                                student.registeredAt
                              }
                            </div>
                          </td>

                          {/* AI */}

                          {selectedClass.source ===
                            "AI" && (
                            <td className="px-5 py-4">
                              {student.wasAiSuggested ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                  <BrainCircuit
                                    size={
                                      13
                                    }
                                  />

                                  Có trong đề
                                  xuất
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400">
                                  Tự đăng ký
                                </span>
                              )}
                            </td>
                          )}

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                REGISTRATION_STATUS_STYLE[
                                  student
                                    .registrationStatus
                                ]
                              }`}
                            >
                              {
                                student.registrationStatus
                              }
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      );
    }

    /* =====================================================
       MAIN PAGE
       ===================================================== */

    return (
      <div className="space-y-6">
        <PageBanner
          title="Danh sách Sinh viên Đăng ký Lớp"
          description="Theo dõi danh sách sinh viên đã đăng ký các lớp học hỗ trợ."
          badge="Quản lý lớp hỗ trợ"
        />

        {/* ===============================================
            EXPLANATION
            =============================================== */}

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Users
              size={21}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>
              <h2 className="font-bold text-blue-800">
                Theo dõi đăng ký lớp hỗ
                trợ
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Chọn một lớp để xem
                danh sách sinh viên đã
                thực hiện đăng ký. Với
                lớp được tạo từ đề xuất
                AI, hệ thống vẫn phân
                biệt sinh viên{" "}
                <strong>
                  được AI đề xuất
                </strong>{" "}
                và sinh viên{" "}
                <strong>
                  thực sự đăng ký
                </strong>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ===============================================
            SUMMARY
            =============================================== */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Lớp hỗ trợ
                </p>

                <p className="mt-2 text-3xl font-black text-slate-800">
                  {
                    SUPPORT_CLASSES.length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <School size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Đang mở đăng ký
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {
                    SUPPORT_CLASSES.filter(
                      (supportClass) =>
                        supportClass.status ===
                        "Đang mở đăng ký",
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2
                  size={21}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Tổng lượt đăng ký
                </p>

                <p className="mt-2 text-3xl font-black text-violet-600">
                  {SUPPORT_CLASSES.reduce(
                    (
                      total,
                      supportClass,
                    ) =>
                      total +
                      supportClass.registeredStudents.filter(
                        (student) =>
                          student.registrationStatus ===
                          "Đã đăng ký",
                      ).length,
                    0,
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Users size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* ===============================================
            CLASS LIST
            =============================================== */}

        <section>
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">
              Lớp học hỗ trợ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chọn lớp để xem danh sách
              sinh viên đăng ký.
            </p>
          </div>

          <div className="space-y-3">
            {SUPPORT_CLASSES.map(
              (supportClass) => {
                const registeredCount =
                  supportClass.registeredStudents.filter(
                    (student) =>
                      student.registrationStatus ===
                      "Đã đăng ký",
                  ).length;

                const percent =
                  Math.min(
                    100,
                    Math.round(
                      (registeredCount /
                        supportClass.maxStudents) *
                        100,
                    ),
                  );

                return (
                  <button
                    key={
                      supportClass.id
                    }
                    type="button"
                    onClick={() =>
                      openClass(
                        supportClass,
                      )
                    }
                    className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                      {/* LEFT */}

                      <div className="flex min-w-0 gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            supportClass.source ===
                            "AI"
                              ? "bg-violet-50 text-violet-600"
                              : "bg-orange-50 text-orange-500"
                          }`}
                        >
                          {supportClass.source ===
                          "AI" ? (
                            <BrainCircuit
                              size={22}
                            />
                          ) : (
                            <School
                              size={22}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-800">
                              {
                                supportClass.classCode
                              }
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                CLASS_STATUS_STYLE[
                                  supportClass
                                    .status
                                ]
                              }`}
                            >
                              {
                                supportClass.status
                              }
                            </span>

                            {supportClass.source ===
                              "AI" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                <BrainCircuit
                                  size={
                                    12
                                  }
                                />

                                Từ AI
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm">
                            <span className="font-bold text-orange-600">
                              {
                                supportClass.courseCode
                              }
                            </span>

                            <span className="text-slate-400">
                              {" "}
                              ·{" "}
                              {
                                supportClass.courseName
                              }
                            </span>
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays
                                size={
                                  14
                                }
                              />

                              {
                                supportClass.startDate
                              }{" "}
                              -{" "}
                              {
                                supportClass.endDate
                              }
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <School
                                size={
                                  14
                                }
                              />

                              {
                                supportClass.location
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}

                      <div className="w-full lg:w-[280px]">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-slate-400">
                              Sinh viên
                              đăng ký
                            </p>

                            <p className="mt-1 text-lg font-black text-slate-800">
                              {
                                registeredCount
                              }

                              <span className="text-sm font-semibold text-slate-400">
                                {" "}
                                /{" "}
                                {
                                  supportClass.maxStudents
                                }
                              </span>
                            </p>
                          </div>

                          <span className="text-sm font-bold text-orange-600">
                            {percent}%
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-right text-xs font-semibold text-orange-600 transition group-hover:text-orange-700">
                          Xem danh sách →
                        </p>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </section>
      </div>
    );
  };

export default EducationClassStudents;