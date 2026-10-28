import AccountSettings from '@/components/admin/AccountSettings';
import { PageBanner } from '@/components/common/PageBanner';
import { useStudentPortal } from '@/contexts/StudentPortalContext';

export default function StudentAccount() {
  const { refresh } = useStudentPortal();
  return <div className="space-y-6">
    <PageBanner title="Tài khoản sinh viên" description="Cập nhật thông tin liên hệ và đổi mật khẩu của bạn." />
    <AccountSettings onProfileSaved={refresh} />
  </div>;
}
