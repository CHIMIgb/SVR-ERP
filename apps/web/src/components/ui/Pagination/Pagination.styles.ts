export const paginationClasses = {
  /* ── Container ── */
  container: 'flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 border-t border-slate-100 bg-white rounded-b-xl gap-2 sm:gap-0',

  /* ── Info (izquierda) ── */
  info: 'text-xs sm:text-sm text-slate-500 text-center sm:text-left',
  infoHighlight: 'font-semibold text-slate-700',

  /* ── Controls (derecha) ── */
  controls: 'flex items-center gap-0.5 sm:gap-1',

  /* ── Buttons ── */
  btn: 'h-7 sm:h-8 min-w-[28px] sm:min-w-[32px] px-1.5 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center',
  btnDefault: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  btnActive: 'bg-primary text-white shadow-sm',
  btnDisabled: 'text-slate-300 cursor-not-allowed pointer-events-none',

  /* ── Page numbers ── */
  pageGap: 'px-0.5 sm:px-1 text-slate-400 text-xs sm:text-sm',
};
