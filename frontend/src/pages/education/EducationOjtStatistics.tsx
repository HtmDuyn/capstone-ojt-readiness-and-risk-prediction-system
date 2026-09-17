import React from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  GraduationCap,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
} from "lucide-react";

import { PageBanner } from "@/components/common/PageBanner";

/* =========================================================
   TYPES
   ========================================================= */

type EligibilityStatus =
  | "Đủ điều kiện"
  | "Dự kiến đủ điều kiện"
  | "Chưa đủ điều kiện";

interface TermStatistic {
  term: string;
  total: number;
  eligible: number;
  projected: number;
  ineligible: number;
}

interface ConditionStatistic {
  id: string;
  name: string;
  passed: number;
  notPassed: number;
  note: string;
}

/* =========================================================
   MOCK DATA

   Đây chỉ là dữ liệu mock để dựng giao diện.

   Sau này backend sẽ tổng hợp từ:
   - dữ liệu học tập
   - điều kiện OJT đang áp dụng
   - kết quả kiểm tra điều kiện OJT

   FE không tự xét điều kiện.
   ========================================================= */

const CURRENT_TERM = "Fall 2026";

const TOTAL_STUDENTS = 120;

const ELIGIBILITY_DATA: Record<EligibilityStatus, number> = {
  "Đủ điều kiện": 72,
  "Dự kiến đủ điều kiện": 31,
  "Chưa đủ điều kiện": 17,
};

const TERM_STATISTICS: TermStatistic[] = [
  {
    term: "Spring 2026",
    total: 108,
    eligible: 70,
    projected: 25,
    ineligible: 13,
  },
  {
    term: "Summer 2026",
    total: 114,
    eligible: 73,
    projected: 27,
    ineligible: 14,
  },
  {
    term: "Fall 2026",
    total: 120,
    eligible: 72,
    projected: 31,
    ineligible: 17,
  },
];

