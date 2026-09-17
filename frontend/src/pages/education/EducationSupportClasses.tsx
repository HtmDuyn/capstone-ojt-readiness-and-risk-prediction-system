import React from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Plus,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type CreateMode = "AI" | "MANUAL";

type ClassStatus =
  | "Đã tạo"
  | "Đang mở đăng ký"
  | "Đã đóng đăng ký";

interface ProposedStudent {
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  riskScore: number;
}

interface AcceptedAiProposal {
  id: string;

  courseCode: string;
  courseName: string;

  priority: "Cao" | "Trung bình";

  reason: string;

  students: ProposedStudent[];
}

interface SupportClass {
  id: string;

  classCode: string;

  courseCode: string;
  courseName: string;

  source: "AI" | "Thủ công";

  sourceProposalId?: string;

  startDate: string;
  endDate: string;

  schedule: string;
  location: string;

  maxStudents: number;

  suggestedStudents: ProposedStudent[];

  status: ClassStatus;

  createdAt: string;
}

interface CreateClassForm {
  classCode: string;

  courseCode: string;
  courseName: string;

  startDate: string;
  endDate: string;

  schedule: string;
  location: string;

  maxStudents: string;
}

/* =========================================================
   MOCK - ĐỀ XUẤT AI ĐÃ ĐƯỢC PĐT CHẤP NHẬN

   Sau này dữ liệu này sẽ lấy từ backend.

   Chỉ proposal:
   status = ACCEPTED

   mới được phép xuất hiện ở màn tạo lớp.
   ========================================================= */

const ACCEPTED_AI_PROPOSALS: AcceptedAiProposal[] = [
  {
    id: "proposal-prn231",

    courseCode: "PRN231",

    courseName:
      "Building Cross-Platform Back-End Application With .NET",

    priority: "Trung bình",

    reason:
      "AI phát hiện nhóm sinh viên cần hỗ trợ PRN231 để hạn chế ảnh hưởng đến tiến độ học tập.",

    students: [
      {
        studentCode: "SE182301",
        fullName: "Nguyễn Quốc Anh",
        cohort: "K18",
        studentClass: "K18D-19A",
        riskScore: 62,
      },
      {
        studentCode: "SE182411",
        fullName: "Trần Minh Đức",
        cohort: "K18",
        studentClass: "K18D-19B",
        riskScore: 58,
      },
    ],
  },

  {
    id: "proposal-swd392",

    courseCode: "SWD392",

    courseName: "Software Architecture and Design",

    priority: "Cao",

    reason:
      "AI phát hiện nhóm sinh viên có vấn đề liên quan đến SWD392 và có nguy cơ ảnh hưởng đến tiến độ học tập trước OJT.",

    students: [
      {
        studentCode: "SE181666",
        fullName: "Nguyễn Khánh Ly",
        cohort: "K18",
        studentClass: "K18D-19A",
        riskScore: 86,
      },
      {
        studentCode: "SE181402",
        fullName: "Đặng Hoàng Nam",
        cohort: "K18",
        studentClass: "K18D-19B",
        riskScore: 81,
      },
      {
        studentCode: "SE181934",
        fullName: "Phan Minh Hoàng",
        cohort: "K18",
        studentClass: "K18D-19A",
        riskScore: 78,
      },
      {
        studentCode: "SE182104",
        fullName: "Trần Gia Minh",
        cohort: "K18",
        studentClass: "K18D-19B",
        riskScore: 74,
      },
    ],
  },
];

/* =========================================================
   MOCK COURSES
   Dùng khi PĐT tạo lớp thủ công.
   ========================================================= */

const COURSES = [
  {
    code: "DBI202",
    name: "Introduction to Databases",
  },
  {
    code: "PRN231",
    name:
      "Building Cross-Platform Back-End Application With .NET",
  },
  {
    code: "SWD392",
    name: "Software Architecture and Design",
  },
];

/* =========================================================
   MOCK SUPPORT CLASSES
   ========================================================= */

