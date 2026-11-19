import AccountSettings from '@/components/admin/AccountSettings';
import { PageBanner } from '@/components/common/PageBanner';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageBanner
        title="Hồ sơ cá nhân"
        description="Quản lý hồ sơ cá nhân và mật khẩu đăng nhập của bạn."
      />
      <AccountSettings />
    </div>
  );
}
