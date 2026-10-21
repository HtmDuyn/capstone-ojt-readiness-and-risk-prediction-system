import React, { useState, useEffect } from 'react';
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
  Building2,
  ExternalLink,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { enterpriseService } from '@/service/enterpriseService';
import { EnterpriseProfileData } from '@/types/enterprise/enterpriseTypes';
import { Link } from 'react-router-dom';

export const EnterpriseDashboard: React.FC = () => {
  const [profile, setProfile] = useState<EnterpriseProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState({
    studentId: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await enterpriseService.getProfile();
        if (res && res.success && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Failed to load enterprise profile in dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSendIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Đã gửi báo cáo sự cố về Phòng QHDN Trường FPT thành công!');
    setShowIncidentModal(false);
    setIncidentReport({ studentId: '', severity: 'MEDIUM', title: '', description: '' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const summary = profile?.summary;
  const companyName = profile?.name || 'Doanh nghiệp Đối tác';

  return (
    <div className="space-y-6 pb-12">
      {/* Banner without buttons */}
      <PageBanner
        title={`Cổng Quản lý Thực tập: ${companyName}`}
        description={`Chào mừng ${companyName} (${profile?.code || 'OJT Partner'}). Quản lý các vị trí thực tập, tiếp nhận ứng viên sinh viên và theo dõi tiến độ OJT.`}
        badge={profile?.status === 'ACTIVE' ? 'Đối tác chính thức (ACTIVE)' : 'Doanh nghiệp Đối tác'}
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

      {/* Real Overview Stat Cards from /api/enterprise/profile summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vị trí tuyển OJT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vị trí tuyển OJT đã đăng
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : summary?.publishedPosts ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">vị trí</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Chờ duyệt: <strong>{summary?.pendingPosts ?? 0}</strong> vị trí
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-xs">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Hồ sơ chờ duyệt */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hồ sơ chờ xét duyệt
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : summary?.pendingCandidates ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">ứng viên</span>
            </h3>
            <p className="text-xs text-blue-600 font-medium mt-1">Nguyện vọng vào doanh nghiệp</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Sinh viên đang thực tập */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sinh viên đang thực tập
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : summary?.activeInterns ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">sinh viên</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Đang tiếp nhận OJT</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Đánh giá OJT chờ xử lý */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đánh giá OJT chờ xử lý
            </p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">
              {loading ? '...' : summary?.pendingEvaluations ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">phiếu</span>
            </h3>
            <p className="text-xs text-purple-500 font-medium mt-1">Đánh giá kết thúc kỳ</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Summary overview & Quick Navigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Hồ sơ Sinh viên Chờ duyệt Tiếp nhận */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Sinh viên Chờ duyệt</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinh viên đăng ký OJT nguyện vọng vào doanh nghiệp
                </p>
              </div>
              <Link
                to="/enterprise/candidates"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-6 text-center">
              {summary && summary.pendingCandidates > 0 ? (
                <div className="text-xs text-slate-600">
                  Có <strong>{summary.pendingCandidates}</strong> ứng viên mới cần duyệt hồ sơ.
                  <div className="mt-3">
                    <Link
                      to="/enterprise/candidates"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                    >
                      <span>Vào duyệt hồ sơ ngay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2 text-slate-400">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium text-slate-500">
                    Hiện chưa có hồ sơ ứng viên nào đang chờ duyệt tiếp nhận.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hồ sơ mới đăng ký của sinh viên sẽ tự động hiển thị tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Vị trí Thực tập Đang mở */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Vị trí Thực tập OJT</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách chỉ tiêu tiếp nhận sinh viên thực tập của doanh nghiệp
                </p>
              </div>
              <Link
                to="/enterprise/jobs"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Quản lý vị trí</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-6 text-center">
              {summary && summary.publishedPosts > 0 ? (
                <div className="text-xs text-slate-600">
                  Doanh nghiệp đang mở tuyển <strong>{summary.publishedPosts}</strong> vị trí OJT.
                </div>
              ) : (
                <div className="py-6 space-y-3 text-slate-400">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium text-slate-500">
                    Chưa có vị trí tuyển dụng thực tập nào đang mở.
                  </p>
                  <div>
                    <Link
                      to="/enterprise/jobs"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1 transition-all"
                    >
                      <span>+ Đăng vị trí tuyển mới</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Thao tác nhanh & Thông tin doanh nghiệp */}
        <div className="space-y-6">
          {/* Action Hub Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg space-y-4">
            <h3 className="font-bold text-base flex items-center space-x-2 text-amber-400">
              <TrendingUp className="w-5 h-5" />
              <span>Thao tác Doanh nghiệp</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Các chức năng quản lý chính dành cho cán bộ tuyển dụng & quản lý thực tập tại doanh nghiệp đối tác.
            </p>

            <div className="space-y-2 pt-2">
              <Link
                to="/enterprise/profile"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span>Hồ sơ Doanh nghiệp ({profile?.code || 'TechViet'})</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/jobs"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>+ Đăng vị trí tuyển dụng mới</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/candidates"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Duyệt hồ sơ sinh viên ứng tuyển</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/interns"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Giao nhiệm vụ & Theo dõi thực tập</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/enterprise/evaluation"
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-medium text-white"
              >
                <span>Đánh giá kết quả OJT kết thúc kỳ</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Quick Enterprise Info Card */}
          {profile && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Thông tin liên hệ HR</span>
                <Link
                  to="/enterprise/profile"
                  className="text-orange-600 hover:underline font-semibold text-[11px]"
                >
                  Xem chi tiết
                </Link>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <p>
                  Đại diện: <strong>{profile.contactPersonName}</strong>
                </p>
                <p>
                  Email: <strong>{profile.contactEmail}</strong>
                </p>
                <p>
                  Ngành nghề: <strong>{profile.industry}</strong>
                </p>
              </div>
            </div>
          )}
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
                  Mã hoặc Tên sinh viên phát sinh sự cố
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SE170012 - Phạm Minh Tuấn"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.studentId}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, studentId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ sự cố
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={incidentReport.severity}
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, severity: e.target.value })
                  }
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
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    setIncidentReport({ ...incidentReport, description: e.target.value })
                  }
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
