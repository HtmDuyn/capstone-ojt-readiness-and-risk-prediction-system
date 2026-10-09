import React from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Upload,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { SelectedFileItem } from '@/types/qhdn/qhdnTypes';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importMode: 'pdf' | 'excel';
  setImportMode: (mode: 'pdf' | 'excel') => void;
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
  importMode,
  setImportMode,
  selectedFiles,
  onRemoveFile,
  onClearAllFiles,
  onStartExtraction,
  isExtracting,
  fileInputRef,
  onDragOver,
  onDrop,
}) => {
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
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {importMode === 'pdf' ? 'Import doanh nghiệp từ PDF' : 'Import doanh nghiệp từ Excel'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {importMode === 'pdf'
              ? 'Tải lên nhiều file PDF tiếp nhận OJT để hệ thống tự động trích xuất thông tin doanh nghiệp, vị trí OJT và tạo tài khoản.'
              : 'Tải lên file bảng tính Excel chứa danh sách doanh nghiệp đối tác, chỉ tiêu quota và thông tin liên hệ HR.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setImportMode('pdf')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              importMode === 'pdf'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} />
            Import từ PDF
          </button>
          <button
            type="button"
            onClick={() => setImportMode('excel')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              importMode === 'excel'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={16} />
            Import từ Excel
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/20 hover:bg-orange-50/40 rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-white text-orange-500 shadow-xs border border-orange-200 mx-auto flex items-center justify-center transition-transform group-hover:scale-105">
            <Upload size={28} />
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-slate-800">
              {importMode === 'pdf' ? 'Kéo thả nhiều file PDF vào đây' : 'Kéo thả file Excel (.xlsx, .xls) vào đây'}
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
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {importMode === 'pdf' ? 'Chọn file PDF từ máy tính' : 'Chọn file Excel từ máy tính'}
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-1">
            Có thể chọn nhiều file cùng lúc (tối đa 100 file). Dung lượng tối đa mỗi file: 20MB.
          </p>
        </div>

        {/* Selected Files List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {selectedFiles.length} file đã được chọn
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
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    {importMode === 'pdf' ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
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
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    Đang trích xuất dữ liệu...
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
