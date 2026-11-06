import { useState } from "react";
import { Eye } from "lucide-react";
import { listRecruitmentPosts } from "@/services/qhdnService";
import { Field, Notice, Pager, usePaged } from "./QhdnUi";
import { WorkflowModal, workflowInput, workflowSecondary } from "./StudentWorkflowUi";
import { EnterpriseStatus } from "./EnterpriseDetailsModal";
import type { CompanyListItem } from "@/types/qhdn/qhdnTypes";
import type { RecruitmentPost } from "@/types/qhdn/workflowTypes";
import { recruitmentLabels } from "@/utils/qhdnEnterprise";

export function EnterpriseRecruitment({ companies, companyId, onCompanyChange }: {
  companies: CompanyListItem[];
  companyId: string;
  onCompanyChange: (id: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [post, setPost] = useState<RecruitmentPost | null>(null);
  const posts = usePaged(page => listRecruitmentPosts({ page, limit: 10, companyId: Number(companyId), ...(status ? { status } : {}) }), JSON.stringify([companyId, status]), !!companyId);
  return (
    <div data-qhdn-recruitment className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Tin tuyển dụng của doanh nghiệp</h2>
          <p className="text-sm text-slate-500">Doanh nghiệp đăng tin là sinh viên thấy ngay. QHDN theo dõi nội dung, vị trí và chỉ tiêu tại đây.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Doanh nghiệp"><select className={workflowInput} value={companyId} onChange={event => onCompanyChange(event.target.value)}><option value="">Chọn doanh nghiệp</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
            <Field label="Trạng thái tin"><select className={workflowInput} value={status} onChange={event => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CLOSED", "ARCHIVED"].map(value => <option key={value} value={value}>{recruitmentLabels[value]}</option>)}</select></Field>
          </div>
        </div>
        {posts.error && <div className="p-5"><Notice>{posts.error}</Notice></div>}
        {!companyId || posts.busy || (!posts.error && !posts.data.items.length) ? <p className="p-12 text-center text-sm text-slate-500">{!companyId ? "Chọn doanh nghiệp để xem tin tuyển dụng." : posts.busy ? "Đang tải tin tuyển dụng…" : "Không có tin tuyển dụng phù hợp."}</p> : (
          <div className="divide-y divide-slate-100">
            {posts.data.items.map(item => (
              <article key={item.id} data-post-id={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h3 className="font-bold text-slate-800">{item.title}</h3><EnterpriseStatus status={item.status} /></div><p className="mt-2 text-xs text-slate-500">Tin #{item.id} · Đợt #{item.windowId || "—"} · {item.positions?.length || 0} vị trí</p><p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.content || "Chưa có nội dung mô tả."}</p></div>
                <button type="button" className={workflowSecondary} onClick={() => setPost(item)}><Eye size={16} />Chi tiết</button>
              </article>
            ))}
          </div>
        )}
        {companyId && <div className="border-t border-slate-100 p-5"><Pager page={posts.page} total={posts.data.total} limit={posts.data.limit} busy={posts.busy} onChange={posts.setPage} /></div>}
      </section>
      {post && <WorkflowModal wide title={post.title} onClose={() => setPost(null)}>
        <div className="space-y-5">
          <EnterpriseStatus status={post.status} />
          <p className="text-xs text-slate-500">{post.deadlineAt ? `Hạn nộp: ${new Date(post.deadlineAt).toLocaleString("vi-VN")}` : "Chưa cập nhật hạn nộp"}</p>
          <div className="max-h-[35vh] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm">{post.content || "Chưa có nội dung mô tả."}</p>{post.positions?.map(position => <div key={position.id} className="flex justify-between gap-4 rounded-xl bg-white p-3 text-sm"><span>{position.title}</span><span>Còn {position.remainingSlots}/{position.capacity} chỗ</span></div>)}</div>
          <div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" className={workflowSecondary} onClick={() => setPost(null)}>Đóng</button></div>
        </div>
      </WorkflowModal>}
    </div>
  );
}
