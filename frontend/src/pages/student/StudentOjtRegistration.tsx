import React, { useState, useMemo, useCallback } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { mockStudentProfile } from '@/data/student/mockStudentData';
import { useNavigate } from 'react-router-dom';
import { useBaseLayout } from '@/layouts/BaseLayout';
import {
  BotSparkleIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SearchIcon,
  FilterIcon,
  CheckIcon,
  ExternalLinkIcon,
  InfoIcon,
  ClockIcon,
  BuildingIcon,
  LocationIcon,
  UsersIcon,
  CloseIcon
} from '@/components/common/icons/AppIcons';

// ==========================================
// TYPES & INTERFACES
// ==========================================
export interface OjtCompany {
  id: string;
  name: string;
  logo: string;
  location: string;
  website: string;
  industry: string;
  roles: string[];
  slots: number;
  applied: number;
  tags: string[];
  matchScore: number;
  description: string;
  benefits: string[];
  requirements: string[];
}

export type OjtStatus = 'CHƯA_ĐĂNG_KÝ' | 'CHỜ_DUYỆT' | 'ĐÃ_TRÚNG_TUYỂN' | 'TỪ_CHỐI_ĐIỀU_PHỐI';

export interface SingleOjtApplication {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  role: string;
  appliedDate: string;
  status: OjtStatus;
  rejectionReason?: string;
  cvName: string;
  phone: string;
  email: string;
  note?: string;
}

// ==========================================
// CONSTANTS & MOCK DATA
// ==========================================
const INITIAL_COMPANIES: OjtCompany[] = [
  {
    id: 'fpt-soft',
    name: 'FPT Software',
    logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&auto=format',
    location: 'F-Town 3, Khu Công nghệ cao, TP.HCM',
    website: 'https://fpt-software.com',
    industry: 'Công nghệ thông tin & Phần mềm',
    roles: ['Frontend Developer', 'Backend Developer', 'Tester'],
    slots: 50,
    applied: 120,
    tags: ['Đảm bảo việc làm', 'Trợ cấp 8-12tr', 'Đào tạo bài bản'],
    matchScore: 92,
    description: 'FPT Software là công ty xuất khẩu dịch vụ phần mềm hàng đầu Việt Nam, cung cấp giải pháp công nghệ chuyển đổi số cho hàng trăm doanh nghiệp Fortune 500 toàn cầu.',
    benefits: ['Trợ cấp hàng tháng từ 8 - 12 triệu VNĐ', 'Tham gia dự án thật với Mentor 1-on-1', 'Cơ hội ký hợp đồng chính thức ngay sau khi kết thúc OJT'],
    requirements: ['Sinh viên ngành SE/IA/AI có GPA > 2.8', 'Nắm vững JavaScript/TypeScript, ReactJS hoặc Java/Spring Boot', 'Tiếng Anh giao tiếp hoặc đọc hiểu tài liệu tốt (TOEIC > 600)']
  },
  {
    id: 'vng',
    name: 'VNG Corporation',
    logo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=120&h=120&fit=crop&auto=format',
    location: 'Z06 Đường số 13, Tân Thuận Đông, Quận 7, TP.HCM',
    website: 'https://vng.com.vn',
    industry: 'Internet & Game Publishing',
    roles: ['Game Developer', 'Data Analyst', 'Mobile App Dev'],
    slots: 15,
    applied: 85,
    tags: ['Môi trường năng động', 'Thử thách cao', 'VNG Campus'],
    matchScore: 85,
    description: 'VNG là công ty công nghệ Kỳ lân đầu tiên của Việt Nam, nổi tiếng với hệ sinh thái Zalo, ZaloPay, Zing và hàng loạt tựa game đình đám.',
    benefits: ['Làm việc tại VNG Campus chuẩn quốc tế', 'Môi trường làm việc trẻ trung, sáng tạo', 'Hỗ trợ thiết bị laptop & phụ cấp thực tập'],
    requirements: ['Tư duy thuật toán và cấu trúc dữ liệu vững', 'Thành thạo C++, C# hoặc Python/SQL', 'Đam mê sản phẩm công nghệ người dùng lớn']
  },
  {
    id: 'tiki',
    name: 'Tiki Corporation',
    logo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=120&h=120&fit=crop&auto=format',
    location: '52 Út Tịch, Phường 4, Tân Bình, TP.HCM',
    website: 'https://tiki.vn',
    industry: 'Thương mại điện tử & Logistics',
    roles: ['ReactJS Dev', 'NodeJS Dev', 'UI/UX Designer'],
    slots: 10,
    applied: 30,
    tags: ['Thương mại điện tử', 'Hệ thống Microservices'],
    matchScore: 78,
    description: 'Tiki là sàn thương mại điện tử uy tín hàng đầu Việt Nam với định hướng chất lượng dịch vụ và tốc độ giao hàng vượt trội TikiNOW.',
    benefits: ['Cơ hội tiếp cận kiến trúc microservices lượng truy cập khủng', 'Trợ cấp 7 - 10 triệu VNĐ/tháng', 'Voucher mua sắm nội bộ'],
    requirements: ['Có sản phẩm demo cá nhân hoặc dự án đồ án môn học tốt', 'Hiểu biết về RESTful API, Database SQL/NoSQL']
  },
  {
    id: 'cyber',
    name: 'CyberLogitec',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&h=120&fit=crop&auto=format',
    location: 'Tòa nhà Hưng Bình, Q. Tân Bình, TP.HCM',
    website: 'https://cyberlogitec.com.vn',
    industry: 'Giải pháp Phần mềm Logistics Quốc tế',
    roles: ['Java Developer', 'DevOps Engineer', 'QA Automation'],
    slots: 20,
    applied: 15,
    tags: ['Logistics toàn cầu', 'Chuẩn quốc tế', 'Cơ hội Onsite'],
    matchScore: 88,
    description: 'CyberLogitec Vietnam thuộc tập đoàn CyberLogitec Hàn Quốc, chuyên cung cấp hệ thống điều hành cảng biển và vận tải logistics toàn cầu.',
    benefits: ['Trợ cấp cạnh tranh 9 - 13 triệu VNĐ', 'Tham gia khóa đào tạo chuyên sâu Logistics Software', 'Thưởng hoàn thành kỳ OJT xuất sắc'],
    requirements: ['Lập trình Java core, Spring Boot tốt', 'Hiểu biết căn bản về Docker, CI/CD là lợi thế', 'Đọc hiểu tài liệu Tiếng Anh chuyên ngành']
  }
];

