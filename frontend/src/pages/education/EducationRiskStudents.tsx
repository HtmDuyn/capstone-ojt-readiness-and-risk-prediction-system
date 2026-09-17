import React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type RiskLevel = "Cao" | "Trung bình" | "Thấp";

type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ";

interface RiskFactor {
  id: string;
  title: string;
  description: string;
}

interface RiskStudent {
  id: string;

  studentCode: string;
  fullName: string;

  cohort: string;
  studentClass: string;

  currentSemester: number;
  accumulatedCredits: number;

  riskLevel: RiskLevel;
  riskScore: number;

  progressStatus: ProgressStatus;

  plannedOjtTerm: string;
  estimatedOjtTerm: string;
  delayTerms: number;

  mainRiskReason: string;

  riskFactors: RiskFactor[];
}

/* =========================================================
   MOCK AI OUTPUT

   Lưu ý:
   - riskScore hiện là mock frontend.
   - riskFactors hiện là mock explanation.
   - FE không tự tính thuật toán Risk.
   - Sau này BE/AI trả dữ liệu thì thay data source.
   ========================================================= */

const RISK_STUDENTS: RiskStudent[] = [
  {
    id: "risk-1",

    studentCode: "SE181666",
    fullName: "Nguyễn Khánh Ly",

    cohort: "K18",
    studentClass: "K18D-19A",

    currentSemester: 5,
    accumulatedCredits: 63,

    riskLevel: "Cao",
    riskScore: 86,

    progressStatus: "Chậm tiến độ",

    plannedOjtTerm: "Summer 2026",
    estimatedOjtTerm: "Fall 2026",
    delayTerms: 1,

    mainRiskReason:
      "Tiến độ tín chỉ có nguy cơ không đáp ứng kỳ OJT theo kế hoạch.",

    riskFactors: [
      {
        id: "ly-factor-1",
        title: "Tiến độ tín chỉ chưa đạt kế hoạch",
        description:
          "Số tín chỉ tích lũy hiện tại chưa đáp ứng tiến độ cần thiết để tham gia OJT theo kỳ kế hoạch ban đầu.",
      },
      {
        id: "ly-factor-2",
        title: "Còn học phần cần hoàn thành",
        description:
          "Sinh viên vẫn còn học phần cần hoàn thành trước giai đoạn OJT.",
      },
      {
        id: "ly-factor-3",
        title: "Kỳ OJT dự kiến bị dịch chuyển",
        description:
          "Theo dữ liệu dự kiến hiện tại, OJT có khả năng chuyển từ Summer 2026 sang Fall 2026.",
      },
    ],
  },

  {
    id: "risk-2",

    studentCode: "SE182687",
    fullName: "Trần Vĩnh Phước",

    cohort: "K18",
    studentClass: "K18D-19B",

    currentSemester: 5,
    accumulatedCredits: 69,

    riskLevel: "Trung bình",
    riskScore: 54,

    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    estimatedOjtTerm: "Fall 2026",
    delayTerms: 0,

    mainRiskReason:
      "Khả năng đủ điều kiện OJT còn phụ thuộc kết quả các học phần đang học.",

    riskFactors: [
      {
        id: "phuoc-factor-1",
        title: "Phụ thuộc kết quả học kỳ hiện tại",
        description:
          "Sinh viên cần hoàn thành các học phần đang học để duy trì khả năng tham gia OJT đúng kế hoạch.",
      },
      {
        id: "phuoc-factor-2",
        title: "Chưa ghi nhận trễ kỳ OJT",
        description:
          "Tại thời điểm đánh giá, kỳ OJT dự kiến vẫn là Fall 2026.",
      },
    ],
  },

  {
    id: "risk-3",

    studentCode: "SE194728",
    fullName: "Lê Quốc Bảo",

    cohort: "K19",
    studentClass: "K19D-20A",

    currentSemester: 3,
    accumulatedCredits: 49,

    riskLevel: "Trung bình",
    riskScore: 46,

    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2027",
    estimatedOjtTerm: "Fall 2027",
    delayTerms: 0,

    mainRiskReason:
      "Có học phần chưa hoàn thành cần tiếp tục theo dõi trong các kỳ tiếp theo.",

    riskFactors: [
      {
        id: "bao-factor-1",
        title: "Có học phần chưa hoàn thành",
        description:
          "Sinh viên có học phần chưa hoàn thành và cần tiếp tục theo dõi ảnh hưởng tới lộ trình học.",
      },
      {
        id: "bao-factor-2",
        title: "Kỳ OJT chưa bị thay đổi",
        description:
          "Tại thời điểm đánh giá, kỳ OJT dự kiến vẫn giữ nguyên là Fall 2027.",
      },
    ],
  },

  {
    id: "risk-4",

    studentCode: "SE182521",
    fullName: "Lê Minh Nhật",

    cohort: "K18",
    studentClass: "K18D-19A",

    currentSemester: 5,
    accumulatedCredits: 75,

    riskLevel: "Thấp",
    riskScore: 18,

    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2026",
    estimatedOjtTerm: "Fall 2026",
    delayTerms: 0,

    mainRiskReason:
      "Chưa ghi nhận yếu tố có khả năng làm thay đổi kỳ OJT dự kiến.",

    riskFactors: [
      {
        id: "nhat-factor-1",
        title: "Tiến độ hiện tại phù hợp kế hoạch",
        description:
          "Kỳ OJT dự kiến hiện tại chưa thay đổi so với kế hoạch ban đầu.",
      },
    ],
  },

  {
    id: "risk-5",

    studentCode: "SE193842",
    fullName: "Võ Ngọc Mai",

    cohort: "K19",
    studentClass: "K19D-20B",

    currentSemester: 4,
    accumulatedCredits: 72,

    riskLevel: "Thấp",
    riskScore: 23,

    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Summer 2027",
    estimatedOjtTerm: "Summer 2027",
    delayTerms: 0,

    mainRiskReason:
      "Tiến độ hiện tại chưa cho thấy nguy cơ thay đổi kỳ OJT.",

    riskFactors: [
      {
        id: "mai-factor-1",
        title: "Tiến độ hiện tại ổn định",
        description:
          "Kỳ OJT dự kiến hiện tại vẫn phù hợp với kế hoạch học tập.",
      },
    ],
  },

  {
    id: "risk-6",

    studentCode: "SE195214",
    fullName: "Phạm Minh Thư",

    cohort: "K19",
    studentClass: "K19D-20A",

    currentSemester: 2,
    accumulatedCredits: 31,

    riskLevel: "Thấp",
    riskScore: 29,

    progressStatus: "Đúng tiến độ",

    plannedOjtTerm: "Fall 2027",
    estimatedOjtTerm: "Fall 2027",
    delayTerms: 0,

    mainRiskReason:
      "Chưa ghi nhận nguy cơ ảnh hưởng đến kỳ OJT theo kế hoạch.",

    riskFactors: [
      {
        id: "thu-factor-1",
        title: "Chưa ghi nhận nguy cơ đáng kể",
        description:
          "Sinh viên vẫn đang theo tiến độ dự kiến tại thời điểm đánh giá.",
      },
    ],
  },
];

