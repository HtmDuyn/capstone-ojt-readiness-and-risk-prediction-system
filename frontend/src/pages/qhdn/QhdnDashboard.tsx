import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  XCircle,
  FileCheck2,
  Handshake,
  Calendar,
  Layers,
  Search,
  BarChart3,
  List,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import { PageBanner } from '@/components/common/PageBanner';
import {
  MOCK_ELIGIBLE_STUDENTS,
  MOCK_ENTERPRISE_PARTNERS,
  SEMESTER_OPTIONS,
  MOCK_SEMESTER_STATS,
} from '@/data/qhdn/qhdnMockData';
import type { SemesterOption } from '@/types/qhdn/qhdnTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const QhdnDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<SemesterOption>('Summer 2026');
  const stats = MOCK_SEMESTER_STATS[selectedSemester];

  // Quota view mode: Chart (Top 8) vs Table (Toàn bộ 50+ DN)
  const [quotaViewMode, setQuotaViewMode] = useState<'chart' | 'list'>('chart');
  const [quotaSearch, setQuotaSearch] = useState('');

  // Canvas references for ChartJS
  const semesterChartRef = useRef<HTMLCanvasElement | null>(null);
  const semesterChartInstance = useRef<ChartJS | null>(null);

  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<ChartJS | null>(null);

  // Filter rejected students requiring re-allocation
  const rejectedStudents = MOCK_ELIGIBLE_STUDENTS.filter(
    (s) => s.coordinationStatus === 'Rejected'
  );

  // Top partners sorted by total quota
  const sortedPartners = useMemo(() => {
    return [...MOCK_ENTERPRISE_PARTNERS].sort((a, b) => b.totalQuota - a.totalQuota);
  }, []);

  const top8Partners = useMemo(() => {
    return sortedPartners.slice(0, 8);
  }, [sortedPartners]);

  // Search filtered partners for full ranking list
  const fullRankingPartners = useMemo(() => {
    const q = quotaSearch.trim().toLowerCase();
    if (!q) return sortedPartners;
    return sortedPartners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q)
    );
  }, [sortedPartners, quotaSearch]);

  // Render combo chart for Acceptance rate & Enterprise response trend
  useEffect(() => {
    if (!semesterChartRef.current) return;

    if (semesterChartInstance.current) {
      semesterChartInstance.current.destroy();
    }

    const ctx = semesterChartRef.current.getContext('2d');
    if (!ctx) return;

    const semesters = [...SEMESTER_OPTIONS].reverse();
    const placedData = semesters.map((sem) => MOCK_SEMESTER_STATS[sem].placedStudents);
    const rejectedData = semesters.map((sem) => MOCK_SEMESTER_STATS[sem].rejectedStudents);
    const acceptanceRates = semesters.map((sem) => MOCK_SEMESTER_STATS[sem].acceptanceRate);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: semesters,
        datasets: [
          {
            type: 'bar' as const,
            label: 'SV Đã tiếp nhận',
            data: placedData,
            backgroundColor: '#0f766e',
            borderRadius: 4,
            yAxisID: 'yCount',
          },
          {
            type: 'bar' as const,
            label: 'SV Bị từ chối',
            data: rejectedData,
            backgroundColor: '#e11d48',
            borderRadius: 4,
            yAxisID: 'yCount',
          },
          {
            type: 'line' as const,
            label: 'Tỷ lệ tiếp nhận (%)',
            data: acceptanceRates,
            borderColor: '#ea580c',
            backgroundColor: '#ea580c',
            borderWidth: 2.5,
            tension: 0.2,
            pointRadius: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ea580c',
            pointBorderWidth: 2,
            yAxisID: 'yPercent',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: 'Inter, sans-serif', size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter, sans-serif', size: 11 } },
          },
          yCount: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Inter, sans-serif', size: 11 },
              callback: (val: string | number) => `${val} SV`,
            },
          },
          yPercent: {
            type: 'linear',
            position: 'right',
            beginAtZero: false,
            min: 60,
            max: 100,
            grid: { display: false },
            ticks: {
              font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
              color: '#ea580c',
              callback: (val: string | number) => `${val}%`,
            },
          },
        },
      } as any,
    };

    semesterChartInstance.current = new ChartJS(ctx, config);

    return () => {
      if (semesterChartInstance.current) {
        semesterChartInstance.current.destroy();
      }
    };
  }, []);

  // Render Horizontal Bar Chart for Top 8 Enterprise Quota
  useEffect(() => {
    if (quotaViewMode !== 'chart' || !categoryChartRef.current) return;

    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }

    const ctx = categoryChartRef.current.getContext('2d');
    if (!ctx) return;

    const entNames = top8Partners.map((e) => e.code);
    const acceptedSlots = top8Partners.map((e) => e.acceptedCount);
    const availableSlots = top8Partners.map((e) => e.availableQuota);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: entNames,
        datasets: [
          {
            label: 'Đã tiếp nhận',
            data: acceptedSlots,
            backgroundColor: '#0284c7',
            borderRadius: 4,
          },
          {
            label: 'Slot còn lại',
            data: availableSlots,
            backgroundColor: '#e2e8f0',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Inter, sans-serif', size: 12 } },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter, sans-serif', size: 11 } },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: 'Inter, sans-serif', size: 11, weight: 'bold' } },
          },
        },
      } as any,
    };

    categoryChartInstance.current = new ChartJS(ctx, config);

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
    };
  }, [quotaViewMode, top8Partners]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Banner */}
      <PageBanner
        title="Dashboard Điều phối Quan hệ Doanh nghiệp"
        description="Giám sát tỷ lệ doanh nghiệp tiếp nhận thực tập, tình hình phân bổ sinh viên và tiến độ phản hồi theo từng học kỳ."
        badge="Phòng QHDN"
      />

      {/* Filter Toolbar: Semester Selector */}
      <div className="card-glass border border-slate-200/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chọn học kỳ theo dõi
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu báo cáo và chỉ số tiếp nhận sẽ được tự động cập nhật
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="semester-select" className="sr-only">
            Chọn học kỳ theo dõi
          </label>
          <select
            id="semester-select"
            value={selectedSemester}
            onChange={(event) => setSelectedSemester(event.target.value as SemesterOption)}
            className="w-full sm:min-w-48 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 shadow-xs cursor-pointer"
          >
            {SEMESTER_OPTIONS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Tổng SV Đủ điều kiện ({selectedSemester})
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.totalEligibleStudents}
          </p>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp size={13} className="text-emerald-600" />
            <span>Chuyển giao từ PĐT</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Tỷ lệ DN tiếp nhận thành công
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.acceptanceRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Đã chốt: <strong className="text-slate-800 font-bold">{stats.placedStudents}</strong> / {stats.totalEligibleStudents} SV
          </p>
        </div>

        {/* KPI 3 */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Doanh nghiệp đối tác kỳ này
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.totalPartnerEnterprises}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tỷ lệ phản hồi: <strong className="text-slate-800">{stats.enterpriseResponseRate}%</strong>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Cần điều phối lại (DN từ chối)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">
            {stats.rejectedStudents}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Đã xử lý lại: <strong className="text-slate-800">{stats.reassignedStudents} SV</strong>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Trend Across Semesters */}
        <div className="card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tỷ lệ Tiếp nhận & Phản hồi qua các học kỳ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê số sinh viên tiếp nhận vs từ chối theo từng kỳ
              </p>
            </div>
            <TrendingUp className="text-slate-400" size={18} />
          </div>
          <div className="relative w-full h-72">
            <canvas ref={semesterChartRef} />
          </div>
        </div>

        {/* Chart 2: TỐI ƯU HÓA KHI CÓ 50-60 DOANH NGHIỆP LIÊN KẾT */}
        <div className="card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Phân bổ chỉ tiêu Quota Doanh nghiệp ({MOCK_ENTERPRISE_PARTNERS.length} DN)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {quotaViewMode === 'chart'
                  ? 'Biểu đồ Top 8 đối tác có quy mô tiếp nhận lớn nhất'
                  : 'Bảng xếp hạng đầy đủ chỉ tiêu tất cả đối tác'}
              </p>
            </div>

            {/* Toggle view mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setQuotaViewMode('chart')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  quotaViewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
                title="Xem dạng biểu đồ Top 8"
              >
                <BarChart3 size={13} />
                Top 8
              </button>
              <button
                type="button"
                onClick={() => setQuotaViewMode('list')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  quotaViewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
                title="Xem toàn bộ danh sách đối tác"
              >
                <List size={13} />
                Toàn bộ
              </button>
            </div>
          </div>

          {/* View Mode 1: Top 8 Chart */}
          {quotaViewMode === 'chart' && (
            <div className="relative w-full h-72">
              <canvas ref={categoryChartRef} />
            </div>
          )}

          {/* View Mode 2: Full Scrollable Ranking List (Hỗ trợ 50-60+ DN dễ dàng) */}
          {quotaViewMode === 'list' && (
            <div className="space-y-2 h-72 flex flex-col">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm doanh nghiệp trong danh sách..."
                  value={quotaSearch}
                  onChange={(e) => setQuotaSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {fullRankingPartners.map((ent, idx) => {
                  const fill = Math.round((ent.acceptedCount / ent.totalQuota) * 100);
                  return (
                    <div
                      key={ent.id}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-3 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 text-center text-slate-400 font-bold">{idx + 1}</span>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{ent.name}</p>
                          <p className="text-[11px] text-slate-400">Mã: {ent.code}</p>
                        </div>
                      </div>

                      <div className="w-36 shrink-0">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                          <span>{ent.acceptedCount} / {ent.totalQuota}</span>
                          <span>{fill}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${fill}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Widgets: Xóa Avatar, Xóa Readiness, Tối giản màu */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Widget 1: Sinh viên bị từ chối */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Sinh viên bị từ chối cần Điều phối lại
                </h2>
                <p className="text-xs text-slate-500">
                  Danh sách ưu tiên ghép cặp sang doanh nghiệp khác còn chỉ tiêu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/qhdn/coordination')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Mở trang điều phối
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {rejectedStudents.map((std) => (
              <div
                key={std.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {std.fullName} <span className="font-normal text-xs text-slate-500">({std.studentCode})</span>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Ngành: <span className="font-medium text-slate-800">{std.major}</span>
                  </p>
                  <p className="text-rose-700 mt-1 italic">
                    Lý do: {std.rejectionReason}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/qhdn/coordination')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  Điều phối lại
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Phản hồi tiếp nhận mới nhất */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Phản hồi tiếp nhận mới nhất từ Doanh nghiệp
                </h2>
                <p className="text-xs text-slate-500">
                  Cập nhật trạng thái duyệt hồ sơ từ các nhà tuyển dụng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/qhdn/enterprises')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Xem DN đối tác
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {MOCK_ELIGIBLE_STUDENTS.filter((s) => s.assignedEnterpriseName).slice(0, 3).map((std) => (
              <div
                key={std.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {std.fullName} <span className="font-normal text-xs text-slate-500">⟶ {std.assignedEnterpriseName}</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Vị trí: <span className="font-medium text-slate-700">{std.assignedPositionTitle || 'Thực tập sinh'}</span>
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                  Đã tiếp nhận
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QhdnDashboard;
