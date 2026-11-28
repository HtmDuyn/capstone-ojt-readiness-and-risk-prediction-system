import { apiRequest } from './apiService';
import { adminRead, invalidateAdminCache } from '@/utils/admin/adminReadCache';
import type { EmailDeliveryResult } from '@/utils/shared/emailDelivery';
export const ROLE_NAMES: Record<string, string> = { ADMIN: 'Quản trị viên', ACADEMIC: 'Phòng Đào tạo', OJT_COORD: 'Phòng Quan hệ Doanh nghiệp', STUDENT: 'Sinh viên', ENTERPRISE: 'Doanh nghiệp' };
export interface Account { id: number; username: string; full_name: string; email: string; phone: string | null; role_id: number; role_code: string; status: string; created_at?: string; last_login_at?: string; studentId?: number | null; enterpriseId?: number | null }
export interface AccountRole { id: number; code: 'STUDENT' | 'ACADEMIC' | 'OJT_COORD' | 'ENTERPRISE' | 'ADMIN'; name: string }
const SUMMARY_CACHE_KEY='dashboard:summary';
export const getAccountRoles = () => adminRead('account-roles',()=>apiRequest<{ data: AccountRole[] }>('/accounts/roles'),24*60*60_000);
export interface AccountCount { roleCode: string | null; status: string | null; count: number }
export interface Summary { accounts: number; activeAccounts: number; students: number; companies: number; ojtSemesters: number; newAccounts30: number; accountBreakdown?: AccountCount[] }
export interface AuditLog { id: number; userId: number | null; entityType: string; entityId: number | null; action: string; createdAt: string; ipAddress: string | null; detail: unknown; rawLog: unknown; user: { fullName: string; username: string; email: string; roleCode: string } | null }
export interface AuditFilters { page?: number; limit?: number; logId?: number; userId?: number; entityType?: string; entityId?: number; action?: string; scope?: 'ACCOUNT' }
export const getAccounts = () => apiRequest<{ data: Account[]; total: number }>('/accounts');
export const getSummary = () => adminRead(SUMMARY_CACHE_KEY,()=>apiRequest<{ data: { summary: Summary } }>('/admin/dashboard', { method: 'POST', body: JSON.stringify({ section: 'summary' }) }),30_000);
export const ADMIN_SUMMARY_CACHE_KEY=SUMMARY_CACHE_KEY;
export const getAuditLogs = (filters: AuditFilters = {}) => apiRequest<{ data: { total: number; items: AuditLog[]; page: number; limit: number; actions?: string[] } }>('/admin/audit-logs/list', { method: 'POST', body: JSON.stringify(filters) });
export const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export interface CreateAccountInput { fullName: string; email: string; phone?: string | null; roleId: number }
export interface UpdateAccountInput { userId: number; fullName?: string; phone?: string | null; email?: string; status?: 'ACTIVE' | 'LOCKED' | 'INACTIVE'; roleId?: number }
export const createAccount = async (input: CreateAccountInput) => {const result=await apiRequest<{ account: Account; emailDelivery?: EmailDeliveryResult }>('/accounts', { method: 'POST', body: JSON.stringify(input) });invalidateAdminCache(SUMMARY_CACHE_KEY);return result;};
export const updateAccount = async (input: UpdateAccountInput) => {const result=await apiRequest('/accounts/update', { method: 'PATCH', body: JSON.stringify(input) });invalidateAdminCache(SUMMARY_CACHE_KEY);return result;};
export const resetAccountPassword = (userId: number) => apiRequest<{ data: { status: 'QUEUED' | 'SENT' } }>('/auth/users/password-reset', { method: 'POST', body: JSON.stringify({userId}) });
export const resendAccountEmail = (email: string) => apiRequest('/imports/emails/resend', { method: 'POST', body: JSON.stringify({email}) });
