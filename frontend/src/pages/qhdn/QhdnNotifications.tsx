import { AccountNotificationsPage } from '@/components/common/AccountNotificationsPage';
import { PageBanner } from '@/components/common/PageBanner';

export default function QhdnNotifications() {
  return <AccountNotificationsPage
    description="Theo dõi thông báo được gửi đến tài khoản Quan hệ Doanh nghiệp."
    badge="Phòng QHDN"
    banner={<PageBanner
      variant="qhdn"
      title="Thông báo"
      description="Theo dõi thông báo được gửi đến tài khoản Quan hệ Doanh nghiệp."
      badge="Phòng QHDN"
    />}
  />;
}
