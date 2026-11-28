import StudentAccountSettings from '@/components/student/StudentAccountSettings';
import { StudentBanner } from '@/components/student/StudentBanner';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useState } from 'react';
import { BookOpen, IdCard, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/shared/useAuth';

export default function StudentAccount() {
  const { refresh, profile, loading, refreshing, error } = useStudentPortal();
  const { user } = useAuth();
  const [notice, setNotice] = useState('');
  const details = [
    { label: 'Mã sinh viên', value: profile?.studentCode, icon: IdCard },
    { label: 'Số điện thoại', value: profile?.phone, icon: Phone },
    { label: 'Email', value: profile?.email ?? user?.email, icon: Mail },
    { label: 'Ngành học', value: profile?.program?.majorName ?? profile?.program?.name, icon: BookOpen },
  ];
  return <div className="space-y-6">
    <StudentBanner title="Tài khoản sinh viên" description="Cập nhật thông tin liên hệ và đổi mật khẩu của bạn." />
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button type="button" onClick={refresh} className="font-medium underline">Thử lại</button></p>}
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
      <section aria-labelledby="student-account-profile" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-center border-b border-slate-100 pb-5 text-center">
          {user?.avatar ? <img src={user.avatar} alt="Ảnh đại diện sinh viên" className="size-20 rounded-full border border-slate-200 object-cover" /> : <span className="grid size-20 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-400"><UserRound size={36} strokeWidth={1.5} aria-hidden="true" /></span>}
          <h2 id="student-account-profile" className="mt-3 break-words text-lg font-semibold text-slate-900">{profile?.fullName ?? user?.name ?? 'Sinh viên'}</h2>
          <span className="mt-1 text-sm text-slate-500">Sinh viên</span>
        </div>
        <dl className="divide-y divide-slate-100">{details.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-start justify-between gap-3 py-3.5 text-xs sm:text-sm">
          <dt className="flex shrink-0 items-center gap-2 text-slate-500"><Icon size={16} className="text-slate-400" aria-hidden="true" />{label}</dt><dd className="min-w-0 break-words text-right font-medium text-slate-800">{value || (loading ? 'Đang tải…' : 'Chưa cập nhật')}</dd>
        </div>)}</dl>
      </section>
      {loading || refreshing ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải hồ sơ...</div> : <StudentAccountSettings onProfileSaved={() => { setNotice('Đã cập nhật hồ sơ cá nhân.'); refresh(); }} initialProfile={profile ? {fullName:profile.fullName,phone:profile.phone} : undefined} />}
    </div>
  </div>;
}
