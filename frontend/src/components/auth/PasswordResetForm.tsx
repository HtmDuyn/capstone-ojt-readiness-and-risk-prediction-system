import { useEffect, useState, type FormEvent } from "react";
import { authService } from "@/services/authService";
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

interface Props {
  initialEmail: string;
  initialToken?: string;
  onBack: () => void;
  onComplete: (email: string, message: string) => void;
}

const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const labelClass = "mb-1 block text-xs font-bold text-gray-700";

export default function PasswordResetForm({ initialEmail, initialToken = "", onBack, onComplete }: Props) {
  const fromLink = Boolean(initialToken);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState(fromLink ? "Nhập mật khẩu mới để hoàn tất yêu cầu." : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!notice || canResend) return;
    const timer = window.setTimeout(() => setCanResend(true), 60_000);
    return () => window.clearTimeout(timer);
  }, [notice, canResend]);

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const { message } = await authService.sendPasswordResetCode(email.trim());
      setCode("");
      setNotice(message);
      setCanResend(false);
    } catch (failure) {
      setError(friendlyErrorMessage(failure, "Không thể gửi mã. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notice) {
      await sendCode();
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Mật khẩu mới được dài tối đa 72 byte UTF-8.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { message } = await authService.resetPassword(email.trim(), code, password);
      onComplete(email.trim(), message);
    } catch (failure) {
      setError(friendlyErrorMessage(failure, "Không thể đặt lại mật khẩu. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="mb-5 text-center text-2xl font-extrabold text-gray-900">
        {notice ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
      </h2>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy} className="space-y-3">
          <div>
            <label htmlFor="reset-email" className={labelClass}>Email tài khoản</label>
            <input id="reset-email" type="email" autoComplete="email" required maxLength={100}
              className={inputClass} value={email} readOnly={Boolean(notice)}
              onChange={(event) => setEmail(event.target.value)} />
          </div>
          {notice && (
            <>
              <p role="status" className="text-sm text-gray-700">{notice} {fromLink ? 'Liên kết có hiệu lực trong 10 phút.' : 'Mã có hiệu lực trong 10 phút.'}</p>
              {!fromLink && <div>
                <label htmlFor="reset-code" className={labelClass}>Mã xác nhận gồm 6 chữ số</label>
                <input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                  pattern="[0-9]{6}" maxLength={6} required className={inputClass} value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))} />
              </div>}
              <div>
                <label htmlFor="reset-password" className={labelClass}>Mật khẩu mới</label>
                <input id="reset-password" type="password" autoComplete="new-password" minLength={12}
                  maxLength={72} required className={inputClass} value={password}
                  onChange={(event) => setPassword(event.target.value)} />
                <p className="mt-1 text-xs text-gray-600">Ít nhất 12 ký tự.</p>
              </div>
              <div>
                <label htmlFor="reset-confirmation" className={labelClass}>Nhập lại mật khẩu mới</label>
                <input id="reset-confirmation" type="password" autoComplete="new-password" maxLength={72}
                  required className={inputClass} value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)} />
              </div>
            </>
          )}
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="btn-login w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-70">
            {busy ? "Đang xử lý…" : notice ? "Đặt lại mật khẩu" : "Gửi mã xác nhận"}
          </button>
          <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold text-orange-700">
            <button type="button" className="hover:underline" onClick={onBack}>Quay lại đăng nhập</button>
            {notice && !fromLink && (
              <button type="button" disabled={!canResend} className="enabled:hover:underline disabled:text-gray-500" onClick={sendCode}>
                {canResend ? "Gửi lại mã" : "Có thể gửi lại sau 60 giây"}
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </>
  );
}
