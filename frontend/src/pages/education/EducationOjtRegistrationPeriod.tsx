import React from "react";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCcw,
  UsersRound,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

import {
  academicService,
  type AcademicPeriod,
  type OjtSemester,
} from "@/service/academic.service";

import {
  curriculumService,
  type CurriculumSummary,
} from "@/service/curriculum.service";

import {
  ojtRegistrationWindowService,
  type OjtRegistrationWindow,
} from "@/service/ojtRegistrationWindow.service";

/* =========================================================
   HELPERS
   ========================================================= */

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";

    case "OPEN":
      return "Đang mở";

    case "CLOSED":
      return "Đã đóng";

    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "OPEN":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationOjtRegistrationPeriod: React.FC = () => {
  /* ===================== SEMESTERS ===================== */

  const [semesters, setSemesters] = React.useState<OjtSemester[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = React.useState<
    number | null
  >(null);

  const [loadingSemesters, setLoadingSemesters] = React.useState(true);

  /* ===================== WINDOWS ===================== */

  const [windows, setWindows] = React.useState<OjtRegistrationWindow[]>([]);

  const [loadingWindows, setLoadingWindows] = React.useState(false);

  /* ===================== MESSAGE ===================== */

  const [errorMessage, setErrorMessage] = React.useState("");
  const [openingWindowId, setOpeningWindowId] = React.useState<number | null>(
    null,
  );

  const [confirmOpenWindow, setConfirmOpenWindow] =
    React.useState<OjtRegistrationWindow | null>(null);
  const [openErrorMessage, setOpenErrorMessage] = React.useState("");

  const [successMessage, setSuccessMessage] = React.useState("");
  const [closingWindowId, setClosingWindowId] = React.useState<number | null>(
    null,
  );

  const [confirmCloseWindow, setConfirmCloseWindow] =
    React.useState<OjtRegistrationWindow | null>(null);

  const [closeErrorMessage, setCloseErrorMessage] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const [creatingWindow, setCreatingWindow] = React.useState(false);

  const [createErrorMessage, setCreateErrorMessage] = React.useState("");

  const [academicPeriods, setAcademicPeriods] = React.useState<
    AcademicPeriod[]
  >([]);

  const [programs, setPrograms] = React.useState<CurriculumSummary[]>([]);

  const [loadingCreateOptions, setLoadingCreateOptions] = React.useState(false);

  const [createForm, setCreateForm] = React.useState({
    academicPeriodId: "",
    programIds: [] as number[],
    name: "",
    startsAt: "",
    endsAt: "",
    reason: "",
    requiredRelativeSemester: 5,
  });
  /* =====================================================
       LOAD OJT SEMESTERS
       ===================================================== */

  React.useEffect(() => {
    const loadSemesters = async () => {
      setLoadingSemesters(true);
      setErrorMessage("");

      try {
        const items = await academicService.searchOjtSemesters({
          page: 1,
          limit: 100,
        });

        const sorted = [...items].sort((a, b) => {
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        });

        setSemesters(sorted);

        if (sorted.length > 0) {
          setSelectedSemesterId(sorted[0].id);
        }
      } catch (error) {
        console.error("Load OJT semesters failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách kỳ OJT.",
        );
      } finally {
        setLoadingSemesters(false);
      }
    };

    void loadSemesters();
  }, []);

  /* =====================================================
       LOAD REGISTRATION WINDOWS
       ===================================================== */

  const loadWindows = React.useCallback(async () => {
    if (selectedSemesterId === null) {
      setWindows([]);
      return;
    }

    setLoadingWindows(true);
    setErrorMessage("");

    try {
      const response = await ojtRegistrationWindowService.searchWindows({
        ojtSemesterId: selectedSemesterId,

        page: 1,

        limit: 100,
      });

      const items = response.data.items ?? [];

      const sorted = [...items].sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setWindows(sorted);
    } catch (error) {
      console.error("Load registration windows failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đợt đăng ký OJT.",
      );
    } finally {
      setLoadingWindows(false);
    }
  }, [selectedSemesterId]);

  React.useEffect(() => {
    void loadWindows();
  }, [loadWindows]);
  /* =====================================================
   LOAD OPTIONS FOR CREATE REGISTRATION WINDOW
   ===================================================== */

  React.useEffect(() => {
    if (!showCreateModal) return;

    let cancelled = false;

    const loadCreateOptions = async () => {
      setLoadingCreateOptions(true);

      try {
        // 1. Tải năm học và các kỳ học đang ở trạng thái PLANNED.
        const academicYears = await academicService.searchAcademicYears();

        const periodResponses = await Promise.all(
          academicYears.map((year) =>
            academicService.searchAcademicPeriods({
              page: 1,
              limit: 100,
              search: "",
              status: "PLANNED",
              academicYearId: year.id,
              kind: "SEMESTER",
            }),
          ),
        );

        if (cancelled) return;

        setAcademicPeriods(
          periodResponses
            .flat()
            .sort((a, b) => a.startDate.localeCompare(b.startDate)),
        );

        // 2. Tải các chuyên ngành được hỗ trợ.
        const majorCodes = ["AI", "SE", "IA", "IS"] as const;

        const majorResponses = await Promise.all(
          majorCodes.map((code) =>
            curriculumService.searchMajors({
              page: 1,
              limit: 20,
              search: code,
            }),
          ),
        );

        const majors = Array.from(
          new Map(
            majorResponses
              .flatMap((response) => response.data.items)
              .filter((major) =>
                majorCodes.includes(major.code as (typeof majorCodes)[number]),
              )
              .map((major) => [major.id, major] as const),
          ).values(),
        );

        // 3. Tải chương trình đào tạo thuộc các chuyên ngành đó.
        const curriculumResponses = await Promise.all(
          majors.map((major) =>
            curriculumService.searchCurricula({
              page: 1,
              limit: 100,
              search: major.code,
              majorId: major.id,
            }),
          ),
        );

        if (cancelled) return;

        const loadedPrograms = Array.from(
          new Map(
            curriculumResponses
              .flatMap((response) => response.data.items)
              .map((program) => [program.id, program] as const),
          ).values(),
        ).sort((a, b) => a.code.localeCompare(b.code));

        setPrograms(loadedPrograms);
      } catch (error) {
        if (!cancelled) {
          setCreateErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải kỳ học và chương trình đào tạo.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCreateOptions(false);
        }
      }
    };

    void loadCreateOptions();

    return () => {
      cancelled = true;
    };
  }, [showCreateModal]);
  /* =====================================================
   CREATE MODAL
   ===================================================== */

  const handleOpenCreateModal = () => {
    if (!selectedSemester) {
      setErrorMessage("Vui lòng chọn kỳ OJT trước khi tạo đợt đăng ký.");

      return;
    }

    setCreateErrorMessage("");

    setCreateForm({
      academicPeriodId: "",
      programIds: [],
      name: `Đợt đăng ký ${selectedSemester.name}`,
      startsAt: "",
      endsAt: "",
      reason: `Mở đợt đăng ký ${selectedSemester.name}`,
      requiredRelativeSemester: 5,
    });

    setShowCreateModal(true);
  };
  /* =====================================================
   CREATE REGISTRATION WINDOW
   ===================================================== */

  const handleCreateWindow = async () => {
    if (creatingWindow) return;

    setCreateErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedSemester) {
      setCreateErrorMessage("Vui lòng chọn kỳ OJT.");
      return;
    }

    if (!createForm.name.trim()) {
      setCreateErrorMessage("Vui lòng nhập tên đợt đăng ký.");
      return;
    }

    if (!createForm.academicPeriodId) {
      setCreateErrorMessage("Vui lòng chọn kỳ học liên quan.");
      return;
    }

    if (createForm.programIds.length === 0) {
      setCreateErrorMessage("Vui lòng chọn ít nhất một chương trình đào tạo.");
      return;
    }

    if (!createForm.startsAt || !createForm.endsAt) {
      setCreateErrorMessage("Vui lòng nhập thời gian bắt đầu và kết thúc.");
      return;
    }

    if (!createForm.reason.trim()) {
      setCreateErrorMessage("Vui lòng nhập lý do tạo đợt đăng ký.");
      return;
    }

    if (
      !Number.isInteger(createForm.requiredRelativeSemester) ||
      createForm.requiredRelativeSemester < 1 ||
      createForm.requiredRelativeSemester > 9
    ) {
      setCreateErrorMessage("Kỳ tương đối của sinh viên phải từ 1 đến 9.");
      return;
    }

    const startsAt = new Date(createForm.startsAt);
    const endsAt = new Date(createForm.endsAt);
    const ojtStartTime = new Date(selectedSemester.startDate).getTime();

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      !Number.isFinite(ojtStartTime)
    ) {
      setCreateErrorMessage("Ngày giờ nhập vào không hợp lệ.");
      return;
    }

    if (endsAt.getTime() <= startsAt.getTime()) {
      setCreateErrorMessage("Hạn đăng ký phải sau thời gian bắt đầu đăng ký.");
      return;
    }

    if (endsAt.getTime() >= ojtStartTime) {
      setCreateErrorMessage("Hạn đăng ký phải trước ngày bắt đầu kỳ OJT.");
      return;
    }

    const academicPeriodId = Number(createForm.academicPeriodId);

    const selectedPeriod = academicPeriods.find(
      (period) => period.id === academicPeriodId,
    );

    if (
      !selectedPeriod ||
      new Date(selectedPeriod.endDate).getTime() >= ojtStartTime
    ) {
      setCreateErrorMessage(
        "Kỳ học liên quan phải kết thúc trước ngày bắt đầu kỳ OJT.",
      );
      return;
    }

    setCreatingWindow(true);

    try {
      await ojtRegistrationWindowService.createWindow({
        ojtSemesterId: selectedSemester.id,
        name: createForm.name.trim(),
        scope: {
          programIds: createForm.programIds,
        },
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: createForm.reason.trim(),
        academicPeriodId,
        requiredRelativeSemester: createForm.requiredRelativeSemester,
      });

      setShowCreateModal(false);

      setSuccessMessage(`Đã tạo "${createForm.name.trim()}" thành công.`);

      await loadWindows();
    } catch (error) {
      console.error("Create registration window failed:", error);

      setCreateErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo đợt đăng ký OJT.",
      );
    } finally {
      setCreatingWindow(false);
    }
  };
  /* =====================================================
   OPEN REGISTRATION WINDOW
   ===================================================== */

  const handleOpenWindow = async () => {
    if (!confirmOpenWindow) {
      return;
    }

    const currentWindow = confirmOpenWindow;

    setOpeningWindowId(currentWindow.id);

    setOpenErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await ojtRegistrationWindowService.openWindow({
        windowId: currentWindow.id,

        reason: "Phòng Đào tạo mở đợt đăng ký OJT",
      });

      setConfirmOpenWindow(null);

      setSuccessMessage(`Đã mở "${currentWindow.name}" thành công.`);

      await loadWindows();
    } catch (error) {
      console.error("Open registration window failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Không thể mở đợt đăng ký OJT.";

      // QUAN TRỌNG:
      // giữ modal mở để người dùng thấy lỗi.
      setOpenErrorMessage(message);
    } finally {
      setOpeningWindowId(null);
    }
  };
  /* =====================================================
   CLOSE REGISTRATION WINDOW
   ===================================================== */

  const handleCloseWindow = async () => {
    if (!confirmCloseWindow) {
      return;
    }

    const currentWindow = confirmCloseWindow;

    setClosingWindowId(currentWindow.id);

    setCloseErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await ojtRegistrationWindowService.closeWindow({
        windowId: currentWindow.id,

        reason: "Phòng Đào tạo đóng đợt đăng ký OJT",
      });

      setConfirmCloseWindow(null);

      setSuccessMessage(`Đã đóng "${currentWindow.name}" thành công.`);

      await loadWindows();
    } catch (error) {
      console.error("Close registration window failed:", error);

      setCloseErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể đóng đợt đăng ký OJT.",
      );
    } finally {
      setClosingWindowId(null);
    }
  };
  /* =====================================================
       DERIVED
       ===================================================== */

  const selectedSemester =
    semesters.find((semester) => semester.id === selectedSemesterId) ?? null;
  const eligibleAcademicPeriods = selectedSemester
    ? academicPeriods.filter((period) => {
        const periodEndTime = new Date(period.endDate).getTime();
        const ojtStartTime = new Date(selectedSemester.startDate).getTime();

        return (
          Number.isFinite(periodEndTime) &&
          Number.isFinite(ojtStartTime) &&
          periodEndTime < ojtStartTime
        );
      })
    : [];

  const draftCount = windows.filter(
    (windowItem) => windowItem.status === "DRAFT",
  ).length;

  const openCount = windows.filter(
    (windowItem) => windowItem.status === "OPEN",
  ).length;

  const closedCount = windows.filter(
    (windowItem) => windowItem.status === "CLOSED",
  ).length;

  /* =====================================================
       RENDER
       ===================================================== */

  return (
    <div className="space-y-6">
      {/* ================= BANNER ================= */}

      <PageBanner
        title="Mở đợt đăng ký OJT"
        description="Quản lý thời gian và phạm vi đăng ký OJT dành cho sinh viên."
        badge="Quản lý OJT"
      />
      {/* ================= SUCCESS ================= */}

      {successMessage && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />

            <span>{successMessage}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}
      {/* ================= ERROR ================= */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* ================= FILTER ================= */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <CalendarClock size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-600">Kỳ OJT</p>

            <h2 className="mt-1 text-lg font-semibold text-blue-900">
              Chọn kỳ OJT cần quản lý
            </h2>

            <p className="mt-1 text-sm text-blue-700">
              Danh sách các đợt đăng ký bên dưới sẽ thay đổi theo kỳ OJT được
              chọn.
            </p>

            <div className="mt-4 max-w-xl">
              <select
                value={selectedSemesterId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedSemesterId(value ? Number(value) : null);
                }}
                disabled={loadingSemesters}
                className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value="">
                  {loadingSemesters ? "Đang tải kỳ OJT..." : "Chọn kỳ OJT"}
                </option>

                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                    {" • "}
                    {semester.semesterCode}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SUMMARY ================= */}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bản nháp</p>

          <p className="mt-2 text-2xl font-bold text-amber-600">{draftCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Đang mở</p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {openCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Đã đóng</p>

          <p className="mt-2 text-2xl font-bold text-slate-600">
            {closedCount}
          </p>
        </div>
      </section>

      {/* ================= LIST ================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={selectedSemesterId === null}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Tạo đợt đăng ký
          </button>

          <button
            type="button"
            onClick={() => void loadWindows()}
            disabled={loadingWindows || selectedSemesterId === null}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={loadingWindows ? "animate-spin" : ""}
            />
            Làm mới
          </button>
        </div>

        {loadingWindows ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-orange-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Đang tải danh sách đợt đăng ký...
              </p>
            </div>
          </div>
        ) : windows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CalendarClock size={40} className="mx-auto text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-700">
              Chưa có đợt đăng ký
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Kỳ OJT này chưa có đợt đăng ký nào được tạo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {windows.map((windowItem) => (
              <div
                key={windowItem.id}
                className="p-5 transition hover:bg-slate-50/70"
              >
                <div className="flex flex-col justify-between gap-5 xl:flex-row">
                  {/* LEFT */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-800">
                        {windowItem.name}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          windowItem.status,
                        )}`}
                      >
                        {getStatusLabel(windowItem.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* TIME */}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-orange-500">
                          <Clock3 size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Thời gian đăng ký
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDateTime(windowItem.startsAt)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            đến {formatDateTime(windowItem.endsAt)}
                          </p>
                        </div>
                      </div>

                      {/* STUDENT SEMESTER */}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-blue-500">
                          <UsersRound size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Đối tượng
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            Sinh viên kỳ {windowItem.requiredRelativeSemester}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {windowItem.scope.programIds?.length ?? 0} chương
                            trình đào tạo
                          </p>
                        </div>
                      </div>

                      {/* CREATED */}

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-emerald-500">
                          <CheckCircle2 size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Khởi tạo
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDateTime(windowItem.createdAt)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {windowItem.status === "DRAFT"
                              ? "Chưa mở đăng ký"
                              : windowItem.status === "OPEN"
                                ? "Đang nhận đăng ký"
                                : "Đợt đã kết thúc"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}

                  <div className="flex shrink-0 items-center">
                    {windowItem.status === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenErrorMessage("");
                          setSuccessMessage("");

                          setConfirmOpenWindow(windowItem);
                        }}
                        disabled={openingWindowId === windowItem.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {openingWindowId === windowItem.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Đang mở...
                          </>
                        ) : (
                          "Mở đợt đăng ký"
                        )}
                      </button>
                    )}

                    {windowItem.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCloseErrorMessage("");
                          setSuccessMessage("");

                          setConfirmCloseWindow(windowItem);
                        }}
                        disabled={closingWindowId === windowItem.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {closingWindowId === windowItem.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Đang đóng...
                          </>
                        ) : (
                          "Đóng đợt đăng ký"
                        )}
                      </button>
                    )}
                    {windowItem.status === "CLOSED" && (
                      <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
                        Đã đóng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* ================= CREATE MODAL ================= */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <CalendarClock size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Tạo đợt đăng ký OJT
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Thiết lập thời gian đăng ký cho sinh viên thuộc kỳ OJT đang
                    chọn.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* KỲ OJT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kỳ OJT
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {selectedSemester
                    ? `${selectedSemester.name} • ${selectedSemester.semesterCode}`
                    : "Chưa chọn kỳ OJT"}
                </div>
              </div>
              {/* KỲ HỌC LIÊN QUAN */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kỳ học liên quan
                </label>

                <select
                  value={createForm.academicPeriodId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      academicPeriodId: event.target.value,
                    }))
                  }
                  disabled={loadingCreateOptions}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                >
                  <option value="">
                    {loadingCreateOptions
                      ? "Đang tải kỳ học..."
                      : "Chọn kỳ học"}
                  </option>

                  {eligibleAcademicPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} • {period.periodCode} • Kết thúc{" "}
                      {period.endDate}
                    </option>
                  ))}
                </select>

                {!loadingCreateOptions &&
                  eligibleAcademicPeriods.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Không tìm thấy kỳ học phù hợp kết thúc trước kỳ OJT này.
                    </p>
                  )}
              </div>
              {/* TÊN */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tên đợt đăng ký
                </label>

                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  placeholder="Ví dụ: Đợt đăng ký OJT Fall 2026"
                />
              </div>

              {/* TIME */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bắt đầu đăng ký
                  </label>

                  <input
                    type="datetime-local"
                    value={createForm.startsAt}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Hạn đăng ký
                  </label>

                  <input
                    type="datetime-local"
                    value={createForm.endsAt}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        endsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* SEMESTER */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kỳ tương đối của sinh viên
                </label>

                <input
                  type="number"
                  min={1}
                  max={9}
                  value={createForm.requiredRelativeSemester}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      requiredRelativeSemester: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Theo nghiệp vụ hiện tại, sinh viên thường đăng ký OJT từ kỳ 5.
                </p>
              </div>

              {/* REASON */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Lý do
                </label>

                <textarea
                  rows={3}
                  value={createForm.reason}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {createErrorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    Không thể tạo đợt đăng ký
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {createErrorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creatingWindow}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
              >
                Tạo đợt đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= OPEN CONFIRM MODAL ================= */}

      {confirmOpenWindow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarClock size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Xác nhận mở đợt đăng ký
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Sau khi mở, sinh viên thuộc phạm vi áp dụng có thể tham gia
                    đăng ký OJT theo quy định của hệ thống.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  {confirmOpenWindow.name}
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Bắt đầu</span>

                    <span className="text-right font-medium text-slate-700">
                      {formatDateTime(confirmOpenWindow.startsAt)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Kết thúc</span>

                    <span className="text-right font-medium text-slate-700">
                      {formatDateTime(confirmOpenWindow.endsAt)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Sinh viên áp dụng</span>

                    <span className="text-right font-medium text-slate-700">
                      Kỳ {confirmOpenWindow.requiredRelativeSemester}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">CTĐT áp dụng</span>

                    <span className="text-right font-medium text-slate-700">
                      {confirmOpenWindow.scope.programIds?.length ?? 0} chương
                      trình
                    </span>
                  </div>
                </div>
              </div>
              {openErrorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    Không thể mở đợt đăng ký
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {openErrorMessage}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                Hệ thống sẽ kiểm tra điều kiện nghiệp vụ trước khi chuyển đợt từ{" "}
                <strong>Bản nháp</strong> sang <strong>Đang mở</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmOpenWindow(null)}
                disabled={openingWindowId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => void handleOpenWindow()}
                disabled={openingWindowId !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openingWindowId !== null ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận mở đợt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= CLOSE CONFIRM MODAL ================= */}

      {confirmCloseWindow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <CalendarClock size={21} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Xác nhận đóng đợt đăng ký
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Sau khi đóng, sinh viên sẽ không thể tiếp tục gửi đăng ký
                    trong đợt này.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  {confirmCloseWindow.name}
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Trạng thái hiện tại</span>

                    <span className="font-semibold text-emerald-600">
                      Đang mở
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Bắt đầu</span>

                    <span className="text-right font-medium text-slate-700">
                      {formatDateTime(confirmCloseWindow.startsAt)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Hạn đăng ký</span>

                    <span className="text-right font-medium text-slate-700">
                      {formatDateTime(confirmCloseWindow.endsAt)}
                    </span>
                  </div>
                </div>
              </div>

              {closeErrorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">
                    Không thể đóng đợt đăng ký
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {closeErrorMessage}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                Thao tác này sẽ chuyển đợt từ <strong>Đang mở</strong> sang{" "}
                <strong>Đã đóng</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmCloseWindow(null)}
                disabled={closingWindowId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => void handleCloseWindow()}
                disabled={closingWindowId !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {closingWindowId !== null ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đóng đợt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtRegistrationPeriod;
