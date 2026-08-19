export const chartClasses = {
  /* ── Container ── */
  container: 'w-full bg-white rounded-xl border border-slate-200 overflow-hidden',
  header: 'px-4 sm:px-6 pt-4 sm:pt-6 pb-2',
  title: 'text-sm sm:text-base font-bold text-slate-900 truncate',
  subtitle: 'text-xs text-slate-500 mt-0.5 truncate',
  body: 'px-4 sm:px-6 pb-4 sm:pb-6',
  footer: 'px-4 sm:px-6 pb-4 sm:pb-6 flex flex-wrap items-center gap-3 sm:gap-4',

  /* ── Legend ── */
  legend: 'flex flex-wrap items-center gap-3 sm:gap-4',
  legendItem: 'flex items-center gap-1.5 text-xs text-slate-600',
  legendDot: 'w-2.5 h-2.5 rounded-full shrink-0',

  /* ── Tooltip ── */
  tooltip:
    'absolute z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg pointer-events-none whitespace-nowrap',

  /* ── Axis Labels ── */
  axisLabel: 'text-[10px] fill-slate-400 font-medium',
  axisLine: 'stroke-slate-200',
  gridLine: 'stroke-slate-100 stroke-dasharray-4',

  /* ── Bar Chart ── */
  barRect: 'transition-all duration-200 cursor-pointer',
  barLabel: 'text-[10px] fill-slate-500 font-medium',

  /* ── Pie / Doughnut ── */
  pieSlice: 'transition-all duration-200 cursor-pointer',
  pieLabel: 'text-xs font-bold fill-white',

  /* ── Scatter ── */
  scatterDot: 'transition-all duration-200 cursor-pointer',

  /* ── Area ── */
  areaPath: 'transition-opacity duration-200',
  linePath: 'fill-none transition-all duration-200',
  lineDot: 'transition-all duration-200 cursor-pointer',
};
