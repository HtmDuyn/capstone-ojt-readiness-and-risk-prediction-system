import React from 'react';
import {
  X,
  Check,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface ImportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToList: () => void;
  importedCount?: number;
  totalBatchCount?: number;
}

export const ImportSuccessModal: React.FC<ImportSuccessModalProps> = ({
  isOpen,
  onClose,
  onNavigateToList,
  importedCount = 50,
  totalBatchCount = 58,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Đóng thông báo thành công"
        >
          <X size={18} />
        </button>

        {/* Success icon & Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <Check size={32} className="stroke-[3]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Import thành công!</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Đã import {importedCount}/{totalBatchCount} doanh nghiệp
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
            <div className="text-xl font-black text-emerald-700">{importedCount}</div>
            <div className="w-6 h-6 rounded-md bg-emerald-200/60 text-emerald-800 mx-auto flex items-center justify-center">
              <Building2 size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Đã import thành công</p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <div className="text-xl font-black text-blue-700">48</div>
            <div className="w-6 h-6 rounded-md bg-blue-200/60 text-blue-800 mx-auto flex items-center justify-center">
              <Users size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Đã tạo/cập nhật tài khoản</p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center space-y-1">
            <div className="text-xl font-black text-amber-700">4</div>
            <div className="w-6 h-6 rounded-md bg-amber-200/60 text-amber-800 mx-auto flex items-center justify-center">
              <AlertTriangle size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Bị bỏ qua (lỗi)</p>
          </div>

          <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 text-center space-y-1">
            <div className="text-xl font-black text-orange-700">12</div>
            <div className="w-6 h-6 rounded-md bg-orange-200/60 text-orange-800 mx-auto flex items-center justify-center">
              <Clock size={13} />
            </div>
            <p className="text-[10px] text-slate-600 font-medium">Cần bổ sung thông tin</p>
          </div>
        </div>

        {/* Next Steps Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 block">Hành động tiếp theo</span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Đã tạo/cập nhật {importedCount} doanh nghiệp vào hệ thống
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Đã tạo/cập nhật 48 tài khoản doanh nghiệp và gửi email kích hoạt
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Các doanh nghiệp bị lỗi đã được lưu trong danh sách để xử lý sau
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              Bạn có thể xem lại chi tiết trong danh sách doanh nghiệp
            </li>
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateToList}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            Xem danh sách doanh nghiệp
          </button>
          <button
            type="button"
            onClick={onNavigateToList}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSuccessModal;
