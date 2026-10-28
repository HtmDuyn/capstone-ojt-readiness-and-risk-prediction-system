import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Filter,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";
import { Field, Notice, Pager, errorMessage } from "@/components/qhdn/QhdnUi";
import {
  AcademicPeriodFilter,
  WorkflowModal,
  workflowInput,
  workflowPrimary,
  workflowSecondary,
} from "@/components/qhdn/StudentWorkflowUi";
import {
  EnterpriseDetailsModal,
  EnterpriseStatus,
} from "@/components/qhdn/EnterpriseDetailsModal";
import { EnterpriseRecruitment } from "@/components/qhdn/EnterpriseRecruitment";
import { QhdnEnterpriseImportModal } from "@/components/qhdn/import/QhdnEnterpriseImportModal";
import {
  archiveRecruitment,
  listCompanies,
  listPositions,
} from "@/services/qhdnService";
import { loadAllPages } from "@/utils/loadAllPages";
import { positionTotals } from "@/utils/qhdnEnterprise";
import type {
  CompanyListItem,
  PositionListItem,
} from "@/types/qhdn/qhdnTypes";
import { useQhdnAcademicPeriods } from "@/hooks/useQhdnAcademicPeriods";
import { linkedOjtSemesterId } from "@/utils/qhdnAcademicPeriods";

