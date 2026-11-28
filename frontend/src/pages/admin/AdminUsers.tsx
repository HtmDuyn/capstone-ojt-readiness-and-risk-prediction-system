import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Search,
  UserPlus,
  X,
  Eye,
  Pencil,
  KeyRound,
  UserRoundX,
  UserRoundCheck,
} from 'lucide-react';

import { useAuth } from '@/hooks/shared/useAuth';
import { createAccount, getAccounts, getAccountRoles, updateAccount, resetAccountPassword, formatDate, type Account, type AccountRole } from '@/services/adminService';
import { PageBanner } from '@/components/common/PageBanner';
import { emailDeliveryMessage } from '@/utils/shared/emailDelivery';

/* =========================================================
   TYPES
   ========================================================= */

type UserRole =
  | 'Sinh viên'
  | 'Phòng Đào tạo'
  | 'Phòng Quan hệ Doanh nghiệp'
  | 'Doanh nghiệp'
  | 'Quản trị viên';

type UserStatus = 'Hoạt động' | 'Khóa' | 'Ngừng hoạt động';

interface UserAccount {
  raw: Account;
  phone: string;
  roleId: number;
  id: number;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

interface UserForm {
  phone?: string;
  name: string;
  email: string;
  role: UserRole | '';
  status: UserStatus;
}

/* =========================================================
   API DATA
   ========================================================= */

const ROLE_LABELS: Record<string, UserRole> = { STUDENT: 'Sinh viên', ACADEMIC: 'Phòng Đào tạo', OJT_COORD: 'Phòng Quan hệ Doanh nghiệp', ENTERPRISE: 'Doanh nghiệp', ADMIN: 'Quản trị viên' };
const ROLE_ORDER: AccountRole['code'][] = ['STUDENT', 'ACADEMIC', 'OJT_COORD', 'ENTERPRISE', 'ADMIN'];
const mapAccount = (a: Account): UserAccount => ({ raw: a, phone: a.phone ?? '', id: a.id, code: a.username, name: a.full_name, email: a.email, roleId: a.role_id, role: ROLE_LABELS[a.role_code], status: a.status === 'ACTIVE' ? 'Hoạt động' : a.status === 'LOCKED' ? 'Khóa' : 'Ngừng hoạt động' });
const statusCode = (s: Exclude<UserStatus, 'Khóa'>) => s === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE';

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  role: '',
  status: 'Hoạt động',
};

