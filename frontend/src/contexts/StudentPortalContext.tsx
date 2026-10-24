import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import {
  allStudentPages,
  getOwnStudent,
  getStudentNotifications,
} from '@/services/student';
import type {
  Named,
  Profile,
  Registration,
  Window,
} from '@/types/student/portal';

interface PortalContext {
  profile: Profile | null;
  loading: boolean;
  error: string;
  warnings: string[];
  semesters: Named[];
  semesterId: number | null;
  selectSemester: (id: number) => void;
  comboWindows: Window[];
  refresh: () => void;
  revision: number;
  unreadCount: number | null;
  setUnreadCount: (
    value: number | null | ((previous: number | null) => number | null),
  ) => void;
}
const Context = createContext<PortalContext | null>(null);
export function StudentPortalProvider({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const [comboWindows, setComboWindows] = useState<Window[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setWarnings([]);
    setProfile(null);
    setWindows([]);
    setComboWindows([]);
    setRegistrations([]);
    setUnreadCount(null);
    getOwnStudent(controller.signal, user ?? undefined)
      .then(async (own) => {
        if (controller.signal.aborted) return;
        setProfile(own);
        const results = await Promise.allSettled([
          allStudentPages<Window>(
            '/student/ojt-registration-windows',
            controller.signal,
          ),
          allStudentPages<Window>(
            '/combo-registration-windows',
            controller.signal,
          ),
          allStudentPages<Registration>(
            '/ojt-registrations',
            controller.signal,
          ),
          getStudentNotifications(1, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (results[0].status === 'fulfilled') setWindows(results[0].value);
        if (results[1].status === 'fulfilled')
          setComboWindows(results[1].value);
        if (results[2].status === 'fulfilled')
          setRegistrations(results[2].value);
        if (results[3].status === 'fulfilled')
          setUnreadCount(results[3].value.unreadCount);
        setWarnings(
          results.flatMap((result, index) =>
            result.status === 'rejected'
              ? [
                  ['Đợt OJT', 'Đợt combo', 'Hồ sơ OJT', 'Thông báo'][index] +
                    ': ' +
                    (result.reason instanceof Error
                      ? result.reason.message
                      : 'Không tải được dữ liệu.'),
                ]
              : [],
          ),
        );
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : 'Không tải được hồ sơ sinh viên.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.id, user?.email, logout, revision]);

  const semesters = useMemo(() => {
    const values = new Map<number, Named>();
    if (profile?.ojtSemesterId)
      values.set(profile.ojtSemesterId, {
        id: profile.ojtSemesterId,
        name: `Đợt OJT #${profile.ojtSemesterId}`,
      });
    for (const row of [
      ...registrations,
      ...(profile?.ojtRegistrations.items ?? []),
      ...comboWindows,
      ...windows,
    ]) {
      if (!row.ojtSemesterId) continue;
      const name = row.semester?.name || row.semester?.code;
      if (name || !values.has(row.ojtSemesterId))
        values.set(row.ojtSemesterId, {
          id: row.ojtSemesterId,
          name: name || `Đợt OJT #${row.ojtSemesterId}`,
        });
    }
    return [...values.values()];
  }, [profile, registrations, windows, comboWindows]);
  useEffect(() => {
    if (loading) return;
    setSemesterId((previous) =>
      semesters.some((item) => item.id === previous)
        ? previous
        : (profile?.ojtSemesterId ?? semesters[0]?.id ?? null),
    );
  }, [loading, semesters, profile]);

  return (
    <Context.Provider
      value={{
        profile,
        loading,
        error,
        warnings,
        semesters,
        semesterId,
        selectSemester: setSemesterId,
        comboWindows,
        refresh,
        revision,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStudentPortal() {
  const value = useContext(Context);
  if (!value) throw new Error('StudentPortalProvider is required.');
  return value;
}
export const useOptionalStudentPortal = () => useContext(Context);
