import {
  getAcademicPeriods,
  listCompanies,
  archiveRecruitment,
  closeRecruitmentPost,
  createRecruitmentWindow,
  listRecruitmentPosts,
  reviewRecruitmentPost,
  updateCompany,
  updateRecruitmentWindow,
} from "@/services/qhdnService";
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
  usePaged,
} from "@/components/qhdn/QhdnUi";
import { QhdnEnterpriseImportModal } from "@/components/qhdn/import/QhdnEnterpriseImportModal";

import { loadAllPages } from "@/utils/loadAllPages";

import type {
  AcademicPeriodItem,
  CompanyListItem,
} from "@/types/qhdn/qhdnTypes";
import type { RecruitmentWindow } from "@/types/qhdn/workflowTypes";

export default function QhdnEnterpriseManagement() {
  const [tab, setTab] = useState<"companies" | "windows" | "posts">(
    "companies",
  );
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CompanyListItem[]>([]),
    [periods, setPeriods] = useState<AcademicPeriodItem[]>([]);
  const [companyId, setCompanyId] = useState(""),
    [postStatus, setPostStatus] = useState("");
  const [editing, setEditing] = useState<CompanyListItem | null>(null),
    [importing, setImporting] = useState(false);
  const [windowId, setWindowId] = useState(""),
    [lastWindow, setLastWindow] = useState<RecruitmentWindow | null>(null);
  const companies = usePaged(
    (page) =>
      listCompanies({
        page,
        limit: 10,
        ...(query ? { search: query } : {}),
      }).then((r) => r.data),
    query + revision,
  );
  const posts = usePaged(
    (page) =>
      listRecruitmentPosts({
        page,
        limit: 10,
        companyId: Number(companyId),
        ...(postStatus ? { status: postStatus } : {}),
      }),
    companyId + postStatus + revision,
    tab === "posts" && !!companyId,
  );
  useEffect(() => {
    let active = true;
    Promise.all([
      loadAllPages((page) =>
        listCompanies({ page, limit: 100 }).then((r) => r.data),
      ),
      loadAllPages((page) => getAcademicPeriods({ page, limit: 100 })),
    ])
      .then(([c, p]) => {
        if (active) {
          setCatalog(c);
          setPeriods(p);
        }
      })
      .catch((e) => {
        if (active) setMessage(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const run = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setMessage("");
    try {
      await work();
      setMessage(success);
      setRevision((v) => v + 1);
      return true;
    } catch (e) {
      setMessage(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const saveCompany = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    const value = (k: string) => String(f.get(k) || "").trim();
    if (
      await run(
        () =>
          updateCompany(editing.id, {
            name: value("name"),
            address: value("address") || null,
            industry: value("industry") || null,
            contactPersonName: value("contactPersonName") || null,
            contactEmail: value("contactEmail") || null,
            contactPhone: value("contactPhone") || null,
            status: value("status"),
            reason: value("reason"),
          }),
        "Đã cập nhật doanh nghiệp.",
      )
    )
      setEditing(null);
  };
  const saveWindow = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      value = (k: string) => String(f.get(k) || "").trim();
    const start = new Date(value("startsAt")),
      end = new Date(value("endsAt"));
    if (end <= start) {
      setMessage("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    await run(async () => {
      const w = await createRecruitmentWindow({
        academicPeriodId: Number(value("period")),
        name: value("name"),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        reason: value("reason"),
      });
      setLastWindow(w);
      setWindowId(String(w.id));
    }, "Đã tạo đợt tuyển dụng. Hãy mở đợt trước khi import.");
  };
  const changeWindow = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const endsAt = String(f.get("endsAt") || "");
    await run(async () => {
      const w = await updateRecruitmentWindow(Number(windowId), {
        status: String(f.get("status")) as "OPEN" | "CLOSED",
        reason: String(f.get("reason")),
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
      });
      setLastWindow(w);
    }, "Đã cập nhật đợt tuyển dụng.");
  };
  const postAction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const id = Number(f.get("postId")),
      kind = String(f.get("decision")),
      reason = String(f.get("reason"));
    const deadlineAt = String(f.get("deadlineAt") || "");
    const selectedPost = posts.data.items.find((p) => p.id === id);
    if (kind !== "CLOSE" && selectedPost?.status !== "PENDING_REVIEW") {
      setMessage("Chỉ tin chờ duyệt mới được công bố hoặc từ chối.");
      return;
    }
    await run(
      () =>
        kind === "CLOSE"
          ? closeRecruitmentPost(id, reason)
          : reviewRecruitmentPost(id, {
              decision: kind as "PUBLISH" | "REJECT",
              reason,
              ...(deadlineAt
                ? { deadlineAt: new Date(deadlineAt).toISOString() }
                : {}),
            }),
      "Đã xử lý tin tuyển dụng.",
    );
  };
  return (
    <div className="space-y-5 pb-10">
      <PageBanner
        title="Doanh nghiệp & Tuyển dụng"
        description="Quản lý đối tác, đợt tuyển dụng và duyệt tin trước khi sinh viên ứng tuyển."
        badge="Phòng QHDN"
      />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["companies", "Doanh nghiệp"],
            ["windows", "Đợt tuyển dụng"],
            ["posts", "Tin tuyển dụng"],
          ] as const
        ).map(([id, label]) => (
          <button
            className={tab === id ? action : control}
            key={id}
            disabled={busy}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <button
          className={control}
          disabled={busy}
          onClick={() => setImporting(true)}
        >
          Import doanh nghiệp
        </button>
        <button
          className={control}
          disabled={busy}
          onClick={() => {
            if (
              window.confirm("Lưu trữ tuyển dụng đủ điều kiện sau hai học kỳ?")
            )
              run(
                () => archiveRecruitment(),
                "Đã thực hiện lưu trữ tuyển dụng theo quy định.",
              );
          }}
        >
          Lưu trữ tuyển dụng
        </button>
      </div>
      {message && <Notice>{message}</Notice>}
      {tab === "companies" && (
        <Panel title="Doanh nghiệp liên kết">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <input
              className={control}
              aria-label="Tìm doanh nghiệp"
              placeholder="Tên hoặc mã doanh nghiệp"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className={action}>Tìm kiếm</button>
          </form>
          {companies.error && <Notice>{companies.error}</Notice>}
          {companies.busy ? (
            <p>Đang tải…</p>
          ) : (
            <>
              <Table
                headers={[
                  "Mã",
                  "Tên doanh nghiệp",
                  "Liên hệ",
                  "Trạng thái",
                  "Thao tác",
                ]}
              >
                {companies.data.items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.name}</td>
                    <td>
                      {c.contactPersonName || "—"}
                      <br />
                      {c.contactEmail || "—"}
                    </td>
                    <td>{c.status}</td>
                    <td>
                      <button className={control} onClick={() => setEditing(c)}>
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
              {!companies.error && !companies.data.items.length && (
                <p>Không có doanh nghiệp phù hợp.</p>
              )}
            </>
          )}
          <Pager
            page={companies.page}
            total={companies.data.total}
            limit={companies.data.limit}
            busy={companies.busy}
            onChange={companies.setPage}
          />
        </Panel>
      )}
      {tab === "windows" && (
        <>
          <Panel title="Tạo đợt tuyển dụng">
            <form onSubmit={saveWindow} className="grid gap-3 md:grid-cols-2">
              <Field label="Kỳ học">
                <select
                  className={control}
                  name="period"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Chọn kỳ học
                  </option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tên đợt">
                <input
                  className={control}
                  name="name"
                  required
                  maxLength={150}
                />
              </Field>
              <Field label="Bắt đầu">
                <input
                  className={control}
                  name="startsAt"
                  type="datetime-local"
                  required
                />
              </Field>
              <Field label="Kết thúc">
                <input
                  className={control}
                  name="endsAt"
                  type="datetime-local"
                  required
                />
              </Field>
              <Field label="Lý do">
                <input
                  className={control}
                  name="reason"
                  required
                  maxLength={2000}
                />
              </Field>
              <button className={action} disabled={busy || !periods.length}>
                Tạo đợt
              </button>
            </form>
          </Panel>
          <Panel title="Mở, đóng hoặc gia hạn đợt">
            <p className="text-sm text-slate-600">
              Nhập mã đợt vừa tạo hoặc mã đợt được ghi trong tin tuyển dụng.
            </p>
            {lastWindow && (
              <Notice>
                Mã đợt: {lastWindow.id} · {lastWindow.name || "—"} ·{" "}
                {lastWindow.status || "—"}
              </Notice>
            )}
            <form onSubmit={changeWindow} className="grid gap-3 md:grid-cols-2">
              <Field label="Mã đợt">
                <input
                  className={control}
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={windowId}
                  onChange={(e) => setWindowId(e.target.value)}
                />
              </Field>
              <Field label="Trạng thái">
                <select className={control} name="status">
                  <option value="OPEN">Mở</option>
                  <option value="CLOSED">Đóng</option>
                </select>
              </Field>
              <Field label="Hạn mới (tùy chọn)">
                <input
                  className={control}
                  name="endsAt"
                  type="datetime-local"
                />
              </Field>
              <Field label="Lý do">
                <input
                  className={control}
                  name="reason"
                  required
                  maxLength={2000}
                />
              </Field>
              <button className={action} disabled={busy}>
                Xác nhận cập nhật đợt
              </button>
            </form>
          </Panel>
        </>
      )}
      {tab === "posts" && (
        <Panel title="Duyệt và đóng tin tuyển dụng">
          <div className="flex flex-wrap gap-2">
            <select
              className={control}
              aria-label="Doanh nghiệp tuyển dụng"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">Chọn doanh nghiệp</option>
              {catalog.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className={control}
              aria-label="Trạng thái tin"
              value={postStatus}
              onChange={(e) => setPostStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {[
                "DRAFT",
                "PENDING_REVIEW",
                "PUBLISHED",
                "REJECTED",
                "CLOSED",
                "ARCHIVED",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {posts.error && <Notice>{posts.error}</Notice>}
          {posts.busy ? (
            <p>Đang tải…</p>
          ) : (
            <>
              <Table
                headers={[
                  "Tin tuyển dụng",
                  "Đợt",
                  "Vị trí / chỉ tiêu còn lại",
                  "Trạng thái",
                ]}
              >
                {posts.data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      #{p.id} · {p.title}
                      <p className="max-w-lg whitespace-pre-wrap text-slate-600">
                        {p.content || "Chưa có nội dung."}
                      </p>
                    </td>
                    <td>{p.windowId || "—"}</td>
                    <td>
                      {p.positions?.map((v) => (
                        <div key={v.id}>
                          {v.title} · {v.remainingSlots}/{v.capacity}
                        </div>
                      ))}
                    </td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </Table>
              {companyId && !posts.error && !posts.data.items.length && (
                <p>Không có tin tuyển dụng phù hợp.</p>
              )}
            </>
          )}
          <Pager
            page={posts.page}
            total={posts.data.total}
            limit={posts.data.limit}
            busy={posts.busy}
            onChange={posts.setPage}
          />
          <form
            onSubmit={postAction}
            className="grid gap-3 border-t pt-4 md:grid-cols-2"
          >
            <Field label="Tin cần xử lý">
              <select
                className={control}
                name="postId"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Chọn tin trong trang này
                </option>
                {posts.data.items
                  .filter((p) => !["CLOSED", "ARCHIVED"].includes(p.status))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} {p.title} · {p.status}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Thao tác">
              <select className={control} name="decision">
                <option value="PUBLISH">Công bố</option>
                <option value="REJECT">Từ chối</option>
                <option value="CLOSE">Đóng tin</option>
              </select>
            </Field>
            <Field label="Hạn ứng tuyển (khi công bố)">
              <input
                className={control}
                name="deadlineAt"
                type="datetime-local"
              />
            </Field>
            <Field label="Lý do">
              <input
                className={control}
                name="reason"
                required
                maxLength={2000}
              />
            </Field>
            <button
              className={action}
              disabled={busy || !companyId || posts.busy}
            >
              Xác nhận xử lý tin
            </button>
          </form>
        </Panel>
      )}
      {editing && (
        <Panel title={"Cập nhật: " + editing.name}>
          <form
            key={editing.id}
            onSubmit={saveCompany}
            className="grid gap-3 md:grid-cols-2"
          >
            {(
              [
                "name",
                "address",
                "industry",
                "contactPersonName",
                "contactPhone",
                "contactEmail",
              ] as const
            ).map((k, i) => (
              <Field
                key={k}
                label={
                  [
                    "Tên doanh nghiệp",
                    "Địa chỉ",
                    "Lĩnh vực",
                    "Người liên hệ",
                    "Điện thoại",
                    "Email",
                  ][i]
                }
              >
                <input
                  className={control}
                  name={k}
                  defaultValue={editing[k] || ""}
                  required={k === "name"}
                  type={k === "contactEmail" ? "email" : "text"}
                  maxLength={
                    k === "name"
                      ? 200
                      : k === "address"
                        ? 300
                        : k === "contactPhone"
                          ? 20
                          : 100
                  }
                />
              </Field>
            ))}
            <Field label="Trạng thái">
              <select
                name="status"
                className={control}
                defaultValue={editing.status}
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </Field>
            <Field label="Lý do">
              <input
                className={control}
                name="reason"
                required
                maxLength={2000}
              />
            </Field>
            <div className="flex gap-2">
              <button className={action} disabled={busy}>
                Lưu thay đổi
              </button>
              <button
                type="button"
                className={control}
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Hủy
              </button>
            </div>
          </form>
        </Panel>
      )}
      {importing && (
        <QhdnEnterpriseImportModal
          isOpen
          onClose={() => setImporting(false)}
          initialWindowId={lastWindow?.id}
          onImported={() => {
            setRevision((v) => v + 1);
            setMessage(
              "Import thành công. Danh sách được tải lại từ hệ thống.",
            );
          }}
        />
      )}
    </div>
  );
}
