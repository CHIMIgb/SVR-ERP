export const paginationClasses = {
  /* ── Container ── */
  container: 'flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 border-t border-ui-100 bg-surface rounded-b-xl gap-2 sm:gap-0',

  /* ── Info (izquierda) ── */
  info: 'text-xs sm:text-sm text-ui-500 text-center sm:text-left',
  infoHighlight: 'font-semibold text-ui-700',

  /* ── Controls (derecha) ── */
  controls: 'flex items-center gap-0.5 sm:gap-1',

  /* ── Buttons ── */
  btn: 'h-7 sm:h-8 min-w-[28px] sm:min-w-[32px] px-1.5 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center',
  btnDefault: 'text-ui-600 hover:bg-ui-100 active:bg-ui-200',
  btnActive: 'bg-primary text-white shadow-sm',
  btnDisabled: 'text-ui-300 cursor-not-allowed pointer-events-none',

  /* ── Page numbers ── */
  pageGap: 'px-0.5 sm:px-1 text-ui-400 text-xs sm:text-sm',
};
