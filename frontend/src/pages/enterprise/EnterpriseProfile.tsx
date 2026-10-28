import React, { useState, useEffect } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  User,
  Layers,
  FileCheck2,
  Edit3,
  Save,
} from 'lucide-react';
import { enterpriseService } from '@/services/enterpriseService';
import type { EnterpriseProfileData } from '@/types/enterprise/enterpriseTypes';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { useEnterprise } from '@/contexts/EnterpriseContext';

export const EnterpriseProfile: React.FC = () => {
  const { user: authUser } = useAuth();
  // Dùng EnterpriseContext để lấy profile ban đầu — tránh gọi API lại khi vào trang
  const { profile: contextProfile, loading: contextLoading, reload: reloadContext } = useEnterprise();
  const [profile, setProfile] = useState<EnterpriseProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editIndustry, setEditIndustry] = useState<string>('');
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPositionTitle, setEditPositionTitle] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lấy profile từ context (khi context load xong) — tránh double-fetch
  useEffect(() => {
    if (!contextLoading) {
      setProfile(contextProfile);
      setLoading(false);
      if (contextProfile) {
        setEditCompanyName(contextProfile.name);
        setEditAddress(contextProfile.address || '');
        setEditIndustry(contextProfile.industry || '');
        setEditFullName(authUser?.name || contextProfile.contactPersonName || 'Nguyen Van A');
        setEditPhone(contextProfile.contactPhone || '');
        setEditEmail(contextProfile.contactEmail || '');
        setEditPositionTitle(contextProfile.representative?.positionTitle || '');
      }
    }
  }, [contextProfile, contextLoading, authUser]);

  // Refresh lại profile sau khi cập nhật — gọi cả context reload và cập nhật state cục bộ
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await enterpriseService.getProfile();
      if (response && response.success && response.data) {
        setProfile(response.data);
        setEditCompanyName(response.data.name);
        setEditAddress(response.data.address || '');
        setEditIndustry(response.data.industry || '');
        setEditFullName(authUser?.name || response.data.contactPersonName || 'Nguyen Van A');
        setEditPhone(response.data.contactPhone || '');
        setEditEmail(response.data.contactEmail || '');
        setEditPositionTitle(response.data.representative?.positionTitle || '');
        // Cập nhật context để các component khác cũng dùng profile mới
        void reloadContext();
      } else {
        setError(response.message || 'Không thể tải thông tin hồ sơ doanh nghiệp.');
      }
    } catch (err: any) {
      console.error('Error fetching enterprise profile:', err);
      setError(
        err?.response?.data?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thông tin liên hệ qua PATCH /api/enterprise/profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      setUpdateError('Không tìm thấy hồ sơ doanh nghiệp để cập nhật.');
      return;
    }
    if (!editCompanyName.trim() || !editFullName.trim() || !editEmail.trim()) {
      setUpdateError('Vui lòng nhập tên doanh nghiệp, người đại diện và email liên hệ.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await enterpriseService.updateEnterpriseProfile({
        companyId: profile.id,
        name: editCompanyName.trim(),
        address: editAddress.trim() || null,
        industry: editIndustry.trim() || null,
        contactPersonName: editFullName.trim(),
        contactPhone: editPhone.trim() || null,
        contactEmail: editEmail.trim(),
        positionTitle: editPositionTitle.trim() || null,
      });

      if (res?.success && res.data) {
        setProfile({ ...profile, ...res.data });
        setEditPositionTitle(res.data.representative.positionTitle || '');
        void reloadContext();

        setShowEditModal(false);
        setToastMessage(res.message || 'Cập nhật hồ sơ thành công!');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setUpdateError(res.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error updating enterprise profile:', err);
      setUpdateError(
        err?.response?.data?.message ||
          err?.message ||
          'Đã có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Banner without buttons */}
      <PageBanner
        title="Hồ sơ Doanh nghiệp Đối tác"
        description="Thông tin định danh pháp lý, người đại diện liên hệ và tổng hợp các số liệu thực tế về tuyển dụng và quản lý sinh viên OJT."
        badge="Thông tin Doanh nghiệp"
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Đang tải dữ liệu hồ sơ doanh nghiệp từ máy chủ...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Đã xảy ra lỗi khi tải hồ sơ doanh nghiệp</span>
          </div>
          <p className="text-xs text-rose-600 leading-relaxed">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Success / Profile View */}
      {!loading && profile && (
        <div className="space-y-6">
          {/* Main Profile Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start sm:items-center space-x-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md flex-shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {profile.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs">
                      Mã: {profile.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        profile.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{profile.status === 'ACTIVE' ? 'Đang hoạt động' : profile.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center space-x-2">
                    <span>Lĩnh vực: <strong>{profile.industry}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Gia nhập: {formatDate(profile.createdAt)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditFullName(profile.contactPersonName || authUser?.name || 'Nguyen Van A');
                    setEditPhone(profile.contactPhone || '0909123456');
                    setUpdateError(null);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật hồ sơ</span>
                </button>

                <button
                  onClick={fetchProfile}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Cập nhật dữ liệu mới nhất"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Information Grid: Company Info & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Cột 1: Thông tin Doanh nghiệp */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  <span>Thông tin Doanh nghiệp</span>
                </h3>

                <div className="space-y-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Mã định danh (ID):</span>
                    <span className="font-bold text-slate-800">#{profile.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Mã doanh nghiệp:</span>
                    <span className="font-bold text-slate-900">{profile.code}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Tên doanh nghiệp:</span>
                    <span className="font-bold text-slate-900">{profile.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Ngành nghề / Lĩnh vực:</span>
                    <span className="font-semibold text-slate-800">{profile.industry}</span>
                  </div>
                  <div className="flex items-start justify-between py-1">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Địa chỉ trụ sở:</span>
                    </span>
                    <span className="font-medium text-slate-700 text-right max-w-[220px]">
                      {profile.address || (
                        <span className="text-slate-400 italic">Chưa cập nhật địa chỉ</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cột 2: Thông tin Người đại diện / Đầu mối liên hệ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4 text-orange-600" />
                    <span>Đầu mối Liên hệ & Nhân sự</span>
                  </h3>
                  <button
                    onClick={() => {
                      setEditFullName(profile.contactPersonName || authUser?.name || 'Nguyen Van A');
                      setEditPhone(profile.contactPhone || '0909123456');
                      setUpdateError(null);
                      setShowEditModal(true);
                    }}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center space-x-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>

                <div className="space-y-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Người liên hệ / Bộ phận:</span>
                    <span className="font-bold text-slate-900">{profile.contactPersonName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email liên hệ:</span>
                    </span>
                    <a
                      href={`mailto:${profile.contactEmail}`}
                      className="font-semibold text-orange-600 hover:underline"
                    >
                      {profile.contactEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Số điện thoại:</span>
                    </span>
                    <span className="font-bold text-slate-800">
                      {profile.contactPhone || (
                        <span className="text-slate-400 font-normal italic">Chưa cập nhật SĐT</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Trạng thái hợp tác:</span>
                    <span className="font-bold text-emerald-600">Đang hoạt động (ACTIVE)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày tạo hồ sơ:</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Số liệu thực tế từ API (summary) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-orange-600" />
                  <span>Tổng quan Hoạt động OJT</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số liệu cập nhật theo thời gian thực từ cơ sở dữ liệu hệ thống
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold self-start sm:self-auto">
                Phạm vi: {profile.summary?.scope === 'ALL_SEMESTERS' ? 'Tất cả các học kỳ' : profile.summary?.scope}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {/* Pending Candidates */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Hồ sơ chờ duyệt
                </span>
                <span className="text-2xl font-black text-blue-600 block">
                  {profile.summary?.pendingCandidates ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Ứng viên mới
                </span>
              </div>

              {/* Active Interns */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  SV đang thực tập
                </span>
                <span className="text-2xl font-black text-orange-600 block">
                  {profile.summary?.activeInterns ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Đang làm việc OJT
                </span>
              </div>

              {/* Pending Evaluations */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Đánh giá chờ xử lý
                </span>
                <span className="text-2xl font-black text-purple-600 block">
                  {profile.summary?.pendingEvaluations ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Phiếu đánh giá OJT
                </span>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Truy cập nhanh:</span>
              <Link
                to="/enterprise/candidates"
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Duyệt Hồ sơ Ứng viên</span>
              </Link>
              <Link
                to="/enterprise/interns"
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Theo dõi & Giao Task Interns</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT HỒ SƠ: PATCH /api/enterprise/profile */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-amber-50/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Cập nhật Hồ sơ Doanh nghiệp
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cập nhật thông tin doanh nghiệp và người đại diện
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {updateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              {/* Company name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lĩnh vực</label>
                <input
                  type="text"
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Contact email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* fullName */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên người đại diện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyen Van A"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ người đại diện
                </label>
                <input
                  type="text"
                  value={editPositionTitle}
                  onChange={(e) => setEditPositionTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0909123456"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseProfile;
