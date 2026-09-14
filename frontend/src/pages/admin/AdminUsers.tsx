import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, UserPlus, X, Eye, Pencil, Trash2 } from "lucide-react";
import { PageBanner } from "@/components/common/PageBanner";

type UserRole =
  | "Sinh viên"
  | "Phòng Đào tạo"
  | "Phòng Quan hệ Doanh nghiệp"
  | "Doanh nghiệp"
  | "Quản trị viên";

type UserStatus = "Hoạt động" | "Khóa";

interface UserAccount {
  id: number;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

const mockUsers: UserAccount[] = [
  {
    id: 1,
    code: "SE180001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@fpt.edu.vn",
    role: "Sinh viên",
    status: "Hoạt động",
  },
  {
    id: 2,
    code: "PDT001",
    name: "Trần Thị Lan",
    email: "lan.tran@fpt.edu.vn",
    role: "Phòng Đào tạo",
    status: "Hoạt động",
  },
  {
    id: 3,
    code: "QHDN001",
    name: "Lê Minh Anh",
    email: "anh.le@fpt.edu.vn",
    role: "Phòng Quan hệ Doanh nghiệp",
    status: "Hoạt động",
  },
  {
    id: 4,
    code: "DN001",
    name: "Công ty ABC",
    email: "contact@abc.com",
    role: "Doanh nghiệp",
    status: "Hoạt động",
  },
  {
    id: 5,
    code: "ADM001",
    name: "System Admin",
    email: "admin@fpt.edu.vn",
    role: "Quản trị viên",
    status: "Hoạt động",
  },
  {
    id: 6,
    code: "SE180002",
    name: "Phạm Minh Tuấn",
    email: "tuan.pham@fpt.edu.vn",
    role: "Sinh viên",
    status: "Khóa",
  },
];

const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"Tất cả" | UserRole>("Tất cả");

  // Trạng thái mở / đóng popup
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return mockUsers.filter((user) => {
      const matchesSearch =
        !keyword ||
        user.code.toLowerCase().includes(keyword) ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);

      const matchesRole = roleFilter === "Tất cả" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter]);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Quản lý Người dùng & Phân quyền"
        description="Phân quyền 5 nhóm người dùng: Sinh viên, PĐT, QHDN, Doanh nghiệp và Admin."
        badge="5 Vai trò"
      />

      <section className="card-glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh sách tài khoản
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý tài khoản và vai trò người dùng trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <UserPlus size={18} />
            Thêm tài khoản
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã, họ tên hoặc email..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "Tất cả" | UserRole)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="Tất cả">Tất cả vai trò</option>
            <option value="Sinh viên">Sinh viên</option>
            <option value="Phòng Đào tạo">Phòng Đào tạo</option>
            <option value="Phòng Quan hệ Doanh nghiệp">
              Phòng Quan hệ Doanh nghiệp
            </option>
            <option value="Doanh nghiệp">Doanh nghiệp</option>
            <option value="Quản trị viên">Quản trị viên</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
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
                        user.status === "Hoạt động"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Xem"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        title="Chỉnh sửa"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-500 transition hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title="Xóa"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
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
          Hiển thị{" "}
          <span className="font-semibold text-slate-700">
            {filteredUsers.length}
          </span>{" "}
          tài khoản
        </div>
      </section>

      {/* Popup thêm tài khoản */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              {/* Header popup */}
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nội dung popup */}
              <div className="space-y-4 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mã tài khoản
                  </label>
                  <input
                    type="text"
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
                    placeholder="Nhập email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vai trò
                  </label>
                  <select
                    defaultValue="Sinh viên"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="Sinh viên">Sinh viên</option>
                    <option value="Phòng Đào tạo">Phòng Đào tạo</option>
                    <option value="Phòng Quan hệ Doanh nghiệp">
                      Phòng Quan hệ Doanh nghiệp
                    </option>
                    <option value="Doanh nghiệp">Doanh nghiệp</option>
                    <option value="Quản trị viên">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    defaultValue="Hoạt động"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Khóa">Khóa</option>
                  </select>
                </div>
              </div>

              {/* Footer popup */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
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
