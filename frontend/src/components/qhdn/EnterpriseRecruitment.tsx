import { useState, type FormEvent } from "react";
import { Check, Eye, XCircle } from "lucide-react";
import { listRecruitmentPosts, reviewRecruitmentPost } from "@/services/qhdnService";
import { Field, Notice, Pager, errorMessage, usePaged } from "./QhdnUi";
import { WorkflowModal, workflowInput, workflowPrimary, workflowSecondary } from "./StudentWorkflowUi";
import { EnterpriseStatus } from "./EnterpriseDetailsModal";
import type { CompanyListItem } from "@/types/qhdn/qhdnTypes";
import type { RecruitmentPost } from "@/types/qhdn/workflowTypes";
import { recruitmentLabels } from "@/utils/qhdnEnterprise";

export function EnterpriseRecruitment({ companies, companyId, onCompanyChange, onDataChanged }: {
  companies: CompanyListItem[];
  companyId: string;
  onCompanyChange: (id: string) => void;
  onDataChanged: () => void;
}) {
  const [status, setStatus] = useState(""), [revision, setRevision] = useState(0);
  const [post, setPost] = useState<RecruitmentPost | null>(null);
  const [decision, setDecision] = useState("VIEW"), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [message, setMessage] = useState("");
  const posts = usePaged(page => listRecruitmentPosts({ page, limit: 10, companyId: Number(companyId), ...(status ? { status } : {}) }), JSON.stringify([companyId, status, revision]), !!companyId);
  const review = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post || post.status !== "PENDING_REVIEW" || !["PUBLISH", "REJECT"].includes(decision)) return;
    const form = new FormData(event.currentTarget);
    const deadline = String(form.get("deadlineAt") || "").trim();
    setBusy(true);
    setError("");
    try {
      await reviewRecruitmentPost(post.id, { decision: decision as "PUBLISH" | "REJECT", reason: String(form.get("reason") || "").trim(), ...(decision === "PUBLISH" && deadline ? { deadlineAt: new Date(deadline).toISOString() } : {}) });
      setPost(null);
      setRevision(value => value + 1);
      onDataChanged();
      setMessage("Đã xử lý tin tuyển dụng.");
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      {message && <Notice>{message}</Notice>}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Tin tuyển dụng của doanh nghiệp</h2>
          <p className="text-sm text-slate-500">Xem nội dung và duyệt công bố hoặc từ chối tin đang chờ duyệt.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Doanh nghiệp"><select className={workflowInput} value={companyId} onChange={event => onCompanyChange(event.target.value)}><option value="">Chọn doanh nghiệp</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
            <Field label="Trạng thái tin"><select className={workflowInput} value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CLOSED", "ARCHIVED"].map(value => <option key={value} value={value}>{recruitmentLabels[value]}</option>)}</select></Field>
          </div>
        </div>
        {posts.error && <div className="p-5"><Notice>{posts.error}</Notice></div>}
        {!companyId || posts.busy || (!posts.error && !posts.data.items.length) ? <p className="p-12 text-center text-sm text-slate-500">{!companyId ? "Chọn doanh nghiệp để xem tin tuyển dụng." : posts.busy ? "Đang tải tin tuyển dụng…" : "Không có tin tuyển dụng phù hợp."}</p> : (
          <div className="divide-y divide-slate-100">
            {posts.data.items.map(item => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h3 className="font-bold text-slate-800">{item.title}</h3><EnterpriseStatus status={item.status} /></div><p className="mt-2 text-xs text-slate-500">Tin #{item.id} · Đợt #{item.windowId || "—"} · {item.positions?.length || 0} vị trí</p><p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.content || "Chưa có nội dung mô tả."}</p></div>
                <button className={item.status === "PENDING_REVIEW" ? workflowPrimary : workflowSecondary} onClick={() => { setPost(item); setDecision("VIEW"); setError(""); }}><Eye size={16} /> {item.status === "PENDING_REVIEW" ? "Xem & duyệt tin" : "Chi tiết"}</button>
              </article>
            ))}
          </div>
        )}
        {companyId && <div className="border-t border-slate-100 p-5"><Pager page={posts.page} total={posts.data.total} limit={posts.data.limit} busy={posts.busy} onChange={posts.setPage} /></div>}
      </section>
      {post && <WorkflowModal wide title={post.title} busy={busy} onClose={() => setPost(null)}>
        <form onSubmit={review} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <EnterpriseStatus status={post.status} />
          <p className="text-xs text-slate-500">{post.deadlineAt ? `Hạn nộp: ${new Date(post.deadlineAt).toLocaleString("vi-VN")}` : "Chưa cập nhật hạn nộp"}</p>
          <div className="max-h-[35vh] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm">{post.content || "Chưa có nội dung mô tả."}</p>{post.positions?.map(position => <div key={position.id} className="flex justify-between gap-4 rounded-xl bg-white p-3 text-sm"><span>{position.title}</span><span>Còn {position.remainingSlots}/{position.capacity} chỗ</span></div>)}</div>
          {post.status === "PENDING_REVIEW" && <Field label="Thao tác với tin"><select className={workflowInput} value={decision} onChange={event => { setDecision(event.target.value); setError(""); }}><option value="VIEW">Chỉ xem chi tiết</option><option value="PUBLISH">Duyệt & công bố</option><option value="REJECT">Từ chối công bố</option></select></Field>}
          {decision === "PUBLISH" && <Field label="Hạn ứng tuyển (tùy chọn)"><input className={workflowInput} name="deadlineAt" type="datetime-local" /></Field>}
          {decision !== "VIEW" && <Field label="Lý do thao tác"><textarea className={workflowInput} name="reason" required maxLength={2000} rows={2} /></Field>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={workflowSecondary} disabled={busy} onClick={() => setPost(null)}>Đóng</button>{decision !== "VIEW" && <button className={workflowPrimary} disabled={busy}>{decision === "REJECT" ? <XCircle size={16} /> : <Check size={16} />}{busy ? "Đang xử lý…" : "Xác nhận thao tác"}</button>}</div>
        </form>
      </WorkflowModal>}
    </div>
  );
}
