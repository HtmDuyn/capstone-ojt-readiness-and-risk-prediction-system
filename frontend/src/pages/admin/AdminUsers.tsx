import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Search,
  UserPlus,
  X,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';

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

type UserStatus = 'Hoạt động' | 'Khóa';

interface UserAccount {
  id: number;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

interface UserForm {
  code: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

/* =========================================================
   MOCK DATA
   ========================================================= */

const mockUsers: UserAccount[] = [
  {
    id: 1,
    code: 'SE180001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@fpt.edu.vn',
    role: 'Sinh viên',
    status: 'Hoạt động',
  },
  {
    id: 2,
    code: 'PDT001',
    name: 'Trần Thị Lan',
    email: 'lan.tran@fpt.edu.vn',
    role: 'Phòng Đào tạo',
    status: 'Hoạt động',
  },
  {
    id: 3,
    code: 'QHDN001',
    name: 'Lê Minh Anh',
    email: 'anh.le@fpt.edu.vn',
    role: 'Phòng Quan hệ Doanh nghiệp',
    status: 'Hoạt động',
  },
  {
    id: 4,
    code: 'DN001',
    name: 'Công ty ABC',
    email: 'contact@abc.com',
    role: 'Doanh nghiệp',
    status: 'Hoạt động',
  },
  {
    id: 5,
    code: 'ADM001',
    name: 'System Admin',
    email: 'admin@fpt.edu.vn',
    role: 'Quản trị viên',
    status: 'Hoạt động',
  },
  {
    id: 6,
    code: 'SE180002',
    name: 'Phạm Minh Tuấn',
    email: 'tuan.pham@fpt.edu.vn',
    role: 'Sinh viên',
    status: 'Khóa',
  },
];

const EMPTY_FORM: UserForm = {
  code: '',
  name: '',
  email: '',
  role: 'Sinh viên',
  status: 'Hoạt động',
};

/* =========================================================
   COMPONENT
   ========================================================= */

const AdminUsers: React.FC = () => {
  /* =========================
     DATA
     ========================= */

  const [users, setUsers] =
    useState<UserAccount[]>(mockUsers);

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
    setAddForm(EMPTY_FORM);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm(EMPTY_FORM);
  };

  const handleAddUser = () => {
    if (
      !addForm.code.trim() ||
      !addForm.name.trim() ||
      !addForm.email.trim()
    ) {
      alert(
        'Vui lòng nhập đầy đủ mã tài khoản, họ tên và email.',
      );

      return;
    }

    const newUser: UserAccount = {
      id: Date.now(),
      code: addForm.code.trim(),
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      role: addForm.role,
      status: addForm.status,
    };

    setUsers((current) => [
      ...current,
      newUser,
    ]);

    handleCloseAddModal();
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

  const handleSaveEditUser = () => {
    if (!editUser) return;

    if (
      !editForm.code.trim() ||
      !editForm.name.trim() ||
      !editForm.email.trim()
    ) {
      alert(
        'Vui lòng nhập đầy đủ mã tài khoản, họ tên và email.',
      );

      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === editUser.id
          ? {
              ...user,
              code: editForm.code.trim(),
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              role: editForm.role,
              status: editForm.status,
            }
          : user,
      ),
    );

    handleCloseEditUser();
  };

  /* =========================================================
     DELETE ACCOUNT
     ========================================================= */

  const handleDeleteUser = (
    user: UserAccount,
  ) => {
    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa tài khoản ${user.code} - ${user.name} không?`,
      );

    if (!confirmed) return;

    setUsers((current) =>
      current.filter(
        (item) => item.id !== user.id,
      ),
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="space-y-6">
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
                        title="Xóa tài khoản"
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
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
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
                    value={
                      editForm.code
                    }
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
                  onClick={
                    handleSaveEditUser
                  }
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

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>

                  <select
                    value={
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
                  onClick={
                    handleAddUser
                  }
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