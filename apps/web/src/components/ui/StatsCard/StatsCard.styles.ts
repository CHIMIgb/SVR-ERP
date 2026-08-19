export const statsCardClasses = {
  base: 'bg-white rounded-xl border border-slate-200 p-4 sm:p-5 transition-all duration-200 overflow-hidden',
  interactive: 'hover:shadow-md hover:border-slate-300 cursor-pointer',
  iconWrapper: 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
  iconVariants: {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
    neutral: 'bg-slate-100 text-slate-500',
  },
  value: 'text-xl sm:text-2xl font-black text-slate-900 mt-2 sm:mt-3 truncate',
  label: 'text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1 truncate',
  trend: {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-500 bg-slate-50',
  },
};
