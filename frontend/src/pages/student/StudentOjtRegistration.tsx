import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { mockStudentProfile } from '@/data/student/mockStudentData';
import { useNavigate } from 'react-router-dom';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { BotSparkleIcon, CheckCircleIcon, ArrowRightIcon, BuildingIcon, LocationIcon, UsersIcon, CloseIcon, AcademicCapIcon, BriefcaseIcon } from '@/components/common/icons/AppIcons';

// Mock Data for OJT Companies
const mockCompanies = [
  {
    id: 'fpt-soft',
    name: 'FPT Software',
    logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&auto=format',
    location: 'F-Town 3, Khu Công nghệ cao, TP.HCM',
    roles: ['Frontend Developer', 'Backend Developer', 'Tester'],
    slots: 50,
    applied: 120,
    tags: ['Đảm bảo việc làm', 'Trợ cấp cao'],
    matchScore: 92,
  },
  {
    id: 'vng',
    name: 'VNG Corporation',
    logo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=100&h=100&fit=crop&auto=format',
    location: 'Z06 Đường số 13, Tân Thuận Đông, Quận 7',
    roles: ['Game Developer', 'Data Analyst'],
    slots: 15,
    applied: 85,
    tags: ['Môi trường năng động', 'Thử thách cao'],
    matchScore: 85,
  },
  {
    id: 'tiki',
    name: 'Tiki Corporation',
    logo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=100&h=100&fit=crop&auto=format',
    location: '52 Út Tịch, Phường 4, Tân Bình, TP.HCM',
    roles: ['ReactJS Dev', 'NodeJS Dev'],
    slots: 10,
    applied: 30,
    tags: ['Thương mại điện tử'],
    matchScore: 78,
  },
  {
    id: 'cyber',
    name: 'CyberLogitec',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop&auto=format',
    location: 'Tòa nhà Hưng Bình, Q.Tân Bình',
    roles: ['Java Developer', 'DevOps'],
    slots: 20,
    applied: 15,
    tags: ['Logistics', 'Quốc tế'],
    matchScore: 88,
  }
];

