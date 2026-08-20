export const switchClasses = {
  root: 'inline-flex items-center gap-3 cursor-pointer group',
  rootDisabled: 'cursor-not-allowed opacity-60',
  track:
    'relative shrink-0 w-11 h-6 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-slate-200',
  trackChecked: 'bg-primary',
  trackError: 'bg-red-200 border-red-200',
  trackFocus: 'group-focus-within:ring-2 group-focus-within:ring-primary/10',
  thumb:
    'pointer-events-none absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
  thumbChecked: 'translate-x-5',
  input: 'sr-only',
  label: 'text-sm font-semibold text-slate-700 select-none',
  labelDisabled: 'text-slate-400',
  error: 'text-xs font-semibold text-red-500 mt-1',
};
