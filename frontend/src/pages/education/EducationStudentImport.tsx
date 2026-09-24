import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Download,
  Link2,
  Plus,
  X,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

interface StudentRow {
  studentCode: string;
  accountId: string | null;
  fullName: string;
  curriculum: string;
  cohort: string;
  currentTerm: string;
  gpa: string;
  credits: string;
  status: string;
  mappingStatus: 'Đã khớp' | 'Chưa khớp';
}

const mockStudents: StudentRow[] = [
  {
    studentCode: 'SE161234',
    accountId: 'SE161234',
    fullName: 'Nguyễn Thành Phương',
    curriculum: 'IS',
    cohort: 'K16D-19A',
    currentTerm: 'Kỳ 5',
    gpa: '3.42',
    credits: '112',
    status: 'Đang học',
    mappingStatus: 'Đã khớp',
  },
  {
    studentCode: 'SE161458',
    accountId: 'SE161458',
    fullName: 'Phan Lan Anh',
    curriculum: 'IS',
    cohort: 'K16D-19A',
    currentTerm: 'Kỳ 5',
    gpa: '3.18',
    credits: '108',
    status: 'Đang học',
    mappingStatus: 'Đã khớp',
  },
  {
    studentCode: 'SE161789',
    accountId: null,
    fullName: 'Trần Hùng Dũng',
    curriculum: 'IS',
    cohort: 'K16D-19B',
    currentTerm: 'Kỳ 4',
    gpa: '2.95',
    credits: '91',
    status: 'Đang học',
    mappingStatus: 'Chưa khớp',
  },
];

const EMPTY_STUDENT_FORM = {
  studentCode: '',
  accountId: '',
  fullName: '',
  curriculum: '',
  cohort: '',
  currentTerm: '',
  gpa: '',
  credits: '',
  status: 'Đang học',
};

