import type { ReactNode } from 'react';
import { LoginBackground } from './LoginBackground';

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return <main className="relative flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
    <LoginBackground />
    <div className="glass-card relative z-10 my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white/35 shadow-2xl backdrop-blur-2xl sm:rounded-[36px] lg:flex-row">
      {children}
    </div>
  </main>;
}
