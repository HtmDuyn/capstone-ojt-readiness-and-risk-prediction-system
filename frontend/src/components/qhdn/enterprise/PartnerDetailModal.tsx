import React from 'react';
import { X, Users, FileText, MapPin } from 'lucide-react';
import type { EnterprisePartner } from '@/types/qhdn/qhdnTypes';

interface EnterprisePartnerDetailModalProps {
  partner: EnterprisePartner | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EnterprisePartnerDetailModal: React.FC<EnterprisePartnerDetailModalProps> = ({
  partner,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 font-bold text-lg flex items-center justify-center shrink-0 border border-slate-200">
              {partner.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{partner.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã Doanh nghiệp: <strong className="text-slate-800">{partner.code}</strong> |{' '}
                {partner.industry}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng popup chi tiết doanh nghiệp"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quota Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Tổng Quota</span>
            <span className="text-lg font-extrabold text-slate-900">{partner.totalQuota} Slots</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-xs font-medium text-slate-500 block">Đã Tiếp nhận</span>
            <span className="text-lg font-extrabold text-emerald-600">{partner.acceptedCount} SV</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Còn Khả dụng</span>
            <span className="text-lg font-extrabold text-orange-600">
              {partner.availableQuota} Slots
            </span>
          </div>
        </div>

        {/* General Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
              <Users size={16} className="text-slate-600" />
              Đầu mối Liên hệ Hợp tác
            </h4>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Người đại diện:</span>
              <strong className="text-slate-900">{partner.contactPerson}</strong>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Email:</span>
              <span className="text-slate-800">{partner.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Điện thoại:</span>
              <span className="text-slate-800">{partner.contactPhone}</span>
            </div>
          </div>

          <div className="space-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
              <FileText size={16} className="text-slate-600" />
              Thông tin Hợp đồng MOU
            </h4>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Trạng thái MOU:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs">
                {partner.mouStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Kỳ tiếp nhận:</span>
              <span className="font-semibold text-slate-800">
                {(partner.semesters || [partner.semester || 'Summer 2026']).join(' • ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-medium text-slate-400 w-24">Ngày hết hạn:</span>
              <span className="text-slate-800">{partner.mouExpiryDate}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <span className="font-bold text-slate-700 block mb-1">Địa chỉ Trụ sở:</span>
          <p className="text-slate-600 flex items-start gap-1.5">
            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
            {partner.address}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePartnerDetailModal;
