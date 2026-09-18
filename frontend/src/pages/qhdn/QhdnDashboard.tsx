import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Handshake,
  Clock,
  XCircle,
  FileCheck2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';
import { PageBanner } from '@/components/common/PageBanner';
import {
  SEMESTER_OPTIONS,
  MOCK_SEMESTER_STATS,
  MOCK_ELIGIBLE_STUDENTS,
  MOCK_ENTERPRISE_PARTNERS,
} from '@/data/qhdn/qhdnMockData';
import type { SemesterOption } from '@/types/qhdn/qhdnTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend
);

export const QhdnDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<SemesterOption>('Summer 2026');
  const stats = MOCK_SEMESTER_STATS[selectedSemester];

  // Canvas references for ChartJS
  const semesterChartRef = useRef<HTMLCanvasElement | null>(null);
  const semesterChartInstance = useRef<ChartJS | null>(null);

  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<ChartJS | null>(null);

  // Filter rejected students requiring re-allocation
  const rejectedStudents = MOCK_ELIGIBLE_STUDENTS.filter(
    (s) => s.coordinationStatus === 'Rejected'
  );

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
            backgroundColor: '#10b981',
            borderRadius: 6,
            yAxisID: 'yCount',
          },
          {
            type: 'bar' as const,
            label: 'SV Bị từ chối',
            data: rejectedData,
            backgroundColor: '#ef4444',
            borderRadius: 6,
            yAxisID: 'yCount',
          },
          {
            type: 'line' as const,
            label: 'Tỷ lệ tiếp nhận (%)',
            data: acceptanceRates,
            borderColor: '#f97316',
            backgroundColor: '#f97316',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#f97316',
            pointBorderWidth: 3,
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
              font: { family: 'Outfit, sans-serif', size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Outfit, sans-serif', size: 11, weight: 'bold' } },
          },
          yCount: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Outfit, sans-serif', size: 11 },
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
              font: { family: 'Outfit, sans-serif', size: 11, weight: 'bold' },
              color: '#f97316',
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

  // Render Horizontal Bar Chart for Enterprise Quota distribution
  useEffect(() => {
    if (!categoryChartRef.current) return;

    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }

    const ctx = categoryChartRef.current.getContext('2d');
    if (!ctx) return;

    const entNames = MOCK_ENTERPRISE_PARTNERS.map((e) => e.code);
    const acceptedSlots = MOCK_ENTERPRISE_PARTNERS.map((e) => e.acceptedCount);
    const availableSlots = MOCK_ENTERPRISE_PARTNERS.map((e) => e.availableQuota);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: entNames,
        datasets: [
          {
            label: 'Đã tiếp nhận',
            data: acceptedSlots,
            backgroundColor: '#3b82f6',
            borderRadius: 6,
          },
          {
            label: 'Slot còn lại',
            data: availableSlots,
            backgroundColor: '#e2e8f0',
            borderRadius: 6,
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
            labels: { font: { family: 'Outfit, sans-serif', size: 12 } },
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
            ticks: { font: { family: 'Outfit, sans-serif', size: 11 } },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: 'Outfit, sans-serif', size: 11, weight: 'bold' } },
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
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Banner */}
      <PageBanner
        title="Dashboard Điều phối Quan hệ Doanh nghiệp"
        description="Giám sát tỷ lệ doanh nghiệp tiếp nhận thực tập, tình hình phân bổ sinh viên và tiến độ phản hồi theo từng học kỳ."
        badge="Phòng QHDN"
      />

      {/* Filter Toolbar: Semester Selector */}
      <div className="card-glass p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Calendar size={20} />
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

        {/* Semester Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {SEMESTER_OPTIONS.map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSelectedSemester(sem)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${selectedSemester === sem
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {sem}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Tổng SV Đủ điều kiện ({selectedSemester})
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.totalEligibleStudents}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp size={14} /> Chuyển giao từ PĐT
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Acceptance Rate */}
        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Tỷ lệ DN tiếp nhận thành công
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.acceptanceRate}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Đã chốt: <strong className="text-slate-900">{stats.placedStudents}</strong> / {stats.totalEligibleStudents} SV
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Partner Enterprises & Quota */}
        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Doanh nghiệp đối tác kỳ này
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {stats.totalPartnerEnterprises}
              </p>
              <p className="mt-1 text-xs text-purple-600 font-medium">
                Tỷ lệ phản hồi: {stats.enterpriseResponseRate}%
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        {/* Rejected needing re-allocation */}
        <div className="card-glass p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Cần điều phối lại (DN từ chối)
              </p>
              <p className="mt-2 text-2xl font-extrabold text-red-600">
                {stats.rejectedStudents}
              </p>
              <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                <RefreshCw size={13} className="animate-spin" /> Đã xử lý lại: {stats.reassignedStudents} SV
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Trend Across Semesters */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tỷ lệ Tiếp nhận & Phản hồi Doanh nghiệp qua các học kỳ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê số sinh viên được tiếp nhận vs bị từ chối và xu hướng tỷ lệ thành công
              </p>
            </div>
            <TrendingUp className="text-orange-500" size={20} />
          </div>
          <div className="relative w-full h-72">
            <canvas ref={semesterChartRef} />
          </div>
        </div>

        {/* Chart 2: Enterprise Quota & Allocation */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Phân bổ chỉ tiêu Quota các Doanh nghiệp lớn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh số lượng slot sinh viên đã chốt tiếp nhận so với chỉ tiêu sẵn có
              </p>
            </div>
            <Building2 className="text-blue-500" size={20} />
          </div>
          <div className="relative w-full h-72">
            <canvas ref={categoryChartRef} />
          </div>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Widget 1: Re-allocation Priority Action */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <RefreshCw size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
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
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Mở trang điều phối
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {rejectedStudents.map((std) => (
              <div
                key={std.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={std.avatarUrl || 'https://via.placeholder.com/40'}
                    alt={std.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{std.fullName}</span>
                      <span className="text-xs text-slate-500">({std.studentCode})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chuyên ngành: <span className="font-medium text-slate-700">{std.major}</span> | Readiness: <span className="font-bold text-orange-600">{std.readinessScore} pts</span>
                    </p>
                    <p className="text-[11px] text-red-600 mt-1 italic">
                      Lý do: {std.rejectionReason}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/qhdn/coordination')}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Handshake size={14} />
                  Điều phối lại
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Recent Enterprise Responses */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
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
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Xem DN đối tác
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_ELIGIBLE_STUDENTS.filter((s) => s.assignedEnterpriseName).slice(0, 3).map((std) => (
              <div
                key={std.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${std.coordinationStatus === 'Accepted'
                        ? 'bg-green-100 text-green-600'
                        : std.coordinationStatus === 'Pending Response'
                          ? 'bg-orange-100 text-orange-600'
                          : std.coordinationStatus === 'Interviewing'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-red-100 text-red-600'
                      }`}
                  >
                    {std.coordinationStatus === 'Accepted' && <CheckCircle2 size={18} />}
                    {std.coordinationStatus === 'Pending Response' && <Clock size={18} />}
                    {std.coordinationStatus === 'Interviewing' && <Users size={18} />}
                    {std.coordinationStatus === 'Rejected' && <XCircle size={18} />}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {std.fullName} <span className="font-normal text-xs text-slate-500">⟶ {std.assignedEnterpriseName}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vị trí: <span className="font-medium text-slate-700">{std.assignedPositionTitle || 'Chưa xác định'}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${std.coordinationStatus === 'Accepted'
                      ? 'bg-green-100 text-green-700'
                      : std.coordinationStatus === 'Pending Response'
                        ? 'bg-orange-100 text-orange-700'
                        : std.coordinationStatus === 'Interviewing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                >
                  {std.coordinationStatus === 'Accepted' && 'Đã tiếp nhận'}
                  {std.coordinationStatus === 'Pending Response' && 'Chờ phản hồi'}
                  {std.coordinationStatus === 'Interviewing' && 'Phỏng vấn'}
                  {std.coordinationStatus === 'Rejected' && 'Từ chối'}
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
