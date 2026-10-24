import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/services/api';

export default function AccountSettings() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest<{user: {fullName: string; phone: string | null}}>('/auth/me').then(({user}) => { if (active) setProfile({ fullName: user.fullName, phone: user.phone ?? '' }); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không tải được hồ sơ.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiRequest<{user: {fullName: string; phone: string | null}}>('/accounts/me/profile', { method: 'PATCH', body: JSON.stringify({fullName: profile.fullName.trim(), phone: profile.phone.trim() || null}) });
      updateUser({name: result.user.fullName}); setMessage('Đã cập nhật hồ sơ cá nhân.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được hồ sơ.'); }
    finally { setBusy(false); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setError(''); setMessage('');
    if (passwords.newPassword !== passwords.confirmation) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    try {
      await apiRequest('/auth/change-password', {method:'POST',body:JSON.stringify({currentPassword:passwords.currentPassword,newPassword:passwords.newPassword})});
      logout(); navigate('/login', { replace: true, state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold">Tài khoản cá nhân</h2>
    {loading && <p role="status" className="mt-3">Đang tải hồ sơ...</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-emerald-700">{message}</p>}
    <div className="mt-5 grid gap-8 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-4"><h3 className="font-semibold">Hồ sơ</h3><label className="block text-sm">Họ tên<input required maxLength={100} value={profile.fullName} onChange={e => setProfile(current => ({...current,fullName:e.target.value}))} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm">Số điện thoại<input type="tel" maxLength={20} value={profile.phone} onChange={e => setProfile(current => ({...current,phone:e.target.value}))} className="mt-2 w-full rounded-xl border p-3" /></label><button disabled={busy || loading} className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white disabled:opacity-50">Lưu hồ sơ</button></form>
      <form onSubmit={changePassword} className="space-y-4"><h3 className="font-semibold">Đổi mật khẩu</h3>{([{key:'currentPassword',label:'Mật khẩu hiện tại'},{key:'newPassword',label:'Mật khẩu mới'},{key:'confirmation',label:'Xác nhận mật khẩu mới'}] as const).map(({key,label}) => <label key={key} className="block text-sm">{label}<input required type="password" minLength={key === 'currentPassword' ? undefined : 8} autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} value={passwords[key]} onChange={e => setPasswords(current => ({...current,[key]:e.target.value}))} className="mt-2 w-full rounded-xl border p-3" /></label>)}<p className="text-xs text-slate-500">Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</p><button disabled={busy} className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white disabled:opacity-50">Đổi mật khẩu</button></form>
    </div>
  </section>;
}