export const StudentOjtRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();
  const [activeTab, setActiveTab] = useState<'companies' | 'my-application'>('companies');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const applicationSteps = [
    { id: 1, name: 'Tạo và nộp hồ sơ (CV)', status: 'completed', date: '10/09/2026', desc: 'Hồ sơ đã được lưu trữ trên hệ thống trường.' },
    { id: 2, name: 'Đăng ký nguyện vọng', status: 'completed', date: '12/09/2026', desc: 'Đã nộp nguyện vọng vào FPT Software.' },
    { id: 3, name: 'Trường và Doanh nghiệp điều phối', status: 'current', date: 'Đang xử lý', desc: 'Nhà trường đang gửi hồ sơ của bạn cho doanh nghiệp xét duyệt sơ bộ.' },
    { id: 4, name: 'Phỏng vấn tại Doanh nghiệp', status: 'upcoming', date: 'Chờ lịch', desc: 'Doanh nghiệp sẽ liên hệ sắp xếp lịch phỏng vấn.' },
    { id: 5, name: 'Kết quả OJT', status: 'upcoming', date: 'Chưa có', desc: 'Nhận kết quả trúng tuyển từ doanh nghiệp.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        description="Nộp hồ sơ, theo dõi tiến độ và đăng ký nguyện vọng thực tập tại các doanh nghiệp đối tác."
        badge="Kỳ Fall 2026"
        primaryAction={{
          label: 'Hỏi AI cách viết CV',
          icon: <BotSparkleIcon size={16} />,
          onClick: () => openAIConsult('Hãy hướng dẫn tôi cách viết CV OJT gây ấn tượng với nhà tuyển dụng, đặc biệt cho vị trí Frontend Developer.'),
        }}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deadline Card */}
        <div className="card-glass p-5 flex flex-col justify-between border-l-4 border-l-orange-500 hover:shadow-orange-500/10 hover:border-l-orange-400 transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hạn đăng ký nguyện vọng</h3>
            <div className="text-2xl font-black text-slate-800 font-outfit">30/09/2026</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 font-semibold bg-orange-50 w-fit px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Còn 15 ngày
          </div>
        </div>

        {/* Profile Status Card */}
        <div className="card-glass p-5 flex flex-col justify-between border-l-4 border-l-blue-500 hover:shadow-blue-500/10 hover:border-l-blue-400 transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tình trạng Hồ sơ (CV)</h3>
            <div className="text-2xl font-black text-slate-800 font-outfit">Đã phê duyệt</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setIsProfileModalOpen(true)}>
            <CheckCircleIcon size={16} />
            Xem hồ sơ của tôi
          </div>
        </div>

        {/* Applied Count Card */}
        <div className="card-glass p-5 flex flex-col justify-between border-l-4 border-l-purple-500 hover:shadow-purple-500/10 hover:border-l-purple-400 transition-all duration-300 transform hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nguyện vọng đã nộp</h3>
            <div className="text-2xl font-black text-slate-800 font-outfit">2 <span className="text-sm text-slate-400">/ 3 Tối đa</span></div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab('my-application')}>
            <ArrowRightIcon size={16} />
            Theo dõi tiến độ
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card-glass overflow-hidden shadow-lg border border-slate-100">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-4">
          <button
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors duration-200 ${activeTab === 'companies'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            onClick={() => setActiveTab('companies')}
          >
            Danh sách Doanh nghiệp
          </button>
          <button
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors duration-200 ${activeTab === 'my-application'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            onClick={() => setActiveTab('my-application')}
          >
            Tiến độ nộp hồ sơ
          </button>
        </div>

        <div className="p-6 bg-white min-h-[400px]">
          {activeTab === 'companies' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Doanh nghiệp tuyển dụng đợt này</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="Tìm kiếm công ty..." className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all" />
                  <button className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors">
                    Lọc
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {mockCompanies.map((company) => (
                  <div key={company.id} className="group border border-slate-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 bg-white flex flex-col justify-between">
                    <div className="flex gap-4 items-start">
                      <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100 group-hover:scale-105 transition-transform duration-300" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-orange-600 transition-colors">{company.name}</h3>
                          <span className="flex items-center gap-1 bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-lg">
                            <BotSparkleIcon size={12} />
                            Độ phù hợp: {company.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <LocationIcon size={12} className="text-slate-400" />
                          {company.location}
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                            <UsersIcon size={14} className="text-blue-500" />
                            <span>Chỉ tiêu: <span className="font-bold">{company.slots}</span></span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-slate-500">
                            <span>Đã đăng ký: {company.applied}</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-600">
                          <span className="font-semibold">Vị trí:</span> {company.roles.join(', ')}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {company.tags.map(tag => (
                            <span key={tag} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
                      <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm transition-colors text-center shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5">
                        Đăng ký NV
                      </button>
                      <button className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm transition-colors text-center">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Tiến độ nộp hồ sơ của bạn</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                  Nguyện vọng 1: FPT Software
                </span>
              </div>

              {/* Custom Stepper */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100"></div>

                <div className="space-y-6">
                  {applicationSteps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';

                    return (
                      <div key={step.id} className="relative flex items-start gap-6">
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm transition-colors duration-300 ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                          }`}>
                          {isCompleted ? <CheckCircleIcon size={20} /> : step.id}
                        </div>

                        <div className={`pt-3 flex-1 ${isCurrent ? 'opacity-100' : 'opacity-70'}`}>
                          <h4 className={`text-base font-bold ${isCurrent ? 'text-orange-600' : 'text-slate-800'}`}>
                            {step.name}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {isCompleted ? `Hoàn thành lúc: ${step.date}` : isCurrent ? step.desc : step.desc}
                          </p>

                          {isCurrent && (
                            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                              <BotSparkleIcon size={20} className="text-orange-500 mt-0.5" />
                              <div className="text-sm text-slate-700">
                                <strong>AI Gợi ý:</strong> Trong lúc chờ trường điều phối, bạn có thể xem lại kiến thức về ReactJS và chuẩn bị cho vòng phỏng vấn.
                                <button onClick={() => openAIConsult('Mô phỏng phỏng vấn Frontend Developer cho tôi.')} className="ml-1 text-orange-600 font-semibold hover:underline">
                                  Bắt đầu mock interview ngay.
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsProfileModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <AcademicCapIcon className="text-blue-600" />
                Hồ sơ thực tập (OJT Profile)
              </h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Profile Header */}
              <div className="flex gap-6 items-center">
                <img src={mockStudentProfile.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{mockStudentProfile.fullName}</h3>
                  <p className="text-slate-500 font-medium">{mockStudentProfile.studentCode} • {mockStudentProfile.major}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-200">
                      Trạng thái: Đã duyệt
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-200">
                      GPA: {mockStudentProfile.gpa}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <BriefcaseIcon size={16} className="text-orange-500" />
                    Kỹ năng chuyên môn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['ReactJS', 'NodeJS', 'TypeScript', 'TailwindCSS', 'Git'].map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <UsersIcon size={16} className="text-purple-500" />
                    Hoạt động ngoại khóa
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                      Thành viên CLB F-Code (2024-nay)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                      Giải Nhì Hackathon FPTU 2025
                    </li>
                  </ul>
                </div>
              </div>

              {/* CV Preview Section */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Bản xem trước CV (PDF)</h4>
                <div className="w-full h-[400px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11V17L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 17L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="font-medium text-sm">NguyenVanA_CV_Frontend.pdf</p>
                  <button className="mt-2 px-4 py-2 bg-orange-100 text-orange-600 text-xs font-bold rounded-xl hover:bg-orange-200 transition-colors">
                    Tải xuống CV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOjtRegistration;
