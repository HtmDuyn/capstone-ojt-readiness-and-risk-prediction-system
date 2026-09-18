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
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  MOCK_ENTERPRISE_PARTNERS,
  MOCK_INTERNSHIP_POSITIONS,
} from '@/data/qhdnMockData';
import type { EnterprisePartner, InternshipPosition } from '@/types/qhdn/qhdnTypes';

export const QhdnEnterpriseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partners' | 'positions' | 'quotas'>('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEnterpriseName, setNewEnterpriseName] = useState('');
  const [newEnterpriseCode, setNewEnterpriseCode] = useState('');
  const [newEnterpriseIndustry, setNewEnterpriseIndustry] = useState('');
  const [newEnterpriseTier, setNewEnterpriseTier] = useState<'Tier-1 Gold' | 'Tier-2 Silver' | 'Tier-3 Standard'>('Tier-1 Gold');
  const [newEnterpriseQuota, setNewEnterpriseQuota] = useState(50);
  const [newEnterpriseContact, setNewEnterpriseContact] = useState('');
  const [newEnterpriseEmail, setNewEnterpriseEmail] = useState('');

  // Partners list state
  const [partners, setPartners] = useState<EnterprisePartner[]>(MOCK_ENTERPRISE_PARTNERS);
  const [positions, setPositions] = useState<InternshipPosition[]>(MOCK_INTERNSHIP_POSITIONS);

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

  return (
    <div className="space-y-6 pb-8">
      {/* Page Banner */}
      <PageBanner
        title="Quản lý Doanh nghiệp & Vị trí Thực tập"
        description="Quản lý mạng lưới doanh nghiệp đối tác liên kết, vị trí tuyển dụng OJT và chỉ tiêu tiếp nhận (quota)."
        badge="Phòng QHDN"
      />

      {/* Tabs Navigation Header */}
      <div className="card-glass p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs Segmented Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'quotas'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={16} />
            Chỉ tiêu tiếp nhận (Quota)
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          {activeTab === 'positions' ? 'Thêm vị trí tuyển dụng' : 'Thêm DN đối tác mới'}
        </button>
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

      {/* TAB 1: DOANH NGHIỆP LIÊN KẾT */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="card-glass p-5 hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        partner.tier.includes('Tier-1')
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : partner.tier.includes('Tier-2')
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {partner.tier}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Mã DN: {partner.code}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      partner.mouStatus === 'Active'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}
                  >
                    MOU: {partner.mouStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded-lg font-medium">
                  {partner.industry}
                </p>

                {/* Info Contact */}
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400 shrink-0" />
                    <span>Đầu mối: <strong>{partner.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{partner.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{partner.contactPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-500 line-clamp-2">{partner.address}</span>
                  </div>
                </div>
              </div>

              {/* Footer Quota Indicator */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Chỉ tiêu Quota OJT:</span>
                  <span className="font-bold text-slate-900">
                    {partner.acceptedCount} / {partner.totalQuota} slots
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    style={{ width: `${Math.round((partner.acceptedCount / partner.totalQuota) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>Hạn Hợp tác: {partner.mouExpiryDate}</span>
                  <span className="text-emerald-600 font-bold">Còn trống {partner.availableQuota}</span>
                </p>
              </div>
            </div>
          ))}
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

      {/* ADD ENTERPRISE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={20} className="text-orange-500" />
                Thêm Doanh nghiệp Đối tác Mới
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
