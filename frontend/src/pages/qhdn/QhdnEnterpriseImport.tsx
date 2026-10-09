import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  RotateCcw,
  Trash2,
  Search,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { ExtractionKpiCards } from '@/components/qhdn/import/ExtractionKpiCards';
import { FileImportModal } from '@/components/qhdn/import/FileImportModal';
import { EnterpriseDetailModal } from '@/components/qhdn/import/EnterpriseDetailModal';
import { ImportSuccessModal } from '@/components/qhdn/import/ImportSuccessModal';
import type { ExtractedEnterprise, SelectedFileItem } from '@/types/qhdn/qhdnTypes';

const INITIAL_EXTRACTED_ENTERPRISES: ExtractedEnterprise[] = [
  {
    id: 'ent-ext-1',
    fileName: 'VNZ_OJT.pdf',
    fileSize: '2.4 MB',
    name: 'VNZ Technology',
    shortName: 'VNZ',
    email: 'hr@vnz.com',
    contactPerson: 'Lê Hoàng Nam',
    contactRole: 'HR Manager',
    phone: '0912 345 678',
    industry: 'Internet / Công nghệ thông tin',
    website: 'https://vnz.tech',
    address: 'VNZ Campus, Quận 7, TP. Hồ Chí Minh',
    description: 'Công ty công nghệ hàng đầu, tập trung vào sản phẩm Internet và công nghệ số.',
    positionsCount: 3,
    quota: 5,
    status: 'valid',
    statusText: 'Đủ dữ liệu',
    createAccount: true,
    logoBg: 'bg-orange-500',
    logoText: 'VNZ',
  },
  {
    id: 'ent-ext-2',
    fileName: 'FPTSoftware_OJT.pdf',
    fileSize: '1.8 MB',
    name: 'FPT Software',
    shortName: 'FSOFT',
    email: 'hr@fsoft.com',
    contactPerson: 'Nguyễn Thị Minh Tâm',
    contactRole: 'Head of Recruitment',
    phone: '0903 123 456',
    industry: 'Công nghệ phần mềm & Dịch vụ IT',
    website: 'https://fptsoftware.com',
    address: 'Khu Công nghệ cao Hòa Lạc, Hà Nội',
    description: 'Doanh nghiệp xuất khẩu phần mềm lớn nhất Việt Nam.',
    positionsCount: 0,
    quota: 500,
    status: 'missing_jd',
    statusText: 'Thiếu vị trí / JD',
    createAccount: true,
    logoBg: 'bg-emerald-600',
    logoText: 'FPT',
  },
  {
    id: 'ent-ext-3',
    fileName: 'FPTIS_OJT.pdf',
    fileSize: '3.0 MB',
    name: 'FPT IS',
    shortName: 'FIS',
    email: 'hr@fptis.com',
    contactPerson: 'Trần Thanh Sơn',
    contactRole: 'HR Specialist',
    phone: '0988 222 333',
    industry: 'Hệ thống thông tin & Tích hợp ERP',
    website: 'https://fpt-is.com',
    address: 'Tòa nhà Keangnam, Cầu Giấy, Hà Nội',
    description: 'Chuyên gia tích hợp giải pháp số và hệ thống thông tin quản lý cho khối doanh nghiệp và tài chính.',
    positionsCount: 9,
    quota: 25,
    status: 'valid',
    statusText: 'Đủ dữ liệu',
    createAccount: true,
    logoBg: 'bg-blue-600',
    logoText: 'FIS',
  },
  {
    id: 'ent-ext-4',
    fileName: 'MISA_OJT.pdf',
    fileSize: '1.4 MB',
    name: 'MISA',
    shortName: 'MISA',
    email: 'tuyendung@misa.com.vn',
    contactPerson: 'Vũ Thị Ngọc',
    contactRole: 'Talent Acquisition Manager',
    phone: '0977 444 555',
    industry: 'Phần mềm Kế toán & Quản trị DN',
    website: 'https://misa.vn',
    address: 'Tòa nhà MISA, Cầu Giấy, Hà Nội',
    description: 'Đơn vị phát triển phần mềm kế toán và giải pháp hóa đơn số hàng đầu.',
    positionsCount: 2,
    quota: 12,
    status: 'valid',
    statusText: 'Đủ dữ liệu',
    createAccount: true,
    logoBg: 'bg-red-500',
    logoText: 'MISA',
  },
  {
    id: 'ent-ext-5',
    fileName: 'Shopee_OJT.pdf',
    fileSize: '1.1 MB',
    name: 'Shopee Việt Nam',
    shortName: 'SHOPEE',
    email: 'hr@shopee.com',
    contactPerson: 'Đỗ Hải Đăng',
    contactRole: 'Campus Relations Lead',
    phone: '0918 555 777',
    industry: 'Thương mại Điện tử & Logistics',
    website: 'https://shopee.vn',
    address: 'Saigon Centre, Quận 1, TP. Hồ Chí Minh',
    description: 'Sàn thương mại điện tử lớn nhất khu vực Đông Nam Á.',
    positionsCount: 3,
    quota: 20,
    status: 'valid',
    statusText: 'Đủ dữ liệu',
    createAccount: true,
    logoBg: 'bg-orange-600',
    logoText: 'SHP',
  },
  {
    id: 'ent-ext-6',
    fileName: 'Tiki_OJT.pdf',
    fileSize: '1.9 MB',
    name: 'Tiki Vietnam',
    shortName: 'TIKI',
    email: 'hr@tiki.vn',
    contactPerson: 'Phạm Quang Vinh',
    contactRole: 'Tech Recruiter',
    phone: '0933 666 999',
    industry: 'E-Commerce & Supply Chain',
    website: 'https://tiki.vn',
    address: 'Viettel Complex, Quận 10, TP. Hồ Chí Minh',
    description: 'Nền tảng mua sắm trực tuyến với mạng lưới giao hàng TikiNOW.',
    positionsCount: 1,
    quota: 8,
    status: 'need_review',
    statusText: 'Cần kiểm tra',
    createAccount: true,
    logoBg: 'bg-cyan-600',
    logoText: 'TIKI',
  },
  {
    id: 'ent-ext-7',
    fileName: 'NashTech_OJT.pdf',
    fileSize: '2.2 MB',
    name: 'NashTech Vietnam',
    shortName: 'NASHTECH',
    email: '',
    contactPerson: 'Hoàng Minh Tuấn',
    contactRole: 'HR Executive',
    phone: '0909 333 111',
    industry: 'Phần mềm & Tư vấn Công nghệ Anh Quốc',
    website: 'https://nashtechglobal.com',
    address: 'E.Town 3, Tân Bình, TP. Hồ Chí Minh',
    description: 'Tập đoàn gia công phần mềm và tư vấn giải pháp chuyển đổi số toàn cầu.',
    positionsCount: 2,
    quota: 10,
    status: 'error',
    statusText: 'Lỗi trích xuất',
    createAccount: false,
    logoBg: 'bg-rose-600',
    logoText: 'NASH',
  },
  {
    id: 'ent-ext-8',
    fileName: 'CMC_OJT.pdf',
    fileSize: '1.6 MB',
    name: 'CMC Global',
    shortName: 'CMC',
    email: 'hr@cmc.com.vn',
    contactPerson: 'Bùi Kim Ngân',
    contactRole: 'HR Partner',
    phone: '0944 888 222',
    industry: 'Dịch vụ CNTT & Cloud Computing',
    website: 'https://cmcglobal.com.vn',
    address: 'CMC Tower, Duy Tân, Cầu Giấy, Hà Nội',
    description: 'Thành viên tập đoàn công nghệ CMC chuyên cung cấp dịch vụ quốc tế.',
    positionsCount: 4,
    quota: 30,
    status: 'valid',
    statusText: 'Đủ dữ liệu',
    createAccount: true,
    logoBg: 'bg-indigo-600',
    logoText: 'CMC',
  },
];

