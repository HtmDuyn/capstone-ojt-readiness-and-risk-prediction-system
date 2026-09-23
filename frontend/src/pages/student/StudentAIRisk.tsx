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
            borderColor: '#f97316', // orange-500
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
              gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
              return gradient;
            },
            borderWidth: 3,
            tension: 0.4, // smooth curve
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ea580c',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
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
            padding: 12,
            cornerRadius: 12,
            titleFont: { family: 'Outfit, sans-serif', size: 14 },
            bodyFont: { family: 'Outfit, sans-serif', size: 14, weight: 'bold' },
            displayColors: false,
            callbacks: {
              label: (context) => `Điểm rủi ro: ${context.parsed.y}%`
            }
          },
        },
        scales: {
          y: { display: false, min: 0, max: 100 },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { font: { family: 'Outfit, sans-serif', size: 13, weight: 'bold' }, color: '#94a3b8' },
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full max-w-[1400px] mx-auto font-outfit">
      
      {/* Overlapping Hero Banner */}
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
            <span className="text-amber-300 font-bold drop-shadow-md">Dự báo rủi ro</span>
          </div>
        }
        title="Dự báo rủi ro & Lộ trình AI"
        description="Phân tích sâu điểm rủi ro học tập, theo dõi biểu đồ lịch sử và nhận các lời khuyên từ AI để đảm bảo tiến độ OJT."
        primaryAction={{
          label: 'Hỏi AI Phân Tích',
          icon: <BotSparkleIcon size={16} />,
          className: "bg-white text-purple-700 hover:bg-purple-50",
          onClick: () => openAIConsult('Hãy phân tích điểm rủi ro học tập hiện tại của tôi.'),
        }}
        className="pb-24"
      />

      {/* Main Grid - Overlapping the banner */}
      <div className="px-4 lg:px-8 relative z-10 -mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: AI Risk Score */}
          <div className="lg:col-span-4 h-full bg-white/40 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/50 shadow-2xl shadow-slate-200/50">
            <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
              
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
          </div>

          {/* Right: Risk History Line Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100/60 flex flex-col h-full min-h-[340px] hover:shadow-2xl hover:shadow-purple-500/10 transition-shadow duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Lịch sử biến động rủi ro</h3>
                <p className="text-sm text-slate-500 mt-1">Xu hướng điểm rủi ro theo từng tháng</p>
              </div>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
                5 tháng qua
              </span>
            </div>
            <div className="flex-1 w-full relative min-h-[220px]">
              <canvas ref={lineChartRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Explainability (Giải thích kết quả AI) */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100/60 hover:shadow-2xl transition-shadow duration-500">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.58 12C15.58 13.97 13.97 15.58 12 15.58C10.03 15.58 8.42004 13.97 8.42004 12C8.42004 10.03 10.03 8.42004 12 8.42004C13.97 8.42004 15.58 10.03 15.58 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.3 12.73 22.3 11.27 21.11 9.41005C18.82 5.81005 15.53 3.73005 12 3.73005C8.47005 3.73005 5.18005 5.81005 2.89005 9.41005C1.70005 11.27 1.70005 12.73 2.89005 14.59C5.18005 18.19 8.47005 20.27 12 20.27Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Giải thích từ AI</h3>
                <p className="text-sm text-slate-500">Các yếu tố chính ảnh hưởng đến Risk Score</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'Vắng mặt trên lớp', val: 85, impact: '+35%', color: 'red' },
                { label: 'Nợ tín chỉ', val: 65, impact: '+28%', color: 'orange' },
                { label: 'Môn tiên quyết chưa đạt', val: 45, impact: '+20%', color: 'amber' },
                { label: 'GPA thấp', val: 25, impact: '+12%', color: 'slate' },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 font-bold group-hover:text-slate-900 transition-colors">{item.label}</span>
                    <span className={`text-${item.color}-500 font-extrabold bg-${item.color}-50 px-2 py-0.5 rounded`}>{item.impact}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full bg-${item.color}-500 rounded-full group-hover:scale-y-110 transition-transform`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations - Premium Dark Mode Style */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white h-full flex flex-col relative overflow-hidden shadow-2xl shadow-slate-900/30 hover:shadow-orange-500/20 transition-all duration-500 border border-slate-700/50">
            {/* abstract shapes */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center border border-orange-500/30">
                <BotSparkleIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Khuyến nghị lộ trình</h3>
                <p className="text-sm text-slate-400">AI tự động lên phương án tối ưu</p>
              </div>
            </div>

            <div className="space-y-4 flex-1 relative z-10">
              {/* Rec Item 1 */}
              <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => openAIConsult('Tôi cần lưu ý gì ở môn SWE302?')}>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">Môn học cần ưu tiên (SWE302)</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Phát hiện lỗ hổng kiến thức quan trọng. Click để nhờ AI giải thích sâu hơn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rec Item 2 */}
              <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => openAIConsult('Gợi ý cho tôi kế hoạch học tập chi tiết.')}>
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Kế hoạch học tập gợi ý</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Nên dành thêm 4h/tuần để ôn tập môn Chuyên ngành.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/30 hover:scale-105 cursor-pointer text-center">
                Xem lộ trình học
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-all hover:scale-105 cursor-pointer text-center backdrop-blur-sm">
                Liên hệ P.ĐT
              </button>
            </div>
          </div>
        </div>

        {/* Risk Factors Details Table */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-800">Chi tiết các chỉ số rủi ro</h3>
            <button className="text-orange-600 font-bold hover:text-orange-700 text-sm">Xuất báo cáo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b-2 border-slate-100">
                  <th className="pb-4 font-bold uppercase tracking-wider text-xs">Yếu tố phân tích</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-xs">Giá trị hiện tại</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-xs">Trạng thái</th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-xs text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'GPA học kỳ hiện tại', val: '2.1', stat: 'Cảnh báo', col: 'red', act: 'Chi tiết' },
                  { name: 'Số tín chỉ còn thiếu', val: '12', stat: 'Bình thường', col: 'slate', act: 'Đăng ký thêm' },
                  { name: 'Cảnh cáo học vụ', val: 'Mức 1', stat: 'Nghiêm trọng', col: 'red', act: 'Xem giải trình' },
                  { name: 'Tỷ lệ vắng mặt', val: '15%', stat: 'Cần lưu ý', col: 'blue', act: 'Kiểm tra lịch' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-5 text-slate-700 font-medium">{row.name}</td>
                    <td className="py-5 font-extrabold text-slate-900 text-base">{row.val}</td>
                    <td className="py-5">
                      <span className={`inline-block px-3 py-1.5 bg-${row.col}-50 text-${row.col}-600 text-xs font-bold rounded-lg border border-${row.col}-100`}>
                        {row.stat}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button className="text-orange-600 font-bold hover:text-orange-700 transition-colors cursor-pointer group-hover:underline">
                        {row.act}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button for AI Consultation */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          onClick={() => openAIConsult('Tôi cần tư vấn ngay về tình hình học tập.')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-purple-500/50 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <BotSparkleIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default StudentAIRiskPrediction;
