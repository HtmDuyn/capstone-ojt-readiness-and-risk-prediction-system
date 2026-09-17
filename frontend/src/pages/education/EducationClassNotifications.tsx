import React from "react";
import {
  ArrowLeft,
  Bell,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  School,
  Send,
  Users,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type NotificationStatus = "Đã gửi";

type RecipientMode =
  | "AI_SUGGESTED"
  | "ALL_STUDENTS";

interface SuggestedStudent {
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
}

interface SupportClass {
  id: string;

  classCode: string;

  courseCode: string;
  courseName: string;

  source: "AI" | "Thủ công";

  startDate: string;
  endDate: string;

  schedule: string;
  location: string;

  maxStudents: number;

  suggestedStudents: SuggestedStudent[];
}

interface SentNotification {
  id: string;

  supportClassId: string;

  classCode: string;
  courseCode: string;
  courseName: string;

  title: string;
  content: string;

  recipientMode: RecipientMode;

  recipientCount: number;

  sentAt: string;

  status: NotificationStatus;
}

/* =========================================================
   MOCK - LỚP HỖ TRỢ ĐÃ ĐƯỢC TẠO

   Sau này backend:
   GET /education/support-classes

   Trang này KHÔNG tạo lớp.
   Chỉ lấy lớp đã tạo để gửi thông báo.
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

    suggestedStudents: [
      {
        studentCode: "SE181666",
        fullName: "Nguyễn Khánh Ly",
        cohort: "K18",
        studentClass: "K18D-19A",
      },
      {
        studentCode: "SE181402",
        fullName: "Đặng Hoàng Nam",
        cohort: "K18",
        studentClass: "K18D-19B",
      },
      {
        studentCode: "SE181934",
        fullName: "Phan Minh Hoàng",
        cohort: "K18",
        studentClass: "K18D-19A",
      },
      {
        studentCode: "SE182104",
        fullName: "Trần Gia Minh",
        cohort: "K18",
        studentClass: "K18D-19B",
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

    suggestedStudents: [],
  },
];

/* =========================================================
   MOCK - THÔNG BÁO ĐÃ GỬI
   ========================================================= */

const INITIAL_NOTIFICATIONS: SentNotification[] = [
  {
    id: "notification-001",

    supportClassId: "class-dbi202",

    classCode: "SUP-DBI202-01",

    courseCode: "DBI202",

    courseName:
      "Introduction to Databases",

    title:
      "Thông báo mở lớp hỗ trợ DBI202",

    content:
      "Phòng Đào tạo thông báo mở lớp hỗ trợ DBI202. Sinh viên có nhu cầu vui lòng xem thông tin lớp và đăng ký trong thời gian quy định.",

    recipientMode: "ALL_STUDENTS",

    recipientCount: 42,

    sentAt: "28/09/2026 09:30",

    status: "Đã gửi",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const RECIPIENT_LABEL: Record<
  RecipientMode,
  string
> = {
  AI_SUGGESTED:
    "Sinh viên trong đề xuất AI",

  ALL_STUDENTS:
    "Sinh viên có nhu cầu đăng ký",
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationClassNotifications: React.FC =
  () => {
    const [
      notifications,
      setNotifications,
    ] =
      React.useState<
        SentNotification[]
      >(INITIAL_NOTIFICATIONS);

    const [
      showSendModal,
      setShowSendModal,
    ] = React.useState(false);

    const [
      selectedClass,
      setSelectedClass,
    ] =
      React.useState<SupportClass | null>(
        null,
      );

    const [
      selectedNotification,
      setSelectedNotification,
    ] =
      React.useState<SentNotification | null>(
        null,
      );

    const [
      recipientMode,
      setRecipientMode,
    ] =
      React.useState<RecipientMode>(
        "ALL_STUDENTS",
      );

    const [title, setTitle] =
      React.useState("");

    const [content, setContent] =
      React.useState("");

    /* =====================================================
       OPEN SEND MODAL
       ===================================================== */

    const openSendModal = (
      supportClass: SupportClass,
    ) => {
      setSelectedClass(supportClass);

      const defaultRecipient:
        RecipientMode =
        supportClass.source === "AI" &&
        supportClass.suggestedStudents
          .length > 0
          ? "AI_SUGGESTED"
          : "ALL_STUDENTS";

      setRecipientMode(defaultRecipient);

      setTitle(
        `Thông báo mở lớp hỗ trợ ${supportClass.courseCode}`,
      );

      setContent(
        `Phòng Đào tạo thông báo mở lớp hỗ trợ ${supportClass.courseCode} - ${supportClass.courseName}.\n\n` +
          `Mã lớp: ${supportClass.classCode}\n` +
          `Thời gian: ${supportClass.startDate} - ${supportClass.endDate}\n` +
          `Lịch học: ${supportClass.schedule}\n` +
          `Địa điểm: ${supportClass.location}\n` +
          `Sĩ số tối đa: ${supportClass.maxStudents} sinh viên.\n\n` +
          `Sinh viên có nhu cầu vui lòng xem thông tin lớp và thực hiện đăng ký.`,
      );

      setShowSendModal(true);
    };

    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    const closeSendModal = () => {
      setShowSendModal(false);

      setSelectedClass(null);

      setTitle("");

      setContent("");

      setRecipientMode(
        "ALL_STUDENTS",
      );
    };

    /* =====================================================
       SEND NOTIFICATION
       ===================================================== */

    const sendNotification = () => {
      if (!selectedClass) {
        return;
      }

      if (!title.trim()) {
        window.alert(
          "Vui lòng nhập tiêu đề thông báo.",
        );

        return;
      }

      if (!content.trim()) {
        window.alert(
          "Vui lòng nhập nội dung thông báo.",
        );

        return;
      }

      if (
        recipientMode ===
          "AI_SUGGESTED" &&
        selectedClass
          .suggestedStudents.length === 0
      ) {
        window.alert(
          "Lớp này không có danh sách sinh viên từ đề xuất AI.",
        );

        return;
      }

      /*
       * FE mock:
       * - AI_SUGGESTED lấy đúng số SV trong proposal.
       * - ALL_STUDENTS chưa có backend nên chưa thể biết
       *   số người nhận thật.
       *
       * Không giả lập số lượng SV toàn trường.
       */

      const recipientCount =
        recipientMode ===
        "AI_SUGGESTED"
          ? selectedClass
              .suggestedStudents.length
          : 0;

      const newNotification: SentNotification =
        {
          id: `notification-${Date.now()}`,

          supportClassId:
            selectedClass.id,

          classCode:
            selectedClass.classCode,

          courseCode:
            selectedClass.courseCode,

          courseName:
            selectedClass.courseName,

          title: title.trim(),

          content: content.trim(),

          recipientMode,

          recipientCount,

          sentAt:
            new Date().toLocaleString(
              "vi-VN",
            ),

          status: "Đã gửi",
        };

      setNotifications(
        (current) => [
          newNotification,
          ...current,
        ],
      );

      closeSendModal();

      window.alert(
        "Đã gửi thông báo mở lớp.",
      );
    };

    /* =====================================================
       NOTIFICATION DETAIL
       ===================================================== */

    if (selectedNotification) {
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() =>
              setSelectedNotification(
                null,
              )
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-500"
          >
            <ArrowLeft size={18} />

            Quay lại danh sách
          </button>

          <PageBanner
            title="Chi tiết Thông báo Mở lớp"
            description="Xem nội dung thông báo lớp hỗ trợ đã được Phòng Đào tạo gửi."
            badge="Quản lý lớp hỗ trợ"
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Bell size={23} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800">
                      {
                        selectedNotification.title
                      }
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2
                        size={13}
                      />

                      Đã gửi
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {
                      selectedNotification.classCode
                    }

                    {" · "}

                    {
                      selectedNotification.courseCode
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock3 size={16} />

                {
                  selectedNotification.sentAt
                }
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Lớp hỗ trợ
              </p>

              <p className="mt-3 font-black text-slate-800">
                {
                  selectedNotification.classCode
                }
              </p>

              <p className="mt-1 text-sm font-semibold text-orange-600">
                {
                  selectedNotification.courseCode
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {
                  selectedNotification.courseName
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Đối tượng nhận
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Users
                  size={18}
                  className="text-violet-600"
                />

                <p className="font-bold text-slate-800">
                  {
                    RECIPIENT_LABEL[
                      selectedNotification
                        .recipientMode
                    ]
                  }
                </p>
              </div>

              {selectedNotification
                .recipientMode ===
                "AI_SUGGESTED" && (
                <p className="mt-2 text-sm text-slate-500">
                  {
                    selectedNotification.recipientCount
                  }{" "}
                  sinh viên
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Thời điểm gửi
              </p>

              <p className="mt-3 font-bold text-slate-800">
                {
                  selectedNotification.sentAt
                }
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail
                size={19}
                className="text-orange-500"
              />

              <h3 className="font-bold text-slate-800">
                Nội dung thông báo
              </h3>
            </div>

            <div className="mt-5 whitespace-pre-line rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {
                selectedNotification.content
              }
            </div>
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
          title="Thông báo Mở lớp"
          description="Chọn lớp hỗ trợ đã được tạo và gửi thông báo mở lớp đến sinh viên."
          badge="Quản lý lớp hỗ trợ"
        />

        {/* ===============================================
            FLOW NOTE
            =============================================== */}

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <Bell
              size={21}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>
              <h2 className="font-bold text-blue-800">
                Gửi thông báo cho lớp
                đã được tạo
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Trang này không tạo
                lớp mới. PĐT chọn một
                lớp hỗ trợ đã tạo,
                kiểm tra nội dung và
                gửi thông báo để sinh
                viên biết và đăng ký
                lớp.
              </p>
            </div>
          </div>
        </section>

        {/* ===============================================
            SUPPORT CLASSES
            =============================================== */}

        <section>
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">
              Lớp hỗ trợ có thể thông
              báo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chọn lớp cần gửi thông
              báo mở đăng ký.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {SUPPORT_CLASSES.map(
              (supportClass) => {
                const sentCount =
                  notifications.filter(
                    (notification) =>
                      notification.supportClassId ===
                      supportClass.id,
                  ).length;

                return (
                  <article
                    key={
                      supportClass.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
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

                            {supportClass.source ===
                              "AI" && (
                              <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                                Từ AI
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm font-bold text-orange-600">
                            {
                              supportClass.courseCode
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              supportClass.courseName
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <CalendarDays
                            size={14}
                          />

                          Thời gian
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {
                            supportClass.startDate
                          }{" "}
                          -{" "}
                          {
                            supportClass.endDate
                          }
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Users
                            size={14}
                          />

                          Sĩ số tối đa
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {
                            supportClass.maxStudents
                          }{" "}
                          sinh viên
                        </p>
                      </div>
                    </div>

                    {supportClass.source ===
                      "AI" &&
                      supportClass
                        .suggestedStudents
                        .length > 0 && (
                        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                          <p className="text-xs font-semibold text-violet-700">
                            {
                              supportClass
                                .suggestedStudents
                                .length
                            }{" "}
                            sinh viên trong
                            đề xuất AI
                          </p>
                        </div>
                      )}

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400">
                        {sentCount === 0
                          ? "Chưa gửi thông báo"
                          : `Đã gửi ${sentCount} thông báo`}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openSendModal(
                            supportClass,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        <Send
                          size={16}
                        />

                        Gửi thông báo
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </section>

        {/* ===============================================
            SENT NOTIFICATIONS
            =============================================== */}

        <section>
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">
              Thông báo đã gửi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lịch sử thông báo mở lớp
              đã được PĐT gửi.
            </p>
          </div>

          {notifications.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Bell
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-600">
                Chưa có thông báo nào
                được gửi.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {notifications.map(
                  (notification) => (
                    <div
                      key={
                        notification.id
                      }
                      className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2
                            size={19}
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-800">
                              {
                                notification.title
                              }
                            </p>

                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Đã gửi
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              notification.classCode
                            }

                            {" · "}

                            {
                              RECIPIENT_LABEL[
                                notification
                                  .recipientMode
                              ]
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              notification.sentAt
                            }
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedNotification(
                            notification,
                          )
                        }
                        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-orange-600 transition hover:text-orange-700 lg:self-auto"
                      >
                        <Eye size={16} />

                        Xem chi tiết
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </section>

        {/* ===============================================
            SEND MODAL
            HEADER + SCROLL BODY + FOOTER
            =============================================== */}

        {showSendModal &&
          selectedClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
              <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

                {/* HEADER */}

                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell
                        size={22}
                        className="text-orange-500"
                      />

                      <h2 className="text-xl font-black text-slate-800">
                        Gửi thông báo
                        mở lớp
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {
                        selectedClass.classCode
                      }{" "}
                      ·{" "}
                      {
                        selectedClass.courseCode
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeSendModal
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* BODY */}

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="space-y-6 px-6 py-5">

                    {/* CLASS INFO */}

                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <School
                          size={20}
                          className="mt-0.5 shrink-0 text-orange-500"
                        />

                        <div>
                          <p className="font-bold text-slate-800">
                            {
                              selectedClass.classCode
                            }
                          </p>

                          <p className="mt-1 text-sm font-semibold text-orange-600">
                            {
                              selectedClass.courseCode
                            }{" "}
                            -{" "}
                            {
                              selectedClass.courseName
                            }
                          </p>

                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {
                              selectedClass.startDate
                            }{" "}
                            -{" "}
                            {
                              selectedClass.endDate
                            }

                            {" · "}

                            {
                              selectedClass.schedule
                            }

                            {" · "}

                            {
                              selectedClass.location
                            }
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* RECIPIENT */}

                    <section>
                      <h3 className="font-bold text-slate-800">
                        1. Đối tượng
                        nhận thông báo
                      </h3>

                      <div className="mt-4 space-y-3">
                        {selectedClass
                          .source ===
                          "AI" &&
                          selectedClass
                            .suggestedStudents
                            .length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setRecipientMode(
                                  "AI_SUGGESTED",
                                )
                              }
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                recipientMode ===
                                "AI_SUGGESTED"
                                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-3">
                                  <BrainCircuit
                                    size={
                                      20
                                    }
                                    className="mt-0.5 shrink-0 text-violet-600"
                                  />

                                  <div>
                                    <p className="font-bold text-slate-800">
                                      Sinh
                                      viên
                                      trong
                                      đề
                                      xuất
                                      AI
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                      Gửi
                                      đến{" "}
                                      {
                                        selectedClass
                                          .suggestedStudents
                                          .length
                                      }{" "}
                                      sinh
                                      viên
                                      AI đã
                                      đề
                                      xuất
                                      cho
                                      lớp
                                      này.
                                    </p>
                                  </div>
                                </div>

                                {recipientMode ===
                                  "AI_SUGGESTED" && (
                                  <CheckCircle2
                                    size={
                                      19
                                    }
                                    className="shrink-0 text-violet-600"
                                  />
                                )}
                              </div>
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() =>
                            setRecipientMode(
                              "ALL_STUDENTS",
                            )
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            recipientMode ===
                            "ALL_STUDENTS"
                              ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <Users
                                size={
                                  20
                                }
                                className="mt-0.5 shrink-0 text-orange-500"
                              />

                              <div>
                                <p className="font-bold text-slate-800">
                                  Sinh viên
                                  có nhu cầu
                                  đăng ký
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  Gửi thông
                                  báo mở lớp
                                  để sinh
                                  viên có
                                  nhu cầu
                                  xem và
                                  đăng ký.
                                </p>
                              </div>
                            </div>

                            {recipientMode ===
                              "ALL_STUDENTS" && (
                              <CheckCircle2
                                size={19}
                                className="shrink-0 text-orange-500"
                              />
                            )}
                          </div>
                        </button>
                      </div>
                    </section>

                    {/* MESSAGE */}

                    <section>
                      <h3 className="font-bold text-slate-800">
                        2. Nội dung
                        thông báo
                      </h3>

                      <label className="mt-4 block">
                        <span className="text-sm font-semibold text-slate-700">
                          Tiêu đề
                        </span>

                        <input
                          value={title}
                          onChange={(
                            event,
                          ) =>
                            setTitle(
                              event.target
                                .value,
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                        />
                      </label>

                      <label className="mt-4 block">
                        <span className="text-sm font-semibold text-slate-700">
                          Nội dung
                        </span>

                        <textarea
                          rows={10}
                          value={content}
                          onChange={(
                            event,
                          ) =>
                            setContent(
                              event.target
                                .value,
                            )
                          }
                          className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-400"
                        />
                      </label>
                    </section>

                    {/* AI STUDENTS */}

                    {recipientMode ===
                      "AI_SUGGESTED" &&
                      selectedClass
                        .suggestedStudents
                        .length >
                        0 && (
                        <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                          <div className="flex items-center gap-2">
                            <BrainCircuit
                              size={18}
                              className="text-violet-600"
                            />

                            <h3 className="font-bold text-violet-800">
                              Người
                              nhận
                            </h3>
                          </div>

                          <div className="mt-3 space-y-2">
                            {selectedClass.suggestedStudents.map(
                              (
                                student,
                              ) => (
                                <div
                                  key={
                                    student.studentCode
                                  }
                                  className="rounded-xl bg-white px-4 py-3"
                                >
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
                              ),
                            )}
                          </div>
                        </section>
                      )}
                  </div>
                </div>

                {/* FOOTER */}

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={
                      closeSendModal
                    }
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={
                      sendNotification
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    <Send size={17} />

                    Gửi thông báo
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

export default EducationClassNotifications;