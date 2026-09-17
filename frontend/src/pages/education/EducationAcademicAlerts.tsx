import React from "react";
import {
  AlertTriangle,
  BellRing,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  GraduationCap,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type AlertStatus = "Mới" | "Đã xem" | "Đang theo dõi";

interface RiskAlert {
  id: string;

  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  currentSemester: number;

  riskScore: number;

  plannedOjtTerm: string;
  estimatedOjtTerm: string;
  delayTerms: number;

  title: string;
  reason: string;

  detectedAt: string;
  status: AlertStatus;
}

/* =========================================================
   MOCK ALERT DATA

   Sau này:
   AI/BE phát hiện Risk cao
        ↓
   Backend tạo cảnh báo
        ↓
   Frontend chỉ hiển thị

   Frontend hiện tại KHÔNG tự chạy model Risk.
   ========================================================= */

const INITIAL_ALERTS: RiskAlert[] = [
  {
    id: "alert-001",

    studentCode: "SE181666",
    fullName: "Nguyễn Khánh Ly",

    cohort: "K18",
    studentClass: "K18D-19A",
    currentSemester: 5,

    riskScore: 86,

    plannedOjtTerm: "Summer 2026",
    estimatedOjtTerm: "Fall 2026",
    delayTerms: 1,

    title: "Nguy cơ chậm kỳ OJT",

    reason:
      "Tiến độ tín chỉ hiện tại có nguy cơ không đáp ứng kỳ OJT theo kế hoạch. Kỳ OJT dự kiến đã dịch từ Summer 2026 sang Fall 2026.",

    detectedAt: "15/09/2026 09:30",

    status: "Mới",
  },

  {
    id: "alert-002",

    studentCode: "SE181402",
    fullName: "Đặng Hoàng Nam",

    cohort: "K18",
    studentClass: "K18D-19B",
    currentSemester: 5,

    riskScore: 81,

    plannedOjtTerm: "Summer 2026",
    estimatedOjtTerm: "Fall 2026",
    delayTerms: 1,

    title: "Tiến độ học tập có nguy cơ ảnh hưởng OJT",

    reason:
      "Sinh viên còn các học phần cần hoàn thành và tiến độ hiện tại có khả năng làm thay đổi kỳ OJT dự kiến.",

    detectedAt: "14/09/2026 14:20",

    status: "Đang theo dõi",
  },

  {
    id: "alert-003",

    studentCode: "SE181934",
    fullName: "Phan Minh Hoàng",

    cohort: "K18",
    studentClass: "K18D-19A",
    currentSemester: 5,

    riskScore: 78,

    plannedOjtTerm: "Fall 2026",
    estimatedOjtTerm: "Spring 2027",
    delayTerms: 1,

    title: "Kỳ OJT dự kiến bị dịch chuyển",

    reason:
      "Dữ liệu tiến độ hiện tại cho thấy sinh viên có nguy cơ không tham gia OJT vào Fall 2026 như kế hoạch.",

    detectedAt: "12/09/2026 10:05",

    status: "Đã xem",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const STATUS_STYLE: Record<AlertStatus, string> = {
  Mới: "border-red-200 bg-red-50 text-red-700",

  "Đã xem":
    "border-slate-200 bg-slate-50 text-slate-600",

  "Đang theo dõi":
    "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_ICON: Record<
  AlertStatus,
  React.ReactNode
> = {
  Mới: <BellRing size={14} />,

  "Đã xem": <CheckCircle2 size={14} />,

  "Đang theo dõi": <Eye size={14} />,
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationAcademicAlerts: React.FC = () => {
  const [alerts, setAlerts] =
    React.useState<RiskAlert[]>(INITIAL_ALERTS);

  const [selectedAlert, setSelectedAlert] =
    React.useState<RiskAlert | null>(null);

  const newCount = alerts.filter(
    (alert) => alert.status === "Mới",
  ).length;

  const trackingCount = alerts.filter(
    (alert) => alert.status === "Đang theo dõi",
  ).length;

  /* =======================================================
     ACTIONS
     ======================================================= */

  const updateAlertStatus = (
    id: string,
    status: AlertStatus,
  ) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status,
            }
          : alert,
      ),
    );

    setSelectedAlert((current) =>
      current?.id === id
        ? {
            ...current,
            status,
          }
        : current,
    );
  };

  const openAlert = (alert: RiskAlert) => {
    if (alert.status === "Mới") {
      updateAlertStatus(alert.id, "Đã xem");

      setSelectedAlert({
        ...alert,
        status: "Đã xem",
      });

      return;
    }

    setSelectedAlert(alert);
  };

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Cảnh báo Sinh viên Nguy cơ cao"
        description="Theo dõi các cảnh báo được tạo khi hệ thống phát hiện sinh viên có Risk cao ảnh hưởng đến tiến độ OJT."
        badge="AI & Dashboard"
      />

      {/* ===================================================
          ALERT CENTER HEADER
          =================================================== */}

      <section className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <BellRing size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Trung tâm cảnh báo Risk
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Chỉ hiển thị các trường hợp đã được xác định ở
                mức Risk cao và cần Phòng Đào tạo chú ý.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-red-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">
                Cảnh báo mới
              </p>

              <p className="mt-1 text-xl font-black text-red-600">
                {newCount}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-400">
                Đang theo dõi
              </p>

              <p className="mt-1 text-xl font-black text-amber-600">
                {trackingCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ALERT FEED
          =================================================== */}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-800">
              Cảnh báo gần đây
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {alerts.length} cảnh báo Risk cao.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                alert.status === "Mới"
                  ? "border-red-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* ALERT INDICATOR */}

                <div
                  className={`w-full lg:w-1.5 ${
                    alert.status === "Mới"
                      ? "bg-red-500"
                      : alert.status ===
                          "Đang theo dõi"
                        ? "bg-amber-400"
                        : "bg-slate-200"
                  }`}
                />

                <div className="flex-1 p-5">
                  <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    {/* LEFT */}

                    <div className="flex min-w-0 gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          alert.status === "Mới"
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        <AlertTriangle size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-800">
                            {alert.title}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLE[alert.status]
                            }`}
                          >
                            {STATUS_ICON[alert.status]}
                            {alert.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="font-semibold text-slate-700">
                            {alert.fullName}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span className="font-semibold text-orange-600">
                            {alert.studentCode}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span className="text-slate-500">
                            {alert.cohort}
                          </span>

                          <span className="text-slate-300">
                            •
                          </span>

                          <span className="text-slate-500">
                            Kỳ {alert.currentSemester}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                          {alert.reason}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}

                    <div className="flex shrink-0 flex-wrap items-center gap-5 xl:justify-end">
                      <div>
                        <p className="text-xs text-slate-400">
                          Risk
                        </p>

                        <p className="mt-1 text-xl font-black text-red-600">
                          {alert.riskScore}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Phát hiện
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                          <Clock3 size={14} />
                          {alert.detectedAt}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openAlert(alert)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
                      >
                        Xem cảnh báo
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
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
            Dữ liệu cảnh báo hiện là mock frontend. Khi tích hợp
            AI và backend, cảnh báo sẽ được tạo từ kết quả Risk
            thay vì được frontend tự sinh.
          </p>
        </div>
      </section>

      {/* ===================================================
          DETAIL MODAL
          =================================================== */}

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={23} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedAlert.title}
                    </h2>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLE[
                          selectedAlert.status
                        ]
                      }`}
                    >
                      {
                        STATUS_ICON[
                          selectedAlert.status
                        ]
                      }

                      {selectedAlert.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Phát hiện lúc{" "}
                    {selectedAlert.detectedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* STUDENT */}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-500">
                    <GraduationCap size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      {selectedAlert.fullName}
                    </h3>

                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-orange-600">
                        {selectedAlert.studentCode}
                      </span>

                      <span className="text-slate-400">
                        {" "}
                        · {selectedAlert.cohort} ·{" "}
                        {selectedAlert.studentClass} · Kỳ{" "}
                        {selectedAlert.currentSemester}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* RISK */}

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Risk score
                  </p>

                  <p className="mt-2 text-4xl font-black text-red-700">
                    {selectedAlert.riskScore}%
                  </p>

                  <p className="mt-2 text-sm font-semibold text-red-600">
                    Risk cao
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      size={18}
                      className="text-orange-500"
                    />

                    <p className="font-semibold text-slate-700">
                      Ảnh hưởng đến OJT
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Kế hoạch
                      </p>

                      <p className="mt-1 font-semibold text-slate-700">
                        {selectedAlert.plannedOjtTerm}
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-red-400"
                    />

                    <div>
                      <p className="text-xs text-slate-400">
                        Dự kiến
                      </p>

                      <p className="mt-1 font-bold text-red-600">
                        {selectedAlert.estimatedOjtTerm}
                      </p>
                    </div>
                  </div>

                  {selectedAlert.delayTerms > 0 && (
                    <p className="mt-4 text-sm font-semibold text-red-600">
                      Nguy cơ chậm{" "}
                      {selectedAlert.delayTerms} kỳ
                    </p>
                  )}
                </div>
              </section>

              {/* REASON */}

              <section>
                <div className="flex items-center gap-2">
                  <BrainCircuit
                    size={20}
                    className="text-violet-600"
                  />

                  <h3 className="font-bold text-slate-800">
                    Nội dung cảnh báo
                  </h3>
                </div>

                <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 p-5">
                  <p className="text-sm leading-7 text-slate-700">
                    {selectedAlert.reason}
                  </p>
                </div>
              </section>

              {/* STATUS */}

              <section>
                <h3 className="font-bold text-slate-800">
                  Trạng thái cảnh báo
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Trạng thái này chỉ dùng để PĐT theo dõi cảnh
                  báo, không thay đổi Risk score của sinh viên.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateAlertStatus(
                        selectedAlert.id,
                        "Đã xem",
                      )
                    }
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedAlert.status === "Đã xem"
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Đã xem
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateAlertStatus(
                        selectedAlert.id,
                        "Đang theo dõi",
                      )
                    }
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedAlert.status ===
                      "Đang theo dõi"
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    Đang theo dõi
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationAcademicAlerts;