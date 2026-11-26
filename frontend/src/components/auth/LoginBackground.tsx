export function LoginBackground() {
  return <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
    <img
      src="/login_bg.webp"
      alt=""
      fetchPriority="high"
      decoding="async"
      className="w-full h-full object-cover object-center scale-105"
    />
    <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[4px]" />
    <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-orange-500/15 blur-[140px]" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-amber-500/15 blur-[140px]" />
  </div>;
}
