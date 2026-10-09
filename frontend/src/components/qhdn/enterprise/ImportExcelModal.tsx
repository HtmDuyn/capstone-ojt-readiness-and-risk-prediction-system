import React from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Info,
  Download,
} from 'lucide-react';

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
}

export const EnterpriseImportExcelModal: React.FC<EnterpriseImportExcelModalProps> = ({
  isOpen,
  onClose,
  uploadedFileName,
  onFileSelected,
  excelSamplePreview,
  isImporting,
  onConfirmImport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
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
