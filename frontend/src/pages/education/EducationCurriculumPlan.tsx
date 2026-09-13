import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, LockKeyhole } from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

type CurriculumStatus = 'Đã hoàn thành' | 'Chưa hoàn thành';

interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  prerequisite: string;
  status: CurriculumStatus;
}

const MOCK_CURRICULUM: CurriculumSubject[] = [
  {
    id: '1',
    code: 'PRF192',
    name: 'Lập trình cơ bản',
    credits: 3,
    semester: 1,
    prerequisite: 'Không có',
    status: 'Đã hoàn thành',
  },
  {
    id: '2',
    code: 'MAE101',
    name: 'Toán cho kỹ thuật',
    credits: 3,
    semester: 1,
    prerequisite: 'Không có',
    status: 'Đã hoàn thành',
  },
  {
    id: '3',
    code: 'PRO192',
    name: 'Lập trình hướng đối tượng',
    credits: 3,
    semester: 2,
    prerequisite: 'PRF192',
    status: 'Đã hoàn thành',
  },
  {
    id: '4',
    code: 'DBI202',
    name: 'Cơ sở dữ liệu',
    credits: 3,
    semester: 3,
    prerequisite: 'PRO192',
    status: 'Chưa hoàn thành',
  },
  {
    id: '5',
    code: 'SWP391',
    name: 'Dự án phần mềm',
    credits: 5,
    semester: 6,
    prerequisite: 'DBI202',
    status: 'Chưa hoàn thành',
  },
];

const STATUS_STYLES: Record<CurriculumStatus, string> = {
  'Đã hoàn thành':
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Chưa hoàn thành':
    'bg-slate-100 text-slate-600 border border-slate-200',
};

const EducationCurriculumPlan: React.FC = () => {
  const [major, setMajor] = useState('Hệ thống thông tin');
  const [semester, setSemester] = useState('all');

  const filteredSubjects = useMemo(() => {
    if (semester === 'all') {
      return MOCK_CURRICULUM;
    }

    return MOCK_CURRICULUM.filter(
      (subject) => subject.semester === Number(semester),
    );
  }, [semester]);

  const totalCredits = MOCK_CURRICULUM.reduce(
    (total, subject) => total + subject.credits,
    0,
  );

  return (
    <div className="space-y-6">
      <PageBanner
        title="Quản lý Khung Chương trình Đào tạo"
        description="Cấu hình lộ trình môn học và điều kiện tiên quyết theo từng chuyên ngành."
        badge="Khung chương trình"
      />

      {/* Bộ lọc chương trình */}
      <section className="card-glass p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Chuyên ngành
            </label>

            <select
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="Hệ thống thông tin">Hệ thống thông tin</option>
              <option value="Kỹ thuật phần mềm">Kỹ thuật phần mềm</option>
              <option value="An toàn thông tin">An toàn thông tin</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Học kỳ
            </label>

            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="3">Học kỳ 3</option>
              <option value="4">Học kỳ 4</option>
              <option value="5">Học kỳ 5</option>
              <option value="6">Học kỳ 6</option>
            </select>
          </div>
        </div>
      </section>

      {/* Thông tin tổng quan */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass p-5">
          <p className="text-sm text-slate-500">Chuyên ngành</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{major}</p>
        </div>

        <div className="card-glass p-5">
          <p className="text-sm text-slate-500">Số môn trong khung</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {MOCK_CURRICULUM.length}
          </p>
        </div>

        <div className="card-glass p-5">
          <p className="text-sm text-slate-500">Tổng tín chỉ</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {totalCredits}
          </p>
        </div>
      </section>

      {/* Danh sách môn học */}
      <section className="card-glass overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Lộ trình môn học
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Các môn học và điều kiện tiên quyết trong chương trình.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Môn học
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tín chỉ
                </th>

                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Học kỳ
                </th>

                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Môn tiên quyết
                </th>

                <th className="text-center px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-orange-500" />
                      </div>

                      <div>
                        <div className="font-semibold text-slate-800">
                          {subject.name}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {subject.code}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center text-sm text-slate-700">
                    {subject.credits}
                  </td>

                  <td className="px-4 py-4 text-center text-sm text-slate-700">
                    HK {subject.semester}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {subject.prerequisite !== 'Không có' && (
                        <LockKeyhole className="w-4 h-4 text-slate-400" />
                      )}

                      <span>{subject.prerequisite}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLES[subject.status]}`}
                    >
                      {subject.status === 'Đã hoàn thành' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}

                      {subject.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredSubjects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Không có môn học trong học kỳ này.
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

export default EducationCurriculumPlan;