export const dataTableClasses = {
  /* ── Container ── */
  container: 'w-full rounded-xl border border-ui-200 bg-surface',

  /* ── Header ── */
  thead: '',
  th: 'px-3 sm:px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-white',

  /* ── Header Colors (naranja alternado) ── */
  thOdd: 'bg-primary',
  thEven: 'bg-primary-dark',

  /* ── Body ── */
  tr: 'border-b border-ui-100 last:border-0 transition-colors',
  trInteractive: 'hover:bg-ui-50/80 cursor-pointer',
  trEven: 'bg-surface',
  trOdd: 'bg-ui-50/30',
  td: 'px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-ui-700 whitespace-nowrap',
  tdRight: 'text-right',
  tdCenter: 'text-center',

  /* ── Loading ── */
  skeleton: 'animate-pulse bg-ui-200 rounded',
};
