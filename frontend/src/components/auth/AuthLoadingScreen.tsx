import { LoginBackground } from './LoginBackground';

export function AuthLoadingScreen() {
  return <div role="status" className="relative flex min-h-dvh items-center justify-center bg-slate-950">
    <LoginBackground />
    <div className="relative z-10 flex flex-col items-center gap-4 rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl backdrop-blur-2xl">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      <p className="text-sm font-medium text-slate-700">Đang xác thực tài khoản…</p>
    </div>
  </div>;
}
