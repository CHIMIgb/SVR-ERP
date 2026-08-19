export const statsCardClasses = {
  base: 'bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200',
  interactive: 'hover:shadow-md hover:border-slate-300 cursor-pointer',
  iconWrapper: 'w-12 h-12 rounded-xl flex items-center justify-center',
  iconVariants: {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
    neutral: 'bg-slate-100 text-slate-500',
  },
  value: 'text-2xl font-black text-slate-900 mt-3',
  label: 'text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1',
  trend: {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-500 bg-slate-50',
  },
};
