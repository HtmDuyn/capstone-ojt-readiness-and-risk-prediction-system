import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { studentSnapshots } from '@/services/studentSnapshots';

// A key identifies both the authenticated scope and the selected filters. Old responses
// are hidden immediately and ignored after navigation, refresh, or semester changes.
export function useStudentResource<T>(
  key: string | null,
  load: (signal: AbortSignal, publish: (data: NoInfer<T>) => void) => Promise<T>,
  { snapshot = false }: { snapshot?: boolean } = {},
) {
  const { token } = useAuth();
  const ticket = studentSnapshots.scope(token);
  const cached = snapshot && key ? studentSnapshots.read<T>(ticket, key) : undefined;
  const loader = useRef(load);
  loader.current = load;
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    key: string | null;
    token: string | null;
    data: T | null;
    loading: boolean;
    error: string;
  }>({ key: null, token: null, data: null, loading: false, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    if (key === null) {
      setState({ key, token, data: null, loading: false, error: '' });
      return;
    }
    const requestTicket = studentSnapshots.scope(token);
    const previous = snapshot ? studentSnapshots.read<T>(requestTicket, key) : undefined;
    setState({ key, token, data: previous ? previous.data : null, loading: true, error: '' });
    // StrictMode replays setup/cleanup in development. Skip a read whose
    // effect was already disposed before dispatching the network request.
    Promise.resolve()
      .then(() => {
        controller.signal.throwIfAborted();
        return loader.current(controller.signal, data => {
          if (!controller.signal.aborted) setState({ key, token, data, loading: true, error: '' });
        });
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          if (snapshot) studentSnapshots.write(requestTicket, key, data);
          setState({ key, token, data, loading: false, error: '' });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setState(current => ({
            key,
            token,
            data: current.key === key && current.token === token ? current.data : null,
            loading: false,
            error:
              err instanceof Error ? err.message : 'Không tải được dữ liệu.',
          }));
      });
    return () => controller.abort();
  }, [key, token, retry, snapshot]);
  const current = state.key === key && state.token === token
    ? state
    : { data: cached ? cached.data : null, loading: key !== null, error: '' };
  return {
    ...current,
    // Cached and progressively loaded rows remain usable during the next read.
    loading: current.loading && current.data === null,
    refreshing: current.loading && current.data !== null,
    pending: current.loading,
    reload: () => setRetry((v) => v + 1),
  };
}