const DEFAULT_APPLICATION: SingleOjtApplication = {
  id: 'app-001',
  companyId: 'fpt-soft',
  companyName: 'FPT Software',
  companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&auto=format',
  role: 'Frontend Developer',
  appliedDate: '12/09/2026',
  status: 'CHỜ_DUYỆT',
  cvName: 'NguyenVanA_CV_Frontend_2026.pdf',
  phone: '0987654321',
  email: 'anv.se160123@fpt.edu.vn',
  note: 'Mong muốn được thực tập tại dự án ReactJS/Next.js của FPT Software.'
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

/** Toast Notification Component */
const ToastNotification: React.FC<{ message: string | null; onClose: () => void }> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
      <CheckCircleIcon size={20} className="text-emerald-400 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors">
        <CloseIcon size={16} />
      </button>
    </div>
  );
};

/** Demo State Switcher Component for Testing */
const DemoStateSwitcher: React.FC<{
  currentStatus?: OjtStatus;
  onSimulate: (status: OjtStatus) => void;
}> = ({ currentStatus, onSimulate }) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs border border-slate-800">
      <div className="flex items-center gap-2 font-semibold text-slate-300">
        <InfoIcon size={16} className="text-amber-400 shrink-0" />
        <span>Thử nghiệm luồng (Demo State):</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSimulate('CHƯA_ĐĂNG_KÝ')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${!currentStatus ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          1. Chưa đăng ký
        </button>
        <button
          type="button"
          onClick={() => onSimulate('CHỜ_DUYỆT')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${currentStatus === 'CHỜ_DUYỆT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          2. Đang chờ DN duyệt
        </button>
        <button
          type="button"
          onClick={() => onSimulate('TỪ_CHỐI_ĐIỀU_PHỐI')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${currentStatus === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          3. DN từ chối (Trường điều phối lại)
        </button>
        <button
          type="button"
          onClick={() => onSimulate('ĐÃ_TRÚNG_TUYỂN')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${currentStatus === 'ĐÃ_TRÚNG_TUYỂN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          4. Đã trúng tuyển
        </button>
      </div>
    </div>
  );
};

/** Stat Summary Cards Component */
const OjtStatCards: React.FC<{
  myApplication: SingleOjtApplication | null;
  onRegisterClick: () => void;
  onViewProgressClick: () => void;
}> = ({ myApplication, onRegisterClick, onViewProgressClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Deadline Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-all">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn đăng ký OJT</h3>
            <ClockIcon className="text-orange-500" size={16} />
          </div>
          <div className="text-2xl font-black text-slate-900 font-outfit">30/09/2026</div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50/80 w-fit px-3 py-1 rounded-full border border-orange-100">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Còn 15 ngày đăng ký
        </div>
      </div>

      {/* Profile Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tình trạng Hồ sơ (CV)</h3>
            <CheckCircleIcon className="text-emerald-500" size={16} />
          </div>
          <div className="text-2xl font-black text-slate-900 font-outfit flex items-center gap-2">
            Đã phê duyệt
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 w-fit px-3 py-1 rounded-full border border-emerald-100">
          <CheckIcon size={14} className="text-emerald-600" />
          <span>CV đã sẵn sàng nộp OJT</span>
        </div>
      </div>

      {/* Chosen Enterprise Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh nghiệp đã chọn</h3>
            <BriefcaseIcon className="text-purple-500" size={16} />
          </div>
          <div className="text-xl font-black text-slate-900 font-outfit truncate">
            {myApplication ? myApplication.companyName : 'Chưa đăng ký'}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {myApplication?.status === 'CHỜ_DUYỆT' && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
              ⏳ Đang chờ xét duyệt
            </span>
          )}
          {myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' && (
            <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 animate-pulse">
              ⚠️ Cần chọn lại DN
            </span>
          )}
          {myApplication?.status === 'ĐÃ_TRÚNG_TUYỂN' && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
              🎉 Đã trúng tuyển
            </span>
          )}
          {!myApplication && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">
              Chưa chọn công ty
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (!myApplication || myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI') onRegisterClick();
              else onViewProgressClick();
            }}
            className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
          >
            {!myApplication || myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? 'Đăng ký ngay' : 'Xem tiến độ'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Company Card Component (Only "Xem chi tiết" button) */
const CompanyCard: React.FC<{
  company: OjtCompany;
  isSelectedByStudent: boolean;
  onViewDetail: (company: OjtCompany) => void;
}> = React.memo(({ company, isSelectedByStudent, onViewDetail }) => {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between group ${isSelectedByStudent
        ? 'border-orange-400 shadow-md ring-2 ring-orange-500/10'
        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-lg'
        }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex gap-4 items-start">
          <img
            src={company.logo}
            alt={company.name}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200/80 p-0.5 bg-slate-50 group-hover:scale-105 transition-transform duration-300 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors truncate">
                {company.name}
              </h3>
              <span className="shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/60">
                <BotSparkleIcon size={12} className="text-emerald-500" />
                Khớp {company.matchScore}%
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
              <LocationIcon size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{company.location}</span>
            </div>
          </div>
        </div>

        {/* Stats & Selected badge */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 mt-4 text-xs">
          <div className="flex items-center gap-4 text-slate-700">
            <div className="flex items-center gap-1">
              <UsersIcon size={14} className="text-blue-500" />
              <span>Chỉ tiêu: <strong className="text-slate-900">{company.slots}</strong></span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-500">
              Đã đăng ký: <strong className="text-slate-700">{company.applied}</strong>
            </div>
          </div>

          {isSelectedByStudent && (
            <span className="bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <CheckIcon size={12} /> Đã chọn
            </span>
          )}
        </div>

        {/* Open Roles */}
        <div className="mt-3">
          <span className="text-xs font-semibold text-slate-500">Vị trí tuyển dụng: </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {company.roles.map(role => (
              <span
                key={role}
                className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-md border border-slate-200/60"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {company.tags.map(tag => (
            <span key={tag} className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onViewDetail(company)}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
        >
          <InfoIcon size={15} />
          <span>Xem chi tiết doanh nghiệp</span>
        </button>
      </div>
    </div>
  );
});

CompanyCard.displayName = 'CompanyCard';

/** Application Timeline & Stepper Component */
const ApplicationTimeline: React.FC<{
  myApplication: SingleOjtApplication | null;
  onOpenRegisterModal: () => void;
}> = ({ myApplication, onOpenRegisterModal }) => {
  const applicationSteps = useMemo(() => [
    {
      id: 1,
      name: 'Tạo & Duyệt hồ sơ (CV)',
      status: 'completed',
      date: '10/09/2026',
      desc: 'Hồ sơ CV đã được kiểm duyệt và lưu giữ trên hệ thống nhà trường.'
    },
    {
      id: 2,
      name: 'Đăng ký Doanh nghiệp OJT',
      status: myApplication ? 'completed' : 'current',
      date: myApplication ? myApplication.appliedDate : 'Đang mở',
      desc: myApplication ? `Đã nộp hồ sơ vào ${myApplication.companyName}.` : 'Sinh viên chọn 1 doanh nghiệp trong danh sách để nộp hồ sơ.'
    },
    {
      id: 3,
      name: 'Trường & Doanh nghiệp xét duyệt',
      status: myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI'
        ? 'rejected'
        : myApplication?.status === 'CHỜ_DUYỆT'
          ? 'current'
          : myApplication?.status === 'ĐÃ_TRÚNG_TUYỂN'
            ? 'completed'
            : 'upcoming',
      date: myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? 'Cần điều phối' : 'Đang xử lý',
      desc: myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI'
        ? 'Doanh nghiệp chưa nhận hồ sơ. Nhà trường mở lại quyền cho sinh viên chọn doanh nghiệp khác.'
        : 'Doanh nghiệp đang đánh giá hồ sơ và lên lịch phỏng vấn.'
    },
    {
      id: 4,
      name: 'Phỏng vấn & Kết quả OJT',
      status: myApplication?.status === 'ĐÃ_TRÚNG_TUYỂN' ? 'completed' : 'upcoming',
      date: 'Theo lịch',
      desc: 'Doanh nghiệp phản hồi kết quả trúng tuyển chính thức.'
    },
  ], [myApplication]);

  return (
    <div className="p-6 space-y-8">
      {/* Current Application Banner */}
      {myApplication ? (
        <div className={`p-5 rounded-2xl border ${myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI'
          ? 'bg-red-50/70 border-red-200'
          : myApplication.status === 'ĐÃ_TRÚNG_TUYỂN'
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-blue-50/70 border-blue-200'
          }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={myApplication.companyLogo} alt={myApplication.companyName} className="w-14 h-14 rounded-2xl object-cover border border-white shadow-sm" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">{myApplication.companyName}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : myApplication.status === 'ĐÃ_TRÚNG_TUYỂN'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                    {myApplication.status === 'CHỜ_DUYỆT' ? '⏳ Đang chờ xét duyệt' : myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? '⚠️ Doanh nghiệp chưa nhận (Đang điều phối)' : '🎉 Đã trúng tuyển'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Vị trí đăng ký: <strong className="text-slate-900">{myApplication.role}</strong> • Nộp ngày: {myApplication.appliedDate}
                </p>
              </div>
            </div>

            {myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' && (
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
              >
                Chọn Doanh Nghiệp Khác Ngay
              </button>
            )}
          </div>

          {myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' && (
            <div className="mt-4 pt-3 border-t border-red-200/60 text-xs text-red-800 flex items-start gap-2">
              <InfoIcon size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span><strong>Lý do từ trường:</strong> {myApplication.rejectionReason}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <AcademicCapIcon size={36} className="mx-auto text-slate-400" />
          <h4 className="font-bold text-slate-800 text-base">Bạn chưa nộp hồ sơ OJT cho doanh nghiệp nào</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Vui lòng tham khảo danh sách doanh nghiệp đối tác và thực hiện đăng ký nguyện vọng OJT.</p>
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            + Bấm Đăng ký OJT Ngay
          </button>
        </div>
      )}

      {/* Stepper */}
      <div className="pt-4 border-t border-slate-200/80">
        <h3 className="text-base font-bold text-slate-900 mb-6">Quy trình & Tiến độ Xét duyệt OJT</h3>

        <div className="relative pl-4 md:pl-6 space-y-6">
          <div className="absolute left-7 md:left-9 top-3 bottom-3 w-0.5 bg-slate-200"></div>

          {applicationSteps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isRejected = step.status === 'rejected';

            return (
              <div key={step.id} className="relative flex items-start gap-4 md:gap-6">
                <div
                  className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm shrink-0 transition-colors ${isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isRejected
                      ? 'bg-red-500 text-white'
                      : isCurrent
                        ? 'bg-orange-500 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                >
                  {isCompleted ? <CheckIcon size={18} /> : isRejected ? <CloseIcon size={18} /> : step.id}
                </div>

                <div className={`pt-1.5 flex-1 ${isCurrent || isRejected ? 'opacity-100' : 'opacity-80'}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className={`text-sm md:text-base font-bold ${isRejected ? 'text-red-600' : isCurrent ? 'text-orange-600' : 'text-slate-800'}`}>
                      {step.name}
                    </h4>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isCompleted ? 'bg-emerald-50 text-emerald-700' : isRejected ? 'bg-red-100 text-red-700' : isCurrent ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {step.date}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Interactive OJT Registration Modal (Single Company Select Dropdown) */
const OjtRegistrationModal: React.FC<{
  isOpen: boolean;
  companies: OjtCompany[];
  formCompanyId: string;
  formRole: string;
  formPhone: string;
  formEmail: string;
  formCvChoice: 'system' | 'upload';
  formPortfolioUrl: string;
  formNote: string;
  formAgreed: boolean;
  formError: string;
  isSubmitting: boolean;
  onClose: () => void;
  onCompanyChange: (id: string) => void;
  onRoleChange: (role: string) => void;
  onPhoneChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onCvChoiceChange: (val: 'system' | 'upload') => void;
  onPortfolioUrlChange: (val: string) => void;
  onNoteChange: (val: string) => void;
  onAgreedChange: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({
  isOpen,
  companies,
  formCompanyId,
  formRole,
  formPhone,
  formEmail,
  formCvChoice,
  formPortfolioUrl,
  formNote,
  formAgreed,
  formError,
  isSubmitting,
  onClose,
  onCompanyChange,
  onRoleChange,
  onPhoneChange,
  onEmailChange,
  onCvChoiceChange,
  onPortfolioUrlChange,
  onNoteChange,
  onAgreedChange,
  onSubmit,
}) => {
    if (!isOpen) return null;

    const selectedCompany = companies.find(c => c.id === formCompanyId) || companies[0];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <AcademicCapIcon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Biểu Mẫu Đăng Ký OJT (1 Doanh Nghiệp)</h2>
                <p className="text-xs text-slate-500">Chọn 1 doanh nghiệp thực tập và điền thông tin hồ sơ gửi nhà trường</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                <InfoIcon size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Read-only Student Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <AcademicCapIcon size={14} className="text-orange-500" />
                Thông tin Sinh viên (Hệ thống)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Họ tên:</span>
                  <strong className="text-slate-800 font-bold">{mockStudentProfile.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">MSSV:</span>
                  <strong className="text-slate-800 font-bold">{mockStudentProfile.studentCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Chuyên ngành:</span>
                  <strong className="text-slate-800 font-bold">{mockStudentProfile.major}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">GPA Hiện tại:</span>
                  <strong className="text-emerald-600 font-bold">{mockStudentProfile.gpa} / 4.0</strong>
                </div>
              </div>
            </div>

            {/* Section 2: Company Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <BriefcaseIcon size={16} className="text-orange-500" />
                1. Chọn Doanh nghiệp & Vị trí tuyển dụng OJT
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Doanh nghiệp đối tác *</label>
                  <select
                    value={formCompanyId}
                    onChange={(e) => onCompanyChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — (Chỉ tiêu: {c.slots} SV)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Vị trí ứng tuyển *</label>
                  <select
                    value={formRole}
                    onChange={(e) => onRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  >
                    {selectedCompany.roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company summary mini box */}
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-9 h-9 rounded-lg object-cover" />
                  <div>
                    <strong className="text-slate-900 block font-bold">{selectedCompany.name}</strong>
                    <span className="text-slate-500 text-[11px]">{selectedCompany.location}</span>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  Khớp {selectedCompany.matchScore}% AI
                </span>
              </div>
            </div>

            {/* Section 3: Contact Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                2. Thông tin liên hệ nhận thông báo phỏng vấn
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại di động *</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="0987xxxxxx"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="anv@fpt.edu.vn"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: CV & Portfolio */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                3. Hồ sơ ứng tuyển & Portfolio
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Chọn CV đính kèm *</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2.5 text-xs">
                      <input
                        type="radio"
                        name="cvChoice"
                        checked={formCvChoice === 'system'}
                        onChange={() => onCvChoiceChange('system')}
                        className="text-orange-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">NguyenVanA_CV_Frontend_2026.pdf</span>
                        <span className="text-emerald-600 font-semibold text-[11px]">✓ CV đã được P.Đào tạo kiểm duyệt</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">System CV</span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 text-xs">
                      <input
                        type="radio"
                        name="cvChoice"
                        checked={formCvChoice === 'upload'}
                        onChange={() => onCvChoiceChange('upload')}
                        className="text-orange-500"
                      />
                      <span className="font-bold text-slate-700">Tải lên file CV mới (.pdf, tối đa 5MB)</span>
                    </div>
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Upload</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link GitHub / Portfolio cá nhân (Không bắt buộc)</label>
                <input
                  type="url"
                  value={formPortfolioUrl}
                  onChange={(e) => onPortfolioUrlChange(e.target.value)}
                  placeholder="https://github.com/username hoặc https://myportfolio.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {/* Section 5: Cover Letter Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lời nhắn gửi tới Nhà tuyển dụng (Optional)</label>
              <textarea
                rows={3}
                value={formNote}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Giới thiệu ngắn gọn định hướng bản thân, kỹ năng nổi bật hoặc lý do lựa chọn doanh nghiệp..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
              ></textarea>
            </div>

            {/* Section 6: Commitment Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer bg-orange-50/60 p-3.5 rounded-xl border border-orange-100">
              <input
                type="checkbox"
                checked={formAgreed}
                onChange={(e) => onAgreedChange(e.target.checked)}
                className="mt-0.5 text-orange-500 rounded focus:ring-orange-400"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Tôi cam kết thông tin khai báo là chính xác và tuân thủ các quy định OJT của Trường ĐH FPT và Doanh nghiệp tiếp nhận.
              </span>
            </label>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang gửi hồ sơ...</span>
                ) : (
                  <>
                    <CheckCircleIcon size={16} />
                    <span>Xác nhận Nộp Hồ sơ OJT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

/** Company Detail Modal Component */
const CompanyDetailModal: React.FC<{
  company: OjtCompany | null;
  myApplication: SingleOjtApplication | null;
  onClose: () => void;
  onSelectCompany: (companyId: string) => void;
}> = ({ company, myApplication, onClose, onSelectCompany }) => {
  if (!company) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Detail Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <img
              src={company.logo}
              alt={company.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{company.name}</h2>
              <p className="text-xs text-slate-500">{company.industry}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
            <div>
              <span className="text-slate-400 block">Địa điểm:</span>
              <strong className="text-slate-800">{company.location}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Chỉ tiêu OJT đợt này:</span>
              <strong className="text-slate-800">{company.slots} SV (Đã ĐK {company.applied})</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Độ phù hợp hồ sơ AI:</span>
              <strong className="text-emerald-600 font-bold">{company.matchScore}% Matching</strong>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Giới thiệu công ty</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{company.description}</p>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vị trí đang mở tuyển OJT</h3>
            <div className="flex flex-wrap gap-2">
              {company.roles.map(r => (
                <span key={r} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200/60">
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quyền lợi & Quyền ưu đãi</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {company.benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Yêu cầu tuyển dụng</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {company.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5"></div>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Modal Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ExternalLinkIcon size={14} />
              <span>Website công ty</span>
            </a>

            {(!myApplication || myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI') && (
              <button
                type="button"
                onClick={() => onSelectCompany(company.id)}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BriefcaseIcon size={16} />
                <span>Chọn công ty này để Đăng ký OJT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const StudentOjtRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'companies' | 'my-application'>('companies');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high-match' | 'available'>('all');

  // Single OJT Application State for Student
  const [myApplication, setMyApplication] = useState<SingleOjtApplication | null>(DEFAULT_APPLICATION);

  // Modal States
  const [selectedDetailCompany, setSelectedDetailCompany] = useState<OjtCompany | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form State for OJT Apply Modal
  const [formCompanyId, setFormCompanyId] = useState<string>('fpt-soft');
  const [formRole, setFormRole] = useState<string>('Frontend Developer');
  const [formPhone, setFormPhone] = useState<string>('0987654321');
  const [formEmail, setFormEmail] = useState<string>('anv.se160123@fpt.edu.vn');
  const [formCvChoice, setFormCvChoice] = useState<'system' | 'upload'>('system');
  const [formPortfolioUrl, setFormPortfolioUrl] = useState<string>('https://github.com/nguyenvana-dev');
  const [formNote, setFormNote] = useState<string>('');
  const [formAgreed, setFormAgreed] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Open apply modal handler
  const handleOpenRegisterModal = useCallback((presetCompanyId?: string) => {
    if (myApplication && myApplication.status === 'CHỜ_DUYỆT') {
      showToast('⚠️ Bạn đã có 1 hồ sơ đang chờ FPT Software xét duyệt. Không thể chọn thêm công ty khác.');
      return;
    }
    if (myApplication && myApplication.status === 'ĐÃ_TRÚNG_TUYỂN') {
      showToast('🎉 Bạn đã trúng tuyển OJT! Không cần đăng ký lại.');
      return;
    }

    const targetId = presetCompanyId || formCompanyId || INITIAL_COMPANIES[0].id;
    setFormCompanyId(targetId);
    const targetComp = INITIAL_COMPANIES.find(c => c.id === targetId) || INITIAL_COMPANIES[0];
    setFormRole(targetComp.roles[0] || '');
    setFormError('');
    setIsRegisterModalOpen(true);
  }, [myApplication, formCompanyId, showToast]);

  // Select company inside modal dropdown handler
  const handleSelectCompanyInForm = useCallback((companyId: string) => {
    setFormCompanyId(companyId);
    const comp = INITIAL_COMPANIES.find(c => c.id === companyId);
    if (comp) {
      setFormRole(comp.roles[0] || '');
    }
  }, []);

  // Submit OJT Registration Form
  const handleSubmitRegistration = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formPhone.trim() || !formEmail.trim()) {
      setFormError('Vui lòng điền đầy đủ số điện thoại và email liên hệ.');
      return;
    }
    if (!formRole) {
      setFormError('Vui lòng chọn vị trí thực tập ứng tuyển.');
      return;
    }
    if (!formAgreed) {
      setFormError('Vui lòng xác nhận cam kết quy định OJT.');
      return;
    }

    const comp = INITIAL_COMPANIES.find(c => c.id === formCompanyId);
    if (!comp) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newApp: SingleOjtApplication = {
        id: `app-${Date.now()}`,
        companyId: comp.id,
        companyName: comp.name,
        companyLogo: comp.logo,
        role: formRole,
        appliedDate: new Date().toLocaleDateString('vi-VN'),
        status: 'CHỜ_DUYỆT',
        cvName: 'NguyenVanA_CV_Frontend_2026.pdf',
        phone: formPhone,
        email: formEmail,
        note: formNote
      };

      setMyApplication(newApp);
      setIsSubmitting(false);
      setIsRegisterModalOpen(false);
      showToast(`🎉 Đăng ký thành công OJT tại ${comp.name}! Đang chờ DN xét duyệt.`);
    }, 600);
  }, [formPhone, formEmail, formRole, formAgreed, formCompanyId, formNote, showToast]);

  // Simulation state switcher helper
  const handleSimulateState = useCallback((status: OjtStatus) => {
    if (status === 'CHƯA_ĐĂNG_KÝ') {
      setMyApplication(null);
      showToast('Đã chuyển sang trạng thái: Chưa đăng ký OJT');
    } else if (status === 'CHỜ_DUYỆT') {
      setMyApplication(DEFAULT_APPLICATION);
      showToast('Đã chuyển sang trạng thái: Đang chờ DN xét duyệt');
    } else if (status === 'TỪ_CHỐI_ĐIỀU_PHỐI') {
      setMyApplication({
        ...DEFAULT_APPLICATION,
        status: 'TỪ_CHỐI_ĐIỀU_PHỐI',
        rejectionReason: 'Doanh nghiệp đã đủ chỉ tiêu vị trí Frontend đợt 1. Nhà trường điều phối sinh viên chọn doanh nghiệp khác.'
      });
      showToast('⚠️ Mô phỏng: Doanh nghiệp không nhận -> Nhà trường mở lại quyền chọn công ty!');
    } else if (status === 'ĐÃ_TRÚNG_TUYỂN') {
      setMyApplication({
        ...DEFAULT_APPLICATION,
        status: 'ĐÃ_TRÚNG_TUYỂN'
      });
      showToast('🎉 Đã chuyển sang trạng thái: Đã trúng tuyển OJT!');
    }
  }, [showToast]);

  // Filter companies with useMemo for optimal performance
  const filteredCompanies = useMemo(() => {
    return INITIAL_COMPANIES.filter(company => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        company.name.toLowerCase().includes(query) ||
        company.roles.some(r => r.toLowerCase().includes(query)) ||
        company.location.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedFilter === 'high-match') return company.matchScore >= 85;
      if (selectedFilter === 'available') return (company.slots - company.applied > 0) || company.slots >= 15;
      return true;
    });
  }, [searchQuery, selectedFilter]);

  // Handler to open modal from detail view
  const handleSelectFromDetail = useCallback((companyId: string) => {
    setSelectedDetailCompany(null);
    handleOpenRegisterModal(companyId);
  }, [handleOpenRegisterModal]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Toast Notification */}
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <PageBanner
        student={mockStudentProfile}
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200/80 font-outfit">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-white/40">›</span>
            <span className="text-amber-300 font-bold">Đăng ký OJT</span>
          </div>
        }
        title="Cổng Đăng Ký OJT"
        description="Mỗi sinh viên chọn 1 doanh nghiệp đối tác để nộp hồ sơ thực tập OJT Kỳ Fall 2026."
        badge="Kỳ Fall 2026"
        primaryAction={{
          label: myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? 'Chọn lại Doanh nghiệp' : myApplication ? 'Xem hồ sơ đã nộp' : 'Đăng ký OJT ngay',
          icon: <AcademicCapIcon size={16} />,
          onClick: () => {
            if (myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' || !myApplication) {
              handleOpenRegisterModal();
            } else {
              setActiveTab('my-application');
            }
          },
        }}
        secondaryAction={{
          label: 'Hỏi AI viết CV',
          icon: <BotSparkleIcon size={16} />,
          onClick: () => openAIConsult('Hướng dẫn tôi cách chỉnh sửa CV OJT để gây ấn tượng với các công ty CNTT.'),
        }}
      />

      {/* Demo State Switcher */}
      <DemoStateSwitcher currentStatus={myApplication?.status} onSimulate={handleSimulateState} />

      {/* Stat Cards */}
      <OjtStatCards
        myApplication={myApplication}
        onRegisterClick={() => handleOpenRegisterModal()}
        onViewProgressClick={() => setActiveTab('my-application')}
      />

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Navigation Header */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/50 px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'companies'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <BuildingIcon size={18} />
            <span>Danh sách Doanh nghiệp Đối tác</span>
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-200/70 text-slate-700 font-semibold">
              {INITIAL_COMPANIES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-application')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'my-application'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <BriefcaseIcon size={18} />
            <span>Tiến độ Hồ sơ OJT</span>
            {myApplication && (
              <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${myApplication.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                1
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Minimalist Companies Directory */}
        {activeTab === 'companies' && (
          <div className="p-6 space-y-6">
            {/* Notification alert if school opened re-registration */}
            {myApplication?.status === 'TỪ_CHỐI_ĐIỀU_PHỐI' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-red-800">
                <div className="flex items-start gap-3">
                  <InfoIcon size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-sm text-red-900 font-bold mb-0.5">Thông báo từ Phòng Đào tạo (Điều phối OJT):</strong>
                    {myApplication.rejectionReason || 'Doanh nghiệp trước đó đã đủ chỉ tiêu. Bạn được mở lại quyền đăng ký 1 doanh nghiệp khác còn tuyển bên dưới.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenRegisterModal()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shrink-0 cursor-pointer"
                >
                  Bấm Đăng ký Doanh nghiệp Mới
                </button>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
              {/* Search box */}
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên công ty, vị trí tuyển dụng (React, Java, Tester...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Quick filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 ml-1">
                  <FilterIcon size={14} /> Lọc:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Tất cả ({INITIAL_COMPANIES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('high-match')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${selectedFilter === 'high-match'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <BotSparkleIcon size={12} />
                  Phù hợp cao (&gt;85%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('available')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedFilter === 'available'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Còn chỉ tiêu nhiều
                </button>
              </div>
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isSelectedByStudent={myApplication?.companyId === company.id}
                  onViewDetail={setSelectedDetailCompany}
                />
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <BuildingIcon size={40} className="mx-auto text-slate-300" />
                <p className="text-sm font-medium">Không tìm thấy doanh nghiệp phù hợp với từ khóa lọc của bạn.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Application Timeline & Status */}
        {activeTab === 'my-application' && (
          <ApplicationTimeline
            myApplication={myApplication}
            onOpenRegisterModal={() => handleOpenRegisterModal()}
          />
        )}
      </div>

      {/* MODAL 1: INTERACTIVE OJT REGISTRATION FORM */}
      <OjtRegistrationModal
        isOpen={isRegisterModalOpen}
        companies={INITIAL_COMPANIES}
        formCompanyId={formCompanyId}
        formRole={formRole}
        formPhone={formPhone}
        formEmail={formEmail}
        formCvChoice={formCvChoice}
        formPortfolioUrl={formPortfolioUrl}
        formNote={formNote}
        formAgreed={formAgreed}
        formError={formError}
        isSubmitting={isSubmitting}
        onClose={() => setIsRegisterModalOpen(false)}
        onCompanyChange={handleSelectCompanyInForm}
        onRoleChange={setFormRole}
        onPhoneChange={setFormPhone}
        onEmailChange={setFormEmail}
        onCvChoiceChange={setFormCvChoice}
        onPortfolioUrlChange={setFormPortfolioUrl}
        onNoteChange={setFormNote}
        onAgreedChange={setFormAgreed}
        onSubmit={handleSubmitRegistration}
      />

      {/* MODAL 2: COMPANY DETAIL PREVIEW */}
      <CompanyDetailModal
        company={selectedDetailCompany}
        myApplication={myApplication}
        onClose={() => setSelectedDetailCompany(null)}
        onSelectCompany={handleSelectFromDetail}
      />
    </div>
  );
};

export default StudentOjtRegistration;



