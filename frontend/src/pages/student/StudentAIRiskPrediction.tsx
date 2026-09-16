import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { BotSparkleIcon, ArrowRightIcon } from '@/components/common/icons/AppIcons';
import { AIRiskScoreCard } from '@/components/student/dashboard/AIRiskScoreCard';
import { mockAIRiskScore, mockStudentProfile } from '@/data/student/mockStudentData';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { PageBanner } from '@/components/common/PageBanner';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export const StudentAIRiskPrediction: React.FC = () => {
  const { openAIConsult } = useBaseLayout();
  const navigate = useNavigate();
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  // Line Chart for Risk History
  useEffect(() => {
    if (!lineChartRef.current) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const ctx = lineChartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: ['T9', 'T10', 'T11', 'T12', 'T1'],
        datasets: [
          {
            label: 'Mức rủi ro',
            data: [30, 45, 42, 60, 50],
            borderColor: '#ea580c', // orange-600
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            borderWidth: 2,
            tension: 0.4, // smooth curve
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ea580c',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Outfit, sans-serif' },
            bodyFont: { family: 'Outfit, sans-serif' },
            displayColors: false,
          },
        },
        scales: {
          y: { display: false, min: 0, max: 100 },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { font: { family: 'Outfit, sans-serif', size: 12 }, color: '#94a3b8' },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
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
            <span className="text-amber-300 font-bold">Dự báo rủi ro</span>
          </div>
        }
        title="AI Dự báo rủi ro học tập"
        description="Hệ thống AI phân tích điểm rủi ro dựa trên tiến độ, kết quả học tập và chuyên cần để giúp bạn lên kế hoạch hiệu quả."
        primaryAction={{
          label: 'Hỏi AI về rủi ro',
          icon: <BotSparkleIcon size={16} />,
          onClick: () => openAIConsult('Hãy phân tích điểm rủi ro học tập hiện tại của tôi.'),
        }}
        secondaryAction={{
          label: 'Về Dashboard',
          onClick: () => navigate('/student/dashboard'),
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: AI Risk Score */}
        <div className="h-full [&>div]:h-full [&>div]:justify-center">
          <AIRiskScoreCard
            data={{
              ...mockAIRiskScore,
              score: 72,
              level: 'medium',
              levelLabel: 'Nguy cơ Trung bình',
              factors: [],
              description: 'Độ tin cậy: 92% • Cập nhật 2 giờ trước',
            }}
          />
        </div>

        {/* Right: Risk History Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-slate-700">Lịch sử biến động rủi ro</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
              5 tháng qua
            </span>
          </div>
          <div className="flex-1 w-full relative min-h-[200px]">
            <canvas ref={lineChartRef} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Explainability (Giải thích kết quả AI) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-blue-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.58 12C15.58 13.97 13.97 15.58 12 15.58C10.03 15.58 8.42004 13.97 8.42004 12C8.42004 10.03 10.03 8.42004 12 8.42004C13.97 8.42004 15.58 10.03 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.3 12.73 22.3 11.27 21.11 9.41005C18.82 5.81005 15.53 3.73005 12 3.73005C8.47005 3.73005 5.18005 5.81005 2.89005 9.41005C1.70005 11.27 1.70005 12.73 2.89005 14.59C5.18005 18.19 8.47005 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h3 className="text-sm font-semibold text-slate-700">Giải thích kết quả AI (Explainability)</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">Vắng mặt trên lớp</span>
                <span className="text-red-500 font-bold">+35%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">Nợ tín chỉ</span>
                <span className="text-orange-500 font-bold">+28%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">Môn tiên quyết chưa đạt</span>
                <span className="text-amber-500 font-bold">+20%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 font-medium">GPA thấp</span>
                <span className="text-slate-500 font-bold">+12%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white h-full flex flex-col relative overflow-hidden">
          {/* subtle decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <h3 className="text-sm font-semibold text-white/90 mb-6 flex items-center gap-2">
            Khuyến nghị từ AI
          </h3>

          <div className="space-y-3 flex-1 relative z-10">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-orange-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Môn học cần ưu tiên (SWE302)</h4>
                  <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => openAIConsult('Tôi cần lưu ý gì ở môn SWE302?')}>
                    AI phát hiện bạn có lỗ hổng kiến thức quan trọng ở môn này.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-orange-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.5 9.09H20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Kế hoạch học tập gợi ý</h4>
                  <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => openAIConsult('Gợi ý cho tôi kế hoạch học tập chi tiết.')}>
                    Dành thêm 4h/tuần để ôn tập môn Chuyên ngành.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-orange-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.1601 10.87C12.0601 10.86 11.9401 10.86 11.8301 10.87C9.45014 10.79 7.56014 8.84 7.56014 6.44C7.56014 3.99 9.54014 2 12.0001 2C14.4601 2 16.4401 3.99 16.4401 6.44C16.4301 8.84 14.5401 10.79 12.1601 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.15997 14.56C4.73997 16.18 4.73997 18.82 7.15997 20.43C9.90997 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.91997 12.73 7.15997 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Đăng ký hỗ trợ học tập</h4>
                  <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => openAIConsult('Tôi muốn đăng ký gia sư hoặc hỗ trợ học tập.')}>
                    Tham gia câu lạc bộ học thuật để cải thiện kết quả.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center">
              Xem lộ trình học
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center">
              Liên hệ P.ĐT
            </button>
          </div>
        </div>
      </div>

      {/* Risk Factors Details Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-6">Chi tiết các yếu tố rủi ro</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="pb-4 font-medium">Yếu tố phân tích</th>
                <th className="pb-4 font-medium">Giá trị hiện tại</th>
                <th className="pb-4 font-medium">Trạng thái</th>
                <th className="pb-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4 text-slate-700">GPA học kỳ hiện tại</td>
                <td className="py-4 font-bold text-slate-900">2.1</td>
                <td className="py-4">
                  <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                    Cảnh báo
                  </span>
                </td>
                <td className="py-4">
                  <button className="text-orange-600 font-bold hover:text-orange-700 transition-colors cursor-pointer">
                    Chi tiết
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-slate-700">Số tín chỉ còn thiếu</td>
                <td className="py-4 font-bold text-slate-900">12</td>
                <td className="py-4">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                    Bình thường
                  </span>
                </td>
                <td className="py-4">
                  <button className="text-orange-600 font-bold hover:text-orange-700 transition-colors cursor-pointer">
                    Đăng ký thêm
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-slate-700">Cảnh cáo học vụ</td>
                <td className="py-4 font-bold text-slate-900">Mức 1</td>
                <td className="py-4">
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    Nghiêm trọng
                  </span>
                </td>
                <td className="py-4">
                  <button className="text-orange-600 font-bold hover:text-orange-700 transition-colors cursor-pointer">
                    Xem giải trình
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-4 text-slate-700">Tỷ lệ vắng mặt</td>
                <td className="py-4 font-bold text-slate-900">15%</td>
                <td className="py-4">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                    Cần lưu ý
                  </span>
                </td>
                <td className="py-4">
                  <button className="text-orange-600 font-bold hover:text-orange-700 transition-colors cursor-pointer">
                    Kiểm tra lịch
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Floating Action Button for AI Consultation */}
      <div className="fixed bottom-6 left-6 z-50 lg:hidden">
        <button
          onClick={() => openAIConsult('Tôi cần tư vấn ngay về tình hình học tập.')}
          className="bg-orange-500 text-white px-5 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <BotSparkleIcon size={18} />
          Tư vấn AI ngay
        </button>
      </div>
    </div>
  );
};

export default StudentAIRiskPrediction;
