import type { AnimationOptions, BarElement, Plugin, ScriptableContext } from 'chart.js';

export const dashboardPalette = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#f97316', '#06b6d4'];

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
  gradient.addColorStop(0, color + 'd9');
  gradient.addColorStop(.5, color + 'a6');
  gradient.addColorStop(1, color + '66');
  return gradient;
}

export const dashboardCinema: Plugin<'bar'> = {
  id: 'qhdnDashboardCinema',
  beforeDraw(chart) {
    const { ctx, chartArea: area } = chart;
    if (!area) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(area.left, area.top, area.width, area.height); ctx.clip();
    const glow = ctx.createRadialGradient(area.left + area.width * .22, area.top + area.height * .3, 0,
      area.left + area.width * .22, area.top + area.height * .3, Math.max(area.width, area.height));
    glow.addColorStop(0, 'rgba(129,140,248,.10)');
    glow.addColorStop(.5, 'rgba(45,212,191,.035)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(area.left, area.top, area.width, area.height);
    ctx.restore();
  },
  beforeDatasetDraw(chart) {
    chart.ctx.save();
    chart.ctx.shadowColor = chart.getActiveElements().length ? 'rgba(99,102,241,.3)' : 'rgba(99,102,241,.12)';
    chart.ctx.shadowBlur = chart.getActiveElements().length ? 18 : 9;
    chart.ctx.shadowOffsetY = 4;
  },
  afterDatasetDraw(chart) { chart.ctx.restore(); },
};

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
      ctx.fillStyle = '#334155';
      ctx.fillText(label, horizontal ? current.x + (inside ? -10 : 7) : current.x,
        horizontal ? current.y : Math.max(chartArea.top - 6, current.y - 9));
    });
    ctx.restore();
  },
};