const INITIAL_CLASSES: SupportClass[] = [
  {
    id: "class-001",

    classCode: "SUP-DBI202-01",

    courseCode: "DBI202",
    courseName: "Introduction to Databases",

    source: "Thủ công",

    startDate: "05/10/2026",
    endDate: "30/10/2026",

    schedule: "Thứ 3, Thứ 5 - 18:00 đến 20:00",

    location: "Phòng AL-302",

    maxStudents: 30,

    suggestedStudents: [],

    status: "Đã tạo",

    createdAt: "20/09/2026",
  },
];

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_FORM: CreateClassForm = {
  classCode: "",

  courseCode: "",
  courseName: "",

  startDate: "",
  endDate: "",

  schedule: "",
  location: "",

  maxStudents: "30",
};

const STATUS_STYLE: Record<ClassStatus, string> = {
  "Đã tạo":
    "border-blue-200 bg-blue-50 text-blue-700",

  "Đang mở đăng ký":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đã đóng đăng ký":
    "border-slate-200 bg-slate-50 text-slate-500",
};

/* =========================================================
   HELPERS
   ========================================================= */

const formatDate = (value: string) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationSupportClasses: React.FC = () => {
  /* =======================================================
     STATES
     ======================================================= */

  const [classes, setClasses] =
    React.useState<SupportClass[]>(
      INITIAL_CLASSES,
    );

  const [showCreateModal, setShowCreateModal] =
    React.useState(false);

  const [createMode, setCreateMode] =
    React.useState<CreateMode>("AI");

  const [
    selectedProposal,
    setSelectedProposal,
  ] =
    React.useState<AcceptedAiProposal | null>(
      null,
    );

  const [form, setForm] =
    React.useState<CreateClassForm>(
      EMPTY_FORM,
    );

  const [selectedClass, setSelectedClass] =
    React.useState<SupportClass | null>(
      null,
    );

  /* =======================================================
     AI PROPOSALS AVAILABLE

     Proposal nào đã dùng tạo lớp rồi
     thì không xuất hiện lại.
     ======================================================= */

  const availableAiProposals =
    ACCEPTED_AI_PROPOSALS.filter(
      (proposal) =>
        !classes.some(
          (supportClass) =>
            supportClass.sourceProposalId ===
            proposal.id,
        ),
    );

  /* =======================================================
     UPDATE FORM
     ======================================================= */

  const updateForm = (
    field: keyof CreateClassForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =======================================================
     RESET
     ======================================================= */

  const resetCreateForm = () => {
    setSelectedProposal(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  /* =======================================================
     OPEN CREATE FROM AI
     ======================================================= */

  const openAiCreateModal = () => {
    resetCreateForm();

    setCreateMode("AI");

    setShowCreateModal(true);
  };

  /* =======================================================
     OPEN MANUAL CREATE
     ======================================================= */

  const openManualCreateModal = () => {
    resetCreateForm();

    setCreateMode("MANUAL");

    setShowCreateModal(true);
  };

  /* =======================================================
     CLOSE MODAL
     ======================================================= */

  const closeCreateModal = () => {
    setShowCreateModal(false);

    resetCreateForm();
  };

  /* =======================================================
     CHANGE MODE
     ======================================================= */

  const changeMode = (
    mode: CreateMode,
  ) => {
    setCreateMode(mode);

    resetCreateForm();
  };

  /* =======================================================
     SELECT AI PROPOSAL

     Tự động lấy:
     - course
     - gợi ý class code
     - nhóm sinh viên
     ======================================================= */

  const chooseAiProposal = (
    proposal: AcceptedAiProposal,
  ) => {
    setSelectedProposal(proposal);

    setForm({
      classCode: `SUP-${proposal.courseCode}-01`,

      courseCode: proposal.courseCode,

      courseName: proposal.courseName,

      startDate: "",

      endDate: "",

      schedule: "",

      location: "",

      maxStudents: Math.max(
        proposal.students.length,
        20,
      ).toString(),
    });
  };

  /* =======================================================
     MANUAL COURSE
     ======================================================= */

  const chooseManualCourse = (
    courseCode: string,
  ) => {
    const course = COURSES.find(
      (item) => item.code === courseCode,
    );

    setForm((current) => ({
      ...current,

      courseCode,

      courseName: course?.name ?? "",

      classCode: course
        ? `SUP-${course.code}-01`
        : "",
    }));
  };

  /* =======================================================
     CREATE CLASS
     ======================================================= */

  const createClass = () => {
    if (
      createMode === "AI" &&
      !selectedProposal
    ) {
      window.alert(
        "Vui lòng chọn đề xuất AI đã được chấp nhận.",
      );

      return;
    }

    if (!form.courseCode) {
      window.alert(
        "Vui lòng chọn học phần.",
      );

      return;
    }

    if (!form.classCode.trim()) {
      window.alert(
        "Vui lòng nhập mã lớp.",
      );

      return;
    }

    if (!form.startDate) {
      window.alert(
        "Vui lòng chọn ngày bắt đầu.",
      );

      return;
    }

    if (!form.endDate) {
      window.alert(
        "Vui lòng chọn ngày kết thúc.",
      );

      return;
    }

    if (!form.schedule.trim()) {
      window.alert(
        "Vui lòng nhập lịch học.",
      );

      return;
    }

    if (!form.location.trim()) {
      window.alert(
        "Vui lòng nhập địa điểm.",
      );

      return;
    }

    const maxStudents =
      Number(form.maxStudents);

    if (
      !Number.isFinite(maxStudents) ||
      maxStudents <= 0
    ) {
      window.alert(
        "Sĩ số tối đa phải lớn hơn 0.",
      );

      return;
    }

    const duplicatedClassCode =
      classes.some(
        (supportClass) =>
          supportClass.classCode
            .trim()
            .toLowerCase() ===
          form.classCode
            .trim()
            .toLowerCase(),
      );

    if (duplicatedClassCode) {
      window.alert(
        "Mã lớp đã tồn tại.",
      );

      return;
    }

    const newClass: SupportClass = {
      id: `class-${Date.now()}`,

      classCode:
        form.classCode.trim(),

      courseCode:
        form.courseCode,

      courseName:
        form.courseName,

      source:
        createMode === "AI"
          ? "AI"
          : "Thủ công",

      sourceProposalId:
        createMode === "AI"
          ? selectedProposal?.id
          : undefined,

      startDate:
        formatDate(form.startDate),

      endDate:
        formatDate(form.endDate),

      schedule:
        form.schedule.trim(),

      location:
        form.location.trim(),

      maxStudents,

      suggestedStudents:
        createMode === "AI"
          ? selectedProposal?.students ?? []
          : [],

      status: "Đã tạo",

      createdAt:
        new Date().toLocaleDateString(
          "vi-VN",
        ),
    };

    setClasses((current) => [
      newClass,
      ...current,
    ]);

    closeCreateModal();
  };

  /* =======================================================
     CLASS DETAIL
     ======================================================= */

  if (selectedClass) {
    return (
      <div className="space-y-6">
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
          title="Chi tiết Lớp học Hỗ trợ"
          description="Xem thông tin lớp hỗ trợ đã được Phòng Đào tạo tạo."
          badge="Quản lý lớp hỗ trợ"
        />

        {/* CLASS HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <School size={27} />
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
                      STATUS_STYLE[
                        selectedClass.status
                      ]
                    }`}
                  >
                    {
                      selectedClass.status
                    }
                  </span>
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

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                selectedClass.source ===
                "AI"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {selectedClass.source ===
                "AI" && (
                <BrainCircuit
                  size={14}
                />
              )}

              {selectedClass.source ===
              "AI"
                ? "Tạo từ đề xuất AI"
                : "Tạo thủ công"}
            </span>
          </div>
        </section>

        {/* CLASS INFO */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays
                size={19}
                className="text-orange-500"
              />

              <h3 className="font-bold text-slate-800">
                Thời gian
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-400">
                  Ngày bắt đầu
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.startDate
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Ngày kết thúc
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.endDate
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Lịch học
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.schedule
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <School
                size={19}
                className="text-orange-500"
              />

              <h3 className="font-bold text-slate-800">
                Thông tin lớp
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-400">
                  Địa điểm
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.location
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Sĩ số tối đa
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.maxStudents
                  }{" "}
                  sinh viên
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Ngày tạo
                </p>

                <p className="mt-1 font-semibold text-slate-700">
                  {
                    selectedClass.createdAt
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI SOURCE */}

        {selectedClass.source ===
          "AI" && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <div className="flex gap-3">
              <BrainCircuit
                size={21}
                className="mt-0.5 shrink-0 text-violet-600"
              />

              <div>
                <h3 className="font-bold text-violet-800">
                  Lớp được tạo từ đề
                  xuất AI
                </h3>

                <p className="mt-2 text-sm leading-6 text-violet-700">
                  Nhóm sinh viên bên
                  dưới được lấy từ đề
                  xuất AI đã được PĐT
                  chấp nhận. Đây chưa
                  phải danh sách sinh
                  viên đã đăng ký lớp.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* AI STUDENTS */}

        {selectedClass
          .suggestedStudents.length >
          0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <Users
                  size={20}
                  className="text-orange-500"
                />

                <div>
                  <h3 className="font-bold text-slate-800">
                    Sinh viên từ đề
                    xuất AI
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedClass
                        .suggestedStudents
                        .length
                    }{" "}
                    sinh viên được AI
                    xác định có nhu cầu
                    hỗ trợ.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedClass.suggestedStudents.map(
                (student) => (
                  <div
                    key={
                      student.studentCode
                    }
                    className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        <GraduationCap
                          size={19}
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {
                            student.fullName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          <span className="font-semibold text-orange-600">
                            {
                              student.studentCode
                            }
                          </span>

                          {" · "}
                          {student.cohort}

                          {" · "}
                          {
                            student.studentClass
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Risk
                      </p>

                      <p
                        className={`mt-1 font-bold ${
                          student.riskScore >=
                          70
                            ? "text-red-600"
                            : student.riskScore >=
                                40
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {
                          student.riskScore
                        }
                        %
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Tạo Lớp học Hỗ trợ"
        description="Tạo lớp học hỗ trợ từ đề xuất AI đã được chấp nhận hoặc tạo trực tiếp bởi Phòng Đào tạo."
        badge="Quản lý lớp hỗ trợ"
      />

      {/* ===================================================
          CREATE OPTIONS
          =================================================== */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* AI */}

        <button
          type="button"
          onClick={openAiCreateModal}
          className="group rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <BrainCircuit
                  size={24}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800">
                    Tạo lớp từ đề xuất AI
                  </h2>

                  <Sparkles
                    size={16}
                    className="text-violet-500"
                  />
                </div>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Chọn đề xuất AI đã
                  được PĐT chấp nhận.
                  Hệ thống lấy sẵn học
                  phần và nhóm sinh
                  viên được đề xuất.
                </p>

                <p className="mt-4 text-sm font-semibold text-violet-700">
                  {
                    availableAiProposals.length
                  }{" "}
                  đề xuất có thể tạo
                  lớp
                </p>
              </div>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm transition group-hover:bg-violet-600 group-hover:text-white">
              <Plus size={18} />
            </div>
          </div>
        </button>

        {/* MANUAL */}

        <button
          type="button"
          onClick={
            openManualCreateModal
          }
          className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <School size={24} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Tạo lớp thủ công
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  PĐT tự chọn học phần
                  và cấu hình thông tin
                  lớp khi không sử dụng
                  đề xuất AI.
                </p>
              </div>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-orange-500 group-hover:text-white">
              <Plus size={18} />
            </div>
          </div>
        </button>
      </section>

      {/* ===================================================
          CREATED CLASSES
          =================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="font-bold text-slate-800">
            Lớp hỗ trợ đã tạo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {classes.length} lớp hỗ trợ
            hiện có.
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <School
              size={34}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-600">
              Chưa có lớp hỗ trợ.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(
              (supportClass) => (
                <article
                  key={
                    supportClass.id
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="flex gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          supportClass.source ===
                          "AI"
                            ? "bg-violet-50 text-violet-600"
                            : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {supportClass.source ===
                        "AI" ? (
                          <BrainCircuit
                            size={21}
                          />
                        ) : (
                          <School
                            size={21}
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-800">
                            {
                              supportClass.classCode
                            }
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLE[
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
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <p className="text-xs text-slate-400">
                          Thời gian
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            supportClass.startDate
                          }{" "}
                          -{" "}
                          {
                            supportClass.endDate
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Sĩ số tối đa
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            supportClass.maxStudents
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedClass(
                            supportClass,
                          )
                        }
                        className="text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      {/* ===================================================
          CREATE MODAL

          CẤU TRÚC:
          MODAL
            HEADER        - không scroll
            BODY          - scroll
            FOOTER        - không scroll
          =================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">

          {/* MODAL CONTAINER */}

          <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* =============================================
                HEADER
                ============================================= */}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  {createMode ===
                  "AI" ? (
                    <BrainCircuit
                      size={22}
                      className="text-violet-600"
                    />
                  ) : (
                    <School
                      size={22}
                      className="text-orange-500"
                    />
                  )}

                  <h2 className="text-xl font-black text-slate-800">
                    {createMode ===
                    "AI"
                      ? "Tạo lớp từ đề xuất AI"
                      : "Tạo lớp thủ công"}
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {createMode ===
                  "AI"
                    ? "Chọn đề xuất đã được chấp nhận và cấu hình thông tin lớp."
                    : "Chọn học phần và cấu hình thông tin lớp hỗ trợ."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* =============================================
                BODY
                CHỈ PHẦN NÀY ĐƯỢC SCROLL
                ============================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 px-6 py-5">

                {/* MODE SELECTOR */}

                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      changeMode("AI")
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      createMode ===
                      "AI"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Từ đề xuất AI
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      changeMode(
                        "MANUAL",
                      )
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      createMode ===
                      "MANUAL"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Tạo thủ công
                  </button>
                </div>

                {/* =========================================
                    AI MODE
                    ========================================= */}

                {createMode ===
                  "AI" && (
                  <section>
                    <h3 className="font-bold text-slate-800">
                      1. Chọn đề xuất AI
                      đã chấp nhận
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Một đề xuất chỉ
                      được dùng để tạo
                      một lớp hỗ trợ.
                    </p>

                    {availableAiProposals.length ===
                    0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <CheckCircle2
                          size={28}
                          className="mx-auto text-emerald-500"
                        />

                        <p className="mt-3 font-semibold text-slate-700">
                          Không có đề
                          xuất AI đã
                          chấp nhận đang
                          chờ tạo lớp.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {availableAiProposals.map(
                          (
                            proposal,
                          ) => {
                            const isSelected =
                              selectedProposal?.id ===
                              proposal.id;

                            return (
                              <button
                                key={
                                  proposal.id
                                }
                                type="button"
                                onClick={() =>
                                  chooseAiProposal(
                                    proposal,
                                  )
                                }
                                className={`rounded-2xl border p-4 text-left transition ${
                                  isSelected
                                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                                    : "border-slate-200 bg-white hover:border-violet-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-black text-slate-800">
                                      {
                                        proposal.courseCode
                                      }
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {
                                        proposal.courseName
                                      }
                                    </p>
                                  </div>

                                  {isSelected && (
                                    <CheckCircle2
                                      size={
                                        19
                                      }
                                      className="shrink-0 text-violet-600"
                                    />
                                  )}
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                                    <Users
                                      size={
                                        14
                                      }
                                    />

                                    {
                                      proposal
                                        .students
                                        .length
                                    }{" "}
                                    sinh viên
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      proposal.priority ===
                                      "Cao"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-amber-50 text-amber-600"
                                    }`}
                                  >
                                    {
                                      proposal.priority
                                    }
                                  </span>
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}

                    {/* SELECTED PROPOSAL */}

                    {selectedProposal && (
                      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                        <div className="flex gap-3">
                          <BrainCircuit
                            size={20}
                            className="mt-0.5 shrink-0 text-violet-600"
                          />

                          <div>
                            <p className="font-bold text-violet-800">
                              Đề xuất AI
                              đã chọn
                            </p>

                            <p className="mt-2 text-sm leading-6 text-violet-700">
                              {
                                selectedProposal.reason
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-600">
                            Sinh viên
                            được AI đề
                            xuất
                          </p>

                          <div className="space-y-2">
                            {selectedProposal.students.map(
                              (
                                student,
                              ) => (
                                <div
                                  key={
                                    student.studentCode
                                  }
                                  className="flex flex-col justify-between gap-2 rounded-xl bg-white px-4 py-3 sm:flex-row sm:items-center"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                      {
                                        student.fullName
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {
                                        student.studentCode
                                      }

                                      {" · "}

                                      {
                                        student.cohort
                                      }

                                      {" · "}

                                      {
                                        student.studentClass
                                      }
                                    </p>
                                  </div>

                                  <span
                                    className={`text-sm font-bold ${
                                      student.riskScore >=
                                      70
                                        ? "text-red-600"
                                        : "text-amber-600"
                                    }`}
                                  >
                                    Risk{" "}
                                    {
                                      student.riskScore
                                    }
                                    %
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* =========================================
                    MANUAL MODE
                    ========================================= */}

                {createMode ===
                  "MANUAL" && (
                  <section>
                    <h3 className="font-bold text-slate-800">
                      1. Chọn học phần
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Chọn học phần mà
                      PĐT muốn mở lớp
                      hỗ trợ.
                    </p>

                    <select
                      value={
                        form.courseCode
                      }
                      onChange={(
                        event,
                      ) =>
                        chooseManualCourse(
                          event.target
                            .value,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                    >
                      <option value="">
                        Chọn học phần
                      </option>

                      {COURSES.map(
                        (course) => (
                          <option
                            key={
                              course.code
                            }
                            value={
                              course.code
                            }
                          >
                            {
                              course.code
                            }{" "}
                            -{" "}
                            {
                              course.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </section>
                )}

                {/* =========================================
                    CLASS CONFIGURATION
                    ========================================= */}

                <section>
                  <h3 className="font-bold text-slate-800">
                    2. Cấu hình lớp hỗ
                    trợ
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* CLASS CODE */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Mã lớp
                      </span>

                      <input
                        value={
                          form.classCode
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "classCode",
                            event.target
                              .value,
                          )
                        }
                        placeholder="VD: SUP-SWD392-01"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>

                    {/* COURSE */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Học phần
                      </span>

                      <input
                        value={
                          form.courseCode
                            ? `${form.courseCode} - ${form.courseName}`
                            : ""
                        }
                        readOnly
                        placeholder="Chưa chọn học phần"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                      />
                    </label>

                    {/* START */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Ngày bắt đầu
                      </span>

                      <input
                        type="date"
                        value={
                          form.startDate
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "startDate",
                            event.target
                              .value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>

                    {/* END */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Ngày kết thúc
                      </span>

                      <input
                        type="date"
                        value={
                          form.endDate
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "endDate",
                            event.target
                              .value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>

                    {/* SCHEDULE */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Lịch học
                      </span>

                      <input
                        value={
                          form.schedule
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "schedule",
                            event.target
                              .value,
                          )
                        }
                        placeholder="VD: Thứ 3, Thứ 5 - 18:00 đến 20:00"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>

                    {/* LOCATION */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Địa điểm
                      </span>

                      <input
                        value={
                          form.location
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "location",
                            event.target
                              .value,
                          )
                        }
                        placeholder="VD: Phòng AL-302"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>

                    {/* MAX STUDENTS */}

                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Sĩ số tối đa
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          form.maxStudents
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            "maxStudents",
                            event.target
                              .value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                      />
                    </label>
                  </div>
                </section>

                {/* AI INFORMATION */}

                {createMode ===
                  "AI" &&
                  selectedProposal && (
                    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex gap-3">
                        <Users
                          size={19}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <p className="text-sm leading-6 text-blue-700">
                          {
                            selectedProposal
                              .students
                              .length
                          }{" "}
                          sinh viên từ
                          đề xuất AI sẽ
                          được gắn với
                          lớp dưới dạng{" "}
                          <strong>
                            nhóm sinh
                            viên được đề
                            xuất
                          </strong>
                          . Các sinh
                          viên này chưa
                          được tính là
                          đã đăng ký
                          lớp.
                        </p>
                      </div>
                    </section>
                  )}
              </div>
            </div>

            {/* =============================================
                FOOTER

                FOOTER NẰM SAU BODY.
                KHÔNG NẰM TRONG BODY.
                ============================================= */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
              <p className="hidden text-xs text-slate-400 sm:block">
                Kiểm tra thông tin lớp
                trước khi tạo.
              </p>

              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={createClass}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <Plus size={17} />

                  Tạo lớp hỗ trợ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationSupportClasses;