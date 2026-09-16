import React from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

interface OjtCondition {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Đang áp dụng' | 'Ngừng áp dụng';
}

const INITIAL_CONDITIONS: OjtCondition[] = [
  {
    id: 'OJTC01',
    code: 'CREDIT_90',
    name: 'Hoàn thành tối thiểu 90% tín chỉ',
    description:
      'Hoàn thành ít nhất 90% tổng số tín chỉ trước OJT, không tính GDTC và OTP.',
    status: 'Đang áp dụng',
  },
  {
    id: 'OJTC02',
    code: 'JPD133',
    name: 'Điều kiện tiếng Nhật',
    description:
      'Đối với sinh viên theo combo tiếng Nhật, phải đạt JPD133.',
    status: 'Đang áp dụng',
  },
];

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
};

const EducationOjtConditions: React.FC = () => {
  const [conditions, setConditions] = React.useState<OjtCondition[]>(
    INITIAL_CONDITIONS,
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCondition, setEditingCondition] =
    React.useState<OjtCondition | null>(null);

  const [formData, setFormData] = React.useState(EMPTY_FORM);

  const filteredConditions = conditions.filter((condition) => {
    const keyword = searchTerm.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    return (
      condition.code.toLowerCase().includes(keyword) ||
      condition.name.toLowerCase().includes(keyword) ||
      condition.description.toLowerCase().includes(keyword)
    );
  });

  const openAddModal = () => {
    setEditingCondition(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (condition: OjtCondition) => {
    setEditingCondition(condition);

    setFormData({
      code: condition.code,
      name: condition.name,
      description: condition.description,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCondition(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.code.trim() ||
      !formData.name.trim() ||
      !formData.description.trim()
    ) {
      alert('Vui lòng nhập đầy đủ thông tin điều kiện OJT.');
      return;
    }

    if (editingCondition) {
      setConditions((prev) =>
        prev.map((condition) =>
          condition.id === editingCondition.id
            ? {
                ...condition,
                code: formData.code.trim(),
                name: formData.name.trim(),
                description: formData.description.trim(),
              }
            : condition,
        ),
      );
    } else {
      const newCondition: OjtCondition = {
        id: `OJTC${String(conditions.length + 1).padStart(2, '0')}`,
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: 'Đang áp dụng',
      };

      setConditions((prev) => [...prev, newCondition]);
    }

    closeModal();
  };

  const handleDelete = (condition: OjtCondition) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa điều kiện "${condition.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setConditions((prev) =>
      prev.filter((item) => item.id !== condition.id),
    );
  };

  const handleToggleStatus = (condition: OjtCondition) => {
    setConditions((prev) =>
      prev.map((item) =>
        item.id === condition.id
          ? {
              ...item,
              status:
                item.status === 'Đang áp dụng'
                  ? 'Ngừng áp dụng'
                  : 'Đang áp dụng',
            }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Quản lý Điều kiện OJT"
        description="Quản lý các điều kiện cần thiết để sinh viên đủ điều kiện tham gia OJT."
        badge="Quản lý dữ liệu"
      />

      {/* ==================== THỐNG KÊ ==================== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng điều kiện
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {conditions.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <FileCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Đang áp dụng
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {
                  conditions.filter(
                    (condition) =>
                      condition.status === 'Đang áp dụng',
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Ngừng áp dụng
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-500">
                {
                  conditions.filter(
                    (condition) =>
                      condition.status === 'Ngừng áp dụng',
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <XCircle size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DANH SÁCH ==================== */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Danh sách điều kiện OJT
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Các điều kiện đang được sử dụng để kiểm tra điều kiện
              OJT.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus size={17} />
            Thêm điều kiện
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 p-5">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Tìm theo mã hoặc tên điều kiện..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Mã điều kiện
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Tên điều kiện
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Nội dung
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Trạng thái
                </th>

                <th className="px-5 py-3 text-right font-semibold text-slate-600">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredConditions.length > 0 ? (
                filteredConditions.map((condition) => (
                  <tr
                    key={condition.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {condition.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {condition.name}
                      </p>
                    </td>

                    <td className="max-w-xl px-5 py-4 text-slate-600">
                      {condition.description}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(condition)
                        }
                        className={
                          condition.status === 'Đang áp dụng'
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500'
                        }
                      >
                        {condition.status === 'Đang áp dụng' ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <XCircle size={13} />
                        )}

                        {condition.status}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(condition)
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-500"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(condition)
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Xóa"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    Không tìm thấy điều kiện phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingCondition
                  ? 'Chỉnh sửa điều kiện OJT'
                  : 'Thêm điều kiện OJT'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Nhập thông tin điều kiện được áp dụng cho OJT.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Mã điều kiện
                  </label>

                  <input
                    type="text"
                    value={formData.code}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: CREDIT_90"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tên điều kiện
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nhập tên điều kiện"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nội dung điều kiện
                  </label>

                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Nhập nội dung điều kiện"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  {editingCondition
                    ? 'Lưu thay đổi'
                    : 'Thêm điều kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtConditions;