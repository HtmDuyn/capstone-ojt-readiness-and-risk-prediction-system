import type { AnimationOptions, BarElement, Plugin, ScriptableContext } from 'chart.js';

export const dashboardChartAnimation = (reduced: boolean): AnimationOptions<'bar'>['animation'] => reduced ? false : {
  duration: 1150,
  easing: 'easeOutQuart',
  delay: context => context.type === 'data' && context.mode === 'default' ? context.dataIndex * 95 : 0,
};

export function dashboardBarGradient(context: ScriptableContext<'bar'>, colors: readonly string[], horizontal = false) {
  const {ctx, chartArea} = context.chart;
  const color = colors[context.dataIndex % colors.length];
  if (!chartArea) return color;
  const gradient = horizontal ? ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
    : ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + '99');
  return gradient;
}

// Labels follow the animated geometry, so figures rise with their bars.
// This plugin is attached only to the QHDN dashboard charts.
export const dashboardBarLabels: Plugin<'bar'> = {
  id: 'qhdnDashboardBarLabels',
  afterDatasetsDraw(chart) {
    const {ctx, chartArea} = chart;
    const horizontal = chart.options.indexAxis === 'y';
    if (!chart.isDatasetVisible(0)) return;
    ctx.save();
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textBaseline = horizontal ? 'middle' : 'bottom';
    chart.getDatasetMeta(0).data.forEach((element, index) => {
      const value = chart.data.datasets[0].data[index];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      const bar = element as BarElement;
      const current = bar.getProps(['x', 'y', 'base'], false);
      const target = bar.getProps(['x', 'y', 'base'], true);
      if (current.x == null || current.y == null || target.x == null || target.y == null) return;
      const distance = Math.abs((horizontal ? target.x : target.y) - target.base);
      const ratio = distance ? Math.min(1, Math.abs((horizontal ? current.x : current.y) - current.base) / distance) : 1;
      const label = String(Math.round(value * ratio));
      const inside = horizontal && Math.abs(current.x - current.base) > 38;
      ctx.textAlign = horizontal ? inside ? 'right' : 'left' : 'center';
      ctx.fillStyle = inside ? '#ffffff' : '#334155';
      ctx.fillText(label, horizontal ? current.x + (inside ? -10 : 7) : current.x,
        horizontal ? current.y : Math.max(chartArea.top - 6, current.y - 9));
    });
    ctx.restore();
  },
};
