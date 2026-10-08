import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  X,
  XCircle,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

type RegistrationPeriodStatus =
  | "Đang mở"
  | "Đã đóng"
  | "Chưa mở";

interface RegistrationPeriod {
  id: string;
  name: string;
  term: string;
  startDate: string;
  endDate: string;
  status: RegistrationPeriodStatus;
}

interface RegistrationPeriodForm {
  name: string;
  term: string;
  startDate: string;
  endDate: string;
}

const INITIAL_PERIODS: RegistrationPeriod[] = [
  {
    id: "period-1",
    name: "Đợt đăng ký OJT Fall 2026",
    term: "Fall 2026",
    startDate: "01/08/2026",
    endDate: "15/08/2026",
    status: "Đang mở",
  },
  {
    id: "period-2",
    name: "Đợt đăng ký OJT Summer 2026",
    term: "Summer 2026",
    startDate: "01/04/2026",
    endDate: "15/04/2026",
    status: "Đã đóng",
  },
];

const STATUS_STYLES: Record<
  RegistrationPeriodStatus,
  string
> = {
  "Đang mở":
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  "Đã đóng":
    "border-slate-200 bg-slate-100 text-slate-600",

  "Chưa mở":
    "border-amber-200 bg-amber-50 text-amber-700",
};

const EMPTY_FORM: RegistrationPeriodForm = {
  name: "",
  term: "",
  startDate: "",
  endDate: "",
};

const EducationOjtRegistrationPeriod: React.FC = () => {
  const [periods, setPeriods] =
    useState<RegistrationPeriod[]>(INITIAL_PERIODS);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [form, setForm] =
    useState<RegistrationPeriodForm>(EMPTY_FORM);

  const handleOpenModal = () => {
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleCreatePeriod = () => {
    if (
      !form.name.trim() ||
      !form.term.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      alert("Vui lòng nhập đầy đủ thông tin đợt đăng ký.");
      return;
    }

    const newPeriod: RegistrationPeriod = {
      id: `period-${Date.now()}`,
      name: form.name.trim(),
      term: form.term.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: "Chưa mở",
    };

    setPeriods((current) => [
      newPeriod,
      ...current,
    ]);

    handleCloseModal();
  };

  const handleOpenPeriod = (
    periodId: string,
  ) => {
    setPeriods((current) =>
      current.map((period) =>
        period.id === periodId
          ? {
              ...period,
              status: "Đang mở",
            }
          : period,
      ),
    );
  };

  const handleClosePeriod = (
    periodId: string,
  ) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn đóng đợt đăng ký OJT này không?",
    );

    if (!confirmed) return;

    setPeriods((current) =>
      current.map((period) =>
        period.id === periodId
          ? {
              ...period,
              status: "Đã đóng",
            }
          : period,
      ),
    );
  };

  const getStatusIcon = (
    status: RegistrationPeriodStatus,
  ) => {
    if (status === "Đang mở") {
      return (
        <CheckCircle2 size={15} />
      );
    }

    if (status === "Đã đóng") {
      return <XCircle size={15} />;
    }

    return <Clock3 size={15} />;
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Mở đợt Đăng ký OJT"
        description="Quản lý các đợt đăng ký nguyện vọng OJT dành cho sinh viên."
        badge="Quản lý OJT"
      />

      {/* HEADER */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Danh sách đợt đăng ký
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi trạng thái các đợt đăng ký OJT.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus size={18} />

            Tạo đợt đăng ký
          </button>
        </div>
      </section>

      {/* TABLE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 font-semibold text-slate-600">
                  Đợt đăng ký
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Kỳ OJT
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Thời gian bắt đầu
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Thời gian kết thúc
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Trạng thái
                </th>

                <th className="px-5 py-4 text-right font-semibold text-slate-600">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {periods.map((period) => (
                <tr
                  key={period.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                        <CalendarDays size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {period.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {period.term}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {period.startDate}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {period.endDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        STATUS_STYLES[
                          period.status
                        ]
                      }`}
                    >
                      {getStatusIcon(
                        period.status,
                      )}

                      {period.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      {period.status ===
                        "Chưa mở" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenPeriod(
                              period.id,
                            )
                          }
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Mở đợt
                        </button>
                      )}

                      {period.status ===
                        "Đang mở" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleClosePeriod(
                              period.id,
                            )
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Đóng đợt
                        </button>
                      )}

                      {period.status ===
                        "Đã đóng" && (
                        <span className="text-xs font-medium text-slate-400">
                          Đã kết thúc
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE MODAL */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tạo đợt đăng ký OJT
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Nhập thông tin cho đợt đăng ký mới.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tên đợt đăng ký
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name:
                        event.target.value,
                    }))
                  }
                  placeholder="VD: Đợt đăng ký OJT Fall 2026"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Kỳ OJT
                </label>

                <input
                  type="text"
                  value={form.term}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      term:
                        event.target.value,
                    }))
                  }
                  placeholder="VD: Fall 2026"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ngày bắt đầu
                  </label>

                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          startDate:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ngày kết thúc
                  </label>

                  <input
                    type="date"
                    value={
                      form.endDate
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          endDate:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleCreatePeriod}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Tạo đợt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtRegistrationPeriod;
