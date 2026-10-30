import { useEffect, useRef, useState } from 'react';

// A key identifies both the authenticated scope and the selected filters. Old responses
// are hidden immediately and ignored after navigation, refresh, or semester changes.
export function useStudentResource<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
) {
  const loader = useRef(load);
  loader.current = load;
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    key: string | null;
    data: T | null;
    loading: boolean;
    error: string;
  }>({ key: null, data: null, loading: false, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    if (key === null) {
      setState({ key, data: null, loading: false, error: '' });
      return;
    }
    setState({ key, data: null, loading: true, error: '' });
    // StrictMode replays setup/cleanup in development. Skip a read whose
    // effect was already disposed before dispatching the network request.
    Promise.resolve()
      .then(() => {
        controller.signal.throwIfAborted();
        return loader.current(controller.signal);
      })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ key, data, loading: false, error: '' });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setState({
            key,
            data: null,
            loading: false,
            error:
              err instanceof Error ? err.message : 'Không tải được dữ liệu.',
          });
      });
    return () => controller.abort();
  }, [key, retry]);
  return {
    ...(state.key === key
      ? state
      : { data: null, loading: key !== null, error: '' }),
    reload: () => setRetry((v) => v + 1),
  };
}