const CONDITION_STATISTICS: ConditionStatistic[] = [
  {
    id: "credit-90",
    name: "Hoàn thành tối thiểu 90% tín chỉ",
    passed: 103,
    notPassed: 17,
    note:
      "Không tính Giáo dục thể chất và OTP theo điều kiện OJT đang cấu hình.",
  },
  {
    id: "jpd133",
    name: "Điều kiện JPD133",
    passed: 22,
    notPassed: 4,
    note:
      "Chỉ áp dụng đối với sinh viên theo combo tiếng Nhật có yêu cầu JPD133.",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const percent = (value: number, total: number) => {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
};

/* =========================================================
   COMPONENT
   ========================================================= */

const EducationOjtStatistics: React.FC = () => {
  const eligible = ELIGIBILITY_DATA["Đủ điều kiện"];
  const projected = ELIGIBILITY_DATA["Dự kiến đủ điều kiện"];
  const ineligible = ELIGIBILITY_DATA["Chưa đủ điều kiện"];

  const eligiblePercent = percent(eligible, TOTAL_STUDENTS);
  const projectedPercent = percent(projected, TOTAL_STUDENTS);
  const ineligiblePercent = percent(ineligible, TOTAL_STUDENTS);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Thống kê Điều kiện OJT"
        description="Theo dõi tổng quan tình trạng đủ, dự kiến đủ và chưa đủ điều kiện OJT của sinh viên."
        badge="AI & Dashboard"
      />

      {/* ===================================================
          CURRENT OVERVIEW
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={21} className="text-orange-500" />

              <h2 className="font-bold text-slate-800">
                Tổng quan điều kiện OJT
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Thống kê hiện tại cho kỳ {CURRENT_TERM}.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-400">
              Sinh viên được thống kê
            </p>

            <p className="mt-1 text-xl font-black text-slate-800">
              {TOTAL_STUDENTS}
            </p>
          </div>
        </div>

        {/* MAIN DISTRIBUTION BAR */}

        <div className="mt-7">
          <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="bg-emerald-500"
              style={{ width: `${eligiblePercent}%` }}
            />

            <div
              className="bg-amber-400"
              style={{ width: `${projectedPercent}%` }}
            />

            <div
              className="bg-red-500"
              style={{ width: `${ineligiblePercent}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* ELIGIBLE */}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-emerald-700">
                    Đủ điều kiện
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-black text-emerald-700">
                      {eligible}
                    </span>

                    <span className="pb-1 text-sm font-semibold text-emerald-600">
                      {eligiblePercent}%
                    </span>
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </div>

            {/* PROJECTED */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-amber-700">
                    Dự kiến đủ điều kiện
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-black text-amber-700">
                      {projected}
                    </span>

                    <span className="pb-1 text-sm font-semibold text-amber-600">
                      {projectedPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600">
                  <Clock3 size={21} />
                </div>
              </div>
            </div>

            {/* INELIGIBLE */}

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Chưa đủ điều kiện
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-black text-red-700">
                      {ineligible}
                    </span>

                    <span className="pb-1 text-sm font-semibold text-red-600">
                      {ineligiblePercent}%
                    </span>
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                  <AlertTriangle size={21} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          CONDITION BREAKDOWN
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileCheck2 size={21} className="text-orange-500" />

          <div>
            <h2 className="font-bold text-slate-800">
              Thống kê theo từng điều kiện
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tổng hợp kết quả theo các điều kiện OJT đang được áp dụng.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {CONDITION_STATISTICS.map((condition) => {
            const conditionTotal =
              condition.passed + condition.notPassed;

            const passedPercent = percent(
              condition.passed,
              conditionTotal,
            );

            const notPassedPercent = percent(
              condition.notPassed,
              conditionTotal,
            );

            return (
              <article
                key={condition.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {condition.name}
                    </h3>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      {condition.note}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500">
                    Áp dụng:{" "}
                    <span className="font-bold text-slate-700">
                      {conditionTotal} SV
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${passedPercent}%`,
                      }}
                    />

                    <div
                      className="bg-red-500"
                      style={{
                        width: `${notPassedPercent}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      <span className="text-sm text-slate-500">
                        Đạt
                      </span>

                      <span className="font-bold text-emerald-700">
                        {condition.passed}
                      </span>

                      <span className="text-xs text-slate-400">
                        ({passedPercent}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                      <span className="text-sm text-slate-500">
                        Chưa đạt
                      </span>

                      <span className="font-bold text-red-700">
                        {condition.notPassed}
                      </span>

                      <span className="text-xs text-slate-400">
                        ({notPassedPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          TERM COMPARISON
          =================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <TrendingUp size={21} className="text-orange-500" />

          <div>
            <h2 className="font-bold text-slate-800">
              Thống kê theo kỳ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              So sánh tình trạng điều kiện OJT giữa các kỳ gần đây.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {TERM_STATISTICS.map((term) => {
            const eligibleWidth = percent(
              term.eligible,
              term.total,
            );

            const projectedWidth = percent(
              term.projected,
              term.total,
            );

            const ineligibleWidth = percent(
              term.ineligible,
              term.total,
            );

            return (
              <div key={term.term}>
                <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      size={17}
                      className="text-slate-400"
                    />

                    <span className="font-semibold text-slate-700">
                      {term.term}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {term.total} sinh viên
                  </span>
                </div>

                <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="bg-emerald-500"
                    style={{
                      width: `${eligibleWidth}%`,
                    }}
                  />

                  <div
                    className="bg-amber-400"
                    style={{
                      width: `${projectedWidth}%`,
                    }}
                  />

                  <div
                    className="bg-red-500"
                    style={{
                      width: `${ineligibleWidth}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span className="text-emerald-700">
                    Đủ:{" "}
                    <strong>
                      {term.eligible}
                    </strong>
                  </span>

                  <span className="text-amber-700">
                    Dự kiến đủ:{" "}
                    <strong>
                      {term.projected}
                    </strong>
                  </span>

                  <span className="text-red-700">
                    Chưa đủ:{" "}
                    <strong>
                      {term.ineligible}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Đủ điều kiện
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Dự kiến đủ điều kiện
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Chưa đủ điều kiện
          </div>
        </div>
      </section>

      {/* ===================================================
          NOTE
          =================================================== */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex gap-3">
          <BarChart3
            size={19}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <p className="text-sm leading-6 text-blue-700">
            Các số liệu hiện tại là dữ liệu mock frontend.
            Khi có backend, thống kê sẽ được tổng hợp từ kết quả
            kiểm tra điều kiện OJT của sinh viên.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EducationOjtStatistics;