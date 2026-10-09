import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';

interface ExtractionKpiCardsProps {
  totalFiles?: number;
  validCount: number;
  reviewCount: number;
  errorCount: number;
  totalQuota: number;
}

export const ExtractionKpiCards: React.FC<ExtractionKpiCardsProps> = ({
  totalFiles = 58,
  validCount,
  reviewCount,
  errorCount,
  totalQuota,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* Card 1: Tổng số file */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
          <FileText size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 leading-none">{totalFiles}</span>
          <p className="text-xs text-slate-500 font-medium mt-1">Tổng số file</p>
        </div>
      </div>

      {/* Card 2: Đủ dữ liệu */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-emerald-700 leading-none">
            {validCount + 34}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">Đủ dữ liệu</p>
        </div>
      </div>

      {/* Card 3: Thẻ TÍM - Chỉ tiêu Quota OJT (Đồng bộ theo yêu cầu) */}
      <div className="p-4 rounded-2xl bg-white border border-purple-100/90 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-white to-purple-50/30">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-purple-700 leading-none">{totalQuota}</span>
          <p className="text-xs text-slate-500 font-medium mt-1">Chỉ tiêu Quota OJT</p>
        </div>
      </div>

      {/* Card 4: Cần kiểm tra */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <AlertTriangle size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-amber-700 leading-none">
            {reviewCount + 10}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">Cần kiểm tra</p>
        </div>
      </div>

      {/* Card 5: Lỗi trích xuất */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
          <XCircle size={22} />
        </div>
        <div>
          <span className="text-2xl font-black text-rose-700 leading-none">
            {errorCount + 3}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">Lỗi trích xuất</p>
        </div>
      </div>
    </div>
  );
};

export default ExtractionKpiCards;
