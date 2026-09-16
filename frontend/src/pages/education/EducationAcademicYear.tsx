import React from "react";
import {
  CalendarDays,
  Upload,
  Save,
  CheckCircle2,
  Clock3,
  List,
} from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";

interface TermConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const EducationAcademicYear: React.FC = () => {
  const [academicYear, setAcademicYear] = React.useState("2026");
  const [showInitializedYears, setShowInitializedYears] = React.useState(false);

  const [initializedYears, setInitializedYears] = React.useState<string[]>([]);
  const [terms, setTerms] = React.useState<TermConfig[]>([
    {
      id: "spring",
      name: "Spring",
      startDate: "",
      endDate: "",
    },
    {
      id: "summer",
      name: "Summer",
      startDate: "",
      endDate: "",
    },
    {
      id: "fall",
      name: "Fall",
      startDate: "",
      endDate: "",
    },
  ]);

  const updateTerm = (
    termId: string,
    field: "startDate" | "endDate",
    value: string,
  ) => {
    setTerms((currentTerms) =>
      currentTerms.map((term) =>
        term.id === termId
          ? {
              ...term,
              [field]: value,
            }
          : term,
      ),
    );
  };

  const handleImport = () => {
    // UI mock - chưa kết nối API
    alert("Chức năng Import dữ liệu học vụ sẽ được kết nối sau.");
  };

  const handleSave = () => {
    // UI mock - chưa kết nối API
    setInitializedYears((currentYears) => {
      if (currentYears.includes(academicYear)) {
        return currentYears;
      }

      return [...currentYears, academicYear];
    });

    alert(`Đã lưu cấu hình năm học ${academicYear} (UI mock).`);
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Khởi tạo Năm học"
        description="Thiết lập các kỳ học trong năm và thời gian học theo dữ liệu của nhà trường."
        badge="Quản lý dữ liệu"
      />

      {/* Thông tin năm học */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Thông tin năm học
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Một năm gồm 3 kỳ: Spring, Summer và Fall.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowInitializedYears((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <List size={18} />
              Xem năm học đã khởi tạo
            </button>

            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Upload size={18} />
              Import dữ liệu học vụ
            </button>
          </div>
        </div>

        <div className="max-w-xs">
          <label
            htmlFor="academic-year"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Năm
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              id="academic-year"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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

      {/* Các kỳ trong năm */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Các kỳ trong năm {academicYear}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Thiết lập thời gian học cho từng kỳ. Lịch thi từng môn sẽ được cập
            nhật riêng sau.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {terms.map((term) => (
            <div
              key={term.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {term.name} {academicYear}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">Kỳ học thực tế</p>
                </div>

                {term.startDate && term.endDate ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={14} />
                    Đã cấu hình
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Clock3 size={14} />
                    Chưa cấu hình
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor={`${term.id}-start`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Ngày bắt đầu học
                  </label>

                  <input
                    id={`${term.id}-start`}
                    type="date"
                    value={term.startDate}
                    onChange={(event) =>
                      updateTerm(term.id, "startDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${term.id}-end`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Ngày kết thúc học
                  </label>

                  <input
                    id={`${term.id}-end`}
                    type="date"
                    value={term.endDate}
                    onChange={(event) =>
                      updateTerm(term.id, "endDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showInitializedYears && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Năm học đã khởi tạo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Danh sách các năm học đã được khởi tạo trên hệ thống.
            </p>
          </div>

          {initializedYears.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <CalendarDays size={28} className="mx-auto mb-2 text-slate-400" />

              <p className="text-sm font-medium text-slate-600">
                Chưa có năm học nào được khởi tạo
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Hãy cấu hình và lưu một năm học để xem tại đây.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Năm học
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Số kỳ
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {initializedYears.map((year) => (
                    <tr key={year}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {year}
                      </td>

                      <td className="px-4 py-3 text-slate-600">3 kỳ</td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={14} />
                          Đã khởi tạo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {/* Nút lưu */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          <Save size={18} />
          Lưu khởi tạo năm học
        </button>
      </div>
    </div>
  );
};

export default EducationAcademicYear;
