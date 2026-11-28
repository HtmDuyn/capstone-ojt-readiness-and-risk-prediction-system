import AccountSettings from '@/components/admin/AccountSettings';
import { PageBanner } from '@/components/common/PageBanner';

export default function AdminSettings({ variant }: { variant?: 'qhdn' }) {
  return (
    <div className="space-y-6">
      <PageBanner
        variant={variant}
        title="Hồ sơ cá nhân"
        description="Quản lý hồ sơ cá nhân và mật khẩu đăng nhập của bạn."
        badge={variant === 'qhdn' ? 'Phòng QHDN' : undefined}
      />
      <AccountSettings />
    </div>
  );
}
