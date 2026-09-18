import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Layers,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Filter,
  X,
  Edit2,
  FileSpreadsheet,
  Upload,
  Eye,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  MOCK_ENTERPRISE_PARTNERS,
  MOCK_INTERNSHIP_POSITIONS,
} from '@/data/qhdn/qhdnMockData';
import type { EnterprisePartner, InternshipPosition } from '@/types/qhdn/qhdnTypes';

export const QhdnEnterpriseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partners' | 'positions' | 'quotas'>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedEnterpriseDetail, setSelectedEnterpriseDetail] = useState<EnterprisePartner | null>(null);

  // Manual Add Form State
  const [newEnterpriseName, setNewEnterpriseName] = useState('');
  const [newEnterpriseCode, setNewEnterpriseCode] = useState('');
  const [newEnterpriseIndustry, setNewEnterpriseIndustry] = useState('');
  const [newEnterpriseTier, setNewEnterpriseTier] = useState<'Tier-1 Gold' | 'Tier-2 Silver' | 'Tier-3 Standard'>('Tier-1 Gold');
  const [newEnterpriseQuota, setNewEnterpriseQuota] = useState(50);
  const [newEnterpriseContact, setNewEnterpriseContact] = useState('');
  const [newEnterpriseEmail, setNewEnterpriseEmail] = useState('');

  // Excel File State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Partners list & Positions list state
  const [partners, setPartners] = useState<EnterprisePartner[]>(MOCK_ENTERPRISE_PARTNERS);
  const [positions, setPositions] = useState<InternshipPosition[]>(MOCK_INTERNSHIP_POSITIONS);

  // Sample Excel preview data
  const excelSamplePreview = [
    { name: 'CMC Global', code: 'CMC', industry: 'CNTT & Xuất khẩu Phần mềm', tier: 'Tier-1 Gold', quota: 60, contact: 'Ông Nguyễn Văn Tiến', email: 'tiennv@cmc.com.vn' },
    { name: 'Sun* Inc. Vietnam', code: 'SUNASTERISK', industry: 'Phát triển Phần mềm AI & Web', tier: 'Tier-2 Silver', quota: 40, contact: 'Bà Lê Thảo Nhi', email: 'nhi.le@sun-asterisk.com' },
    { name: 'SmartOSC', code: 'SMARTOSC', industry: 'Thương mại Điện tử & Tech', tier: 'Tier-2 Silver', quota: 35, contact: 'Ông Phạm Đức Anh', email: 'anhpd@smartosc.com' },
  ];

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || partner.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Filter positions
  const filteredPositions = positions.filter((pos) =>
    pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.enterpriseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.requiredSkills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnterpriseName || !newEnterpriseCode) return;

    const newPartner: EnterprisePartner = {
      id: `ent-${Date.now()}`,
      name: newEnterpriseName,
      code: newEnterpriseCode.toUpperCase(),
      industry: newEnterpriseIndustry || 'Công nghệ thông tin',
      tier: newEnterpriseTier,
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
    };

    setPartners([newPartner, ...partners]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewEnterpriseName('');
    setNewEnterpriseCode('');
    setNewEnterpriseIndustry('');
    setNewEnterpriseQuota(50);
    setNewEnterpriseContact('');
    setNewEnterpriseEmail('');
  };

  const handleConfirmExcelImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const importedPartners: EnterprisePartner[] = excelSamplePreview.map((item, idx) => ({
        id: `ent-excel-${Date.now()}-${idx}`,
        name: item.name,
        code: item.code,
        industry: item.industry,
        tier: item.tier as 'Tier-1 Gold' | 'Tier-2 Silver' | 'Tier-3 Standard',
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
      }));

      setPartners([...importedPartners, ...partners]);
      setIsImporting(false);
      setIsExcelModalOpen(false);
      setUploadedFileName(null);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Banner */}
      <PageBanner
        title="Quản lý Doanh nghiệp & Vị trí Thực tập"
        description="Quản lý mạng lưới doanh nghiệp đối tác liên kết, vị trí tuyển dụng OJT và chỉ tiêu tiếp nhận (quota)."
        badge="Phòng QHDN"
      />

      {/* Tabs Navigation Header & Add Actions */}
      <div className="card-glass p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Tabs Segmented Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'partners'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} />
            Doanh nghiệp liên kết ({partners.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'positions'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={16} />
            Vị trí thực tập ({positions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quotas'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={16} />
            Chỉ tiêu tiếp nhận (Quota)
          </button>
        </div>

        {/* Header Action Buttons (Import Excel + Manual Add) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <FileSpreadsheet size={16} />
            Import từ Excel
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={16} />
            Thêm DN đối tác mới
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'positions'
                ? 'Tìm vị trí, kỹ năng, doanh nghiệp...'
                : 'Tìm tên doanh nghiệp, mã DN, ngành nghề...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {activeTab === 'partners' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium shrink-0">Phân cấp DN:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">Tất cả các Tier</option>
              <option value="Tier-1 Gold">Tier-1 Gold</option>
              <option value="Tier-2 Silver">Tier-2 Silver</option>
              <option value="Tier-3 Standard">Tier-3 Standard</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: DOANH NGHIỆP LIÊN KẾT (DẠNG LIST DANH SÁCH) */}
      {activeTab === 'partners' && (
        <div className="card-glass overflow-hidden border border-slate-200/80 shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-orange-500" />
                Danh sách Doanh nghiệp Đối tác Liên kết ({filteredPartners.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào từng dòng để xem thông tin chi tiết hợp tác, vị trí tuyển dụng và chỉ tiêu Quota OJT
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Tên Doanh nghiệp</th>
                  <th className="p-3.5">Phân cấp Tier</th>
                  <th className="p-3.5">Trạng thái MOU</th>
                  <th className="p-3.5">Đầu mối liên hệ (HR)</th>
                  <th className="p-3.5 w-52">Chỉ tiêu Quota OJT</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPartners.map((partner) => {
                  const fillPercentage = Math.round((partner.acceptedCount / partner.totalQuota) * 100);
                  return (
                    <tr
                      key={partner.id}
                      onClick={() => setSelectedEnterpriseDetail(partner)}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Name & Code */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center shrink-0 border border-orange-200 group-hover:scale-105 transition-transform">
                            {partner.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                              {partner.name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Mã DN: <strong className="text-slate-700">{partner.code}</strong> | {partner.industry}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                            partner.tier.includes('Tier-1')
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : partner.tier.includes('Tier-2')
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {partner.tier}
                        </span>
                      </td>

                      {/* MOU */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                            partner.mouStatus === 'Active'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {partner.mouStatus}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{partner.contactPerson}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{partner.contactPhone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{partner.contactEmail}</span>
                        </p>
                      </td>

                      {/* Quota Progress */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {partner.acceptedCount} / {partner.totalQuota} slots
                            </span>
                            <span className="text-emerald-600 font-bold">Còn {partner.availableQuota}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedEnterpriseDetail(partner)}
                          className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-orange-200/80"
                        >
                          <Eye size={14} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VỊ TRÍ THỰC TẬP */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {filteredPositions.map((pos) => (
            <div
              key={pos.id}
              className="card-glass p-5 hover:border-orange-200 transition-all border border-slate-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold">
                    {pos.enterpriseName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {pos.workType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold flex items-center gap-1">
                    <DollarSign size={12} />
                    {pos.stipend}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {pos.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {pos.description}
                </p>

                {/* Skills Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400 font-medium mr-1">Yêu cầu:</span>
                  {pos.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Slot count & Actions */}
              <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Số lượng tuyển dụng</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    <span className="text-orange-600">{pos.filledSlots}</span> / {pos.totalSlots} SV
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    Còn nhận: {pos.totalSlots - pos.filledSlots} chỗ
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 size={14} />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CHỈ TIÊU TIẾP NHẬN (QUOTA MANAGEMENT) */}
      {activeTab === 'quotas' && (
        <div className="card-glass overflow-hidden border border-slate-200/80">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bảng Thống kê Chỉ tiêu Tiếp nhận (OJT Quota)
              </h3>
              <p className="text-xs text-slate-500">
                Tổng số lượng slots thực tập cam kết từ Doanh nghiệp đối tác kỳ này
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Doanh nghiệp</th>
                  <th className="p-3.5">Phân cấp Tier</th>
                  <th className="p-3.5 text-center">Tổng chỉ tiêu Quota</th>
                  <th className="p-3.5 text-center">Đã chốt tiếp nhận</th>
                  <th className="p-3.5 text-center">Slot khả dụng</th>
                  <th className="p-3.5">Tỷ lệ lấp đầy</th>
                  <th className="p-3.5 text-right">Trạng thái Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {partners.map((partner) => {
                  const fillPercentage = Math.round((partner.acceptedCount / partner.totalQuota) * 100);
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 text-sm">{partner.name}</p>
                        <p className="text-[11px] text-slate-400">Mã: {partner.code}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {partner.tier}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 text-sm">
                        {partner.totalQuota}
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-600 text-sm">
                        {partner.acceptedCount}
                      </td>
                      <td className="p-3.5 text-center font-bold text-orange-600 text-sm">
                        {partner.availableQuota}
                      </td>
                      <td className="p-3.5 w-44">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">{fillPercentage}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        {partner.availableQuota > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Sẵn sàng nhận thêm
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                            Đã đủ chỉ tiêu
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: CHI TIẾT DOANH NGHIỆP */}
      {selectedEnterpriseDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-black text-xl flex items-center justify-center shrink-0 border border-orange-200">
                  {selectedEnterpriseDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedEnterpriseDetail.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                      {selectedEnterpriseDetail.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã Doanh nghiệp: <strong>{selectedEnterpriseDetail.code}</strong> | {selectedEnterpriseDetail.industry}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnterpriseDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quota Summary Box */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Tổng Quota Cam kết</span>
                <span className="text-lg font-extrabold text-slate-900">{selectedEnterpriseDetail.totalQuota} Slots</span>
              </div>
              <div className="border-x border-orange-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">Đã chốt Tiếp nhận</span>
                <span className="text-lg font-extrabold text-emerald-600">{selectedEnterpriseDetail.acceptedCount} SV</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Slot Khả dụng còn lại</span>
                <span className="text-lg font-extrabold text-orange-600">{selectedEnterpriseDetail.availableQuota} Slots</span>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
                  <Users size={16} className="text-orange-500" />
                  Đầu mối Liên hệ Hợp tác
                </h4>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Người đại diện:</span>
                  <strong className="text-slate-900">{selectedEnterpriseDetail.contactPerson}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Email:</span>
                  <span className="text-slate-800">{selectedEnterpriseDetail.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Điện thoại:</span>
                  <span className="text-slate-800">{selectedEnterpriseDetail.contactPhone}</span>
                </div>
              </div>

              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
                  <FileText size={16} className="text-orange-500" />
                  Thông tin Hợp đồng MOU
                </h4>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Trạng thái MOU:</span>
                  <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 font-bold text-[10px]">
                    {selectedEnterpriseDetail.mouStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Ngày ký kết:</span>
                  <span className="text-slate-800">{selectedEnterpriseDetail.mouSignedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-medium text-slate-400 w-24">Ngày hết hạn:</span>
                  <span className="text-slate-800">{selectedEnterpriseDetail.mouExpiryDate}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Địa chỉ Trụ sở / Cơ sở thực tập:</span>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                {selectedEnterpriseDetail.address}
              </p>
            </div>

            {/* Listed Internship Positions */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                Các Vị trí Thực tập Đăng ký Tuyển dụng ({
                  positions.filter((p) => p.enterpriseName === selectedEnterpriseDetail.name).length
                })
              </h4>

              <div className="space-y-2">
                {positions
                  .filter((p) => p.enterpriseName === selectedEnterpriseDetail.name)
                  .map((pos) => (
                    <div
                      key={pos.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{pos.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hình thức: {pos.workType} | Trợ cấp: <strong className="text-emerald-600">{pos.stipend}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-orange-600">{pos.filledSlots} / {pos.totalSlots}</span>
                        <span className="text-[10px] text-slate-400 block">Đã nhận</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedEnterpriseDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: IMPORT DOANH NGHIỆP TỪ EXCEL */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
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
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 bg-emerald-50/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Kéo thả file Excel vào đây hoặc <span className="text-emerald-600 underline cursor-pointer">chọn tệp từ máy tính</span>
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
                    setUploadedFileName(e.target.files[0].name);
                  }
                }}
                className="hidden"
                id="excel-upload-input"
              />
              <label
                htmlFor="excel-upload-input"
                className="inline-block px-4 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs cursor-pointer hover:bg-emerald-50 transition-all mt-2"
              >
                {uploadedFileName ? `Tệp đã chọn: ${uploadedFileName}` : 'Duyệt tìm tệp...'}
              </label>
            </div>

            {/* Download Sample Template */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-500 shrink-0" />
                <span className="text-slate-600">Chưa có file mẫu? Tải mẫu Excel chuẩn tại đây:</span>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Download size={13} />
                File mẫu .xlsx
              </button>
            </div>

            {/* Preview Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Xem trước danh sách Doanh nghiệp import ({excelSamplePreview.length} DN mẫu)</span>
                <span className="text-[11px] font-normal text-slate-500">Xem dữ liệu đọc từ tệp</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Tên DN</th>
                      <th className="p-2">Mã DN</th>
                      <th className="p-2">Phân cấp Tier</th>
                      <th className="p-2 text-center">Quota</th>
                      <th className="p-2">Người liên hệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelSamplePreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2 text-slate-600">{item.code}</td>
                        <td className="p-2 text-amber-700 font-semibold">{item.tier}</td>
                        <td className="p-2 text-center font-bold text-orange-600">{item.quota}</td>
                        <td className="p-2 text-slate-600">{item.contact}</td>
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
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmExcelImport}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={15} />
                {isImporting ? 'Đang Import...' : `Xác nhận Import (${excelSamplePreview.length} DN)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: THÊM DOANH NGHIỆP BẰNG TAY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-orange-500" />
                Thêm Doanh nghiệp Đối tác Mới (Bằng tay)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEnterprise} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Doanh nghiệp *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Viettel Digital"
                    value={newEnterpriseName}
                    onChange={(e) => setNewEnterpriseName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Doanh nghiệp *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: VTL-DIGITAL"
                    value={newEnterpriseCode}
                    onChange={(e) => setNewEnterpriseCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngành nghề hoạt động</label>
                  <input
                    type="text"
                    placeholder="VD: Fintech / CNTT"
                    value={newEnterpriseIndustry}
                    onChange={(e) => setNewEnterpriseIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân cấp Tier</label>
                  <select
                    value={newEnterpriseTier}
                    onChange={(e: any) => setNewEnterpriseTier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="Tier-1 Gold">Tier-1 Gold</option>
                    <option value="Tier-2 Silver">Tier-2 Silver</option>
                    <option value="Tier-3 Standard">Tier-3 Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chỉ tiêu Quota OJT (Slots)</label>
                  <input
                    type="number"
                    min={1}
                    value={newEnterpriseQuota}
                    onChange={(e) => setNewEnterpriseQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người đại diện liên hệ</label>
                  <input
                    type="text"
                    placeholder="Họ và tên HR / Manager"
                    value={newEnterpriseContact}
                    onChange={(e) => setNewEnterpriseContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email liên hệ hợp tác</label>
                <input
                  type="email"
                  placeholder="contact@partner.com"
                  value={newEnterpriseEmail}
                  onChange={(e) => setNewEnterpriseEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QhdnEnterpriseManagement;
