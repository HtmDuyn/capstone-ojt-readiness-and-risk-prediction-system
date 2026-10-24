import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Search,
  UserPlus,
  X,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  Mail,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { createAccount, getAccounts, updateAccount, resetAccountPassword, resendAccountEmail, formatDate, type Account } from '@/services/admin';
import { PageBanner } from '@/components/common/PageBanner';

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
  password?: string;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/* =========================================================
   API DATA
   ========================================================= */

const ROLE_LABELS: Record<string, UserRole> = { STUDENT: 'Sinh viên', ACADEMIC: 'Phòng Đào tạo', OJT_COORD: 'Phòng Quan hệ Doanh nghiệp', ENTERPRISE: 'Doanh nghiệp', ADMIN: 'Quản trị viên' };
const mapAccount = (a: Account): UserAccount => ({ raw: a, phone: a.phone ?? '', id: a.id, code: a.username, name: a.full_name, email: a.email, roleId: a.role_id, role: ROLE_LABELS[a.role_code], status: a.status === 'ACTIVE' ? 'Hoạt động' : a.status === 'LOCKED' ? 'Khóa' : 'Ngừng hoạt động' });
const statusCode = (s: UserStatus) => s === 'Hoạt động' ? 'ACTIVE' : s === 'Khóa' ? 'LOCKED' : 'INACTIVE';

