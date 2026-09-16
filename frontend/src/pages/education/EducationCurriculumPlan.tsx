import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  prerequisite: string;
}

const MOCK_CURRICULUM: CurriculumSubject[] = [
  // =========================
  // KỲ 1 - TẠM GIỮ DỮ LIỆU HIỆN TẠI
  // Sẽ cập nhật lại khi có full dữ liệu Kỳ 1-3
  // =========================
  {
    id: '1',
    code: 'PRF192',
    name: 'Lập trình cơ bản',
    credits: 3,
    semester: 1,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '2',
    code: 'MAE101',
    name: 'Toán cho kỹ thuật',
    credits: 3,
    semester: 1,
    prerequisite: 'Không ghi nhận',
  },

  // =========================
  // KỲ 2 - TẠM GIỮ DỮ LIỆU HIỆN TẠI
  // =========================
  {
    id: '3',
    code: 'PRO192',
    name: 'Lập trình hướng đối tượng',
    credits: 3,
    semester: 2,
    prerequisite: 'PRF192',
  },

  // =========================
  // KỲ 3 - TẠM GIỮ DỮ LIỆU HIỆN TẠI
  // =========================
  {
    id: '4',
    code: 'CSD201',
    name: 'Cấu trúc dữ liệu và giải thuật',
    credits: 3,
    semester: 3,
    prerequisite: 'PRO192',
  },
  {
    id: '5',
    code: 'DBI202',
    name: 'Cơ sở dữ liệu',
    credits: 3,
    semester: 3,
    prerequisite: 'Không ghi nhận',
  },

  // =========================
  // KỲ 4
  // =========================
  {
    id: '6',
    code: 'JPD123',
    name: 'Elementary Japanese 1-A1.2',
    credits: 3,
    semester: 4,
    prerequisite: 'JPD113',
  },
  {
    id: '7',
    code: 'MAS291',
    name: 'Statistics & Probability',
    credits: 3,
    semester: 4,
    prerequisite: 'MAE101 hoặc MAC101',
  },
  {
    id: '8',
    code: 'PRJ302',
    name: 'Java Web Application Development',
    credits: 3,
    semester: 4,
    prerequisite: 'DBI202 và PRO192',
  },
  {
    id: '9',
    code: 'SWE201c',
    name: 'Introduction to Software Engineering',
    credits: 3,
    semester: 4,
    prerequisite: 'PRO192',
  },

  // =========================
  // KỲ 5
  // =========================
  {
    id: '10',
    code: 'ISP392',
    name: 'Information System Programming Project',
    credits: 3,
    semester: 5,
    prerequisite: 'PRJ302, SWE201c, pass LAB211',
  },

  // =========================
  // KỲ 6
  // =========================
  {
    id: '11',
    code: 'ENW493c',
    name: 'Phương pháp nghiên cứu & Kỹ năng viết học thuật',
    credits: 3,
    semester: 6,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '12',
    code: 'OJT202',
    name: 'Đào tạo trong môi trường thực tế',
    credits: 10,
    semester: 6,
    prerequisite: 'Không ghi nhận',
  },

  // =========================
  // KỲ 7
  // =========================
  {
    id: '13',
    code: 'EXE101',
    name: 'Trải nghiệm khởi nghiệp 1',
    credits: 3,
    semester: 7,
    prerequisite: 'Không có',
  },
  {
    id: '14',
    code: 'IS_COM2',
    name: 'Học phần 2 của Combo*',
    credits: 3,
    semester: 7,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '15',
    code: 'IS_COM3',
    name: 'Học phần 3 của Combo*',
    credits: 3,
    semester: 7,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '16',
    code: 'ISC301',
    name: 'Thương mại điện tử',
    credits: 3,
    semester: 7,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '17',
    code: 'ITB302c',
    name: 'Kinh doanh thông minh (Business Intelligence)',
    credits: 3,
    semester: 7,
    prerequisite: 'DBI202',
  },

  // =========================
  // KỲ 8
  // =========================
  {
    id: '18',
    code: 'DTA301',
    name: 'Phân tích dữ liệu',
    credits: 3,
    semester: 8,
    prerequisite: 'PRO192, CSD201, DBI202, MAS291',
  },
  {
    id: '19',
    code: 'EXE201',
    name: 'Trải nghiệm khởi nghiệp 2',
    credits: 3,
    semester: 8,
    prerequisite: 'EXE101',
  },
  {
    id: '20',
    code: 'IS_COM4',
    name: 'Học phần 4 của Combo*',
    credits: 3,
    semester: 8,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '21',
    code: 'MLN111',
    name: 'Triết học Mác – Lênin',
    credits: 3,
    semester: 8,
    prerequisite: 'Không có',
  },
  {
    id: '22',
    code: 'MLN122',
    name: 'Kinh tế chính trị Mác – Lênin',
    credits: 2,
    semester: 8,
    prerequisite: 'Không có',
  },
  {
    id: '23',
    code: 'PMG201c',
    name: 'Quản lý dự án',
    credits: 3,
    semester: 8,
    prerequisite: 'Không có',
  },

  // =========================
  // KỲ 9
  // =========================
  {
    id: '24',
    code: 'HCM202',
    name: 'Tư tưởng Hồ Chí Minh',
    credits: 2,
    semester: 9,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: '25',
    code: 'IS_GRA_ELE',
    name: 'Học phần lựa chọn Đồ án tốt nghiệp chuyên ngành Hệ thống thông tin',
    credits: 10,
    semester: 9,
    prerequisite: 'Không ghi nhận',
  },
  {
    id: '26',
    code: 'MLN131',
    name: 'Chủ nghĩa xã hội khoa học',
    credits: 2,
    semester: 9,
    prerequisite: 'MLN111, MLN122',
  },
  {
    id: '27',
    code: 'VNR202',
    name: 'Lịch sử Đảng Cộng sản Việt Nam',
    credits: 2,
    semester: 9,
    prerequisite: 'MLN111, MLN122',
  },
];

