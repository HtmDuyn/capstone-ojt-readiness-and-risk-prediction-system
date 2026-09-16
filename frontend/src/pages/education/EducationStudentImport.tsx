import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Download,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

interface StudentRow {
  studentCode: string;
  fullName: string;
  curriculum: string;
  cohort: string;
  currentTerm: string;
  gpa: string;
  credits: string;
  status: string;
}

const mockStudents: StudentRow[] = [
  {
    studentCode: 'SE161234',
    fullName: 'Nguyễn Thành Phương',
    curriculum: 'IS',
    cohort: 'K18D-19A',
    currentTerm: 'Kỳ 5',
    gpa: '3.42',
    credits: '112',
    status: 'Đang học',
  },
  {
    studentCode: 'SE161458',
    fullName: 'Phan Lan Anh',
    curriculum: 'IS',
    cohort: 'K18D-19A',
    currentTerm: 'Kỳ 5',
    gpa: '3.18',
    credits: '108',
    status: 'Đang học',
  },
  {
    studentCode: 'SE161789',
    fullName: 'Trần Hùng Dũng',
    curriculum: 'IS',
    cohort: 'K18D-19B',
    currentTerm: 'Kỳ 4',
    gpa: '2.95',
    credits: '91',
    status: 'Đang học',
  },
];

export const EducationStudentImport: React.FC = () => {
  const [selectedFile, setSelectedFile] =
    React.useState<File | null>(null);

  const [isImported, setIsImported] = React.useState(false);

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

    setIsImported(true);
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Import dữ liệu sinh viên"
        description="Nhập dữ liệu học vụ sinh viên từ dữ liệu nhà trường để phục vụ quản lý tiến độ và điều kiện OJT."
        badge="Quản lý dữ liệu"
      />

      {/* Chọn file */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Nhập dữ liệu sinh viên
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Chọn file dữ liệu học vụ sinh viên để nhập vào hệ thống.
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

          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600">
            <Upload size={17} />
            Chọn file
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

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

      {/* Kết quả kiểm tra */}
      {isImported && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Tổng dữ liệu
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    1,248
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Dữ liệu hợp lệ
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    1,240
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
                    Dữ liệu cần kiểm tra
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-600">
                    8
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={21} />
                </div>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Xem trước dữ liệu
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Kiểm tra dữ liệu sinh viên trước khi xác nhận import.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Đã kiểm tra
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      MSSV
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Họ tên
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
                  {mockStudents.map((student) => (
                    <tr key={student.studentCode}>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {student.studentCode}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {student.fullName}
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

            {/* Dữ liệu lỗi */}
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex gap-3">
                <XCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    8 dòng dữ liệu cần kiểm tra
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Một số dữ liệu trong file chưa hợp lệ và cần được kiểm tra trước khi import.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  alert(
                    'UI mock: dữ liệu sinh viên đã được xác nhận import.',
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={17} />
                Xác nhận import
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default EducationStudentImport;