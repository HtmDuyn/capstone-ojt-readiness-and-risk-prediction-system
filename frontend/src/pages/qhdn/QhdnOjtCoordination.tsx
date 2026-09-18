import React, { useState } from 'react';
import {
  Handshake,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Sparkles,
  Building2,
  Briefcase,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  X,
  Send,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  MOCK_ELIGIBLE_STUDENTS,
  MOCK_ENTERPRISE_PARTNERS,
  MOCK_INTERNSHIP_POSITIONS,
} from '@/data/qhdnMockData';
import type { EligibleStudent, EnterprisePartner, InternshipPosition } from '@/types/qhdn/qhdnTypes';

export const QhdnOjtCoordination: React.FC = () => {
  const [students, setStudents] = useState<EligibleStudent[]>(MOCK_ELIGIBLE_STUDENTS);
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'Unassigned' | 'Pending Response' | 'Accepted' | 'Interviewing' | 'Rejected'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Re-allocation & Matching Modal state
  const [selectedStudentForMatch, setSelectedStudentForMatch] = useState<EligibleStudent | null>(null);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');

  // Filter students by tab & search
  const filteredStudents = students.filter((std) => {
    const matchesSearch =
      std.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.major.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeFilter === 'ALL' || std.coordinationStatus === activeFilter;
    return matchesSearch && matchesTab;
  });

  const rejectedCount = students.filter((s) => s.coordinationStatus === 'Rejected').length;
  const unassignedCount = students.filter((s) => s.coordinationStatus === 'Unassigned').length;

  // Handle assigning / re-allocating a student
  const handleAssignStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMatch || !selectedEnterpriseId) return;

    const enterprise = MOCK_ENTERPRISE_PARTNERS.find((e) => e.id === selectedEnterpriseId);
    const position = MOCK_INTERNSHIP_POSITIONS.find((p) => p.id === selectedPositionId);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentForMatch.id) {
          return {
            ...s,
            assignedEnterpriseId: enterprise?.id,
            assignedEnterpriseName: enterprise?.name,
            assignedPositionId: position?.id,
            assignedPositionTitle: position?.title || 'Vị trí thực tập OJT',
            coordinationStatus: 'Pending Response',
            rejectionReason: undefined,
            assignedDate: new Date().toISOString().split('T')[0],
          };
        }
        return s;
      })
    );

    setSelectedStudentForMatch(null);
    setSelectedEnterpriseId('');
    setSelectedPositionId('');
  };

  // Filter positions by selected enterprise in modal
  const availablePositionsForSelectedEnterprise = MOCK_INTERNSHIP_POSITIONS.filter(
    (p) => p.enterpriseId === selectedEnterpriseId
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page Banner */}
      <PageBanner
        title="Điều phối & Phân bổ Sinh viên OJT"
        description="Nhận danh sách sinh viên đủ điều kiện từ Phòng Đào tạo, điều phối đến các doanh nghiệp đối tác và xử lý điều phối lại nếu bị từ chối."
        badge="Phòng QHDN"
      />

      {/* Re-allocation Alert Notice */}
      {rejectedCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                Có {rejectedCount} sinh viên bị doanh nghiệp từ chối tiếp nhận
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                Vui lòng ưu tiên xử lý điều phối lại (Re-allocation) sang doanh nghiệp khác để đảm bảo tiến độ OJT.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveFilter('Rejected')}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 shrink-0 cursor-pointer"
          >
            Xem DS bị từ chối ({rejectedCount})
          </button>
        </div>
      )}

      {/* Filter Tabs & Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('Unassigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'Unassigned'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa điều phối ({unassignedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('Pending Response')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'Pending Response'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ DN duyệt
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('Accepted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'Accepted'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã tiếp nhận
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('Rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === 'Rejected'
                ? 'bg-red-500 text-white shadow-xs font-extrabold'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <RefreshCw size={12} />
            Cần điều phối lại ({rejectedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, MSSV, ngành học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      {/* Eligible Students Table */}
      <div className="card-glass overflow-hidden border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Sinh viên OJT</th>
                <th className="p-3.5">Chuyên ngành</th>
                <th className="p-3.5 text-center">Readiness Score</th>
                <th className="p-3.5">Kỹ năng nổi bật</th>
                <th className="p-3.5">Doanh nghiệp phân bổ</th>
                <th className="p-3.5 text-center">Trạng thái tiếp nhận</th>
                <th className="p-3.5 text-right">Thao tác điều phối</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Student Info */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={std.avatarUrl || 'https://via.placeholder.com/40'}
                        alt={std.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{std.fullName}</p>
                        <p className="text-[11px] text-slate-400">MSSV: {std.studentCode} | GPA: {std.gpa}</p>
                      </div>
                    </div>
                  </td>

                  {/* Major */}
                  <td className="p-3.5">
                    <p className="text-slate-800 font-semibold">{std.major}</p>
                    <p className="text-[11px] text-slate-400">{std.englishLevel}</p>
                  </td>

                  {/* Readiness Score */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        std.readinessScore >= 85
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : std.readinessScore >= 75
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {std.readinessScore} / 100
                    </span>
                  </td>

                  {/* Skills */}
                  <td className="p-3.5 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {std.topSkills.map((sk) => (
                        <span key={sk} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md border">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Enterprise Assigned */}
                  <td className="p-3.5">
                    {std.assignedEnterpriseName ? (
                      <div>
                        <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <Building2 size={13} className="text-orange-500" />
                          {std.assignedEnterpriseName}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{std.assignedPositionTitle}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Chưa phân bổ</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-3.5 text-center">
                    {std.coordinationStatus === 'Accepted' && (
                      <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đã tiếp nhận
                      </span>
                    )}
                    {std.coordinationStatus === 'Pending Response' && (
                      <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold inline-flex items-center gap-1">
                        <Clock size={12} /> Chờ DN duyệt
                      </span>
                    )}
                    {std.coordinationStatus === 'Interviewing' && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold inline-flex items-center gap-1">
                        <Users size={12} /> Phỏng vấn
                      </span>
                    )}
                    {std.coordinationStatus === 'Rejected' && (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold inline-flex items-center gap-1">
                        <XCircle size={12} /> DN từ chối
                      </span>
                    )}
                    {std.coordinationStatus === 'Unassigned' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                        Chờ điều phối
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    {std.coordinationStatus === 'Rejected' ? (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForMatch(std)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <RefreshCw size={13} />
                        Điều phối lại
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForMatch(std)}
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Handshake size={13} />
                        {std.assignedEnterpriseName ? 'Thay đổi DN' : 'Phân bổ DN'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MATCHING & RE-ALLOCATION MODAL */}
      {selectedStudentForMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedStudentForMatch.coordinationStatus === 'Rejected'
                      ? 'Quy trình Điều phối lại (Re-allocation)'
                      : 'Điều phối & Ghép cặp Doanh nghiệp OJT'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sinh viên: <strong>{selectedStudentForMatch.fullName}</strong> ({selectedStudentForMatch.studentCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForMatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Student Summary Info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">
                  Chuyên ngành: {selectedStudentForMatch.major} | GPA: {selectedStudentForMatch.gpa}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Kỹ năng: {selectedStudentForMatch.topSkills.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Readiness Score</span>
                <span className="font-extrabold text-orange-600 text-sm">
                  {selectedStudentForMatch.readinessScore} pts
                </span>
              </div>
            </div>

            {selectedStudentForMatch.rejectionReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <strong>Lý do bị từ chối trước đó:</strong> {selectedStudentForMatch.rejectionReason}
              </div>
            )}

            {/* Form Selection */}
            <form onSubmit={handleAssignStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Chọn Doanh nghiệp đối tác tiếp nhận *
                </label>
                <select
                  required
                  value={selectedEnterpriseId}
                  onChange={(e) => {
                    setSelectedEnterpriseId(e.target.value);
                    setSelectedPositionId('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">-- Chọn doanh nghiệp còn chỉ tiêu Quota --</option>
                  {MOCK_ENTERPRISE_PARTNERS.filter((p) => p.availableQuota > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tier}) - Còn trống {p.availableQuota} slots
                    </option>
                  ))}
                </select>
              </div>

              {selectedEnterpriseId && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Chọn Vị trí thực tập đăng ký *
                  </label>
                  <select
                    required
                    value={selectedPositionId}
                    onChange={(e) => setSelectedPositionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">-- Chọn vị trí công việc tuyển dụng --</option>
                    {availablePositionsForSelectedEnterprise.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.title} - Còn {pos.totalSlots - pos.filledSlots} chỗ ({pos.stipend})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* AI Recommendation hint */}
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500 shrink-0" />
                <span>
                  Hệ thống AI Matching khuyến nghị phân bổ sinh viên vào vị trí đúng kỹ năng để đạt tỷ lệ tiếp nhận &gt; 90%.
                </span>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForMatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!selectedEnterpriseId}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} />
                  Gửi yêu cầu tiếp nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnOjtCoordination;
