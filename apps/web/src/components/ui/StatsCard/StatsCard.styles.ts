export const statsCardClasses = {
  base: 'bg-surface rounded-xl border border-ui-200 p-4 sm:p-5 transition-all duration-200 overflow-hidden',
  interactive: 'hover:shadow-md hover:border-ui-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
  iconWrapper: 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
  iconVariants: {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    error: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
    neutral: 'bg-ui-100 text-ui-500',
  },
  value: 'text-xl sm:text-2xl font-black text-ui-900 mt-2 sm:mt-3 truncate',
  label: 'text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-ui-500 mt-1 truncate',
  /* Variante sin icono: etiqueta arriba, valor grande, linea de apoyo opcional. */
  plainHeader: 'flex items-start justify-between gap-2',
  plainLabel: 'min-w-0 text-xs sm:text-sm font-medium text-ui-500 truncate',
  plainValue: 'text-xl sm:text-2xl font-bold text-ui-900 mt-1.5 truncate',
  hint: 'text-[11px] sm:text-xs text-ui-400 mt-0.5 truncate',
  trend: {
    up: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
    down: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
    neutral: 'text-ui-500 bg-ui-50',
  },
};
