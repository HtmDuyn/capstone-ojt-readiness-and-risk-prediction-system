import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Upload,
  Eye,
  Download,
  Info,
  FileText,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { EnterprisePartnerDetailModal } from '@/components/qhdn/enterprise/PartnerDetailModal';
import { EnterpriseImportExcelModal } from '@/components/qhdn/enterprise/ImportExcelModal';
import { EnterpriseCreateModal } from '@/components/qhdn/enterprise/CreateModal';
import { MOCK_ENTERPRISE_PARTNERS } from '@/data/qhdn/qhdnMockData';
import type { EnterprisePartner } from '@/types/qhdn/qhdnTypes';

const PAGE_SIZE = 10;

const SEMESTER_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả học kỳ' },
  { value: 'Summer 2026', label: 'Summer 2026' },
  { value: 'Fall 2026', label: 'Fall 2026' },
  { value: 'Spring 2026', label: 'Spring 2026' },
  { value: 'Fall 2025', label: 'Fall 2025' },
  { value: 'Summer 2025', label: 'Summer 2025' },
];

const MOU_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái MOU' },
  { value: 'Active', label: 'Đang hiệu lực (Active)' },
  { value: 'Pending Renewal', label: 'Chờ gia hạn' },
];

export const QhdnEnterpriseManagement: React.FC = () => {
  const navigate = useNavigate();
  // Active Tab: 2 clean views
  const [activeTab, setActiveTab] = useState<'partners' | 'quotas'>('partners');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedMouStatus, setSelectedMouStatus] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedEnterpriseDetail, setSelectedEnterpriseDetail] = useState<EnterprisePartner | null>(null);

  // Manual Add Form State
  const [newEnterpriseName, setNewEnterpriseName] = useState('');
  const [newEnterpriseCode, setNewEnterpriseCode] = useState('');
  const [newEnterpriseIndustry, setNewEnterpriseIndustry] = useState('');
  const [newEnterpriseQuota, setNewEnterpriseQuota] = useState(50);
  const [newEnterpriseContact, setNewEnterpriseContact] = useState('');
  const [newEnterpriseEmail, setNewEnterpriseEmail] = useState('');
  const [newEnterpriseSemesters, setNewEnterpriseSemesters] = useState<string[]>(['Summer 2026']);

  // Excel File State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Initialize partners with multiple consecutive semesters support
  const [partners, setPartners] = useState<EnterprisePartner[]>(() => {
    const semesterPatterns = [
      ['Summer 2026', 'Fall 2026'],
      ['Summer 2026'],
      ['Spring 2026', 'Summer 2026', 'Fall 2026'],
      ['Fall 2025', 'Spring 2026'],
      ['Summer 2026', 'Fall 2026'],
    ];

    return MOCK_ENTERPRISE_PARTNERS.map((p, idx) => ({
      ...p,
      semesters: p.semesters || semesterPatterns[idx % semesterPatterns.length],
    }));
  });

  // Sample Excel preview data
  const excelSamplePreview = [
    { name: 'CMC Global', code: 'CMC', industry: 'CNTT & Xuất khẩu Phần mềm', quota: 60, contact: 'Ông Nguyễn Văn Tiến', email: 'tiennv@cmc.com.vn', semesters: 'Summer 2026, Fall 2026' },
    { name: 'Sun* Inc. Vietnam', code: 'SUNASTERISK', industry: 'Phát triển Phần mềm AI & Web', quota: 40, contact: 'Bà Lê Thảo Nhi', email: 'nhi.le@sun-asterisk.com', semesters: 'Summer 2026, Fall 2026' },
    { name: 'SmartOSC', code: 'SMARTOSC', industry: 'Thương mại Điện tử & Tech', quota: 35, contact: 'Ông Phạm Đức Anh', email: 'anhpd@smartosc.com', semesters: 'Summer 2026' },
  ];

  // Filter partners
  const filteredPartners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return partners.filter((partner) => {
      // 1. Search text
      const matchesSearch =
        !query ||
        partner.name.toLowerCase().includes(query) ||
        partner.code.toLowerCase().includes(query) ||
        partner.industry.toLowerCase().includes(query) ||
        partner.contactPerson.toLowerCase().includes(query);

      // 2. Semester filter (checks if partner accepts the chosen semester)
      const partnerSems = partner.semesters || (partner.semester ? [partner.semester] : ['Summer 2026']);
      const matchesSemester =
        selectedSemester === 'ALL' || partnerSems.includes(selectedSemester);

      // 3. MOU Status filter
      const matchesMou =
        selectedMouStatus === 'ALL' || partner.mouStatus === selectedMouStatus;

      return matchesSearch && matchesSemester && matchesMou;
    });
  }, [partners, searchTerm, selectedSemester, selectedMouStatus]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPartners = filteredPartners.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // Number of empty slots needed to keep table height strictly uniform (10 rows always)
  const emptyRowsCount = PAGE_SIZE - paginatedPartners.length;

  // Pagination helper
  const getPaginationItems = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSemester !== 'ALL' ||
    selectedMouStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSemester('ALL');
    setSelectedMouStatus('ALL');
    setCurrentPage(1);
  };

  const handleAddEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnterpriseName || !newEnterpriseCode) return;

    const newPartner: EnterprisePartner = {
      id: `ent-${Date.now()}`,
      name: newEnterpriseName,
      code: newEnterpriseCode.toUpperCase(),
      industry: newEnterpriseIndustry || 'Công nghệ thông tin',
      tier: 'Tier-3 Standard',
      contactPerson: newEnterpriseContact || 'Đang cập nhật',
      contactEmail: newEnterpriseEmail || 'contact@company.com',
      contactPhone: '0900 000 000',
      address: 'Đang cập nhật địa chỉ trụ sở',
      mouStatus: 'Active',
      mouSignedDate: new Date().toISOString().split('T')[0],
      mouExpiryDate: '2028-12-31',
      totalQuota: Number(newEnterpriseQuota),
      acceptedCount: 0,
      availableQuota: Number(newEnterpriseQuota),
      semesters: newEnterpriseSemesters.length > 0 ? newEnterpriseSemesters : ['Summer 2026'],
    };

    setPartners([newPartner, ...partners]);
    setCurrentPage(1);
    setIsAddModalOpen(false);

    // Reset Form
    setNewEnterpriseName('');
    setNewEnterpriseCode('');
    setNewEnterpriseIndustry('');
    setNewEnterpriseQuota(50);
    setNewEnterpriseContact('');
    setNewEnterpriseEmail('');
    setNewEnterpriseSemesters(['Summer 2026']);
  };

  const handleConfirmExcelImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const importedPartners: EnterprisePartner[] = excelSamplePreview.map((item, idx) => ({
        id: `ent-excel-${Date.now()}-${idx}`,
        name: item.name,
        code: item.code,
        industry: item.industry,
        tier: 'Tier-3 Standard',
        contactPerson: item.contact,
        contactEmail: item.email,
        contactPhone: '0912 888 999',
        address: 'Hà Nội / TP. Hồ Chí Minh',
        mouStatus: 'Active',
        mouSignedDate: '2026-01-01',
        mouExpiryDate: '2029-01-01',
        totalQuota: item.quota,
        acceptedCount: 0,
        availableQuota: item.quota,
        semesters: item.semesters.split(',').map((s) => s.trim()),
      }));

      setPartners([...importedPartners, ...partners]);
      setCurrentPage(1);
      setIsImporting(false);
      setIsExcelModalOpen(false);
      setUploadedFileName(null);
    }, 800);
  };

  const handleDeleteEnterprise = (partner: EnterprisePartner) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa doanh nghiệp "${partner.name}"?`)) return;

    setPartners((current) => current.filter((item) => item.id !== partner.id));
    if (selectedEnterpriseDetail?.id === partner.id) {
      setSelectedEnterpriseDetail(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Page Banner ─────────────────────────────────── */}
      <PageBanner
        title="Quản lý Doanh nghiệp Đối tác & Chỉ tiêu OJT"
        description="Mạng lưới doanh nghiệp tiếp nhận thực tập OJT, hợp đồng MOU và theo dõi chỉ tiêu quota theo từng kỳ học."
        badge="Phòng QHDN"
      />

      {/* ─── UNIFIED CONTROL CARD: Tabs + Actions + Filters ─ */}
      <div className="card-glass border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Top Header: Tabs & Action Buttons */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Segmented Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('partners');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'partners'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={17} />
              Doanh nghiệp liên kết ({partners.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('quotas');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'quotas'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={17} />
              Chỉ tiêu tiếp nhận (Quota)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => navigate('/qhdn/enterprises/import?openModal=true')}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              title="Import hàng loạt doanh nghiệp từ PDF hoặc Excel"
            >
              <Upload size={16} />
              Import DN (PDF / Excel)
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Plus size={16} />
              Thêm DN đối tác mới
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Kỳ học, Tìm kiếm, Trạng thái MOU */}
        <div className="p-3 sm:p-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên DN, mã DN, ngành nghề, HR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter: Học kỳ tiếp nhận */}
          <div className="relative min-w-[170px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Calendar size={15} />
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo học kỳ tiếp nhận"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              {SEMESTER_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Trạng thái MOU */}
          <div className="relative min-w-[180px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Filter size={15} />
            </div>
            <select
              value={selectedMouStatus}
              onChange={(e) => {
                setSelectedMouStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo trạng thái MOU"
              className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs cursor-pointer"
            >
              {MOU_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw size={13} />
              Đặt lại
            </button>
          )}

          {/* Result Counter */}
          <div className="ml-auto text-xs font-medium text-slate-500">
            Tìm thấy <strong className="text-slate-800 font-bold">{filteredPartners.length}</strong> doanh nghiệp
          </div>
        </div>
      </div>

      {/* ─── TAB 1: DOANH NGHIỆP LIÊN KẾT ────────────────── */}
      {activeTab === 'partners' && (
        <div className="card-glass border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Card Section Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-orange-500" />
                Danh sách Doanh nghiệp Đối tác Liên kết
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào từng dòng để xem chi tiết thỏa thuận hợp tác và phân bổ chỉ tiêu Quota OJT
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
              {filteredPartners.length} Doanh nghiệp
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[900px]">
              <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
                <tr className="h-11">
                  <th className="px-4 py-3 w-14 text-center">STT</th>
                  <th className="px-4 py-3">Tên Doanh nghiệp</th>
                  <th className="px-4 py-3 w-48">Học kỳ tiếp nhận</th>
                  <th className="px-4 py-3 w-36">Trạng thái MOU</th>
                  <th className="px-4 py-3 w-56">Đầu mối liên hệ (HR)</th>
                  <th className="px-4 py-3 w-48">Chỉ tiêu Quota OJT</th>
                  <th className="px-4 py-3 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-[580px] text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Building2 size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Không tìm thấy doanh nghiệp phù hợp</p>
                        <p className="text-xs text-slate-400">Hãy thử điều chỉnh lại từ khóa hoặc bộ lọc học kỳ.</p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 cursor-pointer"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedPartners.map((partner, index) => {
                      const fillPercentage = Math.round((partner.acceptedCount / partner.totalQuota) * 100);
                      const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;
                      const partnerSemesters = partner.semesters || (partner.semester ? [partner.semester] : ['Summer 2026']);

                      return (
                        <tr
                          key={partner.id}
                          onClick={() => setSelectedEnterpriseDetail(partner)}
                          className="h-[58px] hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          {/* STT: Số thuần túy */}
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                            {rowNumber}
                          </td>

                          {/* Name & Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:border-orange-300 transition-colors">
                                {partner.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                                  {partner.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                  <span>Mã: <strong className="text-slate-700 font-semibold">{partner.code}</strong></span>
                                  <span className="text-slate-300">•</span>
                                  <span className="truncate max-w-[180px]">{partner.industry}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Học kỳ tiếp nhận (Hỗ trợ 2-3 kỳ liên tiếp) */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5 max-w-[210px]">
                              {partnerSemesters.map((sem) => (
                                <span
                                  key={sem}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/70 whitespace-nowrap"
                                >
                                  {sem}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Trạng thái MOU */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                                partner.mouStatus === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  partner.mouStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {partner.mouStatus === 'Active' ? 'Đang hiệu lực' : 'Chờ gia hạn'}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">Hạn: {partner.mouExpiryDate}</p>
                          </td>

                          {/* Đầu mối HR */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 text-sm">{partner.contactPerson}</p>
                            <p className="text-xs text-slate-500">{partner.contactPhone}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[170px]">{partner.contactEmail}</p>
                          </td>

                          {/* Quota Progress */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">
                                  {partner.acceptedCount} / {partner.totalQuota}
                                </span>
                                <span className="text-emerald-600 font-semibold">Còn {partner.availableQuota}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-orange-500 transition-all duration-300"
                                  style={{ width: `${fillPercentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-400 block text-right">{fillPercentage}%</span>
                            </div>
                          </td>

                          {/* Thao tác */}
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedEnterpriseDetail(partner)}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-xs border border-orange-200/80 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                title="Xem chi tiết doanh nghiệp"
                              >
                                <Eye size={13} className="text-orange-500" />
                                Chi tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEnterprise(partner)}
                                aria-label={`Xóa doanh nghiệp ${partner.name}`}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 transition-all cursor-pointer active:scale-95"
                                title="Xóa doanh nghiệp"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Khung cố định: Điền các hàng trống để bảng luôn giữ đúng 10 slot hàng, không bao giờ bị co rút khung hay nhảy paging */}
                    {emptyRowsCount > 0 &&
                      Array.from({ length: emptyRowsCount }).map((_, i) => (
                        <tr key={`empty-row-${i}`} className="h-[58px] pointer-events-none select-none border-b border-slate-50">
                          <td colSpan={7} className="px-4 py-3 text-transparent">
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ─── FIXED PAGINATION FOOTER ───────────────────────── */}
          <div className="border-t border-slate-100 px-5 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              {filteredPartners.length === 0
                ? 'Không có dữ liệu hiển thị'
                : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safeCurrentPage * PAGE_SIZE,
                    filteredPartners.length
                  )} trong ${filteredPartners.length} doanh nghiệp`}
            </p>

            <nav className="flex items-center gap-1" aria-label="Phân trang doanh nghiệp">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Trang trước"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {getPaginationItems(safeCurrentPage, totalPages).map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-semibold">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item as number)}
                    aria-current={safeCurrentPage === item ? 'page' : undefined}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                      safeCurrentPage === item
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label="Trang sau"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CHỈ TIÊU TIẾP NHẬN (QUOTA) ─────────────── */}
      {activeTab === 'quotas' && (
        <div className="card-glass border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-orange-500" />
                Bảng Thống kê Chỉ tiêu Tiếp nhận (OJT Quota)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp số lượng slot thực tập cam kết từ Doanh nghiệp đối tác theo kỳ học
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/70">
              {filteredPartners.length} Doanh nghiệp
            </span>
          </div>

          {/* Quota Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[900px]">
              <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
                <tr className="h-11">
                  <th className="px-4 py-3 w-14 text-center">STT</th>
                  <th className="px-4 py-3">Doanh nghiệp</th>
                  <th className="px-4 py-3 w-48">Học kỳ tiếp nhận</th>
                  <th className="px-4 py-3 text-center w-28">Tổng Quota</th>
                  <th className="px-4 py-3 text-center w-28">Đã nhận</th>
                  <th className="px-4 py-3 text-center w-28">Khả dụng</th>
                  <th className="px-4 py-3 w-40">Tiến độ</th>
                  <th className="px-4 py-3 text-right w-36">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPartners.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-[580px] text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Layers size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Không tìm thấy dữ liệu chỉ tiêu phù hợp</p>
                        <p className="text-xs text-slate-400">Hãy thử xóa hoặc điều chỉnh bộ lọc tìm kiếm.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedPartners.map((partner, index) => {
                      const fillPercentage = Math.round((partner.acceptedCount / partner.totalQuota) * 100);
                      const rowNumber = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;
                      const partnerSemesters = partner.semesters || (partner.semester ? [partner.semester] : ['Summer 2026']);

                      return (
                        <tr key={partner.id} className="h-[58px] hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-500">
                            {rowNumber}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900 text-sm">{partner.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Mã: <strong className="text-slate-600">{partner.code}</strong> | {partner.industry}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5 max-w-[210px]">
                              {partnerSemesters.map((sem) => (
                                <span
                                  key={sem}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/70 whitespace-nowrap"
                                >
                                  {sem}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900 text-sm">
                            {partner.totalQuota}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600 text-sm">
                            {partner.acceptedCount}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-orange-600 text-sm">
                            {partner.availableQuota}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-orange-500 transition-all duration-300"
                                  style={{ width: `${fillPercentage}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 text-xs">{fillPercentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {partner.availableQuota > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Còn nhận
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                Đã đủ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Khung cố định slot 10 hàng */}
                    {emptyRowsCount > 0 &&
                      Array.from({ length: emptyRowsCount }).map((_, i) => (
                        <tr key={`empty-quota-row-${i}`} className="h-[58px] pointer-events-none select-none border-b border-slate-50">
                          <td colSpan={8} className="px-4 py-3 text-transparent">
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Fixed Pagination Footer */}
          <div className="border-t border-slate-100 px-5 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              {filteredPartners.length === 0
                ? 'Không có dữ liệu hiển thị'
                : `Hiển thị ${(safeCurrentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safeCurrentPage * PAGE_SIZE,
                    filteredPartners.length
                  )} trong ${filteredPartners.length} doanh nghiệp`}
            </p>

            <nav className="flex items-center gap-1" aria-label="Phân trang chỉ tiêu">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Trang trước"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {getPaginationItems(safeCurrentPage, totalPages).map((item, idx) =>
                item === '...' ? (
                  <span key={`q-ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-semibold">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item as number)}
                    aria-current={safeCurrentPage === item ? 'page' : undefined}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                      safeCurrentPage === item
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label="Trang sau"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: CHI TIẾT DOANH NGHIỆP ───────────────── */}
      <EnterprisePartnerDetailModal
        partner={selectedEnterpriseDetail}
        isOpen={Boolean(selectedEnterpriseDetail)}
        onClose={() => setSelectedEnterpriseDetail(null)}
      />

      {/* ─── MODAL 2: IMPORT DOANH NGHIỆP TỪ EXCEL ────────── */}
      <EnterpriseImportExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        uploadedFileName={uploadedFileName}
        onFileSelected={(fileName) => setUploadedFileName(fileName)}
        excelSamplePreview={excelSamplePreview}
        isImporting={isImporting}
        onConfirmImport={handleConfirmExcelImport}
      />

      {/* ─── MODAL 3: THÊM DOANH NGHIỆP BẰNG TAY ─────────── */}
      <EnterpriseCreateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        name={newEnterpriseName}
        setName={setNewEnterpriseName}
        code={newEnterpriseCode}
        setCode={setNewEnterpriseCode}
        semesters={newEnterpriseSemesters}
        setSemesters={setNewEnterpriseSemesters}
        industry={newEnterpriseIndustry}
        setIndustry={setNewEnterpriseIndustry}
        quota={newEnterpriseQuota}
        setQuota={setNewEnterpriseQuota}
        contact={newEnterpriseContact}
        setContact={setNewEnterpriseContact}
        email={newEnterpriseEmail}
        setEmail={setNewEnterpriseEmail}
        onSubmit={handleAddEnterprise}
      />
    </div>
  );
};

export default QhdnEnterpriseManagement;
