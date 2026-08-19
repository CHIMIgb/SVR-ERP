export const modalClasses = {
  overlay:
    'fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4',
  backdrop:
    'absolute inset-0 bg-slate-900/60 backdrop-blur-sm',
  center: 'relative z-10 w-full flex items-center justify-center',
  card:
    'bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-[fadeScaleIn_0.2s_ease-out]',
  sizes: {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-lg',
    xl: 'w-full max-w-xl',
    full: 'w-full max-w-3xl',
  },
  // Header
  header:
    'flex items-start justify-between gap-3 sm:gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100',
  title: 'text-base sm:text-lg font-black text-slate-900 leading-tight',
  subtitle: 'text-xs sm:text-sm text-slate-500 mt-0.5',
  closeButton:
    'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer',
  // Body
  body: 'px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1',
  // Footer
  footer:
    'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100',
};
