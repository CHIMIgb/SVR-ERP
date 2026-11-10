export const dataTableClasses = {
  /* ── Container ── */
  container: 'w-full rounded-xl border border-ui-200 bg-surface',

  /* ── Header ── */
  thead: '',
  th: 'px-3 sm:px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-white',

  /* ── Header Colors (naranja alternado) ── */
  thOdd: 'bg-primary',
  thEven: 'bg-primary-dark',

  /* ── Header neutro (headerVariant="neutral") ── */
  thNeutral: 'px-3 sm:px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-ui-500 bg-ui-50 border-b border-ui-200 first:rounded-tl-xl last:rounded-tr-xl',

  /* Body - separadores horizontales y verticales visibles en claro y oscuro */
  tr: 'border-b border-ui-200 last:border-0 transition-colors',
  trInteractive: 'hover:bg-ui-50/80 cursor-pointer focus-visible:outline-none focus-visible:bg-ui-100',
  trEven: 'bg-surface',
  trOdd: 'bg-ui-50/30',
  td: 'px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-ui-700 whitespace-nowrap border-l border-ui-100 first:border-l-0',
  tdTruncate: 'overflow-hidden text-ellipsis',
  tdRight: 'text-right',
  tdCenter: 'text-center',

  /* ── Loading ── */
  skeleton: 'animate-pulse bg-ui-200 rounded',
};
