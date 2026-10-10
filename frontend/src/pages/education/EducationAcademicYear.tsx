import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";
import { getGovernmentHolidays } from "@/services/governmentHoliday.service";
import {
  academicService,
  type AcademicYear,
  type AcademicPeriod,
} from "@/service/academic.service";

/* =========================================================
   TYPES
   ========================================================= */

type TermStatus =
  | "Đã kết thúc"
  | "Đang diễn ra"
  | "Đang chuẩn bị"
  | "Chưa cấu hình";

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  note: string;
  source: "government" | "school";
}

interface MakeupSchedule {
  id: string;
  holidayId: string;
  makeupDate: string;
  note: string;
}

interface TermConfig {
  id: string;
  name: "Spring" | "Summer" | "Fall";
  startDate: string;
  endDate: string;
  breakStartDate: string;
  breakEndDate: string;
  holidays: Holiday[];
  makeupSchedules: MakeupSchedule[];
}

/* =========================================================
   STYLES
   ========================================================= */

const STATUS_STYLE: Record<TermStatus, string> = {
  "Đã kết thúc": "border-slate-200 bg-slate-100 text-slate-600",
  "Đang diễn ra": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Đang chuẩn bị": "border-orange-200 bg-orange-50 text-orange-700",
  "Chưa cấu hình": "border-slate-200 bg-white text-slate-500",
};

/* =========================================================
   HELPERS
   ========================================================= */

const formatDate = (date: string) => {
  if (!date) return "Chưa thiết lập";

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
};

const addOneDay = (dateString: string) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + 1);

  const nextYear = date.getFullYear();

  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTermStatus = (
  term: TermConfig,
  today: string,
  isConfigured: boolean,
): TermStatus => {
  /*
   * Kỳ chưa tồn tại trong backend.
   */
  if (!isConfigured) {
    return "Chưa cấu hình";
  }

  /*
   * Kỳ có trong backend nhưng thiếu ngày.
   */
  if (!term.startDate || !term.endDate) {
    return "Chưa cấu hình";
  }

  /*
   * Đã tồn tại nhưng chưa tới ngày bắt đầu.
   */
  if (today < term.startDate) {
    return "Đang chuẩn bị";
  }

  /*
   * Đã qua ngày kết thúc.
   */
  if (today > term.endDate) {
    return "Đã kết thúc";
  }

  /*
   * Nằm trong khoảng bắt đầu - kết thúc.
   */
  return "Đang diễn ra";
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

const getFirstMondayOfMonth = (year: number, monthIndex: number) => {
  const date = new Date(year, monthIndex, 1);

  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }

  return date;
};

const getSecondMondayOfMonth = (year: number, monthIndex: number) => {
  const firstMonday = getFirstMondayOfMonth(year, monthIndex);

  return addDays(firstMonday, 7);
};

const getAutoAcademicYears = () => {
  const currentYear = new Date().getFullYear();

  return [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
    `${currentYear + 2}-${currentYear + 3}`,
  ];
};

const getAcademicYearStartYear = (academicYearCode: string) => {
  return Number(academicYearCode.split("-")[0]);
};

const getAcademicYearEndYear = (academicYearCode: string) => {
  return Number(academicYearCode.split("-")[1]);
};

/*
 * Quy tắc hiển thị:
 *
 * 2026-2027:
 * Fall   -> Fall 2026
 * Spring -> Spring 2027
 * Summer -> Summer 2027
 */
const getTermDisplayName = (
  termName: TermConfig["name"],
  academicYearCode: string,
) => {
  const startYear = getAcademicYearStartYear(academicYearCode);

  const endYear = getAcademicYearEndYear(academicYearCode);

  const termYear = termName === "Fall" ? startYear : endYear;

  return `${termName} ${termYear}`;
};

