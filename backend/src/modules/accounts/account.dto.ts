import type { AccountRecord } from './account.types';
export const personalAccountView=(account:AccountRecord)=>({
 id:account.id,username:account.username,email:account.email,phone:account.phone,
 fullName:account.full_name,status:account.status,roleId:account.role_id,roleCode:account.role_code,roleName:account.role_name,
 studentId:account.studentId,enterpriseId:account.enterpriseId,mustChangePassword:account.mustChangePassword,
 createdAt:account.created_at,updatedAt:account.updated_at,lastLoginAt:account.last_login_at,
});
