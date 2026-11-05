export const switchClasses = {
  root: 'inline-flex items-center gap-3 cursor-pointer group',
  rootDisabled: 'cursor-not-allowed opacity-60',
  track:
    'relative shrink-0 w-11 h-6 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-ui-200',
  trackChecked: 'bg-primary',
  trackError: 'bg-red-200 dark:bg-red-500/25 border-red-200 dark:border-red-500/25',
  trackFocus: 'group-focus-within:ring-2 group-focus-within:ring-primary/10',
  thumb:
    'pointer-events-none absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-surface shadow-sm transition-transform duration-200 ease-in-out',
  thumbChecked: 'translate-x-[22px]',
  input: 'sr-only',
  label: 'text-sm font-semibold text-ui-700 select-none',
  labelDisabled: 'text-ui-400',
  error: 'text-xs font-semibold text-red-500 mt-1',
};
