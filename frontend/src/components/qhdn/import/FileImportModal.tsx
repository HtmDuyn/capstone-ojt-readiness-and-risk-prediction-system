import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  ArrowRight,
  RotateCcw,
  Calendar,
  ChevronDown,
  Check,
  Info,
  Download,
} from 'lucide-react';
import type { SelectedFileItem, OjtSemesterItem } from '@/types/qhdn/qhdnTypes';

export const IMPORT_SEMESTER_OPTIONS = [
  { value: 'Fall 2026', label: 'Fall 2026 (01/09/2026 - 25/12/2026)', isCurrent: true },
  { value: 'Summer 2026', label: 'Summer 2026 (01/05/2026 - 25/08/2026)', isCurrent: false },
  { value: 'Spring 2026', label: 'Spring 2026 (05/01/2026 - 25/04/2026)', isCurrent: false },
  { value: 'Fall 2025', label: 'Fall 2025 (01/09/2025 - 25/12/2025)', isCurrent: false },
  { value: 'Summer 2025', label: 'Summer 2025 (01/05/2025 - 25/08/2025)', isCurrent: false },
];

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSemester?: string;
  onSemesterChange?: (semester: string) => void;
  semesters?: OjtSemesterItem[];
  selectedFiles: SelectedFileItem[];
  onRemoveFile: (fileName: string) => void;
  onClearAllFiles: () => void;
  onStartExtraction: () => void;
  isExtracting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  selectedSemester,
  onSemesterChange,
  semesters,
  selectedFiles,
  onRemoveFile,
  onClearAllFiles,
  onStartExtraction,
  isExtracting,
  fileInputRef,
  onDragOver,
  onDrop,
}) => {
  const [internalSemester, setInternalSemester] = useState<string>('Fall 2026');
  const activeSemester = selectedSemester ?? internalSemester;

  const semesterOptions =
    semesters && semesters.length > 0
      ? semesters.map((s) => ({
          value: s.name || s.semesterCode || `Kỳ #${s.id}`,
          label: `${s.name || s.semesterCode} (${s.semesterCode || ''}${s.startDate ? ` | ${s.startDate} - ${s.endDate || ''}` : ''})`,
          isCurrent: s.status === 'PLANNED' || s.status === 'ONGOING',
        }))
      : IMPORT_SEMESTER_OPTIONS;

  const handleSemesterSelect = (sem: string) => {
    setInternalSemester(sem);
    onSemesterChange?.(sem);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Đóng popup import"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Import doanh nghiệp từ file Excel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tải lên file bảng tính Excel (.xlsx, .xls) chứa danh sách doanh nghiệp đối tác, chỉ tiêu tiếp nhận OJT và thông tin liên hệ HR.
            </p>
          </div>
        </div>

        {/* ─── CHỌN HỌC KỲ TIẾP NHẬN OJT ĐỂ IMPORT ─────────────────────── */}
        <div className="bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-slate-50 border border-purple-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/30">
                <Calendar size={20} />
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  Chọn học kỳ tiếp nhận OJT
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Kỳ áp dụng
                  </span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tất cả doanh nghiệp trong đợt import này sẽ được gắn trực tiếp vào học kỳ đã chọn
                </p>
              </div>
            </div>

            {/* Dropdown chọn học kỳ */}
            <div className="relative min-w-[250px]">
              <select
                value={activeSemester}
                onChange={(e) => handleSemesterSelect(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border border-purple-300 rounded-xl text-xs sm:text-sm font-bold text-purple-950 shadow-xs hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer transition-all"
              >
                {semesterOptions.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label} {sem.isCurrent ? '⭐ (Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none"
              />
            </div>
          </div>

          {/* Quick chips selector */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
            <span className="text-slate-500 font-medium">Chọn nhanh kỳ:</span>
            {semesterOptions.map((sem) => {
              const isSelected = activeSemester === sem.value;
              return (
                <button
                  key={sem.value}
                  type="button"
                  onClick={() => handleSemesterSelect(sem.value)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'bg-white hover:bg-purple-100/70 text-slate-700 border border-slate-200/90 hover:border-purple-300'
                  }`}
                >
                  {isSelected && <Check size={12} className="stroke-[3]" />}
                  {sem.value}
                  {sem.isCurrent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── TẢI FILE MẪU EXCEL CHUẨN ──────────────────────────────── */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Info size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">Chưa có file danh sách chuẩn?</span>
              <span className="text-slate-500">Tải file mẫu Excel (.xlsx) gồm đầy đủ cột thông tin: Tên DN, Mã DN, Ngành, HR Email, Quota.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('Đang tải file mẫu: Mau_Danh_Sach_Doanh_Nghiep_Tiep_Nhan_OJT.xlsx')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100/70 text-emerald-700 border border-emerald-300 font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs transition-all shrink-0 active:scale-95"
          >
            <Download size={14} />
            Tải mẫu Excel (.xlsx)
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 shadow-xs border border-emerald-200 mx-auto flex items-center justify-center transition-transform group-hover:scale-105">
            <Upload size={28} />
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-slate-800">
              Kéo thả file Excel (.xlsx, .xls) vào đây
            </p>
            <p className="text-xs text-slate-400 font-medium">hoặc</p>
          </div>

          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              Chọn file Excel từ máy tính
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-1">
            Hỗ trợ định dạng .xlsx, .xls. Có thể chọn nhiều file cùng lúc. Dung lượng tối đa mỗi file: 20MB.
          </p>
        </div>

        {/* Selected Files List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              {selectedFiles.length} file Excel đã được chọn
            </h3>
            <button
              type="button"
              onClick={onClearAllFiles}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto p-1">
            {selectedFiles.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{f.size}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFile(f.name)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa file này"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
              + 49 file khác
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isExtracting || selectedFiles.length === 0}
                onClick={onStartExtraction}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    Đang trích xuất dữ liệu Excel...
                  </>
                ) : (
                  <>
                    Bắt đầu trích xuất
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileImportModal;