const EMPTY_FORM: UserForm = {
  code: '',
  name: '',
  email: '',
  role: 'Phòng Đào tạo',
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const loadUsers = async () => {
    setLoading(true); setError('');
    try { const result = await getAccounts(); setUsers(result.data.map(mapAccount)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được tài khoản.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadUsers(); }, []);
  const roleIdFor = (role: UserRole) => {
    const id = users.find(user => user.role === role)?.roleId;
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

  /* =========================
     ADD
     ========================= */

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [addForm, setAddForm] =
    useState<UserForm>(EMPTY_FORM);

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

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  /* =========================================================
     ADD ACCOUNT
     ========================================================= */

  const handleOpenAddModal = () => {
    const staff = users.find(user => !['Sinh viên', 'Doanh nghiệp'].includes(user.role));
    setAddForm({ ...EMPTY_FORM, role: staff?.role ?? EMPTY_FORM.role });
    setNotice(''); setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm(EMPTY_FORM);
  };

  const handleAddUser = async () => {
    if (saving) return; setSaving(true);
    try {
      if (['Sinh viên', 'Doanh nghiệp'].includes(addForm.role)) throw new Error('Tài khoản sinh viên và doanh nghiệp phải được tạo qua import.');
      if (!addForm.password || addForm.password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
      await createAccount({ username: addForm.code.trim(), fullName: addForm.name.trim(), email: addForm.email.trim(), password: addForm.password, phone: addForm.phone?.trim() || null, roleId: roleIdFor(addForm.role) });
      handleCloseAddModal(); setNotice('Đã tạo tài khoản.'); await loadUsers();
    } catch (e) { alert(e instanceof Error ? e.message : 'Tạo tài khoản thất bại.'); }
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

    setEditForm({
      phone: user.phone,
      code: user.code,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  const handleCloseEditUser = () => {
    setEditUser(null);
    setEditForm(EMPTY_FORM);
  };

  const handleSaveEditUser = async () => {
    if (!editUser || saving) return; setSaving(true);
    try {
      await updateAccount({ userId: editUser.id, fullName: editForm.name.trim(), phone: editForm.phone?.trim() || null, email: editForm.email.trim(), status: statusCode(editForm.status), roleId: editForm.role === editUser.role ? editUser.roleId : roleIdFor(editForm.role) });
      handleCloseEditUser(); setNotice('Đã cập nhật tài khoản.'); await loadUsers();
    } catch (e) { alert(e instanceof Error ? e.message : 'Cập nhật thất bại.'); }
    finally { setSaving(false); }
  };

  /* =========================================================
     DELETE ACCOUNT
     ========================================================= */

  const handleDeleteUser = async (user: UserAccount) => {
    if (saving || !window.confirm('Ngừng hoạt động tài khoản ' + user.code + '?')) return; setSaving(true);
    try {
      await updateAccount({ userId: user.id, status: 'INACTIVE' });
      setNotice('Đã ngừng hoạt động tài khoản.'); await loadUsers();
    } catch (e) { alert(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại.'); }
    finally { setSaving(false); }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  const handleAccountAction = async (user: UserAccount, action: 'reset' | 'resend') => {
    if (saving) return;
    if (action === 'reset' && String(user.id) === currentUser?.id) { alert('Để đổi mật khẩu của bạn, mở Cài đặt hệ thống → Tài khoản cá nhân.'); return; }
    if (!window.confirm(action === 'reset' ? 'Đặt lại mật khẩu và đưa email thông tin đăng nhập vào hàng đợi cho ' + user.email + '?' : 'Gửi lại email đăng nhập bị lỗi cho ' + user.email + '?')) return;
    setSaving(true); setNotice('');
    try {
      if (action === 'reset') {
        await resetAccountPassword(user.id);
        setNotice('Đã đưa yêu cầu đặt lại mật khẩu vào hàng đợi email.');
      } else {
        await resendAccountEmail(user.email);
        setNotice('Đã đưa email lỗi vào hàng đợi gửi lại.');
      }
      setViewUser(null); await loadUsers();
    } catch (e) { alert(e instanceof Error ? e.message : 'Thao tác thất bại.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <button onClick={() => void loadUsers()} className="underline">Thử lại</button></div>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{notice}</p>}
      {loading && <p role="status">Đang tải tài khoản...</p>}
      {saving && <p role="status">Đang lưu...</p>}
      <PageBanner
        title="Quản lý Người dùng & Phân quyền"
        description="Phân quyền 5 nhóm người dùng: Sinh viên, PĐT, QHDN, Doanh nghiệp và Admin."
        badge="5 Vai trò"
        primaryAction={{ label: 'Thêm tài khoản', onClick: handleOpenAddModal }}
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

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
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

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value as
                  | 'Tất cả'
                  | UserRole,
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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

            <option value="Quản trị viên">
              Quản trị viên
            </option>
          </select>
        </div>

        {/* TABLE */}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Mã
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Họ tên
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vai trò
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                    {user.code}
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
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        user.status ===
                        'Hoạt động'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
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

                      {/* XÓA */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteUser(user)
                        }
                        title="Ngừng hoạt động tài khoản"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
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
                    Không tìm thấy tài khoản
                    phù hợp.
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
                    Mã tài khoản
                  </p>

                  <p className="text-sm font-semibold text-slate-900">
                    {viewUser.code}
                  </p>
                </div>

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

              <div className="space-y-3 border-t border-slate-100 px-6 py-4 text-sm"><p><strong>ID tài khoản:</strong> {viewUser.id}</p><p><strong>Điện thoại:</strong> {viewUser.phone || '—'}</p><p><strong>Ngày tạo:</strong> {formatDate(viewUser.raw.created_at)}</p><p><strong>Đăng nhập gần nhất:</strong> {formatDate(viewUser.raw.last_login_at)}</p><div className="flex flex-wrap gap-2"><button disabled={saving} onClick={() => void handleAccountAction(viewUser, 'reset')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 disabled:opacity-50"><KeyRound size={16} />Đặt lại mật khẩu</button><button disabled={saving} onClick={() => void handleAccountAction(viewUser, 'resend')} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 disabled:opacity-50"><Mail size={16} />Gửi lại email lỗi</button></div></div>
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
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
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
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mã tài khoản
                  </label>

                  <input
                    type="text"
                    value={editForm.code} disabled title="Tên đăng nhập không thể sửa"
                    onChange={(e) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          code:
                            e.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Họ tên
                  </label>

                  <input
                    type="text"
                    value={
                      editForm.name
                    }
                    onChange={(e) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          name:
                            e.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label><input type="tel" maxLength={20} value={editForm.phone || ''} onChange={e => setEditForm(current => ({...current,phone:e.target.value}))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5" /></div>
                  <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      editForm.email
                    }
                    onChange={(e) =>
                      setEditForm(
                        (current) => ({
                          ...current,
                          email:
                            e.target.value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vai trò
                  </label>

                  <select
                    value={
                      editForm.role
                    }
                    onChange={(e) =>
                      setEditForm(
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
                    <option value="Sinh viên" disabled={editUser?.role !== 'Sinh viên' || !!(editUser?.raw.studentId || editUser?.raw.enterpriseId) && editUser?.role !== 'Sinh viên'}>
                      Sinh viên
                    </option>

                    <option value="Phòng Đào tạo" disabled={!users.some(user => user.role === 'Phòng Đào tạo') || !!(editUser?.raw.studentId || editUser?.raw.enterpriseId) && editUser?.role !== 'Phòng Đào tạo'}>
                      Phòng Đào tạo
                    </option>

                    <option value="Phòng Quan hệ Doanh nghiệp" disabled={!users.some(user => user.role === 'Phòng Quan hệ Doanh nghiệp') || !!(editUser?.raw.studentId || editUser?.raw.enterpriseId) && editUser?.role !== 'Phòng Quan hệ Doanh nghiệp'}>
                      Phòng Quan hệ Doanh nghiệp
                    </option>

                    <option value="Doanh nghiệp" disabled={editUser?.role !== 'Doanh nghiệp' || !!(editUser?.raw.studentId || editUser?.raw.enterpriseId) && editUser?.role !== 'Doanh nghiệp'}>
                      Doanh nghiệp
                    </option>

                    <option value="Quản trị viên" disabled={!users.some(user => user.role === 'Quản trị viên') || !!(editUser?.raw.studentId || editUser?.raw.enterpriseId) && editUser?.role !== 'Quản trị viên'}>
                      Quản trị viên
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>

                  <select
                    value={
                      editForm.status
                    }
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
                    <option value="Hoạt động">
                      Hoạt động
                    </option>

                    <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                    <option value="Khóa">
                      Khóa
                    </option>
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4"
            onClick={
              handleCloseAddModal
            }
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
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

              <div className="space-y-4 px-6 py-6">
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Tạo thủ công dành cho cán bộ và quản trị viên. Tài khoản sinh viên, doanh nghiệp được cấp qua import. Vai trò phải có ID trong dữ liệu tài khoản hệ thống.</p>
                  <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu ban đầu</label><input type="password" autoComplete="new-password" minLength={8} value={addForm.password || ''} onChange={e => setAddForm(current => ({ ...current, password: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5" /></div>
                  <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mã tài khoản
                  </label>

                  <input
                    type="text"
                    value={
                      addForm.code
                    }
                    onChange={(e) =>
                      setAddForm(
                        (current) => ({
                          ...current,
                          code:
                            e.target.value,
                        }),
                      )
                    }
                    placeholder="Nhập mã tài khoản"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Họ tên
                  </label>

                  <input
                    type="text"
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
                    Email
                  </label>

                  <input
                    type="email"
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
                    Vai trò
                  </label>

                  <select
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
                    <option value="Phòng Đào tạo" disabled={!users.some(user => user.role === 'Phòng Đào tạo')}>
                      Phòng Đào tạo
                    </option>

                    <option value="Phòng Quan hệ Doanh nghiệp" disabled={!users.some(user => user.role === 'Phòng Quan hệ Doanh nghiệp')}>
                      Phòng Quan hệ Doanh nghiệp
                    </option>

                    <option value="Quản trị viên" disabled={!users.some(user => user.role === 'Quản trị viên')}>
                      Quản trị viên
                    </option>
                  </select>
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
                    <option value="Khóa">
                      Khóa
                    </option>
                  </select>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
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