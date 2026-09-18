import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Users, Search, CheckCircle2, XCircle, FileText, Calendar, Filter } from 'lucide-react';
import { MOCK_ENTERPRISE_CANDIDATES } from '@/data/enterprise/mockEnterpriseData';
import { EnterpriseCandidate, CandidateStatus } from '@/types/enterprise/enterpriseTypes';

export const EnterpriseCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<EnterpriseCandidate[]>(MOCK_ENTERPRISE_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<EnterpriseCandidate | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredCandidates = candidates.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.appliedRole.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (id: string, newStatus: CandidateStatus) => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedCandidate?.id === id) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }
    const statusText =
      newStatus === 'ACCEPTED'
        ? 'tiếp nhận'
        : newStatus === 'REJECTED'
        ? 'từ chối'
        : newStatus === 'INTERVIEWING'
        ? 'mời phỏng vấn'
        : 'cập nhật';
    setToastMessage(`Đã ${statusText} ứng viên thành công!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Nhận & Duyệt Danh sách Sinh viên Thực tập"
        description="Xem hồ sơ CV, điểm tương thích AI Matching Engine, đặt lịch phỏng vấn và xác nhận hoặc từ chối sinh viên."
        badge="Duyệt Hồ sơ OJT"
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo MSSV, tên sinh viên, vị trí..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xét duyệt</option>
            <option value="INTERVIEWING">Đang phỏng vấn</option>
            <option value="ACCEPTED">Đã chấp nhận tiếp nhận</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Candidates Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Sinh viên</th>
                <th className="px-5 py-3.5">Vị trí ứng tuyển</th>
                <th className="px-5 py-3.5">GPA</th>
                <th className="px-5 py-3.5">AI Match</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                        {c.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          {c.studentCode} • {c.major}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{c.appliedRole}</td>

                  <td className="px-5 py-4 font-bold text-slate-800">{c.gpa}</td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.aiMatchScore}% Match
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        c.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : c.status === 'INTERVIEWING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status === 'ACCEPTED'
                        ? 'Chấp nhận'
                        : c.status === 'REJECTED'
                        ? 'Từ chối'
                        : c.status === 'INTERVIEWING'
                        ? 'Phỏng vấn'
                        : 'Chờ duyệt'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedCandidate(c)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                    >
                      Xem CV
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'ACCEPTED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition-colors"
                    >
                      Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate CV Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-lg">
                  {selectedCandidate.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {selectedCandidate.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    MSSV: {selectedCandidate.studentCode} • Chuyên ngành: {selectedCandidate.major}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Vị trí ứng tuyển</span>
                <p className="font-bold text-slate-900">{selectedCandidate.appliedRole}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Độ phù hợp AI Match</span>
                <p className="font-bold text-emerald-600 text-sm">{selectedCandidate.aiMatchScore}% Phù hợp năng lực</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Điểm GPA tích lũy</span>
                <p className="font-bold text-slate-900">{selectedCandidate.gpa} / 4.0</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Ngày đăng ký nguyện vọng</span>
                <p className="font-bold text-slate-900">{selectedCandidate.appliedDate}</p>
              </div>
            </div>

            {/* Simulated CV PDF Preview */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>CV_SinhVien_{selectedCandidate.studentCode}.pdf</span>
                </div>
                <span className="text-[11px] text-slate-400">Hồ sơ xác thực FPT Edu</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đã hoàn thành các môn chuyên ngành: SWP391, SWR302, PRN231, PRJ301. Thành thạo lập trình ReactJS, TailwindCSS, RESTful API và có tư duy làm việc nhóm linh hoạt.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedCandidate.id, 'INTERVIEWING')}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Mời phỏng vấn</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'REJECTED')}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'ACCEPTED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chấp nhận tiếp nhận OJT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseCandidates;
