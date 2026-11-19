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
import { ApiError } from '@/services/studentService';
import { studentSnapshots } from '@/utils/student/studentSnapshots';
import {
  allStudentPages,
  getOwnStudentIdentity,
} from '@/services/studentService';
import type {
  Named,
  StudentIdentityProfile,
  Registration,
  Window,
} from '@/types/student/portal';

interface PortalContext {
  profile: StudentIdentityProfile | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  warnings: string[];
  registrationWindows: Window[];
  windowsLoading: boolean;
  semesters: Named[];
  semesterId: number | null;
  selectSemester: (id: number) => void;
  refresh: () => void;
  revision: number;
  mustChangePassword: boolean;
  unreadCount: number | null;
  setUnreadCount: (
    value: number | null | ((previous: number | null) => number | null),
  ) => void;
}
const Context = createContext<PortalContext | null>(null);
export function StudentPortalProvider({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [ownedProfile, setOwnedProfile] = useState<{ token: string | null; profile: StudentIdentityProfile } | null>(null);
  // Hide the previous account immediately, before the new session's effects run.
  const profile = ownedProfile && ownedProfile.token === token && String(ownedProfile.profile.userId) === user?.id
    ? ownedProfile.profile : null;
  const [windows, setWindows] = useState<Window[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  // Leaving the Student portal (including logout) releases all displayed snapshots.
  useEffect(() => () => studentSnapshots.invalidate(), []);

  useEffect(() => {
    const controller = new AbortController();
    const ticket = studentSnapshots.scope(token);
    setLoading(true);
    setRefreshing(false);
    setError('');
    setWarnings([]);
    setOwnedProfile(null);
    setWindows([]);
    setWindowsLoading(true);
    setRegistrations([]);
    setUnreadCount(null);
    setMustChangePassword(false);
    Promise.resolve()
      .then(() => {
        controller.signal.throwIfAborted();
        return getOwnStudentIdentity(controller.signal, user ?? undefined, cached => {
          if (controller.signal.aborted) return;
          setOwnedProfile({ token, profile: cached });
          setLoading(false);
          setRefreshing(true);
          const catalog = studentSnapshots.read<Window[]>(ticket, 'portal-windows:' + cached.id);
          if (catalog) setWindows(catalog.data);
        });
      })
      .then(async (own) => {
        if (controller.signal.aborted) return;
        setOwnedProfile({ token, profile: own });
        setRefreshing(false);
        // Profile and semester open the page. The scoped catalog updates separately;
        // notification contents/counts load only in the screens that display them.
        setLoading(false);
        const results = await Promise.allSettled([
          allStudentPages<Window>(
            '/ojt-registration-windows?view=catalog',
            controller.signal,
          ).then(items => {
            if (!controller.signal.aborted) {
              studentSnapshots.write(ticket, 'portal-windows:' + own.id, items);
              setWindows(items);
            }
            return items;
          }).finally(() => {
            if (!controller.signal.aborted) setWindowsLoading(false);
          }),
          (own.ojtRegistrations.total <= own.ojtRegistrations.items.length
            ? Promise.resolve(own.ojtRegistrations.items)
            : allStudentPages<Registration>('/ojt-registrations', controller.signal)
          ).then(items => {
            if (!controller.signal.aborted) setRegistrations(items);
            return items;
          }),
        ]);
        if (controller.signal.aborted) return;
        setWarnings(
          results.flatMap((result, index) =>
            result.status === 'rejected'
              ? [
                  ['Đợt OJT', 'Hồ sơ OJT'][index] +
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
        if (!controller.signal.aborted && err instanceof ApiError && err.code === 'PASSWORD_CHANGE_REQUIRED') {
          setMustChangePassword(true);
          return;
        }
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
        if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
      });
    return () => controller.abort();
  }, [token, user?.id, user?.email, logout, revision]);

  const semesters = useMemo(() => {
    if (!profile) return [];
    const values = new Map<number, Named>();
    if (profile?.ojtSemesterId)
      values.set(profile.ojtSemesterId, {
        id: profile.ojtSemesterId,
        name: `Đợt OJT #${profile.ojtSemesterId}`,
      });
    for (const row of [
      ...registrations,
      ...(profile?.ojtRegistrations.items ?? []),
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
  }, [profile, registrations, windows]);
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
        refreshing,
        error,
        warnings,
        registrationWindows: profile ? windows : [],
        windowsLoading,
        semesters,
        semesterId,
        selectSemester: setSemesterId,
        refresh,
        revision,
        mustChangePassword,
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
