import React, { useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

type EligibilityStatus = 'Đủ điều kiện' | 'Chưa đủ điều kiện' | 'Chờ xét';

interface StudentEligibility {
  id: string;
  studentCode: string;
  fullName: string;
  english: boolean;
  credits: boolean;
  prerequisites: boolean;
  status: EligibilityStatus;
}

const MOCK_STUDENTS: StudentEligibility[] = [
  {
    id: '1',
    studentCode: 'SE170001',
    fullName: 'Nguyễn Văn An',
    english: true,
    credits: true,
    prerequisites: true,
    status: 'Đủ điều kiện',
  },
  {
    id: '2',
    studentCode: 'SE170002',
    fullName: 'Trần Minh Anh',
    english: true,
    credits: true,
    prerequisites: false,
    status: 'Chưa đủ điều kiện',
  },
  {
    id: '3',
    studentCode: 'SE170003',
    fullName: 'Lê Hoàng Nam',
    english: false,
    credits: true,
    prerequisites: true,
    status: 'Chưa đủ điều kiện',
  },
  {
    id: '4',
    studentCode: 'SE170004',
    fullName: 'Phạm Minh Đức',
    english: true,
    credits: true,
    prerequisites: true,
    status: 'Chờ xét',
  },
];

const STATUS_STYLES: Record<EligibilityStatus, string> = {
  'Đủ điều kiện':
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Chưa đủ điều kiện':
    'bg-red-50 text-red-700 border border-red-200',
  'Chờ xét':
    'bg-amber-50 text-amber-700 border border-amber-200',
};

const ConditionIcon: React.FC<{ valid: boolean }> = ({ valid }) => {
  return valid ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  ) : (
    <XCircle className="w-5 h-5 text-red-500" />
  );
};

const EducationOjtEligibility: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EligibilityStatus>(
    'all',
  );

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return MOCK_STUDENTS.filter((student) => {
      const matchesSearch =
        !keyword ||
        student.studentCode.toLowerCase().includes(keyword) ||
        student.fullName.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'all' || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Xét duyệt Điều kiện Sinh viên đi OJT"
        description="Kiểm tra chuẩn đầu ra tiếng Anh, số tín chỉ tích lũy và các môn tiên quyết bắt buộc."
        badge="Kỳ Fall 2024"
      />

      <section className="card-glass p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Danh sách sinh viên
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Kiểm tra điều kiện tham gia OJT của sinh viên.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã SV hoặc họ tên..."
                className="w-full sm:w-64 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'all' | EligibilityStatus,
                )
              }
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đủ điều kiện">Đủ điều kiện</option>
              <option value="Chưa đủ điều kiện">Chưa đủ điều kiện</option>
              <option value="Chờ xét">Chờ xét</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Sinh viên
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tiếng Anh
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tín chỉ
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Môn tiên quyết
                </th>

                <th className="text-center px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">
                      {student.fullName}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {student.studentCode}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <ConditionIcon valid={student.english} />
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <ConditionIcon valid={student.credits} />
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <ConditionIcon valid={student.prerequisites} />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLES[student.status]}`}
                    >
                      {student.status === 'Đủ điều kiện' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      {student.status === 'Chưa đủ điều kiện' && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}

                      {student.status === 'Chờ xét' && (
                        <Clock3 className="w-3.5 h-3.5" />
                      )}

                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
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

export default EducationOjtEligibility;