import { useMemo } from 'react';
import { DonutChart } from "@/components/common/DonutChart";
import { BriefcaseBusiness, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecruitmentPost } from '@/services/enterpriseService';

const palette = [
  { from: '#547c9a', to: '#345a78' },
  { from: '#8fb4ce', to: '#6b98b8' },
  { from: '#c5dce9', to: '#a7c9de' },
  { from: '#d9e6ef', to: '#c3d6e4' },
  { from: '#94a3b8', to: '#73859b' },
  { from: '#e2e8f0', to: '#cbd5e1' },
];

export function RecruitmentSlotsChart({ posts, loading, error }: {
  posts: RecruitmentPost[];
  loading: boolean;
  error: string | null;
}) {
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

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_16px_50px_-36px_rgba(30,41,59,0.45)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Tổng quan tuyển dụng</p>
          <h3 className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <BriefcaseBusiness className="h-4 w-4 text-slate-500" /> Slot tuyển dụng còn trống
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Phân bổ số chỗ còn tuyển theo từng tin hiện tại.</p>
        </div>
        <Link to="/enterprise/jobs" aria-label="Xem tin tuyển dụng" className="rounded-xl bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? (
          <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> Đang tải số liệu tuyển dụng…
          </div>
        ) : error ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Không tải được dữ liệu tuyển dụng.</p>
        ) : (
          <>
            <div className="relative mx-auto aspect-square w-full max-w-56">
              <DonutChart segments={segments.map((segment, index) => ({ label: segment.title, value: segment.remaining, color: palette[index].from, gradientTo: palette[index].to }))}
                innerRadius="66%" appearance="continuous"
                label={total > 0 ? `Số slot còn trống theo tin tuyển dụng: ${segments.map(segment => `${segment.title}: ${segment.remaining}`).join(', ')}` : 'Chưa có slot tuyển dụng còn trống'} unit="slot">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-slate-800">{total.toLocaleString('vi-VN')}</span>
                <span className="mt-1 text-[10px] font-medium text-slate-400">slot còn trống</span>
              </DonutChart>
            </div>
            {total > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {segments.map((segment, index) => (
                  <li key={segment.id} className="flex min-w-0 items-center gap-3 py-3" title={`${segment.title}: ${segment.remaining} slot`}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[index].to }} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words text-xs font-medium leading-relaxed text-slate-600">{segment.title}</p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">{segment.remaining} slot</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{Math.round(segment.remaining / total * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">Hiện chưa có slot tuyển dụng còn trống.</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
              <div><p className="text-lg font-bold tabular-nums text-slate-800">{posts.length}</p><p className="mt-0.5 text-[10px] text-slate-500">Tin đang tuyển</p></div>
              <div className="border-l border-slate-100"><p className="text-lg font-bold tabular-nums text-slate-800">{slots.length}</p><p className="mt-0.5 text-[10px] text-slate-500">Tin còn slot</p></div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
