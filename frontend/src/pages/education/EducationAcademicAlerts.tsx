import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  TrendingDown,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

type RiskLevel = 'Cao' | 'Trung bình' | 'Thấp';

interface AcademicRiskStudent {
  id: string;
  studentCode: string;
  fullName: string;
  gpa: number;
  completedCredits: number;
  failedSubjects: number;
  riskLevel: RiskLevel;
  riskReason: string;
}

const MOCK_RISK_STUDENTS: AcademicRiskStudent[] = [
  {
    id: '1',
    studentCode: 'SE170001',
    fullName: 'Nguyễn Văn An',
    gpa: 2.1,
    completedCredits: 75,
    failedSubjects: 3,
    riskLevel: 'Cao',
    riskReason: 'GPA thấp và còn nhiều môn chưa đạt',
  },
  {
    id: '2',
    studentCode: 'SE170002',
    fullName: 'Trần Minh Anh',
    gpa: 2.65,
    completedCredits: 82,
    failedSubjects: 2,
    riskLevel: 'Trung bình',
    riskReason: 'Còn môn chưa đạt',
  },
  {
    id: '3',
    studentCode: 'SE170003',
    fullName: 'Lê Hoàng Nam',
    gpa: 3.05,
    completedCredits: 90,
    failedSubjects: 1,
    riskLevel: 'Thấp',
    riskReason: 'Có một môn chưa đạt',
  },
  {
    id: '4',
    studentCode: 'SE170004',
    fullName: 'Phạm Minh Đức',
    gpa: 1.95,
    completedCredits: 68,
    failedSubjects: 5,
    riskLevel: 'Cao',
    riskReason: 'Tiến độ tín chỉ thấp và nhiều môn chưa đạt',
  },
];

const RISK_STYLES: Record<RiskLevel, string> = {
  Cao: 'bg-red-50 text-red-700 border border-red-200',
  'Trung bình': 'bg-amber-50 text-amber-700 border border-amber-200',
  Thấp: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const EducationAcademicAlerts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return MOCK_RISK_STUDENTS.filter((student) => {
      const matchesSearch =
        !keyword ||
        student.studentCode.toLowerCase().includes(keyword) ||
        student.fullName.toLowerCase().includes(keyword);

      const matchesRisk =
        riskFilter === 'all' || student.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [search, riskFilter]);

  const highRiskCount = MOCK_RISK_STUDENTS.filter(
    (student) => student.riskLevel === 'Cao',
  ).length;

  const mediumRiskCount = MOCK_RISK_STUDENTS.filter(
    (student) => student.riskLevel === 'Trung bình',
  ).length;

  const lowRiskCount = MOCK_RISK_STUDENTS.filter(
    (student) => student.riskLevel === 'Thấp',
  ).length;

  return (
    <div className="space-y-6">
      <PageBanner
        title="Phân tích AI Cảnh báo Học vụ"
        description="Danh sách sinh viên có nguy cơ trễ tiến độ hoặc gặp vấn đề trong quá trình học tập."
        badge="AI Detection Engine"
      />

      {/* Tổng quan mức độ rủi ro */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rủi ro cao</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {highRiskCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rủi ro trung bình</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {mediumRiskCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rủi ro thấp</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {lowRiskCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Bộ lọc */}
      <section className="card-glass p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Danh sách cảnh báo
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Theo dõi các sinh viên có dấu hiệu rủi ro học vụ.
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
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as 'all' | RiskLevel)
              }
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="Cao">Rủi ro cao</option>
              <option value="Trung bình">Rủi ro trung bình</option>
              <option value="Thấp">Rủi ro thấp</option>
            </select>
          </div>
        </div>
      </section>

      {/* Bảng cảnh báo */}
      <section className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Sinh viên
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  GPA
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tín chỉ
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Môn chưa đạt
                </th>

                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Nguyên nhân
                </th>

                <th className="text-center px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Mức độ
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

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`font-semibold ${
                        student.gpa < 2
                          ? 'text-red-600'
                          : student.gpa < 2.5
                            ? 'text-amber-600'
                            : 'text-slate-700'
                      }`}
                    >
                      {student.gpa.toFixed(2)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center text-sm text-slate-700">
                    {student.completedCredits}
                  </td>

                  <td className="px-4 py-4 text-center text-sm text-slate-700">
                    {student.failedSubjects}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {student.riskReason}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${RISK_STYLES[student.riskLevel]}`}
                    >
                      {student.riskLevel === 'Cao' && (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}

                      {student.riskLevel === 'Trung bình' && (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}

                      {student.riskLevel === 'Thấp' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      {student.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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

export default EducationAcademicAlerts;