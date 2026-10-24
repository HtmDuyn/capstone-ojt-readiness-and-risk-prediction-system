import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Plus,
  Save,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";
import API from "@/service/api";
import {
  academicService,
  type AcademicYear,
  type AcademicPeriod,
} from "@/service/academic.service";

// =========================================================
// TYPES
// =========================================================

type TermName = "Fall" | "Spring" | "Summer";

type TermStatus =
  | "Đã kết thúc"
  | "Đang diễn ra"
  | "Đang chuẩn bị"
  | "Chưa cấu hình";

interface TermConfig {
  id: string;
  name: TermName;
  startDate: string;
  endDate: string;
}

interface ListResponse<T> {
  success: boolean;
  items: T[];
  page: number;
  limit: number;
  total: number;
  message?: string;
}

interface ToastState {
  type: "success" | "error";
  message: string;
}

const STATUS_STYLE: Record<TermStatus, string> = {
  "Đã kết thúc": "border-slate-200 bg-slate-100 text-slate-600",
  "Đang diễn ra": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Đang chuẩn bị": "border-orange-200 bg-orange-50 text-orange-700",
  "Chưa cấu hình": "border-slate-200 bg-white text-slate-500",
};

// =========================================================
// DATE & ACADEMIC YEAR HELPERS
// =========================================================

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value: string): string => {
  if (!value) return "Chưa thiết lập";

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addOneDay = (dateString: string): string => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  return formatLocalDate(addDays(new Date(year, month - 1, day), 1));
};

const getFirstMondayOfMonth = (year: number, monthIndex: number): Date => {
  const date = new Date(year, monthIndex, 1);

  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }

  return date;
};

const getSecondMondayOfMonth = (year: number, monthIndex: number): Date => {
  return addDays(getFirstMondayOfMonth(year, monthIndex), 7);
};

