import { AccountNotificationsPage } from '@/components/common/AccountNotificationsPage';
import { PageBanner } from '@/components/common/PageBanner';

export default function EducationNotifications() {
  return <AccountNotificationsPage
    description="Theo dõi thông báo được gửi đến tài khoản Phòng Đào tạo."
    badge="Phòng Đào tạo"
    banner={<PageBanner
      variant="education"
      title="Thông báo"
      description="Theo dõi thông báo được gửi đến tài khoản Phòng Đào tạo."
      badge="Phòng Đào tạo"
    />}
  />;
}
