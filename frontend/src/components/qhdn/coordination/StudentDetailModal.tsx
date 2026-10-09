import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { EligibleStudent } from '@/types/qhdn/qhdnTypes';

interface StudentDetailModalProps {
  student: EligibleStudent | null;
  isOpen: boolean;
  onClose: () => void;
  onReassign: (student: EligibleStudent) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onReassign,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hồ sơ Sinh viên OJT</h3>
            <p className="text-xs text-slate-500">Mã sinh viên: {student.studentCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            aria-label="Đóng popup hồ sơ sinh viên"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chuyên ngành:</span>
              <span className="font-semibold text-slate-800">{student.major}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Điểm GPA tích lũy:</span>
              <span className="font-bold text-slate-900">{student.gpa} / 4.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số tín chỉ hoàn thành:</span>
              <span className="font-semibold text-slate-800">{student.completedCredits} tín chỉ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trình độ ngoại ngữ:</span>
              <span className="font-semibold text-slate-800">{student.englishLevel}</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">Kỹ năng chuyên môn chính:</span>
            <div className="flex flex-wrap gap-1">
              {student.topSkills.map((sk) => (
                <span
                  key={sk}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <span className="font-bold text-slate-700 block">Thông tin phân bổ OJT:</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Doanh nghiệp:</span>
              <span className="font-semibold text-slate-900">
                {student.assignedEnterpriseName || 'Chưa phân bổ'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vị trí thực tập:</span>
              <span className="text-slate-700">{student.assignedPositionTitle || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="font-bold text-slate-800">{student.coordinationStatus}</span>
            </div>
            {student.rejectionReason && (
              <div className="mt-2 p-2 bg-rose-50 text-rose-800 rounded-lg text-xs border border-rose-200">
                <strong>Lý do từ chối:</strong> {student.rejectionReason}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onReassign(student);
            }}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw size={13} />
            Điều phối lại sinh viên
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
