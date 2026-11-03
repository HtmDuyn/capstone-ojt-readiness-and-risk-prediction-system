import StudentAccountSettings from '@/components/student/StudentAccountSettings';
import { StudentBanner } from '@/components/student/StudentBanner';
import { useStudentPortal } from '@/contexts/StudentPortalContext';

export default function StudentAccount() {
  const { refresh, profile, loading } = useStudentPortal();
  return <div className="space-y-6">
    <StudentBanner title="Tài khoản sinh viên" description="Cập nhật thông tin liên hệ và đổi mật khẩu của bạn." />
    {loading ? <p role="status">Đang tải hồ sơ...</p> : <StudentAccountSettings onProfileSaved={refresh} initialProfile={profile ? {fullName:profile.fullName,phone:profile.phone} : undefined} />}
  </div>;
}
