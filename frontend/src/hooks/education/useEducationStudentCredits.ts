import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/shared/useAuth';
import { loadStudentAcademicCreditsBatch } from '@/services/educationService';

type Credits = Record<number, number | null>;
const emptyCredits: Credits = {};

export function useEducationStudentCredits(studentIds: number[]) {
  const { token } = useAuth();
  const key = useMemo(() => [...new Set(studentIds)].sort((a, b) => a - b).join(','), [studentIds]);
  const cache = useRef<{ token: string | null; credits: Credits }>({ token, credits: {} });
  const [state, setState] = useState<{ token: string | null; credits: Credits; failures: number[]; loading: boolean }>(
    { token, credits: {}, failures: [], loading: false },
  );
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    if (cache.current.token !== token) cache.current = { token, credits: {} };
    const scope = cache.current;
    const missing = key ? key.split(',').map(Number).filter(id => !(id in scope.credits)) : [];
    const failures: number[] = [];
    setState({ token, credits: scope.credits, failures, loading: missing.length > 0 });

    async function load() {
      for (let start = 0; start < missing.length && !controller.signal.aborted; start += 100) {
        const batch = missing.slice(start, start + 100);
        try {
          const loaded = await loadStudentAcademicCreditsBatch(batch, controller.signal);
          if (controller.signal.aborted) return;
          const credits = { ...scope.credits };
          for (const id of batch) {
            if (loaded.has(id)) credits[id] = loaded.get(id) ?? null;
            else failures.push(id);
          }
          scope.credits = credits;
          setState({ token, credits, failures: [...failures], loading: start + batch.length < missing.length });
        } catch {
          if (controller.signal.aborted) return;
          failures.push(...batch);
          setState({ token, credits: scope.credits, failures: [...failures], loading: start + batch.length < missing.length });
        }
      }
    }

    queueMicrotask(() => { void load(); });
    return () => controller.abort();
  }, [key, retry, token]);

  const current = state.token === token ? state : { credits: emptyCredits, failures: [], loading: Boolean(key) };
  return { ...current, retry: () => setRetry(value => value + 1) };
}
