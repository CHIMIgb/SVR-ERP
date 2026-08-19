export const buttonClasses = {
  base: 'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  loading: 'opacity-70 cursor-wait pointer-events-none',
  variants: {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-sm hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
    outline: 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
    success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
    info: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm',
  },
  sizes: {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-11 px-5 text-sm gap-2 rounded-xl',
    lg: 'h-13 px-7 text-base gap-2.5 rounded-xl',
  },
};
