import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Info,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AcademicPeriodItem, OjtSemesterItem, SelectedFileItem } from '@/types/qhdn/qhdnTypes';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSemesterId: number | null;
  onSemesterChange: (semesterId: number) => void;
  academicYearId: number | null;
  onAcademicYearChange: (yearId: number) => void;
  academicYears: Array<{ id: number; code: string }>;
  academicPeriods: AcademicPeriodItem[];
  semesters: OjtSemesterItem[];
  isLoadingPeriods: boolean;
  selectedFiles: SelectedFileItem[];
  onRemoveFile: (fileName: string) => void;
  onClearAllFiles: () => void;
  onStartExtraction: () => void;
  isExtracting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  previewContent?: ReactNode;
  previewSummary?: ReactNode;
  apiError?: string | null;
  isCommitting?: boolean;
  selectedCount?: number;
  canConfirm?: boolean;
  onConfirmImport?: () => void;
  onChooseDifferentFile?: () => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  selectedSemesterId,
  onSemesterChange,
  academicYearId,
  onAcademicYearChange,
  academicYears,
  academicPeriods,
  semesters,
  isLoadingPeriods,
  selectedFiles,
  onRemoveFile,
  onClearAllFiles,
  onStartExtraction,
  isExtracting,
  fileInputRef,
  onDragOver,
  onDrop,
  previewContent,
  previewSummary,
  apiError,
  isCommitting = false,
  selectedCount = 0,
  canConfirm = false,
  onConfirmImport,
  onChooseDifferentFile,
}) => {
  const semesterOptions = semesters
    .filter((semester) => !academicYearId || semester.academicYearId === academicYearId)
    .map((semester) => {
    const academicPeriod = academicPeriods.find(
      (period) => (period.ojtSemesterId || period.ojt?.id) === semester.id
    );
    const name = semester.name || semester.semesterCode || semester.code || `Kỳ #${semester.id}`;
    const startDate = semester.startDate || academicPeriod?.ojt?.startDate || '';
    const endDate = semester.endDate || academicPeriod?.ojt?.endDate || '';
    return {
      id: semester.id,
      name,
      label: `${name}${startDate ? ` (${startDate}${endDate ? ` - ${endDate}` : ''})` : ''}`,
      status: semester.status || academicPeriod?.ojt?.status || academicPeriod?.status || '',
    };
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 backdrop-blur-xs sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="enterprise-import-title"
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:right-5 sm:top-5"
          aria-label="Đóng popup import"
        >
          <X size={20} />
        </button>

        <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-4 py-4 pr-12 sm:px-7 sm:py-5 sm:pr-14">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-700 sm:h-12 sm:w-12 sm:rounded-2xl">
            <FileSpreadsheet size={22} />
          </div>
          <div className="min-w-0">
            <h2 id="enterprise-import-title" className="text-lg font-extrabold text-slate-900 sm:text-2xl">
              Import doanh nghiệp từ file Excel
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Tải file danh sách doanh nghiệp, xem trước và xác nhận import.
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:space-y-5 sm:p-6">
          <section className="grid grid-cols-1 gap-3 rounded-2xl border border-purple-200 bg-purple-50/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)] sm:items-center sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Năm học và kỳ tiếp nhận OJT</h3>
                <p className="mt-1 text-xs text-slate-500">Danh sách lấy trực tiếp từ dữ liệu đào tạo.</p>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={academicYearId ?? ''}
                onChange={(event) => onAcademicYearChange(Number(event.target.value))}
                disabled={isLoadingPeriods || academicYears.length === 0}
                aria-label="Chọn năm học"
                className="min-w-0 w-full rounded-xl border border-purple-300 bg-white px-3 py-2.5 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
              >
                {academicYears.length === 0 ? (
                  <option value="">{isLoadingPeriods ? 'Đang tải năm học...' : 'Chưa có năm học'}</option>
                ) : (
                  academicYears.map((year) => (
                    <option key={year.id} value={year.id}>{year.code}</option>
                  ))
                )}
              </select>
              <select
                value={selectedSemesterId ?? ''}
                onChange={(event) => onSemesterChange(Number(event.target.value))}
                disabled={isLoadingPeriods || semesterOptions.length === 0}
                aria-label="Chọn kỳ OJT"
                className="min-w-0 w-full rounded-xl border border-purple-300 bg-white px-3 py-2.5 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
              >
                {semesterOptions.length === 0 ? (
                  <option value="">{isLoadingPeriods ? 'Đang tải kỳ OJT...' : 'Không có kỳ OJT trong năm học này'}</option>
                ) : (
                  semesterOptions.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.label}{semester.status ? ` (${semester.status})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </section>

          {previewSummary ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-900">Xem trước danh sách doanh nghiệp</p>
                  <p className="mt-1 text-xs text-emerald-800">Kiểm tra dữ liệu trước khi xác nhận import.</p>
                </div>
                {previewSummary}
              </div>
              {previewContent}
            </>
          ) : (
            <>
              <section className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-2.5">
                  <Info size={18} className="shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-bold text-slate-800">Tải file mẫu danh sách doanh nghiệp</p>
                    <p className="mt-1 text-slate-500">File mẫu gồm tên, mã doanh nghiệp, ngành, email HR và quota.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Đang tải file mẫu Excel doanh nghiệp.')}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <Download size={14} />
                  Tải file mẫu
                </button>
              </section>

              <section
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer space-y-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/20 p-5 text-center hover:border-emerald-500 sm:p-9"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Kéo thả file Excel (.xlsx, .xls) vào đây</p>
                  <p className="my-1 text-xs text-slate-400">hoặc</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
                  >
                    Chọn file từ máy tính
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Hỗ trợ .xlsx, .xls; có thể chọn nhiều file.</p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    {selectedFiles.length} file Excel đã chọn
                  </h3>
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAllFiles}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{file.name}</p>
                          <p className="text-[11px] text-slate-400">{file.size}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFile(file.name)}
                          aria-label={`Xóa file ${file.name}`}
                          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {apiError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {apiError}
            </div>
          )}
        </div>

        {previewSummary ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onChooseDifferentFile}
              disabled={isCommitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Chọn file khác
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={isCommitting}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={onConfirmImport}
                disabled={!canConfirm || selectedCount === 0 || isCommitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <RotateCcw size={15} className="animate-spin" />
                    Đang import...
                  </>
                ) : (
                  `Xác nhận import ${selectedCount} doanh nghiệp`
                )}
              </button>
            </div>
          </footer>
        ) : (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isExtracting || selectedFiles.length === 0 || !selectedSemesterId}
              onClick={onStartExtraction}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RotateCcw size={15} className="animate-spin" />
                  Đang tạo preview...
                </>
              ) : (
                <>
                  Xem trước dữ liệu
                  <Eye size={15} />
                </>
              )}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};

export default FileImportModal;
