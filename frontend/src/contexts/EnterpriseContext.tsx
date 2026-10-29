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
    void loadProfile();
  }, [loadProfile]);

  const value: EnterpriseContextValue = {
    profile,
    companyId: profile?.id ?? null,  // companyId lấy từ profile.id
    loading,
    error,
    reload: loadProfile,
  };

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
