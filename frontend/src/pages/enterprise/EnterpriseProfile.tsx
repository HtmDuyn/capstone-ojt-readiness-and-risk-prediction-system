import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageBanner } from '@/components/common/PageBanner';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  User,
  Edit3,
  X,
  Save,
  Check,
} from 'lucide-react';
import { enterpriseService } from '@/services/enterpriseService';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { useAuth } from '@/hooks/shared/useAuth';
import { useEnterprise } from '@/contexts/EnterpriseContext';

export const EnterpriseProfile: React.FC = () => {
  const { user: authUser } = useAuth();
  const { profile, loading, error, reload, updateProfile } = useEnterprise();

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

  useEffect(() => {
    if (!showEditModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showEditModal]);

  useEffect(() => {
    if (!showEditModal || isUpdating) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowEditModal(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showEditModal, isUpdating]);

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
        updateProfile(res.data);

        setShowEditModal(false);
        setToastMessage(res.message || 'Cập nhật hồ sơ thành công!');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setUpdateError(friendlyErrorMessage(res.message, 'Không thể cập nhật hồ sơ. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      console.error('Error updating enterprise profile:', err);
      setUpdateError(friendlyErrorMessage(err, 'Đã xảy ra lỗi khi cập nhật hồ sơ. Vui lòng thử lại.'));
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
        variant="enterprise"
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
            Đang tải hồ sơ doanh nghiệp...
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
            onClick={reload}
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
                      Mã doanh nghiệp: {profile.code}
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

              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    setEditCompanyName(profile.name);
                    setEditAddress(profile.address ?? '');
                    setEditIndustry(profile.industry ?? '');
                    setEditFullName(profile.contactPersonName || authUser?.name || '');
                    setEditPhone(profile.contactPhone ?? '');
                    setEditEmail(profile.contactEmail ?? '');
                    setEditPositionTitle(profile.representative?.positionTitle ?? '');
                    setUpdateError(null);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật hồ sơ</span>
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

        </div>
      )}

      {/* MODAL CẬP NHẬT HỒ SƠ: PATCH /api/enterprise/profile */}
      {showEditModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isUpdating) setShowEditModal(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="enterprise-profile-edit-title" className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 id="enterprise-profile-edit-title" className="text-base font-bold text-slate-900">
                    Chỉnh sửa hồ sơ doanh nghiệp
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Cập nhật thông tin công ty và người đại diện
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ chỉnh sửa hồ sơ"
                disabled={isUpdating}
                onClick={() => setShowEditModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                {updateError && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                <section aria-labelledby="enterprise-edit-company-heading">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <h4 id="enterprise-edit-company-heading" className="text-sm font-bold text-slate-800">Thông tin doanh nghiệp</h4>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                      Tên doanh nghiệp <span className="text-rose-500">*</span>
                      <input type="text" required autoFocus value={editCompanyName} onChange={event=>setEditCompanyName(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                      Địa chỉ
                      <input type="text" value={editAddress} onChange={event=>setEditAddress(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-semibold text-slate-600">
                      Lĩnh vực
                      <input type="text" value={editIndustry} onChange={event=>setEditIndustry(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-semibold text-slate-600">
                      Email liên hệ <span className="text-rose-500">*</span>
                      <input type="email" required value={editEmail} onChange={event=>setEditEmail(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                  </div>
                </section>

                <section aria-labelledby="enterprise-edit-representative-heading">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <User className="h-4 w-4 text-orange-600" />
                    <h4 id="enterprise-edit-representative-heading" className="text-sm font-bold text-slate-800">Người đại diện</h4>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                      Họ và tên người đại diện <span className="text-rose-500">*</span>
                      <input type="text" required placeholder="Ví dụ: Nguyen Van A" value={editFullName} onChange={event=>setEditFullName(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-semibold text-slate-600">
                      Chức vụ
                      <input type="text" value={editPositionTitle} onChange={event=>setEditPositionTitle(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                    <label className="block min-w-0 text-xs font-semibold text-slate-600">
                      Số điện thoại liên hệ
                      <input type="tel" placeholder="Ví dụ: 0909123456" value={editPhone} onChange={event=>setEditPhone(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                    </label>
                  </div>
                </section>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default EnterpriseProfile;
