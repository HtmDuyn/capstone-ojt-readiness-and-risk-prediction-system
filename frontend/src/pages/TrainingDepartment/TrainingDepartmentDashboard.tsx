import React from 'react';
import { TrainingDepartmentLayout, useTrainingDepartmentAIConsult } from '../../layouts/TrainingDepartmentLayout';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';

const mockDepartmentOverview = [
  { label: 'Sinh viên đang theo dõi', value: '1,284', tone: 'from-orange-500 to-amber-500' },
  { label: 'Yêu cầu OJT chờ duyệt', value: '316', tone: 'from-violet-500 to-purple-500' },
  { label: 'Cảnh báo học vụ', value: '17', tone: 'from-emerald-500 to-teal-500' },
  { label: 'Doanh nghiệp đang hợp tác', value: '92', tone: 'from-sky-500 to-cyan-500' },
];

const DashboardMainContent: React.FC = () => {
  const { openAIConsult } = useTrainingDepartmentAIConsult();

  return (
    <div className="space-y-6">
      <WelcomeBanner
        student={{
          id: 'dept-pdt-001',
          studentCode: 'PDT-001',
          fullName: 'Nguyễn Thị Lan',
          email: 'lannt.pdt@fpt.edu.vn',
          avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=256&auto=format&fit=crop',
          semester: 'Năm học 2025-2026',
          major: 'Phòng Đào Tạo',
          campus: 'FPT University',
          gpa: 0,
          gpaChange: 0,
          earnedCredits: 0,
          totalCredits: 0,
          missingCredits: 0,
          estimatedSemestersRemaining: 0,
          ojtStatus: 'pending',
          ojtVerifiedBy: 'Hệ thống',
        }}
        menuId="dashboard"
        primaryAction={{
          label: 'Xem báo cáo tổng quan',
          onClick: () => openAIConsult('Tổng hợp báo cáo nhanh về tình trạng OJT và sinh viên cần hỗ trợ trong kỳ này.'),
        }}
        secondaryAction={{
          label: 'Xem danh sách sinh viên',
          onClick: () => openAIConsult('Danh sách sinh viên có nguy cơ rủi ro học vụ hoặc thiếu điều kiện OJT cần can thiệp sớm.'),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {mockDepartmentOverview.map((item) => (
          <div key={item.label} className="card-glass p-5 rounded-2xl border border-white/20">
            <div className={`inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r ${item.tone} text-white text-[10px] font-bold uppercase tracking-[0.16em]`}>
              KPI
            </div>
            <div className="mt-4 text-3xl font-extrabold text-slate-900 font-outfit">{item.value}</div>
            <div className="mt-1 text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="card-glass p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-900 font-outfit">Tổng quan hoạt động</h2>
              <button
                type="button"
                onClick={() => openAIConsult('Phân tích xu hướng OJT, tiến độ sinh viên và các điểm cần điều chỉnh trong tuần này.')}
                className="px-3 py-2 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 hover:bg-orange-100 cursor-pointer"
              >
                Phân tích AI
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Đợt OJT đang mở', value: '92', detail: 'Đang nhận hồ sơ và xét duyệt.' },
                { title: 'Sinh viên đạt điều kiện', value: '79%', detail: 'Tăng 6% so với kỳ trước.' },
                { title: 'Sinh viên cần hỗ trợ', value: '174', detail: 'Cần nhắc nhở học vụ và hồ sơ.' },
                { title: 'Mức độ tối ưu doanh nghiệp', value: '88%', detail: 'Tỷ lệ đạt chuẩn đối tác.' },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-400">{card.title}</div>
                  <div className="mt-3 text-2xl font-extrabold text-slate-900 font-outfit">{card.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{card.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="card-glass p-6 rounded-3xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-outfit">Cần xử lý gấp</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {[
                '17 sinh viên thiếu điều kiện tiếng Anh OJT.',
                '26 hồ sơ doanh nghiệp đang chờ phản hồi.',
                'Đợt 4 bắt đầu trong 7 ngày.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-orange-50 border border-orange-100 p-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingDepartmentDashboard: React.FC = () => {
  return (
    <TrainingDepartmentLayout>
      <DashboardMainContent />
    </TrainingDepartmentLayout>
  );
};

export default TrainingDepartmentDashboard;
