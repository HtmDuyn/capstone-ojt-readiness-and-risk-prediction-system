import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  GraduationCap,
  Search,
  XCircle,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

type GraduationStatus =
  | 'Đủ điều kiện'
  | 'Chưa đủ điều kiện'
  | 'Chờ xét';

interface StudentGraduation {
  id: number;
  studentCode: string;
  fullName: string;
  gpa: number;
  credits: number;
  english: boolean;
  capstone: boolean;
  ojt: boolean;
  status: GraduationStatus;
}

const MOCK_STUDENTS: StudentGraduation[] = [
  {
    id: 1,
    studentCode: 'SE170001',
    fullName: 'Nguyễn Văn An',
    gpa: 3.12,
    credits: 130,
    english: true,
    capstone: true,
    ojt: true,
    status: 'Đủ điều kiện',
  },
  {
    id: 2,
    studentCode: 'SE170002',
    fullName: 'Trần Minh Anh',
    gpa: 2.75,
    credits: 124,
    english: true,
    capstone: true,
    ojt: true,
    status: 'Chưa đủ điều kiện',
  },
  {
    id: 3,
    studentCode: 'SE170003',
    fullName: 'Lê Hoàng Nam',
    gpa: 3.35,
    credits: 132,
    english: true,
    capstone: false,
    ojt: true,
    status: 'Chờ xét',
  },
  {
    id: 4,
    studentCode: 'SE170004',
    fullName: 'Phạm Minh Đức',
    gpa: 2.45,
    credits: 118,
    english: false,
    capstone: false,
    ojt: true,
    status: 'Chưa đủ điều kiện',
  },
];

const STATUS_OPTIONS = [
  'Tất cả',
  'Đủ điều kiện',
  'Chưa đủ điều kiện',
  'Chờ xét',
] as const;

const EducationGraduationReview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>('Tất cả');

  const filteredStudents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return MOCK_STUDENTS.filter((student) => {
      const matchesSearch =
        !keyword ||
        student.studentCode.toLowerCase().includes(keyword) ||
        student.fullName.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'Tất cả' ||
        student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalStudents = MOCK_STUDENTS.length;

  const eligibleStudents = MOCK_STUDENTS.filter(
    (student) => student.status === 'Đủ điều kiện'
  ).length;

  const pendingStudents = MOCK_STUDENTS.filter(
    (student) => student.status === 'Chờ xét'
  ).length;

  const ineligibleStudents = MOCK_STUDENTS.filter(
    (student) => student.status === 'Chưa đủ điều kiện'
  ).length;

  const renderStatus = (status: GraduationStatus) => {
    if (status === 'Đủ điều kiện') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 opacity-100">
          <CheckCircle2 size={14} />
          {status}
        </span>
      );
    }

    if (status === 'Chờ xét') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 opacity-100">
          <Clock3 size={14} />
          {status}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 opacity-100">
        <XCircle size={14} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 opacity-100">

      {/* Banner */}
      <PageBanner
        title="Xét Tốt nghiệp & Hoàn tất Capstone"
        description="Tổng hợp kết quả học tập, OJT, đồ án tốt nghiệp và chuẩn đầu ra của sinh viên."
        badge="Phòng Đào tạo"
      />

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 opacity-100">

        {/* Tổng sinh viên */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng sinh viên
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 opacity-100">
              <GraduationCap
                size={24}
                className="text-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Đủ điều kiện */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Đủ điều kiện
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {eligibleStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 opacity-100">
              <CheckCircle2
                size={24}
                className="text-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Chờ xét */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Chờ xét
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {pendingStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 opacity-100">
              <Clock3
                size={24}
                className="text-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Chưa đủ điều kiện */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Chưa đủ điều kiện
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {ineligibleStudents}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 opacity-100">
              <XCircle
                size={24}
                className="text-red-500"
              />
            </div>
          </div>
        </div>

      </section>

      {/* Student List */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm opacity-100">

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh sách xét tốt nghiệp
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kiểm tra điều kiện tốt nghiệp của sinh viên.
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã SV hoặc họ tên..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 opacity-100 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as (typeof STATUS_OPTIONS)[number]
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 opacity-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto opacity-100">
          <table className="w-full min-w-[1000px] text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Sinh viên
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  GPA
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Tín chỉ
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Tiếng Anh
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Capstone
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  OJT
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase text-slate-500">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {student.fullName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {student.studentCode}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {student.gpa.toFixed(2)}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {student.credits}
                  </td>

                  <td className="px-5 py-4">
                    {student.english ? (
                      <CheckCircle2
                        size={19}
                        className="text-emerald-500"
                      />
                    ) : (
                      <XCircle
                        size={19}
                        className="text-red-500"
                      />
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {student.capstone ? (
                      <CheckCircle2
                        size={19}
                        className="text-emerald-500"
                      />
                    ) : (
                      <XCircle
                        size={19}
                        className="text-red-500"
                      />
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {student.ojt ? (
                      <CheckCircle2
                        size={19}
                        className="text-emerald-500"
                      />
                    ) : (
                      <XCircle
                        size={19}
                        className="text-red-500"
                      />
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {renderStatus(student.status)}
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </section>
    </div>
  );
};

export default EducationGraduationReview;