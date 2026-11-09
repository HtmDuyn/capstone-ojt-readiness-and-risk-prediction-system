import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import { enterpriseService } from '@/services/enterpriseService';
import type { EnterpriseProfileData } from '@/types/enterprise/enterpriseTypes';
import { apiRequest } from '@/services/studentService';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseFirstPassword } from '@/components/enterprise/EnterpriseFirstPassword';

// ─── Enterprise Context ────────────────────────────────────────────────────────
// Lưu thông tin doanh nghiệp (bao gồm companyId) sau khi đăng nhập.
// Tất cả các component enterprise dùng context này thay vì gọi API profile riêng lẻ.

interface EnterpriseContextValue {
  profile: EnterpriseProfileData | null;
  companyId: number | null;       // ID doanh nghiệp - bắt buộc truyền vào mọi API enterprise
  loading: boolean;
  error: string | null;
  reload: () => void;             // Cho phép load lại profile khi cần
}

export const EnterpriseContext = createContext<EnterpriseContextValue | undefined>(undefined);

interface EnterpriseProviderProps {
  children: ReactNode;
}

export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const {token,user}=useAuth();
  const [access,setAccess]=useState<'checking'|'password'|'ready'|'error'>('checking');
  const [accessError,setAccessError]=useState('');
  const [accessRetry,setAccessRetry]=useState(0);
  const [profile, setProfile] = useState<EnterpriseProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await enterpriseService.getProfile();
      if (res?.success && res.data) {
        setProfile(res.data);
      } else {
        setError('Không thể tải hồ sơ doanh nghiệp.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối khi tải hồ sơ doanh nghiệp.';
      setError(message);
      console.error('[EnterpriseContext] Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active=true;
    setAccess('checking');setProfile(null);setError(null);
    apiRequest<{user:{mustChangePassword?:boolean}}>('/auth/me').then(result=>{
      if(!active)return;
      if(result.user.mustChangePassword){setAccess('password');setLoading(false);return;}
      setAccess('ready');void loadProfile();
    }).catch(e=>{if(active){setAccessError(e instanceof Error?e.message:'Không thể kiểm tra tài khoản.');setAccess('error');}});
    return ()=>{active=false;};
  }, [loadProfile,token,user?.id,accessRetry]);

  const value: EnterpriseContextValue = {
    profile,
    companyId: profile?.id ?? null,  // companyId lấy từ profile.id
    loading,
    error,
    reload: loadProfile,
  };

  if(access==='checking')return <div role="status" className="p-8 text-sm text-slate-600">Đang kiểm tra tài khoản doanh nghiệp…</div>;
  if(access==='password')return <EnterpriseFirstPassword/>;
  if(access==='error')return <div role="alert" className="space-y-3 p-8 text-sm text-slate-600"><p>{accessError}</p><button type="button" onClick={()=>setAccessRetry(v=>v+1)} className="rounded-xl bg-orange-500 px-4 py-2 text-white">Thử lại</button></div>;
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
