export const searchBarClasses = {
  /* ── Container ── */
  container: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3',

  /* ── Search Input ── */
  searchWrapper: 'relative flex-1',
  searchIcon: 'absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
  searchInput:
    'w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-9 sm:pr-10 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200',
  searchClear:
    'absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors',

  /* ── Filter Button ── */
  filterBtn:
    'h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap',
  filterBtnActive: 'border-primary/30 bg-primary/5 text-primary',

  /* ── Filter Panel ── */
  filterPanel: 'w-full bg-slate-50 border border-slate-200 rounded-xl p-4',
  filterRow: 'flex flex-col sm:flex-row items-start sm:items-end gap-3',
  filterGroup: 'flex flex-col gap-1 w-full sm:w-auto',
  filterLabel: 'text-[10px] font-black text-slate-500 uppercase tracking-widest',
  filterSelect:
    'h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-primary/50 transition-all duration-200',
  filterDate:
    'h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-primary/50 transition-all duration-200',

  /* ── Active Filters Chips ── */
  chipContainer: 'flex flex-wrap items-center gap-2',
  chip:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold',
  chipRemove:
    'w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center cursor-pointer transition-colors',
};
