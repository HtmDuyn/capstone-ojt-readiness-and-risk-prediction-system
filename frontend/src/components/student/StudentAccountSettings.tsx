import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/shared/useAuth';
import { apiRequest } from '@/services/studentService';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { Eye, EyeOff, Info, LockKeyhole, Save, UserRound } from 'lucide-react';

const inputClass = 'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const buttonClass = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function StudentAccountSettings({ onProfileSaved, initialProfile }: { onProfileSaved?: () => void; initialProfile?: { fullName: string; phone: string | null } }) {
  const { updateUser, logout } = useAuth();
  const { mustChangePassword } = useStudentPortal();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: initialProfile?.fullName ?? '', phone: initialProfile?.phone ?? '' });
  const [phoneKnown, setPhoneKnown] = useState(!!initialProfile);
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({ currentPassword: false, newPassword: false, confirmation: false });
  const [loading, setLoading] = useState(!initialProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (initialProfile) return;
    const controller = new AbortController();
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return apiRequest<{user: {fullName: string; phone?: string | null}}>('/auth/me', { signal: controller.signal });
    }).then(({user}) => {
      if (controller.signal.aborted) return;
      setProfile({ fullName: user.fullName, phone: user.phone ?? '' });
      setPhoneKnown(user.phone !== undefined);
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được hồ sơ.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); if (busy || mustChangePassword) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiRequest<{account: {full_name: string; phone: string | null}}>('/accounts/me/profile', { method: 'PATCH', data: {fullName: profile.fullName.trim(), ...(phoneKnown || phoneEdited ? {phone: profile.phone.trim() || null} : {})} });
      updateUser({name: result.account.full_name}); setMessage('Đã cập nhật hồ sơ cá nhân.');
      onProfileSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được hồ sơ.'); }
    finally { setBusy(false); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setError(''); setMessage('');
    if (passwords.newPassword !== passwords.confirmation) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (passwords.newPassword.length < 12 || new TextEncoder().encode(passwords.newPassword).length > 72) { setError('Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.'); return; }
    setBusy(true);
    try {
      await apiRequest('/auth/change-password', {method:'POST',data:{currentPassword:passwords.currentPassword,newPassword:passwords.newPassword}});
      logout(); navigate('/login', { replace: true, state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại.'); }
    finally { setBusy(false); }
  };
  return <section aria-labelledby="student-account-settings" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="border-b border-slate-100 pb-4"><h2 id="student-account-settings" className="text-lg font-semibold text-slate-900">Cài đặt tài khoản</h2><p className="mt-1 text-sm text-slate-500">Quản lý thông tin liên hệ và bảo mật tài khoản.</p></div>
    {mustChangePassword && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-800">Bạn cần đổi mật khẩu tạm trước khi sử dụng các chức năng sinh viên.</p>}
    {loading && <p role="status" className="mt-3">Đang tải hồ sơ...</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-emerald-700">{message}</p>}
    <div className="mt-5 grid gap-6 md:grid-cols-2">
      <form onSubmit={saveProfile} className="flex min-w-0 flex-col items-start gap-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><UserRound size={17} className="text-blue-600" aria-hidden="true" />Thông tin cá nhân</h3>
        <label className="block w-full text-sm font-medium text-slate-700">Họ tên<input required maxLength={100} autoComplete="name" value={profile.fullName} onChange={e => setProfile(current => ({...current,fullName:e.target.value}))} className={inputClass} /></label>
        <label className="block w-full text-sm font-medium text-slate-700">Số điện thoại<input type="tel" maxLength={20} autoComplete="tel" value={profile.phone} onChange={e => { setPhoneEdited(true); setProfile(current => ({...current,phone:e.target.value})); }} className={inputClass} /></label>
        <button type="submit" disabled={busy || loading || mustChangePassword} className={buttonClass}><Save size={16} aria-hidden="true" />Lưu hồ sơ</button>
      </form>
      <form onSubmit={changePassword} className="min-w-0 space-y-4 border-t border-slate-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><LockKeyhole size={17} className="text-blue-600" aria-hidden="true" />Đổi mật khẩu</h3>
        {([{key:'currentPassword',label:'Mật khẩu hiện tại'},{key:'newPassword',label:'Mật khẩu mới'},{key:'confirmation',label:'Xác nhận mật khẩu mới'}] as const).map(({key,label}) => <div key={key}><label htmlFor={`student-account-${key}`} className="block text-sm font-medium text-slate-700">{label}</label><div className="relative"><input id={`student-account-${key}`} required type={visiblePasswords[key] ? 'text' : 'password'} minLength={key === 'currentPassword' ? undefined : 12} autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} aria-describedby={key === 'newPassword' ? 'student-password-requirements' : undefined} value={passwords[key]} onChange={e => setPasswords(current => ({...current,[key]:e.target.value}))} className={inputClass + ' pr-11'} /><button type="button" aria-label={`${visiblePasswords[key] ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={visiblePasswords[key]} onClick={() => setVisiblePasswords(current => ({ ...current, [key]: !current[key] }))} className="absolute bottom-0 right-0 grid size-11 place-items-center rounded-xl text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{visiblePasswords[key] ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div>{key === 'newPassword' && <p id="student-password-requirements" className="mt-1.5 text-xs leading-5 text-slate-500">Ít nhất 12 ký tự, tối đa 72 byte UTF-8.</p>}</div>)}
        <p className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</p><button type="submit" disabled={busy} className={buttonClass}><LockKeyhole size={16} aria-hidden="true" />Đổi mật khẩu</button>
      </form>
    </div>
  </section>;
}
