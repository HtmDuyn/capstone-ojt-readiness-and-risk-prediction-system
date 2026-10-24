import React from "react";
import { PageBanner } from "@/components/common/PageBanner";
const EducationOjtRegistrationPeriod: React.FC = () => (
  <div className="space-y-6">
    <PageBanner
      title="Đợt đăng ký OJT"
      description="Theo phân quyền backend hiện tại, đợt đăng ký OJT do Phòng QHDN quản lý."
      badge="Phòng Đào tạo"
    />
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <p>
        Tài khoản Phòng đào tạo không có quyền xem, tạo, sửa hoặc mở/đóng đợt
        đăng ký OJT. Phòng QHDN thực hiện các thao tác này sau khi nhận danh
        sách sinh viên được bàn giao.
      </p>
    </section>
  </div>
);
export default EducationOjtRegistrationPeriod;
