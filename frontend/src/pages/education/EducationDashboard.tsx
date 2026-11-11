import { EmptyState, ErrorNotice, MetricCard, SectionTitle } from '@/components/education/EducationUi';
import { useEducationDashboard } from '@/hooks/useEducationDashboard';
import { clampPercent, formatDate, formatNumber, formatPercent } from '@/utils/educationDashboard';
import { AlertTriangle, BarChart3, BellRing, BookOpen, CalendarDays, CheckCircle2, FileDown, GraduationCap, Info, PieChart, RefreshCcw, Users } from 'lucide-react';
import React from 'react';

export const EducationDashboard: React.FC = () => {
  const { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, cohorts, selectedCohort, setSelectedCohort, exporting, exportError, filtersLoading, dashboardLoading, courseDemandLoading, dashboardWarning, alertsLoading, filtersError, dashboardError, courseDemandError, alertsError, filteredPeriods, selectedOjtSemesterId, totalStudents, eligibleStudents, ineligibleStudents, alertCount, assessedStudents, eligiblePercent, ineligiblePercent, periodStatistics, courseDemands, academicAlerts, handleRefresh, handleYearChange, handleExport } = useEducationDashboard();
  const cohortResults = periodStatistics.filter(period => period.label !== 'Chưa phân khóa' && period.eligible + period.ineligible > 0);
  const chartMax = Math.max(4, Math.ceil(Math.max(0, ...cohortResults.map(period => period.eligible + period.ineligible)) / 4) * 4);
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =============================================
            HEADER
            ============================================= */}

        <header className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold text-orange-600">
                Trang chủ / Phòng Đào tạo
              </p>

              <h1 className="mt-2 text-xl font-extrabold text-slate-900">
                Tổng quan học vụ và OJT
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Theo dõi sinh viên, kết quả xét OJT đã lưu từ FE và tình hình học vụ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw size={14} />
                Tải lại
              </button>

              <button
                type="button"
                disabled={exporting || dashboardLoading}
                onClick={handleExport}
                title="Xuất nhu cầu học phần theo phạm vi đang chọn"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileDown size={14} />
                {exporting ? 'Đang xuất...' : 'Xuất nhu cầu CSV'}
              </button>
            </div>
          </div>
        </header>

        {/* =============================================
            FILTERS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-orange-500" />

            <h2 className="text-sm font-bold text-slate-800">
              Phạm vi thống kê
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="dashboard-year"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Năm học
              </label>

              <select
                id="dashboard-year"
                value={selectedYear}
                onChange={handleYearChange}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 disabled:opacity-60"
              >
                <option value="">Tất cả năm học</option>

                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dashboard-period"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Kỳ học
              </label>

              <select
                id="dashboard-period"
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 disabled:opacity-60"
              >
                <option value="">Tất cả kỳ học</option>

                {filteredPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                    {period.code ? ` (${period.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dashboard-cohort"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Khóa
              </label>

              <select
                id="dashboard-cohort"
                value={selectedCohort}
                onChange={event => setSelectedCohort(event.target.value)}
                disabled={filtersLoading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
              >
                <option value="">Tất cả khóa</option>
                {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.cohortCode} — {cohort.name}</option>)}
              </select>
            </div>
          </div>

          {filtersError && (
            <div className="mt-3">
              <ErrorNotice message={filtersError} />
            </div>
          )}
          {exportError && <div className="mt-3"><ErrorNotice message={exportError} /></div>}

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-3 text-xs leading-5 text-blue-600">
            <Info size={15} className="mt-0.5 shrink-0" />

            <span>
              {selectedOjtSemesterId
                  ? "Báo cáo học vụ theo kỳ đã chọn; thống kê điều kiện OJT dùng kết quả FE đã lưu, độc lập với kỳ học."
                  : selectedPeriod
                    ? "Đang xem học vụ theo kỳ học đã chọn; kết quả OJT lấy theo kỳ do hồ sơ API xác định."
                    : selectedYear
                    ? "Năm học đang được dùng để lọc danh sách kỳ học. Backend chưa hỗ trợ lọc trực tiếp thống kê bằng academicYearId nên số liệu bên dưới vẫn thuộc phạm vi toàn hệ thống."
                    : "Đang xem toàn hệ thống. Mỗi sinh viên được tính một lần theo kết quả FE đã lưu; kết quả này không phải quyết định OJT chính thức."}
            </span>
          </div>
        </section>

        {/* =============================================
            OVERVIEW
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê tổng quan
          </h2>

          {dashboardWarning && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{dashboardWarning}</p>}
          {dashboardError && (
            <div className="mb-4">
              <ErrorNotice message={`Dashboard: ${dashboardError}`} />
            </div>
          )}

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
            <div className="border-slate-200 sm:border-r sm:border-b xl:border-b-0">
              <MetricCard
                label="Tổng sinh viên"
                value={totalStudents}
                description="Sinh viên và tài khoản đang hoạt động"
                icon={<Users size={18} />}
                iconClass="bg-blue-50 text-blue-600"
                loading={dashboardLoading && totalStudents === null}
              />
            </div>

            <div className="border-slate-200 sm:border-b xl:border-r xl:border-b-0">
              <MetricCard
                label="Đủ điều kiện OJT"
                value={eligibleStudents}
                description="Theo kết quả FE đã lưu"
                icon={<CheckCircle2 size={18} />}
                iconClass="bg-green-50 text-green-600"
                loading={dashboardLoading}
              />
            </div>

            <div className="border-slate-200 sm:border-r">
              <MetricCard
                label="Chưa đủ điều kiện OJT"
                value={ineligibleStudents}
                description="Cần theo dõi điều kiện OJT"
                icon={<AlertTriangle size={18} />}
                iconClass="bg-red-50 text-red-600"
                loading={dashboardLoading}
              />
            </div>

            <MetricCard
              label="Cảnh báo học vụ"
              value={alertCount}
              description="Cảnh báo được hệ thống ghi nhận"
              icon={<BellRing size={18} />}
              iconClass="bg-orange-50 text-orange-600"
              loading={alertsLoading}
            />
          </div>
        </section>

        {/* =============================================
            OJT STATISTICS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê điều kiện OJT
          </h2>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-2">
            {/* OJT PERCENT */}

            <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
              <SectionTitle
                icon={<PieChart size={18} />}
                title="Tỷ lệ đủ điều kiện OJT"
                description="Tính trên nhóm sinh viên đã có kết quả xét."
                iconClass="bg-green-50 text-green-600"
              />

              {eligiblePercent === null ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có kết quả xét điều kiện OJT"
                  description="Biểu đồ sẽ hiển thị khi API Dashboard trả đủ số sinh viên đã xét."
                />
              ) : (
                <div className="py-7">
                  <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                    <div
                      className="relative h-40 w-40 shrink-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #22c55e 0% ${clampPercent(eligiblePercent)}%,
                          #f87171 ${clampPercent(eligiblePercent)}% 100%
                        )`,
                      }}
                    >
                      <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-2xl font-extrabold text-slate-800">
                          {formatPercent(eligiblePercent)}
                        </span>

                        <span className="mt-1 text-[11px] text-slate-400">
                          Đủ điều kiện
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-green-500" />

                        <div>
                          <p className="text-xs text-slate-500">Đủ điều kiện</p>

                          <p className="text-sm font-bold text-slate-800">
                            {formatNumber(eligibleStudents)} sinh viên
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-red-400" />

                        <div>
                          <p className="text-xs text-slate-500">
                            Chưa đủ điều kiện
                          </p>

                          <p className="text-sm font-bold text-slate-800">
                            {formatNumber(ineligibleStudents)} sinh viên
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">
                        Tổng đã xét: {formatNumber(assessedStudents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                    Tỷ lệ chưa đủ điều kiện:{" "}
                    <strong>{formatPercent(ineligiblePercent ?? 0)}</strong>.
                    Kết quả được lấy từ dữ liệu Backend.
                  </div>
                </div>
              )}
            </div>

            {/* OJT BY COHORT */}

            <div className="p-5">
              <SectionTitle
                icon={<BarChart3 size={18} />}
                title="Kết quả xét điều kiện OJT theo khóa"
                description="Kết quả xét của từng khóa trong phạm vi đã chọn."
                iconClass="bg-blue-50 text-blue-600"
              />

              {cohortResults.length === 0 ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có thống kê theo khóa"
                  description="Chọn kỳ học có liên kết OJT để xem kết quả theo khóa."
                />
              ) : (
                <div className="mt-5">
                  <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Đủ điều kiện
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      Chưa đủ điều kiện
                    </span>
                  </div>
                  <div className="flex h-[270px] gap-2" role="group" aria-label="Biểu đồ số sinh viên đủ và chưa đủ điều kiện OJT theo khóa">
                    <div className="flex h-[220px] w-8 shrink-0 flex-col justify-between text-right text-[11px] text-slate-500">
                      {[chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0].map(value => <span key={value}>{value}</span>)}
                    </div>
                    <div className="min-w-0 flex-1 overflow-x-auto">
                      <div className="relative h-[270px] w-max min-w-full">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-[220px] flex-col justify-between border-b border-l border-slate-300">
                          {[0, 1, 2, 3, 4].map(value => <div key={value} className="border-t border-slate-100" />)}
                        </div>
                        <div className="relative z-10 flex h-full min-w-max items-start gap-4 px-4">
                          {cohortResults.map((period, index) => {
                            const total = period.eligible + period.ineligible;
                            const details = `${period.label}: ${period.eligible} sinh viên đủ điều kiện, ${period.ineligible} sinh viên chưa đủ điều kiện`;
                            return (
                              <div key={`${period.label}-${index}`} className="flex h-full min-w-[88px] max-w-[130px] flex-1 flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-orange-400" title={details} role="img" aria-label={details} tabIndex={0}>
                                <div className="flex h-[220px] w-full flex-col items-center justify-end">
                                  <span className="mb-1 text-xs font-semibold text-slate-700">{total}</span>
                                  <div className="flex w-12 flex-col-reverse overflow-hidden rounded-t-sm" style={{ height: `${total / chartMax * 196}px` }}>
                                    <div className="bg-green-500" style={{ height: `${period.eligible / total * 100}%` }} />
                                    <div className="bg-red-300" style={{ height: `${period.ineligible / total * 100}%` }} />
                                  </div>
                                </div>
                                <span className="mt-2 w-full break-words text-center text-xs font-medium text-slate-700">{period.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-500">Khóa sinh viên · Số lượng sinh viên</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            ACADEMIC STATISTICS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            Thống kê học tập
          </h2>

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-2">
            {/* YEARLY OJT ELIGIBILITY */}

            <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
              <SectionTitle
                icon={<GraduationCap size={18} />}
                title="Tỷ lệ sinh viên đủ điều kiện OJT theo năm học"
                description="Tỷ lệ trên tổng sinh viên có kết quả xét hợp lệ của từng năm học."
                iconClass="bg-blue-50 text-blue-600"
              />

              <div className="mt-5" aria-label="Biểu đồ tỷ lệ đủ điều kiện OJT theo năm học">
                <div className="flex h-[250px] gap-3">
                  <div className="flex w-10 shrink-0 flex-col justify-between pb-px text-right text-[11px] text-slate-500">
                    <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
                  </div>
                  <div className="relative min-w-0 flex-1 border-b border-l border-slate-300">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                      {[0, 25, 50, 75, 100].map(value => <div key={value} className="border-t border-slate-100" />)}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu theo năm học</p>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Dữ liệu kết quả xét hiện chưa gắn với năm học để tính tỷ lệ chính xác.</p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 pl-10 text-center text-xs text-slate-500">Năm học</p>
              </div>
            </div>

            {/* COURSE DEMAND */}

            <div className="p-5">
              <SectionTitle
                icon={<BookOpen size={18} />}
                title="Nhu cầu học phần"
                description="Các học phần có nhu cầu học từ dữ liệu học vụ."
                iconClass="bg-orange-50 text-orange-600"
              />

              {courseDemandError && (
                <div className="mt-4">
                  <ErrorNotice message={courseDemandError} />
                </div>
              )}

              {courseDemands.length === 0 ? (
                <EmptyState
                  loading={courseDemandLoading}
                  title="Chưa có thống kê nhu cầu học phần"
                  description="Chưa có dữ liệu học phần phù hợp từ Backend."
                />
              ) : (
                <div className="mt-5 divide-y divide-[#E2E8F0]">
                  {courseDemands.slice(0, 5).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between gap-4 bg-white py-3 transition-colors duration-150 hover:bg-[#EAF2FF]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">
                          {course.code}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {course.name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-orange-600">
                          {formatNumber(course.count)}
                        </p>

                        <p className="text-[11px] text-slate-400">Sinh viên</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            ACADEMIC ALERTS
            ============================================= */}

        <section className="px-5 py-5 md:px-7">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionTitle
              icon={<BellRing size={18} />}
              title="Danh sách cảnh báo học vụ"
              description="Các cảnh báo được hệ thống ghi nhận để Phòng Đào tạo theo dõi."
              iconClass="bg-orange-50 text-orange-600"
            />

            <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600">
              Tổng cảnh báo: {formatNumber(alertCount)}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            {alertsError && (
              <div className="m-4">
                <ErrorNotice message={alertsError} />
              </div>
            )}

            {academicAlerts.length === 0 ? (
              <EmptyState
                loading={alertsLoading}
                title="Chưa có cảnh báo học vụ"
                description="Chưa có dữ liệu cảnh báo được trả về cho phạm vi đang chọn."
              />
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {academicAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 bg-white px-5 py-4 transition-colors duration-150 hover:bg-[#EAF2FF]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                      <AlertTriangle size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {alert.title}
                      </p>

                      {alert.description && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {alert.description}
                        </p>
                      )}
                    </div>

                    {alert.date && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(alert.date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =============================================
            FOOTER
            ============================================= */}

        <footer className="flex items-start gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 md:px-7">
          <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />

          <span>
            Dashboard chỉ hiển thị số liệu do Backend cung cấp. Hệ thống không
            tự xét điều kiện OJT, không tự tạo cảnh báo AI và không sử dụng dữ
            liệu giả. Những thống kê chưa có dữ liệu phù hợp sẽ được để trống.
          </span>
        </footer>
      </div>
    </div>
  );
};

export default EducationDashboard;
