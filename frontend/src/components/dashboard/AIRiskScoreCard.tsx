import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { InfoIcon } from './icons/DashboardIcons';
import type { AIRiskScoreData } from '../../types/studentDashboardTypes';

ChartJS.register(ArcElement, DoughnutController, Tooltip);

interface AIRiskScoreCardProps {
  data: AIRiskScoreData;
}

export const AIRiskScoreCard: React.FC<AIRiskScoreCardProps> = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  // Chọn màu sắc theo mức độ rủi ro của sinh viên
  const getRiskColor = (level: AIRiskScoreData['level']) => {
    switch (level) {
      case 'low':
        return {
          primary: '#10b981',
          bg: '#ecfdf5',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          glow: 'shadow-emerald-500/20',
        };
      case 'medium':
        return {
          primary: '#ea580c',
          bg: '#fff7ed',
          text: 'text-orange-600',
          border: 'border-orange-200',
          glow: 'shadow-orange-500/20',
        };
      case 'high':
      default:
        return {
          primary: '#ef4444',
          bg: '#fef2f2',
          text: 'text-red-600',
          border: 'border-red-200',
          glow: 'shadow-red-500/20',
        };
    }
  };

  const riskTheme = getRiskColor(data.level);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const remaining = Math.max(0, data.maxScore - data.score);

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Điểm rủi ro AI', 'Khoảng an toàn'],
        datasets: [
          {
            data: [data.score, remaining],
            backgroundColor: [riskTheme.primary, '#f1f5f9'],
            hoverBackgroundColor: [riskTheme.primary, '#f1f5f9'],
            borderWidth: 0,
            borderRadius: [10, 0],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        rotation: -90,
        circumference: 360,
        animation: {
          animateRotate: true,
          duration: 900,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#0f172a',
            padding: 8,
            cornerRadius: 8,
            titleFont: { family: 'Outfit, sans-serif', size: 11 },
            bodyFont: { family: 'Outfit, sans-serif', size: 11 },
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                if (context.dataIndex === 0) {
                  return ` Điểm rủi ro: ${data.score} / ${data.maxScore}`;
                }
                return ` Còn lại: ${remaining} điểm`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, riskTheme.primary]);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col items-center relative">
      {/* Header with Title and Info Tooltip */}
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit">
          AI Risk Score
        </h3>

        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            aria-label="Thông tin chỉ số AI Risk Score"
          >
            <InfoIcon size={18} />
          </button>

          {/* Info Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 top-7 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-30 animate-in fade-in duration-150">
              <div className="font-semibold text-orange-400 mb-1">Hệ số dự báo rủi ro AI</div>
              <p className="text-slate-300 leading-relaxed">
                Mô hình Machine Learning phân tích lịch sử học tập, tỉ lệ chuyên cần, tiến độ tín chỉ và kết quả các môn tiên quyết để dự báo khả năng đáp ứng kỳ OJT.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Donut Gauge with Chart.js Canvas */}
      <div className="relative w-44 h-44 my-2 flex items-center justify-center">
        <canvas ref={canvasRef} />

        {/* Center Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-outfit">
            {data.score}
          </span>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">
            /{data.maxScore}
          </span>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="mt-2 text-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${riskTheme.bg} ${riskTheme.text} ${riskTheme.border}`}
        >
          {data.levelLabel}
        </span>
      </div>

      {/* Factors summary breakdown */}
      {data.factors && data.factors.length > 0 && (
        <div className="w-full mt-4 pt-3 border-t border-slate-100 space-y-2">
          {data.factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">{f.label}</span>
              <span
                className={`font-semibold ${f.impact === 'positive'
                    ? 'text-emerald-600'
                    : f.impact === 'negative'
                      ? 'text-red-500'
                      : 'text-slate-600'
                  }`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AI Explanation Quote */}
      <p className="mt-3 text-[11px] sm:text-xs text-slate-500 leading-relaxed text-center px-1 italic font-normal">
        {data.description}
      </p>
    </div>
  );
};