/* =========================================================
   STYLE
   ========================================================= */

const RISK_BADGE_STYLE: Record<RiskLevel, string> = {
  Cao: "border-red-200 bg-red-50 text-red-700",

  "Trung bình":
    "border-amber-200 bg-amber-50 text-amber-700",

  Thấp: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const RISK_TEXT_STYLE: Record<RiskLevel, string> = {
  Cao: "text-red-600",
  "Trung bình": "text-amber-600",
  Thấp: "text-emerald-600",
};

const RISK_BAR_STYLE: Record<RiskLevel, string> = {
  Cao: "bg-red-500",
  "Trung bình": "bg-amber-500",
  Thấp: "bg-emerald-500",
};

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

interface RiskScoreProps {
  score: number;
  level: RiskLevel;
}

const RiskScore: React.FC<RiskScoreProps> = ({
  score,
  level,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-2xl font-black ${RISK_TEXT_STYLE[level]}`}
        >
          {score}%
        </span>

        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${RISK_BADGE_STYLE[level]}`}
        >
          {level}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${RISK_BAR_STYLE[level]}`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const EducationRiskStudents: React.FC = () => {
  const [selectedStudent, setSelectedStudent] =
    React.useState<RiskStudent | null>(null);

  const highRiskStudents = RISK_STUDENTS.filter(
    (student) => student.riskLevel === "Cao",
  );

  const mediumRiskStudents = RISK_STUDENTS.filter(
    (student) => student.riskLevel === "Trung bình",
  );

  const lowRiskStudents = RISK_STUDENTS.filter(
    (student) => student.riskLevel === "Thấp",
  );

  const totalStudents = RISK_STUDENTS.length;

  const highPercentage = Math.round(
    (highRiskStudents.length / totalStudents) * 100,
  );

  const mediumPercentage = Math.round(
    (mediumRiskStudents.length / totalStudents) * 100,
  );

  const lowPercentage = Math.round(
    (lowRiskStudents.length / totalStudents) * 100,
  );

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
          Quay lại Risk Analysis
        </button>

        <PageBanner
          title="Phân tích Risk Sinh viên"
          description="Xem kết quả đánh giá Risk và các yếu tố đang ảnh hưởng đến khả năng tham gia OJT đúng tiến độ."
          badge="AI & Dashboard"
        />

        {/* STUDENT HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
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
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-slate-50 p-4 lg:w-[260px]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Risk hiện tại
              </p>

              <RiskScore
                score={student.riskScore}
                level={student.riskLevel}
              />
            </div>
          </div>
        </section>

        {/* AI EXPLANATION */}

        <section
          className={`rounded-2xl border p-6 ${
            student.riskLevel === "Cao"
              ? "border-red-200 bg-red-50"
              : student.riskLevel === "Trung bình"
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="flex gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ${RISK_TEXT_STYLE[student.riskLevel]}`}
            >
              <BrainCircuit size={23} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-800">
                  AI Risk Analysis
                </h3>

                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Mock output
                </span>
              </div>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                {student.mainRiskReason}
              </p>
            </div>
          </div>
        </section>

        {/* OJT IMPACT */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays
              size={21}
              className="text-orange-500"
            />

            <div>
              <h3 className="font-semibold text-slate-800">
                Ảnh hưởng dự kiến đến OJT
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                So sánh kỳ OJT theo kế hoạch với dự kiến hiện tại.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* PLANNED */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                OJT theo kế hoạch
              </p>

              <p className="mt-2 text-xl font-bold text-slate-800">
                {student.plannedOjtTerm}
              </p>
            </div>

            {/* ARROW */}

            <div className="flex justify-center">
              <ChevronRight
                size={25}
                className={
                  student.delayTerms > 0
                    ? "text-red-500"
                    : "text-slate-300"
                }
              />
            </div>

            {/* ESTIMATED */}

            <div
              className={`rounded-2xl border p-5 ${
                student.delayTerms > 0
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                OJT dự kiến hiện tại
              </p>

              <p
                className={`mt-2 text-xl font-bold ${
                  student.delayTerms > 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }`}
              >
                {student.estimatedOjtTerm}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">
                Tín chỉ tích lũy
              </p>

              <p className="mt-1 font-bold text-slate-700">
                {student.accumulatedCredits} TC
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">
                Tiến độ hiện tại
              </p>

              <p
                className={`mt-1 font-bold ${
                  student.progressStatus === "Chậm tiến độ"
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {student.progressStatus}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">
                Độ trễ dự kiến
              </p>

              <p
                className={`mt-1 font-bold ${
                  student.delayTerms > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {student.delayTerms > 0
                  ? `${student.delayTerms} kỳ`
                  : "Chưa ghi nhận trễ"}
              </p>
            </div>
          </div>
        </section>

        {/* RISK FACTORS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleAlert
              size={21}
              className="text-orange-500"
            />

            <div>
              <h3 className="font-semibold text-slate-800">
                Vì sao sinh viên ở mức Risk này?
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Các yếu tố được hiển thị để giải thích kết quả
                Risk.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {student.riskFactors.map((factor) => (
              <div
                key={factor.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex gap-3">
                  {student.riskLevel === "Cao" ? (
                    <AlertTriangle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                  ) : student.riskLevel ===
                    "Trung bình" ? (
                    <TrendingUp
                      size={19}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                  ) : (
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                  )}

                  <div>
                    <p className="font-semibold text-slate-700">
                      {factor.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {factor.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     RISK ANALYSIS BOARD
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Sinh viên theo Risk"
        description="AI phân nhóm sinh viên theo nguy cơ ảnh hưởng đến khả năng tham gia OJT đúng tiến độ."
        badge="AI & Dashboard"
      />

      {/* ===================================================
          RISK DISTRIBUTION
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit
                size={22}
                className="text-orange-500"
              />

              <h2 className="font-bold text-slate-800">
                Tổng quan phân bố Risk
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {totalStudents} sinh viên đang có kết quả đánh giá
              Risk.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Sparkles size={14} />
            AI Risk Analysis
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* HIGH */}

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-red-700">
                  Risk cao
                </p>

                <p className="mt-2 text-3xl font-black text-red-700">
                  {highRiskStudents.length}
                </p>

                <p className="mt-1 text-xs text-red-500">
                  {highPercentage}% sinh viên được đánh giá
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500">
                <AlertTriangle size={21} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-100">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${highPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* MEDIUM */}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-700">
                  Risk trung bình
                </p>

                <p className="mt-2 text-3xl font-black text-amber-700">
                  {mediumRiskStudents.length}
                </p>

                <p className="mt-1 text-xs text-amber-600">
                  {mediumPercentage}% sinh viên được đánh giá
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500">
                <TrendingUp size={21} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${mediumPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* LOW */}

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  Risk thấp
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {lowRiskStudents.length}
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  {lowPercentage}% sinh viên được đánh giá
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500">
                <ShieldCheck size={21} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${lowPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          HIGH RISK
          =================================================== */}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertTriangle size={19} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Risk cao
            </h2>

            <p className="text-sm text-slate-500">
              Nhóm có nguy cơ ảnh hưởng rõ đến tiến độ OJT.
            </p>
          </div>
        </div>

        {highRiskStudents.map((student) => (
          <div
            key={student.id}
            className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.8fr_1.4fr_auto]">
              {/* STUDENT */}

              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 font-bold text-red-600">
                    {student.fullName
                      .split(" ")
                      .slice(-1)[0]
                      .charAt(0)}
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">
                      {student.fullName}
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-orange-600">
                      {student.studentCode}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {student.cohort} · Kỳ{" "}
                      {student.currentSemester}
                    </p>
                  </div>
                </div>
              </div>

              {/* SCORE */}

              <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Risk score
                </p>

                <RiskScore
                  score={student.riskScore}
                  level={student.riskLevel}
                />
              </div>

              {/* REASON */}

              <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Nguy cơ chính
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {student.mainRiskReason}
                </p>

                {student.delayTerms > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-slate-500">
                      {student.plannedOjtTerm}
                    </span>

                    <ChevronRight
                      size={14}
                      className="text-red-400"
                    />

                    <span className="font-bold text-red-600">
                      {student.estimatedOjtTerm}
                    </span>

                    <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-600">
                      +{student.delayTerms} kỳ
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION */}

              <div className="flex items-center border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudent(student)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 lg:w-auto"
                >
                  Phân tích
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ===================================================
          MEDIUM RISK
          =================================================== */}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <TrendingUp size={19} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Risk trung bình
            </h2>

            <p className="text-sm text-slate-500">
              Chưa ghi nhận trễ OJT nhưng vẫn có yếu tố cần theo
              dõi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {mediumRiskStudents.map((student) => (
            <article
              key={student.id}
              className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {student.fullName}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-orange-600">
                    {student.studentCode}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {student.cohort} ·{" "}
                    {student.studentClass} · Kỳ{" "}
                    {student.currentSemester}
                  </p>
                </div>

                <span className="text-2xl font-black text-amber-600">
                  {student.riskScore}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${student.riskScore}%`,
                  }}
                />
              </div>

              <div className="mt-5 rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Yếu tố cần theo dõi
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {student.mainRiskReason}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  OJT dự kiến{" "}
                  <span className="font-semibold text-slate-700">
                    {student.estimatedOjtTerm}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudent(student)
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 transition hover:text-amber-800"
                >
                  Phân tích
                  <ChevronRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===================================================
          LOW RISK
          =================================================== */}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Risk thấp
            </h2>

            <p className="text-sm text-slate-500">
              Chưa ghi nhận nguy cơ đáng kể ảnh hưởng đến kỳ OJT
              dự kiến.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {lowRiskStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 md:flex-row md:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={19} />
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
                      {" · Kỳ "}
                      {student.currentSemester}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 md:justify-end">
                  <div>
                    <p className="text-xs text-slate-400">
                      OJT dự kiến
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {student.estimatedOjtTerm}
                    </p>
                  </div>

                  <div className="min-w-[100px]">
                    <p className="text-xs text-slate-400">
                      Risk
                    </p>

                    <p className="mt-1 font-bold text-emerald-600">
                      {student.riskScore}%
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStudent(student)
                    }
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    Phân tích
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          NOTE
          =================================================== */}

      <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
        <div className="flex gap-3">
          <BrainCircuit
            size={19}
            className="mt-0.5 shrink-0 text-violet-600"
          />

          <p className="text-sm leading-6 text-violet-700">
            Risk score và phần giải thích hiện là dữ liệu mock
            phục vụ giao diện. Khi tích hợp AI, trang này sẽ hiển
            thị kết quả được trả về từ mô hình thay vì tự tính
            Risk tại frontend.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EducationRiskStudents;