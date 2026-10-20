import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Info,
  Download,
  Calendar,
  ChevronDown,
  Check,
} from 'lucide-react';

const EXCEL_SEMESTER_OPTIONS = [
  { value: 'Fall 2026', label: 'Fall 2026 (01/09 - 25/12/2026)' },
  { value: 'Summer 2026', label: 'Summer 2026 (01/05 - 25/08/2026)' },
  { value: 'Spring 2026', label: 'Spring 2026 (05/01 - 25/04/2026)' },
  { value: 'Fall 2025', label: 'Fall 2025 (01/09 - 25/12/2025)' },
  { value: 'Summer 2025', label: 'Summer 2025 (01/05 - 25/08/2025)' },
];

interface ExcelPreviewItem {
  name: string;
  code: string;
  quota: number;
  semesters: string;
}

interface EnterpriseImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedFileName: string | null;
  onFileSelected: (fileName: string) => void;
  excelSamplePreview: ExcelPreviewItem[];
  isImporting: boolean;
  onConfirmImport: () => void;
  selectedSemester?: string;
  onSemesterChange?: (semester: string) => void;
}

export const EnterpriseImportExcelModal: React.FC<EnterpriseImportExcelModalProps> = ({
  isOpen,
  onClose,
  uploadedFileName,
  onFileSelected,
  excelSamplePreview,
  isImporting,
  onConfirmImport,
  selectedSemester,
  onSemesterChange,
}) => {
  const [internalSemester, setInternalSemester] = useState<string>('Fall 2026');
  const activeSemester = selectedSemester ?? internalSemester;

  const handleSemesterSelect = (sem: string) => {
    setInternalSemester(sem);
    onSemesterChange?.(sem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Danh sách Doanh nghiệp từ Excel
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ tệp định dạng .xlsx, .xls, .csv theo mẫu tiêu chuẩn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            aria-label="Đóng popup import Excel"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── CHỌN HỌC KỲ TIẾP NHẬN ─────────────────────────── */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-purple-600 shrink-0" />
              <label className="text-xs font-bold text-slate-800">
                Học kỳ tiếp nhận áp dụng <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative min-w-[200px]">
              <select
                value={activeSemester}
                onChange={(e) => handleSemesterSelect(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 shadow-2xs hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {EXCEL_SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-500 font-medium">Chọn nhanh:</span>
            {EXCEL_SEMESTER_OPTIONS.map((sem) => {
              const isSelected = activeSemester === sem.value;
              return (
                <button
                  key={sem.value}
                  type="button"
                  onClick={() => handleSemesterSelect(sem.value)}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-white hover:bg-purple-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {sem.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/50 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <Upload size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Kéo thả file Excel vào đây hoặc{' '}
              <span className="text-orange-600 underline cursor-pointer">chọn tệp từ máy tính</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Kích thước tối đa: 10MB (.xlsx, .xls)
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelected(e.target.files[0].name);
              }
            }}
            className="hidden"
            id="excel-upload-input"
          />
          <label
            htmlFor="excel-upload-input"
            className="inline-block px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer hover:bg-slate-50 transition-all mt-2"
          >
            {uploadedFileName ? `Tệp đã chọn: ${uploadedFileName}` : 'Duyệt tìm tệp...'}
          </label>
        </div>

        {/* Download Sample Template */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-slate-500 shrink-0" />
            <span className="text-slate-600">Tải file mẫu Excel chuẩn tại đây:</span>
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Download size={13} />
            Mẫu .xlsx
          </button>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Xem trước dữ liệu ({excelSamplePreview.length} DN mẫu)</span>
            <span className="text-xs font-normal text-slate-500">Các kỳ tiếp nhận</span>
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2">Tên DN</th>
                  <th className="p-2">Mã DN</th>
                  <th className="p-2">Kỳ tiếp nhận</th>
                  <th className="p-2 text-center">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {excelSamplePreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{item.name}</td>
                    <td className="p-2 text-slate-600">{item.code}</td>
                    <td className="p-2 text-slate-700 font-medium">{item.semesters}</td>
                    <td className="p-2 text-center font-bold text-orange-600">{item.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmImport}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            {isImporting ? 'Đang Import...' : `Xác nhận Import (${excelSamplePreview.length} DN)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseImportExcelModal;
