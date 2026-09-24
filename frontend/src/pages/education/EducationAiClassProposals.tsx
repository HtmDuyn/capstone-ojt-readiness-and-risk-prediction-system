import React from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Lightbulb,
  School,
  Sparkles,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type ProposalPriority = "Cao" | "Trung bình";

type ProposalStatus = "Chờ xem xét" | "Đã chấp nhận" | "Đã bỏ qua";

interface AffectedStudent {
  id: string;
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  currentSemester: number;
  riskScore: number;
  reason: string;
}

interface ClassProposal {
  id: string;

  courseCode: string;
  courseName: string;

  priority: ProposalPriority;
  status: ProposalStatus;

  affectedStudents: AffectedStudent[];

  reason: string;

  recommendation: string;

  detectedAt: string;
}

/* =========================================================
   MOCK AI OUTPUT

   Sau này:
   Academic Data + Risk
          ↓
        AI/BE
          ↓
   Class Proposal API
          ↓
          FE

   Frontend KHÔNG tự quyết định có mở lớp hay không.
   ========================================================= */

const INITIAL_PROPOSALS: ClassProposal[] = [
  {
    id: "proposal-001",

    courseCode: "SWD392",
    courseName: "Software Architecture and Design",

    priority: "Cao",
    status: "Chờ xem xét",

    reason:
      "AI phát hiện một nhóm sinh viên có vấn đề liên quan đến học phần SWD392 và có nguy cơ ảnh hưởng đến tiến độ học tập trước OJT.",

    recommendation:
      "Đề xuất Phòng Đào tạo xem xét mở lớp hỗ trợ SWD392 cho nhóm sinh viên này.",

    detectedAt: "15/09/2026 09:30",

    affectedStudents: [
      {
        id: "swd-1",
        studentCode: "SE181666",
        fullName: "Nguyễn Khánh Ly",
        cohort: "K18",
        studentClass: "K18D-19A",
        currentSemester: 5,
        riskScore: 86,
        reason: "Chưa hoàn thành học phần theo tiến độ dự kiến.",
      },
      {
        id: "swd-2",
        studentCode: "SE181402",
        fullName: "Đặng Hoàng Nam",
        cohort: "K18",
        studentClass: "K18D-19B",
        currentSemester: 5,
        riskScore: 81,
        reason: "Học phần đang ảnh hưởng đến lộ trình học hiện tại.",
      },
      {
        id: "swd-3",
        studentCode: "SE181934",
        fullName: "Phan Minh Hoàng",
        cohort: "K18",
        studentClass: "K18D-19A",
        currentSemester: 5,
        riskScore: 78,
        reason: "Cần hoàn thành học phần để giảm nguy cơ trễ tiến độ.",
      },
      {
        id: "swd-4",
        studentCode: "SE182104",
        fullName: "Trần Gia Minh",
        cohort: "K18",
        studentClass: "K18D-19B",
        currentSemester: 5,
        riskScore: 74,
        reason: "Tiến độ học phần cần tiếp tục được theo dõi.",
      },
    ],
  },

  {
    id: "proposal-002",

    courseCode: "DBI202",
    courseName: "Introduction to Databases",

    priority: "Trung bình",
    status: "Chờ xem xét",

    reason:
      "AI ghi nhận nhiều sinh viên đang có vấn đề với DBI202. Học phần này có thể ảnh hưởng đến lộ trình các học phần tiếp theo.",

    recommendation:
      "Đề xuất xem xét nhu cầu mở lớp hỗ trợ DBI202 để sinh viên có cơ hội hoàn thành học phần.",

    detectedAt: "14/09/2026 14:15",

    affectedStudents: [
      {
        id: "dbi-1",
        studentCode: "SE194728",
        fullName: "Lê Quốc Bảo",
        cohort: "K19",
        studentClass: "K19D-20A",
        currentSemester: 3,
        riskScore: 46,
        reason: "DBI202 chưa hoàn thành.",
      },
      {
        id: "dbi-2",
        studentCode: "SE194611",
        fullName: "Nguyễn Minh Quân",
        cohort: "K19",
        studentClass: "K19D-20B",
        currentSemester: 3,
        riskScore: 51,
        reason: "Cần hoàn thành DBI202 để duy trì lộ trình học.",
      },
      {
        id: "dbi-3",
        studentCode: "SE195028",
        fullName: "Phạm Hoàng Long",
        cohort: "K19",
        studentClass: "K19D-20A",
        currentSemester: 3,
        riskScore: 48,
        reason: "Kết quả học phần đang ảnh hưởng tiến độ.",
      },
    ],
  },

  {
    id: "proposal-003",

    courseCode: "PRN231",
    courseName: "Building Cross-Platform Back-End Application With .NET",

    priority: "Trung bình",
    status: "Đã chấp nhận",

    reason:
      "AI phát hiện nhóm sinh viên cần hỗ trợ PRN231 để hạn chế ảnh hưởng đến tiến độ học tập.",

    recommendation: "Đề xuất xem xét mở lớp hỗ trợ PRN231.",

    detectedAt: "10/09/2026 08:45",

    affectedStudents: [
      {
        id: "prn-1",
        studentCode: "SE182301",
        fullName: "Nguyễn Quốc Anh",
        cohort: "K18",
        studentClass: "K18D-19A",
        currentSemester: 5,
        riskScore: 62,
        reason: "Cần hoàn thành PRN231 theo lộ trình.",
      },
      {
        id: "prn-2",
        studentCode: "SE182411",
        fullName: "Trần Minh Đức",
        cohort: "K18",
        studentClass: "K18D-19B",
        currentSemester: 5,
        riskScore: 58,
        reason: "Học phần cần được hoàn thành trước các bước tiếp theo.",
      },
    ],
  },
];

