import React from 'react';
import { X, Building2 } from 'lucide-react';

interface EnterpriseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  semesters: string[];
  setSemesters: (v: string[]) => void;
  industry: string;
  setIndustry: (v: string) => void;
  quota: number;
  setQuota: (v: number) => void;
  contact: string;
  setContact: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EnterpriseCreateModal: React.FC<EnterpriseCreateModalProps> = ({
  isOpen,
  onClose,
  name,
  setName,
  code,
  setCode,
  semesters,
  setSemesters,
  industry,
  setIndustry,
  quota,
  setQuota,
  contact,
  setContact,
  email,
  setEmail,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={20} className="text-orange-500" />
            Thêm Doanh nghiệp Đối tác Mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            aria-label="Đóng popup thêm doanh nghiệp"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Doanh nghiệp *</label>
              <input
                type="text"
                required
                placeholder="VD: Viettel Digital"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã Doanh nghiệp *</label>
              <input
                type="text"
                required
                placeholder="VD: VTL-DIGITAL"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Học kỳ tiếp nhận (có thể chọn nhiều kỳ liên tiếp)
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {['Summer 2026', 'Fall 2026', 'Spring 2026', 'Summer 2025'].map((sem) => (
                <label
                  key={sem}
                  className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80"
                >
                  <input
                    type="checkbox"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngành nghề</label>
              <input
                type="text"
                placeholder="VD: Fintech / CNTT"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chỉ tiêu Quota OJT (Slots)</label>
              <input
                type="number"
                min={1}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Người đại diện (HR)</label>
              <input
                type="text"
                placeholder="Họ và tên HR"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email liên hệ hợp tác</label>
              <input
                type="email"
                placeholder="contact@partner.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              Xác nhận thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterpriseCreateModal;
