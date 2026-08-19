export const paginationClasses = {
  /* ── Container ── */
  container: 'flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white rounded-b-xl',

  /* ── Info (izquierda) ── */
  info: 'text-sm text-slate-500',
  infoHighlight: 'font-semibold text-slate-700',

  /* ── Controls (derecha) ── */
  controls: 'flex items-center gap-1',

  /* ── Buttons ── */
  btn: 'h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
  btnDefault: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  btnActive: 'bg-primary text-white shadow-sm',
  btnDisabled: 'text-slate-300 cursor-not-allowed pointer-events-none',

  /* ── Page numbers ── */
  pageGap: 'px-1 text-slate-400 text-sm',
};
