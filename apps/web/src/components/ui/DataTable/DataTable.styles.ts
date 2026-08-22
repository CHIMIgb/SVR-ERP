export const dataTableClasses = {
  /* ── Container ── */
  container: 'w-full rounded-xl border border-slate-200 bg-white',

  /* ── Header ── */
  thead: '',
  th: 'px-3 sm:px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-white',

  /* ── Header Colors (naranja alternado) ── */
  thOdd: 'bg-primary',
  thEven: 'bg-primary-dark',

  /* ── Body ── */
  tr: 'border-b border-slate-100 last:border-0 transition-colors',
  trInteractive: 'hover:bg-slate-50/80 cursor-pointer',
  trEven: 'bg-white',
  trOdd: 'bg-slate-50/30',
  td: 'px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-slate-700 whitespace-nowrap',
  tdRight: 'text-right',
  tdCenter: 'text-center',

  /* ── Loading ── */
  skeleton: 'animate-pulse bg-slate-200 rounded',
};