/* =========================================================
   STYLES
   ========================================================= */

const PRIORITY_STYLE: Record<ProposalPriority, string> = {
  Cao: "border-red-200 bg-red-50 text-red-700",
  "Trung bình": "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_STYLE: Record<ProposalStatus, string> = {
  "Chờ xem xét": "border-violet-200 bg-violet-50 text-violet-700",

  "Đã chấp nhận": "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đã bỏ qua": "border-slate-200 bg-slate-50 text-slate-500",
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationAiClassProposals: React.FC = () => {
  const [proposals, setProposals] =
    React.useState<ClassProposal[]>(INITIAL_PROPOSALS);

  const [selectedProposal, setSelectedProposal] =
    React.useState<ClassProposal | null>(null);

  const pendingProposals = proposals.filter(
    (proposal) => proposal.status === "Chờ xem xét",
  );

  const acceptedProposals = proposals.filter(
    (proposal) => proposal.status === "Đã chấp nhận",
  );

  /* =======================================================
     ACTION
     ======================================================= */

  const updateProposalStatus = (proposalId: string, status: ProposalStatus) => {
    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === proposalId
          ? {
              ...proposal,
              status,
            }
          : proposal,
      ),
    );

    setSelectedProposal((current) =>
      current?.id === proposalId
        ? {
            ...current,
            status,
          }
        : current,
    );
  };

  /* =======================================================
     PROPOSAL BOARD
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Đề xuất Lớp hỗ trợ từ AI"
        description="Xem các đề xuất lớp hỗ trợ được hình thành từ dữ liệu học tập và mức nguy cơ của sinh viên."
        badge="Phòng Đào tạo"
      />

      {/* OVERVIEW */}

      <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-orange-50 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <BrainCircuit size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">
                  AI Class Recommendation
                </h2>

                <Sparkles size={16} className="text-violet-500" />
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                AI phát hiện các nhóm sinh viên có nhu cầu học tập tương tự và
                đề xuất PĐT cân nhắc mở lớp hỗ trợ.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-violet-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">Chờ xem xét</p>

              <p className="mt-1 text-xl font-black text-violet-700">
                {pendingProposals.length}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">Đã chấp nhận</p>

              <p className="mt-1 text-xl font-black text-emerald-700">
                {acceptedProposals.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PENDING */}

      <section className="space-y-4">
        <div>
          <h2 className="font-bold text-slate-800">Đề xuất cần xem xét</h2>

          <p className="mt-1 text-sm text-slate-500">
            AI chỉ đưa ra đề xuất; Phòng Đào tạo xem xét và quyết định chấp nhận
            hoặc bỏ qua.
          </p>
        </div>

        {pendingProposals.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />

            <p className="mt-3 font-semibold text-slate-700">
              Không còn đề xuất đang chờ xem xét.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pendingProposals.map((proposal) => (
              <article
                key={proposal.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        proposal.priority === "Cao"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {proposal.priority === "Cao" ? (
                        <AlertTriangle size={21} />
                      ) : (
                        <Lightbulb size={21} />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-800">
                          {proposal.courseCode}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            PRIORITY_STYLE[proposal.priority]
                          }`}
                        >
                          {proposal.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {proposal.courseName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-violet-700">
                      {proposal.affectedStudents.length}
                    </p>

                    <p className="text-xs text-slate-400">sinh viên</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-violet-50 p-4">
                  <div className="flex gap-2">
                    <BrainCircuit
                      size={18}
                      className="mt-0.5 shrink-0 text-violet-600"
                    />

                    <p className="text-sm leading-6 text-slate-700">
                      {proposal.reason}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock3 size={14} />
                    {proposal.detectedAt}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedProposal(proposal)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-orange-600"
                  >
                    Xem đề xuất
                    <ChevronRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ACCEPTED */}

      {acceptedProposals.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-bold text-slate-800">Đề xuất đã chấp nhận</h2>

            <p className="mt-1 text-sm text-slate-500">
              Các đề xuất lớp hỗ trợ đã được Phòng Đào tạo chấp nhận.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {acceptedProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={19} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-800">
                        {proposal.courseCode}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {proposal.courseName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <p className="text-xs text-slate-400">
                        Sinh viên liên quan
                      </p>

                      <p className="mt-1 font-bold text-slate-700">
                        {proposal.affectedStudents.length}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      Đã chấp nhận
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedProposal(proposal)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"
                    >
                      Chi tiết
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NOTE */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex gap-3">
          <BrainCircuit size={19} className="mt-0.5 shrink-0 text-blue-600" />

          <p className="text-sm leading-6 text-blue-700">
            Các đề xuất hiện là dữ liệu mock frontend. Khi tích hợp AI và
            backend, hệ thống sẽ nhận đề xuất dựa trên dữ liệu học tập và kết
            quả Risk. PĐT xem xét và quyết định chấp nhận hoặc bỏ qua đề xuất.
          </p>
        </div>
      </section>
      {/* =====================================================
          PROPOSAL DETAIL MODAL
          ===================================================== */}

      {selectedProposal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Chi tiết Đề xuất Mở lớp
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Xem lý do AI đề xuất và nhóm sinh viên đang có nhu cầu hỗ trợ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {/* COURSE */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <School size={27} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800">
                          {selectedProposal.courseCode}
                        </h2>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            PRIORITY_STYLE[selectedProposal.priority]
                          }`}
                        >
                          Ưu tiên {selectedProposal.priority.toLowerCase()}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLE[selectedProposal.status]
                          }`}
                        >
                          {selectedProposal.status}
                        </span>
                      </div>

                      <p className="mt-2 font-medium text-slate-600">
                        {selectedProposal.courseName}
                      </p>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={14} />
                        AI ghi nhận: {selectedProposal.detectedAt}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-5 py-4">
                    <p className="text-xs text-slate-400">
                      Sinh viên liên quan
                    </p>

                    <p className="mt-1 text-2xl font-black text-slate-800">
                      {selectedProposal.affectedStudents.length}
                    </p>
                  </div>
                </div>
              </section>

              {/* WHY AI PROPOSES */}

              <section className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600">
                    <BrainCircuit size={22} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">
                        Vì sao AI đề xuất mở lớp?
                      </h3>

                      <Sparkles size={16} className="text-violet-500" />
                    </div>

                    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
                      {selectedProposal.reason}
                    </p>
                  </div>
                </div>
              </section>

              {/* RECOMMENDATION */}

              <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <div className="flex gap-3">
                  <Lightbulb
                    size={21}
                    className="mt-0.5 shrink-0 text-orange-600"
                  />

                  <div>
                    <h3 className="font-bold text-orange-800">Đề xuất</h3>

                    <p className="mt-2 text-sm leading-6 text-orange-700">
                      {selectedProposal.recommendation}
                    </p>
                  </div>
                </div>
              </section>

              {/* STUDENTS */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-orange-500" />

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Sinh viên liên quan
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Nhóm sinh viên được AI sử dụng để hình thành đề xuất
                        này.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedProposal.affectedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1fr_110px_1.4fr] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                          <GraduationCap size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.fullName}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            <span className="font-semibold text-orange-600">
                              {student.studentCode}
                            </span>

                            {" · "}
                            {student.cohort}

                            {" · "}
                            {student.studentClass}

                            {" · Kỳ "}
                            {student.currentSemester}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Risk</p>

                        <p
                          className={`mt-1 font-bold ${
                            student.riskScore >= 70
                              ? "text-red-600"
                              : student.riskScore >= 40
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {student.riskScore}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Lý do liên quan
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {student.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* DECISION */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Quyết định của Phòng Đào tạo
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      AI chỉ đưa ra đề xuất. Phòng Đào tạo xem xét và quyết định
                      chấp nhận hoặc bỏ qua đề xuất.
                    </p>
                  </div>

                  {selectedProposal.status === "Chờ xem xét" ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateProposalStatus(selectedProposal.id, "Đã bỏ qua")
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <XCircle size={17} />
                        Bỏ qua đề xuất
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateProposalStatus(
                            selectedProposal.id,
                            "Đã chấp nhận",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={17} />
                        Chấp nhận đề xuất
                      </button>
                    </div>
                  ) : selectedProposal.status === "Đã chấp nhận" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      Đề xuất đã được PĐT chấp nhận.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                      Đề xuất đã được bỏ qua.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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

export default EducationAiClassProposals;
