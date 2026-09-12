import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  ChartConfiguration,
  TooltipItem,
} from 'chart.js';
import type { SemesterProgress } from '../../types/studentDashboardTypes';

// Đăng ký các module Chart.js cần thiết (Tree-shaking tối ưu dung lượng)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend
);

interface ProgressChartCardProps {
  data: SemesterProgress[];
}

export const ProgressChartCard: React.FC<ProgressChartCardProps> = ({ data }) => {
  const [filterMode, setFilterMode] = useState<'6months' | 'all'>('all');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  // Lọc dữ liệu theo chế độ: 6 tháng (3 kỳ gần nhất) hoặc toàn khóa
  const displayItems = filterMode === '6months' ? data.slice(-3) : data;

  useEffect(() => {
    if (!canvasRef.current) return;

    // Hủy instance cũ trước khi tạo mới để tránh memory leak và đè canvas
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Chuẩn bị nhãn và mảng màu sắc linh hoạt theo trạng thái từng kỳ
    const labels = displayItems.map((item) => item.semesterName);
    const creditsData = displayItems.map((item) => item.credits);
    const gpaData = displayItems.map((item) => item.gpa);

    const barBackgroundColors = displayItems.map((item) => {
      if (item.isCurrent) return '#ea580c'; // Cam FPT nổi bật
      if (item.isForecast) return 'rgba(148, 163, 184, 0.45)'; // Xám dự báo
      return '#93c5fd'; // Xanh pastel cho các kỳ trước
    });

    const barHoverColors = displayItems.map((item) => {
      if (item.isCurrent) return '#c2410c';
      if (item.isForecast) return 'rgba(148, 163, 184, 0.7)';
      return '#60a5fa';
    });

    const barBorderColors = displayItems.map((item) => {
      if (item.isCurrent) return '#ea580c';
      if (item.isForecast) return '#94a3b8';
      return '#60a5fa';
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar' as const,
            label: 'Tín chỉ',
            data: creditsData,
            backgroundColor: barBackgroundColors,
            hoverBackgroundColor: barHoverColors,
            borderColor: barBorderColors,
            borderWidth: displayItems.map((item) => (item.isForecast ? 1.5 : 0)),
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'yCredits',
            order: 2,
            barPercentage: 0.55,
            categoryPercentage: 0.7,
          },
          {
            type: 'line' as const,
            label: 'GPA',
            data: gpaData,
            borderColor: '#10b981', // Xanh ngọc lục bảo
            backgroundColor: '#10b981',
            borderWidth: 2.5,
            tension: 0.35,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2.5,
            yAxisID: 'yGPA',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Outfit, sans-serif', size: 12, weight: 'bold' },
            bodyFont: { family: 'Outfit, sans-serif', size: 11 },
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              title: (tooltipItems: TooltipItem<'bar' | 'line'>[]) => {
                const idx = tooltipItems[0].dataIndex;
                const item = displayItems[idx];
                if (item.isCurrent) return `${item.semesterName} (Kỳ hiện tại)`;
                if (item.isForecast) return `${item.semesterName} (Dự kiến OJT)`;
                return item.semesterName;
              },
              label: (context: TooltipItem<'bar' | 'line'>) => {
                if (context.dataset.label === 'Tín chỉ') {
                  return `  Tín chỉ: ${context.parsed.y} tín chỉ`;
                }
                if (context.dataset.label === 'GPA') {
                  return `  GPA: ${(context.parsed.y as number).toFixed(2)} / 4.00`;
                }
                return '';
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
              font: { family: 'Outfit, sans-serif', size: 11, weight: 'bold' },
            },
          },
          yCredits: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            max: 50,
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              stepSize: 10,
              color: '#94a3b8',
              font: { family: 'Outfit, sans-serif', size: 10 },
              callback: (value: string | number) => `${value} TC`,
            },
            border: {
              dash: [4, 4],
              display: false,
            },
          },
          yGPA: {
            type: 'linear',
            position: 'right',
            beginAtZero: false,
            min: 2.0,
            max: 4.0,
            grid: {
              display: false,
            },
            ticks: {
              stepSize: 0.5,
              color: '#10b981',
              font: { family: 'Outfit, sans-serif', size: 10, weight: 'bold' },
              callback: (value: string | number) => `${Number(value).toFixed(1)}`,
            },
            border: {
              display: false,
            },
          },
        },
      } as any,
    };

    chartInstanceRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [displayItems]);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      {/* Card Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-outfit">
            Tiến độ học tập & Tín chỉ tích lũy
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Biểu đồ kết hợp tín chỉ hoàn thành và xu hướng điểm trung bình GPA
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterMode('6months')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterMode === '6months'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            6 tháng gần nhất
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterMode === 'all'
                ? 'bg-[#ea580c] text-white shadow-xs shadow-orange-600/30 font-bold'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Toàn khóa
          </button>
        </div>
      </div>

      {/* Chart.js Canvas Container */}
      <div className="relative w-full h-64 sm:h-72 pt-2">
        <canvas ref={canvasRef} />
      </div>

      {/* Interactive Legend & Indicator Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Legend Items */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#93c5fd]" />
            <span className="text-slate-600 font-medium">Kỳ đã qua</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#ea580c]" />
            <span className="text-slate-800 font-bold">Kỳ hiện tại</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border border-dashed border-slate-400 bg-slate-200/50" />
            <span className="text-slate-500">Dự báo OJT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#10b981] relative flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-emerald-700 font-bold">GPA học kỳ</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Cập nhật từ hệ thống đào tạo FPT
        </div>
      </div>
    </div>
  );
};