export const EducationStudentImport: React.FC = () => {
  const [selectedFile, setSelectedFile] =
    React.useState<File | null>(null);

  const [isImported, setIsImported] = React.useState(false);

  const [students, setStudents] = React.useState<StudentRow[]>([]);

  const [showAddStudentModal, setShowAddStudentModal] =
    React.useState(false);

  const [studentForm, setStudentForm] =
    React.useState(EMPTY_STUDENT_FORM);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setIsImported(false);
  };

  const handleImport = () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file dữ liệu sinh viên.');
      return;
    }

    // UI mock:
    // Sau này dữ liệu thật sẽ được parse từ Excel/CSV.
    // Hiện tại dùng mockStudents để mô phỏng danh sách sau khi import.
    setStudents(mockStudents);
    setIsImported(true);
  };

  const handleConfirmImport = () => {
    alert(
      'UI mock: danh sách sinh viên đã được xác nhận và sẵn sàng cập nhật vào hệ thống.',
    );
  };

  const handleOpenAddStudent = () => {
    setStudentForm(EMPTY_STUDENT_FORM);
    setShowAddStudentModal(true);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudentModal(false);
    setStudentForm(EMPTY_STUDENT_FORM);
  };

  const handleSaveStudent = () => {
    const studentCode = studentForm.studentCode.trim();
    const fullName = studentForm.fullName.trim();

    if (!studentCode || !fullName) {
      alert('Vui lòng nhập MSSV và họ tên sinh viên.');
      return;
    }

    const duplicated = students.some(
      (student) =>
        student.studentCode.toLowerCase() === studentCode.toLowerCase(),
    );

    if (duplicated) {
      alert('MSSV này đã tồn tại.');
      return;
    }

    const accountId = studentForm.accountId.trim();

    const newStudent: StudentRow = {
      studentCode,
      accountId: accountId || null,
      fullName,
      curriculum: studentForm.curriculum.trim(),
      cohort: studentForm.cohort.trim(),
      currentTerm: studentForm.currentTerm.trim(),
      gpa: studentForm.gpa.trim(),
      credits: studentForm.credits.trim(),
      status: studentForm.status.trim() || 'Đang học',
      mappingStatus: accountId ? 'Đã khớp' : 'Chưa khớp',
    };

    setStudents((current) => [...current, newStudent]);
    setIsImported(true);
    handleCloseAddStudent();
  };

  const totalStudents = students.length;

  const validStudents = students.filter(
    (student) =>
      student.studentCode.trim() &&
      student.fullName.trim(),
  ).length;

  const mappedStudents = students.filter(
    (student) => student.mappingStatus === 'Đã khớp',
  ).length;

  const needReviewStudents = students.filter(
    (student) => student.mappingStatus === 'Chưa khớp',
  ).length;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Import dữ liệu sinh viên"
        description="Nhập dữ liệu học vụ sinh viên từ dữ liệu nhà trường để phục vụ quản lý tiến độ và điều kiện OJT."
        badge="Quản lý dữ liệu"
      />

      {/* ==================== CHỌN FILE ==================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Nhập dữ liệu sinh viên
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Chọn file dữ liệu học vụ hoặc thêm từng sinh viên thủ công vào hệ thống.
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <FileSpreadsheet
            size={40}
            className="mx-auto mb-3 text-emerald-500"
          />

          <p className="text-sm font-semibold text-slate-700">
            Chọn file dữ liệu sinh viên
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Hỗ trợ file Excel (.xlsx, .xls) hoặc CSV
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600">
              <Upload size={17} />
              Chọn file

              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              <Plus size={17} />
              Thêm sinh viên
            </button>
          </div>

          {selectedFile && (
            <div className="mx-auto mt-5 flex max-w-xl items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
              <div className="flex items-center gap-3">
                <FileSpreadsheet
                  size={22}
                  className="text-emerald-500"
                />

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <CheckCircle2
                size={20}
                className="text-emerald-500"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            onClick={() =>
              alert('UI mock: tải file mẫu dữ liệu sinh viên.')
            }
          >
            <Download size={17} />
            Tải file mẫu
          </button>

          <button
            type="button"
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Upload size={17} />
            Kiểm tra dữ liệu
          </button>
        </div>
      </section>

      {/* ==================== KẾT QUẢ KIỂM TRA ==================== */}
      {isImported && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Tổng dữ liệu */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Tổng dữ liệu
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {totalStudents}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>
              </div>
            </div>

            {/* Dữ liệu hợp lệ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Dữ liệu hợp lệ
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {validStudents}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </div>

            {/* Mapping thành công */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Mapping tài khoản
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {mappedStudents}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Link2 size={21} />
                </div>
              </div>
            </div>

            {/* Cần xử lý */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Cần xử lý
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {needReviewStudents}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={21} />
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PREVIEW ==================== */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Xem trước dữ liệu
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Danh sách sinh viên được thêm thủ công hoặc import từ file.
                  Kiểm tra lại dữ liệu trước khi xác nhận.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Đã kiểm tra
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      MSSV
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Họ tên
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Tài khoản
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Mapping
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Chương trình
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Khóa / Lớp
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Kỳ hiện tại
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      GPA
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Tín chỉ
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.map((student) => (
                    <tr key={student.studentCode}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {student.studentCode}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {student.fullName}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.accountId ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        {student.mappingStatus === 'Đã khớp' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={13} />
                            Đã khớp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <AlertTriangle size={13} />
                            Chưa khớp
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.curriculum}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.cohort}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.currentTerm}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.gpa}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.credits}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          <CheckCircle2 size={13} />
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dữ liệu cần xử lý */}
            {needReviewStudents > 0 ? (
              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-700">
                      {needReviewStudents} dữ liệu cần xử lý
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      Một số sinh viên chưa mapping được với tài khoản
                      tương ứng. Vui lòng kiểm tra lại trước khi xác nhận.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Danh sách đã sẵn sàng để xác nhận
                    </p>

                    <p className="mt-1 text-xs text-emerald-700">
                      Không có sinh viên nào đang ở trạng thái chưa khớp tài khoản.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Xác nhận */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={17} />
                Xác nhận danh sách
              </button>
            </div>
          </section>
        </>
      )}

      {/* ==================== THÊM SINH VIÊN ==================== */}
      {showAddStudentModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={handleCloseAddStudent}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Thêm sinh viên
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Nhập thủ công thông tin học vụ của một sinh viên.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseAddStudent}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    MSSV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentForm.studentCode}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        studentCode: event.target.value,
                      }))
                    }
                    placeholder="VD: SE161234"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentForm.fullName}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Nhập họ tên sinh viên"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tài khoản sinh viên
                  </label>
                  <input
                    type="text"
                    value={studentForm.accountId}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        accountId: event.target.value,
                      }))
                    }
                    placeholder="VD: SE161234"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Chương trình
                  </label>
                  <input
                    type="text"
                    value={studentForm.curriculum}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        curriculum: event.target.value,
                      }))
                    }
                    placeholder="VD: IS"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Khóa / Lớp
                  </label>
                  <input
                    type="text"
                    value={studentForm.cohort}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        cohort: event.target.value,
                      }))
                    }
                    placeholder="VD: K16D-19A"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kỳ hiện tại
                  </label>
                  <input
                    type="text"
                    value={studentForm.currentTerm}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        currentTerm: event.target.value,
                      }))
                    }
                    placeholder="VD: Kỳ 5"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    GPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={studentForm.gpa}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        gpa: event.target.value,
                      }))
                    }
                    placeholder="VD: 3.42"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tín chỉ
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studentForm.credits}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        credits: event.target.value,
                      }))
                    }
                    placeholder="VD: 112"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Trạng thái
                  </label>
                  <select
                    value={studentForm.status}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseAddStudent}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveStudent}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <Plus size={17} />
                Thêm sinh viên
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EducationStudentImport;