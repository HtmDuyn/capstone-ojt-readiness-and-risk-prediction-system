import { EmptyState, ErrorNotice, MetricCard, SectionTitle } from '@/components/education/EducationUi';
import { CohortResultsChart } from '@/components/education/CohortResultsChart';
import { OjtResultDonut } from '@/components/education/OjtResultDonut';
import { PageBanner } from '@/components/common/PageBanner';
import { courseDemandOverview } from '@/utils/education/courseDemandOverview';
import { useEducationDashboard } from '@/hooks/education/useEducationDashboard';
import { useNearViewport } from '@/hooks/shared/useNearViewport';
import { formatDate, formatNumber, formatPercent } from '@/utils/education/educationDashboard';
import { AlertTriangle, BarChart3, BookOpen, CalendarDays, CheckCircle2, FileDown, Info, PieChart, Users } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const EducationDashboard: React.FC = () => {
  const { ref: demandSection, reached: loadCourseDemand } = useNearViewport<HTMLElement>();

  const { academicYears, selectedYear, selectedPeriod, setSelectedPeriod, cohorts, selectedCohort, setSelectedCohort, exporting, exportError, filtersLoading, dashboardLoading, courseDemandLoading, dashboardWarning, filtersError, dashboardError, courseDemandError, filteredPeriods, selectedOjtSemesterId, totalStudents, eligibleStudents, ineligibleStudents, assessedStudents, periodStatistics, courseDemands, handleYearChange, handleExport } = useEducationDashboard(loadCourseDemand);
  const cohortResults = periodStatistics.filter(period => period.label !== 'Chưa phân khóa' && period.eligible + period.ineligible > 0);
  const ojtGroups = [
    { label: 'Đủ điều kiện', count: eligibleStudents ?? 0, color: '#22c55e', dotClass: 'bg-green-500' },
    { label: 'Chưa đủ điều kiện', count: ineligibleStudents ?? 0, color: '#f87171', dotClass: 'bg-red-400' },
  ];
  const demandOverview = courseDemandOverview(courseDemands);
  const hasCourseDemandScope = Boolean(selectedPeriod && selectedOjtSemesterId);
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <PageBanner
        variant="education"
        title="Tổng quan học vụ và OJT"
        badge="Phòng Đào tạo"
        description="Theo dõi tình hình học tập, điều kiện thực tập OJT và các chỉ số học vụ của sinh viên."
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =============================================
            FILTERS
            ============================================= */}

        <section className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold text-slate-800">Phạm vi thống kê</h2>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
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
                {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.cohortCode || cohort.name}</option>)}
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
              {selectedPeriod
                  ? "Số liệu được lọc theo kỳ học hiện tại trong hồ sơ sinh viên; kết quả xét OJT là kết quả đã lưu gần nhất của các sinh viên trong phạm vi này."
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

          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-3">
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
                description="Theo kết quả xét OJT đã lưu"
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
                  </div>
                  <CohortResultsChart results={cohortResults} />
                  <p className="text-center text-xs text-slate-500">Khóa sinh viên · Số lượng sinh viên</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            ACADEMIC STATISTICS
            ============================================= */}

        <section ref={demandSection} className="border-b border-slate-200 px-5 py-5 md:px-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Thống kê học tập</h2>
            <Link to="/education/ai-class-proposals" className="text-sm font-semibold text-orange-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">Xem chi tiết nhu cầu lớp hỗ trợ</Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ['Học phần có nhu cầu', hasCourseDemandScope ? demandOverview.courseCount : null, 'Học phần duy nhất từ nhu cầu học, không riêng học lại'],
              ['Lượt nhu cầu học', hasCourseDemandScope ? demandOverview.demandCount : null, 'Cặp sinh viên – học phần duy nhất trong phạm vi đang xem'],
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
                  title={hasCourseDemandScope ? 'Chưa có thống kê nhu cầu học phần' : 'Chọn kỳ học để xem nhu cầu học phần'}
                  description={hasCourseDemandScope
                    ? 'Chưa có dữ liệu học phần phù hợp để hiển thị.'
                    : selectedPeriod
                      ? 'Kỳ học đã chọn chưa được liên kết với kỳ OJT. Hãy chọn kỳ học có kỳ OJT tương ứng.'
                      : 'Báo cáo nhu cầu cần một kỳ học cụ thể. Chọn kỳ ở bộ lọc phía trên để tải dữ liệu.'}
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

      </div>
    </div>
  );
};

export default EducationDashboard;