const getAutoAcademicYears = (): string[] => {
  const currentYear = new Date().getFullYear();

  return [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear + 2}-${currentYear + 3}`,
  ];
};

// Hỗ trợ cả 2026-2027 và DEMO-2026-2027
const getAcademicYearRange = (yearCode: string) => {
  const match = yearCode.match(/(\d{4})-(\d{4})$/);

  if (!match) {
    throw new Error(`Mã năm học không hợp lệ: ${yearCode}`);
  }

  return {
    startYear: Number(match[1]),
    endYear: Number(match[2]),
  };
};

const getTermYear = (termName: TermName, yearCode: string): number => {
  const { startYear, endYear } = getAcademicYearRange(yearCode);

  return termName === "Fall" ? startYear : endYear;
};

const getTermDisplayName = (termName: TermName, yearCode: string): string => {
  return `${termName} ${getTermYear(termName, yearCode)}`;
};

const getTermPeriodCode = (termName: TermName, yearCode: string): string => {
  return `${termName.toUpperCase()}${getTermYear(termName, yearCode)}`;
};

// Ngày gợi ý trên FE.
// Chỉ xem là đã cấu hình khi tìm thấy kỳ ở BE.
const createDefaultTerms = (yearCode: string): TermConfig[] => {
  const { startYear, endYear } = getAcademicYearRange(yearCode);

  const fallStart = getFirstMondayOfMonth(startYear, 8);

  const springStart = getFirstMondayOfMonth(endYear, 0);

  const summerStart = getSecondMondayOfMonth(endYear, 4);

  return [
    {
      id: "fall",
      name: "Fall",
      startDate: formatLocalDate(fallStart),
      endDate: formatLocalDate(addDays(fallStart, 68)),
    },
    {
      id: "spring",
      name: "Spring",
      startDate: formatLocalDate(springStart),
      endDate: formatLocalDate(addDays(springStart, 83)),
    },
    {
      id: "summer",
      name: "Summer",
      startDate: formatLocalDate(summerStart),
      endDate: formatLocalDate(addDays(summerStart, 76)),
    },
  ];
};

const getTermStatus = (
  term: TermConfig,
  today: string,
  configured: boolean,
): TermStatus => {
  if (!configured || !term.startDate || !term.endDate) {
    return "Chưa cấu hình";
  }

  if (today < term.startDate) {
    return "Đang chuẩn bị";
  }

  if (today > term.endDate) {
    return "Đã kết thúc";
  }

  return "Đang diễn ra";
};

// =========================================================
// API HELPERS
//
// API trong service/api.ts đã có /api ở baseURL.
// Truyền đường dẫn tài nguyên vào Axios.
// =========================================================

const fetchAllListItems = async <T,>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T[]> => {
  const allItems: T[] = [];
  const limit = 100;

  for (let page = 1; page <= 200; page++) {
    const response = await API.get<unknown>(endpoint, {
      params: { page, limit },
      signal,
    });

    const raw = response.data;

    const outer =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;

    if (outer?.success === false) {
      throw new Error(
        typeof outer.message === "string"
          ? outer.message
          : "Không thể tải dữ liệu từ Backend.",
      );
    }

    const data = outer && "data" in outer ? outer.data : raw;

    // Backend trả trực tiếp một mảng.
    if (Array.isArray(data)) {
      return data as T[];
    }

    const result =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;

    const items = result?.items;

    if (!Array.isArray(items)) {
      throw new Error(
        "Cấu trúc danh sách Backend trả về không đúng định dạng.",
      );
    }

    allItems.push(...(items as T[]));

    const total = typeof result?.total === "number" ? result.total : undefined;

    if (
      items.length === 0 ||
      items.length < limit ||
      (total !== undefined && allItems.length >= total)
    ) {
      return allItems;
    }
  }

  throw new Error("Không thể tải hết danh sách dữ liệu.");
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.status === 401) {
      return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.";
    }

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

// =========================================================
// COMPONENT
// =========================================================

const EducationAcademicYear: React.FC = () => {
  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [academicYear, setAcademicYear] = React.useState<string>(() => {
    const currentYear = new Date().getFullYear();

    return `${currentYear}-${currentYear + 1}`;
  });

  const [today, setToday] = React.useState(() => formatLocalDate(new Date()));

  const [toast, setToast] = React.useState<ToastState | null>(null);

  const [isCreatingYear, setIsCreatingYear] = React.useState(false);

  const [isSavingTerm, setIsSavingTerm] = React.useState(false);

  // Bản nháp riêng trong modal.
  // Nhấn Hủy sẽ không làm thay đổi danh sách.
  const [selectedTerm, setSelectedTerm] = React.useState<TermConfig | null>(
    null,
  );

  // =====================================================
  // API STATE
  // =====================================================

  const [academicYearsData, setAcademicYearsData] = React.useState<
    AcademicYear[]
  >([]);

  const [academicPeriodsData, setAcademicPeriodsData] = React.useState<
    AcademicPeriod[]
  >([]);

  const [isLoadingYears, setIsLoadingYears] = React.useState(true);

  const [isLoadingPeriods, setIsLoadingPeriods] = React.useState(false);

  const [yearsLoadError, setYearsLoadError] = React.useState<string | null>(
    null,
  );

  const [periodsLoadError, setPeriodsLoadError] = React.useState<string | null>(
    null,
  );

  const [reloadYearsKey, setReloadYearsKey] = React.useState(0);

  const [reloadPeriodsKey, setReloadPeriodsKey] = React.useState(0);

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = React.useCallback(
    (type: "success" | "error", message: string) => {
      setToast({
        type,
        message,
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  // =====================================================
  // CURRENT DATE
  // =====================================================

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday(formatLocalDate(new Date()));
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // =====================================================
  // LOAD ACADEMIC YEARS
  // GET /api/academic-years
  // =====================================================

  React.useEffect(() => {
    const controller = new AbortController();

    const loadAcademicYears = async () => {
      setIsLoadingYears(true);
      setYearsLoadError(null);

      try {
        const years = await fetchAllListItems<AcademicYear>(
          "/academic-years",
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setAcademicYearsData(years);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setYearsLoadError(
            getApiErrorMessage(error, "Không thể tải danh sách năm học."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingYears(false);
        }
      }
    };

    void loadAcademicYears();

    return () => {
      controller.abort();
    };
  }, [reloadYearsKey]);

  // =====================================================
  // CURRENT ACADEMIC YEAR
  // =====================================================

  const currentAcademicYear = academicYearsData.find(
    (year) => year.yearCode === academicYear,
  );

  const currentAcademicYearId = currentAcademicYear?.id;

  // =====================================================
  // LOAD ACADEMIC PERIODS
  // GET /api/academic-periods
  // =====================================================

  React.useEffect(() => {
    if (!currentAcademicYearId || yearsLoadError) {
      setAcademicPeriodsData([]);
      setPeriodsLoadError(null);
      setIsLoadingPeriods(false);
      return;
    }

    const controller = new AbortController();

    const loadAcademicPeriods = async () => {
      setIsLoadingPeriods(true);
      setPeriodsLoadError(null);
      setAcademicPeriodsData([]);

      try {
        const allPeriods = await fetchAllListItems<AcademicPeriod>(
          "/academic-periods",
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        // API có thể trả nhiều năm học
        // và cả kỳ BLOCK3.
        // Chỉ lấy SEMESTER của năm đang chọn.
        setAcademicPeriodsData(
          allPeriods.filter(
            (period) =>
              period.academicYearId === currentAcademicYearId &&
              period.kind === "SEMESTER",
          ),
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setPeriodsLoadError(
            getApiErrorMessage(error, "Không thể tải danh sách kỳ học."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPeriods(false);
        }
      }
    };

    void loadAcademicPeriods();

    return () => {
      controller.abort();
    };
  }, [currentAcademicYearId, yearsLoadError, reloadPeriodsKey]);

  // =====================================================
  // DERIVED DATA
  // =====================================================

  const availableAcademicYears = Array.from(
    new Set([
      ...getAutoAcademicYears(),
      ...academicYearsData
        .map((year) => year.yearCode)
        .filter((yearCode) => /(\d{4})-(\d{4})$/.test(yearCode)),
    ]),
  );

  // Nếu kỳ đã có trong DB:
  // lấy ngày bắt đầu/kết thúc từ DB.
  //
  // Nếu chưa có:
  // sử dụng ngày dự kiến của FE.
  const terms = createDefaultTerms(academicYear).map((term) => {
    const periodCode = getTermPeriodCode(term.name, academicYear);

    const period = academicPeriodsData.find(
      (item) =>
        item.academicYearId === currentAcademicYearId &&
        item.periodCode === periodCode,
    );

    return period
      ? {
          ...term,
          startDate: period.startDate,
          endDate: period.endDate,
        }
      : term;
  });

  const isTermConfigured = (term: TermConfig): boolean => {
    if (!currentAcademicYearId) {
      return false;
    }

    const periodCode = getTermPeriodCode(term.name, academicYear);

    return academicPeriodsData.some(
      (period) =>
        period.academicYearId === currentAcademicYearId &&
        period.periodCode === periodCode,
    );
  };

  // =====================================================
  // TERM HELPERS
  // =====================================================

  const getPreviousTerm = (termId: string): TermConfig | null => {
    const index = terms.findIndex((term) => term.id === termId);

    return index > 0 ? terms[index - 1] : null;
  };

  const getMinimumStartDate = (termId: string): string => {
    const previousTerm = getPreviousTerm(termId);

    return previousTerm?.endDate ? addOneDay(previousTerm.endDate) : "";
  };

  const handleOpenTerm = (termId: string) => {
    const term = terms.find((item) => item.id === termId);

    if (term) {
      setSelectedTerm({ ...term });
    }
  };

  const handleCloseTerm = () => {
    if (!isSavingTerm) {
      setSelectedTerm(null);
    }
  };

  const updateSelectedTerm = (
    field: "startDate" | "endDate",
    value: string,
  ) => {
    setSelectedTerm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : null,
    );
  };

  // =====================================================
  // CREATE ACADEMIC YEAR
  // =====================================================

  const handleCreateAcademicYear = async () => {
    if (isCreatingYear) return;

    if (isLoadingYears || yearsLoadError) {
      showToast("error", "Chưa tải được danh sách năm học. Vui lòng thử lại.");
      return;
    }

    if (currentAcademicYear) {
      showToast("error", `Năm học ${academicYear} đã tồn tại.`);
      return;
    }

    try {
      setIsCreatingYear(true);

      const { startYear, endYear } = getAcademicYearRange(academicYear);

      const createdYear = await academicService.createAcademicYear({
        yearCode: academicYear,
        startDate: `${startYear}-09-01`,
        endDate: `${endYear}-08-31`,
        status: "PLANNED",
      });

      setAcademicYearsData((current) =>
        current.some((year) => year.id === createdYear.id)
          ? current
          : [...current, createdYear],
      );

      showToast(
        "success",
        `Khởi tạo năm học ${createdYear.yearCode} thành công.`,
      );
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Không thể khởi tạo năm học."),
      );
    } finally {
      setIsCreatingYear(false);
    }
  };

  // =====================================================
  // SAVE ACADEMIC PERIOD
  // =====================================================

  const handleSaveTerm = async () => {
    if (!selectedTerm || isSavingTerm) {
      return;
    }

    if (
      isLoadingYears ||
      yearsLoadError ||
      isLoadingPeriods ||
      periodsLoadError
    ) {
      showToast("error", "Chưa tải được dữ liệu kỳ học. Vui lòng thử lại.");
      return;
    }

    if (!currentAcademicYear) {
      showToast("error", "Vui lòng khởi tạo năm học trước.");
      return;
    }

    if (!selectedTerm.startDate || !selectedTerm.endDate) {
      showToast("error", "Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }

    if (selectedTerm.endDate <= selectedTerm.startDate) {
      showToast("error", "Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const minimumStartDate = getMinimumStartDate(selectedTerm.id);

    if (minimumStartDate && selectedTerm.startDate < minimumStartDate) {
      showToast(
        "error",
        `${getTermDisplayName(
          selectedTerm.name,
          academicYear,
        )} phải bắt đầu từ ${formatDate(minimumStartDate)} trở đi.`,
      );
      return;
    }

    const periodCode = getTermPeriodCode(selectedTerm.name, academicYear);

    const periodName =
      `Kỳ chuyên ngành ${selectedTerm.name} ` +
      getTermYear(selectedTerm.name, academicYear);

    try {
      setIsSavingTerm(true);

      // BƯỚC 1:
      // Gọi GET để kiểm tra kỳ đã tồn tại.
      // Không chỉ dựa vào state danh sách.
      const existingPeriod = await academicService.findAcademicPeriod(
        currentAcademicYear.id,
        periodCode,
      );

      if (existingPeriod) {
        // BƯỚC 2A:
        // Đã tồn tại -> PATCH theo ID.
        // Chỉ gửi ngày thực sự thay đổi.

        const changes: {
          startDate?: string;
          endDate?: string;
        } = {};

        if (selectedTerm.startDate !== existingPeriod.startDate) {
          changes.startDate = selectedTerm.startDate;
        }

        if (selectedTerm.endDate !== existingPeriod.endDate) {
          changes.endDate = selectedTerm.endDate;
        }

        if (Object.keys(changes).length === 0) {
          showToast("success", "Kỳ học không có thay đổi nào cần lưu.");

          setSelectedTerm(null);
          return;
        }

        await academicService.updateAcademicPeriod(existingPeriod.id, changes);

        showToast("success", `Cập nhật kỳ ${periodName} thành công.`);
      } else {
        // BƯỚC 2B:
        // Chưa tồn tại -> POST tạo mới.

        await academicService.createAcademicPeriod({
          academicYearId: currentAcademicYear.id,
          periodCode,
          name: periodName,
          kind: "SEMESTER",
          startDate: selectedTerm.startDate,
          endDate: selectedTerm.endDate,
          status: "PLANNED",
        });

        showToast("success", `Tạo kỳ ${periodName} thành công.`);
      }

      // BƯỚC 3:
      // Đọc lại dữ liệu thật từ Backend.
      setSelectedTerm(null);

      setReloadPeriodsKey((current) => current + 1);
    } catch (error) {
      // Lỗi 409 đã được dịch sang tiếng Việt
      // trong academic.service.ts.
      showToast(
        "error",
        getApiErrorMessage(error, "Không thể lưu cấu hình kỳ học."),
      );
    } finally {
      setIsSavingTerm(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* ================================================
          TOAST
          ================================================ */}

      {toast && (
        <div className="fixed right-6 top-6 z-[9999] w-[360px] max-w-[calc(100vw-3rem)]">
          <div
            className={`overflow-hidden rounded-2xl border bg-white shadow-2xl ${
              toast.type === "success" ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div
              className={`h-1 w-full ${
                toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
              }`}
            />

            <div className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  toast.type === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <span className="text-lg font-black">!</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${
                    toast.type === "success"
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {toast.type === "success"
                    ? "Thành công"
                    : "Không thể thực hiện"}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Đóng thông báo"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          PAGE BANNER
          ================================================ */}

      <PageBanner
        title="Khởi tạo Năm học"
        description="Thiết lập năm học và thời gian bắt đầu, kết thúc của từng kỳ học."
        badge="Quản lý dữ liệu"
      />

      {/* ================================================
          YEAR SECTION
          ================================================ */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Thông tin năm học</h2>

        <p className="mt-1 text-sm text-slate-500">
          Một năm học gồm 3 kỳ: Fall, Spring và Summer. Mỗi kỳ được cấu hình
          riêng khi nhà trường chuẩn bị kỳ học đó.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-xs">
            <label
              htmlFor="academic-year-select"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Năm học
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="academic-year-select"
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);
                  setSelectedTerm(null);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {availableAcademicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingYears ? (
            <div className="inline-flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-500">
              Đang kiểm tra...
            </div>
          ) : yearsLoadError ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-red-600">
                Không thể kiểm tra năm học: {yearsLoadError}
              </p>

              <button
                type="button"
                onClick={() => setReloadYearsKey((current) => current + 1)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Thử lại
              </button>
            </div>
          ) : currentAcademicYear ? (
            <div className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              Đã khởi tạo
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCreateAcademicYear}
              disabled={isCreatingYear}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />

              {isCreatingYear ? "Đang khởi tạo..." : "Khởi tạo năm học"}
            </button>
          )}
        </div>
      </section>

      {/* ================================================
          TERMS SECTION
          ================================================ */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Các kỳ trong năm {academicYear}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          PĐT cấu hình từng kỳ khi chuẩn bị đưa kỳ đó vào vận hành.
        </p>

        {isLoadingYears ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
            Đang tải thông tin năm học...
          </div>
        ) : yearsLoadError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
            Không thể tải dữ liệu năm học. Vui lòng thử lại.
          </div>
        ) : !currentAcademicYear ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <CalendarDays size={34} className="mx-auto text-slate-300" />

            <p className="mt-3 font-semibold text-slate-600">
              Năm học {academicYear} chưa được khởi tạo
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Hãy khởi tạo năm học trước khi thiết lập các kỳ học.
            </p>
          </div>
        ) : isLoadingPeriods ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            Đang tải các kỳ học từ hệ thống...
          </div>
        ) : periodsLoadError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm text-red-700">
              Không thể tải danh sách kỳ học: {periodsLoadError}
            </p>

            <button
              type="button"
              onClick={() => setReloadPeriodsKey((current) => current + 1)}
              className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {terms.map((term) => {
              const configured = isTermConfigured(term);
              const realtimeStatus = getTermStatus(term, today, configured);

              return (
                <div
                  key={term.id}
                  className="
        grid grid-cols-1 gap-x-6 gap-y-4
        rounded-2xl border border-slate-200
        bg-white p-5
        transition-all duration-200
        hover:border-orange-200 hover:bg-orange-50/20
        xl:grid-cols-[minmax(220px,1.2fr)_minmax(160px,0.75fr)_minmax(310px,1.5fr)_auto]
        xl:items-center
      "
                >
                  {/* CỘT 1: TÊN KỲ HỌC */}
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <CalendarDays size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-800">
                        {getTermDisplayName(term.name, academicYear)}
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-400">
                        Học kỳ chuyên ngành
                      </p>
                    </div>
                  </div>

                  {/* CỘT 2: TRẠNG THÁI */}
                  <div
                    className="
          flex min-w-0 flex-col items-start justify-center
          border-t border-slate-100 pt-4
          xl:border-l xl:border-t-0 xl:py-1 xl:pl-6
        "
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Trạng thái
                    </p>

                    <span
                      className={`
            inline-flex items-center
            whitespace-nowrap rounded-full
            border px-3 py-1.5
            text-xs font-semibold
            ${STATUS_STYLE[realtimeStatus]}
          `}
                    >
                      {realtimeStatus}
                    </span>
                  </div>

                  {/* CỘT 3: THỜI GIAN HỌC */}
                  <div
                    className="
          flex min-w-0 flex-col justify-center
          border-t border-slate-100 pt-4
          xl:border-l xl:border-t-0 xl:py-1 xl:pl-6
        "
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {configured ? "Thời gian học" : "Thời gian dự kiến"}
                    </p>

                    {term.startDate && term.endDate ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-slate-400">Từ</span>

                          <span className="text-sm font-semibold text-slate-800">
                            {formatDate(term.startDate)}
                          </span>
                        </div>

                        <span className="text-slate-300">→</span>

                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs text-slate-400">Đến</span>

                          <span className="text-sm font-semibold text-slate-800">
                            {formatDate(term.endDate)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Chưa thiết lập thời gian học
                      </p>
                    )}
                  </div>

                  {/* CỘT 4: THAO TÁC */}
                  <div className="flex items-center xl:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenTerm(term.id)}
                      className="
            inline-flex w-full items-center justify-center
            gap-2 whitespace-nowrap
            rounded-xl border border-slate-200
            bg-white px-4 py-2.5
            text-sm font-semibold text-slate-700
            transition-all duration-200
            hover:border-orange-300
            hover:bg-orange-50
            hover:text-orange-600
            xl:w-auto
          "
                    >
                      {configured ? "Xem / chỉnh sửa" : "Thiết lập kỳ"}

                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================
          TERM CONFIG MODAL
          ================================================ */}

      {selectedTerm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={handleCloseTerm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Thiết lập ${getTermDisplayName(
              selectedTerm.name,
              academicYear,
            )}`}
            className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Thiết lập{" "}
                  {getTermDisplayName(selectedTerm.name, academicYear)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Cấu hình ngày bắt đầu và ngày kết thúc học kỳ.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseTerm}
                disabled={isSavingTerm}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="px-6 py-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={19} className="text-orange-500" />

                <h3 className="font-bold text-slate-800">Thời gian học</h3>
              </div>

              {getPreviousTerm(selectedTerm.id) && (
                <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Ngày bắt đầu sớm nhất theo thời gian của kỳ trước:{" "}
                    <strong className="text-orange-700">
                      {formatDate(getMinimumStartDate(selectedTerm.id))}
                    </strong>
                    .
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* NGÀY BẮT ĐẦU */}

                <div>
                  <label
                    htmlFor="term-start-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Ngày bắt đầu học
                  </label>

                  <input
                    id="term-start-date"
                    type="date"
                    min={getMinimumStartDate(selectedTerm.id) || undefined}
                    value={selectedTerm.startDate}
                    disabled={isSavingTerm}
                    onChange={(event) =>
                      updateSelectedTerm("startDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                  />
                </div>

                {/* NGÀY KẾT THÚC */}

                <div>
                  <label
                    htmlFor="term-end-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Ngày kết thúc học
                  </label>

                  <input
                    id="term-end-date"
                    type="date"
                    min={
                      selectedTerm.startDate
                        ? addOneDay(selectedTerm.startDate)
                        : undefined
                    }
                    value={selectedTerm.endDate}
                    disabled={isSavingTerm}
                    onChange={(event) =>
                      updateSelectedTerm("endDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseTerm}
                disabled={isSavingTerm}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveTerm}
                disabled={
                  isSavingTerm || isLoadingPeriods || Boolean(periodsLoadError)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {isSavingTerm ? "Đang lưu..." : "Lưu cấu hình kỳ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationAcademicYear;