const EducationCurriculumPlan: React.FC = () => {
  const [curriculumCode] = useState('BIT_IS_K18D_19A');
  const [semester, setSemester] = useState('all');

  const [subjects, setSubjects] =
    useState<CurriculumSubject[]>(MOCK_CURRICULUM);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] =
    useState<CurriculumSubject | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: '',
    semester: '1',
    prerequisite: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSubjects = useMemo(() => {
    if (semester === 'all') {
      return subjects;
    }

    return subjects.filter(
      (subject) => subject.semester === Number(semester),
    );
  }, [semester, subjects]);

  const totalCredits = subjects.reduce(
    (total, subject) => total + subject.credits,
    0,
  );

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      credits: '',
      semester: '1',
      prerequisite: '',
    });

    setEditingSubject(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (subject: CurriculumSubject) => {
    setEditingSubject(subject);

    setFormData({
      code: subject.code,
      name: subject.name,
      credits: String(subject.credits),
      semester: String(subject.semester),
      prerequisite: subject.prerequisite,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.code.trim() ||
      !formData.name.trim() ||
      !formData.credits
    ) {
      alert('Vui lòng nhập đầy đủ mã môn, tên môn và số tín chỉ.');
      return;
    }

    const subjectData: CurriculumSubject = {
      id: editingSubject?.id ?? Date.now().toString(),
      code: formData.code.trim(),
      name: formData.name.trim(),
      credits: Number(formData.credits),
      semester: Number(formData.semester),
      prerequisite:
        formData.prerequisite.trim() || 'Không ghi nhận',
    };

    if (editingSubject) {
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === editingSubject.id ? subjectData : subject,
        ),
      );

      alert('Đã cập nhật môn học.');
    } else {
      setSubjects((prev) => [...prev, subjectData]);

      alert('Đã thêm môn học vào khung chương trình.');
    }

    closeModal();
  };

  const handleDelete = (subject: CurriculumSubject) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa môn "${subject.code} - ${subject.name}" khỏi khung chương trình?`,
    );

    if (!confirmed) {
      return;
    }

    setSubjects((prev) =>
      prev.filter((item) => item.id !== subject.id),
    );

    alert('Đã xóa môn học khỏi khung chương trình.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      'Mã khung chương trình,Mã môn,Tên môn học,Số tín chỉ,Kỳ chương trình,Môn tiên quyết',
      'BIT_IS_K18D_19A,PRF192,Lập trình cơ bản,3,1,Không ghi nhận',
      'BIT_IS_K18D_19A,PRO192,Lập trình hướng đối tượng,3,2,PRF192',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'template_khung_chuong_trinh.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    alert(
      `Đã chọn file "${file.name}". Chức năng đọc và lưu dữ liệu sẽ kết nối API sau khi có backend.`,
    );

    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Quản lý Khung Chương trình Đào tạo"
        description="Quản lý khung chương trình đào tạo theo từng kỳ chương trình và môn học."
        badge="Quản lý dữ liệu"
      />

      {/* Thông tin khung chương trình + thao tác */}
      <section className="card-glass p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Khung chương trình
            </label>

            <select
              value={curriculumCode}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="BIT_IS_K18D_19A">
                BIT_IS_K18D_19A
              </option>
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              <Download size={18} />
              Tải file mẫu
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
            >
              <Upload size={18} />
              Import dữ liệu
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <Plus size={18} />
              Thêm môn học
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </section>

      {/* Tổng quan */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-glass p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-500">
              <FileSpreadsheet size={20} />
            </div>

            <span className="text-sm font-medium text-slate-500">
              Mã khung chương trình
            </span>
          </div>

          <p className="text-lg font-bold text-slate-800">
            {curriculumCode}
          </p>
        </div>

        <div className="card-glass p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-500">
              <BookOpen size={20} />
            </div>

            <span className="text-sm font-medium text-slate-500">
              Số môn trong khung
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800">
            {subjects.length}
          </p>
        </div>

        <div className="card-glass p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-500">
              <BookOpen size={20} />
            </div>

            <span className="text-sm font-medium text-slate-500">
              Tổng tín chỉ
            </span>
          </div>

          <p className="text-2xl font-bold text-slate-800">
            {totalCredits}
          </p>
        </div>
      </section>

      {/* Bộ lọc */}
      <section className="card-glass p-5 sm:p-6">
        <div className="max-w-md">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Kỳ chương trình
          </label>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">Tất cả kỳ chương trình</option>

            {Array.from({ length: 9 }, (_, index) => index + 1).map(
              (item) => (
                <option key={item} value={item}>
                  Kỳ chương trình {item}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {/* Danh sách môn */}
      <section className="card-glass overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Lộ trình môn học
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Khung chương trình {curriculumCode}
              {semester !== 'all'
                ? ` • Kỳ chương trình ${semester}`
                : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-100"
          >
            <Plus size={17} />
            Thêm môn
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mã môn
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tên môn học
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tín chỉ
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kỳ chương trình
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Môn tiên quyết
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="border-b border-slate-50 transition hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4">
                    <span className="font-semibold text-orange-600">
                      {subject.code}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-700">
                      {subject.name}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="font-semibold text-slate-700">
                      {subject.credits}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      Kỳ {subject.semester}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {subject.prerequisite}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(subject)}
                        title="Sửa môn học"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-500"
                      >
                        <Edit3 size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(subject)}
                        title="Xóa môn học"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSubjects.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Không có môn học trong kỳ chương trình này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal thêm / sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingSubject
                    ? 'Chỉnh sửa môn học'
                    : 'Thêm môn học'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingSubject
                    ? 'Cập nhật thông tin môn học trong khung chương trình.'
                    : 'Thêm môn học vào khung chương trình.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mã môn học
                  </label>

                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: PRF192"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Số tín chỉ
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        credits: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: 3"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tên môn học
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên môn học"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kỳ chương trình
                  </label>

                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        semester: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {Array.from(
                      { length: 9 },
                      (_, index) => index + 1,
                    ).map((item) => (
                      <option key={item} value={item}>
                        Kỳ {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Môn tiên quyết
                  </label>

                  <input
                    type="text"
                    value={formData.prerequisite}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prerequisite: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: PRF192"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  {editingSubject
                    ? 'Lưu thay đổi'
                    : 'Thêm môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationCurriculumPlan;