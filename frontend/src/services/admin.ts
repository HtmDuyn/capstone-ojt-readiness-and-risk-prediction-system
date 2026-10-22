import { apiRequest } from './api';
export const ROLE_NAMES: Record<string, string> = { ADMIN: 'Quản trị viên', ACADEMIC: 'Phòng Đào tạo', OJT_COORD: 'Phòng Quan hệ Doanh nghiệp', STUDENT: 'Sinh viên', ENTERPRISE: 'Doanh nghiệp' };
export interface Account { id: number; username: string; full_name: string; email: string; phone: string | null; role_id: number; role_code: string; status: string; created_at?: string; last_login_at?: string; studentId?: number | null; enterpriseId?: number | null }
export interface Summary { accounts: number; activeAccounts: number; students: number; companies: number; ojtSemesters: number }
export interface AuditLog { id: number; userId: number | null; entityType: string; entityId: number | null; action: string; createdAt: string; ipAddress: string | null; detail: unknown; rawLog: unknown; user: { fullName: string; username: string; email: string; roleCode: string } | null }
export interface AuditFilters { page?: number; limit?: number; logId?: number; userId?: number; entityType?: string; entityId?: number; action?: string }
export const getAccounts = () => apiRequest<{ data: Account[]; total: number }>('/accounts');
export const getSummary = () => apiRequest<{ data: { summary: Summary } }>('/admin/dashboard', { method: 'POST', body: JSON.stringify({ section: 'summary' }) });
export const getAuditLogs = (filters: AuditFilters = {}) => apiRequest<{ data: { total: number; items: AuditLog[]; page: number; limit: number } }>('/admin/audit-logs/list', { method: 'POST', body: JSON.stringify(filters) });
export const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export interface CreateAccountInput { username: string; fullName: string; email: string; password: string; phone?: string | null; roleId: number }
export interface UpdateAccountInput { userId: number; fullName?: string; phone?: string | null; email?: string; status?: 'ACTIVE' | 'LOCKED' | 'INACTIVE'; roleId?: number }
export const createAccount = (input: CreateAccountInput) => apiRequest('/accounts', { method: 'POST', body: JSON.stringify(input) });
export const updateAccount = (input: UpdateAccountInput) => apiRequest('/accounts/update', { method: 'PATCH', body: JSON.stringify(input) });
export const resetAccountPassword = (userId: number) => apiRequest('/auth/users/password-reset', { method: 'POST', body: JSON.stringify({userId}) });
export const resendAccountEmail = (email: string) => apiRequest('/imports/emails/resend', { method: 'POST', body: JSON.stringify({email}) });