/* =========================================================
   COMPONENT
   ========================================================= */

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  /* =========================
     DATA
     ========================= */

  const [users, setUsers] =
    useState<UserAccount[]>([]);
  const [accountRoles, setAccountRoles] = useState<AccountRole[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [statusTarget, setStatusTarget] = useState<UserAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [statusToast, setStatusToast] = useState<{ message: string; error: boolean } | null>(null);
  useEffect(() => {
    if (!statusToast) return;
    const timer = window.setTimeout(() => setStatusToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [statusToast]);
  const loadUsers = async () => {
    setLoading(true); setError('');
    try { const result = await getAccounts(); setUsers(result.data.filter(account => account.role_code !== 'ADMIN').map(mapAccount)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được tài khoản.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadUsers(); void getAccountRoles().then(result => setAccountRoles(result.data)).catch(() => setAccountRoles([])); }, []);
  const roleIdFor = (role: UserRole | '') => {
    const id = accountRoles.find(item => ROLE_LABELS[item.code] === role)?.id;
    if (!id) throw new Error('Chưa có ID cho vai trò này trong danh sách tài khoản.');
    return id;
  };

  /* =========================
     FILTER
     ========================= */

  const [search, setSearch] =
    useState('');

  const [roleFilter, setRoleFilter] =
    useState<'Tất cả' | UserRole>('Tất cả');
  const [statusFilter, setStatusFilter] =
    useState<'Tất cả trạng thái' | 'Hoạt động' | 'Ngừng hoạt động'>('Tất cả trạng thái');

  /* =========================
     ADD
     ========================= */

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [addForm, setAddForm] =
    useState<UserForm>(EMPTY_FORM);
  const [addError, setAddError] = useState('');

  /* =========================
     VIEW
     ========================= */

  const [viewUser, setViewUser] =
    useState<UserAccount | null>(null);

  /* =========================
     EDIT
     ========================= */

  const [editUser, setEditUser] =
    useState<UserAccount | null>(null);

  const [editForm, setEditForm] =
    useState<UserForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<Partial<Record<'name' | 'email' | 'role', string>>>({});
  const [editError, setEditError] = useState('');

  /* =========================================================
     FILTERED USERS
     ========================================================= */

  const filteredUsers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        user.code
          .toLowerCase()
          .includes(keyword) ||
        user.name
          .toLowerCase()
          .includes(keyword) ||
        user.email
          .toLowerCase()
          .includes(keyword);

      const matchesRole =
        roleFilter === 'Tất cả' ||
        user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'Tất cả trạng thái' ||
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* =========================================================
     ADD ACCOUNT
     ========================================================= */

  const handleOpenAddModal = () => {
    setAddForm({ ...EMPTY_FORM });
    setNotice(''); setAddError(''); setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm(EMPTY_FORM);
  };

  const handleAddUser = async () => {
    if (saving) return;
    if (!addForm.name.trim()) { setAddError('Vui lòng nhập họ tên.'); return; }
    if (!addForm.email.trim()) { setAddError('Vui lòng nhập email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) { setAddError('Vui lòng nhập email hợp lệ.'); return; }
    if (!addForm.role) { setAddError('Vui lòng chọn vai trò.'); return; }
    setAddError(''); setSaving(true);
    try {
      if (['Sinh viên', 'Doanh nghiệp'].includes(addForm.role)) throw new Error('Tài khoản sinh viên và doanh nghiệp phải được tạo qua import.');
      const result = await createAccount({ fullName: addForm.name.trim(), email: addForm.email.trim(), phone: addForm.phone?.trim() || null, roleId: roleIdFor(addForm.role) });
      handleCloseAddModal(); setNotice('Đã tạo tài khoản. ' + emailDeliveryMessage(result.emailDelivery)); await loadUsers();
    } catch (e) { setAddError(e instanceof Error ? e.message : 'Tạo tài khoản thất bại.'); }
    finally { setSaving(false); }
  };

  /* =========================================================
     VIEW ACCOUNT
     ========================================================= */

  const handleViewUser = (
    user: UserAccount,
  ) => {
    setViewUser(user);
  };

  const handleCloseViewUser = () => {
    setViewUser(null);
  };

  /* =========================================================
     EDIT ACCOUNT
     ========================================================= */

  const handleOpenEditUser = (
    user: UserAccount,
  ) => {
    setEditUser(user);
    setEditErrors({}); setEditError('');

    setEditForm({
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  const handleCloseEditUser = () => {
    setEditUser(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({}); setEditError('');
  };

  const handleSaveEditUser = async () => {
    if (!editUser || saving) return;
    const errors: typeof editErrors = {};
    if (!editForm.name.trim()) errors.name = 'Vui lòng nhập họ tên.';
    if (!editForm.email.trim()) errors.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) errors.email = 'Vui lòng nhập email hợp lệ.';
    if (!editForm.role) errors.role = 'Vui lòng chọn vai trò.';
    setEditErrors(errors); setEditError('');
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await updateAccount({ userId: editUser.id, fullName: editForm.name.trim(), phone: editForm.phone?.trim() || null, email: editForm.email.trim(), ...(editForm.status === 'Khóa' ? {} : { status: statusCode(editForm.status) }), roleId: editForm.role === editUser.role ? editUser.roleId : roleIdFor(editForm.role) });
      handleCloseEditUser(); setNotice('Đã cập nhật tài khoản.'); await loadUsers();
    } catch (e) { setEditError(e instanceof Error ? e.message : 'Cập nhật thất bại.'); }
    finally { setSaving(false); }
  };

  /* =========================================================
     ACCOUNT STATUS
     ========================================================= */

  const confirmStatusChange = async () => {
    if (!statusTarget || saving) return;
    const activating = statusTarget.status === 'Ngừng hoạt động';
    setSaving(true);
    try {
      await updateAccount({ userId: statusTarget.id, status: activating ? 'ACTIVE' : 'INACTIVE' });
      setStatusTarget(null);
      setStatusToast({ message: activating ? 'Đã kích hoạt lại tài khoản.' : 'Đã ngừng hoạt động tài khoản.', error: false });
      await loadUsers();
    } catch (e) { setStatusToast({ message: e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại.', error: true }); }
    finally { setSaving(false); }
  };

  const confirmPasswordReset = async () => {
    if (!resetTarget || resetBusy) return;
    setResetBusy(true);
    try {
      const result = await resetAccountPassword(resetTarget.id);
      setStatusToast({ message: result.data?.status === 'SENT'
        ? `Đã gửi email hướng dẫn đặt lại mật khẩu đến ${resetTarget.email}.`
        : 'Đã tiếp nhận yêu cầu đặt lại mật khẩu. Email sẽ được gửi khi hệ thống xử lý.', error: false });
      setResetTarget(null);
    } catch {
      setStatusToast({ message: 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.', error: true });
    } finally { setResetBusy(false); }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <button onClick={() => void loadUsers()} className="underline">Thử lại</button></div>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{notice}</p>}
      {statusToast && <div role={statusToast.error ? 'alert' : 'status'} className={`fixed right-5 top-5 z-[10000] max-w-sm rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-xl ${statusToast.error ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'}`}>{statusToast.message}</div>}
      {loading && <p role="status">Đang tải tài khoản...</p>}
      {saving && <p role="status">Đang lưu...</p>}
      <PageBanner
        title="Quản lý Người dùng & Phân quyền"
        description="Phân quyền 5 nhóm người dùng: Sinh viên, PĐT, QHDN, Doanh nghiệp và Admin."
        badge="5 Vai trò"
      />

      {/* =====================================================
          ACCOUNT LIST
          ===================================================== */}

      <section className="card-glass rounded-2xl p-5 sm:p-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh sách tài khoản
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Quản lý tài khoản và vai trò
              người dùng trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <UserPlus size={18} />

            Thêm tài khoản
          </button>
        </div>

        {/* FILTER */}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Tìm theo mã, họ tên hoặc email..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row lg:justify-end">
          <select
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value as
                  | 'Tất cả'
                  | UserRole,
              )
            }
            className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-auto"
          >
            <option value="Tất cả">
              Tất cả vai trò
            </option>

            <option value="Sinh viên">
              Sinh viên
            </option>

            <option value="Phòng Đào tạo">
              Phòng Đào tạo
            </option>

            <option value="Phòng Quan hệ Doanh nghiệp">
              Phòng Quan hệ Doanh nghiệp
            </option>

            <option value="Doanh nghiệp">
              Doanh nghiệp
            </option>

          </select>
          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-auto"
          >
            <option value="Tất cả trạng thái">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Ngừng hoạt động">Ngừng hoạt động</option>
          </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold">
                  STT
                </th>

                <th className="px-4 py-3 text-xs font-semibold">
                  Họ tên
                </th>

                <th className="px-4 py-3 text-xs font-semibold">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-semibold">
                  Vai trò
                </th>

                <th className="px-4 py-3 text-xs font-semibold">
                  Trạng thái
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                    {index + 1}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-500">
                    {user.email}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : user.status === 'Khóa' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* XEM */}

                      <button
                        type="button"
                        onClick={() =>
                          handleViewUser(user)
                        }
                        title="Xem chi tiết"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-orange-500"
                      >
                        <Eye size={17} />
                      </button>

                      {/* SỬA */}

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEditUser(
                            user,
                          )
                        }
                        title="Chỉnh sửa"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={17} />
                      </button>

                      <button type="button" onClick={() => { setStatusToast(null); setResetTarget(user); }}
                        disabled={user.status !== 'Hoạt động'} title="Đặt lại mật khẩu" aria-label="Đặt lại mật khẩu"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-orange-600 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40">
                        <KeyRound size={17} />
                      </button>

                      {/* TRẠNG THÁI */}

                      {user.status !== 'Khóa' && <button
                        type="button"
                        onClick={() => { setStatusToast(null); setStatusTarget(user); }}
                        disabled={saving || String(user.id) === currentUser?.id}
                        title={user.status === 'Hoạt động' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
                        aria-label={user.status === 'Hoạt động' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${user.status === 'Hoạt động' ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                      >
                        {user.status === 'Hoạt động' ? <UserRoundX size={17} /> : <UserRoundCheck size={17} />}
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length ===
                0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          Hiển thị{' '}
          <span className="font-semibold text-slate-700">
            {filteredUsers.length}
          </span>{' '}
          tài khoản
        </div>
      </section>

      {statusTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4" onClick={() => { if (!saving) setStatusTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="status-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <h2 id="status-dialog-title" className="text-lg font-bold text-slate-900">{statusTarget.status === 'Hoạt động' ? 'Ngừng hoạt động tài khoản' : 'Kích hoạt lại tài khoản'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{statusTarget.status === 'Hoạt động' ? `Bạn có chắc chắn muốn ngừng hoạt động tài khoản ${statusTarget.name} không? Tài khoản này sẽ không thể đăng nhập cho đến khi được kích hoạt lại.` : `Bạn có chắc chắn muốn kích hoạt lại tài khoản ${statusTarget.name} không?`}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setStatusTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
              <button type="button" disabled={saving} onClick={() => void confirmStatusChange()} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${statusTarget.status === 'Hoạt động' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{saving ? 'Đang xử lý...' : statusTarget.status === 'Hoạt động' ? 'Ngừng hoạt động' : 'Kích hoạt'}</button>
            </div>
          </div>
        </div>, document.body,
      )}

      {resetTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4" onClick={() => { if (!resetBusy) setResetTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <h2 id="reset-dialog-title" className="text-lg font-bold text-slate-900">Đặt lại mật khẩu</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{`Bạn có chắc chắn muốn gửi yêu cầu đặt lại mật khẩu cho tài khoản ${resetTarget.name} không?\n\nHệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu đến ${resetTarget.email}.`}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={resetBusy} onClick={() => setResetTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
              <button type="button" disabled={resetBusy} onClick={() => void confirmPasswordReset()} className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">{resetBusy ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}</button>
            </div>
          </div>
        </div>, document.body,
      )}

      {/* =====================================================
          VIEW USER MODAL
          ===================================================== */}

      {viewUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4"
            onClick={
              handleCloseViewUser
            }
          >
            <div
              role="dialog" aria-modal="true" aria-label="Chi tiết tài khoản" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Chi tiết tài khoản
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Xem thông tin tài khoản
                    người dùng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseViewUser
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="space-y-4 px-6 py-6">
                <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-slate-100 pb-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Họ tên
                  </p>

                  <p className="text-sm font-semibold text-slate-900">
                    {viewUser.name}
                  </p>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-slate-100 pb-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Email
                  </p>

                  <p className="text-sm text-slate-700">
                    {viewUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-slate-100 pb-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Vai trò
                  </p>

                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {viewUser.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Trạng thái
                  </p>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        viewUser.status ===
                        'Hoạt động'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {viewUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-100 px-6 py-4 text-sm">
                <p><strong>ID tài khoản:</strong> {viewUser.id}</p>
                <p><strong>Điện thoại:</strong> {viewUser.phone || '—'}</p>
                <p><strong>Ngày tạo:</strong> {formatDate(viewUser.raw.created_at)}</p>
                <p><strong>Đăng nhập gần nhất:</strong> {formatDate(viewUser.raw.last_login_at)}</p>
              </div>
              {/* FOOTER */}

              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    handleCloseViewUser
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* =====================================================
          EDIT USER MODAL
          ===================================================== */}

      {editUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4"
            onClick={
              handleCloseEditUser
            }
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Chỉnh sửa tài khoản
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Cập nhật thông tin tài khoản
                    người dùng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseEditUser
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="space-y-4 px-6 py-6">
                {editError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Họ tên <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="text"
                    value={
                      editForm.name
                    }
                    aria-invalid={!!editErrors.name}
                    aria-describedby={editErrors.name ? 'edit-name-error' : undefined}
                    onChange={(e) => {
                      setEditErrors(current => ({ ...current, name: undefined }));
                      setEditForm(current => ({ ...current, name: e.target.value }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  {editErrors.name && <p id="edit-name-error" className="mt-1 text-sm text-red-600">{editErrors.name}</p>}
                </div>

                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label><input type="tel" maxLength={20} value={editForm.phone || ''} onChange={e => setEditForm(current => ({...current,phone:e.target.value}))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5" /></div>
                  <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="email"
                    value={
                      editForm.email
                    }
                    aria-invalid={!!editErrors.email}
                    aria-describedby={editErrors.email ? 'edit-email-error' : undefined}
                    onChange={(e) => {
                      setEditErrors(current => ({ ...current, email: undefined }));
                      setEditForm(current => ({ ...current, email: e.target.value }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  {editErrors.email && <p id="edit-email-error" className="mt-1 text-sm text-red-600">{editErrors.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vai trò <span className="text-red-600">*</span>
                  </label>

                  <select
                    value={
                      editForm.role
                    }
                    aria-invalid={!!editErrors.role}
                    aria-describedby={editErrors.role ? 'edit-role-error' : undefined}
                    onChange={(e) => {
                      setEditErrors(current => ({ ...current, role: undefined }));
                      setEditForm(current => ({ ...current, role: e.target.value as UserRole }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {ROLE_ORDER.map(code => {
                      const label = ROLE_LABELS[code];
                      const linkedProfile = !!(editUser.raw.studentId || editUser.raw.enterpriseId);
                      const unavailable = !accountRoles.some(role => role.code === code);
                      const importOnly = (code === 'STUDENT' || code === 'ENTERPRISE') && editUser.role !== label;
                      const profileConflict = linkedProfile && editUser.role !== label;
                      const selfRoleChange = String(editUser.id) === currentUser?.id && editUser.role !== label;
                      return <option key={code} value={label} disabled={editUser.role !== label && (unavailable || importOnly || profileConflict || selfRoleChange)}>{label}</option>;
                    })}
                  </select>
                  {editErrors.role && <p id="edit-role-error" className="mt-1 text-sm text-red-600">{editErrors.role}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>

                  {editUser.status === 'Khóa' && <p className="mb-2 text-xs text-amber-700">Trạng thái hiện tại: Khóa. Chọn trạng thái mới nếu muốn thay đổi.</p>}
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          status:
                            e.target
                              .value as UserStatus,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="Khóa" disabled>Khóa</option>
                    <option value="Hoạt động">
                      Hoạt động
                    </option>

                    <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    handleCloseEditUser
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={saving || loading} onClick={handleSaveEditUser}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* =====================================================
          ADD USER MODAL
          ===================================================== */}

      {isAddModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4"
            onClick={
              handleCloseAddModal
            }
          >
            <div
              role="dialog" aria-modal="true" aria-label="Thêm tài khoản"
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Thêm tài khoản
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Nhập thông tin tài khoản mới.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCloseAddModal
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                {addError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Họ tên <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="text" required
                    value={
                      addForm.name
                    }
                    onChange={(e) =>
                      setAddForm(
                        (current) => ({
                          ...current,
                          name:
                            e.target.value,
                        }),
                      )
                    }
                    placeholder="Nhập họ tên"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label><input type="tel" maxLength={20} value={addForm.phone || ''} onChange={e => setAddForm(current => ({...current,phone:e.target.value}))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5" /></div>
                  <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="email" required
                    value={
                      addForm.email
                    }
                    onChange={(e) =>
                      setAddForm(
                        (current) => ({
                          ...current,
                          email:
                            e.target.value,
                        }),
                      )
                    }
                    placeholder="Nhập email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vai trò <span className="text-red-600">*</span>
                  </label>

                  <select required
                    value={
                      addForm.role
                    }
                    onChange={(e) =>
                      setAddForm(
                        (current) => ({
                          ...current,
                          role:
                            e.target
                              .value as UserRole,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="" disabled>Chọn vai trò</option>
                    {ROLE_ORDER.map(code => <option key={code} value={ROLE_LABELS[code]} disabled={!accountRoles.some(role => role.code === code)}>{ROLE_LABELS[code]}</option>)}
                  </select>
                  {['Sinh viên', 'Doanh nghiệp'].includes(addForm.role) && <p className="mt-1 text-xs text-amber-700">Tài khoản vai trò này được tạo qua quy trình import.</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>

                  <select
                    disabled value={
                      addForm.status
                    }
                    onChange={(e) =>
                      setAddForm(
                        (current) => ({
                          ...current,
                          status:
                            e.target
                              .value as UserStatus,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="Hoạt động">
                      Hoạt động
                    </option>

                    <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Tài khoản mới được tạo ở trạng thái Hoạt động.</p>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={
                    handleCloseAddModal
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={saving || loading} onClick={handleAddUser}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Thêm tài khoản
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default AdminUsers;
