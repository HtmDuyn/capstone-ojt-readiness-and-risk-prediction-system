import { useEffect, useRef, useState } from 'react';

export function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [reached, setReached] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || reached) return;
    if (typeof IntersectionObserver === 'undefined') {
      setReached(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setReached(true);
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reached]);

  return { ref, reached };
}
