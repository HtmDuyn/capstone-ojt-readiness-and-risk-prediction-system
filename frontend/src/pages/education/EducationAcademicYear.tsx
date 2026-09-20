import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  List,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type TermStatus =
  | "Đã kết thúc"
  | "Đang diễn ra"
  | "Đang chuẩn bị"
  | "Chưa cấu hình";

type YearAction = "view" | "edit" | "delete" | null;

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
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
}

/* =========================================================
   MOCK DATA
   ========================================================= */

const INITIAL_TERMS_2026: TermConfig[] = [
  {
    id: "spring",
    name: "Spring",
    startDate: "2026-01-05",
    endDate: "2026-04-26",
    breakStartDate: "2026-04-27",
    breakEndDate: "2026-05-10",
    holidays: [
      {
        id: "holiday-spring-1",
        name: "Nghỉ Tết Nguyên Đán",
        startDate: "2026-02-14",
        endDate: "2026-02-22",
        note: "Nghỉ Tết trong học kỳ Spring.",
      },
    ],
  },
  {
    id: "summer",
    name: "Summer",
    startDate: "",
    endDate: "",
    breakStartDate: "",
    breakEndDate: "",
    holidays: [],
  },
  {
    id: "fall",
    name: "Fall",
    startDate: "",
    endDate: "",
    breakStartDate: "",
    breakEndDate: "",
    holidays: [],
  },
];

const createEmptyTerms = (): TermConfig[] => [
  {
    id: "spring",
    name: "Spring",
    startDate: "",
    endDate: "",
    breakStartDate: "",
    breakEndDate: "",
    holidays: [],
  },
  {
    id: "summer",
    name: "Summer",
    startDate: "",
    endDate: "",
    breakStartDate: "",
    breakEndDate: "",
    holidays: [],
  },
  {
    id: "fall",
    name: "Fall",
    startDate: "",
    endDate: "",
    breakStartDate: "",
    breakEndDate: "",
    holidays: [],
  },
];

/* =========================================================
   STYLES
   ========================================================= */

const STATUS_STYLE: Record<TermStatus, string> = {
  "Đã kết thúc": "border-slate-200 bg-slate-100 text-slate-600",
  "Đang diễn ra": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Đang chuẩn bị": "border-orange-200 bg-orange-50 text-orange-700",
  "Chưa cấu hình": "border-slate-200 bg-white text-slate-500",
};

const TERM_VIEW_STYLE: Record<
  TermConfig["name"],
  {
    border: string;
    accent: string;
    header: string;
    iconBox: string;
    icon: string;
    label: string;
  }
