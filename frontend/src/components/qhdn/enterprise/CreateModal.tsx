import React from 'react';
import { X, Building2, Loader2, AlertCircle } from 'lucide-react';

interface EnterpriseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  address?: string;
  setAddress?: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  contact: string;
  setContact: (v: string) => void;
  phone?: string;
  setPhone?: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  status?: string;
  setStatus?: (v: string) => void;
  reason?: string;
  setReason?: (v: string) => void;
  quota: number;
  setQuota: (v: number) => void;
  semesters: string[];
  setSemesters: (v: string[]) => void;
  availableSemesters?: string[];
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const EnterpriseCreateModal: React.FC<EnterpriseCreateModalProps> = ({
  isOpen,
  onClose,
  name,
  setName,
  code,
  setCode,
  address = '',
  setAddress,
  industry,
  setIndustry,
  contact,
  setContact,
  phone = '',
  setPhone,
  email,
  setEmail,
  status = 'ACTIVE',
  setStatus,
  reason = '',
  setReason,
  quota,
  setQuota,
  semesters,
  setSemesters,
  availableSemesters,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-orange-500" />
              Thêm Doanh nghiệp Đối tác Mới
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo mới doanh nghiệp đối tác vào hệ thống qua API <code className="text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-mono">POST /api/companies</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            aria-label="Đóng popup thêm doanh nghiệp"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={onSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tên Doanh nghiệp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="VD: Viettel Digital"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mã Doanh nghiệp (Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="VD: VTL-DIGITAL"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs font-mono uppercase disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở</label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="VD: Tòa nhà FPT, Cầu Giấy, Hà Nội"
                value={address}
                onChange={(e) => setAddress?.(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngành nghề</label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="VD: Fintech / CNTT"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Người đại diện (HR)</label>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Họ và tên HR"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="tel"
                disabled={isSubmitting}
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone?.(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email liên hệ hợp tác</label>
              <input
                type="email"
                disabled={isSubmitting}
                placeholder="contact@partner.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái (Status)</label>
              <select
                disabled={isSubmitting}
                value={status}
                onChange={(e) => setStatus?.(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs bg-white disabled:bg-slate-50"
              >
                <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                <option value="INACTIVE">INACTIVE (Tạm ngưng)</option>
                <option value="PENDING">PENDING (Chờ duyệt)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chỉ tiêu Quota OJT (Slots)</label>
              <input
                type="number"
                min={1}
                disabled={isSubmitting}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lý do / Ghi chú tạo doanh nghiệp</label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="VD: Mở rộng đối tác chiến lược ngành AI & CNTT"
              value={reason}
              onChange={(e) => setReason?.(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Học kỳ tiếp nhận (có thể chọn nhiều kỳ liên tiếp)
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(availableSemesters && availableSemesters.length > 0
                ? availableSemesters
                : ['Summer 2026', 'Fall 2026', 'Spring 2026', 'Summer 2025']
              ).map((sem) => (
                <label
                  key={sem}
                  className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80"
                >
                  <input
                    type="checkbox"
                    disabled={isSubmitting}
                    checked={semesters.includes(sem)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSemesters([...semesters, sem]);
                      } else {
                        setSemesters(semesters.filter((s) => s !== sem));
                      }
                    }}
                    className="rounded text-orange-600 focus:ring-orange-400"
                  />
                  {sem}
                </label>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tạo doanh nghiệp...
                </>
              ) : (
                'Xác nhận thêm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterpriseCreateModal;
