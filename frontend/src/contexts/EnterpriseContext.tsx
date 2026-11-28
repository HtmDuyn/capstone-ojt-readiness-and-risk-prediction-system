import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { enterpriseService } from '@/services/enterpriseService';
import type { EnterpriseProfileData } from '@/types/enterprise/enterpriseTypes';
import { isAxiosError } from 'axios';
import { useAuth } from '@/hooks/shared/useAuth';
import { EnterpriseFirstPassword } from '@/components/enterprise/EnterpriseFirstPassword';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { useEnterpriseCacheRefresh } from '@/hooks/enterprise/useEnterpriseCacheRefresh';

// ─── Enterprise Context ────────────────────────────────────────────────────────
// Lưu thông tin doanh nghiệp (bao gồm companyId) sau khi đăng nhập.
// Tất cả các component enterprise dùng context này thay vì gọi API profile riêng lẻ.

interface EnterpriseContextValue {
  profile: EnterpriseProfileData | null;
  companyId: number | null;       // ID doanh nghiệp - bắt buộc truyền vào mọi API enterprise
  loading: boolean;
  error: string | null;
  reload: () => void;             // Cho phép load lại profile khi cần
  updateProfile: (profile: Partial<EnterpriseProfileData> & { id: number }) => void;
}

export const EnterpriseContext = createContext<EnterpriseContextValue | undefined>(undefined);

interface EnterpriseProviderProps {
  children: ReactNode;
}

export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const {token,user}=useAuth();
  const [access,setAccess]=useState<'checking'|'password'|'ready'|'error'>('checking');
  const [profile, setProfile] = useState<EnterpriseProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileRequest = useRef<AbortController | null>(null);

  const loadProfile = useCallback(async (initial = false) => {
    if (profileRequest.current) return;
    const controller = new AbortController();
    profileRequest.current = controller;
    if (initial) setAccess('checking');
    setLoading(true);
    setError(null);
    try {
      const res = await enterpriseService.getProfile(controller.signal);
      if (controller.signal.aborted) return;
      if (res?.success && res.data) {
        setProfile(res.data);
        setAccess('ready');
      } else {
        setError('Không thể tải hồ sơ doanh nghiệp.');
        if (initial) setAccess('error');
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      // The profile endpoint already enforces the temporary-password gate.
      if (isAxiosError<{ errorCode?: string }>(err) && err.response?.data?.errorCode === 'PASSWORD_CHANGE_REQUIRED') {
        setProfile(null);
        setAccess('password');
        return;
      }
      const message = friendlyErrorMessage(err, 'Không tải được hồ sơ doanh nghiệp. Vui lòng thử lại.');
      setError(message);
      if (initial) setAccess('error');
      console.error('[EnterpriseContext] Failed to load profile:', err);
    } finally {
      if (profileRequest.current === controller) {
        profileRequest.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAccess('checking');setProfile(null);setError(null);
    queueMicrotask(() => { if (!controller.signal.aborted) void loadProfile(true); });
    return () => {
      controller.abort();
      profileRequest.current?.abort();
      profileRequest.current = null;
    };
  }, [loadProfile, token, user?.id]);

  const updateProfile = useCallback((updated: Partial<EnterpriseProfileData> & { id: number }) => {
    if (localStorage.getItem('ojt_auth_token') !== token) return;
    profileRequest.current?.abort();
    profileRequest.current = null;
    setProfile(current => current?.id === updated.id ? { ...current, ...updated } : current);
    setLoading(false);
    setError(null);
  }, [token]);
  const reload = useCallback(() => { void loadProfile(); }, [loadProfile]);
  useEnterpriseCacheRefresh(['/enterprise/profile:'],reload,300);
  const value = useMemo<EnterpriseContextValue>(() => ({
    profile,
    companyId: profile?.id ?? null,  // companyId lấy từ profile.id
    loading,
    error,
    reload,
    updateProfile,
  }), [profile, loading, error, reload, updateProfile]);

  if(access==='checking')return <div role="status" className="p-8 text-sm text-slate-600">Đang kiểm tra tài khoản doanh nghiệp…</div>;
  if(access==='password')return <EnterpriseFirstPassword/>;
  if(access==='error')return <div role="alert" className="space-y-3 p-8 text-sm text-slate-600"><p>{error}</p><button type="button" onClick={()=>void loadProfile(true)} className="rounded-xl bg-orange-500 px-4 py-2 text-white">Thử lại</button></div>;
  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
}

/**
 * Hook tiện ích để lấy context enterprise.
 * Phải được dùng bên trong <EnterpriseProvider>.
 */
export function useEnterprise(): EnterpriseContextValue {
  const ctx = useContext(EnterpriseContext);
  if (!ctx) throw new Error('useEnterprise phải được dùng bên trong <EnterpriseProvider>');
  return ctx;
}
