import { loadAllPages } from "@/utils/shared/loadAllPages";
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
  Clock,
  XCircle,
  FileCheck2,
  Calendar,
  Layers,
  Search,
  BarChart3,
  List,
  RefreshCw,
  Send,
  Award,
  UserCheck,
} from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";
import { AcademicPeriodFilter } from "@/components/qhdn/StudentWorkflowUi";
import { useQhdnAcademicPeriods } from "@/hooks/qhdn/useQhdnAcademicPeriods";
import { useNearViewport } from "@/hooks/shared/useNearViewport";
import { subscribeVisibleRefresh } from "@/utils/shared/visibleRefresh";
import { missingRecruitmentRounds } from "@/utils/shared/recruitmentSchedule";
import {
  listCompanies,
  listCoordinations,
  getDashboardPlacementBoard,
  getQhdnDashboardSummary,
} from "@/services/qhdnService";
import { placementDashboardStats, type QhdnDashboardSummary, type DashboardPlacementBoard } from '@/utils/qhdn/qhdnDashboard';
import { OjtPipelineChart, EnterpriseQuotaChart } from "@/components/qhdn/QhdnDashboardCharts";
import type {
  CoordinationItem,
  CompanyListItem,
} from "@/types/qhdn/qhdnTypes";

export const QhdnDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState("");

  const catalog = useQhdnAcademicPeriods("", false, true);
  const selectedSemesterId = catalog.ojtSemesterId;
  const selectedSemesterName = catalog.selectedPeriod?.name || "—";
  const [revision, setRevision] = useState(0);
  const [placementStats, setPlacementStats] = useState<{ semesterId: number; stats: ReturnType<typeof placementDashboardStats>; companies: DashboardPlacementBoard['companies'] } | null>(null);
  const [internshipStats, setInternshipStats] = useState<{ semesterId: number; data: QhdnDashboardSummary } | null>(null);
  const [internshipError, setInternshipError] = useState('');
  const [eligibleError, setEligibleError] = useState('');
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const dashboardRequest = useRef<AbortController | null>(null);

  // Enterprise Quota calculation data
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const quotas = internshipStats?.semesterId === selectedSemesterId ? internshipStats.data.quotas : undefined;
  const hasRecruitmentRounds = internshipStats?.semesterId === selectedSemesterId ? internshipStats.data.hasRecruitmentRounds : undefined;
  const periodNotice = !catalog.loading && !catalog.error && catalog.selectedPeriod && (
    !selectedSemesterId || hasRecruitmentRounds === false ? missingRecruitmentRounds : ''
  );
  const isLoading = !!selectedSemesterId && !quotas && !internshipError;

  // Coordinations data for rejected & accepted widgets
  const { ref: coordinationSection, reached: loadCoordinations } = useNearViewport<HTMLDivElement>();
  const [coordinationsLoading, setCoordinationsLoading] = useState(true);
  const [coordinationsError, setCoordinationsError] = useState('');
  const [rejectedCoordinations, setRejectedCoordinations] = useState<
    CoordinationItem[]
  >([]);
  const [acceptedCoordinations, setAcceptedCoordinations] = useState<
    CoordinationItem[]
  >([]);

  // Quota view mode: Chart (Top 8) vs Table (Toàn bộ DN)
  const [quotaViewMode, setQuotaViewMode] = useState<"chart" | "list">("chart");
  const [quotaSearch, setQuotaSearch] = useState("");

  const pipelineSectionRef = useRef<HTMLDivElement | null>(null);
  const quotaSectionRef = useRef<HTMLDivElement | null>(null);
  const [visibleCharts, setVisibleCharts] = useState({ pipeline: false, quota: false });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const key = entry.target === pipelineSectionRef.current ? 'pipeline' : 'quota';
        setVisibleCharts(previous => ({ ...previous, [key]: true }));
        observer.unobserve(entry.target);
      }
    }, { threshold: .12 });
    for (const section of [pipelineSectionRef.current, quotaSectionRef.current]) if (section) observer.observe(section);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);

  // Count exactly the same students and current decisions as the coordination screen.
  useEffect(() => {
    setPlacementStats(null);
    setInternshipStats(null);
    setEligibleError('');
    setInternshipError('');
    setEligibleLoading(!!selectedSemesterId);
    if (!selectedSemesterId) return;
    const controller = new AbortController();
    const { signal } = controller;
    dashboardRequest.current = controller;
    queueMicrotask(() => {
      if (signal.aborted) return;
      void Promise.allSettled([
        getDashboardPlacementBoard(selectedSemesterId, signal)
          .then(board => { if (!signal.aborted) setPlacementStats({ semesterId: selectedSemesterId, stats: placementDashboardStats(board.items), companies: board.companies }); })
          .catch(error => { if (!signal.aborted) setEligibleError(errorMessage(error)); }),
        getQhdnDashboardSummary(selectedSemesterId, signal)
          .then(data => { if (!signal.aborted) setInternshipStats({ semesterId: selectedSemesterId, data }); })
          .catch(error => { if (!signal.aborted) setInternshipError(errorMessage(error)); }),
      ]).finally(() => {
        if (dashboardRequest.current === controller) dashboardRequest.current = null;
        if (!signal.aborted) setEligibleLoading(false);
      });
    });
    return () => {
      controller.abort();
      if (dashboardRequest.current === controller) dashboardRequest.current = null;
    };
  }, [selectedSemesterId, revision]);

  useEffect(() => {
    return subscribeVisibleRefresh(() => setRevision(value => value + 1), { canRefresh: () => !dashboardRequest.current });
  }, []);

  // The company catalog is independent of the selected OJT semester.
  useEffect(() => {
    const controller = new AbortController();
    setCompaniesLoading(true);
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      loadAllPages(page => listCompanies({page, limit: 100}, controller.signal).then(r => r.data), controller.signal)
        .then(items => { if (!controller.signal.aborted) setCompanies(items); })
        .catch(err => { if (!controller.signal.aborted) setLoadError(errorMessage(err)); })
        .finally(() => { if (!controller.signal.aborted) setCompaniesLoading(false); });
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setRejectedCoordinations([]);
    setAcceptedCoordinations([]);
    setCoordinationsError('');
    setCoordinationsLoading(!!selectedSemesterId);
    if (!selectedSemesterId || !loadCoordinations) return;

    const controller = new AbortController();
    loadAllPages(page => listCoordinations(
      { page, limit: 100, ojtSemesterId: selectedSemesterId }, controller.signal,
    ).then(r => r.data), controller.signal).then(items => {
      if (controller.signal.aborted) return;
      const latest = new Map<number, CoordinationItem>();
      for (const item of items) {
        const previous = latest.get(item.registrationId);
        if (!previous || previous.id < item.id) latest.set(item.registrationId, item);
      }
      const current = Array.from(latest.values());
      setRejectedCoordinations(current.filter(item => item.decision === 'REJECTED'));
      setAcceptedCoordinations(current.filter(item => item.decision === 'ACCEPTED'));
    }).catch(error => {
      if (!controller.signal.aborted) setCoordinationsError(errorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setCoordinationsLoading(false);
    });
    return () => controller.abort();
  }, [selectedSemesterId, revision, loadCoordinations]);

  // Tính toán Quota của từng doanh nghiệp từ vị trí tuyển dụng
  const enterpriseQuotaList = useMemo(() => {
    if (!selectedSemesterId || !quotas) return [];
    const byCompany = new Map(quotas?.map(row => [row.companyId, row]));
    const confirmedCounts = new Map(placementStats?.semesterId === selectedSemesterId
      ? placementStats.companies?.map(row => [row.id, row.actualCount]) : []);
    return companies
      .map((company) => {
        const quota = byCompany.get(company.id);
        const totalQuota = quota?.capacity ?? 0;
        const remainingSlots = quota?.remainingSlots ?? 0;
        const acceptedCount = confirmedCounts.get(company.id) ?? Math.max(0, totalQuota - remainingSlots);

        return {
          id: company.id,
          name: company.name,
          code: company.code,
          industry: company.industry || "Chưa cập nhật",
          totalQuota,
          acceptedCount,
          availableQuota: Math.max(0,totalQuota-acceptedCount),
        };
      })
      .sort((a, b) => b.totalQuota - a.totalQuota);
  }, [companies, quotas, selectedSemesterId, placementStats]);

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

  // Keep a failed request distinct from a successful count of zero.
  const kpiStats = useMemo<Record<
    "handedOff" | "assigned" | "rejected" | "waiting" | "partnerCount" |
    "acceptanceRate" | "inProgress" | "completed", number | null>>(() => {
    const roster = placementStats?.semesterId === selectedSemesterId ? placementStats.stats : null;
    const summary = internshipStats?.semesterId === selectedSemesterId ? internshipStats.data : null;
    return {
      handedOff: roster?.handedOff ?? null,
      assigned: roster?.assigned ?? null,
      rejected: roster?.rejected ?? null,
      waiting: roster?.waiting ?? null,
      partnerCount: companiesLoading ? null : companies.length,
      acceptanceRate: roster?.acceptanceRate ?? null,
      inProgress: summary?.progress?.inProgress ?? null,
      completed: summary?.progress?.completed ?? null,
    };
  }, [placementStats, internshipStats, companies.length, companiesLoading, selectedSemesterId]);

  return (
    <div className="qhdn-dashboard space-y-6 pb-12 font-sans" onPointerMove={event => {
      if (event.pointerType === 'touch' || reducedMotion || !(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.card-glass');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    }}>
      {/* Banner */}
      <PageBanner
        variant="qhdn"
        title="Dashboard Quan hệ Doanh nghiệp"
        description="Giám sát luồng nhận sinh viên từ Phòng Đào tạo, phân bổ chỉ tiêu doanh nghiệp, tiếp nhận đánh giá và công bố kết quả OJT cho sinh viên."
        badge="Phòng QHDN"
      />

      {/* KPI Cards Grid (5 Cards) */}
      <div className="qhdn-kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* KPI 1: Nhận từ Đào tạo */}
        <div
          onClick={() => navigate('/qhdn/coordination' + (selectedSemesterId ? '?semester=' + selectedSemesterId : ''))}
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
              <span>Đủ điều kiện OJT</span>
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
            Được DN nhận:{" "}
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
              {quotas ? quotas.reduce((total, row) => total + row.capacity, 0) : "—"}
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
      <div className="qhdn-filter card-glass border border-slate-200/80 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chọn học kỳ theo dõi
            </h3>
            <p className="text-xs text-slate-500">
              Danh sách sinh viên đủ điều kiện, điều phối DN và kết quả OJT theo kỳ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {(catalog.loading || isLoading || eligibleLoading) && (
            <span className="text-xs text-orange-600 flex items-center gap-1.5 animate-pulse mr-1">
              <RefreshCw size={13} className="animate-spin" />
              Đang cập nhật dữ liệu...
            </span>
          )}

          <AcademicPeriodFilter
            selection={catalog}
            controlClassName="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 shadow-xs cursor-pointer"
          />
        </div>
      </div>

      {catalog.error && <Notice>{catalog.error}</Notice>}
      {eligibleError && <Notice>Không tải được số sinh viên đủ điều kiện: {eligibleError}.</Notice>}
      {internshipError && <Notice>Không tải được số sinh viên đang thực tập và đã hoàn thành: {internshipError}.</Notice>}
      {periodNotice && <p role="status" className="text-sm font-medium text-red-700">{periodNotice}</p>}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tiến độ luồng OJT */}
        <div ref={pipelineSectionRef} data-visible={visibleCharts.pipeline} data-motion={reducedMotion?'reduced':'animated'} className="qhdn-chart-card card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tiến độ Toàn trình OJT ({selectedSemesterName})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đủ điều kiện ⟶ Doanh nghiệp tiếp nhận ⟶ Thực tập ⟶ Có kết quả OJT
              </p>
            </div>
            <TrendingUp className="text-slate-400" size={18} />
          </div>
          <div className="relative w-full h-72">
            {visibleCharts.pipeline && !eligibleLoading ? <OjtPipelineChart stats={kpiStats} reducedMotion={reducedMotion} /> : <p role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Đang tải tiến độ OJT…</p>}
            {kpiStats.handedOff === null && <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-xl bg-white/95 px-4 py-2 text-sm text-slate-500">Chưa có dữ liệu thống kê tổng hợp.</p>
            </div>}
          </div>
        </div>

        {/* Chart 2: Quota Doanh nghiệp */}
        <div ref={quotaSectionRef} data-visible={visibleCharts.quota} data-motion={reducedMotion?'reduced':'animated'} className="qhdn-chart-card card-glass border border-slate-200/80 p-5 flex flex-col justify-between">
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
              {visibleCharts.quota && !isLoading && !eligibleLoading ? <EnterpriseQuotaChart partners={top8Partners} reducedMotion={reducedMotion} /> : <p role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Đang tải chỉ tiêu doanh nghiệp…</p>}
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

              <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-slate-500"><span className="w-5 shrink-0 text-center">STT</span><span className="flex-1">Doanh nghiệp</span><span className="w-36">Chỉ tiêu</span></div>
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
                              style={{ width: `${Math.min(100,fill)}%` }}
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
      <div ref={coordinationSection} className="grid grid-cols-1 xl:grid-cols-2 gap-6" aria-busy={coordinationsLoading}>
        {coordinationsError && <p role="alert" className="text-sm text-rose-700 xl:col-span-2">{coordinationsError}</p>}
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
                {coordinationsLoading ? 'Đang tải hồ sơ…' : coordinationsError ? 'Không tải được hồ sơ.' : 'Hiện không có hồ sơ nào bị doanh nghiệp từ chối.'}
              </p>
            ) : (
              rejectedCoordinations.slice(0, 4).map((coor, index) => (
                <div
                  key={coor.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium tabular-nums text-slate-500">STT {index + 1}</span>
                  <div className="min-w-0 flex-1">
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
                {coordinationsLoading ? 'Đang tải hồ sơ…' : coordinationsError ? 'Không tải được hồ sơ.' : 'Chưa có phản hồi tiếp nhận mới từ doanh nghiệp trong kỳ này.'}
              </p>
            ) : (
              acceptedCoordinations.slice(0, 4).map((coor, index) => (
                <div
                  key={coor.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium tabular-nums text-slate-500">STT {index + 1}</span>
                  <div className="min-w-0 flex-1">
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
