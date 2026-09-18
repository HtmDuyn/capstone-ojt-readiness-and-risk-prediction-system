import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  MOCK_ENTERPRISE_JOBS,
  MOCK_ENTERPRISE_CANDIDATES,
  MOCK_ENTERPRISE_INTERNS,
} from '@/data/enterprise/mockEnterpriseData';

export const EnterpriseDashboard: React.FC = () => {
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState({
    studentId: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingCandidates = MOCK_ENTERPRISE_CANDIDATES.filter(
    (c) => c.status === 'PENDING'
  );
  const ongoingInterns = MOCK_ENTERPRISE_INTERNS.filter(
    (i) => i.status === 'ONGOING'
  );
  const riskInterns = MOCK_ENTERPRISE_INTERNS.filter(
    (i) => i.status === 'RISK'
  );

  const handleSendIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Đã gửi báo cáo sự cố về Phòng QHDN Trường FPT thành công!');
    setShowIncidentModal(false);
    setIncidentReport({ studentId: '', severity: 'MEDIUM', title: '', description: '' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Cổng Quản lý Thực tập Doanh nghiệp Đối tác"
        description="Chào mừng FPT Software. Quản lý các vị trí thực tập, tiếp nhận ứng viên sinh viên FPT và theo dõi tiến độ OJT."
        badge="FPT Enterprise Partner"
        primaryAction={{
          label: "Gửi báo cáo sự cố",
          onClick: () => setShowIncidentModal(true),
        }}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vị trí tuyển OJT
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {MOCK_ENTERPRISE_JOBS.length} <span className="text-xs text-slate-400 font-normal">vị trí</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Tổng chỉ tiêu: {MOCK_ENTERPRISE_JOBS.reduce((acc, curr) => acc + curr.slotsTotal, 0)} sinh viên
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hồ sơ chờ duyệt
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {pendingCandidates.length} <span className="text-xs text-slate-400 font-normal">ứng viên</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Cần phản hồi trong 48h</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Interns đang thực tập
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {ongoingInterns.length} <span className="text-xs text-slate-400 font-normal">sinh viên</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Hoàn thành TB: 82% task
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cảnh báo tiến độ OJT
            </p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {riskInterns.length} <span className="text-xs text-slate-400 font-normal">sinh viên</span>
            </h3>
            <p className="text-xs text-rose-500 font-medium mt-1">Chậm tiến độ / Vắng nhiều</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hồ sơ sinh viên chờ duyệt & Vị trí tuyển dụng */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Applications Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Sinh viên Chờ duyệt Tiếp nhận</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sinh viên FPT đăng ký OJT nguyện vọng vào doanh nghiệp</p>
              </div>
              <a
                href="/enterprise/candidates"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <div className="divide-y divide-slate-100">
              {MOCK_ENTERPRISE_CANDIDATES.slice(0, 3).map((candidate) => (
                <div key={candidate.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {candidate.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm">{candidate.fullName}</span>
                        <span className="text-xs text-slate-400">({candidate.studentCode})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {candidate.appliedRole} • GPA: <strong className="text-slate-700">{candidate.gpa}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        AI Match: {candidate.aiMatchScore}%
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{candidate.appliedDate}</p>
                    </div>

                    <a
                      href="/enterprise/candidates"
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors"
                    >
                      Xem CV & Duyệt
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Job Postings Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Vị trí Thực tập Đang mở</h3>
                <p className="text-xs text-slate-500 mt-0.5">Danh sách job OJT tuyển sinh viên kỳ này</p>
              </div>
              <a
                href="/enterprise/jobs"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Quản lý vị trí</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_ENTERPRISE_JOBS.map((job) => (
                <div key={job.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{job.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        job.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status === 'OPEN' ? 'Đang tuyển' : 'Đủ chỉ tiêu'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">{job.department}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>Đã nhận: <strong>{job.slotsFilled}/{job.slotsTotal}</strong></span>
                    <span className="text-orange-600 font-semibold">{job.salaryAllowance}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${(job.slotsFilled / job.slotsTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cảnh báo & Tiện ích nhanh */}
        <div className="space-y-6">
          {/* Action Hub Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg space-y-4">
            <h3 className="font-bold text-base flex items-center space-x-2 text-amber-400">
              <TrendingUp className="w-5 h-5" />
              <span>Thao tác Nhanh Doanh nghiệp</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Các quy trình làm việc chính dành cho cán bộ tuyển dụng & quản lý thực tập tại doanh nghiệp đối tác.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="/enterprise/jobs"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>+ Đăng vị trí tuyển dụng mới</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a
                href="/enterprise/candidates"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Duyệt danh sách tiếp nhận OJT</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a
                href="/enterprise/interns"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Giao nhiệm vụ & Điểm danh tuần</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              <a
                href="/enterprise/evaluation"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Đánh giá kết quả OJT sinh viên</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Risk Warnings Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Sinh viên Cần lưu ý đặc biệt</span>
            </div>

            <div className="space-y-3">
              {riskInterns.map((intern) => (
                <div key={intern.id} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{intern.fullName} ({intern.studentCode})</span>
                    <span className="text-rose-600 font-semibold">Tiến độ {intern.progressPercent}%</span>
                  </div>
                  <p className="text-slate-600">Vị trí: {intern.position}</p>
                  <p className="text-slate-500">Mentor: {intern.mentorName}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowIncidentModal(true)}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors"
                    >
                      Báo cáo sự cố về Trường
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Báo cáo Sự cố Phát sinh về Phòng QHDN</span>
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn sinh viên phát sinh sự cố
                </label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.studentId}
                  onChange={(e) => setIncidentReport({ ...incidentReport, studentId: e.target.value })}
                >
                  <option value="">-- Chọn sinh viên --</option>
                  {MOCK_ENTERPRISE_INTERNS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName} ({i.studentCode}) - {i.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ sự cố
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.severity}
                  onChange={(e) => setIncidentReport({ ...incidentReport, severity: e.target.value })}
                >
                  <option value="LOW">Thấp (Nhắc nhở nội bộ)</option>
                  <option value="MEDIUM">Trung bình (Vắng 3 ngày không phép / Chậm tiến độ)</option>
                  <option value="HIGH">Nghiêm trọng (Vi phạm bảo mật / Tự ý bỏ thực tập)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề báo cáo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sinh viên nghỉ tự do 3 ngày liên tiếp không lý do"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.title}
                  onChange={(e) => setIncidentReport({ ...incidentReport, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết sự việc
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả hoàn cảnh, thái độ và đề xuất phương án xử lý từ phía Doanh nghiệp..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.description}
                  onChange={(e) => setIncidentReport({ ...incidentReport, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo sự cố</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDashboard;
