import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Save, ShieldCheck, UserRound } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { useAuth } from '@/hooks/shared/useAuth';
import { apiRequest } from '@/services/apiService';
import type { CurrentUserResponse } from '@/services/authService';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

type AccountProfile = CurrentUserResponse['user'];
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmation';
type SavedProfile = { full_name: string; phone: string | null; updated_at?: string };

const inputClass = 'h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' });
const dateText = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? dateFormatter.format(new Date(value)) : 'Chưa ghi nhận';
const passwordFields = [
  { key: 'currentPassword', label: 'Mật khẩu hiện tại' },
  { key: 'newPassword', label: 'Mật khẩu mới' },
  { key: 'confirmation', label: 'Xác nhận mật khẩu mới' },
] as const;

export default function QhdnProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [profile, setProfile] = useState({ fullName: user?.name ?? '', phone: '' });
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [visiblePasswords, setVisiblePasswords] = useState<Partial<Record<PasswordField, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'profile' | 'password' | null>(null);
  const [loadError, setLoadError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    apiRequest<CurrentUserResponse>('/auth/me', { signal: controller.signal })
      .then(({ user: loaded }) => {
        if (controller.signal.aborted) return;
        setAccount(loaded);
        setProfile({ fullName: loaded.fullName, phone: loaded.phone ?? '' });
        setPhoneEdited(false);
      })
      .catch(error => { if (!controller.signal.aborted) setLoadError(friendlyErrorMessage(error, 'Không tải được hồ sơ. Vui lòng thử lại.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || loading || !account || loadError) return;
    if (!profile.fullName.trim()) { setProfileError('Vui lòng nhập họ tên.'); return; }
    setBusy('profile'); setProfileError(''); setMessage('');
    try {
      const { account: saved } = await apiRequest<{ account: SavedProfile }>('/accounts/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: profile.fullName.trim(), ...(account.phone !== undefined || phoneEdited ? { phone: profile.phone.trim() || null } : {}) }),
      });
      setProfile({ fullName: saved.full_name, phone: saved.phone ?? '' });
      setAccount(current => current ? { ...current, fullName: saved.full_name, phone: saved.phone, updatedAt: saved.updated_at ?? current.updatedAt } : current);
      setPhoneEdited(false);
      updateUser({ name: saved.full_name });
      setMessage('Đã lưu thông tin cá nhân.');
    } catch (error) { setProfileError(friendlyErrorMessage(error, 'Không lưu được hồ sơ. Vui lòng thử lại.')); }
    finally { setBusy(null); }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || loading || !account || loadError) return;
    setPasswordError('');
    if (passwords.newPassword !== passwords.confirmation) { setPasswordError('Mật khẩu xác nhận không khớp.'); return; }
    if (passwords.newPassword.length < 12 || new TextEncoder().encode(passwords.newPassword).length > 72) {
      setPasswordError('Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.'); return;
    }
    setBusy('password');
    try {
      await apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      logout();
      navigate('/login', { replace: true, state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });
    } catch (error) { setPasswordError(friendlyErrorMessage(error, 'Không đổi được mật khẩu. Vui lòng thử lại.')); }
    finally { setBusy(null); }
  };

  const displayName = account?.fullName || user?.name || 'Cán bộ QHDN';
  const email = account?.email || user?.email || 'Chưa cập nhật';
  const initials = displayName.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toLocaleUpperCase('vi');
  const disabled = loading || !!busy || !account || !!loadError;
  const changed = !!account && (profile.fullName.trim() !== account.fullName || profile.phone.trim() !== (account.phone ?? ''));

  return <div className="space-y-5 pb-6">
    <PageBanner variant="qhdn" title="Hồ sơ cá nhân" description="Thông tin liên hệ, tài khoản và bảo mật của bạn." badge="Phòng QHDN" className="[&_.qhdn-hero-flow]:hidden" />

    {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p>{loadError}</p>
      <button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} className="inline-flex items-center gap-2 font-semibold disabled:opacity-50"><RefreshCw size={16} />Thử lại</button>
    </div>}

    <section aria-label="Hồ sơ cán bộ Quan hệ doanh nghiệp" aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl font-bold text-orange-700 ring-1 ring-orange-100">{initials}</span>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-slate-900">{displayName}</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{email}</p>
            <p className="mt-1.5 text-xs font-medium text-slate-600">Phòng Quan hệ doanh nghiệp</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {loading ? <p role="status" className="inline-flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Đang tải hồ sơ…</p>
            : account && <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold '+(account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
              <CheckCircle2 size={14} />{account.status === 'ACTIVE' ? 'Tài khoản đang hoạt động' : 'Tài khoản chưa hoạt động'}
            </span>}
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <form onSubmit={saveProfile} aria-labelledby="qhdn-profile-heading" className="flex min-w-0 flex-col gap-5 p-5 sm:p-6">
          <div>
            <h3 id="qhdn-profile-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><UserRound size={18} className="text-orange-600" />Thông tin cá nhân</h3>
            <p className="mt-1 text-sm text-slate-500">Cập nhật họ tên và số điện thoại liên hệ.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="min-w-0 text-xs font-semibold text-slate-600">Họ và tên
              <input name="fullName" required maxLength={150} autoComplete="name" disabled={disabled} value={profile.fullName} onChange={event => setProfile(current => ({ ...current, fullName: event.target.value }))} className={inputClass+' mt-1.5'} />
            </label>
            <label className="min-w-0 text-xs font-semibold text-slate-600">Số điện thoại
              <input name="phone" type="tel" maxLength={20} autoComplete="tel" disabled={disabled} placeholder="Chưa cập nhật" value={profile.phone} onChange={event => { setPhoneEdited(true); setProfile(current => ({ ...current, phone: event.target.value })); }} className={inputClass+' mt-1.5'} />
            </label>
          </div>
          <dl className="grid gap-x-5 gap-y-4 border-y border-slate-100 py-4 text-sm sm:grid-cols-2">
            {[
              ['Email tài khoản', email],
              ['Tên đăng nhập', account?.username || 'Chưa cập nhật'],
              ['Vai trò', account?.roleCode === 'OJT_COORD' ? 'Cán bộ Quan hệ doanh nghiệp' : account?.roleName || 'Chưa cập nhật'],
              ['Ngày tạo tài khoản', dateText(account?.createdAt)],
            ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd></div>)}
          </dl>
          <p className="text-xs leading-relaxed text-slate-500">Email và tên đăng nhập do quản trị viên quản lý.</p>
          {profileError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{profileError}</p>}
          {message && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={16} className="shrink-0" />{message}</p>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Cập nhật gần nhất: {dateText(account?.updatedAt)}</p>
            <button type="submit" disabled={disabled || !changed} className={buttonClass}>{busy === 'profile' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{busy === 'profile' ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
          </div>
        </form>

        <form onSubmit={changePassword} aria-labelledby="qhdn-security-heading" className="flex min-w-0 flex-col gap-4 border-t border-slate-100 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div>
            <h3 id="qhdn-security-heading" className="flex items-center gap-2 text-base font-bold text-slate-900"><ShieldCheck size={18} className="text-orange-600" />Bảo mật tài khoản</h3>
            <p className="mt-1 text-sm text-slate-500">Đổi mật khẩu đăng nhập của bạn.</p>
          </div>
          {passwordFields.map(({ key, label }) => <label key={key} className="text-xs font-semibold text-slate-600">{label}
            <div className="relative mt-1.5">
              <input name={key} type={visiblePasswords[key] ? 'text' : 'password'} required minLength={key === 'currentPassword' ? undefined : 12} autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} disabled={disabled} value={passwords[key]} onChange={event => setPasswords(current => ({ ...current, [key]: event.target.value }))} className={inputClass+' pr-11'} />
              <button type="button" aria-label={(visiblePasswords[key] ? 'Ẩn ' : 'Hiện ')+label.toLocaleLowerCase('vi')} aria-pressed={!!visiblePasswords[key]} disabled={disabled} onClick={() => setVisiblePasswords(current => ({ ...current, [key]: !current[key] }))} className="absolute inset-y-0 right-0 rounded-r-xl px-3 text-slate-400 hover:text-slate-700 focus-visible:outline-orange-500 disabled:opacity-50">{visiblePasswords[key] ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>)}
          <p className="text-xs leading-relaxed text-slate-500">Mật khẩu mới cần ít nhất 12 ký tự. Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</p>
          {passwordError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{passwordError}</p>}
          <div className="mt-auto flex justify-end pt-1">
            <button type="submit" disabled={disabled} className={buttonClass}>{busy === 'password' ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}{busy === 'password' ? 'Đang đổi…' : 'Đổi mật khẩu'}</button>
          </div>
        </form>
      </div>
    </section>
  </div>;
}