> = {
  Spring: {
    border: "border-emerald-200",
    accent: "bg-emerald-500",
    header: "bg-emerald-50/70",
    iconBox: "bg-emerald-100",
    icon: "text-emerald-600",
    label: "text-emerald-800",
  },
  Summer: {
    border: "border-orange-200",
    accent: "bg-orange-500",
    header: "bg-orange-50/70",
    iconBox: "bg-orange-100",
    icon: "text-orange-600",
    label: "text-orange-800",
  },
  Fall: {
    border: "border-indigo-200",
    accent: "bg-indigo-500",
    header: "bg-indigo-50/70",
    iconBox: "bg-indigo-100",
    icon: "text-indigo-600",
    label: "text-indigo-800",
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

const TERM_ORDER: Record<TermConfig["name"], number> = {
  Spring: 0,
  Summer: 1,
  Fall: 2,
};

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

/**
 * Lấy ngày local của máy đang chạy ứng dụng.
 * Không dùng toISOString() vì toISOString() dùng UTC.
 */
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Tính trạng thái kỳ theo thời gian thực.
 *
 * Quy tắc:
 * 1. Nếu đã cấu hình startDate + endDate:
 *    - chưa tới startDate => Đang chuẩn bị
 *    - nằm trong khoảng => Đang diễn ra
 *    - qua endDate => Đã kết thúc
 *
 * 2. Nếu chưa cấu hình ngày:
 *    - năm quá khứ => Đã kết thúc
 *    - năm tương lai => Chưa cấu hình
 *    - năm hiện tại:
 *       tháng 1-4  => Spring
 *       tháng 5-8  => Summer
 *       tháng 9-12 => Fall
 */
const getTermStatus = (
  term: TermConfig,
  year: string,
  today: string,
): TermStatus => {
  /* =========================================
     ĐÃ CÓ NGÀY CẤU HÌNH
     ========================================= */

  if (term.startDate && term.endDate) {
    if (today < term.startDate) {
      return "Đang chuẩn bị";
    }

    if (today > term.endDate) {
      return "Đã kết thúc";
    }

    return "Đang diễn ra";
  }

  /* =========================================
     CHƯA CẤU HÌNH NGÀY
     ========================================= */

  const currentYear = Number(today.slice(0, 4));
  const targetYear = Number(year);

  if (targetYear < currentYear) {
    return "Đã kết thúc";
  }

  if (targetYear > currentYear) {
    return "Chưa cấu hình";
  }

  /* =========================================
     NĂM HIỆN TẠI
     ========================================= */

  const currentMonth = Number(today.slice(5, 7));

  let currentTerm: TermConfig["name"];

  if (currentMonth >= 9) {
    currentTerm = "Fall";
  } else if (currentMonth >= 5) {
    currentTerm = "Summer";
  } else {
    currentTerm = "Spring";
  }

  const currentTermIndex = TERM_ORDER[currentTerm];
  const termIndex = TERM_ORDER[term.name];

  if (termIndex < currentTermIndex) {
    return "Đã kết thúc";
  }

  if (termIndex === currentTermIndex) {
    return "Đang diễn ra";
  }

  return "Chưa cấu hình";
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationAcademicYear: React.FC = () => {
  const [academicYear, setAcademicYear] = React.useState("2026");

  /*
   * Ngày hiện tại.
   * Tự kiểm tra lại mỗi phút để nếu app mở qua 00:00
   * thì trạng thái kỳ tự cập nhật.
   */
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

  /*
   * Dữ liệu kỳ tách riêng theo từng năm.
   *
   * Sau này có API thì phần này có thể được thay bằng dữ liệu
   * GET từ Spring Boot mà phần UI phía dưới không phải đổi nhiều.
   */
  const [termsByYear, setTermsByYear] = React.useState<
    Record<string, TermConfig[]>
  >({
    "2026": INITIAL_TERMS_2026,
  });

  const [selectedTermId, setSelectedTermId] = React.useState<string | null>(
    null,
  );

  const [showInitializedYears, setShowInitializedYears] = React.useState(false);

  const [initializedYears, setInitializedYears] = React.useState<string[]>([
    "2026",
  ]);

  /* YEAR ACTION */
  const [yearAction, setYearAction] = React.useState<YearAction>(null);

  const [selectedYear, setSelectedYear] = React.useState<string | null>(null);

  /* HOLIDAY */
  const [showHolidayModal, setShowHolidayModal] = React.useState(false);

  const [editingHolidayId, setEditingHolidayId] = React.useState<string | null>(
    null,
  );

  const [holidayForm, setHolidayForm] = React.useState({
    name: "",
    startDate: "",
    endDate: "",
    note: "",
  });

  /* =======================================================
     YEAR DATA HELPERS
     ======================================================= */

  const getTermsForYear = (year: string): TermConfig[] => {
    return termsByYear[year] ?? createEmptyTerms();
  };

  const updateTermsForYear = (
    year: string,
    updater: (current: TermConfig[]) => TermConfig[],
  ) => {
    setTermsByYear((current) => {
      const currentTerms = current[year] ?? createEmptyTerms();

      return {
        ...current,
        [year]: updater(currentTerms),
      };
    });
  };

  const terms = getTermsForYear(academicYear);

  const selectedYearTerms = selectedYear ? getTermsForYear(selectedYear) : [];

  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;

  const getConfiguredTermCount = (year: string) => {
    return getTermsForYear(year).filter(
      (term) => term.startDate && term.endDate,
    ).length;
  };

  /* =======================================================
     TERM RULES
     ======================================================= */

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

    /*
     * Nếu kỳ trước có nghỉ/chuyển kỳ,
     * kỳ sau phải bắt đầu sau ngày nghỉ cuối cùng.
     */
    if (previousTerm.breakEndDate) {
      return addOneDay(previousTerm.breakEndDate);
    }

    /*
     * Nếu không có nghỉ/chuyển kỳ,
     * kỳ sau bắt đầu sau ngày kết thúc học.
     */
    return addOneDay(previousTerm.endDate);
  };

  /* =======================================================
     TERM ACTIONS
     ======================================================= */

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

  const handleSaveTerm = () => {
    if (!selectedTerm) return;

    /* =========================================
       1. THỜI GIAN HỌC
       ========================================= */

    if (!selectedTerm.startDate || !selectedTerm.endDate) {
      alert("Vui lòng nhập ngày bắt đầu và ngày kết thúc học.");
      return;
    }

    if (selectedTerm.endDate < selectedTerm.startDate) {
      alert("Ngày kết thúc học phải sau ngày bắt đầu học.");
      return;
    }

    /* =========================================
       2. KHÔNG ĐƯỢC CHỒNG KỲ TRƯỚC
       ========================================= */

    const previousTerm = getPreviousTerm(selectedTerm.id);

    if (previousTerm) {
      if (!previousTerm.startDate || !previousTerm.endDate) {
        alert(
          `Vui lòng cấu hình ${previousTerm.name} ${academicYear} trước khi cấu hình ${selectedTerm.name} ${academicYear}.`,
        );
        return;
      }

      const minimumStartDate = getMinimumStartDate(selectedTerm.id);

      if (minimumStartDate && selectedTerm.startDate < minimumStartDate) {
        alert(
          `${selectedTerm.name} ${academicYear} phải bắt đầu từ ${formatDate(
            minimumStartDate,
          )} trở đi vì không được trùng với thời gian đã cấu hình của ${previousTerm.name} ${academicYear}.`,
        );
        return;
      }
    }

    /* =========================================
       3. NGHỈ / CHUYỂN KỲ
       ========================================= */

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

    /* =========================================
       4. NGÀY NGHỈ TRONG KỲ
       ========================================= */

    const invalidHoliday = selectedTerm.holidays.find(
      (holiday) =>
        holiday.startDate < selectedTerm.startDate ||
        holiday.endDate > selectedTerm.endDate,
    );

    if (invalidHoliday) {
      alert(
        `Ngày nghỉ "${invalidHoliday.name}" không nằm trong thời gian học của kỳ ${selectedTerm.name}.`,
      );
      return;
    }

    /*
     * Không cần set status.
     *
     * Status được tính tự động bởi getTermStatus()
     * dựa trên startDate / endDate / ngày hiện tại.
     */

    alert(`Đã lưu cấu hình ${selectedTerm.name} ${academicYear} (UI mock).`);

    handleCloseTerm();
  };

  /* =======================================================
     HOLIDAY ACTIONS
     ======================================================= */

  const resetHolidayForm = () => {
    setHolidayForm({
      name: "",
      startDate: "",
      endDate: "",
      note: "",
    });

    setEditingHolidayId(null);
  };

  const handleOpenAddHoliday = () => {
    if (!selectedTerm?.startDate || !selectedTerm?.endDate) {
      alert(
        "Vui lòng thiết lập thời gian học trước khi thêm ngày nghỉ trong kỳ.",
      );
      return;
    }

    resetHolidayForm();
    setShowHolidayModal(true);
  };

  const handleOpenEditHoliday = (holiday: Holiday) => {
    setEditingHolidayId(holiday.id);

    setHolidayForm({
      name: holiday.name,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      note: holiday.note,
    });

    setShowHolidayModal(true);
  };

  const handleCloseHolidayModal = () => {
    setShowHolidayModal(false);
    resetHolidayForm();
  };

  const handleSaveHoliday = () => {
    if (!selectedTermId) return;

    if (
      !holidayForm.name.trim() ||
      !holidayForm.startDate ||
      !holidayForm.endDate
    ) {
      alert("Vui lòng nhập tên ngày nghỉ, ngày bắt đầu và ngày kết thúc.");
      return;
    }

    if (holidayForm.startDate > holidayForm.endDate) {
      alert("Ngày kết thúc nghỉ phải sau ngày bắt đầu nghỉ.");
      return;
    }

    const currentTerm = terms.find((term) => term.id === selectedTermId);

    if (!currentTerm?.startDate || !currentTerm.endDate) {
      alert(
        "Vui lòng thiết lập thời gian học trước khi thêm ngày nghỉ trong kỳ.",
      );
      return;
    }

    if (
      holidayForm.startDate < currentTerm.startDate ||
      holidayForm.endDate > currentTerm.endDate
    ) {
      alert(
        `Ngày nghỉ phải nằm trong thời gian học của kỳ ${currentTerm.name}.`,
      );
      return;
    }

    updateTermsForYear(academicYear, (current) =>
      current.map((term) => {
        if (term.id !== selectedTermId) {
          return term;
        }

        if (editingHolidayId) {
          return {
            ...term,
            holidays: term.holidays.map((holiday) =>
              holiday.id === editingHolidayId
                ? {
                    ...holiday,
                    ...holidayForm,
                  }
                : holiday,
            ),
          };
        }

        const newHoliday: Holiday = {
          id: `holiday-${Date.now()}`,
          ...holidayForm,
        };

        return {
          ...term,
          holidays: [...term.holidays, newHoliday],
        };
      }),
    );

    handleCloseHolidayModal();
  };

  const handleDeleteHoliday = (holidayId: string) => {
    if (!selectedTermId) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa ngày nghỉ này?");

    if (!confirmed) return;

    updateTermsForYear(academicYear, (current) =>
      current.map((term) =>
        term.id === selectedTermId
          ? {
              ...term,
              holidays: term.holidays.filter(
                (holiday) => holiday.id !== holidayId,
              ),
            }
          : term,
      ),
    );
  };

  /* =======================================================
     YEAR ACTIONS
     ======================================================= */

  const handleViewYear = (year: string) => {
    setSelectedYear(year);
    setYearAction("view");
  };

  const handleEditYear = (year: string) => {
    setSelectedYear(year);
    setYearAction("edit");
  };

  const handleDeleteYear = (year: string) => {
    setSelectedYear(year);
    setYearAction("delete");
  };

  const handleCloseYearAction = () => {
    setSelectedYear(null);
    setYearAction(null);
  };

  const handleConfirmDeleteYear = () => {
    if (!selectedYear) return;

    setInitializedYears((current) =>
      current.filter((year) => year !== selectedYear),
    );

    handleCloseYearAction();
  };

  const handleEditTermFromYearPopup = (termId: string) => {
    if (!selectedYear) return;

    const year = selectedYear;

    setAcademicYear(year);
    setYearAction(null);
    setSelectedYear(null);
    setSelectedTermId(termId);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="space-y-6">
      <PageBanner
        title="Khởi tạo Năm học"
        description="Thiết lập năm học, từng kỳ học và các khoảng thời gian nghỉ của nhà trường."
        badge="Quản lý dữ liệu"
      />

      {/* ===================================================
          YEAR
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Thông tin năm học
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Một năm gồm 3 kỳ: Spring, Summer và Fall. Mỗi kỳ được cấu hình
              riêng khi nhà trường chuẩn bị kỳ học đó.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInitializedYears((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <List size={18} />

            {showInitializedYears
              ? "Ẩn năm học đã khởi tạo"
              : "Xem năm học đã khởi tạo"}
          </button>
        </div>

        <div className="mt-5 max-w-xs">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Năm
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
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===================================================
          TERMS
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Các kỳ trong năm {academicYear}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          PĐT chỉ cần cấu hình kỳ học khi chuẩn bị đưa kỳ đó vào vận hành.
        </p>

        <div className="mt-5 space-y-3">
          {terms.map((term) => {
            const realtimeStatus = getTermStatus(term, academicYear, today);

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
                        {term.name} {academicYear}
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
                  {term.startDate ? "Xem / chỉnh sửa" : "Thiết lập kỳ"}

                  <ChevronRight size={17} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          INITIALIZED YEARS
          =================================================== */}

      {showInitializedYears && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Năm học đã khởi tạo
          </h2>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Năm học</th>

                  <th className="px-4 py-3">Số kỳ đã cấu hình</th>

                  <th className="px-4 py-3">Trạng thái</th>

                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {initializedYears.map((year) => (
                  <tr key={year}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {year}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {getConfiguredTermCount(year)} kỳ
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={14} />
                        Đã khởi tạo
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewYear(year)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={16} />
                          Xem
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditYear(year)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                        >
                          <Pencil size={16} />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteYear(year)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================
          YEAR ACTION MODAL
          =================================================== */}

      {yearAction && selectedYear && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-6 backdrop-blur-[2px]"
          onClick={handleCloseYearAction}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {yearAction === "view"
                    ? `Thông tin năm học ${selectedYear}`
                    : yearAction === "edit"
                      ? `Chỉnh sửa năm học ${selectedYear}`
                      : `Xóa năm học ${selectedYear}`}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {yearAction === "view"
                    ? "Xem thông tin các kỳ đã được thiết lập trong năm học."
                    : yearAction === "edit"
                      ? "Chọn kỳ cần chỉnh sửa trong năm học."
                      : "Xác nhận trước khi xóa năm học."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseYearAction}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* ================= VIEW YEAR ================= */}

            {yearAction === "view" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="space-y-4">
                    {selectedYearTerms.map((term) => {
                      const termStyle = TERM_VIEW_STYLE[term.name];

                      const realtimeStatus = getTermStatus(
                        term,
                        selectedYear,
                        today,
                      );

                      return (
                        <div
                          key={term.id}
                          className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${termStyle.border}`}
                        >
                          {/* LEFT ACCENT */}

                          <div
                            className={`absolute bottom-0 left-0 top-0 w-1.5 ${termStyle.accent}`}
                          />

                          {/* TERM HEADER */}

                          <div
                            className={`border-b px-5 py-4 pl-6 ${termStyle.header} ${termStyle.border}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${termStyle.iconBox} ${termStyle.icon}`}
                                >
                                  <CalendarDays size={19} />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <h3
                                    className={`text-base font-black ${termStyle.label}`}
                                  >
                                    {term.name} {selectedYear}
                                  </h3>

                                  <span
                                    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                      STATUS_STYLE[realtimeStatus]
                                    }`}
                                  >
                                    {realtimeStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* TERM BODY */}

                          <div className="px-5 py-4 pl-6">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-xs font-semibold text-slate-400">
                                  Thời gian học
                                </p>

                                <p className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-700">
                                  {term.startDate && term.endDate
                                    ? `${formatDate(
                                        term.startDate,
                                      )} → ${formatDate(term.endDate)}`
                                    : "Chưa thiết lập"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-xs font-semibold text-slate-400">
                                  Nghỉ / chuyển kỳ
                                </p>

                                <p className="mt-1 whitespace-nowrap text-sm font-semibold text-slate-700">
                                  {term.breakStartDate && term.breakEndDate
                                    ? `${formatDate(
                                        term.breakStartDate,
                                      )} → ${formatDate(term.breakEndDate)}`
                                    : "Chưa thiết lập"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                <p className="text-xs font-semibold text-slate-400">
                                  Ngày nghỉ trong kỳ
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  {term.holidays.length} lịch nghỉ
                                </p>
                              </div>
                            </div>

                            {term.holidays.length > 0 && (
                              <div className="mt-4 border-t border-slate-100 pt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Lịch nghỉ đã thiết lập
                                </p>

                                <div className="space-y-2">
                                  {term.holidays.map((holiday) => (
                                    <div
                                      key={holiday.id}
                                      className="flex flex-col gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {holiday.name}
                                        </p>

                                        {holiday.note && (
                                          <p className="mt-0.5 text-xs text-slate-400">
                                            {holiday.note}
                                          </p>
                                        )}
                                      </div>

                                      <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
                                        {formatDate(holiday.startDate)} →{" "}
                                        {formatDate(holiday.endDate)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCloseYearAction}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT YEAR ================= */}

            {yearAction === "edit" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {selectedYearTerms.map((term) => {
                    const realtimeStatus = getTermStatus(
                      term,
                      selectedYear,
                      today,
                    );

                    return (
                      <div
                        key={term.id}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-800">
                              {term.name} {selectedYear}
                            </p>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                STATUS_STYLE[realtimeStatus]
                              }`}
                            >
                              {realtimeStatus}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {term.startDate && term.endDate
                              ? `${formatDate(term.startDate)} → ${formatDate(
                                  term.endDate,
                                )}`
                              : "Chưa thiết lập thời gian học"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditTermFromYearPopup(term.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
                        >
                          <Pencil size={16} />
                          Chỉnh sửa kỳ
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseYearAction}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* ================= DELETE YEAR ================= */}

            {yearAction === "delete" && (
              <div className="p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <Trash2 size={19} />
                    </div>

                    <div>
                      <p className="font-bold text-red-700">
                        Bạn có chắc muốn xóa năm học {selectedYear}?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        Năm học sẽ bị xóa khỏi danh sách năm học đã khởi tạo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseYearAction}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDeleteYear}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    <Trash2 size={17} />
                    Xóa năm học
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================
          TERM CONFIG MODAL
          =================================================== */}

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
                  Thiết lập {selectedTerm.name} {academicYear}
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
                        {selectedTerm.name} {academicYear} được bắt đầu sớm nhất
                        từ{" "}
                        <strong className="text-orange-700">
                          {formatDate(getMinimumStartDate(selectedTerm.id))}
                        </strong>
                        , sau thời gian đã cấu hình của{" "}
                        {getPreviousTerm(selectedTerm.id)?.name}.
                      </p>
                    ) : (
                      <p className="text-sm text-orange-700">
                        Vui lòng cấu hình{" "}
                        <strong>
                          {getPreviousTerm(selectedTerm.id)?.name}{" "}
                          {academicYear}
                        </strong>{" "}
                        trước khi cấu hình {selectedTerm.name}.
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
                        updateSelectedTerm("startDate", event.target.value)
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
                        updateSelectedTerm("endDate", event.target.value)
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
                    onClick={handleOpenAddHoliday}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                  >
                    <Plus size={17} />
                    Thêm ngày nghỉ
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

                          <th className="px-4 py-3 text-right">Thao tác</th>
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
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditHoliday(holiday)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-orange-50 hover:text-orange-600"
                                >
                                  <Edit3 size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteHoliday(holiday.id)
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
              </section>

              {/* TERM BREAK */}

              <section className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <Clock3 size={19} className="text-orange-500" />

                  <h3 className="font-bold text-slate-800">
                    3. Thời gian nghỉ / chuyển kỳ
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Khoảng nghỉ sau khi kết thúc {selectedTerm.name} và trước khi
                  kỳ tiếp theo bắt đầu.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ngày bắt đầu nghỉ
                    </label>

                    <input
                      type="date"
                      min={
                        selectedTerm.endDate
                          ? addOneDay(selectedTerm.endDate)
                          : undefined
                      }
                      value={selectedTerm.breakStartDate}
                      onChange={(event) =>
                        updateSelectedTerm("breakStartDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ngày kết thúc nghỉ
                    </label>

                    <input
                      type="date"
                      min={selectedTerm.breakStartDate || undefined}
                      value={selectedTerm.breakEndDate}
                      onChange={(event) =>
                        updateSelectedTerm("breakEndDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
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

      {/* ===================================================
          HOLIDAY MODAL
          =================================================== */}

      {showHolidayModal && selectedTerm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4"
          onClick={handleCloseHolidayModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingHolidayId ? "Chỉnh sửa ngày nghỉ" : "Thêm ngày nghỉ"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedTerm.name} {academicYear}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseHolidayModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tên kỳ nghỉ
                </label>

                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(event) =>
                    setHolidayForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="VD: Nghỉ Tết Nguyên Đán"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ngày bắt đầu
                  </label>

                  <input
                    type="date"
                    min={selectedTerm.startDate || undefined}
                    max={selectedTerm.endDate || undefined}
                    value={holidayForm.startDate}
                    onChange={(event) =>
                      setHolidayForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ngày kết thúc
                  </label>

                  <input
                    type="date"
                    min={
                      holidayForm.startDate ||
                      selectedTerm.startDate ||
                      undefined
                    }
                    max={selectedTerm.endDate || undefined}
                    value={holidayForm.endDate}
                    onChange={(event) =>
                      setHolidayForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {selectedTerm.startDate && selectedTerm.endDate && (
                <p className="text-xs text-slate-400">
                  Ngày nghỉ phải nằm trong thời gian học từ{" "}
                  <span className="font-semibold text-slate-600">
                    {formatDate(selectedTerm.startDate)}
                  </span>{" "}
                  đến{" "}
                  <span className="font-semibold text-slate-600">
                    {formatDate(selectedTerm.endDate)}
                  </span>
                  .
                </p>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ghi chú
                </label>

                <textarea
                  rows={3}
                  value={holidayForm.note}
                  onChange={(event) =>
                    setHolidayForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Ghi chú thêm nếu cần..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseHolidayModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveHoliday}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <Save size={16} />

                {editingHolidayId ? "Lưu thay đổi" : "Thêm ngày nghỉ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationAcademicYear;