const createDefaultTerms = (academicYearCode: string): TermConfig[] => {
  const startYear = getAcademicYearStartYear(academicYearCode);

  const endYear = getAcademicYearEndYear(academicYearCode);

  /*
   * Ví dụ năm học 2026-2027:
   *
   * Fall 2026
   * Spring 2027
   * Summer 2027
   */

  const fallStart = getFirstMondayOfMonth(startYear, 8);

  const fallEnd = addDays(fallStart, 68);

  const springStart = getFirstMondayOfMonth(endYear, 0);

  const springEnd = addDays(springStart, 83);

  const summerStart = getSecondMondayOfMonth(endYear, 4);

  const summerEnd = addDays(summerStart, 76);

  return [
    {
      id: "fall",
      name: "Fall",
      startDate: formatLocalDate(fallStart),
      endDate: formatLocalDate(fallEnd),
      breakStartDate: "",
      breakEndDate: "",
      holidays: [],
      makeupSchedules: [],
    },

    {
      id: "spring",
      name: "Spring",
      startDate: formatLocalDate(springStart),
      endDate: formatLocalDate(springEnd),
      breakStartDate: "",
      breakEndDate: "",
      holidays: [],
      makeupSchedules: [],
    },

    {
      id: "summer",
      name: "Summer",
      startDate: formatLocalDate(summerStart),
      endDate: formatLocalDate(summerEnd),
      breakStartDate: "",
      breakEndDate: "",
      holidays: [
        {
          id: `summer-break-${endYear}`,
          name: "Nghỉ hè",
          startDate: formatLocalDate(addDays(summerStart, 56)),
          endDate: formatLocalDate(addDays(summerStart, 62)),
          note: "Nghỉ hè 1 tuần sau tuần học thứ 8.",
          source: "school",
        },
      ],
      makeupSchedules: [],
    },
  ];
};

