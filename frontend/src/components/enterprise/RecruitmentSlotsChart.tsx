import { useEffect, useMemo, useRef } from 'react';
import { Chart, ArcElement, DoughnutController, Tooltip } from 'chart.js';
import { BriefcaseBusiness, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecruitmentPost } from '@/services/enterpriseService';

Chart.register(ArcElement, DoughnutController, Tooltip);

const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#38bdf8', '#a78bfa'];

export function RecruitmentSlotsChart({ posts, loading, error }: {
  posts: RecruitmentPost[];
  loading: boolean;
  error: string | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const slots = useMemo(() => {
    const seen = new Set<number>();
    return [...posts].sort((a, b) => a.id - b.id).map(post => ({
      id: post.id, title: post.title,
      remaining: (post.positions ?? []).reduce((sum, position) => {
        if (seen.has(position.id)) return sum;
        seen.add(position.id);
        return sum + Math.max(0, position.remainingSlots);
      }, 0),
    })).filter(post => post.remaining > 0).sort((a, b) => b.remaining - a.remaining || a.id - b.id);
  }, [posts]);
  const total = slots.reduce((sum, post) => sum + post.remaining, 0);
  const segments = useMemo(() => slots.length > 6 ? [
    ...slots.slice(0, 5),
    { id: -1, title: `${slots.length - 5} tin khác`, remaining: slots.slice(5).reduce((sum, post) => sum + post.remaining, 0) },
  ] : slots, [slots]);

  useEffect(() => {
    if (!canvas.current || loading || error || !total) return;
    const chart = new Chart(canvas.current, {
      type: 'doughnut',
      data: {
        labels: segments.map(segment => segment.title),
        datasets: [{
          data: segments.map(segment => segment.remaining),
          backgroundColor: colors,
          borderColor: '#ffffff', borderWidth: 4, borderRadius: 7,
          hoverOffset: 9,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '74%',
        layout: { padding: 12 },
        animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a', padding: 12, cornerRadius: 12,
            callbacks: {
              label: context => ` ${context.parsed} slot còn trống · ${Math.round(context.parsed / total * 100)}%`,
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [segments, total, loading, error]);

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Tổng quan tuyển dụng</p>
          <h3 className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <BriefcaseBusiness className="h-4 w-4 text-indigo-500" /> Slot tuyển dụng còn trống
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Phân bổ số chỗ còn tuyển theo từng tin hiện tại.</p>
        </div>
        <Link to="/enterprise/jobs" aria-label="Xem tin tuyển dụng" className="rounded-xl bg-indigo-50 p-2 text-indigo-500 transition hover:bg-indigo-100">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? (
          <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> Đang tải số liệu tuyển dụng…
          </div>
        ) : error ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Không tải được dữ liệu tuyển dụng. Vui lòng làm mới số liệu.</p>
        ) : (
          <>
            <div className="relative mx-auto h-60 w-60">
              {total > 0 ? (
                <canvas ref={canvas} role="img" aria-label={`Số slot còn trống theo tin tuyển dụng: ${segments.map(segment => `${segment.title}: ${segment.remaining}`).join(', ')}`} />
              ) : <div className="absolute inset-4 rounded-full border-[24px] border-slate-100" />}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight text-slate-900">{total}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">slot còn trống</span>
              </div>
            </div>
            <div className="my-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-indigo-50 px-4 py-3">
                <p className="text-xl font-extrabold text-indigo-600">{posts.length}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Tin đang tuyển</p>
              </div>
              <div className="rounded-2xl bg-teal-50 px-4 py-3">
                <p className="text-xl font-extrabold text-teal-600">{slots.length}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Tin còn slot</p>
              </div>
            </div>
            {total > 0 ? (
              <ul className="space-y-3">
                {segments.map((segment, index) => (
                  <li key={segment.id} className="flex items-center gap-2.5 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index] }} />
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-600" title={segment.title}>{segment.title}</span>
                    <span className="shrink-0 font-bold tabular-nums text-slate-800">{segment.remaining} <span className="font-normal text-slate-400">slot</span></span>
                    <span className="w-9 text-right text-[10px] tabular-nums text-slate-400">{Math.round(segment.remaining / total * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-center text-xs leading-relaxed text-slate-500">Hiện chưa có slot tuyển dụng còn trống.</p>}
          </>
        )}
      </div>
    </article>
  );
}
