import { PageBanner } from '@/components/common/PageBanner';

// Trang được giữ trong source để có thể kết nối khi Backend cung cấp API cấu hình cho Admin.
export default function AdminAiConfig() {
  return <div className="space-y-4">
    <PageBanner title="Tích hợp AI tư vấn" description="Thông tin tích hợp AI dành cho quản trị viên." />
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">Tính năng theo dõi và cấu hình tích hợp AI hiện chưa sẵn sàng. Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
    </section>
  </div>;
}
