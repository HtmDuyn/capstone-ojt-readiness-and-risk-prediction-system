import {
  listCompanies,
  listInternshipEvaluations,
  listOjtResults,
  transferOjtResult,
  exportQhdnReport,
  exportOjtResults,
} from "@/services/qhdnService";
import { downloadFile } from "@/utils/downloadFile";
import { useEffect, useState, type FormEvent } from "react";
import { PageBanner } from "@/components/common/PageBanner";
import {
  action,
  control,
  errorMessage,
  Field,
  Notice,
  Pager,
  Panel,
  Table,
  useIdempotencyKey,
  usePaged,
} from "@/components/qhdn/QhdnUi";

import { loadAllPages } from "@/utils/loadAllPages";
import type {
  CompanyListItem,
  InternshipEvaluationItem,
} from "@/types/qhdn/qhdnTypes";
import type { ReportType } from "@/types/qhdn/workflowTypes";
import { useQhdnAcademicPeriods } from "@/hooks/useQhdnAcademicPeriods";
import { AcademicPeriodFilter } from "@/components/qhdn/StudentWorkflowUi";
const score = (value: number | null | undefined) =>
  value == null ? "Chưa có điểm" : Number(value).toFixed(1);
export default function QhdnEnterpriseEvaluations() {
  const [tab, setTab] = useState<"evaluations" | "results" | "reports">(
    "evaluations",
  );
  const catalog = useQhdnAcademicPeriods();
  const { semesterId } = catalog;
  const [companies, setCompanies] = useState<CompanyListItem[]>([]),
    [companyId, setCompanyId] = useState("");
  const [type, setType] = useState<ReportType>("acceptance"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [target, setTarget] = useState<InternshipEvaluationItem | null>(null),
    [detail, setDetail] = useState<InternshipEvaluationItem | null>(null);
  const keyFor = useIdempotencyKey();
  useEffect(() => {
    let active = true;
    loadAllPages((page) =>
        listCompanies({ page, limit: 100 }).then((r) => r.data),
      )
      .then((c) => {
        if (active) {
          setCompanies(c);
        }
      })
      .catch((e) => {
        if (active) setMessage(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setTarget(null);
    setDetail(null);
  }, [catalog.periodId]);
  const filters = {
    ojtSemesterId: Number(semesterId),
    ...(companyId ? { companyId: Number(companyId) } : {}),
  };
  const key = semesterId + ":" + companyId + ":" + type + ":" + revision;
  const evaluations = usePaged(
    (page) =>
      listInternshipEvaluations({ ...filters, page, limit: 10 }).then(
        (r) => r.data,
      ),
    key,
    !!semesterId && tab === "evaluations",
  );
  const results = usePaged(
    (page) =>
      listOjtResults({
        ojtSemesterId: Number(semesterId),
        page,
        limit: 10,
      }).then((r) => r.data),
    key,
    !!semesterId && tab === "results",
  );
  const current = tab === "results" ? results : evaluations;
  const run = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setMessage("");
    try {
      await work();
      setMessage(success);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const transfer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;
    const payload = {
      assignmentId: target.assignmentId,
      reason: String(new FormData(e.currentTarget).get("reason")).trim(),
    };
    if (!payload.reason) return;
    run(async () => {
      await transferOjtResult({ ...payload, idempotencyKey: keyFor(payload) });
      setTarget(null);
      setRevision((v) => v + 1);
    }, "Đã chuyển kết quả cho Phòng Đào tạo.");
  };
  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Đánh giá & Báo cáo OJT"
        description="Theo dõi đánh giá doanh nghiệp, chuyển kết quả và xuất báo cáo theo kỳ."
        badge="Phòng QHDN"
      />
      <div className="flex flex-wrap gap-3">
        <AcademicPeriodFilter selection={catalog} disabled={busy} controlClassName={control} />
        {tab !== "results" && (
          <Field label="Doanh nghiệp">
            <select
              className={control}
              disabled={busy}
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setTarget(null);
                setDetail(null);
              }}
            >
              <option value="">Tất cả doanh nghiệp</option>
              {companies.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["evaluations", "Phiếu đánh giá"],
            ["results", "Kết quả chuyển giao"],
            ["reports", "Xuất báo cáo"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? action : control}
            disabled={busy}
            onClick={() => {
              setTab(id);
              setTarget(null);
              setDetail(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {catalog.error && <Notice>{catalog.error}</Notice>}
      {!catalog.loading && catalog.selectedPeriod && !semesterId && (
        <Notice>Học kỳ / Block 3 này chưa liên kết kỳ OJT. Chưa có đánh giá hoặc kết quả OJT để hiển thị.</Notice>
      )}
      {message && <Notice>{message}</Notice>}
      <Panel
        title={
          {
            evaluations: "Đánh giá doanh nghiệp",
            results: "Kết quả OJT",
            reports: "Xuất báo cáo QHDN",
          }[tab]
        }
      >
        {tab === "reports" && (
          <select
            className={control}
            aria-label="Loại báo cáo"
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
          >
            <option value="acceptance">Tiếp nhận sinh viên</option>
            <option value="internships">Thực tập</option>
            <option value="enterprise-feedback">Phản hồi doanh nghiệp</option>
          </select>
        )}
        {tab !== "reports" && current.error && <Notice>{current.error}</Notice>}
        {current.busy ? (
          <p>Đang tải…</p>
        ) : (
          <>
            {tab === "evaluations" && (
              <Table
                headers={[
                  "Sinh viên / doanh nghiệp",
                  "Điểm",
                  "Trạng thái",
                  "Thao tác",
                ]}
              >
                {evaluations.data.items.map((r) => {
                  const transferred = !!r.assignment?.result;
                  const ready =
                    !transferred &&
                    r.status === "SUBMITTED" &&
                    ["COMPLETED", "FAILED"].includes(
                      r.assignment?.status || "",
                    );
                  return (
                    <tr key={r.id}>
                      <td>
                        {r.fullName || r.studentCode || "—"}
                        <br />
                        {r.companyName || "—"}
                      </td>
                      <td>{score(r.overallScore)}</td>
                      <td>
                        {r.status}
                        <br />
                        {r.assignment?.result?.status ||
                          r.assignment?.status ||
                          "—"}
                      </td>
                      <td className="space-x-2">
                        <button
                          className={control}
                          onClick={() => setDetail(r)}
                        >
                          Chi tiết
                        </button>
                        <button
                          className={control}
                          disabled={busy || !ready}
                          title={
                            ready
                              ? "Chuyển kết quả"
                              : "Cần đánh giá đã nộp, thực tập hoàn thành và chưa chuyển kết quả"
                          }
                          onClick={() => setTarget(r)}
                        >
                          Gửi Phòng Đào tạo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </Table>
            )}
            {tab === "results" && (
              <Table
                headers={[
                  "Sinh viên",
                  "Doanh nghiệp",
                  "Điểm chính thức",
                  "Trạng thái",
                ]}
              >
                {results.data.items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.fullName}
                      <br />
                      {r.studentCode}
                    </td>
                    <td>{r.enterpriseName || r.company?.name || "—"}</td>
                    <td>{score(r.officialScore)}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </Table>
            )}
            {tab !== "reports" && !current.error && !current.data.items.length && (
              <p className="py-4 text-slate-500">
                {semesterId
                  ? "Không có dữ liệu phù hợp."
                  : "Chọn kỳ OJT để xem dữ liệu."}
              </p>
            )}
          </>
        )}
        {tab !== "reports" && <Pager
          page={current.page}
          total={current.data.total}
          limit={current.data.limit}
          busy={current.busy || busy}
          onChange={current.setPage}
        />}
        <div className="flex flex-wrap gap-2">
          {tab !== "reports" && <button
            className={control}
            disabled={busy || current.busy}
            onClick={current.reload}
          >
            Tải lại
          </button>}
          {tab === "reports" ? (
            <button
              className={action}
              disabled={busy || !semesterId}
              onClick={() =>
                run(
                  () =>
                    downloadFile(
                      () => exportQhdnReport(type, filters),
                      `qhdn-${type}.csv`,
                    ),
                  "Đã tải báo cáo CSV.",
                )
              }
            >
              Xuất báo cáo CSV
            </button>
          ) : (
            (["csv", "pdf"] as const).map((format) => (
              <button
                className={control}
                key={format}
                disabled={busy || !semesterId}
                onClick={() =>
                  run(
                    () =>
                      downloadFile(
                        () => exportOjtResults(Number(semesterId), format),
                        `ojt-results-${semesterId}.${format}`,
                      ),
                    "Đã tải kết quả OJT.",
                  )
                }
              >
                Xuất kết quả {format.toUpperCase()}
              </button>
            ))
          )}
        </div>
      </Panel>
      {detail && (
        <Panel title="Chi tiết phiếu đánh giá">
          <p>
            {detail.fullName || detail.studentCode} ·{" "}
            {detail.companyName || "—"}
          </p>
          <p>
            Hoàn thành: {score(detail.completionScore)} · Thái độ:{" "}
            {score(detail.attitudeScore)} · Chuyên môn:{" "}
            {score(detail.skillScore)} · Tổng: {score(detail.overallScore)}
          </p>
          <p className="whitespace-pre-wrap">
            {detail.comments || "Chưa có nhận xét."}
          </p>
          <button className={control} onClick={() => setDetail(null)}>
            Đóng chi tiết
          </button>
        </Panel>
      )}
      {target && (
        <Panel
          title={"Chuyển kết quả: " + (target.fullName || target.studentCode)}
        >
          <form onSubmit={transfer} className="space-y-3">
            <Field label="Lý do chuyển giao">
              <textarea
                className={control}
                name="reason"
                required
                maxLength={2000}
              />
            </Field>
            <div className="flex gap-2">
              <button className={action} disabled={busy}>
                Xác nhận chuyển kết quả
              </button>
              <button
                type="button"
                className={control}
                disabled={busy}
                onClick={() => setTarget(null)}
              >
                Hủy
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
