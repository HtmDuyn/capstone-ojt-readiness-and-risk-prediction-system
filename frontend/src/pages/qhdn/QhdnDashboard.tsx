import { loadAllPages } from "@/utils/loadAllPages";
import { errorMessage, Notice } from "@/components/qhdn/QhdnUi";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Calendar,
  Search,
  BarChart3,
  List,
  RefreshCw,
  Award,
} from "lucide-react";
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
} from "chart.js";
import { PageBanner } from "@/components/common/PageBanner";
import { AcademicPeriodFilter } from "@/components/qhdn/StudentWorkflowUi";
import { useQhdnAcademicPeriods } from "@/hooks/useQhdnAcademicPeriods";
import {
  listCompanies,
  listPositions,
  listCoordinations,
} from "@/services/qhdnService";
import type {
  CoordinationItem,
  CompanyListItem,
  PositionListItem,
} from "@/types/qhdn/qhdnTypes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const QhdnDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState("");

  const catalog = useQhdnAcademicPeriods();
  const selectedSemesterId = catalog.ojtSemesterId;
  const selectedSemesterName = catalog.selectedPeriod?.name || "—";
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Enterprise Quota calculation data
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [positions, setPositions] = useState<PositionListItem[]>([]);

  // Coordinations data for rejected & accepted widgets
  const [rejectedCoordinations, setRejectedCoordinations] = useState<
    CoordinationItem[]
  >([]);
  const [acceptedCoordinations, setAcceptedCoordinations] = useState<
    CoordinationItem[]
  >([]);

  // Quota view mode: Chart (Top 8) vs Table (Toàn bộ DN)
  const [quotaViewMode, setQuotaViewMode] = useState<"chart" | "list">("chart");
  const [quotaSearch, setQuotaSearch] = useState("");

  // Canvas references for ChartJS
  const pipelineChartRef = useRef<HTMLCanvasElement | null>(null);
  const pipelineChartInstance = useRef<ChartJS | null>(null);

  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartInstance = useRef<ChartJS | null>(null);

  // The company catalog is independent of the selected OJT semester.
  useEffect(() => {
    let active = true;
    setCompaniesLoading(true);
    loadAllPages(page => listCompanies({ page, limit: 100 }).then(r => r.data))
      .then(items => { if (active) setCompanies(items); })
      .catch(err => { if (active) setLoadError(errorMessage(err)); })
      .finally(() => { if (active) setCompaniesLoading(false); });
    return () => { active = false; };
  }, []);

  // 2. Tải toàn bộ dữ liệu Dashboard khi selectedSemesterId thay đổi
  useEffect(() => {
    if (!selectedSemesterId) {
      setPositions([]);
      setRejectedCoordinations([]);
      setAcceptedCoordinations([]);
      setIsLoading(false);
      return;
    }
    let isActive = true;
    const fetchDashboardDetails = async () => {
      setIsLoading(true);
      setLoadError("");
      setPositions([]);
      setRejectedCoordinations([]);
      setAcceptedCoordinations([]);
      try {
        const [posRes, coorRes] = await Promise.allSettled([
          loadAllPages((page) =>
            listPositions({
              page,
              limit: 100,
              ojtSemesterId: selectedSemesterId,
            }).then((r) => r.data),
          ),
          loadAllPages((page) =>
            listCoordinations({
              page,
              limit: 100,
              ojtSemesterId: selectedSemesterId,
            }).then((r) => r.data),
          ),
        ]);

        if (!isActive) return;
        const failed = [posRes, coorRes].find(
          (r) => r.status === "rejected",
        );
        if (failed?.status === "rejected") throw failed.reason;

        if (posRes.status === "fulfilled" && posRes.value) {
          setPositions(posRes.value);
        }

        if (coorRes.status === "fulfilled" && coorRes.value) {
          const latest = new Map<number, CoordinationItem>();
          coorRes.value.forEach((c) => {
            if (
              !latest.has(c.registrationId) ||
              latest.get(c.registrationId)!.id < c.id
            )
              latest.set(c.registrationId, c);
          });
          const allCoors = Array.from(latest.values());
          setRejectedCoordinations(
            allCoors.filter((c) => c.decision === "REJECTED"),
          );
          setAcceptedCoordinations(
            allCoors.filter((c) => c.decision === "ACCEPTED"),
          );
        }
      } catch (err) {
        if (isActive) setLoadError(errorMessage(err));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchDashboardDetails();

    return () => {
      isActive = false;
    };
  }, [selectedSemesterId]);

  // Tính toán Quota của từng doanh nghiệp từ vị trí tuyển dụng
  const enterpriseQuotaList = useMemo(() => {
    if (!selectedSemesterId) return [];
    const positionMap = new Map<number, PositionListItem[]>();
    positions.forEach((pos) => {
      const list = positionMap.get(pos.companyId) || [];
      list.push(pos);
      positionMap.set(pos.companyId, list);
    });

    return companies
      .map((company) => {
        const compPositions = positionMap.get(company.id) || [];
        const totalQuota = compPositions.reduce(
          (sum, p) => sum + (p.capacity || 0),
          0,
        );
        const remainingSlots = compPositions.reduce(
          (sum, p) => sum + (p.remainingSlots || 0),
          0,
        );
        const acceptedCount = Math.max(0, totalQuota - remainingSlots);

        return {
          id: company.id,
          name: company.name,
          code: company.code,
          industry: company.industry || "Chưa cập nhật",
          totalQuota,
          acceptedCount,
          availableQuota: remainingSlots,
        };
      })
      .sort((a, b) => b.totalQuota - a.totalQuota);
  }, [companies, positions, selectedSemesterId]);

  // Top 8 DN có chỉ tiêu lớn nhất
  const top8Partners = useMemo(() => {
    return enterpriseQuotaList.slice(0, 8);
  }, [enterpriseQuotaList]);

  // Bảng xếp hạng đối tác tìm kiếm
  const fullRankingPartners = useMemo(() => {
    const q = quotaSearch.trim().toLowerCase();
    if (!q) return enterpriseQuotaList;
    return enterpriseQuotaList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q),
    );
  }, [enterpriseQuotaList, quotaSearch]);

  // Keep the original cards; aggregate statistics remain unavailable while their API is excluded.
  const kpiStats = useMemo<Record<
    "handedOff" | "assigned" | "rejected" | "waiting" | "partnerCount" |
    "acceptanceRate" | "inProgress" | "completed" | "totalResults" |
    "confirmedResults" | "passedResults", number | null>>(() => ({
    handedOff: null,
    assigned: null,
    rejected: isLoading || !selectedSemesterId || loadError ? null : rejectedCoordinations.length,
    waiting: null,
    partnerCount: companiesLoading ? null : companies.length,
    acceptanceRate: null,
    inProgress: null,
    completed: null,
    totalResults: null,
    confirmedResults: null,
    passedResults: null,
  }), [companies.length, companiesLoading, isLoading, selectedSemesterId, loadError, rejectedCoordinations.length]);

  // Render Chart 1: Tiến độ luồng OJT (Phễu điều phối & Thực tập)
  useEffect(() => {
    if (!pipelineChartRef.current) return;

    if (pipelineChartInstance.current) {
      pipelineChartInstance.current.destroy();
    }

    const ctx = pipelineChartRef.current.getContext("2d");
    if (!ctx) return;

    const labels = [
      "Bàn giao từ PĐT",
      "Đã chốt DN",
      "Chờ DN duyệt",
      "Đang thực tập",
      "Hoàn thành OJT",
      "Đã chuyển PĐT",
    ];

    const dataValues = [
      kpiStats.handedOff,
      kpiStats.assigned,
      kpiStats.waiting,
      kpiStats.inProgress,
      kpiStats.completed,
      kpiStats.totalResults,
    ];

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Số lượng sinh viên",
            data: dataValues,
            backgroundColor: [
              "#3b82f6", // Bàn giao PĐT (Blue)
              "#059669", // Đã chốt DN (Emerald)
              "#f59e0b", // Chờ DN (Amber)
              "#6366f1", // Đang thực tập (Indigo)
              "#0f766e", // Hoàn thành (Teal)
              "#ea580c", // Đã chuyển PĐT (Orange)
            ],
            borderRadius: 6,
            barThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#0f172a",
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (context) => ` ${context.raw} sinh viên`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "Inter, sans-serif", size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: {
              font: { family: "Inter, sans-serif", size: 11 },
              callback: (val) => `${val} SV`,
            },
          },
        },
      },
    };

    pipelineChartInstance.current = new ChartJS(ctx, config);

    return () => {
      if (pipelineChartInstance.current) {
        pipelineChartInstance.current.destroy();
      }
    };
  }, [kpiStats]);

  // Render Chart 2: Top 8 Quota Doanh nghiệp
  useEffect(() => {
    if (quotaViewMode !== "chart" || !categoryChartRef.current) return;

    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
    }

    const ctx = categoryChartRef.current.getContext("2d");
    if (!ctx) return;

    const entNames = top8Partners.map((e) => e.code || e.name);
    const acceptedSlots = top8Partners.map((e) => e.acceptedCount);
    const availableSlots = top8Partners.map((e) => e.availableQuota);

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: entNames.length > 0 ? entNames : ["Chưa có dữ liệu DN"],
        datasets: [
          {
            label: "Đã tiếp nhận",
            data: acceptedSlots.length > 0 ? acceptedSlots : [0],
            backgroundColor: "#0284c7",
            borderRadius: 4,
          },
          {
            label: "Slot còn lại",
            data: availableSlots.length > 0 ? availableSlots : [0],
            backgroundColor: "#e2e8f0",
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { font: { family: "Inter, sans-serif", size: 12 } },
          },
          tooltip: {
            backgroundColor: "#0f172a",
            padding: 10,
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: "#f1f5f9" },
            ticks: { font: { family: "Inter, sans-serif", size: 11 } },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { family: "Inter, sans-serif", size: 11, weight: "bold" },
            },
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
        description="Giám sát luồng nhận sinh viên từ Phòng Đào tạo, phân bổ chỉ tiêu doanh nghiệp, tiếp nhận đánh giá và chuyển giao kết quả OJT."
        badge="Phòng QHDN"
      />

      {/* KPI Cards Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* KPI 1: Nhận từ Đào tạo */}
        <div
          onClick={() => navigate("/qhdn/registration-windows")}
          className="card-glass border border-slate-200/80 p-5 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              SV Đủ điều kiện ({selectedSemesterName})
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {kpiStats.handedOff ?? "—"}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp size={13} className="text-blue-600" />
              <span>Bàn giao từ PĐT</span>
            </span>
            <span className="font-semibold text-slate-400">
              {kpiStats.handedOff ?? "—"} SV
            </span>
          </div>
        </div>

        {/* KPI 2: Điều phối thành công */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Tỷ lệ tiếp nhận thực tập
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {kpiStats.acceptanceRate == null ? "—" : `${kpiStats.acceptanceRate}%`}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Đã chốt:{" "}
            <strong className="text-slate-800 font-bold">
              {kpiStats.assigned ?? "—"}
            </strong>{" "}
            / {kpiStats.handedOff ?? "—"} SV
          </p>
        </div>

        {/* KPI 3: Đã hoàn thành thực tập (chèn thêm từ card dài vào 4 card trên) */}
        <div
          onClick={() => navigate("/qhdn/evaluations")}
          className="card-glass border border-slate-200/80 p-5 cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Đã hoàn thành thực tập
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
              <Award size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-teal-700">
            {kpiStats.completed ?? "—"}{" "}
            <span className="text-sm font-semibold text-slate-400">SV</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Đang thực tập:{" "}
              <strong className="text-slate-800 font-bold">
                {kpiStats.inProgress ?? "—"}
              </strong>
            </span>
            <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform">
              Sổ ĐG &rarr;
            </span>
          </p>
        </div>

        {/* KPI 4: Doanh nghiệp đối tác */}
        <div
          onClick={() => navigate("/qhdn/enterprises")}
          className="card-glass border border-slate-200/80 p-5 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Doanh nghiệp đối tác
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
              <Building2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {kpiStats.partnerCount ?? "—"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Tổng sức chứa:{" "}
            <strong className="text-slate-800 font-bold">
              {isLoading || !selectedSemesterId || loadError ? "—" : positions.reduce((total, position) => total + (position.capacity || 0), 0)}
            </strong>{" "}
            slot
          </p>
        </div>

        {/* KPI 5: Hồ sơ bị doanh nghiệp từ chối */}
        <div
          onClick={() => navigate("/qhdn/coordination")}
          className="card-glass border border-slate-200/80 p-5 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Bị doanh nghiệp từ chối
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 group-hover:text-rose-700 transition-colors">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">
            {kpiStats.rejected ?? "—"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Chờ DN duyệt:{" "}
            <strong className="text-amber-600 font-bold">
              {kpiStats.waiting ?? "—"} SV
            </strong>
          </p>
        </div>
      </div>

      {/* Filter Toolbar: Năm học & Kỳ OJT Selector */}
      <div className="card-glass border border-slate-200/80 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chọn học kỳ theo dõi
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu bàn giao từ Đào tạo, điều phối DN và kết quả OJT theo kỳ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {(catalog.loading || isLoading) && (
            <span className="text-xs text-orange-600 flex items-center gap-1.5 animate-pulse mr-1">
              <RefreshCw size={13} className="animate-spin" />
              Đang đồng bộ API...
            </span>
          )}

          <AcademicPeriodFilter
            selection={catalog}
            controlClassName="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 shadow-xs cursor-pointer"
          />
        </div>
      </div>

      {catalog.error && <Notice>{catalog.error}</Notice>}
      {!catalog.loading && catalog.selectedPeriod && !selectedSemesterId && (
        <Notice>Học kỳ / Block 3 này chưa liên kết kỳ OJT. Chưa có dữ liệu OJT theo kỳ để hiển thị.</Notice>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tiến độ luồng OJT */}
        <div className="card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tiến độ Toàn trình OJT ({selectedSemesterName})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình từ Bàn giao PĐT ⟶ Điều phối ⟶ Đang thực tập ⟶ Chuyển
                giao kết quả
              </p>
            </div>
            <TrendingUp className="text-slate-400" size={18} />
          </div>
          <div className="relative w-full h-72">
            <canvas ref={pipelineChartRef} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-xl bg-white/95 px-4 py-2 text-sm text-slate-500">Chưa có dữ liệu thống kê tổng hợp.</p>
            </div>
          </div>
        </div>

        {/* Chart 2: Quota Doanh nghiệp */}
        <div className="card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Phân bổ chỉ tiêu Quota Doanh nghiệp (
                {enterpriseQuotaList.length} DN)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {quotaViewMode === "chart"
                  ? "Biểu đồ Top 8 đối tác có quy mô tiếp nhận lớn nhất"
                  : "Bảng xếp hạng đầy đủ chỉ tiêu tất cả đối tác"}
              </p>
            </div>

            {/* Toggle view mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setQuotaViewMode("chart")}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  quotaViewMode === "chart"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600"
                }`}
                title="Xem dạng biểu đồ Top 8"
              >
                <BarChart3 size={13} />
                Top 8
              </button>
              <button
                type="button"
                onClick={() => setQuotaViewMode("list")}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  quotaViewMode === "list"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600"
                }`}
                title="Xem toàn bộ danh sách đối tác"
              >
                <List size={13} />
                Toàn bộ
              </button>
            </div>
          </div>

          {/* View Mode 1: Top 8 Chart */}
          {quotaViewMode === "chart" && (
            <div className="relative w-full h-72">
              <canvas ref={categoryChartRef} />
            </div>
          )}

          {/* View Mode 2: Full Scrollable Ranking List */}
          {quotaViewMode === "list" && (
            <div className="space-y-2 h-72 flex flex-col">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm doanh nghiệp trong danh sách..."
                  value={quotaSearch}
                  onChange={(e) => setQuotaSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {fullRankingPartners.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Chưa có dữ liệu chỉ tiêu doanh nghiệp cho kỳ này
                  </div>
                ) : (
                  fullRankingPartners.map((ent, idx) => {
                    const fill =
                      ent.totalQuota > 0
                        ? Math.round((ent.acceptedCount / ent.totalQuota) * 100)
                        : 0;
                    if (loadError)
                      return (
                        <div className="space-y-4">
                          <Notice>{loadError}</Notice>
                          <button
                            className="rounded-xl border p-3"
                            onClick={() => window.location.reload()}
                          >
                            Thử lại
                          </button>
                        </div>
                      );
                    return (
                      <div
                        key={ent.id}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-3 border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">
                              {ent.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Mã: {ent.code} • {ent.industry}
                            </p>
                          </div>
                        </div>

                        <div className="w-36 shrink-0">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>
                              {ent.acceptedCount} / {ent.totalQuota}
                            </span>
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
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Widget 1: Sinh viên bị doanh nghiệp từ chối */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Hồ sơ bị doanh nghiệp từ chối
                </h2>
                <p className="text-xs text-slate-500">
                  Sinh viên có thể chọn vị trí khác và nộp lại hồ sơ trực tiếp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/qhdn/coordination")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Theo dõi hồ sơ
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {rejectedCoordinations.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-xs">
                Hiện không có hồ sơ nào bị doanh nghiệp từ chối.
              </p>
            ) : (
              rejectedCoordinations.slice(0, 4).map((coor) => (
                <div
                  key={coor.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {coor.student?.fullName || "Sinh viên"}{" "}
                      {coor.student?.studentCode && (
                        <span className="font-normal text-xs text-slate-500">
                          ({coor.student.studentCode})
                        </span>
                      )}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Doanh nghiệp:{" "}
                      <span className="font-medium text-slate-800">
                        {coor.company?.name || "Doanh nghiệp"}
                      </span>
                    </p>
                    <p className="text-rose-700 mt-1 italic">
                      Lý do: {coor.rejectReason || "Chưa đạt yêu cầu phỏng vấn"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/qhdn/coordination")}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                  >
                    Xem trạng thái
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Phản hồi tiếp nhận mới nhất từ Doanh nghiệp */}
        <div className="card-glass border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Phản hồi tiếp nhận mới nhất từ Doanh nghiệp
                </h2>
                <p className="text-xs text-slate-500">
                  Sinh viên đã được doanh nghiệp đối tác chấp thuận thực tập
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/qhdn/enterprises")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              Xem DN đối tác
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {acceptedCoordinations.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-xs">
                Chưa có phản hồi tiếp nhận mới từ doanh nghiệp trong kỳ này.
              </p>
            ) : (
              acceptedCoordinations.slice(0, 4).map((coor) => (
                <div
                  key={coor.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {coor.student?.fullName || "Sinh viên"}{" "}
                      <span className="font-normal text-xs text-slate-500">
                        ⟶ {coor.company?.name || "Doanh nghiệp"}
                      </span>
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Vị trí:{" "}
                      <span className="font-medium text-slate-700">
                        {coor.position?.title || "Thực tập sinh"}
                      </span>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    Đã chấp thuận
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QhdnDashboard;
