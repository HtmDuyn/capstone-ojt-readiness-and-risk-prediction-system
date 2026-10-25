import AccountSettings from '@/components/admin/AccountSettings';
import { PageBanner } from '@/components/common/PageBanner';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageBanner
        title="Cài đặt hệ thống"
        description="Quản lý hồ sơ cá nhân và mật khẩu đăng nhập của bạn."
        badge="Tài khoản cá nhân"
      />
      <AccountSettings />
    </div>
  );
}