const cell = "px-5 py-5 align-middle";
function StatCard({
  label,
  value,
  icon,
  hint,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className="rounded-xl border border-orange-100 bg-orange-50 p-2 text-orange-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </>
  );
  const classes =
    "rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm";
  return onClick ? (
    <button
      className={
        classes + " transition hover:border-orange-300 hover:shadow-md"
      }
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}
export default function QhdnEnterpriseManagement() {
  const [tab, setTab] = useState<"companies" | "posts">(
    "companies",
  );
  const catalog = useQhdnAcademicPeriods("", true);
  const { periods, semesterId: semester } = catalog;
  const scopeOjtIds = useMemo(() => new Set(catalog.filteredPeriods
    .map(linkedOjtSemesterId).filter((id): id is number => id !== null)), [catalog.filteredPeriods]);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]),
    [positions, setPositions] = useState<PositionListItem[]>([]);
  const [loading, setLoading] = useState(true),
    [positionsLoading, setPositionsLoading] = useState(true);
  const [error, setError] = useState(""),
    [positionsError, setPositionsError] = useState(""),
    [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [recruiting, setRecruiting] = useState(""),
    [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    company: CompanyListItem;
    tab: "overview" | "positions" | "edit";
  } | null>(null);
  const [companyId, setCompanyId] = useState(""),
    [importing, setImporting] = useState(false);
  const [archiving, setArchiving] = useState(false),
    [busy, setBusy] = useState(false),
    [archiveError, setArchiveError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loadAllPages((p) =>
        listCompanies({ page: p, limit: 100 }).then((r) => r.data),
      )
      .then((c) => {
        if (active) {
          setCompanies(c);
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setCompanies([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    let active = true;
    setPositions([]);
    setPositionsLoading(true);
    setPositionsError("");
    if (catalog.loading || (!catalog.allPeriods && !semester) ||
      (catalog.allPeriods && catalog.yearId && !scopeOjtIds.size)) {
      setPositionsLoading(catalog.loading);
      return;
    }
    // Tải chung vị trí cho toàn bảng, không gọi lặp theo từng doanh nghiệp.
    loadAllPages((p) =>
      listPositions({
        page: p,
        limit: 100,
        ...(semester ? { ojtSemesterId: Number(semester) } : {}),
      }).then((r) => r.data),
    )
      .then((p) => {
        if (active) setPositions(catalog.allPeriods && catalog.yearId
          ? p.filter((position) => scopeOjtIds.has(position.ojtSemesterId)) : p);
      })
      .catch((e) => {
        if (active) setPositionsError(errorMessage(e));
      })
      .finally(() => {
        if (active) setPositionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, semester, catalog.loading, catalog.allPeriods, catalog.yearId, scopeOjtIds]);
  useEffect(() => setPage(1), [search, status, recruiting, catalog.periodId, catalog.yearId]);
  const scope = catalog.selectedPeriod?.name ||
    (catalog.yearId ? "Năm học " + catalog.years.find((y) => String(y.id) === catalog.yearId)?.code : "Tất cả học kỳ / Block 3");
  const grouped = useMemo(() => {
    const map = new Map<number, PositionListItem[]>();
    positions.forEach((p) => {
      const id = p.companyId ?? p.company?.id;
      if (id) map.set(id, [...(map.get(id) || []), p]);
    });
    return map;
  }, [positions]);
  const filtered = companies.filter((c) => {
    const roles = grouped.get(c.id) || [],
      totals = positionTotals(roles);
    return (
      (!status || c.status === status) &&
      (positionsLoading ||
        !!positionsError ||
        !recruiting ||
        (recruiting === "OPEN"
          ? totals.open > 0
          : recruiting === "AVAILABLE"
            ? c.status === "ACTIVE" && totals.available > 0
            : !roles.length)) &&
      [c.name, c.code, c.industry, c.contactPersonName, c.contactEmail].some(
        (v) =>
          String(v || "")
            .toLocaleLowerCase("vi")
            .includes(search.trim().toLocaleLowerCase("vi")),
      )
    );
  });
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 10)),
  );
  const totals = positionTotals(positions),
    ready = !positionsLoading && !positionsError,
    metricsReady = ready && !loading && !error;
  const reset = () => {
    setSearch("");
    setStatus("");
    setRecruiting("");
  };
  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Doanh nghiệp & Tuyển dụng"
        description="Theo dõi đối tác, vị trí tuyển dụng và chỉ tiêu tiếp nhận sinh viên trong một nơi."
        badge="Phòng QHDN"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh nghiệp liên kết"
          value={loading || error ? "—" : companies.length}
          icon={<Building2 size={20} />}
          hint="Toàn bộ đối tác trong hệ thống"
          onClick={reset}
        />
        <StatCard
          label="Đang tuyển dụng"
          value={
            metricsReady
              ? companies.filter(
                  (c) =>
                    c.status === "ACTIVE" &&
                    (grouped.get(c.id) || []).some((p) => p.status === "OPEN"),
                ).length
              : "—"
          }
          icon={<BriefcaseBusiness size={20} />}
          hint="Đối tác đang hợp tác có vị trí mở"
          onClick={() => {
            reset();
            setStatus("ACTIVE");
            setRecruiting("OPEN");
          }}
        />
        <StatCard
          label="Tổng chỉ tiêu"
          value={metricsReady ? totals.capacity : "—"}
          icon={<Users size={20} />}
          hint={`${totals.count} vị trí · Theo học kỳ đang chọn`}
        />
        <StatCard
          label="Chỗ còn nhận"
          value={
            metricsReady
              ? positions
                  .filter((p) =>
                    companies.some(
                      (c) =>
                        c.id === (p.companyId ?? p.company?.id) &&
                        c.status === "ACTIVE",
                    ),
                  )
                  .reduce(
                    (n, p) => n + (p.status === "OPEN" ? p.remainingSlots : 0),
                    0,
                  )
              : "—"
          }
          icon={<ArrowUpRight size={20} />}
          hint="Vị trí mở tại doanh nghiệp đang hợp tác"
          onClick={() => {
            reset();
            setStatus("ACTIVE");
            setRecruiting("AVAILABLE");
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/80">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["companies", "Danh sách doanh nghiệp", Building2],
              ["posts", "Tin tuyển dụng", BriefcaseBusiness],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition ${tab === id ? "border-orange-600 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 pb-3 lg:w-auto lg:pb-0">
          <button
            type="button"
            className={workflowSecondary + " flex-1 sm:flex-none"}
            onClick={() => {
              setArchiveError("");
              setArchiving(true);
            }}
          >
            <Archive size={15} />
            Lưu trữ tuyển dụng
          </button>
          <button
            type="button"
            className={workflowPrimary + " flex-1 sm:flex-none"}
            onClick={() => setImporting(true)}
          >
            <Upload size={17} />
            Import doanh nghiệp
          </button>
        </div>
      </div>
      {message && <Notice>{message}</Notice>}
      {catalog.error && <Notice>{catalog.error}</Notice>}
      {!catalog.loading && catalog.selectedPeriod && !semester && (
        <Notice>Học kỳ / Block 3 này chưa liên kết kỳ OJT. Danh mục doanh nghiệp vẫn được giữ; chưa có chỉ tiêu OJT theo kỳ để hiển thị.</Notice>
      )}
      {error && <Notice>{error}</Notice>}
      {tab === "companies" ? (
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="space-y-5 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Danh sách doanh nghiệp liên kết{" "}
                  <span className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    {filtered.length}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn doanh nghiệp để xem thông tin liên hệ, vị trí và nhu cầu
                  tiếp nhận.
                </p>
              </div>
              <button
                className={workflowSecondary}
                disabled={loading || positionsLoading}
                onClick={() => setRevision((v) => v + 1)}
              >
                <RefreshCw size={16} />
                Làm mới
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <Field label="Tìm doanh nghiệp">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    aria-label="Tìm doanh nghiệp"
                    className={workflowInput + " pl-10"}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tên, mã, lĩnh vực hoặc email…"
                  />
                </div>
              </Field>
              <AcademicPeriodFilter selection={catalog} />
              <Field label="Trạng thái hợp tác">
                <select
                  aria-label="Trạng thái hợp tác"
                  className={workflowInput}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hợp tác</option>
                  <option value="INACTIVE">Ngừng hợp tác</option>
                </select>
              </Field>
              <Field label="Nhu cầu tuyển dụng">
                <select
                  aria-label="Nhu cầu tuyển dụng"
                  className={workflowInput}
                  value={recruiting}
                  disabled={!ready}
                  onChange={(e) => setRecruiting(e.target.value)}
                >
                  <option value="">Tất cả nhu cầu</option>
                  <option value="OPEN">Có vị trí đang mở</option>
                  <option value="AVAILABLE">Còn chỗ tiếp nhận</option>
                  <option value="NONE">Chưa có vị trí</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                <strong className="font-semibold text-slate-600">
                  Phạm vi chỉ tiêu:
                </strong>{" "}
                {scope}. Chỗ còn nhận chỉ tính vị trí đang mở.
              </span>
              {(search || status || recruiting) && (
                <button
                  className="flex items-center gap-1 font-semibold text-orange-600"
                  onClick={reset}
                >
                  <Filter size={14} />
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
            {positionsError && (
              <Notice>
                Không tải được chỉ tiêu: {positionsError}{" "}
                <button
                  className="ml-2 font-bold underline"
                  onClick={() => setRevision((v) => v + 1)}
                >
                  Thử lại
                </button>
              </Notice>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Doanh nghiệp",
                    "Liên hệ",
                    "Vị trí tuyển dụng",
                    "Chỉ tiêu tiếp nhận",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th className="px-5 py-4 font-bold" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading &&
                  !error &&
                  filtered
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((c) => {
                      const roles = grouped.get(c.id) || [],
                        total = positionTotals(roles);
                      return (
                        <tr
                          key={c.id}
                          className="transition hover:bg-orange-50/30"
                        >
                          <td className={cell}>
                            <div className="flex items-center gap-3">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600">
                                <Building2 size={21} />
                              </span>
                              <div>
                                <button
                                  className="text-left font-bold text-slate-800 hover:text-orange-600"
                                  disabled={positionsLoading}
                                  onClick={() =>
                                    setSelected({ company: c, tab: "overview" })
                                  }
                                >
                                  {c.name}
                                </button>
                                <p className="mt-1 text-xs text-slate-500">
                                  {c.code} · {c.industry || "Chưa có lĩnh vực"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={cell}>
                            <p className="font-medium text-slate-700">
                              {c.contactPersonName || "Chưa có người liên hệ"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail size={12} />
                              {c.contactEmail || "Chưa có email"}
                            </p>
                          </td>
                          <td className={cell}>
                            {ready ? (
                              <button
                                className="text-left hover:text-orange-700"
                                onClick={() =>
                                  setSelected({ company: c, tab: "positions" })
                                }
                              >
                                <span className="font-semibold text-slate-800">
                                  {total.count} vị trí{" "}
                                  <span className="ml-1 text-xs font-normal text-slate-500">
                                    · {total.open} mở
                                  </span>
                                </span>
                                <p
                                  className="mt-1 max-w-[210px] truncate text-xs text-slate-500"
                                  title={roles.map((p) => p.title).join(", ")}
                                >
                                  {roles
                                    .slice(0, 2)
                                    .map((p) => p.title)
                                    .join(", ") || "Chưa có vị trí tuyển dụng"}
                                  {roles.length > 2
                                    ? ` +${roles.length - 2}`
                                    : ""}
                                </p>
                              </button>
                            ) : (
                              <span className="text-slate-400">
                                {positionsLoading
                                  ? "Đang tải…"
                                  : "Chưa tải được"}
                              </span>
                            )}
                          </td>
                          <td className={cell}>
                            {ready ? (
                              <>
                                <p className="font-bold text-slate-800">
                                  {total.capacity}{" "}
                                  <span className="text-xs font-normal text-slate-500">
                                    sinh viên
                                  </span>
                                </p>
                                <p
                                  className={`mt-1 text-xs font-medium ${c.status === "ACTIVE" && total.available > 0 ? "text-emerald-700" : "text-slate-500"}`}
                                >
                                  {c.status === "ACTIVE"
                                    ? `Còn nhận ${total.available} chỗ`
                                    : "Tạm ngừng tiếp nhận"}
                                </p>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={cell}>
                            <EnterpriseStatus status={c.status} />
                          </td>
                          <td className={cell}>
                            <button
                              className={
                                workflowSecondary + " whitespace-nowrap"
                              }
                              disabled={positionsLoading}
                              onClick={() =>
                                setSelected({ company: c, tab: "overview" })
                              }
                            >
                              <MoreHorizontal size={17} />
                              Quản lý
                            </button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
          {(loading || !filtered.length) && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-sm text-slate-500">
              <Building2 size={30} className="text-slate-300" />
              <p>
                {loading
                  ? "Đang tải doanh nghiệp…"
                  : error
                    ? "Không tải được danh sách doanh nghiệp."
                    : "Không có doanh nghiệp phù hợp bộ lọc."}
              </p>
            </div>
          )}
          <div className="border-t border-slate-100 p-5">
            <Pager
              page={currentPage}
              total={filtered.length}
              limit={10}
              busy={loading}
              onChange={setPage}
            />
          </div>
        </section>
      ) : (
        <EnterpriseRecruitment
          companies={companies}
          companyId={companyId}
          onCompanyChange={setCompanyId}
          onDataChanged={() => setRevision((v) => v + 1)}
        />
      )}
      {selected && (
        <EnterpriseDetailsModal
          company={selected.company}
          positions={grouped.get(selected.company.id) || []}
          positionsError={positionsError}
          scope={scope}
          initialTab={selected.tab}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setRevision((v) => v + 1);
            setMessage("Đã cập nhật thông tin doanh nghiệp.");
          }}
          onPosts={() => {
            setCompanyId(String(selected.company.id));
            setSelected(null);
            setTab("posts");
          }}
        />
      )}
      {importing && (
        <QhdnEnterpriseImportModal
          isOpen
          periods={periods}
          periodsLoading={catalog.loading}
          initialAcademicPeriodId={catalog.selectedPeriod?.kind === "SEMESTER" ? catalog.selectedPeriod.id : undefined}
          onClose={() => setImporting(false)}
          onImported={() => {
            setRevision((v) => v + 1);
            setMessage(
              "Đã import doanh nghiệp. Danh sách được cập nhật từ hệ thống.",
            );
          }}
        />
      )}
      {archiving && (
        <WorkflowModal
          title="Lưu trữ tuyển dụng"
          subtitle="Dọn các dữ liệu tuyển dụng đã đủ điều kiện lưu trữ."
          onClose={() => setArchiving(false)}
          busy={busy}
        >
          <div className="space-y-5">
            {archiveError && <Notice>{archiveError}</Notice>}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              Hệ thống sẽ lưu trữ tuyển dụng đủ điều kiện sau hai học kỳ. Kiểm
              tra trước khi xác nhận thực hiện.
            </div>
            <div className="flex justify-end gap-2">
              <button
                className={workflowSecondary}
                disabled={busy}
                onClick={() => setArchiving(false)}
              >
                Để sau
              </button>
              <button
                className={workflowPrimary}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setArchiveError("");
                  try {
                    const r = await archiveRecruitment();
                    setMessage(
                      `Đã lưu trữ ${r.archivedCount} mục tuyển dụng đủ điều kiện.`,
                    );
                    setArchiving(false);
                    setRevision((v) => v + 1);
                  } catch (e) {
                    setArchiveError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Archive size={16} />
                {busy ? "Đang xử lý…" : "Xác nhận lưu trữ"}
              </button>
            </div>
          </div>
        </WorkflowModal>
      )}
    </div>
  );
}
