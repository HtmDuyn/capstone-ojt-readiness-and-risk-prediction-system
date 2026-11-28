import AccountSettings from '@/components/admin/AccountSettings';
import { PageBanner } from '@/components/common/PageBanner';
import QhdnProfile from '@/pages/qhdn/QhdnProfile';

export default function AdminSettings({ variant }: { variant?: 'qhdn' }) {
  if (variant === 'qhdn') return <QhdnProfile />;
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
