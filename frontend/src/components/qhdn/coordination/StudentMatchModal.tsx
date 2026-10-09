import React from 'react';
import { X, Handshake } from 'lucide-react';
import type {
  EligibleStudent,
  EnterprisePartner,
  InternshipPosition,
} from '@/types/qhdn/qhdnTypes';

interface StudentMatchModalProps {
  student: EligibleStudent | null;
  isOpen: boolean;
  onClose: () => void;
  partners: EnterprisePartner[];
  selectedEnterpriseId: string;
  onSelectEnterprise: (enterpriseId: string) => void;
  selectedPositionId: string;
  onSelectPosition: (positionId: string) => void;
  availablePositions: InternshipPosition[];
  onSubmit: (e: React.FormEvent) => void;
}

export const StudentMatchModal: React.FC<StudentMatchModalProps> = ({
  student,
  isOpen,
  onClose,
  partners,
  selectedEnterpriseId,
  onSelectEnterprise,
  selectedPositionId,
  onSelectPosition,
  availablePositions,
  onSubmit,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Handshake size={18} className="text-orange-500" />
            {student.coordinationStatus === 'Rejected'
              ? 'Điều phối lại sinh viên'
              : 'Phân bổ sinh viên vào Doanh nghiệp'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            aria-label="Đóng popup phân bổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Student Preview */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900 text-sm">{student.fullName}</p>
            <p className="text-slate-500 mt-0.5">
              MSSV: {student.studentCode} | Ngành: {student.major}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Kỹ năng chính</span>
            <span className="font-medium text-slate-800">
              {student.topSkills.slice(0, 2).join(', ')}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              1. Chọn Doanh nghiệp tiếp nhận *
            </label>
            <select
              required
              value={selectedEnterpriseId}
              onChange={(e) => onSelectEnterprise(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">-- Chọn doanh nghiệp đối tác --</option>
              {partners.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.name} (Còn {ent.availableQuota} slots)
                </option>
              ))}
            </select>
          </div>

          {selectedEnterpriseId && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                2. Chọn Vị trí thực tập *
              </label>
              <select
                required
                value={selectedPositionId}
                onChange={(e) => onSelectPosition(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">-- Chọn vị trí đang mở tuyển --</option>
                {availablePositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} ({pos.workType} • Còn {pos.totalSlots - pos.filledSlots} chỗ)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedEnterpriseId || !selectedPositionId}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer disabled:opacity-40 transition-colors shadow-xs"
            >
              Xác nhận gửi hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMatchModal;
