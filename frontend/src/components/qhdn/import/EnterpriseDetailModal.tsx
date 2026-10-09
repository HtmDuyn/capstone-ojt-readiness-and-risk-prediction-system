import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ExternalLink,
  Layers,
  Calendar,
  Briefcase,
  Plus,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { ExtractedEnterprise } from '@/types/qhdn/qhdnTypes';

interface EnterpriseDetailModalProps {
  enterprise: ExtractedEnterprise | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ExtractedEnterprise) => void;
}

export const EnterpriseDetailModal: React.FC<EnterpriseDetailModalProps> = ({
  enterprise,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ExtractedEnterprise | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'semester' | 'positions' | 'account'>('info');

  useEffect(() => {
    if (enterprise) {
      setFormData({ ...enterprise });
      setActiveTab('info');
    }
  }, [enterprise]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSaveDraft = () => {
    onSave(formData);
    alert('Đã lưu nháp thông tin doanh nghiệp!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Nút đóng (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          aria-label="Đóng popup chi tiết"
        >
          <X size={20} />
        </button>

        {/* Header Card (Hình 3) */}
        <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${formData.logoBg} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs`}
            >
              {formData.logoText}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {formData.statusText}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span>
                  File gốc:{' '}
                  <strong className="text-slate-700">{formData.fileName}</strong> (
                  {formData.fileSize})
                </span>
                <button
                  type="button"
                  onClick={() => alert(`Xem tài liệu gốc: ${formData.fileName}`)}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  Xem file gốc
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5">
              <Layers size={13} />
              Quota: {formData.quota} SV
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Hình 3) */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tin doanh nghiệp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('semester')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'semester'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kỳ tiếp nhận OJT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'positions'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vị trí OJT ({formData.positionsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tài khoản doanh nghiệp
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab 1: Thông tin doanh nghiệp (Hình 3: Form 2 Cột) */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cột 1: Thông tin cơ bản */}
              <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-3.5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <span>Thông tin cơ bản</span>
                  <span className="text-[11px] font-normal text-slate-400">Trích xuất tự động</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tên doanh nghiệp *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tên viết tắt</label>
                    <input
                      type="text"
                      value={formData.shortName}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lĩnh vực hoạt động</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mô tả</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Cột 2: Thông tin liên hệ & tài khoản */}
              <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-3.5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <span>Thông tin liên hệ & tài khoản</span>
                  <span className="text-[11px] font-normal text-slate-400">Đại diện tuyển dụng HR</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Họ tên liên hệ *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Chức vụ</label>
                    <input
                      type="text"
                      value={formData.contactRole}
                      onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Khung Tài khoản Doanh nghiệp tự động kích hoạt */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check size={12} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Tài khoản doanh nghiệp</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Sẽ được tạo mới
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Hệ thống sẽ tạo tài khoản ENTERPRISE với email này và gửi email kích hoạt.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs text-slate-600 font-semibold">Role:</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      Enterprise
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.createAccount}
                      onChange={(e) =>
                        setFormData({ ...formData, createAccount: e.target.checked })
                      }
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    Tạo tài khoản doanh nghiệp từ email này
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Kỳ tiếp nhận OJT */}
          {activeTab === 'semester' && (
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-white space-y-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                Kỳ tiếp nhận sinh viên thực tập (OJT)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kỳ thực tập áp dụng</label>
                  <input
                    type="text"
                    readOnly
                    value="Fall 2026 (01/09/2026 - 25/12/2026)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Chỉ tiêu Quota tiếp nhận *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quota}
                    onChange={(e) =>
                      setFormData({ ...formData, quota: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Hình thức làm việc</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                    <option>On-site (Tại văn phòng doanh nghiệp)</option>
                    <option>Hybrid (Kết hợp On-site & Remote)</option>
                    <option>Remote (Làm việc từ xa 100%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mức phụ cấp thực tập</label>
                  <input
                    type="text"
                    defaultValue="3.500.000 - 6.000.000 VNĐ / tháng"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Layers size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-purple-900">Quy định phân bổ chỉ tiêu Quota</p>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    Chỉ tiêu tiếp nhận {formData.quota} sinh viên sẽ được dùng làm căn cứ thuật toán phân bổ tự động và điều phối sinh viên phù hợp theo chuyên ngành và điểm số readiness.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Vị trí OJT */}
          {activeTab === 'positions' && (
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase size={16} className="text-orange-500" />
                    Danh sách vị trí thực tập ({formData.positionsCount} vị trí)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trích xuất từ các mô tả công việc (JD) đính kèm trong hồ sơ tiếp nhận
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      positionsCount: formData.positionsCount + 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200/80 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  Thêm vị trí
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Frontend Developer Intern (React / TypeScript)',
                    quota: Math.max(1, Math.floor(formData.quota / 2)),
                    tech: ['React.js', 'TypeScript', 'TailwindCSS'],
                    mentor: 'Trưởng nhóm Frontend',
                  },
                  {
                    title: 'Backend Developer Intern (Node.js / Java)',
                    quota: Math.max(1, Math.ceil(formData.quota / 2)),
                    tech: ['Node.js', 'Spring Boot', 'PostgreSQL', 'Docker'],
                    mentor: 'Senior Backend Engineer',
                  },
                ].map((pos, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{pos.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Mentor phụ trách: {pos.mentor}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-xs font-bold whitespace-nowrap">
                        Chỉ tiêu: {pos.quota} SV
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pos.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Tài khoản doanh nghiệp */}
          {activeTab === 'account' && (
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-white space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Cấu hình tài khoản đối tác doanh nghiệp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email đăng nhập quản trị</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.email || 'hr@doanhnghiep.com'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phân quyền (Role)</label>
                  <input
                    type="text"
                    readOnly
                    value="ENTERPRISE (Doanh nghiệp tiếp nhận OJT)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-emerald-700 font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createAccount}
                    onChange={(e) =>
                      setFormData({ ...formData, createAccount: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  Kích hoạt và cấp quyền quản trị OJT cho doanh nghiệp này
                </label>
                <p className="text-[11px] text-slate-500 pl-5">
                  Sau khi xác nhận import, hệ thống sẽ tự sinh mật khẩu tạm ngẫu nhiên và gửi link kích hoạt qua email HR.
                </p>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 cursor-pointer transition-colors"
            >
              Lưu nháp
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterpriseDetailModal;
