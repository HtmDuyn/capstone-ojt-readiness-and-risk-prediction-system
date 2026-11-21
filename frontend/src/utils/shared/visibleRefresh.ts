// Focus and visibilitychange often fire together after switching tabs.
export function subscribeVisibleRefresh(
  refresh: () => void,
  { interval, canRefresh = () => true }: { interval?: number; canRefresh?: () => boolean } = {},
): () => void {
  const minGap = 8_000;
  let lastRefresh = performance.now();
  const refreshIfVisible = () => {
    const now = performance.now();
    if (document.hidden || now - lastRefresh < minGap || !canRefresh()) return;
    lastRefresh = now;
    refresh();
  };
  window.addEventListener('focus', refreshIfVisible);
  document.addEventListener('visibilitychange', refreshIfVisible);
  const timer = interval === undefined ? undefined : window.setInterval(refreshIfVisible, interval);
  return () => {
    window.removeEventListener('focus', refreshIfVisible);
    document.removeEventListener('visibilitychange', refreshIfVisible);
    if (timer !== undefined) window.clearInterval(timer);
  };
}
