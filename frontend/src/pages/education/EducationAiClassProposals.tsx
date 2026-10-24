import React from "react";
import { PageBanner } from "@/components/common/PageBanner";
const EducationAiClassProposals: React.FC = () => (
  <div className="space-y-6">
    <PageBanner
      title="Đề xuất lớp hỗ trợ"
      description="Đề xuất lớp dựa trên dữ liệu học tập."
      badge="Phòng Đào tạo"
    />
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <p>
        Chức năng đề xuất lớp AI và duyệt/bỏ qua đề xuất sẽ được phát triển ở
        giai đoạn sau.
      </p>
    </section>
  </div>
);
export default EducationAiClassProposals;