export const QhdnEnterpriseImport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'pdf' | 'excel'>('pdf');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<ExtractedEnterprise | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Hidden native file input ref for computer file selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected files list inside import modal
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([
    { name: 'VNZ_OJT_2026.pdf', size: '2.4 MB' },
    { name: 'VNG_OJT.pdf', size: '2.1 MB' },
    { name: 'MISA_OJT.pdf', size: '1.4 MB' },
    { name: 'FPTSoftware_OJT.pdf', size: '1.8 MB' },
    { name: 'FPTIS_OJT.pdf', size: '3.0 MB' },
    { name: 'Viettel_OJT.pdf', size: '2.2 MB' },
    { name: 'Shopee_OJT.pdf', size: '1.1 MB' },
    { name: 'Grab_OJT.pdf', size: '1.6 MB' },
    { name: 'Tiki_OJT.pdf', size: '1.9 MB' },
  ]);

  const [isExtracting, setIsExtracting] = useState(false);

  // Table data state
  const [enterprises, setEnterprises] = useState<ExtractedEnterprise[]>(INITIAL_EXTRACTED_ENTERPRISES);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    INITIAL_EXTRACTED_ENTERPRISES.filter((e) => e.status !== 'error').map((e) => e.id)
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'need_review' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-open modal if URL has ?openModal=true
  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setIsImportModalOpen(true);
    }
  }, [searchParams]);

  // Handle native file selection from computer
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const chosen = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      }));
      setSelectedFiles((prev) => [...chosen, ...prev]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      }));
      setSelectedFiles((prev) => [...dropped, ...prev]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleStartExtraction = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setIsImportModalOpen(false);
    }, 800);
  };

  const handleReloadResults = () => {
    setIsExtracting(true);
    setTimeout(() => setIsExtracting(false), 500);
  };

  // Table Selection Handlers
  const handleToggleSelectAll = () => {
    const validIds = filteredEnterprises.filter((e) => e.status !== 'error').map((e) => e.id);
    if (selectedIds.length === validIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validIds);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Mở popup modal xem chi tiết (KHÔNG CHUYỂN TRANG)
  const handleOpenDetail = (ent: ExtractedEnterprise) => {
    setEditingEnterprise(ent);
    setIsDetailModalOpen(true);
  };

  const handleSaveEnterpriseDetail = (updated: ExtractedEnterprise) => {
    setEnterprises((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setIsDetailModalOpen(false);
    setEditingEnterprise(null);
  };

  const handleRemoveInvalid = () => {
    setEnterprises((prev) => prev.filter((e) => e.status !== 'error'));
  };

  const handleResetBatch = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả kết quả trích xuất?')) {
      setEnterprises([]);
      setSelectedIds([]);
    }
  };

  // Filtered Enterprises in Table
  const filteredEnterprises = enterprises.filter((ent) => {
    const matchesSearch =
      !searchTerm ||
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'valid' && ent.status === 'valid') ||
      (statusFilter === 'need_review' && (ent.status === 'need_review' || ent.status === 'missing_jd')) ||
      (statusFilter === 'error' && ent.status === 'error');

    return matchesSearch && matchesStatus;
  });

  const validCount = enterprises.filter((e) => e.status === 'valid').length;
  const reviewCount = enterprises.filter((e) => e.status === 'need_review' || e.status === 'missing_jd').length;
  const errorCount = enterprises.filter((e) => e.status === 'error').length;
  const totalQuota = enterprises.reduce((sum, item) => sum + (item.quota || 0), 0);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ─── HIDDEN NATIVE FILE INPUT (CHO PHÉP CHỌN FILE TỪ MÁY TÍNH) ─ */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept={importMode === 'pdf' ? '.pdf' : '.xlsx,.xls'}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ─── BANNER TÍM ĐỒNG BỘ CÙNG HỆ THỐNG (THEO YÊU CẦU) ────────── */}
      <PageBanner
        badge="Phòng QHDN"
        breadcrumb={
          <div className="flex items-center gap-2 text-xs text-purple-200/90 font-medium">
            <span
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => navigate('/qhdn/enterprises')}
            >
              Doanh nghiệp liên kết
            </span>
            <ChevronRight size={13} className="text-purple-300/80" />
            <span className="text-white font-semibold">Import doanh nghiệp</span>
          </div>
        }
        title="Kết quả trích xuất thông tin"
        description="Hệ thống đã trích xuất thông tin từ các file tiếp nhận OJT (PDF / Excel). Vui lòng kiểm tra và chỉnh sửa các thông tin trước khi xác nhận import."
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Upload size={14} />
              Import file mới
            </button>

            <button
              type="button"
              onClick={handleReloadResults}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw size={14} className={isExtracting ? 'animate-spin' : ''} />
              Tải lại kết quả
            </button>

            <button
              type="button"
              onClick={handleResetBatch}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-400/30 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 size={14} />
              Xóa tất cả
            </button>
          </div>
        }
      />

      {/* ─── 5 THẺ STAT KPI CARDS (BAO GỒM CARD TÍM CHỈ TIÊU QUOTA OJT) ─ */}
      <ExtractionKpiCards
        totalFiles={58}
        validCount={validCount}
        reviewCount={reviewCount}
        errorCount={errorCount}
        totalQuota={totalQuota}
      />

      {/* ─── BẢNG KẾT QUẢ TRÍCH XUẤT THÔNG TIN HÀNG LOẠT ─────────────── */}
      <div className="card-glass border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        {/* Filter toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả (58)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('valid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'valid'
                  ? 'bg-white text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đủ dữ liệu (42)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('need_review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'need_review'
                  ? 'bg-white text-amber-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cần kiểm tra (12)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'error'
                  ? 'bg-white text-rose-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lỗi (4)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên doanh nghiệp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Bảng kết quả trích xuất hàng loạt */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[1020px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr className="h-11">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === filteredEnterprises.filter((e) => e.status !== 'error').length
                    }
                    onChange={handleToggleSelectAll}
                    aria-label="Chọn tất cả doanh nghiệp hợp lệ"
                    className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-4 py-3 w-52">Tên file</th>
                <th className="px-4 py-3">Tên doanh nghiệp</th>
                <th className="px-4 py-3 w-44">Email liên hệ</th>
                <th className="px-4 py-3 w-20 text-center">Số vị trí</th>
                <th className="px-4 py-3 w-20 text-center">Quota</th>
                <th className="px-4 py-3 w-36 text-center">Trạng thái</th>
                <th className="px-4 py-3 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEnterprises.map((ent, idx) => {
                const isSelected = selectedIds.includes(ent.id);

                return (
                  <tr
                    key={ent.id}
                    className={`h-[58px] transition-colors ${
                      isSelected ? 'bg-orange-50/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={ent.status === 'error'}
                        onChange={() => handleToggleSelectItem(ent.id)}
                        aria-label={`Chọn doanh nghiệp ${ent.name}`}
                        className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-30"
                      />
                    </td>

                    {/* STT */}
                    <td className="px-3 py-3 text-center font-bold text-slate-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* File Name & Logo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md ${ent.logoBg} text-white font-black text-[9px] flex items-center justify-center shrink-0`}
                        >
                          {ent.logoText}
                        </div>
                        <span
                          className="font-semibold text-slate-800 text-xs truncate max-w-[150px]"
                          title={ent.fileName}
                        >
                          {ent.fileName}
                        </span>
                      </div>
                    </td>

                    {/* Enterprise Name */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 text-xs">{ent.name}</p>
                    </td>

                    {/* HR Email */}
                    <td className="px-4 py-3">
                      <span className="text-slate-600 text-xs">
                        {ent.email || <span className="text-slate-300 italic">—</span>}
                      </span>
                    </td>

                    {/* Positions count */}
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {ent.positionsCount}
                    </td>

                    {/* Quota */}
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {ent.quota}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center">
                      {ent.status === 'valid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold whitespace-nowrap">
                          <CheckCircle2 size={12} />
                          Đủ dữ liệu
                        </span>
                      )}
                      {ent.status === 'missing_jd' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold whitespace-nowrap">
                          <AlertTriangle size={12} />
                          Thiếu vị trí/JD
                        </span>
                      )}
                      {ent.status === 'need_review' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold whitespace-nowrap">
                          <AlertTriangle size={12} />
                          Cần kiểm tra
                        </span>
                      )}
                      {ent.status === 'error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-bold whitespace-nowrap">
                          <XCircle size={12} />
                          Lỗi trích xuất
                        </span>
                      )}
                    </td>

                    {/* Thao tác: ĐÃ BỎ CÁC DẤU 3 CHẤM, CHỈ ĐỂ NÚT XEM CHI TIẾT SẠCH SẼ */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(ent)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold text-xs border border-blue-200/60 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
                      >
                        <Eye size={13} className="text-blue-500" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom sticky action bar */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-700">
            Đã chọn <strong className="text-orange-600 font-bold">50</strong> doanh nghiệp hợp lệ
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRemoveInvalid}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200/80 transition-all cursor-pointer"
            >
              Loại khỏi danh sách (4)
            </button>
            <button
              type="button"
              onClick={() => alert('Đã lưu dữ liệu nháp của phiên trích xuất!')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
            >
              Lưu nháp
            </button>
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              Xác nhận import 50 doanh nghiệp
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: IMPORT FILE TỪ MÁY TÍNH ───────────────────────── */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importMode={importMode}
        setImportMode={setImportMode}
        selectedFiles={selectedFiles}
        onRemoveFile={handleRemoveFile}
        onClearAllFiles={() => setSelectedFiles([])}
        onStartExtraction={handleStartExtraction}
        isExtracting={isExtracting}
        fileInputRef={fileInputRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* ─── MODAL 2: XEM & CHỈNH SỬA CHI TIẾT DOANH NGHIỆP (POPUP) ─── */}
      <EnterpriseDetailModal
        enterprise={editingEnterprise}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setEditingEnterprise(null);
        }}
        onSave={handleSaveEnterpriseDetail}
      />

      {/* ─── MODAL 4: XÁC NHẬN IMPORT THÀNH CÔNG ────────────────────── */}
      <ImportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onNavigateToList={() => {
          setIsSuccessModalOpen(false);
          navigate('/qhdn/enterprises');
        }}
      />
    </div>
  );
};

export default QhdnEnterpriseImport;