const createInitialTermsByYear = (): Record<string, TermConfig[]> => {
  return getAutoAcademicYears().reduce<Record<string, TermConfig[]>>(
    (result, year) => {
      result[year] = createDefaultTerms(year);

      return result;
    },
    {},
  );
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationAcademicYear: React.FC = () => {
  const [isCreatingYear, setIsCreatingYear] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState | null>(null);

  const toastTimeoutRef = React.useRef<number | null>(null);

  const showToast = React.useCallback((type: ToastType, message: string) => {
    setToast({
      type,
      message,
    });

    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);

      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const [academicYear, setAcademicYear] = React.useState(() => {
    const currentYear = new Date().getFullYear();

    return `${currentYear}-${currentYear + 1}`;
  });

  const [today, setToday] = React.useState(() => getLocalDateString());

  React.useEffect(() => {
    const updateCurrentDate = () => {
      setToday(getLocalDateString());
    };

    updateCurrentDate();

    const intervalId = window.setInterval(updateCurrentDate, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const [termsByYear, setTermsByYear] = React.useState<
    Record<string, TermConfig[]>
  >(() => createInitialTermsByYear());

  /*
   * LOAD GOVERNMENT HOLIDAYS
   */
  React.useEffect(() => {
    const loadGovernmentHolidays = async () => {
      const years = getAutoAcademicYears();

      const holidayResults = await Promise.all(
        years.map(async (year) => ({
          year,
          holidays: await getGovernmentHolidays(year),
        })),
      );

      setTermsByYear((current) => {
        const next = {
          ...current,
        };

        holidayResults.forEach(({ year, holidays }) => {
          const yearTerms = next[year] ?? createDefaultTerms(year);

          next[year] = yearTerms.map((term) => {
            const governmentHolidaysInTerm = holidays.filter(
              (holiday) =>
                holiday.startDate <= term.endDate &&
                holiday.endDate >= term.startDate,
            );

            return {
              ...term,

              holidays: [
                ...term.holidays.filter(
                  (holiday) => holiday.source !== "government",
                ),

                ...governmentHolidaysInTerm,
              ],
            };
          });
        });

        return next;
      });
    };

    loadGovernmentHolidays();
  }, []);

  const [selectedTermId, setSelectedTermId] = React.useState<string | null>(
    null,
  );

  const [academicYearsData, setAcademicYearsData] = React.useState<
    AcademicYear[]
  >([]);

  const [academicPeriodsData, setAcademicPeriodsData] = React.useState<
    AcademicPeriod[]
  >([]);

  const [isLoadingYears, setIsLoadingYears] = React.useState(true);

  /*
   * LOAD ACADEMIC YEARS
   */
  React.useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        setIsLoadingYears(true);

        const academicYears = await academicService.searchAcademicYears();

        setAcademicYearsData(academicYears);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách năm học.";

        console.error(message);
      } finally {
        setIsLoadingYears(false);
      }
    };

    loadAcademicYears();
  }, []);

  /*
   * LOAD ACADEMIC PERIODS
   */
  React.useEffect(() => {
    const loadAcademicPeriods = async () => {
      const selectedAcademicYear = academicYearsData.find(
        (year) => year.yearCode === academicYear,
      );

      if (!selectedAcademicYear) {
        setAcademicPeriodsData([]);

        return;
      }

      try {
        const periods = await academicService.searchAcademicPeriods({
          page: 1,
          limit: 100,

          search: academicYear.slice(0, 3),

          status: "PLANNED",

          academicYearId: selectedAcademicYear.id,

          kind: "SEMESTER",
        });

        setAcademicPeriodsData(periods);

        /*
         * Đồng bộ ngày trong DB
         * vào term tương ứng.
         */
        setTermsByYear((current) => {
          const currentTerms =
            current[academicYear] ?? createDefaultTerms(academicYear);

          const updatedTerms = currentTerms.map((term) => {
            const matchedPeriod = periods.find((period) =>
              period.periodCode.startsWith(term.name.toUpperCase()),
            );

            if (!matchedPeriod) {
              return term;
            }

            return {
              ...term,

              startDate: matchedPeriod.startDate,

              endDate: matchedPeriod.endDate,
            };
          });

          return {
            ...current,

            [academicYear]: updatedTerms,
          };
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách kỳ học.";

        console.error(message);
      }
    };

    loadAcademicPeriods();
  }, [academicYear, academicYearsData]);

  /* =====================================================
       MAKEUP
       ===================================================== */

  const [showMakeupModal, setShowMakeupModal] = React.useState(false);

  const [makeupForm, setMakeupForm] = React.useState({
    holidayId: "",
    makeupDate: "",
    note: "",
  });

  /* =====================================================
       YEAR DATA HELPERS
       ===================================================== */

  const getTermsForYear = (year: string): TermConfig[] => {
    return termsByYear[year] ?? createDefaultTerms(year);
  };

  const updateTermsForYear = (
    year: string,
    updater: (current: TermConfig[]) => TermConfig[],
  ) => {
    setTermsByYear((current) => {
      const currentTerms = current[year] ?? createDefaultTerms(year);

      return {
        ...current,

        [year]: updater(currentTerms),
      };
    });
  };

  const terms = getTermsForYear(academicYear);

  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;
  const currentAcademicYear = academicYearsData.find(
    (year) => year.yearCode === academicYear,
  );

  const isCurrentYearInitialized = Boolean(currentAcademicYear);
  /*
   * Kiểm tra term có thật
   * trong backend hay chưa.
   */
  const isTermConfigured = (term: TermConfig, yearCode: string) => {
    const selectedAcademicYear = academicYearsData.find(
      (year) => year.yearCode === yearCode,
    );

    if (!selectedAcademicYear) {
      return false;
    }

    const termYear =
      term.name === "Fall"
        ? getAcademicYearStartYear(yearCode)
        : getAcademicYearEndYear(yearCode);

    const expectedPeriodCode = `${term.name.toUpperCase()}${termYear}`;

    return academicPeriodsData.some(
      (period) =>
        period.academicYearId === selectedAcademicYear.id &&
        period.periodCode === expectedPeriodCode,
    );
  };

  /* =====================================================
       TERM RULES
       ===================================================== */

  const getPreviousTerm = (termId: string) => {
    const currentIndex = terms.findIndex((term) => term.id === termId);

    if (currentIndex <= 0) {
      return null;
    }

    return terms[currentIndex - 1];
  };

  const getMinimumStartDate = (termId: string) => {
    const previousTerm = getPreviousTerm(termId);

    if (!previousTerm) {
      return "";
    }

    if (!previousTerm.startDate || !previousTerm.endDate) {
      return "";
    }

    if (previousTerm.breakEndDate) {
      return addOneDay(previousTerm.breakEndDate);
    }

    return addOneDay(previousTerm.endDate);
  };

  /* =====================================================
       TERM ACTIONS
       ===================================================== */

  const updateSelectedTerm = (
    field: "startDate" | "endDate" | "breakStartDate" | "breakEndDate",
    value: string,
  ) => {
    if (!selectedTermId) return;

    updateTermsForYear(academicYear, (current) =>
      current.map((term) =>
        term.id === selectedTermId
          ? {
              ...term,

              [field]: value,
            }
          : term,
      ),
    );
  };

  const handleOpenTerm = (termId: string) => {
    setSelectedTermId(termId);
  };

  const handleCloseTerm = () => {
    setSelectedTermId(null);
  };

  /*
   * SAVE TERM:
   *
   * Không tồn tại -> POST
   * Đã tồn tại    -> PATCH
   */
  const handleSaveTerm = async () => {
    if (!selectedTerm) return;

    if (!selectedTerm.startDate || !selectedTerm.endDate) {
      alert("Vui lòng nhập ngày bắt đầu và ngày kết thúc học.");

      return;
    }

    if (selectedTerm.endDate < selectedTerm.startDate) {
      alert("Ngày kết thúc học phải sau ngày bắt đầu học.");

      return;
    }

    /*
     * Không chồng kỳ trước.
     */
    const previousTerm = getPreviousTerm(selectedTerm.id);

    if (previousTerm) {
      if (!previousTerm.startDate || !previousTerm.endDate) {
        alert(
          `Vui lòng cấu hình ${getTermDisplayName(
            previousTerm.name,
            academicYear,
          )} trước khi cấu hình ${getTermDisplayName(
            selectedTerm.name,
            academicYear,
          )}.`,
        );

        return;
      }

      const minimumStartDate = getMinimumStartDate(selectedTerm.id);

      if (minimumStartDate && selectedTerm.startDate < minimumStartDate) {
        alert(
          `${getTermDisplayName(
            selectedTerm.name,
            academicYear,
          )} phải bắt đầu từ ${formatDate(
            minimumStartDate,
          )} trở đi vì không được trùng với thời gian đã cấu hình của ${getTermDisplayName(
            previousTerm.name,
            academicYear,
          )}.`,
        );

        return;
      }
    }

    /*
     * Break validation.
     */
    if (
      (selectedTerm.breakStartDate && !selectedTerm.breakEndDate) ||
      (!selectedTerm.breakStartDate && selectedTerm.breakEndDate)
    ) {
      alert(
        "Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc nghỉ/chuyển kỳ.",
      );

      return;
    }

    if (
      selectedTerm.breakStartDate &&
      selectedTerm.breakStartDate <= selectedTerm.endDate
    ) {
      alert("Ngày bắt đầu nghỉ/chuyển kỳ phải sau ngày kết thúc học.");

      return;
    }

    if (
      selectedTerm.breakStartDate &&
      selectedTerm.breakEndDate &&
      selectedTerm.breakEndDate < selectedTerm.breakStartDate
    ) {
      alert(
        "Ngày kết thúc nghỉ/chuyển kỳ phải bằng hoặc sau ngày bắt đầu nghỉ/chuyển kỳ.",
      );

      return;
    }

    /*
     * Holidays phải nằm trong kỳ.
     */
    const invalidHoliday = selectedTerm.holidays.find(
      (holiday) =>
        holiday.startDate < selectedTerm.startDate ||
        holiday.endDate > selectedTerm.endDate,
    );

    if (invalidHoliday) {
      alert(
        `Ngày nghỉ "${invalidHoliday.name}" không nằm trong thời gian học của kỳ ${getTermDisplayName(
          selectedTerm.name,
          academicYear,
        )}.`,
      );

      return;
    }

    const selectedAcademicYear = academicYearsData.find(
      (year) => year.yearCode === academicYear,
    );

    if (!selectedAcademicYear) {
      alert(
        "Không tìm thấy năm học tương ứng trong hệ thống. Vui lòng tải lại trang.",
      );

      return;
    }

    /*
     * QUAN TRỌNG:
     *
     * Không lấy năm từ startDate.
     *
     * 2026-2027:
     * Fall   = 2026
     * Spring = 2027
     * Summer = 2027
     */
    const periodYear =
      selectedTerm.name === "Fall"
        ? getAcademicYearStartYear(academicYear)
        : getAcademicYearEndYear(academicYear);

    const periodCode = `${selectedTerm.name.toUpperCase()}${periodYear}`;

    const existingPeriod = academicPeriodsData.find(
      (period) =>
        period.periodCode === periodCode ||
        period.periodCode.startsWith(selectedTerm.name.toUpperCase()),
    );

    try {
      if (existingPeriod) {
        /*
         * PATCH
         */
        const updatedPeriod = await academicService.updateAcademicPeriod({
          academicYearId: selectedAcademicYear.id,

          periodCode,

          name: `Kỳ chuyên ngành ${selectedTerm.name} ${periodYear}`,

          kind: "SEMESTER",

          parentPeriodId: existingPeriod.parentPeriodId,

          startDate: selectedTerm.startDate,

          endDate: selectedTerm.endDate,

          status: existingPeriod.status,

          academicPeriodId: existingPeriod.id,
        });

        setAcademicPeriodsData((current) =>
          current.map((period) =>
            period.id === updatedPeriod.id ? updatedPeriod : period,
          ),
        );

        alert(`Cập nhật kỳ ${updatedPeriod.name} thành công.`);
      } else {
        /*
         * POST
         */
        const createdPeriod = await academicService.createAcademicPeriod({
          academicYearId: selectedAcademicYear.id,

          periodCode,

          name: `Kỳ chuyên ngành ${selectedTerm.name} ${periodYear}`,

          kind: "SEMESTER",

          startDate: selectedTerm.startDate,

          endDate: selectedTerm.endDate,

          status: "PLANNED",
        });

        setAcademicPeriodsData((current) => [...current, createdPeriod]);

        alert(`Tạo kỳ ${createdPeriod.name} thành công.`);
      }

      handleCloseTerm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu kỳ học.";

      alert(message);
    }
  };

  /* =====================================================
       MAKEUP ACTIONS
       ===================================================== */

  const handleSaveMakeupSchedule = () => {
    if (!selectedTermId) return;

    if (!makeupForm.makeupDate) {
      alert("Vui lòng chọn ngày học bù.");

      return;
    }

    const isHoliday = selectedTerm?.holidays.some(
      (holiday) =>
        makeupForm.makeupDate >= holiday.startDate &&
        makeupForm.makeupDate <= holiday.endDate,
    );

    if (isHoliday) {
      alert("Ngày học bù không được trùng với ngày nghỉ trong kỳ.");

      return;
    }

    const newMakeupSchedule: MakeupSchedule = {
      id: `makeup-${Date.now()}`,

      holidayId: makeupForm.holidayId,

      makeupDate: makeupForm.makeupDate,

      note: makeupForm.note.trim(),
    };

    updateTermsForYear(academicYear, (current) =>
      current.map((term) =>
        term.id === selectedTermId
          ? {
              ...term,

              makeupSchedules: [...term.makeupSchedules, newMakeupSchedule],
            }
          : term,
      ),
    );

    setMakeupForm({
      holidayId: "",
      makeupDate: "",
      note: "",
    });

    setShowMakeupModal(false);
  };

  const handleDeleteMakeupSchedule = (scheduleId: string) => {
    if (!selectedTermId) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa lịch học bù này?");

    if (!confirmed) return;

    updateTermsForYear(academicYear, (current) =>
      current.map((term) =>
        term.id === selectedTermId
          ? {
              ...term,

              makeupSchedules: term.makeupSchedules.filter(
                (schedule) => schedule.id !== scheduleId,
              ),
            }
          : term,
      ),
    );
  };

  /* =====================================================
       CREATE ACADEMIC YEAR
       ===================================================== */

  const handleCreateAcademicYear = async () => {
    if (isCreatingYear) return;

    const yearAlreadyExists = academicYearsData.some(
      (year) => year.yearCode === academicYear,
    );

    if (yearAlreadyExists) {
      showToast("error", `Năm học ${academicYear} đã tồn tại trong hệ thống.`);

      return;
    }

    try {
      setIsCreatingYear(true);

      const startYear = getAcademicYearStartYear(academicYear);

      const endYear = getAcademicYearEndYear(academicYear);

      const createdYear = await academicService.createAcademicYear({
        yearCode: academicYear,

        startDate: `${startYear}-09-01`,

        endDate: `${endYear}-08-31`,

        status: "PLANNED",
      });

      setAcademicYearsData((current) => {
        const alreadyExists = current.some(
          (year) => year.id === createdYear.id,
        );

        if (alreadyExists) {
          return current;
        }

        return [...current, createdYear];
      });

      showToast(
        "success",
        `Khởi tạo năm học ${createdYear.yearCode} thành công.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể khởi tạo năm học.";

      showToast("error", message);
    } finally {
      setIsCreatingYear(false);
    }
  };
  /* =====================================================
       RENDER
       ===================================================== */

  return (
    <div className="space-y-6">
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
                onClick={() => {
                  setToast(null);

                  if (toastTimeoutRef.current !== null) {
                    window.clearTimeout(toastTimeoutRef.current);

                    toastTimeoutRef.current = null;
                  }
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng thông báo"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
      <PageBanner
        title="Khởi tạo Năm học"
        description="Thiết lập năm học, từng kỳ học và các khoảng thời gian nghỉ của nhà trường."
        badge="Quản lý dữ liệu"
      />

      {/* =================================================
            YEAR
            ================================================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Thông tin năm học
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Một năm học gồm 3 kỳ: Fall, Spring và Summer. Mỗi kỳ được cấu hình
            riêng khi nhà trường chuẩn bị kỳ học đó.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-xs">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Năm học
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);

                  setSelectedTermId(null);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {getAutoAcademicYears().map((year) => (
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
          ) : isCurrentYearInitialized ? (
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

      {/* =================================================
            TERMS
            ================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Các kỳ trong năm {academicYear}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          PĐT cấu hình từng kỳ khi chuẩn bị đưa kỳ đó vào vận hành.
        </p>

        {!isLoadingYears && !isCurrentYearInitialized ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <CalendarDays size={34} className="mx-auto text-slate-300" />

            <p className="mt-3 font-semibold text-slate-600">
              Năm học {academicYear} chưa được khởi tạo
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Hãy khởi tạo năm học trước khi thiết lập các kỳ học.
            </p>
          </div>
        ) : isLoadingYears ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
            Đang tải thông tin năm học...
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {terms.map((term) => {
              const configured = isTermConfigured(term, academicYear);

              const realtimeStatus = getTermStatus(term, today, configured);

              return (
                <div
                  key={term.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-orange-200 hover:bg-orange-50/20 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800">
                          {getTermDisplayName(term.name, academicYear)}
                        </h3>

                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLE[realtimeStatus]
                          }`}
                        >
                          {realtimeStatus}
                        </span>
                      </div>

                      {term.startDate && term.endDate ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Thời gian học:{" "}
                          <strong className="font-semibold text-slate-700">
                            {formatDate(term.startDate)}
                          </strong>{" "}
                          →{" "}
                          <strong className="font-semibold text-slate-700">
                            {formatDate(term.endDate)}
                          </strong>
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          Chưa thiết lập thời gian học.
                        </p>
                      )}

                      {term.holidays.length > 0 && (
                        <p className="mt-1 text-xs text-slate-400">
                          {term.holidays.length} kỳ nghỉ/ngày nghỉ đã thiết lập
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTerm(term.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
                  >
                    {configured ? "Xem / chỉnh sửa" : "Thiết lập kỳ"}

                    <ChevronRight size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* =================================================
            TERM CONFIG MODAL
            ================================================= */}

      {selectedTerm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={handleCloseTerm}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Thiết lập{" "}
                  {getTermDisplayName(selectedTerm.name, academicYear)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Cấu hình thời gian học và các khoảng nghỉ của kỳ.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseTerm}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {/* STUDY PERIOD */}

              <section>
                <div className="flex items-center gap-2">
                  <CalendarDays size={19} className="text-orange-500" />

                  <h3 className="font-bold text-slate-800">1. Thời gian học</h3>
                </div>

                {getPreviousTerm(selectedTerm.id) && (
                  <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                    {getMinimumStartDate(selectedTerm.id) ? (
                      <p className="text-sm text-slate-600">
                        {getTermDisplayName(selectedTerm.name, academicYear)}{" "}
                        được bắt đầu sớm nhất từ{" "}
                        <strong className="text-orange-700">
                          {formatDate(getMinimumStartDate(selectedTerm.id))}
                        </strong>
                        , sau thời gian đã cấu hình của{" "}
                        {getPreviousTerm(selectedTerm.id)
                          ? getTermDisplayName(
                              getPreviousTerm(selectedTerm.id)!.name,

                              academicYear,
                            )
                          : ""}
                        .
                      </p>
                    ) : (
                      <p className="text-sm text-orange-700">
                        Vui lòng cấu hình{" "}
                        <strong>
                          {getPreviousTerm(selectedTerm.id)
                            ? getTermDisplayName(
                                getPreviousTerm(selectedTerm.id)!.name,

                                academicYear,
                              )
                            : ""}
                        </strong>{" "}
                        trước khi cấu hình{" "}
                        {getTermDisplayName(selectedTerm.name, academicYear)}.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ngày bắt đầu học
                    </label>

                    <input
                      type="date"
                      min={getMinimumStartDate(selectedTerm.id) || undefined}
                      value={selectedTerm.startDate}
                      onChange={(event) =>
                        updateSelectedTerm(
                          "startDate",

                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ngày kết thúc học
                    </label>

                    <input
                      type="date"
                      min={selectedTerm.startDate || undefined}
                      value={selectedTerm.endDate}
                      onChange={(event) =>
                        updateSelectedTerm(
                          "endDate",

                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </section>

              {/* HOLIDAYS */}

              <section className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock3 size={19} className="text-orange-500" />

                      <h3 className="font-bold text-slate-800">
                        2. Ngày nghỉ trong kỳ
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Thiết lập Tết, ngày lễ Nhà nước hoặc ngày nghỉ đặc biệt
                      của trường.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMakeupModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                  >
                    <Plus size={17} />
                    Thêm lịch học bù
                  </button>
                </div>

                {selectedTerm.holidays.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center">
                    <CalendarDays
                      size={26}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Chưa có ngày nghỉ trong kỳ
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3">Tên kỳ nghỉ</th>

                          <th className="px-4 py-3">Bắt đầu</th>

                          <th className="px-4 py-3">Kết thúc</th>

                          <th className="px-4 py-3">Nguồn</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedTerm.holidays.map((holiday) => (
                          <tr key={holiday.id}>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800">
                                {holiday.name}
                              </p>

                              {holiday.note && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {holiday.note}
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {formatDate(holiday.startDate)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {formatDate(holiday.endDate)}
                            </td>

                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {holiday.source === "government"
                                  ? "Lịch Nhà nước"
                                  : "Lịch nhà trường"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* MAKEUP SCHEDULE LIST */}

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Lịch học bù
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Các buổi học bù được Phòng Đào tạo thiết lập cho kỳ này.
                    </p>
                  </div>

                  {selectedTerm.makeupSchedules.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                      <p className="text-sm text-slate-400">
                        Chưa có lịch học bù.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">Ngày học bù</th>

                            <th className="px-4 py-3">Ghi chú</th>

                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {selectedTerm.makeupSchedules.map((schedule) => (
                            <tr key={schedule.id}>
                              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                                {formatDate(schedule.makeupDate)}
                              </td>

                              <td className="px-4 py-3 text-slate-500">
                                {schedule.note || "—"}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMakeupSchedule(schedule.id)
                                    }
                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseTerm}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveTerm}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <Save size={17} />
                Lưu cấu hình kỳ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
            MAKEUP MODAL
            ================================================= */}

      {showMakeupModal && selectedTerm && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4"
          onClick={() => setShowMakeupModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Thêm lịch học bù
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getTermDisplayName(selectedTerm.name, academicYear)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMakeupModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Học bù cho ngày nghỉ
                </label>

                <select
                  value={makeupForm.holidayId}
                  onChange={(event) =>
                    setMakeupForm((current) => ({
                      ...current,

                      holidayId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Chọn ngày nghỉ</option>

                  {selectedTerm.holidays.map((holiday) => (
                    <option key={holiday.id} value={holiday.id}>
                      {holiday.name} ({formatDate(holiday.startDate)} →{" "}
                      {formatDate(holiday.endDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày học bù
                </label>

                <input
                  type="date"
                  value={makeupForm.makeupDate}
                  onChange={(event) =>
                    setMakeupForm((current) => ({
                      ...current,

                      makeupDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ghi chú
                </label>

                <textarea
                  rows={3}
                  value={makeupForm.note}
                  onChange={(event) =>
                    setMakeupForm((current) => ({
                      ...current,

                      note: event.target.value,
                    }))
                  }
                  placeholder="VD: Học bù cho buổi nghỉ lễ..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowMakeupModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveMakeupSchedule}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <Save size={16} />
                Thêm lịch học bù
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationAcademicYear;
