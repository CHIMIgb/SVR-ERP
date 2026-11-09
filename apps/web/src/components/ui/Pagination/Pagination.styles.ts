export const paginationClasses = {
  /* ── Container ── */
  container:
    'relative flex flex-col sm:flex-row items-center justify-center px-3 sm:px-4 py-3 border-t border-ui-100 bg-surface rounded-b-xl gap-2',

  /* ── Info izquierda: registros mostrados ── */
  infoLeft: 'hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-ui-500',
  infoLeftMobile: 'sm:hidden order-3 text-xs text-ui-500',

  /* ── Grupo centrado: "Pagina X de Y" + navegación, lado a lado ── */
  center: 'flex flex-wrap items-center justify-center gap-1.5 sm:gap-2',
  infoHighlight: 'font-semibold text-ui-700',

  /* ── Controls ── */
  controls: 'flex items-center gap-0.5 sm:gap-1',

  /* ── Buttons ── */
  btn: 'h-7 sm:h-8 min-w-[28px] sm:min-w-[32px] px-1.5 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center',
  btnDefault: 'text-ui-600 hover:bg-ui-100 active:bg-ui-200',
  btnActive: 'bg-primary text-white shadow-sm',
  btnDisabled: 'text-ui-300 cursor-not-allowed pointer-events-none',

  /* ── Page numbers ── */
  pageGap: 'px-0.5 sm:px-1 text-ui-400 text-xs sm:text-sm',
};
