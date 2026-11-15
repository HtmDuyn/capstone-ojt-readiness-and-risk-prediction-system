import { EmptyState, ErrorNotice, MetricCard, SectionTitle } from '@/components/education/EducationUi';
import { OjtResultDonut } from '@/components/education/OjtResultDonut';
import { courseDemandOverview } from '@/utils/courseDemandOverview';
import { useEducationDashboard } from '@/hooks/useEducationDashboard';
import { formatDate, formatNumber, formatPercent } from '@/utils/educationDashboard';
import { AlertTriangle, BarChart3, BellRing, BookOpen, CalendarDays, CheckCircle2, FileDown, Info, PieChart, Users } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const EducationDashboard: React.FC = () => {
  const { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, cohorts, selectedCohort, setSelectedCohort, exporting, exportError, filtersLoading, dashboardLoading, courseDemandLoading, dashboardWarning, alertsLoading, filtersError, dashboardError, courseDemandError, alertsError, filteredPeriods, selectedOjtSemesterId, totalStudents, eligibleStudents, ineligibleStudents, reviewRequiredStudents, alertCount, alertOverview, assessedStudents, periodStatistics, courseDemands, handleYearChange, handleExport } = useEducationDashboard();
  const cohortResults = periodStatistics.filter(period => period.label !== 'Chưa phân khóa' && period.eligible + period.ineligible + period.reviewRequired > 0);
  const chartMax = Math.max(4, Math.ceil(Math.max(0, ...cohortResults.map(period => period.eligible + period.ineligible + period.reviewRequired)) / 4) * 4);
  const ojtGroups = [
    { label: 'Đủ điều kiện', count: eligibleStudents ?? 0, color: '#22c55e', dotClass: 'bg-green-500' },
    { label: 'Chưa đủ điều kiện', count: ineligibleStudents ?? 0, color: '#f87171', dotClass: 'bg-red-400' },
    { label: 'Cần đối soát', count: reviewRequiredStudents ?? 0, color: '#fb923c', dotClass: 'bg-orange-400' },
  ];
  const demandOverview = courseDemandOverview(courseDemands);
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =============================================
            HEADER
            ============================================= */}

        <header className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Tổng quan học vụ và OJT
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Theo dõi tình hình học tập, điều kiện thực tập OJT và các chỉ số học vụ của sinh viên.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
              <button
                type="button"
                disabled={exporting || dashboardLoading}
                onClick={handleExport}
                title="Xuất CSV nhu cầu học phần theo phạm vi đang chọn"
                className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileDown size={16} aria-hidden="true" />
                {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
              </button>
              <span className="text-xs text-slate-500">CSV nhu cầu học phần</span>
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
                  ? "Báo cáo học vụ theo kỳ đã chọn; kết quả xét điều kiện OJT được tổng hợp riêng, không phụ thuộc kỳ học và chưa phải quyết định chính thức."
                  : selectedPeriod
                    ? "Đang xem học vụ theo kỳ học đã chọn; kết quả xét điều kiện OJT theo kỳ ghi nhận trong hồ sơ và chưa phải quyết định chính thức."
                    : selectedYear
                    ? "Năm học chỉ lọc danh sách kỳ học; số liệu bên dưới vẫn tổng hợp toàn hệ thống. Kết quả xét điều kiện OJT phục vụ theo dõi, chưa phải quyết định chính thức."
                    : "Dữ liệu tổng hợp theo phạm vi đã chọn, mỗi sinh viên được tính một lần. Kết quả xét điều kiện OJT phục vụ công tác theo dõi và chuẩn bị thực tập, chưa phải quyết định chính thức."}
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
                title="Tổng hợp kết quả xét điều kiện OJT"
                description="Kết quả xét đã lưu của sinh viên trong phạm vi thống kê; không phải tỷ lệ của một kỳ OJT cụ thể."
                iconClass="bg-green-50 text-green-600"
              />

              {dashboardError ? <ErrorNotice message={dashboardError} /> : assessedStudents === null || assessedStudents === 0 ? (
                <EmptyState
                  loading={dashboardLoading}
                  title="Chưa có kết quả xét điều kiện OJT"
                  description="Chưa có kết quả xét đã lưu trong phạm vi đang xem."
                />
              ) : (
                <div className="py-5">
                  <OjtResultDonut groups={ojtGroups} />
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
                  description="Chưa có kết quả xét đã lưu theo khóa trong phạm vi đang xem."
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
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />Cần đối soát</span>
                  </div>
                  <div className="flex h-[270px] gap-2" role="group" aria-label="Biểu đồ kết quả xét điều kiện OJT theo khóa">
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
                            const total = period.eligible + period.ineligible + period.reviewRequired;
                            const details = `${period.label}: ${period.eligible} sinh viên đủ điều kiện, ${period.ineligible} sinh viên chưa đủ điều kiện, ${period.reviewRequired} sinh viên cần đối soát`;
                            return (
                              <div key={`${period.label}-${index}`} className="flex h-full min-w-[88px] max-w-[130px] flex-1 flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-orange-400" title={details} role="img" aria-label={details} tabIndex={0}>
                                <div className="flex h-[220px] w-full flex-col items-center justify-end">
                                  <span className="mb-1 text-xs font-semibold text-slate-700">{total}</span>
                                  <div className="flex w-12 flex-col-reverse rounded-t-sm" style={{ height: `${total / chartMax * 196}px` }}>
                                    {([['Đủ điều kiện', period.eligible, 'bg-green-500'], ['Chưa đủ điều kiện', period.ineligible, 'bg-red-400'], ['Cần đối soát', period.reviewRequired, 'bg-orange-400']] as const).map(([label, count, color]) => count > 0 && <div key={label} tabIndex={0} title={`${period.label} · ${label}: ${count} sinh viên`} aria-label={`${period.label} · ${label}: ${count} sinh viên`} className={`relative cursor-pointer transition-[filter,transform] duration-200 hover:z-10 hover:scale-x-110 hover:brightness-110 focus:z-10 focus:scale-x-110 focus:brightness-110 ${color}`} style={{ height: `${count / total * 100}%` }} />)}
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Thống kê học tập</h2>
            <Link to="/education/ai-class-proposals" className="text-sm font-semibold text-orange-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">Xem chi tiết nhu cầu lớp hỗ trợ</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ['Học phần có nhu cầu', demandOverview.courseCount, 'Học phần duy nhất từ nhu cầu học, không riêng học lại'],
              ['Lượt nhu cầu học', demandOverview.demandCount, 'Cặp sinh viên – học phần duy nhất trong phạm vi đang xem'],
              ['Lớp hỗ trợ đề xuất', null, 'Cần chọn kỳ học/Block 3 tại trang nhu cầu lớp hỗ trợ'],
            ] as const).map(([label, value, description], index) => <div key={label} className="flex min-h-32 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`mb-3 h-1 w-10 rounded-full ${['bg-orange-400', 'bg-blue-400', 'bg-emerald-400'][index]}`} aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="mt-2 text-3xl font-extrabold leading-none text-slate-900">{courseDemandLoading ? 'Đang tải…' : formatNumber(courseDemandError ? null : value)}</p>
              <p className="mt-auto pt-2 text-xs leading-5 text-slate-500">{description}</p>
            </div>)}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-bold text-slate-800">Top 5 học phần có nhu cầu cao nhất</h3>

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
                <div className="mt-3 max-w-full overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[850px] table-fixed text-left text-sm">
                    <thead className="bg-slate-100 text-xs font-semibold text-slate-700"><tr>
                      <th scope="col" className="w-14 px-3 py-2 text-center">STT</th>
                      <th scope="col" className="w-28 px-3 py-2">Mã môn học</th>
                      <th scope="col" className="w-[34%] px-3 py-2">Tên môn học</th>
                      <th scope="col" className="w-36 px-3 py-2">Kỳ học</th>
                      <th scope="col" className="w-36 px-3 py-2">Kỳ OJT</th>
                      <th scope="col" className="w-28 px-3 py-2 text-right">Số sinh viên</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-200">
                      {demandOverview.top.map((course, index) => <tr key={course.id} className="align-top transition-colors hover:bg-orange-50/60">
                        <td className="px-3 py-2 text-center text-slate-500">{index + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{course.code}</td>
                        <td className="break-words px-3 py-2 text-slate-700" title={course.name}>{course.name}</td>
                        <td className="break-words px-3 py-2 text-slate-600">{course.periodName ?? '—'}</td>
                        <td className="break-words px-3 py-2 text-slate-600">{course.ojtSemesterName ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-orange-600">{formatNumber(course.count)}</td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </section>

        {/* =============================================
            ACADEMIC ALERTS
            ============================================= */}

        <section className="px-5 py-5 md:px-7">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionTitle
              icon={<BellRing size={18} />}
              title="Tổng quan cảnh báo học vụ"
              description="Số liệu theo phạm vi thống kê đang chọn."
              iconClass="bg-orange-50 text-orange-600"
            />
            <Link to="/education/student-status" className="text-sm font-semibold text-orange-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">Xem danh sách sinh viên</Link>
          </div>

          <div className="bg-white">
            {alertsError && (
              <div className="mb-4">
                <ErrorNotice message={alertsError} />
              </div>
            )}

            {!alertOverview || alertOverview.total === 0 ? (
              <EmptyState
                loading={alertsLoading}
                title="Chưa có cảnh báo học vụ"
                description="Chưa có cảnh báo trong phạm vi đang xem."
              />
            ) : (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4"><p className="text-sm text-slate-600">Tổng số cảnh báo</p><p className="mt-1 text-2xl font-bold text-orange-700">{formatNumber(alertOverview.total)}</p></div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-600">Sinh viên có cảnh báo</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(alertOverview.studentCount)}</p></div>
                </div>
                <h3 className="mt-5 text-sm font-bold text-slate-800">Theo loại cảnh báo</h3>
                <div className={`mt-3 grid gap-3 ${alertOverview.groups.length === 1 ? 'grid-cols-1' : alertOverview.groups.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {alertOverview.groups.map(group => <div key={group.type} className="flex min-h-20 min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-orange-50/60"><span className="min-w-0 break-words text-sm text-slate-700">{group.label}</span><strong className="shrink-0 text-lg tabular-nums text-orange-700">{formatNumber(group.count)}</strong></div>)}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default EducationDashboard;
